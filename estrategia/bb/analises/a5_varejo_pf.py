"""Análise 5. Varejo PF: volume, risco e o pouco de preço que o dado público da camada já permite.

(a) Participação e crescimento por modalidade PF (consignado, não consignado, cartão, habitação, veículos), quem
    ganhou, em três janelas.
(b) Risco: vencido a partir de 15 dias ÷ carteira, por instituição e modalidade (IF.data).
(c) Preço e margem, só no nível da instituição (todas as carteiras juntas): rendas de crédito ÷ carteira média,
    despesa de provisão ÷ carteira média, custo implícito de captação (Análise 4). Não há taxa por modalidade.
(d) Portabilidade do crédito pessoal (fev/2026): variação da participação do BB no não consignado menos a do
    cartão (controle), de dez a jun, comparada com a mesma janela dos anos anteriores.

Fontes: data/ifs/shares/national_ifdata.csv e o JSON do IF.data em cache (carteira PF por modalidade e DRE).
Rodar:
    python estrategia/bb/analises/a5_varejo_pf.py
"""

import sys

sys.dont_write_bytecode = True  # não grava .pyc em src/ (a camada de dados é só leitura)
import _comum as c  # noqa: E402
import taxajuros  # noqa: E402

PRODUCTS = ["pf_consignado", "pf_nao_consignado", "pf_cartao", "pf_habitacao", "pf_veiculos", "pf_total"]
LABEL = {"pf_consignado": "Empréstimo com Consignação em Folha", "pf_nao_consignado": "Empréstimo sem Consignação em Folha",
         "pf_cartao": "Cartão de Crédito", "pf_habitacao": "Habitação", "pf_veiculos": "Veículos"}
WINDOWS = [(201603, 201912), (201912, 202312), (202312, 202606), (201603, 202606)]
WHO = ["bb", "caixa", "itau", "bradesco", "santander", "nubank", "mercado-pago", "c6", "inter", "picpay", "btg",
       "agibank", "sicredi", "sicoob"]
DELINQ = [{"id": f"v15_{m}", "report": "Pessoa F.sica - modalidade", "column": f"^{LABEL[m]} > Vencido a Partir de 15 Dias$"}
          for m in LABEL]
DRE = [{"id": "rendas_credito", "report": "Demonstração de Resultado",
        "column": r"Rendas de Operações de Crédito  \(a1\)|Receita de Juros com Operações de Crédito  \(c1\)"},
       {"id": "provisao", "report": "Demonstração de Resultado",
        "column": r"Provisão para Créditos de Difícil Liquidação  \(b5\)|Perda Esperada de Operações de Crédito  \(f3\)"}]


def cagr(a, b, years):
    return round(100 * ((b / a) ** (1 / years) - 1), 1) if a and b and a > 0 else ""


