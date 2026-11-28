"""Análise 4. O passivo: participação do BB por instrumento e custo implícito de captação.

(a) Participação por instrumento de captação, por instituição e grupo, em três janelas, e quem ganhou.
(b) Custo implícito = despesa de captação do semestre (anualizada) ÷ saldo médio das captações que geram essa
    despesa (depósitos + compromissadas + títulos emitidos), por instituição, nos semestres fechados (jun e dez).
(c) Diferencial do BB frente aos pares (Itaú, Bradesco, Santander, Caixa) e ao sistema.
(d) Variação trimestral da participação do BB nos depósitos em torno de dois episódios de estresse.
(e) Custo implícito em % do CDI (SGS 4391, baixado para raw/) por semestre e por ano, e a regra de P22
    (piora de 3 p.p. do CDI em 5 anos), com a Cosif 2025 como janela separada.

Fontes: data/ifs/shares/national_ifdata.csv (participação) e o JSON do IF.data em cache (Passivo e DRE do
conglomerado financeiro, nível 1005), lido com as funções da camada de dados. Rodar:
    python estrategia/bb/analises/a4_passivo.py
"""

import sys

sys.dont_write_bytecode = True  # não grava .pyc em src/ (a camada de dados é só leitura)
import _comum as c  # noqa: E402
from _comum import cdi_compound  # noqa: E402

INSTR = ["depositos_vista", "depositos_poupanca", "depositos_prazo", "lca", "lci", "depositos_total", "captacoes"]
WINDOWS = [(201603, 201912), (201912, 202312), (202312, 202606), (201603, 202606)]
PEERS = ["itau", "bradesco", "santander", "caixa"]
PRIVATE = ["itau", "bradesco", "santander"]  # pares sem a Caixa (a série da Caixa salta na Cosif 2025)
EXTRA = [
    {"id": "dep_interfinanceiros", "report": "^Passivo", "column": r"Depósitos Interfinanceiros  \(a3\)"},
    {"id": "compromissadas", "report": "^Passivo", "column": r"Compromissadas  \(b\)"},
    {"id": "titulos", "report": "^Passivo", "column": r"(Recursos de Aceites e Emissão de Títulos|Outros Instrumentos de Dívida)  \(c\)$"},
    {"id": "letras_financeiras", "report": "^Passivo", "column": r"Letras Financeiras  \(c3\)"},
    {"id": "repasses", "report": "^Passivo", "column": r"Empréstimos e Repasses  \(d\)"},
    {"id": "depositos_a", "report": "^Passivo", "column": r"(Depósito Total|Depósitos)  \(a\)$"},
    # despesa de captação: (b1) até 2024; desde 2025 a Cosif nova separa juros (g1) de variação cambial e hedge
    {"id": "desp_captacao", "report": "Demonstração de Resultado",
     "column": r"Despesas de Captação  \(b1\)|Despesa de Juros com Captações  \(g1\)"},
    {"id": "desp_captacao_total_g", "report": "Demonstração de Resultado", "column": r"Despesas de Captações  \(g\)$"},
]


def share_windows(nat, names):
    rows = []
    for m in INSTR + [e["id"] for e in EXTRA if not e["id"].startswith("desp")]:
        for a, b in WINDOWS:
            da, db_ = nat.get((a, m)), nat.get((b, m))
            if not da or not db_:
                continue
            sa, sb = c.shares(da), c.shares(db_)
            ga, gb = c.group_shares(da), c.group_shares(db_)
            gains = sorted(((sb.get(i, 0) - sa.get(i, 0), i) for i in set(sa) | set(sb)
                            if i not in ("bb", "_demais")), reverse=True)[:3]
            r = {"instrumento": m, "janela": f"{c.fmt_period(a)}-{c.fmt_period(b)}",
                 "sistema_fim_bi": round(db_["total"] / 1e9, 1),
                 "crescimento_sistema_pct": round(100 * (db_["total"] / da["total"] - 1), 1),
                 "bb_saldo_fim_bi": round(db_["v"].get("bb", 0) / 1e9, 1),
                 "crescimento_bb_pct": round(100 * (db_["v"].get("bb", 0) / da["v"]["bb"] - 1), 1)
                 if da["v"].get("bb") else "",
                 "bb_base_pct": c.pp(sa.get("bb", 0)), "bb_fim_pct": c.pp(sb.get("bb", 0)),
                 "bb_delta_pp": c.pp(sb.get("bb", 0) - sa.get("bb", 0))}
            for g in c.GROUP_ORDER[1:]:
                r[f"d_{g}"] = c.pp(gb.get(g, 0) - ga.get(g, 0))
            r["top3_ganhadores"] = "; ".join(f"{names.get(i, i)} {c.pp(d):+.1f}" for d, i in gains)
            rows.append(r)
    return rows


