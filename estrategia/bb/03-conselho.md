# Protocolo do conselho de modelos (v0)

Rascunho de **28/11/2026**. O conselho é um grupo de modelos de famílias diferentes que **estressa** o plano antes
de qualquer teste com dados e antes de qualquer proposta. Ele não decide nem estabelece fatos. Serve para achar
o que o primeiro rascunho deixou passar: premissa mal formulada, explicação alternativa, teste fraco, limiar
frouxo, fato sem fonte.

Uma ressalva de origem: a versão v0 de `00-mapa.md`, `01-premissas.md` e `02-concorrentes.md` foi escrita pelo
Claude Fable 5.2. A cadeira do Fable no conselho **não é independente** em relação a esse texto, e o protocolo
trata disso (seção 3, rodada R1).

## 1. Princípios

1. **O modelo propõe, o código mede, a pessoa aprova.** É a regra de `docs/sources/fatores-externos-e-propostas.md`
   §2.6. O conselho só atua na primeira parte.
2. **Dossiê fechado.** Todos recebem exatamente o mesmo material, com versão e hash. Ninguém navega na web
   durante as rodadas. Número que não está no dossiê é marcado "sem fonte" e descartado na agregação.
3. **Independência antes de debate.** Cada modelo gera sozinho antes de ver qualquer coisa dos outros.
4. **Crítica cega.** Quem critica não sabe quem escreveu. Quem julga não sabe quem escreveu nem quem criticou.
5. **Desacordo é resultado.** Não se tira média para escondê-lo. Desacordo sobre **fato** só se resolve com dado
   ou fonte primária, nunca por voto.
6. **Magnitude não vem de modelo.** Elasticidade, participação e probabilidade ditas "de cabeça" não entram
   em proposta (mesma tabela de confiança do §2.6 citado acima).
7. **Tudo registrado.** Prompt, resposta, modelo, rota, tokens e custo de cada chamada, no formato de traces que
   o repositório já usa (`data/traces/`).

## 2. As cadeiras

Preços consultados em 28/11/2026. Os dos modelos Claude vêm da tabela de preços da Anthropic com data de
03/11/2026; os dos modelos abertos, da listagem `/v1/models` do roteador da Hugging Face, por provedor.

| Cadeira | Modelo e rota | Preço por milhão de tokens (entrada / saída) | Observações de operação |
|---|---|---|---|
| A | **Claude Opus 5.5**, `claude-opus-5-5`, API da Anthropic | US$ 4 / 20 | Fixar `effort: high` (o padrão do modelo é `medium`). Sem `temperature`. Saída em JSON por saída estruturada, não por chamada de ferramenta forçada |
| B | **Claude Fable 5.2**, `claude-fable-5-2`, API da Anthropic | US$ 8 / 40 | Raciocínio sempre ligado; `effort: high`. Mesmas restrições. Exige retenção de dados de 30 dias (relevante ao levar para o trabalho) |
| C | **DeepSeek V4 Pro**, `deepseek-ai/DeepSeek-V4-Pro`, roteador da HF (ou API direta da DeepSeek) | US$ 0,39–1,91 / 1,58–3,96 conforme o provedor (referência usada abaixo: 1,30 / 2,60) | Já é o juiz das avaliações do repositório (`evals/README.md`). A rota é escolhida por preço em `src/pawatch/llm.py` |
| D | **O maior Qwen do roteador**: em 28/11/2026, `Qwen/Qwen3.8-2.4T-A95B` | US$ 2 / 6 (dois provedores) | **Testar antes**: `llm.py` registra que um Qwen grande "é listado pela HF mas recusado pelo roteador". Reserva: `Qwen/Qwen3.5-397B-A17B` (US$ 0,45 / 3,00) |
| E | **Gemini**, só se houver chave do Google | a consultar | Sem chave, a cadeira fica vazia. O protocolo funciona com 4 |

Pontos a decidir antes da primeira rodada:

