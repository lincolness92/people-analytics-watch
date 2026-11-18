"""CLI: python -m pawatch {run,render,bundle,notify,new-topic}. Without --topic, run every topic."""

import argparse
import json
import os
import re
import sys
from datetime import date, timedelta
from pathlib import Path

from . import ROOT
from .bundle import bundle
from .collect import collect, norm_title
from .http import post_json
from .llm import LLM
from .render import digest_markdown, render_all
from .score import prefilter, triage, write_digest
from .topic import pick


def log(msg):
    print(msg, file=sys.stderr, flush=True)


def load_json(path, default):
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else default


def run_topic(topic, args):
    today = date.fromisoformat(args.date) if args.date else date.today()
    out_path = topic.digests_json / f"{today.isoformat()}.json"
    if out_path.exists() and not args.force:
        log(f"[{topic.slug}] digest {today} já existe (use --force para refazer)")
        return True

    cfg = topic.queries()
    if args.lookback:
        cfg["lookback_days"] = args.lookback
    watch = topic.watchlist()
    seen_path = topic.data / "seen.json"
    seen = load_json(seen_path, {})
    if args.force:
        # Redoing the day: papers judged in the earlier run of this same day must be eligible again.
        seen = {k: v for k, v in seen.items() if v != today.isoformat()}

    web_state_path = topic.data / "web_state.json"
    web_state = load_json(web_state_path, {})
    cands = collect(cfg, watch, set(seen), today, log, sources=topic.sources(), web_state=web_state)
    sel = cfg["selection"]
    pool = prefilter(cands, sel["max_candidates_for_llm"], topic.meta["prefilter_keywords"])
    log(f"[{topic.slug}] enviando {len(pool)} candidatos para triagem")

    llm = LLM()
    scores = triage(llm, pool, topic, log=log)
    if not scores:
        log(f"[{topic.slug}] triagem não retornou nada — abortando sem gravar")
        return False
    from .library import add as add_to_library
    kept = add_to_library(topic, pool, scores, origin="digest", when=today.isoformat())
    log(f"[{topic.slug}] biblioteca: +{kept} papers com nota ≥ 5")
    result = write_digest(llm, pool, scores, sel, topic) or {"headline": "", "trend": "", "items": [], "quick": []}

    digest = {
        "date": today.isoformat(),
        "model": llm.used_model,
        "period": {"from": (today - timedelta(days=cfg["lookback_days"])).isoformat(), "to": today.isoformat()},
        "stats": {"candidates": len(cands), "triaged": len(scores),
                  "selected": len(result["items"]), "tokens": llm.usage},
        **result,
    }
    topic.digests_json.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(digest, ensure_ascii=False, indent=1), encoding="utf-8")

    # Only mark as seen what the LLM actually judged; the rest can come back tomorrow.
    for i in scores:
        c = pool[i]
        seen[c["key"]] = today.isoformat()
        seen[f"t:{norm_title(c['title'])}"] = today.isoformat()
    seen_path.write_text(json.dumps(seen, ensure_ascii=False, indent=0, sort_keys=True), encoding="utf-8")
    # Saved only after a digest is written, so a failed run does not swallow new web links.
    web_state_path.write_text(json.dumps(web_state, ensure_ascii=False, indent=0, sort_keys=True), encoding="utf-8")
    log(f"[{topic.slug}] ok: {len(result['items'])} selecionados, {len(result['quick'])} menções; tokens {llm.usage}")
    return True


def cmd_run(args):
    results = {}
    for topic in pick(args.topic):
        try:
            results[topic.slug] = run_topic(topic, args)
        except Exception as e:  # one broken topic must not block the others
            log(f"[{topic.slug}] falhou: {e!r}")
            results[topic.slug] = False
    log(f"render: {render_all()}")
    failed = [s for s, ok in results.items() if not ok]
    if failed:
        log(f"temas com falha: {', '.join(failed)}")
    # Exit non-zero only when nothing worked, so the workflow still commits the topics that did.
    return 1 if failed and len(failed) == len(results) else 0


def cmd_render(_args):
    log(f"render: {render_all()}")
    return 0


def cmd_bundle(args):
    render_all()
    for topic in pick(args.topic):
        ds = topic.digests()
        latest = ds[0]["date"] if ds else date.today().isoformat()
        out = Path(args.out) if args.out else ROOT / "share" / f"{topic.slug}-watch{'-' + args.theme if args.theme else ''}-{latest}.html"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(bundle(topic.slug, args.theme), encoding="utf-8")
        log(f"bundle: {out} ({out.stat().st_size // 1024} KB)")
    return 0


def cmd_notify(args):
    """Post each topic's digest to a Discord webhook (DISCORD_WEBHOOK_URL), split into ≤1900-char messages."""
    url = os.environ.get("DISCORD_WEBHOOK_URL", "").strip()
    if not url:
        log("DISCORD_WEBHOOK_URL não definido — pulando")
        return 0
    day = args.date or date.today().isoformat()
    for topic in pick(args.topic):
        path = topic.digests_json / f"{day}.json"
        if not path.exists():
            log(f"[{topic.slug}] sem digest para {day}")
            continue
        md = digest_markdown(load_json(path, {}), topic).split("\n", 2)[-1]
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
        log(f"[{topic.slug}] discord: {len(chunks)} mensagens")
    return 0


