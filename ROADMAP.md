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

## ✅ Retrospectiva anual por tema (aba "Anual")
Feito em 17/11/2026: destaques do ano, volume por subtema ano a ano e quem publica (academia × empresas ×
governo, instituições, países). Ideias: comparar Brasil × mundo nos números; incluir as fontes da web
(blogs de bancos, conferências) nos destaques do ano, hoje só entram papers.

## 4. Outros temas
- **Risco de crédito**: incluir IFRS 9 / perda esperada (IASB), Basileia (BCBS) e Bacen (Resolução
  CMN 4.966). `python -m pawatch new-topic "risco de crédito" --slug risco-credito`.

## Pendências de configuração
- ✅ Chave do OpenAlex ativa, com saldo pré-pago (US$ 10 em 17/11).
- ✅ Cloudflare Pages no ar, protegido por senha única (`SITE_PASSWORD`).
