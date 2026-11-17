# research-watch (repo `people-analytics-watch`)

Digests em PT-BR com a pesquisa state-of-the-art de **qualquer tema**, um pacote de configuração por
tema em `topics/<slug>/`. Hoje: **People Analytics Watch** (gestão de pessoas, RH, futuro do trabalho)
e **Bank Fraud Watch** (fraude bancária, pagamentos, PLD/CFT, Basileia, Bacen). Roda inteiro no
GitHub Actions (sem servidor) e publica um site estático no Cloudflare Pages, com uma pasta por tema.

## Como funciona

```
08:30 BRT  GitHub Actions (.github/workflows/daily.yml)
  ├─ para cada tema em topics/:
  ├─ coleta    OpenAlex: buscas do tema + autores da watchlist + journals de elite
  │            arXiv: categorias e termos do tema
  │            fontes web dos centros e praticantes (RSS, páginas de listagem, sitemap)
  ├─ dedupe    por DOI/título contra data/<tema>/seen.json
  ├─ triagem   LLM de pesos abertos (HF Inference Providers) dá nota 0–10 + tema
  ├─ redação   LLM escreve resumo PT-BR dos selecionados, menções rápidas e tendência do dia
  ├─ grava     data/<tema>/digests/AAAA-MM-DD.json → digests/<tema>/AAAA-MM-DD.md + INDEX.md
  ├─ commita   no próprio repo
  ├─ Discord   (opcional, se DISCORD_WEBHOOK_URL existir)
  └─ deploy    dist/ (página inicial + dist/<tema>/) → Cloudflare Pages (se CLOUDFLARE_API_TOKEN existir)
```

## Estrutura

| Caminho | O quê |
|---|---|
| `topics/<tema>/topic.json` | identidade (nome, marca), voz editorial para o LLM, temas do digest, palavras-chave do pré-filtro |
| `topics/<tema>/queries.json` | buscas do OpenAlex/arXiv, janela (`lookback_days`), limites de seleção |
| `topics/<tema>/watchlist.json` | pesquisadores, journals, centros/reguladores e praticantes (com IDs OpenAlex) |
| `topics/<tema>/sources.json` | feeds e páginas das fontes da watchlist (e quais não têm fonte viável) |
| `src/pawatch/` | pipeline (stdlib pura, sem dependências): `collect`, `web`, `score`, `llm`, `render`, `bundle`, `topic`, `bootstrap` |
| `web/` | site estático (HTML/CSS/JS), lê `data.json` |
| `data/<tema>/digests/*.json` | fonte da verdade de cada dia (estruturado) |
| `data/<tema>/seen.json` | papers já avaliados (não voltam) |
| `data/<tema>/web_state.json` | links já vistos nas páginas/sitemaps das fontes web |
| `digests/<tema>/*.md`, `INDEX.md` | gerados a partir dos JSON |
| `themes/bb/` | identidade visual Banco do Brasil para o HTML autocontido |
| `share/` | HTMLs autocontidos para mandar a colegas |
| `ROADMAP.md` | próximos passos combinados |
| `dist/` | build do site (não versionado) |

## Comandos

```bash
export PYTHONPATH=src
python -m pawatch run                          # digest de hoje de todos os temas (HF_TOKEN no ambiente)
python -m pawatch run --topic fraude-bancaria   # só um tema
python -m pawatch run --date 2026-11-16 --lookback 30 --force
python -m pawatch render                       # regera markdown, INDEX.md e dist/
python -m pawatch notify [--topic X]           # envia o digest de hoje ao Discord
python -m pawatch bundle [--topic X] [--theme bb]  # HTML autocontido em share/ (bb = identidade BB)
python -m pawatch new-topic "risco de crédito" # rascunho de um tema novo (veja abaixo)
python -m unittest discover -s tests  # testes
python3 -m http.server -d dist 8000   # ver o site local em http://localhost:8000
```

## Criar um tema novo

1. **Rascunho automático** (precisa de `HF_TOKEN` e, de preferência, `OPENALEX_API_KEY` no ambiente):
   `python -m pawatch new-topic "risco de crédito" --slug risco-credito`. Ele:
   - pede ao LLM a voz editorial, 6–8 temas, 12–16 buscas booleanas, categorias do arXiv, journals,
     pesquisadores e organizações a acompanhar;
   - testa cada busca no OpenAlex (descarta as que não acham nada nos últimos 30 dias);
   - confirma no OpenAlex os pesquisadores sugeridos (precisam ter ≥ 2 trabalhos no tema) e completa a
     lista com os autores mais citados por trás das buscas (cada busca pesa igual; ≥ 2 papers;
     megajournals fora);
   - procura o feed RSS/Atom de cada organização e só guarda os que funcionam.
   Se cair no meio (ex.: cota do OpenAlex), rode de novo: o rascunho do LLM fica em `.draft.json`.
2. **Revisão humana** (o que mais importa, ~30 min):
   - `topic.json`: leia `audience`, `off_topic` e `rubric_strong`, que definem o que o LLM aceita;
   - `queries.json`: buscas amplas demais trazem ruído; o volume de cada uma aparece no log;
   - `watchlist.json`: tire homônimos e gente fora do tema (veja `openalex_note`);
   - `sources.json`: complete as fontes sem feed. Três tipos: `rss` (com `pattern` opcional no título),
     `page` (links novos numa página de listagem; `pattern` na URL) e `sitemap`. Teste com o snippet
     em `tests/` ou rodando o tema com `--topic`.
