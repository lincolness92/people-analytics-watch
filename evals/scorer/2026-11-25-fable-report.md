# Avaliação do scorer de papers — juiz de referência (2026-11-25)

Juiz: Claude Fable 5.2, lendo o abstract **completo** de cada candidato. Sem chamadas externas.
Rótulos e métricas: `evals/scorer/2026-11-25-fable-labels.json`.

## Resumo

- **A ordenação da triagem é boa (Spearman 0,82), mas a escala está inflada em cerca de 1,1 ponto.** Em 116 itens com nota, 46 ficaram 2 ou mais pontos acima do juiz e só 3 ficaram 2 ou mais abaixo.
- **O limiar do digest (≥ 7) deixa passar demais.** De 35 itens com nota ≥ 7, o juiz colocaria 12 no digest (precisão 0,34); 10 são "talvez" e 13 são "não". O recall na amostra é 0,86 (12 de 14).
- **O limiar da biblioteca (≥ 5) também vaza.** De 80 itens com nota ≥ 5, 33 ficaram abaixo de 5 para o juiz (precisão 0,59).
- **A inflação vem do tipo de evidência, não do tema.** Survey de autorrelato, teoria, estudo qualitativo e notícia recebem a nota de "sólido e relevante" quando o tema bate, sobretudo com o selo `jr` ou `fonte`.
- **O pré-filtro não discrimina em dois dos três tópicos.** Em people-analytics e tecnologia-bancaria a linha de corte é exatamente 3,0 (tem abstract + 5 palavras-chave), empatada entre centenas de itens; quem entra é decidido pela ordem de coleta.
- **Recomendação principal:** separar relevância e qualidade com tipo de evidência, calcular a nota final em código, mandar 1.200 caracteres de abstract e corrigir o pré-filtro. Custo estimado: de ~US$ 0,016 para ~US$ 0,024–0,026 por tópico por dia.

## 1. Método

- Li `src/pawatch/score.py` e os três `topic.json`, e rotulei os 140 candidatos das três amostras (40 + 50 + 50) pelo abstract completo.
- Cada item recebeu relevância, qualidade, tipo de evidência, nota final (`overall`, a que a triagem deveria ter dado pela rubrica), `digest` (yes / maybe / no), uma razão e `truncation_hides_key_info`.
- `digest: yes` significa "eu colocaria no digest deste público"; na prática coincide com `overall` ≥ 7. `maybe` é menção rápida (nota 6).
- `truncation_hides_key_info` é verdadeiro quando o desenho, os dados ou o resultado que decide a nota só aparecem depois do caractere 450.
- As métricas de concordância usam os 116 itens que a triagem pontuou. Os 24 cortados pelo pré-filtro são analisados à parte.
- Para o pré-filtro, recalculei o `rank` de todos os candidatos e li os títulos dos cortados (todos em fraude, os 130 de maior rank nos outros dois), abrindo o abstract dos promissores.

Limites que afetam a leitura dos números:

- **A amostra é estratificada pela nota da triagem, não aleatória.** Spearman e erro médio valem para a amostra. As estimativas "ponderadas" abaixo reponderam pelas faixas da triagem nos 220 enviados.
- **O recall ponderado se apoia em um único item perdido por tópico.** Trate-o como ordem de grandeza.
- **É um juiz só, numa janela de 14 dias.** Não medi a variância entre execuções da triagem.

## 2. Métricas

