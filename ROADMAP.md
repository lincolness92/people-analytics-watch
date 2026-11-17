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

## 3. Caixinha para conversar com a IA sobre o tema
- Campo no site: a pergunta vai a uma função no Cloudflare Pages (que guarda o `HF_TOKEN`), que busca
  os papers relevantes do arquivo do tema e responde citando-os com link.
- Fica atrás da mesma senha do site (middleware em `functions/`). Depende de concluir a configuração da Cloudflare.
- Não funciona no HTML autocontido (offline), só no site publicado.

## 4. Outros temas
- **Risco de crédito**: incluir IFRS 9 / perda esperada (IASB), Basileia (BCBS) e Bacen (Resolução
  CMN 4.966). `python -m pawatch new-topic "risco de crédito" --slug risco-credito`.

## Pendências de configuração
- Ativar a chave do OpenAlex (e-mail "Activate your OpenAlex API key"). Já está como secret.
- ✅ Cloudflare Pages no ar, protegido por senha única (`SITE_PASSWORD`).
