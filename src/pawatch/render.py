"""Render digests (JSON → Markdown), INDEX.md and the static site (one folder per topic)."""

import html
import json
import shutil
from datetime import date

from . import DATA, DIST, ROOT, WEB
from .annual import annual_markdown, latest_by_year
from .library import load as load_library
from .regulation import published as regulation_published
from .searchindex import build_index
from .evolution import evolution_markdown, latest as latest_evolution
from .topic import all_topics


def _meta(it):
    bits = [it["venue"] or it["origin"]]
    if it.get("cited_by"):
        bits.append(f"cit:{it['cited_by']}")
    meta = ", ".join(bits) + f" · **{it['score']}/10**"
    if it.get("watch_authors"):
        meta += f" · ⭐ {', '.join(it['watch_authors'])}"
    if it.get("watch_source"):
        meta += f" · 📌 {it['watch_source']}"
    if it.get("region") == "brasil":
        meta += " · 🇧🇷"
    return meta


def _label(topic):
    return f"{topic.meta.get('brand', {}).get('mark', '📡')} {topic.name.upper().replace(' ', '-')}"


def digest_markdown(d, topic):
    title = topic.name.upper().replace(" ", "-")
    day = date.fromisoformat(d["date"]).strftime("%d/%m/%Y")
    if d.get("period"):
        day = f"{date.fromisoformat(d['period']['from']).strftime('%d/%m')} a {day}"
    head = f"**{_label(topic)} — digest de {day}** · {d['stats']['candidates']} candidatos novos"
    if not d["items"]:
        return f"# {title} {d['date']}\n\n{head}, nada acima da barra no período.\n"
    head += f", {len(d['items'])} selecionados"
    if d.get("headline"):
        head += f" ({d['headline']})"
    lines = [f"# {title} {d['date']}", "", head, ""]
    for key, label in topic.themes.items():
        group = [it for it in d["items"] if it["theme"] == key]
        if not group:
            continue
        lines += [f"**{label}**", ""]
        for it in group:
            lines.append(f"- **[{it['title']}]({it['url']})** — {_meta(it)}")
            lines.append(f"  - {it['summary']}")
        lines.append("")
    if d.get("quick"):
        q = " · ".join(f"[{x['title']}]({x['url']})" + (f" ({x['note']})" if x.get("note") else "")
                       for x in d["quick"])
        lines += [f"**Menções rápidas**: {q}", ""]
    if d.get("trend"):
        lines += [f"**🔥 Tendência**: {d['trend']}", ""]
    lines.append(f"<sub>modelo: {d.get('model', '?')}</sub>")
    return "\n".join(lines) + "\n"


def write_markdown(topics):
    lines = ["# Índice", "", "Gerado automaticamente por `python -m pawatch render` a partir de `data/<tema>/digests/`.", ""]
    for topic in topics:
        digests = topic.digests()
        topic.digests_md.mkdir(parents=True, exist_ok=True)
        for d in digests:
            (topic.digests_md / f"{d['date']}.md").write_text(digest_markdown(d, topic), encoding="utf-8")
        ev = latest_evolution(topic)
        if ev:
            (topic.digests_md / "evolucao.md").write_text(evolution_markdown(ev, topic), encoding="utf-8")
        for y, ad in latest_by_year(topic).items():
            (topic.digests_md / f"anual-{y}.md").write_text(annual_markdown(ad, topic), encoding="utf-8")
        by_theme = {k: [] for k in topic.themes}
        trends = []
        for d in digests:
            for it in d["items"]:
                by_theme.setdefault(it["theme"], []).append(
                    f"- {d['date']} · [{it['title']}]({it['url']}) · {it['score']}/10")
            if d.get("trend"):
                trends.append(f"- **{d['date']}** — {d['trend']}")
        lines += [f"# {_label(topic)}", "", f"{len(digests)} digests em `digests/{topic.slug}/`.", ""]
        for key, label in topic.themes.items():
            if by_theme.get(key):
                lines += [f"## {label} ({len(by_theme[key])})", ""] + by_theme[key] + [""]
        if trends:
            lines += [f"## 🔥 Tendências ({len(trends)})", ""] + trends + [""]
    (ROOT / "INDEX.md").write_text("\n".join(lines), encoding="utf-8")


def site_data(topic, topics):
    m = topic.meta
    return {
        "generated": date.today().isoformat(),
        "topic": {"slug": topic.slug, "name": m["name"], "brand": m.get("brand", {}), "regions": m.get("regions", {}),
                  "focus": m.get("rubric_focus", ""),
                  "description": m.get("description", ""), "watchlist_labels": m.get("watchlist_labels", {})},
        "topics": [{"slug": t.slug, "name": t.name} for t in topics],
        "themes": topic.themes,
        "digests": topic.digests(),
        "watchlist": topic.watchlist(),
        "evolution": latest_evolution(topic),
        "annual": latest_by_year(topic),
        "regulation": regulation_published(topic),
    }