- **O repositório não tem cliente para a API da Anthropic** (`llm.py` cobre o roteador da HF e a DeepSeek). As
  cadeiras A e B precisam de um adaptador novo com o SDK oficial ou de sessões do Claude Code rodando o papel.
  Decisão humana H0.
- **Recusa.** Se uma chamada voltar com motivo de parada "recusa", a cadeira fica registrada como ausente naquele
  item. Não se troca de modelo em silêncio.
- **Mesma tarefa, mesma instrução.** O prompt é idêntico para todas as cadeiras. Como os modelos Claude não
  aceitam `temperature`, a diversidade vem das famílias diferentes e dos contextos separados, não de amostragem.
- **Lote.** As cadeiras A e B rodam pela API de lotes (metade do preço), porque nenhuma rodada tem pressa.

## 3. As rodadas

```
R0 dossiê ──▶ R1 geração independente ──▶ R2 crítica cega ──▶ R3 réplica ──▶ R4 juízes ──▶ R5 agregação
   (H1)            (A: do zero; B: revisão)    (red team)                        (rubrica)       (H2)
                                                                                                  │
                         testes com dados (camada data/ifs e fontes mapeadas) ◀──────────────────┘
                                          │
                                          ▼
                              R6 leitura dos resultados ──▶ (H3) veredito ──▶ propostas (H4)
```

### R0. Dossiê congelado
- **Conteúdo.** (a) Os fatos de `00-mapa.md` §0 e os anexos; (b) as tabelas de participação da camada de dados
  (`data/ifs/shares/`), já validadas; (c) os trechos das fontes primárias que sustentam cada fato (fato relevante,
  release, boletim); (d) a lista de fontes disponíveis para teste, tirada de `docs/sources/*.json`.
- **Formato.** Um JSON com fatos numerados (`F-001`…), cada um com valor, unidade, data, fonte e trecho.
- **Controle.** Versão e SHA-256. Qualquer mudança gera dossiê novo e rodada nova.
- **Ponto humano H1.** Uma pessoa aprova o dossiê: confere uma amostra dos fatos contra a fonte primária.

### R1. Geração independente, em dois braços
- **Braço A, do zero.** Cada cadeira recebe **só o dossiê** (sem o registro de premissas) e a pergunta Q0 do mapa.
  Entrega: sua árvore de perguntas e suas 15 premissas de maior valor, no esquema da seção 5. Mede o que a v0
  deixou de ver e evita ancoragem.
- **Braço B, revisão.** Depois de entregar o braço A, a cadeira recebe o registro v0 e, para cada premissa,
  devolve: probabilidade de ser verdadeira (0 a 1), a melhor explicação alternativa, o teste que considera mais
  decisivo, e se o limiar proposto está frouxo, justo ou apertado.
- **Cadeira B (Fable).** Faz o braço A normalmente. No braço B, sua avaliação das premissas da v0 é guardada, mas
  **não entra** na mediana de probabilidade, por não ser independente do texto.

### R2. Crítica cega: red team por premissa
- **O que entra.** Todas as premissas: as 55 da v0 mais as novas do braço A, depois de juntar as duplicadas (a
  junção é feita por código e conferida por uma pessoa).
- **Anonimato.** As premissas vão em campos estruturados, sem nome de modelo e sem o texto livre original.
- **Distribuição.** Cada premissa recebe **2 críticos** de famílias diferentes da de quem a escreveu. As
  premissas da v0 contam como escritas pela cadeira B.
- **Roteiro do crítico** (obrigatório, nesta ordem):
  1. o melhor argumento a favor do **contrário** da premissa;
  2. a explicação alternativa mais plausível para a evidência citada;
  3. o que pode estar errado nos dados (perímetro, quebra de série, dupla contagem, defasagem, seleção);
  4. o teste mais barato que **refutaria** a premissa, com fonte do dossiê;
  5. se o limiar de "confirma" e de "refuta" pode ser manipulado depois de ver o dado;
  6. se a decisão realmente muda entre verdadeiro e falso;
  7. veredito: mantém, reformula (com texto novo), divide em duas, funde com outra, ou descarta.
- **Recebe só o recorte.** O crítico vê a premissa e os fatos do dossiê ligados a ela, não o dossiê inteiro.

