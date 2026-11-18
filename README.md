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

## Feedback dos leitores

Cada paper e marco tem 👍/👎 e "comentar"; digests, Evolução e Watchlist têm uma caixa de comentário no
fim (nome opcional, lembrado no navegador). `functions/api/feedback.js` grava no Cloudflare KV
(namespace `paw-feedback`, binding `FEEDBACK`). A cada execução dos workflows, `python -m pawatch feedback`
garante o namespace, gera o `wrangler.toml` com o binding (não versionado) e exporta o que chegou para
`data/<tema>/feedback.json` (o voto mais recente de cada pessoa por item é o que vale) e as perguntas feitas
à IA para `data/<tema>/questions.json`. No HTML offline o feedback fica escondido.

## Arquitetura do lado do servidor

Quatro camadas; a regra é que a lógica fica no núcleo e cada protocolo é um adaptador fino por cima dele:

```
1. Pipeline (Python, src/pawatch/)      coleta, triagem, digest, Evolução, retrospectiva, biblioteca
2. Dados publicados (por tema)          dist/<tema>/data.json e library.json: o contrato entre as camadas
3. Núcleo (JS, server/)                 archive.js: loadArchive, search, getDigest, getEvolution, getAnnual,
                                        getPaper, listTopics (sem HTTP, sem LLM)
                                        agent.js: o agente de perguntas, cliente do núcleo; o LLM é injetado
                                        llm.js: cliente do provedor de LLM (só ele conhece a Hugging Face)
4. Adaptadores (functions/)             api/ask.js (aba Pergunte). Futuros: REST v1, MCP, A2A — cada
                                        ferramenta/endpoint chama uma função do núcleo
```

`server/` fica fora de `functions/` porque o Cloudflare Pages transforma cada arquivo de `functions/` em rota;
o empacotador segue os imports. Testes do núcleo e do adaptador: `node --test tests/js/*.test.mjs` (rodam também
dentro de `python -m unittest`, quando há node).

## Integrações: REST v1, MCP e A2A

Três portas de entrada para scripts e outros agentes, todas sobre o mesmo catálogo de ferramentas
(`server/tools.js`): `list_topics`, `search_archive`, `list_digests`, `get_digest`, `get_evolution`,
`get_annual_review`, `get_paper` e `ask_archive` (o agente da aba Pergunte; limite de 40 por cliente por dia).

- **Token**: cada cliente tem um token nomeado, derivado da senha do site (HMAC; nenhum secret novo). Com o
  login do site feito, abra `/__api-token?name=<cliente>` (ex.: `claude-desktop`); ou rode
  `SITE_PASSWORD=... python -m pawatch api-token <cliente>`. Revogar: nome em `REVOKED` (`server/auth.js`) ou
  na variável `API_REVOKED` do Pages; trocar a senha do site revoga todos.
- **REST v1** (`functions/api/v1/[[path]].js`): `GET /api/v1/topics`, `/topics/<tema>/search?q=...`,
  `/digests`, `/digests/latest|AAAA-MM-DD`, `/evolution`, `/annual[/<ano>]`, `/paper?url=...`,
  `POST /topics/<tema>/ask {"question": "..."}`, `GET /api/v1/tools`. Header `Authorization: Bearer <token>`.
- **MCP** (`functions/mcp.js`): Streamable HTTP em `POST /mcp`, sem estado, respostas JSON. Duas formas de auth:
  - **OAuth 2.1** (`server/oauth.js`, `functions/oauth/`), para Claude.ai e qualquer cliente MCP com OAuth: basta
    adicionar o conector com a URL `https://<site>/mcp`. O cliente descobre tudo pelo 401 (`WWW-Authenticate` →
    `/.well-known/oauth-protected-resource` → `/.well-known/oauth-authorization-server`), registra-se sozinho
    (`/oauth/register`), e a pessoa faz login com a senha do site e aprova numa tela de consentimento
    (`/oauth/authorize`, PKCE S256). Token de acesso de 1 h, renovação por 30 dias, presos ao recurso `/mcp`.
    Sem estado nem secret novo: tudo assinado com chave derivada da senha (trocá-la revoga tudo); o KV só
    garante uso único do código. Revogar um cliente: `oauth-<nome>` (ex.: `oauth-claude`) em `API_REVOKED`.
  - **Token nomeado** no header, para clientes que aceitam: `claude mcp add --transport http research-watch
    https://<site>/mcp --header "Authorization: Bearer <token>"`.
