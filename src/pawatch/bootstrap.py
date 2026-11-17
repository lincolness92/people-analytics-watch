"""`python -m pawatch new-topic "<tema>"`: draft a topic pack in topics/<slug>/ for human review.

1. The LLM drafts the editorial voice, digest themes, OpenAlex/arXiv searches, journals and the
   organizations worth following (regulators, research centers, practitioners).
2. OpenAlex checks every search (dropping the ones that find nothing) and finds the most cited
   recent authors and venues behind them; LLM-suggested journals are resolved to OpenAlex IDs.
3. Every suggested site is probed for an RSS/Atom feed; only feeds that parse go to sources.json.
Nothing here is final: the output is a draft to edit (see the README checklist).
"""

import json
import re
import unicodedata
import urllib.parse
from collections import Counter, defaultdict
from datetime import date, timedelta

from . import TOPICS
from .collect import OpenAlex
from .http import get_json
from .llm import LLM
from .web import _fetch, parse_feed

OPENALEX = "https://api.openalex.org"
REGIONS = {"US": "EUA", "BR": "Brasil", "CN": "China/Ásia", "HK": "China/Ásia", "SG": "China/Ásia",
           "JP": "China/Ásia", "KR": "China/Ásia", "TW": "China/Ásia", "IN": "China/Ásia"}
EUROPE = set("GB DE FR NL IT ES PT BE CH AT SE NO DK FI IE PL CZ GR LU".split())
# Mega-journals publish a bit of everything; being cited there says little about a field's elite.
MEGA = {"ieee access", "applied sciences", "sustainability", "plos one", "scientific reports", "heliyon",
        "sensors", "electronics", "mathematics", "cureus", "frontiers in psychology", "information",
        "future internet", "symmetry", "multimedia tools and applications", "cogent business & management",
        "oeconomia copernicana", "journal of physics: conference series"}

DRAFT_PROMPT = """Você vai montar a configuração de um digest automático de pesquisa state-of-the-art sobre o tema abaixo,
para um leitor executivo/técnico de um grande banco brasileiro (ajuste o leitor se o tema pedir outro).
Devolva APENAS um JSON com estas chaves:
- "name": nome do digest, curto, terminando em "Watch" (ex.: "Credit Risk Watch")
- "brand": {"text": parte antes de Watch, "em": "Watch", "mark": 1 emoji}
- "description": 1 frase PT-BR
- "audience": parágrafo PT-BR no formato "Você é o curador do <NOME>, um digest diário em PT-BR para <leitor>. Ele quer só o que é state-of-the-art e acionável em: <lista de subtemas>."
- "rubric_focus": a quem o achado deve servir (ex.: "a prevenção a fraudes em bancos")
- "rubric_strong": o que conta como evidência forte NESTE tema (desenhos, dados, venues)
- "off_topic": o que fica fora (lista curta de áreas vizinhas que poluem a busca)
- "summary_lesson": ex.: "a lição prática para quem faz <área>"
- "headline_example": ex.: "semana forte em <assunto>"
- "trend_focus": ex.: "o que está mudando na prática de <área>"
- "source_kinds": tipos de fonte da watchlist (ex.: "reguladores, organismos de padrão, centros de pesquisa e praticantes")
- "themes": objeto com 6–8 temas {"chave_snake": "<emoji> Rótulo PT-BR"}
- "keywords": 20–35 termos em inglês (e alguns em português) que indicam relevância, minúsculos
- "openalex_queries": 12–16 buscas booleanas em inglês no estilo OpenAlex (OR/AND, aspas), cada uma cobrindo um subtema, específicas o bastante para não trazer áreas vizinhas
- "arxiv": {"categories": ["cs.LG", ...], "terms": ["fraud", ...]} (categorias e termos para abs:)
- "journals": 10–15 periódicos de elite do tema (nomes exatos)
- "researchers": 15–25 pesquisadores de referência ativos no tema {"name", "institution", "why"} (só pessoas que você tem certeza que publicam sobre o tema)
- "organizations": 12–25 fontes a acompanhar: {"name", "url" (site oficial), "role": "center"|"practitioner", "org", "why"} — inclua reguladores, organismos de padrão, centros acadêmicos, associações e praticantes de referência, nacionais e internacionais.

TEMA: """


