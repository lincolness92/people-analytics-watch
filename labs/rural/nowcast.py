"""Protótipo de monitor: nowcast e previsão da inadimplência rural (>90 dias, SCR.data) por UF, com dado público.

Alvo: y[uf, t] = carteira inadimplente ÷ carteira ativa do crédito rural (todos os segmentos, PF + PJ), em %, do
SCR.data v2 (data/rural/scr_rural_uf_segmento.csv). Mensal, desde 2012.

Calendário de dados (o que existe no dia em que o SCR.data do mês T sai, no último dia útil de T+2):
  SCR.data até T | SGS 21148/21146/21136 até T+1 | preços DERAL até T+1 | NASA POWER até T+1 | Selic até T+1
  | SICOR (situação das operações por UF) até T+1.
Logo h = 1 e 2 são nowcasts (meses já fechados, ainda sem SCR.data) e h = 3..12 são previsões.
O modelo de cada h só usa variáveis datadas até T+1 (o painel é montado por data de origem T, nunca por data-alvo).

Modelos, estimados de novo em cada origem (janela que cresce; só linhas cujo alvo T'+h ≤ T):
  RW   último valor: ŷ = y[T]
  SN   sazonal ingênuo: ŷ = y[T+h−12]
  PONTE ponte nacional: ŷ = y[T] × SGS21148[T+1] ÷ SGS21148[T] (a UF acompanha o mês seguinte do país)
  M1   ridge (λ escolhido nos últimos 36 meses do treino) sobre Δ = y[T+h] − y[T], com: variação própria em 1, 3 e 12
       meses, nível, Δ sazonal do ano anterior, SGS rural PF (nível, Δ1 e Δ12 em T+1), SGS PF taxas de mercado (Δ12),
       SGS PJ (Δ12), preços de soja, milho e boi (Δ12 em log, T+1), chuva (z de 3 e 6 meses, T+1), Tmax (anomalia de
       3 meses), Selic (Δ12).
  M2   M1 + atraso do SICOR na UF (nível em T+1 e Δ12). AVISO: o SICOR é a safra de hoje dos dados (revisada);
       não há safras guardadas, então M2 pode ter vazamento de revisão no backtest.
Avaliação: origens de 2017-12 até o último T com alvo observado; MAE e RMSE em p.p.; razão contra RW; intervalo de
95% da diferença de MAE (M − RW) por bootstrap em blocos de 12 origens; recortes 2018–2024 e 2025–2026 (quebra da
Res. CMN 4.966/2021 em jan/2025).

Uso: python3 labs/rural/nowcast.py [--h 1,2,3,6,9,12]
Saídas: labs/rural/resultados/nowcast_avaliacao.csv, nowcast_previsao_uf.csv, nowcast_resumo.json
"""

import argparse
import csv
import gzip
import json
import math
import random
import sys
from collections import defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from common import DATA, RAW, log, now_iso  # noqa: E402

OUT = HERE / "resultados"
FIRST_ORIGIN = "2017-12"
SEED = 7


def madd(m, k):
    y, mo = int(m[:4]), int(m[5:7])
    t = y * 12 + (mo - 1) + k
    return f"{t // 12:04d}-{t % 12 + 1:02d}"


# ---------------------------------------------------------------- dados

