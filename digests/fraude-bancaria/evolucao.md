# Evolução do estado da arte — Bank Fraud Watch

<sub>gerado em 2026-11-17 · 36 marcos de uma rede de 955 obras · modelo deepseek-ai/DeepSeek-V4.1-Flash</sub>

O campo nasceu nos anos 1990 tratando fraude como classificação binária sob custos assimétricos e conceito mutável — Fawcett & Provost (1997) e Ghosh & Reilly (1994) mostraram que redes neurais batiam regras em cartão com muito menos falsos positivos. Nos anos 2000 a estatística organizou o problema (Bolton & Hand, 2002), a modelagem sequencial entrou em cena e phishing e lavagem de dinheiro ganharam corpo próprio como objetos de estudo. De 2010 a 2022 a área se industrializou: streaming, redes de relacionamento, GNNs e aprendizado sensível a custo viraram padrão de produção. Hoje o eixo é foundation models de transação, detecção adaptativa contra adversário que se camufla, e governança de pagamentos instantâneos e Open Finance.

## O que mudou desde 2026-11-17

Entraram marcos que fecham lacunas importantes: Cantina (2007) e o comparativo bayesiano-neural (2002) reforçam a era 2000-2009; o survey de Abdallah (2016) e o SemiGNN (2019) cobrem consolidação e semi-supervisão; e GANs (2023) e esquecimento catastrófico (2024) ancoram a fronteira atual. Saíram o survey de 2004, o artigo de detecção de e-mails de phishing de 2007, o guia de 2015 e a revisão de romance scam de 2023, reduzindo redundância dentro de cada época sem perder o arco. O efeito líquido é uma narrativa mais nítida de método e de manutenção de modelo, com menos sobreposição de surveys.

- ➕ Cantina: a content-based approach to detecting phishing web sites (2007)
- ➕ Credit Card Fraud Detection Using Bayesian and Neural Networks (2002)
- ➕ Fraud detection system: A survey (2016)
- ➕ A Semi-Supervised Graph Attentive Network for Financial Fraud Detection (2019)
- ➕ Generative Adversarial Nets (2023)
- ➕ Assessment of catastrophic forgetting in continual credit card fraud detection (2024)
- ➖ Survey of fraud detection techniques (2004)
- ➖ Learning to detect phishing emails (2007)
- ➖ Fraud: Detection, Prevention, and Analytics! (2015)
- ➖ Tainted Love: a Systematic Literature Review of Online Romance Scam Research (2023)

## até 1999 · A fraude vira problema de aprendizado

A época resolveu uma questão prática: regras manuais não escalavam nem acompanhavam fraudadores que mudavam de tática. A ideia que virou padrão foi tratar fraude como problema de classificação com custos assimétricos, avaliado por ganho esperado e não por acurácia, com modelos treinados em dados rotulados de transações. Redes neurais e perfilamento comportamental mostraram ganhos de ordem de magnitude sobre sistemas baseados em regras. Ficou em aberto a escalabilidade para volumes massivos e a adaptação contínua ao adversário — problemas que só voltariam ao centro duas décadas depois.