def slugify(name):
    s = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def _region(country):
    if country in REGIONS:
        return REGIONS[country]
    return "Europa" if country in EUROPE else "Outros"


def validate_queries(queries, log):
    """Keep searches that find something in the last 30 days; report volumes."""
    end = date.today()
    oa = OpenAlex((end - timedelta(days=30)).isoformat(), end.isoformat())
    kept = []
    for q in queries:
        try:
            data = get_json(f"{OPENALEX}/works", {
                "filter": f"from_publication_date:{oa.start},title_and_abstract.search:{q}", "per-page": 1})
            n = data["meta"]["count"]
        except RuntimeError as e:
            log(f"  busca inválida, descartada: {q[:70]} ({str(e)[:80]})")
            continue
        log(f"  {n:6d} em 30 dias | {q[:90]}")
        if n > 0:
            kept.append(q)
    return kept


def top_authors_and_venues(queries, log, years=5, per_query=50):
    """Top cited recent works per search → authors and venues. Each search weighs the same
    (score by rank, not raw citations), so one search full of famous surveys cannot dominate."""
    since = (date.today() - timedelta(days=365 * years)).isoformat()
    author_score, author_name, venue_score, venue_name = Counter(), {}, Counter(), {}
    author_works, author_papers = defaultdict(set), defaultdict(list)
    for q in queries:
        try:
            data = get_json(f"{OPENALEX}/works", {
                "filter": f"from_publication_date:{since},title_and_abstract.search:{q},type:article|preprint|review",
                "sort": "cited_by_count:desc", "per-page": per_query,
                "select": "id,display_name,cited_by_count,authorships,primary_location"})
        except RuntimeError as e:
            log(f"  falhou: {q[:60]} ({str(e)[:80]})")
            continue
        for rank, w in enumerate(data.get("results", [])):
            weight = 1.0 / (rank + 3)
            c = w.get("cited_by_count") or 0
            src = ((w.get("primary_location") or {}).get("source") or {})
            if src.get("id") and src.get("type") == "journal" and (src.get("display_name") or "").lower() not in MEGA:
                sid = src["id"].rsplit("/", 1)[-1]
                venue_score[sid] += weight
                venue_name[sid] = src.get("display_name")
            for a in (w.get("authorships") or [])[:6]:
                au = a.get("author") or {}
                if au.get("id"):
                    aid = au["id"].rsplit("/", 1)[-1]
                    author_score[aid] += weight
                    author_name[aid] = au.get("display_name")
                    author_works[aid].add(w["id"])
                    if len(author_papers[aid]) < 2:
                        author_papers[aid].append(f"{w['display_name']} ({c} cit.)")
    # One famous paper is not a research line: require at least two works in the pool.
    author_score = Counter({a: v for a, v in author_score.items() if len(author_works[a]) >= 2})
    return author_score, author_name, author_papers, venue_score, venue_name


def resolve_researcher(name, topic_query):
    """OpenAlex author for a suggested name: the homonym with most works matching the topic."""
    data = get_json(f"{OPENALEX}/authors", {"search": name, "per-page": 5, "select": "id,display_name"})
    best = None
    for a in data.get("results", []):
        aid = a["id"].rsplit("/", 1)[-1]
        n = get_json(f"{OPENALEX}/works", {"filter": f"author.id:{aid},title_and_abstract.search:{topic_query}",
                                           "per-page": 1})["meta"]["count"]
        if n >= 2 and (not best or n > best[1]):
            best = (aid, n, a["display_name"])
    return best


def describe_authors(ids):
    out = {}
    for i in range(0, len(ids), 50):
        data = get_json(f"{OPENALEX}/authors", {"filter": "id:" + "|".join(ids[i:i + 50]), "per-page": 50,
                                                "select": "id,display_name,last_known_institutions,works_count,cited_by_count,summary_stats"})
        for a in data.get("results", []):
            inst = (a.get("last_known_institutions") or [{}])[0] or {}
            out[a["id"].rsplit("/", 1)[-1]] = {
                "institution": inst.get("display_name") or "", "country": inst.get("country_code") or "",
                "h": (a.get("summary_stats") or {}).get("h_index"), "works": a.get("works_count")}
    return out


