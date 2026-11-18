"""Full text of the papers that matter most, and the code repositories they point to (stdlib only).

Which papers: every Evolução milestone and every annual-review highlight, of all topics. Each paper is stored
once in data/papers/<key>.json, whatever the number of topics that cite it (the index records the topics and
roles); `key` is the arXiv id or the DOI (OpenAlex id as a last resort).

Where the text comes from, first that works: arXiv HTML (arxiv.org/html, then ar5iv) → Europe PMC XML (PMC
papers) → open-access PDFs listed by OpenAlex (repositories first; parsed by pdftext.py) → the landing page
HTML. Only legal open copies: publisher paywalls are never bypassed; a paper without an open copy keeps its
abstract only. The text is stored privately (repo and password-protected site) for the agent to read.

Repositories: links to GitHub, GitLab, Bitbucket, Hugging Face, Zenodo, OSF, Code Ocean, Figshare and Kaggle
found in the text (plus the Hugging Face papers API for arXiv), with whether the paper presents it as its own
code, are catalogued in data/papers/repos.json with metadata and the README excerpt, so an agent with a shell
(e.g. Claude Code over MCP) can clone them and the Pergunte agent can read the README.
"""

import html
import json
import os
import re
import subprocess
import time
import urllib.request
from html.parser import HTMLParser

from . import DATA
from .http import get_json
from .pdftext import extract as pdf_extract

PAPERS = DATA / "papers"
UA = "Mozilla/5.0 (compatible; research-watch/0.1; open-access full text for private research use)"
MAX_CHARS = 80_000          # stored text per paper (sections in priority order)
MAX_SECTION = 20_000
DROP_SECTIONS = re.compile(r"^(references|bibliography|acknowledg|appendix|supplementa|author contributions|funding|"
                           r"conflicts? of interest|declaration|data availability statement)", re.I)
HEADING = re.compile(r"^\s*(?:(?:\d+|[IVX]+)(?:\.\d+)*\.?\s+)?(abstract|introduction|related work|background|literature review|"
                     r"theory|hypothes[ie]s|data|data and methods|methods?|methodology|research design|model|approach|"
                     r"experiments?|experimental setup|empirical (?:strategy|analysis|results)|results?|findings|analysis|"
                     r"discussion|conclusions?|concluding remarks|limitations|future work|references|bibliography|"
                     r"acknowledg(?:e)?ments?|appendix(?: [a-z])?)\s*:?\s*$", re.I)
REPO_HOSTS = r"github\.com|gitlab\.com|bitbucket\.org|huggingface\.co|zenodo\.org|osf\.io|codeocean\.com|figshare\.com|kaggle\.com"
REPO_RE = re.compile(rf"(?:https?://)?(?:www\.)?(?:{REPO_HOSTS})/[^\s)\]}}>,;\"'<]+", re.I)
OWN_CODE = re.compile(r"(our|the) (code|implementation|source code|replication|data and code)|code (is|are|will be) (publicly |freely )?"
                      r"available|available (at|on|from)|we (release|open[- ]source|make)|replication (package|code|files)", re.I)
# links every arXiv HTML page carries (its converter and feedback form), not the paper's code
TOOLING_REPOS = {"https://github.com/arxiv/html_feedback", "https://github.com/brucemiller/latexml", "https://github.com/arxiv/arxiv-browse"}
NOT_REPOS = {"features", "about", "pricing", "login", "join", "topics", "marketplace", "sponsors", "orgs", "settings", "site", "contact"}


