"""R0 do conselho: monta o dossiê congelado (fatos numerados, com fonte e trecho) a partir de dados públicos.

Entradas, todas públicas e já no repositório ou baixáveis:
- data/ifs/shares/national_ifdata.csv (participações calculadas por código sobre o IF.data);
- data/ifs/pillar3/km1.csv (Pilar 3, KM1);
- data/ifs/shares/municipios_estban_latest.csv (ESTBAN por município);
- estrategia/bb/conselho/fatos_primarios.json (fatos lidos em documento primário: CVM IPE e SGS, com trecho);
- docs/sources/*.json (fontes disponíveis para teste).

Saída: estrategia/bb/conselho/R0/dossie.json, com versão e SHA-256 do conteúdo. Sem LLM.
Uso: python estrategia/bb/conselho/build_dossie.py
"""
import csv
import hashlib
import json
import pathlib
from collections import defaultdict

ROOT = pathlib.Path(__file__).resolve().parents[3]
HERE = pathlib.Path(__file__).resolve().parent
SHARES = ROOT / "data/ifs/shares"
INST = "bb"
BASE, LATEST = "201912", "202606"
MID = ["202212", "202512"]

# Métricas do IF.data que entram no dossiê, com rótulo em português.
METRICS = {
    "pf_total": "Crédito PF total", "pf_rural": "Crédito rural e agroindustrial PF", "pf_consignado": "Consignado",
    "pf_nao_consignado": "Crédito pessoal sem consignação", "pf_cartao": "Cartão de crédito PF",
    "pf_habitacao": "Habitação PF", "pf_veiculos": "Veículos PF",
    "pj_total": "Crédito PJ total", "pj_capital_giro": "PJ capital de giro", "pj_investimento": "PJ investimento",
    "pj_rural": "PJ rural e agroindustrial", "pj_comex": "PJ comércio exterior", "pj_micro": "PJ microempresa",
    "pj_pequena": "PJ pequena empresa", "pj_media": "PJ média empresa", "pj_grande": "PJ grande empresa",
    "credito_rural": "Crédito rural (PF+PJ)", "carteira_credito": "Carteira de crédito (balanço)",
    "depositos_vista": "Depósitos à vista", "depositos_poupanca": "Poupança", "depositos_prazo": "Depósitos a prazo",
    "depositos_total": "Depósitos totais", "lca": "LCA", "lci": "LCI", "captacoes": "Captações totais",
    "ativo_total": "Ativo total", "patrimonio_liquido": "Patrimônio líquido", "rendas_tarifas": "Rendas de tarifas",
    "agencias": "Agências", "clientes_credito": "Clientes com crédito",
    "reg_norte": "Crédito na região Norte", "reg_nordeste": "Crédito na região Nordeste",
    "reg_centro_oeste": "Crédito na região Centro-Oeste", "reg_sudeste": "Crédito na região Sudeste",
    "reg_sul": "Crédito na região Sul",
}
IFDATA_URL = "https://www3.bcb.gov.br/ifdata/"


def load_shares():
    rows = defaultdict(dict)  # (metric, inst) -> period -> row
    totals = {}
    for r in csv.DictReader(open(SHARES / "national_ifdata.csv", encoding="utf-8")):
        rows[(r["metric"], r["inst_id"])][r["period"]] = r
        totals[(r["metric"], r["period"])] = float(r["system_total"] or 0)
    return rows, totals


def pct(x):
    return round(100 * float(x), 2)


def share_facts(names):
    rows, totals = load_shares()
    facts = []
    for m, label in METRICS.items():
        s = rows.get((m, INST), {})
        if BASE not in s or LATEST not in s:
            continue
        path = {p: pct(s[p]["share"]) for p in [BASE, *MID, LATEST] if p in s and s[p]["share"]}
        gains = []
        for (mm, inst), ser in rows.items():
            if mm != m or inst in (INST, "_demais") or BASE not in ser or LATEST not in ser:
                continue
            try:
                gains.append((pct(ser[LATEST]["share"]) - pct(ser[BASE]["share"]), inst, pct(ser[BASE]["share"]), pct(ser[LATEST]["share"])))
            except ValueError:
                continue
        gains.sort(reverse=True)
        top = [{"instituicao": names.get(i, i), "de": b, "para": l, "delta_pp": round(d, 2)} for d, i, b, l in gains[:4] if d > 0]
        tot = totals.get((m, LATEST))
        unit = s[LATEST].get("unit") or ""
        facts.append({
            "tema": "participacao", "metrica": m,
            "afirmacao": f"Participação do BB em '{label}' no sistema: {path.get(BASE)}% (12/2019) → {path.get(LATEST)}% (06/2026)",
            "valor": {"serie_pct": path, "delta_pp": round(path[LATEST] - path[BASE], 2),
                      "total_sistema_06_2026": tot, "maiores_ganhos": top},
            "unidade": "% do saldo do sistema" if m not in ("agencias", "clientes_credito") else "% do total",
            "data": "2019-12 a 2026-06",
            "fonte": "IF.data (BCB), cálculo por código em data/ifs (python -m pawatch ifs shares)",
            "url": IFDATA_URL,
            "trecho": f"national_ifdata.csv, metric={m}, inst_id=bb; níveis: {s[BASE]['level']}→{s[LATEST]['level']}",
            "ressalvas": ["perímetro do crédito muda de conglomerado financeiro (1005) para prudencial (1009) em 03/2025",
                          "Cosif 2025 a partir de 03/2025 muda definições contábeis"],
            "confianca": "alta (cálculo reproduzível sobre fonte primária)",
        })
    return facts


