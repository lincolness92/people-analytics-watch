# Front-end: referências e recomendações

*25/11/2026. Pesquisa de referências para o redesenho do site, pensado primeiro para o iPhone. Feita por um subagente; as
capturas de tela ficaram fora do repositório.*

## As 8 recomendações principais

1. **Navegação de app no celular.** O cabeçalho fixo de hoje ocupa ~170 px de 844 (marca, abas e seletor de tema) e as
   abas Anual, Watchlist e Pergunte ficam fora da tela sem sinal. A proposta é um cabeçalho de uma linha, com o tema
   como "pílula" que abre uma folha, e uma **barra inferior com 5 destinos**: Início, Novidades, Mapa, Pergunte, Mais.
2. **Home do tema que responde "o que importa agora"**, em vez de abrir direto no digest do dia, nesta ordem: o que
   mudou desde a última visita, o estado do campo numa frase, 3 a 5 conclusões numeradas, subtemas em alta e o radar
   resumido, os 3 melhores itens recentes, os próximos prazos regulatórios e "Comece por aqui".
3. **"Desde sua última visita"** (como o changelog do Linear ou do GitHub). A data fica no `localStorage`; a página mostra
   contadores e selos "novo" em itens, marcos e normas.
4. **Radar "onde apostar" por tema** (ThoughtWorks). Anéis Adotar / Experimentar / Avaliar / Cautela, cada técnica com
   justificativa e link para a evidência. No celular vira uma lista por anel. A página da técnica guarda o histórico
   de posições.
5. **Subtemas com sparkline e crescimento** (Exploding Topics, Epoch AI), no lugar da tabela de dois anos do Anual.
   Exige guardar a contagem por ano de 5 a 10 anos.
6. **Ficha da técnica como página-hub**: radar, sparkline, linha do tempo, evidências, código, pessoas e normas.
7. **Fichas de evidência** no formato "método · dados · resultado vs. baseline · limites" (Elicit, Consensus, scite),
   com o tipo de estudo e contadores "confirmam / contestam".
8. **Pergunte com fontes primeiro** (Perplexity, Consensus): exemplos por intenção e persona, campo fixo embaixo,
   citação que abre numa folha e perguntas relacionadas.

Ganhos rápidos: tirar modelo e custo do topo do digest, recolher a tendência do período, juntar Digest e Arquivo em
"Novidades" e criar uma busca global sobre o `search.json`.

## Referências

| Referência | Padrão a copiar | Parte do site |
|---|---|---|
| Our World in Data (ourworldindata.org/artificial-intelligence) | Molde fixo de página de tema; todo gráfico com aba "Fonte e método", link próprio e "Como citar" | Home do tema, Tendências, Anual |
| Stanford AI Index (hai.stanford.edu/ai-index) | "Top takeaways" numerados: afirmação, número, minigráfico e "ver capítulo" | Anual, Panorama, home |
| State of AI Report (stateof.ai) | Previsões do ano com placar no ano seguinte; eixos Pesquisa / Indústria / Política | Anual, Radar |
| Epoch AI Trends (epoch.ai/trends) | Cartão de tendência com número grande, frase de leitura, base e intervalo; selo "atualizado em"; CSV por gráfico | Tendências, Anual |
| Exploding Topics (explodingtopics.com) | Lista de subtemas com sparkline, crescimento % e status (emergente / em alta / estável / em queda) | Tendências, home |
| ThoughtWorks Technology Radar (thoughtworks.com/radar) | Anéis Adopt/Trial/Assess/Caution, lista por anel, página do item com histórico, edições | Radar, ficha da técnica |
| Hugging Face Papers (huggingface.co/papers/trending) | Selo de código (estrelas) em todo cartão de paper; seletor Dia / Semana / Mês; assinatura por e-mail | Novidades, Código |
| Semantic Scholar | Página de paper: TLDR, citações influentes, intenção da citação, relacionados, autores | Página de paper |
| Connected Papers, Litmaps, ResearchRabbit | Mapa no tempo (x = ano, tamanho = citações) no desktop; listas "antes / depois" no celular | Evolução, paper |
| Elicit (elicit.com) | Tabela papers × colunas (população, intervenção, resultado, limites) com o trecho de cada célula | Evidência |
| Consensus (consensus.app) | Medidor de consenso; selo de tipo de estudo; perguntas sugeridas por intenção; "use no seu agente" | Pergunte, Evidência |
| scite (scite.ai) | Citações que confirmam / contestam / mencionam | Evidência, Evolução |
| Perplexity | Resposta com fontes numeradas, campo fixo embaixo, citação em folha, relacionadas, link compartilhável | Pergunte |
| OECD.AI, AI Act Explorer, IAPP, FSB, BIS | Item de regulação com órgão, jurisdição, tipo, status e datas; linha do tempo de prazos; filtros por jurisdição | Regulação |
| roadmap.sh | Trilha de habilidades por papel, com progresso marcado | Comece por aqui, Habilidades |
| GitHub Trending e listas "awesome" | Repositórios por tarefa, com estrelas, atividade, licença e paper ligado | Código |
| TLDR, Axios, Hacker News | Cartão "o que é · por que importa · para quem"; tempo de leitura; modo compacto | Novidades, e-mail |
| Linear Changelog | Linha do tempo "o que mudou", com detalhes recolhidos por tipo | Home, Evolução |

