# Evolução do estado da arte — Bank Fraud Watch

<sub>gerado em 2026-11-17 · 33 marcos de uma rede de 978 obras · modelo deepseek-ai/DeepSeek-V4.1-Flash</sub>

O campo nasce da criminologia ambiental de Cohen e Felson (1979) e da detecção estatística/ML de fraude em cartões nos anos 1990, com Fawcett e Provost formalizando perfilagem adaptativa e custos. Nos anos 2000, revisões de Bolton & Hand e surveys consolidam o uso de estatística e aprendizado de máquina, enquanto phishing e AML entram no escopo. Nos anos 2010, engenharia de features, streaming, redes e modelagem realista de drift/latência viram padrão. A partir de 2018, grafos, sequências, deepfakes e foundation models transacionais deslocam o estado da arte para representações de rede e modelos de fundação, com governança de pagamentos instantâneos e Open Finance como fronteira atual.

## O que mudou desde 2026-11-17

Em relação à versão anterior, entraram 14 marcos, com clássicos de perfilagem/rotina de atividades, AML e uma onda 2023+ de GNNs e foundation models transacionais; saíram 18, incluindo redes neurais antigas, deepfake e revisões GNN. A curadoria fica mais centrada em modelos de fundação, redes criminais e governança de pagamentos instantâneos/Open Finance.

- ➕ Social Change and Crime Rate Trends: A Routine Activity Approach (1979)
- ➕ Combining data mining and machine learning for effective user profiling (1996)
- ➕ Money Laundering (2006)
- ➕ Credit Card Fraud Detection Using Hidden Markov Model (2008)
- ➕ Survey of fraud detection techniques (2004)
- ➕ APATE: A novel approach for automated credit card transaction fraud detection using network-based extensions (2015)
- ➕ SCARFF : A scalable framework for streaming credit card fraud detection with spark (2017)
- ➕ Automatically Dismantling Online Dating Fraud (2019)
- ➕ Instance-dependent cost-sensitive learning for detecting transfer fraud (2021)
- ➕ TransactionGPT (2025)
- ➕ FraudGNN-RL: A Graph Neural Network With Reinforcement Learning for Adaptive Financial Fraud Detection (2025)
- ➕ LGM-GNN: A Local and Global Aware Memory-Based Graph Neural Network for Fraud Detection (2023)
- ➕ TREASURE: The Visa Payment Foundation Model for High-Volume Transaction Understanding (2025)
- ➕ Cybercriminal networks in the UK and Beyond: Network structure, criminal cooperation and external interactions (2023)
- ➖ Neural fraud detection in credit card operations (1997)
- ➖ Credit Card Fraud Detection Using Meta-Learning: Issues and Initial Results 1 (1997)
- ➖ Toward scalable learning with non-uniform class and cost distributions: a case study in credit card fraud detection (1998)
- ➖ Unsupervised Profiling Methods for Fraud Detection (2002)
- ➖ Credit Card Fraud Detection Using Bayesian and Neural Networks (2002)
- ➖ Neural data mining for credit card fraud detection (2003)
- ➖ Cantina: a content-based approach to detecting phishing web sites (2007)
- ➖ A cost-sensitive decision tree approach for fraud detection (2013)
- ➖ Learned lessons in credit card fraud detection from a practitioner perspective (2014)
- ➖ Intelligent financial fraud detection: A comprehensive review (2015)
- ➖ Exposing DeepFake Videos By Detecting Face Warping Artifacts (2018)
- ➖ Credit Card Fraud Detection Using AdaBoost and Majority Voting (2018)
- ➖ Deepfake detection using deep learning methods: A systematic and comprehensive review (2023)
- ➖ Financial fraud detection using graph neural networks: A systematic review (2023)
- ➖ Graph neural networks for financial fraud detection: a review (2025)
- ➖ ASA-GNN: Adaptive Sampling and Aggregation-Based Graph Neural Network for Transaction Fraud Detection (2023)
- ➖ Transparency and Privacy: The Role of Explainable AI and Federated Learning in Financial Fraud Detection (2024)

