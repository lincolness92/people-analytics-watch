# Roadmap

Próximos passos combinados (atualizado em 26/11/2026). Os itens com ✅ estão feitos; o bloco "Próximos" no fim de
"Feito em 25–26/11" é a fila atual.

## 1. Febraban Tech pelo YouTube (tema fraude bancária)
- Acompanhar o que rolou na Febraban Tech a partir do canal oficial no YouTube.
- Caminho: o YouTube tem feed RSS por canal (`https://www.youtube.com/feeds/videos.xml?channel_id=<id>`),
  que já funciona como fonte `rss` em `topics/fraude-bancaria/sources.json`. Para o conteúdo das
  palestras, falta pegar a transcrição de cada vídeo (legenda automática) e mandá-la como "resumo"
  para a triagem; vídeos longos precisam de um resumo intermediário pelo LLM.
- Decidir: só vídeos novos (cron) ou também o acervo das edições anteriores (carga única).

## 2. ✅ Evolução do estado da arte por tema (aba "Evolução" no site)
Feito em 17/11/2026: `python -m pawatch evolve`, mensal e incremental, com revisão completa sob
demanda (`--full`). Detalhes no README, seção "Evolução do estado da arte".

## 3. ✅ Caixinha para conversar com a IA sobre o tema
Feito em 17/11/2026: aba "Pergunte" (`functions/api/ask.js`), atrás da senha, citando os papers do
arquivo. Junto veio o feedback dos leitores (👍/👎 e comentários, exportados para `data/<tema>/`).
Ideias: usar o feedback para calibrar a triagem; respostas em streaming para reduzir a espera.
18/11: o agente passou a ler as retrospectivas anuais e a biblioteca de papers triados (nota ≥ 5, com resumo
original). Próximo passo possível: ler a versão aberta (PDF legal) dos papers selecionados para responder com
detalhes de método; e, se o arquivo crescer muito, trocar o BM25 no Worker por um índice pré-calculado.

## ✅ Retrospectiva anual por tema (aba "Anual")
Feito em 17/11/2026: destaques do ano, volume por subtema ano a ano e quem publica (academia × empresas ×
governo, instituições, países). Ideias: comparar Brasil × mundo nos números; incluir as fontes da web
(blogs de bancos, conferências) nos destaques do ano, hoje só entram papers.

## 4. Outros temas
- **Risco de crédito**: incluir IFRS 9 / perda esperada (IASB), Basileia (BCBS) e Bacen (Resolução
  CMN 4.966). `python -m pawatch new-topic "risco de crédito" --slug risco-credito`.

## 6. Arquitetura para integrações (MCP, A2A, REST)
Combinado em 18/11: núcleo de consulta único + adaptadores finos (ver README, "Arquitetura do lado do servidor").
1. ✅ Núcleo extraído: `server/archive.js` (consultas), `server/agent.js` (agente), `server/llm.js` (provedor);
   `functions/api/ask.js` virou adaptador. Testes em `tests/js/`.
2. ✅ Schemas em `schemas/` (testados contra os arquivos gerados) + índice de busca pré-calculado (`search.json`).
3. ✅ REST `v1` com tokens nomeados (`server/auth.js`, derivados da senha do site; página `/__api-token`).
4. ✅ MCP (`/mcp`) e A2A (`/a2a` + agent card), sobre o catálogo único `server/tools.js`.
5. ✅ OAuth 2.1 no MCP (descoberta, registro dinâmico, PKCE, refresh), para conectores do Claude.ai.
Próximos: streaming no A2A/ask; ferramentas que buscam fora do arquivo (OpenAlex/Semantic Scholar) quando ele não cobrir.

## ✅ Texto completo e repositórios (18/11/2026)
Marcos e destaques com texto aberto em `data/papers/` (sem duplicar entre temas), PDF lido sem dependências,
repositórios catalogados; ferramentas `read_paper` e `list_repos`. Ideias: estender aos itens com nota ≥ 8 dos
digests; ler também o código (árvore de arquivos e arquivos principais) no pipeline, para o agente do site.

## ✅ Observabilidade (18/11/2026)
Traces OpenTelemetry/OpenInference do agente e das ferramentas, guardados no KV e enviados em OTLP protobuf ao
Phoenix. Próximos: criar o espaço no Phoenix Cloud e pôr as variáveis no Pages; mandar os 👍/👎 dos leitores
como anotações dos spans; avaliações automáticas no Phoenix (relevância da busca, resposta fiel às fontes);
traces do pipeline em Python (triagem, redação) com o mesmo formato.

