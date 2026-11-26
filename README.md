# research-watch (repo `people-analytics-watch`)

Uma plataforma que mantém, para **qualquer tema**, a memória viva do estado da arte. Ela registra o que existe,
o que funciona e com qual evidência, quem faz, o que mudou, para onde vai e o que a regulação diz. Pessoas e
agentes consultam essa memória pelo site, pela caixinha Pergunte (com voz), por REST, MCP e A2A.

Cada tema é um pacote de configuração em `topics/<slug>/`. Os temas atuais são casos de teste da plataforma:
**People Analytics Watch**, **Bank Fraud Watch** e **Bank Tech & AI Watch**. A visão e as fases estão em
`VISION.md`; o que vem a seguir, em `ROADMAP.md`.

O pipeline roda no GitHub Actions; o site e as APIs, no Cloudflare Pages (Functions). Não há servidor próprio.

## Como funciona

```
08:30 BRT  GitHub Actions (.github/workflows/daily.yml)
  ├─ para cada tema em topics/:
  ├─ coleta    OpenAlex: buscas do tema + autores da watchlist + journals de elite
  │            arXiv: categorias e termos do tema
  │            fontes web dos centros e praticantes (RSS, páginas de listagem, sitemap)
  ├─ dedupe    por DOI/título contra data/<tema>/seen.json
  ├─ triagem   LLM dá relevância e qualidade (0–10), tipo de evidência e motivo; a nota sai em código
  │            (scorer v2, calibrado contra um modelo mais forte: evals/scorer/). Rota mais barata por preço publicado
  ├─ redação   LLM escreve resumo PT-BR dos selecionados, menções rápidas e tendência do dia
  ├─ grava     data/<tema>/digests/AAAA-MM-DD.json → digests/<tema>/AAAA-MM-DD.md + INDEX.md
  ├─ regulação normas do Bacen novas ou revogadas (incremental) → data/<tema>/regulation.json
  ├─ traces    cada execução em data/traces/ (e no Phoenix, se configurado)
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
| `topics/<tema>/regulation.json` | termos de busca de normas no Bacen e marcos regulatórios internacionais do tema |
| `src/pawatch/` | pipeline (stdlib pura, sem dependências): `collect`, `web`, `score`, `llm`, `regulation`, `trace`, `render`, `bundle`, `topic`, `bootstrap`, `evolution`, `annual`, `fulltext` |
| `server/` | núcleo do lado do servidor (agente, busca, LLM por preço, voz, traces, OAuth); `functions/` são só adaptadores HTTP |
| `web/` | site estático (HTML/CSS/JS puro), lê `data.json` e `search.json` |
| `data/<tema>/regulation.json` | normas do Bacen triadas e com ficha (o que exige, a quem, vigência, técnicas) |
| `data/papers/` | textos completos e catálogo de repositórios, compartilhados entre temas |
| `data/traces/` | traces do pipeline (60 dias na árvore) |
| `evals/` | perguntas de referência, rodadas, juiz calibrado, calibrações e avaliação do scorer |
| `docs/design/`, `docs/sources/` | referências de design do site; mapas de fontes: FEBRABAN (74 itens) e associações bancárias do mundo (121 organizações, 659 publicações) |
| `VISION.md` | visão do projeto (rascunho em discussão) |
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
python -m pawatch regulation [--topic X]       # normas do Bacen (triagem + ficha); também roda dentro do run
python -m pawatch traces [--export]            # traces guardados do pipeline; --export manda ao Phoenix
node evals/run.mjs --label X && node evals/judge.mjs evals/runs/<data>-X.json   # avaliar o agente
PYTHONPATH=src python evals/scorer_eval.py --labels evals/scorer/2026-11-25-fable-labels.json  # avaliar o scorer
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
| `DEEPSEEK_API_KEY` | secret | não | plataforma da DeepSeek: entra na comparação de preço com os provedores da HF. Local: `~/.config/pawatch/deepseek.env` |
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

## Site

O site é pensado primeiro para o celular. No iPhone, o cabeçalho tem uma linha (o tema abre a lista de temas, a lupa
abre a busca) e a barra inferior tem cinco destinos:

- **Início:** o que mudou desde a sua última visita, o estado do campo, as conclusões do ano, os melhores itens
  recentes, as últimas normas e perguntas de exemplo.
- **Novidades:** o digest por período e o arquivo.
- **Mapa:** Tendências, Evolução e Anual.
- **Pergunte:** a caixinha de IA, com exemplos por tipo de pergunta.
- **Mais:** Regulação, Pessoas & instituições, Arquivo e Sobre.

A busca global usa o `search.json` (BM25) e agrupa os resultados por tipo. Todo campo de texto tem microfone (veja
"Voz"). No desktop, os mesmos destinos ficam no topo. As referências e as próximas levas (sparklines por subtema,
radar "onde apostar", páginas de técnica e de paper) estão em `docs/design/front-references.md`.

## Regulação (aba "Regulação")

- **Brasil:** normativos do Banco Central e do CMN, pelas APIs oficiais de busca e de texto completo, com os termos
  de cada tema em `topics/<tema>/regulation.json`.
  - As versões repetidas de manuais viram um item só.
  - O LLM dá uma nota de relevância pelo assunto da norma. Para as relevantes, faz uma ficha a partir do texto
    oficial: o que exige (com artigo), a quem se aplica, vigência e técnicas afetadas.
  - A cada execução, revogações e cancelamentos são atualizados.
- **Internacional:** marcos escolhidos pela curadoria, com links verificados. Onde a situação atual é incerta, o
  item vem marcado "verificar".
- **Onde aparece:** as normas entram na busca do agente (tipo "norma") e têm formato próprio de resposta. A
  atualização roda dentro do `run` diário; o backfill inicial custou centavos.

## Avaliação (laço de melhoria)

As mudanças no agente e no scorer são medidas, não intuídas.

- **Agente:** perguntas de referência por persona e intenção (`evals/questions.json`), uma rodada offline e um juiz
  calibrado contra um modelo mais forte (`evals/judge.mjs`, que confere as citações). Histórico em `evals/README.md`.
- **Scorer de papers:** uma amostra rotulada por um modelo mais forte (`evals/scorer/`), medida com
  `evals/scorer_eval.py`. O scorer v2 levou a precisão do digest de 0,34 para 0,71.

## Custos de LLM: rota escolhida por preço

Não há provedor principal nem reserva: antes de cada chamada, o cliente (`src/pawatch/llm.py` no pipeline,
`server/llm.js` no site) compara o preço publicado de cada rota para o modelo e usa a mais barata naquele momento.

- **Hugging Face** (`HF_TOKEN`): `GET /v1/models` traz, por modelo, cada provedor ativo com o preço por 1M tokens de
  entrada e saída. A rota é `modelo:provedor`.
- **DeepSeek direta** (`DEEPSEEK_API_KEY`): `GET /models` traz os nomes (`deepseek-flash` = DeepSeek-V4.1-Flash). A
  API não informa preço; ele é lido da página oficial (`api-docs.deepseek.com/quick_start/pricing.md`), com o
  horário de pico que ela publica.
- **Estimativa:** o custo de cada rota é estimado pelo tamanho do prompt e pela saída esperada daquela chamada, na
  hora atual (pico ou não). Ganha a menor estimativa. Se a rota falha, vai a próxima mais barata (até 4 por modelo)
  e só depois o próximo modelo da lista.
- **Filtros de qualidade:** provedor ativo, com suporte a JSON (no pipeline), uptime ≥ 97% no último dia e sem
  quantização de 4 bits (`PAW_ALLOW_4BIT=1` libera).
- **Tabela atualizada:** os preços são buscados uma vez por hora. Se uma fonte falhar, vale a tabela embutida.
- **`PAW_MODEL`:** define a ordem de qualidade dos modelos. Uma entrada já com rota (`modelo:provedor` ou
  `deepseek:deepseek-flash`) fixa a rota.
- **Custo registrado:** cada chamada registra tokens e custo (a HF informa `usage.cost`; na DeepSeek o custo vem da
  tabela). O total aparece em `stats.tokens.cost_usd` do digest (e no site), da Evolução e da retrospectiva, e em
  `llm.cost.total` nos traces. O log da execução mostra o ranking de rotas.

Horários da DeepSeek direta (preço cheio no pico, metade fora dele):

| | UTC | Brasília (UTC−3) |
|---|---|---|
| Pico (seg–sex) | 01:00–04:00 e 06:00–10:00 | 22:00–01:00 (dom–qui à noite) e 03:00–07:00 (seg–sex) |
| Mais barato | todo o resto, e o fim de semana inteiro | 07:00–22:00 nos dias úteis, e o fim de semana inteiro |

Os agendamentos rodam no horário barato: digest diário às 11:30 UTC (08:30 BRT), Evolução e retrospectiva no dia 1
às 13:00 UTC (10:00 BRT). Disparos manuais funcionam a qualquer hora, sempre pela rota mais barata do momento.
Em 18/11/2026, para o DeepSeek-V4.1-Flash, os provedores mais baratos na HF ficavam em US$ 0,10–0,14 por 1M de
entrada e US$ 0,42–0,60 de saída; a DeepSeek direta fora do pico cobrava 0,15/0,60, e no pico 0,30/1,20. Ela ganha
quando os provedores da HF ficam mais caros ou falham. A DeepSeek não tem API de batch.

## Observabilidade (traces do agente e do pipeline)

Cada pergunta (aba Pergunte, `ask_archive` no MCP/REST, A2A) e cada chamada de ferramenta vira um trace
OpenTelemetry com as convenções **OpenInference** (`server/trace.js`), com um span por etapa:
`ask` (AGENT) → `expand_terms` (LLM) → `search` (RETRIEVER, com os documentos e as notas BM25) → `fulltext`
(RETRIEVER, trechos) → `answer` (LLM: mensagens, modelo, tokens, tentativas e quedas para o modelo reserva).

- **Nunca se perde**: o trace completo vai junto do registro da pergunta no KV (`ask:*` → exportado todo dia
  para `data/<tema>/questions.json`, com termos, fontes, resposta e spans).
- **Backend OTLP** (Arize Phoenix por padrão; Langfuse e outros servem): envio em OTLP/HTTP **protobuf**, por um
  codificador próprio sem dependências (o runtime do Cloudflare não roda o SDK do OTel), depois da resposta
  (`waitUntil`). Variáveis do Pages (*Workers & Pages → people-analytics-watch → Settings → Variables and
  Secrets*): `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` (ex.: `https://app.phoenix.arize.com/s/<espaço>/v1/traces`),
  `OTEL_EXPORTER_OTLP_HEADERS` (ex.: `Authorization=Bearer <chave>` ou `api_key=<chave>`), opcionais
  `PHOENIX_PROJECT_NAME` e `OTEL_EXPORTER_OTLP_PROTOCOL=http/json` (para backends que preferem JSON).
