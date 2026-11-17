"""State-of-the-art evolution of a topic: citation network → milestones per era → LLM timeline.

Seeds are the most-cited works of the topic's searches (all-time and recent) plus the papers
already selected in the digests. Their references are followed two layers back; works cited
often inside that network are the field's backbone. Each era keeps its strongest candidates
(network citations + global citations, ranked within the era so recent work can compete),
the LLM drops generic methods/off-topic works and writes the narrative.
"""

import json
import math
import re
import sys
from collections import Counter
from datetime import date

from .collect import norm_title, rebuild_abstract
from .http import get_json

OPENALEX = "https://api.openalex.org/works"
SELECT = ",".join(["id", "doi", "display_name", "publication_year", "cited_by_count", "type",
                   "primary_location", "authorships", "abstract_inverted_index", "referenced_works"])
TYPES = "type:article|review|book|book-chapter|preprint|report"  # report = NBER/working papers
PUBLISHED = {"article", "review", "book", "book-chapter"}

DEFAULT_ERAS = [
    {"key": "ate-1999", "label": "até 1999", "from": None, "to": 1999},
    {"key": "2000-2009", "label": "2000–2009", "from": 2000, "to": 2009},
    {"key": "2010-2017", "label": "2010–2017", "from": 2010, "to": 2017},
    {"key": "2018-2022", "label": "2018–2022", "from": 2018, "to": 2022},
    {"key": "2023+", "label": "2023 em diante", "from": 2023, "to": None},
]


def _wid(url_or_id):
    return (url_or_id or "").rsplit("/", 1)[-1]


class Fetcher:
    def __init__(self, log):
        self.log, self.calls, self.cost = log, 0, 0.0

    def get(self, params):
        params = dict(params, select=SELECT)
        data = get_json(OPENALEX, params)
        self.calls += 1
        self.cost += float((data.get("meta") or {}).get("cost_usd") or 0)
        return data.get("results") or []

    def top_cited(self, query, per_page, since=None):
        flt = [TYPES, f"title_and_abstract.search:{query}"]
        if since:
            flt.insert(0, f"from_publication_date:{since}-01-01")
        return self.get({"filter": ",".join(flt), "sort": "cited_by_count:desc", "per-page": per_page})

    def by_author(self, author_id, per_page, since=None):
        flt = [TYPES, f"authorships.author.id:{author_id}"]
        if since:
            flt.insert(0, f"from_publication_date:{since}-01-01")
        return self.get({"filter": ",".join(flt), "sort": "cited_by_count:desc", "per-page": per_page})

    def by_ids(self, ids, field="openalex"):
        out = []
        ids = list(ids)
        for i in range(0, len(ids), 50):
            try:
                out += self.get({"filter": f"{field}:{'|'.join(ids[i:i + 50])}", "per-page": 50})
            except RuntimeError as e:
                self.log(f"evolução: lote {field} falhou: {e}")
        return out


def node(w):
    loc = w.get("primary_location") or {}
    doi = (w.get("doi") or "").replace("https://doi.org/", "")
    return {
        "id": _wid(w["id"]),
        "title": (w.get("display_name") or "").strip(),
        "year": w.get("publication_year"),
        "type": w.get("type") or "",
        "venue": ((loc.get("source") or {}).get("display_name")) or "",
        "authors": [(a.get("author") or {}).get("display_name") for a in (w.get("authorships") or [])][:8],
        "cited_by": w.get("cited_by_count") or 0,
        "url": f"https://doi.org/{doi}" if doi else w["id"],
        "abstract": rebuild_abstract(w.get("abstract_inverted_index"))[:900],
        "refs": [_wid(r) for r in (w.get("referenced_works") or [])],
    }


def era_of(year, eras):
    for e in eras:
        if year is None:
            return None
        if (e["from"] is None or year >= e["from"]) and (e["to"] is None or year <= e["to"]):
            return e["key"]
    return None


def _surnames(n):
    return {a.split()[-1].lower() for a in n["authors"] if a and a.split()}