O Gartner Hype Cycle entra só como selo de maturidade (pesquisa → piloto → produção → padrão), porque a curva não tem
base empírica. O Papers with Code foi descontinuado em 2025 e hoje redireciona para o Hugging Face Papers.

## Arquitetura de informação

- **Princípios:**
  - abas por objetivo, não por tipo de dado;
  - entidades com página própria e ligadas entre si (técnica, paper, pessoa, instituição, norma, repositório);
  - celular primeiro;
  - toda página e todo item com link próprio.
- **Celular:** cabeçalho de 1 linha (marca, pílula do tema, busca) e barra inferior.
  - **Início.**
  - **Novidades:** digest, arquivo e notícias.
  - **Mapa:** tendências e radar, Evolução e Anual.
  - **Pergunte.**
  - **Mais:** Comece por aqui, Evidência, Pessoas & instituições, Regulação, Código, Habilidades, Assinar, Sobre.
- **Rotas:** `#/`, `#/comece`, `#/novidades[/data]`, `#/mudancas`, `#/tendencias`, `#/tecnica/<slug>`, `#/evolucao`,
  `#/anual/<ano>`, `#/evidencias`, `#/paper/<id>`, `#/pessoas`, `#/pessoa/<slug>`, `#/instituicao/<slug>`,
  `#/regulacao`, `#/norma/<slug>`, `#/codigo`, `#/pergunte[/<id>]`.
- **Home do tema, de cima para baixo:**
  1. desde sua última visita;
  2. estado do campo;
  3. 3 a 5 conclusões numeradas;
  4. subtemas em alta;
  5. radar resumido;
  6. melhores da semana;
  7. próximos prazos regulatórios;
  8. "Novo por aqui?";
  9. Pergunte com exemplos;
  10. rodapé: assinar, como citar, MCP.
- **Ficha da técnica:** definição, anel do radar, maturidade e tendência. Em blocos: sparkline, por que está nesse anel,
  histórico, evidências, marcos, código, pessoas, normas, perguntas frequentes e "pergunte sobre esta técnica".
- **Página inicial multi-tema:** um cartão por tema com manchete, novidades desde a visita, movimento no radar,
  próximo prazo e sparkline do subtema em alta; "sinais que cruzam temas"; "peça o seu Watch".

## Componentes por onda

**Onda 1 (dados de hoje):**
- barra inferior e cabeçalho compacto;
- desde sua última visita;
- cartão de item v2 ("por que importa" em 1 linha, selos, alvos de toque ≥ 44 px);
- tendência recolhida;
- busca global;
- conclusões numeradas;
- "atualizado em" e folha "Sobre";
- Pergunte v2;
- cartão de repositório;
- seletor Dia / Semana / Mês.

**Onda 2 (campos novos no pipeline):**
- subtema com sparkline (série de 5 a 10 anos);
- radar por edição;
- ficha da técnica;
- linha do tempo de eras v2;
- cartão de pessoa v2;
- página de paper;
- "o que mudou";
- trilha "Comece por aqui".

**Onda 3 (grafo de afirmações e fontes novas):**
- ficha de evidência;
- confirmam / contestam e barra de consenso;
- item de regulação ligado a técnicas;
- linha do tempo de prazos;
- apostas do ano com placar;
- assinaturas por e-mail;
- cartão de notícia;
- sinais que cruzam temas.

**Implementação:**
- manter JS puro, com sparkline e radar em SVG feito à mão;
- dividir o `data.json` por página;
- folhas com `<dialog>`;
- respeitar safe-area e `prefers-reduced-motion`;
- estados vazios explicativos.

## O que manter e o que mudar no site atual

**Manter:**
- a identidade editorial (papel, serifa, acento terracota, coluna de 860 px);
- os tokens de cor, que o tema BB já mostra que funcionam;
- JS puro com rotas por hash;
- o selo de nota, o destaque da watchlist e o título original;
- o "O que mudou" da Evolução;
- o feedback 👍/👎;
- as citações numeradas;
- os chips com rolagem horizontal;
- `aria-live`.

**Mudar:**
- o cabeçalho de ~170 px e as abas escondidas;
- a primeira tela do digest, que não mostra nenhum item;
- os nomes das abas por tipo de dado;
- Digest e Arquivo duplicados;
- "Tendências", que hoje é uma lista de parágrafos;
- a tabela de crescimento difícil de ler no celular;
- a Watchlist como pilha longa sem busca;
- o seletor de tema como `<select>` que recarrega a página;
- emojis como ícones de interface;
- alvos de toque pequenos;
- o escuro, que só segue o sistema no tema padrão;
- o `data.json` único;
- a página multi-tema pobre;
- a falta de páginas de entidade, que faz todo link sair do site.

**Ordem sugerida:**
1. Onda 1 inteira.
2. Sparklines e radar (série anual por subtema e `radar.json` por edição).
3. Ficha da técnica e página de paper.
4. Evidência e regulação, conforme a extração amadurecer.
