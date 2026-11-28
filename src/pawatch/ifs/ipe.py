"""CVM IPE: fatos relevantes e comunicados ao mercado das companhias do cadastro mestre (metadados + link do PDF).

Fonte: dados.cvm.gov.br, `ipe_cia_aberta_<ano>.zip` (CSV latin-1, `;`). Incremental: o ano corrente é baixado a cada
execução (é regravado quase todo dia) e os anos anteriores só quando faltam no cache. A saída
data/ifs/ipe/ipe.csv guarda a versão mais recente de cada protocolo, em ordem de entrega (mais novo primeiro).
"""

import csv
import io
import zipfile
from datetime import date

from . import IFS, RAW, cached, config, log

OUT = IFS / "ipe"
FIELDS = ["inst_id", "codigo_cvm", "empresa", "cnpj", "data_referencia", "data_entrega", "categoria", "tipo",
          "especie", "assunto", "protocolo", "versao", "link_pdf", "source_url", "fetched_at"]


def parse(body):
    z = zipfile.ZipFile(io.BytesIO(body))
    name = next(n for n in z.namelist() if n.endswith(".csv"))
    return list(csv.DictReader(io.StringIO(z.read(name).decode("latin-1")), delimiter=";"))


def select(rows, cvm_to_inst, categories, source_url="", fetched_at=""):
    """Filtra pelas companhias do cadastro e pelas categorias; fica a maior versão de cada protocolo."""
    best = {}
    for r in rows:
        code = (r.get("Codigo_CVM") or "").lstrip("0")
        if code not in cvm_to_inst or r.get("Categoria") not in categories:
            continue
        key = r["Protocolo_Entrega"]
        ver = int(r.get("Versao") or 0)
        if key in best and int(best[key]["versao"] or 0) >= ver:
            continue
        best[key] = {"inst_id": cvm_to_inst[code], "codigo_cvm": code, "empresa": r["Nome_Companhia"].strip(),
                     "cnpj": r["CNPJ_Companhia"], "data_referencia": r["Data_Referencia"],
                     "data_entrega": r["Data_Entrega"], "categoria": r["Categoria"], "tipo": r.get("Tipo", ""),
                     "especie": r.get("Especie", ""), "assunto": (r.get("Assunto") or "").strip(),
                     "protocolo": key, "versao": ver, "link_pdf": r.get("Link_Download", ""),
                     "source_url": source_url, "fetched_at": fetched_at}
    return best


def collect(registry, since=None, refresh=False, log=log):
    cfg = config("ipe")
    cvm_to_inst = {}
    for inst in registry["institutions"]:
        for c in inst.get("cvm", []):
            cvm_to_inst.setdefault(c["code"], inst["id"])
    first = int(str(since)[:4]) if since else cfg["since_year"]
    this_year = date.today().year
    out_path = OUT / "ipe.csv"
    old = {}
    if out_path.exists():
        with open(out_path, encoding="utf-8") as fh:
            old = {r["protocolo"]: r for r in csv.DictReader(fh)}
    merged = dict(old)
    for year in range(first, this_year + 1):
        url = cfg["url"].format(year=year)
        try:
            body, at, _ = cached(RAW / "ipe" / f"ipe_{year}.zip.gz", url, refresh=refresh or year == this_year)
        except RuntimeError as e:
            log(f"[ipe] {year}: {e}")
            continue
        for k, v in select(parse(body), cvm_to_inst, set(cfg["categories"]), url, at).items():
            if k not in merged or int(merged[k]["versao"] or 0) <= v["versao"]:
                merged[k] = v
    rows = sorted(merged.values(), key=lambda r: (r["data_entrega"], r["protocolo"]), reverse=True)
    OUT.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=FIELDS)
        w.writeheader()
        w.writerows(rows)
    new = len(set(merged) - set(old))
    log(f"[ipe] {len(rows)} documentos ({new} novos) de {len(set(cvm_to_inst.values()))} instituições → data/ifs/ipe/ipe.csv")
    return new
