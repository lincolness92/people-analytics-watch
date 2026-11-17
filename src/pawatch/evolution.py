"""State-of-the-art evolution of a topic: citation network → milestones per era → LLM timeline.

Seeds are the most-cited works of the topic's searches (all-time and recent) plus the papers
already selected in the digests. Their references are followed two layers back; works cited
often inside that network are the field's backbone. Each era keeps its strongest candidates
(network citations + global citations, ranked within the era so recent work can compete),
the LLM drops generic methods/off-topic works and writes the narrative.
"""

import json
import math
import sys
from collections import Counter
from datetime import date

from .collect import rebuild_abstract
from .http import get_json

OPENALEX = "https://api.openalex.org/works"
SELECT = ",".join(["id", "doi", "display_name", "publication_year", "cited_by_count", "type",
                   "primary_location", "authorships", "abstract_inverted_index", "referenced_works"])
TYPES = "type:article|review|book|book-chapter|preprint"

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


def build_network(topic, fetch, log, seeds_per_query=25, recent_per_query=12, layer1=150, layer2=100):
    cfg = topic.meta.get("evolution", {})
    queries = cfg.get("seed_queries") or topic.queries().get("openalex", {}).get("queries", [])
    nodes = {}

    def add(works):
        for w in works:
            if w.get("id") and w.get("display_name"):
                n = node(w)
                nodes.setdefault(n["id"], n)

    for q in queries:
        try:
            add(fetch.top_cited(q, seeds_per_query))
            add(fetch.top_cited(q, recent_per_query, since=date.today().year - 7))
        except RuntimeError as e:
            log(f"evolução: busca falhou ({q[:40]}…): {e}")

    dois = sorted({it["key"][4:] for d in topic.digests() for it in d.get("items", [])
                   if it.get("key", "").startswith("doi:")})
    add(fetch.by_ids(dois, field="doi"))
    seeds = set(nodes)
    log(f"evolução: {len(seeds)} sementes ({len(dois)} vindas dos digests)")

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
    log(f"evolução: rede com {len(nodes)} obras; OpenAlex {fetch.calls} chamadas, ≈ ${fetch.cost:.3f}")
    return nodes


def candidates(nodes, eras, per_era=30):
    """Strongest works of each era, ranked inside the era (percentiles of net and global citations)."""
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
        for n in group[:per_era]:
            out.append(dict(n, era=k))
    return out


def _brief(i, n, chars):
    return {"i": i, "title": n["title"], "year": n["year"], "venue": n["venue"],
            "authors": ", ".join(a for a in n["authors"][:3] if a), "cit": n["cited_by"],
            "net": n["net"], "abstract": n["abstract"][:chars] or "(sem abstract)"}


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
Responda APENAS com JSON: {{"r": [{{"i": <id>, "s": <int>, "k": "...", "t": "..."}}, ...]}} cobrindo todos os ids."""


def write_rules(topic, eras):
    era_list = ", ".join(f'{e["key"]} ({e["label"]})' for e in eras)
    return f"""Escreva em PT-BR a EVOLUÇÃO DO ESTADO DA ARTE do tema, para {topic.meta["audience"].split(".")[0].lower()}.
