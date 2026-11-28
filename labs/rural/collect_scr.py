"""SCR.data (BCB), versão 2: carteira e inadimplência do crédito rural por UF × segmento × cliente × porte × origem.

Fonte: https://www.bcb.gov.br/pda/desig/scrdata_{ANO}.zip (CKAN `scr_data`, "Dados mensais (Versão 2)").
Metodologia: https://www.bcb.gov.br/pda/desig/metodologia_versao2.pdf. Um CSV por mês, ';', UTF-8 com BOM, decimal ','.

O SCR.data NÃO separa instituições: o segmento "Banco" junta BB, Caixa e todos os bancos; "Cooperativa" junta
todas as cooperativas singulares; "Desenvolvimento/Fomento" junta BNDES, bancos de desenvolvimento e agências.

Saídas:
- data/rural/raw/scr/scrdata_AAAA.zip (+ .meta.json)                       brutos, fora do git
- data/rural/raw/scr_rural_detail.csv.gz                                   rural, todas as dimensões menos CNAE/ocupação
- data/rural/scr_rural_uf_segmento.csv                                     mês × UF × segmento × cliente (pequeno, versionado)
- data/rural/scr_rural_provenance.json

Uso: python3 labs/rural/collect_scr.py [--years 2012-2026] [--no-download]
"""

import argparse
import csv
import gzip
import io
import json
import re
import sys
import zipfile
from collections import defaultdict
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import DATA, RAW, download, log, now_iso, num  # noqa: E402

URL = "https://www.bcb.gov.br/pda/desig/scrdata_{year}.zip"
RURAL = re.compile(r"rurai", re.I)
DIMS = ["data_base", "uf", "segmento", "cliente", "porte", "submodalidade", "origem", "indexador"]
VALS = ["numero_de_operacoes", "carteira_a_vencer", "vencido_de_15_ate_90_dias", "vencido_acima_de_90_dias",
        "carteira_vencida", "carteira_ativa", "carteira_inadimplencia", "ativo_problematico"]


def parse_zip(path, acc):
    z = zipfile.ZipFile(path)
    for info in sorted(z.infolist(), key=lambda i: i.filename):
        if not info.filename.endswith(".csv"):
            continue
        n = 0
        with z.open(info) as f:
            r = csv.reader(io.TextIOWrapper(f, encoding="utf-8-sig", newline=""), delimiter=";")
            h = next(r)
            ix = {k: h.index(k) for k in DIMS + VALS + ["modalidade"]}
            for p in r:
                if not RURAL.search(p[ix["modalidade"]]):
                    continue
                key = tuple(p[ix[k]] for k in DIMS)
                a = acc[key]
                for j, k in enumerate(VALS):
                    v = num(p[ix[k]])
                    if k == "numero_de_operacoes" and v < 0:  # -1 = sigilo (poucas operações)
                        v = 0
                    a[j] += v
                n += 1
        log(f"  {info.filename}: {n} linhas rurais")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--years", default=f"2012-{date.today().year}")
    ap.add_argument("--no-download", action="store_true")
    a = ap.parse_args()
    y0, y1 = (int(x) for x in a.years.split("-"))
    prov = {"source": "BCB SCR.data v2", "methodology": "https://www.bcb.gov.br/pda/desig/metodologia_versao2.pdf",
            "files": [], "built_at": now_iso()}
    acc = defaultdict(lambda: [0.0] * len(VALS))
    for y in range(y0, y1 + 1):
        path = RAW / "scr" / f"scrdata_{y}.zip"
        meta = None
        if not a.no_download:
            log(f"[scr] {y}: baixando (se mudou)")
            meta = download(URL.format(year=y), path)
            if meta is None:
                log(f"[scr] {y}: 404, pulando")
                continue
        if not path.exists():
            continue
        mp = path.with_name(path.name + ".meta.json")
        if meta is None:
            meta = json.loads(mp.read_text()) if mp.exists() else {"url": URL.format(year=y)}
        prov["files"].append(meta)
        log(f"[scr] {y}: lendo")
        parse_zip(path, acc)

    detail = RAW / "scr_rural_detail.csv.gz"
    with gzip.open(detail, "wt", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(DIMS + VALS)
        for k in sorted(acc):
            w.writerow(list(k) + [round(v, 2) for v in acc[k]])
    log(f"[scr] {len(acc)} células → {detail}")

    small = defaultdict(lambda: [0.0] * len(VALS))
    for k, v in acc.items():
        sk = (k[0][:7], k[1], k[2], k[3])
        s = small[sk]
        for j in range(len(VALS)):
            s[j] += v[j]
    out = DATA / "scr_rural_uf_segmento.csv"
    with open(out, "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["mes", "uf", "segmento", "cliente"] + VALS[1:])
        for k in sorted(small):
            w.writerow(list(k) + [round(v / 1e6, 3) for v in small[k][1:]])
    prov["outputs"] = {"scr_rural_uf_segmento.csv": "R$ milhões; soma das células rurais do SCR.data v2",
                       "raw/scr_rural_detail.csv.gz": "R$; todas as dimensões menos cnae_ocupacao"}
    (DATA / "scr_rural_provenance.json").write_text(json.dumps(prov, ensure_ascii=False, indent=1))
    log(f"[scr] {len(small)} linhas → {out}")


if __name__ == "__main__":
    main()
