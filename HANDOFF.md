# Handoff (atualizado em 17/11/2026, fim do dia)

Site: https://people-analytics-watch.pages.dev (senha única: secret `SITE_PASSWORD`).
Temas em `topics/` (people analytics e fraude bancária). Detalhes no README; próximos passos no `ROADMAP.md`.

## No ar
- Digest diário (workflow `daily digest`, 08:30 BRT): coleta, triagem, digest, commit e deploy no Cloudflare Pages.
- Watchlist com links sociais (X, LinkedIn, Bluesky, Mastodon, newsletters) e feeds abertos como fontes
  (posts sociais filtrados por palavras do tema, no máximo 4 por perfil). Seção "Referências históricas"
  (falecidos/aposentados): fora do diário, dentro da Evolução.
- Aba Evolução (workflow `evolution`, dia 1 de cada mês, incremental). Revisão manual em Actions → evolution:
  `completa` (refaz seleção e texto com as notas do cache, ~2 min) ou `completa-rejulgando` (refaz a triagem, ~15 min).
  Épocas recentes: 8 marcos, até 4 do mesmo tema; consolidadas: 7, até 3.
- Feedback (👍/👎 e comentários) no Cloudflare KV `paw-feedback`, exportado para `data/<tema>/feedback.json`;
  perguntas da aba Pergunte em `data/<tema>/questions.json`.
- Aba Pergunte (`functions/api/ask.js`): responde só com o arquivo do tema, citando [n]; 20–40 s por resposta.

## Pendente
1. Testar no site, com a senha, um 👍 e uma pergunta na aba Pergunte. Se aparecer "armazenamento de feedback
   não configurado" ou "IA não configurada", o binding do KV ou o secret `HF_TOKEN` no Pages não pegou
   (ver passos "Feedback" e "Sync Pages secrets" no log do workflow).
2. Apagar no dashboard da Cloudflare (Workers & Pages → people-analytics-watch → Deployments) os dois deploys
   anteriores à senha, que continuam abertos: `7875faa1` e `9f0e5e61`.
3. Opcional: 9ª vaga em 2023+ para o experimento de trabalho híbrido de Bloom et al. (Nature, 2024), que saiu
   quando o Jagged Frontier voltou (`per_era_recent` em `src/pawatch/evolution.py`).
4. Roadmap: Febraban Tech pelo YouTube (decidir: só vídeos novos ou também o acervo) e o tema risco de crédito.

## Observações
- Prithwiraj Choudhury talvez tenha ido de HBS para a LSE em 2025 (watchlist ainda diz HBS).
- Jia Hu e Ning Li têm homônimos misturados no OpenAlex; a triagem descarta o que é de outra área.
- OpenAlex local: a cota anônima por IP acaba rápido; a chave fica em `~/.config/pawatch/openalex.env`
  (lida automaticamente) ou no secret `OPENALEX_API_KEY` do GitHub.
