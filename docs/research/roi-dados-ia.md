# ROI de dados, analytics e IA: métodos, evidências e playbook de medição

Levantamento de **28/11/2026** para a fundação do plano (`estrategia/bb/05-panoramas.md` §5 e §6). A pergunta é:
*como medir o retorno de um ativo de dados, de uma equipe de dados ou de uma área de IA e inteligência de mercado,
e como esse retorno entra no campo `4_retorno_esperado` das propostas e se atualiza.* Tudo vem de fonte pública.
Nada aqui é interno de banco algum. A versão para máquina está em [`roi-dados-ia.json`](roi-dados-ia.json).

## Como ler

- **Força da evidência.** **forte**: experimento aleatório, quase-experimento bem identificado, norma ou decisão
  de regulador. **média**: estudo observacional sério, survey grande e repetido, documento oficial de banco com
  método declarado. **fraca**: survey de consultoria sem método aberto, previsão, número de fornecedor, frase de
  executivo.
- **Tipo de fonte.** (acad) acadêmica; (reg) regulador ou norma; (auto) autodeclarado por banco ou empresa;
  (cons) consultoria ou survey; (forn) fornecedor que vende a solução.
- **✓** = conferido na web em 28/11/2026. **◇** = citado da literatura conhecida, não reconferido nesta sessão.
  Antes de usar um número ◇ numa proposta, abrir a fonte.
- **Regra herdada** (`docs/sources/fatores-externos-e-propostas.md` §2.6): o LLM propõe, o código mede e a pessoa
  aprova. Número sem fonte leva o rótulo **premissa**.
- **Premissas.** As premissas deste documento usam o prefixo **R** (R01 a R13), para não colidir com P01–P55 de
  `estrategia/bb/01-premissas.md`. Onde há ligação, ela é indicada.

---

## Resumo

- **No nível da tarefa, o ganho da IA generativa é real e medido.** Experimentos de campo dão +14% a +26% de
  produção por hora ou por pessoa, concentrado em quem tem menos experiência (Brynjolfsson, Li & Raymond, 2023/2025;
  Cui et al., 2025) **[forte]** ✓.
- **No nível da empresa, o ganho ainda é pequeno ou não aparece.** Na Dinamarca, com dado administrativo de 25 mil
  pessoas, o efeito em salário e horas é nulo e preciso (Humlum & Vestergaard, 2025) **[forte]** ✓. Só ~6% das
  empresas atribuem 5% ou mais do EBIT à IA (McKinsey, 2025 e 2026) **[fraca]** ✓.
- **A percepção engana.** Desenvolvedores experientes ficaram 19% mais lentos com IA e acharam que ficaram 20% mais
  rápidos (METR, jul/2025) **[forte]** ✓. Autodeclaração de "horas economizadas" é teto, não base.
- **Bancos divulgam pouco e sem auditoria.** Só 8 dos 50 maiores bancos divulgavam ROI de IA no portfólio em 2025
  (Evident AI Index) e 30% dos casos de uso anunciados traziam alguma métrica de impacto (Evident, ago/2025)
  **[média]** ✓. JPMorgan (~US$ 2 bi de benefício para ~US$ 2 bi de gasto, out/2025) e DBS (~S$ 1 bi em 2025,
  medido contra grupo de controle) são os casos mais citados **[fraca, auto]** ✓.
- **Valoração de dados.** Três abordagens (custo, mercado, renda). Para decisão, a de renda com "com e sem" é a única
  que responde "quanto vale". A de custo é piso. Não há norma ISO de valoração monetária: a ISO 55013:2024 exclui
  valoração do escopo ✓. Na contabilidade (IAS 38 / CPC 04), dado gerado internamente quase sempre vai para despesa.
  No capital regulatório, intangível é deduzido do capital principal (Basel III) **[forte]**.
- **Risco de modelo mudou em 2026.** O SR 11-7 (2011) foi substituído pelo **SR 26-2 / OCC 2026-13 (17/04/2026)**,
  com abordagem baseada em risco e um pedido de informações sobre IA anunciado **[forte, reg]** ✓.
- **O playbook (§6)** dá, para oito tipos de iniciativa, a métrica, o desenho, o tamanho de amostra, o tempo até a
  leitura e a fórmula que alimenta `4_retorno_esperado`. **A §7** mostra como o intervalo de retorno encolhe quando
  uma premissa é confirmada (atualização bayesiana e Monte Carlo).

---

## 1. Valorar um ativo de dados

### 1.1 As três abordagens

São as mesmas de qualquer intangível (IVSC, **IVS 210 Intangible Assets**, IVS em vigor desde 31/01/2025)
**[forte, reg]** ◇.

| Abordagem | Pergunta | Fórmula prática | Quando serve | Armadilha |
|---|---|---|---|---|
| **Custo** | quanto custaria refazer? | custo de reposição = coleta + limpeza + integração + armazenagem, menos obsolescência | piso; seguro; dado sem uso claro | custo não é valor: dado caro e inútil vale pouco |
| **Mercado** | quanto alguém paga por algo igual? | preço de dado comparável (bureau, licença, API) × ajuste | dado vendável (cadastro, preços, geodado) | quase não há mercado para dado bancário próprio (LGPD, sigilo da LC 105/2001) |
| **Renda** | quanto caixa a mais o dado gera? | **com e sem**: VP(fluxo com o dado) − VP(fluxo sem o dado); ou *relief-from-royalty* | decisão de investir; preço interno | atribuição: o ganho é do dado, do modelo ou do processo? |

**Regra do Watch.** Para decidir, usar renda (com e sem), medida por experimento ou backtest. Usar custo como piso e
como teto do que vale pagar para refazer. Mercado só como referência externa.

### 1.2 Os modelos de "infonomia"

- **Moody & Walsh (1999), ECIS.** Sete "leis" da informação: é compartilhável sem perda; vale mais quanto mais se
  usa; é perecível; vale mais quanto mais exata; vale mais combinada; mais não é sempre melhor; não se esgota.
  Propõem custo, mercado e utilidade como métodos **[média, acad]** ◇. Lição útil: o valor está no **uso**, então
  dado não usado deve ser tratado como custo.