def merge_versions(nodes):
    """Fold versions of the same work (working paper + journal article, preprint + article) into one.

    Same normalized title and at least one shared author surname. The published version leads
    (venue/link); citations, network counts and references are summed; the year is the earliest.
    """
    groups = {}
    for n in nodes.values():
        t = norm_title(n["title"])
        if len(t) >= 15:
            groups.setdefault(t, []).append(n)
    merged = 0
    for group in groups.values():
        if len(group) < 2:
            continue
        group.sort(key=lambda n: (n.get("type") not in PUBLISHED, -n["cited_by"]))
        lead = group[0]
        for other in group[1:]:
            if not (_surnames(lead) & _surnames(other)):
                continue
            lead["cited_by"] += other["cited_by"]
            lead["net"] = round(lead.get("net", 0) + other.get("net", 0), 1)
            lead["refs"] = sorted(set(lead["refs"]) | set(other["refs"]))
            years = [y for y in (lead["year"], other["year"]) if y]
            lead["year"] = min(years) if years else None
            lead["watch"] = sorted(set(lead.get("watch", [])) | set(other.get("watch", [])))
            lead.setdefault("versions", []).append(other["url"])
            if len(other.get("abstract", "")) > len(lead.get("abstract", "")):
                lead["abstract"] = other["abstract"]
            del nodes[other["id"]]
            merged += 1
    return merged


def build_network(topic, fetch, log, seeds_per_query=25, recent_per_query=12, layer1=150, layer2=100,
                  per_author=12, recent_per_author=6, per_historical=15):
    cfg = topic.meta.get("evolution", {})
    queries = cfg.get("seed_queries") or topic.queries().get("openalex", {}).get("queries", [])
    nodes = {}

    def add(works, watch=None):
        for w in works:
            if w.get("id") and w.get("display_name"):
                n = node(w)
                n = nodes.setdefault(n["id"], n)
                if watch and watch not in n.setdefault("watch", []):
                    n["watch"].append(watch)

    for q in queries:
        try:
            add(fetch.top_cited(q, seeds_per_query))
            add(fetch.top_cited(q, recent_per_query, since=date.today().year - 7))
        except RuntimeError as e:
            log(f"evolução: busca falhou ({q[:40]}…): {e}")

    # every watchlist researcher seeds the network with their most-cited works, no keyword filter
    recent = date.today().year - 7
    for r in topic.watchlist().get("researchers", []):
        for aid in [r.get("openalex_id")] + list(r.get("alt_openalex_ids") or []):
            if not aid:
                continue
            try:
                add(fetch.by_author(aid, per_author), watch=r["name"])
                add(fetch.by_author(aid, recent_per_author, since=recent), watch=r["name"])
            except RuntimeError as e:
                log(f"evolução: autor {r['name']} falhou: {e}")
    # historical references (deceased or retired): their classics, all-time only; not monitored daily
    for r in topic.watchlist().get("historical", []):
        for aid in [r.get("openalex_id")] + list(r.get("alt_openalex_ids") or []):
            if not aid:
                continue
            try:
                add(fetch.by_author(aid, per_historical), watch=r["name"])
            except RuntimeError as e:
                log(f"evolução: referência histórica {r['name']} falhou: {e}")
    n_watch = sum(1 for n in nodes.values() if n.get("watch"))

    dois = sorted({it["key"][4:] for d in topic.digests() for it in d.get("items", [])
                   if it.get("key", "").startswith("doi:")})
    add(fetch.by_ids(dois, field="doi"))
    seeds = set(nodes)
    log(f"evolução: {len(seeds)} sementes ({n_watch} de autores da watchlist, {len(dois)} dos digests)")

    net = Counter()
    for nid in seeds:
        net.update(nodes[nid]["refs"])
    l1 = [w for w, _ in net.most_common() if w not in nodes][:layer1]
    add(fetch.by_ids(l1))

    for wid in l1:
        if wid in nodes:
            for r in nodes[wid]["refs"]:
                net[r] += 0.5
    l2 = [w for w, _ in net.most_common() if w not in nodes][:layer2]
    add(fetch.by_ids(l2))

    for n in nodes.values():
        n["net"] = round(net.get(n["id"], 0), 1)
    merged = merge_versions(nodes)
    log(f"evolução: {merged} versões duplicadas fundidas (working paper + artigo etc.)")
    log(f"evolução: rede com {len(nodes)} obras; OpenAlex {fetch.calls} chamadas, ≈ ${fetch.cost:.3f}")
    return nodes


