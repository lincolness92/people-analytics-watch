import sys
import json
import unittest
import urllib.parse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from pawatch.collect import annotate_and_dedupe, norm_title, rebuild_abstract  # noqa: E402
from pawatch.llm import parse_json  # noqa: E402
from pawatch.render import digest_markdown  # noqa: E402
from pawatch.score import prefilter, triage_rules, write_rules  # noqa: E402
from pawatch.topic import Topic, all_topics  # noqa: E402

PA = Topic("people-analytics")


def cand(key, title, **kw):
    base = {"key": key, "title": title, "abstract": "", "authors": [], "author_ids": [],
            "institutions": [], "venue": "", "source_id": "", "type": "article", "language": "en",
            "date": "2026-11-10", "url": "https://x", "cited_by": 0, "origin": "busca"}
    base.update(kw)
    return base


WATCH = {
    "researchers": [{"name": "Prasanna Tambe", "openalex_id": "A1"}],
    "journals": [{"name": "Personnel Psychology", "openalex_source_id": "S9"}],
}


class CollectTests(unittest.TestCase):
    def test_rebuild_abstract_orders_words(self):
        self.assertEqual(rebuild_abstract({"world": [1], "hello": [0], "again": [2]}), "hello world again")
        self.assertEqual(rebuild_abstract(None), "")

    def test_dedupe_by_title_and_seen(self):
        items = [
            cand("doi:1", "AI in Hiring: A Field Experiment"),
            cand("arxiv:2", "AI in hiring - a field experiment", abstract="longer abstract"),
            cand("doi:3", "Already seen paper title"),
        ]
        out = annotate_and_dedupe(items, WATCH, {"doi:3"})
        self.assertEqual([c["key"] for c in out], ["doi:1"])
        self.assertEqual(out[0]["abstract"], "longer abstract")

    def test_seen_title_marker(self):
        items = [cand("doi:9", "Remote Work and Promotions")]
        out = annotate_and_dedupe(items, WATCH, {f"t:{norm_title('Remote work and promotions')}"})
        self.assertEqual(out, [])

    def test_watchlist_tagging(self):
        items = [cand("doi:5", "Algorithms and HR", author_ids=["A1"], source_id="S9")]
        out = annotate_and_dedupe(items, WATCH, set())
        self.assertEqual(out[0]["watch_authors"], ["Prasanna Tambe"])
        self.assertTrue(out[0]["watch_journal"])

    def test_prefilter_prefers_watchlist(self):
        a = cand("a", "Unrelated soil chemistry study", abstract="soil")
        b = cand("b", "Employee turnover prediction", abstract="employee turnover workforce",
                 watch_authors=["X"], watch_journal=False)
        a.update(watch_authors=[], watch_journal=False)
        self.assertEqual(prefilter([a, b], 1, PA.meta["prefilter_keywords"])[0]["key"], "b")


class LLMParseTests(unittest.TestCase):
    def test_parse_json_variants(self):
        self.assertEqual(parse_json('{"a": 1}'), {"a": 1})
        self.assertEqual(parse_json('<think>hmm {"x":0}</think>\n```json\n{"a": 2}\n```'), {"a": 2})
        self.assertEqual(parse_json('Claro! {"a": 3} pronto.'), {"a": 3})
        with self.assertRaises(ValueError):
            parse_json("sem json")


class RenderTests(unittest.TestCase):
    def test_markdown_groups_by_theme(self):
        d = {"date": "2026-11-16", "model": "m", "headline": "dia forte",
             "stats": {"candidates": 10, "triaged": 10, "selected": 1},
             "items": [{"title": "T", "url": "https://u", "venue": "AMJ", "score": 9, "theme": "hiring",
                        "summary": "S", "watch_authors": ["Prasanna Tambe"], "cited_by": 0, "origin": "busca"}],
             "quick": [{"title": "Q", "url": "https://q", "note": "n"}], "trend": "tendência"}
        out = digest_markdown(d, PA)
        self.assertIn("🎯 Recrutamento & seleção", out)
        self.assertIn("**[T](https://u)** — AMJ · **9/10** · ⭐ Prasanna Tambe", out)
        self.assertIn("**Menções rápidas**: [Q](https://q) (n)", out)
        self.assertIn("**🔥 Tendência**: tendência", out)
        self.assertIn("digest de 16/11/2026**", out)

    def test_markdown_shows_period(self):
        d = {"date": "2026-11-16", "period": {"from": "2026-11-09", "to": "2026-11-16"},
             "stats": {"candidates": 3}, "items": [], "quick": []}
        self.assertIn("digest de 09/11 a 16/11/2026**", digest_markdown(d, PA))

    def test_markdown_empty_day(self):
        d = {"date": "2026-11-16", "stats": {"candidates": 3}, "items": [], "quick": []}
        self.assertIn("nada acima da barra", digest_markdown(d, PA))



class BundleTests(unittest.TestCase):
    def test_bundle_is_self_contained(self):
        import re
        from pawatch.bundle import bundle
        from pawatch.render import render_all
        render_all()
        for theme in (None, "bb"):
            html = bundle("people-analytics", theme)
            self.assertNotIn('href="style.css"', html)
            self.assertNotIn('src="app.js"', html)
            self.assertNotIn('fetch("data.json"', html)
            self.assertIsNone(re.search(r'url\("fonts/', html))
            data = re.search(r'<script id="pa-data" type="application/json">(.*?)</script>', html, re.S).group(1)
            self.assertIn("digests", json.loads(data))
            self.assertEqual(json.loads(data)["topics"], [])
        self.assertIn("data:font/ttf;base64,", bundle("people-analytics", "bb"))
        self.assertIn("theme-toggle", bundle("people-analytics", "bb"))
        self.assertNotIn("theme-toggle", bundle("people-analytics", None))



