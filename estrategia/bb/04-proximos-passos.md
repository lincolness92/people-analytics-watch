# Das premissas às propostas: sequência e primeiras análises (v0)

Rascunho de **28/11/2026**. Diz em que ordem sair do registro de premissas ([`01-premissas.md`](01-premissas.md))
e chegar a propostas com premissas, cenários, custos, retorno, prazo e medição, e quais são as cinco primeiras
análises a rodar quando as séries de participação de mercado estiverem prontas em `data/ifs/`.

## 1. A sequência

| Passo | O que se faz | Entrada | Saída | Quem decide |
|---|---|---|---|---|
| **0. Validar a base** | A camada de dados refaz os números preliminares [IFD] e [EST] e trata as ressalvas do Anexo 1 de `00-mapa.md` | `data/ifs/shares/`, `data/ifs/estban/` | Tabelas validadas; lista do que mudou em relação à v0 | Engenharia e revisão humana |
| **1. Conferir os fatos na fonte primária** | Ler o release do 3T26 e os fatos relevantes de 2026 do BB no CVM IPE; substituir cada [I-nn] por fonte primária quando houver | `data/ifs/ipe/`, RI | Dossiê de fatos numerados (R0 do conselho) | Pessoa (H1) |
| **2. Conselho, rodada 1** | Geração independente, crítica cega, réplica, juízes, agregação ([`03-conselho.md`](03-conselho.md)) | Dossiê e registro v0 | Registro v1; desacordos abertos; prioridade de teste | Pessoa (H2) |
| **3. Pré-registro** | Para cada premissa escolhida: métrica, período, comparação e limiares escritos antes de olhar o resultado | Registro v1 | Arquivo de pré-registro com data | Pessoa (H2) |
| **4. As cinco análises** (seção 4) | Rodar com a camada de dados | `data/ifs/` e fontes mapeadas | Tabelas de resultado e gráficos | — |
| **5. Fontes que faltam** | Coletar o que as premissas de maior valor ainda pedem (seção 5) | `docs/sources/*.json` | Novas tabelas | Engenharia |
| **6. Leitura e veredito** | R6 do conselho; cada premissa testada vira confirmada, refutada ou inconclusiva | Resultados e pré-registro | Registro v2, com o estado de cada premissa | Pessoa (H3) |
| **7. Propostas** | Só para premissas confirmadas. Uma proposta por decisão, no modelo da seção 2 | Registro v2 | Propostas `prop-2026-NN` | Pessoa (H4) |
| **8. Red team das propostas** | O conselho ataca cada proposta: premissa frágil, custo esquecido, canibalização, risco regulatório | Propostas | Propostas revistas, com o ponto de virada de cada premissa | Pessoa |
| **9. Plano de medição** | Desenho da medição de cada proposta e os substitutos públicos que permitem acompanhar de fora | Propostas | Painel de acompanhamento | — |

Duas regras valem em todos os passos:

- **Uma premissa só sobe de estado com dado.** O estado segue as quatro condições de
  `docs/sources/fatores-externos-e-propostas.md` §2.6: fonte primária citada, estimativa com intervalo de confiança,
  placebo aprovado e registro feito antes de ver o resultado fora da amostra.
- **O limite do dado público fica escrito.** Não há inadimplência por banco e município em fonte pública (mesmo
  documento, §5). Onde uma proposta depender disso, o que se entrega é a estimativa (exposição × inadimplência
  regional), com o aviso de que só o dado interno fecha a conta.

## 2. O modelo de proposta

É o de `docs/sources/fatores-externos-e-propostas.md` §4.1, com três campos a mais, marcados com `# novo`.

