# Retrospectiva 2025 — Bank Fraud Watch

<sub>gerado em 2026-11-17 · 659 obras · modelo deepseek-ai/DeepSeek-V4.1-Flash</sub>

2025 foi o ano da industrialização da fraude e da resposta com modelos de fundação, grafos e LLMs. A detecção de fraude em instituições financeiras cresceu +119% (2.2x), enquanto account takeover/SIM swap (+182%, 2.8x), voice cloning/face swap (+229%, 3.3x) e instant payment (+166%, 2.7x) sinalizam vetores cada vez mais automatizados e transfronteiriços. Papers como TransactionGPT e TREASURE levaram foundation models para trilhas de transações em escala bilionária, e Deepfake-Eval-2024 mostrou que benchmarks acadêmicos estavam defasados. PLD/CFT (+137%, 2.4x) e risco operacional/Basileia (+142%, 2.4x) ganharam tração, com regulação MiCA/DORA e Open Finance (+181%, 2.8x) redesenhando o perímetro. O Brasil não aparece entre os países ou instituições mais produtivos nos dados.

## Tendências

- **Modelos de fundação para transações financeiras**: TransactionGPT e TREASURE, da Visa, propõem foundation models para trilhas de transações em escala bilionária, enquanto LOGIN e CamFD mostram a fusão de LLMs e GNNs. O volume em fraud detection/financial institution cresceu +119% (2.2x), e os subtemas large language model e graph neural network avançaram +179% (2.8x) e +178% (2.8x), respectivamente.
- **Golpes transfronteiriços e engenharia social em escala industrial**: Papers sobre confraternidades nigerianas, migração de fraudadores de romance para Gana e redes nigerianas no Reino Unido revelam estruturas organizadas e transnacionais. APP fraud cresceu +52% (1.5x), instant payment +166% (2.7x) e publicações sobre vítimas de fraude/golpe +61% (1.6x).
- **Account takeover, identidade sintética e deepfakes**: Objective over Architecture trata de fraude na abertura de contas sob desbalanceamento extremo (1,10% de prevalência), e Deepfake-Eval-2024 expõe a defasagem dos benchmarks acadêmicos. Account takeover/SIM swap cresceu +182% (2.8x), synthetic identity/identity fraud +80% (1.8x), voice cloning/face swap +229% (3.3x) e behavioral biometrics +106% (2.1x).
- **PLD/CFT, mulas e rastreamento em grafos e blockchains**: Network Analytics for AML revisa 97 papers e avalia o poder de detecção de redes; Track and Trace ataca transações cross-chain em DeFi. AML/money laundering cresceu +137% (2.4x), money mule +79% (1.8x) e graph neural networks +178% (2.8x).
- **Regulação, risco operacional e Open Finance**: Raising the bar avalia exchanges centralizadas de criptomoedas à luz de MiCA e DORA, enquanto o subtema operational risk/Basel cresceu +142% (2.4x). Open banking/open finance avançou +181% (2.8x), reforçando a pressão regulatória e de infraestrutura sobre o setor.

## Onde a inovação acontece

A inovação segue concentrada na academia: 525 trabalhos (78.9%) vêm de universidades, contra 24 (3.6%) de empresas e 20 (3.0%) de governo e reguladores. Entre instituições, lideram Tongji University (16), University of Portsmouth (14), Beijing Institute of Technology (13), London School of Economics and Political Science (10) e University of the Western Cape (9). Nos países, EUA (146), China (93), Reino Unido (66), Índia (50) e Indonésia (32) puxam a produção; Nigéria (14) e África do Sul (13) aparecem via criminologia de fraudes transfronteiriças. Nas empresas, destacam-se Tencent (7), State Grid Jilin Electric Power (5), Visa (5), NEC (3), Microsoft (2), Financial Network Analytics (2), Barclays (2) e Ant Group (2). O Brasil não aparece na lista de países, instituições ou empresas.

## Destaques

