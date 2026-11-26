# Retrospectiva 2026 (parcial) — Bank Fraud Watch

<sub>gerado em 2026-11-17 · 660 obras · modelo deepseek-ai/DeepSeek-V4.1-Flash</sub>

Em 2026, até 17/11, o tema foi marcado pela escalada de golpes em pagamentos instantâneos e de pagamento autorizado, pelo avanço de account takeover e deepfakes, e pela corrida por modelos fundacionais, grafos e aprendizado contínuo para fraude. Os volumes cresceram em todos os subtemas monitorados, com destaque para money mule (+224%), concept drift/cost-sensitive (+164%), voice cloning/face swap (+143%), instant payment (+127%) e account takeover/SIM swap (+119%). Os destaques do ano mostram a convergência entre foundation models bancários (PRAGMA), detecção agêntica com memória de personas (PersonaAgent), GNNs heterogêneos e contrastivos para colusão e lavagem (Audit-HCL, Guardnet, Hybrid federated continual graph contrastive learning) e ataques adversariais com RL (Fraud-RLA). No bloco de quem publica, a academia domina (495 de 670 trabalhos; 73.9%), enquanto empresas respondem por 26 (3.9%) e governo/reguladores por 14 (2.1%); o Brasil não aparece entre países, instituições ou empresas listados.

## Tendências

- **Pagamentos instantâneos e APP fraud sob pressão**: A produção sobre instant payment/instant payments subiu de 77 para 175 (+127%), e authorized push payment/APP fraud de 93 para 163 (+75%). O avanço acompanha a centralidade dos trilhos instantâneos e exige defesa em tempo real contra golpes de engenharia social.
- **Account takeover, identidade sintética e deepfakes**: Account takeover/SIM swap cresceu de 158 para 346 (+119%), synthetic identity/identity fraud de 458 para 714 (+56%), e voice cloning/face swap de 369 para 898 (+143%). É a frente que combina autenticação, biometria comportamental (+38%) e onboarding.
- **Grafos, mulas e AML**: Money mule/money mules saltou de 34 para 110 (+224%), anti-money laundering/money laundering de 549 para 848 (+54%), e graph neural network/graph neural networks de 253 para 507 (+100%). Os destaques Audit-HCL, Guardnet e Hybrid federated continual graph contrastive learning mostram GNNs heterogêneos, contrastivos e federados para colusão e lavagem sob escassez de rótulos.
- **Foundation models, LLMs e drift**: Large language model/large language models cresceu de 209 para 429 (+105%), concept drift/cost-sensitive de 254 para 670 (+164%), e fraud detection/financial institution de 1744 para 2182 (+25%). PRAGMA, DISCO e PersonaAgent apontam para modelos fundacionais, separação entre representação e controle de risco, e atualização contínua de memória/entidades.
- **Cartões e adversários**: Credit card fraud/card fraud subiu de 608 para 761 (+25%), e behavioral biometrics/behavioural biometrics de 223 para 308 (+38%). Fraud-RLA materializa a ameaça adversarial com RL contra sistemas de detecção de fraude em cartões, enquanto a produção em cartões segue relevante.

## Onde a inovação acontece

Academia concentra a inovação: 495 de 670 trabalhos (73.9%), contra 26 de empresas (3.9%), 23 de centros de pesquisa (3.4%) e 14 de governo e reguladores (2.1%). Entre empresas, Nvidia (11), Capital One (10), Visa (10), Ant Group (7) e Uber AI (5) puxam publicações; entre países, EUA (132), China (76), Índia (72), Reino Unido (58) e Indonésia (36) lideram. As instituições mais produtivas são Tongji University (19), University of Antwerp (12), Université Libre de Bruxelles (10) e KU Leuven (10). O Brasil não aparece entre países, instituições ou empresas listados, o que indica ausência de protagonismo nos dados deste recorte.

## Destaques