| | Fraude | People analytics | Tecnologia bancária | Geral |
|---|---|---|---|---|
| Itens com nota na amostra | 32 | 42 | 42 | 116 |
| Spearman (triagem × juiz) | 0,80 | 0,85 | 0,86 | 0,82 |
| Erro absoluto médio | 0,97 | 1,52 | 1,45 | 1,34 |
| Viés médio (triagem − juiz) | +0,59 | +1,38 | +1,31 | +1,14 |
| Dentro de ±1 ponto | 75% | 45% | 57% | 58% |
| Triagem ≥ 2 acima / ≥ 2 abaixo | 6 / 2 | 23 / 0 | 17 / 1 | 46 / 3 |
| Triagem ≥ 7 na amostra | 5 | 15 | 15 | 35 |
| Juiz "yes" na amostra | 4 | 6 | 4 | 14 |
| Digest: precisão (triagem ≥ 7 → yes) | 0,60 | 0,33 | 0,27 | 0,34 |
| Digest: precisão contando "maybe" como acerto | 1,00 | 0,53 | 0,60 | 0,63 |
| Digest: recall na amostra | 0,75 | 0,83 | 1,00 | 0,86 |
| Digest: recall ponderado para os 220 | 0,47 | 0,67 | 1,00 | — |
| Biblioteca (≥ 5): precisão / recall na amostra | 0,60 / 0,92 | 0,63 / 0,95 | 0,53 / 0,94 | 0,59 / 0,94 |
| Biblioteca: recall ponderado para os 220 | 0,68 | 0,76 | 0,73 | — |
| Itens com informação decisiva após os 450 caracteres | 18 | 19 | 12 | 49 |
| Erros ≥ 2 explicados pelo corte | 7 de 8 | 11 de 23 | 4 de 18 | 22 de 49 |

Distribuição das notas nos 220 enviados à triagem:

| Faixa | Fraude | People analytics | Tecnologia bancária |
|---|---|---|---|
| ≥ 7 | 5 | 23 | 16 |
| 5–6 | 51 | 56 | 67 |
| < 5 | 164 | 141 | 137 |
| Nota máxima dada | 7 | 9 | 8 |

Em fraude a triagem nunca passou de 7 em 220 candidatos. O digest desse tópico não tem como ordenar os selecionados pela nota.

## 3. Piores divergências

### Nota alta demais

| Tópico | Item | Selo | Triagem | Juiz | Por quê |
|---|---|---|---|---|---|
| Tecnologia | Is low-carbon transition risk affecting the market and credit ratings equally? | jr | 7 | 3 | Risco climático e ratings de crédito, sem tecnologia nem IA. "Credit" e o journal da lista bastaram. |
| People | Institutional ambiguity and its dimensions in anti-enslavement arena | jr | 6 | 2 | Teoria organizacional sobre trabalho escravo; não é people analytics. |
| Tecnologia | Human Capital Development in Emerging Economies | — | 5 | 1 | Relatório de desenvolvimento econômico; entrou na biblioteca por citar IA e skills. |
| Tecnologia | Gatekeepers and Kingmakers: Do Superplatforms Distort Digital Competition? | jr | 7 | 4 | Management Science forte, mas sobre o Google e apps; o bônus de journal "salvou" um paper fora do tema. |
| Tecnologia | Com Itaú Asset e BV, Pagaleve levanta FIDC de R$ 250 milhões | fonte | 7 | 4 | Notícia de captação sem conteúdo tecnológico, que a rubrica manda ficar em 0–4. |
| Fraude | From Batch to Instant: A Reference Architecture… | — | 6 | 3 | "Conceptual study, no experiments" só aparece depois do corte. |
| People | How and when do green HRM practices foster OCBE? | jr | 6 | 3 | Survey em hotelaria chinesa, periférico ao público. |
| People | Understanding the Mediating Role of Talent Retention in SMEs' Sustainability Practices | — | 6 | 3 | PLS-SEM com 253 PMEs; retenção é só a variável mediadora. O método aparece depois do corte. |

Outros 38 itens ficaram 2 ou 3 pontos acima. Os padrões se repetem: survey PLS-SEM em journal da lista com nota 7 ("Deciphering the slow adoption of HR analytics"), modelo teórico com nota 7 ("Cultivating Team Psychological Safety"), teaser de fonte com nota 7–8 ("Using AI to Guide Workers", "Stripe evals", anúncio do Stripe Treasury).

### Nota baixa demais

Só três itens ficaram 2 pontos abaixo; os demais são diferenças de 1 ponto.