- **A2A** (`server/a2a.js`, `functions/a2a.js`): agent card público em `/.well-known/agent-card.json`;
  `message/send` em `POST /a2a`, com o tema em `message.metadata.topic`; responde com o texto e uma parte
  `data` com as fontes.
- O site continua atrás da senha; só essas rotas usam token (`functions/_middleware.js`).

Contratos dos arquivos publicados: `schemas/data.schema.json`, `library.schema.json` e `search.schema.json`
(testados contra o que o pipeline gera). A busca usa o índice pré-calculado `<tema>/search.json`
(`src/pawatch/searchindex.py`), com os mesmos resultados do BM25 antigo e 2–5× mais rápido.

## Pergunte (caixinha de IA)

Aba "Pergunte": `functions/api/ask.js` responde perguntas sobre o tema usando só o arquivo dele (papers dos
digests, menções rápidas, marcos e textos da Evolução, tendências, retrospectivas anuais e a **biblioteca**),
citando as fontes como [n]. A biblioteca (`data/<tema>/library/<AAAA-MM>.json`, publicada como
`<tema>/library.json`, que as páginas não carregam) guarda todo paper que a triagem avaliou com nota ≥ 5, com
o resumo original: os do digest diário, os da retrospectiva anual e, na carga inicial, os da rede da Evolução.
O agente recebe no máximo 2.500 por tema (maior nota e mais recentes primeiro), com resumos de até 800 caracteres.
Fluxo: o LLM expande a pergunta em termos PT+EN → ranking BM25 sobre o arquivo do tema → o LLM responde só
com as 18 melhores fontes (e diz quando o arquivo não cobre o assunto). Aceita perguntas de seguimento
(as 2 últimas trocas vão junto). Limite de 40 perguntas por pessoa por dia. O `HF_TOKEN` e a `SITE_PASSWORD`
são copiados para os secrets do Pages a cada deploy. Resposta em ~20–40 s (duas chamadas ao LLM).
Teste local: crie `.dev.vars` (não versionado) com `SITE_PASSWORD=...` e `HF_TOKEN=...` e rode
`npx wrangler@3 pages dev dist --kv FEEDBACK`.

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

**Incremental por padrão** (workflow `evolution`, sozinho no dia 1 de cada mês, limite de 2h30): épocas consolidadas (terminadas
há mais de 8 anos) mantêm os marcos e só admitem 1 obra inédita por mês com nota ≥ 8; épocas recentes
são reavaliadas com vantagem para os marcos atuais (sem troca por empate); textos de marcos mantidos não
são reescritos. Cada versão registra **o que mudou** (marcos que entraram/saíram + nota do LLM).
`--full` faz a **revisão completa**: refaz triagem e texto do zero, ainda registrando a diferença.
No GitHub: *Actions → evolution → Run workflow*, modo `incremental` ou `completa` (e, se quiser, um tema só). A triagem roda 4 lotes em paralelo.
Versões em `data/<tema>/evolution/AAAA-MM-DD.json`; markdown em `digests/<tema>/evolucao.md`.

### Referências históricas

`watchlist.json` → `historical`: pesquisadores falecidos ou aposentados que não publicam mais. Saem do
monitoramento diário (sem busca de papers novos, sem feeds, sem ⭐), mas suas obras mais citadas
entram como sementes da Evolução e sempre chegam à triagem; como cada obra é julgada uma vez só
(cache), elas não custam nada nos meses seguintes. Campos: os mesmos de `researchers` mais
`status` ("falecido" | "aposentado") e `since` (ano). Aparecem numa seção própria da aba Watchlist.
Ao mover alguém para cá, tire também os feeds dela de `sources.json`.

## Retrospectiva anual (aba "Anual")

`python -m pawatch annual [--topic X] [--year 2025 2026]` gera, por tema e por ano (padrão: o ano passado e
o atual), em `data/<tema>/annual/<ano>.json` e `digests/<tema>/anual-<ano>.md`:

