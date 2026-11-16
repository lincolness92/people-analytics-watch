"""Single-file HTML of the site (CSS, JS, data and fonts inlined), for sharing offline."""

import base64
import re

from . import DIST, ROOT

THEMES_DIR = ROOT / "themes"
FETCH = 'fetch("data.json", { cache: "no-cache" })\n    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })'


def _inline_fonts(css, base):
    def repl(m):
        b64 = base64.b64encode((base / m.group(1)).read_bytes()).decode()
        return f'url("data:font/ttf;base64,{b64}")'
    return re.sub(r'url\("(fonts/[^"]+\.ttf)"\)', repl, css)


def bundle(theme=None):
    """Return the site in DIST as one HTML string; call render_all() first."""
    html = (DIST / "index.html").read_text(encoding="utf-8")
    css = (DIST / "style.css").read_text(encoding="utf-8")
    js = (DIST / "app.js").read_text(encoding="utf-8")
    data = (DIST / "data.json").read_text(encoding="utf-8").replace("</", "<\\/")
    if theme:
        tdir = THEMES_DIR / theme
        css += "\n" + _inline_fonts((tdir / "theme.css").read_text(encoding="utf-8"), tdir)
    if FETCH not in js:
        raise RuntimeError("app.js mudou: não achei o fetch de data.json para embutir os dados")
    js = js.replace(FETCH, 'Promise.resolve(JSON.parse(document.getElementById("pa-data").textContent))')
    for old, new in [
        ('<link rel="stylesheet" href="style.css">', f"<style>\n{css}</style>"),
        ('<script src="app.js"></script>',
         f'<script id="pa-data" type="application/json">{data}</script>\n<script>\n{js}</script>'),
    ]:
        if old not in html:
            raise RuntimeError(f"index.html mudou: não achei {old!r}")
        html = html.replace(old, new)
    return html