| Tópico | Item | Selo | Triagem | Juiz | Por quê |
|---|---|---|---|---|---|
| Fraude | VRLLM: Turning LLMs into Powerful Tabular Classifiers | watch | 5 | 7 | "Supera o modelo de produção" e "validação de deployment" (Visa Research) estão depois do corte. |
| Fraude | Risk-Aware AI Deployment Architecture for… Banking | — | 3 | 5 | O piloto de um ano com 47 modelos e os números de fraude e PLD estão depois do corte. |
| Tecnologia | The MoneyPot Live: Oliver Hughes, TBC Bank | fonte | 3 | 5 | A parte sobre IA (stack própria de fala, assistente Lola) está depois do corte. |
| Fraude | Large Payments Model | — | 7 | 8 | 400 bilhões de tokens e uso em produção só aparecem depois do corte. |
| People | When shifts matter for hybrid teams (JAP) | jr | 7 | 8 | 164 times por 6 semanas; desenho e resultado depois do corte. |
| Tecnologia | Campaigns That Click (ISR) | jr | 7 | 8 | Dois experimentos e 60 milhões de observações; a triagem deu a mesma nota de uma notícia de FIDC. |
| People | How remote work reshapes talent acquisition and innovation | — | 6 | 7 | O desenho (diferenças-em-diferenças com pareamento) só aparece depois do corte. |
| People | Performance Appraisal Fairness… HR Analytics | — | 4 | 5 | A auditoria de vazamento (AUC cai a 0,51) está depois do corte. |

## 4. Padrões de viés

Notas médias na amostra (triagem → juiz):

| Grupo | n | Triagem | Juiz | Triagem ≥ 7 | Juiz "yes" |
|---|---|---|---|---|---|
| Journal da lista (`jr`), survey / qualitativo / teoria / revisão | 18 | 6,17 | 4,44 | 10 | 1 |
| Journal da lista (`jr`), quase-experimento ou experimento | 9 | 6,33 | 5,78 | 6 | 5 |
| Journal da lista (`jr`) com relevância ≤ 4 | 11 | 4,91 | 2,82 | 3 | 0 |
| Fonte da watchlist, texto com menos de 500 caracteres | 19 | 5,05 | 3,74 | 7 | 1 |
| Notícia ou post de indústria | 27 | 4,48 | 3,30 | 8 | 1 |
| Teoria ou position paper | 11 | 5,18 | 3,36 | 3 | 0 |
| Survey ou questionário | 17 | 5,06 | 3,65 | 4 | 1 |
| Repositórios e capítulos (Zenodo, Figshare, eBooks, Research Square) | 15 | 4,47 | 3,33 | 1 | 0 |
| Relevância ≤ 3 para o juiz | 27 | 3,04 | 1,56 | 2 | 0 |
| Qualidade ≤ 3 para o juiz | 59 | 4,29 | 2,71 | 6 | 0 |
| arXiv | 10 | 5,90 | 5,80 | 7 | 6 |

- **O selo `jr` funciona como nota mínima, não como desempate.** A triagem dá praticamente a mesma média a um survey em journal da lista (6,17) e a um quase-experimento em journal da lista (6,33). Em people-analytics, 13 das 15 notas ≥ 7 são `jr`, e só 5 delas são "yes".
- **Paper fora do tema em journal de elite ainda vaza.** A regra "não salvam paper fora do tema" não segura: 8 de 11 itens `jr` com relevância ≤ 4 entraram na biblioteca e 3 chegaram a 7.
- **Teaser de fonte recebe nota pelo prestígio da fonte.** Sete dos 19 textos curtos de fontes chegaram a ≥ 7 com uma ou duas frases de conteúdo; só o post do BBVA sustentava a nota.
- **Notícia de captação, nomeação e evento não fica em 0–4.** A rubrica já manda, mas FIDC, rodada de Série A e multa regulatória ficaram em 6–7 em tecnologia-bancaria.
- **A faixa 5–6 virou depósito.** 59 itens têm qualidade ≤ 3 para o juiz e 32 deles entraram na biblioteca: PaySim, dataset IBM HR, frameworks não validados, PLS-SEM com 96 respondentes.
- **A triagem acerta onde a evidência é explícita.** arXiv com números no começo do abstract e quase-experimentos de economia do trabalho quase não têm viés.
- **Em fraude o selo não infla.** Os 23 itens `jr` enviados têm média 2,65 na triagem, porque são ruído da lista de journals (Expert Systems with Applications etc.). O problema ali é do pré-filtro.

### Quanto o corte de 450 caracteres explica

