"""Clima por UF e mês a partir do NASA POWER (MERRA-2, grade de 0,5° × 0,625°), ponderado pelo crédito rural.

Fontes:
- NASA POWER, API mensal regional: https://power.larc.nasa.gov/api/temporal/monthly/regional (um parâmetro por
  chamada; caixa de até 10° × 10°). Parâmetros: PRECTOTCORR (chuva, mm/dia) e T2M_MAX (máxima do mês, °C).
- IBGE, malha municipal (qualidade mínima): https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR?...
  intrarregiao=municipio. O centróide (média dos vértices do maior anel) liga cada município ao ponto de grade
  mais próximo. A UF sai dos dois primeiros dígitos do código IBGE.
- Pesos: saldo rural do município no SICOR (data/rural/raw/sicor_saldos_municipio.csv.gz, primeiro mês-alvo); sem
  esse arquivo, pesos iguais por município.

Saída: data/rural/clima_uf_mensal.csv: mes, uf, chuva_mm_dia, chuva_z (desvio do mesmo mês em 1991–2015, em
desvios-padrão), chuva_z3 e chuva_z6 (médias móveis de 3 e 6 meses do z), tmax_c, tmax_anom (°C acima da média
1991–2015 do mês). O período-base termina antes de qualquer origem de previsão do backtest (2018+).

Uso: python3 labs/rural/collect_clima.py [--no-download]
"""

import argparse
import csv
import gzip
import json
import math
import sys
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import DATA, RAW, download, log, now_iso  # noqa: E402

POWER = ("https://power.larc.nasa.gov/api/temporal/monthly/regional?latitude-min={la0}&latitude-max={la1}"
         "&longitude-min={lo0}&longitude-max={lo1}&parameters={p}&community=AG&start=1991&end={end}&format=JSON")
MESH = ("https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR?formato=application/vnd.geo+json"
        "&intrarregiao=municipio&qualidade=minima")
UF = {"11": "RO", "12": "AC", "13": "AM", "14": "RR", "15": "PA", "16": "AP", "17": "TO", "21": "MA", "22": "PI",
      "23": "CE", "24": "RN", "25": "PB", "26": "PE", "27": "AL", "28": "SE", "29": "BA", "31": "MG", "32": "ES",
      "33": "RJ", "35": "SP", "41": "PR", "42": "SC", "43": "RS", "50": "MS", "51": "MT", "52": "GO", "53": "DF"}
PARAMS = ("PRECTOTCORR", "T2M_MAX")
CDIR = RAW / "clima"


def tiles():
    for la0 in (-34, -24, -14, -4):
        for lo0 in (-74, -64, -54, -44):
            yield la0, la0 + 10, lo0, lo0 + 10


def fetch(end_year):
    for p in PARAMS:
        for la0, la1, lo0, lo1 in tiles():
            path = CDIR / f"power_{p}_{la0}_{lo0}.json"
            download(POWER.format(la0=la0, la1=la1, lo0=lo0, lo1=lo1, p=p, end=end_year), path, refresh=True, use_head=False)
    download(MESH, CDIR / "ibge_municipios.geojson")


def grid():
    """{(lon, lat): {param: {AAAAMM: valor}}}"""
    g = defaultdict(dict)
    for p in PARAMS:
        for f in sorted(CDIR.glob(f"power_{p}_*.json")):
            d = json.loads(f.read_text())
            for ft in d.get("features", []):
                lon, lat = ft["geometry"]["coordinates"][:2]
                vals = ft["properties"]["parameter"][p]
                g[(round(lon, 3), round(lat, 3))][p] = {k: v for k, v in vals.items()
                                                        if not k.endswith("13") and v is not None and v > -900}
    return g


def centroids():
    d = json.loads((CDIR / "ibge_municipios.geojson").read_text())
    out = {}
    for ft in d["features"]:
        code = str(ft["properties"]["codarea"])
        geom = ft["geometry"]
        rings = [geom["coordinates"][0]] if geom["type"] == "Polygon" else [p[0] for p in geom["coordinates"]]
        ring = max(rings, key=len)
        out[code] = (sum(x for x, _ in ring) / len(ring), sum(y for _, y in ring) / len(ring))
    return out