class WebSourceTests(unittest.TestCase):
    RSS = """<?xml version="1.0"?><rss version="2.0"><channel><title>Blog</title>
      <item><title>New study on hybrid work</title><link>https://ex.org/a</link>
        <description>&lt;p&gt;We ran a field experiment&lt;/p&gt;</description><pubDate>Thu, 12 Nov 2026 14:06:56 +0000</pubDate></item>
      <item><title>Old post about pay</title><link>https://ex.org/b</link><pubDate>Mon, 02 Nov 2026 10:00:00 +0000</pubDate></item>
      <item><title>Webinar sobre DPO</title><link>https://ex.org/c</link><pubDate>Fri, 13 Nov 2026 10:00:00 +0000</pubDate></item>
    </channel></rss>"""
    ATOM = """<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Atom item</title>
      <link href="https://ex.org/atom1"/><updated>2026-11-14T18:28:19-05:00</updated><summary>s</summary></entry></feed>"""
    LISTING = '<a href="/articles/one">x</a> <a href="/articles/two/">y</a> <a href="/about">z</a>'
    ARTICLE = ('<html><head><meta property="og:title" content="{t}"><meta name="description" content="Resumo {t}">'
               '{d}</head></html>')

    def test_parse_feed_rss_and_atom(self):
        from pawatch.web import parse_feed
        rss = parse_feed(self.RSS)
        self.assertEqual(rss[0][0], "New study on hybrid work")
        self.assertEqual(rss[0][1], "https://ex.org/a")
        self.assertEqual(str(rss[0][3]), "2026-11-12")
        atom = parse_feed(self.ATOM)
        self.assertEqual((atom[0][1], str(atom[0][3])), ("https://ex.org/atom1", "2026-11-14"))

    def test_parse_youtube_feed_description(self):
        from pawatch.web import parse_feed
        yt = """<feed xmlns="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
          <entry><title>Painel: IA nos bancos</title><link rel="alternate" href="https://www.youtube.com/watch?v=abc"/>
          <published>2026-11-15T12:00:00+00:00</published>
          <media:group><media:title>Painel</media:title><media:description>Como a IA mudou o atendimento</media:description></media:group>
          </entry></feed>"""
        (title, link, summary, when), = parse_feed(yt)
        self.assertEqual((title, link, summary, str(when)),
                         ("Painel: IA nos bancos", "https://www.youtube.com/watch?v=abc", "Como a IA mudou o atendimento", "2026-11-15"))

    def test_region_rules_only_when_topic_has_regions(self):
        import copy
        self.assertNotIn('"g"', triage_rules(PA))
        t = copy.copy(PA)
        t.meta = dict(PA.meta, regions={"brasil": "🇧🇷 Brasil", "mundo": "🌍 Mundo"})
        self.assertIn('"g": "<região>"', triage_rules(t))
        self.assertIn("No Brasil", write_rules(t))

    def test_write_digest_accepts_scores_with_region(self):
        from pawatch.score import write_digest

        class FakeLLM:
            def json(self, system, user, **kw):
                return {"headline": "h", "trend": "t", "items": [{"i": 0, "summary": "s"}], "quick": []}

        c = cand("doi:1", "AI agents in retail banking", abstract="x")
        c.update(watch_authors=[], watch_journal=False)
        out = write_digest(FakeLLM(), [c], {0: (8, "analytics", "brasil")},
                           {"min_score": 7, "max_selected": 5, "max_quick_mentions": 2}, PA)
        self.assertEqual(out["items"][0]["region"], "brasil")

    def test_rss_window_and_title_pattern(self):
        from pawatch.web import collect_web
        src = [{"name": "Blog", "watch": "Fulano", "kind": "rss", "url": "https://ex.org/feed", "pattern": "(?i)work|pay"}]
        out = collect_web(src, "2026-11-09", {}, lambda m: None, fetch=lambda u: self.RSS)
        self.assertEqual([c["title"] for c in out], ["New study on hybrid work"])
        self.assertEqual(out[0]["abstract"], "We ran a field experiment")
        self.assertEqual(out[0]["watch_source"], "Fulano")
        self.assertEqual(out[0]["key"], "web:https://ex.org/a")

    def test_social_posts_get_titles_keyword_filter_and_cap(self):
        from pawatch.web import collect_web
        bsky = """<rss version="2.0"><channel>
          <item><link>https://bsky.app/p/1</link><description>New paper: remote work cuts quits by a third. Field data from 1,600 workers.</description><pubDate>16 Nov 2026 01:05 +0000</pubDate></item>
          <item><link>https://bsky.app/p/2</link><description>Lovely sunset at the beach today</description><pubDate>16 Nov 2026 02:05 +0000</pubDate></item>
          <item><link>https://bsky.app/p/3</link><description>Hiring is hard. More on that soon</description><pubDate>15 Nov 2026 02:05 +0000</pubDate></item>
        </channel></rss>"""
        src = [{"name": "X (Bluesky)", "watch": "X", "kind": "rss", "url": "u", "social": True, "max": 1,
                "pattern": "(?i)remote work|hiring"}]
        out = collect_web(src, "2026-11-09", {}, lambda m: None, fetch=lambda u: bsky)
        self.assertEqual([c["title"] for c in out], ["New paper: remote work cuts quits by a third."])  # cap=1, sunset filtered
        self.assertEqual(out[0]["watch_source"], "X")

    def test_page_baseline_then_only_new_links(self):
        from pawatch.web import collect_web
        pages = {
            "https://ex.org/articles": self.LISTING,
            "https://ex.org/articles/one": self.ARTICLE.format(t="One", d=""),
            "https://ex.org/articles/two/": self.ARTICLE.format(
                t="Two", d='<meta property="article:published_time" content="2026-11-12T10:00:00Z">'),
            "https://ex.org/articles/three": self.ARTICLE.format(t="Three", d=""),
        }
        src = [{"name": "Ins", "kind": "page", "url": "https://ex.org/articles", "pattern": "/articles/[^/]+/?$"}]
        state = {}
        first = collect_web(src, "2026-11-09", state, lambda m: None, fetch=pages.__getitem__)
        self.assertEqual([c["title"] for c in first], ["Two"])  # dated in window; undated "One" is baseline
        self.assertEqual(len(state["Ins"]), 2)
        pages["https://ex.org/articles"] += ' <a href="https://ex.org/articles/three">w</a>'
        second = collect_web(src, "2026-11-09", state, lambda m: None, fetch=pages.__getitem__)
        self.assertEqual([c["title"] for c in second], ["Three"])
        self.assertEqual(second[0]["abstract"], "Resumo Three")