def series(nat, metrics):
    periods = sorted({p for p, m in nat if m in metrics})
    rows = []
    for p in periods:
        r = {"period": p}
        for m in metrics:
            d = nat.get((p, m))
            if d:
                r[f"bb_{m}_pct"] = c.pp(c.shares(d).get("bb", 0))
        rows.append(r)
    return rows


def implied_cost(ext, nat):
    """Custo implícito anualizado por semestre fechado. Saldo médio = média de 3 fins de trimestre."""
    periods = sorted({p for p, m in ext if m == "desp_captacao"})
    whos = ["bb"] + PEERS + ["_sistema", "_pares", "_privados"]
    group = {"_pares": PEERS, "_privados": PRIVATE}
    rows = []

    def bal(p, who):
        tot = 0.0
        for m in ("depositos_a", "compromissadas", "titulos"):
            d = ext.get((p, m))
            if not d:
                return None
            if who == "_sistema":
                tot += d["total"]
            elif who in group:
                tot += sum(d["v"].get(i, 0) for i in group[who])
            else:
                tot += d["v"].get(who, 0)
        return tot

    def val(p, m, who):
        d = ext.get((p, m))
        if not d:
            return None
        return d["total"] if who == "_sistema" else sum(d["v"].get(i, 0) for i in group[who]) if who in group \
            else d["v"].get(who, 0)

    for p in periods:
        if p % 100 not in (6, 12):
            continue
        prev = [p - 6 if p % 100 == 12 else p - 100 + 6, p - 3, p]  # fim do semestre anterior, meio, fim
        r = {"period": p, "cosif": "cosif2025" if p >= 202503 else "cosif_antigo"}
        for who in whos:
            bs = [bal(q, who) for q in prev]
            exp = val(p, "desp_captacao", who)
            if exp is None or any(b is None or b <= 0 for b in bs):
                continue
            avg = sum(bs) / 3
            r[f"custo_{who}_pct_aa"] = round(100 * 2 * -exp / avg, 2)
            if who in ("bb", "_pares", "_sistema"):
                vista = sum(val(q, "depositos_vista_bal", who) or 0 for q in prev) / 3
                r[f"vista_sobre_captacoes_{who}_pct"] = round(100 * vista / avg, 1)
        if "custo_bb_pct_aa" in r and "custo__pares_pct_aa" in r:
            r["bb_menos_pares_pp"] = round(r["custo_bb_pct_aa"] - r["custo__pares_pct_aa"], 2)
            r["bb_sobre_pares"] = round(r["custo_bb_pct_aa"] / r["custo__pares_pct_aa"], 3)
        if "custo_bb_pct_aa" in r and "custo__privados_pct_aa" in r:
            r["bb_sobre_privados"] = round(r["custo_bb_pct_aa"] / r["custo__privados_pct_aa"], 3)
        if "custo_bb_pct_aa" in r and "custo__sistema_pct_aa" in r:
            r["bb_sobre_sistema"] = round(r["custo_bb_pct_aa"] / r["custo__sistema_pct_aa"], 3)
        rows.append(r)
    return rows


GROUPS_COST = {"_pares": PEERS, "_privados": PRIVATE}


