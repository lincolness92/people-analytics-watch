"""Small stdlib HTTP helpers with retries (no third-party deps)."""

import json
import os
import re
import time
import urllib.error
import urllib.parse
import urllib.request

USER_AGENT = "people-analytics-watch/0.1 (research digest)"
OPENALEX_HOST = "api.openalex.org"
_openalex_key_ok = True  # flips to False if the key is refused (e.g. not activated yet)


def _request(url, data=None, headers=None, timeout=60, retries=3, raw=False):
    hdrs = {"User-Agent": USER_AGENT}
    hdrs.update(headers or {})
    body = None
    if data is not None:
        body = json.dumps(data).encode("utf-8")
        hdrs.setdefault("Content-Type", "application/json")
    last = None
    attempt = waits = 0
    while attempt < retries:
        req = urllib.request.Request(url, data=body, headers=hdrs)
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                body_bytes = resp.read()
                return body_bytes if raw else body_bytes.decode("utf-8", errors="replace")
        except urllib.error.HTTPError as e:
            last = e
            detail = e.read().decode("utf-8", errors="replace")[:500]
            # 4xx other than 429 will not get better by retrying
            if e.code != 429 and 400 <= e.code < 500:
                raise RuntimeError(f"HTTP {e.code} for {url.split('?')[0]}: {detail}") from e
            if e.code == 429:
                hint = re.search(r"retry in (\d+) second", detail)
                if hint and waits < 20:  # pacing limit (e.g. new OpenAlex keys): wait as told, don't count it
                    waits += 1
                    time.sleep(min(int(hint.group(1)), 300) + 1)
                    continue
                if "budget" in detail.lower() and not hint:
                    raise RuntimeError(f"HTTP 429 (orçamento diário esgotado) for {url.split('?')[0]}: {detail[:200]}") from e
        except (urllib.error.URLError, TimeoutError) as e:
            last = e
        attempt += 1
        time.sleep(3 * attempt ** 2)
    raise RuntimeError(f"request failed after {retries} tries: {url.split('?')[0]}: {last}")


def _openalex_key():
    key = os.environ.get("OPENALEX_API_KEY", "").strip()
    env_file = os.path.expanduser("~/.config/pawatch/openalex.env")
    if not key and os.path.exists(env_file):  # local runs: same file the handoff documents
        for line in open(env_file, encoding="utf-8"):
            name, _, value = line.strip().partition("=")
            if name.strip().removeprefix("export ").strip() == "OPENALEX_API_KEY":
                key = value.strip().strip('"').strip("'")
    return key


def get_text(url, params=None, **kw):
    global _openalex_key_ok
    params = dict(params or {})
    key = _openalex_key()
    use_key = OPENALEX_HOST in url and key and _openalex_key_ok and "api_key" not in params
    if use_key:
        params["api_key"] = key
    full = f"{url}?{urllib.parse.urlencode(params)}" if params else url
    try:
        return _request(full, **kw)
    except RuntimeError as e:
        if use_key and any(f"HTTP {c}" in str(e) for c in (401, 403)):
            _openalex_key_ok = False  # key refused: keep going on the shared free budget
            params.pop("api_key")
            return _request(f"{url}?{urllib.parse.urlencode(params)}" if params else url, **kw)
        raise


def get_json(url, params=None, **kw):
    return json.loads(get_text(url, params, **kw))


def get_bytes(url, params=None, **kw):
    """Raw body (ZIPs, CSVs in latin-1): same retries as get_text, no decoding."""
    full = f"{url}?{urllib.parse.urlencode(params)}" if params else url
    return _request(full, raw=True, **kw)


def post_json(url, payload, headers=None, **kw):
    return json.loads(_request(url, data=payload, headers=headers, **kw))
