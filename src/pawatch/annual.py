"""Annual review per topic: the year's highlights, which subtopics grew, and where innovation happens.

For a year Y it gathers, from OpenAlex, the most cited works of Y for every search of the topic and
by the watchlist researchers; ranks them by citation velocity (citations per month since
publication, so December papers are not punished), sends the best to the same LLM triage as the
daily digest, and asks the LLM for a synthesis grounded in three data blocks it did not invent:
the highlights, the year-over-year volume of each search (growth), and who publishes (institutions,
countries, academia × companies × government). Output: data/<topic>/annual/<Y>.json.
"""

import json
import re
from collections import Counter, defaultdict
from datetime import date

from .collect import SELECT, annotate_and_dedupe, from_openalex
from .http import get_json
from .score import _brief, audience, triage

OPENALEX = "https://api.openalex.org/works"
TYPES = "type:article|preprint|review|book-chapter|report"
SECTORS = {"education": "Academia", "company": "Empresas", "government": "Governo e reguladores",
           "facility": "Centros de pesquisa", "nonprofit": "Sem fins lucrativos", "healthcare": "Saúde",
           "archive": "Outros", "other": "Outros", "funder": "Outros"}


def _label(query):
    """Short human label for a boolean search: its first quoted phrase(s)."""
    phrases = re.findall(r'"([^"]+)"', query)
    return " / ".join(phrases[:2]) if phrases else query[:60]


def clean_prose(text, themes):
    """Drop internal ids ("(i=30)") and theme keys ("risk_credit") the LLM sometimes leaks into prose."""
    t = re.sub(r"\s*\((?:i|id)\s*=\s*\d+(?:\s*,\s*(?:i|id)?\s*=?\s*\d+)*\)", "", text or "")
    for key, label in themes.items():
        if "_" not in key:  # plain-word keys ("payments", "hiring") are also ordinary words: leave them alone
            continue
        name = label.split(" ", 1)[1] if " " in label else label
        if name[1:2].islower():  # "Risco, crédito..." → "risco, crédito..."; keep "IA & futuro..." as is
            name = name[:1].lower() + name[1:]
        t = re.sub(rf"\b{re.escape(key)}\b", name, t)
    return t.strip()


def _months_since(pub, today):
    try:
        d = date.fromisoformat(pub[:10])
    except (TypeError, ValueError):
        return 12
    return max(1, (today.year - d.year) * 12 + today.month - d.month)


class Annual:
    def __init__(self, topic, year, log, today=None):
        self.topic, self.year, self.log = topic, year, log
        self.today = today or date.today()
        self.calls, self.cost = 0, 0.0

    def _get(self, params):
        data = get_json(OPENALEX, params)
        self.calls += 1
        self.cost += float((data.get("meta") or {}).get("cost_usd") or 0)
        return data

    def count(self, query, year):
        return self._get({"filter": f"publication_year:{year},{TYPES},title_and_abstract.search:{query}",
                          "per-page": 1})["meta"]["count"]

    def top(self, flt, per_page):
        return self._get({"filter": f"publication_year:{self.year},{TYPES},{flt}", "sort": "cited_by_count:desc",
                          "per-page": per_page, "select": SELECT + ",publication_year"}).get("results") or []

    def gather(self, per_query=40):
        queries = self.topic.queries().get("openalex", {}).get("queries", [])
        growth, raw = [], []
        for q in queries:
            try:
                cur, prev = self.count(q, self.year), self.count(q, self.year - 1)
                works = self.top(f"title_and_abstract.search:{q}", per_query)
            except RuntimeError as e:
                self.log(f"anual: busca falhou ({q[:40]}…): {str(e)[:100]}")
                continue
            growth.append({"label": _label(q), "query": q, "prev": prev, "cur": cur})
            raw += [(w, "busca") for w in works]
        watch = self.topic.watchlist()
        ids = [r["openalex_id"] for r in watch.get("researchers", []) if r.get("openalex_id")]
        for i in range(0, len(ids), 50):
            try:
                raw += [(w, "watchlist") for w in self.top(f"authorships.author.id:{'|'.join(ids[i:i + 50])}", 100)]
            except RuntimeError as e:
                self.log(f"anual: watchlist falhou: {str(e)[:100]}")
        return growth, raw, watch

    def geography(self, raw):
        """Who publishes the year's works on the topic: sectors, institutions, countries, companies."""
        seen, sectors, insts, countries, companies = set(), Counter(), Counter(), Counter(), Counter()
        inst_country = {}
        for w, _ in raw:
            if w["id"] in seen:
                continue
            seen.add(w["id"])
            types, names, ccs = set(), set(), set()
            for a in w.get("authorships") or []:
                for inst in a.get("institutions") or []:
                    name = inst.get("display_name")
                    if not name:
                        continue
                    types.add(SECTORS.get(inst.get("type") or "other", "Outros"))
                    names.add(name)
                    if inst.get("country_code"):
                        ccs.add(inst["country_code"])
                        inst_country[name] = inst["country_code"]
                    if inst.get("type") == "company":
                        companies[name] += 1
            sectors.update(types)
            insts.update(names)
            countries.update(ccs)
        n = len(seen)
        return {
            "works": n,
            "sectors": [{"name": k, "works": v, "share": round(v / n, 3) if n else 0} for k, v in sectors.most_common()],
            "institutions": [{"name": k, "works": v, "country": inst_country.get(k, "")} for k, v in insts.most_common(15)],
            "countries": [{"code": k, "works": v} for k, v in countries.most_common(12)],
            "companies": [{"name": k, "works": v, "country": inst_country.get(k, "")} for k, v in companies.most_common(10)],
        }


