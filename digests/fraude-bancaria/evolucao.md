# Evolução do estado da arte — Bank Fraud Watch

<sub>gerado em 2026-11-17 · 34 marcos de uma rede de 648 obras · modelo deepseek-ai/DeepSeek-V4.1-Flash</sub>

O campo nasceu nos anos 1990 como um problema de mineração de dados sobre transações de cartão: classes extremamente desbalanceadas, custo assimétrico do erro e necessidade de rodar em volume industrial. A década de 2000 consolidou o vocabulário estatístico (Bolton & Hand, 2002) e abriu uma segunda frente, o phishing, quando o canal migrou para a web. Entre 2010 e 2017 a área virou engenharia: modelagem realista com concept drift, latência de verificação e engenharia de features passou a valer mais que a escolha do algoritmo. De 2018 em diante, grafos e aprendizado de representação assumiram o centro, e desde 2023 o alvo se ampliou para deepfakes e IA generativa, sob pressão simultânea por explicabilidade, privacidade e modelos de fundação treinados em dados transacionais.

## até 1999 · Cartão, redes neurais e classes raras

A época resolveu uma dúvida prática: aprendizado de máquina bate sistemas de regras em fraude de cartão. O padrão que se firmou foi avaliar por taxa de detecção e falso alarme, não por acurácia, e treinar sobre dados reais de emissor com custo de erro não uniforme. Ficaram em aberto a escala (milhões de transações por dia), a escassez de rótulos confiáveis e a adaptação contínua ao fraudador que muda de tática.

