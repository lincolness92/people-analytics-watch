# Roadmap

Próximos passos combinados (17/11/2026). A ordem é a sugerida; nada aqui está feito ainda.

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
Próximos: OAuth no MCP se algum cliente exigir (conectores remotos do Claude.ai pedem OAuth ou nenhuma auth);
streaming no A2A/ask; ferramentas que buscam fora do arquivo (OpenAlex/Semantic Scholar) quando ele não cobrir.

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
- ✅ Chave do OpenAlex ativa, com saldo pré-pago (US$ 10 em 17/11).
- ✅ Cloudflare Pages no ar, protegido por senha única (`SITE_PASSWORD`).
