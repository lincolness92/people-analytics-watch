"""people-analytics-watch: digest diário de pesquisa em people analytics e gestão de pessoas."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CONFIG = ROOT / "config"
DATA = ROOT / "data"
DIGESTS_MD = ROOT / "digests"
WEB = ROOT / "web"
DIST = ROOT / "dist"

THEMES = {
    "analytics": "📊 People analytics & métricas",
    "hiring": "🎯 Recrutamento & seleção",
    "ai_work": "🤖 IA & futuro do trabalho",
    "engagement": "💡 Engajamento, retenção & bem-estar",
    "leadership": "🧭 Liderança, cultura & times",
    "pay_careers": "💰 Remuneração, carreira & equidade",
    "learning": "📚 Aprendizagem & skills",
    "governance": "⚖️ Ética, governança & regulação",
}