- **Destaques do ano**: as obras mais citadas do ano em cada busca do tema e dos pesquisadores da watchlist,
  ranqueadas por velocidade de citação (citações por mês desde a publicação, para não punir papers recentes),
  triadas pelo mesmo LLM do digest (nota ≥ 7, no máximo 4 por tema, até 15).
- **Volume por subtema**: quantas obras cada busca encontra no ano e no anterior; o ano em curso é projetado
  para 12 meses (o OpenAlex indexa com atraso, então a variação recente sai subestimada).
- **Quem publica**: setores (academia, empresas, governo...), instituições, países e empresas, a partir das
  afiliações dos autores.
- **Síntese do LLM** (panorama, 3–5 tendências, onde a inovação acontece), presa a esses três blocos de dados;
  ids e chaves internas que vazem no texto são removidos.

Roda sozinha todo mês junto com a Evolução (`evolve`): o ano corrente sempre, o anterior uma vez (ou de novo
com `--full`). Custo: ~US$ 0,05–0,07 de OpenAlex e ~60–100 mil tokens por tema e ano.

## Texto completo dos papers e repositórios de código

`python -m pawatch fulltext [--topic X] [--refresh] [--limit N]` (roda sozinho todo mês, junto com a Evolução):

- **Quais papers**: todos os marcos da Evolução e os destaques das retrospectivas anuais, de todos os temas.
  Cada paper é guardado **uma vez** em `data/papers/<chave>.json` (chave = arXiv ou DOI), e o
  `data/papers/index.json` registra em que temas e papéis ele aparece — um paper de IA citado em dois temas não
  é baixado duas vezes.
- **De onde vem o texto**, na ordem: HTML do arXiv (arxiv.org/html, ar5iv) → XML do Europe PMC → PDFs abertos
  listados pelo OpenAlex (repositórios primeiro) → página da editora. **Só cópias abertas e legais**; paper sem
  cópia aberta fica só com o resumo (o índice diz o motivo). Sem dependências: o PDF é lido por
  `src/pawatch/pdftext.py` (só `zlib` da biblioteca padrão: object streams, ToUnicode, ligaduras do TeX, TJ).
- **O que fica guardado**: até 80 mil caracteres por paper, em seções (introdução, método, resultados,
  conclusão...); referências e apêndices ficam de fora. O texto é para uso privado do agente (repositório
  privado e site com senha), não para redistribuição.
- **Repositórios**: links para GitHub, GitLab, Bitbucket, Hugging Face, Zenodo, OSF, Code Ocean, Figshare e Kaggle
  encontrados no texto (e no Hugging Face papers, para arXiv), com a marca `own` quando a frase diz que é o
  código do próprio paper. Ficam em `data/papers/repos.json` com estrelas, linguagem, último push, licença,
  URL de clone e o começo do README (API do GitHub com `GITHUB_TOKEN`/`gh auth token`, se houver).
- **Quem usa**: o agente da aba Pergunte junta trechos do texto completo dos papers mais relevantes às fontes
  da resposta; no catálogo de ferramentas (REST/MCP/A2A) entram `read_paper` (texto, uma seção, ou os trechos
  mais relevantes para uma pergunta) e `list_repos` (para um cliente com terminal, como o Claude Code, clonar e
  ler a implementação; o agente do site, que roda no Cloudflare, lê o README já baixado).

## Ajustes comuns

- **Ampliar ou estreitar o escopo**: edite `topics/<tema>/queries.json` (sintaxe booleana do OpenAlex).
- **Barra de qualidade**: `selection.min_score` / `max_selected`.
- **Watchlist**: edite `topics/<tema>/watchlist.json`. Autores com `openalex_id` têm os papers novos puxados
  diretamente e ganham bônus na triagem e ⭐ no site.
- **Centros, reguladores e praticantes**: as fontes ficam em `topics/<tema>/sources.json` (`rss`, `page` ou `sitemap`).
  Itens delas ganham bônus no pré-filtro e 📌 no site. Para `page`/`sitemap`, a primeira execução
  só registra os links existentes; depois entram apenas os novos.
- **Refazer um dia**: `python -m pawatch run --date AAAA-MM-DD --force` (ou *Run workflow* com `force`).