- **Laney, *Infonomics* (2017, Gartner).** Seis modelos. Três não financeiros: valor intrínseco (IVI), de negócio
  (BVI) e de desempenho (PVI = melhoria do KPI com o dado contra um grupo sem o dado). Três financeiros: custo (CVI),
  mercado (MVI) e econômico (EVI = receita atribuível − custo do ciclo de vida) **[fraca, cons]** ◇. O PVI é, na
  prática, um A/B. O EVI é a abordagem de renda.
- **Fleckenstein, Obaidi & Tryfona (2023), *Harvard Data Science Review*.** Revisão de métodos de valoração. Conclui
  que não há método dominante e propõe uma pontuação combinada **[média, acad]** ◇.
- **OECD (2022), *Measuring the value of data and data flows*** (Digital Economy Papers n.º 345). Compara custo,
  mercado e renda no nível macro **[média, reg]** ◇.

### 1.3 Valor pelo uso no modelo

- **Ablação (com e sem).** Treinar o modelo com e sem a fonte de dados. O ganho de AUC ou de erro, convertido em R$
  pelo playbook (§6), é o valor da fonte. É o método mais simples e o mais defensável.
- **Data Shapley** (Ghorbani & Zou, ICML 2019). Valor de cada fonte ou registro pela contribuição marginal média
  em todas as combinações **[média, acad]** ◇. Serve para dividir o crédito entre várias fontes. É caro de calcular:
  usar por fonte, não por linha.
- **Exemplo de banco com dado novo.** Berg, Burg, Gombović & Puri (2020, *Review of Financial Studies*): a "pegada
  digital" sozinha dá AUC de 69,6%, o bureau 68,3%, e os dois juntos 73,6%, com inadimplência real de uma loja online
  alemã **[forte, acad]** ◇. Lição: o valor do dado está no **complemento** ao que já existe.

### 1.4 Contabilidade, estatística e normas

| Tema | O que diz | Força |
|---|---|---|
| **IAS 38 / CPC 04 (R1)** | pesquisa vai para despesa; desenvolvimento só é capitalizado se cumprir seis critérios; listas de clientes geradas internamente **não** podem ser reconhecidas (IAS 38.63). Dado comprado é capitalizado ao custo | forte (reg) ◇ |
| **Capital regulatório** | intangíveis são deduzidos do capital principal (Basel III, dez/2010, §67; no Brasil, Res. CMN 4.955/2021). Capitalizar dado ou software **não** ajuda o índice de capital | forte (reg) ◇ |
| **China, MOF** | "Disposições provisórias sobre o tratamento contábil de recursos de dados", emitidas em ago/2023, vigentes desde **01/01/2024**: dado pode ir para intangível ou estoque, com divulgação | forte (reg) ✓ |
| **SNA 2025** | a Comissão de Estatística da ONU adotou o SNA 2025 em **mar/2025**: dado passa a ser ativo produzido (investimento no PIB) quando usado na produção por mais de um ano | forte (reg) ✓ |
| **ISO 55013:2024** | guia de gestão de ativos de dados (jul/2024). **Exclui** métodos de valoração monetária | forte (reg) ✓ |
| **ISO/IEC 25012 (2008), ISO 8000, ISO/IEC 5259 (2024–25)** | modelos e medidas de qualidade de dados; a série 5259 é para analytics e ML | forte (reg) ◇ |
| **ISO de valoração** | não encontrei norma ISO ou ISO/IEC de valoração monetária de dados publicada ou em projeto | — ✓ |

**Implicação.** Valor de dado não aparece no balanço do banco nem no capital. Ele aparece no fluxo: menos perda,
mais margem, menos custo. Por isso a métrica certa é a de fluxo (§6), e não um "valor do ativo".

---

## 2. Valorar uma equipe de dados, uma área de IA ou de inteligência de mercado

### 2.1 Portfólio de casos de uso com razão única

O valor da equipe é a soma dos casos de uso medidos, menos o custo da equipe e da plataforma:

```
valor_equipe = Σ_i ganho_incremental_i × participação_atribuída_i − custo_equipe − custo_plataforma
```

- **Um livro-razão só.** Cada R$ de ganho é registrado uma vez, com dono da área de negócio e parcela da equipe de
  dados combinada antes. Sem isso, a soma dos "ganhos" de todas as áreas passa do lucro do banco.
- **Atribuição entre vários contribuintes.** Valor de Shapley (dado, modelo, processo, canal) quando os efeitos
  interagem; regra simples (ex.: 50/50) quando não houver experimento fatorial.
- **Ganho incremental quer dizer contrafactual.** Comparar com o que teria acontecido sem a iniciativa: grupo de
  controle, holdout permanente, diferenças em diferenças ou backtest fora do tempo.
- **Prova de que medição observacional erra.** Gordon, Zettelmeyer, Bhargava & Chapsky (2019, *Marketing
  Science*), com 15 experimentos grandes no Facebook: métodos observacionais não recuperam o efeito do experimento e
  muitas vezes o superestimam muito **[forte, acad]** ◇.
- **DBS é o exemplo público.** Diz medir o valor econômico de IA comparando clientes que receberam a solução com um
  grupo de controle (relatório anual 2025) **[fraca, auto]** ✓.

### 2.2 Opções reais

- Piloto pequeno com gatilho de escala vale mais do que o VPL estático diz quando a incerteza é alta (Dixit &
  Pindyck, 1994) **[forte, acad]** ◇.
- Aplicado a TI: Benaroch & Kauffman (1999, *Information Systems Research*) **[média, acad]** ◇.
- Na prática, uma árvore de dois estágios basta:

```
VPL_com_opção = −C_piloto + p_sucesso × max(0, VPL_escala | sucesso) / (1+Ke)^t_piloto
valor_da_opção = VPL_com_opção − max(0, VPL_escala_direto)
```

- **Curva J da produtividade** (Brynjolfsson, Rock & Syverson, 2021, *AEJ: Macro*): tecnologias de uso geral exigem
  investimento intangível (processo, treinamento) que primeiro derruba e depois eleva a produtividade medida
  **[média, acad]** ◇. Implicação: o payback de dados e IA tem de prever o vale.

### 2.3 Valor da informação (para inteligência de mercado)

Uma área de inteligência de mercado não produz receita direta. Ela muda decisões. O método é o do **valor da
informação** (Howard, 1966, *IEEE Trans. Systems Science and Cybernetics*) **[forte, acad]** ◇, popularizado por
Hubbard (*How to Measure Anything*, 3.ª ed., 2014) **[média]** ◇.