def _landing(topics):
    """Site root: the Carta design's "Temas" screen (web/designs/carta in root mode, assets copied to dist/carta/).
    Falls back to a plain list of topics when the design folder is missing."""
    carta = WEB / "designs" / "carta" / "index.html"
    if carta.exists() and topics:
        page = carta.read_text(encoding="utf-8")
        first = html.escape(topics[0].slug)
        links = "".join(f'<li><a href="{html.escape(t.slug)}/">{html.escape(t.name)}</a></li>' for t in topics)
        for a, b in [('<html lang="pt-BR">', '<html lang="pt-BR" data-carta-root>'),
                     ("<title>Carta · Research Watch</title>", "<title>Research Watch</title>"),
                     ('href="carta.css"', 'href="carta/carta.css"'), ('src="carta.js"', 'src="carta/carta.js"'),
                     ('<button type="button" class="back" data-design>Trocar de design</button>', f'<a class="back" href="{first}/?design=classico">Site clássico</a>'),
                     ('<p class="loading mono">Carregando…</p>', f'<p class="loading mono">Carregando…</p><noscript><ul class="more-l">{links}</ul></noscript>')]:
            if a not in page:
                break
            page = page.replace(a, b, 1)
        else:
            return page
    cards = []
    for t in topics:
        ds = t.digests()
        last = ds[0] if ds else None
        sub = html.escape(last["headline"][:1].upper() + last["headline"][1:]) if last and last.get("headline") else "Sem digest ainda."
        mark = html.escape(t.meta.get("brand", {}).get("mark", "📡"))
        cards.append(f'<a class="card" href="{t.slug}/index.html"><h3>{mark} {html.escape(t.name)}</h3>'
                     f'<p class="muted">{html.escape(t.meta.get("description", ""))}</p>'
                     f'<p class="summary">{sub}</p></a>')
    return f"""<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Research Watch</title><meta name="robots" content="noindex, nofollow">
<link rel="stylesheet" href="style.css">
<style>a.card{{display:block;text-decoration:none}} a.card:hover h3{{text-decoration:underline}}</style></head>
<body><main class="wrap"><h1 class="day">Research Watch</h1>
<p class="dek">Digests de pesquisa state-of-the-art, um por tema.</p>
{''.join(cards)}</main></body></html>
"""


def topic_repos(slug):
    """Code repositories linked to the topic's stored papers, with the titles of those papers (for the search index)."""
    try:
        index = json.loads((DATA / "papers" / "index.json").read_text(encoding="utf-8"))
        repos = json.loads((DATA / "papers" / "repos.json").read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return []
    mine = {k for k, e in index.items() if slug in (e.get("topics") or [])}
    out = []
    for url, r in sorted(repos.items()):
        keys = [k for k in r.get("papers") or [] if k in mine]
        if keys and not r.get("archived"):
            out.append({**r, "url": url, "paper_titles": [index[k].get("title") for k in keys if index[k].get("title")]})
    return out


def build_site(topics):
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir(parents=True)
    for t in topics:
        shutil.copytree(WEB, DIST / t.slug)
        (DIST / t.slug / "data.json").write_text(json.dumps(site_data(t, topics), ensure_ascii=False), encoding="utf-8")
        # read only by functions/api/ask.js, never by the pages
        lib = load_library(t)
        (DIST / t.slug / "library.json").write_text(json.dumps(lib, ensure_ascii=False), encoding="utf-8")
        site = json.loads((DIST / t.slug / "data.json").read_text(encoding="utf-8"))
        (DIST / t.slug / "search.json").write_text(json.dumps(build_index(site, lib, topic_repos(t.slug)), ensure_ascii=False, separators=(",", ":")),
                                                   encoding="utf-8")
    shutil.copy(WEB / "style.css", DIST / "style.css")
    # the root landing is the Carta design's "Temas" screen: its assets live at dist/carta/
    if (WEB / "designs" / "carta").exists():
        shutil.copytree(WEB / "designs" / "carta", DIST / "carta")
    # shared full-text store (one file per paper, whatever the number of topics) + repository catalogue
    papers = DATA / "papers"
    if papers.exists():
        shutil.copytree(papers, DIST / "papers")
    # topic list for the external interfaces (REST v1, MCP, A2A agent card)
    (DIST / "topics.json").write_text(json.dumps([{"slug": t.slug, "name": t.name, "description": t.meta.get("description", "")}
                                                  for t in topics], ensure_ascii=False), encoding="utf-8")
    (DIST / "index.html").write_text(_landing(topics), encoding="utf-8")


def render_all():
    topics = all_topics()
    write_markdown(topics)
    build_site(topics)
    return {t.slug: len(t.digests()) for t in topics}