class TopicTests(unittest.TestCase):
    REQUIRED = ["name", "brand", "audience", "rubric_focus", "off_topic", "summary_lesson",
                "headline_example", "trend_focus", "prefilter_keywords", "themes"]

    def test_every_topic_pack_is_complete(self):
        import re
        topics = all_topics()
        self.assertTrue(topics)
        for t in topics:
            for k in self.REQUIRED:
                self.assertIn(k, t.meta, f"{t.slug}: falta {k}")
            re.compile(t.meta["prefilter_keywords"])
            q = t.queries()
            for k in ("lookback_days", "openalex", "arxiv", "selection"):
                self.assertIn(k, q, f"{t.slug}: queries.json sem {k}")
            for s in t.sources():
                self.assertIn(s["kind"], ("rss", "page", "sitemap"))
                if s.get("pattern"):
                    re.compile(s["pattern"])
            rules = triage_rules(t) + write_rules(t)
            for key in t.themes:
                self.assertIn(key, rules)

    def test_people_analytics_prompts_unchanged(self):
        self.assertIn("implicação direta para RH/people analytics", triage_rules(PA))
        self.assertIn("(o que está mudando na prática de gestão de pessoas)", write_rules(PA))



class AnnualTests(unittest.TestCase):
    def test_label_and_months(self):
        from datetime import date
        from pawatch.annual import _label, _months_since
        self.assertEqual(_label('("AI agent" OR "AI agents") AND bank'), "AI agent / AI agents")
        self.assertEqual(_months_since("2026-01-10", date(2026, 11, 17)), 10)
        self.assertEqual(_months_since("2026-11-02", date(2026, 11, 17)), 1)

    def test_geography_counts_each_work_once_per_sector(self):
        from pawatch.annual import Annual
        w = {"id": "W1", "authorships": [
            {"institutions": [{"display_name": "Stanford", "type": "education", "country_code": "US"}]},
            {"institutions": [{"display_name": "Stanford", "type": "education", "country_code": "US"},
                              {"display_name": "Visa", "type": "company", "country_code": "US"}]}]}
        g = Annual(PA, 2026, lambda m: None).geography([(w, "busca"), (w, "watchlist")])
        self.assertEqual(g["works"], 1)
        self.assertEqual({s["name"]: s["works"] for s in g["sectors"]}, {"Academia": 1, "Empresas": 1})
        self.assertEqual(g["companies"], [{"name": "Visa", "works": 1, "country": "US"}])

    def test_clean_prose(self):
        from pawatch.annual import clean_prose
        self.assertEqual(clean_prose("Quatro destaques em pay_careers (i=19, i=131) e ai_work (i=2).", PA.themes),
                         "Quatro destaques em remuneração, carreira & equidade e IA & futuro do trabalho.")
        self.assertEqual(clean_prose("machine learning and hiring", PA.themes), "machine learning and hiring")

    def test_annual_markdown(self):
        from pawatch.annual import annual_markdown
        d = {"year": 2026, "partial": True, "generated": "2026-11-17", "model": "m", "overview": "Ano X.",
             "trends": [{"title": "T", "text": "cresceu +636%"}], "innovation": "Academia.",
             "highlights": [{"title": "P", "url": "https://p", "venue": "V", "score": 8, "cited_by": 3,
                             "theme": "hiring", "why": "porque"}],
             "growth": [{"label": "AI agent", "prev": 130, "cur_full_year": 957, "change": 6.36}],
             "stats": {"works": 10}}
        out = annual_markdown(d, PA)
        self.assertIn("Retrospectiva 2026 (parcial)", out)
        self.assertIn("| AI agent | 130 | 957* | +636% |", out)
        self.assertIn("**[P](https://p)**", out)



class LibraryTests(unittest.TestCase):
    def test_add_keeps_score_5_plus_once_and_load_sorts(self):
        import tempfile
        from pawatch import library
        with tempfile.TemporaryDirectory() as tmp:
            class T:  # minimal topic stand-in
                data = Path(tmp)
            cands = [cand(f"doi:{i}", f"Paper number {i}", abstract="x" * 2000) for i in range(3)]
            n = library.add(T, cands, {0: (4, "hiring", ""), 1: (7, "hiring", "brasil"), 2: (5, "analytics")}, "digest", "2026-11-18")
            self.assertEqual(n, 2)
            self.assertEqual(library.add(T, cands, {1: (8, "hiring", "")}, "digest", "2026-11-18"), 0)
            out = library.load(T)
            self.assertEqual([e["key"] for e in out], ["doi:1", "doi:2"])
            self.assertEqual(out[0]["region"], "brasil")
            self.assertEqual(len(out[0]["abstract"]), library.EXPORT_ABSTRACT)



def _check(value, schema, path="$"):
    """Minimal JSON Schema check (type, required, properties, items, additionalProperties, enum): enough for our contracts."""
    errors = []
    types = schema.get("type")
    if types:
        types = types if isinstance(types, list) else [types]
        py = {"object": dict, "array": list, "string": str, "boolean": bool, "null": type(None)}
        ok = any((t == "integer" and isinstance(value, int) and not isinstance(value, bool))
                 or (t == "number" and isinstance(value, (int, float)) and not isinstance(value, bool))
                 or (t in py and isinstance(value, py[t])) for t in types)
        if not ok:
            return [f"{path}: esperado {types}, veio {type(value).__name__}"]
    if "enum" in schema and value not in schema["enum"]:
        errors.append(f"{path}: {value!r} fora de {schema['enum']}")
    if isinstance(value, dict):
        errors += [f"{path}: falta {k}" for k in schema.get("required", []) if k not in value]
        props = schema.get("properties", {})
        for k, v in value.items():
            sub = props.get(k) or (schema.get("additionalProperties") if isinstance(schema.get("additionalProperties"), dict) else None)
            if sub:
                errors += _check(v, sub, f"{path}.{k}")
    if isinstance(value, list) and "items" in schema:
        for i, v in enumerate(value):
            errors += _check(v, schema["items"], f"{path}[{i}]")
    return errors


