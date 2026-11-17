# Evolução do estado da arte — Bank Fraud Watch

<sub>gerado em 2026-11-17 · 34 marcos de uma rede de 978 obras · modelo deepseek-ai/DeepSeek-V4.1-Flash</sub>

O campo começou nos anos 1970–90 em duas frentes separadas: a criminologia explicando por que a fraude acontece (Cohen & Felson, 1979) e a estatística/aprendizado de máquina mostrando como detectá-la com custo assimétrico e rótulos atrasados (Ghosh & Reilly, 1994; Fawcett & Provost, 1997). Nos anos 2000 a detecção virou disciplina própria, com revisões estatísticas, agregação de transações e modelos sequenciais substituindo regras manuais. De 2010 a 2022 a área industrializou-se: streaming em tempo real, features de rede, grafos neurais e aprendizado sensível a custo. Desde 2023, foundation models de transação e GNNs adaptativas por reforço disputam o posto de arquitetura padrão, enquanto o risco migrou para pagamentos instantâneos, cripto e redes criminais organizadas.

## O que mudou desde 2026-11-17

Entraram quatro marcos que ampliam a base histórica e social: a detecção neural em cartão de 1997, o capítulo de processo de fraud analytics de 2015, a reimpressão aplicada de Cohen & Felson (2010) e a revisão sistemática de romance scam (2023). Saíram três trabalhos de modelagem de cartão (2016 e 2017) e o TREASURE, foundation model da Visa de 2025 — a época 2023+ fica agora ancorada em TransactionGPT, LGM-GNN, FraudGNN-RL e nos estudos de rede criminosa e AML.

- ➕ Neural fraud detection in credit card operations (1997)
- ➕ Fraud: Detection, Prevention, and Analytics! (2015)
- ➕ Social Change and Crime Rate Trends: A Routine Activity Approach (1979) (2010)
- ➕ Tainted Love: a Systematic Literature Review of Online Romance Scam Research (2023)
- ➖ Credit Card Fraud Detection: A Realistic Modeling and a Novel Learning Strategy (2017)
- ➖ Feature engineering strategies for credit card fraud detection (2016)
- ➖ TREASURE: The Visa Payment Foundation Model for High-Volume Transaction Understanding (2025)

## até 1999 · Redes neurais contra regras manuais

O problema era volume: cartões e telefonia celular geravam transações demais para inspeção humana e regras fixas, com fraude crescendo mais rápido que a capacidade de revisão. A ideia que virou padrão foi tratar fraude como classificação supervisionada com classes extremamente desbalanceadas, avaliada por perda financeira e não por acurácia, e usar o perfil de comportamento do cliente como baseline. Redes neurais superaram regras em dados reais de emissor, e a detecção passou a rodar no hub transacional em tempo real. Ficaram em aberto escalabilidade para volumes massivos, rótulos atrasados e parciais, e a pergunta teórica de por que a fraude surge — respondida pela teoria da atividade rotineira.

