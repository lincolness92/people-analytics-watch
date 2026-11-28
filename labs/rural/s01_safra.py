"""Atena, premissa S01: a surpresa de safra (IBGE LSPA) antecipa a inadimplência rural da UF além do clima?

Pré-registro leve: labs/rural/resultados/a7_preregistro.json (28/11/2026 07:20 UTC, antes de baixar o LSPA).
Limiares do documento (docs/sources/atena-sensores-garantias.md §6): confirma se o erro cai ≥ 10% nos horizontes de
2 e 3 trimestres; refuta se cai < 3%. Comparação decisiva (B): PONTE+C+S contra a barra min(PONTE, PONTE+C).
Comparação literal do documento (A): CLIMA+S contra CLIMA (o M1 do nowcast.py). Ver o pré-registro.

Dado de safra: IBGE LSPA, SIDRA 6588, produção (t) por UF; total de cereais, leguminosas e oleaginosas (39428) e
soja (39443), 2006-09 a 2026-10. Cada mês da tabela é a estimativa feita naquele mês para o ano civil da colheita;
o caminho mensal muda de um mês para outro (não é uma série reescrita). O teste trata cada mês como a safra de dados
publicada na época. O IBGE não publica um arquivo de safras de dados que permita provar que nenhum mês antigo foi
corrigido depois; ver o texto da análise.

Calendário (o mesmo do nowcast.py): origem T = dia em que sai o SCR.data de T (fim de T+2). O LSPA do mês T+1 sai
por volta do dia 15 de T+2. Então a origem T usa o LSPA de T+1 e nada depois.

Variáveis de safra (Y = ano de T+1):
  rev_ano   = ln(LSPA[T+1] do ano Y ÷ LSPA[jan/Y])              total de grãos
  rev_ant   = ln(LSPA[dez/Y−1] ÷ LSPA[jan/Y−1])                 total de grãos (revisão final do ano anterior)
  var_esp   = ln(LSPA[T+1] do ano Y ÷ LSPA[dez/Y−1])            total de grãos (variação esperada contra o ano anterior)
  rev_soja  = ln(LSPA[T+1] ÷ LSPA[jan/Y]) da soja (0 se a UF não planta soja)

Uso: python3 labs/rural/s01_safra.py [--baixar] [--h 3,6,9,12]   (~10 min)
Saídas: labs/rural/resultados/s01_avaliacao.csv, s01_resultado.json, data/rural/lspa_uf_mensal.csv
"""

import argparse
import csv
import json
import math
import sys
from collections import defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from common import DATA, RAW, download, log, now_iso  # noqa: E402
import nowcast as nc  # noqa: E402

OUT = HERE / "resultados"
LSPA_URL = "https://apisidra.ibge.gov.br/values/t/6588/n3/all/v/35/p/all/c48/39428,39443"
LSPA_RAW = RAW / "lspa" / "lspa_6588_uf_prod.json"
UF_COD = {"11": "RO", "12": "AC", "13": "AM", "14": "RR", "15": "PA", "16": "AP", "17": "TO", "21": "MA", "22": "PI",
          "23": "CE", "24": "RN", "25": "PB", "26": "PE", "27": "AL", "28": "SE", "29": "BA", "31": "MG", "32": "ES",
          "33": "RJ", "35": "SP", "41": "PR", "42": "SC", "43": "RS", "50": "MS", "51": "MT", "52": "GO", "53": "DF"}
SAFRA_FEATS = ["rev_ano", "rev_ant", "var_esp", "rev_soja"]
CONFIRMA, REFUTA = 0.10, 0.03
DECISIVOS = (6, 9)
GRAOS = {"MT", "GO", "MS", "PR", "RS"}


