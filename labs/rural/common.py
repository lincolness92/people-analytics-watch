"""Utilitários dos coletores de crédito rural (só stdlib).

- download(): GET sequencial, em blocos (arquivos de até 1,3 GB), com retentativa, pausa e um .meta.json ao lado
  (URL, data da coleta, tamanho, Last-Modified). Incremental: não baixa de novo se o tamanho remoto não mudou.
- Caminhos: brutos em data/rural/raw/ (fora do git); tabelas pequenas em data/rural/.
"""

import json
import socket
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data" / "rural"
RAW = DATA / "raw"
USER_AGENT = "people-analytics-watch/0.1 (research digest)"
PAUSE = 1.5  # segundos entre chamadas ao mesmo servidor público

_gai = socket.getaddrinfo


def _ipv4_first(*a, **k):
    return sorted(_gai(*a, **k), key=lambda r: r[0] != socket.AF_INET)


socket.getaddrinfo = _ipv4_first  # servidores do BCB anunciam IPv6 que às vezes não responde


def log(msg):
    print(msg, file=sys.stderr, flush=True)


def now_iso():
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def _open(url, method="GET", timeout=300):
    req = urllib.request.Request(url, method=method, headers={"User-Agent": USER_AGENT})
    return urllib.request.urlopen(req, timeout=timeout)


def head(url):
    """(status, content-length, last-modified) ou (código de erro, None, None)."""
    try:
        with _open(url, "HEAD", 60) as r:
            return r.status, int(r.headers.get("Content-Length") or 0), r.headers.get("Last-Modified")
    except urllib.error.HTTPError as e:
        return e.code, None, None


def download(url, path, refresh=False, retries=4, pause=PAUSE, use_head=True):
    """Baixa `url` para `path` (bytes como vieram). Devolve o dicionário de proveniência, ou None se 404.
    use_head=False para APIs que não respondem a HEAD (ex.: NASA POWER): baixa sempre."""
    path = Path(path)
    meta_path = path.with_name(path.name + ".meta.json")
    meta = json.loads(meta_path.read_text()) if meta_path.exists() else {}
    status, size, lastmod = head(url) if use_head else (200, None, None)
    if use_head:
        time.sleep(pause)
    if status == 404:
        return None
    if path.exists() and not refresh and meta.get("bytes") == path.stat().st_size and \
            (size in (None, 0) or size == meta.get("bytes")):
        return meta
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(path.name + ".part")
    last = None
    for attempt in range(1, retries + 1):
        try:
            with _open(url) as r, open(tmp, "wb") as out:
                expected = int(r.headers.get("Content-Length") or 0)  # o do GET vale: nós de CDN divergem no HEAD
                while True:
                    chunk = r.read(1 << 20)
                    if not chunk:
                        break
                    out.write(chunk)
            if expected and tmp.stat().st_size != expected:
                raise IOError(f"tamanho {tmp.stat().st_size} != {expected}")
            tmp.replace(path)
            meta = {"url": url, "fetched_at": now_iso(), "bytes": path.stat().st_size, "last_modified": lastmod}
            meta_path.write_text(json.dumps(meta, ensure_ascii=False))
            time.sleep(pause)
            return meta
        except (urllib.error.URLError, TimeoutError, IOError, ConnectionError) as e:
            last = e
            log(f"  tentativa {attempt} falhou para {url}: {e}")
            time.sleep(5 * attempt ** 2)
    raise RuntimeError(f"download falhou: {url}: {last}")


def get_json(url, retries=4, pause=PAUSE, timeout=180):
    last = None
    for attempt in range(1, retries + 1):
        try:
            with _open(url, timeout=timeout) as r:
                body = r.read()
            time.sleep(pause)
            return json.loads(body)
        except urllib.error.HTTPError as e:
            last = e
            if 400 <= e.code < 500 and e.code != 429:
                raise
        except (urllib.error.URLError, TimeoutError, ConnectionError, json.JSONDecodeError) as e:
            last = e
        time.sleep(4 * attempt ** 2)
    raise RuntimeError(f"falhou: {url}: {last}")


def num(s):
    """'1.234,56' ou '1234.56' → float; vazio → 0."""
    s = (s or "").strip().strip('"')
    if not s:
        return 0.0
    if "," in s:
        s = s.replace(".", "").replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return 0.0