- **[Adaptive Fraud Detection](https://doi.org/10.1023/a:1009700419189)** (1997) — Tom E. Fawcett, Foster John Provost · Data Mining and Knowledge Discovery · cit:1074
  - Fawcett e Provost formalizam detecção de fraude como classificação com custos assimétricos e conceito que muda com o tempo, propondo avaliação por ganho esperado. É a base conceitual de quase todo detector de fraude até hoje.
- **[Credit card fraud detection with a neural-network](https://doi.org/10.1109/hicss.1994.323314)** (1994) — Ghosh, Reilly · Hawaii International Conference on System Sciences (HICSS) · cit:558
  - Ghosh e Reilly treinam uma rede neural em dados reais de emissor de cartão e detectam uma ordem de magnitude mais contas fraudulentas com 20 vezes menos falsos positivos que regras. É a primeira evidência forte de que ML supera regras em produção.
- **[Distributed data mining in credit card fraud detection](https://doi.org/10.1109/5254.809570)** (1999) — Philip K. Chan, W. Fan, Andreas L. Prodromidis et al. · IEEE Intelligent Systems and their Applications · cit:626
  - Chan, Fan e Prodromidis atacam escalabilidade com mineração distribuída sobre transações de cartão. Antecipa o problema central das décadas seguintes: analisar volume massivo com latência baixa.
- **[Neural fraud detection in credit card operations](https://doi.org/10.1109/72.595879)** (1997) — José R. Dorronsoro, F. Ginel, C. Sgnchez et al. · IEEE Transactions on Neural Networks · cit:307
  - Dorronsoro e colegas colocam um classificador neural online no hub transacional, usando apenas a operação corrente e seu histórico imediato. É o ancestral direto do scoring em tempo real com janela curta de contexto.
- **[Social Change and Crime Rate Trends: A Routine Activity Approach](https://doi.org/10.2307/2094589)** (1979) — Lawrence E. Cohen, Marcus Felson · American Sociological Review · cit:12079
  - Cohen e Felson propõem a teoria da atividade rotineira: crime exige convergência de ofensor motivado, alvo adequado e ausência de guardião capaz. Fundamenta por que controle e prevenção, não só detecção, definem o desenho do sistema antifraude.
- **[Combining data mining and machine learning for effective user profiling](https://openalex.org/W2146935111)** (1996) — Tom E. Fawcett, Foster John Provost · Knowledge Discovery and Data Mining · cit:238
  - Fawcett e Provost combinam mineração de dados e aprendizado para construir profilers de comportamento e combiná-los em alarmes de alta confiança. É a origem do perfilamento comportamental por múltiplos sinais.

## 2000–2009 · Estatística, sequências e phishing

A época resolveu o problema de método: em vez de modelos ad hoc, consolidou-se um corpo estatístico para detecção de fraude, com ênfase explícita na natureza adversarial do problema. Viraram padrão a agregação de transações em features, a modelagem da sequência de operações do portador e a comparação sistemática entre famílias de modelos (bayesianos, redes neurais, HMM). Em paralelo, phishing e lavagem de dinheiro se estabeleceram como linhas próprias, com evidência empírica sobre por que usuários caem e ceticismo sobre a efetividade do regime AML. Ficou em aberto a integração entre detecção de cartão, fraude de identidade e fluxo de dinheiro — que só se conectaria com grafos.

- **[Statistical Fraud Detection: A Review](https://doi.org/10.1214/ss/1042727940)** (2002) — Richard J. Bolton, David J. Hand · Statistical Science · cit:2119
  - Bolton e Hand fazem a revisão seminal que organiza a detecção estatística de fraude e explicita que o fraudador é adaptativo e contorna a prevenção. Define o vocabulário e o enquadramento da área por mais de uma década.
- **[Why phishing works](https://doi.org/10.1145/1124772.1124861)** (2006) — Rachna Dhamija, J. D. Tygar, Marti A. Hearst · CHI Conference on Human Factors in Computing Systems · cit:1677
  - Dhamija, Tygar e Hearst dão a primeira evidência empírica de quais estratégias de phishing enganam usuários: 23% nem olham as pistas do navegador. Redireciona o desenho de defesa de tecnologia para fator humano.
- 🆕 **[Cantina: a content-based approach to detecting phishing web sites](https://doi.org/10.1145/1242572.1242659)** (2007) — Zhang Yue, Jason Hong, Lorrie Faith Cranor · International World Wide Web Conference (WWW) · cit:974
  - Cantina detecta sites de phishing por conteúdo com TF-IDF e heurísticas, acertando cerca de 95%. Mostra que sinais textuais e de página, não só listas negras, escalam a detecção.
- **[Money Laundering](https://doi.org/10.1086/501508)** (2006) — Michael Levi, Peter H. Reuter · Crime and Justice · cit:566
  - Levi e Reuter revisam lavagem de dinheiro e concluem que os dados disponíveis sugerem pouco efeito do regime AML global. Estabelece o ceticismo baseado em evidência que ainda hoje pressiona programas de compliance.
- **[Transaction aggregation as a strategy for credit card fraud detection](https://doi.org/10.1007/s10618-008-0116-z)** (2008) — Christopher Whitrow, David J. Hand, Piotr Juszczak et al. · Data Mining and Knowledge Discovery · cit:455
  - Whitrow, Hand e Juszczak propõem agregação de transações como estratégia de detecção em cartão. Features agregadas por janela temporal viraram item obrigatório em qualquer feature store de fraude.
- **[Credit Card Fraud Detection Using Hidden Markov Model](https://doi.org/10.1109/tdsc.2007.70228)** (2008) — A. Srivastava, A. Kundu, Shamik Sural et al. · IEEE Transactions on Dependable and Secure Computing · cit:650
  - Srivastava, Kundu e Sural modelam a sequência de operações do portador com Hidden Markov Model e sinalizam desvios de probabilidade. Consolida a detecção sequencial de comportamento individual.
- 🆕 **[Credit Card Fraud Detection Using Bayesian and Neural Networks](https://openalex.org/W3127599935)** (2002) — Sam Maes, Karl Tuyls, Bram Vanschoenwinkel et al. · VUBIR (Vrije Universiteit Brussel) · cit:447
  - Maes, Tuyls e Vanschoenwinkel comparam redes neurais e redes bayesianas em dados financeiros reais. Ajuda a fixar a prática de comparar famílias de modelos sob incerteza em vez de apostar em uma só.

## 2010–2017 · Redes, streaming e consolidação analítica

A época resolveu o problema de escala e de contexto: fraude deixou de ser só uma transação isolada e passou a ser um padrão em rede de cartões, dispositivos e comerciantes. Viraram padrão a análise de redes de relacionamento (APATE), o processamento em streaming com Spark (SCARFF) e a organização do campo em frameworks de classificação e surveys. O livro de Baesens e colegas (2015) empacotou descritivo, preditivo e redes sociais como um único pipeline de fraude. Ficou em aberto como lidar com rótulos escassos e com fraudadores que se camuflam deliberadamente na estrutura da rede.

- **[APATE: A novel approach for automated credit card transaction fraud detection using network-based extensions](https://doi.org/10.1016/j.dss.2015.04.013)** (2015) — Véronique Van Vlasselaer, Cristián Bravo, Olivier Caelen et al. · Decision Support Systems · cit:556
  - APATE estende a detecção de fraude em cartão com features de rede, capturando relações entre entidades em vez de olhar só a transação. Traz análise de redes para o centro do problema de cartão.
- **[SCARFF : A scalable framework for streaming credit card fraud detection with spark](https://doi.org/10.1016/j.inffus.2017.09.005)** (2017) — Fabrizio Carcillo, Andrea Dal Pozzolo, Yann‐Aël Le Borgne et al. · Information Fusion · cit:430
  - SCARFF entrega um framework escalável de detecção em streaming com Spark, tratando desbalanceamento e latência. É a ponte entre pesquisa e operação de alto volume em tempo quase real.
- **[Fraud Analytics Using Descriptive, Predictive, and Social Network Techniques: A Guide to Data Science for Fraud Detection](https://doi.org/10.1002/9781119146841)** (2015) — Bart Baesens, Véronique Van Vlasselaer, Wouter Verbeke · Wiley eBooks · cit:351
  - Baesens, Van Vlasselaer e Verbeke publicam o guia que unifica técnicas descritivas, preditivas e de redes sociais em um pipeline de detecção. Vira referência de arquitetura para times de fraude em bancos.
- **[Data mining for credit card fraud: A comparative study](https://doi.org/10.1016/j.dss.2010.08.008)** (2010) — Siddhartha Bhattacharyya, Sanjeev Jha, Kurian Tharakunnel et al. · Decision Support Systems · cit:1532
  - Bhattacharyya, Jha e Tharakunnel comparam sistematicamente técnicas de mineração em cartão de crédito. Dá base empírica para escolha de modelo e para o tratamento de classes extremamente desbalanceadas.
- **[The application of data mining techniques in financial fraud detection: A classification framework and an academic review of literature](https://doi.org/10.1016/j.dss.2010.08.006)** (2010) — Eric W.T. Ngai, Yong Qiang Hu, Y.H. Wong et al. · Decision Support Systems · cit:2089
  - Ngai e colegas propõem um framework de classificação e revisam a literatura de mineração de dados em fraude financeira. Organiza o campo em eixos de técnica, domínio e dado, e vira mapa de citação obrigatório.
- 🆕 **[Fraud detection system: A survey](https://doi.org/10.1016/j.jnca.2016.04.007)** (2016) — Aisha Abdallah, Mohd Aizaini Maarof, Anazida Binti Zainal · Journal of Network and Computer Applications · cit:1040
  - Abdallah, Maarof e Zainal fazem um survey amplo de sistemas de detecção de fraude. Consolida arquiteturas e métricas num momento em que a área se fragmentava em subdomínios.
- **[Social Change and Crime Rate Trends: A Routine Activity Approach (1979)](https://doi.org/10.4324/9781439817803-12)** (2010) — L.E. COHEN AND M. FELSON · Routledge eBooks · cit:5995
  - A reimpressão de Cohen e Felson em 2010 leva a teoria da atividade rotineira para dentro da literatura de fraude digital. Reforça a leitura de que o desenho do ambiente, não só o modelo, determina a taxa de fraude.

## 2018–2022 · Grafos, sequências e custo assimétrico

A época resolveu o problema de rótulos e de estrutura: em vez de depender de fraude confirmada em volume, a área passou a explorar grafos heterogêneos com aprendizado semi-supervisionado e a combinar supervisionado com não supervisionado. Viraram padrão as GNNs para contas e transações, a classificação de sequências com redes recorrentes e o aprendizado sensível a custo dependente da instância. Ao mesmo tempo, a fronteira se ampliou para deepfakes e golpes de engenharia social data-driven, como a fraude romântica. Ficou em aberto a robustez contra camuflagem deliberada e a adaptação contínua sem degradar o que já foi aprendido.

- **[Sequence classification for credit-card fraud detection](https://doi.org/10.1016/j.eswa.2018.01.037)** (2018) — Johannes Jurgovsky, Michael Granitzer, Konstantin Ziegler et al. · Expert Systems with Applications · cit:803
  - Jurgovsky e colegas tratam a detecção em cartão como classificação de sequências, com redes recorrentes sobre o histórico do portador. Estabelece a linha que hoje sustenta modelos de trajetória de transações.
- **[Enhancing Graph Neural Network-based Fraud Detectors against Camouflaged Fraudsters](https://doi.org/10.1145/3340531.3411903)** (2020) — Yingtong Dou, Zhiwei Liu, Li Sun et al. · ACM International Conference on Information and Knowledge Management (CIKM) · cit:1044
  - CARE-GNN identifica duas formas de camuflagem do fraudador — de atributos e de relações — e propõe agregação seletiva em GNNs. Expõe a fragilidade central de detectores de grafo e vira baseline de robustez.
- **[FaceForensics++: Learning to Detect Manipulated Facial Images](https://doi.org/10.1109/iccv.2019.00009)** (2019) — Andreas Rössler, Davide Cozzolino, Luisa Verdoliva et al. · IEEE/CVF International Conference on Computer Vision (ICCV) · cit:4824
  - FaceForensics++ cria o benchmark de detecção de manipulação facial com DeepFakes, Face2Face, FaceSwap e NeuralTextures. Torna comparável a corrida entre geração e detecção de mídia sintética.
- **[Heterogeneous Graph Neural Networks for Malicious Account Detection](https://doi.org/10.1145/3269206.3272010)** (2018) — Ziqi Liu, Chaochao Chen, Xinxing Yang et al. · ACM International Conference on Information and Knowledge Management (CIKM) · cit:519
  - GEM é a primeira GNN heterogênea para contas maliciosas, aplicada no Alipay sobre grafos conta-dispositivo. Mostra que agregar dispositivos e atividades detecta fraude em escala de plataforma de pagamento.
- **[Automatically Dismantling Online Dating Fraud](https://doi.org/10.1109/tifs.2019.2930479)** (2019) — Guillermo Suárez‐Tangil, Matthew Edwards, Claudia Peersman et al. · IEEE Transactions on Information Forensics and Security · cit:126
  - Suárez-Tangil e colegas analisam perfis de sites de namoro e propõem desmantelamento automatizado da fraude romântica. Prova que golpes de engenharia social também são tratáveis com dados, não só com educação do usuário.
- **[Instance-dependent cost-sensitive learning for detecting transfer fraud](https://doi.org/10.1016/j.ejor.2021.05.028)** (2021) — Sebastiaan Höppner, Bart Baesens, Wouter Verbeke et al. · European Journal of Operational Research · cit:131
  - Höppner, Baesens e Verbeke formalizam aprendizado sensível a custo dependente da instância para fraude de transferência. Alinha a função objetivo do modelo ao custo real de cada erro, não a uma matriz fixa.
- **[Combining unsupervised and supervised learning in credit card fraud detection](https://doi.org/10.1016/j.ins.2019.05.042)** (2019) — Fabrizio Carcillo, Yann‐Aël Le Borgne, Olivier Caelen et al. · Information Sciences · cit:738
  - Carcillo e colegas combinam aprendizado não supervisionado e supervisionado em cartão. Oferece caminho prático para o problema de rótulos escassos e de detecção de padrões novos.
- 🆕 **[A Semi-Supervised Graph Attentive Network for Financial Fraud Detection](https://doi.org/10.1109/icdm.2019.00070)** (2019) — Daixin Wang, Jianbin Lin, Peng Cui et al. · Proceedings · cit:650
  - SemiGNN usa atenção em grafo multivisão com poucos rótulos para fraude financeira. Consolida o semi-supervisionado em grafo como resposta à escassez de fraude confirmada.

## 2023 em diante · Foundation models, GNNs adaptativos e deepfakes

A época está resolvendo o problema de generalização: modelos de fundação treinados em bilhões de transações prometem um backbone único para múltiplas tarefas de risco, enquanto GNNs com reforço e memória global buscam adaptação contínua contra adversário que muda de tática. Virou padrão combinar grafo dinâmico, aprendizado por reforço e atenção temporal-espacial-semântica, além de revisões sistemáticas que organizam a aplicação de network analytics em AML. Em aberto estão o esquecimento catastrófico em aprendizado contínuo, a governança de pagamentos instantâneos e a assimetria entre gerar e detectar mídia sintética.

- 🆕 **[Generative Adversarial Nets](https://doi.org/10.1007/978-3-658-40442-0_9)** (2023) — Raphael Labaca-Castro · Springer eBooks · cit:21130
  - A difusão do arcabouço de GANs em material de referência de 2023 consolida a base generativa que alimenta deepfakes e, ao mesmo tempo, aumento de dados para detecção. Define o adversário sintético que a área passou a enfrentar.
- **[TransactionGPT](https://doi.org/10.48550/arxiv.2511.08939)** (2025) — Yingtong Dou, Zhimeng Jiang, Tianyi Zhang et al. · arXiv (Cornell University) · cit:14
  - TransactionGPT treina um foundation model de transações de consumo em escala de bilhões de eventos, com arquitetura 3D-Transformer e otimização conjunta com tarefas downstream. Aponta para um backbone único de risco em vez de dezenas de modelos especializados.
- **[Network Analytics for Anti-money Laundering—A Systematic Literature Review and Experimental Evaluation](https://doi.org/10.1287/ijds.2024.0042)** (2025) — Bruno Deprez, Toon Vanderschueren, Bart Baesens et al. · INFORMS Journal on Data Science · cit:54
  - Deprez, Vanderschueren e Baesens revisam 97 trabalhos e avaliam experimentalmente network analytics para AML. Dá taxonomia e comparação de poder de detecção num campo até então fragmentado.
- **[Romance baiting, cryptorom and ‘pig butchering’: an evolutionary step in romance fraud](https://doi.org/10.1080/10345329.2023.2248670)** (2023) — Cassandra Cross · Current Issues in Criminal Justice · cit:66
  - Cross descreve a convergência entre fraude romântica e fraude de investimento em cripto — romance baiting, cryptorom e pig butchering. Mostra que o golpe evoluiu de transferência pontual para extração prolongada e de alto valor.
- **[FraudGNN-RL: A Graph Neural Network With Reinforcement Learning for Adaptive Financial Fraud Detection](https://doi.org/10.1109/ojcs.2025.3543450)** (2025) — Yiwen Cui, Xu Han, Jiaying Chen et al. · IEEE Open Journal of the Computer Society · cit:133
  - FraudGNN-RL combina GNN com aprendizado por reforço sobre grafo dinâmico e propõe convolução temporal-espacial-semântica. Ataca diretamente a necessidade de detecção adaptativa e sensível a contexto.
- **[LGM-GNN: A Local and Global Aware Memory-Based Graph Neural Network for Fraud Detection](https://doi.org/10.1109/tbdata.2023.3234529)** (2023) — Pengbo Li, Hang Yu, Xiangfeng Luo et al. · IEEE Transactions on Big Data · cit:93
  - LGM-GNN incorpora memória local e global para capturar anomalias que só se revelam na visão global do grafo. Corrige a miopia da agregação apenas de vizinhos diretos.
- **[Cybercriminal networks in the UK and Beyond: Network structure, criminal cooperation and external interactions](https://doi.org/10.1007/s12117-022-09476-9)** (2023) — Jonathan Lusthaus, E.R. Kleemans, Rutger Leukfeldt et al. · Trends in Organized Crime · cit:65
  - Lusthaus, Kleemans e Leukfeldt analisam dez investigações fechadas de cibercrime financeiro e mostram a divisão entre componentes de ataque e de movimentação de dinheiro. Dá base empírica para investigar redes criminais, não só transações.
- 🆕 **[Assessment of catastrophic forgetting in continual credit card fraud detection](https://doi.org/10.1016/j.eswa.2024.123445)** (2024) — Bertrand Lebichot, Wissam Siblini, Gian Marco Paldino et al. · Expert Systems with Applications · cit:40
  - Lebichot e colegas medem esquecimento catastrófico em detecção contínua de fraude em cartão. Coloca a manutenção do modelo ao longo do tempo como problema de primeira ordem, não detalhe de engenharia.

## Onde estamos agora

O campo está migrando de uma coleção de modelos especializados para backbones de domínio: o Large Payments Model, treinado do zero em dados transacionais estruturados com até 400 bilhões de tokens e codificação por campo, é o mesmo movimento que TransactionGPT já sinalizava em 2025. Ao lado disso, a discussão saiu do modelo e foi para a governança: o Bank of Canada modela controle centralizado versus descentralizado de fraude em pagamentos instantâneos e mostra que a governança centralizada não implementa a alocação ótima por excluir pagamentos pequenos via tarifas. No Brasil, a Resolução Conjunta BC/CMN 21/2026 refina contratos de parceria no Open Finance e amplia o compartilhamento de dados por pessoas jurídicas, com exigência de avaliação da capacidade da parceira pela instituição integradora. Na ponta de identidade, o primeiro estudo holístico de ataques de acesso persistente mapeia 11 rotas pelas quais o invasor reconfigura recursos de segurança para se manter dentro da conta mesmo após tentativas de remoção.

- Foundation models de transação generalizam entre bancos ou só dentro da rede que os treinou?
- Como medir e mitigar esquecimento catastrófico em produção contínua sem retreinar do zero?
- Quem absorve o custo do erro em pagamentos instantâneos: banco, cliente ou arranjo?
- Detecção de acesso persistente deve ser responsabilidade da instituição ou do provedor de identidade?
- Open Finance amplia o sinal antifraude ou apenas transfere o risco para a instituição integradora?

## Linhas por tema

- **📊 Modelos, dados e métricas de fraude**: Começa com detecção adaptativa sob custos assimétricos (Fawcett & Provost, 1997) e revisões estatísticas (Bolton & Hand, 2002), passa por frameworks de classificação e surveys nos anos 2010 e desemboca em GNNs semi-supervisionadas, aprendizado sensível a custo e foundation models de transação em 2025. O fio condutor é sempre o mesmo: desbalanceamento extremo, rótulos escassos e um adversário que reage ao modelo.
- **💳 Cartões & e-commerce**: Vai das redes neurais contra regras nos anos 1990, passa por HMM e agregação de transações nos anos 2000, chega a streaming com Spark e features de rede em 2015-2017 e à classificação de sequências em 2018. Hoje o gargalo é manutenção: aprendizado contínuo e esquecimento catastrófico (Lebichot et al., 2024).
- **🎣 Golpes e engenharia social**: A base teórica vem de Cohen e Felson (1979) sobre convergência de ofensor, alvo e ausência de guardião; nos anos 2000 o foco vira phishing, com evidência empírica de por que o usuário cai (Dhamija, 2006) e detecção por conteúdo (Cantina, 2007). De 2019 em diante o golpe se torna data-driven e prolongado, da fraude romântica ao pig butchering com cripto (Cross, 2023).
- **🕸️ Contas laranja, mulas & PLD/CFT**: Levi e Reuter (2006) mostram que o regime AML global tinha efeito pouco demonstrado, o que travou a área em ceticismo por anos. Em 2023-2025 a resposta vem de evidência empírica de redes criminais e de network analytics sistemático para AML, com taxonomia e comparação de poder de detecção (Deprez et al., 2025).
- **🤖 IA generativa & deepfakes**: FaceForensics++ (2019) cria o benchmark que torna comparável a detecção de mídia manipulada e expõe o quão difícil é a tarefa para humanos e máquinas. Com a consolidação das GANs e dos modelos generativos, a relação virou corrida aberta entre geração e detecção, agora também usada a favor do antifraude como aumento de dados.