def _bal(ext, p, who):
    """Depósitos + compromissadas + títulos emitidos, num fim de trimestre."""
    tot = 0.0
    for m in ("depositos_a", "compromissadas", "titulos"):
        d = ext.get((p, m))
        if not d:
            return None
        tot += d["total"] if who == "_sistema" else sum(d["v"].get(i, 0) for i in GROUPS_COST.get(who, [who]))
    return tot


def _exp(ext, p, who):
    d = ext.get((p, "desp_captacao"))
    if not d:
        return None
    return d["total"] if who == "_sistema" else sum(d["v"].get(i, 0) for i in GROUPS_COST.get(who, [who]))


def cost_vs_cdi(ext, cdi):
    """Custo implícito em % do CDI e diferencial em p.p. do CDI, por semestre e por ano.
    Semestre: despesa do semestre ÷ saldo médio (3 fins de trimestre) ÷ CDI composto dos 6 meses.
    Ano: despesa de jan–jun + jul–dez ÷ saldo médio (5 fins de trimestre) ÷ CDI composto dos 12 meses.
    2025 em diante é a Cosif nova (linha g1): janela separada, não emendada com a antiga."""
    whos = ["bb"] + PEERS + ["_pares", "_privados", "_sistema"]
    sem, year = [], []
    for p in sorted({p for p, m in ext if m == "desp_captacao" and p % 100 in (6, 12)}):
        y, h = p // 100, p % 100
        q = [(y - 1) * 100 + 12, y * 100 + 3, y * 100 + 6] if h == 6 else [y * 100 + 6, y * 100 + 9, y * 100 + 12]
        k = cdi_compound(cdi, y * 100 + (1 if h == 6 else 7), p)
        if not k:
            continue
        r = {"semestre": f"{'1' if h == 6 else '2'}S{y}", "cosif": "cosif2025" if p >= 202503 else "cosif_antigo",
             "cdi_semestre_pct": round(100 * k, 3)}
        for who in whos:
            bs, e = [_bal(ext, x, who) for x in q], _exp(ext, p, who)
            if e is None or any(b is None or b <= 0 for b in bs):
                continue
            r[f"{who}_pct_cdi"] = round(100 * (-e / (sum(bs) / 3)) / k, 1)
        if "bb_pct_cdi" in r:
            r["bb_menos_pares_pp_cdi"] = round(r["bb_pct_cdi"] - r.get("_pares_pct_cdi", float("nan")), 1)
            r["bb_menos_privados_pp_cdi"] = round(r["bb_pct_cdi"] - r.get("_privados_pct_cdi", float("nan")), 1)
        sem.append(r)
    for y in range(2016, 2027):
        last = y * 100 + (6 if y == 2026 else 12)
        q = [(y - 1) * 100 + 12, y * 100 + 3, y * 100 + 6] + ([] if y == 2026 else [y * 100 + 9, y * 100 + 12])
        periods = [y * 100 + 6] + ([] if y == 2026 else [y * 100 + 12])
        k = cdi_compound(cdi, y * 100 + 1, last)
        r = {"ano": y if y < 2026 else "2026 (1º semestre)", "cosif": "cosif2025" if y >= 2025 else "cosif_antigo",
             "cdi_periodo_pct": round(100 * k, 2) if k else ""}
        for who in whos:
            bs, es = [_bal(ext, x, who) for x in q], [_exp(ext, x, who) for x in periods]
            if not k or any(e is None for e in es) or any(b is None or b <= 0 for b in bs):
                continue
            cost = -sum(es) / (sum(bs) / len(bs))
            r[f"{who}_custo_pct"] = round(100 * cost, 2)
            r[f"{who}_pct_cdi"] = round(100 * cost / k, 1)
        if "bb_pct_cdi" in r and "_pares_pct_cdi" in r:
            r["bb_menos_pares_pp_cdi"] = round(r["bb_pct_cdi"] - r["_pares_pct_cdi"], 1)
            r["bb_menos_privados_pp_cdi"] = round(r["bb_pct_cdi"] - r["_privados_pct_cdi"], 1)
        year.append(r)
    return sem, year