def candidates(nodes, eras, per_era=30):
    """Strongest works of each era, ranked inside the era (percentiles of net and global citations),
    plus every work by a watchlist researcher regardless of rank: those always reach the LLM."""
    by_era = {e["key"]: [] for e in eras}
    for n in nodes.values():
        k = era_of(n["year"], eras)
        if k and n["title"]:
            by_era[k].append(n)
    out = []
    for k, group in by_era.items():
        if not group:
            continue
        def pct(key):
            order = sorted(group, key=lambda x: x[key])
            return {x["id"]: i / max(1, len(order) - 1) for i, x in enumerate(order)}
        p_net, p_cit = pct("net"), pct("cited_by")
        group.sort(key=lambda x: 0.55 * p_net[x["id"]] + 0.45 * p_cit[x["id"]], reverse=True)
        for j, n in enumerate(group):
            if j < per_era or n.get("watch"):
                out.append(dict(n, era=k))
    return out


def _brief(i, n, chars):
    return {"i": i, "title": n["title"], "year": n["year"], "venue": n["venue"],
            "authors": ", ".join(a for a in n["authors"][:3] if a), "cit": n["cited_by"],
            "net": n.get("net", 0), **({"watch": ", ".join(n["watch"])} if n.get("watch") else {}),
            "abstract": (n.get("abstract") or "")[:chars] or "(sem abstract)"}


def triage_rules(topic):
    themes = ", ".join(f"{k} ({v.split(' ', 1)[1]})" for k, v in topic.themes.items())
    return f"""Você está montando a LINHA DO TEMPO DO ESTADO DA ARTE do tema. Cada item é uma obra
muito citada na rede de citações do tema (`net` = citações dentro da rede, `cit` = citações totais).
Para cada uma devolva:
- "s": 0–10, o quanto ela é um MARCO do tema (mudou como o campo pensa ou pratica {topic.meta["rubric_focus"]}).
- "k": "marco" (contribuição substantiva ao tema), "metodo" (técnica estatística/psicométrica genérica,
  ex.: SEM, viés de método comum, Fornell-Larcker, análise temática, PLS) ou "fora" (outro campo: {topic.meta["off_topic"]}).
- "t": tema entre: {themes}.
Métodos genéricos e obras fora do tema recebem s ≤ 3 mesmo que muito citados.
`watch` = obra de pesquisador da watchlist de elite ou de referência histórica do tema (falecido ou
aposentado). Julgue pelo mesmo critério: autoria não basta, e
o OpenAlex às vezes atribui a essas pessoas obras de homônimos de outras áreas (essas são "fora").
Obras recentes (2023+) têm menos citações por serem novas: julgue pela importância do resultado.
Responda APENAS com JSON: {{"r": [{{"i": <id>, "s": <int>, "k": "...", "t": "..."}}, ...]}} cobrindo todos os ids."""


def write_rules(topic, eras, incremental):
    era_list = ", ".join(f'{e["key"]} ({e["label"]})' for e in eras)
    revise = """
Esta é uma REVISÃO MENSAL de uma versão anterior. Cada época enviada traz "titulo_anterior" e
"resumo_anterior"; marcos mantidos trazem "why_anterior" e marcos novos vêm com "novo": true.
Preserve o que continua certo: ajuste título e resumo da época só no necessário para incorporar
marcos novos ou retirar os que saíram. Escreva "why" apenas para os marcos novos.
Revise "overview" e "now" a partir de "versao_anterior", incorporando os destaques recentes.""" if incremental else ""
    return f"""Escreva em PT-BR a EVOLUÇÃO DO ESTADO DA ARTE do tema, para {topic.meta["audience"].split(".")[0].lower()}.
Você recebe os marcos de cada época ({era_list}) e os destaques recentes dos digests.{revise}
Devolva APENAS JSON:
{{
 "overview": "3–4 frases: o arco completo do campo, do início até hoje",
 "eras": [{{"key": "<chave>", "title": "nome curto e memorável da época (até 6 palavras)",
   "summary": "3–4 frases: que problema a época resolveu, que ideia ou método virou padrão, o que ficou em aberto",
   "milestones": [{{"i": <id>, "why": "1–2 frases: a contribuição concreta e por que importa até hoje"}}]}}],
 "now": {{"summary": "3–4 frases: onde o campo está agora, conectando aos destaques recentes",
   "open_questions": ["3 a 5 perguntas em aberto, curtas"]}},
 "threads": [{{"theme": "<chave do tema>", "line": "1–2 frases: como esse tema evoluiu ao longo das épocas"}}],
 "changes_note": "1–3 frases sobre o que mudou em relação à versão anterior (use a lista 'mudancas'); vazio se não houver versão anterior"
}}
Inclua todas as épocas recebidas, na ordem, e todos os marcos recebidos (pode reordenar dentro da época).
Faça "threads" só para temas com pelo menos 2 marcos. Tom direto, concreto, sem jargão vazio; cite anos e autores quando ajudar."""