## até 1999 · Regras, redes neurais e perfilagem

Resolveu a passagem de regras manuais para modelos de comportamento e aprendizado supervisionado, com foco em cartões e telecom. A ideia que virou padrão foi perfilagem do usuário, detecção adaptativa e combinação de múltiplos detectores. Ficaram em aberto escala, desbalanceamento extremo, custo de erro e adaptação contínua ao fraudador.

- **[Adaptive Fraud Detection](https://doi.org/10.1023/a:1009700419189)** (1997) — Tom E. Fawcett, Foster John Provost · Data Mining and Knowledge Discovery · cit:1074
  - Fawcett e Provost (1997) formalizam detecção adaptativa de fraude, com custos e mudança de comportamento. Torna-se referência para sistemas que aprendem com fraude e ajustam decisões ao longo do tempo.
- **[Credit card fraud detection with a neural-network](https://doi.org/10.1109/hicss.1994.323314)** (1994) — Ghosh, Reilly · Hawaii International Conference on System Sciences (HICSS) · cit:558
  - Ghosh e Reilly (1994) aplicam rede neural a transações de cartão e relatam ordem de magnitude mais fraude detectada e redução de falsos positivos contra regras. Mostra que ML supera sistemas baseados em regras em dados reais.
- **[Distributed data mining in credit card fraud detection](https://doi.org/10.1109/5254.809570)** (1999) — Philip K. Chan, W. Fan, Andreas L. Prodromidis et al. · IEEE Intelligent Systems and their Applications · cit:626
  - Chan, Fan e Prodromidis (1999) tratam mineração distribuída em cartões e e-commerce, atacando escala e eficiência. Antecipa a necessidade de detectores distribuídos em volumes massivos de transações.
- 🆕 **[Social Change and Crime Rate Trends: A Routine Activity Approach](https://doi.org/10.2307/2094589)** (1979) — Lawrence E. Cohen, Marcus Felson · American Sociological Review · cit:12079
  - Cohen e Felson (1979) formalizam a rotina de atividades: crime ocorre na convergência de ofensor motivado, alvo e ausência de guardião. É a base criminológica para prevenção situacional e análise de oportunidade em fraude.
- 🆕 **[Combining data mining and machine learning for effective user profiling](https://openalex.org/W2146935111)** (1996) — Tom E. Fawcett, Foster John Provost · Knowledge Discovery and Data Mining · cit:238
  - Fawcett e Provost (1996) combinam data mining e constructive induction para perfilar uso de celular e gerar alarmes de alta confiança. Consolida perfil comportamental e combinação de múltiplos profilers.

## 2000–2009 · Estatística, phishing e escalabilidade

Consolidou estatística e aprendizado de máquina como base da detecção, com revisões que definiram desafios de desbalanceamento, adaptatividade e custo. Phishing e AML entraram no escopo, ampliando fraude para canais digitais e fluxos financeiros. O que ficou em aberto foi avaliação realista, integração de sinais e efetividade das respostas regulatórias.

- **[Statistical Fraud Detection: A Review](https://doi.org/10.1214/ss/1042727940)** (2002) — Richard J. Bolton, David J. Hand · Statistical Science · cit:2119
  - Bolton e Hand (2002) revisam detecção estatística de fraude e organizam desafios como desbalanceamento, adaptatividade e custos. Vira referência para conectar estatística, ML e aplicações antifraude.
- **[Why phishing works](https://doi.org/10.1145/1124772.1124861)** (2006) — Rachna Dhamija, J. D. Tygar, Marti A. Hearst · CHI Conference on Human Factors in Computing Systems · cit:1677
  - Dhamija, Tygar e Hearst (2006) fornecem evidência empírica de por que phishing funciona, mostrando que usuários ignoram indicadores de navegador. Muda o desenho de defesas centradas no usuário.
- 🆕 **[Money Laundering](https://doi.org/10.1086/501508)** (2006) — Michael Levi, Peter H. Reuter · Crime and Justice · cit:566
  - Levi e Reuter (2006) analisam money laundering e concluem que o regime AML global tem efeitos pouco comprovados. Base para discutir efetividade, custo e desenho regulatório.
- **[Transaction aggregation as a strategy for credit card fraud detection](https://doi.org/10.1007/s10618-008-0116-z)** (2008) — Christopher Whitrow, David J. Hand, Piotr Juszczak et al. · Data Mining and Knowledge Discovery · cit:455
  - Whitrow, Hand e Juszczak (2008) usam agregação de transações como estratégia de detecção em cartões. Torna-se padrão de feature engineering para capturar comportamento acumulado.
- 🆕 **[Credit Card Fraud Detection Using Hidden Markov Model](https://doi.org/10.1109/tdsc.2007.70228)** (2008) — A. Srivastava, A. Kundu, Shamik Sural et al. · IEEE Transactions on Dependable and Secure Computing · cit:650
  - Srivastava, Kundu e Sural (2008) modelam sequência de operações com Hidden Markov Model. Introduz dependência temporal explícita na detecção de fraude em cartões.
- 🆕 **[Survey of fraud detection techniques](https://doi.org/10.1109/icnsc.2004.1297040)** (2004) — Yufeng Kou, Chang‐Tien Lu, S. Sirwongwattana et al. · IEEE International Conference on Networking, Sensing and Control (ICNSC) · cit:623
  - Kou, Lu e Sirwongwattana (2004) fazem survey de técnicas em cartões, telecom e intrusão. Padroniza vocabulário e mostra a diversidade de métodos além de cartões.
- **[Learning to detect phishing emails](https://doi.org/10.1145/1242572.1242660)** (2007) — Ian Fette, Norman Sadeh, Anthony Tomasic · International World Wide Web Conference (WWW) · cit:784
  - Fette, Sadeh e Tomasic (2007) aplicam ML a features de e-mail para detectar phishing. Operacionaliza a detecção automatizada de engenharia social em larga escala.

## 2010–2017 · Mineração em escala e custo-sensibilidade

Trouxe escala, streaming e engenharia de features para o centro, com benchmarks e frameworks de mineração em fraude financeira. Redes de transações e modelagem realista de concept drift, desbalanceamento e latência de verificação viraram referência. Ficaram em aberto explicabilidade, custo operacional e robustez contra adversários adaptativos.

- 🆕 **[APATE: A novel approach for automated credit card transaction fraud detection using network-based extensions](https://doi.org/10.1016/j.dss.2015.04.013)** (2015) — Véronique Van Vlasselaer, Cristián Bravo, Olivier Caelen et al. · Decision Support Systems · cit:556
  - Van Vlasselaer, Bravo e Caelen (2015) apresentam APATE com extensões de rede para cartões. Antecipa a virada para graph analytics ao usar relações entre transações e entidades.
- 🆕 **[SCARFF : A scalable framework for streaming credit card fraud detection with spark](https://doi.org/10.1016/j.inffus.2017.09.005)** (2017) — Fabrizio Carcillo, Andrea Dal Pozzolo, Yann‐Aël Le Borgne et al. · Information Fusion · cit:430
  - Carcillo, Dal Pozzolo e Le Borgne (2017) propõem SCARFF, framework escalável de streaming com Spark. Ataca latência e volume em detecção de cartões.
- **[Fraud Analytics Using Descriptive, Predictive, and Social Network Techniques: A Guide to Data Science for Fraud Detection](https://doi.org/10.1002/9781119146841)** (2015) — Bart Baesens, Véronique Van Vlasselaer, Wouter Verbeke · Wiley eBooks · cit:351
  - Baesens, Van Vlasselaer e Verbeke (2015) publicam guia de fraud analytics com técnicas descritivas, preditivas e redes sociais. Consolida prática e teoria para implantação de soluções.
- **[Data mining for credit card fraud: A comparative study](https://doi.org/10.1016/j.dss.2010.08.008)** (2010) — Siddhartha Bhattacharyya, Sanjeev Jha, Kurian Tharakunnel et al. · Decision Support Systems · cit:1532
  - Bhattacharyya, Jha e Tharakunnel (2010) comparam técnicas de data mining em cartões. Vira benchmark para avaliar métodos em fraude de cartão.
- **[The application of data mining techniques in financial fraud detection: A classification framework and an academic review of literature](https://doi.org/10.1016/j.dss.2010.08.006)** (2010) — Eric W.T. Ngai, Yong Qiang Hu, Y.H. Wong et al. · Decision Support Systems · cit:2089
  - Ngai, Hu e Wong (2010) propõem framework de classificação e revisão acadêmica de data mining em fraude financeira. Organiza o campo e orienta escolhas metodológicas.
- **[Credit Card Fraud Detection: A Realistic Modeling and a Novel Learning Strategy](https://doi.org/10.1109/tnnls.2017.2736643)** (2017) — Andrea Dal Pozzolo, Giacomo Boracchi, Olivier Caelen et al. · IEEE Transactions on Neural Networks and Learning Systems · cit:1077
  - Dal Pozzolo, Boracchi e Caelen (2017) modelam fraude de forma realista com concept drift, desbalanceamento e verification latency. Torna-se referência para avaliação e aprendizado em sistemas reais.
- **[Feature engineering strategies for credit card fraud detection](https://doi.org/10.1016/j.eswa.2015.12.030)** (2016) — Alejandro Correa Bahnsen, Djamila Aouada, Aleksandar Stojanović et al. · Expert Systems with Applications · cit:673
  - Bahnsen, Aouada e Stojanović (2016) mostram estratégias de feature engineering para cartões. Evidencia que features bem desenhadas superam ganhos apenas de algoritmo.

## 2018–2022 · Grafos, sequências e camuflagem

Deslocou o estado da arte para grafos, sequências e representações de relacionamento, com GNNs aplicadas a contas maliciosas e camuflagem. Deepfakes e fraudes sociais entraram como riscos de identidade e engenharia social. Custo-sensibilidade e combinação não/supervisionada avançaram, mas robustez adversarial, privacidade e explicabilidade seguem abertas.

- **[Sequence classification for credit-card fraud detection](https://doi.org/10.1016/j.eswa.2018.01.037)** (2018) — Johannes Jurgovsky, Michael Granitzer, Konstantin Ziegler et al. · Expert Systems with Applications · cit:803
  - Jurgovsky, Granitzer e Ziegler (2018) aplicam classificação de sequências a cartões. Captura padrões temporais e melhora detecção além de modelos tabulares.
- **[Enhancing Graph Neural Network-based Fraud Detectors against Camouflaged Fraudsters](https://doi.org/10.1145/3340531.3411903)** (2020) — Yingtong Dou, Zhiwei Liu, Li Sun et al. · ACM International Conference on Information and Knowledge Management (CIKM) · cit:1044
  - Dou, Liu e Sun (2020) tratam camuflagem de fraudadores em GNNs, com feature e relation camouflage. Evidencia que o adversário adapta comportamento para enganar agregadores de grafo.
- **[FaceForensics++: Learning to Detect Manipulated Facial Images](https://doi.org/10.1109/iccv.2019.00009)** (2019) — Andreas Rössler, Davide Cozzolino, Luisa Verdoliva et al. · IEEE/CVF International Conference on Computer Vision (ICCV) · cit:4824
  - Rössler, Cozzolino e Verdoliva (2019) criam FaceForensics++ como benchmark de detecção de deepfakes. Traz mídia sintética para o risco de fraude de identidade e desinformação.
- **[Heterogeneous Graph Neural Networks for Malicious Account Detection](https://doi.org/10.1145/3269206.3272010)** (2018) — Ziqi Liu, Chaochao Chen, Xinxing Yang et al. · ACM International Conference on Information and Knowledge Management (CIKM) · cit:519
  - Liu, Chen e Yang (2018) apresentam GEM, GNN heterogêneo para contas maliciosas no Alipay. Usa grafo conta-dispositivo e atenção para detectar agregação de atacantes em produção.
- 🆕 **[Automatically Dismantling Online Dating Fraud](https://doi.org/10.1109/tifs.2019.2930479)** (2019) — Guillermo Suárez‐Tangil, Matthew Edwards, Claudia Peersman et al. · IEEE Transactions on Information Forensics and Security · cit:126
  - Suárez-Tangil, Edwards e Peersman (2019) analisam perfis de romance scam em sites de namoro. Mostra detecção data-driven em fraude social, além de transações.
- 🆕 **[Instance-dependent cost-sensitive learning for detecting transfer fraud](https://doi.org/10.1016/j.ejor.2021.05.028)** (2021) — Sebastiaan Höppner, Bart Baesens, Wouter Verbeke et al. · European Journal of Operational Research · cit:131
  - Höppner, Baesens e Verbeke (2021) propõem aprendizado sensível a custo dependente da instância para transfer fraud. Alinha decisão ao custo real de cada erro, não só à acurácia.
- **[Combining unsupervised and supervised learning in credit card fraud detection](https://doi.org/10.1016/j.ins.2019.05.042)** (2019) — Fabrizio Carcillo, Yann‐Aël Le Borgne, Olivier Caelen et al. · Information Sciences · cit:738
  - Carcillo, Le Borgne e Caelen (2019) combinam aprendizado não supervisionado e supervisionado em cartões. Endereça rótulos escassos e melhora robustez em produção.

## 2023 em diante · Foundation models e redes criminais

Consolida foundation models transacionais, GNNs com RL e network analytics para AML, usando bilhões de eventos e representações generalistas. Scams evoluem para romance baiting, cryptorom e pig butchering, enquanto redes criminosas são estudadas como sistema. O que falta é validação independente, governança, custo e defesa contra adversário ativo em tempo real.

- 🆕 **[TransactionGPT](https://doi.org/10.48550/arxiv.2511.08939)** (2025) — Yingtong Dou, Zhimeng Jiang, Tianyi Zhang et al. · arXiv (Cornell University) · cit:14
  - Dou, Jiang e Zhang (2025) apresentam TransactionGPT, foundation model para transações de uma grande rede de pagamentos. Usa 3D-Transformer e bilhões de transações para múltiplas tarefas downstream.
- **[Network Analytics for Anti-money Laundering—A Systematic Literature Review and Experimental Evaluation](https://doi.org/10.1287/ijds.2024.0042)** (2025) — Bruno Deprez, Toon Vanderschueren, Bart Baesens et al. · INFORMS Journal on Data Science · cit:54
  - Deprez, Vanderschueren e Baesens (2025) revisam sistematicamente network analytics para AML e avaliam experimentalmente. Consolida evidência e taxonomia em um campo fragmentado.
- **[Romance baiting, cryptorom and ‘pig butchering’: an evolutionary step in romance fraud](https://doi.org/10.1080/10345329.2023.2248670)** (2023) — Cassandra Cross · Current Issues in Criminal Justice · cit:66
  - Cross (2023) descreve a evolução de romance fraud para romance baiting, cryptorom e pig butchering. Mostra a convergência entre engenharia social e investimento em cripto.
- 🆕 **[FraudGNN-RL: A Graph Neural Network With Reinforcement Learning for Adaptive Financial Fraud Detection](https://doi.org/10.1109/ojcs.2025.3543450)** (2025) — Yiwen Cui, Xu Han, Jiaying Chen et al. · IEEE Open Journal of the Computer Society · cit:133
  - Cui, Han e Chen (2025) propõem FraudGNN-RL, combinando GNN e reinforcement learning para detecção adaptativa. Modela grafo dinâmico com padrões temporal, espacial e semântico.
- 🆕 **[LGM-GNN: A Local and Global Aware Memory-Based Graph Neural Network for Fraud Detection](https://doi.org/10.1109/tbdata.2023.3234529)** (2023) — Pengbo Li, Hang Yu, Xiangfeng Luo et al. · IEEE Transactions on Big Data · cit:93
  - Li, Yu e Luo (2023) propõem LGM-GNN com memória local e global para fraude. Captura contexto global além da vizinhança local, importante em e-commerce.
- 🆕 **[TREASURE: The Visa Payment Foundation Model for High-Volume Transaction Understanding](https://doi.org/10.48550/arxiv.2511.19693)** (2025) — Chin‐Chia Michael Yeh, Uday Singh Saini, Dai, Xin et al. · arXiv (Cornell University) · cit:8
  - Yeh, Saini e Dai (2025) apresentam TREASURE, foundation model transformer da Visa para transações. Captura comportamento do consumidor e sinais da rede de pagamentos para anomalias e personalização.
- 🆕 **[Cybercriminal networks in the UK and Beyond: Network structure, criminal cooperation and external interactions](https://doi.org/10.1007/s12117-022-09476-9)** (2023) — Jonathan Lusthaus, E.R. Kleemans, Rutger Leukfeldt et al. · Trends in Organized Crime · cit:65
  - Lusthaus, Kleemans e Leukfeldt (2023) analisam 10 casos de redes criminais cibernéticas no Reino Unido e além. Mostra divisão entre ataque/scam e componentes de dinheiro, base para AML e mulas.

## Onde estamos agora

Hoje o campo combina foundation models de transações (TransactionGPT, TREASURE, Large Payments Model) com GNNs adaptativas e network analytics para AML, buscando representações generalistas em escala de bilhões de eventos. Os destaques recentes mostram a pressão regulatória e de produto: pagamentos instantâneos exigem desenho ótimo de responsabilidade e proteção ao consumidor, enquanto Open Finance amplia compartilhamento de dados e responsabilidades. Ataques de acesso persistente na web lembram que fraude não é só transação: identidade, consentimento e recuperação de conta são superfícies críticas. A fronteira é validar esses modelos em produção, com custo, explicabilidade, privacidade e adversário ativo.

- Como calibrar responsabilidade em pagamentos instantâneos sem excluir pagamentos pequenos?
- Foundation models transacionais generalizam entre bancos, países e regimes de privacidade?
- Como defender identidade e consentimento contra ataques de acesso persistente?
- Como medir custo real e explicar decisões em tempo real com drift e camuflagem?
- Open Finance aumenta a superfície de fraude de consentimento e parceiros?

## Linhas por tema

- **📊 Modelos, dados e métricas de fraude**: Evolui de perfilagem e detecção adaptativa (Fawcett & Provost, 1996–1997) e revisões estatísticas (Bolton & Hand, 2002) para engenharia de features, custo-sensibilidade e, em 2023+, GNNs e foundation models transacionais (TransactionGPT, TREASURE).
- **💳 Cartões & e-commerce**: Sai de redes neurais (Ghosh & Reilly, 1994) e mineração distribuída (1999) para HMM e agregação de transações (2008), streaming e modelagem realista (2017), chegando a sequências e combinação não/supervisionada (2018–2019).
- **🎣 Golpes e engenharia social**: Parte da rotina de atividades (Cohen & Felson, 1979), passa por phishing (2006–2007) e romance scam (2019), e chega a romance baiting, cryptorom e pig butchering (2023).
- **🕸️ Contas laranja, mulas & PLD/CFT**: Começa com a crítica à efetividade do regime AML (Levi & Reuter, 2006), avança para redes criminosas (2023) e network analytics para AML (2025), conectando mulas, cripto e fluxos financeiros.
