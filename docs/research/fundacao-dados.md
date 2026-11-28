# Fundação de dados em bancos grandes: normas, casos, fracassos e o programa "na marra"

Levantamento de **28/11/2026** para a fundação do plano (`estrategia/bb/05-panoramas.md` §5). A tese a testar é:
*nada acima funciona sem dado integrado e confiável, e isso exige um programa de cima para baixo.* O documento
reúne o que as normas pedem, o que bancos grandes fizeram, o que fracassou e por quê, e transforma isso em opções de
programa com premissas testáveis. Tudo vem de fonte pública. Nada aqui é interno de banco algum. A versão para
máquina está em [`fundacao-dados.json`](fundacao-dados.json). O par deste documento é
[`roi-dados-ia.md`](roi-dados-ia.md), que mede o retorno.

## Como ler

- **Força da evidência.** **forte**: norma, decisão de regulador, ordem de enforcement, relatório oficial de
  supervisão, experimento. **média**: estudo observacional sério, survey grande e repetido, caso publicado com
  método. **fraca**: survey de consultoria sem método aberto, previsão, número de fornecedor, frase de executivo.
- **Tipo de fonte.** (acad), (reg), (auto) autodeclarado, (cons) consultoria/survey, (forn) fornecedor.
- **✓** = conferido na web em 28/11/2026. **◇** = literatura conhecida, não reconferida nesta sessão.
- **Premissas** usam o prefixo **F** (F01–F12), para não colidir com P01–P55 nem com R01–R13.

---

## Resumo

- **O Brasil acabou de criar o mandato.** A **Resolução Conjunta CMN/BCB n.º 18, de 28/11/2025**, obriga as
  instituições a ter uma política de qualidade das informações prestadas ao BCB. Ela cita o BCBS 239 como base, define
  **12 dimensões** de qualidade, exige governança com envolvimento do conselho, inventário, testes e relatório, e um
  diretor responsável. Vigora desde 01/01/2026, com adequação até **31/12/2026** **[forte, reg]** ✓. O "programa na
  marra" já tem alavanca regulatória e prazo: daqui a um mês.
- **Dez anos depois do prazo, quase nenhum banco global cumpre o BCBS 239.** O prazo para os G-SIBs era jan/2016. Em
  nov/2023, só **2 de 31** G-SIBs cumpriam todos os princípios **[forte, reg]** ✓. Em jan/2026, o Comitê de Basileia
  ainda aponta linhagem de dados, cultura e falta de atenção da alta administração como barreiras **[forte, reg]** ✓.
- **O fracasso não é de tecnologia.** As causas que os supervisores citam são programas sem verba, sem patrocínio, sem
  dono e tratados como projeto de TI (BCBS 2023 e 2026; ECB, mai/2024) **[forte, reg]** ✓.
- **O custo de não fazer é medido em multas.** Citi: US$ 400 mi (out/2020) e mais US$ 135,6 mi (jul/2024) por
  "progresso insuficiente" em qualidade de dados **[forte, reg]** ✓. CBA (A$ 700 mi, 2018), Westpac (A$ 1,3 bi,
  2020) e TSB (£ 48,65 mi, 2022) por falhas de dado e sistema **[forte, reg]** ◇.
- **O benefício positivo tem evidência fraca.** Os números famosos de "custo do dado ruim" (US$ 12,9 mi/ano por
  empresa; US$ 3,1 tri nos EUA; regra 1-10-100) são de consultoria ou de fornecedor **[fraca]**. Não encontrei
  estudo causal ligando conformidade com BCBS 239 a resultado.
- **O que tende a funcionar** (evidência média a fraca, coerente entre fontes): mandato do conselho; donos por
  domínio com metas no scorecard; começar pelos dados críticos das decisões e dos reportes; contratos de dados na
  origem; federação com núcleo central forte, e não mesh puro; uma "prova do relatório ad hoc" como métrica de
  prontidão.

---

## 1. Normas e marcos de supervisão

### 1.1 BCBS 239 e acompanhamento