def resolve_journal(name):
    data = get_json(f"{OPENALEX}/sources", {"search": name, "per-page": 3, "select": "id,display_name,type,works_count"})
    for s in data.get("results", []):
        if s.get("type") in ("journal", "repository") and s.get("works_count", 0) > 50:
            return s["id"].rsplit("/", 1)[-1], s["display_name"]
    return None, None


def discover_feed(url):
    """First RSS/Atom feed with items for a site: autodiscovery, then common paths."""
    cands = []
    try:
        body = _fetch(url)
        for m in re.finditer(r'<link[^>]+type=["\']application/(?:rss|atom)\+xml["\'][^>]*>', body, re.I):
            h = re.search(r'href=["\']([^"\']+)["\']', m.group(0))
            if h and "comments" not in h.group(1):
                cands.append(urllib.parse.urljoin(url, h.group(1)))
    except RuntimeError:
        pass
    p = urllib.parse.urlparse(url)
    root = f"{p.scheme}://{p.netloc}"
    cands += [url.rstrip("/") + "/feed/", root + "/feed/", root + "/rss", root + "/rss.xml", root + "/feed.xml"]
    for f in dict.fromkeys(cands):
        try:
            items = parse_feed(_fetch(f))
        except Exception:
            continue
        dated = [x for x in items if x[3]]
        if dated:
            return f, len(items), max(x[3] for x in dated)
    return None


