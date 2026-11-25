"""Per-topic library of triaged papers (score >= LIB_MIN), with their original abstracts.

The daily triage judges hundreds of candidates but only ~12 make the digest. The library keeps every
candidate the LLM scored at least LIB_MIN, so the Pergunte box can answer from a much larger, still
curated archive. Stored by month in data/<topic>/library/<YYYY-MM>.json; the site publishes the merged
file as <topic>/library.json, read only by functions/api/ask.js (the pages never load it).
"""

import json
from datetime import date

LIB_MIN = 5
MAX_ENTRIES = 2500  # what the Pergunte function loads per question: keep it a couple of MB
EXPORT_ABSTRACT = 800


def entry(c, score, theme, region, origin, when):
    return {"key": c["key"], "title": c["title"], "url": c["url"], "venue": c.get("venue") or "",
            "date": c.get("date") or "", "authors": (c.get("authors") or [])[:6],
            "abstract": (c.get("abstract") or "")[:1200], "score": score, "theme": theme, "region": region or "",
            "watch": c.get("watch_authors") or ([c["watch_source"]] if c.get("watch_source") else []),
            "origin": origin, "added": when, **({"triage": c["triage"]} if c.get("triage") else {})}


def add(topic, cands, scores, origin, when=None):
    """Append the candidates scored >= LIB_MIN; returns how many were new."""
    when = when or date.today().isoformat()
    path = topic.data / "library" / f"{when[:7]}.json"
    cur = json.loads(path.read_text(encoding="utf-8")) if path.exists() else []
    have = {e["key"] for e in cur}
    new = []
    for i, s in scores.items():
        if s[0] >= LIB_MIN and cands[i]["key"] not in have:
            have.add(cands[i]["key"])
            new.append(entry(cands[i], s[0], s[1], s[2] if len(s) > 2 else "", origin, when))
    if new:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(cur + new, ensure_ascii=False, indent=0), encoding="utf-8")
    return len(new)


def load(topic):
    """Library for the site: one entry per paper (latest judgement wins), best scores and newest first,
    capped at MAX_ENTRIES with shortened abstracts."""
    out, seen = [], set()
    for f in sorted((topic.data / "library").glob("*.json"), reverse=True):
        for e in reversed(json.loads(f.read_text(encoding="utf-8"))):
            if e["key"] not in seen:
                seen.add(e["key"])
                out.append(e)
    out = sorted(out[:], key=lambda e: (e["score"], e.get("added") or "", e.get("date") or ""), reverse=True)[:MAX_ENTRIES]
    return [dict(e, abstract=e["abstract"][:EXPORT_ABSTRACT]) for e in out]