| Documento | Data | O que diz | Força |
|---|---|---|---|
| **BCBS 239**, *Principles for effective risk data aggregation and risk reporting* | jan/2013 | 14 princípios em 4 grupos: governança e infraestrutura (1–2); agregação de dados de risco: acurácia, completude, tempestividade, adaptabilidade (3–6); reporte (7–11); supervisão (12–14). Prazo para G-SIBs: jan/2016; D-SIBs: 3 anos após a designação | forte ✓ |
| Relatórios de progresso | 2013–2020 | séries de autoavaliação e avaliação supervisora; progresso lento e reclassificações para baixo | forte ◇ |
| **Relatório de progresso (d559)** | 28/11/2023 | 31 G-SIBs avaliados; **só 2** cumprem todos os princípios; "trabalho significativo" a fazer na maioria; programas sem verba e sem atenção da alta administração | forte ✓ |
| **BCBS Newsletter 36** | 06/01/2026 | governança de dados subiu ao conselho, mas cultura de dados "ainda em construção"; **linhagem** segue difícil (legado, fornecedores); relatórios ad hoc em crise seguem um obstáculo; recomenda **testar relatórios ad hoc em tempos bons**, medir benefício de negócio para financiar linhagem automática, controles compensatórios onde há falha conhecida | forte ✓ |

### 1.2 Europa (BCE)

| Documento | Data | O que diz | Força |
|---|---|---|---|
| Revisão temática do BCE sobre RDARR | mai/2018 | 25 bancos significativos; implementação insatisfatória na maioria | média ◇ |
| **Guia do BCE sobre RDARR** | final em **03/05/2024** (consulta jul/2023) | lido junto com o BCBS 239, não cria exigência legal nova; sete áreas: responsabilidade do órgão de administração, escopo, papéis de governança de dados, arquitetura de dados integrada no grupo (com linhagem), gestão de qualidade no grupo, tempestividade do reporte interno, programas de implementação eficazes. Baseado na campanha de inspeções de 2022 | forte ✓ |
| Prioridades de supervisão do SSM | 2024–26 e 2026–28 | RDARR segue como vulnerabilidade prioritária; nova campanha de inspeções | média ✓ (via EDM Council, abr/2026) |

### 1.3 Brasil

| Norma | Data | O que diz | Força |
|---|---|---|---|
| **Resolução Conjunta n.º 18** (CMN/BCB) | **28/11/2025**; DOU 01/12/2025; vigência 01/01/2026; adequação até **31/12/2026** | política de qualidade das informações prestadas ao BCB, "com base na recomendação do BCBS 239". Abrange dados quantitativos e qualitativos e os **processos** que os produzem. Exige: governança robusta; conselho aprova a política e as diretrizes; diretoria garante as dimensões e os testes; inventário dos dados e reportes, com responsáveis; testes de qualidade (inclusive os definidos pelo BCB); relatório consolidado com irregularidades; plano de ação ao conselho se persistirem; diretor responsável perante o BCB; guarda de 5 anos | forte ✓ |
| Doze dimensões da RC 18 | — | acessibilidade, acurácia, adaptabilidade, clareza, comparabilidade, completude, confiabilidade, consistência, integridade, rastreabilidade, relevância, tempestividade | forte ✓ |
| Motivo declarado (Voto 172/2025-BCB, 17/11/2025) | — | as unidades do BCB "ainda se deparam, constantemente, com inconsistências nas informações prestadas" | forte ✓ |
| **Res. CMN 4.968/2021**, alterada pela **5.178/2024** | 25/11/2021; 26/09/2024 | controles internos; desde 2024 exige mecanismos para garantir a qualidade da informação | forte ✓ |
| **Res. CMN 4.557/2017** | 23/02/2017 | gerenciamento integrado de riscos e de capital (S1–S4) | forte ✓ |
| **LGPD** (Lei 13.709/2018), art. 6.º, V | 2018 | princípio da **qualidade dos dados** pessoais (exatidão, clareza, relevância, atualização) | forte ◇ |

**Implicação.** A RC 18 é um BCBS 239 brasileiro, mais largo (todas as informações ao BCB, não só risco) e com
dimensões explícitas. Ela dá ao programa três coisas que faltavam: patrocínio obrigatório do conselho, um diretor
com nome e um prazo. O que ela não dá é o uso gerencial do dado. Esse é o pedaço que o programa precisa somar
(F01).

---

## 2. Disciplinas e padrões

