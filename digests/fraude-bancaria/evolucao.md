# Evolução do estado da arte — Bank Fraud Watch

<sub>gerado em 2026-11-17 · 36 marcos de uma rede de 954 obras · modelo deepseek-ai/DeepSeek-V4.1-Flash</sub>

O campo nasceu nos anos 1990 resolvendo um problema prático: substituir regras manuais de cartão por modelos estatísticos e redes neurais capazes de lidar com desbalanceamento extremo e custo assimétrico. Nos anos 2000 virou disciplina própria, com revisões canônicas, agregação de transações e modelagem sequencial, enquanto phishing e lavagem entraram no escopo. De 2010 a 2022 a fronteira migrou para escala (streaming, Spark), redes (GNNs heterogêneas e semissupervisionadas) e alinhamento ao P&L (aprendizado sensível a custo). Desde 2023 o eixo é foundation models de transação, fraude generativa e a camada de mulas/AML vista como rede — com pagamentos instantâneos e Open Finance redesenhando a responsabilidade por fraude.

## O que mudou desde 2026-11-17

Entrou o TREASURE (Visa, 2025), segundo foundation model de transação da lista, reforçando a leitura de que a era atual é definida por backbones transacionais e não por modelos por tarefa. Saiu o estudo de esquecimento catastrófico em detecção contínua de cartão (2024) — a preocupação não desapareceu, apenas migrou para a agenda de manutenção e atualização de foundation models, onde o custo de re-treino e o drift de tática do fraudador são hoje o problema central.

- ➕ TREASURE: The Visa Payment Foundation Model for High-Volume Transaction Understanding (2025)
- ➖ Assessment of catastrophic forgetting in continual credit card fraud detection (2024)

## até 1999 · Regras viram modelos estatísticos

A época resolveu um problema concreto: sistemas baseados em regras não davam conta do volume de transações nem da adaptação dos fraudadores. A ideia que virou padrão foi tratar fraude como problema de aprendizado com classes desbalanceadas, custos assimétricos e necessidade de adaptação contínua — com redes neurais e profiling de comportamento batendo regras em produção. Ficou em aberto a escalabilidade sobre volumes massivos e a integração com dados históricos do portador, além de uma teoria de prevenção que explicasse o comportamento do ofensor.