```yaml
id: prop-AAAA-NN
titulo: ...
dono: área/pessoa; patrocinador
premissas_do_registro: [P02, P03]   # novo: quais premissas sustentam a proposta e o estado de cada uma
desacordos_abertos: [D-004]         # novo: desacordos do conselho que a proposta carrega como cenários
1_motivacao:          # o problema, em números (com fonte e data)
2_racional:           # a cadeia fator → métrica, com fontes (papers, normas, dados, fatos relevantes)
  evidencias: [ {afirmacao, fonte, método, força: forte|média|fraca} ]
3_premissas:          # cada uma com valor base, faixa, fonte e "como saberemos se é verdade"
  - {id: P1, descricao, base, pessimista, otimista, fonte, teste}
4_retorno_esperado:   # derivado das premissas por fórmula explícita (não um número solto)
  formula: ganho = f(P1..Pn)
  vpl, tir, payback, roi, raroc (se produto), ke usado
  capital: rwa consumido ou liberado   # novo: por causa da premissa P45
5_sensibilidade:      # tornado, cenários, ponto de virada de cada premissa
  se_P1_falsa: o que muda na decisão
6_custos:             # capex, opex, custo de oportunidade (margem perdida, capital), custo de mudança
7_tempo_ate_retorno:  # quando aparece o primeiro real; quando a métrica primária fica legível
8_medicao:            # desenho (A/B, holdout, diferenças em diferenças), métricas, amostra, duração, critério de parada
9_riscos:             # modelo, regulatório (MCR, 4.966, tratamento justo), reputacional, execução, dados
10_decisao:           # etapa 1 (piloto) com gatilho para a etapa 2 (escala) ou para o abandono
```

Regras do modelo, mantidas do documento original:

- cada número vem com fonte ou com o rótulo **premissa**;
- o retorno sai das premissas por fórmula que se pode recalcular;
- para cada premissa, registra-se o valor em que a decisão muda.

Para decisões de crédito, o conjunto de métodos é o do §3.3 do mesmo documento: preço por risco com custo de
funding casado e decisão por RAROC acima do custo de capital; VPL em três cenários para projetos; opção real
(piloto, gatilho, escala) quando a incerteza é alta; medição por grupo de controle.

**O que este plano entrega e o que não entrega na medição.** Feito de fora, com dado público, o plano desenha a
medição (item 8) e acompanha substitutos públicos: participação por município, inadimplência regional do sistema,
taxas médias por instituição. O experimento em si (sorteio, grupo de controle) só existe dentro do banco. A
plataforma nasce preparada para essa troca (`VISION.md`, princípio 8).

## 3. Propostas candidatas (todas condicionais)

Nenhuma é recomendação. Cada linha diz de quais premissas a proposta depende e o que a derruba.

| Candidata | Depende de | Só faz sentido se | Cai se |
|---|---|---|---|
| **A. Monitor de risco de safra** para agir antes do vencimento (exemplo 4.3 do documento de fatores externos) | P03, P09, P10 | O escore público discrimina a inadimplência regional fora da amostra | P09 refutada |
| **B. Preço por risco climático** na parcela de taxa livre (exemplo 4.4) | P09, P06, P08 | Há diferença de risco grande e previsível entre regiões, e o seguro reduz a perda | P09 ou P08 refutadas |
| **C. Política de crédito rural com mecanismos de cooperativa** (limite por produtor, garantia, gerente local) | P02, P13, P42 | A vantagem das cooperativas é de modelo | P02 refutada (é mix) |
| **D. Originar para distribuir no agro** (securitização, fundos, CPR registrada) | P05, P45, P47, P51 | O melhor risco já saiu do balanço bancário e o capital é restrição | P05 e P45 refutadas |
| **E. Defesa e ataque no consignado** sob portabilidade | P15, P27, P36 | A portabilidade move participação | P15 refutada |
| **F. Mapa de prioridade municipal** (defender, ocupar, enxugar) | P26, P13, P30, P41 | A presença única protege depósitos e a cooperativa os tira | P26 refutada |
| **G. Plano de funding** (depósitos de prefeituras e do agro, LCA, depósitos judiciais) | P22, P06, P23, P24 | O custo relativo de captação subiu | P22 refutada |
| **H. Imobiliário para servidores** | P18, P45 | Há funding compatível e capital | P45 confirmada com folga mínima |
| **I. Pacote do produtor além do crédito** (seguro, consórcio, câmbio, investimentos) | P12, P31, P38, P40 | A fatia nesses serviços é bem menor que a do crédito | P12 refutada |
| **J. Orçamento de capital por mercado** | P04, P45 | O capital é a restrição ativa | P45 refutada |