| Padrão | Data | O que é | Uso no programa | Força |
|---|---|---|---|---|
| **DAMA-DMBOK 2** | 2017; edição revisada 2024 | 11 áreas de conhecimento, com governança no centro | vocabulário comum e mapa de papéis | média (prática) ◇ |
| **EDM Council DCAM** e **CDMC** | DCAM v2 ~2020; CDMC 2021 | modelo de maturidade em gestão de dados, usado por bancos; CDMC para nuvem | linha de base e meta de maturidade, comparável com pares | média ◇ |
| **ISO/IEC 25012** | 2008 | 15 características de qualidade (inerentes e dependentes do sistema) | dicionário de dimensões | forte (norma) ◇ |
| **ISO 8000** | várias partes, 2011– | qualidade de dados mestres e troca de dados | MDM | forte (norma) ◇ |
| **ISO/IEC 5259** | 2024–25 | qualidade de dados para analytics e ML | dados de treino de modelos | forte (norma) ◇ |
| **Wang & Strong (1996)**, *JMIS* 12(4) | 1996 | 15 dimensões em 4 grupos (intrínseca, contextual, representacional, acesso), do ponto de vista do usuário | base acadêmica das dimensões | média (acad) ◇ |
| **DAMA UK, 6 dimensões** | 2013 | completude, unicidade, tempestividade, validade, acurácia, consistência | métricas mínimas de SLA | fraca-média ◇ |
| **Data mesh** (Dehghani) | artigo 2019; livro 2022 | domínio é dono; dado como produto; plataforma self-serve; governança federada "computacional" | organização por domínio | média (conceito) ◇ |
| **Contratos de dados** (ODCS, Bitol / LF AI & Data) | modelo do PayPal aberto em 2023; ODCS v3 em 2024 | acordo versionado entre produtor e consumidor: esquema, semântica, SLA, qualidade, dono | "sem contrato, sem ingestão" | fraca-média ◇ |
| **LEI** (ISO 17442, GLEIF) e **FIBO** (EDM Council) | 2012–; 2014– | identificador global de entidade; ontologia financeira | MDM de contraparte; ligação com `leis-ontologias-formatos.md` | forte (norma) ◇ |
| **OpenLineage** (LF AI & Data) | 2021– | padrão aberto de eventos de linhagem | linhagem automática (a fraqueza nº 1 do BCBS) | média ◇ |

### 2.1 Do padrão à métrica: SLA de qualidade

Cada **elemento crítico de dado** (CDE) recebe dono, definição e SLA medido por regra executável:

```
qualidade_CDE(t) = média ponderada das dimensões medidas (completude, validade, consistência, tempestividade...)
SLA: qualidade_CDE ≥ meta  E  atraso ≤ janela  E  incidentes_sev1 = 0 no mês
nota_dominio = Σ_CDE peso × 1[SLA cumprido] / Σ peso       # entra no scorecard do dono
```

As dimensões medidas são as 12 da RC 18, para que o mesmo painel sirva ao BCB e à gestão.

---

## 3. O que bancos grandes fizeram (casos públicos)

| Banco | Período | O que fez | Resultado público | Força |
|---|---|---|---|---|
| **Citigroup** | out/2020 → 2026 | ordens de consentimento do Fed e do OCC sobre gestão de risco, dados e governança; multa de US$ 400 mi; programa de "transformação" com investimento declarado em qualidade de dados | jul/2024: mais US$ 135,6 mi (Fed US$ 60,6 mi; OCC US$ 75 mi) por progresso insuficiente em qualidade de dados e por não monitorar o efeito da qualidade nos reportes; a CEO admitiu que o banco "não andou rápido o bastante" | forte (reg) ✓ |
| **Commonwealth Bank** | 2018 | inquérito prudencial da APRA (abr/2018): falhas de governança, cultura e responsabilização; add-on de A$ 1 bi de capital. AUSTRAC: A$ 700 mi por 53.750 reportes atrasados de depósitos inteligentes, por erro de código | reestruturação de governança e de responsabilidade por riscos | forte (reg) ◇ |
| **Westpac** | set/2020 | A$ 1,3 bi (AUSTRAC) por > 23 mi de infrações, incluindo ~19,5 mi de transferências internacionais não reportadas | maior multa civil da história australiana à época | forte (reg) ◇ |
| **TSB** | migração abr/2018; multas dez/2022 | migração de plataforma falhou; FCA e PRA: £ 48,65 mi | caso de referência de migração de dado e sistema | forte (reg) ◇ |
| **Capital One** | 2019–2020 | migração total para nuvem (último data center fechado em 2020); vazamento de 2019 (~100 mi de pessoas nos EUA); OCC: US$ 80 mi (ago/2020) por falhas de gestão de risco na migração | rapidez sem controle de dado custa caro | forte (reg) ◇ |
| **JPMorgan** | 2020– | data mesh na AWS com "produtos de dados" por domínio e catálogo central; gasto de tecnologia de ~US$ 19,8 bi previsto para 2026 | autodeclarado (blog da AWS e eventos) | fraca (auto/forn) ◇ ✓ (gasto) |
| **DBS** | 2014– | transformação digital, plataforma de dados e mais de 2.000 modelos em 2025; mede valor econômico de IA contra grupo de controle | ≈ S$ 1 bi de valor de IA em 2025 (autodeclarado) | fraca-média (auto) ✓ |

