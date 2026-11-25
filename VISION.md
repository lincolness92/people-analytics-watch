# Visão — Research Watch

> Rascunho de 25/11/2026, a partir da conversa entre o Lincoln e o Claude. Está aberto para discussão e ainda não
> foi fechado. Os três temas atuais (People Analytics, Fraude Bancária, Tecnologia Bancária) são casos de teste da
> plataforma, não o produto.

## Em uma frase

Uma plataforma que mantém, para qualquer tema, **a memória viva do estado da arte**: o que existe, o que funciona e
com qual evidência, quem faz, o que mudou, para onde vai e o que a regulação diz. Pessoas e agentes consultam essa
memória para **aprender, decidir e se preparar**.

## Para quem e para quê

| Quem | O que pergunta | O que precisa receber |
|---|---|---|
| Recém-chegado à equipe (ex.: cientista de dados indo para fraude) | "Estou entrando nessa área, me conta tudo" | Panorama, evolução, estado da arte, tendências, pessoas de referência, o que estudar primeiro |
| Especialista | "Qual o estado da arte em X? Funciona?" | Métodos, números contra baseline, dados, limitações, código |
| Gestor de área | "Meu projeto faz sentido?", "Monte um plano de qualificação" | Encaixe no estado da arte, casos parecidos, riscos, trilha de estudo |
| Diretor | "Para onde isso vai? Quem está fazendo?" | Tendências com evidência, casos de mercado, pessoas e instituições |
| Desenvolvedor | "Tem implementação? Por onde começo?" | Repositórios, papers correspondentes, dados de teste |
| Risco e compliance | "Como a regulação se encaixa nisso?" | Normas com data, o que mudou, o que exigem, como se ligam às técnicas |

## Princípios

1. **A pergunta vem primeiro.** Partimos das perguntas que as pessoas fazem (banco de perguntas de referência) e
   vamos atrás das fontes e da estrutura que permitem respondê-las. Fonte que não ajuda a responder nada é ruído.
2. **Tema é configuração, não código.** Um tema novo entra com um pacote: descrição, fontes, consultas, lista de
   referência e os campos das perguntas de referência. Qualquer pessoa pode pedir o seu "Watch".
3. **Agnóstico ao modelo, e medido.** Qualquer modelo pode responder. O que muda é a qualidade, que é medida sempre
   com as mesmas perguntas e o mesmo avaliador. A rota de cada chamada é escolhida pelo menor preço publicado.
4. **Determinístico onde dá.** O que é previsível (o panorama para quem chega, a evolução, as tendências do mês)
   é pré-computado por um modelo forte, revisado e guardado como resposta canônica. O agente ao vivo fica para o
   que é imprevisível.
5. **Mudar o ambiente, não o modelo.** Um modelo forte atua como professor. Ele avalia as respostas de modelos
   menores, diagnostica a falha (fonte, busca, síntese, formato), e nós mudamos o que está em volta do modelo:
   fontes, estrutura dos dados, índice, ferramentas, instruções. O objetivo é que um modelo pequeno responda de forma
   **rápida, barata e confiável**.
6. **Fontes completas e legítimas.** Pesquisa, indústria, regulação, código, notícias e pessoas, sempre por vias
   legais (APIs, cópias abertas, páginas públicas), e com o caminho de volta à fonte original em toda afirmação.
7. **Curadoria humana como sinal.** O dono do tema (um gestor e sua equipe) sugere e remove fontes, anota e corrige.
   Isso alimenta a triagem e as respostas.
8. **Portável.** O núcleo não depende de onde roda. Levar para outro ambiente (ex.: o trabalho) troca a
   hospedagem, os provedores de IA aprovados e a identidade, sem reescrever o sistema.

## Como funciona por baixo (camadas)

```
Fontes ─▶ Curadoria ─▶ Conhecimento ─▶ Respostas ─▶ Interfaces
```

- **Fontes:**
  - pesquisa: OpenAlex, arXiv direto, Semantic Scholar, Crossref;
  - regulação: Bacen, CMN, BIS/BCBS, FSB, FATF, EBA, FCA, NIST, AI Act;
  - indústria: relatórios, blogs de engenharia, eventos, vídeos;
  - código: GitHub, Hugging Face;
  - notícias;
  - pessoas: perfis acadêmicos e públicos.
- **Curadoria:** pré-filtro, triagem por IA com rubrica do tema e verificação de nomes; anotações do dono do tema.
- **Conhecimento** (a evoluir): de texto solto para um **grafo de entidades e afirmações**.
  - Entidades: paper, pessoa, instituição, revista ou evento, repositório, norma, notícia, conceito ou método, e
    habilidade.
  - Afirmações: "o método M, com os dados D, teve o resultado R contra o baseline B, com os limites L".
  - Daí saem as fichas de evidência e uma Evolução mais rigorosa, feita de afirmações que se acumulam ou se
    contradizem.
