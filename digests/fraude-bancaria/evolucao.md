# Evolução do estado da arte — Bank Fraud Watch

<sub>gerado em 2026-11-17 · 36 marcos de uma rede de 956 obras · modelo deepseek-ai/DeepSeek-V4.1-Flash</sub>

O campo nasceu nos anos 1990 como um problema de detecção de anomalias em cartões e telefonia, quando regras manuais já não davam conta do volume e da adaptação dos fraudadores. Fawcett e Provost (1997) e Ghosh e Reilly (1994) mostraram que aprendizado de máquina supervisionado batia sistemas de regras com muito menos falsos positivos, e Bolton e Hand (2002) transformaram isso em disciplina estatística. Nas duas décadas seguintes o eixo migrou de modelos tabulares isolados para sequências, grafos e aprendizado sensível a custo, com a fraude passando a ser tratada como fenômeno de rede e não de transação. Hoje, com foundation models de transação (TransactionGPT, TREASURE, Large Payments Model) e a convergência entre fraude, golpes relacionais e pagamentos instantâneos, o problema virou modelagem de comportamento em escala bilionária sob regulação em tempo real.

## O que mudou desde 2026-11-17

Entraram três marcos que reforçam a virada metodológica: Brause e colegas (2003) formalizando o requisito de erro sub-0,1% em cartões, a revisão de West e Bhattacharya (2015) consolidando avaliação por custo, e a revisão sistemática de GNNs para fraude (2023) fechando o ciclo de grafos. Saíram a comparação bayesiana versus redes neurais (2002), o guia de fraud analytics de Baesens e Van Vlasselaer (2015) e o LGM-GNN (2023), o que reduz a presença de material didático e de variantes incrementais de GNN em favor de trabalhos de síntese e de foundation models.

- ➕ Neural data mining for credit card fraud detection (2003)
- ➕ Intelligent financial fraud detection: A comprehensive review (2015)
- ➕ Financial fraud detection using graph neural networks: A systematic review (2023)
- ➖ Credit Card Fraud Detection Using Bayesian and Neural Networks (2002)
- ➖ Fraud Analytics Using Descriptive, Predictive, and Social Network Techniques: A Guide to Data Science for Fraud Detection (2015)
- ➖ LGM-GNN: A Local and Global Aware Memory-Based Graph Neural Network for Fraud Detection (2023)

## até 1999 · Do rule-based ao aprendizado de máquina

A época resolveu um problema prático: o volume de transações de cartão e chamadas celulares tornou inviável manter regras escritas à mão, e os falsos positivos bloqueavam clientes legítimos. A ideia que virou padrão foi treinar classificadores supervisionados sobre histórico rotulado e combiná-los com perfilamento de comportamento individual, como em Fawcett e Provost (1996, 1997). Ficou em aberto a questão da adaptação do fraudador — modelos estáticos degradam — e a base teórica do crime como convergência de oportunidade, que Cohen e Felson (1979) formularam e que só seria operacionalizada décadas depois.