- **Explica todas as notas baixas demais.** Os 3 erros de −2 e 4 dos 5 erros de −1 da tabela acima têm o resultado depois do corte.
- **Explica parte da inflação.** Em 19 dos 46 casos inflados, a frase que derruba a nota vem depois do corte: "conceptual study", "synthetic", "PLS-SEM, 305 respondentes", "não validada empiricamente", "PaySim".
- **Não explica o resto.** Em 27 dos 46 casos inflados a informação estava visível (teaser de fonte, paper fora do tema, modelo teórico). Aí o problema é a rubrica.
- **88% a 98% dos abstracts enviados em fraude e people-analytics passam de 450 caracteres** (71% em tecnologia-bancaria), e é comum o abstract gastar esse espaço com motivação.

## 5. Pré-filtro

Nenhum dos 24 cortados que caíram na amostra merecia entrar (nota máxima do juiz: 4). O problema aparece ao olhar a lista inteira de cortados.

### O que está errado

- **A contagem de palavras-chave satura.** Ela vale no máximo 2,0 (5 ocorrências × 0,4). Em people-analytics e tecnologia-bancaria, o menor rank enviado e o maior rank cortado são ambos 3,0: abstract + 5 ocorrências. Centenas de itens empatam e o `sorted` estável decide pela ordem de coleta.
- **Conta ocorrências, não termos.** Repetir "bank" cinco vezes vale o mesmo que cinco termos diferentes do tema.
- **Título no alvo sem abstract vai para o fim.** Sem abstract o item perde 1,0 e quase não tem onde pontuar palavras-chave.
- **O bônus de journal não exige nenhuma palavra-chave.** Em fraude, 23 itens `jr` entraram e só 5 chegaram a 5 na triagem; são 18 vagas gastas com visão computacional e otimização.
- **As listas de palavras-chave têm buracos.** People-analytics não tem `team`, `AI`, `algorithm`, `performance`, `career`, `wage`, `gender`. Tecnologia-bancaria não tem `AI` nem `IA` isolados, nem as formas em português (`inteligência artificial`, `crédito`, `pagamento`, `cartão`).

### Cortados que eu teria querido

| Tópico | Item | Nota do juiz | Por que foi cortado |
|---|---|---|---|
| Tecnologia | How Much Do Foundation Models Add to Gradient Boosting on Financial Event Sequences? | 7 | Tema "modelos fundacionais de transações"; 6 palavras-chave, teto em 3,0, perdeu o desempate. Em fraude recebeu 7. |
| Tecnologia | Can Open LLMs Clear Sanctions-Screening Alerts? (pré-registrado) | 7 | Idem, 5 palavras-chave. |
| Tecnologia | Accountable AI Delegation in Banking | 6 | Idem, 6 palavras-chave. |
| Tecnologia | AgentBank: Banking on Blockchain Agentic Payments | 6 | 19 palavras-chave, teto em 3,0. |
| Tecnologia | Separating Automation Gains from Agent Contributions in AI-Assisted Model Validation | 6 | 14 palavras-chave, teto em 3,0. |
| Tecnologia | Decision Models for Business Customer-Service Triage (BANKING77) | 6 | Teto em 3,0. |
| Tecnologia | Pix por dentro: arquitetura, APIs públicas e segurança | 6 | Teto em 3,0. |
| People | When Data Scientists Meet Domain Experts (Organization Science, três bancos indianos) | 7 | Journal da lista com abstract e zero palavras-chave. |
| People | The Emergence of Psychological Safety or its Mirage (Organization Science) | 6 | Zero palavras-chave ("team" não está na lista). |
| People | The Real Shape of AI Adoption at Work (Harvard D^3) | 5 | Fonte da watchlist com zero palavras-chave. |
| Fraude | Neural Defend ARCAS 290M (detecção de voz clonada) | 6 | Uma palavra-chave; rank 1,4. |
| Fraude | MOZAIC: An Audio-Video Deepfake Benchmark | 6 | Empatou em 2,2 no limiar. |
| Fraude | MaRENet (fraude de cartão); framework grafo-tabular com decisão por ROI; PLD em grafos temporais com auditoria; Federated memory propagation; DGAB; Credential Stuffing Report | ? | Sem abstract no OpenAlex; rank 0,4–1,2 apesar do título em cheio no tema. |

Em tecnologia-bancaria, 44 itens do arXiv foram cortados, e cinco deles (os cinco primeiros da tabela) são de banco agêntico, modelos fundacionais ou IA em risco, temas centrais do tópico.

## 6. Recomendações

