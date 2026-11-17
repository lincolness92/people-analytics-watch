"""pawatch: digest de pesquisa state-of-the-art, um pacote de configuração por tema (topics/<slug>/)."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TOPICS = ROOT / "topics"
DATA = ROOT / "data"
DIGESTS_MD = ROOT / "digests"
WEB = ROOT / "web"
DIST = ROOT / "dist"