```
VOI = E[valor | decido com a informação] − E[valor | decido sem ela]
EVPI (teto) = E[max_a valor(a, θ)] − max_a E[valor(a, θ)]
```

- **Ex ante:** calcular o EVPI das premissas que sustentam as maiores decisões. Se a área custa mais que a soma dos
  EVPIs, ela está grande demais.
- **Ex post:** **diário de decisões.** Para cada decisão relevante, registrar antes a opção padrão, a recomendação da
  área e o valor em jogo. Depois, registrar se a decisão mudou e o resultado.

```
valor_realizado_MI = Σ_decisões 1[decisão mudou] × (valor(opção nova) − valor(opção padrão))
```

- **Qualidade das previsões:** escore de Brier ou erro absoluto contra o ingênuo e contra o consenso (Focus,
  sell-side). Previsão que não bate o ingênuo não tem valor de informação.
- **Evidência de que decidir com dados paga:** empresas que decidem com dados têm 5–6% mais produção que o esperado
  (Brynjolfsson, Hitt & Kim, 2011, SSRN) **[média, acad]** ◇. No censo industrial dos EUA, a adoção de decisão por
  dados se associa a ~3% de produtividade (Brynjolfsson & McElheran, 2016, *AER P&P*) **[média, acad]** ◇. São
  associações, não efeitos causais.

### 2.4 VPL de um modelo com decaimento

Todo modelo perde valor: o mundo muda (drift), a concorrência copia e o processo se acomoda.

```
G_t = G_0 × (1 − d)^(t−1)               # ganho no ano t, decaimento anual d
VPL = −C_desenv − C_validação + Σ_{t=1..T} (G_t − C_operação − C_monitoramento) / (1+Ke)^t
     − Σ_recalibrações C_recal / (1+Ke)^t_r
```

Exemplo ilustrativo (premissas: G_0 = 10, C_desenv = 6, C_validação = 1,5, C_operação = 1/ano, T = 5, Ke = 15%):

| Decaimento anual d | VPL |
|---|---|
| 0% | 22,7 |
| 15% | 15,1 |
| 30% | 9,5 |

- A taxa d é uma **premissa** (R07). Não há boa evidência pública sobre ela.
- Choques derrubam modelos: na pandemia, 35% dos bancos do Reino Unido disseram que o desempenho dos modelos de ML
  piorou (Bank of England, *Quarterly Bulletin* 2020 T4) **[média, reg]** ◇.
- O monitoramento (PSI, Gini por safra) é o que transforma d de premissa em medida.

---

## 3. Evidência de ROI da IA: o que é rigoroso e o que não é

### 3.1 Estudos rigorosos (experimentos e quase-experimentos)

| Estudo | Desenho | Resultado | Força |
|---|---|---|---|
| Brynjolfsson, Li & Raymond, NBER WP 31161 (abr/2023); *QJE* 140(2), 2025 | adoção escalonada de assistente genAI, ~5.170 atendentes | +14% de casos resolvidos por hora (WP; 15% em versão posterior); +34% para novatos; quase nada para experientes | forte ✓ |
| Cui, Demirer, Jaffe, Musolff, Peng & Salz, *Management Science* (2025) | 3 experimentos aleatórios em Microsoft, Accenture e uma Fortune 100; 4.867 devs | +26,1% de tarefas concluídas (EP 10,3%); +27–39% para juniores, +8–13% para seniores; adoção ~60% após 1 ano | forte ✓ |
| METR, arXiv 2507.09089 (jul/2025) | RCT, 16 devs experientes, 246 tarefas reais | **19% mais lentos** com IA; esperavam +24%; depois acharam que ganharam +20% | forte (n pequeno) ✓ |
| Humlum & Vestergaard, NBER WP 33777 (mai/2025) | dado administrativo dinamarquês, 25 mil pessoas, 7 mil empresas, 11 ocupações | economia de tempo autodeclarada de 2,8% das horas; efeito nulo em salário e horas (IC exclui > 1–2%) | forte ✓ |
| Dell'Acqua et al., HBS WP 24-013 (set/2023) | experimento com 758 consultores da BCG | dentro da "fronteira": +12,2% tarefas, −25,1% tempo, +40% qualidade; fora dela: 19 p.p. menos acertos | forte ◇ |
| Noy & Zhang, *Science* 381 (jul/2023) | experimento online, 453 profissionais, tarefas de escrita | −40% tempo, +18% qualidade | forte (tarefa de laboratório) ◇ |
| Peng, Kalliamvakou, Cihon & Demirer, arXiv (fev/2023) | RCT, 95 devs, uma tarefa | 55,8% mais rápido | média (autores ligados ao GitHub; tarefa única) ◇ |
| Ascarza, *Journal of Marketing Research* 55(1), 2018 | dois experimentos de campo de retenção | mirar quem tem **alto risco** de churn é pior que mirar quem tem **alto uplift** | forte ◇ |
| Karlan & Zinman, *AER* 98(3), 2008 | taxas de juros sorteadas em crédito ao consumidor (África do Sul) | demanda pouco elástica a cortes de taxa abaixo do padrão, mais elástica a altas | forte ◇ |
| Bertrand, Karlan, Mullainathan, Shafir & Zinman, *QJE* 125(1), 2010 | 50 mil ofertas de crédito com conteúdo sorteado | mudanças de apresentação valem tanto quanto 200 p.b. de taxa para homens | forte ◇ |
| Fuster, Goldsmith-Pinkham, Ramadorai & Walther, *Journal of Finance* 77(1), 2022 | dado de hipotecas dos EUA | ML melhora pouco a previsão média e redistribui entre grupos | média-forte ◇ |

**O que se tira daí.**
1. O ganho por tarefa é de **10–30%** onde a IA está dentro da fronteira. Fora dela, piora.
2. O ganho é maior para quem tem menos experiência. Isso muda **onde** pilotar (atendimento, primeira linha).
3. O ganho de tarefa não vira resultado sozinho. Precisa de redesenho de processo e de realocação de capacidade
   (R02).
4. Autodeclaração superestima (METR; Humlum). Toda proposta deve medir, não perguntar.

### 3.2 Macro e previsões