3. **Primeira execução**: `python -m pawatch run --topic <slug>`; confira o digest e ajuste a barra
   (`selection.min_score`). Depois é só commitar: o cron diário roda todos os temas de `topics/`.

## Configuração (GitHub → Settings → Secrets and variables → Actions)

| Nome | Tipo | Obrigatório | Para quê |
|---|---|---|---|
| `HF_TOKEN` | secret | sim | token do Hugging Face com permissão *Make calls to Inference Providers* |
| `OPENALEX_API_KEY` | secret | recomendado | chave grátis (US$ 1/dia de cota) em https://openalex.org/settings/api. Sem ela, a cota é compartilhada por IP, e IPs de runner do GitHub são compartilhados |
| `CLOUDFLARE_API_TOKEN` | secret | p/ site | token com permissão *Cloudflare Pages: Edit* |
| `CLOUDFLARE_ACCOUNT_ID` | secret | p/ site | ID da conta Cloudflare |
| `DISCORD_WEBHOOK_URL` | secret | não | entrega do digest no Discord |
| `PAW_MODEL` | variable | não | modelo(s) HF, separados por vírgula (padrão: `deepseek-ai/DeepSeek-V4.1-Flash`, com fallback para Qwen3.5-122B e gpt-oss-120b) |
| `SITE_PASSWORD` | secret | p/ site | senha única do site; o workflow copia para o Pages a cada deploy. Sem ela o site fica fechado |
| `CF_PAGES_PROJECT` | variable | não | nome do projeto no Pages (padrão `people-analytics-watch`) |

Custo típico por dia e por tema: ~20 chamadas OpenAlex (≈ US$ 0,02 da cota) e ~60–90k tokens de LLM.

## Site no Cloudflare Pages (com senha)

- O workflow cria o projeto `people-analytics-watch` se ele não existir e faz o deploy a cada execução
  diária e quando `web/`, `topics/` ou `functions/` mudam. A raiz lista os temas; cada tema fica em `/<slug>/`.
- **Senha única**: `functions/_middleware.js` (Pages Functions) mostra uma tela de login e, com a senha
  certa, grava um cookie de 30 dias. A senha vem do secret `SITE_PASSWORD`. Para trocar:
  `gh secret set SITE_PASSWORD` e rode o workflow; todo mundo precisa entrar de novo.
- Teste local: `npx wrangler@3 pages dev dist --binding SITE_PASSWORD=teste` (depois de `python -m pawatch render`).
- Para acesso por e-mail individual em vez de senha, use Cloudflare Access (Zero Trust → Access → Applications).

## Evolução do estado da arte (aba "Evolução")

`python -m pawatch evolve [--topic X] [--if-stale] [--full]` monta a linha do tempo de cada tema:

1. **Rede de citações**: os mais citados de todos os tempos e desde 7 anos atrás de cada busca do tema,
   as obras mais citadas de **cada pesquisador da watchlist** (sem filtro de palavra-chave) e os papers
   dos digests; segue as referências duas camadas para trás e conta as citações dentro da rede.
   Versões da mesma obra (working paper NBER + artigo, preprint + artigo) são fundidas numa só.
2. **Candidatos por época** (até 1999, 2000–09, 2010–17, 2018–22, 2023+): ranqueados dentro da época,
   para trabalhos recentes competirem com os clássicos. Obras de autores da watchlist sempre vão à triagem.
3. **Triagem pelo LLM**: nota de "marco", descartando métodos genéricos (SEM, viés de método comum...) e
   obras de outros campos. Cada obra é julgada uma vez só (`data/<tema>/evolution_triage.json`).
4. **Redação**: narrativa por época, por que cada marco importa, onde estamos agora, perguntas em aberto,
   linha de evolução por tema.

**Incremental por padrão** (roda sozinho no 1º run diário de cada mês): épocas consolidadas (terminadas
há mais de 8 anos) mantêm os marcos e só admitem 1 obra inédita por mês com nota ≥ 8; épocas recentes
são reavaliadas com vantagem para os marcos atuais (sem troca por empate); textos de marcos mantidos não
são reescritos. Cada versão registra **o que mudou** (marcos que entraram/saíram + nota do LLM).
`--full` faz a **revisão completa**: refaz triagem e texto do zero, ainda registrando a diferença.
No GitHub: *Run workflow* → "Aba Evolução agora" = `incremental` ou `completa`.
Versões em `data/<tema>/evolution/AAAA-MM-DD.json`; markdown em `digests/<tema>/evolucao.md`.

## Ajustes comuns

- **Ampliar ou estreitar o escopo**: edite `topics/<tema>/queries.json` (sintaxe booleana do OpenAlex).
- **Barra de qualidade**: `selection.min_score` / `max_selected`.
- **Watchlist**: edite `topics/<tema>/watchlist.json`. Autores com `openalex_id` têm os papers novos puxados
  diretamente e ganham bônus na triagem e ⭐ no site.
- **Centros, reguladores e praticantes**: as fontes ficam em `topics/<tema>/sources.json` (`rss`, `page` ou `sitemap`).
  Itens delas ganham bônus no pré-filtro e 📌 no site. Para `page`/`sitemap`, a primeira execução
  só registra os links existentes; depois entram apenas os novos.
- **Refazer um dia**: `python -m pawatch run --date AAAA-MM-DD --force` (ou *Run workflow* com `force`).