- Testado contra o Phoenix 21 local: os 5 spans chegam com tipos, documentos, tokens e modelos.

### Traces do pipeline (digest, Evolução, retrospectiva, regulação)

Os comandos `run`, `evolve`, `annual`, `regulation`, `fulltext` e `new-topic` também geram traces
(`src/pawatch/trace.py`, mesmas convenções). A estrutura de cada execução é:

- um span AGENT por comando;
- um span CHAIN por tema e etapa: `collect` (candidatos por origem), `triage` (histograma de notas), `write_digest`
  e `regulation`;
- um span LLM por chamada: mensagens, rota escolhida, tokens, custo e tentativas (com `finish_reason`).

O destino dos traces:

- **No repositório:** cada execução fica em `data/traces/<data>-<comando>.jsonl.gz`. O workflow já commita `data/`.
  Os arquivos com mais de 60 dias saem da árvore, mas continuam no histórico do git.
- **No backend:** o envio por OTLP acontece quando as variáveis `OTEL_EXPORTER_OTLP_*` estão no ambiente. No GitHub
  Actions, isso exige criar os secrets e passá-los no `env` do workflow.
- **Envio posterior:** `python -m pawatch traces` lista o que está guardado; `python -m pawatch traces --export
  [--since AAAA-MM-DD]` manda tudo para o Phoenix de qualquer máquina que tenha as variáveis.