## 4. As cinco primeiras análises com os dados de participação

Todas usam as séries de `data/ifs/shares/`. Cada uma traz a regra de leitura, que deve ser fixada no pré-registro.

### Análise 1. Quem ficou com cada ponto percentual que o BB perdeu
- **Pergunta.** Em cada produto, para quem foi a participação perdida, quando e em que região?
- **Premissas.** P01, P13, P14, P15, P30 (e alimenta P07, P50).
- **Dados.** IF.data, crédito por modalidade (PF e PJ) e por região, trimestral, de 03/2014 a 09/2026, por
  instituição, com os sistemas cooperativos agregados e a ponte de perímetro de 2025.
- **Método.** (a) Matriz de variação de participação por instituição e produto, em três janelas: 2014–2019,
  2019–2023, 2023–2026. (b) Decomposição da variação do BB em efeito de mix (o BB estava nos produtos e regiões
  que cresceram menos) e efeito competitivo (perdeu dentro de cada célula). (c) Teste de quebra estrutural na
  série do rural PF.
- **Saída.** Uma tabela "o BB perdeu X p.p.; Y foram para as cooperativas, Z para os digitais…" por produto, e um
  gráfico de série por produto.
- **Leitura.** P01 confirmada se a queda no rural PF for significativa antes de 12/2023. O efeito competitivo
  acima de 70% da perda total indica problema de competição e não de composição.
- **Esforço.** 2 dias depois da base validada.

### Análise 2. Inadimplência rural ajustada ao mix: BB, cooperativas, Caixa e sistema
- **Pergunta.** A diferença de atraso entre o BB e as cooperativas sobrevive ao controle de região, porte e
  programa?
- **Premissas.** P02, P03, P07, P42.
- **Dados.** IF.data (vencidos por modalidade, instituição e região); SCR.data (inadimplência por UF × modalidade ×
  porte × origem de recursos); SICOR (mix por programa, finalidade e cultura); ESTBAN (exposição por município).
- **Método.** (a) Série de vencidos no rural por instituição, 2014–2026, com marca da quebra de 2025.
  (b) Inadimplência esperada de cada instituição dado o seu mix regional e de programa, usando as taxas do
  sistema por célula; o resíduo é o que o mix não explica. (c) Curva de concentração do aumento de provisões do
  BB por município (ESTBAN, verbete 174).
- **Saída.** Resíduo de inadimplência por instituição, com intervalo; mapa da concentração.
- **Leitura.** P02 confirmada se o resíduo do BB menos o das cooperativas for de pelo menos 2 p.p. P03 confirmada
  se 15% dos municípios explicarem 60% do aumento.
- **Ressalva.** O IF.data dá vencidos acima de 15 dias, não acima de 90. A regra de baixa a prejuízo mudou em 2025.
- **Esforço.** 4 dias (SCR.data e SICOR ainda precisam de coletor).

### Análise 3. Mapa municipal de contestabilidade
- **Pergunta.** Onde o BB está sozinho, onde divide com cooperativa e o que acontece com seus depósitos e seu
  crédito quando um banco sai ou uma cooperativa chega?
- **Premissas.** P26, P13, P27, P30.
- **Dados.** ESTBAN por município e por agência, mensal, 2014–2026; cadastro de agências e postos do BCB (datas de
  abertura e fechamento); pontos de atendimento de cooperativas (Unicad, BcBase); IBGE (população e PIB municipal).
- **Método.** (a) Classificar cada município e mês em: só BB; BB e outros bancos; BB e cooperativa; sem BB.
  (b) Diferenças em diferenças com tratamento escalonado para dois eventos: saída de banco privado e entrada de
  cooperativa. (c) Participação do BB em depósitos e crédito por classe de município.