### 6.1 Separar relevância e qualidade, e calcular a nota em código

Recomendo que a triagem devolva `r`, `q`, `e` e uma razão curta, e que `s` seja calculado em `triage()`:

```python
s = min((r + q) // 2, min(r, q) + 2)
```

- **A fórmula reproduz o juiz.** Aplicada aos meus `r` e `q`, dá erro médio de 0,43 contra o meu `overall` e marca 16 itens ≥ 7, que incluem os 14 "yes". É circular (os rótulos são meus), mas mostra que a nota final não precisa de julgamento extra.
- **O teto `min + 2` é o que segura os dois vazamentos.** Paper de elite fora do tema (r = 3, q = 8) fica em 5; survey fraco no tema (r = 8, q = 3) fica em 5.
- **Os campos novos pagam o próprio custo.** `e` permite filtrar e medir viés por tipo; a razão vai para a biblioteca e para o log; `r` e `q` separados permitem que o agente de Q&A filtre por qualidade.
- **Mantenha `min_score` em 7 com a nova escala** e reavalie com esta mesma amostra. Para o agente de Q&A, sugiro expor `q` e não subir o limiar de 5.

### 6.2 Texto proposto para `triage_rules`

Texto exato do prompt, com os campos do `topic.json` entre chaves:

```text
Avalie cada candidato em dois eixos SEPARADOS. Julgue só o que o texto recebido mostra: título e prestígio não contam como evidência.

`r` — RELEVÂNCIA 0–10 para {rubric_focus}, para o público descrito acima:
- 9–10: responde a uma decisão que esse público toma hoje.
- 7–8: no tema, com lição prática ou metodológica clara.
- 5–6: tema vizinho ou ângulo indireto.
- 0–4: fora do tema ({off_topic}). Bater palavras-chave não basta: o objeto do estudo precisa ser do tema.

`q` — QUALIDADE 0–10 da evidência mostrada:
- 9–10: {rubric_strong}, com desenho e resultado numérico explícitos no texto.
- 7–8: desenho crível com dados reais, ou benchmark novo e auditável, com resultado numérico.
- 5–6: dados públicos ou simulados com avaliação honesta; revisão sistemática útil; caso real com números não verificáveis; modelo teórico em venue de elite.
- 3–4: survey transversal de autorrelato (SEM/PLS-SEM, amostra de conveniência); estudo qualitativo pequeno; framework, arquitetura ou modelo conceitual sem validação; dataset sintético ou de brinquedo; anúncio de produto, parceria ou captação; teaser de uma ou duas frases.
- 0–2: sem método, sem conteúdo, predatório ou gerado automaticamente.

`e` — tipo de evidência, um de: rct, quasi, admin, bench, survey, quali, review, theory, regulator, news, other.
(rct = experimento de campo ou RCT; quasi = quase-experimento ou identificação causal; admin = dados administrativos ou de produção em grande escala; bench = modelo ou benchmark em dados públicos ou sintéticos; regulator = norma ou relatório de regulador; news = notícia, post ou relatório de indústria.)

`w` — razão em até 12 palavras, em português: o desenho e o que decide a nota.

Regras:
- `watch` (autor da watchlist) e `jr` (journal de elite) são critério de desempate: somam no máximo 1 ponto em `q`, e só quando o desenho aparece no texto. Não alteram `r`. Survey, ensaio ou revisão em journal de elite continua em `q` 3–6.
- Itens com `fonte` vêm de fontes da watchlist ({source_kinds}): avalie o texto recebido, não a fonte. Norma, relatório ou caso com dados próprios, exigências novas ou arquitetura descrita pode ter `q` 7+. Teaser sem conteúdo fica em `q` ≤ 4. Divulgação de evento, vaga, nomeação, captação e marketing ficam em `r` ≤ 4 e `q` ≤ 3.
- O abstract pode vir cortado. Se o desenho ou o resultado não aparecem, não presuma: `q` ≤ 5.
- Use a escala inteira. Em 200 candidatos, o normal é ter no máximo uma dezena com `r` ≥ 7 e `q` ≥ 7 ao mesmo tempo.

Exemplos de calibração deste tópico:
{rubric_anchors}

Atribua um tema `t` entre: {themes}.{region_rule}
Responda APENAS com JSON: {"r": [{"i": <id>, "r": <int>, "q": <int>, "e": "<tipo>", "w": "<razão>", "t": "<tema>"}, ...]} cobrindo todos os ids.
```