- **[Adaptive Fraud Detection](https://doi.org/10.1023/a:1009700419189)** (1997) — Tom E. Fawcett, Foster John Provost · Data Mining and Knowledge Discovery · cit:1074
  - Fawcett e Provost (1997) formalizaram a detecção de fraude como problema de aprendizado com desbalanceamento e custos assimétricos, e cunharam a exigência de adaptação ao fraudador. É a base conceitual de praticamente tudo que veio depois.
- **[Credit card fraud detection with a neural-network](https://doi.org/10.1109/hicss.1994.323314)** (1994) — Ghosh, Reilly · Hawaii International Conference on System Sciences (HICSS) · cit:558
  - Ghosh e Reilly (1994) mostraram uma rede neural detectando uma ordem de magnitude mais contas fraudulentas com 20x menos falsos positivos que regras. Provou que ML podia substituir sistemas especialistas em cartões.
- **[Distributed data mining in credit card fraud detection](https://doi.org/10.1109/5254.809570)** (1999) — Philip K. Chan, W. Fan, Andreas L. Prodromidis et al. · IEEE Intelligent Systems and their Applications · cit:626
  - Chan, Fan e Prodromidis (1999) levaram a detecção para mineração distribuída sobre volumes massivos de transações. Antecipou a arquitetura de detecção em escala que hoje é padrão em e-commerce e adquirência.
- **[Neural fraud detection in credit card operations](https://doi.org/10.1109/72.595879)** (1997) — José R. Dorronsoro, F. Ginel, C. Sgnchez et al. · IEEE Transactions on Neural Networks · cit:307
  - Dorronsoro et al. (1997) colocaram um classificador neural online em um hub transacional, usando só a operação e o histórico imediato, com versão não linear do discriminante de Fisher para o desbalanceamento. Mostrou que scoring em tempo real é viável sem base histórica do portador.
- **[Social Change and Crime Rate Trends: A Routine Activity Approach](https://doi.org/10.2307/2094589)** (1979) — Lawrence E. Cohen, Marcus Felson · American Sociological Review · cit:12079
  - Cohen e Felson (1979) formularam a teoria das atividades rotineiras: crime exige convergência de ofensor motivado, alvo adequado e ausência de guardião. É o vocabulário que sustenta prevenção situacional e detecção por contexto até hoje.
- **[Combining data mining and machine learning for effective user profiling](https://openalex.org/W2146935111)** (1996) — Tom E. Fawcett, Foster John Provost · Knowledge Discovery and Data Mining · cit:238
  - Fawcett e Provost (1996) combinaram mineração e indução construtiva para criar profilers de comportamento celular, agregando múltiplos sinais em alarmes de alta confiança. Origem direta da ideia de ensemble de detectores e de detecção por desvio de perfil.

## 2000–2009 · Fraude vira problema estatístico

A época consolidou fraude como disciplina estatística e de machine learning, com revisões que organizaram o vocabulário de detecção supervisionada, não supervisionada e de anomalias sob rótulos escassos. Viraram padrão a agregação de transações ao longo do tempo e a modelagem sequencial do comportamento do portador, enquanto phishing e lavagem entraram no escopo com evidência empírica. Ficou em aberto a avaliação por custo real, a robustez a fraudadores adaptativos e a eficácia concreta dos regimes de AML.

- **[Statistical Fraud Detection: A Review](https://doi.org/10.1214/ss/1042727940)** (2002) — Richard J. Bolton, David J. Hand · Statistical Science · cit:2119
  - Bolton e Hand (2002) consolidaram fraude como problema estatístico de detecção com rótulos escassos e adversário adaptativo. É a revisão canônica que definiu o vocabulário do campo.
- **[Why phishing works](https://doi.org/10.1145/1124772.1124861)** (2006) — Rachna Dhamija, J. D. Tygar, Marti A. Hearst · CHI Conference on Human Factors in Computing Systems · cit:1677
  - Dhamija, Tygar e Hearst (2006) deram a primeira evidência empírica de por que o phishing funciona: usuários ignoram barra de endereço e indicadores de segurança. Deslocou o foco de educar o usuário para desenhar defesa técnica.
- **[Cantina: a content-based approach to detecting phishing web sites](https://doi.org/10.1145/1242572.1242659)** (2007) — Zhang Yue, Jason Hong, Lorrie Faith Cranor · International World Wide Web Conference (WWW) · cit:974
  - Zhang, Hong e Cranor (2007) propuseram o CANTINA, detecção de phishing por conteúdo com TF-IDF e ~95% de acerto. Mostrou que análise de conteúdo escala melhor que listas negras.
- **[Money Laundering](https://doi.org/10.1086/501508)** (2006) — Michael Levi, Peter H. Reuter · Crime and Justice · cit:566
  - Levi e Reuter (2006) revisaram criticamente o regime global de AML e concluíram que seus efeitos sobre métodos de lavagem e crime são pouco conhecidos. Fundamento para questionar custo e eficácia de compliance.
- **[Transaction aggregation as a strategy for credit card fraud detection](https://doi.org/10.1007/s10618-008-0116-z)** (2008) — Christopher Whitrow, David J. Hand, Piotr Juszczak et al. · Data Mining and Knowledge Discovery · cit:455
  - Whitrow, Hand e Juszczak (2008) usaram agregação de transações como estratégia de detecção, criando features de comportamento temporal. Virou engenharia de features padrão em cartões.
- **[Credit Card Fraud Detection Using Hidden Markov Model](https://doi.org/10.1109/tdsc.2007.70228)** (2008) — A. Srivastava, A. Kundu, Shamik Sural et al. · IEEE Transactions on Dependable and Secure Computing · cit:650
  - Srivastava, Kundu e Sural (2008) modelaram a sequência de operações do portador com HMM, sinalizando transações improváveis. Antecipou a modelagem sequencial que domina a área hoje.
- **[Credit Card Fraud Detection Using Bayesian and Neural Networks](https://openalex.org/W3127599935)** (2002) — Sam Maes, Karl Tuyls, Bram Vanschoenwinkel et al. · VUBIR (Vrije Universiteit Brussel) · cit:447
  - Maes, Tuyls e Vanschoenwinkel (2002) compararam redes neurais e redes bayesianas em dados reais de cartão, mostrando que métodos de raciocínio sob incerteza funcionam. Ajudou a estabelecer a comparação sistemática de modelos como prática.

## 2010–2017 · Redes, streaming e custo assimétrico

A época resolveu escala e granularidade: streaming com Spark, agregação temporal e as primeiras extensões de rede para cartões. Viraram padrão a avaliação por custo em vez de acurácia, a combinação de sinais relacionais (cartão, comerciante, dispositivo) e os guias práticos que organizaram o pipeline de fraude analítica de ponta a ponta. Ficou em aberto a robustez contra fraudadores que manipulam relações e a captura de dependência sequencial fina.

- **[APATE: A novel approach for automated credit card transaction fraud detection using network-based extensions](https://doi.org/10.1016/j.dss.2015.04.013)** (2015) — Véronique Van Vlasselaer, Cristián Bravo, Olivier Caelen et al. · Decision Support Systems · cit:556
  - Van Vlasselaer et al. (2015) estenderam a detecção de cartão com features de rede ligando cartões, comerciantes e dispositivos no APATE. Primeiro grande passo da análise de redes aplicada a cartões.
- **[SCARFF : A scalable framework for streaming credit card fraud detection with spark](https://doi.org/10.1016/j.inffus.2017.09.005)** (2017) — Fabrizio Carcillo, Andrea Dal Pozzolo, Yann‐Aël Le Borgne et al. · Information Fusion · cit:430
  - Carcillo et al. (2017) entregaram o SCARFF, framework escalável de streaming com Spark combinando supervisionado e não supervisionado. Definiu a arquitetura de detecção em tempo real em larga escala.
- **[Fraud Analytics Using Descriptive, Predictive, and Social Network Techniques: A Guide to Data Science for Fraud Detection](https://doi.org/10.1002/9781119146841)** (2015) — Bart Baesens, Véronique Van Vlasselaer, Wouter Verbeke · Wiley eBooks · cit:351
  - Baesens, Van Vlasselaer e Verbeke (2015) organizaram fraude analítica em descritiva, preditiva e redes sociais, do dado bruto à implementação. Virou o guia prático de referência para montar uma solução completa.
- **[Data mining for credit card fraud: A comparative study](https://doi.org/10.1016/j.dss.2010.08.008)** (2010) — Siddhartha Bhattacharyya, Sanjeev Jha, Kurian Tharakunnel et al. · Decision Support Systems · cit:1532
  - Bhattacharyya et al. (2010) compararam técnicas de mineração em cartão com foco nas métricas adequadas ao desbalanceamento. Padronizou a avaliação por custo, não por acurácia.
- **[The application of data mining techniques in financial fraud detection: A classification framework and an academic review of literature](https://doi.org/10.1016/j.dss.2010.08.006)** (2010) — Eric W.T. Ngai, Yong Qiang Hu, Y.H. Wong et al. · Decision Support Systems · cit:2089
  - Ngai et al. (2010) propuseram um framework de classificação e revisaram a literatura de mineração em fraude financeira. Mapa que organizou o campo por tipo de fraude e técnica.
- **[Fraud detection system: A survey](https://doi.org/10.1016/j.jnca.2016.04.007)** (2016) — Aisha Abdallah, Mohd Aizaini Maarof, Anazida Binti Zainal · Journal of Network and Computer Applications · cit:1040
  - Abdallah et al. (2016) fizeram um survey abrangente de sistemas de detecção, cobrindo técnicas, datasets e desafios. Consolidou o estado da arte imediatamente antes da onda de grafos.
- **[Social Change and Crime Rate Trends: A Routine Activity Approach (1979)](https://doi.org/10.4324/9781439817803-12)** (2010) — L.E. COHEN AND M. FELSON · Routledge eBooks · cit:5995
  - A reedição de Cohen e Felson (2010) reintroduziu a teoria das atividades rotineiras no debate de fraude digital. Reforçou a leitura de fraude como ecossistema, não evento isolado.

## 2018–2022 · Grafos e sequências contra camuflagem

A época atacou dois limites: a dependência temporal fina das transações e a estrutura relacional entre contas, dispositivos e comerciantes. Viraram padrão as GNNs heterogêneas e semissupervisionadas, a classificação de sequências com LSTM e o aprendizado sensível a custo dependente da instância, alinhando o modelo ao P&L. Ficou em aberto a robustez contra camuflagem deliberada do fraudador e a detecção de manipulação sintética de identidade e mídia.

- **[Sequence classification for credit-card fraud detection](https://doi.org/10.1016/j.eswa.2018.01.037)** (2018) — Johannes Jurgovsky, Michael Granitzer, Konstantin Ziegler et al. · Expert Systems with Applications · cit:803
  - Jurgovsky et al. (2018) aplicaram classificação de sequências com LSTM sobre o histórico de transações, capturando dependência temporal. Mostrou ganho real sobre features agregadas estáticas.
- **[Enhancing Graph Neural Network-based Fraud Detectors against Camouflaged Fraudsters](https://doi.org/10.1145/3340531.3411903)** (2020) — Yingtong Dou, Zhiwei Liu, Li Sun et al. · ACM International Conference on Information and Knowledge Management (CIKM) · cit:1044
  - Dou et al. (2020) propuseram o CARE-GNN, primeiro tratamento explícito da camuflagem de fraudadores em features e relações. Definiu o problema central de robustez em detecção por grafos.
- **[FaceForensics++: Learning to Detect Manipulated Facial Images](https://doi.org/10.1109/iccv.2019.00009)** (2019) — Andreas Rössler, Davide Cozzolino, Luisa Verdoliva et al. · IEEE/CVF International Conference on Computer Vision (ICCV) · cit:4824
  - Rössler et al. (2019) criaram o FaceForensics++, benchmark de detecção de manipulação facial com DeepFakes, Face2Face, FaceSwap e NeuralTextures. Base de avaliação para prova de vida e KYC.
- **[Heterogeneous Graph Neural Networks for Malicious Account Detection](https://doi.org/10.1145/3269206.3272010)** (2018) — Ziqi Liu, Chaochao Chen, Xinxing Yang et al. · ACM International Conference on Information and Knowledge Management (CIKM) · cit:519
  - Liu et al. (2018) apresentaram o GEM, primeira GNN heterogênea para contas maliciosas no Alipay, explorando agregação por dispositivo e atividade. Provou que grafos heterogêneos funcionam em escala industrial.
- **[Automatically Dismantling Online Dating Fraud](https://doi.org/10.1109/tifs.2019.2930479)** (2019) — Guillermo Suárez‐Tangil, Matthew Edwards, Claudia Peersman et al. · IEEE Transactions on Information Forensics and Security · cit:126
  - Suárez-Tangil et al. (2019) desmontaram automaticamente perfis de fraude em namoro online, caracterizando arquétipos de golpistas e traços das vítimas. Trouxe resposta data-driven para fraude relacional.
- **[Instance-dependent cost-sensitive learning for detecting transfer fraud](https://doi.org/10.1016/j.ejor.2021.05.028)** (2021) — Sebastiaan Höppner, Bart Baesens, Wouter Verbeke et al. · European Journal of Operational Research · cit:131
  - Höppner, Baesens e Verbeke (2021) formalizaram aprendizado sensível a custo dependente da instância, com custo específico por transação. Alinhou a função objetivo do modelo ao resultado financeiro do banco.
- **[Combining unsupervised and supervised learning in credit card fraud detection](https://doi.org/10.1016/j.ins.2019.05.042)** (2019) — Fabrizio Carcillo, Yann‐Aël Le Borgne, Olivier Caelen et al. · Information Sciences · cit:738
  - Carcillo et al. (2019) combinaram aprendizado não supervisionado e supervisionado para lidar com rótulos escassos e atrasados. Virou padrão para cold start e feedback tardio em cartões.
- **[A Semi-Supervised Graph Attentive Network for Financial Fraud Detection](https://doi.org/10.1109/icdm.2019.00070)** (2019) — Daixin Wang, Jianbin Lin, Peng Cui et al. · Proceedings · cit:650
  - Wang et al. (2019) propuseram uma rede atencional semissupervisionada sobre rede multivisão de usuários. Mostrou como extrair sinal de pouquíssimos rótulos em grafos financeiros.

## 2023 em diante · Foundation models e fraude generativa

A época está resolvendo o custo de construir um modelo por tarefa: modelos de base transacionais treinados em bilhões de eventos passam a servir detecção, previsão e personalização com o mesmo backbone. Ao mesmo tempo, a fraude generativa e a convergência entre golpe relacional e investimento em cripto mudaram o alvo, e AML passou a ser tratado como problema de rede com revisão sistemática e avaliação comparativa. Ficou em aberto a governança de pagamentos instantâneos, a robustez adversarial dos foundation models e a atribuição de responsabilidade entre instituições.

- **[Generative Adversarial Nets](https://doi.org/10.1007/978-3-658-40442-0_9)** (2023) — Raphael Labaca-Castro · Springer eBooks · cit:21130
  - O capítulo de Labaca-Castro (2023) sobre GANs reintroduziu a geração adversarial no contexto de segurança e fraude. Base para entender ataques generativos e o uso de dados sintéticos no treino.
- **[TransactionGPT](https://doi.org/10.48550/arxiv.2511.08939)** (2025) — Yingtong Dou, Zhimeng Jiang, Tianyi Zhang et al. · arXiv (Cornell University) · cit:14
  - Dou et al. (2025) apresentaram o TransactionGPT, foundation model com arquitetura 3D-Transformer treinado em bilhões de transações reais e otimizado conjuntamente para tarefas downstream. Sinaliza a transição de modelos por tarefa para modelos de base transacionais.
- **[Network Analytics for Anti-money Laundering—A Systematic Literature Review and Experimental Evaluation](https://doi.org/10.1287/ijds.2024.0042)** (2025) — Bruno Deprez, Toon Vanderschueren, Bart Baesens et al. · INFORMS Journal on Data Science · cit:54
  - Deprez, Vanderschueren e Baesens (2025) revisaram 97 papers de network analytics para AML com taxonomia e avaliação experimental comparativa. Organiza um campo fragmentado e mede poder relativo de detecção.
- **[Romance baiting, cryptorom and ‘pig butchering’: an evolutionary step in romance fraud](https://doi.org/10.1080/10345329.2023.2248670)** (2023) — Cassandra Cross · Current Issues in Criminal Justice · cit:66
  - Cross (2023) analisou a convergência entre fraude romântica e investimento — romance baiting, cryptorom e pig butchering. Mostra que o golpe migrou para cripto com a própria vítima operando a conta.
- **[FraudGNN-RL: A Graph Neural Network With Reinforcement Learning for Adaptive Financial Fraud Detection](https://doi.org/10.1109/ojcs.2025.3543450)** (2025) — Yiwen Cui, Xu Han, Jiaying Chen et al. · IEEE Open Journal of the Computer Society · cit:133
  - Cui et al. (2025) propuseram o FraudGNN-RL, GNN com reinforcement learning sobre grafo dinâmico e convolução temporal-espacial-semântica. Aponta para detecção adaptativa que reage ao fraudador em tempo quase real.
- **[LGM-GNN: A Local and Global Aware Memory-Based Graph Neural Network for Fraud Detection](https://doi.org/10.1109/tbdata.2023.3234529)** (2023) — Pengbo Li, Hang Yu, Xiangfeng Luo et al. · IEEE Transactions on Big Data · cit:93
  - Li et al. (2023) criaram o LGM-GNN, com memória local e global para capturar anomalias que só aparecem na visão global do grafo. Corrige o viés local dos agregadores de vizinhança.
- 🆕 **[TREASURE: The Visa Payment Foundation Model for High-Volume Transaction Understanding](https://doi.org/10.48550/arxiv.2511.19693)** (2025) — Chin‐Chia Michael Yeh, Uday Singh Saini, Dai, Xin et al. · arXiv (Cornell University) · cit:8
  - Yeh et al. (2025) apresentaram o TREASURE, foundation model transformer da Visa que captura comportamento do consumidor e sinais da rede de pagamentos. Segundo grande foundation model de transação, confirma a corrida industrial pelo backbone único.
- **[Cybercriminal networks in the UK and Beyond: Network structure, criminal cooperation and external interactions](https://doi.org/10.1007/s12117-022-09476-9)** (2023) — Jonathan Lusthaus, E.R. Kleemans, Rutger Leukfeldt et al. · Trends in Organized Crime · cit:65
  - Lusthaus, Kleemans e Leukfeldt (2023) analisaram 10 investigações fechadas de cibercrime e mostraram a divisão entre componentes de ataque/golpe e de dinheiro, com forte presença offline. Evidencia que a camada de mulas é o gargalo operacional do crime financeiro.

## Onde estamos agora

O campo está em duas frentes simultâneas. De um lado, a corrida por foundation models transacionais — TransactionGPT e TREASURE, e agora o Large Payments Model com até 400 bilhões de tokens e codificação por campo — promete substituir dezenas de modelos por tarefa e unificar detecção, previsão e personalização. De outro, o desenho institucional voltou ao centro: o Bank of Canada modela controle centralizado versus descentralizado de fraude em pagamentos instantâneos e mostra que governança centralizada não atinge a alocação ótima por excluir pagamentos pequenos via tarifas, enquanto a Resolução Conjunta BC/CMN 21/2026 refina responsabilidades no Open Finance para pessoa jurídica. No ataque, o foco saiu do evento isolado: o primeiro estudo holístico de ataques de acesso persistente mapeou 11 rotas para o invasor manter acesso mesmo após remediação, e a fraude relacional migrou para cripto com a vítima operando a conta. A pergunta prática deixou de ser 'qual modelo usar' e passou a ser 'quem responde pelo prejuízo e como o modelo de base se mantém robusto sob adversário ativo'.

- Foundation models de transação generalizam entre instituições ou só funcionam dentro da rede que os treinou?
- Quem paga a conta em pagamentos instantâneos: banco emissor, recebedor ou esquema de governança centralizada?
- Como manter detecção contínua sem esquecimento catastrófico quando o fraudador muda de tática a cada trimestre?
- A camada de mulas e contas laranja é detectável a tempo, ou o gargalo é jurídico e não analítico?
- Modelos sensíveis a custo dependente da instância sobrevivem à auditoria regulatória e à explicabilidade exigida?

## Linhas por tema

- **📊 Modelos, dados e métricas de fraude**: Começou como formalização estatística do problema em Fawcett e Provost (1997) e revisões canônicas nos anos 2000, evoluiu para ensembles de profilers, avaliação por custo e surveys estruturados em 2010–2017, depois para GNNs semissupervisionadas e aprendizado sensível a custo em 2018–2022, e agora desemboca em foundation models transacionais (TransactionGPT, TREASURE) e GNNs com reinforcement learning.
- **💳 Cartões & e-commerce**: Saiu de redes neurais superando regras em 1994 e mineração distribuída em 1999, passou por agregação de transações e HMM nos anos 2000, ganhou features de rede e streaming com Spark em 2010–2017, e chegou a classificação de sequências com LSTM e combinação supervisionado/não supervisionado em 2018–2022 — hoje o cartão é só um dos canais dentro de modelos de base transacionais.
- **🎣 Golpes e engenharia social**: A teoria das atividades rotineiras de Cohen e Felson (1979) deu o arcabouço, os estudos de phishing (2006–2007) mostraram que o elo humano é o vetor, a fraude relacional ganhou resposta data-driven em 2019, e desde 2023 o golpe se fundiu com investimento em cripto sob rótulos como romance baiting e pig butchering.
- **🕸️ Contas laranja, mulas & PLD/CFT**: Levi e Reuter (2006) já apontavam que o regime de AML tinha efeitos mal medidos; a resposta veio com network analytics, sistematizada na revisão de 97 papers de Deprez et al. (2025), enquanto Lusthaus et al. (2023) mostraram empiricamente que a camada de dinheiro e mulas é o gargalo operacional das redes criminosas.
- **🤖 IA generativa & deepfakes**: O FaceForensics++ (2019) criou o benchmark de detecção de mídia manipulada, e a partir de 2023 a geração adversarial entrou de vez no vocabulário de fraude, tanto como ameaça a KYC e prova de vida quanto como fonte de dados sintéticos para treino.