- **[PRAGMA: modelo fundacional para eventos bancários](https://doi.org/10.48550/arxiv.2604.08649)** — arXiv (Cornell University) · 8/10 · 14 cit. (📊 Modelos, dados e métricas de fraude)
  - Pré-treina Transformer com masked modelling em corpus heterogêneo de eventos bancários e mostra que embeddings alimentam tarefas como credit scoring, fraud detection e lifetime value com modelo linear simples. Traz a lógica de foundation models para sequências transacionais, com origem na Nvidia.
- **[DISCO: desacoplar representação e controle de risco](https://doi.org/10.1016/j.dss.2026.114717)** — Decision Support Systems · 8/10 · 3 cit. (📊 Modelos, dados e métricas de fraude)
  - Propõe separar aprendizado de representação e controle de risco para detecção confiável de fraude em cartão de crédito, endereçando robustez em produção. Publicado na Decision Support Systems, reforça a necessidade de controle de risco explícito além do classificador.
- **[PersonaAgent: scoring de anomalias com memória de personas](https://doi.org/10.48550/arxiv.2611.08094)** — arXiv (Cornell University) · 8/10 · 0 cit. (📊 Modelos, dados e métricas de fraude)
  - Framework agêntico que representa sinais comportamentais de entidades como personas em memória atualizável, atacando alta cardinalidade e esparsidade de embeddings em redes de pagamento. A colaboração Case Western/Visa indica aplicação direta em detecção transacional em escala.
- **[Guardnet: GNN ciente de desbalanceamento](https://doi.org/10.1007/s10618-025-01181-9)** — Data Mining and Knowledge Discovery · 7/10 · 20 cit. (📊 Modelos, dados e métricas de fraude)
  - Propõe GNN imbalance-aware para detecção de fraude, tratando o desbalanceamento extremo típico do domínio. Publicado em Data Mining and Knowledge Discovery, reforça a linha de grafos como infraestrutura de detecção.
- **[Evolução dos golpes de investimento na era cripto](https://doi.org/10.1016/j.cose.2026.104950)** — Computers & Security · 7/10 · 2 cit. (🎣 Golpes e engenharia social)
  - Com amostra nacional australiana de n=2019 adultos, estima 2,6% (cerca de 550.000) de vítimas de investment cyber scams em uma década, acima dos registros oficiais, e discute vulnerabilidade e victim blaming. Traz evidência populacional sobre subnotificação e evolução dos golpes.
- **[Audit-HCL: grafo heterogêneo dinâmico para colusão](https://doi.org/10.1038/s41598-026-58938-5)** — Scientific Reports · 7/10 · 25 cit. (🕸️ Contas laranja, mulas & PLD/CFT)
  - Modela clientes, contas e dispositivos como snapshots temporais de grafo heterogêneo e usa aprendizado contrastivo dual-view para detectar anéis de colusão sob escassez de rótulos de AML. É uma resposta direta ao atraso de labels confirmados em PLD/CFT.
- **[Aprendizado contrastivo federado e contínuo para lavagem](https://doi.org/10.1007/s10618-026-01192-0)** — Data Mining and Knowledge Discovery · 7/10 · 12 cit. (🕸️ Contas laranja, mulas & PLD/CFT)
  - Combina federated learning, continual learning e graph contrastive learning para ameaças evolutivas de money laundering. Endereça privacidade e drift simultaneamente, com origem em IIT Hyderabad e IDRBT.
- **[Fraud-RLA: ataque adversarial com RL](https://doi.org/10.1109/tdsc.2026.3673847)** — IEEE Transactions on Dependable and Secure Computing · 7/10 · 20 cit. (💳 Cartões & e-commerce)
  - Introduz ataque com reinforcement learning que evita detecção de fraude em cartão maximizando o valor roubado e exigindo menos conhecimento prévio que ataques concorrentes. Expõe a fragilidade adversarial de sistemas de fraude e pressiona por defesas robustas.

## Volume por subtema

| Subtema | 2025 | 2026 | Variação |
|---|---|---|---|
| money mule / money mules | 34 | 110* | +224% |
| concept drift / cost-sensitive | 254 | 670* | +164% |
| voice cloning / face swap | 369 | 898* | +143% |
| instant payment / instant payments | 77 | 175* | +127% |
| account takeover / SIM swap | 158 | 346* | +119% |
| large language model / large language models | 209 | 429* | +105% |
| graph neural network / graph neural networks | 253 | 507* | +100% |
| financial institution / online banking | 340 | 612* | +80% |
| authorized push payment / APP fraud | 93 | 163* | +75% |
| operational risk / Basel | 63 | 100* | +59% |
| (fraud OR scam OR scams) AND (victim OR victims OR victimiza | 373 | 587* | +57% |
| synthetic identity / identity fraud | 458 | 714* | +56% |
| anti-money laundering / money laundering | 549 | 848* | +54% |
| behavioral biometrics / behavioural biometrics | 223 | 308* | +38% |
| open banking / open finance | 101 | 137* | +36% |
| fraud detection / financial institution | 1744 | 2182* | +25% |
| credit card fraud / card fraud | 608 | 761* | +25% |

<sub>* ano em curso, projetado para 12 meses.</sub>