def km1_facts():
    out = []
    want = {"km1_5": "Índice de capital principal (CET1/RWA)", "km1_7": "Índice de Basileia", "km1_14": "Razão de alavancagem"}
    by = defaultdict(dict)
    for r in csv.DictReader(open(ROOT / "data/ifs/pillar3/km1.csv", encoding="utf-8")):
        if r["inst_id"] == INST and r["field"] in want:
            by[r["field"]][r["period"]] = (float(r["value"]), r["source_url"])
    for f, label in want.items():
        ser = {p: v for p, (v, _) in sorted(by[f].items()) if p >= "202003"}
        if not ser:
            continue
        last = max(ser)
        out.append({"tema": "capital", "metrica": f,
                    "afirmacao": f"{label} do BB (Pilar 3, KM1): {ser[last]}% em {last[:4]}-{last[4:]}",
                    "valor": {"serie_pct": {p: ser[p] for p in list(ser)[-8:]}}, "unidade": "%",
                    "data": f"{last[:4]}-{last[4:]}", "fonte": "Pilar 3, KM1 (catálogo DASFN/BCB)", "url": by[f][last][1],
                    "trecho": f"km1.csv field={f}", "ressalvas": [], "confianca": "alta"})
    return out


def estban_facts():
    path = SHARES / "municipios_estban_latest.csv"
    if not path.exists():
        return []
    present = defaultdict(set)  # inst -> munis with credit > 0
    muni_insts = defaultdict(set)
    month = None
    for r in csv.DictReader(open(path, encoding="utf-8")):
        if r["metric"] != "credito_total":
            continue
        month = r["month"]
        if float(r["value"] or 0) > 0:
            present[r["inst_id"]].add(r["codmun_ibge"])
            muni_insts[r["codmun_ibge"]].add(r["inst_id"])
    sole = defaultdict(int)
    for mun, insts in muni_insts.items():
        if len(insts) == 1:
            sole[next(iter(insts))] += 1
    top = sorted(((len(v), k) for k, v in present.items() if not k.startswith("_")), reverse=True)[:6]
    return [{"tema": "capilaridade", "metrica": "municipios_estban",
             "afirmacao": f"ESTBAN {month}: o BB tem saldo de crédito em agência de {len(present[INST])} municípios e é o único banco com agência (com crédito) em {sole[INST]} deles",
             "valor": {"municipios_com_bb": len(present[INST]), "municipios_so_bb": sole[INST],
                       "municipios_com_alguma_agencia": len(muni_insts),
                       "presenca_por_instituicao": {k: n for n, k in top},
                       "unicos_por_instituicao": dict(sorted(sole.items(), key=lambda x: -x[1])[:6])},
             "unidade": "municípios", "data": f"{month[:4]}-{month[4:]}",
             "fonte": "ESTBAN por município (BCB), cálculo por código em data/ifs",
             "url": "https://www.bcb.gov.br/estatisticas/estatisticabancariamunicipios",
             "trecho": "municipios_estban_latest.csv, metric=credito_total, value>0",
             "ressalvas": ["ESTBAN só cobre bancos com agência: cooperativas e digitais não aparecem",
                           "contagem por presença de saldo, não por número de agências"],
             "confianca": "média-alta"}]


def sources_list():
    """Fontes de dados mapeadas para teste (só os mapas de finanças e de fatores externos)."""
    out = []
    for name in ("financas-instituicoes.json", "fatores-externos-e-propostas.json"):
        d = json.load(open(ROOT / "docs/sources" / name, encoding="utf-8"))
        for key, items in d.items():
            if not (isinstance(items, list) and items and isinstance(items[0], dict)):
                continue
            for it in items:
                label = it.get("name") or it.get("nome") or it.get("title") or it.get("id")
                if label:
                    out.append({"arquivo": name, "fonte": label, "id": it.get("id"),
                                "url": it.get("url") or it.get("endpoint") or it.get("access")})
    return out


def main():
    names = json.load(open(SHARES / "summary.json", encoding="utf-8")).get("names", {})
    prim = json.load(open(HERE / "fatos_primarios.json", encoding="utf-8"))
    facts = prim["fatos"] + km1_facts() + estban_facts() + share_facts(names)
    for i, f in enumerate(facts, 1):
        f["id"] = f"F-{i:03d}"
    body = {"fatos": facts, "fontes_disponiveis": sources_list(),
            "regras": ["só informação pública", "número fora do dossiê é 'sem fonte' e é descartado",
                       "fatos de imprensa têm confiança média-baixa e não sustentam decisão sozinhos"]}
    blob = json.dumps(body, ensure_ascii=False, sort_keys=True).encode()
    dossie = {"versao": prim["versao"], "sha256": hashlib.sha256(blob).hexdigest(),
              "aprovado_h1": False, "nota": "H1 (conferência humana de amostra) pendente", **body}
    out = HERE / "R0"
    out.mkdir(parents=True, exist_ok=True)
    (out / "dossie.json").write_text(json.dumps(dossie, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{len(facts)} fatos, {len(body['fontes_disponiveis'])} fontes; sha256 {dossie['sha256'][:12]}")


if __name__ == "__main__":
    main()