| Fonte | Afirmação | Força |
|---|---|---|
| Acemoglu, "The Simple Macroeconomics of AI", NBER (mai/2024); *Economic Policy* (2025) | efeito na PTF ≈ 0,7% em 10 anos | média (modelo) ◇ |
| McKinsey Global Institute (jun/2023) | genAI vale US$ 2,6–4,4 tri/ano; bancos US$ 200–340 bi (9–15% do lucro operacional) | fraca (estimativa por tarefa) ◇ |
| Goldman Sachs, Briggs & Kodnani (mar/2023) | +7% do PIB global em 10 anos | fraca (previsão) ◇ |

### 3.3 Surveys de consultoria (indicam direção, não magnitude)

| Fonte | Afirmação | Força |
|---|---|---|
| McKinsey, *The state of AI in 2025* | 39% atribuem algum efeito no EBIT à IA, a maioria < 5%; ~6% são "high performers" (≥ 5% do EBIT); estes redesenham fluxos quase 3× mais | fraca ✓ |
| McKinsey, *The state of AI in 2026: On the road to ROI* | 37% atribuem efeito no EBIT; high performers seguem em ~6% | fraca ✓ |
| BCG, *The Widening AI Value Gap* (set/2025), 1.250 executivos | 5% "future-built" capturam valor em escala; 60% não têm valor material; 35% começando | fraca ✓ |
| BCG (30/09/2026) | "future-built" sobem para 7,5% | fraca ✓ |
| MIT NANDA, *The GenAI Divide* (jul–ago/2025) | "95% sem retorno"; o próprio relatório se diz "achados preliminares"; amostra e denominador criticados | fraca ✓ |
| Gartner (29/07/2024) | ≥ 30% dos projetos de genAI abandonados após a prova de conceito até o fim de 2025 | fraca (previsão) ◇ |
| Gartner (25/06/2025) | > 40% dos projetos de IA agêntica cancelados até o fim de 2027 | fraca (previsão) ◇ |
| Stanford AI Index 2025 (abr/2025) | compila os anteriores; a maioria das empresas relata economia < 10% e receita < 5% por função | média (compilação) ◇ |

### 3.4 Números de fornecedor (não usar como base)

- GitHub/Microsoft: "55% mais rápido" vem do estudo de uma tarefa da §3.1 **[média]**. Os experimentos maiores dão
  26% (Cui et al.) ou −19% (METR).
- OpenAI sobre o BBVA: "~3 horas por semana por pessoa" é autodeclarado e publicado pelo fornecedor **[fraca]** ✓.
- Klarna (fintech, 27/02/2024): o assistente "faz o trabalho de 700 atendentes". Em mai/2025 o CEO disse que voltaria
  a contratar pessoas para manter a qualidade **[fraca, auto]** ◇.

---

## 4. Como os bancos divulgam valor de IA (tudo autodeclarado)

| Banco | Data | O que disse | Método declarado | Força |
|---|---|---|---|---|
| **JPMorgan** | mai/2025 (Investor Day) | investimentos de tecnologia do ano com retorno > 2× e payback < 5 anos; valor de IA/ML +35% no ano anterior; custo de fraude estável com ataques crescendo 12% a.a. | não detalhado | fraca ✓ |
| **JPMorgan** | out/2025 (Dimon, Bloomberg TV) | "para US$ 2 bi de despesa, cerca de US$ 2 bi de benefício"; "ponta do iceberg" | parte mensurável (ex.: pessoal), parte não | fraca ✓ |
| **JPMorgan** | fev/2026 (Company Update) | gasto de tecnologia de ~US$ 19,8 bi em 2026; LLM Suite com ~150 mil usuários por semana, ~4 h/semana economizadas; ~US$ 600 mi de eficiências reinvestidas; Dimon: retorno difícil de quantificar por iniciativa, a economia "não está num VPL" | autodeclaração de horas | fraca ✓ |
| **DBS** | relatório anual 2023 | S$ 370 mi de valor econômico de IA | grupo de controle | fraca ◇ |
| **DBS** | relatório anual 2024 | > S$ 750 mi; > 1.500 modelos; > 370 casos de uso; meta > S$ 1 bi em 2025 | grupo de controle | fraca-média ✓ |
| **DBS** | relatório anual 2025 | ≈ S$ 1 bi; > 2.000 modelos; > 430 casos; inclui receita e produtividade; CEO: mais difícil isolar à medida que a IA se embute nos fluxos | clientes com a solução × grupo de controle | fraca-média ✓ |
| **BBVA** | mai/2024 → mai/2025 → 12/12/2025 | ChatGPT Enterprise de 3 mil para 11 mil e depois ~120 mil funcionários; 2,8 h/semana (dado interno de adoção) ou ~3 h (OpenAI); > 80% de uso diário | autodeclaração | fraca ✓ |
| **Commonwealth Bank** | nov/2024 | perdas de clientes com golpes caíram à metade no ano fiscal 2024; espera no call center −40% | não detalhado | fraca ✓ |
| **Commonwealth Bank** | relatório anual 2025 (set/2025) | NameCheck usado 110 mi de vezes, > A$ 880 mi em pagamentos errados ou golpes evitados; perdas com golpe −76% desde o pico do fim de 2022 | contagem de eventos | fraca-média ✓ |
| **Commonwealth Bank** | ago/2025 | desfez o corte de 45 vagas de atendimento substituídas por robô de voz, após contestação sindical | — | média ◇ |
| **Evident AI Index** | out/2024 → out/2025 → out/2026 | bancos (de 50) que divulgam ROI de IA no portfólio: 4 → 8 → 12; em 2025, só BNP Paribas, DBS e JPMorgan divulgavam realizado e projetado | contagem de divulgações | média ✓ (2026 via imprensa) |
| **Evident Outcomes Report** | 01/08/2025 | 173 casos de uso novos em 12 meses; 30% com alguma métrica de impacto; eficiência é a métrica mais comum; receita em 16% | contagem | média ✓ |

**Lições.**
1. Nenhum número é auditado. O DBS é o único que declara grupo de controle como método.
2. "Valor" mistura receita, custo evitado e horas. Horas não são caixa até virarem redução de custo ou mais produção.
3. A divulgação cresce (4 → 12 bancos), então a pressão do mercado por ROI de IA medido está subindo. Isso vale
   para qualquer banco listado (ligação com P43).
4. Use esses números como **teto do cenário otimista**, nunca como base.

---

## 5. RAROC, EVA e risco de modelo para investimentos em dados e modelos

### 5.1 O enquadramento financeiro

As fórmulas são as de `docs/sources/fatores-externos-e-propostas.md` §3.1. Para dados e modelos:

```
ΔEVA_t = ΔLucro_t × (1 − IR) − Ke × ΔCapital_t
ΔLucro_t = ΔMargem_t + ΔTarifa_t − ΔPerdaEsperada_t − ΔCustoOperacional_t − Custo_iniciativa_t
RAROC_iniciativa = ΔLucro × (1 − IR) / ΔCapital_econômico      # quando a iniciativa consome ou libera capital
```

- **Modelo de crédito.** Mexe em três linhas: perda esperada (menos inadimplência no mesmo volume), margem (mais
  volume com o mesmo risco) e capital (RWA).
- **O efeito de capital depende da abordagem.** Com abordagem IRB, PD e LGD melhores reduzem RWA. Com abordagem
  padronizada, o RWA quase não muda com o modelo, e o ganho vem de perda esperada (provisão da Res. CMN 4.966) e de
  preço. No Brasil, o risco de crédito usa em geral a abordagem padronizada (RWACPAD) **[média, reg]** ◇. Isso se
  testa no Pilar 3 (tabela OV1), já em `data/ifs/` (R08).
- **Iniciativa de produtividade** (copiloto, automação): sem efeito de capital, exceto o de risco operacional.
  Decisão por VPL a Ke.
- **Ke.** O do §3.3 do documento de fatores externos: Selic esperada (Focus) + prêmio de risco do banco.

### 5.2 Risco de modelo: custo e prazo que entram na conta

| Regra | Data | O que pede | Efeito no ROI | Força |
|---|---|---|---|---|
| **SR 11-7 / OCC 2011-12** (EUA) | 04/04/2011 | inventário, desenvolvimento sólido, validação independente, "desafio efetivo" | custo de validação e prazo maior | forte ✓ |
| **SR 26-2 / OCC 2026-13** (Fed, OCC, FDIC) | **17/04/2026** | substitui SR 11-7 e SR 21-8; abordagem baseada em risco, proporcional ao perfil; definição de modelo mais estreita; modelos de fornecedor seguem cobertos; pedido de informações sobre IA generativa e agêntica anunciado | menos custo para modelos simples; foco nos materiais | forte ✓ |
| **PRA SS1/23** (Reino Unido) | mai/2023, vigente mai/2024 | cinco princípios de gestão de risco de modelo, incluindo IA | idem | forte ◇ |
| **Res. CMN 4.557/2017** (Brasil) | 2017 e alterações | gerenciamento integrado de riscos; trata de risco de modelo de forma breve; validação independente prevista | idem | média ✓ |
| **Res. CMN 4.966/2021** (Brasil) | vigente 2025 | modelos de perda esperada | o modelo de PD/LGD é também modelo contábil | forte ◇ |
| **AI Act da UE** (Reg. 2024/1689) | 2024; alto risco a partir de 2026–27 | avaliação de crédito de pessoa física é IA de **alto risco** (Anexo III) | custo de conformidade para bancos com operação na UE | forte ◇ |

**Na fórmula.** Somar `C_validação` (inicial e periódica) e o atraso de validação (meses até produção) ao VPL. O
atraso empurra todo o fluxo: `VPL_atrasado = VPL / (1+Ke)^(atraso/12)`. Em modelos regulados, isso pode valer mais
que o custo da própria validação. A magnitude é premissa (R12).

---

## 6. Playbook de medição

### 6.1 Como dimensionar (lógica do efeito mínimo detectável)

Para α = 5% bicaudal e poder de 80%, a amostra por braço é:

```
n ≈ 2 × (z_0,975 + z_0,80)² × σ² / δ²  ≈  15,7 × σ² / δ²       # regra de Lehr
proporção: σ² = p(1−p)
com conglomerados (agência, equipe): n × DE,  DE = 1 + (m − 1) × ρ
com covariável pré-período (CUPED; Deng et al., 2013): σ² × (1 − r²)
```

| Caso | Base | Efeito a detectar (δ) | n por braço |
|---|---|---|---|
| inadimplência | 5% | −0,5 p.p. | ~29.800 |
| churn em 12 meses | 10% | −1 p.p. | ~14.100 |
| conversão de oferta | 3% | +0,3 p.p. | ~50.800 |
| cura na cobrança | 40% | +3 p.p. | ~4.200 |
| tempo por tarefa (CV = 1) | — | −10% | ~1.600 tarefas |
| fraude por transação | 0,1% | −20% relativo | ~392.000 |
| efeito de desenho | 500 clientes por agência, ρ = 0,01 | — | DE ≈ 6 (amostra × 6) |

Kohavi, Tang & Xu (2020, *Trustworthy Online Controlled Experiments*) é a referência prática **[forte]** ◇.

### 6.2 A tabela do playbook

