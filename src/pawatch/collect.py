"""Collect candidate papers from OpenAlex (queries, watchlist authors, journals), arXiv and
the web sources of watchlist centers and practitioners."""

import re
import sys
import xml.etree.ElementTree as ET
from datetime import date, timedelta

from .http import get_json, get_text
from .web import collect_web

OPENALEX = "https://api.openalex.org/works"
ARXIV = "https://export.arxiv.org/api/query"
SELECT = ",".join([
    "id", "doi", "display_name", "publication_date", "type", "language",
    "primary_location", "authorships", "abstract_inverted_index", "cited_by_count",
])


def norm_title(t):
    return re.sub(r"[^a-z0-9]+", " ", (t or "").lower()).strip()


def rebuild_abstract(inv):
    if not inv:
        return ""
    pos = {}
    for word, idxs in inv.items():
        for i in idxs:
            pos[i] = word
    return " ".join(pos[i] for i in sorted(pos))


class OpenAlex:
    def __init__(self, start, end):
        self.start, self.end = start, end
        self.cost = 0.0
        self.calls = 0

    def works(self, filters, search=None, per_page=50, pages=1):
        out = []
        flt = [f"from_publication_date:{self.start}", f"to_publication_date:{self.end}"] + filters
        for page in range(1, pages + 1):
            params = {"filter": ",".join(flt), "per-page": per_page, "page": page, "select": SELECT}
            if search:
                params["filter"] += f",title_and_abstract.search:{search}"
            data = get_json(OPENALEX, params)
            self.calls += 1
            self.cost += float((data.get("meta") or {}).get("cost_usd") or 0)
            results = data.get("results") or []
            out += results
            if len(results) < per_page:
                break
        return out


def from_openalex(w, origin):
    loc = w.get("primary_location") or {}
    src = loc.get("source") or {}
    doi = (w.get("doi") or "").replace("https://doi.org/", "").lower()
    authors, author_ids, insts = [], [], []
    for a in w.get("authorships") or []:
        au = a.get("author") or {}
        if au.get("display_name"):
            authors.append(au["display_name"])
        if au.get("id"):
            author_ids.append(au["id"].rsplit("/", 1)[-1])
        for inst in a.get("institutions") or []:
            name = inst.get("display_name")
            if name and name not in insts:
                insts.append(name)
    url = f"https://doi.org/{doi}" if doi else (loc.get("landing_page_url") or w.get("id"))
    return {
        "key": f"doi:{doi}" if doi else f"oa:{w['id'].rsplit('/', 1)[-1]}",
        "title": (w.get("display_name") or "").strip(),
        "abstract": rebuild_abstract(w.get("abstract_inverted_index")),
        "authors": authors,
        "author_ids": author_ids,
        "institutions": insts[:6],
        "venue": src.get("display_name") or "",
        "source_id": (src.get("id") or "").rsplit("/", 1)[-1],
        "type": w.get("type") or "",
        "language": w.get("language") or "",
        "date": w.get("publication_date") or "",
        "url": url,
        "cited_by": w.get("cited_by_count") or 0,
        "origin": origin,
    }


def collect_openalex(cfg, watch, start, end, log):
    oa = OpenAlex(start, end)
    oc = cfg["openalex"]
    type_filter = "type:" + "|".join(oc["types"])
    raw = []

    for q in oc["queries"]:
        try:
            raw += [(w, "busca") for w in oa.works([type_filter], search=q, per_page=oc["per_query"])]
        except RuntimeError as e:
            log(f"openalex query failed ({q[:40]}…): {e}")

    author_ids = [r["openalex_id"] for r in watch.get("researchers", []) if r.get("openalex_id")]
    author_ids += [a for r in watch.get("researchers", []) for a in r.get("alt_openalex_ids") or []]
    for i in range(0, len(author_ids), 50):
        chunk = "|".join(author_ids[i:i + 50])
        try:
            raw += [(w, "watchlist") for w in oa.works([f"authorships.author.id:{chunk}"], per_page=100, pages=2)]
        except RuntimeError as e:
            log(f"openalex watchlist authors failed: {e}")

    source_ids = [j["openalex_source_id"] for j in watch.get("journals", []) if j.get("openalex_source_id")]
    if source_ids:
        try:
            raw += [(w, "journal") for w in oa.works(
                [f"primary_location.source.id:{'|'.join(source_ids)}", type_filter], per_page=100, pages=3)]
        except RuntimeError as e:
            log(f"openalex journals failed: {e}")

    log(f"openalex: {oa.calls} chamadas, custo ≈ ${oa.cost:.3f}, {len(raw)} resultados brutos")
    return [from_openalex(w, origin) for w, origin in raw]


