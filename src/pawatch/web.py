"""Web sources for watchlist centers and practitioners (blogs, newsletters, podcasts, listings).

Three kinds (config/sources.json):
- rss: items dated inside the window (optional title regex `pattern`; with `"social": true` the
  pattern is also matched against the post text, and untitled posts get their first sentence as title;
  `max` caps items per run);
- page: article links on a listing page, matched by URL regex `pattern`;
- sitemap: URLs in a sitemap, matched by `pattern`.
For page/sitemap there is no reliable date, so data/web_state.json remembers every URL already
seen per source: the first run only records a baseline (plus anything whose page carries a date
inside the window); later runs emit just the URLs that appeared since.
"""

import email.utils
import html
import re
import urllib.parse
import xml.etree.ElementTree as ET
from datetime import date, datetime

from .http import get_text

HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; people-analytics-watch/0.1; research digest)"}
MAX_NEW_PER_SOURCE = 12


def _fetch(url):
    return get_text(url, headers=HEADERS, timeout=30, retries=2)


def _clean(text, limit=1500):
    text = html.unescape(re.sub(r"<[^>]+>", " ", text or ""))
    return " ".join(text.split())[:limit]


def _parse_date(s):
    s = (s or "").strip()
    if not s:
        return None
    try:
        return email.utils.parsedate_to_datetime(s).date()
    except (TypeError, ValueError):
        pass
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00")[:25]).date()
    except ValueError:
        m = re.match(r"\d{4}-\d{2}-\d{2}", s)
        if m:
            return date.fromisoformat(m.group(0))
        m = re.search(r"([A-Z][a-z]+)\s+(\d{1,2}),?\s+(\d{4})", s)  # "Thursday, November 12, 2026 - 10:00"
        try:
            return datetime.strptime(" ".join(m.groups()), "%B %d %Y").date() if m else None
        except ValueError:
            return None


def _headline(text, limit=110):
    """First sentence (or first words) of a post, as a stand-in title."""
    text = _clean(text, 400)
    first = re.split(r"(?<=[.!?])\s", text, maxsplit=1)[0]
    if len(first) > limit:
        first = first[:limit].rsplit(" ", 1)[0] + "…"
    return first


def _norm_url(u):
    p = urllib.parse.urlparse(u)
    return urllib.parse.urlunparse((p.scheme, p.netloc.lower(), p.path.rstrip("/") or "/", "", p.query, ""))


def _item(src, url, title, summary, day):
    return {
        "key": f"web:{_norm_url(url)}",
        "title": _clean(title, 300),
        "abstract": _clean(summary),
        "authors": [],
        "author_ids": [],
        "institutions": [],
        "venue": src["name"],
        "source_id": "",
        "type": "post",
        "language": "",
        "date": day.isoformat() if day else "",
        "url": url,
        "cited_by": 0,
        "origin": "fonte",
        "watch_source": src.get("watch") or src["name"],
        "region": src.get("region", ""),
    }


def parse_feed(xml_text):
    """Return [(title, link, summary, date|None)] for RSS 2.0 or Atom."""
    root = ET.fromstring(xml_text.encode("utf-8") if isinstance(xml_text, str) else xml_text)
    out = []
    for it in root.iter():
        tag = it.tag.rsplit("}", 1)[-1]
        if tag not in ("item", "entry"):
            continue
        fields = {}
        link = ""
        for ch in it:
            name = ch.tag.rsplit("}", 1)[-1]
            if name == "link":
                link = link or ch.get("href") or (ch.text or "").strip()
            elif name not in fields:
                fields[name] = ch.text or ""
        summary = fields.get("description") or fields.get("summary") or fields.get("content") or fields.get("encoded") or ""
        if not summary.strip():  # YouTube keeps it in <media:group><media:description>
            summary = next((d.text or "" for d in it.iter() if d.tag.rsplit("}", 1)[-1] == "description"), "")
        when = _parse_date(fields.get("pubDate") or fields.get("published") or fields.get("updated") or fields.get("date"))
        out.append((fields.get("title", ""), link, summary, when))
    return out