| Iniciativa | Métrica primária (R$) | Métricas rápidas | Desenho | Lógica do MDE | Tempo até leitura | Fórmula para `4_retorno_esperado` |
|---|---|---|---|---|---|---|
| **Modelo de risco (concessão)** | perda evitada no mesmo volume, ou volume a mais no mesmo risco | Gini/AUC por safra; atraso 30+ em 3–6 meses | **backtest fora do tempo** (champion × challenger nos mesmos pedidos); depois **holdout** de 5–10% decidido pelo modelo antigo | teste de DeLong para ΔAUC; em R$, a diferença de taxa de maus no mesmo ponto de corte (tabela acima) | backtest: semanas; produção: 6 meses (proxy 30+), 12–18 meses (90+) | `ganho = V × [maus_antigo(c) − maus_novo(c)] × LGD + ΔV × margem_líquida(c)`; `VPL` com decaimento d (§2.4); `ΔCapital` só se IRB |
| **Precificação** | margem líquida de perda por real concedido | aceite; *take-up*; mix de risco dos aceitos | **A/B de preço dentro de faixas aprovadas**; sorteio por cliente; comitê e regra de tratamento justo | elasticidade: n para detectar Δaceite de 0,3–1 p.p.; risco: n da inadimplência | aceite: 4–8 semanas; seleção adversa: 6–12 meses | `ΔΠ = Σ Q(p₁)(p₁ − FTP − c − PE(p₁)) − Q(p₀)(p₀ − FTP − c − PE(p₀))`, com `Q(p) = Q₀(1 + ε Δp/p₀)` e `PE(p)` que pode subir com p (Karlan & Zinman, 2008) |
| **Churn / retenção** | margem preservada | taxa de saída; principalidade | **A/B com holdout**; modelo de **uplift** (T-learner, floresta causal), curva Qini | n para Δchurn de 1 p.p. (~14 mil por braço) | 3–6 meses | `ganho = N_trat × uplift × CLV − N_trat × custo_contato − N_aceitos × incentivo` (mirar uplift, não risco: Ascarza, 2018) |
| **Fraude** | perda evitada − custo de atrito | taxa de detecção; falsos positivos; tempo de bloqueio | **modo sombra** (o desafiante pontua as mesmas transações, sem agir) + **A/B só na regra de atrito** | evento raro: não sortear para detecção; avaliar pareado sobre todas as transações | sombra: 4–8 semanas; chargebacks: 60–120 dias | `ganho = Σ fraude × (TPR_novo − TPR_antigo) × valor − ΔFP × (custo_atendimento + receita_perdida + churn_por_bloqueio × CLV)` |
| **Cobrança / renegociação** | recuperação líquida (VP) | promessa de pagamento; cura em 30/60 dias | **A/B** de abordagem ou de ordem da fila; estratificado por faixa de atraso | ~4 mil por braço para +3 p.p. de cura | 1–3 meses | `ganho = N × Δcura × saldo_médio × (1 − LGD_cura) − custo_ação`; inclui CLV de quem fica |
| **Automação operacional** | custo evitado realizado | tempo de ciclo; taxa de erro; fila | **cunha escalonada** (stepped wedge) por equipe ou praça; antes e depois com controle | conglomerados = equipes: poder vem do número de equipes, não de tarefas | 4–12 semanas | `ganho = volume × Δtempo × custo_hora × r_realização + Δerros × custo_erro − custo_run`; `r_realização` = parcela que vira menos hora extra, menos contratação ou mais volume |
| **Copiloto genAI** | horas liberadas convertidas em custo ou produção | uso semanal; tempo por tarefa; qualidade amostrada por revisor cego | **lista de espera sorteada** (acesso em ondas aleatórias) ou **encorajamento** (convite sorteado; estimar efeito em quem usa por variável instrumental) | tempo por tarefa com CV ≈ 1: ~1.600 tarefas por braço; mas o conglomerado é a pessoa | 6–12 semanas para tempo; 6–12 meses para custo | `ganho = N × a × h × semanas × w × r − licenças − tokens − governança`; `a` adoção, `h` horas **medidas** (não declaradas), `w` custo-hora, `r` realização |
| **Inteligência de mercado** | valor das decisões que mudaram | Brier/erro contra ingênuo e consenso; % de decisões que usaram o produto | **sem A/B**: VOI ex ante + **diário de decisões** pré-registrado + placar de previsões | ≥ 20–30 previsões resolvidas para comparar Brier com algum poder | 6–12 meses | `valor = Σ 1[mudou] × (valor_nova − valor_padrão)`; ex ante, `EVPI` das premissas das grandes decisões (§2.3) |

### 6.3 Exemplo de ponto de virada: copiloto

Premissas ilustrativas, não dados: N = 10 mil pessoas com licença; adoção a = 60% (Cui et al., 2025);
h = 1,5 h/semana **medida** (metade da autodeclarada pelo BBVA); 46 semanas; w = R$ 80/h; licença R$ 150/mês.

- Ganho bruto com r = 0,4: 10.000 × 0,6 × 1,5 × 46 × 80 × 0,4 = **R$ 13,2 mi/ano**.
- Custo de licenças: 10.000 × 150 × 12 = **R$ 18 mi/ano**.
- **Ponto de virada: r\* = 0,54.** Abaixo de 54% de realização, o projeto perde dinheiro.
- Decisões que mudam: licenciar só quem usa (a → 1 no denominador); medir h de verdade; desenhar o que fazer com a
  hora liberada antes de comprar.

### 6.4 O bloco `4_retorno_esperado` padrão

```yaml
4_retorno_esperado:
  tipo_iniciativa: risco|preco|churn|fraude|cobranca|automacao|copiloto|inteligencia
  formula: "ganho_t = f(R..., P...)"        # do playbook §6.2, com cada termo ligado a uma premissa
  premissas_usadas:
    - {id: R02, distribuicao: beta(4,6), estado: hipotese}   # r_realização
    - {id: R07, distribuicao: uniforme(0.10,0.30), estado: hipotese}  # decaimento
  decaimento_anual: d
  custos: {desenvolvimento, validacao, atraso_validacao_meses, operacao, monitoramento, licencas}
  ke: "Selic esperada (Focus) + prêmio"
  capital: "ΔRWA × índice-alvo (só IRB ou risco operacional)"
  saida: {vpl_p10, vpl_p50, vpl_p90, tir, payback_anos, roi, raroc_se_produto, prob_vpl_negativo}
  ponto_de_virada: {premissa: R02, valor: 0.54}
  medicao_ligada: "8_medicao.desenho"      # a mesma métrica que o experimento vai ler
```

---

## 7. Como as estimativas se atualizam

O §6 de `05-panoramas.md` pede que cada premissa mude de estado e que o retorno seja recalculado. O mecanismo:

1. **Cada premissa é uma distribuição, não um número.** Base, pessimista e otimista viram, por exemplo, uma
   triangular ou uma beta (proporções) ou uma normal (efeitos).
2. **A priori vem da evidência rigorosa.** Números autodeclarados entram só como limite do otimista. Motivo: METR e
   Humlum mostram que a autodeclaração exagera.
3. **O retorno sai por Monte Carlo.** 10 mil sorteios das premissas, aplicados à fórmula, dão P10, P50, P90 do VPL e
   a probabilidade de VPL negativo.
4. **Quando chega um teste, a premissa é atualizada.** Para um efeito com a priori normal:

```
média_post = (μ₀/σ₀² + x/σₓ²) / (1/σ₀² + 1/σₓ²)
dp_post    = (1/σ₀² + 1/σₓ²)^(−1/2)
```

   Exemplo: a priori de ganho de produtividade 14% ± 7% (literatura); o piloto mede 6% ± 3%. A posteriori:
   **7,2% ± 2,8%**. O intervalo do VPL encolhe e se desloca para baixo. Para proporções, usar beta-binomial:
   `beta(α + sucessos, β + fracassos)`.
5. **Estados.** hipótese (só a priori) → apoiada (um teste a favor, intervalo ainda largo) → confirmada (o intervalo
   a posteriori exclui o ponto de virada) → refutada (o intervalo fica do lado errado do ponto de virada). A regra
   usa o ponto de virada que a proposta já registra.