### R3. Réplica (uma vez só)
O autor de cada premissa vê as duas críticas, ainda anônimas, e responde: aceita e reformula, aceita em parte ou
contesta com argumento. Não há segunda réplica. Para as premissas da v0, quem responde é a cadeira B.

### R4. Juízes com rubrica
- **Dois juízes de famílias diferentes** (B e C por padrão). Cada um julga todas as premissas, sem saber autor
  nem críticos. Alternativa mais barata: trocar o juiz B pela cadeira A (ver custos).
- **Rubrica**, nota de 0 a 3 em cada critério:

| Critério | 0 | 3 |
|---|---|---|
| **Testável** | Não há fonte pública que meça | Fonte, série, métrica, período e comparação estão nomeados e existem no dossiê |
| **Refutável** | Qualquer resultado confirma | Limiar numérico de confirmação e de refutação, fixado antes |
| **Decisória** | Verdadeira ou falsa, nada muda | Cada resultado leva a uma decisão diferente e nomeada |
| **Fundamentada** | Fato sem fonte ou número inventado | Todo fato citado está no dossiê e confere |
| **Só dado público** | Depende de dado interno do BB | Depende só de fonte pública |
| **Confundimento tratado** | Ignora a explicação alternativa óbvia | O teste separa a premissa da alternativa (controle, placebo, comparação) |

- **Conferência de citações.** O juiz confere pelo menos 3 fatos de cada premissa contra o dossiê e tem **teto de
  nota** quando encontra número sem apoio. É a lição da calibração do juiz do repositório (`evals/README.md`:
  o juiz v1 dava 17 pontos a mais e não conferia citações).
- **Calibração.** Antes de valer, os dois juízes dão nota a 10 premissas que uma pessoa também avaliou. A rodada
  só segue se a diferença média absoluta para a pessoa for de até 3 pontos em 18.

### R5. Agregação (por código, sem modelo)
Para cada premissa:
- nota dos juízes (soma de 0 a 18, média dos dois) e diferença entre eles;
- mediana e intervalo interquartil das probabilidades do braço B (sem a cadeira B nas premissas da v0);
- vereditos dos críticos e resultado da réplica;
- **classe**: *consenso* (intervalo ≤ 0,2 e juízes a até 3 pontos); *disputa* (intervalo > 0,2, ou juízes a mais de
  3 pontos, ou crítica contestada na réplica); *órfã* (proposta por uma só cadeira e ainda sem crítica);
- **prioridade de teste** = valor de decisão (os três eixos de `01-premissas.md`) × incerteza (probabilidade
  mediana perto de 0,5 vale mais) × nota de testabilidade.

Uma chamada final ao modelo redige o resumo da rodada a partir das tabelas, sem poder alterar notas.

**Ponto humano H2.** A pessoa escolhe quais premissas vão a teste, fixa os limiares (pré-registro) e decide o
que fazer com cada disputa: testar, reformular ou arquivar.

### R6. Leitura dos resultados (depois dos testes com dados)
Cada cadeira recebe as tabelas de resultado e os limiares pré-registrados e classifica cada premissa como
confirmada, refutada ou inconclusiva, com justificativa presa aos números. Onde as cadeiras divergem na leitura de
um mesmo número, abre-se um desacordo do tipo "interpretação". **Ponto humano H3:** a pessoa dá o veredito.

## 4. Pontos de decisão humana

| Ponto | Quando | O que a pessoa decide |
|---|---|---|
| **H0** | Antes de tudo | Orçamento por rodada, cadeiras ativas, forma de acesso aos modelos Claude, se há chave do Google |
| **H1** | Fim de R0 | Aprova o dossiê (amostra de fatos conferida na fonte primária) |
| **H2** | Fim de R5 | Seleciona premissas, fixa limiares, encaminha disputas |
| **H3** | Fim de R6 | Veredito de cada premissa testada |
| **H4** | Antes de cada proposta | Aprova que uma premissa confirmada vire proposta no modelo de `04-proximos-passos.md` |