def p22_rule(year):
    """Regra de P22: o diferencial BB − pares (p.p. do CDI) piora pelo menos 3 p.p. em 5 anos.
    Calculado dentro de cada regime contábil; nunca atravessa 2024 → 2025."""
    d = {r["ano"]: r for r in year if "bb_menos_pares_pp_cdi" in r}
    out = []
    for a, b in ((2016, 2021), (2017, 2022), (2018, 2023), (2019, 2024)):
        if a in d and b in d:
            for ref in ("pares", "privados"):
                k = f"bb_menos_{ref}_pp_cdi"
                out.append({"de": a, "para": b, "referencia": ref, "diferencial_ini_pp_cdi": d[a][k],
                            "diferencial_fim_pp_cdi": d[b][k], "piora_pp_cdi": round(d[b][k] - d[a][k], 1),
                            "regra_3pp_atingida": d[b][k] - d[a][k] >= 3})
    # pontas isoladas oscilam muito; a média de três anos em cada ponta é mais robusta
    for ref in ("pares", "privados"):
        k = f"bb_menos_{ref}_pp_cdi"
        ini = [d[y][k] for y in (2017, 2018, 2019) if y in d]
        fim = [d[y][k] for y in (2022, 2023, 2024) if y in d]
        if ini and fim:
            a, b = sum(ini) / len(ini), sum(fim) / len(fim)
            out.append({"de": "média 2017-2019", "para": "média 2022-2024", "referencia": ref,
                        "diferencial_ini_pp_cdi": round(a, 1), "diferencial_fim_pp_cdi": round(b, 1),
                        "piora_pp_cdi": round(b - a, 1), "regra_3pp_atingida": b - a >= 3})
    return out


def stress(nat):
    """Variação trimestral da participação do BB em torno de episódios de estresse, contra a variação típica."""
    out = []
    for m in ("depositos_total", "depositos_prazo", "depositos_vista", "depositos_poupanca", "lca"):
        ps = sorted(p for p, mm in nat if mm == m)
        sh = {p: c.shares(nat[(p, m)]).get("bb", 0) for p in ps}
        deltas = [100 * (sh[b] - sh[a]) for a, b in zip(ps, ps[1:]) if b not in c.ANOMALOUS and a not in c.ANOMALOUS]
        sd = (sum(d * d for d in deltas) / len(deltas) - (sum(deltas) / len(deltas)) ** 2) ** 0.5
        for label, a, b in (("COVID (12/2019 -> 06/2020)", 201912, 202006),
                            ("liquidação do Banco Master (09/2025 -> 03/2026)", 202509, 202603)):
            out.append({"instrumento": m, "episodio": label, "bb_ini_pct": c.pp(sh[a]), "bb_fim_pct": c.pp(sh[b]),
                        "delta_pp": round(100 * (sh[b] - sh[a]), 2),
                        "desvio_padrao_trimestral_pp": round(sd, 2)})
    return out


def main():
    names = c.names()
    con = c.db()
    nat = c.split_other_coops(c.load_national(set(INSTR)), con)
    periods = sorted({p for p, _ in nat})
    ext = c.extract_extra(EXTRA + [{"id": "depositos_vista_bal", "report": "^Passivo",
                                    "column": r"Depósitos à Vista  \(a1\)"}], periods, lambda p: 1005, con)
    nat.update({k: v for k, v in ext.items() if not k[1].startswith("desp") and k[1] != "depositos_vista_bal"})
    c.write_csv("a4_quem_ganhou_passivo.csv", share_windows(nat, names))
    c.write_csv("a4_serie_participacao_bb.csv", series(nat, INSTR + ["compromissadas", "letras_financeiras"]))
    c.write_csv("a4_custo_implicito.csv", implied_cost(ext, nat))
    c.write_csv("a4_estresse.csv", stress(nat))
    sem, year = cost_vs_cdi(ext, c.cdi_monthly())
    c.write_csv("a4_custo_cdi_semestre.csv", sem)
    c.write_csv("a4_custo_cdi_ano.csv", year)
    c.write_csv("a4_regra_p22.csv", p22_rule(year))


if __name__ == "__main__":
    main()