- **Saída.** Mapa com as quatro classes; efeito médio de cada evento em 12, 24 e 36 meses.
- **Leitura.** P26 confirmada se a entrada de cooperativa reduzir os depósitos do BB no município em mais de 10% em
  3 anos e a saída de um concorrente os elevar.
- **Ressalvas.** O ESTBAN não cobre cooperativas; a entrada delas vem de outro cadastro. Os valores absolutos de
  06/2026 precisam de validação. Grandes clientes contratam em outra praça.
- **Esforço.** 5 dias.

### Análise 4. O passivo: participação por instrumento e custo implícito de captação
- **Pergunta.** A perda de participação nos depósitos baratos já encareceu o funding do BB frente aos pares?
- **Premissas.** P22, P06, P24, P25.
- **Dados.** IF.data (Passivo e Demonstração de Resultado), semestral, 2014–2026; balancetes Cosif para o
  detalhe das despesas de captação; SGS 432 (Selic) e CDI.
- **Método.** (a) Participação do BB por instrumento, com os sistemas cooperativos sem dupla contagem.
  (b) Custo implícito = despesa de captação ÷ saldo médio, em % do CDI, por instituição. (c) Diferencial BB menos
  média dos pares, ao longo do tempo. (d) Captação líquida do BB em torno de eventos de estresse de outros bancos.
- **Saída.** Série do diferencial de custo; decomposição entre mix de instrumentos e preço por instrumento.
- **Leitura.** P22 confirmada se o diferencial piorar pelo menos 3 p.p. do CDI em 5 anos.
- **Ressalva.** A Cosif de 2025 mudou as contas de resultado; exige ponte.
- **Esforço.** 3 dias.

### Análise 5. Varejo PF: preço, volume e risco
- **Pergunta.** Quem ganhou participação no crédito pessoal, no cartão e no consignado ganhou com que preço e com
  que inadimplência? O que a portabilidade mudou?
- **Premissas.** P14, P15, P16, P17.
- **Dados.** IF.data (saldo, vencidos e número de clientes por instituição e modalidade); taxas de juros por
  instituição e modalidade (BCB, `taxaJuros/v2`), mensal; datas da portabilidade (fev/2026 para o crédito pessoal;
  consignado quando começar).
- **Método.** (a) Para cada instituição e modalidade: taxa média, vencidos e crescimento; margem ajustada ao risco
  aproximada. (b) Antes e depois da portabilidade do crédito pessoal, com o cartão como controle. (c) Tíquete médio
  por cliente.
- **Saída.** Um gráfico de dispersão por modalidade (crescimento × margem ajustada ao risco) e o efeito estimado
  da portabilidade.
- **Leitura.** P14 confirmada se a margem ajustada ao risco dos digitais for igual ou maior que a do BB. O efeito
  medido no crédito pessoal é a melhor previsão disponível para P15.
- **Ressalva.** A perda presumida é hipótese; apresentar com faixa.
- **Esforço.** 3 dias.

### Logo depois (dependem de outras fontes)
6. **ROE sem o agro, reconstruído** (P04, P45, P47): Pilar 3 em `data/ifs/pillar3/`, releases e nota de segmentos.
7. **Backtest do escore climático** (P09, P10, P48): painel UF × mês do documento de fatores externos, fase 2.
8. **Estudo de evento de todos os fatos relevantes do BB, 2019–2026** (P55, P28): `data/ifs/ipe/` e B3.

## 5. O que as análises pedem da camada de dados

Campos mínimos das séries de participação (os nomes são sugestão; o dicionário oficial é `docs/ifs-dados.md`):