WRITE = """Escreva a retrospectiva anual do tema para o ano {year}{partial}. Use SÓ os dados abaixo (destaques do
ano já triados, o volume de publicações por subtema neste ano e no anterior, e quem publicou). Devolva APENAS JSON:
- "overview": parágrafo de 3–5 frases em PT-BR: o que definiu o ano no tema.{regions}
- "trends": 3 a 5 tendências {{"title": frase curta, "text": 2–3 frases citando números do crescimento ou papers dos destaques}}.
  Ao citar crescimento, use exatamente `variacao_percentual` ou `multiplicador` (ex.: 130→957 é +636%, ou 7,4x); nunca confunda os dois.
  Uma tendência só existe se os dados mostram (crescimento de volume, vários destaques na mesma direção).
- "innovation": parágrafo de 2–4 frases: onde a inovação está acontecendo (academia × empresas × governo, instituições,
  países, empresas que publicam), com números do bloco "quem publica". Se o Brasil aparece, diga; se não aparece, diga também.
- "highlights": para cada destaque, {{"i": id, "title": título curto PT-BR ou original, "why": 1–2 frases: o que trouxe de novo e por que importa}}.
Não invente papers, números, instituições ou empresas. Cite papers pelo título curto, nunca pelo id."""


def build(topic, year, llm, log, today=None, max_highlights=15, pool_size=150):
    today = today or date.today()
    a = Annual(topic, year, log, today)
    growth, raw, watch = a.gather()
    cands = annotate_and_dedupe([dict(from_openalex(w, origin), pub=w.get("publication_date") or "") for w, origin in raw],
                                watch, set())
    for c in cands:
        c["velocity"] = round(c["cited_by"] / _months_since(c.get("pub") or c["date"], today), 2)
    cands.sort(key=lambda c: (3 * bool(c["watch_authors"]) + 2 * c["watch_journal"] + bool(c["abstract"])
                              + min(c["velocity"], 20) * 0.5), reverse=True)
    pool = cands[:pool_size]
    log(f"anual {year}: {len(raw)} obras brutas, {len(cands)} únicas, {len(pool)} para triagem; OpenAlex {a.calls} chamadas, ≈ ${a.cost:.3f}")
    scores = triage(llm, pool, topic, log=log)
    ranked = sorted(scores, key=lambda i: (-scores[i][0], -pool[i]["velocity"]))
    per_theme, picked = Counter(), []
    for i in ranked:
        s, theme = scores[i][0], scores[i][1]
        if s < 7 or per_theme[theme] >= 4:
            continue
        per_theme[theme] += 1
        picked.append(i)
        if len(picked) >= max_highlights:
            break
    geo = a.geography(raw)
    partial = year == today.year
    for g in growth:  # project the current year to 12 months so the comparison is fair (OpenAlex lags a bit)
        g["cur_full_year"] = round(g["cur"] * 12 / max(1, today.month - 1 + today.day / 31)) if partial else g["cur"]
        g["change"] = round((g["cur_full_year"] - g["prev"]) / g["prev"], 2) if g["prev"] else None
    regions = topic.meta.get("regions")
    body = {
        "destaques": [dict(_brief(i, pool[i], 700), s=scores[i][0], t=scores[i][1], cit=pool[i]["cited_by"],
                           vel=pool[i]["velocity"]) for i in picked],
        "crescimento_por_subtema": [{"subtema": g["label"], f"{year - 1}": g["prev"],
                                     f"{year}{' (projetado p/ 12 meses)' if partial else ''}": g["cur_full_year"],
                                     "variacao_percentual": f"{g['change']:+.0%}" if g["change"] is not None else "n/d",
                                     "multiplicador": f"{g['cur_full_year'] / g['prev']:.1f}x" if g["prev"] else "n/d"}
                                    for g in growth],
        "quem_publica": geo,
    }
    rules = WRITE.format(year=year, partial=f" (parcial, até {today.strftime('%d/%m')})" if partial else "",
                         regions=" Separe Brasil e mundo quando houver o que dizer de cada." if regions else "")
    out = llm.json(audience(topic) + "\n\n" + rules, json.dumps(body, ensure_ascii=False), max_tokens=9000, temperature=0.3)
    written = {int(x["i"]): x for x in out.get("highlights", []) if str(x.get("i", "")).isdigit()}
    highlights = []
    for i in picked:
        c, w = pool[i], written.get(i, {})
        highlights.append({"title": w.get("title") or c["title"], "original_title": c["title"], "url": c["url"],
                           "venue": c["venue"], "date": c.get("pub") or c["date"], "authors": c["authors"][:8],
                           "institutions": c["institutions"], "watch_authors": c["watch_authors"], "score": scores[i][0],
                           "theme": scores[i][1], "region": scores[i][2] if len(scores[i]) > 2 else "",
                           "cited_by": c["cited_by"], "velocity": c["velocity"], "why": (w.get("why") or "").strip()})
    growth.sort(key=lambda g: (g["change"] is None, -(g["change"] or 0)))
    noid = lambda t: clean_prose(t, topic.themes)
    out["overview"], out["innovation"] = noid(out.get("overview")), noid(out.get("innovation"))
    out["trends"] = [dict(t, text=noid(t.get("text")), title=noid(t.get("title"))) for t in out.get("trends") or []]
    return {
        "year": year, "partial": partial, "generated": today.isoformat(), "model": llm.used_model,
        "overview": (out.get("overview") or "").strip(), "trends": out.get("trends") or [],
        "innovation": (out.get("innovation") or "").strip(), "highlights": highlights, "growth": growth,
        "geography": geo,
        "_library": (pool, scores),  # popped by the caller: triaged papers go to the topic library
        "stats": {"works": len(cands), "triaged": len(scores), "highlights": len(highlights),
                  "openalex_calls": a.calls, "openalex_cost": round(a.cost, 4), "tokens": llm.usage},
    }


