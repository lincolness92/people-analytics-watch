"""LLM client for the pipeline: OpenAI-compatible chat, routed by price.

The model list (PAW_MODEL, comma-separated, else DEFAULT_MODELS) is a quality order: the first model is the one we
want, the others only matter if every route to it fails. For each model, the ROUTE is chosen by price, from what
the providers publish right now:

- Hugging Face Inference Providers (HF_TOKEN): GET /v1/models lists, per model, every live provider with its price
  per 1M input/output tokens; a route is "<model>:<provider>" (the router pins that provider).
- DeepSeek's own platform (DEEPSEEK_API_KEY): GET /models gives the model names (deepseek-flash is
  DeepSeek-V4.1-Flash); the API does not carry prices, so they are read from the official pricing page (its
  Markdown version), peak and off-peak, with the peak hours stated there. A route is "deepseek:<id>".

Before each call the routes of the model are ranked by the estimated cost of THAT call (prompt length, expected
output) at the current hour, cheapest first; a failed route moves to the next cheapest. Routes are filtered for
quality: live, JSON output supported, uptime >= MIN_UPTIME, and no 4-bit quantization unless PAW_ALLOW_4BIT=1.
A PAW_MODEL entry that already names a route ("model:provider" or "deepseek:<id>") is used as is.

Prices are fetched once per hour per process; if a source cannot be read, the built-in table below stands in.
Cost is tracked per call: the HF router reports it (`usage.cost`); for DeepSeek it is computed from the price
table. `LLM.usage` sums tokens, cost and calls (thread-safe); `LLM.routes` counts calls per route.
"""

import json
import os
import re
import sys
import threading
import time
from datetime import datetime, timezone

from .http import get_json, get_text, post_json

ROUTER = "https://router.huggingface.co/v1/chat/completions"
HF_MODELS = "https://router.huggingface.co/v1/models"
DEEPSEEK = "https://api.deepseek.com/chat/completions"
DEEPSEEK_MODELS = "https://api.deepseek.com/models"
DEEPSEEK_PRICING = "https://api-docs.deepseek.com/quick_start/pricing.md"
DEFAULT_MODELS = ["deepseek-ai/DeepSeek-V4.1-Flash", "Qwen/Qwen3.5-122B-A10B", "openai/gpt-oss-120b"]

# Stand-ins when the pricing page or /models cannot be read. US$ per 1M tokens at PEAK (off-peak is half):
# (input cache hit, input cache miss, output). api-docs.deepseek.com, Nov 2026.
DEEPSEEK_PRICES = {"deepseek-flash": (0.006, 0.30, 1.20), "deepseek-v4-pro": (0.044, 1.32, 3.96)}
DEEPSEEK_PEAK_UTC = ((1, 4), (6, 10))  # hours [start, end), Monday–Friday
DEEPSEEK_NAMES = {"deepseek-ai/DeepSeek-V4.1-Flash": "deepseek-flash"}

LOW_BIT = re.compile(r"(fp|int|nf|q)4", re.I)  # fp4, mxfp4, int4, nf4, q4_k...
MIN_UPTIME = 97.0
MAX_ROUTES = 4      # cheapest routes tried per model before moving to the next model
DEFAULT_REASONING = os.environ.get("PAW_REASONING", "low")  # same small reasoning budget on every provider
BOOK_TTL = 3600     # seconds a fetched price book is reused


def deepseek_peak(when=None, windows=DEEPSEEK_PEAK_UTC):
    when = when or datetime.now(timezone.utc)
    return when.weekday() < 5 and any(a <= when.hour < b for a, b in windows)


def _deepseek_table(model, prices=None):
    """{"peak": (hit, miss, out), "off": (...)} for a DeepSeek model, from the fetched page or the built-in table."""
    if prices and model in prices:
        return prices[model]
    p = DEEPSEEK_PRICES.get(model, DEEPSEEK_PRICES["deepseek-flash"])
    return {"peak": p, "off": tuple(x / 2 for x in p)}


def deepseek_cost(model, usage, when=None, prices=None, windows=DEEPSEEK_PEAK_UTC):
    hit_p, miss_p, out_p = _deepseek_table(model, prices)["peak" if deepseek_peak(when, windows) else "off"]
    hit = usage.get("prompt_cache_hit_tokens", 0) or 0
    miss = usage.get("prompt_cache_miss_tokens", (usage.get("prompt_tokens", 0) or 0) - hit) or 0
    out = usage.get("completion_tokens", 0) or 0
    return (hit * hit_p + miss * miss_p + out * out_p) / 1e6