def salvage_verdicts(text):
    """Parse the triage reply; if the JSON is cut or broken, keep every complete {"i": ...} object."""
    from .llm import parse_json
    try:
        return parse_json(text)
    except (ValueError, json.JSONDecodeError):
        rows = []
        for m in re.finditer(r"\{[^{}]*\}", text or ""):
            try:
                obj = json.loads(m.group(0))
            except json.JSONDecodeError:
                continue
            if isinstance(obj, dict) and "i" in obj and "s" in obj:
                rows.append(obj)
        if not rows:
            raise ValueError(f"no verdicts in model output: {(text or '')[:120]!r}")
        return {"r": rows}


def triage(llm, cands, topic, log, batch=30, workers=4):
    """LLM verdict per candidate: {work_id: [score, kind, theme]}. Batches run in parallel."""
    from concurrent.futures import ThreadPoolExecutor, as_completed

    def run(start):
        chunk = cands[start:start + batch]
        lines = "\n".join(json.dumps(_brief(start + j, n, 350), ensure_ascii=False) for j, n in enumerate(chunk))
        res = llm.json(triage_rules(topic), f"Obras (um JSON por linha):\n{lines}", max_tokens=8000,
                       timeout=90, parse=salvage_verdicts)
        out = {}
        for r in res.get("r", []):
            try:
                i = int(r["i"])
                s = max(0, min(10, int(r.get("s", 0) or 0)))
            except (KeyError, TypeError, ValueError):
                continue
            if start <= i < start + len(chunk):
                theme = r.get("t") if r.get("t") in topic.themes else next(iter(topic.themes))
                out[chunk[i - start]["id"]] = [s, r.get("k", "marco"), theme]
        return out

    verdicts, done = {}, 0
    starts = list(range(0, len(cands), batch))
    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {pool.submit(run, st): st for st in starts}
        for fut in as_completed(futures):
            done += 1
            try:
                verdicts.update(fut.result())
            except RuntimeError as e:
                log(f"evolução: triagem do lote {futures[fut]} falhou: {e}")
            log(f"evolução: triagem {done}/{len(starts)} lotes")
    return verdicts


def mid(m):
    """Stable identity of a milestone (older versions stored only the URL)."""
    return m.get("id") or m.get("url")


def stable_eras(eras, year, horizon=8):
    """Eras that ended long enough ago to be considered settled."""
    return {e["key"] for e in eras if e["to"] is not None and e["to"] < year - horizon}


def diverse(ranked, theme_of, n, max_per_theme):
    """Top `n` of `ranked`, at most `max_per_theme` per theme; leftover slots ignore the cap."""
    out, count = [], {}
    for c in ranked:
        t = theme_of(c)
        if count.get(t, 0) < max_per_theme:
            out.append(c)
            count[t] = count.get(t, 0) + 1
        if len(out) == n:
            return out
    return out + [c for c in ranked if c not in out][: n - len(out)]


