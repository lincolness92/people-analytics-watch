"""Tracing for the pipeline (digest, Evolução, annual review, regulation): the same OpenTelemetry spans with
OpenInference attributes as the serving side (server/trace.js), so Phoenix (or any OTLP backend) shows the pipeline
and the agent side by side.

- `start_run(name)` opens a run-wide tracer; `span(name, kind, **attrs)` is a context manager for a step; the LLM
  client (llm.py) records one LLM span per call (messages, route, tokens, cost, attempts) under the current span.
- Every run is saved as compact JSON lines in data/traces/<date>-<name>.jsonl.gz (kept in git, old files pruned), so
  nothing is lost when no backend is configured — GitHub Actions only gets the OTLP variables if the workflow passes
  them. `python -m pawatch traces --export` sends stored runs to the backend later, from anywhere.
- OTLP/HTTP protobuf export when OTEL_EXPORTER_OTLP_TRACES_ENDPOINT (or OTEL_EXPORTER_OTLP_ENDPOINT) is set; headers
  from OTEL_EXPORTER_OTLP_HEADERS ("k=v,k2=v2"); project from PHOENIX_PROJECT_NAME. Stdlib only.
"""

import contextlib
import contextvars
import gzip
import json
import os
import secrets
import struct
import threading
import time
import urllib.parse
import urllib.request
from datetime import date, timedelta

from . import DATA

TRACES = DATA / "traces"
KEEP_DAYS = 60
MAX_ATTR = 4000  # stored prompts and outputs are long; keep each attribute bounded
KIND = {"CHAIN": "CHAIN", "LLM": "LLM", "RETRIEVER": "RETRIEVER", "TOOL": "TOOL", "AGENT": "AGENT"}

_current = contextvars.ContextVar("pawatch_span", default=None)
_tracer = None


def _now_ns():
    return time.time_ns()


class Span:
    def __init__(self, tracer, name, kind, attrs, parent):
        self.tracer, self.name, self.kind = tracer, name, kind
        self.span_id = secrets.token_hex(8)
        self.parent_id = parent.span_id if parent else None
        self.start, self.end = _now_ns(), None
        self.attrs = {"openinference.span.kind": kind}
        self.status = (0, None)
        self.set_many(attrs)

    def set(self, k, v):
        if v is None:
            return self
        if isinstance(v, (dict, list, tuple)):
            v = json.dumps(v, ensure_ascii=False)
        if isinstance(v, str):
            v = v[:MAX_ATTR]
        self.attrs[k] = v
        return self

    def set_many(self, attrs):
        for k, v in (attrs or {}).items():
            self.set(k, v)
        return self

    def error(self, e):
        self.status = (2, str(e)[:500])
        return self

    def finish(self):
        if self.end is None:
            self.end = _now_ns()
            if self.status[0] == 0:
                self.status = (1, None)
        return self


class Tracer:
    def __init__(self, name, resource=None):
        self.name = name
        self.trace_id = secrets.token_hex(16)
        self.resource = {"deployment.environment": "pipeline", **(resource or {})}
        self.spans = []
        self._lock = threading.Lock()

    def start(self, name, kind, attrs=None, parent=None):
        # worker threads (ThreadPoolExecutor) do not inherit the context: their spans hang from the run's root
        parent = parent if parent is not None else (_current.get() or (self.spans[0] if self.spans else None))
        sp = Span(self, name, kind, attrs, parent)
        with self._lock:
            self.spans.append(sp)
        return sp

    def to_json(self):
        t0 = self.spans[0].start if self.spans else 0
        return {"trace_id": self.trace_id, "name": self.name, "resource": self.resource,
                "spans": [{"name": s.name, "kind": s.kind, "span_id": s.span_id, "parent_id": s.parent_id,
                           "start_ns": s.start, "end_ns": s.end, "start_ms": (s.start - t0) // 1_000_000,
                           "duration_ms": (s.end - s.start) // 1_000_000 if s.end else None,
                           "status": "ok" if s.status[0] != 2 else f"error: {s.status[1]}", "attrs": s.attrs}
                          for s in self.spans]}


def current_tracer():
    return _tracer


@contextlib.contextmanager
def span(name, kind="CHAIN", **attrs):
    """A step of the pipeline; a no-op when no run is being traced."""
    t = _tracer
    if t is None:
        yield None
        return
    sp = t.start(name, kind, attrs)
    token = _current.set(sp)
    try:
        yield sp
    except BaseException as e:
        sp.error(e)
        raise
    finally:
        _current.reset(token)
        sp.finish()


def current_span():
    return _current.get()


def start_run(name, **resource):
    """Open the run-wide tracer and its root span. Returns the tracer."""
    global _tracer
    _tracer = Tracer(name, resource)
    root = _tracer.start(name, KIND["AGENT"], {"pipeline.command": name})
    _current.set(root)
    return _tracer