def parse_deepseek_pricing(md):
    """Prices and peak hours from the Markdown pricing page: ({model: {"peak": (hit, miss, out), "off": ...}}, windows)."""
    cols, raw = None, {}
    for line in md.splitlines():
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if cols is None and cells and cells[0] == "MODEL":
            cols = [re.sub(r"\(\d+\)$", "", c).strip() for c in cells if c and c != "MODEL"]
            continue
        if not cols or len(cells) <= len(cols):
            continue
        label = " ".join(cells[:-len(cols)]).upper()
        kind = 0 if "CACHE HIT" in label else 1 if "CACHE MISS" in label else 2 if "OUTPUT" in label else None
        window = "off" if "OFF-PEAK" in label else "peak" if "PEAK" in label else None
        if kind is None or window is None:
            continue
        for name, cell in zip(cols, cells[-len(cols):]):
            m = re.search(r"\$\s*([\d.]+)", cell)
            if m:
                raw.setdefault(name, {"peak": [None] * 3, "off": [None] * 3})[window][kind] = float(m.group(1))
    prices = {k: {w: tuple(v) for w, v in d.items()} for k, d in raw.items() if all(None not in v for v in d.values())}
    i = md.find("Peak hours")
    windows = tuple((int(a), int(b)) for a, b in re.findall(r"(\d{1,2}):00\s*-\s*(\d{1,2}):00", md[i:i + 300])) if i >= 0 else ()
    return prices, windows or DEEPSEEK_PEAK_UTC


def parse_hf_models(data, wanted):
    """Live providers with a published price for the wanted models: {model: [{provider, in, out, quant, json, uptime}]}."""
    out = {}
    for m in data.get("data", []):
        if m.get("id") not in wanted:
            continue
        routes = []
        for p in m.get("providers", []):
            pr = p.get("pricing") or {}
            if p.get("status") != "live" or pr.get("input") is None or pr.get("output") is None:
                continue
            routes.append({"provider": p["provider"], "in": float(pr["input"]), "out": float(pr["output"]),
                           "quant": p.get("quantization") or "", "json": p.get("supports_structured_output") is not False,
                           "uptime": p.get("uptime_last_day_percent")})
        out[m["id"]] = routes
    return out


def _env_file_value(path, name):
    path = os.path.expanduser(path)
    if os.path.exists(path):
        for line in open(path, encoding="utf-8"):
            k, _, value = line.strip().partition("=")
            if k.strip().removeprefix("export ").strip() == name:
                return value.strip().strip('"').strip("'")
    return ""


def _deepseek_key():
    """DEEPSEEK_API_KEY from the environment or, for local runs, ~/.config/pawatch/deepseek.env (outside the repo)."""
    return os.environ.get("DEEPSEEK_API_KEY", "").strip() or _env_file_value("~/.config/pawatch/deepseek.env", "DEEPSEEK_API_KEY")


def _hf_token():
    tok = os.environ.get("HF_TOKEN", "").strip()
    if not tok:
        path = os.path.expanduser("~/.cache/huggingface/token")
        if os.path.exists(path):
            tok = open(path).read().strip()
    return tok


def models():
    env = os.environ.get("PAW_MODEL", "").strip()
    return [m.strip() for m in env.split(",") if m.strip()] or list(DEFAULT_MODELS)


def _pinned(model):
    return model.startswith("deepseek:") or ":" in model


_BOOK = {"at": 0.0, "key": None, "data": None}
_BOOK_LOCK = threading.Lock()