def load_target():
    acc = defaultdict(lambda: [0.0, 0.0])
    with open(DATA / "scr_rural_uf_segmento.csv", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            a = acc[(r["uf"], r["mes"])]
            a[0] += float(r["carteira_ativa"])
            a[1] += float(r["carteira_inadimplencia"])
    y, w = defaultdict(dict), defaultdict(dict)
    for (uf, m), (b, d) in acc.items():
        if b > 0:
            y[uf][m] = 100 * d / b
            w[uf][m] = b
    return y, w


def load_national():
    s = defaultdict(dict)
    with open(DATA / "series_nacionais.csv", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            for k, v in r.items():
                if k != "mes" and v != "":
                    s[k][r["mes"]] = float(v)
    return s


def load_clima():
    c = defaultdict(dict)
    with open(DATA / "clima_uf_mensal.csv", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            c[r["uf"]][r["mes"]] = {k: float(r[k]) for k in ("chuva_z3", "chuva_z6", "tmax_anom") if r[k] != ""}
    return c


def load_sicor_uf():
    """Atraso (em atraso + inadimplente) ÷ saldo vivo, por UF e mês. Cache em data/rural/sicor_atraso_uf_mensal.csv."""
    small = DATA / "sicor_atraso_uf_mensal.csv"
    src = RAW / "sicor_saldos_uf.csv.gz"
    if src.exists() and (not small.exists() or small.stat().st_mtime < src.stat().st_mtime):
        acc = defaultdict(lambda: [0.0, 0.0])
        with gzip.open(src, "rt", encoding="utf-8") as f:
            for r in csv.DictReader(f):
                if r["situacao"] in ("liquidada", "excluida", "desclassificada", "outra") or r["categoria"] == "repasse_coop":
                    continue
                a = acc[(r["mes"], r["uf"])]
                a[0] += float(r["saldo"])
                if r["situacao"] in ("atraso", "inadimplente"):
                    a[1] += float(r["saldo"])
        with open(small, "w", newline="", encoding="utf-8") as f:
            wr = csv.writer(f)
            wr.writerow(["mes", "uf", "saldo_vivo_rs_mi", "atraso_pct"])
            for (m, uf), (b, d) in sorted(acc.items()):
                if b > 0:
                    wr.writerow([m, uf, round(b / 1e6, 2), round(100 * d / b, 4)])
    s = defaultdict(dict)
    if small.exists():
        with open(small, encoding="utf-8") as f:
            for r in csv.DictReader(f):
                s[r["uf"]][r["mes"]] = float(r["atraso_pct"])
    return s


# ---------------------------------------------------------------- variáveis (todas datadas até T+1)

BASE_FEATS = ["d1", "d3", "d12", "nivel", "dsaz", "sgs_pf", "sgs_pf_d1", "sgs_pf_d12", "sgs_merc_d12", "sgs_pj_d12",
              "soja_d12", "milho_d12", "boi_d12", "chuva_z3", "chuva_z6", "tmax3", "selic_d12"]
SICOR_FEATS = ["sicor", "sicor_d12"]


def features(uf, T, h, y, nat, clima, sicor):
    yu = y[uf]
    t1 = madd(T, 1)
    need = [T, madd(T, -1), madd(T, -3), madd(T, -12), madd(T, h - 12)]
    if any(m not in yu for m in need):
        return None
    f = {"d1": yu[T] - yu[madd(T, -1)], "d3": yu[T] - yu[madd(T, -3)], "d12": yu[T] - yu[madd(T, -12)], "nivel": yu[T]}
    f["dsaz"] = yu[madd(T, h - 12)] - yu[madd(T, -12)]

    def n(name, m):
        return nat.get(name, {}).get(m)
    try:
        f["sgs_pf"] = n("inad_rural_pf", t1)
        f["sgs_pf_d1"] = n("inad_rural_pf", t1) - n("inad_rural_pf", T)
        f["sgs_pf_d12"] = n("inad_rural_pf", t1) - n("inad_rural_pf", madd(t1, -12))
        f["sgs_merc_d12"] = n("inad_rural_pf_mercado", t1) - n("inad_rural_pf_mercado", madd(t1, -12))
        f["sgs_pj_d12"] = n("inad_rural_pj", t1) - n("inad_rural_pj", madd(t1, -12))
        for k, s in (("soja_d12", "preco_soja"), ("milho_d12", "preco_milho"), ("boi_d12", "preco_boi")):
            f[k] = math.log(n(s, t1) / n(s, madd(t1, -12)))
        f["selic_d12"] = n("selic", t1) - n("selic", madd(t1, -12))
    except (TypeError, ValueError, ZeroDivisionError):
        return None
    c = clima.get(uf, {})
    if t1 not in c or "chuva_z3" not in c[t1]:
        return None
    f["chuva_z3"], f["chuva_z6"] = c[t1]["chuva_z3"], c[t1]["chuva_z6"]
    tm = [c.get(madd(t1, -k), {}).get("tmax_anom") for k in range(3)]
    if any(v is None for v in tm):
        return None
    f["tmax3"] = sum(tm) / 3
    s = sicor.get(uf, {})
    if t1 in s and madd(t1, -12) in s:
        f["sicor"], f["sicor_d12"] = s[t1], s[t1] - s[madd(t1, -12)]
    return f


# ---------------------------------------------------------------- ridge em Python puro

def solve(A, b):
    n = len(A)
    M = [row[:] + [b[i]] for i, row in enumerate(A)]
    for i in range(n):
        p = max(range(i, n), key=lambda r: abs(M[r][i]))
        M[i], M[p] = M[p], M[i]
        if abs(M[i][i]) < 1e-12:
            continue
        for r in range(n):
            if r != i:
                fct = M[r][i] / M[i][i]
                if fct:
                    for k in range(i, n + 1):
                        M[r][k] -= fct * M[i][k]
    return [M[i][n] / M[i][i] if abs(M[i][i]) > 1e-12 else 0.0 for i in range(n)]


class Ridge:
    def fit(self, X, Y, lam):
        n, p = len(X), len(X[0])
        self.mu = [sum(r[j] for r in X) / n for j in range(p)]
        self.sd = [math.sqrt(sum((r[j] - self.mu[j]) ** 2 for r in X) / n) or 1.0 for j in range(p)]
        Z = [[(r[j] - self.mu[j]) / self.sd[j] for j in range(p)] for r in X]
        self.ym = sum(Y) / n
        A = [[sum(z[i] * z[j] for z in Z) + (lam * n if i == j else 0.0) for j in range(p)] for i in range(p)]
        b = [sum(z[i] * (yy - self.ym) for z, yy in zip(Z, Y)) for i in range(p)]
        self.beta = solve(A, b)
        return self

    def predict(self, x):
        return self.ym + sum(bj * (x[j] - self.mu[j]) / self.sd[j] for j, bj in enumerate(self.beta))


LAMBDAS = [0.001, 0.01, 0.05, 0.2, 1.0, 5.0]


def choose_lambda(rows, feats):
    """Último bloco de 36 meses-alvo do treino como validação."""
    months = sorted({r["target"] for r in rows})
    if len(months) < 60:
        return 0.2
    cut = months[-36]
    tr = [r for r in rows if r["target"] < cut and r["origin"] <= madd(cut, -r["h"])]
    va = [r for r in rows if r["target"] >= cut]
    best, bl = None, 0.2
    for lam in LAMBDAS:
        m = Ridge().fit([[r["f"][k] for k in feats] for r in tr], [r["dy"] for r in tr], lam)
        mae = sum(abs(m.predict([r["f"][k] for k in feats]) - r["dy"]) for r in va) / len(va)
        if best is None or mae < best:
            best, bl = mae, lam
    return bl


# ---------------------------------------------------------------- avaliação

def build_panel(h, y, nat, clima, sicor, ufs, months):
    rows = []
    for T in months:
        for uf in ufs:
            f = features(uf, T, h, y, nat, clima, sicor)
            if f is None:
                continue
            tgt = madd(T, h)
            rows.append({"uf": uf, "origin": T, "target": tgt, "h": h, "f": f, "yT": y[uf][T],
                         "y": y[uf].get(tgt), "dy": (y[uf][tgt] - y[uf][T]) if tgt in y[uf] else None,
                         "sn": y[uf].get(madd(T, h - 12)),
                         "ponte": y[uf][T] * f["sgs_pf"] / nat["inad_rural_pf"][T] if nat["inad_rural_pf"].get(T) else None})
    return rows


def evaluate(h, panel, weights):
    origins = sorted({r["origin"] for r in panel if r["origin"] >= FIRST_ORIGIN and r["y"] is not None})
    preds = []
    lam = {"M1": 0.2, "M2": 0.2}
    for i, T in enumerate(origins):
        train = [r for r in panel if r["dy"] is not None and r["target"] <= T]
        test = [r for r in panel if r["origin"] == T and r["y"] is not None]
        if len(train) < 300 or not test:
            continue
        for name, feats in (("M1", BASE_FEATS), ("M2", BASE_FEATS + SICOR_FEATS)):
            tr = [r for r in train if all(k in r["f"] for k in feats)]
            te = [r for r in test if all(k in r["f"] for k in feats)]
            if len(tr) < 300 or not te:
                continue
            if i % 12 == 0:
                lam[name] = choose_lambda(tr, feats)
            m = Ridge().fit([[r["f"][k] for k in feats] for r in tr], [r["dy"] for r in tr], lam[name])
            for r in te:
                preds.append({"origin": T, "uf": r["uf"], "model": name, "pred": r["yT"] + m.predict([r["f"][k] for k in feats]),
                              "y": r["y"], "w": weights[r["uf"]].get(T, 0)})
        for r in test:
            preds.append({"origin": T, "uf": r["uf"], "model": "RW", "pred": r["yT"], "y": r["y"], "w": weights[r["uf"]].get(T, 0)})
            if r["ponte"] is not None:
                preds.append({"origin": T, "uf": r["uf"], "model": "PONTE", "pred": r["ponte"], "y": r["y"], "w": weights[r["uf"]].get(T, 0)})
            if r["sn"] is not None:
                preds.append({"origin": T, "uf": r["uf"], "model": "SN", "pred": r["sn"], "y": r["y"], "w": weights[r["uf"]].get(T, 0)})
    return preds


def metrics(preds, model, sel=lambda p: True, weighted=False):
    ps = [p for p in preds if p["model"] == model and sel(p)]
    if not ps:
        return None
    if weighted:
        W = sum(p["w"] for p in ps)
        mae = sum(p["w"] * abs(p["pred"] - p["y"]) for p in ps) / W
        rmse = math.sqrt(sum(p["w"] * (p["pred"] - p["y"]) ** 2 for p in ps) / W)
    else:
        mae = sum(abs(p["pred"] - p["y"]) for p in ps) / len(ps)
        rmse = math.sqrt(sum((p["pred"] - p["y"]) ** 2 for p in ps) / len(ps))
    return {"n": len(ps), "mae": mae, "rmse": rmse}


def mae_diff_ci(preds, model, base="RW", sel=lambda p: True, block=12, reps=1000):
    rng = random.Random(SEED)
    key = {(p["origin"], p["uf"]): p for p in preds if p["model"] == base and sel(p)}
    by_o = defaultdict(list)
    for p in preds:
        if p["model"] == model and sel(p) and (p["origin"], p["uf"]) in key:
            by_o[p["origin"]].append(abs(p["pred"] - p["y"]) - abs(key[(p["origin"], p["uf"])]["pred"] - p["y"]))
    os_ = sorted(by_o)
    block = min(block, max(2, len(os_) // 6))  # recortes curtos (2025–2026): blocos menores
    if len(os_) < 2 * block:
        return None, None
    point = sum(sum(v) for v in by_o.values()) / sum(len(v) for v in by_o.values())
    bs = []
    for _ in range(reps):
        sample = []
        while len(sample) < len(os_):
            s = rng.randrange(0, len(os_) - block + 1)
            sample.extend(os_[s:s + block])
        vals = [d for o in sample[:len(os_)] for d in by_o[o]]
        bs.append(sum(vals) / len(vals))
    bs.sort()
    return point, (bs[int(0.025 * reps)], bs[int(0.975 * reps) - 1])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--h", default="1,2,3,6,9,12")
    a = ap.parse_args()
    hs = [int(x) for x in a.h.split(",")]
    y, w = load_target()
    nat, clima, sicor = load_national(), load_clima(), load_sicor_uf()
    ufs = sorted(y)
    months = sorted({m for u in y for m in y[u]})
    last = months[-1]
    OUT.mkdir(exist_ok=True)
    eval_rows, summary = [], {"built_at": now_iso(), "ultimo_mes_scr": last, "horizontes": {}}
    fcst_rows = []
    periods = {"todas": lambda p: True, "2018-2024": lambda p: p["origin"] <= "2024-12" and madd(p["origin"], 0) >= "2017-12",
               "2025-2026": lambda p: p["origin"] >= "2025-01"}
    for h in hs:
        panel = build_panel(h, y, nat, clima, sicor, ufs, months)
        preds = evaluate(h, panel, w)
        sh = {}
        for pname, sel in periods.items():
            selh = (lambda p, s=sel, hh=h: s(p))
            base = metrics(preds, "RW", selh)
            for model in ("RW", "SN", "PONTE", "M1", "M2"):
                for wtd in (False, True):
                    m = metrics(preds, model, selh, wtd)
                    b = metrics(preds, "RW", selh, wtd)
                    if not m:
                        continue
                    d, ci = (None, None) if model == "RW" or wtd else mae_diff_ci(preds, model, "RW", selh)
                    eval_rows.append([h, pname, model, "ponderado" if wtd else "simples", m["n"], round(m["mae"], 3),
                                      round(m["rmse"], 3), round(m["mae"] / b["mae"], 3),
                                      "" if d is None else round(d, 3), "" if ci is None else round(ci[0], 3),
                                      "" if ci is None else round(ci[1], 3)])
                    sh[f"{pname}|{model}|{'pond' if wtd else 'simples'}"] = {
                        "n": m["n"], "mae_pp": round(m["mae"], 3), "rmse_pp": round(m["rmse"], 3),
                        "razao_mae_rw": round(m["mae"] / b["mae"], 3),
                        "dif_mae_vs_rw_pp": None if d is None else round(d, 3),
                        "ic95_dif": None if ci is None else [round(ci[0], 3), round(ci[1], 3)]}
            _ = base
        summary["horizontes"][h] = sh
        # previsão a partir do último T, com banda dos erros fora da amostra recentes (origens ≥ 2021)
        best = min(("M1", "M2", "SN", "PONTE"), key=lambda mm: (metrics(preds, mm, periods["todas"]) or {"mae": 9e9})["mae"])
        rw_mae = metrics(preds, "RW", periods["todas"])["mae"]
        bm = metrics(preds, best, periods["todas"])["mae"]
        _, ci = mae_diff_ci(preds, best, "RW", periods["todas"])
        beats = bm < rw_mae and ci is not None and ci[1] < 0
        chosen = best if beats else "RW"
        errs = sorted(p["y"] - p["pred"] for p in preds if p["model"] == chosen and p["origin"] >= "2021-01")
        q = (lambda s, x: s[min(len(s) - 1, int(x * (len(s) - 1)))]) if errs else None
        feats = BASE_FEATS + (SICOR_FEATS if chosen == "M2" else [])
        if chosen in ("M1", "M2"):
            tr = [r for r in panel if r["dy"] is not None and all(k in r["f"] for k in feats)]
            lam = choose_lambda(tr, feats)
            model = Ridge().fit([[r["f"][k] for k in feats] for r in tr], [r["dy"] for r in tr], lam)
            summary["horizontes"][h]["coeficientes_padronizados"] = dict(zip(feats, [round(b, 4) for b in model.beta]))
        for uf in ufs:
            if last not in y[uf]:
                continue
            if chosen == "RW":
                pt = y[uf][last]
            elif chosen == "SN":
                pt = y[uf].get(madd(last, h - 12))
            elif chosen == "PONTE":
                pt = y[uf][last] * nat["inad_rural_pf"][madd(last, 1)] / nat["inad_rural_pf"][last]
            else:
                f = features(uf, last, h, y, nat, clima, sicor)
                if f is None or not all(k in f for k in feats):
                    continue
                pt = y[uf][last] + model.predict([f[k] for k in feats])
            if pt is None:
                continue
            fcst_rows.append([uf, last, madd(last, h), h, chosen, round(y[uf][last], 3), round(pt, 3),
                              round(pt + q(errs, 0.1), 3) if q else "", round(pt + q(errs, 0.9), 3) if q else "",
                              round(pt + q(errs, 0.025), 3) if q else "", round(pt + q(errs, 0.975), 3) if q else ""])
        summary["horizontes"][h]["modelo_usado_na_previsao"] = chosen
        summary["horizontes"][h]["bate_rw"] = bool(beats)
        log(f"[nowcast] h={h}: RW MAE {rw_mae:.3f}, melhor {best} {bm:.3f} (IC dif {ci}); previsão com {chosen}")
    with open(OUT / "nowcast_avaliacao.csv", "w", newline="", encoding="utf-8") as f:
        wr = csv.writer(f)
        wr.writerow(["h", "periodo", "modelo", "media", "n", "mae_pp", "rmse_pp", "razao_mae_rw", "dif_mae_vs_rw_pp",
                     "ic95_inf", "ic95_sup"])
        wr.writerows(eval_rows)
    with open(OUT / "nowcast_previsao_uf.csv", "w", newline="", encoding="utf-8") as f:
        wr = csv.writer(f)
        wr.writerow(["uf", "origem", "mes_alvo", "h", "modelo", "y_origem_pct", "previsao_pct", "p10", "p90", "p2_5", "p97_5"])
        wr.writerows(sorted(fcst_rows, key=lambda r: (r[0], r[3])))
    (OUT / "nowcast_resumo.json").write_text(json.dumps(summary, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
