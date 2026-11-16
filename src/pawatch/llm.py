"""Hugging Face Inference Providers client (OpenAI-compatible router)."""

import json
import os
import re
import sys

from .http import post_json

ROUTER = "https://router.huggingface.co/v1/chat/completions"
DEFAULT_MODELS = ["deepseek-ai/DeepSeek-V4.1-Flash", "Qwen/Qwen3.5-122B-A10B", "openai/gpt-oss-120b"]


def models():
    env = os.environ.get("PAW_MODEL", "").strip()
    return [m.strip() for m in env.split(",") if m.strip()] or DEFAULT_MODELS


def _token():
    tok = os.environ.get("HF_TOKEN", "").strip()
    if not tok:
        path = os.path.expanduser("~/.cache/huggingface/token")
        if os.path.exists(path):
            tok = open(path).read().strip()
    if not tok:
        raise RuntimeError("HF_TOKEN não definido (nem ~/.cache/huggingface/token)")
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
        self.token = _token()
        self.used_model = None
        self.usage = {"prompt_tokens": 0, "completion_tokens": 0}

    def json(self, system, user, max_tokens=6000, temperature=0.2):
        """Ask for a JSON object; try each configured model, two attempts each."""
        errors = []
        for model in models():
            for _ in range(2):
                try:
                    resp = post_json(ROUTER, {
                        "model": model,
                        "messages": [{"role": "system", "content": system},
                                     {"role": "user", "content": user}],
                        "max_tokens": max_tokens,
                        "temperature": temperature,
                        "response_format": {"type": "json_object"},
                    }, headers={"Authorization": f"Bearer {self.token}"}, timeout=240, retries=2)
                    if resp.get("error"):
                        raise RuntimeError(str(resp["error"])[:300])
                    for k in self.usage:
                        self.usage[k] += (resp.get("usage") or {}).get(k, 0) or 0
                    content = resp["choices"][0]["message"].get("content")
                    out = parse_json(content)
                    self.used_model = model
                    return out
                except (RuntimeError, ValueError, KeyError, TypeError, json.JSONDecodeError) as e:
                    errors.append(f"{model}: {e}")
                    print(f"llm: {model} falhou: {str(e)[:200]}", file=sys.stderr)
        raise RuntimeError("todos os modelos falharam:\n" + "\n".join(errors[-4:]))