class SchemaTests(unittest.TestCase):
    """What the pipeline publishes must match schemas/: the contract readers (site, server/, adapters) rely on."""

    def test_published_files_match_schemas(self):
        from pawatch import DIST, ROOT
        from pawatch.render import render_all
        render_all()
        schemas = {n: json.loads((ROOT / "schemas" / f"{n}.schema.json").read_text(encoding="utf-8")) for n in ("data", "library", "search")}
        topics = [p for p in DIST.iterdir() if (p / "data.json").exists()]
        self.assertTrue(topics)
        for tdir in topics:
            for name, schema in schemas.items():
                errs = _check(json.loads((tdir / f"{name}.json").read_text(encoding="utf-8")), schema)
                self.assertEqual(errs[:5], [], f"{tdir.name}/{name}.json")

    def test_checker_catches_violations(self):
        schema = {"type": "object", "required": ["a"], "properties": {"a": {"type": "integer"}, "b": {"type": "array", "items": {"type": "string"}}}}
        self.assertEqual(_check({"a": 1, "b": ["x"]}, schema), [])
        self.assertEqual(len(_check({"b": [1]}, schema)), 2)


class SearchIndexTests(unittest.TestCase):
    """The Python index (src/pawatch/searchindex.py) must match the JS core (server/archive.js)."""

    def _node(self, script, payload):
        import shutil
        import subprocess
        import tempfile
        node = shutil.which("node")
        if not node:
            self.skipTest("node não instalado")
        root = Path(__file__).resolve().parents[1]
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f:
            json.dump(payload, f)
        major = int(subprocess.run([node, "--version"], capture_output=True, text=True).stdout.strip().lstrip("v").split(".")[0])
        flags = ["--experimental-detect-module"] if major < 23 else []
        code = ("import fs from 'fs'; import * as A from '" + (root / "server" / "archive.js").as_uri() + "';"
                "const P = JSON.parse(fs.readFileSync(" + json.dumps(f.name) + "));" + script)
        r = subprocess.run([node, *flags, "--input-type=module", "-e", code], capture_output=True, text=True, timeout=60)
        self.assertEqual(r.returncode, 0, r.stderr[-2000:])
        return json.loads(r.stdout)

    FIXTURE = {
        "themes": {"cards": "💳 Cartões", "mules": "🕸️ Mulas"},
        "digests": [{"date": "2026-11-17", "trend": "Golpes via Pix e contas laranja crescem.",
                     "items": [{"title": "Detecção de Contas Laranjas com grafos", "url": "u1", "venue": "KDD",
                                "summary": "Money mules, GNNs; ação rápida.", "theme": "mules", "authors": ["Ana Ç. Lima"]}],
                     "quick": [{"title": "Card fraud", "url": "u2", "note": "cartões"}]}],
        "evolution": {"generated": "2026-11-01", "eras": [{"title": "ML", "summary": "s", "label": "x", "milestones": [
            {"title": "Credit card fraud detection", "url": "u3", "year": 2015, "why": "Concept drift", "theme": "cards"}]}],
            "now": {"summary": "Agora grafos.", "open_questions": ["Quem paga?"]}},
        "annual": {"2026": {"partial": True, "overview": "Mulas +224%.", "innovation": "Academia 77%.",
                            "trends": [{"title": "Grafos", "text": "Mais grafos."}],
                            "highlights": [{"title": "Fed AML", "url": "u4", "date": "2026-03-01T00:00", "why": "lavagem", "theme": "mules"}]}},
    }
    LIB = [{"title": "dup", "url": "u1", "abstract": "x"}, {"title": "Synthetic identities", "url": "u5", "abstract": "KYC onboarding fraud"}]

    def test_tokens_and_docs_match_js(self):
        from pawatch.searchindex import build_docs, tokens
        samples = ["Detecção de Contas Laranjas", "AÇÃO rápida, money-mules e GNNs!", "the of and Pix São Paulo"]
        js = self._node("console.log(JSON.stringify({t: P.s.map(A.tokens), d: A.corpus(P.data, P.lib)}))",
                        {"s": samples, "data": self.FIXTURE, "lib": self.LIB})
        self.assertEqual(js["t"], [tokens(s) for s in samples])
        py = [{k: d.get(k) for k in ("kind", "title", "url", "when", "text")} for d in build_docs(self.FIXTURE, self.LIB)]
        self.assertEqual([{k: d.get(k) for k in ("kind", "title", "url", "when", "text")} for d in js["d"]], py)

    def test_index_ranking_matches_js_bm25(self):
        from pawatch.searchindex import build_index
        idx = build_index(self.FIXTURE, self.LIB)
        q = ["contas laranja money mule", "fraude cartão card", "onboarding kyc"]
        js = self._node("console.log(JSON.stringify(P.q.map((x) => [A.rank(A.corpus(P.data, P.lib), [x]).map((d) => d.title),"
                        " A.rankIndex(P.idx, [x]).map((d) => d.title)])))",
                        {"q": q, "data": self.FIXTURE, "lib": self.LIB, "idx": idx})
        for (full, fast), query in zip(js, q):
            self.assertTrue(full, query)
            self.assertEqual(full, fast, query)