**O que os casos têm em comum.**
1. As histórias de sucesso são autodeclaradas. As de fracasso são documentadas por reguladores. A assimetria é de
   evidência, não necessariamente de frequência.
2. Nos fracassos documentados, a causa raiz é governança e responsabilização (CBA, Citi), não a ferramenta.
3. Migrações rápidas sem controle de dado (TSB, Capital One) geram custo concentrado e visível.

---

## 4. O que fracassa e por quê

| Causa | Evidência | Fonte e data | Força |
|---|---|---|---|
| **Falta de atenção e verba da alta administração** | citada no relatório de 2023 e de novo em jan/2026 | BCBS d559 (28/11/2023); BCBS Newsletter 36 (06/01/2026) | forte ✓ |
| **Programa tratado como projeto de TI com data de fim** | o BCE pede "programas de implementação eficazes" e dono no órgão de administração | Guia RDARR (03/05/2024) | forte ✓ |
| **Linhagem de dados incompleta** | "componente desafiador" por legado, dado distribuído e lacunas de fornecedores | BCBS Newsletter 36 | forte ✓ |
| **Marcos não cumpridos e controles compensatórios fracos** | motivo explícito das multas de 2024 ao Citi | Fed e OCC (10/07/2024) | forte ✓ |
| **Cultura e responsabilidades fragmentadas** | resistência à mudança; 78% dos executivos dizem que fatores humanos são a barreira | BCBS Newsletter 36; Wavestone 2024 | forte (reg) / fraca (survey) ✓ |
| **"Cascatas de dados" em IA** | 92% de 53 profissionais de IA em alto risco tiveram ao menos uma cascata de dados; "todos querem fazer o modelo, não o dado" | Sambasivan et al., CHI 2021 | média (acad, qualitativo) ◇ |
| **Mesh puro sem núcleo central** | o Gartner classificou data mesh como "obsoleto antes do platô" no Hype Cycle de 2022 | Gartner (2022) | fraca ◇ |
| **Previsões de fracasso de governança** | "80% das iniciativas de governança de dados e analytics vão fracassar até 2027" | Gartner (28/02/2024) | fraca (previsão) ◇ |

---

## 5. Custo e benefício de programas de qualidade

### 5.1 Custo de não fazer (evidência forte)

| Caso | Valor | Data | Força |
|---|---|---|---|
| Citi, OCC | US$ 400 mi | 07/10/2020 | forte ✓ |
| Citi, Fed + OCC | US$ 135,6 mi | 10/07/2024 | forte ✓ |
| CBA, AUSTRAC | A$ 700 mi | jun/2018 | forte ◇ |
| Westpac, AUSTRAC | A$ 1,3 bi | set/2020 | forte ◇ |
| TSB, FCA + PRA | £ 48,65 mi | dez/2022 | forte ◇ |
| Capital One, OCC | US$ 80 mi | ago/2020 | forte ◇ |

Além da multa, há custo de capital (add-on de A$ 1 bi no CBA) e restrição de negócio (ordens de consentimento
limitam crescimento e exigem aprovação de planos).

### 5.2 Custo do dado ruim no dia a dia (evidência fraca)