def cmd_evolve(args):
    from .evolution import evolve
    month = date.today().strftime("%Y-%m")
    ok = True
    for topic in pick(args.topic):
        out = topic.data / "evolution" / f"{date.today().isoformat()}.json"
        if args.if_stale and any((topic.data / "evolution").glob(f"{month}-*.json")):
            log(f"[{topic.slug}] evolução de {month} já existe — pulando")
            continue
        try:
            ev = evolve(topic, LLM(), full=args.full or args.rejudge, rejudge=args.rejudge, log=lambda m, s=topic.slug: log(f"[{s}] {m}"))
        except Exception as e:  # one topic failing must not block the others
            log(f"[{topic.slug}] evolução falhou: {e!r}")
            ok = False
            continue
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(ev, ensure_ascii=False, indent=1), encoding="utf-8")
        ch = ev.get("changes") or {}
        log(f"[{topic.slug}] evolução ({ev['mode']}): {ev['stats']['milestones']} marcos em {len(ev['eras'])} épocas, "
            f"+{len(ch.get('added', []))}/-{len(ch.get('removed', []))}; tokens {ev['stats']['tokens']}")
        # The monthly run also refreshes the annual review: current year always, last year once.
        this_year = date.today().year
        for year in (this_year - 1, this_year):
            if year < this_year and (topic.data / "annual" / f"{year}.json").exists() and not args.full:
                continue
            ok = run_annual(topic, year) and ok
    log(f"render: {render_all()}")
    return 0 if ok else 1


def run_annual(topic, year):
    from .annual import build
    try:
        d = build(topic, year, LLM(), log=lambda m, s=topic.slug: log(f"[{s}] {m}"))
    except Exception as e:  # one topic failing must not block the others
        log(f"[{topic.slug}] retrospectiva {year} falhou: {e!r}")
        return False
    lib = d.pop("_library", None)
    if lib:
        from .library import add as add_to_library
        log(f"[{topic.slug}] biblioteca: +{add_to_library(topic, *lib, origin=f'anual {year}')} papers da retrospectiva")
    out = topic.data / "annual" / f"{year}.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(d, ensure_ascii=False, indent=1), encoding="utf-8")
    log(f"[{topic.slug}] retrospectiva {year}: {d['stats']['highlights']} destaques, {len(d['trends'])} tendências; "
        f"OpenAlex ≈ ${d['stats']['openalex_cost']}; tokens {d['stats']['tokens']}")
    return True


def cmd_annual(args):
    years = [int(y) for y in args.year] if args.year else [date.today().year - 1, date.today().year]
    ok = all([run_annual(topic, y) for topic in pick(args.topic) for y in years])
    log(f"render: {render_all()}")
    return 0 if ok else 1


def cmd_feedback(_args):
    from .feedback import run
    return run(log=log)


def cmd_new_topic(args):
    from .bootstrap import new_topic
    return new_topic(args.name, args.slug, log=log)


def main():
    p = argparse.ArgumentParser(prog="pawatch")
    sub = p.add_subparsers(dest="cmd", required=True)
    r = sub.add_parser("run", help="coleta + curadoria + render (todos os temas, ou --topic)")
    r.add_argument("--topic", help="slug em topics/ (padrão: todos)")
    r.add_argument("--date", help="YYYY-MM-DD (padrão: hoje)")
    r.add_argument("--lookback", type=int, help="dias para trás na busca (padrão: queries.json do tema)")
    r.add_argument("--force", action="store_true", help="refaz o digest do dia")
    r.set_defaults(fn=cmd_run)
    sub.add_parser("render", help="regera digests/<tema>/*.md, INDEX.md e dist/").set_defaults(fn=cmd_render)
    b = sub.add_parser("bundle", help="gera um HTML autocontido por tema em share/")
    b.add_argument("--topic", help="slug do tema (padrão: todos)")
    b.add_argument("--theme", help="tema visual extra em themes/<nome>/ (ex.: bb)")
    b.add_argument("--out", help="caminho do arquivo (só com --topic)")
    b.set_defaults(fn=cmd_bundle)
    n = sub.add_parser("notify", help="envia o digest ao Discord (opcional)")
    n.add_argument("--topic")
    n.add_argument("--date")
    n.set_defaults(fn=cmd_notify)
    e = sub.add_parser("evolve", help="linha do tempo do estado da arte (rede de citações + LLM), mensal")
    e.add_argument("--topic", help="slug do tema (padrão: todos)")
    e.add_argument("--if-stale", action="store_true", help="só gera se o mês atual ainda não tiver versão")
    e.add_argument("--full", action="store_true", help="revisão completa: refaz seleção e texto do zero (reaproveita as notas do cache)")
    e.add_argument("--rejudge", action="store_true", help="como --full, mas manda todas as obras de novo para a triagem do LLM")
    e.set_defaults(fn=cmd_evolve)
    sub.add_parser("feedback", help="KV do feedback: garante namespace, gera wrangler.toml e exporta para data/<tema>/feedback.json").set_defaults(fn=cmd_feedback)
    an = sub.add_parser("annual", help="retrospectiva anual por tema (padrão: ano passado e o atual)")
    an.add_argument("--topic", help="slug do tema (padrão: todos)")
    an.add_argument("--year", nargs="*", help="anos, ex.: 2025 2026")
    an.set_defaults(fn=cmd_annual)
    t = sub.add_parser("new-topic", help="monta o rascunho de um tema novo em topics/<slug>/")
    t.add_argument("name", help='nome do tema, ex.: "fraude bancária"')
    t.add_argument("--slug", help="pasta em topics/ (padrão: derivado do nome)")
    t.set_defaults(fn=cmd_new_topic)
    args = p.parse_args()
    if getattr(args, "out", None) and not args.topic:
        p.error("--out exige --topic")
    sys.exit(args.fn(args))


if __name__ == "__main__":
    main()
