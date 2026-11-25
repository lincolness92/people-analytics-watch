"""Precomputed search index per topic (dist/<topic>/search.json), read by server/archive.js.

The serving side used to rebuild the corpus and BM25 statistics on every question, inside a Worker with a
per-request CPU limit. The pipeline now builds them once at render time: the documents (same units as
`corpus()` in server/archive.js) plus an inverted index, so a query only touches the postings of its terms.

`tokens()` and `build_docs()` must stay in lockstep with `tokens()` and `corpus()` in server/archive.js;
tests/test_pipeline.py runs both on the same fixture and compares.
"""

import re
import unicodedata
from collections import Counter

INDEX_VERSION = 2
# watchlist sections → document kind (people, venues and institutions the curation follows)
WATCH_KINDS = {"researchers": "pessoa de referência", "historical": "pessoa de referência (histórica)",
               "journals": "revista ou evento de referência", "centers": "instituição de referência",
               "practitioners": "praticante de referência"}
DOC_TEXT_CHARS = 900  # what the agent shows the LLM per source

STOP = set(("a o os as um uma uns umas de da do das dos em no na nos nas por para pra com sem sobre entre e ou que "
            "qual quais quanto como onde quando porque se ser é são foi há ter tem mais menos muito muita isso isto esse essa este esta "
            "eu você vocês nós ele ela eles elas me te lhe meu minha seu sua the of and or to in on for with by from at as is are was be "
            "what which how why when does do did can could should would about into than that this these those it its an any some").split(" "))


def tokens(text):
    s = unicodedata.normalize("NFD", (text or "").lower())
    s = re.sub("[̀-ͯ]", "", s)
    out = []
    for t in re.split(r"[^a-z0-9]+", s):
        if len(t) > 2 and t not in STOP:
            out.append(t[:-1] if len(t) > 4 and t.endswith("s") else t)
    return out


def _j(*parts):
    return " ".join("" if p is None else str(p) for p in parts)


def build_docs(data, library=(), repos=()):
    """Mirror of corpus() in server/archive.js: every searchable unit of a topic's archive.

    `repos`: the code repositories linked to the topic's papers ({url, description, readme, paper_titles, language,
    stars, license, own, pushed_at}), see render.topic_repos.
    """
    themes = data.get("themes") or {}
    docs = []
    for d in data.get("digests") or []:
        for it in d.get("items") or []:
            docs.append({"kind": "paper", "title": it.get("title"), "url": it.get("url"), "when": d.get("date"),
                         "venue": it.get("venue"),
                         "text": _j(it.get("title"), it.get("original_title"), it.get("summary"), it.get("venue"),
                                    " ".join(it.get("authors") or []), themes.get(it.get("theme")))})
        for q in d.get("quick") or []:
            docs.append({"kind": "paper", "title": q.get("title"), "url": q.get("url"), "when": d.get("date"),
                         "venue": q.get("venue"),
                         "text": _j(q.get("title"), q.get("original_title"), q.get("note"), q.get("venue"))})
        if d.get("trend"):
            docs.append({"kind": "tendência", "title": f"Tendência de {d['date']}", "url": None, "when": d["date"],
                         "text": d["trend"]})
    ev = data.get("evolution")
    if ev:
        for e in ev.get("eras") or []:
            for m in e.get("milestones") or []:
                docs.append({"kind": "marco", "title": m.get("title"), "url": m.get("url"), "when": str(m.get("year") or ""),
                             "venue": m.get("venue"),
                             "text": _j(m.get("title"), m.get("why"), " ".join(m.get("authors") or []), e.get("title"),
                                        e.get("summary"), themes.get(m.get("theme")))})
        now = ev.get("now") or {}
        if now.get("summary"):
            docs.append({"kind": "evolução", "title": "Onde estamos agora", "url": None, "when": ev.get("generated"),
                         "text": " ".join([now["summary"], *(now.get("open_questions") or [])])})
    for year, a in (data.get("annual") or {}).items():
        label = f"retrospectiva {year}{' (parcial)' if a.get('partial') else ''}"
        if a.get("overview"):
            docs.append({"kind": label, "title": f"Panorama de {year}", "url": None, "when": year, "text": a["overview"]})
        if a.get("innovation"):
            docs.append({"kind": label, "title": f"Onde a inovação acontece em {year}", "url": None, "when": year,
                         "text": a["innovation"]})
        for t in a.get("trends") or []:
            docs.append({"kind": label, "title": t.get("title"), "url": None, "when": year,
                         "text": f"{t.get('title')}. {t.get('text')}"})
        for h in a.get("highlights") or []:
            docs.append({"kind": f"destaque de {year}", "title": h.get("title"), "url": h.get("url"),
                         "when": (h.get("date") or year)[:10], "venue": h.get("venue"),
                         "text": _j(h.get("title"), h.get("original_title"), h.get("why"), h.get("venue"),
                                    " ".join(h.get("authors") or []), themes.get(h.get("theme")))})
    seen = {d["url"] for d in docs if d.get("url")}
    for p in library:
        if not p.get("url") or p["url"] in seen:
            continue
        seen.add(p["url"])
        docs.append({"kind": "paper triado", "title": p.get("title"), "url": p["url"], "when": p.get("date"),
                     "venue": p.get("venue"),
                     "text": _j(p.get("title"), p.get("abstract"), p.get("venue"), " ".join(p.get("authors") or []),
                                themes.get(p.get("theme")))})
    # Watchlist: who and what the curation follows (answers "who should I follow?")
    for key, items in (data.get("watchlist") or {}).items():
        for w in items if isinstance(items, list) else []:
            docs.append({"kind": WATCH_KINDS.get(key, "referência"), "title": w.get("name"), "url": w.get("url"), "when": None,
                         "venue": None,
                         "text": _j(w.get("name"), w.get("institution"), w.get("org"), w.get("region"), w.get("area"), w.get("why"))})
    # Code: repositories found in the papers (answers "is there an implementation?")
    for r in repos:
        name = "/".join(r["url"].rstrip("/").split("/")[-2:])
        docs.append({"kind": "código" + (" dos autores" if r.get("own") else ""), "title": name, "url": r["url"],
                     "when": (r.get("pushed_at") or "")[:10] or None, "venue": None,
                     "text": _j(name, r.get("description"), " | ".join(r.get("paper_titles") or []), r.get("language"),
                                f"{r.get('stars')} estrelas" if r.get("stars") is not None else None, r.get("license"),
                                (r.get("readme") or "")[:1500])})
    return docs


def build_index(data, library=(), repos=()):
    """{version, n, avgdl, docs, len, postings{term: [doc, tf, doc, tf, ...]}} — BM25 stats precomputed."""
    docs = build_docs(data, library, repos)
    lens, postings = [], {}
    for i, d in enumerate(docs):
        toks = tokens(d["text"])
        lens.append(len(toks))
        for t, f in Counter(toks).items():
            postings.setdefault(t, []).extend((i, f))
        d["text"] = (d["text"] or "")[:DOC_TEXT_CHARS]
    n = len(docs)
    return {"version": INDEX_VERSION, "n": n, "avgdl": (sum(lens) / n) if n else 1, "docs": docs, "len": lens,
            "postings": postings}
