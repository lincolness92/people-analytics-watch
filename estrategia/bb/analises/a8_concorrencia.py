"""Análise 8 (panorama "tomada hostil", 05-panoramas §3). Diagnóstico de concorrência por mercado, 2016–2026.

(1) Concentração: HHI e CR4 por produto (modalidades de crédito e instrumentos de captação do IF.data), nacional,
    por região do tomador (IF.data reg_*) e por UF (ESTBAN: só bancos com agência). Duas definições de unidade:
    "concorrente" (instituições do cadastro, com Sicredi e Sicoob como sistemas) e "entidade" (cada código do nível
    do IF.data, como o BCB faz). Faixas do BCB (IHHn 0,10 e 0,18) e do CADE (1.500 e 2.500).
(2) Poder de mercado: Lerner por instituição e ano, com custo marginal de uma translog estimada no painel do IF.data
    (conglomerado financeiro 1005), por segmento (bancos b1+b2, cooperativas b3, não bancários n1+n4); Boone por ano.
    Conferência contra o GFDD do Banco Mundial (Lerner, Boone, concentração e eficiência do Brasil).
(3) Franquia de depósitos: beta de captação por banco (Δ custo implícito ÷ Δ CDI) nos ciclos de 2021–2023 e
    2024–2025, com a Cosif 2025 como janela separada; regressão à la Drechsler–Savov–Schnabl na Cosif antiga;
    conferência contra os betas publicados de DSS (EUA).
(4) Mapa mercado × concorrente: líder, posição e trajetória do BB, quem mais ganhou, tendência da concentração,
    preço do BB (taxaJuros, da Análise 5) e uma jogada candidata (hipótese) com a premissa que teria de ser verdade.

Fontes: data/ifs/ (só leitura: national_ifdata.csv, ifs.sqlite, JSON do IF.data e do ESTBAN em cache), CDI (SGS 4391)
e taxaJuros já baixados em raw/ pelas Análises 4 e 5; GFDD (FRED/St. Louis Fed e API do Banco Mundial) e betas de DSS
(página de Philipp Schnabl, NYU) baixados uma vez para raw/. Rodar:
    python estrategia/bb/analises/a8_concorrencia.py
"""

import csv
import json
import math
import re
import sys
import zipfile
from datetime import date
from io import BytesIO

sys.dont_write_bytecode = True  # não grava .pyc em src/ (a camada de dados é só leitura)
import _comum as c  # noqa: E402
import _concorrencia as k  # noqa: E402

# ---------- períodos ----------

# Pontas anuais: dezembro, menos 2024 (12/2024 tem totais anômalos no crédito: _comum.ANOMALOUS) → 09/2024;
# 2026 → 06/2026 (último IF.data). 03/2016 é o início da camada.
YEAR_END = {y: y * 100 + 12 for y in range(2016, 2026)}
YEAR_END[2024] = 202409
YEAR_END[2026] = 202606
POINTS = [201603] + [YEAR_END[y] for y in range(2016, 2027)]

CREDIT = ["pf_consignado", "pf_nao_consignado", "pf_cartao", "pf_habitacao", "pf_veiculos", "pf_rural", "pf_outros",
          "pf_total", "pj_capital_giro", "pj_investimento", "pj_cheque_especial", "pj_recebiveis", "pj_comex",
          "pj_infraestrutura", "pj_rural", "pj_habitacional", "pj_outros", "pj_total", "pj_micro", "pj_pequena",
          "pj_media", "pj_grande", "credito_rural", "credito_imobiliario", "credito_pf_pj"]
REGIONS = ["reg_sudeste", "reg_sul", "reg_nordeste", "reg_norte", "reg_centro_oeste"]
FUNDING = ["depositos_vista", "depositos_poupanca", "depositos_prazo", "depositos_total", "lca", "lci", "captacoes"]
OTHER = ["ativo_total", "carteira_credito", "agencias"]
LABEL = {
    "pf_consignado": "PF consignado", "pf_nao_consignado": "PF não consignado", "pf_cartao": "PF cartão",
    "pf_habitacao": "PF habitação", "pf_veiculos": "PF veículos", "pf_rural": "PF rural", "pf_outros": "PF outros",
    "pf_total": "PF total", "pj_capital_giro": "PJ capital de giro", "pj_investimento": "PJ investimento",
    "pj_cheque_especial": "PJ cheque especial", "pj_recebiveis": "PJ recebíveis", "pj_comex": "PJ comércio exterior",
    "pj_infraestrutura": "PJ infraestrutura", "pj_rural": "PJ rural", "pj_habitacional": "PJ habitacional",
    "pj_outros": "PJ outros", "pj_total": "PJ total", "pj_micro": "PJ micro (porte)", "pj_pequena": "PJ pequena (porte)",
    "pj_media": "PJ média (porte)", "pj_grande": "PJ grande (porte)", "credito_rural": "Rural PF + PJ",
    "credito_imobiliario": "Imobiliário PF + PJ", "credito_pf_pj": "Crédito PF + PJ",
    "reg_sudeste": "Crédito, tomador no Sudeste", "reg_sul": "Crédito, tomador no Sul",
    "reg_nordeste": "Crédito, tomador no Nordeste", "reg_norte": "Crédito, tomador no Norte",
    "reg_centro_oeste": "Crédito, tomador no Centro-Oeste", "depositos_vista": "Depósitos à vista",
    "depositos_poupanca": "Poupança", "depositos_prazo": "Depósitos a prazo", "depositos_total": "Depósitos totais",
    "lca": "LCA", "lci": "LCI", "captacoes": "Captações totais", "ativo_total": "Ativo total",
    "carteira_credito": "Carteira de crédito (Resumo)", "agencias": "Agências"}

# ---------- benchmarks publicados (copiados das fontes; não recalculados) ----------

REB = "BCB, Relatório de Economia Bancária 2023, cap. 5 (https://bcb.gov.br/content/publicacoes/relatorioeconomiabancaria/reb2023p.pdf)"
REB_T51 = {  # Tabela 5.1, SFN (todos os segmentos), conglomerado prudencial; IHHn, RC4 %
    "ativo_total": {2021: (0.0929, 56.1), 2022: (0.0896, 56.0), 2023: (0.0882, 55.3)},
    "depositos_ajustados": {2021: (0.1016, 59.7), 2022: (0.0966, 58.4), 2023: (0.0945, 57.9)},
    "carteira_credito": {2021: (0.1022, 58.9), 2022: (0.1003, 58.6), 2023: (0.0990, 57.8)},
}
REB_T52 = {  # Tabela 5.2, por mercado relevante (SCR, doc. 3040; recursos livres, salvo rural, habitação e infra); EN, RC4 %
    "credito_rural": ("Financiamentos rurais e agro (PF + PJ)", {2021: (3.5, 64.2), 2022: (3.7, 65.6), 2023: (4.0, 64.0)}),
    "credito_imobiliario": ("Financiamentos habitacionais (PF + PJ)", {2021: (2.1, 92.2), 2022: (2.1, 92.6), 2023: (2.1, 92.6)}),
    "pj_infraestrutura": ("Infraestrutura e desenvolvimento (PJ)", {2021: (2.2, 94.0), 2022: (2.3, 93.2), 2023: (2.3, 93.7)}),
    "pj_recebiveis": ("Operações com recebíveis (PJ)", {2021: (7.8, 65.8), 2022: (8.1, 63.0), 2023: (9.9, 55.5)}),
    "pj_capital_giro": ("Capital de giro (PJ)", {2021: (10.8, 57.0), 2022: (11.0, 57.4), 2023: (11.4, 57.0)}),
    "pf_consignado": ("Crédito pessoal consignado (PF)", {2021: (8.1, 65.2), 2022: (8.3, 64.6), 2023: (8.3, 63.6)}),
    "pf_nao_consignado": ("Crédito pessoal não consignado (PF)", {2021: (12.6, 49.7), 2022: (13.1, 47.5), 2023: (14.1, 46.6)}),
    "pf_veiculos": ("Financiamento de veículos (PF)", {2021: (7.9, 65.1), 2022: (8.6, 61.5), 2023: (9.2, 58.3)}),
    "pf_cartao": ("Cartão de crédito (PF + PJ)", {2021: (7.5, 66.0), 2022: (8.0, 62.4), 2023: (8.8, 59.5)}),
}
FRED = "https://fred.stlouisfed.org/data/{}"
GFDD_FRED = {"lerner": "DDOI04BRA066NWDB", "boone": "DDOI05BRA156NWDB", "h_statistic": "DDOI03BRA066NWDB"}
WB_API = "https://api.worldbank.org/v2/country/BRA/indicator/{}?format=json&per_page=200&source=32"
GFDD_WB = {"GFDD.OI.01": "concentração 3 maiores bancos (% do ativo)", "GFDD.OI.06": "concentração 5 maiores bancos (% do ativo)",
           "GFDD.EI.01": "margem financeira líquida (%)", "GFDD.EI.04": "custos operacionais ÷ ativo (%)",
           "GFDD.EI.05": "ROA depois de impostos (%)"}