Notas de implementação:

- `{rubric_anchors}` é um campo novo no `topic.json`, com as três linhas da seção 6.4.
- Em tópicos com `regions`, o JSON de resposta ganha `"g"` como hoje. Na f-string, as chaves do JSON de resposta precisam ser dobradas.
- O `rubric_strong` padrão (`DEFAULT_STRONG`) diz "venue de elite ou autor de referência" como se fosse evidência forte por si só. Sugiro trocar por "experimento de campo/RCT, dados administrativos grandes, causalidade crível".

### 6.3 Quantos caracteres de abstract mandar

Recomendo **1.200 caracteres**, com `…` no fim quando houver corte.

Custo estimado por tópico por dia, a partir dos três registros de uso das amostras (ajuste: ~US$ 0,12 por milhão de tokens de entrada e ~US$ 0,46 por milhão de saída; cerca de dois terços do custo atual é saída, quase toda de raciocínio):

| Corte | Entrada extra (fraude / people / tecnologia) | Abstracts ainda cortados |
|---|---|---|
| 450 (atual) | — | 88% / 98% / 71% |
| 800 | +US$ 0,002 / 0,003 / 0,002 | 82% / 93% / 60% |
| 1.200 | +US$ 0,005 / 0,005 / 0,003 | 67% / 76% / 50% |
| 1.500 | +US$ 0,006 / 0,007 / 0,004 | 45% / 50% / 31% |
| Completo | +US$ 0,008 / 0,009 / 0,007 | 0% |

- **1.200 caracteres cobrem a maioria dos casos que encontrei.** Na maior parte dos itens marcados com truncamento, o desenho e o primeiro resultado aparecem entre os caracteres 450 e 1.200. Não medi isso item a item, e em alguns textos longos de fontes (entrevista do TBC Bank, balanço do Pix) a informação fica no limite.
- **Os campos novos custam cerca de US$ 0,004 por tópico por dia** (~40 tokens de saída a mais por item, 220 itens).
- **Total: de ~US$ 0,016 para ~US$ 0,024–0,026 por tópico por dia.** Para os três tópicos, cerca de US$ 0,80 a mais por mês.
- **Incerteza:** os tokens de raciocínio dominam a saída e podem variar com o prompt novo. Meça `triage_usage` na primeira execução.

Abstracts estruturados ("Purpose… Design… Findings…") e posts com rodapé ("The post … appeared first on …") gastam caracteres à toa. Remover o rodapé de RSS e listas de referências coladas ao abstract (um caso tinha 9.818 caracteres) é grátis.

### 6.4 Âncoras por tópico

Uma linha por âncora no prompt (título, venue, `r`/`q` e o motivo). Todas saíram da amostra. Nenhum item da amostra mereceu 9 do juiz, então a âncora alta é o melhor item de cada tópico, com a ressalva indicada.

**Fraude bancária**

| Alvo | Item | r / q | Motivo |
|---|---|---|---|
| ~9 | Large Payments Model (arXiv) | 8 / 7 | Modelo fundacional de pagamentos treinado em dados reais de um grande processador e em produção. O juiz deu 8 porque o abstract não traz números. |
| ~6 | An Explainable ML Framework… Predicting Monetary Redress in Bank Fraud and Scam Complaints (Research Square) | 7 / 5 | Tema no alvo e teste fora do tempo, mas dado público, preprint e ganho modesto. |
| ~2 | Leakage-aware federated-style simulation for fraud risk prediction (Future Technology) | 5 / 2 | PaySim sintético, F1 de 0,30 e o método anunciado nem é implementado. A triagem deu 5; o juiz, 3. |

**People analytics**

| Alvo | Item | r / q | Motivo |
|---|---|---|---|
| ~9 | The Consequences of Pay Standing under Pay Range Transparency (AMJ) | 9 / 8 | Quatro estudos, incluindo experimento natural, sobre uma decisão que o RH toma hoje. Juiz: 8. |
| ~6 | Deciphering the slow adoption of HR analytics (IJHRM) | 8 / 3 | Tema central em journal da lista, mas survey transversal PLS-SEM com 305 respondentes. A triagem deu 7; o juiz, 5. |
| ~2 | Predictive People Analytics Using ML-Based HR Metrics… Industry 5.0 (CRC Press) | 6 / 1 | Título cheio de palavras-chave, mas é o dataset IBM HR com painel sintético e acurácia de 94,7%. |