class ApiTokenTests(unittest.TestCase):
    def test_cli_token_matches_server_auth(self):
        import io
        import os
        import shutil
        import subprocess
        from contextlib import redirect_stdout
        from types import SimpleNamespace
        from pawatch.__main__ import cmd_api_token
        os.environ["SITE_PASSWORD"] = "senha-x"
        try:
            buf = io.StringIO()
            with redirect_stdout(buf):
                self.assertEqual(cmd_api_token(SimpleNamespace(name="claude")), 0)
        finally:
            del os.environ["SITE_PASSWORD"]
        py = buf.getvalue().strip()
        self.assertRegex(py, r"^paw_claude_[0-9a-f]{32}$")
        node = shutil.which("node")
        if not node:
            self.skipTest("node não instalado")
        root = Path(__file__).resolve().parents[1]
        major = int(subprocess.run([node, "--version"], capture_output=True, text=True).stdout.strip().lstrip("v").split(".")[0])
        flags = ["--experimental-detect-module"] if major < 23 else []
        code = f"import {{ makeToken }} from '{(root / 'server' / 'auth.js').as_uri()}'; console.log(await makeToken('senha-x', 'claude'));"
        js = subprocess.run([node, *flags, "--input-type=module", "-e", code], capture_output=True, text=True, timeout=60)
        self.assertEqual(js.stdout.strip(), py, js.stderr[-500:])


def _tiny_pdf():
    """A real PDF: Flate content stream, a Type0 font with a ToUnicode CMap (2-byte codes, accents), TJ kerning,
    a second WinAnsi font with a TeX ligature code, and Td line breaks."""
    import zlib
    cmap = (b"/CIDInit /ProcSet findresource begin 12 dict begin begincmap 1 begincodespacerange <0000> <FFFF> "
            b"endcodespacerange 3 beginbfchar <0001> <0044> <0002> <00E9> <0003> <0074> endbfchar "
            b"1 beginbfrange <0010> <0012> <0061> endbfrange endcmap end end")
    content = (b"BT /F1 12 Tf 72 700 Td <000100020003> Tj 0 -14 Td [<0010> -300 <00110012>] TJ "
               b"/F2 12 Tf 0 -14 Td (\\escaped \(ok\) \014nal) Tj ET")
    objs = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 5 0 R /F2 7 0 R >> >> /Contents 4 0 R >>",
        b"<< /Filter /FlateDecode /Length %d >>\nstream\n" % len(zlib.compress(content)) + zlib.compress(content) + b"\nendstream",
        b"<< /Type /Font /Subtype /Type0 /BaseFont /X /Encoding /Identity-H /ToUnicode 6 0 R >>",
        b"<< /Length %d >>\nstream\n" % len(cmap) + cmap + b"\nendstream",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>",
    ]
    out = b"%PDF-1.4\n" + b"".join(b"%d 0 obj\n" % (i + 1) + o + b"\nendobj\n" for i, o in enumerate(objs))
    return out + b"trailer << /Root 1 0 R >>\n%%EOF"


class FulltextTests(unittest.TestCase):
    def test_pdf_extractor(self):
        from pawatch.pdftext import extract
        text = extract(_tiny_pdf())
        # "\\e" is an unknown PDF escape: the backslash is dropped, as the spec says; 0x0C is the TeX "fi" ligature
        self.assertEqual(text.split("\n"), ["Dét", "a bc", "escaped (ok) final"])
        self.assertEqual(extract(b"not a pdf"), "")

    def test_html_sections_and_links(self):
        from pawatch.fulltext import html_text, sections_from_html
        text, links = html_text("<html><nav>menu</nav><h2>1 Introduction</h2><p>We study <b>fraud</b>.</p>"
                                "<script>x()</script><h2>2 Methods</h2><p>Code at <a href='https://github.com/a/b'>repo</a>.</p></html>")
        self.assertEqual(sections_from_html(text), [("Introduction", "We study fraud."), ("Methods", "Code at repo.")])
        self.assertEqual(links, ["https://github.com/a/b"])
        math, _ = html_text('<p>Let <math alttext="d_{model}"><mi>d</mi></math> be the size.</p>')
        self.assertEqual(math, "Let d_{model} be the size.")

    def test_plain_sections_and_caps(self):
        from pawatch.fulltext import MAX_SECTION, keep_sections, sections_from_plain
        secs = sections_from_plain("Title\nAbstract\nWe find X.\n1. Introduction\nText.\n5 Conclusion\nDone.\nReferences\n[1] A.")
        self.assertEqual([n for n, _ in secs], ["Início", "Abstract", "Introduction", "Conclusion", "References"])
        kept = keep_sections([("Introduction", "x" * (MAX_SECTION + 500)), ("References", "y" * 500)])
        self.assertEqual([s["name"] for s in kept], ["Introduction (1/2)", "Introduction (2/2)"])

    def test_repo_links(self):
        from pawatch.fulltext import find_repos, normalize_repo
        self.assertEqual(normalize_repo("https://github.com/Owner/Repo.git/tree/main/src."), "https://github.com/owner/repo")
        self.assertEqual(normalize_repo("github.com/features/actions"), None)
        self.assertEqual(normalize_repo("https://huggingface.co/datasets/org/data/blob/x"), "https://huggingface.co/datasets/org/data")
        self.assertEqual(normalize_repo("https://zenodo.org/records/123456"), "https://zenodo.org/records/123456")
        text = ("Our code is available at https://github.com/lab/fraud-\ngnn. We compare with "
                "the baseline of Smith (see github.com/other/baseline).")
        found = {u: own for u, own, _ in find_repos(text, ["https://gitlab.com/x/y", "https://example.com",
                                                            "https://github.com/arxiv/html_feedback/issues"])}
        self.assertEqual(found, {"https://github.com/lab/fraud-gnn": True, "https://github.com/other/baseline": False,
                                 "https://gitlab.com/x/y": False})

    def test_paper_key(self):
        from pawatch.fulltext import paper_key, safe_name
        w = {"id": "https://openalex.org/W9", "doi": "https://doi.org/10.1/ABC",
             "locations": [{"landing_page_url": "https://arxiv.org/abs/2303.17564v2"}]}
        self.assertEqual(paper_key(w), "arxiv:2303.17564")
        self.assertEqual(paper_key({"id": "https://openalex.org/W9", "doi": "https://doi.org/10.1/ABC", "locations": []}), "doi:10.1/abc")
        self.assertEqual(paper_key({"id": "https://openalex.org/W9", "doi": None}), "oa:W9")
        self.assertEqual(safe_name("doi:10.1/abc(x)"), "doi_10.1_abc_x_")


