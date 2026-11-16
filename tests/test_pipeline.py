import sys
import json
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from pawatch.collect import annotate_and_dedupe, norm_title, rebuild_abstract  # noqa: E402
from pawatch.llm import parse_json  # noqa: E402
from pawatch.render import digest_markdown  # noqa: E402
from pawatch.score import prefilter  # noqa: E402


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
        self.assertEqual(prefilter([a, b], 1)[0]["key"], "b")


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
        out = digest_markdown(d)
        self.assertIn("🎯 Recrutamento & seleção", out)
        self.assertIn("**[T](https://u)** — AMJ · **9/10** · ⭐ Prasanna Tambe", out)
        self.assertIn("**Menções rápidas**: [Q](https://q) (n)", out)
        self.assertIn("**🔥 Tendência**: tendência", out)
        self.assertIn("digest de 16/11/2026**", out)

    def test_markdown_shows_period(self):
        d = {"date": "2026-11-16", "period": {"from": "2026-11-09", "to": "2026-11-16"},
             "stats": {"candidates": 3}, "items": [], "quick": []}
        self.assertIn("digest de 09/11 a 16/11/2026**", digest_markdown(d))

    def test_markdown_empty_day(self):
        d = {"date": "2026-11-16", "stats": {"candidates": 3}, "items": [], "quick": []}
        self.assertIn("nada acima da barra", digest_markdown(d))



class BundleTests(unittest.TestCase):
    def test_bundle_is_self_contained(self):
        import re
        from pawatch.bundle import bundle
        from pawatch.render import render_all
        render_all()
        for theme in (None, "bb"):
            html = bundle(theme)
            self.assertNotIn('href="style.css"', html)
            self.assertNotIn('src="app.js"', html)
            self.assertNotIn('fetch("data.json"', html)
            self.assertIsNone(re.search(r'url\("fonts/', html))
            data = re.search(r'<script id="pa-data" type="application/json">(.*?)</script>', html, re.S).group(1)
            self.assertIn("digests", json.loads(data))
        self.assertIn("data:font/ttf;base64,", bundle("bb"))
        self.assertIn("theme-toggle", bundle("bb"))
        self.assertNotIn("theme-toggle", bundle(None))



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

    def test_rss_window_and_title_pattern(self):
        from pawatch.web import collect_web
        src = [{"name": "Blog", "watch": "Fulano", "kind": "rss", "url": "https://ex.org/feed", "pattern": "(?i)work|pay"}]
        out = collect_web(src, "2026-11-09", {}, lambda m: None, fetch=lambda u: self.RSS)
        self.assertEqual([c["title"] for c in out], ["New study on hybrid work"])
        self.assertEqual(out[0]["abstract"], "We ran a field experiment")
        self.assertEqual(out[0]["watch_source"], "Fulano")
        self.assertEqual(out[0]["key"], "web:https://ex.org/a")

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


if __name__ == "__main__":
    unittest.main()