Regra de parada: se uma rodada passar do teto de custo aprovado em H0, ela é interrompida e o que já foi
produzido fica registrado como parcial.

## 5. Formatos de saída

Tudo em JSON Lines, um arquivo por tipo e por rodada, em `estrategia/bb/conselho/R<n>/` (pasta a criar na
primeira rodada). As cadeiras aparecem como `c1`…`c5`; o mapa cadeira → modelo fica num arquivo separado, que os
críticos e os juízes não recebem.

```json
// premissas.jsonl
{"id": "P02", "versao": 2, "origem": "v0|R1A", "autor": "c2", "mercado": "agro",
 "enunciado": "...", "por_que_importa": "...",
 "teste": {"fontes": ["ifdata", "scr_data", "sicor"], "metrica": "...", "periodo": "2014T1-2026T3", "comparacao": "..."},
 "confirma_se": "...", "refuta_se": "...",
 "decisao": {"se_verdadeira": "...", "se_falsa": "..."},
 "fatos": ["F-017", "F-023"], "valor_decisao": {"tamanho": 3, "incerteza": 3, "alavanca": 3}}

// revisoes.jsonl  (braço B de R1)
{"premissa": "P02", "cadeira": "c3", "prob_verdadeira": 0.55, "alternativa": "...",
 "teste_decisivo": "...", "limiar": "frouxo|justo|apertado", "numeros_sem_fonte": []}

// criticas.jsonl  (R2)
{"premissa": "P02", "critico": "c4", "contrario": "...", "alternativa": "...", "riscos_de_dado": ["..."],
 "teste_que_refuta": {"fontes": ["..."], "descricao": "..."}, "limiar_manipulavel": true,
 "decisao_muda": true, "veredito": "mantem|reformula|divide|funde|descarta", "texto_novo": null}

// replicas.jsonl  (R3)
{"premissa": "P02", "autor": "c2", "resposta": "aceita|aceita_em_parte|contesta", "argumento": "...", "versao_nova": 3}

// julgamentos.jsonl  (R4)
{"premissa": "P02", "juiz": "j1", "notas": {"testavel": 3, "refutavel": 2, "decisoria": 3, "fundamentada": 2,
 "so_publico": 3, "confundimento": 1}, "citacoes_conferidas": ["F-017", "F-023", "F-031"],
 "sem_apoio": ["..."], "teto_aplicado": false, "comentario": "..."}

// agregado.json  (R5)
{"rodada": 1, "dossie": {"versao": "2026-12-xx", "sha256": "..."},
 "premissas": [{"id": "P02", "nota_media": 14.0, "dif_juizes": 2, "prob_mediana": 0.55, "iqr": 0.25,
                "classe": "disputa", "prioridade_teste": 0.81, "desacordos": ["D-004"]}],
 "custo_usd": {"R1": 0.0, "R2": 0.0, "R3": 0.0, "R4": 0.0, "R5": 0.0}}
```

## 6. Como os desacordos são registrados

Arquivo `desacordos.jsonl`, que **atravessa as rodadas** (um desacordo aberto em R2 pode ser fechado em R6).

```json
{"id": "D-004", "premissa": "P02", "aberto_em": "R2",
 "tipo": "fato|interpretacao|metodo|limiar|valor_decisao",
 "posicoes": [{"cadeira": "c1", "posicao": "a diferença de inadimplência some com controle de porte"},
              {"cadeira": "c4", "posicao": "sobra diferença por causa da garantia e do limite por produtor"}],
 "o_que_resolveria": "painel instituição × UF × trimestre com SCR.data por porte; limiar de 2 p.p.",
 "estado": "aberto|resolvido_por_dado|resolvido_por_humano|mantido",
 "resolucao": null, "fechado_em": null}
```

Regras:
- **Tipo "fato".** Só fecha com dado ou fonte primária (`resolvido_por_dado`). Voto de modelo não fecha.
- **Tipos "método" e "limiar".** A pessoa decide em H2 e a decisão fica escrita (`resolvido_por_humano`).
- **Tipo "interpretação".** Pode ficar `mantido`. Nesse caso, a proposta que depender dele carrega as duas
  leituras como cenários.
