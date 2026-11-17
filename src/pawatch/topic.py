"""A topic pack: topics/<slug>/{topic.json, queries.json, watchlist.json, sources.json}.

topic.json holds the identity (name, brand), the editorial voice given to the LLM and the
digest themes; queries.json the OpenAlex/arXiv searches and selection bar; watchlist.json the
reference researchers, journals, centers and practitioners; sources.json their web feeds.
Generated data lives in data/<slug>/ and digests/<slug>/.
"""

import json

from . import DATA, DIGESTS_MD, TOPICS


def _load(path, default):
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else default


class Topic:
    def __init__(self, slug):
        self.slug = slug
        self.dir = TOPICS / slug
        if not (self.dir / "topic.json").exists():
            raise SystemExit(f"tema desconhecido: {slug} (esperado {self.dir / 'topic.json'})")
        self.meta = _load(self.dir / "topic.json", {})
        self.data = DATA / slug
        self.digests_json = self.data / "digests"
        self.digests_md = DIGESTS_MD / slug

    name = property(lambda self: self.meta["name"])
    themes = property(lambda self: self.meta["themes"])

    def queries(self):
        return _load(self.dir / "queries.json", {})

    def watchlist(self):
        return _load(self.dir / "watchlist.json", {})

    def sources(self):
        return _load(self.dir / "sources.json", {}).get("sources", [])

    def digests(self):
        """All digests of this topic, newest first."""
        return [json.loads(f.read_text(encoding="utf-8"))
                for f in sorted(self.digests_json.glob("*.json"), reverse=True)]

    def __repr__(self):
        return f"Topic({self.slug!r})"


def all_topics():
    slugs = [p.parent.name for p in TOPICS.glob("*/topic.json")]
    topics = [Topic(s) for s in slugs]
    return sorted(topics, key=lambda t: (t.meta.get("order", 100), t.slug))


def pick(slug=None):
    """One topic by slug, or every topic when slug is None."""
    return [Topic(slug)] if slug else all_topics()