| Afirmação | Fonte | Força |
|---|---|---|
| dado ruim custa US$ 12,9 mi/ano por organização em média | Gartner (2020–21) | fraca ◇ |
| dado ruim custa US$ 3,1 tri/ano aos EUA | IBM (2016), via Redman, HBR | fraca ◇ |
| só 3% das empresas têm dado que atende padrão básico; 47% dos registros novos com ao menos um erro crítico | Nagle, Redman & Sammon, HBR (set/2017), 75 executivos | fraca-média ◇ |
| regra 1-10-100: prevenir custa 1, corrigir 10, falhar 100 | Labovitz & Chang (1992) | fraca ◇ |
| cientistas de dados gastam ~45% do tempo preparando dado | Anaconda, State of Data Science (2020) | fraca ◇ |

### 5.3 Benefício positivo (evidência média, não causal)

- Empresas que decidem com dados têm 5–6% mais produção (Brynjolfsson, Hitt & Kim, 2011) e ~3% mais
  produtividade no censo industrial dos EUA (Brynjolfsson & McElheran, 2016) **[média, acad]** ◇.
- O BCBS (jan/2026) sugere que os bancos **mostrem benefício de negócio** (custo, eficiência) para financiar a
  linhagem automática, sinal de que nem os supervisores têm esse número pronto **[forte, reg]** ✓.
- **Lacuna.** Não encontrei estudo que estime o efeito causal de conformidade com BCBS 239 em resultado, perda ou
  custo. O caso de negócio inicial fica no custo evitado (multa, capital, horas de reconciliação) mais o valor dos
  casos de uso que o dado destrava (`roi-dados-ia.md` §6).

### 5.4 Como medir o benefício do próprio programa

```
ganho_programa_t = horas_reconciliação_evitadas × custo_hora
                 + Δajustes_manuais_nos_reportes × custo_por_ajuste
                 + Δincidentes_sev1 × custo_médio_incidente
                 + Δtempo_até_modelo_em_produção × valor_mensal_dos_modelos
                 + p(multa ou add-on evitado) × valor_esperado
                 + Σ casos de uso destravados (atribuição combinada antes; roi-dados-ia.md §2.1)
```

Desenho: **cunha escalonada por domínio** (um domínio entra no programa a cada trimestre, em ordem sorteada dentro
de cada nível de prioridade). Domínios que ainda não entraram são o controle. Métricas lidas por trimestre.

---

## 6. O programa "na marra": opções

Cada opção tem três intensidades (leve, média, na marra). A coluna "premissa" liga à §7.

| # | Opção | Leve | Média | Na marra | Evidência pública | Força | Premissa |
|---|---|---|---|---|---|---|---|
| **O1** | **Mandato do conselho** | política aprovada | política + diretor responsável (o mínimo da RC 18) | conselho aprova metas de qualidade e acompanha trimestralmente, com o mesmo peso de capital e liquidez | RC 18/2025; BCBS 239 P1; Guia BCE 2024 | forte | F01, F02 |
| **O2** | **Donos por domínio** | dono nomeado | dono com CDEs, definições e SLAs | dono responde pelo SLA no scorecard e no bônus; sem dono, o dado não pode ser usado em decisão | BCBS 239 P1; RC 18 (inventário com responsáveis); BCE 2024 (papéis) | forte (norma) / fraca (efeito do bônus) | F03 |
| **O3** | **Começar pelas decisões** | inventário amplo | CDEs dos reportes ao BCB | CDEs das 20 maiores decisões (capital, crédito agro, preço, provisão) + reportes, 100–300 elementos | BCBS 239 (materialidade); DCAM | média | F04 |
| **O4** | **Integração obrigatória** | catálogo voluntário | contrato de dados para fontes novas | "sem contrato, sem ingestão" e "sem CDE certificado, sem modelo em produção" (gate no comitê de modelos) | ODCS; SR 26-2 (dados de entrada dos modelos); ISO/IEC 5259 | fraca-média | F05 |
| **O5** | **Prova do relatório ad hoc** | — | exercício anual | **drill trimestral**: agregar a exposição a um choque novo (ex.: agro por município e cadeia) em ≤ 1 dia útil, com reconciliação contábil | BCBS 239 P6 (adaptabilidade); BCBS Newsletter 36 recomenda | forte | F06 |
| **O6** | **Arquitetura** | data lake central | mesh com produtos de dados por domínio | **federado com núcleo forte**: MDM, catálogo, linhagem e regras de qualidade centrais e executáveis; domínios publicam produtos | Dehghani (2022); JPMorgan (auto); Gartner (2022) | fraca-média | F07 |
| **O7** | **Custo visível** | relatório de incidentes | painel de custo do dado ruim por domínio | **chargeback**: o domínio produtor paga a reconciliação e os ajustes que seu dado causa | prática de mercado; sem estudo | fraca | F08 |
| **O8** | **MDM de cliente e grupo econômico** | chave por CPF/CNPJ | CNPJ raiz e grupo econômico | registro de ouro com LEI, CNPJ raiz, grupo econômico e ligações produtor-cooperativa-cadeia | ISO 8000; ISO 17442; BCBS 239 P3–4 | forte (norma) | F11 |
| **O9** | **Incentivo e cultura** | treinamento | campeões de dados por área | metas de dado no bônus dos executivos de negócio, não só da TI; quem decide sem dado certificado precisa justificar | Wavestone 2024; BCBS Newsletter 36 | fraca | F10 |
| **O10** | **Terceira linha e supervisão** | — | auditoria interna anual da política | auditoria contínua dos CDEs; relatório ao conselho com as mesmas 12 dimensões que o BCB pede | RC 18 (relatório consolidado); BCBS 239 P12–14 | forte (norma) | F09 |

