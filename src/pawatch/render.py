"""Render digests (JSON → Markdown), INDEX.md and the static site bundle."""

import json
import shutil
from datetime import date

from . import CONFIG, DATA, DIGESTS_MD, DIST, ROOT, THEMES, WEB


def load_digests():
    out = []
    for f in sorted((DATA / "digests").glob("*.json"), reverse=True):
        out.append(json.loads(f.read_text(encoding="utf-8")))
    return out


def _meta(it):
    bits = [it["venue"] or it["origin"]]
    if it.get("cited_by"):
        bits.append(f"cit:{it['cited_by']}")
    meta = ", ".join(bits) + f" · **{it['score']}/10**"
    if it.get("watch_authors"):
        meta += f" · ⭐ {', '.join(it['watch_authors'])}"
    return meta


def digest_markdown(d):
    day = date.fromisoformat(d["date"]).strftime("%d/%m/%Y")
    head = f"**📡 PEOPLE-ANALYTICS-WATCH — digest de {day}** · {d['stats']['candidates']} candidatos novos"
    if not d["items"]:
        return f"# PEOPLE-ANALYTICS-WATCH {d['date']}\n\n{head}, nada acima da barra hoje.\n"
    head += f", {len(d['items'])} selecionados"
    if d.get("headline"):
        head += f" ({d['headline']})"
    lines = [f"# PEOPLE-ANALYTICS-WATCH {d['date']}", "", head, ""]
    for key, label in THEMES.items():
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
        lines += [f"**🔥 Tendência do dia**: {d['trend']}", ""]
    lines.append(f"<sub>modelo: {d.get('model', '?')}</sub>")
    return "\n".join(lines) + "\n"


def write_markdown(digests):
    DIGESTS_MD.mkdir(exist_ok=True)
    for d in digests:
        (DIGESTS_MD / f"{d['date']}.md").write_text(digest_markdown(d), encoding="utf-8")

    themes = {k: [] for k in THEMES}
    trends = []
    for d in digests:
        for it in d["items"]:
            themes[it["theme"]].append(f"- {d['date']} · [{it['title']}]({it['url']}) · {it['score']}/10")
        if d.get("trend"):
            trends.append(f"- **{d['date']}** — {d['trend']}")
    lines = ["# Índice por tema", "",
             "Gerado automaticamente por `python -m pawatch render` a partir de `data/digests/`.", ""]
    for key, label in THEMES.items():
        if themes[key]:
            lines += [f"## {label} ({len(themes[key])})", ""] + themes[key] + [""]
    lines += [f"## 🔥 Tendência do dia ({len(trends)})", ""] + trends + [""]
    (ROOT / "INDEX.md").write_text("\n".join(lines), encoding="utf-8")


def build_site(digests):
    if DIST.exists():
        shutil.rmtree(DIST)
    shutil.copytree(WEB, DIST)
    watch_path = CONFIG / "watchlist.json"
    watch = json.loads(watch_path.read_text(encoding="utf-8")) if watch_path.exists() else {}
    bundle = {
        "generated": date.today().isoformat(),
        "themes": THEMES,
        "digests": digests,
        "watchlist": watch,
    }
    (DIST / "data.json").write_text(json.dumps(bundle, ensure_ascii=False), encoding="utf-8")


def render_all():
    digests = load_digests()
    write_markdown(digests)
    build_site(digests)
    return len(digests)