**Tecnologia bancária**

| Alvo | Item | r / q | Motivo |
|---|---|---|---|
| ~9 | Campaigns That Click: Unleashing the Power of Push Notifications on Mobile Apps (ISR) | 7 / 9 | Dois experimentos e 60 milhões de observações sobre uma alavanca que todo app de banco usa. Juiz: 8, porque não é sobre banco. |
| ~6 | Give your agents controlled access to analyze your data and move funds (Stripe Blog) | 8 / 3 | Fintech de fronteira dando a agentes poder de mover fundos, mas é anúncio de produto de duas frases. A triagem deu 8. |
| ~2 | Com Itaú Asset e BV, Pagaleve levanta FIDC de R$ 250 milhões (NeoFeed) | 5 / 3 | Notícia de captação sem conteúdo de tecnologia. A triagem deu 7; o juiz, 4. |

As âncoras de ~6 de people-analytics e tecnologia-bancaria foram escolhidas por serem os erros típicos da triagem: mostram ao modelo que tema certo com evidência fraca fica no meio da escala.

### 6.5 Mudanças no pré-filtro

Em ordem de impacto:

1. **Tirar a saturação e separar título de corpo.** Contar termos distintos, com peso maior no título.
2. **Condicionar os bônus de `jr` e `fonte` a pelo menos um termo do tema.** Sem nenhum termo, o bônus cai para 0,5.
3. **Não punir a falta de abstract quando o título bate.** Com dois ou mais termos no título, mandar só o título, ou buscar o abstract em outra base (Crossref, Semantic Scholar).
4. **Completar as listas de palavras-chave** (abaixo).
5. **Desempatar por algo melhor que a ordem de coleta:** data mais recente e, depois, origem (arXiv e fonte antes de busca genérica).
6. **Penalizar repositórios sem revisão** (Zenodo, Figshare, capítulos de eBooks) em 0,5: 15 itens na amostra, média 3,3 do juiz, nenhum "yes".

Esboço do `rank`:

```python
title_terms = {m.lower() for m in kw.findall(c["title"])}
body_terms = {m.lower() for m in kw.findall(c["abstract"][:1500])} - title_terms
on_topic = bool(title_terms or body_terms)
return (
    3 * bool(c["watch_authors"])
    + (2 if on_topic else 0.5) * (c["watch_journal"] + bool(c.get("watch_source")))
    + (1 if c["abstract"] or len(title_terms) >= 2 else 0)
    + min(len(title_terms), 3) * 0.8 + min(len(body_terms), 8) * 0.25
    + min(c["cited_by"], 20) * 0.02
    - 0.5 * bool(LOW_TRUST.search(c["venue"] or ""))
)
```

Termos a acrescentar em `prefilter_keywords`:

- **people-analytics:** `team|psychological safety|\bAI\b|algorithm|data scien|performance|career|wage|gender|layoff|promotion|mobility|training|well-being|burnout|diversity|inclusion|incentive|gestão de pessoas|liderança|remuneração`
- **tecnologia-bancaria:** `\bAI\b|\bIA\b|inteligência artificial|crédito|pagamento|cartão|agêntic|modelo fundacional|sanction|compliance|model validation|transaction`
- **fraude-bancaria:** `voice|audio|spoof|sanction` (hoje só `voice clon` pega fraude por voz, e é restrito demais)

`LOW_TRUST` é uma regex nova, por exemplo `zenodo|figshare|ebooks|research square|preprints\.org`.

### 6.6 Ordem sugerida

1. Pré-filtro (itens 1 a 4): é onde se perdem papers de nota 7 sem que ninguém veja.
2. Prompt novo com `r`, `q`, `e`, `w`, âncoras e nota calculada em código.
3. Abstract a 1.200 caracteres e limpeza de rodapés.
4. Rodar `evals/scorer_sample.py` de novo e comparar com estes rótulos: a meta é viés médio abaixo de 0,5 e precisão do digest acima de 0,6, sem perder recall.
