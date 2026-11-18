"""LLM client for the pipeline: OpenAI-compatible chat, through Hugging Face Inference Providers and, when
DEEPSEEK_API_KEY is set, DeepSeek's own platform as a further fallback (or first, via PAW_MODEL).

Model list (PAW_MODEL, comma-separated, else DEFAULT_MODELS): a plain id goes through the Hugging Face router
(HF_TOKEN); "deepseek:<id>" goes to api.deepseek.com (DEEPSEEK_API_KEY). Each model gets two attempts.

Cost is tracked per call: the Hugging Face router reports it (`usage.cost`); for DeepSeek it is computed from
the official price table, which halves outside its peak windows (01:00–04:00 and 06:00–10:00 UTC, Mon–Fri)
and charges much less for cached input. `LLM.usage` sums tokens, cost and calls (thread-safe).
"""

import json
import os
import re
import sys
import threading
from datetime import datetime, timezone

from .http import post_json

ROUTER = "https://router.huggingface.co/v1/chat/completions"
DEEPSEEK = "https://api.deepseek.com/chat/completions"
DEFAULT_MODELS = ["deepseek-ai/DeepSeek-V4.1-Flash", "Qwen/Qwen3.5-122B-A10B", "openai/gpt-oss-120b"]
DEEPSEEK_FALLBACK = "deepseek:deepseek-flash"

# US$ per 1M tokens at PEAK (off-peak is half): (input cache hit, input cache miss, output). api-docs.deepseek.com, Nov 2026.
DEEPSEEK_PRICES = {"deepseek-flash": (0.006, 0.30, 1.20), "deepseek-v4-pro": (0.044, 1.32, 3.96)}
DEEPSEEK_PEAK_UTC = ((1, 4), (6, 10))  # hours [start, end), Monday–Friday


def deepseek_peak(when=None):
    when = when or datetime.now(timezone.utc)
    return when.weekday() < 5 and any(a <= when.hour < b for a, b in DEEPSEEK_PEAK_UTC)


def deepseek_cost(model, usage, when=None):
    hit_p, miss_p, out_p = DEEPSEEK_PRICES.get(model, DEEPSEEK_PRICES["deepseek-flash"])
    factor = 1.0 if deepseek_peak(when) else 0.5
    hit = usage.get("prompt_cache_hit_tokens", 0) or 0
    miss = usage.get("prompt_cache_miss_tokens", (usage.get("prompt_tokens", 0) or 0) - hit) or 0
    out = usage.get("completion_tokens", 0) or 0
    return factor * (hit * hit_p + miss * miss_p + out * out_p) / 1e6


def _deepseek_key():
    """DEEPSEEK_API_KEY from the environment or, for local runs, ~/.config/pawatch/deepseek.env (outside the repo)."""
    key = os.environ.get("DEEPSEEK_API_KEY", "").strip()
    env_file = os.path.expanduser("~/.config/pawatch/deepseek.env")
    if not key and os.path.exists(env_file):
        for line in open(env_file, encoding="utf-8"):
            name, _, value = line.strip().partition("=")
            if name.strip().removeprefix("export ").strip() == "DEEPSEEK_API_KEY":
                key = value.strip().strip('"').strip("'")
    return key


def models():
    env = os.environ.get("PAW_MODEL", "").strip()
    ms = [m.strip() for m in env.split(",") if m.strip()] or list(DEFAULT_MODELS)
    if _deepseek_key() and not any(m.startswith("deepseek:") for m in ms):
        ms.append(DEEPSEEK_FALLBACK)
    return ms


def _hf_token():
    tok = os.environ.get("HF_TOKEN", "").strip()
    if not tok:
        path = os.path.expanduser("~/.cache/huggingface/token")
        if os.path.exists(path):
            tok = open(path).read().strip()
    return tok


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
        self._lock = threading.Lock()

    def _endpoint(self, model):
        if model.startswith("deepseek:"):
            if not self.deepseek_key:
                raise RuntimeError("DEEPSEEK_API_KEY não definida")
            return DEEPSEEK, model.split(":", 1)[1], self.deepseek_key
        if not self.hf_token:
            raise RuntimeError("HF_TOKEN não definido")
        return ROUTER, model, self.hf_token

    def _account(self, model, api_model, usage, ok):
        cost = 0.0
        if usage:
            cost = deepseek_cost(api_model, usage) if model.startswith("deepseek:") else float(usage.get("cost") or 0)
        with self._lock:
            self.usage["calls"] += 1
            self.usage["failures"] += 0 if ok else 1
            self.usage["prompt_tokens"] += (usage or {}).get("prompt_tokens", 0) or 0
            self.usage["completion_tokens"] += (usage or {}).get("completion_tokens", 0) or 0
            self.usage["cost_usd"] = round(self.usage["cost_usd"] + cost, 6)
        return cost

    def json(self, system, user, max_tokens=6000, temperature=0.2, timeout=240, parse=None, reasoning=None):
        """Ask for a JSON object; try each configured model, two attempts each.

        `parse` turns the raw text into the result (default: parse_json) and may salvage partial output.
        `reasoning="none"` turns the models' hidden reasoning off (short mechanical steps).
        """
        parse = parse or parse_json
        errors = []
        for model in models():
            for _ in range(2):
                usage = None
                try:
                    url, api_model, key = self._endpoint(model)
                    body = {"model": api_model, "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
                            "max_tokens": max_tokens, "temperature": temperature, "response_format": {"type": "json_object"}}
                    if reasoning:
                        body["reasoning_effort"] = reasoning
                    resp = post_json(url, body, headers={"Authorization": f"Bearer {key}"}, timeout=timeout, retries=2)
                    if resp.get("error"):
                        raise RuntimeError(str(resp["error"])[:300])
                    usage = resp.get("usage") or {}
                    out = parse(resp["choices"][0]["message"].get("content"))
                    self._account(model, api_model, usage, True)
                    self.used_model = model
                    return out
                except (RuntimeError, ValueError, KeyError, TypeError, json.JSONDecodeError) as e:
                    if usage is not None:  # the call was billed even if its output was unusable
                        self._account(model, model.split(":", 1)[-1], usage, False)
                    errors.append(f"{model}: {e}")
                    print(f"llm: {model} falhou: {str(e)[:200]}", file=sys.stderr)
                    if "não definid" in str(e):
                        break
        raise RuntimeError("todos os modelos falharam:\n" + "\n".join(errors[-4:]))
