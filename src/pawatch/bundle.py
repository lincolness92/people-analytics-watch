"""Single-file HTML of the site (CSS, JS, data and fonts inlined), for sharing offline."""

import base64
import json
import re

from . import DIST, ROOT

THEMES_DIR = ROOT / "themes"
FETCH = 'fetch("data.json", { cache: "no-cache" })\n    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })'


def _inline_fonts(css, base):
    def repl(m):
        b64 = base64.b64encode((base / m.group(1)).read_bytes()).decode()
        return f'url("data:font/ttf;base64,{b64}")'
    return re.sub(r'url\("(fonts/[^"]+\.ttf)"\)', repl, css)


def bundle(slug, theme=None):
    """Return one topic's site (DIST/<slug>/) as a single HTML string; call render_all() first."""
    site = DIST / slug
    html = (site / "index.html").read_text(encoding="utf-8")
    css = (site / "style.css").read_text(encoding="utf-8")
    js = (site / "app.js").read_text(encoding="utf-8")
    data = json.loads((site / "data.json").read_text(encoding="utf-8"))
    data["topics"] = []  # offline file: no links to the other topics
    data["offline"] = True  # no server behind it: hide feedback and other live features
    data = json.dumps(data, ensure_ascii=False).replace("</", "<\\/")
    if theme:
        tdir = THEMES_DIR / theme
        css += "\n" + _inline_fonts((tdir / "theme.css").read_text(encoding="utf-8"), tdir)
        if (tdir / "theme.js").exists():
            js += "\n" + (tdir / "theme.js").read_text(encoding="utf-8")
    if FETCH not in js:
        raise RuntimeError("app.js mudou: não achei o fetch de data.json para embutir os dados")
    js = js.replace(FETCH, 'Promise.resolve(JSON.parse(document.getElementById("pa-data").textContent))')
    # the design redirect (index.html's first script) makes no sense in a single offline file
    html = re.sub(r"\s*<script>\s*// Default design: Carta\..*?</script>", "", html, count=1, flags=re.S)
    for old, new in [
        ('<link rel="stylesheet" href="style.css">', f"<style>\n{css}</style>"),
        ('<script src="app.js"></script>',
         f'<script id="pa-data" type="application/json">{data}</script>\n<script>\n{js}</script>'),
    ]:
        if old not in html:
            raise RuntimeError(f"index.html mudou: não achei {old!r}")
        html = html.replace(old, new)
    return html