- **[Credit card fraud detection with a neural-network](https://doi.org/10.1109/hicss.1994.323314)** (1994) — Ghosh, Reilly · Hawaii International Conference on System Sciences (HICSS) · cit:558
  - Primeiro resultado forte de rede neural em dados reais de um emissor: detectou uma ordem de magnitude mais contas fraudulentas com 20x menos falsos positivos que procedimentos baseados em regras. Estabeleceu o argumento de que ML supera regra em fraude de cartão.
- **[Adaptive Fraud Detection](https://doi.org/10.1023/a:1009700419189)** (1997) — Tom E. Fawcett, Foster John Provost · Data Mining and Knowledge Discovery · cit:1074
  - Fawcett e Provost formulam a detecção adaptativa, em que o detector reaprende conforme o fraudador se adapta. É a raiz direta do conceito de concept drift aplicado a fraude.
- **[Neural fraud detection in credit card operations](https://doi.org/10.1109/72.595879)** (1997) — José R. Dorronsoro, F. Ginel, C. Sgnchez et al. · IEEE Transactions on Neural Networks · cit:307
  - Sistema online instalado em hub transacional, decidindo apenas com a operação corrente e seu histórico imediato, sem base histórica do portador. Antecipa o scoring em tempo real com restrição de latência e de dados.
- **[Credit Card Fraud Detection Using Meta-Learning: Issues and Initial Results 1](https://openalex.org/W2405680064)** (1997) — Salvatore J. Stolfo, David W. Fan, Wenke Lee et al. · s/ venue · cit:234
  - Stolfo, Fan e Lee argumentam que taxa de captura e taxa de falso alarme são métricas melhores que acurácia global. Virou o padrão de avaliação que a área usa até hoje.
- **[Toward scalable learning with non-uniform class and cost distributions: a case study in credit card fraud detection](https://openalex.org/W145450961)** (1998) — Philip K. Chan, Salvatore J. Stolfo · Knowledge Discovery and Data Mining · cit:547
  - Chan e Stolfo tratam distribuição de classes enviesada e custo por erro não uniforme com meta-aprendizado multi-classificador. Liga fraude ao problema geral de aprendizado sensível a custo.
- **[Distributed data mining in credit card fraud detection](https://doi.org/10.1109/5254.809570)** (1999) — Philip K. Chan, W. Fan, Andreas L. Prodromidis et al. · IEEE Intelligent Systems and their Applications · cit:626
  - Mineração distribuída para volume massivo e e-commerce, com foco em escalabilidade e eficiência. Coloca a capacidade de processar dados em escala como requisito de primeira classe, não detalhe de implementação.

## 2000–2009 · Estatística, phishing e agregação de transações

A década organizou o campo: revisões estatísticas deram vocabulário comum e reconheceram que o fraudador é adaptativo, o que torna a prevenção insuficiente por si só. Em paralelo, a migração para a web criou uma frente nova — phishing — e a pesquisa de usabilidade mostrou por que usuários caem. Do lado do cartão, o avanço concreto foi representar o histórico do portador por agregações, e não apenas a transação isolada. Ficou em aberto como calibrar probabilidades e custos em produção e como defender o usuário final, não só o banco.

- **[Statistical Fraud Detection: A Review](https://doi.org/10.1214/ss/1042727940)** (2002) — Richard J. Bolton, David J. Hand · Statistical Science · cit:2119
  - Bolton e Hand fazem a revisão de referência em detecção estatística de fraude, cobrindo cartão, lavagem, telecom e e-commerce. Define o vocabulário e a agenda da área por mais de uma década.
- **[Unsupervised Profiling Methods for Fraud Detection](https://openalex.org/W2585459224)** (2002) — Richard J. Bolton, David J. Hand · s/ venue · cit:385
  - Profiling não supervisionado sobre dados longitudinais para fraude comportamental, separando-a de fraude de aplicação. É a base dos modelos de desvio de comportamento do portador.
- **[Credit Card Fraud Detection Using Bayesian and Neural Networks](https://openalex.org/W3127599935)** (2002) — Sam Maes, Karl Tuyls, Bram Vanschoenwinkel et al. · VUBIR (Vrije Universiteit Brussel) · cit:447
  - Compara redes bayesianas e redes neurais em dados financeiros reais e aponta direções de melhoria. Traz probabilidade calibrada para a decisão de bloquear ou não.
- **[Neural data mining for credit card fraud detection](https://doi.org/10.1109/tai.1999.809773)** (2003) — Rüdiger W. Brause, T. Langsdorf, M. Hepp · IEEE International Conference on Tools with Artificial Intelligence (ICTAI) · cit:401
  - Brause e coautores mostram que, com uma fraude em mil transações, o alvo de qualidade é acima de 99,9%, e combinam data mining com rede neural para cobertura alta e falso alarme baixo. Formaliza o patamar de exigência operacional.
- **[Why phishing works](https://doi.org/10.1145/1124772.1124861)** (2006) — Rachna Dhamija, J. D. Tygar, Marti A. Hearst · CHI Conference on Human Factors in Computing Systems · cit:1677
  - Dhamija, Tygar e Hearst dão a primeira evidência empírica de por que o phishing funciona: 23% dos participantes nem olhavam indicadores de navegador. Redireciona a defesa de tecnologia para usabilidade.
- **[Cantina: a content-based approach to detecting phishing web sites](https://doi.org/10.1145/1242572.1242659)** (2007) — Zhang Yue, Jason Hong, Lorrie Faith Cranor · International World Wide Web Conference (WWW) · cit:974
  - Cantina detecta sites de phishing por conteúdo com TF-IDF e heurísticas, acertando cerca de 95%. Inaugura a defesa automatizada no lado do site, complementar à educação do usuário.
- **[Transaction aggregation as a strategy for credit card fraud detection](https://doi.org/10.1007/s10618-008-0116-z)** (2008) — Christopher Whitrow, David J. Hand, Piotr Juszczak et al. · Data Mining and Knowledge Discovery · cit:455
  - Whitrow e coautores mostram que agregar transações ao longo do tempo é uma estratégia eficaz de detecção. Consolida a ideia de que a representação do histórico importa mais que o classificador.

## 2010–2017 · Realismo: drift, custo e features

A época resolveu o descasamento entre experimento acadêmico e sistema real: drift de conceito, desbalanceamento extremo e latência de verificação passaram a ser modelados explicitamente. O padrão que se firmou foi avaliação sensível a custo, com engenharia de features baseada em agregações temporais, e a constatação de que modelos simples bem alimentados competem com arquiteturas complexas. Ficou em aberto como lidar com rótulos atrasados e parciais e como integrar relações entre entidades, que a transação isolada não captura.

- **[The application of data mining techniques in financial fraud detection: A classification framework and an academic review of literature](https://doi.org/10.1016/j.dss.2010.08.006)** (2010) — Eric W.T. Ngai, Yong Qiang Hu, Y.H. Wong et al. · Decision Support Systems · cit:2089
  - Ngai e coautores propõem um framework de classificação e revisam a literatura de mineração de dados em fraude financeira. Vira o mapa de referência para posicionar novos trabalhos.
- **[Data mining for credit card fraud: A comparative study](https://doi.org/10.1016/j.dss.2010.08.008)** (2010) — Siddhartha Bhattacharyya, Sanjeev Jha, Kurian Tharakunnel et al. · Decision Support Systems · cit:1532
  - Estudo comparativo em dados reais de cartão de crédito. Consolida que métodos supervisionados relativamente simples são competitivos quando os dados são bem tratados.
- **[A cost-sensitive decision tree approach for fraud detection](https://doi.org/10.1016/j.eswa.2013.05.021)** (2013) — Yusuf Şahin, Serol Bulkan, Ekrem Duman · Expert Systems with Applications · cit:465
  - Árvore de decisão sensível a custo para fraude. Operacionaliza o custo assimétrico do erro dentro do critério de escolha do modelo, não apenas na métrica final.
- **[Learned lessons in credit card fraud detection from a practitioner perspective](https://doi.org/10.1016/j.eswa.2014.02.026)** (2014) — Andrea Dal Pozzolo, Olivier Caelen, Yann‐Aël Le Borgne et al. · Expert Systems with Applications · cit:786
  - Dal Pozzolo e coautores relatam lições de praticante sobre desbalanceamento, amostragem e avaliação fora do laboratório. Aproxima a pesquisa do que funciona em produção.
- **[Feature engineering strategies for credit card fraud detection](https://doi.org/10.1016/j.eswa.2015.12.030)** (2016) — Alejandro Correa Bahnsen, Djamila Aouada, Aleksandar Stojanović et al. · Expert Systems with Applications · cit:673
  - Bahnsen e coautores sistematizam engenharia de features com agregações periódicas e informação de custo. Mostra ganho relevante sem trocar o algoritmo.
- **[Credit Card Fraud Detection: A Realistic Modeling and a Novel Learning Strategy](https://doi.org/10.1109/tnnls.2017.2736643)** (2017) — Andrea Dal Pozzolo, Giacomo Boracchi, Olivier Caelen et al. · IEEE Transactions on Neural Networks and Learning Systems · cit:1077
  - Dal Pozzolo, Boracchi e Caelen propõem modelagem realista com drift, desbalanceamento e latência de verificação, além de nova estratégia de aprendizado. Vira o protocolo de avaliação realista da área.
- **[Intelligent financial fraud detection: A comprehensive review](https://doi.org/10.1016/j.cose.2015.09.005)** (2015) — Jarrod West, Maumita Bhattacharya · Computers & Security · cit:1015
  - West e Bhattacharya fazem revisão abrangente de detecção inteligente de fraude financeira, cobrindo técnicas e lacunas. Serve de balanço crítico do que a década produziu.

## 2018–2022 · Grafos, sequências e deepfakes

A época deslocou o foco da transação isolada para a estrutura: sequências de eventos do mesmo cartão e redes de relacionamento entre usuários, comerciantes e dispositivos. O padrão que emergiu foi GNN com tratamento explícito de camuflagem e desbalanceamento, combinado com aprendizado semi-supervisionado para o regime de poucos rótulos. Em paralelo, a manipulação facial sintética entrou na agenda com o primeiro benchmark padronizado. Ficou em aberto a robustez dos grafos sob ataque adversarial e a transferência dos detectores de deepfake para o mundo real.

- **[Sequence classification for credit-card fraud detection](https://doi.org/10.1016/j.eswa.2018.01.037)** (2018) — Johannes Jurgovsky, Michael Granitzer, Konstantin Ziegler et al. · Expert Systems with Applications · cit:803
  - Jurgovsky e coautores tratam a fraude como classificação de sequências sobre o histórico do cartão, com LSTM. Traz dependência temporal explícita para dentro do modelo.
- **[Credit Card Fraud Detection Using AdaBoost and Majority Voting](https://doi.org/10.1109/access.2018.2806420)** (2018) — Kuldeep Kaur Randhawa, Chu Kiong Loo, Manjeevan Seera et al. · IEEE Access · cit:660
  - Randhawa e coautores aplicam AdaBoost e votação majoritária, testando robustez com ruído adicionado. Populariza ensembles em fraude de cartão com validação em dado real de instituição.
- **[FaceForensics++: Learning to Detect Manipulated Facial Images](https://doi.org/10.1109/iccv.2019.00009)** (2019) — Andreas Rössler, Davide Cozzolino, Luisa Verdoliva et al. · IEEE/CVF International Conference on Computer Vision (ICCV) · cit:4824
  - FaceForensics++ cria benchmark automatizado para detecção de manipulação facial sobre DeepFakes, Face2Face, FaceSwap e NeuralTextures. É a base de comparação de toda a linha de detecção de deepfake.
- **[A Semi-Supervised Graph Attentive Network for Financial Fraud Detection](https://doi.org/10.1109/icdm.2019.00070)** (2019) — Daixin Wang, Jianbin Lin, Peng Cui et al. · Proceedings · cit:650
  - SemiGNN usa rede atenta em grafo com pouquíssimos nós rotulados, explorando interações multiview dos usuários. Mostra que relações, e não só atributos, separam fraudadores.
- **[Combining unsupervised and supervised learning in credit card fraud detection](https://doi.org/10.1016/j.ins.2019.05.042)** (2019) — Fabrizio Carcillo, Yann‐Aël Le Borgne, Olivier Caelen et al. · Information Sciences · cit:738
  - Carcillo e coautores combinam aprendizado não supervisionado e supervisionado para conviver com rótulos escassos e atrasados. Endereça diretamente a latência de verificação.
- **[Enhancing Graph Neural Network-based Fraud Detectors against Camouflaged Fraudsters](https://doi.org/10.1145/3340531.3411903)** (2020) — Yingtong Dou, Zhiwei Liu, Li Sun et al. · ACM International Conference on Information and Knowledge Management (CIKM) · cit:1044
  - CARE-GNN introduz camuflagem de atributos e de relações e propõe agregação que a contorna. Expõe a fragilidade dos GNNs ingênuos quando o fraudador imita vizinhos legítimos.
- **[Pick and Choose: A GNN-based Imbalanced Learning Approach for Fraud Detection](https://doi.org/10.1145/3442381.3449989)** (2021) — Yang Liu, Xiang Ao, Zidi Qin et al. · International World Wide Web Conference (WWW) · cit:751
  - PC-GNN faz amostragem balanceada de nós e arestas para treinar em mini-lotes em grafos com classes muito desbalanceadas. Resolve o encontro entre GNN e desbalanceamento extremo.

## 2023 em diante · Fundação, explicabilidade e IA generativa

A fase atual tem duas pressões simultâneas: a IA generativa amplia a superfície de ataque (deepfakes, identidades sintéticas) e, ao mesmo tempo, exige defesas que sejam explicáveis e compatíveis com privacidade. O padrão que se consolida é GNN adaptativo com aprendizado por reforço e amostragem dinâmica, avaliado em benchmarks in-the-wild em vez de datasets acadêmicos defasados. Ficou em aberto como governar responsabilidade e proteção ao consumidor em pagamentos instantâneos e como treinar modelos de fundação sobre dados transacionais sem violar sigilo.

- **[Deepfake detection using deep learning methods: A systematic and comprehensive review](https://doi.org/10.1002/widm.1520)** (2023) — Arash Heidari, Nima Jafari Navimipour, Hasan Dağ et al. · Wiley Interdisciplinary Reviews Data Mining and Knowledge Discovery · cit:545
  - Heidari e coautores fazem revisão sistemática e abrangente de detecção de deepfake por deep learning. Consolida taxonomia de geração e detecção e organiza a literatura dispersa.
- **[Deepfake Attacks: Generation, Detection, Datasets, Challenges, and Research Directions](https://doi.org/10.3390/computers12100216)** (2023) — Amal Naitali, Mohammed Ridouani, Fatima Salahdine et al. · Computers · cit:166
  - Naitali e coautores cobrem geração, detecção, datasets e desafios de deepfake, enquadrando-o como risco de fraude, desinformação e dano reputacional. Dá à área de fraude o mapa de ameaças.
- **[ASA-GNN: Adaptive Sampling and Aggregation-Based Graph Neural Network for Transaction Fraud Detection](https://doi.org/10.1109/tcss.2023.3335485)** (2023) — Yue Tian, Guanjun Liu, Jiacun Wang et al. · IEEE Transactions on Computational Social Systems · cit:103
  - ASA-GNN usa amostragem e agregação adaptativas para fraude transacional, atacando o caso em que o criminoso imita o comportamento do portador. Reduz a dependência de engenharia manual de features.
- **[Transparency and Privacy: The Role of Explainable AI and Federated Learning in Financial Fraud Detection](https://doi.org/10.1109/access.2024.3394528)** (2024) — Tomisin Awosika, Raj Mani Shukla, Bernardi Pranggono · IEEE Access · cit:320
  - Awosika e coautores combinam IA explicável e aprendizado federado para equilibrar transparência e privacidade sob desbalanceamento. Coloca explicabilidade e sigilo como requisitos de projeto, não adendos.
- **[Graph neural networks for financial fraud detection: a review](https://doi.org/10.1007/s11704-024-40474-y)** (2025) — Dawei Cheng, Yao Zou, Sheng Xiang et al. · Frontiers of Computer Science · cit:304
  - Cheng e coautores revisam GNNs para fraude financeira, organizando a produção da última década. Serve de referência de entrada para quem vai construir em grafo.
- **[Deepfake-Eval-2024: A Multi-Modal In-the-Wild Benchmark of Deepfakes Circulated in 2024](https://doi.org/10.48550/arxiv.2503.02857)** (2025) — Chandra, Nuria Alina, Lee, Hannah, Ryan Murtfeldt et al. · arXiv (Cornell University) · cit:160
  - Deepfake-Eval-2024 reúne deepfakes in-the-wild de 2024 (45h de vídeo, 56,5h de áudio, 1.975 imagens) e mostra que benchmarks acadêmicos estão defasados. Redefine o critério de avaliação realista.
- **[FraudGNN-RL: A Graph Neural Network With Reinforcement Learning for Adaptive Financial Fraud Detection](https://doi.org/10.1109/ojcs.2025.3543450)** (2025) — Yiwen Cui, Xu Han, Jiaying Chen et al. · IEEE Open Journal of the Computer Society · cit:133
  - FraudGNN-RL modela transações como grafo dinâmico e combina GNN com aprendizado por reforço via convolução temporal-espacial-semântica. Aponta para detecção adaptativa e sensível a contexto.

## Onde estamos agora

O campo está migrando de detectores por transação para modelos de fundação e sistemas adaptativos: o Large Payments Model, treinado do zero em dados transacionais estruturados com até 400 bilhões de tokens e autossupervisão ciente do ciclo de vida, é o sinal mais claro dessa virada. Ao mesmo tempo, a agenda regulatória e de governança ganhou peso: a Resolução Conjunta BC/CMN 21/2026 refina contratos de parceria no Open Finance e amplia o compartilhamento de dados por pessoas jurídicas, enquanto o debate sobre pagamentos instantâneos discute controle centralizado versus descentralizado de fraude e regras de responsabilização. A superfície de ataque também se deslocou para acesso persistente: o primeiro estudo holístico de ataques de acesso contínuo mapeou 11 rotas em serviços web e simulou ataques em 20 serviços populares, mostrando que remover o invasor é mais difícil que impedir a entrada. A pergunta que atravessa tudo é como conciliar modelos cada vez mais opacos com explicabilidade, privacidade e responsabilidade legal bem definida.

- Quem responde pelo prejuízo em pagamento instantâneo: banco, PSP, recebedor ou consumidor?
- Modelos de fundação em dados transacionais superam GNNs especializados em produção, e a que custo de explicabilidade?
- Como avaliar detecção de deepfake e identidade sintética com benchmarks in-the-wild que envelhecem em meses?
- Aprendizado federado entre instituições resolve privacidade sem destruir sinal de fraude entre bancos?
- Como detectar acesso persistente e camuflagem adversarial sem gerar falso alarme insuportável para o cliente?

## Linhas por tema

- **📊 Modelos, dados e métricas de fraude**: Começa com detecção adaptativa e métricas de captura versus falso alarme (Fawcett & Provost, 1997), passa por revisões estatísticas que definem o vocabulário (Bolton & Hand, 2002) e por modelagem realista com drift e custo (Dal Pozzolo, 2017), e desemboca em grafos, aprendizado semi-supervisionado e modelos de fundação com explicabilidade e privacidade (2023+).
- **💳 Cartões & e-commerce**: A linha mais antiga do campo: redes neurais superando regras em dados reais de emissor (Ghosh & Reilly, 1994), decisão online em hub transacional (Dorronsoro, 1997) e mineração distribuída para escala (Chan, 1999), até a constatação de que agregar transações no tempo é a feature decisiva (Whitrow, 2008).
- **🎣 Golpes e engenharia social**: Nasce com a evidência empírica de que o phishing funciona porque o usuário ignora indicadores de navegador (Dhamija, 2006) e evolui para detecção automatizada por conteúdo, com TF-IDF e heurísticas acertando cerca de 95% dos sites (Cantina, 2007).
- **🤖 IA generativa & deepfakes**: Abre com o primeiro benchmark padronizado de detecção de manipulação facial (FaceForensics++, 2019), amadurece em revisões sistemáticas de geração, detecção e datasets (2023) e chega à constatação de que benchmarks acadêmicos estão defasados diante de deepfakes in-the-wild (Deepfake-Eval-2024, 2025).