class ServerJsTests(unittest.TestCase):
    def test_node_suite(self):
        """The serving core (server/) and /api/ask adapter are JS; run their node:test suite when node exists."""
        import shutil
        import subprocess
        node = shutil.which("node")
        if not node:
            self.skipTest("node não instalado")
        root = Path(__file__).resolve().parents[1]
        files = sorted(str(f) for f in (root / "tests" / "js").glob("*.test.mjs"))
        major = int(subprocess.run([node, "--version"], capture_output=True, text=True).stdout.strip().lstrip("v").split(".")[0])
        if major < 20:
            self.skipTest(f"node {major} é antigo demais para node:test com ESM")
        # server/*.js use ESM syntax without a package.json "type": older node needs detection switched on
        flags = ["--experimental-detect-module"] if major < 23 else []
        r = subprocess.run([node, *flags, "--test", *files], cwd=root, capture_output=True, text=True, timeout=120)
        self.assertEqual(r.returncode, 0, r.stdout[-3000:] + r.stderr[-2000:])


if __name__ == "__main__":
    unittest.main()


class EvolutionTests(unittest.TestCase):
    def setUp(self):
        from pawatch.evolution import DEFAULT_ERAS
        self.eras = DEFAULT_ERAS

    def n(self, i, year, net, cit):
        return {"id": f"W{i}", "title": f"Paper {i}", "year": year, "venue": "V", "authors": ["A", "B"],
                "cited_by": cit, "url": f"https://doi.org/x/{i}", "abstract": "", "refs": [], "net": net}

    def test_era_of_bounds(self):
        from pawatch.evolution import era_of
        self.assertEqual(era_of(1964, self.eras), "ate-1999")
        self.assertEqual(era_of(2000, self.eras), "2000-2009")
        self.assertEqual(era_of(2017, self.eras), "2010-2017")
        self.assertEqual(era_of(2026, self.eras), "2023+")
        self.assertIsNone(era_of(None, self.eras))

    def test_candidates_rank_within_each_era(self):
        from pawatch.evolution import candidates
        nodes = {x["id"]: x for x in [
            self.n(1, 1990, 50, 90000), self.n(2, 1995, 1, 100),
            self.n(3, 2024, 9, 300), self.n(4, 2024, 0, 5), self.n(5, 2025, 3, 40)]}
        out = candidates(nodes, self.eras, per_era=1)
        # one per era, and the recent era keeps its own best despite far fewer citations
        self.assertEqual(sorted((c["era"], c["id"]) for c in out), [("2023+", "W3"), ("ate-1999", "W1")])

    def test_pick_milestones_drops_methods_and_caps_per_era(self):
        from pawatch.evolution import pick_milestones
        cands = [dict(self.n(i, 2024, i, 10), era="2023+") for i in range(4)]
        verdicts = {"W0": [9, "metodo", "analytics"], "W1": [8, "marco", "hiring"],
                    "W2": [7, "marco", "hiring"], "W3": [5, "marco", "hiring"]}
        picked = pick_milestones(cands, verdicts, self.eras, per_era_recent=1)
        self.assertEqual(picked["2023+"], ["W1"])

    def test_pick_caps_one_theme_per_era_then_fills(self):
        from pawatch.evolution import pick_milestones
        cands = [dict(self.n(i, 2024, 10 - i, 10), era="2023+") for i in range(6)]
        verdicts = {f"W{i}": [9, "marco", "ai_work"] for i in range(4)}
        verdicts.update({"W4": [7, "marco", "analytics"], "W5": [6, "marco", "hiring"]})
        picked = pick_milestones(cands, verdicts, self.eras, per_era_recent=5, max_per_theme_recent=2)["2023+"]
        self.assertEqual(picked, ["W0", "W1", "W4", "W5", "W2"])  # 2 ai_work, other themes, then refill

    def test_incremental_pick_keeps_settled_eras_and_resists_churn(self):
        from pawatch.evolution import pick_milestones
        cands = [dict(self.n(1, 1990, 5, 100), era="ate-1999"), dict(self.n(2, 1992, 9, 900), era="ate-1999"),
                 dict(self.n(3, 1995, 9, 900), era="ate-1999"),
                 dict(self.n(4, 2024, 1, 10), era="2023+"), dict(self.n(5, 2024, 9, 10), era="2023+")]
        verdicts = {"W1": [7, "marco", "a"], "W2": [9, "marco", "a"], "W3": [9, "marco", "a"],
                    "W4": [7, "marco", "a"], "W5": [8, "marco", "a"]}
        prev = {"eras": [{"key": "ate-1999", "milestones": [{"id": "W1", "url": "u1"}]},
                         {"key": "2023+", "milestones": [{"id": "W4", "url": "u4"}]}]}
        picked = pick_milestones(cands, verdicts, self.eras, prev=prev, stable={"ate-1999"},
                                 new_ids={"W2", "W3", "W5"}, per_era=1, per_era_recent=1)
        # settled era: incumbent stays, only one strong newcomer admitted
        self.assertEqual(picked["ate-1999"], ["W1", "W2"])
        # recent era: incumbent 7 (+1 bonus = 8) ties the newcomer's 8; the tie goes to the stronger network
        self.assertEqual(picked["2023+"], ["W5"])
        verdicts["W5"] = [7, "marco", "a"]
        picked = pick_milestones(cands, verdicts, self.eras, prev=prev, stable={"ate-1999"}, new_ids=set(), per_era=1, per_era_recent=1)
        self.assertEqual(picked["2023+"], ["W4"])  # 7+1 beats 7: no churn on equal scores

    def test_evolve_end_to_end_incremental_and_full(self):
        import tempfile
        from unittest import mock
        from pawatch import evolution as evo

        class FakeTopic:
            meta = {"audience": "Você é o curador. Etc.", "rubric_focus": "RH", "off_topic": "medicina"}
            themes = {"hiring": "🎯 Recrutamento", "analytics": "📊 Analytics"}
            def __init__(self, d): self.data = Path(d)
            def digests(self): return []
            def queries(self): return {}

        class FakeLLM:
            used_model, usage = "fake", {}
            def __init__(self): self.triaged = []
            def json(self, system, user, **kw):
                if user.startswith("Obras"):
                    rows = [json.loads(l) for l in user.splitlines()[1:]]
                    self.triaged += [r["title"] for r in rows]
                    return {"r": [{"i": r["i"], "s": 3 if "Method" in r["title"] else 8,
                                   "k": "metodo" if "Method" in r["title"] else "marco", "t": "hiring"} for r in rows]}
                payload = json.loads(user)
                return {"overview": "O.", "changes_note": "N." if "mudancas" in payload else "",
                        "now": {"summary": "Agora.", "open_questions": ["Q?"]}, "threads": [],
                        "eras": [{"key": e["key"], "title": f"T {e['key']}", "summary": "S.",
                                  "milestones": [{"i": m["i"], "why": f"why {m['title']}"} for m in e["marcos"]]}
                                 for e in payload["eras"]]}

        def net(extra=()):
            ws = [self.n(1, 1980, 9, 5000), self.n(2, 2024, 5, 50), dict(self.n(3, 1985, 9, 9000), title="Method X")]
            ws += list(extra)
            return {w["id"]: w for w in ws}

        with tempfile.TemporaryDirectory() as d:
            topic, llm = FakeTopic(d), FakeLLM()
            def save(ev):
                (topic.data / "evolution").mkdir(parents=True, exist_ok=True)
                (topic.data / "evolution" / f"{ev['generated']}.json").write_text(json.dumps(ev))
            with mock.patch.object(evo, "build_network", lambda *a, **k: net()):
                first = evo.evolve(topic, llm, log=lambda m: None)
            self.assertEqual(first["mode"], "completa")
            self.assertIsNone(first["changes"])
            titles = [m["title"] for e in first["eras"] for m in e["milestones"]]
            self.assertEqual(sorted(titles), ["Paper 1", "Paper 2"])  # the method was dropped
            first["month"], first["generated"] = "2026-10", "2026-10-01"
            save(first)

            llm2 = FakeLLM()
            with mock.patch.object(evo, "build_network", lambda *a, **k: net([self.n(9, 1990, 9, 7000)])):
                second = evo.evolve(topic, llm2, log=lambda m: None)
            self.assertEqual(second["mode"], "incremental")
            self.assertEqual(llm2.triaged, ["Paper 9"])  # only the never-seen work goes to the LLM
            old = next(e for e in second["eras"] if e["key"] == "ate-1999")
            self.assertEqual([m["title"] for m in old["milestones"]], ["Paper 1", "Paper 9"])
            self.assertEqual(old["milestones"][0]["why"], "why Paper 1")  # kept from the previous month
            self.assertTrue(old["milestones"][1]["new"])
            self.assertEqual(second["changes"]["added"], [{"title": "Paper 9", "year": 1990, "era": "ate-1999"}])
            self.assertEqual(second["changes"]["note"], "N.")

            llm3 = FakeLLM()
            with mock.patch.object(evo, "build_network", lambda *a, **k: net()):
                full = evo.evolve(topic, llm3, full=True, log=lambda m: None)
            self.assertEqual(full["mode"], "completa")
            self.assertEqual(len(llm3.triaged), 0)  # full review reuses cached verdicts
            llm4 = FakeLLM()
            with mock.patch.object(evo, "build_network", lambda *a, **k: net()):
                evo.evolve(topic, llm4, full=True, rejudge=True, log=lambda m: None)
            self.assertEqual(len(llm4.triaged), 3)  # rejudge sends everything back to the LLM
            self.assertEqual(full["changes"]["since"], "2026-10-01")

    def test_merge_versions_folds_working_paper_into_article(self):
        from pawatch.evolution import merge_versions
        wp = dict(self.n(1, 2023, 4, 1752), title="Generative AI at Work", type="report",
                  authors=["Erik Brynjolfsson", "Danielle Li"], refs=["W9"], watch=["Danielle Li"])
        art = dict(self.n(2, 2024, 6, 2427), title="Generative AI at Work", type="article",
                   authors=["Erik Brynjolfsson", "Danielle Li", "Lindsey Raymond"], refs=["W8"])
        other = dict(self.n(3, 2020, 1, 10), title="Generative AI at Work", type="article", authors=["Someone Else"])
        nodes = {"W1": wp, "W2": art, "W3": other}
        self.assertEqual(merge_versions(nodes), 1)
        self.assertEqual(sorted(nodes), ["W2", "W3"])  # same title, different authors: kept apart
        lead = nodes["W2"]
        self.assertEqual((lead["cited_by"], lead["net"], lead["year"]), (4179, 10, 2023))
        self.assertEqual(lead["refs"], ["W8", "W9"])
        self.assertEqual(lead["watch"], ["Danielle Li"])
        self.assertEqual(lead["versions"], ["https://doi.org/x/1"])

    def test_candidates_always_include_watchlist_works(self):
        from pawatch.evolution import candidates
        nodes = {x["id"]: x for x in [self.n(1, 2024, 9, 900), dict(self.n(2, 2024, 0, 3), watch=["Danielle Li"]),
                                      self.n(3, 2024, 0, 2)]}
        ids = sorted(c["id"] for c in candidates(nodes, self.eras, per_era=1))
        self.assertEqual(ids, ["W1", "W2"])

    def test_salvage_verdicts_keeps_complete_objects(self):
        from pawatch.evolution import salvage_verdicts
        cut = '{"r": [{"i": 0, "s": 8, "k": "marco", "t": "hiring"}, {"i": 1, "s": 3, "k": "metodo", "t": "analytics"}, {"i": 2, "s'
        self.assertEqual([r["i"] for r in salvage_verdicts(cut)["r"]], [0, 1])
        self.assertEqual(salvage_verdicts('{"r": [{"i": 5, "s": 7, "k": "marco", "t": "x"}]}')["r"][0]["s"], 7)
        with self.assertRaises(ValueError):
            salvage_verdicts("")

    def test_historical_references_seed_evolution_but_not_daily(self):
        from pawatch import collect as col
        from pawatch.evolution import build_network

        def work(i, author_id):
            return {"id": f"https://openalex.org/W{i}", "display_name": f"Classic {i}", "publication_year": 1990,
                    "cited_by_count": 5000, "type": "article", "authorships": [{"author": {"id": author_id, "display_name": "Ed L"}}],
                    "referenced_works": []}

        class FakeFetch:
            calls, cost = 0, 0.0
            def __init__(self): self.authors = []
            def top_cited(self, *a, **k): return []
            def by_ids(self, ids, field="openalex"): return []
            def by_author(self, aid, per_page, since=None):
                self.authors.append((aid, since))
                return [work(1, aid)] if aid == "A9" else []

        class T:
            def queries(self): return {}
            def digests(self): return []
            meta = {}
            def watchlist(self): return {"researchers": [], "historical": [{"name": "Edward Lazear", "openalex_id": "A9"}]}

        f = FakeFetch()
        nodes = build_network(T(), f, lambda m: None)
        self.assertEqual(nodes["W1"]["watch"], ["Edward Lazear"])
        self.assertEqual(f.authors, [("A9", None)])  # classics only, no "recent" query

        seen = []
        class OA:
            def __init__(self, *a): pass
            calls, cost = 0, 0.0
            def works(self, filters, **k):
                seen.extend(filters)
                return []
        orig = col.OpenAlex
        col.OpenAlex = OA
        try:
            col.collect_openalex({"openalex": {"types": ["article"], "queries": [], "per_query": 5}},
                                 T().watchlist(), "2026-11-01", "2026-11-17", lambda m: None)
        finally:
            col.OpenAlex = orig
        self.assertFalse(any("A9" in f for f in seen))  # not monitored in the daily digest

    def test_markdown(self):
        from pawatch.evolution import evolution_markdown
        ev = {"generated": "2026-11-17", "model": "m", "stats": {"milestones": 1, "network": 10},
              "overview": "Arco.", "eras": [{"label": "2023 em diante", "title": "IA generativa", "summary": "S.",
              "milestones": [{"title": "T", "url": "https://u", "year": 2024, "authors": ["A", "B", "C", "D"],
                              "venue": "QJE", "cited_by": 9, "why": "W."}]}],
              "now": {"summary": "Agora.", "open_questions": ["Q?"]}, "threads": [{"theme": "hiring", "line": "L."}]}
        out = evolution_markdown(ev, PA)
        self.assertIn("## 2023 em diante · IA generativa", out)
        self.assertIn("**[T](https://u)** (2024) — A, B, C et al. · QJE · cit:9", out)
        self.assertIn("- Q?", out)
        self.assertIn("**🎯 Recrutamento & seleção**: L.", out)