def price_book(hf_token, ds_key, wanted, refresh=False):
    """Current prices of every route to the wanted models (cached BOOK_TTL seconds). Never raises."""
    key = (bool(hf_token), bool(ds_key), tuple(sorted(wanted)))
    with _BOOK_LOCK:
        if _BOOK["data"] is not None and _BOOK["key"] == key and not refresh and time.time() - _BOOK["at"] < BOOK_TTL:
            return _BOOK["data"]
        book = {"hf": {}, "ds_models": {}, "ds_prices": {}, "peak_utc": DEEPSEEK_PEAK_UTC, "sources": {}}
        if hf_token and wanted:
            try:
                book["hf"] = parse_hf_models(get_json(HF_MODELS, headers={"Authorization": f"Bearer {hf_token}"}, timeout=40, retries=2), wanted)
                book["sources"]["hf"] = "api"
            except Exception as e:  # noqa: BLE001 — no prices: the router chooses the provider
                book["sources"]["hf"] = f"indisponível ({str(e)[:80]})"
        if ds_key:
            try:
                names = {(m.get("name") or "").lower(): m["id"] for m in
                         get_json(DEEPSEEK_MODELS, headers={"Authorization": f"Bearer {ds_key}"}, timeout=20, retries=2).get("data", [])}
                book["ds_models"] = {w: names[w.rsplit("/", 1)[-1].lower()] for w in wanted if w.rsplit("/", 1)[-1].lower() in names}
            except Exception:  # noqa: BLE001
                book["ds_models"] = {w: d for w, d in DEEPSEEK_NAMES.items() if w in wanted}
            try:
                prices, book["peak_utc"] = parse_deepseek_pricing(get_text(DEEPSEEK_PRICING, timeout=30, retries=2))
            except Exception:  # noqa: BLE001
                prices = {}
            book["ds_prices"] = prices
            book["sources"]["deepseek"] = "página de preços" if prices else "tabela interna"
        _BOOK.update(at=time.time(), key=key, data=book)
        return book


def rank_routes(book, model, est_in, est_out, json_mode=True, when=None):
    """Routes to one model, cheapest first for a call of est_in/est_out tokens: [(route, est_cost_usd, price_label)]."""
    allow_4bit = os.environ.get("PAW_ALLOW_4BIT", "") == "1"
    cands = []
    for r in book["hf"].get(model, []):
        if (LOW_BIT.search(r["quant"]) and not allow_4bit) or (json_mode and not r["json"]) \
                or (r["uptime"] is not None and r["uptime"] < MIN_UPTIME):
            continue
        cands.append((f"{model}:{r['provider']}", (est_in * r["in"] + est_out * r["out"]) / 1e6, f"{r['in']:g}/{r['out']:g}"))
    ds = book["ds_models"].get(model)
    if ds:
        peak = deepseek_peak(when, book["peak_utc"])
        _, miss, out = _deepseek_table(ds, book["ds_prices"])["peak" if peak else "off"]
        cands.append((f"deepseek:{ds}", (est_in * miss + est_out * out) / 1e6, f"{miss:g}/{out:g} {'pico' if peak else 'fora do pico'}"))
    cands.sort(key=lambda c: c[1])
    return cands


def parse_json(text):
    text = re.sub(r"<think>.*?</think>", "", text or "", flags=re.S).strip()
    fence = re.search(r"```(?:json)?\s*(.*?)```", text, flags=re.S)
    if fence:
        text = fence.group(1)
    start = text.find("{")
    end = text.rfind("}")
    if start < 0 or end <= start:
        raise ValueError(f"no JSON object in model output: {text[:200]!r}")
    return json.loads(text[start:end + 1])