6. **Qual premissa testar primeiro.** A de maior **valor esperado da informação parcial** (EVPPI): a que, se
   conhecida, mais mudaria a decisão. Na prática, o tornado da §5 da proposta mostra as candidatas, e o custo do
   teste desempata.
7. **De fora para dentro.** Com dado público, a priori e testes são substitutos (participação, inadimplência
   regional). Dentro do banco, a mesma estrutura recebe o experimento real, e o retorno passa de estimado a medido.

---

## 8. Premissas testáveis (R01–R13)

Formato igual ao de `01-premissas.md`: enunciado, evidência hoje, como testar, confirma se, refuta se, decisão.
Os limiares são propostas para pré-registro.

### R01 O ganho de tempo de copilotos em trabalho bancário de escritório fica entre 5% e 15%
- **Hoje.** 26% em código (Cui et al., 2025) e 14–15% em atendimento (Brynjolfsson et al.) **[forte]**; 2,8% das
  horas na média de ocupações (Humlum, 2025) **[forte]**; BBVA 2,8 h/semana ≈ 7% (autodeclarado) **[fraca]**.
- **Teste.** Lista de espera sorteada, tempo por tarefa medido em log, qualidade por revisor cego.
- **Confirma se** o ganho medido fica entre 5% e 15%. **Refuta se** > 20% ou < 3%.
- **Decisão.** Confirmada → dimensionar licenças e metas por esse intervalo. Refutada para cima → acelerar.

### R02 Menos da metade das horas liberadas vira caixa sem redesenho do processo
- **Hoje.** Efeito nulo em salário e horas (Humlum, 2025) **[forte]**; high performers redesenham fluxos quase 3×
  mais (McKinsey, 2025) **[fraca]**; JPMorgan: economia "não está num VPL" (fev/2026) **[fraca]**.
- **Teste.** Em cunha escalonada, medir custo por unidade produzida (não horas) nas equipes tratadas e de controle.
- **Confirma se** a realização r < 0,5 sem redesenho e > 0,5 com redesenho. **Refuta se** r > 0,5 sem redesenho.
- **Decisão.** Confirmada → toda proposta de produtividade precisa de plano de realocação, ou não é aprovada.

### R03 Números de ROI de IA divulgados por bancos não servem de base para proposta
- **Hoje.** 8 de 50 bancos divulgavam ROI em 2025 e 12 em 2026; só o DBS declara grupo de controle (§4)
  **[média]**.
- **Teste (público).** Para cada divulgação no Evident e nos relatórios anuais, codificar: há método? há
  contrafactual? há auditoria? Repetir anualmente.
- **Confirma se** < 25% das divulgações trazem contrafactual. **Refuta se** > 50%.
- **Decisão.** Confirmada → esses números só entram como limite do cenário otimista (§7, passo 2).

### R04 Bancos que mais divulgam IA melhoram a eficiência em relação aos pares em 2–3 anos (liga P43)
- **Hoje.** Hipótese. DBS e JPMorgan citam ganhos, mas o índice de eficiência depende de juros e mix.
- **Teste (público).** Diferenças em diferenças: custo/receita de JPMorgan, DBS, BBVA, CBA contra pares do mesmo país,
  2018–2026; tratamento = ano da primeira divulgação de valor; controles de margem financeira.
- **Confirma se** a melhora relativa ≥ 2 p.p. em 3 anos, com placebo limpo. **Refuta se** ≈ 0.
- **Decisão.** Confirmada → metas de eficiência atreladas a casos de uso (P43). Refutada → investir com cautela.

### R05 Dado alternativo soma 1–5 p.p. de AUC ao score tradicional, e o valor está no complemento
- **Hoje.** Berg et al. (2020): +1,3 p.p. sozinho contra o bureau e +5,3 p.p. combinado **[forte]**.
- **Teste.** Público: reproduzir a ablação em bases abertas de crédito (validade externa fraca). Interno: ablação
  por fonte com backtest fora do tempo.
- **Confirma se** ΔAUC combinado ≥ 1 p.p. com IC que exclui zero. **Refuta se** < 0,5 p.p.
- **Decisão.** Confirmada → comprar ou integrar a fonte, se `V × Δmaus × LGD` paga o custo. Refutada → não.

### R06 Mirar retenção por uplift rende mais por real que mirar por risco de churn
- **Hoje.** Ascarza (2018), dois experimentos de campo **[forte]**.
- **Teste.** Três braços: aleatório, maior risco, maior uplift; mesmo orçamento.
- **Confirma se** o braço uplift preserva ≥ 20% mais margem que o braço risco. **Refuta se** empata.
- **Decisão.** Confirmada → todo modelo de retenção é treinado para uplift, com holdout permanente.

### R07 Sem recalibração, um modelo de crédito perde 10–30% do ganho por ano
- **Hoje.** Hipótese. Choques derrubam modelos (BoE, 2020: 35% dos bancos) **[média]**.
- **Teste.** Público: Gini por safra em bases abertas, fora do tempo. Interno: Gini por safra dos modelos em
  produção.
- **Confirma se** a queda anual do ganho fica em 10–30%. **Refuta se** < 5%.
- **Decisão.** Define `d` no VPL e a frequência de recalibração.

### R08 No Brasil, o ganho de um modelo de crédito entra por perda esperada e preço, quase nada por RWA
- **Hoje.** Abordagem padronizada predominante **[média]** ◇.
- **Teste (público, já possível).** Pilar 3 do banco, tabela OV1: parcela do RWA de crédito calculada por modelo
  interno (IRB), 2020–2026, em `data/ifs/`.
- **Confirma se** a parcela IRB < 10% do RWA de crédito. **Refuta se** > 30%.
- **Decisão.** Confirmada → tirar `ΔCapital` das fórmulas de modelos de crédito e não prometer capital (liga P45).

### R09 A área de inteligência de mercado se paga só se muda ao menos uma grande decisão por ano
- **Hoje.** Hipótese, pela lógica do VOI (§2.3).
- **Teste.** Diário de decisões por 12 meses: decisões com valor em jogo > R$ X, se mudaram e por quê.
- **Confirma se** ≥ 1 decisão mudada com Δvalor > custo anual da área. **Refuta se** nenhuma.
- **Decisão.** Confirmada → manter e ligar a área às decisões de capital. Refutada → reduzir ou reorientar.