def latest_by_year(topic):
    out = {}
    for f in sorted((topic.data / "annual").glob("*.json")):
        d = json.loads(f.read_text(encoding="utf-8"))
        out[str(d["year"])] = d
    return out


def annual_markdown(d, topic):
    lines = [f"# Retrospectiva {d['year']}{' (parcial)' if d.get('partial') else ''} — {topic.name}", "",
             f"<sub>gerado em {d['generated']} · {d['stats']['works']} obras · modelo {d.get('model', '?')}</sub>", "",
             d.get("overview", ""), "", "## Tendências", ""]
    lines += [f"- **{t.get('title', '')}**: {t.get('text', '')}" for t in d.get("trends", [])]
    lines += ["", "## Onde a inovação acontece", "", d.get("innovation", ""), "", "## Destaques", ""]
    by_theme = defaultdict(list)
    for h in d["highlights"]:
        by_theme[h["theme"]].append(h)
    for key, label in topic.themes.items():
        for h in by_theme.get(key, []):
            lines.append(f"- **[{h['title']}]({h['url']})** — {h['venue']} · {h['score']}/10 · {h['cited_by']} cit. ({label})")
            if h.get("why"):
                lines.append(f"  - {h['why']}")
    lines += ["", "## Volume por subtema", "", f"| Subtema | {d['year'] - 1} | {d['year']} | Variação |", "|---|---|---|---|"]
    for g in d["growth"]:
        ch = f"{g['change']:+.0%}" if g.get("change") is not None else "—"
        lines.append(f"| {g['label']} | {g['prev']} | {g['cur_full_year']}{'*' if d.get('partial') else ''} | {ch} |")
    if d.get("partial"):
        lines += ["", "<sub>* ano em curso, projetado para 12 meses.</sub>"]
    return "\n".join(lines) + "\n"