### 6.1 Sequência sugerida

| Fase | Prazo | O que entra | Marco que se mede |
|---|---|---|---|
| **0. Mandato** | 0–90 dias | O1 (média→na marra), O2 (dono nomeado), O3 (lista de decisões e CDEs), linha de base DCAM e primeiro drill (O5) | conselho aprovou; % de CDEs com dono; tempo do drill de base |
| **1. Núcleo** | 3–12 meses | contratos e SLAs nos CDEs (O4), linhagem automática dos CDEs, MDM de cliente e grupo econômico (O8), painel de custo (O7), gate de modelos | SLA por domínio; cobertura de linhagem; tempo do drill ≤ 1 dia |
| **2. Domínios** | 12–24 meses | produtos de dados por domínio (O6), metas no bônus (O2, O9), chargeback (O7), entrada escalonada dos domínios comerciais | cunha escalonada da §5.4; tempo até modelo em produção |
| **3. Valor** | 24+ meses | dado como insumo medido dos casos de uso (`roi-dados-ia.md` §6), revisão de incentivos | ganho atribuído por domínio |

**Regra de sequência.** Primeiro o que o regulador exige e o que sustenta capital e provisão. Depois o que destrava
os casos de uso de maior valor. A arquitetura vem depois do mandato e do dono, nunca antes (lição do BCBS: programa
de TI sem dono não termina).

---

## 7. Premissas testáveis (F01–F12)

### F01 Estender a RC 18 do reporte regulatório ao uso gerencial custa menos que um programa separado
- **Hoje.** A RC 18 já exige governança, inventário, dimensões e testes até 31/12/2026 **[forte]** ✓.
- **Teste.** Interno: custo marginal de incluir os CDEs gerenciais no mesmo inventário e nas mesmas regras.
  Público: acompanhar notas de consultorias e do BCB sobre a adequação em 2027.
- **Confirma se** o custo marginal < 30% do custo do programa regulatório. **Refuta se** > 70%.
- **Decisão.** Confirmada → um programa só, com o diretor da RC 18 como dono. Refutada → separar.

### F02 Os programas de dados de bancos fracassam por governança e dono, não por tecnologia
- **Hoje.** BCBS 2023 e 2026, Guia BCE 2024, multas do Citi 2024, inquérito APRA 2018 **[forte]**.
- **Teste (público).** Codificar as causas citadas em todos os relatórios de progresso do BCBS, guias do BCE e ordens
  de enforcement ligadas a dados (2013–2026). Contar governança/dono/patrocínio contra tecnologia/ferramenta.
- **Confirma se** governança aparece em ≥ 2× mais documentos que tecnologia como causa raiz. **Refuta se** empata.
- **Decisão.** Confirmada → começar por O1 e O2, e não por uma compra de plataforma.