def _get(url, timeout=40, limit=30_000_000):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html,application/pdf,application/xml;q=0.9,*/*;q=0.8"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read(limit), (r.headers.get("Content-Type") or "").lower(), r.geturl()


# ---------- HTML / XML → sections ----------

class _Text(HTMLParser):
    SKIP = {"script", "style", "nav", "header", "footer", "noscript", "svg", "math", "button", "form", "figure", "table"}
    BLOCK = {"p", "div", "li", "section", "article", "br", "tr", "blockquote", "dd", "dt", "caption", "abstract", "sec", "title"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out, self.skip, self.links = [], 0, []

    def handle_starttag(self, tag, attrs):
        if tag == "math" and not self.skip:  # keep formulas readable: LaTeXML puts the TeX source in alttext
            alt = dict(attrs).get("alttext")
            if alt:
                self.out.append(f" {alt} ")
        if tag in self.SKIP:
            self.skip += 1
        if tag in ("h1", "h2", "h3", "h4") and not self.skip:
            self.out.append("\n\n§§ ")
        elif tag in self.BLOCK:
            self.out.append("\n")
        if tag == "a":
            href = dict(attrs).get("href") or ""
            if href.startswith("http"):
                self.links.append(href)

    def handle_endtag(self, tag):
        if tag in self.SKIP and self.skip:
            self.skip -= 1
        if tag in ("h1", "h2", "h3", "h4"):
            self.out.append("\n")

    def handle_data(self, data):
        if not self.skip:
            self.out.append(data)


def html_text(markup):
    """(text with '§§ ' before headings, links) from HTML/JATS XML."""
    p = _Text()
    p.feed(markup.decode("utf-8", errors="ignore") if isinstance(markup, bytes) else markup)
    text = re.sub(r"[ \t\r\f\v]+", " ", "".join(p.out))
    text = re.sub(r" *\n *", "\n", text)
    return re.sub(r"\n{3,}", "\n\n", text).strip(), p.links


def sections_from_html(text):
    out, name, buf = [], "Início", []
    for line in text.split("\n"):
        if line.startswith("§§ "):
            if buf:
                out.append((name, "\n".join(buf).strip()))
            name, buf = re.sub(r"^\s*[\d.IVX]+\s+", "", line[3:].strip())[:80] or "Seção", []
        else:
            buf.append(line)
    if buf:
        out.append((name, "\n".join(buf).strip()))
    return [(n, t) for n, t in out if t]


def sections_from_plain(text):
    out, name, buf = [], "Início", []
    for line in text.replace("\f", "\n").split("\n"):
        m = HEADING.match(line) if len(line) < 70 else None
        if m:
            if buf:
                out.append((name, "\n".join(buf).strip()))
            name, buf = m.group(1).strip().title(), []
        else:
            buf.append(line)
    if buf:
        out.append((name, "\n".join(buf).strip()))
    return [(n, t) for n, t in out if t]


def keep_sections(sections):
    """Drop references/appendices, cap each section and the total (main body first)."""
    kept, total = [], 0
    parts = []
    for name, text in sections:  # long sections (e.g. a PDF with no recognisable headings) become parts, not cut
        text = re.sub(r"[ \t]+", " ", text).strip()
        chunks = [text[i:i + MAX_SECTION] for i in range(0, len(text), MAX_SECTION)] or [""]
        parts += [(name if len(chunks) == 1 else f"{name} ({k + 1}/{len(chunks)})", c) for k, c in enumerate(chunks)]
    for name, text in parts:
        if DROP_SECTIONS.match(name):
            continue
        if total + len(text) > MAX_CHARS:
            text = text[:max(0, MAX_CHARS - total)]
        if len(text) > 80:
            kept.append({"name": name, "text": text})
            total += len(text)
        if total >= MAX_CHARS:
            break
    return kept


# ---------- repositories ----------

def normalize_repo(url):
    u = re.sub(r"^(?:https?://)?(?:www\.)?", "https://", url.strip().rstrip(".:,;)]}'\"").replace("​", ""), flags=re.I)
    m = re.match(r"https://(github\.com|gitlab\.com|bitbucket\.org)/([\w.-]+)/([\w.-]+)", u, re.I)
    if m:
        host, owner, name = m.group(1).lower(), m.group(2), re.sub(r"\.git$", "", m.group(3))
        if owner.lower() in NOT_REPOS or not name or name in (".", ".."):
            return None
        return f"https://{host}/{owner}/{name}".lower()  # these hosts ignore case: one repo, one entry
    m = re.match(r"https://huggingface\.co/((?:datasets/|spaces/)?[\w.-]+/[\w.-]+)", u, re.I)
    if m:
        return f"https://huggingface.co/{m.group(1)}"
    m = re.match(r"https://(zenodo\.org/(?:records?|doi)/[\w./-]+|osf\.io/\w+|codeocean\.com/capsule/[\w/-]+|"
                 r"figshare\.com/[\w./-]+|kaggle\.com/(?:datasets|code)/[\w.-]+/[\w.-]+)", u, re.I)
    return f"https://{m.group(1).rstrip('/')}" if m else None


def find_repos(text, links=()):
    """[(repo_url, own, context)] from the paper text and its hyperlinks; first mention wins."""
    joined = re.sub(rf"((?:{REPO_HOSTS})/[\w./-]*[/-])\s*\n\s*(?=[\w.-])", r"\1", text, flags=re.I)  # URLs broken across lines
    found = {}
    for m in REPO_RE.finditer(joined):
        url = normalize_repo(m.group(0))
        if url and url not in found:
            # own code? judge only the sentence that holds the link, not the one before it
            start = max(joined.rfind(". ", max(0, m.start() - 200), m.start()) + 2, m.start() - 160, 0)
            end = joined.find(". ", m.end())
            sentence = joined[start:m.end() + 60 if end < 0 else min(end + 1, m.end() + 120)].replace("\n", " ")
            found[url] = (bool(OWN_CODE.search(sentence.replace(m.group(0), " "))), sentence.strip()[:240])
    for href in links:
        url = normalize_repo(href)
        if url and url not in found:
            found[url] = (False, "link no HTML do paper")
    return [(u, own, ctx) for u, (own, ctx) in found.items() if u not in TOOLING_REPOS]


# ---------- resolve + fetch ----------

def _arxiv_id(work):
    for loc in work.get("locations") or []:
        for u in (loc.get("landing_page_url") or "", loc.get("pdf_url") or ""):
            m = re.search(r"arxiv\.org/(?:abs|pdf|html)/([\w.-]+?\d)(?:v\d+)?(?:\.pdf)?$", u)
            if m:
                return m.group(1)
    m = re.search(r"10\.48550/arxiv\.([\w.-]+)", (work.get("doi") or "").lower())
    return m.group(1) if m else None


def paper_key(work):
    arx = _arxiv_id(work)
    if arx:
        return f"arxiv:{arx}"
    doi = (work.get("doi") or "").replace("https://doi.org/", "").lower()
    return f"doi:{doi}" if doi else f"oa:{work['id'].rsplit('/', 1)[-1]}"


def safe_name(key):
    return re.sub(r"[^a-z0-9._-]+", "_", key.lower())[:150]


def s2_open_pdfs(works):
    """{openalex id: pdf url} from Semantic Scholar's open-access index (author pages, institutional repositories,
    preprint servers OpenAlex may miss). One batch call; skipped quietly when the free pool is busy."""
    ids, back = [], {}
    for w in works:
        arx, doi = _arxiv_id(w), (w.get("doi") or "").replace("https://doi.org/", "")
        ref = f"ARXIV:{arx}" if arx else (f"DOI:{doi}" if doi else None)
        if ref:
            ids.append(ref)
            back[len(ids) - 1] = w["id"]
    out = {}
    for start in range(0, len(ids), 500):
        body = json.dumps({"ids": ids[start:start + 500]}).encode()
        for attempt in range(3):
            try:
                req = urllib.request.Request("https://api.semanticscholar.org/graph/v1/paper/batch?fields=openAccessPdf",
                                             data=body, headers={"Content-Type": "application/json", "User-Agent": UA})
                with urllib.request.urlopen(req, timeout=60) as r:
                    res = json.loads(r.read())
                for i, item in enumerate(res):
                    url = ((item or {}).get("openAccessPdf") or {}).get("url")
                    if url:
                        out[back[start + i]] = url
                break
            except Exception:
                time.sleep(5 * (attempt + 1))
    return out


def fetch_text(work, log, extra_pdfs=()):
    """(sections, links, source dict) for the first open copy that yields text, or (None, [], reason)."""
    arx = _arxiv_id(work)
    tries = []
    if arx:
        tries += [("html", f"https://arxiv.org/html/{arx}"), ("html", f"https://ar5iv.labs.arxiv.org/html/{arx}")]
    pmcid = ((work.get("ids") or {}).get("pmcid") or "").rsplit("/", 1)[-1]
    if pmcid:
        tries.append(("xml", f"https://www.ebi.ac.uk/europepmc/webservices/rest/{pmcid}/fullTextXML"))
    locs = [l for l in (work.get("locations") or []) if l.get("is_oa")]
    locs.sort(key=lambda l: ((l.get("source") or {}).get("type") != "repository", l.get("version") != "publishedVersion"))
    tries += [("pdf", l["pdf_url"]) for l in locs if l.get("pdf_url")]
    tries += [("pdf", u) for u in extra_pdfs]
    if arx:
        tries.append(("pdf", f"https://arxiv.org/pdf/{arx}"))
    tries += [("landing", l["landing_page_url"]) for l in locs if l.get("landing_page_url")]
    seen, last = set(), "sem cópia aberta" if not tries else "nenhuma cópia legível"
    for kind, url in tries:
        if url in seen:
            continue
        seen.add(url)
        try:
            data, ctype, final = _get(url)
        except Exception as e:
            last = f"{kind}: {str(e)[:60]}"
            continue
        if data.startswith(b"%PDF"):
            text = pdf_extract(data)
            secs = sections_from_plain(text) if len(text) > 3000 else None
            links = []
        elif kind == "landing" and (m := re.search(rb'<meta[^>]+name=["\']citation_pdf_url["\'][^>]+content=["\']([^"\']+)', data)):
            try:
                pdf, _, _ = _get(html.unescape(m.group(1).decode()))
                text = pdf_extract(pdf) if pdf.startswith(b"%PDF") else ""
            except Exception:
                text = ""
            secs, links = (sections_from_plain(text) if len(text) > 3000 else None), []
            if not secs:
                t, links = html_text(data)
                secs = sections_from_html(t) if len(t) > 15000 else None
        else:
            t, links = html_text(data)
            secs = sections_from_html(t) if len(t) > (3000 if kind in ("html", "xml") else 15000) else None
        if secs:
            kept = keep_sections(secs)
            if sum(len(s["text"]) for s in kept) > 3000:
                lic = next((l.get("license") for l in locs if l.get("pdf_url") == url or l.get("landing_page_url") == url), None)
                return kept, links, {"kind": kind if kind != "landing" else "html", "url": final, "license": lic,
                                     "full": "\n\n".join(t for _, t in secs)}
        last = f"{kind}: sem texto legível"
        time.sleep(0.3)
    return None, [], last


# ---------- repository enrichment ----------

def _github_token():
    tok = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
    if tok:
        return tok
    try:
        return subprocess.run(["gh", "auth", "token"], capture_output=True, text=True, timeout=10).stdout.strip() or None
    except Exception:
        return None


def enrich_repo(url, token):
    info = {}
    m = re.match(r"https://github\.com/([\w.-]+)/([\w.-]+)$", url)
    if m:
        try:
            headers = {"Accept": "application/vnd.github+json", "User-Agent": UA}
            if token:
                headers["Authorization"] = f"Bearer {token}"
            req = urllib.request.Request(f"https://api.github.com/repos/{m.group(1)}/{m.group(2)}", headers=headers)
            with urllib.request.urlopen(req, timeout=20) as r:
                g = json.loads(r.read())
            info = {"description": g.get("description") or "", "stars": g.get("stargazers_count"), "language": g.get("language"),
                    "pushed_at": (g.get("pushed_at") or "")[:10], "archived": g.get("archived"),
                    "license": (g.get("license") or {}).get("spdx_id"), "default_branch": g.get("default_branch"),
                    "clone": g.get("clone_url")}
        except Exception as e:
            info = {"error": str(e)[:80]}
        branch = info.get("default_branch") or "HEAD"
        for name in ("README.md", "readme.md", "README.rst", "README"):
            try:
                body, _, _ = _get(f"https://raw.githubusercontent.com/{m.group(1)}/{m.group(2)}/{branch}/{name}", timeout=20, limit=200_000)
                info["readme"] = body.decode("utf-8", errors="ignore")[:6000]
                break
            except Exception:
                continue
    elif "huggingface.co/" in url:
        info["clone"] = url if "/spaces/" not in url else None
    return info


# ---------- selection + run ----------

def selection(topics):
    """{url: {title, topics:set, roles:set}} for milestones and annual highlights of the given topics."""
    from .annual import latest_by_year
    from .evolution import latest
    out = {}
    for t in topics:
        ev = latest(t) or {}
        for era in ev.get("eras") or []:
            for m in era.get("milestones") or []:
                e = out.setdefault(m["url"], {"title": m["title"], "topics": set(), "roles": set()})
                e["topics"].add(t.slug)
                e["roles"].add(f"marco ({era.get('label', '')})")
        for year, a in latest_by_year(t).items():
            for h in a.get("highlights") or []:
                e = out.setdefault(h["url"], {"title": h.get("original_title") or h["title"], "topics": set(), "roles": set()})
                e["topics"].add(t.slug)
                e["roles"].add(f"destaque {year}")
    return out


def _works_for(urls):
    dois = [u.replace("https://doi.org/", "") for u in urls if u.startswith("https://doi.org/")]
    wids = [u.rsplit("/", 1)[-1] for u in urls if re.search(r"openalex\.org/W\d+$", u)]
    sel = "id,doi,title,publication_year,open_access,best_oa_location,locations,ids"
    by_url = {}
    for field, ids in (("doi", dois), ("openalex", wids)):
        for i in range(0, len(ids), 50):
            for w in get_json("https://api.openalex.org/works", {"filter": f"{field}:" + "|".join(ids[i:i + 50]),
                                                                  "per-page": 50, "select": sel}).get("results", []):
                d = (w.get("doi") or "").lower()
                for u in urls:
                    if (d and u.lower() == d) or u.rsplit("/", 1)[-1] == w["id"].rsplit("/", 1)[-1]:
                        by_url[u] = w
    return by_url


def load_index():
    f = PAPERS / "index.json"
    return json.loads(f.read_text(encoding="utf-8")) if f.exists() else {}


def run(topics, log, refresh=False, limit=None):
    PAPERS.mkdir(parents=True, exist_ok=True)
    index = load_index()
    repos_path = PAPERS / "repos.json"
    repos = json.loads(repos_path.read_text(encoding="utf-8")) if repos_path.exists() else {}
    wanted = selection(topics)
    works = _works_for(list(wanted))
    log(f"texto completo: {len(wanted)} papers selecionados, {len(works)} resolvidos no OpenAlex")
    s2 = s2_open_pdfs(list(works.values()))
    log(f"texto completo: Semantic Scholar conhece PDF aberto de {len(s2)}")
    done = fetched = 0
    token = _github_token()
    for url, meta in wanted.items():
        w = works.get(url)
        if not w:
            continue
        key = paper_key(w)
        entry = index.get(key) or {"title": w.get("title") or meta["title"], "year": w.get("publication_year"),
                                   "topics": [], "roles": [], "urls": [], "has_text": False, "repos": []}
        entry["topics"] = sorted(set(entry["topics"]) | meta["topics"])
        entry["roles"] = sorted(set(entry["roles"]) | meta["roles"])
        entry["urls"] = sorted(set(entry["urls"]) | {url, *(u for u in [w.get("doi")] if u)})
        index[key] = entry
        if entry.get("checked") and not refresh:
            continue
        if limit and done >= limit:
            continue
        done += 1
        secs, links, src = fetch_text(w, log, [s2[w["id"]]] if w["id"] in s2 else [])
        entry["checked"] = time.strftime("%Y-%m-%d")
        if not secs:
            entry.update(has_text=False, reason=src)
            log(f"  sem texto: {entry['title'][:60]} ({src})")
            continue
        fetched += 1
        found = find_repos(src.pop("full"), links)
        if re.match(r"arxiv:", key):
            try:
                hf = get_json(f"https://huggingface.co/api/papers/{key[6:]}")
                if hf.get("githubRepo") and normalize_repo(hf["githubRepo"]):
                    found.append((normalize_repo(hf["githubRepo"]), True, "Hugging Face papers"))
            except Exception:
                pass
        paper = {"key": key, "title": entry["title"], "year": entry["year"], "doi": w.get("doi"), "source": src,
                 "fetched": entry["checked"], "sections": secs,
                 "repos": [{"url": u, "own": own, "context": ctx} for u, own, ctx in found]}
        (PAPERS / f"{safe_name(key)}.json").write_text(json.dumps(paper, ensure_ascii=False, indent=0), encoding="utf-8")
        entry.update(has_text=True, file=f"{safe_name(key)}.json", chars=sum(len(s["text"]) for s in secs),
                     source_kind=src["kind"], license=src.get("license"), sections=[s["name"] for s in secs],
                     repos=[u for u, _, _ in found])
        entry.pop("reason", None)
        for u, own, ctx in found:
            r = repos.setdefault(u, {"url": u, "papers": [], "topics": [], "own": False})
            r["papers"] = sorted(set(r["papers"]) | {key})
            r["topics"] = sorted(set(r["topics"]) | set(entry["topics"]))
            r["own"] = r["own"] or own
            r.setdefault("context", ctx)
            if "checked" not in r:
                r.update(enrich_repo(u, token), checked=entry["checked"])
        log(f"  ok: {entry['title'][:60]} ({src['kind']}, {entry['chars']} chars, {len(found)} repos)")
    # topics/roles of already-known repos follow their papers
    for r in repos.values():
        r["topics"] = sorted({t for k in r["papers"] for t in index.get(k, {}).get("topics", [])})
    (PAPERS / "index.json").write_text(json.dumps(index, ensure_ascii=False, indent=1, sort_keys=True), encoding="utf-8")
    repos_path.write_text(json.dumps(repos, ensure_ascii=False, indent=1, sort_keys=True), encoding="utf-8")
    with_text = sum(1 for e in index.values() if e.get("has_text"))
    log(f"texto completo: +{fetched} nesta execução; {with_text}/{len(index)} papers com texto; {len(repos)} repositórios")
    return {"selected": len(wanted), "fetched": fetched, "with_text": with_text, "papers": len(index), "repos": len(repos)}