def collect_arxiv(cfg, start, log):
    ac = cfg["arxiv"]
    params = {
        "search_query": ac["query"], "sortBy": "submittedDate", "sortOrder": "descending",
        "max_results": ac["max_results"],
    }
    try:
        xml = get_text(ARXIV, params)
    except RuntimeError as e:
        log(f"arxiv failed: {e}")
        return []
    ns = {"a": "http://www.w3.org/2005/Atom"}
    out = []
    for e in ET.fromstring(xml).findall("a:entry", ns):
        published = (e.findtext("a:published", "", ns) or "")[:10]
        if published < start:
            continue
        abs_url = e.findtext("a:id", "", ns).strip()
        arxiv_id = re.sub(r"v\d+$", "", abs_url.rsplit("/abs/", 1)[-1])
        cats = [c.get("term") for c in e.findall("a:category", ns)]
        out.append({
            "key": f"arxiv:{arxiv_id}",
            "title": " ".join(e.findtext("a:title", "", ns).split()),
            "abstract": " ".join(e.findtext("a:summary", "", ns).split()),
            "authors": [a.findtext("a:name", "", ns) for a in e.findall("a:author", ns)],
            "author_ids": [],
            "institutions": [],
            "venue": f"arXiv ({', '.join(cats[:2])})",
            "source_id": "",
            "type": "preprint",
            "language": "en",
            "date": published,
            "url": f"https://arxiv.org/abs/{arxiv_id}",
            "cited_by": 0,
            "origin": "arxiv",
        })
    log(f"arxiv: {len(out)} na janela")
    return out


def annotate_and_dedupe(items, watch, seen):
    """Merge duplicates (same DOI/title), tag watchlist hits, drop already-seen papers."""
    by_author = {}
    for r in watch.get("researchers", []):
        for aid in [r.get("openalex_id")] + list(r.get("alt_openalex_ids") or []):
            if aid:
                by_author[aid] = r["name"]
    watch_names = {r["name"].lower(): r["name"] for r in watch.get("researchers", [])}
    journal_ids = {j.get("openalex_source_id") for j in watch.get("journals", [])} - {None}

    merged, title_index = {}, {}
    for it in items:
        if not it["title"] or len(it["title"]) < 12:
            continue
        nt = norm_title(it["title"])
        key = title_index.get(nt, it["key"])
        if key in merged:
            prev = merged[key]
            if prev["origin"] != it["origin"] and it["origin"] in ("watchlist", "journal"):
                prev["origin"] = it["origin"]
            if len(it["abstract"]) > len(prev["abstract"]):
                prev["abstract"] = it["abstract"]
            continue
        merged[key] = it
        title_index[nt] = key

    out = []
    for key, it in merged.items():
        if key in seen or f"t:{norm_title(it['title'])}" in seen:
            continue
        hits = [by_author[a] for a in it["author_ids"] if a in by_author]
        hits += [watch_names[a.lower()] for a in it["authors"] if a.lower() in watch_names]
        it["watch_authors"] = sorted(set(hits))
        it["watch_journal"] = it["source_id"] in journal_ids
        out.append(it)
    return out


def collect(cfg, watch, seen, today, log=lambda m: print(m, file=sys.stderr), sources=(), web_state=None):
    start = (today - timedelta(days=cfg["lookback_days"])).isoformat()
    end = today.isoformat()
    items = collect_openalex(cfg, watch, start, end, log) + collect_arxiv(cfg, start, log)
    if sources:
        items += collect_web(sources, start, web_state if web_state is not None else {}, log)
    fresh = annotate_and_dedupe(items, watch, seen)
    log(f"candidatos novos após dedupe: {len(fresh)}")
    return fresh


if __name__ == "__main__":  # quick manual smoke test
    import json
    from . import CONFIG
    cfg = json.loads((CONFIG / "queries.json").read_text())
    watch_path = CONFIG / "watchlist.json"
    watch = json.loads(watch_path.read_text()) if watch_path.exists() else {}
    res = collect(cfg, watch, set(), date.today())
    print(json.dumps(res[:3], ensure_ascii=False, indent=1))
