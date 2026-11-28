"""Análise 6 (panorama "tomada hostil", 05-panoramas §3). Dez anos de resultado: BB, os 10 maiores pares e os
sistemas cooperativos, 2016–2026.

Por ano: lucro líquido (soma dos dois semestres; o IF.data acumula no semestre: junho = jan–jun, dezembro =
jul–dez), PL médio (dez do ano anterior, jun, dez), ROE aproximado = lucro do ano ÷ PL médio, rendas de tarifas
(também semestrais), carteira de crédito, captações e ativo no fim do ano, Basileia (prudencial, dezembro). 2026 só
tem o 1º semestre: lucro e tarifas anualizados × 2, e marcados. Desde 2025 vale a Cosif nova (Res. CMN 4.966):
a coluna `cosif` marca a quebra.

Fonte: data/ifs/ifdata/values.csv (IF.data/BCB, conglomerado financeiro 1005; Basileia no prudencial) e, para o
total do sistema, a base local (soma de todas as entidades do nível 1005). Rodar:
    python estrategia/bb/analises/a6_resultado_10anos.py
"""

import csv
import sys

sys.dont_write_bytecode = True
import _comum as c  # noqa: E402

PEERS = ["itau", "caixa", "bradesco", "santander", "bndes", "btg", "nubank", "xp", "safra", "banrisul"]
SYSTEMS = ["sicoob", "sicredi"]
WHO = ["bb"] + PEERS + SYSTEMS
METRICS = ["lucro_liquido", "patrimonio_liquido", "carteira_credito", "captacoes", "rendas_tarifas", "ativo_total"]


def load():
    v = {}
    with open(c.IFS / "ifdata" / "values.csv", encoding="utf-8") as fh:
        for r in csv.DictReader(fh):
            if r["inst_id"] not in WHO:
                continue
            if r["series"] == "financeiro" and r["metric"] in METRICS:
                v[(int(r["period"]), r["inst_id"], r["metric"])] = float(r["value"])
            elif r["series"] == "prudencial" and r["metric"] == "indice_basileia":
                v[(int(r["period"]), r["inst_id"], "basileia")] = float(r["value"])
    con = c.db()
    for p, m, t in con.execute("SELECT period, metric, SUM(value) FROM ifdata_values WHERE level=1005 AND metric IN "
                               "(%s) GROUP BY 1, 2" % ",".join("?" * len(METRICS)), METRICS):
        v[(p, "_sistema", m)] = t
    return v


def yearly(v):
    rows = []
    for y in range(2016, 2027):
        h1, h2, prev = y * 100 + 6, y * 100 + 12, (y - 1) * 100 + 12
        end = h2 if y < 2026 else h1
        for i in WHO + ["_sistema"]:
            g = lambda p, m: v.get((p, i, m))  # noqa: E731
            if g(end, "ativo_total") is None:
                continue
            if y < 2026:
                l1, l2 = g(h1, "lucro_liquido"), g(h2, "lucro_liquido")
                lucro = l1 + l2 if l1 is not None and l2 is not None else None
                t1, t2 = g(h1, "rendas_tarifas"), g(h2, "rendas_tarifas")
                tar = t1 + t2 if t1 is not None and t2 is not None else None
                pls = [x for x in (g(prev, "patrimonio_liquido"), g(h1, "patrimonio_liquido"),
                                   g(h2, "patrimonio_liquido")) if x]
            else:  # 1º semestre anualizado
                lucro = 2 * g(h1, "lucro_liquido") if g(h1, "lucro_liquido") is not None else None
                tar = 2 * g(h1, "rendas_tarifas") if g(h1, "rendas_tarifas") is not None else None
                pls = [x for x in (g(prev, "patrimonio_liquido"), g(h1, "patrimonio_liquido")) if x]
            pl = sum(pls) / len(pls) if pls else None
            rows.append({
                "ano": y, "periodo": "1S2026 anualizado" if y == 2026 else "ano", "inst_id": i,
                "cosif": "cosif2025" if y >= 2025 else "cosif_antigo",
                "lucro_bi": round(lucro / 1e9, 2) if lucro is not None else "",
                "pl_medio_bi": round(pl / 1e9, 1) if pl else "",
                "roe_pct": round(100 * lucro / pl, 1) if lucro is not None and pl else "",
                "tarifas_bi": round(tar / 1e9, 2) if tar is not None else "",
                "carteira_bi": round(g(end, "carteira_credito") / 1e9, 1) if g(end, "carteira_credito") else "",
                "captacoes_bi": round(g(end, "captacoes") / 1e9, 1) if g(end, "captacoes") else "",
                "ativo_bi": round(g(end, "ativo_total") / 1e9, 1),
                # nos sistemas a soma de índices das cooperativas não faz sentido: fica vazio
                "basileia_pct": round(100 * g(end, "basileia"), 1) if g(end, "basileia") and i not in SYSTEMS else "",
                "pl_sobre_ativo_pct": round(100 * g(end, "patrimonio_liquido") / g(end, "ativo_total"), 1)
                if g(end, "patrimonio_liquido") else ""})
    # rankings dentro do grupo (sem o sistema)
    for y in range(2016, 2027):
        grp = [r for r in rows if r["ano"] == y and r["inst_id"] != "_sistema"]
        for key in ("lucro_bi", "roe_pct", "carteira_bi", "captacoes_bi", "tarifas_bi"):
            ok = sorted((r for r in grp if r[key] != ""), key=lambda r: -r[key])
            for k, r in enumerate(ok, 1):
                r[f"rank_{key.split('_')[0]}"] = k
    return rows


def bb_summary(rows):
    out = []
    for y in range(2016, 2027):
        d = {r["inst_id"]: r for r in rows if r["ano"] == y}
        bb = d.get("bb")
        if not bb:
            continue
        roes = sorted(r["roe_pct"] for i, r in d.items() if i in PEERS[:4] + ["btg"] and r["roe_pct"] != "")
        priv = [d[i]["roe_pct"] for i in ("itau", "bradesco", "santander") if i in d and d[i]["roe_pct"] != ""]
        lucro_grp = sum(r["lucro_bi"] for i, r in d.items() if i != "_sistema" and r["lucro_bi"] != "")
        out.append({"ano": bb["ano"], "periodo": bb["periodo"], "cosif": bb["cosif"], "bb_lucro_bi": bb["lucro_bi"],
                    "bb_roe_pct": bb["roe_pct"], "bb_rank_lucro": bb.get("rank_lucro"),
                    "bb_rank_roe": bb.get("rank_roe"), "de_quantos": len([r for i, r in d.items() if i != "_sistema"]),
                    "roe_medio_privados_pct": round(sum(priv) / len(priv), 1) if priv else "",
                    "bb_menos_privados_pp": round(bb["roe_pct"] - sum(priv) / len(priv), 1) if priv and bb["roe_pct"] != "" else "",
                    "roe_sistema_pct": d["_sistema"]["roe_pct"] if "_sistema" in d else "",
                    "bb_parte_do_lucro_do_grupo_pct": round(100 * bb["lucro_bi"] / lucro_grp, 1) if lucro_grp else "",
                    "bb_tarifas_bi": bb["tarifas_bi"], "bb_carteira_bi": bb["carteira_bi"],
                    "bb_basileia_pct": bb["basileia_pct"], "roes_5_grandes": "; ".join(str(x) for x in roes)})
    return out


def main():
    rows = yearly(load())
    c.write_csv("a6_resultado_por_ano.csv", rows)
    c.write_csv("a6_bb_resumo.csv", bb_summary(rows))


if __name__ == "__main__":
    main()
