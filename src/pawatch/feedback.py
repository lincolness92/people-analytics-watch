"""Reader feedback stored in Cloudflare KV by functions/api/feedback.js.

`python -m pawatch feedback` (in CI, with CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID):
1. makes sure the KV namespace exists (creates it the first time);
2. writes wrangler.toml binding it as FEEDBACK, so `wrangler pages deploy` attaches it;
3. exports entries not yet in the repo, append-only and keyed by KV key: reader feedback ("fb:")
   to data/<topic>/feedback.json and questions asked to the AI box ("ask:") to data/<topic>/questions.json.
"""

import json
import os
import sys
import urllib.parse

from . import DATA, ROOT
from .http import get_json, post_json

API = "https://api.cloudflare.com/client/v4/accounts/{account}/storage/kv/namespaces"
NAMESPACE = "paw-feedback"


class KV:
    def __init__(self, token, account, get=get_json, post=post_json):
        self.base = API.format(account=account)
        self.h = {"Authorization": f"Bearer {token}"}
        self._get, self._post = get, post

    def namespace_id(self, title=NAMESPACE):
        page = 1
        while True:
            res = self._get(self.base, {"per_page": 100, "page": page}, headers=self.h)
            for ns in res.get("result") or []:
                if ns.get("title") == title:
                    return ns["id"], False
            info = res.get("result_info") or {}
            if page >= (info.get("total_pages") or 1):
                break
            page += 1
        res = self._post(self.base, {"title": title}, headers=self.h)
        return res["result"]["id"], True

    def keys(self, ns, prefix="fb:"):
        out, cursor = [], None
        while True:
            params = {"prefix": prefix, "limit": 1000}
            if cursor:
                params["cursor"] = cursor
            res = self._get(f"{self.base}/{ns}/keys", params, headers=self.h)
            out += [k["name"] for k in res.get("result") or []]
            cursor = (res.get("result_info") or {}).get("cursor")
            if not cursor:
                return out

    def value(self, ns, key):
        return self._get(f"{self.base}/{ns}/values/{urllib.parse.quote(key, safe='')}", headers=self.h)


def write_wrangler_toml(ns_id, project):
    (ROOT / "wrangler.toml").write_text(
        f'name = "{project}"\n'
        'pages_build_output_dir = "dist"\n'
        'compatibility_date = "2024-09-23"\n\n'
        "[[kv_namespaces]]\n"
        'binding = "FEEDBACK"\n'
        f'id = "{ns_id}"\n', encoding="utf-8")


def export(kv, ns, log, prefix="fb:", filename="feedback.json"):
    """Append KV entries missing from data/<topic>/<filename>. Returns {topic: new count}."""
    files = {}

    def bucket(topic):
        if topic not in files:
            path = DATA / topic / filename
            files[topic] = (path, json.loads(path.read_text(encoding="utf-8")) if path.exists() else [])
        return files[topic][1]

    known = set()
    for path in DATA.glob(f"*/{filename}"):
        known |= {e["key"] for e in json.loads(path.read_text(encoding="utf-8"))}
    added = {}
    for key in kv.keys(ns, prefix=prefix):
        if key in known:
            continue
        topic = key.split(":")[1]
        if not (DATA / topic).is_dir():
            continue  # unknown topic slug: ignore
        try:
            entry = kv.value(ns, key)
        except (RuntimeError, ValueError) as e:
            log(f"feedback: {key} ilegível: {e}")
            continue
        bucket(topic).append(dict(entry, key=key))
        added[topic] = added.get(topic, 0) + 1
    for topic, (path, entries) in files.items():
        entries.sort(key=lambda e: e.get("at", ""))
        path.write_text(json.dumps(entries, ensure_ascii=False, indent=1), encoding="utf-8")
    return added


def summary(entries):
    """Latest vote per (voter, ref) and every comment, for a quick read in the workflow log."""
    latest = {}
    for e in entries:
        if e.get("vote"):
            latest[(e.get("voter"), e.get("kind"), e.get("ref"))] = e
    up = sum(1 for e in latest.values() if e["vote"] == "up")
    down = sum(1 for e in latest.values() if e["vote"] == "down")
    comments = [e for e in entries if e.get("comment")]
    return {"up": up, "down": down, "comments": len(comments),
            "people": len({e.get("name") or e.get("voter") for e in entries})}


def run(log=lambda m: print(m, file=sys.stderr)):
    token = os.environ.get("CLOUDFLARE_API_TOKEN", "").strip()
    account = os.environ.get("CLOUDFLARE_ACCOUNT_ID", "").strip()
    if not (token and account):
        log("feedback: CLOUDFLARE_API_TOKEN/ACCOUNT_ID ausentes — pulando")
        return 0
    kv = KV(token, account)
    ns, created = kv.namespace_id()
    log(f"feedback: namespace {NAMESPACE} {'criado' if created else 'ok'}")
    write_wrangler_toml(ns, os.environ.get("CF_PAGES_PROJECT") or "people-analytics-watch")
    added = export(kv, ns, log)
    asked = export(kv, ns, log, prefix="ask:", filename="questions.json")
    for topic, n in sorted(asked.items()):
        log(f"perguntas [{topic}]: +{n} novas")
    for path in sorted(DATA.glob("*/feedback.json")):
        s = summary(json.loads(path.read_text(encoding="utf-8")))
        log(f"feedback [{path.parent.name}]: +{added.get(path.parent.name, 0)} novos; "
            f"👍 {s['up']} · 👎 {s['down']} · {s['comments']} comentários · {s['people']} pessoas")
    return 0