## Feito em 25–26/11/2026
- ✅ Regulação: normas do Bacen (triagem + ficha), marcos internacionais, aba no site, intenção própria no agente.
- ✅ Avaliação: juiz v2 calibrado (Fable); agente 76 → 82 no juiz calibrado. Scorer v2 (relevância × qualidade,
  âncoras, 1200 caracteres): precisão do digest 0,34 → 0,71.
- ✅ Traces do pipeline (data/traces/ + OTLP), além dos do agente.
- ✅ Site, leva 1: navegação de app, Início, cartões v2, busca global, Pergunte v2, Sobre.
- ✅ Voz: microfone em todos os campos (Whisper via HF); "Ouvir" e conversa por voz com um agente da ElevenLabs
  no Pergunte; conversas viram traces (`pawatch voz`).
- ✅ Mapas de fontes: FEBRABAN (74 itens, `docs/sources/febraban.*`) e associações bancárias do mundo (121 organizações,
  659 publicações, 319 com RSS ou sitemap; `docs/sources/associacoes-bancarias.*`). Falta decidir como consumir.
- ✅ Peça o seu Watch: pedido no site → issue → rotina do Claude (rascunho, revisão Fable, coleta, PR) → revisão humana.
  Primeiro teste de ponta a ponta: issue #1 → PR #2 (Credit Risk AI Watch), aguardando revisão. Falta o
  `GITHUB_TOKEN` no Pages para o formulário do site abrir a issue sozinho.
- ✅ Redesenho do site: quatro direções (Carta, Carteira, Sinal, Grifo) no ar em `/<tema>/designs/`; a Carta é o
  padrão, com três peles (papel, grafite, oceano); o site clássico e as outras ficam a um clique (`?design=`).
- Próximos: consumir as fontes mapeadas (prioridade alta primeiro); site leva 2 (sparklines, radar, páginas de
  técnica e de paper); onboarding canônico pré-computado; código e dados por método; validar ligação repo↔paper.

## Inteligência sobre instituições financeiras (proposta de 28/11/2026, em mapeamento)
Ideias do Lincoln, detalhadas no documento da visão: leis e regulação ampliada; ligação com ontologias formais
(ou a nossa, onde faltar); armazenamento, visualizador e processamento eficientes (Rust onde valer); finanças
públicas de bancos e IFs (Brasil primeiro, depois os principais do mundo), cada empresa do conglomerado;
mercados, geografia, produtos; cadeias de suprimentos e fatores externos (clima, agro, macro) ligados aos fatos
relevantes; oportunidades e propostas com premissas, cenários, custos, ROI e prazo; metodologias de
precificação e ganho; reprodução de papers e testes de hipótese.
⏳ Três mapeamentos em andamento (fontes, extração, viabilidade, recomendação): `docs/sources/leis-ontologias-formatos.*`,
`docs/sources/financas-instituicoes.*`, `docs/sources/fatores-externos-e-propostas.*`.

## Avaliação e laço de melhoria (25/11/2026)
Atualização: juiz v2 calibrado (a nota honesta da v3 é 76); a v4, com normas no acervo e as correções da calibração, chega a 82.
Próximos pontos fracos: código (falta fonte: datasets e repositórios por método, validar ligação repo↔paper), onboarding
(caiu de 83 para 70: mistura fontes de outros temas e trata fase da Evolução como marco → resposta canônica pré-computada
a partir da Evolução e da retrospectiva) e estado da arte. Normas sem ficha (texto vazio na API) ficam fora do site.
Revisar o scorer de papers com o mesmo laço (amostra julgada por um modelo forte, concordância com a triagem).
✅ Perguntas de referência por persona e intenção, rodada offline e juiz por rubrica (`evals/`). A nota foi de 78 para 94.
Próximos, na ordem que as falhas pedem:
1. **Fontes de regulação:** normativos do Bacen e do CMN, BIS/BCBS, FSB, FATF, EBA, ANPD e AI Act, como fonte própria de cada tema
   bancário. Liga norma a técnica.
2. **Casos da indústria:** relatórios de bancos e fintechs, blogs de engenharia, eventos (Febraban Tech) e imprensa de negócios.
3. **Código e dados:** datasets públicos e repositórios por método, além dos que aparecem nos papers.
4. **Calibrar o juiz** com uma amostra avaliada por um modelo mais forte. Tornar a rodada mensal e automática.
5. **Respostas canônicas pré-computadas** (briefing de entrada, plano de qualificação, mapa de habilidades por tema) e
   hierarquia de modelos (cache → pequeno → grande).