def volume(nat, names):
    rows = []
    for m in PRODUCTS:
        for a, b in WINDOWS:
            da, db_ = nat[(a, m)], nat[(b, m)]
            yrs = (b // 100 - a // 100) + (b % 100 - a % 100) / 12
            sa, sb = c.shares(da), c.shares(db_)
            gains = sorted(((sb.get(i, 0) - sa.get(i, 0), i) for i in set(sa) | set(sb)
                            if i not in ("bb", "_demais")), reverse=True)[:4]
            rows.append({"produto": m, "janela": f"{c.fmt_period(a)}-{c.fmt_period(b)}",
                         "sistema_fim_bi": round(db_["total"] / 1e9, 1),
                         "cresc_anual_sistema_pct": cagr(da["total"], db_["total"], yrs),
                         "cresc_anual_bb_pct": cagr(da["v"].get("bb"), db_["v"].get("bb"), yrs),
                         "bb_base_pct": c.pp(sa.get("bb", 0)), "bb_fim_pct": c.pp(sb.get("bb", 0)),
                         "bb_delta_pp": c.pp(sb.get("bb", 0) - sa.get("bb", 0)),
                         "rank_bb_fim": 1 + sum(1 for i, s in sb.items() if s > sb.get("bb", 0) and i != "_demais"),
                         "ganhadores": "; ".join(f"{names.get(i, i)} {c.pp(d):+.1f}" for d, i in gains)})
    return rows


def delinquency(nat, ext, names):
    rows = []
    periods = sorted({p for p, m in ext if m.startswith("v15_")})
    for p in periods:
        for m in LABEL:
            d, v = nat.get((p, m)), ext.get((p, f"v15_{m}"))
            if not d or not v:
                continue
            r = {"period": p, "produto": m, "nivel": v["level"],
                 "sistema_pct": round(100 * v["total"] / d["total"], 2)}
            for i in WHO:
                if d["v"].get(i, 0) > 0.002 * d["total"]:  # só quem tem pelo menos 0,2% do produto
                    r[i] = round(100 * v["v"].get(i, 0) / d["v"][i], 2)
            rows.append(r)
    return rows


def margins(ext, nat):
    """Por semestre fechado e instituição: rendas de crédito e provisão ÷ carteira média (anualizado)."""
    rows = []
    for p in sorted({p for p, m in ext if m == "rendas_credito"}):
        if p % 100 not in (6, 12):
            continue
        prev = [p - 6 if p % 100 == 12 else p - 100 + 6, p - 3, p]
        if any((q, "carteira_credito") not in nat for q in prev):
            continue
        for i in WHO + ["_sistema"]:
            def cart(q):
                d = nat[(q, "carteira_credito")]
                return d["total"] if i == "_sistema" else d["v"].get(i, 0)
            avg = sum(cart(q) for q in prev) / 3
            if avg <= 0:
                continue
            def flow(m):
                d = ext.get((p, m))
                return None if not d else d["total"] if i == "_sistema" else d["v"].get(i, 0)
            ren, prov = flow("rendas_credito"), flow("provisao")
            rows.append({"period": p, "inst_id": i, "cosif": "cosif2025" if p >= 202503 else "cosif_antigo",
                         "carteira_media_bi": round(avg / 1e9, 1),
                         "rendas_credito_pct_aa": round(100 * 2 * ren / avg, 2) if ren else "",
                         "provisao_pct_aa": round(100 * 2 * -prov / avg, 2) if prov else "",
                         "rendas_menos_provisao_pct_aa": round(100 * 2 * (ren + prov) / avg, 2) if ren and prov else ""})
    return rows


def portability(nat):
    """Δ participação do BB (não consignado − cartão), dez → jun de cada ano. 2026 é o único ano depois da regra."""
    rows = []
    for y in range(2016, 2026):
        a, b = y * 100 + 12, (y + 1) * 100 + 6
        if (a, "pf_nao_consignado") not in nat or (b, "pf_nao_consignado") not in nat:
            continue
        s = {(p, m): c.shares(nat[(p, m)]).get("bb", 0) for p in (a, b) for m in ("pf_nao_consignado", "pf_cartao")}
        dn = 100 * (s[(b, "pf_nao_consignado")] - s[(a, "pf_nao_consignado")])
        dc = 100 * (s[(b, "pf_cartao")] - s[(a, "pf_cartao")])
        rows.append({"janela": f"12/{y}-06/{y + 1}", "pos_portabilidade": y + 1 == 2026,
                     "delta_bb_nao_consignado_pp": round(dn, 2), "delta_bb_cartao_pp": round(dc, 2),
                     "diferenca_pp": round(dn - dc, 2), "cruza_202412": a <= 202412 < b})
    return rows


# ---------- preço: taxas por instituição e modalidade (BCB taxaJuros/v2) ----------

RATE_PRODUCTS = {  # nome: (códigos de modalidade, segmento)
    "nao_consignado": (["221101"], "Pessoa Física"), "consig_inss": (["218101"], "Pessoa Física"),
    "consig_publico": (["220101"], "Pessoa Física"), "consig_privado": (["219101"], "Pessoa Física"),
    "cartao_rotativo": (["204101"], "Pessoa Física"), "cartao_parcelado": (["215101"], "Pessoa Física"),
    "veiculos": (["401101"], "Pessoa Física"), "cheque_especial_pf": (["216101"], "Pessoa Física"),
    "capital_giro_ate_365d": (["210101"], "Pessoa Jurídica"), "capital_giro_mais_365d": (["211101"], "Pessoa Jurídica"),
}
RATE_WHO = ["bb", "caixa", "itau", "bradesco", "santander", "nubank", "mercado-pago", "c6", "inter", "picpay",
            "sicoob", "sicredi", "agibank", "btg"]
PRICE_SHARE = {  # métrica de participação do IF.data ← produtos de taxa (gap médio contra a mediana de cada um)
    "pf_nao_consignado": ["nao_consignado"], "pf_consignado": ["consig_inss", "consig_publico", "consig_privado"],
    "pf_cartao": ["cartao_rotativo", "cartao_parcelado"], "pf_veiculos": ["veiculos"],
    "pj_capital_giro": ["capital_giro_ate_365d", "capital_giro_mais_365d"],
}


def median(xs):
    xs = sorted(xs)
    n = len(xs)
    return (xs[n // 2] if n % 2 else (xs[n // 2 - 1] + xs[n // 2]) / 2) if n else None


def quantile(xs, q):
    xs = sorted(xs)
    return xs[min(len(xs) - 1, int(q * (len(xs) - 1) + 0.5))] if xs else None


def rate_panel(rows, reg):
    """{(produto, AAAAMM): {"all": [taxa de cada instituição individual], "inst": {inst_id: taxa média dos membros}}}.
    Instituição do cadastro = CNPJ-base do líder ou de um membro (registry.json)."""
    m8 = {}
    for i in reg["institutions"]:
        for x in [i["leader_cnpj8"]] + [m["cnpj8"] for m in i.get("members", [])]:
            m8.setdefault(x, i["id"])
    code = {(cd, seg): prod for prod, (cds, seg) in RATE_PRODUCTS.items() for cd in cds}
    acc = {}
    for r in rows:
        prod = code.get((r["codigo"], r["segmento"]))
        if not prod:
            continue
        d = acc.setdefault((prod, r["mes"]), {"all": [], "inst": {}})
        d["all"].append(r["taxa_aa"])
        if r["cnpj8"] in m8:
            d["inst"].setdefault(m8[r["cnpj8"]], []).append(r["taxa_aa"])
    for d in acc.values():
        d["inst"] = {i: sum(v) / len(v) for i, v in d["inst"].items()}
    return acc


def rates_by_year(panel):
    out = []
    for prod in RATE_PRODUCTS:
        for y in range(2016, 2027):
            months = [d for (p, m), d in panel.items() if p == prod and m // 100 == y]
            if not months:
                continue
            r = {"produto": prod, "ano": y, "meses": len(months),
                 "n_instituicoes_media": round(sum(len(d["all"]) for d in months) / len(months), 1),
                 "mediana_sistema": round(sum(median(d["all"]) for d in months) / len(months), 1),
                 "p25": round(sum(quantile(d["all"], 0.25) for d in months) / len(months), 1),
                 "p75": round(sum(quantile(d["all"], 0.75) for d in months) / len(months), 1)}
            for i in RATE_WHO:
                v = [d["inst"][i] for d in months if i in d["inst"]]
                if len(v) >= len(months) / 2:
                    r[i] = round(sum(v) / len(v), 1)
            # posição do BB: fração das instituições com taxa menor que a dele (0 = a mais barata)
            pos = [sum(1 for x in d["all"] if x < d["inst"]["bb"]) / len(d["all"]) for d in months if "bb" in d["inst"]]
            if pos:
                r["bb_percentil"] = round(100 * sum(pos) / len(pos))
            out.append(r)
    return out


def spearman(xs, ys):
    def rk(v):
        o = sorted(range(len(v)), key=lambda i: v[i])
        r = [0.0] * len(v)
        i = 0
        while i < len(o):
            j = i
            while j + 1 < len(o) and v[o[j + 1]] == v[o[i]]:
                j += 1
            for k in range(i, j + 1):
                r[o[k]] = (i + j) / 2
            i = j + 1
        return r
    a, b = rk(xs), rk(ys)
    n = len(a)
    ma, mb = sum(a) / n, sum(b) / n
    cov = sum((x - ma) * (y - mb) for x, y in zip(a, b))
    va, vb = sum((x - ma) ** 2 for x in a) ** 0.5, sum((y - mb) ** 2 for y in b) ** 0.5
    return round(cov / (va * vb), 2) if va and vb else None


def price_vs_share(panel, nat, names):
    """Por produto e janela: gap médio de taxa (instituição − mediana do mês, p.p. a.a.) × Δ participação (p.p.)."""
    rows, summary = [], []
    for metric, prods in PRICE_SHARE.items():
        for a, b in ((201912, 202312), (202312, 202606)):
            if (a, metric) not in nat or (b, metric) not in nat:
                continue
            sa, sb = c.shares(nat[(a, metric)]), c.shares(nat[(b, metric)])
            pts = []
            for i in set(sa) | set(sb):
                if i in ("_demais", "_outras_coops"):
                    continue
                gaps = []
                for (p, m), d in panel.items():
                    if p in prods and a < m <= b and i in d["inst"]:
                        gaps.append(d["inst"][i] - median(d["all"]))
                if len(gaps) < 6:
                    continue
                g, dp = sum(gaps) / len(gaps), 100 * (sb.get(i, 0) - sa.get(i, 0))
                pts.append((i, g, dp))
                rows.append({"metric": metric, "janela": f"{c.fmt_period(a)}-{c.fmt_period(b)}", "inst_id": i,
                             "nome": names.get(i, i), "gap_taxa_vs_mediana_pp_aa": round(g, 1), "meses": len(gaps),
                             "share_ini_pct": c.pp(sa.get(i, 0)), "share_fim_pct": c.pp(sb.get(i, 0)),
                             "delta_share_pp": round(dp, 2)})
            if len(pts) >= 5:
                bb = next((x for x in pts if x[0] == "bb"), None)
                summary.append({"metric": metric, "janela": f"{c.fmt_period(a)}-{c.fmt_period(b)}",
                                "instituicoes": len(pts), "spearman_gap_x_delta_share": spearman(
                                    [x[1] for x in pts], [x[2] for x in pts]),
                                "bb_gap_pp_aa": round(bb[1], 1) if bb else "", "bb_delta_share_pp": round(bb[2], 2) if bb else ""})
    return rows, summary


def main():
    names = c.names()
    con = c.db()
    nat = c.split_other_coops(c.load_national(set(PRODUCTS) | {"carteira_credito"}), con)
    periods = sorted({p for p, m in nat if m == "pf_total"})
    c.write_csv("a5_volume_e_ganhadores.csv", volume(nat, names))
    ext = c.extract_extra(DELINQ, periods, c.credit_level, con)
    c.write_csv("a5_vencidos_15d.csv", delinquency(nat, ext, names))
    dre = c.extract_extra(DRE, periods, lambda p: 1005, con)
    c.write_csv("a5_rendas_e_provisao.csv", margins(dre, nat))
    c.write_csv("a5_portabilidade.csv", portability(nat))
    nat.update(c.load_national({"pj_capital_giro"}))
    panel = rate_panel(taxajuros.load(), c.registry())
    c.write_csv("a5_taxas_por_ano.csv", rates_by_year(panel))
    pts, summ = price_vs_share(panel, nat, names)
    c.write_csv("a5_preco_x_participacao.csv", pts)
    c.write_csv("a5_preco_x_participacao_resumo.csv", summ)


if __name__ == "__main__":
    main()
