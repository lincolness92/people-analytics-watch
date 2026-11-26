# Handoff (atualizado em 26/11/2026)

Site: https://people-analytics-watch.pages.dev (senha única: secret `SITE_PASSWORD`).
Temas em `topics/`: people analytics, fraude bancária, tecnologia bancária e risco de crédito com IA (`risco-credito-ia`,
primeiro tema criado pela rotina "Peça o seu Watch", em PR para revisão). São casos de teste da plataforma, que
é genérica. A visão está em `VISION.md`, os detalhes no README e os próximos passos no `ROADMAP.md`.

## No ar

**Pipeline (GitHub Actions):**
- **Digest diário, 08:30 BRT.** Coleta, scorer v2 (relevância × qualidade, nota calculada em código), digest,
  normas do Bacen (incremental), traces em `data/traces/`, commit e deploy.
- **Mensal, dia 1:** Evolução e retrospectivas.

**Site (Cloudflare Pages):**
- Navegação de app no celular: Início, Novidades, Mapa, Pergunte e Mais.
- Busca global e aba Regulação.
- Microfone em todo campo de texto (Whisper pelo HF).

**Agente Pergunte:**
- Formato de resposta por intenção.
- Normas, pessoas, instituições e código na busca.
- Checagem de cobertura na 1ª frase.
- Rota de LLM pela menor tarifa publicada; resposta cortada conta como falha.
- Traces no KV.

**Avaliação:**
- `evals/`: o agente marca 82 no juiz calibrado (`evals/README.md`); scorer medido em `evals/scorer/`.

**Mapas de fontes:**
- `docs/sources/febraban.*` (74 itens).
- `docs/sources/associacoes-bancarias.*`: 121 organizações e 659 publicações; falta decidir como consumir.

## Pendente (do lado do Lincoln)
Lista viva, com passo a passo e marcação de feito: https://claude.ai/artifact/5V9oVVZwsDumq41RGR37xi (privada).
O Claude lê o que foi marcado.

1. Cloudflare Pages → Variables and Secrets:
   - Phoenix: `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` e `OTEL_EXPORTER_OTLP_HEADERS`;
   - opcional: `DEEPSEEK_API_KEY`;
   - voz de saída: `ELEVENLABS_API_KEY` e `ELEVENLABS_VOICE_ID`.
2. GitHub: os mesmos secrets de Phoenix e DeepSeek, passados no `env` dos workflows (exige o escopo `workflow`).
3. `GITHUB_TOKEN` no Pages (fine-grained, Issues read/write neste repositório), para ligar o "Peça o seu Watch".
4. API do X: quando houver, entra como fonte por tema.
5. Revisar a visão no documento editável https://claude.ai/artifact/JqYuvBZ5gnQkaVAgTZSXXd (decisões em aberto: nome,
   acesso por pessoa, token para o Claude acessar a aplicação, fontes, vídeos, próximo tema). Aprovado, vai para o `VISION.md`.
6. Testar no iPhone: o microfone (com o teclado aberto) e uma pergunta real no Pergunte do site novo.

## Próximo (do lado do Claude)
- Consumir as fontes mapeadas de prioridade alta (FEBRABAN e associações).
- Site, leva 2: sparklines por subtema, radar "onde apostar", páginas de técnica e de paper.
- Onboarding canônico pré-computado (a intenção mais fraca do agente depois da calibração).
- Código e dados por método, e validar a ligação repositório ↔ paper.

## Observações
- **Normas sem texto na API:** algumas normas do Bacen vêm sem texto e ficam sem ficha (fora do site).
- **Rota river:** essa rota da HF corta saídas longas mesmo com raciocínio "low". O cliente a rebaixa
  automaticamente depois da primeira falha.
- **Pré-filtro:** em janelas grandes (backfill), o pré-filtro de tecnologia bancária corta itens bons, porque as
  fontes web enchem as 220 vagas. No dia a dia não acontece (16–170 candidatos por dia).
- **`new-topic` sem rascunho do LLM (26/11):** o DeepSeek V4.1 Flash cortou a saída no limite de 9000 tokens nas
  quatro rotas, o Qwen 3.5 122B não tinha provedor habilitado na HF (já trocado na main) e o gpt-oss-120b não
  respondeu em 25 min. O
  rascunho do tema de crédito foi escrito à mão em `.draft.json`, que o `new-topic` reaproveita. Vale subir o
  `max_tokens` do rascunho ou dividi-lo em duas chamadas.
- **Normas do Bacen que escapam (26/11):** `bacen.types` de todos os temas não inclui o tipo "Resolução", que é como a
  API classifica as resoluções do CMN até 2020 (ex.: 4.557/2017). Além disso, a triagem lê só a ementa, e normas
  cuja ementa é "Altera a Resolução X" ficam com nota baixa (ex.: Res. BCB 610/2026, limites do rotativo).
- **OpenAlex:** a chave fica em `~/.config/pawatch/openalex.env` (local) ou no secret `OPENALEX_API_KEY`.
- **DeepSeek local:** a chave fica em `~/.config/pawatch/deepseek.env`.
- **Watchlist:**
  - Prithwiraj Choudhury talvez tenha ido de HBS para a LSE em 2025 (a watchlist ainda diz HBS).
  - Jia Hu e Ning Li têm homônimos misturados no OpenAlex; a triagem descarta o que é de outra área.