def pick_milestones(cands, verdicts, eras, prev=None, stable=(), new_ids=(),
                    per_era=7, min_score=6, stable_new_min=8, stable_new_max=1, max_per_theme=3):
    """Milestone ids per era.

    Without a previous version: the best `per_era` by LLM score. With one: settled eras keep
    their milestones and admit at most `stable_new_max` never-seen works scoring ≥ stable_new_min;
    recent eras are re-ranked with a +1 incumbency bonus so ties do not churn the list.
    Re-ranked eras keep at most `max_per_theme` milestones of one theme (scores cluster at 9–10,
    and the network tiebreak would otherwise let one well-cited theme fill the era).
    """
    by_id = {c["id"]: c for c in cands}
    prev_by_era = {e["key"]: [mid(m) for m in e["milestones"]] for e in (prev or {}).get("eras", [])}
    picked = {e["key"]: [] for e in eras}
    for e in eras:
        k = e["key"]
        pool = [c for c in cands if c["era"] == k and verdicts.get(c["id"], [0, "fora"])[1] == "marco"]
        incumbents = prev_by_era.get(k, [])
        if prev and k in stable and incumbents:
            fresh = sorted((c for c in pool if c["id"] in new_ids and c["id"] not in incumbents
                            and verdicts[c["id"]][0] >= stable_new_min),
                           key=lambda c: (-verdicts[c["id"]][0], -c["net"]))
            picked[k] = incumbents + [c["id"] for c in fresh[:stable_new_max]]
            continue
        bonus = lambda c: verdicts[c["id"]][0] + (1 if c["id"] in incumbents else 0)
        ranked = sorted((c for c in pool if verdicts[c["id"]][0] >= min_score),
                        key=lambda c: (-bonus(c), -c["net"], -c["cited_by"]))
        picked[k] = [c["id"] for c in diverse(ranked, lambda c: verdicts[c["id"]][2], per_era, max_per_theme)]
    return {k: [i for i in v if i in by_id or i in prev_index(prev)] for k, v in picked.items()}


def prev_index(prev):
    return {mid(m): dict(m, era=e["key"]) for e in (prev or {}).get("eras", []) for m in e["milestones"]}


def recent_highlights(topic, limit=25):
    items = [dict(it, _date=d["date"]) for d in topic.digests() for it in d.get("items", [])]
    items.sort(key=lambda x: (-x.get("score", 0), x["_date"]))
    return [{"title": it["title"], "date": it["_date"], "score": it.get("score"), "theme": it.get("theme"),
             "summary": (it.get("summary") or "")[:260]} for it in items[:limit]]


def diff(prev, picked, info):
    if not prev:
        return {"added": [], "removed": []}
    before = prev_index(prev)
    now = {i for ids in picked.values() for i in ids}
    added = [{"title": info[i]["title"], "year": info[i]["year"], "era": info[i]["era"]} for ids in picked.values()
             for i in ids if i not in before]
    removed = [{"title": m["title"], "year": m["year"], "era": m["era"]} for i, m in before.items() if i not in now]
    return {"added": added, "removed": removed}


def load_cache(topic):
    path = topic.data / "evolution_triage.json"
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}


def save_cache(topic, cache):
    path = topic.data / "evolution_triage.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(cache, ensure_ascii=False, indent=0, sort_keys=True), encoding="utf-8")