- **Validação:** a codificação protobuf é idêntica à do `server/trace.js` (há um teste que compara as duas), e o
  envio foi testado contra o Phoenix local.

## Voz: falar em vez de digitar, e ouvir as respostas

- **Entrada (todos os campos de texto do site):** um botão de microfone grava e transcreve. O navegador decodifica a
  gravação e envia WAV mono 16 kHz, porque o provedor não lê o `audio/mp4` do iPhone. A transcrição vai para
  `POST /api/stt`, que usa Whisper large-v3-turbo no Hugging Face Inference Providers, com o large-v3 de reserva.
  Precisa só do `HF_TOKEN` que já existe. Opcional: `STT_MODEL`, para outros modelos na frente. O limite é de 120
  transcrições por pessoa por dia e ~90 s por gravação.
- **Saída (respostas do Pergunte):** o botão "Ouvir" aparece quando o Pages tem `ELEVENLABS_API_KEY` (secret).
  Opcionais: `ELEVENLABS_VOICE_ID` (padrão: uma voz pronta) e `ELEVENLABS_MODEL` (padrão `eleven_flash_v2_5`,
  multilíngue e de baixa latência). O texto vai sem marcas de citação nem markdown; o limite é de 60 leituras por
  pessoa por dia.
- O código fica em `server/voice.js`, `functions/api/stt.js` e `functions/api/tts.js`. No pacote offline, a voz não aparece.

## Ajustes comuns

- **Ampliar ou estreitar o escopo**: edite `topics/<tema>/queries.json` (sintaxe booleana do OpenAlex).
- **Barra de qualidade**: `selection.min_score` / `max_selected`.
- **Watchlist**: edite `topics/<tema>/watchlist.json`. Autores com `openalex_id` têm os papers novos puxados
  diretamente e ganham bônus na triagem e ⭐ no site.
- **Centros, reguladores e praticantes**: as fontes ficam em `topics/<tema>/sources.json` (`rss`, `page` ou `sitemap`).
  Itens delas ganham bônus no pré-filtro e 📌 no site. Para `page`/`sitemap`, a primeira execução
  só registra os links existentes; depois entram apenas os novos.
- **Refazer um dia**: `python -m pawatch run --date AAAA-MM-DD --force` (ou *Run workflow* com `force`).