def page_meta(url, fetch=_fetch):
    """Title, description and publication date from an article page's meta tags."""
    body = fetch(url)[:600000]

    def meta(*names):
        for n in names:
            m = re.search(r'<meta[^>]+(?:property|name|itemprop)=["\']' + re.escape(n) + r'["\'][^>]*>', body, re.I)
            if m:
                c = re.search(r'content=["\']([^"\']*)["\']', m.group(0), re.I)
                if c and c.group(1).strip():
                    return c.group(1)
        return ""

    title = meta("og:title", "twitter:title") or (re.search(r"<title[^>]*>(.*?)</title>", body, re.S | re.I) or [None, ""])[1]
    title = re.sub(r"\s+[-|–]\s+[^-|–]{3,45}$", "", _clean(title, 300))  # drop " - Site Name"
    desc = meta("og:description", "description", "twitter:description")
    if not desc.strip():  # fall back to the first real paragraph
        # Skip the navigation: start at the page's <h1> (or <main>), whichever comes first.
        marks = [m.start() for m in (re.search(r"<h1[\s>]", body, re.I), re.search(r"<main[\s>]", body, re.I)) if m]
        content = body[min(marks):] if marks else body
        paras = [_clean(x) for x in re.findall(r"<p[^>]*>(.*?)</p>", content, re.S | re.I)]
        desc = next((x for x in paras if len(x) >= 120), "")
    when = _parse_date(meta("article:published_time", "datePublished", "date", "dc.date", "citation_publication_date"))
    if not when:
        m = re.search(r'"datePublished"\s*:\s*"([^"]+)"', body) or re.search(r'<time[^>]+datetime="([^"]+)"', body)
        when = _parse_date(m.group(1)) if m else None
    return title, _clean(desc), when


def list_urls(src, fetch=_fetch):
    body = fetch(src["url"])
    pat = re.compile(src["pattern"])
    if src["kind"] == "sitemap":
        urls = re.findall(r"<loc>\s*([^<\s]+)\s*</loc>", body)
    else:
        urls = [urllib.parse.urljoin(src["url"], html.unescape(h)) for h in re.findall(r'href=["\']([^"\'#]+)["\']', body)]
    out, seen = [], set()
    for u in urls:
        if pat.search(urllib.parse.urlparse(u).path) and _norm_url(u) not in seen:
            seen.add(_norm_url(u))
            out.append(u)
    return out


def collect_web(sources, start, state, log, fetch=_fetch):
    """Candidates from web sources; updates `state` ({source name: [normalized urls]}) in place."""
    start_d = date.fromisoformat(start)
    out = []
    for src in sources:
        try:
            if src["kind"] == "rss":
                pat = re.compile(src["pattern"]) if src.get("pattern") else None
                # social posts (Bluesky, Mastodon) have no title: use the start of the text instead
                items = [(t or _headline(summary), link, summary, when) for t, link, summary, when in parse_feed(fetch(src["url"]))]
                items = [x for x in items if x[3] and x[3] >= start_d and x[1]
                         and (not pat or pat.search(x[0]) or (src.get("social") and pat.search(_clean(x[2]))))]
                cap = src.get("max", MAX_NEW_PER_SOURCE)
                new = [_item(src, link, title, summary, when) for title, link, summary, when in items[:cap]]
            else:
                urls = list_urls(src, fetch)
                known = state.get(src["name"])
                first_run = known is None
                known = set(known or [])
                fresh = [u for u in urls if _norm_url(u) not in known]
                new = []
                for u in fresh[:MAX_NEW_PER_SOURCE]:
                    try:
                        title, desc, when = page_meta(u, fetch)
                    except RuntimeError as e:
                        log(f"fonte {src['name']}: falha ao ler {u}: {str(e)[:120]}")
                        continue
                    if when and when < start_d:
                        continue
                    if first_run and not when:
                        continue  # baseline: undated links already on the page are not news
                    if title:
                        new.append(_item(src, u, title, desc, when))
                state[src["name"]] = sorted(known | {_norm_url(u) for u in urls})
            out += new
            log(f"fonte {src['name']}: {len(new)} itens")
        except (RuntimeError, ET.ParseError, re.error) as e:
            log(f"fonte {src['name']} falhou: {str(e)[:160]}")
    return out