def load_lspa(baixar=False):
    if baixar or not LSPA_RAW.exists():
        download(LSPA_URL, LSPA_RAW, use_head=False)
    rows = json.loads(LSPA_RAW.read_text())[1:]
    s = defaultdict(dict)  # (uf, produto) → {mes: t}
    for r in rows:
        uf = UF_COD.get(r["D1C"])
        p = r["D3C"]
        try:
            v = float(r["V"])
        except ValueError:
            continue
        s[(uf, "total" if r["D4C"] == "39428" else "soja")][f"{p[:4]}-{p[4:]}"] = v
    with open(DATA / "lspa_uf_mensal.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["uf", "produto", "mes_levantamento", "producao_t"])
        for (uf, prod) in sorted(s):
            for m in sorted(s[(uf, prod)]):
                w.writerow([uf, prod, m, s[(uf, prod)][m]])
    return s


def _lr(a, b):
    return math.log(a / b) if a and b and a > 0 and b > 0 else 0.0


def safra_feats(uf, T, lspa):
    t1 = nc.madd(T, 1)
    Y = int(t1[:4])
    tot, soj = lspa.get((uf, "total"), {}), lspa.get((uf, "soja"), {})
    jan, dez_ant, jan_ant = f"{Y}-01", f"{Y - 1}-12", f"{Y - 1}-01"
    if t1 not in tot:
        return None
    return {"rev_ano": _lr(tot.get(t1), tot.get(jan)), "rev_ant": _lr(tot.get(dez_ant), tot.get(jan_ant)),
            "var_esp": _lr(tot.get(t1), tot.get(dez_ant)), "rev_soja": _lr(soj.get(t1), soj.get(jan))}


def _corr(a, b):
    n = len(a)
    ma, mb = sum(a) / n, sum(b) / n
    va, vb = sum((x - ma) ** 2 for x in a), sum((z - mb) ** 2 for z in b)
    return sum((x - ma) * (z - mb) for x, z in zip(a, b)) / math.sqrt(va * vb) if va and vb else 0.0


def evaluate(h, panel, weights):
    origins = sorted({r["origin"] for r in panel if r["origin"] >= nc.FIRST_ORIGIN and r["y"] is not None})
    specs = {"CLIMA": (nc.BASE_FEATS, False), "CLIMA+S": (nc.BASE_FEATS + SAFRA_FEATS, False),
             "PONTE+C": (nc.BASE_FEATS, True), "PONTE+C+S": (nc.BASE_FEATS + SAFRA_FEATS, True),
             "PONTE+S": (SAFRA_FEATS, True)}  # PONTE+S: exploratório, fora do pré-registro
    lam = {k: 0.2 for k in specs}
    preds = []
    for i, T in enumerate(origins):
        train = [r for r in panel if r["dy"] is not None and r["target"] <= T]
        test = [r for r in panel if r["origin"] == T and r["y"] is not None]
        if len(train) < 300 or not test:
            continue
        for name, (feats, resid) in specs.items():
            tr = [r for r in train if all(k in r["f"] for k in feats) and (not resid or r["ponte"] is not None)]
            te = [r for r in test if all(k in r["f"] for k in feats) and (not resid or r["ponte"] is not None)]
            if resid:
                tr = [dict(r, dy=r["y"] - r["ponte"]) for r in tr]
            if len(tr) < 300 or not te:
                continue
            if i % 12 == 0:
                lam[name] = nc.choose_lambda(tr, feats)
            m = nc.Ridge().fit([[r["f"][k] for k in feats] for r in tr], [r["dy"] for r in tr], lam[name])
            for r in te:
                base = r["ponte"] if resid else r["yT"]
                preds.append({"origin": T, "uf": r["uf"], "model": name, "y": r["y"], "w": weights[r["uf"]].get(T, 0),
                              "pred": base + m.predict([r["f"][k] for k in feats])})
        for r in test:
            for name, pred in (("RW", r["yT"]), ("PONTE", r["ponte"]), ("SN", r["sn"])):
                if pred is not None:
                    preds.append({"origin": T, "uf": r["uf"], "model": name, "pred": pred, "y": r["y"],
                                  "w": weights[r["uf"]].get(T, 0)})
    # só origens × UF em que todos os modelos têm previsão (comparação pareada)
    by = defaultdict(set)
    for p in preds:
        by[(p["origin"], p["uf"])].add(p["model"])
    full = {k for k, v in by.items() if {"RW", "PONTE", *specs} <= v}
    return [p for p in preds if (p["origin"], p["uf"]) in full]


def leitura(red):
    if all(red[h] is not None and red[h] >= CONFIRMA for h in DECISIVOS):
        return "confirma"
    if all(red[h] is not None and red[h] < REFUTA for h in DECISIVOS):
        return "refuta"
    return "inconclusivo"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--h", default="3,6,9,12")
    ap.add_argument("--baixar", action="store_true")
    a = ap.parse_args()
    hs = [int(x) for x in a.h.split(",")]
    lspa = load_lspa(a.baixar)
    y, w = nc.load_target()
    nat, clima = nc.load_national(), nc.load_clima()
    ufs = sorted(y)
    months = sorted({m for u in y for m in y[u]})
    OUT.mkdir(exist_ok=True)
    periods = {"todas": lambda p: True, "2018-2024": lambda p: p["origin"] <= "2024-12",
               "2025-2026": lambda p: p["origin"] >= "2025-01",
               # exploratório, fora do pré-registro: as cinco maiores UFs de grãos
               "ufs_graos": lambda p: p["uf"] in GRAOS}
    rows_out, res = [], {"built_at": now_iso(), "preregistro": "labs/rural/resultados/a7_preregistro.json",
                         "lspa": {"url": LSPA_URL, "ultimo_mes": max(m for d in lspa.values() for m in d)},
                         "ultimo_mes_scr": months[-1], "horizontes": {}}
    sem_lspa = set()
    red_A, red_B = {}, {}
    for h in hs:
        panel = nc.build_panel(h, y, nat, clima, {}, ufs, months)
        for r in panel:
            sf = safra_feats(r["uf"], r["origin"], lspa)
            if sf is None:
                sem_lspa.add(r["uf"])
                sf = dict.fromkeys(SAFRA_FEATS, 0.0)
            r["f"].update(sf)
        preds = evaluate(h, panel, w)
        hr = {}
        for pname, sel in periods.items():
            mm = {}
            for model in ("RW", "SN", "PONTE", "CLIMA", "CLIMA+S", "PONTE+C", "PONTE+C+S", "PONTE+S"):
                for wtd in (False, True):
                    m = nc.metrics(preds, model, sel, wtd)
                    if m:
                        mm[(model, wtd)] = m
            rw = mm[("RW", False)]["mae"]
            bar_name = min(("PONTE", "PONTE+C"), key=lambda k: mm[(k, False)]["mae"])
            for (model, wtd), m in mm.items():
                d, ci = (None, None)
                if not wtd and model != "RW":
                    d, ci = nc.mae_diff_ci(preds, model, "RW", sel)
                rows_out.append([h, pname, model, "ponderado" if wtd else "simples", m["n"], round(m["mae"], 4),
                                 round(m["rmse"], 4), round(m["mae"] / mm[("RW", wtd)]["mae"], 4),
                                 "" if d is None else round(d, 4), "" if ci is None else round(ci[0], 4),
                                 "" if ci is None else round(ci[1], 4)])
            A = 1 - mm[("CLIMA+S", False)]["mae"] / mm[("CLIMA", False)]["mae"]
            B = 1 - mm[("PONTE+C+S", False)]["mae"] / mm[(bar_name, False)]["mae"]
            dA, ciA = nc.mae_diff_ci(preds, "CLIMA+S", "CLIMA", sel)
            dB, ciB = nc.mae_diff_ci(preds, "PONTE+C+S", bar_name, sel)
            hr[pname] = {"n": mm[("RW", False)]["n"], "mae_pp": {k[0]: round(v["mae"], 4) for k, v in mm.items() if not k[1]},
                         "mae_pp_ponderado": {k[0]: round(v["mae"], 4) for k, v in mm.items() if k[1]},
                         "mae_rw_pp": round(rw, 4), "barra": bar_name,
                         "reducao_A": round(A, 4), "dif_A_pp": dA and round(dA, 4),
                         "ic95_A": ciA and [round(ciA[0], 4), round(ciA[1], 4)],
                         "reducao_B": round(B, 4), "dif_B_pp": dB and round(dB, 4),
                         "ic95_B": ciB and [round(ciB[0], 4), round(ciB[1], 4)]}
            dX, ciX = nc.mae_diff_ci(preds, "PONTE+S", "PONTE", sel)
            hr[pname]["exploratorio_ponte_s"] = {
                "reducao_vs_ponte": round(1 - mm[("PONTE+S", False)]["mae"] / mm[("PONTE", False)]["mae"], 4),
                "dif_pp": dX and round(dX, 4), "ic95": ciX and [round(ciX[0], 4), round(ciX[1], 4)]}
            if pname == "todas":
                red_A[h], red_B[h] = A, B
                hr["ic_B_abaixo_de_zero"] = bool(ciB and ciB[1] < 0)
        # coeficientes padronizados do PONTE+C+S com toda a amostra (descritivo)
        feats = nc.BASE_FEATS + SAFRA_FEATS
        tr = [dict(r, dy=r["y"] - r["ponte"]) for r in panel
              if r["dy"] is not None and r["ponte"] is not None and all(k in r["f"] for k in feats)]
        lam = nc.choose_lambda(tr, feats)
        mdl = nc.Ridge().fit([[r["f"][k] for k in feats] for r in tr], [r["dy"] for r in tr], lam)
        # EXPLORATÓRIO: correlação na amostra toda entre a safra em T e o resíduo da ponte em T+h
        cor = {}
        for sub, us in (("todas", None), ("ufs_graos", GRAOS)):
            rr = [r for r in panel if r["y"] is not None and r["ponte"] is not None and (us is None or r["uf"] in us)]
            res_ = [r["y"] - r["ponte"] for r in rr]
            cor[sub] = {"n": len(rr), **{k: round(_corr([r["f"][k] for r in rr], res_), 3) for k in SAFRA_FEATS}}
        hr["exploratorio_correlacao_safra_residuo_ponte"] = cor
        hr["coef_padronizados_ponte_c_s"] = {k: round(b, 4) for k, b in zip(feats, mdl.beta) if k in SAFRA_FEATS}
        hr["lambda_amostra_toda"] = lam
        res["horizontes"][h] = hr
        log(f"[s01] h={h}: A={red_A[h]:+.3f}  B={red_B[h]:+.3f} (barra {hr['todas']['barra']}, IC B {hr['todas']['ic95_B']})")
    lB = leitura(red_B)
    if lB == "confirma" and not all(res["horizontes"][h]["ic_B_abaixo_de_zero"] for h in DECISIVOS):
        lB = "inconclusivo"
    res["reducao_A"] = {h: round(v, 4) for h, v in red_A.items()}
    res["reducao_B"] = {h: round(v, 4) for h, v in red_B.items()}
    res["leitura_A_literal"] = leitura(red_A)
    res["leitura_B_decisiva"] = lB
    res["ufs_sem_lspa_em_alguma_origem"] = sorted(sem_lspa)
    with open(OUT / "s01_avaliacao.csv", "w", newline="", encoding="utf-8") as f:
        wr = csv.writer(f)
        wr.writerow(["h", "periodo", "modelo", "media", "n", "mae_pp", "rmse_pp", "razao_mae_rw", "dif_mae_vs_rw_pp",
                     "ic95_inf", "ic95_sup"])
        wr.writerows(rows_out)
    (OUT / "s01_resultado.json").write_text(json.dumps(res, ensure_ascii=False, indent=1))
    log(f"[s01] leitura A (literal): {res['leitura_A_literal']}; B (decisiva): {lB}")


if __name__ == "__main__":
    main()
