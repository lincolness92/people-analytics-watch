"""Séries nacionais para o nowcast: SGS (BCB) e preços recebidos pelo produtor (Seab-PR/DERAL, via Ipeadata).

SGS (https://api.bcb.gov.br/dados/serie/bcdata.sgs.{n}/dados?formato=json):
  21148 inadimplência, crédito rural PF total (direcionados), %      21146 idem, rural PF com taxas de mercado
  21147 idem, rural PF com taxas reguladas                            21136 idem, rural PJ total
  4189  Selic acumulada no mês, anualizada base 252, %
Ipeadata (https://www.ipeadata.gov.br/api/odata4/ValoresSerie(SERCODIGO='...')), fonte primária Seab-PR/DERAL:
  DERAL12_PRSO12 soja, R$/60 kg   DERAL12_PRMI12 milho, R$/60 kg   DERAL12_PRBGO12 boi gordo, R$/arroba (PR)

Nomes conferidos no CKAN do BCB em 28/11/2026. Saída: data/rural/series_nacionais.csv (mês × série) e
data/rural/series_provenance.json.
"""

import csv
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import DATA, RAW, get_json, log, now_iso  # noqa: E402

SGS = {"21148": "inad_rural_pf", "21146": "inad_rural_pf_mercado", "21147": "inad_rural_pf_regulada",
       "21136": "inad_rural_pj", "4189": "selic"}
IPEA = {"DERAL12_PRSO12": "preco_soja", "DERAL12_PRMI12": "preco_milho", "DERAL12_PRBGO12": "preco_boi"}


def main():
    series, prov = {}, {"built_at": now_iso(), "series": {}}
    for code, name in SGS.items():
        url = f"https://api.bcb.gov.br/dados/serie/bcdata.sgs.{code}/dados?formato=json&dataInicial=01/01/2008"
        rows = get_json(url)
        (RAW / "series").mkdir(parents=True, exist_ok=True)
        (RAW / "series" / f"sgs_{code}.json").write_text(json.dumps(rows))
        s = {}
        for r in rows:
            d, m, y = r["data"].split("/")
            s[f"{y}-{m}"] = float(r["valor"])
        series[name] = s
        prov["series"][name] = {"source": f"BCB SGS {code}", "url": url, "fetched_at": now_iso(),
                                "first": min(s), "last": max(s)}
        log(f"[sgs] {code} {name}: {len(s)} meses, até {max(s)}")
    for code, name in IPEA.items():
        url = f"https://www.ipeadata.gov.br/api/odata4/ValoresSerie(SERCODIGO='{code}')"
        rows = get_json(url)["value"]
        (RAW / "series" / f"ipea_{code}.json").write_text(json.dumps(rows))
        s = {r["VALDATA"][:7]: float(r["VALVALOR"]) for r in rows if r.get("VALVALOR") is not None}
        series[name] = s
        prov["series"][name] = {"source": f"Seab-PR/DERAL via Ipeadata {code}", "url": url, "fetched_at": now_iso(),
                                "first": min(s), "last": max(s)}
        log(f"[ipea] {code} {name}: {len(s)} meses, até {max(s)}")
    months = sorted({m for s in series.values() for m in s if m >= "2008-01"})
    names = list(series)
    with open(DATA / "series_nacionais.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["mes"] + names)
        for m in months:
            w.writerow([m] + [series[n].get(m, "") for n in names])
    (DATA / "series_provenance.json").write_text(json.dumps(prov, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