## Custo de LLM (18/11/2026)
✅ Custo por chamada registrado (digest, Evolução, retrospectiva, traces).
✅ Rota escolhida por preço a cada chamada: provedores da HF (`/v1/models`) e DeepSeek direta (página de preços, pico e
fora do pico).

Para o Actions incluir a DeepSeek na comparação, falta o secret `DEEPSEEK_API_KEY` e passá-lo no `env` do workflow.
No site, falta o secret no Pages.

Próximos passos possíveis:
- Contar o cache de entrada da DeepSeek (prompts de sistema repetidos na triagem) na estimativa.
- Comparar entre modelos diferentes, não só entre rotas do mesmo modelo, com uma nota de qualidade por modelo.
- Batch (Together, Fireworks) se o volume crescer.

## 5. Reduzir a dependência paga do OpenAlex (avaliado em 18/11/2026)

**Situação**: a chave grátis do OpenAlex dá US$ 1/dia, e o uso normal cabe nela: digest ≈ US$ 0,02 por tema/dia;
Evolução ≈ US$ 0,05 e retrospectiva ≈ US$ 0,06 por tema e ano, uma vez por mês. O saldo pré-pago (US$ 10 em
17/11) só foi preciso porque o dia teve muitas execuções de teste. O OpenAlex usa a cota grátis do dia antes do
saldo pago.

**Alternativas gratuitas testadas**:
- **Semantic Scholar (api.semanticscholar.org)**: a melhor substituta para *busca*. A `paper/search/bulk` aceita
  busca booleana (`"a" | "b"`, `+`, aspas) com filtro de ano e devolve o total (serve para o volume por subtema).
  Na amostra (fraude em cartões, 2026): 88% com resumo e 73% com link de PDF aberto. Tem citações, referências e
  IDs de autor, o que basta para a Evolução. Sem chave, o limite é compartilhado e dá 429 já na 2ª chamada;
  precisa da chave grátis (1 req/s), pedida em semanticscholar.org/product/api. Fraco em afiliações (país e tipo
  de instituição), então o bloco "quem publica" da retrospectiva perderia qualidade.
- **Crossref (api.crossref.org)**: grátis e sem chave. A busca é por relevância, sem booleano: "credit card
  fraud detection" trouxe 19 mil resultados em 7 semanas, então é ruim para descobrir papers. É ótima para
  "o que saiu de novo nos journals da watchlist" (filtro por ISSN e data). Na amostra: 54% com resumo, 38% com
  afiliação, 44% com referências abertas.
- **arXiv**: grátis e já usado. Só cobre preprints (CS, econ, q-fin); não cobre journals de gestão e finanças
  nem working papers de SSRN e NBER.
- **Complementos grátis**: RSS de working papers do NBER; Unpaywall (link legal de PDF aberto por DOI);
  snapshot completo do OpenAlex no S3 (grátis, centenas de GB), útil para análises pesadas pontuais.

**Plano sugerido, se quiser zerar o custo**:
1. Registrar o gasto diário do OpenAlex (o cabeçalho `x-ratelimit-remaining-usd` já vem em toda resposta) e
   avisar quando um dia passar da cota grátis.
2. Quando a cota grátis do dia acabar, cair para o Semantic Scholar nas buscas e na Evolução, em vez de usar
   o saldo pago. Crossref fica para os journals da watchlist.
3. Manter o OpenAlex só onde ele é insubstituível: afiliações (setor e país) na retrospectiva anual e
   validação de pesquisadores no `new-topic`.

## Pendências de configuração
- ⏳ Cloudflare Pages (Settings → Variables and Secrets): `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` e
  `OTEL_EXPORTER_OTLP_HEADERS` (Phoenix), `PHOENIX_PROJECT_NAME` (opcional), `DEEPSEEK_API_KEY` (opcional, entra na
  comparação de preço do agente), `ELEVENLABS_API_KEY` e `ELEVENLABS_VOICE_ID` (voz de saída).
- ⏳ Cloudflare Pages: `GITHUB_TOKEN` (fine-grained, Issues read/write neste repositório) para o "Peça o seu Watch".
- ⏳ GitHub Actions: para o pipeline mandar traces ao Phoenix e usar a DeepSeek direta, criar os secrets e passá-los
  no `env` dos workflows (editar workflow exige o escopo `workflow`).
- ✅ Chave do OpenAlex ativa, com saldo pré-pago (US$ 10 em 17/11).
- ✅ Cloudflare Pages no ar, protegido por senha única (`SITE_PASSWORD`).
