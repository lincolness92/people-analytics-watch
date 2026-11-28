"""Análise 2: inadimplência rural ajustada ao mix — BB, cooperativas, Caixa e sistema (premissas P02, P03, P07, P42).

Só dado público. Lê as tabelas montadas pelos coletores de labs/rural/ (rodar antes: collect_ifdata_rural.py,
collect_scr.py, collect_sicor.py download/process). Não lê nem escreve nada em data/ifs/ além do que
collect_ifdata_rural.py já leu.

Três fontes, três definições de atraso (não se misturam sem aviso):
- IF.data: "vencido a partir de 15 dias" ÷ carteira rural (PF e PJ), por instituição, trimestral, 2016-03 a 2026-06.
  Perímetro 1005 até 2024-12 e 1009 desde 2025-03.
- SCR.data: vencido >90 dias e carteira inadimplente (saldo inteiro das operações com parcela >90 d) por UF ×
  segmento × porte × origem; mensal. Não separa instituições: "Banco" junta BB, Caixa e privados.
- SICOR (microdados): saldo e situação de cada operação rural, por instituição, UF, município, categoria do produtor,
  programa, fonte e produto; mensal. Atraso SICOR = saldo das operações "em atraso" (2) ou "inadimplente" (12),
  como a IF informou ao SICOR ÷ saldo vivo. Não é o >90 dias do SCR.

Método (04-proximos-passos.md, Análise 2):
(a) séries de atraso por instituição (IF.data e SICOR);
(b) inadimplência esperada de cada instituição dado o seu mix (células UF × categoria × programa × fonte), com as
    taxas do resto do sistema em cada célula (deixa a própria instituição de fora); resíduo = observado − esperado;
    intervalo de 95% por bootstrap de UFs (reamostra as 27 UFs com reposição, 1.000 vezes);
    também a diferença dentro da célula BB − cooperativas, ponderada pelo mix das cooperativas;
(c) concentração do aumento do atraso do BB por município (SICOR, 2023-12 → mês mais recente comum);
(d) P07: corte transversal do IF.data, ganho de participação 2019-12 → 2023-12 contra vencidos de 2026-06.

Uso: python3 estrategia/bb/analises/a2_inad_rural_mix.py
Saídas: data/rural/a2/*.csv e data/rural/a2/resultados.json (lidos por a2.md).
"""

import csv
import gzip
import json
import math
import random
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
D = ROOT / "data" / "rural"
RAW = D / "raw"
OUT = D / "a2"
SEED = 20261128
BOOT = 1000

DELINQ = {"atraso", "inadimplente"}                       # medida principal SICOR
PROBLEM = DELINQ | {"prejuizo", "divida_ativa", "prorrogada", "renegociada"}  # medida ampla
LIVE_EXCL = {"liquidada", "excluida", "desclassificada", "outra"}
COOP_PREFIX = "coop_"
REGIAO = {"RO": "N", "AC": "N", "AM": "N", "RR": "N", "PA": "N", "AP": "N", "TO": "N", "MA": "NE", "PI": "NE",
          "CE": "NE", "RN": "NE", "PB": "NE", "PE": "NE", "AL": "NE", "SE": "NE", "BA": "NE", "MG": "SE",
          "ES": "SE", "RJ": "SE", "SP": "SE", "PR": "S", "SC": "S", "RS": "S", "MS": "CO", "MT": "CO", "GO": "CO",
          "DF": "CO"}