class LLM:
    def __init__(self):
        self.hf_token = _hf_token()
        self.deepseek_key = _deepseek_key()
        if not self.hf_token and not self.deepseek_key:
            raise RuntimeError("defina HF_TOKEN (ou ~/.cache/huggingface/token) ou DEEPSEEK_API_KEY")
        self.used_model = None
        self.usage = {"prompt_tokens": 0, "completion_tokens": 0, "cost_usd": 0.0, "calls": 0, "failures": 0}
        self.routes = {}
        self.demoted = {}  # route → failures in this process: a route that failed goes to the back of its model's queue
        self._lock = threading.Lock()
        self._logged = set()

    def plan(self, est_in, est_out, json_mode=True):
        """Every route to try, in order: models by preference, each model's routes by estimated cost.
        Items: (route, attempts)."""
        ms = models()
        book = price_book(self.hf_token, self.deepseek_key, [m for m in ms if not _pinned(m)])
        out = []
        for m in ms:
            if _pinned(m):
                out.append((m, 2))
                continue
            ranked = rank_routes(book, m, est_in, est_out, json_mode)
            if m not in self._logged and ranked:
                self._logged.add(m)
                print(f"llm: {m}: rotas por preço (US$/1M entrada/saída): "
                      + "; ".join(f"{r.split(':', 1)[0] if r.startswith('deepseek:') else r.rsplit(':', 1)[1]} {lab}" for r, _, lab in ranked[:10]),
                      file=sys.stderr)
            # list price is not the whole story: a route that cut or failed earlier in this run goes last
            ranked = sorted(ranked, key=lambda c: self.demoted.get(c[0], 0))
            out += [(r, 1) for r, _, _ in ranked[:MAX_ROUTES]]
            if self.hf_token and m not in book["hf"]:
                out.append((m, 2))  # no HF price list for it: let the router choose the provider
        return out

    def _endpoint(self, route):
        if route.startswith("deepseek:"):
            if not self.deepseek_key:
                raise RuntimeError("DEEPSEEK_API_KEY não definida")
            return DEEPSEEK, route.split(":", 1)[1], self.deepseek_key
        if not self.hf_token:
            raise RuntimeError("HF_TOKEN não definido")
        return ROUTER, route, self.hf_token

    def _account(self, route, usage, ok):
        cost = 0.0
        if usage:
            if route.startswith("deepseek:"):
                book = _BOOK["data"] or {}
                cost = deepseek_cost(route.split(":", 1)[1], usage, prices=book.get("ds_prices"), windows=book.get("peak_utc", DEEPSEEK_PEAK_UTC))
            else:
                cost = float(usage.get("cost") or 0)
        with self._lock:
            self.usage["calls"] += 1
            self.usage["failures"] += 0 if ok else 1
            self.usage["prompt_tokens"] += (usage or {}).get("prompt_tokens", 0) or 0
            self.usage["completion_tokens"] += (usage or {}).get("completion_tokens", 0) or 0
            self.usage["cost_usd"] = round(self.usage["cost_usd"] + cost, 6)
            if ok:
                self.routes[route] = self.routes.get(route, 0) + 1
        return cost

    def json(self, system, user, max_tokens=6000, temperature=0.2, timeout=240, parse=None, reasoning=DEFAULT_REASONING, expect_out=None):
        """Ask for a JSON object through the cheapest working route.

        `parse` turns the raw text into the result (default: parse_json) and may salvage partial output.
        `reasoning` sets reasoning_effort explicitly (default DEFAULT_REASONING): providers differ in whether hidden
        reasoning is on by default, and one that reasons at length spends the whole budget and returns cut JSON.
        "none" turns it off (short mechanical steps); None sends nothing (provider default).
        `expect_out` is the expected output length in tokens, for the price comparison (default min(max_tokens, 2000)).
        """
        parse = parse or parse_json
        est_in = (len(system) + len(user)) // 3 + 20
        est_out = expect_out or min(max_tokens, 2000)
        errors = []
        for route, tries in self.plan(est_in, est_out, json_mode=True):
            for _ in range(tries):
                usage = None
                try:
                    url, api_model, key = self._endpoint(route)
                    body = {"model": api_model, "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
                            "max_tokens": max_tokens, "temperature": temperature, "response_format": {"type": "json_object"}}
                    if reasoning:
                        body["reasoning_effort"] = reasoning
                    resp = post_json(url, body, headers={"Authorization": f"Bearer {key}"}, timeout=timeout, retries=2)
                    if resp.get("error"):
                        raise RuntimeError(str(resp["error"])[:300])
                    usage = resp.get("usage") or {}
                    choice = resp["choices"][0]
                    try:
                        out = parse(choice["message"].get("content"))
                    except (ValueError, json.JSONDecodeError) as e:
                        if choice.get("finish_reason") == "length":  # budget spent (often on hidden reasoning): cut output
                            raise ValueError(f"saída cortada pelo limite de {max_tokens} tokens") from e
                        raise
                    self._account(route, usage, True)
                    self.used_model = route
                    return out
                except (RuntimeError, ValueError, KeyError, TypeError, json.JSONDecodeError) as e:
                    if usage is not None:  # the call was billed even if its output was unusable
                        self._account(route, usage, False)
                    with self._lock:
                        self.demoted[route] = self.demoted.get(route, 0) + 1
                    errors.append(f"{route}: {e}")
                    print(f"llm: {route} falhou: {str(e)[:200]}", file=sys.stderr)
                    if "não definid" in str(e):
                        break
        raise RuntimeError("todas as rotas falharam:\n" + "\n".join(errors[-4:]))
