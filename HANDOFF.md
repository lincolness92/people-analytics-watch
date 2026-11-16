# Handoff (16/11/2026)

## Feito
- Pipeline completo em `src/pawatch` (coleta OpenAlex + arXiv → triagem e redação com LLM de pesos abertos via HF → markdown + site). 8 testes passando.
- Watchlist curada em `config/watchlist.json`: 43 pesquisadores (EUA 24, China/Ásia 7, Europa 5, Brasil 5, outros 2), 15 journals, 12 centros e 9 praticantes. Todos com ID do OpenAlex verificado.
- Primeiro digest gerado: `digests/2026-11-16.md` (12 selecionados, modelo DeepSeek-V4.1-Flash, ~72k tokens).
- Repo privado criado, e o workflow de render passou no push.

## Pendente (faça nesta ordem)
1. ✅ **`HF_TOKEN`** (feito em 16/11, token "Codex" do `~/.hermes/.env`; 1ª execução manual ok): cadastrar como secret do repo, de preferência um token fine-grained só com "Make calls to Inference Providers": `gh secret set HF_TOKEN`. Sem ele, o cron diário (11:30 UTC) falha.
2. **`OPENALEX_API_KEY`**: chave grátis em https://openalex.org/settings/api, depois `gh secret set OPENALEX_API_KEY`. Recomendado: sem chave, o orçamento é compartilhado por IP.
3. **Cloudflare Pages** (o token salvo em `~/.config/raio-x/cloudflare.env` está inválido; gerar um novo):
   - `npx wrangler login`
   - `npx wrangler pages project create people-analytics-watch --production-branch main`
   - Secrets `CLOUDFLARE_API_TOKEN` (permissão Pages: Edit) e `CLOUDFLARE_ACCOUNT_ID`.
   - Depois, Cloudflare Access (Zero Trust → Applications → Self-hosted) em `people-analytics-watch.pages.dev`, liberando só o seu e-mail.
4. ✅ Workflow rodado à mão em 16/11 (509 candidatos, 12 selecionados). Falta conferir o deploy depois do passo 3. Rodar o workflow à mão: `gh workflow run "daily digest"` e conferir o deploy.
5. (Opcional) Secret `DISCORD_WEBHOOK_URL` para receber o digest no Discord, como no sota-watch.

## Observações
- Na watchlist, os registros de Jia Hu e Ning Li no OpenAlex misturam homônimos de outras áreas. A triagem descarta os papers fora do tema, mas vale ficar de olho no ⭐ deles.
- Barra atual: nota ≥7 e no máximo 12 por dia (`config/queries.json` → `selection`).