def w_csv(name, header, rows):
    OUT.mkdir(parents=True, exist_ok=True)
    with open(OUT / name, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(header)
        w.writerows(rows)


def pct(x, nd=2):
    return None if x is None else round(100 * x, nd)


def quantiles(xs, qs=(0.025, 0.975)):
    s = sorted(xs)
    return [s[min(len(s) - 1, max(0, int(round(q * (len(s) - 1)))))] for q in qs]


# ---------------------------------------------------------------- (a) IF.data

def ifdata_series():
    rows, by = [], {}
    with open(D / "ifdata_rural_inst.csv", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            p, i = int(r["periodo"]), r["inst"]
            pf, pfv = float(r["pf_total_rs_mi"]), float(r["pf_venc15_rs_mi"])
            pj, pjv = float(r["pj_total_rs_mi"]), float(r["pj_venc15_rs_mi"])
            by[(p, i)] = (pf, pfv, pj, pjv)
    keep = ["bb", "caixa", "sicredi", "sicoob", "coop_outras", "coop_todas", "bradesco", "santander", "itau",
            "rabobank", "bnb", "basa", "banrisul", "_sistema"]
    for (p, i), (pf, pfv, pj, pjv) in sorted(by.items()):
        if i not in keep:
            continue
        rows.append([p, i, round(pf, 1), round(pj, 1), pct(pfv / pf) if pf else "", pct(pjv / pj) if pj else "",
                     pct((pfv + pjv) / (pf + pj)) if pf + pj else ""])
    w_csv("serie_ifdata_venc15.csv", ["periodo", "inst", "rural_pf_rs_mi", "rural_pj_rs_mi", "venc15_pf_pct",
                                      "venc15_pj_pct", "venc15_total_pct"], rows)
    return by


# ---------------------------------------------------------------- SICOR

def load_sicor_uf():
    """{mes: {(inst, uf, categ, prog, fonte): [saldo_vivo, saldo_atraso, saldo_problema]}}"""
    data = defaultdict(lambda: defaultdict(lambda: [0.0, 0.0, 0.0]))
    with gzip.open(RAW / "sicor_saldos_uf.csv.gz", "rt", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            st = r["situacao"]
            if st in LIVE_EXCL:
                continue
            if r["categoria"] == "repasse_coop":  # repasse a cooperativa: já aparece na ponta (dupla contagem)
                continue
            s = float(r["saldo"])
            a = data[r["mes"]][(r["inst"], r["uf"], r["categoria"], r["programa"], r["fonte"])]
            a[0] += s
            if st in DELINQ:
                a[1] += s
            if st in PROBLEM:
                a[2] += s
    return data


def inst_family(inst):
    if inst.startswith(COOP_PREFIX) or inst in ("sicredi", "sicoob"):
        return "cooperativas"
    return inst


def sicor_series(data):
    rows = []
    for mes in sorted(data):
        agg = defaultdict(lambda: [0.0, 0.0, 0.0])
        for (inst, *_), v in data[mes].items():
            for k in {inst, inst_family(inst), "_sistema"}:
                for j in range(3):
                    agg[k][j] += v[j]
            if inst in ("sicredi", "coop_sicredi"):
                for j in range(3):
                    agg["sicredi_sistema"][j] += v[j]
            if inst in ("sicoob", "coop_sicoob"):
                for j in range(3):
                    agg["sicoob_sistema"][j] += v[j]
        for k, (b, d1, d2) in sorted(agg.items()):
            if b > 0:
                rows.append([mes, k, round(b / 1e6, 1), pct(d1 / b, 3), pct(d2 / b, 3)])
    w_csv("serie_sicor_situacao.csv", ["mes", "inst", "saldo_vivo_rs_mi", "atraso_pct", "problema_amplo_pct"], rows)
    return rows


def cells_for(mes_data, group_of):
    """{grupo: {célula: [B, D1, D2]}} e {célula: total}"""
    g = defaultdict(lambda: defaultdict(lambda: [0.0, 0.0, 0.0]))
    for (inst, uf, cat, prog, fon), v in mes_data.items():
        grp = group_of(inst)
        c = (uf, cat, prog, fon)
        for j in range(3):
            g[grp][c][j] += v[j]
    tot = defaultdict(lambda: [0.0, 0.0, 0.0])
    for grp, cs in g.items():
        for c, v in cs.items():
            for j in range(3):
                tot[c][j] += v[j]
    return g, tot


def mix_adjust(g, tot, target, ufs_weight=None, j=1):
    """Observado, esperado (taxas do resto do sistema por célula) e resíduo do grupo `target`.
    ufs_weight: {uf: multiplicidade} para o bootstrap (None = todas uma vez)."""
    B = A = E = 0.0
    nomatch = 0.0
    for c, v in g[target].items():
        m = 1 if ufs_weight is None else ufs_weight.get(c[0], 0)
        if not m or v[0] <= 0:
            continue
        rest_b = tot[c][0] - v[0]
        rest_d = tot[c][j] - v[j]
        B += m * v[0]
        A += m * v[j]
        if rest_b > 0:
            E += m * v[0] * rest_d / rest_b
        else:  # célula sem mais ninguém: usa a taxa do resto do sistema na mesma UF e categoria (fallback)
            nomatch += m * v[0]
            E += m * v[j]
    if B <= 0:
        return None
    return A / B, E / B, (A - E) / B, nomatch / B


def within_gap(g, a, b, ufs_weight=None, j=1, weight_by="b"):
    """Σ_c w_c (r_a,c − r_b,c) nas células em que os dois grupos estão; w = mix de `weight_by`."""
    num = den = 0.0
    cov = 0.0
    tot_w = sum(v[0] * (1 if ufs_weight is None else ufs_weight.get(c[0], 0)) for c, v in g[b if weight_by == "b" else a].items())
    for c, vb in g[b].items():
        va = g[a].get(c)
        m = 1 if ufs_weight is None else ufs_weight.get(c[0], 0)
        if not m or not va or va[0] <= 0 or vb[0] <= 0:
            continue
        w = m * (vb[0] if weight_by == "b" else va[0])
        num += w * (va[j] / va[0] - vb[j] / vb[0])
        den += w
    if den <= 0:
        return None, 0
    return num / den, den / tot_w if tot_w else 0


def boot_ufs(ufs, rng):
    m = defaultdict(int)
    for _ in ufs:
        m[rng.choice(ufs)] += 1
    return m


GROUPS_MAIN = ["bb", "caixa", "cooperativas", "coop_sicredi", "coop_sicoob", "coop_cresol", "coop_outras",
               "outros_privados", "bnb", "bradesco", "santander", "rabobank"]


def group_main(inst):
    if inst in ("sicredi",):
        return "coop_sicredi"
    if inst in ("sicoob",):
        return "coop_sicoob"
    return inst


def mix_tables(data, months_boot, months_series):
    rng = random.Random(SEED)
    res_rows, gap_rows, out = [], [], {}
    for mes in sorted(set(months_series) | set(months_boot)):
        if mes not in data:
            continue
        g, tot = cells_for(data[mes], group_main)
        # grupo agregado "cooperativas" (todas)
        coop = defaultdict(lambda: [0.0, 0.0, 0.0])
        for grp in list(g):
            if grp.startswith(COOP_PREFIX):
                for c, v in g[grp].items():
                    for j in range(3):
                        coop[c][j] += v[j]
        g["cooperativas"] = coop
        ufs = sorted({c[0] for c in tot})
        for j, medida in ((1, "atraso"), (2, "problema_amplo")):
            for grp in GROUPS_MAIN:
                if grp not in g or not g[grp]:
                    continue
                if grp == "cooperativas":  # o "resto" das cooperativas exclui todas elas
                    tot_x = defaultdict(lambda: [0.0, 0.0, 0.0])
                    for c, v in tot.items():
                        tot_x[c] = list(v)
                    r0 = mix_adjust({"cooperativas": coop}, tot_x, "cooperativas", None, j)
                else:
                    r0 = mix_adjust(g, tot, grp, None, j)
                if r0 is None:
                    continue
                ci = ["", ""]
                if mes in months_boot:
                    bs = []
                    for _ in range(BOOT):
                        m = boot_ufs(ufs, rng)
                        r = mix_adjust(g, tot, grp, m, j)
                        if r:
                            bs.append(r[2])
                    ci = [pct(x) for x in quantiles(bs)]
                res_rows.append([mes, medida, grp, round(sum(v[0] for v in g[grp].values()) / 1e6, 1),
                                 pct(r0[0]), pct(r0[1]), pct(r0[2]), ci[0], ci[1], pct(r0[3], 1)])
                out[(mes, medida, grp)] = {"observado_pct": pct(r0[0]), "esperado_pct": pct(r0[1]),
                                           "residuo_pp": pct(r0[2]), "ic95_residuo_pp": ci if ci[0] != "" else None}
            # BB − cooperativas: diferença bruta, diferença de resíduos e diferença dentro da célula
            if "bb" in g and coop:
                rb, rc = mix_adjust(g, tot, "bb", None, j), mix_adjust(g, tot, "cooperativas", None, j)
                wg, cover = within_gap(g, "bb", "cooperativas", None, j, "b")
                wg_bb, cover_bb = within_gap(g, "bb", "cooperativas", None, j, "a")
                ci_raw = ci_res = ci_w = ["", ""]
                if mes in months_boot:
                    braw, bres, bw = [], [], []
                    for _ in range(BOOT):
                        m = boot_ufs(ufs, rng)
                        x, y = mix_adjust(g, tot, "bb", m, j), mix_adjust(g, tot, "cooperativas", m, j)
                        if x and y:
                            braw.append(x[0] - y[0])
                            bres.append(x[2] - y[2])
                        z, _ = within_gap(g, "bb", "cooperativas", m, j, "b")
                        if z is not None:
                            bw.append(z)
                    ci_raw, ci_res, ci_w = ([pct(x) for x in quantiles(v)] for v in (braw, bres, bw))
                gap_rows.append([mes, medida, pct(rb[0] - rc[0]), *ci_raw, pct(rb[2] - rc[2]), *ci_res,
                                 pct(wg), *ci_w, pct(cover, 1), pct(wg_bb), pct(cover_bb, 1)])
                out[(mes, medida, "bb_menos_coop")] = {
                    "bruta_pp": pct(rb[0] - rc[0]), "ic95_bruta": ci_raw if ci_raw[0] != "" else None,
                    "residuos_pp": pct(rb[2] - rc[2]), "ic95_residuos": ci_res if ci_res[0] != "" else None,
                    "dentro_celula_mix_coop_pp": pct(wg), "ic95_dentro": ci_w if ci_w[0] != "" else None,
                    "cobertura_mix_coop_pct": pct(cover, 1), "dentro_celula_mix_bb_pp": pct(wg_bb),
                    "cobertura_mix_bb_pct": pct(cover_bb, 1)}
    w_csv("mix_residuos_sicor.csv", ["mes", "medida", "grupo", "saldo_rs_mi", "observado_pct", "esperado_pct",
                                     "residuo_pp", "ic95_inf_pp", "ic95_sup_pp", "saldo_sem_par_pct"], res_rows)
    w_csv("mix_bb_menos_coop_sicor.csv", ["mes", "medida", "bruta_pp", "ic_inf", "ic_sup", "dif_residuos_pp", "ic_inf",
                                          "ic_sup", "dentro_celula_mix_coop_pp", "ic_inf", "ic_sup",
                                          "cobertura_mix_coop_pct", "dentro_celula_mix_bb_pp", "cobertura_mix_bb_pct"],
          gap_rows)
    return out


def decomp_bb_coop(data, mes):
    """De onde vem a diferença bruta BB − cooperativas: mix (região, porte, programa, fonte) ou taxa dentro da célula.
    Decomposição de Kitagawa: Δ = Σ (w_bb − w_coop)·(r_bb + r_coop)/2  [mix]  +  Σ (r_bb − r_coop)·(w_bb + w_coop)/2  [taxa],
    nas células comuns; o saldo fora das células comuns vai à parte."""
    g, _ = cells_for(data[mes], group_main)
    coop = defaultdict(lambda: [0.0, 0.0, 0.0])
    for grp in list(g):
        if grp.startswith(COOP_PREFIX):
            for c, v in g[grp].items():
                for j in range(3):
                    coop[c][j] += v[j]
    bb = g["bb"]
    Bb, Bc = sum(v[0] for v in bb.values()), sum(v[0] for v in coop.values())
    common = [c for c in bb if c in coop and bb[c][0] > 0 and coop[c][0] > 0]
    mix = rate = 0.0
    by_dim = defaultdict(lambda: [0.0, 0.0])
    for c in common:
        wb, wc = bb[c][0] / Bb, coop[c][0] / Bc
        rb, rc = bb[c][1] / bb[c][0], coop[c][1] / coop[c][0]
        mix += (wb - wc) * (rb + rc) / 2
        rate += (rb - rc) * (wb + wc) / 2
    out = {"mes": mes, "efeito_mix_pp": pct(mix), "efeito_taxa_pp": pct(rate),
           "saldo_bb_em_celulas_comuns_pct": pct(sum(bb[c][0] for c in common) / Bb, 1),
           "saldo_coop_em_celulas_comuns_pct": pct(sum(coop[c][0] for c in common) / Bc, 1)}
    # perfil de mix: participação por categoria, fonte, programa e região
    prof = []
    for name, idx, f in (("categoria", 1, None), ("programa", 2, None), ("fonte", 3, None), ("regiao", 0, REGIAO.get)):
        for grp, cs in (("bb", bb), ("cooperativas", coop)):
            tot_b = sum(v[0] for v in cs.values())
            acc = defaultdict(lambda: [0.0, 0.0])
            for c, v in cs.items():
                k = f(c[idx]) if f else c[idx]
                acc[k][0] += v[0]
                acc[k][1] += v[1]
            for k, (b, d) in sorted(acc.items()):
                prof.append([mes, name, k, grp, pct(b / tot_b, 1), pct(d / b) if b else ""])
    w_csv(f"perfil_mix_bb_coop_{mes}.csv", ["mes", "dimensao", "valor", "grupo", "parcela_saldo_pct", "atraso_pct"], prof)
    return out


def product_cells(months):
    """Robustez: mix por finalidade × atividade × produto × categoria × fonte (Brasil, sem UF), arquivo trimestral."""
    data = defaultdict(lambda: defaultdict(lambda: defaultdict(lambda: [0.0, 0.0, 0.0])))
    with gzip.open(RAW / "sicor_saldos_produto.csv.gz", "rt", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            if r["mes"] not in months or r["situacao"] in LIVE_EXCL or r["categoria"] == "repasse_coop":
                continue
            grp = "cooperativas" if inst_family(r["inst"]) == "cooperativas" else r["inst"]
            c = (r["finalidade"], r["atividade"], r["produto"], r["categoria"], r["fonte"])
            a = data[r["mes"]][grp][c]
            s = float(r["saldo"])
            a[0] += s
            a[1] += s if r["situacao"] in DELINQ else 0.0
            a[2] += s if r["situacao"] in PROBLEM else 0.0
    out, rows = {}, []
    for mes, g in sorted(data.items()):
        tot = defaultdict(lambda: [0.0, 0.0, 0.0])
        for cs in g.values():
            for c, v in cs.items():
                for j in range(3):
                    tot[c][j] += v[j]
        for grp in ("bb", "caixa", "cooperativas"):
            r = mix_adjust(g, tot, grp, None, 1)
            out[(mes, grp)] = {"observado_pct": pct(r[0]), "esperado_pct": pct(r[1]), "residuo_pp": pct(r[2])}
            rows.append([mes, grp, pct(r[0]), pct(r[1]), pct(r[2])])
        wg, cov = within_gap(g, "bb", "cooperativas", None, 1, "b")
        out[(mes, "bb_menos_coop_dentro_celula")] = {"pp": pct(wg), "cobertura_pct": pct(cov, 1)}
        rows.append([mes, "bb−coop dentro da célula (mix coop)", "", "", pct(wg)])
    w_csv("mix_produto_sicor.csv", ["mes", "grupo", "observado_pct", "esperado_pct", "residuo_pp"], rows)
    return out


# ---------------------------------------------------------------- SCR.data: segmento Banco × Cooperativa

def scr_segments(months):
    """Ajuste de mix no SCR.data (células UF × cliente × porte × origem × indexador), >90 dias e vencido ≥15 d."""
    data = defaultdict(lambda: defaultdict(lambda: [0.0, 0.0, 0.0]))
    with gzip.open(RAW / "scr_rural_detail.csv.gz", "rt", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            mes = r["data_base"][:7]
            if mes not in months:
                continue
            seg = r["segmento"]
            c = (r["uf"], r["cliente"], r["porte"], r["origem"], r["indexador"])
            a = data[mes][(seg, c)]
            a[0] += float(r["carteira_ativa"])
            a[1] += float(r["carteira_inadimplencia"])
            a[2] += float(r["carteira_vencida"])
    rows, out = [], {}
    for mes in sorted(data):
        g = defaultdict(lambda: defaultdict(lambda: [0.0, 0.0, 0.0]))
        tot = defaultdict(lambda: [0.0, 0.0, 0.0])
        for (seg, c), v in data[mes].items():
            for j in range(3):
                g[seg][c][j] += v[j]
                tot[c][j] += v[j]
        for j, medida in ((1, "inadimplencia_90d"), (2, "vencido_15d")):
            for seg in sorted(g):
                r = mix_adjust(g, tot, seg, None, j)
                if r and sum(v[0] for v in g[seg].values()) > 1e9:
                    rows.append([mes, medida, seg, round(sum(v[0] for v in g[seg].values()) / 1e6, 1),
                                 pct(r[0]), pct(r[1]), pct(r[2])])
                    out[(mes, medida, seg)] = {"observado_pct": pct(r[0]), "esperado_pct": pct(r[1]),
                                               "residuo_pp": pct(r[2])}
            wg, cover = within_gap(g, "Banco", "Cooperativa", None, j, "b")
            out[(mes, medida, "banco_menos_coop_dentro_celula")] = {"pp": pct(wg), "cobertura_pct": pct(cover, 1)}
            rows.append([mes, medida, "Banco−Cooperativa (dentro da célula, mix coop)", "", "", "", pct(wg)])
    w_csv("mix_scr_segmentos.csv", ["mes", "medida", "segmento", "carteira_rs_mi", "observado_pct", "esperado_pct",
                                    "residuo_pp"], rows)
    return out


def scr_system_profile(mes):
    """Sistema: inadimplência >90 d por porte e por origem (para P03: onde está o atraso)."""
    acc = defaultdict(lambda: [0.0, 0.0])
    with gzip.open(RAW / "scr_rural_detail.csv.gz", "rt", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            if r["data_base"][:7] != mes:
                continue
            for k in (("cliente", r["cliente"]), ("porte", r["cliente"] + " " + r["porte"]), ("origem", r["origem"]),
                      ("regiao", REGIAO.get(r["uf"], "?")), ("segmento", r["segmento"])):
                acc[k][0] += float(r["carteira_ativa"])
                acc[k][1] += float(r["carteira_inadimplencia"])
    rows = [[mes, k[0], k[1], round(b / 1e6, 1), pct(d / b) if b else ""] for k, (b, d) in sorted(acc.items())]
    w_csv(f"scr_sistema_perfil_{mes}.csv", ["mes", "dimensao", "valor", "carteira_rs_mi", "inadimplencia_90d_pct"], rows)
    return rows


# ---------------------------------------------------------------- P03: concentração municipal (SICOR)

def concentration(t0, t1, inst="bb"):
    p = RAW / "sicor_saldos_municipio.csv.gz"
    if not p.exists():
        return None
    mun = defaultdict(lambda: {t0: [0.0, 0.0], t1: [0.0, 0.0]})
    dims = defaultdict(lambda: {t0: [0.0, 0.0], t1: [0.0, 0.0]})
    with gzip.open(p, "rt", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            if r["inst"] != inst or r["mes"] not in (t0, t1) or r["situacao"] in LIVE_EXCL:
                continue
            if r["categoria"] == "repasse_coop":
                continue
            s = float(r["saldo"])
            d = s if r["situacao"] in DELINQ else 0.0
            key = r["cod_ibge"] or ("?" + r["uf"])
            mun[key][r["mes"]][0] += s
            mun[key][r["mes"]][1] += d
            for dim, val in (("fonte", r["fonte"]), ("categoria", r["categoria"]), ("produto", r["produto"]),
                             ("regiao", REGIAO.get(r["uf"], "?")), ("uf", r["uf"])):
                dims[(dim, val)][r["mes"]][0] += s
                dims[(dim, val)][r["mes"]][1] += d
    inc = {k: v[t1][1] - v[t0][1] for k, v in mun.items()}
    total_inc = sum(inc.values())
    alive = [k for k, v in mun.items() if v[t1][0] > 0 and not k.startswith("?")]
    ranked = sorted(alive, key=lambda k: -inc[k])
    n15 = max(1, int(round(0.15 * len(ranked))))
    top15 = ranked[:n15]
    share_inc_top15 = sum(inc[k] for k in top15) / total_inc if total_inc else None
    port = {k: mun[k][t1][0] for k in alive}
    share_port_top15 = sum(port[k] for k in top15) / sum(port.values())
    top_port = sorted(alive, key=lambda k: -port[k])[:n15]
    share_port_conc = sum(port[k] for k in top_port) / sum(port.values())
    # quantos municípios para 60% do aumento
    acc, n60 = 0.0, None
    for i, k in enumerate(ranked, 1):
        acc += inc[k]
        if n60 is None and total_inc and acc >= 0.6 * total_inc:
            n60 = i
    curve = []
    acc = 0.0
    for i, k in enumerate(ranked, 1):
        acc += inc[k]
        if i in {1, 5, 10, 25, 50, 100, 250, 500, 1000} or i == n15 or i == len(ranked):
            curve.append([i, round(100 * i / len(ranked), 2), round(acc / 1e6, 1), pct(acc / total_inc, 1) if total_inc else ""])
    w_csv(f"p03_curva_concentracao_{inst}_{t0}_{t1}.csv", ["n_municipios", "pct_municipios", "aumento_acum_rs_mi",
                                                           "pct_do_aumento"], curve)
    drow = []
    for (dim, val), v in sorted(dims.items()):
        di = v[t1][1] - v[t0][1]
        drow.append([dim, val, round(v[t0][0] / 1e6, 1), round(v[t1][0] / 1e6, 1), pct(v[t0][1] / v[t0][0]) if v[t0][0] else "",
                     pct(v[t1][1] / v[t1][0]) if v[t1][0] else "", round(di / 1e6, 1), pct(di / total_inc, 1) if total_inc else ""])
    w_csv(f"p03_aumento_por_dimensao_{inst}_{t0}_{t1}.csv",
          ["dimensao", "valor", "saldo_t0_rs_mi", "saldo_t1_rs_mi", "atraso_t0_pct", "atraso_t1_pct",
           "aumento_atraso_rs_mi", "pct_do_aumento"], drow)
    top_list = [[k, round(mun[k][t1][0] / 1e6, 1), round(inc[k] / 1e6, 1)] for k in ranked[:30]]
    w_csv(f"p03_top30_municipios_{inst}_{t0}_{t1}.csv", ["cod_ibge", "saldo_t1_rs_mi", "aumento_atraso_rs_mi"], top_list)
    by = {f"{d}:{v}": pct((x[t1][1] - x[t0][1]) / total_inc, 1) for (d, v), x in dims.items() if total_inc}
    # cobertura do município (o complemento do SICOR não traz município para parte das operações, e falta mais
    # nas operações em atraso: a curva municipal fica viesada e só vale como ilustração)
    sem = [k for k in mun if k.startswith("?")]
    cov = {"saldo_t1_com_municipio_pct": pct(1 - sum(mun[k][t1][0] for k in sem) / sum(v[t1][0] for v in mun.values()), 1),
           "atraso_t1_com_municipio_pct": pct(1 - sum(mun[k][t1][1] for k in sem) / max(1e-9, sum(v[t1][1] for v in mun.values())), 1),
           "aumento_com_municipio_pct": pct(sum(inc[k] for k in alive) / total_inc, 1) if total_inc else None}
    # concentração por UF (cobertura completa): as 4 UFs (15% de 27) com maior aumento
    ufs = {v: x for (d, v), x in dims.items() if d == "uf"}
    uinc = {u: x[t1][1] - x[t0][1] for u, x in ufs.items()}
    top4 = sorted(uinc, key=lambda u: -uinc[u])[:4]
    uf_conc = {"top4_ufs": top4, "pct_aumento_top4": pct(sum(uinc[u] for u in top4) / total_inc, 1),
               "pct_carteira_t1_top4": pct(sum(ufs[u][t1][0] for u in top4) / sum(x[t1][0] for x in ufs.values()), 1)}
    return {"t0": t0, "t1": t1, "inst": inst, "municipios_com_saldo_t1": len(alive),
            "atraso_t0_rs_mi": round(sum(v[t0][1] for v in mun.values()) / 1e6, 1),
            "atraso_t1_rs_mi": round(sum(v[t1][1] for v in mun.values()) / 1e6, 1),
            "aumento_rs_mi": round(total_inc / 1e6, 1), "n_top15pct": n15,
            "pct_aumento_top15pct_municipios": pct(share_inc_top15, 1),
            "pct_carteira_nesses_municipios": pct(share_port_top15, 1),
            "pct_carteira_15pct_maiores_carteiras": pct(share_port_conc, 1),
            "municipios_para_60pct_do_aumento": n60,
            "pct_municipios_para_60pct": pct(n60 / len(ranked), 1) if n60 else None,
            "cobertura_municipio": cov, "concentracao_uf": uf_conc, "pct_aumento_por": by}


# ---------------------------------------------------------------- P07: corte transversal IF.data

def spearman(x, y):
    def rank(v):
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
    return pearson(rank(x), rank(y))


def pearson(x, y):
    n = len(x)
    mx, my = sum(x) / n, sum(y) / n
    sxy = sum((a - mx) * (b - my) for a, b in zip(x, y))
    sx = math.sqrt(sum((a - mx) ** 2 for a in x))
    sy = math.sqrt(sum((b - my) ** 2 for b in y))
    return sxy / (sx * sy) if sx and sy else float("nan")


def p07(min_rs_mi=100.0, top_n=30):
    ent = defaultdict(lambda: defaultdict(lambda: [0.0, 0.0]))
    sys_tot = {}
    with open(D / "ifdata_rural_entidades.csv", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            p = int(r["periodo"])
            if p not in (201912, 202312, 202606):
                continue
            key = r["inst"] or f"cod{r['codigo']}"
            a = ent[key][p]
            a[0] += float(r["pf_total_rs_mi"])
            a[1] += float(r["pf_venc15_rs_mi"])
    for p in (201912, 202312, 202606):
        sys_tot[p] = sum(v[p][0] for v in ent.values())
    names = {}
    with open(D / "ifdata_rural_entidades.csv", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            names.setdefault(r["inst"] or f"cod{r['codigo']}", r["nome"])
    rows = []
    for k, v in ent.items():
        if v[201912][0] <= 0 or v[202312][0] < min_rs_mi or v[202606][0] <= 0:
            continue
        sh0, sh1 = v[201912][0] / sys_tot[201912], v[202312][0] / sys_tot[202312]
        rows.append({"key": k, "nome": names.get(k, k), "pf_2019": v[201912][0], "pf_2023": v[202312][0],
                     "dshare_pp": 100 * (sh1 - sh0), "cresc_log": math.log(sh1 / sh0),
                     "venc15_2606": 100 * v[202606][1] / v[202606][0]})
    rng = random.Random(SEED)

    def stats(rs, xk):
        x, y = [r[xk] for r in rs], [r["venc15_2606"] for r in rs]
        rho, r = spearman(x, y), pearson(x, y)
        bs = []
        for _ in range(BOOT):
            s = [rs[rng.randrange(len(rs))] for _ in rs]
            bs.append(spearman([q[xk] for q in s], [q["venc15_2606"] for q in s]))
        perm = 0
        for _ in range(BOOT):
            yy = y[:]
            rng.shuffle(yy)
            if abs(spearman(x, yy)) >= abs(rho):
                perm += 1
        return {"n": len(rs), "spearman": round(rho, 3), "ic95_spearman": [round(q, 3) for q in quantiles(bs)],
                "p_permutacao": round((perm + 1) / (BOOT + 1), 4), "pearson": round(r, 3)}
    big = sorted(rows, key=lambda r: -r["pf_2023"])[:top_n]
    out = {"todas_acima_rs_mi": min_rs_mi,
           "todas_dshare": stats(rows, "dshare_pp"), "todas_cresc": stats(rows, "cresc_log"),
           f"top{top_n}_dshare": stats(big, "dshare_pp"), f"top{top_n}_cresc": stats(big, "cresc_log")}
    w_csv("p07_corte_transversal.csv", ["chave", "nome", "rural_pf_2019_rs_mi", "rural_pf_2023_rs_mi",
                                        "dshare_pp_2019_2023", "cresc_log_share", "venc15_pf_2606_pct"],
          [[r["key"], r["nome"][:60], round(r["pf_2019"], 1), round(r["pf_2023"], 1), round(r["dshare_pp"], 3),
            round(r["cresc_log"], 3), round(r["venc15_2606"], 2)] for r in sorted(rows, key=lambda r: -r["pf_2023"])])
    return out


# ---------------------------------------------------------------- validação SICOR × IF.data

def validate(sicor_rows, ifd):
    """Saldo SICOR (vivo) contra carteira rural do IF.data; atraso SICOR contra vencido ≥15 d do IF.data."""
    s = {(r[0], r[1]): (r[2], r[3]) for r in sicor_rows}
    out = []
    mapping = {"bb": "bb", "caixa": "caixa", "sicredi_sistema": "sicredi", "sicoob_sistema": "sicoob",
               "_sistema": "_sistema", "cooperativas": "coop_todas"}
    for p in (201912, 202112, 202312, 202412, 202506, 202512, 202606):
        mes = f"{str(p)[:4]}-{str(p)[4:]}"
        for si, ii in mapping.items():
            if (mes, si) in s and (p, ii) in ifd:
                pf, pfv, pj, pjv = ifd[(p, ii)]
                out.append([mes, si, s[(mes, si)][0], round(pf + pj, 1), pct(s[(mes, si)][0] / (pf + pj), 1),
                            s[(mes, si)][1], pct((pfv + pjv) / (pf + pj))])
    w_csv("validacao_sicor_ifdata.csv", ["mes", "inst", "saldo_sicor_rs_mi", "carteira_ifdata_rs_mi",
                                         "cobertura_pct", "atraso_sicor_pct", "venc15_ifdata_pct"], out)
    return out


def main():
    res = {}
    ifd = ifdata_series()
    data = load_sicor_uf()
    months = sorted(data)
    latest = months[-1]
    sicor_rows = sicor_series(data)
    res["validacao"] = validate(sicor_rows, ifd)
    junes = [m for m in months if m.endswith("-06") and m >= "2015-06"]
    boot = ["2023-12", "2026-06", "2026-09"]
    mix = mix_tables(data, [m for m in boot if m in data], junes + [m for m in boot if m in data] + [latest])
    res["mix"] = {"|".join(k): v for k, v in mix.items()}
    res["decomposicao"] = {m: decomp_bb_coop(data, m) for m in ("2023-12", "2026-06", "2026-09") if m in data}
    res["mix_produto"] = {"|".join(k): v for k, v in product_cells({"2023-12", "2026-06", "2026-09"}).items()}
    scr_months = {"2019-06", "2023-06", "2023-12", "2024-12", "2025-06", "2026-06", "2026-09"}
    res["scr"] = {"|".join(k): v for k, v in scr_segments(scr_months).items()}
    scr_system_profile("2026-09")
    t1 = "2026-09"
    res["p03"] = concentration("2023-12", t1, "bb")
    res["p03_coop_sicredi"] = concentration("2023-12", t1, "coop_sicredi")
    res["p07"] = p07()
    res["sicor_ultimo_mes"] = latest
    (OUT / "resultados.json").write_text(json.dumps(res, ensure_ascii=False, indent=1, default=str))
    print(json.dumps({k: res[k] for k in ("decomposicao", "p03", "p07")}, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