def end_run(log=None):
    """Close the run: save it under data/traces/ and send it to the OTLP backend when configured."""
    global _tracer
    t, _tracer = _tracer, None
    if t is None or not t.spans:
        return None
    for s in t.spans:
        s.finish()
    path = save(t)
    status = export(t)
    if log:
        log(f"trace: {len(t.spans)} spans → {path.relative_to(DATA.parent)}; OTLP: {status}")
    return path


def save(t):
    TRACES.mkdir(parents=True, exist_ok=True)
    path = TRACES / f"{date.today().isoformat()}-{t.name}.jsonl.gz"
    with gzip.open(path, "at", encoding="utf-8") as f:  # several runs of the same command in a day append
        f.write(json.dumps(t.to_json(), ensure_ascii=False) + "\n")
    cutoff = (date.today() - timedelta(days=KEEP_DAYS)).isoformat()
    for old in TRACES.glob("*.jsonl.gz"):
        if old.name[:10] < cutoff:
            old.unlink()
    return path


def load(path):
    with gzip.open(path, "rt", encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]


# ---------- OTLP export ----------

def otlp_config(env=os.environ):
    endpoint = env.get("OTEL_EXPORTER_OTLP_TRACES_ENDPOINT") or (
        env["OTEL_EXPORTER_OTLP_ENDPOINT"].rstrip("/") + "/v1/traces" if env.get("OTEL_EXPORTER_OTLP_ENDPOINT") else "")
    if not endpoint:
        return None
    headers = {}
    for part in (env.get("OTEL_EXPORTER_OTLP_HEADERS") or "").split(","):
        k, _, v = part.partition("=")
        if k.strip() and v:
            headers[urllib.parse.unquote(k.strip())] = urllib.parse.unquote(v.strip())
    return {"endpoint": endpoint, "headers": headers, "service": env.get("OTEL_SERVICE_NAME", "research-watch"),
            "project": env.get("PHOENIX_PROJECT_NAME")}


def export(t, env=os.environ, opener=urllib.request.urlopen):
    """Send one tracer (or a stored trace dict) to the backend. Never raises; returns a short status."""
    cfg = otlp_config(env)
    if not cfg:
        return "sem backend"
    data = t.to_json() if isinstance(t, Tracer) else t
    resource = {"service.name": cfg["service"], **({"openinference.project.name": cfg["project"]} if cfg["project"] else {}),
                **(data.get("resource") or {})}
    body = encode(data, resource)
    req = urllib.request.Request(cfg["endpoint"], data=body, method="POST",
                                 headers={"Content-Type": "application/x-protobuf", **cfg["headers"]})
    try:
        with opener(req, timeout=30) as r:
            return "ok" if 200 <= r.status < 300 else f"HTTP {r.status}"
    except Exception as e:  # noqa: BLE001
        return f"falhou: {str(e)[:80]}"


# Minimal protobuf writer for opentelemetry.proto.collector.trace.v1.ExportTraceServiceRequest (same as server/trace.js).
def _varint(n):
    n &= (1 << 64) - 1
    out = bytearray()
    while n > 127:
        out.append((n & 127) | 128)
        n >>= 7
    out.append(n)
    return bytes(out)


def _tag(field, wire):
    return _varint((field << 3) | wire)


def _bytes(field, b):
    return _tag(field, 2) + _varint(len(b)) + b


def _str(field, s):
    return _bytes(field, s.encode("utf-8"))


def _fixed64(field, n):
    return _tag(field, 1) + struct.pack("<Q", n & ((1 << 64) - 1))


def _key_value(k, v):
    if isinstance(v, bool):
        val = _tag(2, 0) + _varint(1 if v else 0)
    elif isinstance(v, int):
        val = _tag(3, 0) + _varint(v)
    elif isinstance(v, float):
        val = _tag(4, 1) + struct.pack("<d", v)
    else:
        val = _str(1, str(v))
    return _str(1, k) + _bytes(2, val)


def encode(data, resource):
    res = b"".join(_bytes(1, _key_value(k, v)) for k, v in resource.items())
    scope = _bytes(1, _str(1, "research-watch"))
    spans = b""
    for s in data["spans"]:
        sp = _bytes(1, bytes.fromhex(data["trace_id"])) + _bytes(2, bytes.fromhex(s["span_id"]))
        if s.get("parent_id"):
            sp += _bytes(4, bytes.fromhex(s["parent_id"]))
        end = s.get("end_ns") or s["start_ns"]
        sp += _str(5, s["name"]) + _tag(6, 0) + _varint(1) + _fixed64(7, s["start_ns"]) + _fixed64(8, end)
        sp += b"".join(_bytes(9, _key_value(k, v)) for k, v in s["attrs"].items())
        err = str(s.get("status", "ok")).startswith("error")
        st = (_str(2, s["status"][7:]) if err else b"") + _tag(3, 0) + _varint(2 if err else 1)
        sp += _bytes(15, st)
        spans += _bytes(2, sp)
    rs = _bytes(1, res) + _bytes(2, scope + spans)
    return _bytes(1, rs)