DSS_URL = "https://pages.stern.nyu.edu/~pschnabl/data/DSS_depositBeta.xlsx"

# ---------- IF.data por entidade: DRE e balanço (conglomerado financeiro 1005) ----------

DRE = "Demonstração de Resultado"
SPECS = [
    {"id": "rec_credito", "report": DRE, "column": r"Rendas de Operações de Crédito  \((a1|c)\)$"},
    {"id": "rec_arrend", "report": DRE,
     "column": r"Rendas de Operações de Arrendamento Mercantil  \(a2\)|Rendas de Arrendamento Financeiro  \(d\)"},
    {"id": "rec_tvm", "report": DRE,
     "column": r"Rendas de Operações com TVM  \(a3\)|Rendas de Títulos e Valores Mobiliários  \(b\)$"},
    {"id": "rec_interf", "report": DRE,
     "column": r"Rendas de Aplicações Compulsórias  \(a6\)|Rendas de Aplicações Interfinanceiras de Liquidez  \(a\)$"},
    {"id": "rec_outcred", "report": DRE, "column": r"Características de Concessão de Crédito  \(e\)$"},
    {"id": "rec_serv", "report": DRE, "column": r"Rendas de Prestação de Serviços  \((d1|n)\)"},
    {"id": "rec_pagto", "report": DRE, "column": r"Serviços por Transações de Pagamento  \(l1\)"},
    {"id": "rec_tarifas", "report": DRE, "column": r"Rendas de Tarifas Bancárias  \((d2|m)\)"},
    # resultados líquidos que compensam a variação cambial embutida na despesa de captação (b1 antiga, g nova)
    {"id": "res_deriv", "report": DRE,
     "column": r"Instrumentos Financeiros Derivativos  \(a4\)|Resultado com Derivativos  \(i\)"},
    {"id": "res_cambio_rec", "report": DRE,
     "column": r"Receitas de Intermediação Financeira > Resultado de Operações de Câmbio  \(a5\)"},
    {"id": "res_cambio_desp", "report": DRE,
     "column": r"Despesas de Intermediação Financeira > Resultado de Operações de Câmbio  \(b4\)"},
    {"id": "res_outros_interm", "report": DRE, "column": r"Outros Resultados de Intermediação Financeira  \(j\)"},
    # cooperativas: na Cosif 2025 a renda da centralização financeira (depósito da singular na central) foi para
    # "Outras Receitas (t)" (singulares: R$ 2,3–3,0 bi por semestre em 2024 → R$ 12,6–17,2 bi em 2025)
    {"id": "outras_rec", "report": DRE, "column": r"Outras Receitas Operacionais  \(d7\)|Outras Receitas  \(t\)$"},
    {"id": "desp_capt", "report": DRE, "column": r"Despesas de Captação  \(b1\)|Despesas de Captações  \(g\)$"},
    {"id": "desp_capt_juros", "report": DRE,
     "column": r"Despesas de Captação  \(b1\)|Despesa de Juros com Captações  \(g1\)"},
    {"id": "desp_repasses", "report": DRE, "column": r"Empréstimos e Repasses  \(b2\)"},
    {"id": "desp_arrend", "report": DRE, "column": r"Despesas de Operações de Arrendamento Mercantil  \(b3\)"},
    {"id": "desp_divcap", "report": DRE, "column": r"Dívida Elegíveis a Capital  \(h\)"},
    {"id": "desp_pessoal", "report": DRE, "column": r"Despesas de Pessoal  \((d3|o)\)"},
    {"id": "desp_admin", "report": DRE, "column": r"Despesas Administrativas  \((d4|p)\)"},
    {"id": "lucro", "report": DRE, "column": r"Lucro Líquido  \((j|z)\)"},
    {"id": "ativo", "report": "^Ativo", "column": r"Ativo Total  \(k\)"},
    {"id": "dep_a", "report": "^Passivo", "column": r"(Depósito Total|Depósitos)  \(a\)$"},
    {"id": "dep_vista", "report": "^Passivo", "column": r"Depósitos à Vista  \(a1\)"},
    {"id": "dep_interf", "report": "^Passivo", "column": r"Depósitos Interfinanceiros  \(a3\)"},
    {"id": "compromissadas", "report": "^Passivo", "column": r"Compromissadas  \(b\)"},
    {"id": "titulos", "report": "^Passivo",
     "column": r"(Recursos de Aceites e Emissão de Títulos|Outros Instrumentos de Dívida)  \(c\)$"},
    {"id": "lci", "report": "^Passivo", "column": r"Letras de Crédito Imobiliário  \(c1\)"},
    {"id": "lca", "report": "^Passivo", "column": r"Letras de Crédito do Agronegócio  \(c2\)"},
    {"id": "lf", "report": "^Passivo", "column": r"Letras Financeiras  \(c3\)"},
    {"id": "captacoes", "report": "^Passivo", "column": r"Captações  \(e\)"},
]
SEGMENTS = {"bancos (b1+b2)": {"b1", "b2"}, "cooperativas (b3)": {"b3S", "b3C"}, "não bancários (n1+n4)": {"n1", "n4"}}
MIN_ASSETS = {"bancos (b1+b2)": 1e9, "cooperativas (b3)": 1e8, "não bancários (n1+n4)": 5e8}

WHO = ["bb", "itau", "bradesco", "santander", "caixa", "btg", "nubank", "inter", "c6", "mercado-pago", "pagbank",
       "picpay", "xp", "safra", "banrisul", "bnb", "sicredi", "sicoob"]


def seg_of(tcb):
    return next((s for s, ts in SEGMENTS.items() if tcb in ts), None)


# ======================================================================================================
# 1. Concentração
# ======================================================================================================

class Units:
    """Mapa código → unidade de concorrência, por (período, nível), com cache."""

    def __init__(self, con, reg):
        self.con, self.reg, self.cache = con, reg, {}

    def __call__(self, p, lv):
        if (p, lv) not in self.cache:
            self.cache[(p, lv)] = c.membership(self.con, self.reg, p, lv)
        return self.cache[(p, lv)]


def entity_values(con, p, lv, metric):
    return dict(con.execute("SELECT code, value FROM ifdata_values WHERE period=? AND level=? AND metric=?",
                            (p, lv, metric)))


def grouped(vals, mem):
    out = {}
    for code, v in vals.items():
        u = mem.get(code, f"e{code}")
        out[u] = out.get(u, 0.0) + v
    return out


