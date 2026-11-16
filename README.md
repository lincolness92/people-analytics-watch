# people-analytics-watch

Digest diário em PT-BR com a pesquisa state-of-the-art em **people analytics, gestão de pessoas,
RH, talento e futuro do trabalho**. É um irmão do `sota-watch`, só que roda inteiro no GitHub
Actions (sem servidor) e publica um site estático no Cloudflare Pages.

## Como funciona

```
08:30 BRT  GitHub Actions (.github/workflows/daily.yml)
  ├─ coleta    OpenAlex: 16 buscas temáticas + autores da watchlist + journals de elite
  │            arXiv: econ.GN / cs.CY / cs.HC / cs.SI com termos de trabalho/RH
  │            fontes web dos centros e praticantes (RSS, páginas de listagem, sitemap)
  ├─ dedupe    por DOI/título contra data/seen.json
  ├─ triagem   LLM de pesos abertos (HF Inference Providers) dá nota 0–10 + tema
  ├─ redação   LLM escreve resumo PT-BR dos selecionados, menções rápidas e tendência do dia
  ├─ grava     data/digests/AAAA-MM-DD.json → digests/AAAA-MM-DD.md + INDEX.md
  ├─ commita   no próprio repo
  ├─ Discord   (opcional, se DISCORD_WEBHOOK_URL existir)
  └─ deploy    dist/ → Cloudflare Pages (se CLOUDFLARE_API_TOKEN existir)
```

Temas: 📊 People analytics & métricas · 🎯 Recrutamento & seleção · 🤖 IA & futuro do trabalho ·
💡 Engajamento, retenção & bem-estar · 🧭 Liderança, cultura & times · 💰 Remuneração, carreira &
equidade · 📚 Aprendizagem & skills · ⚖️ Ética, governança & regulação.

## Estrutura

| Caminho | O quê |
|---|---|
| `config/queries.json` | buscas do OpenAlex/arXiv, janela (`lookback_days`), limites de seleção |
| `config/watchlist.json` | pesquisadores, journals, centros e praticantes de referência (com IDs OpenAlex) |
| `config/sources.json` | feeds e páginas dos centros e praticantes (e quais ainda não têm fonte viável) |
| `src/pawatch/` | pipeline (stdlib pura, sem dependências): `collect`, `score`, `llm`, `render` |
| `web/` | site estático (HTML/CSS/JS), lê `data.json` |
| `data/digests/*.json` | fonte da verdade de cada dia (estruturado) |
| `data/seen.json` | papers já avaliados (não voltam) |
| `data/web_state.json` | links já vistos nas páginas/sitemaps das fontes web |
| `digests/*.md`, `INDEX.md` | gerados a partir dos JSON |
| `dist/` | build do site (não versionado) |

## Comandos

```bash
export PYTHONPATH=src
python -m pawatch run                 # digest de hoje (usa HF_TOKEN ou ~/.cache/huggingface/token)
python -m pawatch run --date 2026-11-16 --lookback 30 --force
python -m pawatch render              # regera markdown, INDEX.md e dist/
python -m pawatch notify              # envia o digest de hoje ao Discord
python -m pawatch bundle [--theme bb] # HTML autocontido do site em share/ (bb = identidade BB)
python -m unittest discover -s tests  # testes
python3 -m http.server -d dist 8000   # ver o site local em http://localhost:8000
```

## Configuração (GitHub → Settings → Secrets and variables → Actions)

| Nome | Tipo | Obrigatório | Para quê |
|---|---|---|---|
| `HF_TOKEN` | secret | sim | token do Hugging Face com permissão *Make calls to Inference Providers* |
| `OPENALEX_API_KEY` | secret | recomendado | chave grátis (US$ 1/dia de cota) em https://openalex.org/settings/api. Sem ela, a cota é compartilhada por IP, e IPs de runner do GitHub são compartilhados |
| `CLOUDFLARE_API_TOKEN` | secret | p/ site | token com permissão *Cloudflare Pages: Edit* |
| `CLOUDFLARE_ACCOUNT_ID` | secret | p/ site | ID da conta Cloudflare |
| `DISCORD_WEBHOOK_URL` | secret | não | entrega do digest no Discord |
| `PAW_MODEL` | variable | não | modelo(s) HF, separados por vírgula (padrão: `deepseek-ai/DeepSeek-V4.1-Flash`, com fallback para Qwen3.5-122B e gpt-oss-120b) |
| `CF_PAGES_PROJECT` | variable | não | nome do projeto no Pages (padrão `people-analytics-watch`) |

Custo típico por dia: ~20 chamadas OpenAlex (≈ US$ 0,02 da cota grátis) e ~60–90k tokens de LLM.

## Site privado no Cloudflare

1. Crie o projeto uma vez: `npx wrangler pages project create people-analytics-watch --production-branch main`.
2. Proteja com **Cloudflare Access** (Zero Trust, grátis até 50 usuários): *Zero Trust → Access →
   Applications → Add → Self-hosted*, domínio `people-analytics-watch.pages.dev` (e
   `*.people-analytics-watch.pages.dev` para previews), política *Allow* com o seu e-mail
   (login por código de uso único).
3. O workflow faz o deploy a cada execução diária e quando `web/` ou a watchlist mudam.

## Ajustes comuns

- **Ampliar ou estreitar o escopo**: edite `config/queries.json` (sintaxe booleana do OpenAlex).
- **Barra de qualidade**: `selection.min_score` / `max_selected`.
- **Watchlist**: edite `config/watchlist.json`. Autores com `openalex_id` têm os papers novos puxados
  diretamente e ganham bônus na triagem e ⭐ no site.
- **Centros e praticantes**: as fontes ficam em `config/sources.json` (`rss`, `page` ou `sitemap`).
  Itens delas ganham bônus no pré-filtro e 📌 no site. Para `page`/`sitemap`, a primeira execução
  só registra os links existentes; depois entram apenas os novos.
- **Refazer um dia**: `python -m pawatch run --date AAAA-MM-DD --force` (ou *Run workflow* com `force`).