def evolve(topic, llm, full=False, rejudge=False, log=lambda m: print(m, file=sys.stderr)):
    """`full`: rebuild selection and text from scratch (cached verdicts reused);
    `rejudge`: also send every candidate back to the LLM triage."""
    eras = topic.meta.get("evolution", {}).get("eras") or DEFAULT_ERAS
    prev = latest(topic)
    incremental = bool(prev) and not full
    mode = "incremental" if incremental else "completa"
    log(f"evolução: modo {mode}" + (f" (base {prev['generated']})" if prev else ""))

    fetch = Fetcher(log)
    nodes = build_network(topic, fetch, log)
    cands = candidates(nodes, eras)
    if prev:  # versions before ids were stored: recover each milestone's OpenAlex id from its URL
        url2id = {n["url"]: n["id"] for n in nodes.values()}
        for e in prev["eras"]:
            for m in e["milestones"]:
                m.setdefault("id", url2id.get(m["url"]))
                if not m["id"]:
                    m.pop("id")

    # previous milestones stay in the running even if they fell out of this month's top slice
    seen = {c["id"] for c in cands}
    for i, m in prev_index(prev).items():
        if incremental and i not in seen and m.get("id"):
            cands.append({"id": m["id"], "title": m["title"], "year": m["year"], "venue": m["venue"],
                          "authors": m["authors"], "cited_by": m["cited_by"], "net": m.get("net", 0),
                          "url": m["url"], "abstract": "", "era": m["era"]})

    cache = {} if rejudge else load_cache(topic)
    if incremental:  # incumbents keep their verdict even without a cache entry (first incremental run)
        for i, m in prev_index(prev).items():
            if m.get("id") and m["id"] not in cache:
                cache[m["id"]] = [m.get("score", 7), "marco", m.get("theme", next(iter(topic.themes)))]
    todo = [c for c in cands if c["id"] not in cache]
    log(f"evolução: {len(cands)} candidatos, {len(todo)} novos para triagem")
    new_verdicts = triage(llm, todo, topic, log) if todo else {}
    verdicts = {**cache, **new_verdicts}
    save_cache(topic, {**load_cache(topic), **verdicts})

    # a work counts as "new" only if no earlier run ever judged it
    picked = pick_milestones(cands, verdicts, eras, prev=prev if incremental else None,
                             stable=stable_eras(eras, date.today().year), new_ids=set(new_verdicts))
    info = {c["id"]: c for c in cands}
    for i, m in prev_index(prev).items():
        info.setdefault(i, m)
    if not any(picked.values()):
        raise RuntimeError("nenhum marco passou da triagem")
    changes = diff(prev, picked, info)

    prev_eras = {e["key"]: e for e in (prev or {}).get("eras", [])}
    prev_why = {i: m.get("why", "") for i, m in prev_index(prev).items()}
    added_ids = {i for ids in picked.values() for i in ids if i not in prev_why}
    unchanged = {k for k, ids in picked.items()
                 if incremental and k in prev_eras and ids == [mid(m) for m in prev_eras[k]["milestones"]]
                 and k in stable_eras(eras, date.today().year)}

    idx, payload_eras = {}, []
    for e in eras:
        k = e["key"]
        if not picked[k] or k in unchanged:
            continue
        marcos = []
        for wid in picked[k]:
            i = len(idx)
            idx[i] = wid
            c = info[wid]
            b = _brief(i, c, 700)
            b["tema"] = verdicts.get(wid, [0, "", c.get("theme")])[2]
            if incremental and wid in prev_why and prev_why[wid]:
                b.pop("abstract", None)
                b["why_anterior"] = prev_why[wid]
            elif incremental:
                b["novo"] = True
            marcos.append(b)
        era_payload = {"key": k, "label": e["label"], "marcos": marcos}
        if incremental and k in prev_eras:
            era_payload["titulo_anterior"] = prev_eras[k].get("title", "")
            era_payload["resumo_anterior"] = prev_eras[k].get("summary", "")
        payload_eras.append(era_payload)

    payload = {"eras": payload_eras, "destaques_recentes": recent_highlights(topic)}
    if prev:
        payload["mudancas"] = {"entraram": changes["added"], "sairam": changes["removed"]}
    if incremental:
        payload["versao_anterior"] = {"overview": prev.get("overview", ""), "now": prev.get("now", {}),
                                      "threads": prev.get("threads", [])}
    res = llm.json(write_rules(topic, eras, incremental), json.dumps(payload, ensure_ascii=False),
                   max_tokens=14000, temperature=0.4)

    written = {e.get("key"): e for e in res.get("eras", []) if isinstance(e, dict)}
    out_eras = []
    for e in eras:
        k = e["key"]
        if not picked[k]:
            continue
        if k in unchanged:
            out_eras.append(dict(prev_eras[k], milestones=[dict(m, new=False) for m in prev_eras[k]["milestones"]]))
            continue
        w = written.get(k, {})
        why = {}
        for m in w.get("milestones", []):
            try:
                why[idx[int(m["i"])]] = (m.get("why") or "").strip()
            except (KeyError, TypeError, ValueError):
                continue
        ms = []
        for wid in picked[k]:
            c = info[wid]
            keep = incremental and prev_why.get(wid)
            ms.append({
                "id": c.get("id") or wid, "title": c["title"], "year": c["year"], "venue": c["venue"],
                "authors": [a for a in c["authors"] if a], "cited_by": c["cited_by"], "net": c.get("net", 0),
                "url": c["url"], "theme": verdicts.get(wid, [0, "", c.get("theme")])[2],
                "versions": c.get("versions", []), "watch": c.get("watch", []),
                "score": verdicts.get(wid, [c.get("score", 0)])[0],
                "why": prev_why[wid] if keep else why.get(wid, ""),
                "new": bool(prev) and wid in added_ids,
            })
        old = prev_eras.get(k, {})
        out_eras.append({
            "key": k, "label": e["label"],
            "title": (w.get("title") or old.get("title") or e["label"]).strip(),
            "summary": (w.get("summary") or old.get("summary") or "").strip(),
            "milestones": ms,
        })

    now = res.get("now") or {}
    threads = [t for t in res.get("threads", []) if isinstance(t, dict) and t.get("theme") in topic.themes]
    return {
        "generated": date.today().isoformat(),
        "month": date.today().strftime("%Y-%m"),
        "model": llm.used_model,
        "mode": mode,
        "changes": {"since": prev["generated"], **changes, "note": (res.get("changes_note") or "").strip()} if prev else None,
        "stats": {"network": len(nodes), "candidates": len(cands), "triaged": len(new_verdicts),
                  "milestones": sum(len(v) for v in picked.values()), "openalex_calls": fetch.calls,
                  "openalex_cost": round(fetch.cost, 4), "tokens": llm.usage},
        "overview": (res.get("overview") or (prev or {}).get("overview") or "").strip(),
        "eras": out_eras,
        "now": {"summary": (now.get("summary") or "").strip(),
                "open_questions": [q for q in now.get("open_questions", []) if isinstance(q, str)]},
        "threads": [{"theme": t["theme"], "line": (t.get("line") or "").strip()} for t in threads]
                   or (prev or {}).get("threads", []),
    }


