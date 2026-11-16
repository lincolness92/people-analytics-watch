"""Small stdlib HTTP helpers with retries (no third-party deps)."""

import json
import time
import urllib.error
import urllib.parse
import urllib.request

USER_AGENT = "people-analytics-watch/0.1 (research digest)"


def _request(url, data=None, headers=None, timeout=60, retries=3):
    hdrs = {"User-Agent": USER_AGENT}
    hdrs.update(headers or {})
    body = None
    if data is not None:
        body = json.dumps(data).encode("utf-8")
        hdrs.setdefault("Content-Type", "application/json")
    last = None
    for attempt in range(retries):
        req = urllib.request.Request(url, data=body, headers=hdrs)
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return resp.read().decode("utf-8", errors="replace")
        except urllib.error.HTTPError as e:
            last = e
            detail = e.read().decode("utf-8", errors="replace")[:500]
            # 4xx other than 429 will not get better by retrying
            if e.code != 429 and 400 <= e.code < 500:
                raise RuntimeError(f"HTTP {e.code} for {url.split('?')[0]}: {detail}") from e
        except (urllib.error.URLError, TimeoutError) as e:
            last = e
        time.sleep(2 * (attempt + 1))
    raise RuntimeError(f"request failed after {retries} tries: {url.split('?')[0]}: {last}")


def get_text(url, params=None, **kw):
    if params:
        url = f"{url}?{urllib.parse.urlencode(params)}"
    return _request(url, **kw)


def get_json(url, params=None, **kw):
    return json.loads(get_text(url, params, **kw))


def post_json(url, payload, headers=None, **kw):
    return json.loads(_request(url, data=payload, headers=headers, **kw))