class FeedbackTests(unittest.TestCase):
    def fake_api(self, store, namespaces):
        calls = {"created": []}

        def get(url, params=None, headers=None):
            if url.endswith("/namespaces"):
                return {"result": namespaces, "result_info": {"total_pages": 1}}
            if url.endswith("/keys"):
                return {"result": [{"name": k} for k in store if k.startswith(params["prefix"])], "result_info": {}}
            key = urllib.parse.unquote(url.rsplit("/values/", 1)[1])
            return store[key]

        def post(url, payload, headers=None):
            calls["created"].append(payload["title"])
            return {"result": {"id": "ns-new"}}
        return get, post, calls

    def test_namespace_created_once_and_export_is_incremental(self):
        import tempfile
        from unittest import mock
        from pawatch import feedback as fb
        store = {
            "fb:people-analytics:2026-11-17T10:00:00Z:a": {"topic": "people-analytics", "kind": "paper", "vote": "up", "ref": "doi:1", "voter": "v1", "at": "2026-11-17T10:00:00Z"},
            "fb:people-analytics:2026-11-17T11:00:00Z:b": {"topic": "people-analytics", "kind": "paper", "vote": "down", "ref": "doi:1", "voter": "v1", "at": "2026-11-17T11:00:00Z"},
            "fb:people-analytics:2026-11-17T12:00:00Z:c": {"topic": "people-analytics", "kind": "digest", "comment": "ótimo", "name": "Ana", "voter": "v2", "at": "2026-11-17T12:00:00Z"},
            "fb:unknown-topic:2026-11-17T12:00:00Z:d": {"topic": "unknown-topic", "kind": "site", "comment": "x"},
        }
        get, post, calls = self.fake_api(store, [])
        with tempfile.TemporaryDirectory() as d:
            (Path(d) / "people-analytics").mkdir()
            with mock.patch.object(fb, "DATA", Path(d)):
                kv = fb.KV("t", "acc", get=get, post=post)
                self.assertEqual(kv.namespace_id(), ("ns-new", True))
                self.assertEqual(calls["created"], ["paw-feedback"])
                self.assertEqual(fb.export(kv, "ns", lambda m: None), {"people-analytics": 3})
                self.assertEqual(fb.export(kv, "ns", lambda m: None), {})  # nothing new the second time
                entries = json.loads((Path(d) / "people-analytics" / "feedback.json").read_text())
        self.assertEqual([e["key"][-1] for e in entries], ["a", "b", "c"])
        # the latest vote of a voter on the same paper wins
        self.assertEqual(fb.summary(entries), {"up": 0, "down": 1, "comments": 1, "people": 2})

    def test_existing_namespace_is_reused(self):
        from pawatch import feedback as fb
        get, post, calls = self.fake_api({}, [{"title": "other", "id": "x"}, {"title": "paw-feedback", "id": "ns-1"}])
        self.assertEqual(fb.KV("t", "acc", get=get, post=post).namespace_id(), ("ns-1", False))
        self.assertEqual(calls["created"], [])
