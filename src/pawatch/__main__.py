"""CLI: python -m pawatch {run,render,notify}."""

import argparse
import json
import os
import re
import sys
from datetime import date

from . import CONFIG, DATA, DIGESTS_MD
from .collect import collect, norm_title
from .http import post_json
from .llm import LLM
from .render import digest_markdown, render_all
from .score import prefilter, triage, write_digest


def log(msg):
    print(msg, file=sys.stderr, flush=True)


def load_json(path, default):
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else default


def cmd_run(args):
    today = date.fromisoformat(args.date) if args.date else date.today()
    out_path = DATA / "digests" / f"{today.isoformat()}.json"
    if out_path.exists() and not args.force:
        log(f"digest {today} já existe (use --force para refazer)")
        return 0

    cfg = load_json(CONFIG / "queries.json", {})
    if args.lookback:
        cfg["lookback_days"] = args.lookback
    watch = load_json(CONFIG / "watchlist.json", {})
    seen_path = DATA / "seen.json"
    seen = load_json(seen_path, {})

    cands = collect(cfg, watch, set(seen), today, log)
    sel = cfg["selection"]
    pool = prefilter(cands, sel["max_candidates_for_llm"])
    log(f"enviando {len(pool)} candidatos para triagem")

    llm = LLM()
    scores = triage(llm, pool, log=log)
    if not scores:
        log("triagem não retornou nada — abortando sem gravar")
        return 1
    result = write_digest(llm, pool, scores, sel) or {"headline": "", "trend": "", "items": [], "quick": []}

    digest = {
        "date": today.isoformat(),
        "model": llm.used_model,
        "stats": {"candidates": len(cands), "triaged": len(scores),
                  "selected": len(result["items"]), "tokens": llm.usage},
        **result,
    }
    DATA.joinpath("digests").mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(digest, ensure_ascii=False, indent=1), encoding="utf-8")

    # Only mark as seen what the LLM actually judged; the rest can come back tomorrow.
    for i in scores:
        c = pool[i]
        seen[c["key"]] = today.isoformat()
        seen[f"t:{norm_title(c['title'])}"] = today.isoformat()
    seen_path.write_text(json.dumps(seen, ensure_ascii=False, indent=0, sort_keys=True), encoding="utf-8")

    n = render_all()
    log(f"ok: {len(result['items'])} selecionados, {len(result['quick'])} menções; "
        f"{n} digests no arquivo; tokens {llm.usage}")
    return 0


def cmd_render(_args):
    log(f"render: {render_all()} digests")
    return 0


def cmd_notify(args):
    """Post a digest to a Discord webhook (DISCORD_WEBHOOK_URL), split into ≤1900-char messages."""
    url = os.environ.get("DISCORD_WEBHOOK_URL", "").strip()
    if not url:
        log("DISCORD_WEBHOOK_URL não definido — pulando")
        return 0
    day = args.date or date.today().isoformat()
    path = DATA / "digests" / f"{day}.json"
    if not path.exists():
        log(f"sem digest para {day}")
        return 0
    md = digest_markdown(load_json(path, {})).split("\n", 2)[-1]
    md = re.sub(r"\]\((https?://[^)\s]+)\)", r"](<\1>)", md)  # <url> suppresses Discord embeds
    chunks, buf = [], ""
    for para in md.split("\n"):
        if len(buf) + len(para) + 1 > 1900:
            chunks.append(buf)
            buf = ""
        buf += para + "\n"
    chunks.append(buf)
    for ch in filter(str.strip, chunks):
        post_json(url, {"content": ch[:2000]})
    log(f"discord: {len(chunks)} mensagens")
    return 0


def main():
    p = argparse.ArgumentParser(prog="pawatch")
    sub = p.add_subparsers(dest="cmd", required=True)
    r = sub.add_parser("run", help="coleta + curadoria + render do dia")
    r.add_argument("--date", help="YYYY-MM-DD (padrão: hoje)")
    r.add_argument("--lookback", type=int, help="dias para trás na busca (padrão: config)")
    r.add_argument("--force", action="store_true", help="refaz o digest do dia")
    r.set_defaults(fn=cmd_run)
    sub.add_parser("render", help="regera digests/*.md, INDEX.md e dist/").set_defaults(fn=cmd_render)
    n = sub.add_parser("notify", help="envia o digest ao Discord (opcional)")
    n.add_argument("--date")
    n.set_defaults(fn=cmd_notify)
    args = p.parse_args()
    sys.exit(args.fn(args))


if __name__ == "__main__":
    main()
