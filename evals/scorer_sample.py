"""Build a sample to evaluate the paper scorer (src/pawatch/score.py) against a stronger model.

For one topic: collect candidates as the daily run does (ignoring what was already seen, so a past window can be
re-read), run the CURRENT prefilter + triage, and save every candidate with its full abstract and the triage result
(or "not sent to the LLM" for those the prefilter dropped). A stratified subset (high, middle, low, prefilter-dropped)
goes to the reference judge.

    PYTHONPATH=src python evals/scorer_sample.py --topic fraude-bancaria --days 14 --n 50

Writes evals/scorer/<date>-<topic>.json. Costs: OpenAlex calls (cents) and one triage pass (cents).
"""

import argparse
import json
import random
import sys
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from pawatch.collect import collect  # noqa: E402
from pawatch.llm import LLM  # noqa: E402
from pawatch.score import prefilter, triage  # noqa: E402
from pawatch.topic import Topic  # noqa: E402


def log(m):
    print(m, file=sys.stderr, flush=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--topic", required=True)
    ap.add_argument("--days", type=int, default=14)
    ap.add_argument("--n", type=int, default=50, help="candidates in the sample for the reference judge")
    ap.add_argument("--seed", type=int, default=7)
    a = ap.parse_args()
    topic = Topic(a.topic)
    cfg = topic.queries()
    cfg["lookback_days"] = a.days
    today = date.today()
    cands = collect(cfg, topic.watchlist(), set(), today, log, sources=topic.sources(), web_state={})
    sel = cfg["selection"]
    pool = prefilter(cands, sel["max_candidates_for_llm"], topic.meta["prefilter_keywords"])
    pooled = {id(c) for c in pool}
    llm = LLM()
    scores = triage(llm, pool, topic, log=log)
    rows = []
    for i, c in enumerate(pool):
        s = scores.get(i)
        rows.append({"title": c["title"], "url": c["url"], "venue": c["venue"], "date": c["date"], "origin": c["origin"],
                     "authors": c["authors"][:8], "institutions": c["institutions"][:4], "watch_authors": c["watch_authors"],
                     "watch_journal": c["watch_journal"], "watch_source": c.get("watch_source", ""), "cited_by": c["cited_by"],
                     "abstract": c["abstract"], "triage": {"score": s[0], "theme": s[1]} if s else None, "prefilter": "enviado"})
    for c in cands:
        if id(c) not in pooled:
            rows.append({"title": c["title"], "url": c["url"], "venue": c["venue"], "date": c["date"], "origin": c["origin"],
                         "authors": c["authors"][:8], "institutions": c["institutions"][:4], "watch_authors": c["watch_authors"],
                         "watch_journal": c["watch_journal"], "watch_source": c.get("watch_source", ""), "cited_by": c["cited_by"],
                         "abstract": c["abstract"], "triage": None, "prefilter": "cortado"})
    # stratified sample: what the triage put high, middle, low, and some the prefilter never sent
    rnd = random.Random(a.seed)
    scored = [r for r in rows if r["triage"]]
    bands = [[r for r in scored if r["triage"]["score"] >= 7], [r for r in scored if 5 <= r["triage"]["score"] < 7],
             [r for r in scored if r["triage"]["score"] < 5], [r for r in rows if r["prefilter"] == "cortado"]]
    quota = [round(a.n * f) for f in (0.3, 0.3, 0.25, 0.15)]
    sample = []
    for band, q in zip(bands, quota):
        sample += rnd.sample(band, min(q, len(band)))
    out = ROOT / "evals" / "scorer" / f"{today.isoformat()}-{topic.slug}.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps({"topic": topic.slug, "window_days": a.days, "generated": today.isoformat(),
                               "rubric_focus": topic.meta.get("rubric_focus"), "rubric_strong": topic.meta.get("rubric_strong"),
                               "off_topic": topic.meta.get("off_topic"), "themes": topic.themes,
                               "counts": {"candidates": len(cands), "sent": len(pool), "scored": len(scored)},
                               "triage_usage": llm.usage, "all": rows, "sample": sample}, ensure_ascii=False, indent=1), encoding="utf-8")
    log(f"{len(cands)} candidatos, {len(pool)} para a triagem, amostra {len(sample)} → {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
