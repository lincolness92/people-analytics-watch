"""Funções comuns às análises do BB. Só lê data/ifs (nunca escreve lá). Saída em estrategia/bb/analises/out/.

Fontes lidas:
- data/ifs/shares/national_ifdata.csv (participação nacional, IF.data/BCB)
- data/ifs/ifs.sqlite, aberta só para leitura (cadastro de entidades e valores de todas as entidades)
- data/ifs/raw/ifdata/ (JSON do IF.data em cache) para campos que a camada ainda não extrai
  (vencidos por modalidade, despesa de captação, compromissadas, letras financeiras)
- data/ifs/raw/estban/ (ZIP do ESTBAN em cache) para o detalhe por município, com as correções de estban_fixes
"""

import csv
import gzip
import json
import re
import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
IFS = ROOT / "data" / "ifs"
OUT = Path(__file__).resolve().parent / "out"
RAW = Path(__file__).resolve().parent / "raw"  # downloads deste estudo (fora do git)
sys.path.insert(0, str(ROOT / "src"))

from pawatch.ifs import ifdata as _ifd  # noqa: E402  (funções puras de leitura do JSON do IF.data)
from pawatch.ifs.registry import membership  # noqa: E402

COOP_RX = re.compile(r"SICOOB|BANCOOB|SICREDI", re.I)

# Grupos de concorrentes (classificação deste estudo, não do BCB)
GROUPS = {
    "bb": "BB",
    "caixa": "Caixa",
    "itau": "Privados grandes", "bradesco": "Privados grandes", "santander": "Privados grandes",
    "sicredi": "Cooperativas", "sicoob": "Cooperativas", "_outras_coops": "Cooperativas",
    "nubank": "Digitais e IPs", "mercado-pago": "Digitais e IPs", "inter": "Digitais e IPs", "c6": "Digitais e IPs",
    "picpay": "Digitais e IPs", "pagbank": "Digitais e IPs", "stone": "Digitais e IPs", "original": "Digitais e IPs",
    "cielo": "Digitais e IPs",
    "bnb": "Outros públicos", "basa": "Outros públicos", "banrisul": "Outros públicos", "banestes": "Outros públicos",
    "bndes": "Outros públicos",
}
GROUP_ORDER = ["BB", "Caixa", "Privados grandes", "Cooperativas", "Digitais e IPs", "Outros públicos",
               "Médios, nicho e estrangeiros", "Demais (fora do cadastro)"]
ANOMALOUS = {202412}  # data-base com totais anômalos (PJ e PF de alguns bancos); não usada como ponta de janela


def group_of(inst):
    if inst == "_demais":
        return "Demais (fora do cadastro)"
    return GROUPS.get(inst, "Médios, nicho e estrangeiros")


def db():
    return sqlite3.connect(f"file:{IFS / 'ifs.sqlite'}?mode=ro", uri=True)


def registry():
    return json.loads((IFS / "registry.json").read_text(encoding="utf-8"))


def names():
    return {i["id"]: i["name"] for i in registry()["institutions"]} | {
        "_demais": "Demais", "_outras_coops": "Outras cooperativas (fora Sicredi/Sicoob)"}


def load_national(metrics=None):
    """{(period, metric): {"total": R$, "level": nível, "v": {inst: R$}}} de national_ifdata.csv."""
    out = {}
    with open(IFS / "shares" / "national_ifdata.csv", encoding="utf-8") as fh:
        for r in csv.DictReader(fh):
            if metrics and r["metric"] not in metrics:
                continue
            k = (int(r["period"]), r["metric"])
            d = out.setdefault(k, {"total": float(r["system_total"]), "level": int(r["level"]), "v": {}})
            d["v"][r["inst_id"]] = float(r["value"])
    return out


def split_other_coops(nat, con=None):
    """Tira de `_demais` as cooperativas que não são Sicredi nem Sicoob (Cresol, Unicred, Ailos...), somando, na base
    local, as entidades com TCB b3S/b3C no mesmo nível. Altera `nat` no lugar (chave `_outras_coops`)."""
    con = con or db()
    for (p, m), d in nat.items():
        rows = con.execute(
            "SELECT e.name, v.value FROM ifdata_values v JOIN ifdata_entities e ON e.period=v.period AND "
            "e.level=v.level AND e.code=v.code WHERE v.period=? AND v.level=? AND v.metric=? AND e.tcb IN ('b3S','b3C')",
            (p, d["level"], m)).fetchall()
        oc = sum(v for n, v in rows if not COOP_RX.search(n or ""))
        if oc and "_demais" in d["v"]:
            oc = min(oc, d["v"]["_demais"])
            d["v"]["_demais"] -= oc
            d["v"]["_outras_coops"] = oc
    return nat


def shares(d):
    t = d["total"]
    return {i: v / t for i, v in d["v"].items()} if t else {}