def new_topic(name, slug=None, log=print):
    slug = slug or slugify(name)
    tdir = TOPICS / slug
    if (tdir / "topic.json").exists():
        log(f"{tdir} já existe; escolha outro --slug ou edite os arquivos à mão")
        return 1
    draft = tdir / ".draft.json"
    if draft.exists():  # an earlier attempt died halfway (e.g. OpenAlex budget): reuse its LLM draft
        log(f"[1/4] reaproveitando o rascunho salvo em {draft}")
        d = json.loads(draft.read_text(encoding="utf-8"))
    else:
        log(f"[1/4] rascunho com o LLM ({name})")
        d = LLM().json("Você configura digests de pesquisa. Responda só JSON válido.", DRAFT_PROMPT + name,
                       max_tokens=9000, temperature=0.3)
        tdir.mkdir(parents=True, exist_ok=True)
        draft.write_text(json.dumps(d, ensure_ascii=False, indent=1), encoding="utf-8")

    log("[2/4] validando buscas no OpenAlex")
    queries = validate_queries(d.get("openalex_queries", []), log)

    log("[3/4] autores e periódicos mais citados por trás das buscas")
    a_score, a_name, a_papers, v_score, v_name = top_authors_and_venues(queries, log)
    # Suggested names first (checked against OpenAlex), then the data-driven list.
    core = " OR ".join(f'"{k}"' for k in d.get("keywords", [])[:6])
    named = {}
    for r in d.get("researchers", []):
        try:
            hit = resolve_researcher(r["name"], core)
        except RuntimeError:
            hit = None
        if hit:
            named[hit[0]] = (r, hit[1])
            log(f"  pesquisador confirmado: {r['name']} ({hit[1]} trabalhos no tema)")
        else:
            log(f"  pesquisador não confirmado no OpenAlex: {r['name']}")
    top_ids = list(named) + [a for a, _ in a_score.most_common(40) if a not in named][:max(0, 35 - len(named))]
    info = describe_authors(top_ids) if top_ids else {}
    researchers = []
    for aid in top_ids:
        i = info.get(aid, {})
        sug, n = named.get(aid, (None, 0))
        why = (sug.get("why") if sug else None) or ("Muito citado nas buscas do tema: " + "; ".join(a_papers[aid]))
        researchers.append({
            "name": (sug or {}).get("name") or a_name[aid], "institution": i.get("institution", "") or (sug or {}).get("institution", ""),
            "region": _region(i.get("country", "")), "area": "", "why": why, "openalex_id": aid,
            "openalex_note": (f"sugerido e confirmado ({n} trabalhos no tema); " if sug else "achado pelas citações; ")
            + f"h-index {i.get('h')}, {i.get('works')} trabalhos — conferir homônimos",
            "links": {}})
    journals, seen_j = [], set()
    for jname in d.get("journals", []):
        sid, disp = resolve_journal(jname)
        if sid and sid not in seen_j and disp.lower() not in MEGA:
            seen_j.add(sid)
            journals.append({"name": disp, "openalex_source_id": sid, "why": "Sugerido pelo rascunho; ID conferido no OpenAlex."})
    for sid, _ in v_score.most_common(8):
        if sid not in seen_j:
            seen_j.add(sid)
            journals.append({"name": v_name[sid], "openalex_source_id": sid, "why": "Entre os periódicos mais citados nas buscas do tema (5 anos)."})

    log("[4/4] procurando feeds das organizações sugeridas")
    centers, practitioners, sources, without = [], [], [], []
    for o in d.get("organizations", []):
        entry = {"name": o.get("name"), "url": o.get("url"), "why": o.get("why", "")}
        if o.get("role") == "practitioner":
            practitioners.append({**entry, "org": o.get("org", "")})
        else:
            centers.append({**entry, "institution": o.get("org", "")})
        feed = discover_feed(o["url"]) if o.get("url") else None
        if feed:
            log(f"  feed ok: {o['name']} → {feed[0]} ({feed[1]} itens, último {feed[2]})")
            sources.append({"name": o["name"], "watch": o["name"], "kind": "rss", "url": feed[0]})
        else:
            log(f"  sem feed: {o.get('name')} ({o.get('url')})")
            without.append(o.get("name"))

    tdir.mkdir(parents=True, exist_ok=True)
    kw = "|".join(re.escape(k.strip().lower()) for k in d.get("keywords", []) if k.strip())
    meta = {k: d.get(k) for k in ("name", "brand", "description", "audience", "rubric_focus", "rubric_strong",
                                  "off_topic", "summary_lesson", "headline_example", "trend_focus", "source_kinds", "themes")}
    meta.update(order=50, prefilter_keywords=kw, watchlist_labels={
        "researchers": "Pesquisadores", "journals": "Journals", "centers": "Reguladores, padrões & centros",
        "practitioners": "Praticantes & fontes"})
    arx = d.get("arxiv", {})
    arxiv_q = "(" + " OR ".join(f"cat:{c}" for c in arx.get("categories", [])) + ") AND (" + \
        " OR ".join(f'abs:"{t}"' if " " in t else f"abs:{t}" for t in arx.get("terms", [])) + ")"
    files = {
        "topic.json": meta,
        "queries.json": {"lookback_days": 7, "openalex": {"types": ["article", "preprint", "review", "book-chapter"],
                                                         "per_query": 50, "queries": queries},
                         "arxiv": {"max_results": 100, "query": arxiv_q},
                         "selection": {"max_candidates_for_llm": 220, "min_score": 7, "max_selected": 12, "max_quick_mentions": 6}},
        "watchlist.json": {"researchers": researchers, "journals": journals, "centers": centers, "practitioners": practitioners},
        "sources.json": {"_doc": "Rascunho gerado por new-topic. Sem feed encontrado: " + ", ".join(filter(None, without)),
                         "sources": sources},
    }
    existing = tdir / "sources.json"
    if existing.exists():  # hand-curated sources win; only add feeds for URLs not covered yet
        cur = json.loads(existing.read_text(encoding="utf-8"))
        have = {x["url"] for x in cur.get("sources", [])}
        extra = [x for x in sources if x["url"] not in have]
        cur["sources"] = cur.get("sources", []) + extra
        files["sources.json"] = cur
        log(f"  sources.json já existia: mantido, com {len(extra)} feeds novos acrescentados")
    for fname, obj in files.items():
        (tdir / fname).write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    draft.unlink()
    log(f"rascunho em {tdir}: {len(queries)} buscas, {len(researchers)} pesquisadores, {len(journals)} journals, "
        f"{len(sources)} feeds ({len(without)} organizações sem feed). Revise antes de rodar.")
    return 0