- **Respostas:**
  - canônicas pré-computadas (briefing de entrada, evolução, tendências, mapa de habilidades), atualizadas quando
    surge evidência nova;
  - agente ao vivo com **hierarquia de modelos**: primeiro o cache, depois um modelo pequeno, e um maior só quando
    a intenção ou a confiança pede;
  - dossiês sob demanda ("devo fazer este projeto?").
- **Interfaces:** site (notícias, tendências, evolução, pessoas, regulação), e-mail por tema e por pergunta
  ("me avise quando sair evidência nova sobre X"), e API, MCP e A2A para outros agentes.

## O laço de melhoria

1. **Perguntas de referência:** modelos genéricos por persona e intenção, preenchidos para cada tema
   (`evals/questions.json`), mais as perguntas reais do Pergunte.
2. **Rodada:** o agente responde (`evals/run.mjs`), com o modelo e a configuração em teste.
3. **Avaliação:** o professor dá nota pela rubrica e diz a causa da falha e quais fontes faltaram
   (`evals/judge.mjs`).
4. **Mudança no ambiente:** buscar a fonte que faltou, estruturar melhor, mudar a busca, o formato ou as
   instruções.
5. **Repetir e comparar** com a rodada anterior. Nada entra sem melhorar a nota ou baixar o custo.

## Ponte com habilidades (skills)

- **O que o Watch entrega:** a **demanda** de habilidades, ou seja, o que o estado da arte de um tema exige hoje e o
  que as tendências vão exigir, ligada a uma ontologia (ESCO, SFIA, O*NET) e às evidências.
- **O que a plataforma de avaliação e mentoria entrega:** a **oferta**, ou seja, quem tem quais habilidades, as
  trilhas e a medição. É uma plataforma separada, a construir.
- **O encontro das duas:** "monte o plano de qualificação", "quais são os gaps da equipe para este projeto",
  "quem está mais perto de tocar isto".
- **Dados de pessoas:** ficam na plataforma de avaliação, com governança própria. O Watch não guarda dados de
  colaboradores.

## Levar para o trabalho (depois)

O que muda: provedores de IA aprovados (a escolha por preço vale só dentro de uma lista fechada), hospedagem
interna, login corporativo, normas internas como fonte (com controle de acesso) e a integração com a plataforma de
habilidades. A estrutura é a mesma.

## Riscos e contrapontos

- **Escopo.** É muita coisa. Risco de fazer tudo raso. A ordem das fases abaixo existe para isso.
- **LinkedIn e X.** Raspar o LinkedIn viola os termos de uso, e a API do X é paga e restrita. Em compensação,
  perfis acadêmicos (OpenAlex, ORCID), sites institucionais, GitHub, Bluesky, Mastodon e Hacker News são abertos.
  Entra o que for legal; o resto fica de fora sem drama.
- **Indicar quem alocar num projeto** é uma decisão sobre pessoas: a LGPD dá direito a revisão de decisões
  automatizadas, e há risco de viés. Deve ser **apoio** à decisão de um gestor, nunca a decisão, e mora na
  plataforma de habilidades.
- **Perguntas revelam estratégia.** No trabalho, a pergunta de um diretor não pode ir para um provedor qualquer.
- **Qualidade de IA.** Sem avaliação contínua, a plataforma piora em silêncio. O laço de melhoria é obrigatório,
  não opcional.

## Fases

1. **Medir (agora).** Perguntas de referência, avaliador, rodada de base com o modelo atual e com um pequeno, e
   diagnóstico das falhas. *Primeira rodada feita em 25/11: a nota foi de 78 para 94; ver `evals/README.md`.*
2. **Responder bem às perguntas previsíveis.** Respostas por intenção (formato certo para cada uma), briefings
   canônicos por tema e hierarquia de modelos.
3. **Completar as fontes que as perguntas pedem.** Regulação, pessoas e instituições, indústria, código e
   notícias; comparar o OpenAlex com o arXiv direto e com o Firecrawl local.
4. **Estruturar o conhecimento.** Grafo de entidades e afirmações, e fichas de evidência.
5. **Abrir para outros.** Curadoria pelo dono do tema, criação de tema pedida por um gestor, assinaturas por e-mail
   e o site redesenhado.
6. **Ponte com habilidades.** Mapa de habilidades por tema, ligado a uma ontologia, e interface com a plataforma de
   avaliação e mentoria.

## Em aberto

- Quem é o primeiro usuário fora o Lincoln (um colega recém-chegado? um gestor?), para validar a fase 2.
- Que nota mínima no avaliador consideramos "bom o bastante" para um modelo pequeno.
- Ontologia de habilidades: ESCO (aberta, europeia), SFIA (paga, focada em tecnologia) ou O*NET (aberta, EUA).
