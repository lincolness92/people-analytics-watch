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


if __name__ == "__main__":
    unittest.main()