| Campo | Para quê |
|---|---|
| `data_base`, `instituicao` (código IF.data e CNPJ-base), `grupo` (sistema cooperativo, quando houver) | Chave |
| `perimetro` (financeiro, prudencial, individual) e `ponte_2025` (sim ou não) | Não comparar perímetros diferentes sem aviso |
| `produto` (vocabulário de modalidades do IF.data), `pessoa` (PF ou PJ) | Análises 1, 2 e 5 |
| `regiao` e, no ESTBAN, `uf` e `municipio` (código IBGE) | Análises 1 e 3 |
| `saldo`, `vencido_15d`, `n_clientes`, `n_operacoes` | Participação, atraso e tíquete |
| `total_sistema` e `metodo_total` (soma das instituições ou série oficial do SGS) | O denominador muda a participação |
| Passivo: `instrumento`, `saldo`; resultado: `despesa_captacao` | Análise 4 |
| `fonte`, `arquivo`, `baixado_em` | Proveniência em toda linha |

Testes de aceite que proponho para a base, tirados dos tropeços do cálculo preliminar:

1. A soma das participações por produto e data-base fecha em 100%.
2. O total de cada produto não salta mais de 15% entre trimestres seguidos sem explicação (pega a anomalia de
   12/2024 em PJ).
3. O saldo do BB no ESTBAN, somado por município, bate com o do IF.data dentro de 5% (pega os valores dobrados
   de 06/2026).
4. A série do rural PF do IF.data é reconciliada com a SGS 20609, e a diferença fica documentada.
5. A participação do Nubank e do Mercado Pago em cartão é contínua na virada de 12/2024 para 03/2025 (pega a
   mudança de perímetro).
6. Sicredi e Sicoob aparecem como sistema e sem dupla contagem no passivo.

Fontes a coletar em seguida, por valor para as premissas marcadas como "top 10": **SICOR** e **SCR.data** (P01, P02,
P03); **taxas de juros por instituição** (P14, P15); **pontos de atendimento de cooperativas** (P26); **Pilar 3 do
BB** (P04, P45). Fontes novas, ainda não mapeadas em `docs/sources/`: estatísticas de portabilidade e de pagamentos
de varejo do BCB, dados de consórcios, CADPREV, PNCP, painéis do Open Finance, operações indiretas do BNDES e
equalização paga pelo Tesouro.

## 6. Riscos deste processo

| Risco | Como aparece | Proteção |
|---|---|---|
| **Olhar o dado e depois ajustar o limiar** | "Confirma se" muda depois do resultado | Pré-registro com data (passo 3) |
| **Correlação lida como causa** | "As cooperativas têm menos atraso, logo o modelo delas é melhor" | Desenho causal explícito e placebo (§2.4 do documento de fatores externos) |
| **Perímetros misturados** | Comparar carteira ampliada do release com carteira classificada do IF.data | Campo `perimetro` em toda série |
| **Quebras de 2025** | Res. 4.966 e Cosif nova confundidas com mudança real | Ponte de série e variável de regime |
| **Número de imprensa tratado como fato** | Um veículo repete o outro | Passo 1: fonte primária |
| **Conselho benevolente** | Notas altas para texto bem escrito | Calibração dos juízes com avaliação humana |
| **Plano feito de fora** | Falta o dado interno que decide | Dizer onde o dado público acaba e desenhar a proposta como piloto com gatilho |
| **Viés do primeiro rascunho** | A v0 ancora todas as leituras seguintes | Braço "do zero" na rodada R1 do conselho |

## 7. Ordem sugerida de trabalho

| Semana | Entregas |
|---|---|
| 1 | Passo 0 (base validada) e passo 1 (fatos na fonte primária). Análise 1 |
| 2 | Conselho, rodada 1. Pré-registro. Análises 4 e 5 |
| 3 | Coletores de SICOR e SCR.data. Análise 2. Início da análise 3 |
| 4 | Análise 3. Análise 6 (ROE sem o agro). Leitura dos resultados (R6) e vereditos |
| 5 | Primeiras propostas (as que tiverem todas as premissas confirmadas). Red team das propostas |

A ordem é uma sugestão e depende do ritmo da camada de dados e das decisões humanas H0 a H4.
