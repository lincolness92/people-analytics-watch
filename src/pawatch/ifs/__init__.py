"""Camada genérica de dados públicos sobre instituições financeiras (cadastro mestre, coletores, participação de mercado).

Tudo é dirigido por configuração em config/ifs/ e grava em data/ifs/:

- registry.json            cadastro mestre (instituições e conglomerados, com as chaves de cada fonte)
- ifdata/, estban/, pillar3/, ipe/   tabelas derivadas, versionadas (pequenas), com proveniência
- shares/                  séries de participação de mercado e o resumo (summary.json)
- raw/                     arquivos baixados, comprimidos (fora do git: .gitignore)
- ifs.sqlite               base local completa, refeita a partir de raw/ (fora do git)

Só stdlib (csv, json, sqlite3, zipfile, gzip). Chamadas sequenciais, com pausa entre elas, pelo http.py do projeto.
O dicionário de dados está em docs/ifs-dados.md.
"""

import gzip
import json
import socket
import sqlite3
import sys
import time
from datetime import datetime, timezone

from .. import DATA, ROOT
from ..http import get_bytes

IFS = DATA / "ifs"
RAW = IFS / "raw"
DB_PATH = IFS / "ifs.sqlite"
CONFIG = ROOT / "config" / "ifs"
PAUSE = 1.0  # segundos entre chamadas ao mesmo servidor (são todos servidores públicos)


def log(msg):
    print(msg, file=sys.stderr, flush=True)


def now_iso():
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def config(name):
    return json.loads((CONFIG / f"{name}.json").read_text(encoding="utf-8"))


def _ipv4_first(*args, **kwargs):
    return sorted(_getaddrinfo(*args, **kwargs), key=lambda r: r[0] != socket.AF_INET)


_getaddrinfo = socket.getaddrinfo


def fetch(url, pause=PAUSE, timeout=180, retries=3):
    """GET sequencial e educado: devolve bytes e espera `pause` segundos depois de cada chamada.
    Tenta IPv4 antes de IPv6: vários servidores (BCB, bancos) anunciam IPv6 que não responde, e o urllib espera o
    prazo inteiro em cada endereço antes de passar ao próximo."""
    socket.getaddrinfo = _ipv4_first
    try:
        return get_bytes(url, timeout=timeout, retries=retries)
    finally:
        socket.getaddrinfo = _getaddrinfo
        time.sleep(pause)


def cached(path, url, refresh=False, pause=PAUSE, timeout=180, retries=3):
    """Baixa `url` para `path` (gzip) se ainda não estiver lá; devolve (bytes, fetched_at, from_cache)."""
    meta = path.with_name(path.name + ".meta.json")
    if path.exists() and not refresh:
        info = json.loads(meta.read_text()) if meta.exists() else {}
        return gzip.decompress(path.read_bytes()), info.get("fetched_at", ""), True
    body = fetch(url, pause=pause, timeout=timeout, retries=retries)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(gzip.compress(body, 6))
    at = now_iso()
    meta.write_text(json.dumps({"url": url, "fetched_at": at, "bytes": len(body)}))
    return body, at, False


# ---------- identificadores ----------

def cnpj_dv(base12):
    """Dígitos verificadores do CNPJ (12 primeiros dígitos → 2 DVs)."""
    def dv(digits, weights):
        s = sum(int(d) * w for d, w in zip(digits, weights)) % 11
        return "0" if s < 2 else str(11 - s)
    d1 = dv(base12, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
    d2 = dv(base12 + d1, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
    return d1 + d2


def cnpj14(cnpj8, branch="0001"):
    """CNPJ completo da matriz a partir do CNPJ-base (8 dígitos): base + 0001 + DVs calculados."""
    base = str(cnpj8).zfill(8) + branch
    return base + cnpj_dv(base)


def fmt_cnpj(c14):
    c = str(c14).zfill(14)
    return f"{c[:2]}.{c[2:5]}.{c[5:8]}/{c[8:12]}-{c[12:]}"


def digits(s):
    return "".join(ch for ch in str(s or "") if ch.isdigit())


# ---------- períodos (AAAAMM inteiros) ----------

def add_months(yyyymm, n):
    y, m = divmod(int(yyyymm), 100)
    t = y * 12 + (m - 1) + n
    return (t // 12) * 100 + t % 12 + 1


def parse_since(s, default):
    """'2016-03' ou '201603' → 201603."""
    if not s:
        return int(default)
    d = digits(s)
    if len(d) != 6:
        raise SystemExit(f"--since inválido: {s} (use AAAA-MM)")
    return int(d)


def label(yyyymm):
    y, m = divmod(int(yyyymm), 100)
    return f"{y}-{m:02d}"


# ---------- base local ----------

SCHEMA = """
CREATE TABLE IF NOT EXISTS ifdata_files(period INT, file TEXT, url TEXT, fetched_at TEXT, generated TEXT,
  PRIMARY KEY(period, file));
CREATE TABLE IF NOT EXISTS ifdata_periods(period INT PRIMARY KEY, generated TEXT, extracted_at TEXT, metrics TEXT);
CREATE TABLE IF NOT EXISTS ifdata_entities(period INT, level INT, code INT, name TEXT, tcb TEXT, td TEXT, tc TEXT,
  ti TEXT, segment TEXT, uf TEXT, city TEXT, fin_congl INT, prud_congl INT, PRIMARY KEY(period, level, code));
CREATE TABLE IF NOT EXISTS ifdata_values(period INT, level INT, code INT, metric TEXT, value REAL,
  PRIMARY KEY(period, level, code, metric)) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS estban_files(month INT PRIMARY KEY, url TEXT, fetched_at TEXT, generated TEXT,
  layout TEXT, rows INT);
CREATE TABLE IF NOT EXISTS estban_uf(month INT, cnpj8 TEXT, uf TEXT, metric TEXT, value REAL, municipalities INT,
  PRIMARY KEY(month, cnpj8, uf, metric)) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS estban_names(cnpj8 TEXT PRIMARY KEY, name TEXT, last_month INT);
CREATE TABLE IF NOT EXISTS estban_fixes(month INT, cnpj8 TEXT, uf TEXT, codmun TEXT, metric TEXT, raw REAL,
  corrected REAL, bank_total_raw REAL, prev_bank_total REAL, PRIMARY KEY(month, cnpj8, metric));
"""


def db():
    IFS.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(DB_PATH)
    con.executescript(SCHEMA)
    return con


def write_json(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")


def read_json(path, default=None):
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else default