Você recebe os marcos de cada época ({era_list}) e os destaques recentes dos digests.
Devolva APENAS JSON:
{{
 "overview": "3–4 frases: o arco completo do campo, do início até hoje",
 "eras": [{{"key": "<chave>", "title": "nome curto e memorável da época (até 6 palavras)",
   "summary": "3–4 frases: que problema a época resolveu, que ideia ou método virou padrão, o que ficou em aberto",
   "milestones": [{{"i": <id>, "why": "1–2 frases: a contribuição concreta e por que importa até hoje"}}]}}],
 "now": {{"summary": "3–4 frases: onde o campo está agora, conectando aos destaques recentes",
   "open_questions": ["3 a 5 perguntas em aberto, curtas"]}},
 "threads": [{{"theme": "<chave do tema>", "line": "1–2 frases: como esse tema evoluiu ao longo das épocas"}}]
}}
Inclua todas as épocas recebidas, na ordem, e todos os marcos recebidos (pode reordenar dentro da época).
Faça "threads" só para temas com pelo menos 2 marcos. Tom direto, concreto, sem jargão vazio; cite anos e autores quando ajudar."""


def triage(llm, cands, topic, log, batch=40):
    out = {}
    for start in range(0, len(cands), batch):
        chunk = cands[start:start + batch]
        lines = "\n".join(json.dumps(_brief(start + j, n, 350), ensure_ascii=False) for j, n in enumerate(chunk))
        try:
            res = llm.json(triage_rules(topic), f"Obras (um JSON por linha):\n{lines}", max_tokens=8000)
        except RuntimeError as e:
            log(f"evolução: triagem do lote {start} falhou: {e}")
            continue
        for r in res.get("r", []):
            try:
                i = int(r["i"])
            except (KeyError, TypeError, ValueError):
                continue
            if start <= i < start + len(chunk):
                theme = r.get("t") if r.get("t") in topic.themes else next(iter(topic.themes))
                out[i] = (max(0, min(10, int(r.get("s", 0) or 0))), r.get("k", "marco"), theme)
    return out


def pick_milestones(cands, scores, eras, per_era=7, min_score=6):
    picked = {e["key"]: [] for e in eras}
    ranked = sorted(scores.items(), key=lambda kv: (-kv[1][0], -cands[kv[0]]["net"]))
    for i, (s, kind, _) in ranked:
        era = cands[i]["era"]
        if kind == "marco" and s >= min_score and len(picked[era]) < per_era:
            picked[era].append(i)
    return picked


def recent_highlights(topic, limit=25):
    items = [dict(it, _date=d["date"]) for d in topic.digests() for it in d.get("items", [])]
    items.sort(key=lambda x: (-x.get("score", 0), x["_date"]), reverse=False)
    return [{"title": it["title"], "date": it["_date"], "score": it.get("score"), "theme": it.get("theme"),
             "summary": (it.get("summary") or "")[:260]} for it in items[:limit]]


def evolve(topic, llm, log=lambda m: print(m, file=sys.stderr)):
    eras = topic.meta.get("evolution", {}).get("eras") or DEFAULT_ERAS
    fetch = Fetcher(log)
    nodes = build_network(topic, fetch, log)
    cands = candidates(nodes, eras)
    log(f"evolução: {len(cands)} candidatos a marco para triagem")
    scores = triage(llm, cands, topic, log)
    picked = pick_milestones(cands, scores, eras)
    n_picked = sum(len(v) for v in picked.values())
    if not n_picked:
        raise RuntimeError("nenhum marco passou da triagem")

    payload = {
        "eras": [{"key": e["key"], "label": e["label"],
                  "marcos": [dict(_brief(i, cands[i], 700), tema=scores[i][2]) for i in picked[e["key"]]]}
                 for e in eras if picked[e["key"]]],
        "destaques_recentes": recent_highlights(topic),
    }
    res = llm.json(write_rules(topic, eras), json.dumps(payload, ensure_ascii=False),
                   max_tokens=14000, temperature=0.4)

    written = {e.get("key"): e for e in res.get("eras", []) if isinstance(e, dict)}
    out_eras = []
    for e in eras:
        ids = picked[e["key"]]
        if not ids:
            continue
        w = written.get(e["key"], {})
        why = {}
        for m in w.get("milestones", []):
            try:
                why[int(m["i"])] = (m.get("why") or "").strip()
            except (KeyError, TypeError, ValueError):
                continue
        order = [i for i in why if i in ids] + [i for i in ids if i not in why]
        out_eras.append({
            "key": e["key"], "label": e["label"],
            "title": (w.get("title") or e["label"]).strip(),
            "summary": (w.get("summary") or "").strip(),
            "milestones": [{
                "title": cands[i]["title"], "year": cands[i]["year"], "venue": cands[i]["venue"],
                "authors": [a for a in cands[i]["authors"] if a], "cited_by": cands[i]["cited_by"],
                "net": cands[i]["net"], "url": cands[i]["url"], "theme": scores[i][2],
                "score": scores[i][0], "why": why.get(i, ""),
            } for i in order],
        })

    now = res.get("now") or {}
    threads = [t for t in res.get("threads", []) if isinstance(t, dict) and t.get("theme") in topic.themes]
    return {
        "generated": date.today().isoformat(),
        "month": date.today().strftime("%Y-%m"),
        "model": llm.used_model,
        "stats": {"network": len(nodes), "candidates": len(cands), "triaged": len(scores),
                  "milestones": n_picked, "openalex_calls": fetch.calls,
                  "openalex_cost": round(fetch.cost, 4), "tokens": llm.usage},
        "overview": (res.get("overview") or "").strip(),
        "eras": out_eras,
        "now": {"summary": (now.get("summary") or "").strip(),
                "open_questions": [q for q in now.get("open_questions", []) if isinstance(q, str)]},
        "threads": [{"theme": t["theme"], "line": (t.get("line") or "").strip()} for t in threads],
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
    for e in ev["eras"]:
        lines += [f"## {e['label']} · {e['title']}", "", e["summary"], ""]
        for m in e["milestones"]:
            au = ", ".join(m["authors"][:3]) + (" et al." if len(m["authors"]) > 3 else "")
            lines.append(f"- **[{m['title']}]({m['url']})** ({m['year']}) — {au} · {m['venue'] or 's/ venue'} · cit:{m['cited_by']}")
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