def national_concentration(con, units, nat, names):
    rows = []
    for m in CREDIT + REGIONS + FUNDING + OTHER:
        for p in POINTS:
            d = nat.get((p, m))
            if not d:
                continue
            vals = entity_values(con, p, d["level"], m)
            for unit_def, v in (("concorrente", grouped(vals, units(p, d["level"]))),
                                ("entidade", {f"e{cd}": x for cd, x in vals.items()})):
                r = k.concentration(v)
                if not r:
                    continue
                if unit_def == "entidade":
                    bbcodes = {f"e{cd}" for cd, i in units(p, d["level"]).items() if i == "bb"}
                    bb = sum(r["shares"].get(x, 0) for x in bbcodes)
                    lead = names.get(units(p, d["level"]).get(int(r["leader"][1:])), r["leader"])
                else:
                    bb = r["shares"].get("bb", 0)
                    lead = names.get(r["leader"], r["leader"])
                rows.append({
                    "period": p, "metric": m, "mercado": LABEL[m], "unidade": unit_def, "level": d["level"],
                    "cosif": "cosif2025" if p >= 202503 else "cosif_antigo",
                    "sistema_bi": round(r["total"] / 1e9, 1) if m != "agencias" else round(r["total"]),
                    "hhi": round(r["hhi"]), "cr4_pct": round(100 * r["cr4"], 1), "en": round(r["en"], 1),
                    "unidades": r["n"], "lider": lead, "lider_pct": round(100 * r["leader_share"], 1),
                    "bb_pct": round(100 * bb, 2),
                    "bb_rank": k.rank_of(r["shares"], "bb") if unit_def == "concorrente" else "",
                    "faixa_bcb": k.classify(r["hhi"], k.BCB_THRESH), "faixa_cade": k.classify(r["hhi"], k.CADE_THRESH),
                    "_shares": r["shares"] if unit_def == "concorrente" else None})
    return rows