def weights():
    p = RAW / "sicor_saldos_municipio.csv.gz"
    if not p.exists():
        return None, "iguais"
    w, first = defaultdict(float), None
    with gzip.open(p, "rt", encoding="utf-8") as f:
        r = csv.DictReader(f)
        for row in r:
            first = first or row["mes"]
            if row["mes"] == first and row["cod_ibge"]:
                w[row["cod_ibge"]] += float(row["saldo"])
    return w, f"saldo rural SICOR por município em {first}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-download", action="store_true")
    ap.add_argument("--end-year", type=int, default=2026)
    a = ap.parse_args()
    if not a.no_download:
        fetch(a.end_year)
    g = grid()
    pts = list(g)
    cents = centroids()
    w, wdesc = weights()
    nearest = {}
    for code, (x, y) in cents.items():
        best = min(pts, key=lambda q: (q[0] - x) ** 2 + (q[1] - y) ** 2)
        nearest[code] = best
    # séries por UF: média ponderada dos pontos de grade dos municípios
    uf_w = defaultdict(lambda: defaultdict(float))
    for code, pt in nearest.items():
        uf = UF.get(code[:2])
        if not uf:
            continue
        wt = (w.get(code, 0.0) if w is not None else 1.0)
        if w is not None and wt <= 0:
            continue
        uf_w[uf][pt] += wt
    months = sorted({m for v in g.values() for m in v.get("PRECTOTCORR", {})})
    rows = []
    for uf, pw in sorted(uf_w.items()):
        tot = sum(pw.values())
        ser = {}
        for p in PARAMS:
            s = {}
            for m in months:
                num = den = 0.0
                for pt, wt in pw.items():
                    v = g[pt].get(p, {}).get(m)
                    if v is not None:
                        num += wt * v
                        den += wt
                if den > 0.5 * tot:
                    s[m] = num / den
            ser[p] = s
        clim = {}
        for p in PARAMS:
            for mm in range(1, 13):
                base = [v for m, v in ser[p].items() if 1991 <= int(m[:4]) <= 2015 and int(m[4:]) == mm]
                mu = sum(base) / len(base)
                sd = math.sqrt(sum((v - mu) ** 2 for v in base) / max(1, len(base) - 1)) or 1.0
                clim[(p, mm)] = (mu, sd)
        z = {}
        for m in months:
            v = ser["PRECTOTCORR"].get(m)
            if v is not None:
                mu, sd = clim[("PRECTOTCORR", int(m[4:]))]
                z[m] = (v - mu) / sd
        for i, m in enumerate(months):
            if m not in z or int(m[:4]) < 2005:
                continue
            last3 = [z.get(x) for x in months[max(0, i - 2):i + 1]]
            last6 = [z.get(x) for x in months[max(0, i - 5):i + 1]]
            t = ser["T2M_MAX"].get(m)
            tmu = clim[("T2M_MAX", int(m[4:]))][0]
            rows.append([f"{m[:4]}-{m[4:]}", uf, round(ser["PRECTOTCORR"][m], 3), round(z[m], 3),
                         round(sum(x for x in last3 if x is not None) / 3, 3),
                         round(sum(x for x in last6 if x is not None) / 6, 3),
                         round(t, 2) if t is not None else "", round(t - tmu, 2) if t is not None else ""])
    with open(DATA / "clima_uf_mensal.csv", "w", newline="", encoding="utf-8") as f:
        wr = csv.writer(f)
        wr.writerow(["mes", "uf", "chuva_mm_dia", "chuva_z", "chuva_z3", "chuva_z6", "tmax_c", "tmax_anom"])
        wr.writerows(rows)
    (DATA / "clima_provenance.json").write_text(json.dumps({
        "built_at": now_iso(), "power_api": POWER.split("?")[0], "parameters": PARAMS, "mesh": MESH,
        "weights": wdesc, "baseline": "1991-2015, por mês do ano", "grid_points": len(pts),
        "files": [json.loads(m.read_text()) for m in sorted(CDIR.glob("*.meta.json"))]}, ensure_ascii=False, indent=1))
    log(f"[clima] {len(rows)} linhas; pesos: {wdesc}; {len(pts)} pontos de grade")


if __name__ == "__main__":
    main()
