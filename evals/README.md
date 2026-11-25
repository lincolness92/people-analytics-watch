# Avaliação: perguntas de referência

Medimos o agente (Pergunte, API, MCP) sempre com as mesmas perguntas e o mesmo avaliador. Nada entra sem melhorar a
nota ou baixar o custo. Faz parte do laço de melhoria descrito em `VISION.md`.

- `questions.json`: modelos de pergunta por persona e intenção, cada um com a rubrica do que uma boa resposta cobre.
  São preenchidos por tema (um tema novo só preenche os campos). Inclui também as perguntas reais do Pergunte.
- `run.mjs`: roda as perguntas pelo agente, offline, sobre o site gerado (`python -m pawatch render` antes).
- `judge.mjs`: um modelo mais forte (o "professor") dá nota pela rubrica. Para cada resposta, aponta a causa principal
  do que faltou (fontes, síntese ou formato) e quais fontes teriam permitido responder.

```
node evals/run.mjs --label minha-mudanca [--model "Qwen/Qwen3.8-27B"]
node evals/judge.mjs evals/runs/<data>-minha-mudanca.json
```

O arquivo `*.judged.json` vai para o git (o histórico de rodadas). O bruto, com os blocos de fontes, fica só local.

## Rodadas (25/11/2026, 46 perguntas, juiz DeepSeek V4 Pro)

| Rodada | Nota | Custo das respostas | Tempo mediano | O que mudou |
|---|---|---|---|---|
| baseline | 78 | US$ 0,077 | 17 s | — (16 respostas saíram cortadas) |
| v2-sem-corte | 86 | US$ 0,067 | 11 s | orçamento de tokens maior, raciocínio "low", resposta cortada conta como falha de rota |
| qwen27b | 82 | US$ 0,096 | 33 s | o mesmo, com Qwen3.8-27B no lugar do DeepSeek V4.1 Flash |
| v3 | 94 | US$ 0,074 | — | formato da resposta por intenção; pessoas, instituições e repositórios de código entram na busca |

Por intenção na v3: onboarding 98, sota 90, evidência 100, evolução 96, tendências 96, quem 93, indústria 88,
código 77, regulação 84, projeto 97, habilidades 98, plano de qualificação 98, notícias 97, perguntas reais 98.

O que falta agora é fonte, não síntese. Pedidos do juiz agrupados:

| Tipo de fonte | Pedidos |
|---|---|
| casos da indústria | 29 |
| papers e outros | 22 |
| código e dados | 16 |
| regulação | 15 |
| habilidades e trilhas | 4 |

### Juiz v2 (calibrado) — as notas que valem a partir daqui

Calibramos o juiz contra um modelo mais forte em 10 casos (`evals/calibration/2026-11-25-fable.md`). O juiz v1 dava
17 pontos a mais, em média, e não conferia citações. O v2 confere pelo menos 6 citações por resposta, dá nota à
rubrica pelo que a resposta entrega e tem teto de nota para invenção. Diferença média para a referência: −3,8 (dois
casos ainda passam de 15 pontos).

| Rodada | Nota (juiz v2) | Citações sem apoio / parciais | O que mudou |
|---|---|---|---|
| v3 | 76 | 7% / 19% | — |
| v4 | 82 | 5% / 14% | normas do Bacen e marcos internacionais no acervo; checagem de cobertura na 1ª frase; tipo de evidência; formato de indústria; "quem" sem falso disparo; fase da Evolução como documento próprio; trechos maiores, sem bibliografia; piso de pertinência |

Por intenção na v4: regulação 55 → 85, projeto 93, plano 100, evolução 94; os fracos agora são código (54, falta
fonte), onboarding (70, caiu de 83) e estado da arte (72).

Lições da primeira rodada:

- **O preço por token não conta a história toda.** Provedores diferentes ligam ou não o raciocínio interno por
  padrão, e um deles cortava as respostas. É preciso fixar o comportamento (`reasoning_effort`) e tratar resposta
  cortada como falha.
- **O modelo menor não saiu mais barato aqui.** O Qwen3.8-27B tem saída mais cara, foi 3× mais lento e inventou
  mais (fundamentação 1,68 contra 2,00 de 2).
- **Limite do juiz.** O juiz é benevolente: deu nota alta a respostas de regulação sem nenhuma norma. A comparação
  entre rodadas vale, porque o juiz é o mesmo; o número absoluto, menos. Próximo passo: calibrar o juiz com uma
  amostra avaliada por um modelo mais forte (ou por nós).