def concentration_trend(rows):
    out = []
    by = {}
    for r in rows:
        if r["unidade"] == "concorrente":
            by.setdefault(r["metric"], {})[r["period"]] = r
    for m, d in by.items():
        ys = [(p // 100, d[p]["hhi"]) for p in sorted(d) if p != 201603]
        sl = k.slope([a for a, _ in ys], [b for _, b in ys])
        sl_old = k.slope([a for a, _ in ys if a <= 2024], [b for a, b in ys if a <= 2024])
        first, last = d.get(201603) or d[min(d)], d[max(d)]
        out.append({"metric": m, "mercado": LABEL[m], "periodo_ini": first["period"], "periodo_fim": last["period"],
                    "sistema_fim_bi": last["sistema_bi"], "hhi_ini": first["hhi"],
                    "hhi_2019": d.get(201912, {}).get("hhi", ""), "hhi_2023": d.get(202312, {}).get("hhi", ""),
                    "hhi_fim": last["hhi"], "delta_hhi": last["hhi"] - first["hhi"],
                    "tendencia_hhi_por_ano": round(sl, 1) if sl is not None else "",
                    "tendencia_hhi_por_ano_ate_2024": round(sl_old, 1) if sl_old is not None else "",
                    "cr4_ini_pct": first["cr4_pct"], "cr4_fim_pct": last["cr4_pct"],
                    "faixa_bcb_ini": first["faixa_bcb"], "faixa_bcb_fim": last["faixa_bcb"],
                    "faixa_cade_fim": last["faixa_cade"], "lider_fim": last["lider"], "lider_fim_pct": last["lider_pct"],
                    "atravessa_perimetro_2025": first["level"] != last["level"]})
    return out


# ---------- ESTBAN por UF e região ----------

UF_REGION = {"AC": "Norte", "AM": "Norte", "AP": "Norte", "PA": "Norte", "RO": "Norte", "RR": "Norte", "TO": "Norte",
             "AL": "Nordeste", "BA": "Nordeste", "CE": "Nordeste", "MA": "Nordeste", "PB": "Nordeste",
             "PE": "Nordeste", "PI": "Nordeste", "RN": "Nordeste", "SE": "Nordeste", "DF": "Centro-Oeste",
             "GO": "Centro-Oeste", "MS": "Centro-Oeste", "MT": "Centro-Oeste", "ES": "Sudeste", "MG": "Sudeste",
             "RJ": "Sudeste", "SP": "Sudeste", "PR": "Sul", "RS": "Sul", "SC": "Sul"}
ESTBAN_METRICS = ["credito_total", "credito_rural", "credito_imobiliario", "depositos_vista", "depositos_poupanca",
                  "depositos_prazo", "depositos_total"]


def estban_months(con):
    summ = json.loads((c.IFS / "shares" / "summary.json").read_text(encoding="utf-8"))
    repl = {int(a): b for a, b in summ["estban"].get("months_replaced", {}).items()}
    latest = con.execute("SELECT MAX(month) FROM estban_uf").fetchone()[0]
    want = [y * 100 + 12 for y in range(2016, 2026)] + [latest]
    return [(m, repl.get(m, m)) for m in want]


def estban_concentration(con, reg, names):
    from pawatch.ifs.shares import estban_membership  # noqa: E402  (leitura; não altera nada)
    enames = dict(con.execute("SELECT cnpj8, name FROM estban_names"))
    rows = []
    for asked, used in estban_months(con):
        mem = estban_membership(con, reg, used, enames)
        acc = {}
        for c8, uf, m, v in con.execute("SELECT cnpj8, uf, metric, value FROM estban_uf WHERE month=?", (used,)):
            if m not in ESTBAN_METRICS or not v or v <= 0:
                continue
            u = mem.get(c8, f"b{c8}")
            for geo_type, geo in (("uf", uf), ("regiao", UF_REGION.get(uf, "?")), ("brasil", "BR")):
                d = acc.setdefault((geo_type, geo, m), {})
                d[u] = d.get(u, 0.0) + v
        for (gt, geo, m), v in sorted(acc.items()):
            r = k.concentration(v)
            if not r:
                continue
            rows.append({"month": asked, "month_used": used, "geo_type": gt, "geo": geo, "metric": m,
                         "total_bi": round(r["total"] / 1e9, 2), "hhi": round(r["hhi"]), "cr4_pct": round(100 * r["cr4"], 1),
                         "unidades": r["n"], "lider": names.get(r["leader"], enames.get(r["leader"][1:], r["leader"])),
                         "lider_pct": round(100 * r["leader_share"], 1),
                         "bb_pct": round(100 * r["shares"].get("bb", 0), 2), "bb_rank": k.rank_of(r["shares"], "bb") or "",
                         "faixa_bcb": k.classify(r["hhi"]),
                         "sede_inflada": gt == "uf" and geo in ("DF", "SP") or gt == "regiao" and geo in ("Centro-Oeste",)})
    return rows


def estban_summary(rows):
    first = min(r["month"] for r in rows)
    last = max(r["month"] for r in rows)
    d = {(r["month"], r["geo_type"], r["geo"], r["metric"]): r for r in rows}
    out = []
    for (mo, gt, geo, m), r in d.items():
        if mo != last:
            continue
        a = d.get((first, gt, geo, m))
        if not a:
            continue
        out.append({"geo_type": gt, "geo": geo, "metric": m, "mes_ini": first, "mes_fim": last,
                    "hhi_ini": a["hhi"], "hhi_fim": r["hhi"], "delta_hhi": r["hhi"] - a["hhi"],
                    "bb_ini_pct": a["bb_pct"], "bb_fim_pct": r["bb_pct"], "bb_delta_pp": round(r["bb_pct"] - a["bb_pct"], 2),
                    "bb_rank_ini": a["bb_rank"], "bb_rank_fim": r["bb_rank"], "lider_fim": r["lider"],
                    "lider_fim_pct": r["lider_pct"], "faixa_bcb_fim": r["faixa_bcb"], "sede_inflada": r["sede_inflada"]})
    return sorted(out, key=lambda r: (r["metric"], r["geo_type"], r["geo"]))


# ======================================================================================================
# 2. Lerner e Boone
# ======================================================================================================

def annual_panel(ent, types):
    """Observações instituição-ano a partir do painel trimestral por entidade (nível 1005)."""
    codes = {cd for _, cd in ent}
    obs = []
    for cd in codes:
        for y in range(2016, 2027):
            h1, h2 = y * 100 + 6, y * 100 + 12
            sems = [h1] if y == 2026 else [h1, h2]
            if any((p, cd) not in ent or "ativo" not in ent[(p, cd)] for p in sems):
                continue
            mult = 2 if y == 2026 else 1
            flow = lambda m: mult * sum(ent[(p, cd)].get(m, 0.0) for p in sems)  # noqa: E731
            qs = [p for p in ([(y - 1) * 100 + 12] + [y * 100 + q for q in (3, 6, 9, 12)])
                  if (p <= YEAR_END[2026]) and (p, cd) in ent and ent[(p, cd)].get("ativo")]
            avg = lambda m: sum(ent[(p, cd)].get(m, 0.0) for p in qs) / len(qs)  # noqa: E731
            q, f = avg("ativo"), avg("captacoes")
            tr = sum(flow(m) for m in ("rec_credito", "rec_arrend", "rec_tvm", "rec_interf", "rec_outcred",
                                         "rec_serv", "rec_pagto", "rec_tarifas",
                                         "res_deriv", "res_cambio_rec", "res_cambio_desp", "res_outros_interm"))
            ie = -sum(flow(m) for m in ("desp_capt", "desp_repasses", "desp_arrend", "desp_divcap"))
            pe, ae = -flow("desp_pessoal"), -flow("desp_admin")
            last = sems[-1]
            tcb, name = types.get((last, cd), ("", ""))
            if seg_of(tcb) == "cooperativas (b3)":
                tr += flow("outras_rec")
            obs.append({"code": cd, "ano": y, "tcb": tcb, "nome": name, "seg": seg_of(tcb), "q": q, "f": f, "tr": tr,
                        "ie": ie, "pe": pe, "ae": ae, "tc": ie + pe + ae, "lucro": flow("lucro"),
                        "w1": ie / f if f > 0 else 0, "w2": pe / q if q > 0 else 0, "w3": ae / q if q > 0 else 0,
                        "roa": flow("lucro") / q if q > 0 else 0, "cosif": "cosif2025" if y >= 2025 else "cosif_antigo"})
    return obs


def trim(obs, keys=("w1", "w2", "w3", "price0", "tcq"), lo=0.01, hi=0.99):
    for o in obs:
        o["price0"], o["tcq"] = o["tr"] / o["q"], o["tc"] / o["q"]
    keep = obs
    for key in keys:
        xs = [o[key] for o in keep]
        a, b = k.quantile(xs, lo), k.quantile(xs, hi)
        keep = [o for o in keep if a <= o[key] <= b]
    return keep


def estimate_lerner(obs):
    """Uma translog por segmento (como o REB do BCB separa bancário, cooperativo e não bancário)."""
    fits, sample = {}, []
    for seg in SEGMENTS:
        s = [o for o in obs if o["seg"] == seg and o["q"] >= MIN_ASSETS[seg] and o["tr"] > 0
             and min(o["w1"], o["w2"], o["w3"]) > 0 and o["tc"] > 0]
        s = trim(s)
        fit = k.fit_translog(s)
        fits[seg] = fit
        sample += s
    return fits, sample


def lerner_tables(fits, sample, units, names):
    seg_rows, inst_rows, coef_rows = [], [], []
    for seg, fit in fits.items():
        for nm, b, se in zip(fit["names"], fit["b"], fit["se"]):
            coef_rows.append({"segmento": seg, "termo": nm, "coef": round(b, 5), "erro_padrao_cluster": round(se, 5)})
        coef_rows.append({"segmento": seg, "termo": "_n_obs", "coef": fit["n"], "erro_padrao_cluster": ""})
        coef_rows.append({"segmento": seg, "termo": "_n_instituicoes", "coef": fit["clusters"], "erro_padrao_cluster": ""})
        coef_rows.append({"segmento": seg, "termo": "_r2", "coef": round(fit["r2"], 4), "erro_padrao_cluster": ""})
        s = [o for o in sample if o["seg"] == seg]
        for y in sorted({o["ano"] for o in s}):
            yy = [o for o in s if o["ano"] == y]
            ls = [o["lerner"] for o in yy]
            seg_rows.append({
                "segmento": seg, "ano": y, "cosif": "cosif2025" if y >= 2025 else "cosif_antigo", "n": len(yy),
                "lerner_media": round(sum(ls) / len(ls), 3), "lerner_mediana": round(k.quantile(ls, 0.5), 3),
                "lerner_p25": round(k.quantile(ls, 0.25), 3), "lerner_p75": round(k.quantile(ls, 0.75), 3),
                "lerner_ponderado_ativo": round(k.weighted_mean([(o["lerner"], o["q"]) for o in yy]), 3),
                "preco_mediano_pct": round(100 * k.quantile([o["price"] for o in yy], 0.5), 2),
                "cmg_mediano_pct": round(100 * k.quantile([o["mc"] for o in yy], 0.5), 2),
                "elasticidade_custo_mediana": round(k.quantile([o["elast"] for o in yy], 0.5), 3),
                "custos_operacionais_sobre_ativo_agregado_pct": round(100 * sum(o["pe"] + o["ae"] for o in yy) / sum(o["q"] for o in yy), 2),
                "roa_agregado_pct": round(100 * sum(o["lucro"] for o in yy) / sum(o["q"] for o in yy), 2)})
    # por instituição do cadastro: média ponderada pelo ativo das entidades dela que estão na amostra
    by = {}
    for o in sample:
        inst = units(YEAR_END[o["ano"]] if o["ano"] < 2026 else 202606, 1005).get(o["code"])
        # sistemas cooperativos: só as singulares (quem empresta ao cooperado). Banco cooperativo e centrais
        # administram a liquidez do sistema, têm dupla contagem e, na Cosif 2025, receita fora das linhas usadas
        if inst in ("sicredi", "sicoob") and o["tcb"] != "b3S":
            continue
        if inst:
            by.setdefault((inst, o["ano"]), []).append(o)
    for (inst, y), os_ in sorted(by.items()):
        if inst not in WHO:
            continue
        q = sum(o["q"] for o in os_)
        inst_rows.append({
            "inst_id": inst, "nome": names.get(inst, inst), "ano": y, "cosif": "cosif2025" if y >= 2025 else "cosif_antigo",
            "entidades": len(os_), "segmentos": "; ".join(sorted({o["seg"] for o in os_})), "ativo_medio_bi": round(q / 1e9, 1),
            "lerner": round(k.weighted_mean([(o["lerner"], o["q"]) for o in os_]), 3),
            "preco_pct": round(100 * sum(o["tr"] for o in os_) / q, 2),
            "custo_marginal_pct": round(100 * k.weighted_mean([(o["mc"], o["q"]) for o in os_]), 2),
            "custo_medio_pct": round(100 * sum(o["tc"] for o in os_) / q, 2),
            "elasticidade_custo": round(k.weighted_mean([(o["elast"], o["q"]) for o in os_]), 3),
            "preco_captacao_w1_pct": round(100 * sum(o["ie"] for o in os_) / sum(o["f"] for o in os_), 2),
            "roa_pct": round(100 * sum(o["lucro"] for o in os_) / q, 2)})
    # percentil do Lerner no ano dentro do próprio segmento (cada segmento tem a sua função custo); vazio se a
    # instituição tem entidades em mais de um segmento
    dist = {}
    for o in sample:
        dist.setdefault((o["seg"], o["ano"]), []).append(o["lerner"])
    for r in inst_rows:
        xs = dist.get((r["segmentos"], r["ano"]), [])
        if xs:
            r["percentil_no_segmento"] = round(100 * sum(1 for x in xs if x < r["lerner"]) / len(xs))
    return seg_rows, inst_rows, coef_rows


def boone_rows(sample):
    out = []
    for seg in SEGMENTS:
        s = [o for o in sample if o["seg"] == seg]
        tot = {}
        for o in s:
            tot[o["ano"]] = tot.get(o["ano"], 0) + o["q"]
        for o in s:
            o["share"] = o["q"] / tot[o["ano"]]
        b_roa, b_sh = k.boone(s, "roa"), k.boone(s, "share")
        for y in sorted(set(b_roa) | set(b_sh)):
            out.append({"segmento": seg, "ano": y, "cosif": "cosif2025" if y >= 2025 else "cosif_antigo",
                        "boone_roa": round(b_roa[y]["beta"], 3) if y in b_roa else "",
                        "boone_roa_ep": round(b_roa[y]["se"], 3) if y in b_roa else "",
                        "n_roa_positivo": b_roa[y]["n"] if y in b_roa else "",
                        "boone_participacao": round(b_sh[y]["beta"], 3) if y in b_sh else "",
                        "boone_participacao_ep": round(b_sh[y]["se"], 3) if y in b_sh else "",
                        "n": b_sh[y]["n"] if y in b_sh else ""})
    return out


# ---------- GFDD (Banco Mundial) ----------

def gfdd():
    """{série: {ano: valor}}. Lerner, Boone e H do GFDD saíram da API do Banco Mundial; o FRED (St. Louis Fed) guarda a
    última versão (até 2014). Concentração e eficiência vêm da API (até 2021)."""
    out = {}
    for key, sid in GFDD_FRED.items():
        page = c.fetch_cached(FRED.format(sid), f"gfdd/fred_{sid}.html").decode("utf-8", "replace")
        out[key] = {int(a): float(b) for a, b in re.findall(r"(\d{4})-01-01\s*</t[hd]>\s*<td[^>]*>\s*([-0-9.]+)", page)}
    for ind in GFDD_WB:
        rows = json.loads(c.fetch_cached(WB_API.format(ind), f"gfdd/wb_{ind}"))
        out[ind] = {int(r["date"]): r["value"] for r in rows[1] if r["value"] is not None}
    return out


def benchmark_lerner(g, seg_rows, boone, conc_assets):
    rows = []
    bank = {r["ano"]: r for r in seg_rows if r["segmento"] == "bancos (b1+b2)"}
    bo = {r["ano"]: r for r in boone if r["segmento"] == "bancos (b1+b2)"}
    for y in range(2005, 2027):
        r = {"ano": y, "gfdd_lerner": g["lerner"].get(y, ""), "gfdd_boone": g["boone"].get(y, ""),
             "gfdd_h": g["h_statistic"].get(y, "")}
        for ind, lab in (("GFDD.OI.01", "gfdd_cr3_ativo_pct"), ("GFDD.OI.06", "gfdd_cr5_ativo_pct"),
                         ("GFDD.EI.04", "gfdd_custo_operacional_ativo_pct"), ("GFDD.EI.05", "gfdd_roa_pct"),
                         ("GFDD.EI.01", "gfdd_margem_liquida_pct")):
            v = g[ind].get(y)
            r[lab] = round(v, 2) if v is not None else ""
        if y in bank:
            b = bank[y]
            r.update({"a8_lerner_media": b["lerner_media"], "a8_lerner_mediana": b["lerner_mediana"],
                      "a8_lerner_ponderado": b["lerner_ponderado_ativo"],
                      "a8_custo_operacional_ativo_pct": b["custos_operacionais_sobre_ativo_agregado_pct"],
                      "a8_roa_pct": b["roa_agregado_pct"]})
        if y in bo:
            r["a8_boone_roa"] = bo[y]["boone_roa"]
        if y in conc_assets:
            r["a8_cr3_ativo_bancos_pct"], r["a8_cr5_ativo_bancos_pct"] = conc_assets[y]
        if len(r) > 4 or any(r[x] != "" for x in ("gfdd_lerner", "gfdd_boone")):
            rows.append(r)
    return rows


def bank_asset_concentration(con, units, types):
    """CR3 e CR5 do ativo entre bancos (b1, b2, b4; conglomerado financeiro, unidades = concorrentes), dezembro."""
    out = {}
    for y in range(2016, 2027):
        p = YEAR_END[y] if y != 2024 else 202412  # ativo não tem a anomalia de 12/2024
        vals = {cd: v for cd, v in entity_values(con, p, 1005, "ativo_total").items()
                if types.get((p, cd), ("",))[0] in ("b1", "b2", "b4")}
        sh = sorted(k.concentration(grouped(vals, units(p, 1005)))["shares"].values(), reverse=True)
        out[y] = (round(100 * sum(sh[:3]), 1), round(100 * sum(sh[:5]), 1))
    return out


# ======================================================================================================
# 3. Beta de captação
# ======================================================================================================

BETA_WHO = ["bb", "itau", "bradesco", "santander", "caixa", "nubank", "inter", "c6", "btg", "sicredi", "sicoob",
            "_singulares", "_privados3", "_sistema"]
CYCLES = [  # (nome, base, fim, regime, nota); cada ponta é a média dos trimestres listados
    ("alta 2021-2023", [202009, 202012, 202103], [202303, 202306], "cosif_antigo",
     "leitura principal; a média de 3 trimestres na base atenua a variação cambial da linha (b1)"),
    ("corte 2023-2024", [202303, 202306], [202406, 202409], "cosif_antigo",
     "contaminado: o real caiu de R$ 4,82 para R$ 5,59 por dólar no 1º semestre de 2024 e a linha (b1) inclui a variação cambial das captações externas"),
    ("alta 2024-2025, trecho Cosif antiga", [202406, 202409], [202412], "cosif_antigo",
     "não interpretável: ΔCDI < 1 p.p. e o dólar subiu ~13% no 4º trimestre de 2024 (linha b1 com variação cambial)"),
    ("alta 2024-2025, trecho Cosif nova", [202503], [202509, 202512], "cosif2025",
     "linha (g1), só juros; ΔCDI pequeno (~2,6 p.p.) e defasagem: ler como ordem de grandeza"),
]


def funding_quarterly(ent, types, units, cdi):
    """Custo implícito trimestral (anualizado ×4) de captação por instituição: despesa de juros do trimestre ÷ saldo
    médio (início e fim) de depósitos + compromissadas + títulos. Também ex-compromissadas, supondo que a
    compromissada custa 100% do CDI do trimestre (premissa)."""
    periods = sorted({p for p, _ in ent})
    agg = {}
    for p in periods:
        mem = units(p, 1005)
        for (pp, cd), v in ent.items():
            if pp != p:
                continue
            whos = []
            inst = mem.get(cd)
            if inst in BETA_WHO:
                whos.append(inst)
            if inst in ("itau", "bradesco", "santander"):
                whos.append("_privados3")
            if types.get((p, cd), ("",))[0] == "b3S":
                whos.append("_singulares")
            whos.append("_sistema")
            for w in whos:
                d = agg.setdefault((p, w), {})
                for m in ("desp_capt_juros", "dep_a", "dep_vista", "compromissadas", "titulos"):
                    d[m] = d.get(m, 0.0) + v.get(m, 0.0)
    rows = []
    for w in BETA_WHO:
        for p in periods:
            pq = k.prev_q(p)
            if (p, w) not in agg or (pq, w) not in agg:
                continue
            e = k.quarter_flow(lambda x: agg[(x, w)]["desp_capt_juros"] if (x, w) in agg else None, p)
            if e is None:
                continue
            bal = lambda x: agg[(x, w)]["dep_a"] + agg[(x, w)]["compromissadas"] + agg[(x, w)]["titulos"]  # noqa: E731
            b = (bal(p) + bal(pq)) / 2
            repo = (agg[(p, w)]["compromissadas"] + agg[(pq, w)]["compromissadas"]) / 2
            vista = (agg[(p, w)]["dep_vista"] + agg[(pq, w)]["dep_vista"]) / 2
            kq = c.cdi_compound(cdi, p - 2, p)
            if b <= 0 or kq is None:
                continue
            cost = 4 * -e / b
            ex = 4 * (-e - kq * repo) / (b - repo) if b - repo > 0 else None
            rows.append({"inst_id": w, "period": p, "cosif": "cosif2025" if p >= 202503 else "cosif_antigo",
                         "cdi_aa_pct": round(400 * kq, 2), "custo_aa_pct": round(100 * cost, 2),
                         "custo_ex_compromissadas_aa_pct": round(100 * ex, 2) if ex is not None else "",
                         "saldo_medio_bi": round(b / 1e9, 1), "compromissadas_pct": round(100 * repo / b, 1),
                         "vista_pct": round(100 * vista / b, 1)})
    return rows


def cycle_betas(q, names):
    d = {(r["inst_id"], r["period"]): r for r in q}
    out = []
    for w in BETA_WHO:
        for name, base, end, regime, note in CYCLES:
            pts_b = [d.get((w, p)) for p in base]
            pts_e = [d.get((w, p)) for p in end]
            if any(x is None for x in pts_b + pts_e):
                continue
            mean = lambda xs, key: sum(x[key] for x in xs) / len(xs)  # noqa: E731
            dcdi = mean(pts_e, "cdi_aa_pct") - mean(pts_b, "cdi_aa_pct")
            dc = mean(pts_e, "custo_aa_pct") - mean(pts_b, "custo_aa_pct")
            exb = [x["custo_ex_compromissadas_aa_pct"] for x in pts_b + pts_e]
            r = {"inst_id": w, "nome": names.get(w, w), "ciclo": name, "regime": regime,
                 "base": "+".join(str(p) for p in base), "fim": "+".join(str(p) for p in end),
                 "cdi_base_pct": round(mean(pts_b, "cdi_aa_pct"), 2), "cdi_fim_pct": round(mean(pts_e, "cdi_aa_pct"), 2),
                 "delta_cdi_pp": round(dcdi, 2), "custo_base_pct": round(mean(pts_b, "custo_aa_pct"), 2),
                 "custo_fim_pct": round(mean(pts_e, "custo_aa_pct"), 2), "delta_custo_pp": round(dc, 2),
                 "beta": round(dc / dcdi, 2) if abs(dcdi) >= 1 else "",
                 "vista_base_pct": round(mean(pts_b, "vista_pct"), 1),
                 "compromissadas_base_pct": round(mean(pts_b, "compromissadas_pct"), 1),
                 "delta_cdi_pequeno": abs(dcdi) < 2, "nota": note}
            if "" not in exb:
                dx = mean(pts_e, "custo_ex_compromissadas_aa_pct") - mean(pts_b, "custo_ex_compromissadas_aa_pct")
                r["beta_ex_compromissadas"] = round(dx / dcdi, 2) if abs(dcdi) >= 1 else ""
            out.append(r)
        out.append({"inst_id": w, "nome": names.get(w, w), "ciclo": "alta 2024-2025 inteira", "regime": "atravessa a Cosif 2025",
                    "beta": "", "nota": "não calculado: a linha de despesa muda de (b1, com variação cambial) para (g1, só juros) em 03/2025"})
    return out


def dss_regression(q, names, lags=3, drop_2020=True):
    """Δ custo_t = a + Σ_{j=0..lags} b_j Δ CDI_{t−j}, por instituição, Cosif antiga (até 12/2024). Beta = Σ b_j
    (Drechsler, Savov & Schnabl 2017, com dados trimestrais). 2020 fica fora por padrão (variação cambial na linha b1)."""
    out = []
    for w in BETA_WHO:
        s = sorted((r["period"], r["custo_aa_pct"], r["cdi_aa_pct"]) for r in q
                   if r["inst_id"] == w and r["cosif"] == "cosif_antigo")
        idx = {p: (cst, cd) for p, cst, cd in s}
        y, x = [], []
        for p, cst, cd in s:
            chain = [p]
            for _ in range(lags + 1):
                chain.append(k.prev_q(chain[-1]))
            if any(z not in idx for z in chain):
                continue
            if drop_2020 and p // 100 == 2020:
                continue
            y.append(idx[p][0] - idx[chain[1]][0])
            x.append([1.0] + [idx[chain[j]][1] - idx[chain[j + 1]][1] for j in range(lags + 1)])
        if len(y) < 12:
            continue
        fit = k.ols(y, x)
        beta = sum(fit["b"][1:])
        var = sum(fit["v"][i][j] for i in range(1, lags + 2) for j in range(1, lags + 2))
        out.append({"inst_id": w, "nome": names.get(w, w), "trimestres": fit["n"], "defasagens": lags,
                    "sem_2020": drop_2020, "beta_dss": round(beta, 2), "erro_padrao_hc1": round(math.sqrt(max(var, 0)), 2),
                    "beta_contemporaneo": round(fit["b"][1], 2), "r2": round(fit["r2"], 2)})
    return out


def dss_benchmark():
    """Betas publicados de DSS (bancos comerciais dos EUA, 1984–2022): média, mediana e média ponderada pelo ativo."""
    body = c.fetch_cached(DSS_URL, "dss/DSS_depositBeta.xlsx")
    z = zipfile.ZipFile(BytesIO(body))
    ss = re.findall(r"<si>.*?</si>", z.read("xl/sharedStrings.xml").decode("utf-8"), re.S)
    ss = [re.sub(r"<[^>]+>", "", s) for s in ss]
    sheet = z.read("xl/worksheets/sheet1.xml").decode("utf-8")
    rows = []
    for row in re.findall(r"<row [^>]*>(.*?)</row>", sheet, re.S):
        cells = {}
        for ref, t, v in re.findall(r'<c r="([A-Z]+)\d+"([^>]*)>(?:<f>.*?</f>)?<v>([^<]*)</v>', row):
            cells[ref] = ss[int(v)] if 't="s"' in t else v
        rows.append(cells)
    head = rows[0]
    col = {v: kk for kk, v in head.items()}
    data = []
    for r in rows[1:]:
        try:
            data.append({"name": r.get(col["name"], ""), "assets": float(r.get(col["assets_2022q4"]) or "nan"),
                         "expbeta": float(r.get(col["expbeta"]) or "nan"), "depexpbeta": float(r.get(col["depexpbeta"]) or "nan")})
        except ValueError:
            continue
    out = []
    for key in ("expbeta", "depexpbeta"):
        xs = [d for d in data if not math.isnan(d[key])]
        wx = [d for d in xs if not math.isnan(d["assets"])]
        top = sorted(wx, key=lambda d: -d["assets"])[:10]
        out.append({"serie": key, "bancos": len(xs), "media": round(sum(d[key] for d in xs) / len(xs), 3),
                    "mediana": round(k.quantile([d[key] for d in xs], 0.5), 3),
                    "p25": round(k.quantile([d[key] for d in xs], 0.25), 3),
                    "p75": round(k.quantile([d[key] for d in xs], 0.75), 3),
                    "ponderada_ativo_2022": round(k.weighted_mean([(d[key], d["assets"]) for d in wx]), 3),
                    "media_10_maiores": round(sum(d[key] for d in top) / len(top), 3),
                    "fonte": DSS_URL + " (uso não comercial; janela 1984–2022)"})
    return out


# ======================================================================================================
# 4. Mapa mercado × concorrente
# ======================================================================================================

RATE_OF = {"pf_nao_consignado": ["nao_consignado"], "pf_consignado": ["consig_inss", "consig_publico", "consig_privado"],
           "pf_cartao": ["cartao_rotativo", "cartao_parcelado"], "pf_veiculos": ["veiculos"],
           "pj_capital_giro": ["capital_giro_ate_365d", "capital_giro_mais_365d"]}
MOVES = {
    "manter": ("BB lidera ou ganha participação", "a posição atual paga o custo de capital do produto",
               "margem ajustada ao risco por produto (dado interno)"),
    "sair (rever presença)": ("BB pequeno e encolhendo", "o produto não paga o custo de capital no BB e não ancora o relacionamento (sem efeito de venda cruzada)",
                              "margem e venda cruzada por produto (dado interno)"),
    "comprar": ("BB pequeno num mercado concentrado em poucos", "existe carteira ou instituição à venda com escala relevante, a preço que paga o custo de capital, e a operação passa no CADE/BCB (ΔHHI simulado abaixo)",
                "lista de alvos (fatos relevantes na CVM/IPE) e preço"),
    "parceria": ("quem ganha é instituição de pagamento ou plataforma com a origem do cliente", "o parceiro tem a origem (fluxo, recebíveis, base) e o BB o funding e o capital: dividir a margem rende mais que disputar a origem",
                 "custo de captação do parceiro (beta, Análise 8) contra o do BB; contratos públicos de parceria"),
    "atacar canal": ("quem ganha é digital ou cooperativa", "o entrante ganha por canal (presença local, experiência, custo de servir), não por aceitar mais risco: o atraso dele não é maior que o do BB",
                     "vencidos por modalidade (Análise 5), pontos de atendimento (Unicad), custo de servir"),
    "atacar preço": ("BB mais caro que a mediana e perdendo", "a participação responde ao preço relativo neste produto (elasticidade negativa). A Análise 5 não achou essa relação entre instituições (Spearman −0,31 a +0,36): premissa sem apoio até aqui",
                     "taxa e volume concedido por instituição e mês (taxaJuros + volume), elasticidade por produto"),
    "atacar produto": ("quem ganha é banco privado grande ou médio", "o concorrente ganhou com desenho de produto (prazo, garantia, indexador, jornada) que o BB não tem",
                       "detalhe da modalidade (SCR.data por indexador e prazo)"),
}


def rate_position():
    """{(produto de taxa, ano): (percentil do BB, mediana do sistema, taxa do BB)} de out/a5_taxas_por_ano.csv."""
    out = {}
    path = c.OUT / "a5_taxas_por_ano.csv"
    if not path.exists():
        return out
    with open(path, encoding="utf-8") as fh:
        for r in csv.DictReader(fh):
            if r.get("bb_percentil"):
                out[(r["produto"], int(r["ano"]))] = (float(r["bb_percentil"]), float(r["mediana_sistema"]),
                                                      float(r["bb"]) if r.get("bb") else None)
    return out


def market_map(conc_rows, trend, rates, names, nat):
    by = {}
    for r in conc_rows:
        if r["unidade"] == "concorrente":
            by.setdefault(r["metric"], {})[r["period"]] = r
    tr = {t["metric"]: t for t in trend}
    out = []
    for m in CREDIT + REGIONS + FUNDING:
        d = by.get(m)
        if not d:
            continue
        p0, p1 = (201603 if 201603 in d else min(d)), max(d)
        a, b = d[p0], d[p1]
        mid = d.get(202312)
        sa, sb = a["_shares"], b["_shares"]
        gains = sorted(((sb.get(i, 0) - sa.get(i, 0), i) for i in set(sa) | set(sb)
                        if i != "bb" and not i.startswith("e")), reverse=True)
        g3 = sorted(((sb.get(i, 0) - mid["_shares"].get(i, 0), i) for i in set(mid["_shares"]) | set(sb)
                     if i != "bb" and not i.startswith("e")), reverse=True) if mid else []
        grp = {}
        for dd, i in gains[:5]:
            if dd > 0:
                grp[c.group_of(i)] = grp.get(c.group_of(i), 0) + dd
        top_group = max(grp, key=grp.get) if grp else ""
        s0, s1 = a["bb_pct"], b["bb_pct"]
        d3 = round(s1 - mid["bb_pct"], 2) if mid else None
        # preço do BB (percentil: 0 = o mais barato) no último ano com taxa
        price = ""
        if m in RATE_OF:
            for y in (2026, 2025):
                ps = [rates[(rp, y)][0] for rp in RATE_OF[m] if (rp, y) in rates]
                if ps:
                    price = round(sum(ps) / len(ps))
                    break
        price19 = ""
        if m in RATE_OF:
            ps = [rates[(rp, 2019)][0] for rp in RATE_OF[m] if (rp, 2019) in rates]
            price19 = round(sum(ps) / len(ps)) if ps else ""
        # maior concorrente privado fora dos 5 grandes (cooperativa e banco público não se compram): ΔHHI de uma compra
        big = {"bb", "itau", "bradesco", "santander", "caixa"}
        cand = sorted(((s, i) for i, s in sb.items() if i not in big and not i.startswith("e")
                       and c.group_of(i) not in ("Outros públicos", "Cooperativas") and i != "_demais"), reverse=True)
        tgt = cand[0] if cand else (0, "")
        dhhi = round(2 * 10000 * (s1 / 100) * tgt[0])
        # regra da jogada candidata (hipótese; ordem importa)
        leader = b["lider"]
        lead_id = max(sb, key=sb.get)
        if lead_id == "bb" and (d3 is None or d3 >= -0.5):
            move = "manter"
        elif s1 < 2 and s1 - s0 <= 0:
            move = "sair (rever presença)"
        elif s1 < 5 and (b["cr4_pct"] >= 65 or b["lider_pct"] >= 25) and tgt[0] >= 0.03:
            move = "comprar"
        elif top_group == "Digitais e IPs" and m in ("pj_recebiveis", "pj_capital_giro", "pj_micro", "pj_pequena"):
            move = "parceria"
        elif price != "" and price > 50 and (d3 or 0) < 0:
            move = "atacar preço"
        elif top_group in ("Digitais e IPs", "Cooperativas") and s1 - s0 < 0:
            move = "atacar canal"
        elif s1 - s0 < 0:
            move = "atacar produto"
        else:
            move = "manter"
        why, premise, data_needed = MOVES[move]
        sys_growth = ""
        if (p0, m) in nat and (p1, m) in nat and nat[(p0, m)]["total"]:
            yrs = (p1 // 100 - p0 // 100) + (p1 % 100 - p0 % 100) / 12
            sys_growth = round(100 * ((nat[(p1, m)]["total"] / nat[(p0, m)]["total"]) ** (1 / yrs) - 1), 1)
        out.append({
            "metric": m, "mercado": LABEL[m], "tipo": "crédito" if m in CREDIT else "crédito por região" if m in REGIONS else "captação",
            "sistema_fim_bi": b["sistema_bi"], "cresc_anual_sistema_pct": sys_growth,
            "periodo_ini": p0, "periodo_fim": p1, "lider": leader, "lider_pct": b["lider_pct"],
            "bb_pct_2016": s0, "bb_pct_2019": d.get(201912, {}).get("bb_pct", ""), "bb_pct_2023": mid["bb_pct"] if mid else "",
            "bb_pct_fim": s1, "bb_delta_10a_pp": round(s1 - s0, 2), "bb_delta_desde_2023_pp": d3,
            "bb_rank_2016": a["bb_rank"], "bb_rank_fim": b["bb_rank"],
            "ganhadores_10a": "; ".join(f"{names.get(i, i)} {100 * dd:+.1f}" for dd, i in gains[:3]),
            "ganhadores_desde_2023": "; ".join(f"{names.get(i, i)} {100 * dd:+.1f}" for dd, i in g3[:3]),
            "grupo_que_mais_ganhou": top_group,
            "hhi_ini": a["hhi"], "hhi_fim": b["hhi"], "tendencia_hhi_por_ano": tr[m]["tendencia_hhi_por_ano"],
            "faixa_bcb_fim": b["faixa_bcb"], "cr4_fim_pct": b["cr4_pct"],
            "bb_preco_percentil_2019": price19, "bb_preco_percentil_ultimo": price,
            "maior_fora_dos_5": names.get(tgt[1], tgt[1]), "maior_fora_dos_5_pct": round(100 * tgt[0], 2),
            "delta_hhi_se_bb_comprasse": dhhi,
            "jogada_candidata": move, "gatilho_da_regra": why, "premissa_que_teria_de_ser_verdade": premise,
            "dado_para_testar": data_needed,
            "confianca": confidence(m), "ressalvas": "; ".join(caveats(m)),
            "atravessa_perimetro_2025": a["level"] != b["level"]})
    return out


def caveats(m):
    """Ressalvas de dado que pesam na leitura do mercado (README, "Problemas de dado encontrados")."""
    out = []
    if m in ("pj_micro", "pj_pequena", "pj_media", "pj_grande"):
        out.append("porte PJ instável em 2025–2026: PagBank e Nubank mudam de faixa (README, problema 5)")
    elif m.startswith("pj_"):
        out.append("modalidades PJ com quedas estranhas no sistema em 2016–2019 (problema 3): prefira a variação desde 2023")
    if m == "pj_capital_giro":
        out.append("PagBank e Stone com antecipação de recebíveis no relatório desde 2024 (problema 6)")
    if m == "pf_veiculos":
        out.append("salto do BB em 12/2024 é provavelmente reclassificação (problema 2)")
    if m == "pf_cartao":
        out.append("cartão da Caixa cai de R$ 17,8 para 5,7 bi em 2025 (problema 7)")
    if m in FUNDING:
        out.append("Sicredi e Sicoob com dupla contagem no passivo: a parte das cooperativas está inflada")
    if m in CREDIT + REGIONS:
        out.append("perímetro do crédito muda de 1005 para 1009 em 03/2025")
    return out


def confidence(m):
    if m in ("pj_micro", "pj_pequena", "pj_media", "pj_grande"):
        return "baixa"
    if m.startswith("pj_") or m in ("pf_veiculos", "pf_cartao") or m in FUNDING:
        return "média"
    return "alta"


# ======================================================================================================

def benchmark_concentration(con, units, ent, types):
    """Nossa conta no formato do BCB (unidade = entidade do nível prudencial; todos os segmentos) contra o REB 2023."""
    rows = []
    for y in (2021, 2022, 2023):
        p = y * 100 + 12
        lv = 1004 if p <= 202306 else 1009
        for m in ("ativo_total", "carteira_credito"):
            r = k.concentration(entity_values(con, p, lv, m))
            ref = REB_T51[m][y]
            rows.append({"ano": y, "agregado": m, "fonte_ref": REB + ", Tabela 5.1", "nivel_a8": lv,
                         "ihhn_ref": ref[0], "ihhn_a8": round(r["hhi"] / 10000, 4), "rc4_ref_pct": ref[1],
                         "rc4_a8_pct": round(100 * r["cr4"], 1),
                         "nota": "A8 usa o ativo total; o BCB usa o ativo total ajustado (sem interfinanceiros)" if m == "ativo_total" else ""})
        # depósitos ajustados (BCB): depósitos − interfinanceiros + LCA + LCI + LF, aqui no nível 1005
        vals = {}
        for (pp, cd), v in ent.items():
            if pp == p:
                x = v.get("dep_a", 0) - v.get("dep_interf", 0) + v.get("lca", 0) + v.get("lci", 0) + v.get("lf", 0)
                if x > 0:
                    vals[cd] = x
        r = k.concentration(vals)
        ref = REB_T51["depositos_ajustados"][y]
        rows.append({"ano": y, "agregado": "depositos_ajustados", "fonte_ref": REB + ", Tabela 5.1", "nivel_a8": 1005,
                     "ihhn_ref": ref[0], "ihhn_a8": round(r["hhi"] / 10000, 4), "rc4_ref_pct": ref[1],
                     "rc4_a8_pct": round(100 * r["cr4"], 1), "nota": "A8 no conglomerado financeiro (1005), sem letras de câmbio"})
        for m, (lab, ref_y) in REB_T52.items():
            lv2 = 1005
            r = k.concentration(entity_values(con, p, lv2, m))
            ref = ref_y[y]
            rows.append({"ano": y, "agregado": m, "fonte_ref": REB + f", Tabela 5.2 ({lab})", "nivel_a8": lv2,
                         "en_ref": ref[0], "en_a8": round(r["en"], 1), "rc4_ref_pct": ref[1], "rc4_a8_pct": round(100 * r["cr4"], 1),
                         "nota": "BCB: SCR (doc. 3040), só recursos livres fora rural/habitação/infra, cartão PF + PJ; A8: IF.data por modalidade, PF ou PJ, livres + direcionados"})
    return rows


def main():
    names = c.names() | {"_singulares": "Cooperativas singulares (b3S, soma)", "_privados3": "Itaú + Bradesco + Santander",
                         "_sistema": "Sistema (todas as entidades 1005)"}
    con, reg = c.db(), c.registry()
    units = Units(con, reg)
    nat = c.load_national(set(CREDIT + REGIONS + FUNDING + OTHER))

    print("1. concentração")
    conc = national_concentration(con, units, nat, names)
    c.write_csv("a8_concentracao_nacional.csv", conc, [x for x in conc[0] if not x.startswith("_")])
    trend = concentration_trend(conc)
    c.write_csv("a8_concentracao_tendencia.csv", trend)
    est = estban_concentration(con, reg, names)
    c.write_csv("a8_concentracao_estban.csv", est)
    c.write_csv("a8_concentracao_estban_resumo.csv", estban_summary(est))

    print("2. Lerner e Boone (lendo o IF.data em cache)")
    periods = sorted(p for p in c.ifdata_index() if 201603 <= p <= 202606)
    ent = k.extract_entities(SPECS, periods, 1005)
    types = k.entity_types(con, 1005)
    c.write_csv("a8_benchmark_concentracao.csv", benchmark_concentration(con, units, ent, types))
    obs = annual_panel(ent, types)
    fits, sample = estimate_lerner(obs)
    seg_rows, inst_rows, coef_rows = lerner_tables(fits, sample, units, names)
    c.write_csv("a8_lerner_segmento.csv", seg_rows)
    c.write_csv("a8_lerner_instituicao.csv", inst_rows)
    c.write_csv("a8_translog_coeficientes.csv", coef_rows)
    bo = boone_rows(sample)
    c.write_csv("a8_boone.csv", bo)
    g = gfdd()
    c.write_csv("a8_benchmark_lerner_gfdd.csv", benchmark_lerner(g, seg_rows, bo, bank_asset_concentration(con, units, types)))

    print("3. beta de captação")
    cdi = c.cdi_monthly()
    q = funding_quarterly(ent, types, units, cdi)
    c.write_csv("a8_custo_captacao_trimestral.csv", q)
    cyc = cycle_betas(q, names)
    c.write_csv("a8_beta_ciclos.csv", cyc)
    dss = dss_regression(q, names) + dss_regression(q, names, drop_2020=False)
    c.write_csv("a8_beta_dss.csv", dss)
    c.write_csv("a8_benchmark_beta_dss.csv", dss_benchmark())

    print("4. mapa mercado × concorrente")
    mm = market_map(conc, trend, rate_position(), names, nat)
    c.write_csv("a8_mapa_mercados.csv", mm)
    c.write_json("a8_resumo.json", {
        "gerado_em": date.today().isoformat(), "faixas_bcb": k.BCB_THRESH, "faixas_cade": k.CADE_THRESH,
        "translog": {s: {"n": f["n"], "instituicoes": f["clusters"], "r2": round(f["r2"], 4)} for s, f in fits.items()},
        "jogadas": {mv: [r["mercado"] for r in mm if r["jogada_candidata"] == mv] for mv in MOVES}})


if __name__ == "__main__":
    main()