### R10 Os nowcasts da camada pública batem o ingênuo em ≥ 10%
- **Hoje.** Hipótese (`docs/sources/fatores-externos-e-propostas.md` §2.3).
- **Teste (público).** Inadimplência rural por UF, origem móvel, 2018–2026; erro contra passeio aleatório e contra
  sazonal ingênuo.
- **Confirma se** o erro cai ≥ 10% com teste de Diebold-Mariano significativo. **Refuta se** < 3%.
- **Decisão.** Confirmada → o nowcast vira produto com valor de informação. Refutada → não vender como previsão.

### R11 O varejo de um banco grande tem volume para ler A/B de conversão em 4–8 semanas
- **Hoje.** Pela §6.1, detectar +0,3 p.p. sobre 3% pede ~51 mil clientes por braço.
- **Teste (público).** Base de clientes ativos e taxa de contato digital nos releases; calcular o MDE por semana.
- **Confirma se** 100 mil clientes elegíveis por mês por produto. **Refuta se** < 30 mil.
- **Decisão.** Confirmada → experimentação contínua como padrão (como o DBS diz fazer).

### R12 Validação e governança somam 20–40% ao custo e 3–6 meses ao prazo de um modelo regulado
- **Hoje.** Hipótese. SR 26-2 (abr/2026) tende a reduzir para modelos de baixo risco **[forte]** quanto à norma.
- **Teste.** Interno: tempo e custo por modelo, do fim do desenvolvimento à produção, por nível de risco.
- **Confirma se** dentro da faixa. **Refuta se** < 10% e < 1 mês.
- **Decisão.** Confirmada → incluir `atraso_validacao_meses` em todo VPL e criar via rápida para modelos simples.

### R13 O ganho percebido supera o medido em ≥ 1,5×
- **Hoje.** METR: −19% medido contra +20% percebido **[forte]**; Humlum: 2,8% declarado e efeito nulo em horas
  **[forte]**.
- **Teste.** Em todo piloto, coletar autodeclaração e medida no mesmo grupo.
- **Confirma se** razão percebido/medido ≥ 1,5. **Refuta se** ≈ 1.
- **Decisão.** Confirmada → proibir autodeclaração como métrica primária.

---

## 9. Limites

- Os estudos fortes são de código, atendimento, escrita e consultoria. Faltam experimentos publicados dentro de
  bancos com resultado financeiro.
- Os números de bancos são autodeclarados e mudam de definição de um ano para outro.
- As fórmulas do playbook são padrão de mercado. As faixas numéricas são **premissas** até serem medidas.
- O experimento real (sorteio, controle) só existe dentro do banco (`04-proximos-passos.md` §2).

## Referências

Acadêmicas: Ascarza (2018) *JMR* 55(1); Benaroch & Kauffman (1999) *ISR* 10(1); Berg, Burg, Gombović & Puri (2020)
*RFS* 33(7); Bertrand et al. (2010) *QJE* 125(1); Brynjolfsson, Hitt & Kim (2011) SSRN 1819486; Brynjolfsson &
McElheran (2016) *AER P&P* 106(5); Brynjolfsson, Li & Raymond (2023) NBER 31161 / *QJE* 140(2) 2025
(https://www.nber.org/papers/w31161); Brynjolfsson, Rock & Syverson (2021) *AEJ: Macro* 13(1); Cui et al. (2025)
*Management Science*, doi 10.1287/mnsc.2025.00535; Dell'Acqua et al. (2023) HBS WP 24-013; Deng et al. (2013)
WSDM (CUPED); Dixit & Pindyck (1994); Fleckenstein et al. (2023) *HDSR*; Fuster et al. (2022) *JF* 77(1);
Ghorbani & Zou (2019) ICML; Gordon et al. (2019) *Marketing Science* 38(2); Howard (1966) *IEEE TSSC* 2(1);
Humlum & Vestergaard (2025) NBER 33777 (https://www.nber.org/papers/w33777); Karlan & Zinman (2008) *AER* 98(3);
Kohavi, Tang & Xu (2020); METR (2025) arXiv 2507.09089 (https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/);
Moody & Walsh (1999) ECIS; Noy & Zhang (2023) *Science* 381; Peng et al. (2023) arXiv 2302.06590; Acemoglu (2024)
NBER 32487.

Reguladores e normas: Fed SR 26-2 (17/04/2026) https://www.federalreserve.gov/supervisionreg/srletters/sr2602.htm;
OCC Bulletin 2026-13 https://www.occ.gov/news-issuances/bulletins/2026/bulletin-2026-13.html; SR 11-7 (04/04/2011);
PRA SS1/23; ISO 55013:2024 https://www.iso.org/standard/82455.html; IFRS/IAS 38; China MOF (ago/2023), resumo à
IFRS Foundation https://www.ifrs.org/content/dam/ifrs/meetings/2024/may/eeg/ap6-accounting-of-enterprise-data-resources.pdf;
SNA 2025 https://unstats.un.org/unsd/nationalaccount/sna2025.asp; Bank of England QB 2020 Q4; Reg. (UE) 2024/1689.

Bancos (autodeclarado): DBS Annual Report 2024 e 2025 (https://www.dbs.com/annualreports/2025/cio-statement.html);
JPMorgan Investor Day mai/2025 e Company Update fev/2026 (https://www.jpmorganchase.com/ir); Fortune 08/10/2025
(https://fortune.com/2025/10/08/jamie-dimon-head-in-the-sand-ai-will-take-jobs-tip-iceberg/); BBVA
(https://www.bbva.com/en/innovation/bbva-expands-its-agreement-with-openai-to-11000-chatgpt-licences-for-the-banks-employees/);
OpenAI (https://openai.com/index/bbva-collaboration-expansion/); CBA nov/2024
(https://www.commbank.com.au/articles/newsroom/2024/11/reimagining-banking-nov24.html) e Annual Review 2025;
Evident Outcomes Report (01/08/2025) https://evidentinsights.com/insights/outcomes-report/.

Consultorias: McKinsey State of AI 2025 e 2026 (https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai);
BCG (set/2025) https://media-publications.bcg.com/The-Widening-AI-Value-Gap-October-2025.pdf; BCG (30/09/2026);
MIT NANDA (2025); Gartner (29/07/2024; 25/06/2025); MGI (jun/2023); Stanford AI Index 2025.