- Todo desacordo traz o campo `o_que_resolveria`. Sem ele, é opinião e não entra no registro.
- O relatório de cada rodada lista os desacordos abertos **antes** dos consensos.

## 7. Custo estimado por rodada

Hipóteses (a medir na primeira rodada, pois o custo real fica nos traces):

- dossiê de fatos de 25 mil tokens (fatos, tabelas da camada de dados, trechos de fonte e lista de fontes) e
  registro v0 de 17 mil tokens (medido: `01-premissas.md` tem cerca de 53 KB);
- 70 premissas depois da junção (55 da v0 mais as novas);
- a saída inclui o raciocínio, que é cobrado como saída;
- preços da seção 2; para a cadeira C, 1,30 / 2,60.

| Rodada | Chamadas | Tokens por chamada (entrada / saída) | A Opus 5.5 | B Fable 5.2 | C DeepSeek | D Qwen | Total |
|---|---|---|---|---|---|---|---|
| R1 geração (dois braços) | 8 (2 por cadeira) | 75 mil / 30 mil por cadeira, somando os braços | 0,90 | 1,80 | 0,18 | 0,33 | **3,21** |
| R2 crítica (2 por premissa) | 140 (35 por cadeira) | 6 mil / 3 mil | 2,94 | 5,88 | 0,55 | 1,05 | **10,42** |
| R3 réplica | 70 | 8 mil / 2 mil | 1,26 | 2,52 | 0,27 | 0,49 | **4,54** |
| R4 juízes (B e C) | 140 | 12 mil / 2,5 mil | — | 13,72 | 1,55 | — | **15,27** |
| R5 resumo | 1 | 60 mil / 10 mil | — | 0,88 | — | — | **0,88** |
| **Rodada completa** | 359 | | 5,10 | 24,80 | 2,55 | 1,87 | **US$ 34,32** |

- **Com a API de lotes nas cadeiras A e B** (metade do preço): cerca de **US$ 19**.
- **Trocando o juiz B pela cadeira A** em R4: R4 cai de US$ 15,27 para US$ 8,41, e a rodada, para cerca de US$ 27
  (US$ 16 com lotes). Perde-se o juiz mais forte; a calibração de R4 diz se a perda importa.
- **Faixa realista:** de US$ 15 a US$ 60, porque o volume de raciocínio varia muito entre modelos e tarefas.
  **Teto sugerido para H0: US$ 80 por rodada.**
- **R6** custa perto de R1: cerca de US$ 3.
- Uma cadeira E (Gemini) acrescenta uma coluna em R1, R2 e R3; o preço depende da tabela do Google no dia.
- Para comparação: uma rodada de avaliação do agente do repositório custa cerca de US$ 0,07 (`evals/README.md`).
  O conselho custa centenas de vezes mais e deve rodar poucas vezes: uma na v0, uma depois dos testes e uma
  por lote de propostas.

O maior custo é o juiz. O maior risco não é o custo: é um juiz benevolente dar nota alta a premissas bem escritas e
mal fundamentadas. Por isso a calibração de R4 vem antes da economia.

## 8. O que o conselho não faz

- Não estabelece fato. Fato vem do dossiê, e o dossiê vem de fonte pública conferida.
- Não fornece magnitude. Toda magnitude sai de dado.
- Não substitui o teste com dados. Uma premissa com nota máxima e não testada continua sendo hipótese.
- Não decide. Os cinco pontos H são de pessoas.
- Não usa informação interna do BB. Se uma cadeira alegar saber algo "de dentro", o item é descartado.

## 9. Ao levar para o trabalho

As perguntas de um plano como este revelam estratégia (`VISION.md`, "Riscos e contrapontos"). Em ambiente
corporativo, as cadeiras passam a ser só os provedores aprovados, o dossiê pode incluir dado interno com controle
de acesso, e as regras de retenção de cada provedor entram na escolha das cadeiras. A estrutura das rodadas não muda.