### F03 Dono por domínio com meta no scorecard melhora a qualidade mais que um CDO central sem orçamento
- **Hoje.** Coerente com BCBS e BCE, mas sem estudo de efeito **[fraca]**.
- **Teste.** Cunha escalonada: domínios entram com meta no scorecard em ordem sorteada; comparar nota de SLA.
- **Confirma se** os domínios com meta sobem ≥ 15 p.p. de SLA em 2 trimestres a mais que os sem meta. **Refuta se** < 5 p.p.
- **Decisão.** Confirmada → meta de dado no bônus de todos os donos (O2 na marra).

### F04 Começar por 100–300 CDEs das grandes decisões dá valor antes que um inventário completo
- **Hoje.** Princípio de materialidade do BCBS 239 **[forte]**; efeito em tempo **[fraca]**.
- **Teste.** Tempo até o primeiro drill (O5) ≤ 1 dia e até o primeiro modelo com dado certificado.
- **Confirma se** os dois marcos saem em ≤ 6 meses. **Refuta se** > 12 meses.
- **Decisão.** Confirmada → manter o escopo curto e expandir por onda.

### F05 Contratos de dados na origem reduzem incidentes de qualidade em ≥ 30% em 6 meses
- **Hoje.** Relatos de prática (PayPal, ODCS) **[fraca]**.
- **Teste.** Diferenças em diferenças entre pipelines com e sem contrato, incidentes por mês.
- **Confirma se** queda ≥ 30%. **Refuta se** < 10%.
- **Decisão.** Confirmada → "sem contrato, sem ingestão" (O4 na marra).

### F06 O tempo do drill ad hoc é a melhor métrica única de prontidão de dados
- **Hoje.** BCBS 239 P6 e a recomendação de jan/2026 **[forte]**. No plano, a crise do agro é o drill natural
  (`05-panoramas.md` §1).
- **Teste.** Drill trimestral: exposição a um choque escolhido na hora (clima, preço, setor) por município, produto e
  grupo econômico, reconciliada com o balancete. Correlacionar tempo do drill com as notas de SLA.
- **Confirma se** o tempo do drill cai junto com a melhora de SLA e é ≤ 1 dia em 12 meses. **Refuta se** não
  se mexe com o SLA (métrica mal desenhada).
- **Decisão.** Confirmada → o drill vira o indicador do conselho (O1, O5).

### F07 Em banco grande regulado, federado com núcleo forte vence mesh puro e centralização pura
- **Hoje.** Casos autodeclarados (JPMorgan) e ceticismo do Gartner **[fraca]**.
- **Teste.** Comparar domínios com produtos de dados federados e domínios atendidos pelo time central: tempo de
  entrega e SLA.
- **Confirma se** o federado entrega ≥ 30% mais rápido com SLA igual ou melhor. **Refuta se** o SLA piora.
- **Decisão.** Define O6.

### F08 Reconciliação e correção manual consomem ≥ 20% do tempo dos analistas de risco e finanças
- **Hoje.** Surveys dão 40–45% para cientistas de dados **[fraca]**.
- **Teste.** Diário de tempo de duas semanas numa amostra sorteada de analistas.
- **Confirma se** ≥ 20%. **Refuta se** < 10%.
- **Decisão.** Confirmada → o custo visível (O7) já paga a fase 1.

### F09 O risco regulatório domina o caso de negócio nos dois primeiros anos
- **Hoje.** Multas de centenas de milhões que crescem com o atraso (Citi 2020 → 2024) **[forte]**; RC 18 com prazo
  em 31/12/2026 ✓.
- **Teste (público).** Acompanhar 2027: ações do BCB ligadas à RC 18 e notas de consultorias sobre achados.
- **Confirma se** há ações ou exigências do BCB ligadas à RC 18 em 2027. **Refuta se** a norma vira só papel.
- **Decisão.** Confirmada → a fase 0–1 é financiada como conformidade, sem exigir VPL positivo próprio.

### F10 A cultura de dados muda com incentivo e com quem decide, não com treinamento
- **Hoje.** 78% dizem que fatores humanos são a barreira (Wavestone, 2024) **[fraca]**; BCBS (jan/2026) cita
  resistência à mudança **[forte]**.
- **Teste.** Três grupos de áreas: só treinamento, só incentivo, os dois; medir o uso de dado certificado nas
  decisões registradas.