- **[TransactionGPT](https://doi.org/10.48550/arxiv.2511.08939)** — arXiv (Cornell University) · 10/10 · 14 cit. (📊 Modelos, dados e métricas de fraude)
  - Apresenta um foundation model para dados de transações de consumidor em uma das maiores redes de pagamento, com arquitetura 3D-Transformer e treinamento em bilhões de transações reais. O modelo busca entender e gerar trajetórias de transação e apoiar tarefas downstream de predição e classificação.
- **[TREASURE: The Visa Payment Foundation Model for High-Volume Transaction Understanding](https://doi.org/10.48550/arxiv.2511.19693)** — arXiv (Cornell University) · 10/10 · 8 cit. (📊 Modelos, dados e métricas de fraude)
  - A Visa propõe um foundation model transformer para dados transacionais de alto volume, capturando comportamento do consumidor e sinais da rede de pagamentos. O trabalho aponta aplicações como detecção de comportamento anormal e insights hiperpersonalizados.
- **[LOGIN: A Large Language Model Consulted Graph Neural Network Training Framework](https://doi.org/10.1145/3845996)** — ACM Transactions on Intelligent Systems and Technology · 9/10 · 25 cit. (📊 Modelos, dados e métricas de fraude)
  - Formula o paradigma 'LLMs-as-Consultants' para integrar LLMs e GNNs de forma interativa no treinamento. O objetivo é melhorar o desempenho de GNNs em tarefas downstream sem redesenhar variantes complexas.
- **[CamFD: Semi-Supervised Camouflage-Aware Fraud Detection Based on Dynamic Graphs](https://doi.org/10.1109/tsmc.2025.3648571)** — IEEE Transactions on Systems Man and Cybernetics Systems · 9/10 · 7 cit. (📊 Modelos, dados e métricas de fraude)
  - Propõe detecção de fraude em grafos dinâmicos ciente de camuflagem, atacando fraudadores que imitam padrões de usuários benignos. Também lida com evolução de padrões e escassez de amostras de fraude para reduzir overfitting.
- **[Strategic business movements? The migration of online romance fraudsters from Nigeria to Ghana](https://doi.org/10.1016/j.jeconc.2025.100128)** — Journal of Economic Criminology · 8/10 · 35 cit. (🎣 Golpes e engenharia social)
  - Usa entrevistas e grupos focais para examinar a migração de fraudadores de romance da Nigéria para Gana. Revela padrões de migração e a institucionalização de empresas de golpe na África Ocidental.
- **[The silence of the phishers: Early-stage voice phishing detection with runtime permission requests](https://doi.org/10.1016/j.cose.2025.104364)** — Computers & Security · 7/10 · 25 cit. (🎣 Golpes e engenharia social)
  - Propõe detecção precoce de voice phishing a partir de solicitações de permissão em tempo de execução. O título indica foco no estágio inicial do ataque, antes da interação crítica.
- **[Policing cross-border fraud ‘Above and below the surface’: mapping actions and developing a more effective global response](https://doi.org/10.1007/s10611-024-10186-2)** — Crime Law and Social Change · 7/10 · 23 cit. (🎣 Golpes e engenharia social)
  - Mapeia a escala da fraude transfronteiriça e as respostas policiais existentes. Aponta que órgãos internacionais e Estados têm mostrado pouco interesse em respostas globais mais efetivas.
- **[Objective over Architecture: Fraud Detection Under Extreme Imbalance in Bank Account Opening](https://doi.org/10.3390/computation13120290)** — Computation · 7/10 · 49 cit. (🔐 Account takeover, autenticação & identidade)
  - Compara modelos em 1.000.000 de contas para fraude na abertura de contas, com prevalência de fraude de 1,10% no benchmark BAF Base. Argumenta que métricas padrão podem enganar e que a função objetivo importa mais que a arquitetura.
- **[Deepfake-Eval-2024: A Multi-Modal In-the-Wild Benchmark of Deepfakes Circulated in 2024](https://doi.org/10.48550/arxiv.2503.02857)** — arXiv (Cornell University) · 7/10 · 160 cit. (🤖 IA generativa & deepfakes)
  - Mostra que benchmarks acadêmicos de deepfake estão desatualizados e pouco representativos do mundo real. Reúne 45 horas de vídeo, 56,5 horas de áudio e 1.975 imagens de deepfakes in-the-wild de 2024, de 88 sites diferentes.
- **[Nigerian confraternities and mass cross-border fraud](https://doi.org/10.1007/s12117-025-09576-2)** — Trends in Organized Crime · 9/10 · 10 cit. (🕸️ Contas laranja, mulas & PLD/CFT)
  - Avalia o papel crescente de confraternidades nigerianas, como Black Axe, em fraude organizada e em escala industrial. O estudo aprofunda como redes de membros sustentam fraudes transfronteiriças contra estrangeiros e empresas.
- **[The evolution of Nigerian cybercrime: Two case studies of UK-based offender networks](https://doi.org/10.1177/14773708251329695)** — European Journal of Criminology · 8/10 · 23 cit. (🕸️ Contas laranja, mulas & PLD/CFT)
  - Analisa qualitativamente duas redes nigerianas baseadas no Reino Unido envolvidas em fraudes cibernéticas com forte componente offline. Discute como essas redes evoluíram e operam fora da Nigéria, especialmente na Europa.
- **[Network Analytics for Anti-money Laundering—A Systematic Literature Review and Experimental Evaluation](https://doi.org/10.1287/ijds.2024.0042)** — INFORMS Journal on Data Science · 7/10 · 54 cit. (🕸️ Contas laranja, mulas & PLD/CFT)
  - Revisa 97 papers e propõe taxonomia para analytics de rede em PLD/CFT. Também avalia experimentalmente o poder comparativo de detecção, ajudando a orientar métodos em um campo fragmentado.
- **[Track and Trace: Automatically Uncovering Cross-Chain Transactions in the Multi-Blockchain Ecosystems](https://doi.org/10.1109/tsc.2025.3618729)** — IEEE Transactions on Services Computing · 7/10 · 23 cit. (🕸️ Contas laranja, mulas & PLD/CFT)
  - Automatiza a descoberta de transações cross-chain em ecossistemas multi-blockchain. O foco é rastrear fluxos usados para ocultar origem e destino de ativos em DeFi, incluindo lavagem de dinheiro.
- **[Enhancing Attribute-Driven Fraud Detection With Risk-Aware Graph Representation](https://doi.org/10.1109/tkde.2025.3543887)** — IEEE Transactions on Knowledge and Data Engineering · 8/10 · 46 cit. (💳 Cartões & e-commerce)
  - Apresenta a rede RGTAN, com atenção temporal e representação de risco, para fraude de cartão de crédito. O método busca usar melhor dados não rotulados e capturar estrutura local de risco diante de rótulos escassos.
- **[Raising the bar: Assessing historical cryptocurrency exchange practices in light of the EU’s MiCA and DORA regulation](https://doi.org/10.1016/j.clsr.2025.106227)** — Computer law & security review · 7/10 · 10 cit. (⚖️ Regulação, Basileia & padrões)
  - Avalia práticas históricas de exchanges centralizadas de criptomoedas à luz de MiCA e DORA. Usa casos como Mt. Gox e FTX para discutir riscos sistêmicos e falhas de governança e segurança operacional.

## Volume por subtema

| Subtema | 2024 | 2025 | Variação |
|---|---|---|---|
| voice cloning / face swap | 112 | 369 | +229% |
| concept drift / cost-sensitive | 82 | 254 | +210% |
| account takeover / SIM swap | 56 | 158 | +182% |
| open banking / open finance | 36 | 101 | +181% |
| large language model / large language models | 75 | 209 | +179% |
| graph neural network / graph neural networks | 91 | 253 | +178% |
| instant payment / instant payments | 29 | 77 | +166% |
| operational risk / Basel | 26 | 63 | +142% |
| anti-money laundering / money laundering | 232 | 549 | +137% |
| fraud detection / financial institution | 796 | 1744 | +119% |
| behavioral biometrics / behavioural biometrics | 108 | 223 | +106% |
| synthetic identity / identity fraud | 254 | 458 | +80% |
| financial institution / online banking | 189 | 340 | +80% |
| money mule / money mules | 19 | 34 | +79% |
| (fraud OR scam OR scams) AND (victim OR victims OR victimiza | 232 | 373 | +61% |
| authorized push payment / APP fraud | 61 | 93 | +52% |
| credit card fraud / card fraud | 417 | 608 | +46% |