def latest(topic):
    files = sorted((topic.data / "evolution").glob("*.json"), reverse=True)
    return json.loads(files[0].read_text(encoding="utf-8")) if files else None


def evolution_markdown(ev, topic):
    lines = [f"# Evolução do estado da arte — {topic.name}", "",
             f"<sub>gerado em {ev['generated']} · {ev['stats']['milestones']} marcos de uma rede de "
             f"{ev['stats']['network']} obras · modelo {ev.get('model', '?')}</sub>", ""]
    if ev.get("overview"):
        lines += [ev["overview"], ""]
    ch = ev.get("changes")
    if ch and (ch.get("added") or ch.get("removed") or ch.get("note")):
        lines += [f"## O que mudou desde {ch['since']}", ""]
        if ch.get("note"):
            lines += [ch["note"], ""]
        lines += [f"- ➕ {m['title']} ({m['year']})" for m in ch.get("added", [])]
        lines += [f"- ➖ {m['title']} ({m['year']})" for m in ch.get("removed", [])] + [""]
    for e in ev["eras"]:
        lines += [f"## {e['label']} · {e['title']}", "", e["summary"], ""]
        for m in e["milestones"]:
            au = ", ".join(m["authors"][:3]) + (" et al." if len(m["authors"]) > 3 else "")
            lines.append(f"- {'🆕 ' if m.get('new') else ''}**[{m['title']}]({m['url']})** ({m['year']}) — {au} · {m['venue'] or 's/ venue'} · cit:{m['cited_by']}")
            if m.get("why"):
                lines.append(f"  - {m['why']}")
        lines.append("")
    if ev["now"].get("summary"):
        lines += ["## Onde estamos agora", "", ev["now"]["summary"], ""]
        lines += [f"- {q}" for q in ev["now"].get("open_questions", [])] + [""]
    if ev.get("threads"):
        lines += ["## Linhas por tema", ""]
        lines += [f"- **{topic.themes.get(t['theme'], t['theme'])}**: {t['line']}" for t in ev["threads"]] + [""]
    return "\n".join(lines)