- **Confirma se** incentivo ≥ 2× o efeito de treinamento. **Refuta se** treinamento sozinho basta.
- **Decisão.** Define O9.

### F11 Sem MDM de grupo econômico, os painéis de concentração erram de forma relevante (liga P03 e P47)
- **Hoje.** Hipótese. As premissas de concentração do agro dependem de agregar por grupo.
- **Teste (público, já possível).** Nas bases de `data/ifs/` e nos cadastros públicos (CNPJ raiz), comparar a
  concentração por CNPJ e por grupo econômico.
- **Confirma se** a concentração por grupo é ≥ 20% maior que por CNPJ nos 20 maiores. **Refuta se** < 5%.
- **Decisão.** Confirmada → MDM de grupo econômico entra na fase 1 (O8).

### F12 O próprio dado público do Watch tem defeitos medíveis nas 12 dimensões da RC 18
- **Hoje.** Hipótese. Revisões e quebras de série são conhecidas em IF.data e ESTBAN.
- **Teste (público, já possível).** Rodar as 12 dimensões sobre `data/ifs/`: revisões entre versões (confiabilidade),
  lacunas (completude), conciliação ESTBAN × IF.data (consistência), atraso de publicação (tempestividade).
- **Confirma se** ≥ 3 dimensões com defeito material. **Refuta se** nenhuma.
- **Decisão.** Confirmada → publicar o painel de qualidade dos dados do Watch, com a mesma régua que o banco vai
  usar. Serve de prova de conceito do programa.

---

## 8. Limites

- As histórias de sucesso são autodeclaradas; as de fracasso são documentadas. Isso enviesa a leitura para "o que
  dá errado".
- Não há estudo causal público do benefício de BCBS 239 ou de programas de qualidade.
- A RC 18 é de nov/2025. Ainda não há supervisão publicada sobre ela.
- O efeito das opções O2, O4, O7 e O9 só se mede dentro do banco. Com dado público, testam-se F02, F09, F11 e F12.

## Referências

Normas e supervisão: BCBS 239 (jan/2013) https://www.bis.org/publ/bcbs239.htm; BCBS d559 (28/11/2023)
https://www.bis.org/bcbs/publ/d559.htm; BCBS Newsletter 36 (06/01/2026) https://www.bis.org/publ/bcbs_nl36.htm; BCE, Guia
RDARR (03/05/2024) https://www.ssm.europa.eu/ecb/pub/pdf/ssm.supervisory_guides240503_riskreporting.en.pdf; Voto
81/2025-CMN e Voto 172/2025-BCB https://normativos.bcb.gov.br/Votos/CMN/202581/Voto_do_CMN_81_2025.pdf; Resolução
Conjunta n.º 18/2025 (DOU 01/12/2025); Res. CMN 4.968/2021 e 5.178/2024; Res. CMN 4.557/2017; Lei 13.709/2018.

Enforcement: Fed, 10/07/2024 https://www.federalreserve.gov/newsevents/pressreleases/enforcement20240710a.htm; Citigroup
8-K (out/2020) https://www.sec.gov/Archives/edgar/data/831001/000110465920113933/tm2032793d1_8k.htm; APRA, Prudential
Inquiry into CBA (30/04/2018); AUSTRAC × CBA (jun/2018) e × Westpac (set/2020); FCA e PRA × TSB (20/12/2022);
OCC × Capital One (06/08/2020).

Padrões e literatura: DAMA-DMBOK 2 (2017; rev. 2024); EDM Council DCAM e CDMC; ISO/IEC 25012:2008; ISO 8000; ISO/IEC
5259; ISO 17442; Wang & Strong (1996) *JMIS* 12(4); Dehghani (2022) *Data Mesh*, O'Reilly; Bitol ODCS; OpenLineage;
Sambasivan et al. (2021) CHI; Brynjolfsson, Hitt & Kim (2011); Brynjolfsson & McElheran (2016).

Surveys e consultorias: Wavestone, Data and AI Leadership Executive Survey 2024
https://www.wavestone.com/en/insight/data-ai-executive-leadership-survey-2024/; Gartner (2020–21; 28/02/2024; Hype
Cycle 2022); Nagle, Redman & Sammon, HBR (2017); Anaconda (2020); EDM Council webinar (21/04/2026); GARP (abr/2026).