def group_shares(d):
    g = {}
    for i, s in shares(d).items():
        g[group_of(i)] = g.get(group_of(i), 0.0) + s
    return g


# ---------- campos extras do IF.data, lidos do cache bruto ----------

def _gz_json(path):
    return json.loads(gzip.decompress(path.read_bytes()))


def ifdata_index():
    idx = {}
    for f in sorted((IFS / "raw" / "ifdata").glob("index_*.json.gz")):
        for p in _gz_json(f):
            idx[p["dt"]] = _ifd.parse_index_entry(p)
    return idx


def extract_extra(metric_specs, periods, level_for, con=None, reg=None):
    """Valores por instituição do cadastro e total do sistema para campos que a camada ainda não extrai.
    metric_specs = [{"id", "report" (regex), "column" (regex)}]; level_for(period) → nível do IF.data.
    Devolve {(period, metric): {"total": soma de todas as entidades, "level": nível, "v": {inst: valor}}}."""
    con, reg = con or db(), reg or registry()
    idx, out = ifdata_index(), {}
    for p in periods:
        e, lv = idx.get(p), level_for(p)
        base = IFS / "raw" / "ifdata" / str(p)
        if not e or not (base / f"cadastro{p}_{lv}.json.gz").exists():
            continue
        info = _gz_json(base / f"info{p}.json.gz")
        res = _ifd.resolve_metrics(e, info, metric_specs, [lv])
        groups = sorted({s["a"] for s in res.get(lv, {}).values()})
        dados = {a: _gz_json(base / f"dados{p}_{a}.json.gz") for a in groups if (base / f"dados{p}_{a}.json.gz").exists()}
        cad = {lv: _gz_json(base / f"cadastro{p}_{lv}.json.gz")}
        vals = _ifd.extract_values(dados, cad, res, {str(lv): "all"})
        mem = membership(con, reg, p, lv)
        for _, code, mid, v in vals:
            d = out.setdefault((p, mid), {"total": 0.0, "level": lv, "v": {}})
            d["total"] += v
            inst = mem.get(code, "_demais")
            d["v"][inst] = d["v"].get(inst, 0.0) + v
    return out


def credit_level(p):
    return 1005 if p <= 202412 else 1009


# ---------- downloads deste estudo (SGS, Olinda), com cache em raw/ ----------

def fetch_cached(url, name, refresh=False, pause=1.0):
    """GET educado com cache gzip em raw/<name>.gz e meta com URL e data. Devolve bytes."""
    import time
    import urllib.request
    from datetime import datetime, timezone
    path = RAW / f"{name}.gz"
    if path.exists() and not refresh:
        return gzip.decompress(path.read_bytes())
    req = urllib.request.Request(url, headers={"User-Agent": "analise-dados-publicos/0.1", "Accept": "application/json"})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                body = r.read()
            break
        except Exception:  # noqa: BLE001 (servidor público instável: espera e tenta de novo)
            if attempt == 3:
                raise
            time.sleep(5 * (attempt + 1))
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(gzip.compress(body))
    path.with_name(path.name + ".meta.json").write_text(json.dumps(
        {"url": url, "fetched_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat(), "bytes": len(body)}))
    time.sleep(pause)
    return body


def cdi_monthly(refresh=False):
    """CDI acumulado no mês (% a.m.), SGS 4391, desde 01/2015. {AAAAMM: taxa}."""
    url = ("https://api.bcb.gov.br/dados/serie/bcdata.sgs.4391/dados?formato=json"
           "&dataInicial=01/01/2015&dataFinal=31/12/2026")
    rows = json.loads(fetch_cached(url, "sgs_4391_cdi_mensal", refresh=refresh))
    return {int(r["data"][6:10]) * 100 + int(r["data"][3:5]): float(r["valor"]) for r in rows}


def cdi_compound(cdi, first, last):
    """CDI composto (fração) de AAAAMM `first` a `last`, inclusive; None se faltar mês."""
    acc, p = 1.0, first
    while p <= last:
        if p not in cdi:
            return None
        acc *= 1 + cdi[p] / 100
        p = p + 1 if p % 100 < 12 else (p // 100 + 1) * 100 + 1
    return acc - 1


# ---------- saída ----------

def write_csv(name, rows, fields=None):
    OUT.mkdir(parents=True, exist_ok=True)
    if not fields:
        fields = []
        for r in rows:
            fields += [k for k in r if k not in fields]
    with open(OUT / name, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=fields, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)
    print(f"  out/{name}: {len(rows)} linhas")


def write_json(name, obj):
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / name).write_text(json.dumps(obj, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"  out/{name}")


def pp(x):
    return round(100 * x, 2)


def fmt_period(p):
    return f"{p % 100:02d}/{p // 100}"