- **[Adaptive Fraud Detection](https://doi.org/10.1023/a:1009700419189)** (1997) — Tom E. Fawcett, Foster John Provost · Data Mining and Knowledge Discovery · cit:1074
  - Formalizou a detecção de fraude como problema de aprendizado com custo assimétrico e rótulos atrasados, e defendeu avaliar o detector por perda financeira. É a referência fundadora da avaliação orientada a negócio.
- **[Credit card fraud detection with a neural-network](https://doi.org/10.1109/hicss.1994.323314)** (1994) — Ghosh, Reilly · Hawaii International Conference on System Sciences (HICSS) · cit:558
  - Primeira demonstração forte de rede neural sobre dados reais de emissor: detectou uma ordem de magnitude mais contas fraudulentas com 20x menos falsos positivos que o sistema baseado em regras.
- **[Distributed data mining in credit card fraud detection](https://doi.org/10.1109/5254.809570)** (1999) — Philip K. Chan, W. Fan, Andreas L. Prodromidis et al. · IEEE Intelligent Systems and their Applications · cit:626
  - Propôs mineração distribuída entre instituições para escalar a volumes massivos, antecipando em duas décadas o debate de aprendizado colaborativo e federado em fraude.
- 🆕 **[Neural fraud detection in credit card operations](https://doi.org/10.1109/72.595879)** (1997) — José R. Dorronsoro, F. Ginel, C. Sgnchez et al. · IEEE Transactions on Neural Networks · cit:307
  - Mostrou que é possível detectar fraude online no hub transacional usando apenas a operação e seu histórico imediato, sem base histórica do portador — a base conceitual do scoring em tempo real.
- **[Social Change and Crime Rate Trends: A Routine Activity Approach](https://doi.org/10.2307/2094589)** (1979) — Lawrence E. Cohen, Marcus Felson · American Sociological Review · cit:12079
  - Teoria da atividade rotineira: o crime exige convergência de ofensor motivado, alvo adequado e ausência de guardião. É o arcabouço que até hoje justifica monitoramento contínuo e controles de fricção no ponto de transação.
- **[Combining data mining and machine learning for effective user profiling](https://openalex.org/W2146935111)** (1996) — Tom E. Fawcett, Foster John Provost · Knowledge Discovery and Data Mining · cit:238
  - Combinou regras aprendidas com múltiplos profilers para gerar alarmes de alta confiança em telefonia celular; origem do design de ensembles de detectores e do problema de priorização de alertas.

## 2000–2009 · A fraude vira problema estatístico

A época resolveu a falta de método: a detecção de fraude foi consolidada como subcampo estatístico, com foco em distribuições extremas, sobreposição de classes e avaliação por custo. Viraram padrão a agregação de transações ao longo do tempo como feature e os modelos sequenciais que capturam o comportamento do portador, além do tratamento de phishing como problema de classificação com features de engano. Em aberto ficaram a eficácia real do regime antilavagem, a adaptação a fraudadores que mudam de tática e a ausência de benchmarks comparáveis entre estudos.

- **[Statistical Fraud Detection: A Review](https://doi.org/10.1214/ss/1042727940)** (2002) — Richard J. Bolton, David J. Hand · Statistical Science · cit:2119
  - Revisão que consolidou a detecção de fraude como subcampo estatístico, com ênfase em distribuições extremas, sobreposição de classes e custo de erro. Referência obrigatória para desenho de métricas e amostragem.
- **[Why phishing works](https://doi.org/10.1145/1124772.1124861)** (2006) — Rachna Dhamija, J. D. Tygar, Marti A. Hearst · CHI Conference on Human Factors in Computing Systems · cit:1677
  - Primeiro estudo empírico de por que o phishing funciona: 23% dos participantes ignoravam pistas do navegador. Deslocou a responsabilidade de 'educar o usuário' para 'projetar defesa técnica'.
- **[Money Laundering](https://doi.org/10.1086/501508)** (2006) — Michael Levi, Peter H. Reuter · Crime and Justice · cit:566
  - Sintetizou o regime global de antilavagem e mostrou que a evidência de eficácia é fraca. Até hoje é o contraponto cético a qualquer promessa de compliance como solução.
- **[Transaction aggregation as a strategy for credit card fraud detection](https://doi.org/10.1007/s10618-008-0116-z)** (2008) — Christopher Whitrow, David J. Hand, Piotr Juszczak et al. · Data Mining and Knowledge Discovery · cit:455
  - Introduziu agregação de transações ao longo do tempo como feature, capturando comportamento acumulado do portador. Virou padrão em feature engineering de cartão.
- **[Credit Card Fraud Detection Using Hidden Markov Model](https://doi.org/10.1109/tdsc.2007.70228)** (2008) — A. Srivastava, A. Kundu, Shamik Sural et al. · IEEE Transactions on Dependable and Secure Computing · cit:650
  - Modelou a sequência de operações com Hidden Markov Model treinado no comportamento normal do portador. Antecipou os modelos sequenciais que dominariam a década seguinte.
- **[Survey of fraud detection techniques](https://doi.org/10.1109/icnsc.2004.1297040)** (2004) — Yufeng Kou, Chang‐Tien Lu, S. Sirwongwattana et al. · IEEE International Conference on Networking, Sensing and Control (ICNSC) · cit:623
  - Survey que unificou cartão, telecom e intrusão sob o guarda-chuva de 'detecção de comportamento indesejado', criando vocabulário comum entre áreas que até então não conversavam.
- **[Learning to detect phishing emails](https://doi.org/10.1145/1242572.1242660)** (2007) — Ian Fette, Norman Sadeh, Anthony Tomasic · International World Wide Web Conference (WWW) · cit:784
  - Tratou phishing como classificação de e-mail com features de engano, com generalização para sites falsos. É a base dos filtros modernos de e-mail fraudulento.

## 2010–2017 · Escala, streaming e redes de relacionamento

O problema era a lacuna entre modelo acadêmico e operação: nada rodava em tempo real em escala e nada capturava que fraudadores agem em rede. A resposta foi dupla — frameworks de referência organizando o campo (tipos de fraude, técnicas, dados) e a virada para features de rede, com APATE mostrando ganho real ao usar endereço, IP e comerciante compartilhados. Ao mesmo tempo, streaming com Spark tornou viável treinar e atualizar modelos continuamente em produção. Ficaram em aberto o custo de negócio real de cada decisão, o drift de modelo e a distância entre benchmark e ambiente produtivo.

- **[APATE: A novel approach for automated credit card transaction fraud detection using network-based extensions](https://doi.org/10.1016/j.dss.2015.04.013)** (2015) — Véronique Van Vlasselaer, Cristián Bravo, Olivier Caelen et al. · Decision Support Systems · cit:556
  - APATE estendeu features de cartão com informação de rede (endereço, IP, comerciante compartilhados) e mostrou ganho sobre modelos puramente transacionais. Marco da virada relacional.
- **[SCARFF : A scalable framework for streaming credit card fraud detection with spark](https://doi.org/10.1016/j.inffus.2017.09.005)** (2017) — Fabrizio Carcillo, Andrea Dal Pozzolo, Yann‐Aël Le Borgne et al. · Information Fusion · cit:430
  - SCARFF trouxe detecção escalável em streaming com Spark, com treino e atualização contínuos. É a ponte entre pesquisa e operação em tempo real.
- **[Fraud Analytics Using Descriptive, Predictive, and Social Network Techniques: A Guide to Data Science for Fraud Detection](https://doi.org/10.1002/9781119146841)** (2015) — Bart Baesens, Véronique Van Vlasselaer, Wouter Verbeke · Wiley eBooks · cit:351
  - Primeiro guia a juntar descritivo, preditivo e redes sociais num processo único de analytics de fraude. Virou manual de referência para montar uma função de detecção do zero.
- **[Data mining for credit card fraud: A comparative study](https://doi.org/10.1016/j.dss.2010.08.008)** (2010) — Siddhartha Bhattacharyya, Sanjeev Jha, Kurian Tharakunnel et al. · Decision Support Systems · cit:1532
  - Comparativo sistemático de métodos de mineração em cartão, incluindo efeito de amostragem e custo. Ajudou a estabelecer protocolo de comparação justa entre modelos.
- **[The application of data mining techniques in financial fraud detection: A classification framework and an academic review of literature](https://doi.org/10.1016/j.dss.2010.08.006)** (2010) — Eric W.T. Ngai, Yong Qiang Hu, Y.H. Wong et al. · Decision Support Systems · cit:2089
  - Framework de classificação e revisão da literatura de fraude financeira, organizando o campo em tipos de fraude, técnicas e fontes de dados. Referência para estruturar taxonomias internas.
- 🆕 **[Fraud: Detection, Prevention, and Analytics!](https://doi.org/10.1002/9781119146841.ch1)** (2015) — Bart Baesens, Véronique Van Vlasselaer, Wouter Verbeke · Wiley eBooks · cit:5
  - Definiu o processo de fraud analytics e argumentou por que analytics complementa, e não substitui, as regras de especialistas — enquadramento que ainda orienta a governança de modelos.
- 🆕 **[Social Change and Crime Rate Trends: A Routine Activity Approach (1979)](https://doi.org/10.4324/9781439817803-12)** (2010) — L.E. COHEN AND M. FELSON · Routledge eBooks · cit:5995
  - A teoria da atividade rotineira volta ao circuito aplicado, sustentando a leitura de fraude como oportunidade estrutural e não como desvio individual — base para desenho de controles.

## 2018–2022 · Grafos, sequências e custo assimétrico

A época enfrentou dois problemas novos: fraudadores que se camuflam deliberadamente em grafos de relacionamento e a fraude industrializada em contas maliciosas e mídia sintética. Viraram padrão as GNNs heterogêneas treinadas em grafos conta-dispositivo, os modelos sequenciais com RNN/LSTM sobre histórico de transações e a combinação de aprendizado não supervisionado com supervisionado para lidar com fraude nova e poucos rótulos. O custo de errar deixou de ser constante e passou a ser modelado por instância. Ficaram em aberto explicabilidade, qualidade de rótulos e a nova superfície de ataque sintética.

- **[Sequence classification for credit-card fraud detection](https://doi.org/10.1016/j.eswa.2018.01.037)** (2018) — Johannes Jurgovsky, Michael Granitzer, Konstantin Ziegler et al. · Expert Systems with Applications · cit:803
  - Classificou sequências de transações com RNN/LSTM e mostrou que o histórico recente do cartão melhora a detecção. Consolidou a abordagem sequencial como padrão em cartão.
- **[Enhancing Graph Neural Network-based Fraud Detectors against Camouflaged Fraudsters](https://doi.org/10.1145/3340531.3411903)** (2020) — Yingtong Dou, Zhiwei Liu, Li Sun et al. · ACM International Conference on Information and Knowledge Management (CIKM) · cit:1044
  - CARE-GNN foi o primeiro a tratar explicitamente camuflagem de fraudadores (features e relações falsas), com seleção de vizinhos e agregação ponderada. Virou baseline de robustez em grafos.
- **[FaceForensics++: Learning to Detect Manipulated Facial Images](https://doi.org/10.1109/iccv.2019.00009)** (2019) — Andreas Rössler, Davide Cozzolino, Luisa Verdoliva et al. · IEEE/CVF International Conference on Computer Vision (ICCV) · cit:4824
  - FaceForensics++ criou o benchmark de detecção de manipulação facial (DeepFakes, Face2Face, FaceSwap, NeuralTextures). É o padrão de avaliação para KYC e prova de vida.
- **[Heterogeneous Graph Neural Networks for Malicious Account Detection](https://doi.org/10.1145/3269206.3272010)** (2018) — Ziqi Liu, Chaochao Chen, Xinxing Yang et al. · ACM International Conference on Information and Knowledge Management (CIKM) · cit:519
  - GEM foi a primeira GNN heterogênea em produção no Alipay, modelando grafos conta-dispositivo com atenção. Mostrou que agregação de dispositivo e de atividade é a fraqueza explorável do atacante.
- **[Automatically Dismantling Online Dating Fraud](https://doi.org/10.1109/tifs.2019.2930479)** (2019) — Guillermo Suárez‐Tangil, Matthew Edwards, Claudia Peersman et al. · IEEE Transactions on Information Forensics and Security · cit:126
  - Caracterizou com dados os perfis e as estratégias do romance scam e propôs desmonte automatizado. Trouxe a fraude de engenharia social para o terreno data-driven.
- **[Instance-dependent cost-sensitive learning for detecting transfer fraud](https://doi.org/10.1016/j.ejor.2021.05.028)** (2021) — Sebastiaan Höppner, Bart Baesens, Wouter Verbeke et al. · European Journal of Operational Research · cit:131
  - Aprendizado sensível a custo dependente da instância: o custo de errar varia por transação, e otimizar isso supera o custo fixo. Base para decisão de bloqueio orientada a valor.
- **[Combining unsupervised and supervised learning in credit card fraud detection](https://doi.org/10.1016/j.ins.2019.05.042)** (2019) — Fabrizio Carcillo, Yann‐Aël Le Borgne, Olivier Caelen et al. · Information Sciences · cit:738
  - Combinou detecção não supervisionada de novidade com modelo supervisionado para lidar com fraude nova e rótulos escassos. Padrão em produção quando há poucos casos confirmados.

## 2023 em diante · Foundation models e fraude organizada em rede

O problema agora é duplo: modelos tarefa-específicos não aproveitam o volume total de dados transacionais, e a fraude se organizou em cadeias transnacionais que separam golpe e movimentação de dinheiro. O padrão emergente são foundation models de domínio treinados em bilhões de transações, GNNs adaptativas por reforço sobre grafos dinâmicos e network analytics sistematizado para antilavagem. A fraude de relacionamento convergiu com fraude de investimento em cripto, criando canais de captação de alto valor. Ficam em aberto validação, custo computacional, governança de modelos de fundação e responsabilização em pagamentos instantâneos.

- **[TransactionGPT](https://doi.org/10.48550/arxiv.2511.08939)** (2025) — Yingtong Dou, Zhimeng Jiang, Tianyi Zhang et al. · arXiv (Cornell University) · cit:14
  - TransactionGPT é um foundation model de transação treinado em escala de bilhões, com arquitetura 3D-Transformer e otimização conjunta com tarefas downstream. Sinaliza a migração para modelos de fundação de domínio.
- **[Network Analytics for Anti-money Laundering—A Systematic Literature Review and Experimental Evaluation](https://doi.org/10.1287/ijds.2024.0042)** (2025) — Bruno Deprez, Toon Vanderschueren, Bart Baesens et al. · INFORMS Journal on Data Science · cit:54
  - Revisão sistemática de 97 papers e avaliação experimental de network analytics para AML. Organiza o que funciona e o que é hype na detecção de lavagem baseada em rede.
- **[Romance baiting, cryptorom and ‘pig butchering’: an evolutionary step in romance fraud](https://doi.org/10.1080/10345329.2023.2248670)** (2023) — Cassandra Cross · Current Issues in Criminal Justice · cit:66
  - Cross documenta a convergência romance + investimento falso (romance baiting, cryptorom, pig butchering). Mostra que a fraude de relacionamento virou canal de captação para fraude de cripto.
- **[FraudGNN-RL: A Graph Neural Network With Reinforcement Learning for Adaptive Financial Fraud Detection](https://doi.org/10.1109/ojcs.2025.3543450)** (2025) — Yiwen Cui, Xu Han, Jiaying Chen et al. · IEEE Open Journal of the Computer Society · cit:133
  - FraudGNN-RL combina GNN com aprendizado por reforço sobre grafo dinâmico, com convolução temporal-espacial-semântica. Aponta para detecção que reage ao comportamento do atacante em vez de só classificá-lo.
- **[LGM-GNN: A Local and Global Aware Memory-Based Graph Neural Network for Fraud Detection](https://doi.org/10.1109/tbdata.2023.3234529)** (2023) — Pengbo Li, Hang Yu, Xiangfeng Luo et al. · IEEE Transactions on Big Data · cit:93
  - LGM-GNN incorpora memória local e global para não perder anomalias que só aparecem na visão global do grafo — corrige o viés de agregação puramente local das GNNs anteriores.
- **[Cybercriminal networks in the UK and Beyond: Network structure, criminal cooperation and external interactions](https://doi.org/10.1007/s12117-022-09476-9)** (2023) — Jonathan Lusthaus, E.R. Kleemans, Rutger Leukfeldt et al. · Trends in Organized Crime · cit:65
  - Análise de 10 casos de investigações de cibercrime financeiro: divisão clara entre componentes de ataque/golpe e de movimentação de dinheiro, com elementos offline locais. Base para mapear redes de mulas.
- 🆕 **[Tainted Love: a Systematic Literature Review of Online Romance Scam Research](https://doi.org/10.1093/iwc/iwad048)** (2023) — Alexander Bilz, Lynsay A. Shepherd, Graham I. Johnson · Interacting with Computers · cit:107
  - Revisão sistemática de romance scam consolidando fatores de vitimização e contramedidas, com evidência qualitativa e quantitativa. Referência para desenho de intervenção e suporte à vítima.

## Onde estamos agora

O campo está migrando de modelos tarefa-específicos para foundation models de domínio: o Large Payments Model, treinado do zero em dados transacionais estruturados com até 400 bilhões de tokens e codificações por campo, é o mesmo movimento que TransactionGPT já apontava. Em paralelo, a discussão saiu do modelo e foi para a governança: o Bank of Canada modela controle centralizado versus descentralizado de fraude em pagamentos instantâneos e mostra que governança centralizada não atinge a alocação ótima por excluir pagamentos pequenos via tarifas, enquanto a Resolução Conjunta BC/CMN 21/2026 refina responsabilidades no Open Finance para pessoa jurídica. Do lado do ataque, o primeiro estudo holístico de ataques de acesso persistente mapeia 11 rotas pelas quais o invasor reconfigura recursos de segurança para sobreviver à remoção da vítima. A fronteira prática hoje é menos 'qual modelo' e mais 'quem responde pelo erro' e 'como manter acesso e identidade sob controle'.

- Foundation models de transação superam modelos especializados o suficiente para justificar o custo computacional e a opacidade?
- Quem deve absorver a perda em pagamentos instantâneos: banco, PSP, recebedor ou vítima?
- Como detectar acesso persistente e reconfiguração de segurança sem gerar atrito excessivo no cliente legítimo?
- Network analytics para AML tem ganho real fora do laboratório, ou o gargalo é investigação e não detecção?
- Como validar modelos que aprendem com bilhões de eventos quando os rótulos de fraude chegam meses depois?

## Linhas por tema

- **📊 Modelos, dados e métricas de fraude**: Começou como classificação supervisionada com custo assimétrico (Fawcett & Provost, 1997), virou subcampo estatístico com método próprio (Bolton & Hand, 2002) e taxonomia (Ngai, 2010), ganhou processo de negócio (Baesens, 2015) e custo por instância (Höppner, 2021), e hoje se reorganiza em torno de foundation models de transação (TransactionGPT, 2025) e GNNs adaptativas por reforço.
- **💳 Cartões & e-commerce**: Saiu de redes neurais contra regras em dados de emissor (Ghosh & Reilly, 1994) para scoring online no hub transacional (Dorronsoro, 1997), depois agregação temporal (Whitrow, 2008) e modelos sequenciais (Srivastava, 2008; Jurgovsky, 2018), chegando a features de rede (APATE, 2015), streaming em Spark (SCARFF, 2017) e combinação não supervisionado+supervisionado (Carcillo, 2019).
- **🎣 Golpes e engenharia social**: A base teórica veio da criminologia (Cohen & Felson, 1979), a virada empírica veio do phishing (Dhamija, 2006; Fette, 2007) e a fraude de relacionamento foi caracterizada com dados (Suárez-Tangil, 2019; Bilz, 2023), até convergir com fraude de investimento em cripto no pig butchering (Cross, 2023).
- **🕸️ Contas laranja, mulas & PLD/CFT**: A eficácia do regime antilavagem foi questionada cedo (Levi & Reuter, 2006), a estrutura das redes criminais foi mapeada empiricamente com a separação entre golpe e movimentação de dinheiro (Lusthaus, 2023), e a detecção baseada em rede só agora foi sistematizada e avaliada experimentalmente (Deprez, 2025).