- **[Adaptive Fraud Detection](https://doi.org/10.1023/a:1009700419189)** (1997) — Tom E. Fawcett, Foster John Provost · Data Mining and Knowledge Discovery · cit:1073
  - Fawcett e Provost formalizaram a detecção de fraude como problema de aprendizado com custos assimétricos e rótulos atrasados, e propuseram combinar múltiplos detectores. É a origem direta da ideia de ensemble de sinais que domina produção até hoje.
- **[Credit card fraud detection with a neural-network](https://doi.org/10.1109/hicss.1994.323314)** (1994) — Ghosh, Reilly · Hawaii International Conference on System Sciences (HICSS) · cit:558
  - Ghosh e Reilly treinaram uma rede neural em dados reais de um emissor e reportaram uma ordem de magnitude mais contas fraudulentas detectadas com 20x menos falsos positivos que regras. Foi a primeira evidência forte, em dados de produção, de que ML superava o status quo.
- **[Distributed data mining in credit card fraud detection](https://doi.org/10.1109/5254.809570)** (1999) — Philip K. Chan, W. Fan, Andreas L. Prodromidis et al. · IEEE Intelligent Systems and their Applications · cit:625
  - Chan, Fan e Prodromidis atacaram escala e distribuição, mostrando como minerar fraude em bases massivas de forma paralela e eficiente. Antecipou em duas décadas o debate de streaming e processamento distribuído que reaparece em SCARFF (2017).
- **[Neural fraud detection in credit card operations](https://doi.org/10.1109/72.595879)** (1997) — José R. Dorronsoro, F. Ginel, C. Sgnchez et al. · IEEE Transactions on Neural Networks · cit:307
  - Dorronsoro e colegas construíram um classificador neural online instalado no hub transacional, não no emissor, decidindo com apenas o histórico imediato da operação. É o ancestral arquitetural do scoring em tempo real com janela curta de contexto.
- **[Social Change and Crime Rate Trends: A Routine Activity Approach](https://doi.org/10.2307/2094589)** (1979) — Lawrence E. Cohen, Marcus Felson · American Sociological Review · cit:12081
  - Cohen e Felson propuseram que o crime exige convergência de ofensor motivado, alvo adequado e ausência de guardião. É a base conceitual de quase todo feature de contexto — dispositivo, canal, horário, contraparte — usado em modelos de fraude.
- **[Combining data mining and machine learning for effective user profiling](https://openalex.org/W2146935111)** (1996) — Tom E. Fawcett, Foster John Provost · Knowledge Discovery and Data Mining · cit:237
  - Fawcett e Provost usaram indução construtiva para gerar indicadores de fraude em telefonia celular e combiná-los em profilers com alarmes de alta confiança. Introduziu a lógica de perfil comportamental por entidade que sustenta detecção de account takeover.

## 2000–2009 · Consolidação estatística e a era do phishing

A década resolveu dois problemas distintos: dar rigor metodológico à detecção de fraude e lidar com um canal de ataque inteiramente novo, a web. Bolton e Hand (2002) sintetizaram o campo em torno de desbalanceamento, rótulos atrasados e avaliação por custo, enquanto Dhamija, Tygar e Hearst (2006) e Zhang, Hong e Cranor (2007) mostraram que o elo humano era o ponto fraco do phishing e que conteúdo e heurísticas podiam detectá-lo. O que ficou em aberto foi a adaptação adversarial — Levi e Reuter (2006) já apontavam que os efeitos mensuráveis do regime AML eram fracos — e a incapacidade dos modelos tabulares de capturar sequência.

- **[Statistical Fraud Detection: A Review](https://doi.org/10.1214/ss/1042727940)** (2002) — Richard J. Bolton, David J. Hand · Statistical Science · cit:2119
  - Bolton e Hand organizaram o campo em torno de três regimes — supervisão, não supervisão e detecção de outliers — e explicitaram que o fraudador é adaptativo. Virou a referência canônica para justificar avaliação por custo e monitoramento de drift.
- **[Why phishing works](https://doi.org/10.1145/1124772.1124861)** (2006) — Rachna Dhamija, J. D. Tygar, Marti A. Hearst · CHI Conference on Human Factors in Computing Systems · cit:1678
  - Dhamija, Tygar e Hearst deram a primeira evidência empírica de por que o phishing funciona: 23% dos participantes nem olhavam os indicadores de segurança do navegador. Redirecionou o esforço de defesa de avisos de UI para detecção automática.
- **[Cantina: a content-based approach to detecting phishing web sites](https://doi.org/10.1145/1242572.1242659)** (2007) — Zhang Yue, Jason Hong, Lorrie Faith Cranor · International World Wide Web Conference (WWW) · cit:974
  - CANTINA aplicou TF-IDF e heurísticas ao conteúdo da página, acertando cerca de 95% dos sites de phishing. Mostrou que detecção baseada em conteúdo escalava melhor que listas negras, padrão que virou base de filtros de navegador e e-mail.
- **[Money Laundering](https://doi.org/10.1086/501508)** (2006) — Michael Levi, Peter H. Reuter · Crime and Justice · cit:566
  - Levi e Reuter revisaram o regime global de AML e concluíram que seus efeitos sobre métodos de lavagem e preços eram praticamente desconhecidos. É a crítica de eficácia que ainda hoje justifica investimento em analytics de rede em vez de reporte massivo.
- **[Transaction aggregation as a strategy for credit card fraud detection](https://doi.org/10.1007/s10618-008-0116-z)** (2008) — Christopher Whitrow, David J. Hand, Piotr Juszczak et al. · Data Mining and Knowledge Discovery · cit:455
  - Whitrow, Hand e Juszczak mostraram que agregar transações por janelas de tempo melhora a detecção sem abandonar o modelo tabular. É a origem do feature engineering de agregação que segue sendo baseline forte em cartões.
- **[Credit Card Fraud Detection Using Hidden Markov Model](https://doi.org/10.1109/tdsc.2007.70228)** (2008) — A. Srivastava, A. Kundu, Shamik Sural et al. · IEEE Transactions on Dependable and Secure Computing · cit:650
  - Srivastava, Kundu e Sural modelaram a sequência de operações do portador com HMM, sinalizando desvio de comportamento. Antecipou a virada para modelos sequenciais que só se consolidaria com deep learning em 2018.
- 🆕 **[Neural data mining for credit card fraud detection](https://doi.org/10.1109/tai.1999.809773)** (2003) — Rüdiger W. Brause, T. Langsdorf, M. Hepp · IEEE International Conference on Tools with Artificial Intelligence (ICTAI) · cit:402
  - Brause, Langsdorf e Hepp explicitaram o requisito brutal do domínio — menos de 0,1% de erro aceitável dado o desbalanceamento de 1 em 1000 — e combinaram mineração de dados com redes neurais. Formalizou a meta de alto recall com baixo alarme falso que define o campo.

## 2010–2017 · Big data, revisões e escalabilidade

A época resolveu o problema de escala e de método: como processar volumes que explodiram no e-commerce e como comparar dezenas de técnicas de forma defensável. O padrão que se firmou foi a combinação de features de agregação e rede com aprendizado supervisionado, mais o uso de frameworks de streaming como Spark, e a produção de revisões sistemáticas que viraram mapa do campo. Ficou em aberto a modelagem explícita de relações entre entidades — cartão, dispositivo, comerciante — que os modelos tabulares só capturavam por proxies.

- **[APATE: A novel approach for automated credit card transaction fraud detection using network-based extensions](https://doi.org/10.1016/j.dss.2015.04.013)** (2015) — Véronique Van Vlasselaer, Cristián Bravo, Olivier Caelen et al. · Decision Support Systems · cit:557
  - APATE estendeu a detecção com features de rede — vizinhança de cartões, comerciantes e endereços — mostrando ganho real sobre modelos puramente tabulares. É o marco que levou a indústria de cartões a adotar análise de rede em produção.
- **[SCARFF : A scalable framework for streaming credit card fraud detection with spark](https://doi.org/10.1016/j.inffus.2017.09.005)** (2017) — Fabrizio Carcillo, Andrea Dal Pozzolo, Yann‐Aël Le Borgne et al. · Information Fusion · cit:430
  - SCARFF implementou detecção em streaming com Spark, com balanceamento e aprendizado incremental sobre fluxo contínuo. Definiu a arquitetura de referência para scoring em tempo real em larga escala.
- **[Data mining for credit card fraud: A comparative study](https://doi.org/10.1016/j.dss.2010.08.008)** (2010) — Siddhartha Bhattacharyya, Sanjeev Jha, Kurian Tharakunnel et al. · Decision Support Systems · cit:1535
  - Bhattacharyya e colegas compararam supervisionado, não supervisionado e híbrido em dados reais de cartão, com foco em custo e desbalanceamento. Virou o benchmark metodológico mais citado para escolher abordagem em cartões.
- **[The application of data mining techniques in financial fraud detection: A classification framework and an academic review of literature](https://doi.org/10.1016/j.dss.2010.08.006)** (2010) — Eric W.T. Ngai, Yong Qiang Hu, Y.H. Wong et al. · Decision Support Systems · cit:2093
  - Ngai, Hu e Wong construíram um framework de classificação e revisaram a literatura de mineração de dados em fraude financeira. Deu vocabulário comum a um campo até então fragmentado entre finanças, estatística e sistemas.
- **[Fraud detection system: A survey](https://doi.org/10.1016/j.jnca.2016.04.007)** (2016) — Aisha Abdallah, Mohd Aizaini Maarof, Anazida Binti Zainal · Journal of Network and Computer Applications · cit:1042
  - Abdallah, Maarof e Zainal mapearam o sistema de detecção de fraude ponta a ponta, de aquisição de dados a resposta. Útil como checklist de arquitetura para times que montam a função de detecção do zero.
- **[Social Change and Crime Rate Trends: A Routine Activity Approach (1979)](https://doi.org/10.4324/9781439817803-12)** (2010) — L.E. COHEN AND M. FELSON · Routledge eBooks · cit:5999
  - A reedição de Cohen e Felson em 2010 consolidou a teoria da atividade rotineira como referência fora da criminologia. É o que dá base conceitual a features de contexto e a modelos de oportunidade em canais digitais.
- 🆕 **[Intelligent financial fraud detection: A comprehensive review](https://doi.org/10.1016/j.cose.2015.09.005)** (2015) — Jarrod West, Maumita Bhattacharya · Computers & Security · cit:1015
  - West e Bhattacharya revisaram detecção inteligente de fraude financeira cobrindo técnicas, métricas e limitações. Consolidou a crítica de que acurácia é métrica errada e que avaliação precisa ser por custo e por tempo até detecção.

## 2018–2022 · Grafos, sequências e custo-sensibilidade

A época resolveu o problema de representar relações e ordem temporal: GNNs passaram a modelar contas, dispositivos e comerciantes como nós de um grafo heterogêneo, e modelos sequenciais capturaram a ordem das transações. O padrão que se firmou foi aprendizado em grafo com atenção, muitas vezes semi-supervisionado dado o rótulo escasso, e otimização explicitamente sensível a custo em vez de acurácia. Ficou em aberto a robustez contra camuflagem deliberada do fraudador e a integração desses modelos com dados não estruturados, que só ganharia força com modelos generativos.

- **[Sequence classification for credit-card fraud detection](https://doi.org/10.1016/j.eswa.2018.01.037)** (2018) — Johannes Jurgovsky, Michael Granitzer, Konstantin Ziegler et al. · Expert Systems with Applications · cit:806
  - Jurgovsky e colegas trataram a fraude como classificação de sequência, usando histórico ordenado do cartão em vez de features agregadas. Mostrou ganho consistente sobre modelos tabulares e virou baseline para abordagens sequenciais.
- **[Enhancing Graph Neural Network-based Fraud Detectors against Camouflaged Fraudsters](https://doi.org/10.1145/3340531.3411903)** (2020) — Yingtong Dou, Zhiwei Liu, Li Sun et al. · ACM International Conference on Information and Knowledge Management (CIKM) · cit:1045
  - CARE identificou duas formas de camuflagem — de atributos e de relações — que degradam GNNs de fraude, e propôs agregação seletiva. É a primeira resposta sistemática ao fato de que o fraudador modela o detector.
- **[FaceForensics++: Learning to Detect Manipulated Facial Images](https://doi.org/10.1109/iccv.2019.00009)** (2019) — Andreas Rössler, Davide Cozzolino, Luisa Verdoliva et al. · IEEE/CVF International Conference on Computer Vision (ICCV) · cit:4836
  - FaceForensics++ criou benchmark automatizado para detecção de manipulação facial em deepfakes, faceswap e reenactment. Tornou comparável uma área que viraria insumo direto de fraude de identidade e de KYC.
- **[Heterogeneous Graph Neural Networks for Malicious Account Detection](https://doi.org/10.1145/3269206.3272010)** (2018) — Ziqi Liu, Chaochao Chen, Xinxing Yang et al. · ACM International Conference on Information and Knowledge Management (CIKM) · cit:519
  - GEM, do Alipay, foi a primeira GNN heterogênea para contas maliciosas em escala de produção, explorando agregação por dispositivo e por atividade. Provou que grafos funcionam em plataforma de pagamento real, não só em benchmark.
- **[Instance-dependent cost-sensitive learning for detecting transfer fraud](https://doi.org/10.1016/j.ejor.2021.05.028)** (2021) — Sebastiaan Höppner, Bart Baesens, Wouter Verbeke et al. · European Journal of Operational Research · cit:131
  - Höppner, Baesens e Verbeke formalizaram aprendizado sensível a custo dependente da instância para fraude de transferência. Deu base teórica para decidir caso a caso quanto vale bloquear, em vez de usar um único threshold global.
- **[Automatically Dismantling Online Dating Fraud](https://doi.org/10.1109/tifs.2019.2930479)** (2019) — Guillermo Suárez‐Tangil, Matthew Edwards, Claudia Peersman et al. · IEEE Transactions on Information Forensics and Security · cit:126
  - Suárez-Tangil e colegas analisaram perfis de sites de namoro e mostraram que filtros de spam não funcionam contra romance scam, propondo detecção baseada em arquétipo de perfil. Abriu a linha de defesa contra fraude relacional que hoje domina os prejuízos reportados.
- **[Combining unsupervised and supervised learning in credit card fraud detection](https://doi.org/10.1016/j.ins.2019.05.042)** (2019) — Fabrizio Carcillo, Yann‐Aël Le Borgne, Olivier Caelen et al. · Information Sciences · cit:738
  - Carcillo e colegas combinaram não supervisionado e supervisionado para lidar com rótulos escassos e atrasados em cartões. Virou receita padrão para treinar quando a fraude confirmada chega semanas depois da transação.
- **[A Semi-Supervised Graph Attentive Network for Financial Fraud Detection](https://doi.org/10.1109/icdm.2019.00070)** (2019) — Daixin Wang, Jianbin Lin, Peng Cui et al. · Proceedings · cit:650
  - Semi-GNN aplicou atenção em grafo multivisão com pouquíssimos rótulos, explorando interações ricas entre usuários de serviços financeiros. Consolidou o paradigma semi-supervisionado que domina detecção de fraude em rede.

## 2023 em diante · Foundation models e fraude generativa

A época está resolvendo o problema de generalização: em vez de um modelo por tarefa, treinar representações universais de transação e adaptá-las a múltiplos alvos. O padrão emergente são transformers sobre trajetórias de transação em escala de bilhões de eventos, com codificação por campo e autossupervisão, além de GNNs acopladas a aprendizado por reforço para adaptação contínua. Ficou em aberto a validação desses modelos sob regulação, o custo computacional, a explicabilidade exigida por supervisores e a defesa contra fraude gerada por IA, incluindo identidades sintéticas e golpes relacionais industrializados.

- **[Generative Adversarial Nets](https://doi.org/10.1007/978-3-658-40442-0_9)** (2023) — Raphael Labaca-Castro · Springer eBooks · cit:21133
  - A reedição de GANs em 2023 no contexto de segurança sintetiza o ponto de virada: modelos generativos deixaram de ser curiosidade acadêmica e passaram a ser ferramenta ofensiva e defensiva. É a base técnica de deepfakes, identidades sintéticas e aumento de dados para treino.
- **[TransactionGPT](https://doi.org/10.48550/arxiv.2511.08939)** (2025) — Yingtong Dou, Zhimeng Jiang, Tianyi Zhang et al. · arXiv (Cornell University) · cit:14
  - TransactionGPT treinou um foundation model em bilhões de transações reais de uma grande rede de pagamentos, com arquitetura 3D-Transformer e otimização conjunta com tarefas downstream. É a prova de que a lógica de foundation model se transfere para dados transacionais estruturados.
- **[Network Analytics for Anti-money Laundering—A Systematic Literature Review and Experimental Evaluation](https://doi.org/10.1287/ijds.2024.0042)** (2025) — Bruno Deprez, Toon Vanderschueren, Bart Baesens et al. · INFORMS Journal on Data Science · cit:54
  - Deprez, Vanderschueren e Baesens revisaram 97 papers de analytics de rede para AML e avaliaram experimentalmente o poder comparativo dos métodos. Organizou uma literatura fragmentada e deu base para escolher método com evidência, não com moda.
- **[Romance baiting, cryptorom and ‘pig butchering’: an evolutionary step in romance fraud](https://doi.org/10.1080/10345329.2023.2248670)** (2023) — Cassandra Cross · Current Issues in Criminal Justice · cit:66
  - Cross documentou a convergência entre romance fraud e investment fraud — romance baiting, cryptorom, pig butchering — em que o relacionamento é o mecanismo e cripto é o veículo. Redefiniu o escopo do que um banco precisa detectar além da transação suspeita isolada.
- **[FraudGNN-RL: A Graph Neural Network With Reinforcement Learning for Adaptive Financial Fraud Detection](https://doi.org/10.1109/ojcs.2025.3543450)** (2025) — Yiwen Cui, Xu Han, Jiaying Chen et al. · IEEE Open Journal of the Computer Society · cit:133
  - FraudGNN-RL combina GNN temporal-especial-semântica com aprendizado por reforço para detecção adaptativa em grafo dinâmico. Ataca diretamente o problema de drift adversarial que Bolton e Hand já apontavam em 2002.
- **[TREASURE: The Visa Payment Foundation Model for High-Volume Transaction Understanding](https://doi.org/10.48550/arxiv.2511.19693)** (2025) — Chin‐Chia Michael Yeh, Uday Singh Saini, Dai, Xin et al. · arXiv (Cornell University) · cit:8
  - TREASURE, da Visa, é um foundation model transformer que captura simultaneamente comportamento do consumidor e sinais da rede de pagamentos, como códigos de resposta e flags de sistema. Sinaliza que os sinais de infraestrutura, e não só os do portador, entram no modelo.
- **[Cybercriminal networks in the UK and Beyond: Network structure, criminal cooperation and external interactions](https://doi.org/10.1007/s12117-022-09476-9)** (2023) — Jonathan Lusthaus, E.R. Kleemans, Rutger Leukfeldt et al. · Trends in Organized Crime · cit:66
  - Lusthaus, Kleemans e Leukfeldt analisaram 10 investigações fechadas de cibercrime financeiro e mostraram uma divisão recorrente entre componentes de ataque/golpe e componentes de dinheiro, com elementos locais. Explica por que detecção de fraude e de lavagem precisam ser tratadas como um só pipeline.
- 🆕 **[Financial fraud detection using graph neural networks: A systematic review](https://doi.org/10.1016/j.eswa.2023.122156)** (2023) — Soroor Motie, Bijan Raahemi · Expert Systems with Applications · cit:387
  - Motie e Raahemi revisaram sistematicamente GNNs para detecção de fraude financeira, catalogando arquiteturas, datasets e métricas. Serve como mapa de implementação para times decidindo entre variantes de grafo.

## Onde estamos agora

O campo está na fase de foundation models aplicados a transação: Large Payments Model treinado do zero em até 400 bilhões de tokens de dados estruturados, com codificação por campo e autossupervisão ciente do ciclo de vida, e TransactionGPT e TREASURE seguindo a mesma direção em redes de pagamento reais. Ao mesmo tempo, a fronteira regulatória e de produto se move para pagamentos instantâneos e Open Finance, com a Resolução Conjunta BC/CMN 21/2026 refinando responsabilidades entre instituições e parceiras, e o Bank of Canada mostrando que governança centralizada de fraude não implementa a alocação ótima porque exclui pagamentos pequenos via tarifas. Do lado do ataque, o estudo de ataques de acesso persistente — em que o invasor reconfigura recursos de segurança para sobreviver à remediação — desloca o foco de detecção de transação para detecção de configuração e de sessão. A síntese é que o modelo de fraude deixou de ser um classificador e passou a ser infraestrutura de representação, disputada entre eficácia, custo e explicabilidade regulatória.

- Foundation models de transação generalizam entre bancos e mercados, ou cada rede precisa do seu próprio modelo?
- Como auditar e explicar um foundation model para o regulador sem perder o ganho de performance?
- Quem paga a conta e responde pelo erro em pagamento instantâneo sob Open Finance: iniciadora, detentora ou integradora?
- Detecção de acesso persistente deve viver no time de fraude, de segurança ou de identidade?
- Como defender contra golpe relacional e identidade sintética quando o sinal está fora do perímetro transacional do banco?

## Linhas por tema

- **📊 Modelos, dados e métricas de fraude**: Começou como comparação entre regras e classificadores supervisionados (Fawcett e Provost, 1997), virou disciplina estatística com Bolton e Hand (2002) e uma série de revisões sistemáticas entre 2010 e 2016, e evoluiu para grafos com camuflagem (CARE, 2020), aprendizado sensível a custo (2021) e, em 2025, foundation models de transação como TransactionGPT e TREASURE. O fio condutor é sempre o mesmo: rótulo escasso, atrasado e adversário adaptativo.
- **💳 Cartões & e-commerce**: Saiu de redes neurais sobre dados de emissor (Ghosh e Reilly, 1994) e HMMs de sequência (2008) para agregação de transações (Whitrow, 2008), features de rede (APATE, 2015) e streaming com Spark (SCARFF, 2017), chegando a classificação de sequência com deep learning (Jurgovsky, 2018) e combinação de supervisionado com não supervisionado (Carcillo, 2019). A trajetória é de janelas cada vez mais ricas de contexto, não de modelos mais exóticos.
- **🎣 Golpes e engenharia social**: Partiu da teoria criminológica de oportunidade (Cohen e Felson, 1979), passou pela constatação empírica de que o usuário não lê indicadores de segurança (Dhamija, 2006) e pela detecção de conteúdo de phishing (CANTINA, 2007), e chegou a detecção de arquétipos de perfil em romance scam (2019) e à convergência com investment fraud em cryptorom e pig butchering (Cross, 2023). O deslocamento é de defesa de canal para defesa de relação.
- **🕸️ Contas laranja, mulas & PLD/CFT**: Levi e Reuter (2006) mostraram que o regime AML global tinha efeitos mal medidos, a revisão de analytics de rede para AML (2025) organizou 97 papers e comparou métodos experimentalmente, e a análise de redes criminais de Lusthaus e colegas (2023) revelou a separação estrutural entre ataque e movimentação de dinheiro. O tema saiu de ceticismo sobre eficácia para engenharia de grafo aplicada a contas laranja.
- **🤖 IA generativa & deepfakes**: FaceForensics++ (2019) criou o benchmark que tornou a detecção de manipulação facial comparável, e a reedição de GANs em 2023 consolidou o modelo generativo como ferramenta central tanto para forjar quanto para detectar. A linha evolui de detectar imagem manipulada para detectar identidade e comportamento sintéticos em escala.
