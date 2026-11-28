"""IF.data: carteira rural e vencidos a partir de 15 dias, PF e PJ, por instituição e data-base (só leitura).

Lê os arquivos que a camada de instituições já baixou (data/ifs/raw/ifdata/, data/ifs/ifs.sqlite e
data/ifs/registry.json) e NÃO escreve nada lá. Os relatórios "Carteira de crédito ativa Pessoa Física/Jurídica -
modalidade e prazo de vencimento" trazem, para "Rural e Agroindustrial", as colunas "Vencido a Partir de 15 Dias" e
"Total" (vencido + a vencer). A coluna é achada pelo nome, como em src/pawatch/ifs/ifdata.py.

Perímetro: conglomerado financeiro (1005) até 2024-12 e prudencial (1009) desde 2025-03, como a série `credito` da
camada de instituições. Instituições: as do cadastro (registry.json, pela função membership), mais
`coop_todas` (todas as entidades TCB b3S e b3C, fora as do cadastro Sicredi/Sicoob → `coop_outras`) e `_sistema`.

Saídas:
- data/rural/ifdata_rural_inst.csv     período × instituição: saldo e vencido ≥15 d, PF e PJ (R$ milhões)
- data/rural/ifdata_rural_entidades.csv período × entidade (código no nível) para o corte transversal de P07
"""

import csv
import gzip
import json
import re
import sqlite3
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))
from pawatch.ifs.ifdata import parse_index_entry, walk_columns  # noqa: E402  (só leitura)
from pawatch.ifs.registry import membership  # noqa: E402

IFS = ROOT / "data" / "ifs"
OUT = ROOT / "data" / "rural"
COLS = {"pf": "Pessoa Física - modalidade e prazo", "pj": "Pessoa Jurídica - modalidade e prazo"}


def level_for(period):
    return 1009 if period >= 202503 else 1005


def load_index():
    out = {}
    for name in ("index_relatorios", "index_relatorios2025a2030"):
        p = IFS / "raw" / "ifdata" / f"{name}.json.gz"
        if p.exists():
            for e in json.loads(gzip.decompress(p.read_bytes())):
                out[e["dt"]] = parse_index_entry(e)
    return out


def resolve(entry, info, level):
    """{(pf|pj, total|venc15): (lid, a)} para o nível."""
    found = {}
    for t in entry["trels"]:
        if level not in [s["id"] for s in t.get("s", [])]:
            continue
        for k, pat in COLS.items():
            if pat not in t["n"]:
                continue
            for path, lid, a, _td in walk_columns(t["c"], info):
                if not path.startswith("Rural e Agroindustrial"):
                    continue
                if re.search(r"> Total$", path):
                    found[(k, "total")] = (lid, a)
                elif re.search(r"Vencido a Partir de 15", path, re.I):
                    found[(k, "venc15")] = (lid, a)
    return found


def main():
    reg = json.loads((IFS / "registry.json").read_text())
    con = sqlite3.connect(f"file:{IFS / 'ifs.sqlite'}?mode=ro", uri=True)
    index = load_index()
    periods = sorted(int(p.name) for p in (IFS / "raw" / "ifdata").iterdir() if p.name.isdigit())
    inst_rows, ent_rows = [], []
    for per in periods:
        lv = level_for(per)
        d = IFS / "raw" / "ifdata" / str(per)
        if per not in index or not (d / f"info{per}.json.gz").exists():
            continue
        info = {x["id"]: x for x in json.loads(gzip.decompress((d / f"info{per}.json.gz").read_bytes()))}
        cols = resolve(index[per], info, lv)
        if len(cols) < 4:
            print(f"{per}: colunas rurais não achadas ({cols})", file=sys.stderr)
            continue
        groups = {a for _, a in cols.values()}
        vals = {}
        for a in groups:
            f = d / f"dados{per}_{a}.json.gz"
            for r in json.loads(gzip.decompress(f.read_bytes())).get("values", []):
                vals[(a, r["e"])] = {x["i"]: x["v"] for x in r["v"]}
        ents = {c: (n, t) for c, n, t in con.execute(
            "SELECT code, name, tcb FROM ifdata_entities WHERE period=? AND level=?", (per, lv))}
        memb = membership(con, reg, per, lv)
        acc = defaultdict(lambda: defaultdict(float))
        for code, (name, tcb) in ents.items():
            row = {}
            for (k, m), (lid, a) in cols.items():
                v = vals.get((a, code), {}).get(lid)
                try:
                    row[f"{k}_{m}"] = float(v) if v not in (None, "") else 0.0
                except (TypeError, ValueError):
                    row[f"{k}_{m}"] = 0.0
            if not any(row.values()):
                continue
            inst = memb.get(code)
            targets = ["_sistema"]
            if inst:
                targets.append(inst)
            if (tcb or "").startswith("b3"):
                targets.append("coop_todas")
                if inst not in ("sicredi", "sicoob"):
                    targets.append("coop_outras")
            for t in targets:
                for k, v in row.items():
                    acc[t][k] += v
            ent_rows.append([per, lv, code, name, tcb, inst or ""] + [round(row[k] / 1e6, 3) for k in sorted(row)])
        for t, row in acc.items():
            inst_rows.append([per, lv, t] + [round(row[k] / 1e6, 3) for k in sorted(row)])
        print(f"{per} (nível {lv}): {len(acc)} instituições", file=sys.stderr)
    keys = sorted(f"{k}_{m}" for k in ("pf", "pj") for m in ("total", "venc15"))
    with open(OUT / "ifdata_rural_inst.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["periodo", "nivel", "inst"] + [k + "_rs_mi" for k in keys])
        w.writerows(sorted(inst_rows))
    with open(OUT / "ifdata_rural_entidades.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["periodo", "nivel", "codigo", "nome", "tcb", "inst"] + [k + "_rs_mi" for k in keys])
        w.writerows(sorted(ent_rows, key=lambda r: (r[0], r[2])))
    (OUT / "ifdata_rural_provenance.json").write_text(json.dumps({
        "source": "BCB IF.data, relatórios de carteira PF e PJ por modalidade e prazo (Rural e Agroindustrial)",
        "read_from": ["data/ifs/raw/ifdata/", "data/ifs/ifs.sqlite", "data/ifs/registry.json"],
        "base_url": "https://www3.bcb.gov.br/ifdata/rest/arquivos?nomeArquivo=...",
        "files": "proveniência completa por arquivo em data/ifs/ifdata/provenance.json",
        "levels": "1005 até 2024-12; 1009 desde 2025-03", "unit": "R$ milhões"}, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
