# Plano de guerra do Banco do Brasil: mapa de perguntas (v0)

Rascunho de **28/11/2026**. É a moldura de um plano estratégico para o Banco do Brasil (BB) feito **só com
informação pública**, em que cada afirmação se apoia em uma premissa testável. Este arquivo é a árvore de
perguntas. Os outros quatro são: o registro de premissas ([`01-premissas.md`](01-premissas.md)), o mapa de
concorrentes ([`02-concorrentes.md`](02-concorrentes.md)), o protocolo do conselho de modelos
([`03-conselho.md`](03-conselho.md)) e a sequência até as propostas ([`04-proximos-passos.md`](04-proximos-passos.md)).

## Regras deste trabalho

1. **Só informação pública**: releases de resultados, CVM (IPE, DFP/ITR, FRE), dados do Banco Central (IF.data,
   ESTBAN, SGS, SCR.data, SICOR, DASFN), imprensa, papers e relatórios setoriais. Nada interno do BB e nenhuma
   alegação de conhecimento privilegiado.
2. **Toda afirmação factual traz fonte e data.** O que não tem fonte está marcado como **[H]** (hipótese a testar).
3. **Números primeiro.** Onde o número ainda não existe, a premissa diz qual série o produz.
4. **Nada aqui é recomendação.** As propostas só nascem depois dos testes (ver `04-proximos-passos.md`).

### Legenda das fontes

| Marca | O que é | Confiança hoje |
|---|---|---|
| **[IFD]** | Cálculo preliminar meu, de 28/11/2026, sobre os arquivos JSON públicos do IF.data (BCB): relatórios de crédito por modalidade e por região, Resumo e Passivo, datas-base 12/2019, 12/2021 a 12/2025 e 06/2026. Método e ressalvas no Anexo 1 | **Média.** Precisa ser refeito pela camada de dados (`data/ifs/`) antes de sustentar decisão |
| **[EST]** | Cálculo preliminar meu sobre o ESTBAN por município (BCB), 12/2022 e 06/2026 | Média para contagens e participações; **baixa para valores absolutos** (Anexo 1) |
| **[FE]** | `docs/sources/fatores-externos-e-propostas.md` (28/11/2026), que leu SGS, CVM IPE, ONI, CEPEA e LSPA | Alta para as séries citadas com código |
| **[FI]** | `docs/sources/financas-instituicoes.md` (28/11/2026) | Alta |
| **[I-nn]** | Imprensa e relatórios, lidos **por resumo de busca** em 28/11/2026 (lista no Anexo 2) | **Média-baixa.** Conferir no release ou no fato relevante (CVM IPE) antes de usar |
| **[M]** | Estrutura societária conhecida até 2025 (memória do autor) | Baixa. Confirmar no Formulário de Referência (CVM FRE) |
| **[H]** | Hipótese ainda sem evidência | — |

---

## 0. Ponto de partida: o que os dados públicos dizem hoje

| # | Fato | Fonte e data |
|---|---|---|
| 1 | Lucro líquido ajustado do BB no 3T26: cerca de R$ 1,3 bi (−66,5% em um ano). ROE de 2,8% (8,4% no 3T25) | [I-01], [I-02], nov/2026 |
| 2 | Pares no 3T26: Itaú ROE 23,6% (lucro R$ 12,6 bi); Bradesco 15,6% a 16,1% (R$ 7,1 bi); Santander 11,9% (R$ 2,9 bi); Nubank 32% (US$ 1,09 bi) | [I-05], [I-06], [I-07], nov/2026 |
| 3 | Projeções do BB para 2026, revistas em 11/11/2026: custo do crédito de R$ 65–70 bi para **R$ 80–83 bi**; lucro ajustado de R$ 18–22 bi para **R$ 9–11 bi**. Motivo citado: inadimplência do agro e renegociações da MP 1.376/2026 abaixo do esperado | [FE] §0 (fato relevante no CVM IPE) |
| 4 | Inadimplência acima de 90 dias do BB em set/2026: 6,08% no total (4,51% um ano antes) e **6,92% no agro** (4,84%). Carteira agro de R$ 403,6 bi (−4,3% no trimestre) | [I-01], [I-02] |
| 5 | Capital principal de 10,80% em set/2026 (11,16% um ano antes); Basileia de 13,45% (14,81%). Payout reduzido ao mínimo de 25% | [I-01], [I-03] |
| 6 | Inadimplência do crédito rural PF no sistema: 0,80% (out/2022) → **9,59%** (out/2026); 17,21% na parcela com taxas de mercado. Saldo de R$ 550,5 bi | [FE] §0 (SGS 21148, 21146, 20609) |
| 7 | Participação do BB no crédito rural PF: **62,4% (12/2019) → 53,5% (06/2026)**. Cooperativas singulares: 13,7% → 15,7%. Caixa: 1,2% → 6,8% | [IFD] |
| 8 | Participação do BB nos depósitos à vista: **22,3% → 17,0%**; nas LCA: **49,4% → 32,6%**; nas captações totais: 18,7% → 14,9% (12/2019 → 06/2026) | [IFD] |
| 9 | O BB tem agência em 2.300 municípios (estável desde 12/2022) e é o **único banco com agência em 555** deles (437 em 12/2022). No mesmo período, Bradesco saiu de 520 municípios, Itaú de 289 e Santander de 262 | [EST] |
| 10 | A administração afirmou que, sem o agro, o ROE estaria perto de 17% | [I-01], nov/2026 (declaração, não é número auditado) |
| 11 | Reação do mercado à revisão de 11/11/2026: retorno anormal acumulado de −9,3% em [−1, +3] pregões (ilustrativo) | [FE] §2.1 |

A leitura que organiza o plano, e que é ela mesma uma hipótese **[H]**: o BB vive duas histórias ao mesmo
tempo. A primeira é **aguda e visível** (o ciclo de inadimplência do agro, que consome lucro e capital). A segunda é
**lenta e menos comentada** (perda de participação em quase todas as linhas de varejo e no passivo barato, que
começou antes do ciclo). O plano precisa separar as duas, porque os remédios são diferentes.

---

## A. Onde o BB era forte e está perdendo, e para quem

### A.1 Por produto (participação no saldo do sistema, em %)

Fonte: [IFD]. Até 12/2024 o perímetro é o conglomerado financeiro; a partir de 2025, o prudencial (ver Anexo 1).
A data-base 12/2024 foi omitida por anomalia nos totais de PJ.

| Produto | Sistema 06/2026 (R$ bi) | BB 12/2019 | BB 12/2022 | BB 12/2023 | BB 12/2025 | BB 06/2026 | Variação (p.p.) | Quem mais ganhou no período |
|---|---|---|---|---|---|---|---|---|
| **Crédito PF total** | 4.820 | 17,7 | 16,8 | 16,8 | 15,3 | **15,1** | −2,6 | Nubank (0,5 → 3,8), cooperativas singulares (4,5 → 5,8) |
| Rural e agroindustrial PF | 686 | 62,4 | 55,8 | 53,7 | 52,2 | **53,5** | **−8,9** | Caixa (1,2 → 6,8), Sicoob (4,5 → 6,8), Banco da Amazônia (0,4 → 3,1), Sicredi (10,0 → 11,5), Cresol (1,6 → 2,5) |
| Consignado | 800 | 21,2 | 19,5 | 20,2 | 19,2 | **19,2** | −2,0 | C6 (0 → 5,2), Agibank (0,1 → 3,5), BTG/Pan (→ 2,9), PicPay (0 → 1,2) |
| Pessoal sem consignação | 400 | 22,5 | 16,4 | 16,7 | 13,7 | **14,0** | **−8,5** | Nubank (0,2 → 15,1), Mercado Pago (0 → 3,6) |
| Cartão de crédito | 748 | 11,6 | 11,4 | 10,5 | 9,8 | **9,4** | −2,2 | Nubank (3,3 → 15,5), Mercado Pago (0 → 4,2); Itaú também perdeu (32,7 → 20,2) |
| Habitação | 1.403 | 7,7 | 4,9 | 4,5 | 3,5 | **3,2** | −4,4 | Itaú (7,0 → 10,8), Bradesco (6,9 → 7,9); Caixa manteve cerca de 70% |
| Veículos | 426 | 1,8 | 1,6 | 1,5 | 2,6 | **2,5** | +0,7 | (o BB nunca foi relevante aqui) |
| **Crédito PJ total** | 3.274 | 13,4 | 12,3 | 13,1 | 11,9 | **11,8** | −1,7 | Cooperativas singulares (3,1 → 7,3) |
| PJ capital de giro | 781 | 16,1 | 15,8 | 17,0 | 11,7 | **10,9** | **−5,3** | Cooperativas singulares (10,7 → 18,6), PagBank (0 → 5,7), Stone (0 → 3,9) |
| PJ investimento | 321 | 37,5 | 23,5 | 24,4 | 26,7 | **29,0** | −8,5 | Cooperativas singulares (5,7 → 9,0) |
| PJ rural e agroindustrial | 91 | 21,3 | 11,8 | 9,5 | 10,7 | **12,8** | −8,5 | Itaú (13,8 → 20,6), cooperativas singulares (2,7 → 11,2) |
| PJ comércio exterior | 256 | 18,4 | 20,7 | 25,8 | 26,2 | **25,4** | **+7,0** | (aqui o BB ganhou) |

Perguntas que esta tabela abre:

- **A1.** A perda no rural é estrutural ou é só o reflexo do freio de 2025–26? A série mostra queda de 6,6 p.p.
  entre 12/2019 e 12/2022, **antes** do ciclo de inadimplência. → premissa P01.
- **A2.** O que o BB perdeu no crédito pessoal sem consignação era cliente rentável ou risco que ele fez bem em
  não tomar? O vencido acima de 15 dias do Nubank nessa linha é de 8,4%, contra 4,6% do BB (06/2026, [IFD]). → P14.
- **A3.** O consignado resiste (−2 p.p.) porque está ancorado na folha do setor público. O que acontece quando
  a portabilidade pelo Open Finance chegar a ele (prevista para nov/2026, [I-22])? → P15.
- **A4.** A saída do imobiliário foi decisão ou omissão? → P18.
- **A5.** No PJ, as cooperativas tomaram o capital de giro da pequena empresa. O BB perdeu em preço, em
  proximidade ou em apetite? → P30.

### A.2 Por região (participação do BB na carteira de crédito ativa, %)

Fonte: [IFD], relatório "por região geográfica".

| Região | Sistema 06/2026 (R$ bi) | BB 12/2019 | BB 12/2023 | BB 06/2026 | Variação (p.p.) | Cooperativas singulares 12/2019 → 06/2026 |
|---|---|---|---|---|---|---|
| Sudeste | 3.435 | 14,6 | 13,0 | 11,5 | −3,1 | 2,5 → 4,5 |
| Sul | 1.486 | 16,9 | 15,1 | 13,3 | **−3,6** | **10,6 → 16,8** |
| Nordeste | 1.085 | 17,8 | 18,3 | 16,8 | −1,0 | 1,3 → 2,0 |
| Centro-Oeste | 932 | 24,0 | 23,2 | 22,7 | −1,2 | 6,0 → 7,7 |
| Norte | 421 | 24,2 | 23,2 | 21,4 | −2,8 | 4,2 → 5,4 |
| **Total** | 8.094 | 15,7 | 15,3 | 13,8 | −1,9 | 3,8 → 6,4 |

- **A6.** No Sul o BB perde para as cooperativas, que já têm fatia maior que a dele. O Sul é o futuro das outras
  regiões ou um caso particular (tradição cooperativista)? → P13.
- **A7.** No Centro-Oeste o BB quase não perdeu participação, e é lá que a administração localiza a
  inadimplência do agro ([I-02]). Manter participação num mercado que piora pode ser o problema. → P03.

### A.3 Por segmento de cliente, canal e tipo de cliente

Aqui o dado público é mais fraco. Quase tudo é hipótese com teste indicado.

| Recorte | O que se sabe | Fonte | Pergunta |
|---|---|---|---|
| Produtor rural médio e grande | A administração atribui a inadimplência a produtores médios e grandes de soja, milho e pecuária, sobretudo no Centro-Oeste | [I-02] | A7; P03 |
| Pequeno produtor (Pronaf) | [H] É onde cooperativas e Cresol mais crescem | — | P02, P13 |
| Servidor público | BB com cerca de 25% do consignado do funcionalismo | [I-19] (um veículo; conferir) | P15, P27 |
| Trabalhador do setor privado | BB liderou a largada do Crédito do Trabalhador (cerca de 26% da originação inicial, estimativa do BofA em 2025); R$ 18,2 bi desembolsados em pouco mais de um ano | [I-18], [I-20] | P16 |
| Jovens e renda média | [H] Principalidade migrou para bancos digitais. Indício: o Nubank informa 113 milhões de clientes no Brasil (abr/2026) | [I-08] | P20 |
| Micro e pequena empresa | Capital de giro: BB 16,1% → 10,9% | [IFD] | P30 |
| Canal agência | BB manteve 3,9 mil agências; o sistema fechou 23% das suas entre 12/2022 e 06/2026 | [EST] | P26, P41 |
| Canal digital | [H] O BB tem base digital grande, mas engajamento menor que o dos nativos digitais | — | P20, P35 |
| Lojista (adquirência) | Cielo com cerca de 17% do volume (jan/2026), contra cerca de 50% no auge | [I-28] | P34 |

### A.4 No passivo (participação do BB, %)

Fonte: [IFD], relatório Passivo, perímetro prudencial, 12/2019 → 06/2026.

| Instrumento | Sistema 06/2026 (R$ bi) | BB 12/2019 | BB 06/2026 | Quem ganhou |
|---|---|---|---|---|
| Depósitos à vista | 506 | 22,3 | **17,0** | Cooperativas singulares (10,4 → 20,4) |
| Poupança | 1.046 | 21,1 | 20,7 | (estável; Caixa 37,5 → 38,8) |
| Depósitos a prazo | 4.709 | 14,7 | 13,5 | Nubank (0,7 → 4,0), BTG (1,5 → 4,1), cooperativas (7,1 → 10,4) |
| LCA | 563 | 49,4 | **32,6** | Sicredi e Sicoob (2,8 → 15,0 somados), cooperativas singulares (3,4 → 10,3) |
| Captações totais | 13.869 | 18,7 | 14,9 | BTG (1,4 → 4,4), cooperativas |
| Lucro líquido do sistema | 119 (1S26) | 12,8 | **5,5** | Itaú (16,8 → 20,7), BTG (2,8 → 8,0), Nubank (→ 3,4) |

- **A8.** O funding barato era a vantagem que financiava as outras. Ele está indo embora? → P22, P06.

---

## B. As vantagens injustas do BB: ainda valem, estão erodindo ou estão subutilizadas?

Cada linha é uma premissa testável. O "estado" é a minha leitura inicial e está sujeito ao teste.

| # | Vantagem | Evidência pública hoje | Estado (hipótese) | Premissas |
|---|---|---|---|---|
| V1 | **Capilaridade municipal** | 2.300 municípios com agência; único banco em 555; concorrentes privados fecharam 1.071 presenças municipais em 3,5 anos [EST] | **Verdadeira e crescente por omissão dos bancos, mas contestada por cooperativas** (o Sicredi informa mais de 3.000 pontos em cerca de 2.200 municípios e planeja 200 novos em 2026, [I-10]). Possivelmente **subutilizada** | P26, P41 |
| V2 | **Relação com o agro e liderança no crédito rural** | 53,5% do rural PF [IFD]; carteira agro de R$ 403,6 bi [I-01] | **Erodindo** em participação (−8,9 p.p.) e virou a principal fonte de perda. **Subutilizada** fora do crédito (seguro, pagamentos da cadeia, mercado de capitais) | P01–P13 |
| V3 | **Folha de pagamento e clientes do setor público** | 19,2% do consignado [IFD]; cerca de 25% do consignado de servidores [I-19] | **Verdadeira, sob ameaça regulatória** (portabilidade de crédito e de salário) | P15, P27 |
| V4 | **Funding de baixo custo** (depósitos à vista, poupança rural, LCA, depósitos judiciais) | Participações em queda [IFD]; tribunais cobrando remuneração maior [I-30] | **Erodindo** | P22, P06, P23, P24 |
| V5 | **Relação com o governo** (agente de políticas: Plano Safra, Pronaf, fundos constitucionais, programas) | [H] Dá escala e receita de equalização; impõe concentração e risco político | **Verdadeira e de dois gumes** | P28, P55 |
| V6 | **Marca e confiança** | [H] Em crise de confiança de bancos médios e digitais, depósitos correm para os grandes públicos. O caso BRB/Master de 2026 é um teste natural [I-31] | **Verdadeira, pouco monetizada** | P25 |
| V7 | **Escala de dados** (histórico de crédito rural, transações do setor público, base de mais de 30 milhões de clientes digitais) | Relatório da Administração de 2025 cita 35,8 milhões de clientes digitais [I-19]. Mas a inadimplência rural do BB (vencidos acima de 15 dias: 6,2%) é maior que a das cooperativas (1,2% a 2,2%) [IFD] | **Subutilizada**: se os dados dessem vantagem de seleção, a inadimplência relativa seria menor | P02, P09, P42 |
| V8 | **Conglomerado completo** (seguridade, gestão de recursos, consórcio, meios de pagamento, banco de investimento) | BB Seguridade lucrou R$ 2,43 bi no 3T26, mais que o próprio banco [I-26]. Participações: BB Seguridade, BB Asset, BB Consórcios, Cielo, EloPar, UBS BB, Banco BV [M] | **Verdadeira, mas dependente do canal do banco** (prêmios da Brasilseg caíram 19% com o freio do crédito rural) | P38–P40 |
| V9 | **Comércio exterior e câmbio** | 25,4% do crédito de comércio exterior, em alta [IFD] | **Verdadeira e crescendo** | P31 |
| V10 | **Presença no Norte e no Centro-Oeste** | 21,4% e 22,7% do crédito regional [IFD] | **Verdadeira**, mas concentrada onde o risco climático e o do agro são maiores | P03, P09 |

---

## C. Mercados em que o BB joga ou poderia jogar

Tamanhos de 06/2026 e crescimento anual composto de 12/2019 a 06/2026 e de 12/2023 a 06/2026, todos [IFD],
salvo indicação. O crescimento de cartão e de crédito pessoal está inflado pela mudança de perímetro de 2025
(Anexo 1).

| Mercado | Tamanho | Crescimento a.a. (6,5 anos / 2,5 anos) | Posição do BB | Leitura inicial |
|---|---|---|---|---|
| Crédito rural PF | R$ 686 bi | 16,4% / 7,3% (parou em 2026: +0,4% no semestre) | 1º, 53,5% | Núcleo. Defender com outro modelo de risco |
| Crédito privado do agro fora do balanço bancário (CPR, CRA, Fiagro) | CPR: R$ 593,8 bi de estoque (out/2026, +8% em um ano); CRA: R$ 173,4 bi [I-13] | CPR: de R$ 201 bi para R$ 594 bi na comparação mais longa do boletim (+195%) | [H] Pequena frente ao balanço | Mercado adjacente que cresce mais que o crédito bancário. Onde o BB pode originar e distribuir |
| Consignado | R$ 800 bi | 12,0% / 10,3% | 1º, 19,2% (Caixa 14,3%) | Núcleo. Defender da portabilidade |
| Crédito pessoal sem consignação | R$ 400 bi | 18,2% / 15,0% | 14,0% (Nubank 15,1%) | Perdido para os digitais. Decidir se disputa |
| Cartão de crédito | R$ 748 bi | 16,4% / 13,6% | 9,4% (4º) | Posição mediana, risco em alta |
| Habitação | R$ 1.403 bi | 12,9% / 12,5% | 3,2% | Espaço em branco: a base de servidores é o público natural |
| Veículos | R$ 426 bi | 12,0% / 16,8% | 2,5% direto; mais a participação no Banco BV [M] | Avaliar via BV, não via balanço próprio |
| PJ capital de giro | R$ 781 bi | 16,3% / 10,8% | 10,9% | Perdendo para cooperativas |
| PJ comércio exterior | R$ 256 bi | 5,9% / 6,4% | 1º, 25,4% | Franquia a ampliar |
| PJ infraestrutura e desenvolvimento | R$ 689 bi | 6,1% / 11,6% | 5,9% | Mercado do BNDES e da Caixa |
| Depósitos à vista | R$ 506 bi | — | 17,0% | Erosão |
| LCA | R$ 563 bi | cerca de 22% | 32,6% | Erosão; risco de tributação [I-25] |
| Pagamentos (Pix) | 76 bi de transações de jan a out/2026 (+17,6%); 54,7% das transações de varejo no 2S25 [I-23], [I-24] | — | [H] Proporcional à base de contas | Receita de tarifa some; o fluxo vira dado |
| Adquirência | Pagamentos com cartões de R$ 1,2 tri no 3T26 (Monitor Abecs, 10/11/2026, citado em [ASSOC]) | +6,6% no 3T26 | Cielo com cerca de 17% [I-28] | Integrar ao banco ou desinvestir |
| Seguros, previdência e capitalização | Brasilseg: R$ 3,57 bi de prêmios no 3T26 (−19%) [I-27] | — | Líder em rural e prestamista [H] | Depende do canal do banco |
| Gestão de recursos | [H] BB Asset entre as maiores, com cerca de R$ 1,8 tri (jan/2026, [I-29]; fontes conflitantes) | — | 1º ou 2º em patrimônio | Volume alto, taxa média baixa [H] |
| Consórcio | Tamanho a levantar (BCB, dados de consórcios) | — | [H] Entre os líderes | Substituto do crédito com juro alto |
| Setor público (folha, arrecadação, caixa de prefeituras, RPPS, depósitos judiciais) | Tamanho a levantar (PNCP, CADPREV, ESTBAN) | — | [H] Líder | Vantagem institucional sob licitação |
| Mercado de capitais e banco de investimento | Rankings da ANBIMA | — | Via UBS BB [M] | Onde o grande cliente do agro e do atacado se financia |
| Carbono, crédito verde e seguro paramétrico | [H] Pequeno hoje | — | — | Opção ligada ao risco climático |

---

## D. Concorrentes por mercado (resumo; detalhe em `02-concorrentes.md`)

A coluna "Com que modelo" é leitura minha, portanto **[H]**, salvo onde há fonte.

| Tipo | Quem | Onde ganha | Com que modelo |
|---|---|---|---|
| **Cooperativas** | Sicredi, Sicoob, Cresol, Unicred | Rural PF, capital de giro de MPE, depósitos à vista, LCA; sobretudo no Sul | Proximidade, dono-cliente, distribuição de sobras, custo de capital menor, expansão física onde os bancos fecham |
| **Bancos digitais** | Nubank, Inter, C6, PicPay, Agibank | Crédito pessoal sem consignação, cartão, depósitos a prazo; começando no consignado | Custo de servir baixo, aquisição digital, dados de uso |
| **Banco público concorrente** | Caixa; Banco da Amazônia e BNB nos fundos constitucionais | Rural PF (Caixa 1,2% → 6,8%, hoje com inadimplência de 25,4% no rural, [I-09]) | Mandato de governo e preço |
| **Incumbentes privados** | Itaú, Bradesco, Santander | Agro PJ (Itaú 13,8% → 20,6%), imobiliário, alta renda | Seleção de clientes, saída de praças e produtos pouco rentáveis |
| **Instituições de pagamento e big techs** | Mercado Pago, PagBank, Stone | Crédito a lojista e ao consumidor do marketplace; contas de pagamento (Mercado Pago com cerca de metade do saldo pré-pago do sistema, [IFD]) | Fluxo de vendas como garantia e como dado |
| **Mercado de capitais e agfintechs** | Fiagro, CRA, CPR; Agrolend, Traive, TerraMagna | Grande produtor e cadeia de insumos | Originação especializada com funding de mercado; Agrolend com R$ 968 mi de carteira no fim de 2025 [I-32] |
| **Estrangeiros e bancos de montadora** | Rabobank, John Deere, CNH, DLL | Nicho (máquinas, grandes produtores). Rabobank caiu de 1,9% para 0,3% do rural PF [IFD] | Especialização |

---

## E. Mudanças estruturais e o efeito em cada mercado

Sinais: **(+)** favorece o BB, **(−)** prejudica, **(±)** depende da resposta. Todas as células são hipóteses com premissa associada.

| Mudança | Situação (fonte, data) | Agro | Consignado e PF | Funding | Pagamentos | Setor público | Premissas |
|---|---|---|---|---|---|---|---|
| **Pix** (e Pix Automático, parcelado) | 76 bi de transações de jan a out/2026; Pix Automático com R$ 3,5 bi no 2T26 [I-23] | (±) pagamentos da cadeia | (−) tarifas; (−) cartão de débito | (−) depósito à vista fica mais móvel | (−) adquirência | (±) arrecadação | P35 |
| **Open Finance e portabilidade** | Cerca de 200 milhões de consentimentos em 2026; portabilidade de crédito pessoal desde fev/2026; consignado federal previsto para nov/2026 [I-21], [I-22] | (±) | (−) defesa do consignado; (+) ataque a clientes de digitais | (−) | — | (−) folha deixa de prender o cliente | P15, P36 |
| **Drex e tokenização** | Plataforma de testes desligada em nov/2025; retomada esperada só para 2027 (imprensa, [I-33]) | (±) tokenização privada de CPR | — | — | — | — | P53 |
| **Regras do consignado e do FGTS** | Crédito do Trabalhador desde mar/2025; BCB aponta inadimplência acima da do crédito pessoal a partir do 5º mês (out/2026, [I-20]); antecipação do saque-aniversário restringida desde nov/2025 [I-34] | — | (±) mercado novo com risco novo | — | — | — | P16, P54 |
| **Res. CMN 4.966** (perda esperada, jan/2025) | Em vigor; quebra de série em 03/2025 [FI] §0 | (−) provisão mais cedo no crédito de parcela única | (−) | — | — | — | P46 |
| **Política e ciclo do crédito rural** | Safra 2025/26: R$ 477,2 bi no crédito empresarial; CPR com 43% do concedido [I-12]. MP 1.376/2026 de renegociação [I-15]. Recuperações judiciais: 1.990 em 2025, recorde; 474 no 1T26 e 448 no 2T26 [I-14] | (−) no curto prazo; (±) na saída do ciclo | — | (±) LCA sob risco de tributação (PL 5.853/2026, [I-25]) | — | (±) | P01–P11 |
| **Risco climático** | El Niño forte (ONI +2,46 em ago–out/2026) no plantio da safra 2026/27 [FE] | (−) se não for precificado; (+) se o BB for o primeiro a precificar | — | — | — | — | P09 |
| **IA** | [H] Reduz custo de atendimento e de análise; favorece quem tem dado proprietário | (+) se usar o histórico rural | (±) | — | — | (±) | P42, P43 |
| **Juros altos por mais tempo** | Selic de 13,75% [FE] | (−) rolagem do produtor | (−) inadimplência PF | (+) valor do depósito barato | — | — | P22, P48 |
| **Consolidação e fechamento de agências dos privados** | 23% menos agências no sistema em 3,5 anos [EST] | (+) | (+) | (+) | — | (+) | P26 |
| **Assimetria regulatória das cooperativas** | [H] Em redução; o boletim do MAPA cita o início de exigibilidades sobre depósitos à vista de cooperativas [I-12] | (+) | — | (+) | — | — | P49 |

---

## F. A árvore de perguntas

```
Q0. Como o BB volta a gerar retorno acima do custo de capital sem perder o que só ele tem?
│
├─ Q1. O problema é uma carteira (agro) ou a franquia?
│   ├─ Q1.1 O ROE sem o agro é mesmo ~17%?                                   (P04)
│   ├─ Q1.2 A inadimplência do agro é concentrada ou disseminada?            (P03)
│   ├─ Q1.3 Quanto do salto vem da regra contábil (4.966)?                   (P46)
│   └─ Q1.4 A renegociação cura ou adia?                                     (P11)
│
├─ Q2. No agro, o BB perdeu participação por escolha, por modelo ou por ciclo?
│   ├─ Q2.1 A perda é estrutural (antecede 2024)?                            (P01)
│   ├─ Q2.2 Por que as cooperativas têm inadimplência menor?                 (P02, P13)
│   ├─ Q2.3 O melhor risco migrou para o mercado de capitais?                (P05)
│   ├─ Q2.4 O risco climático pode ser previsto e precificado?               (P09, P10)
│   ├─ Q2.5 Seguro e garantias reduzem a perda o bastante?                   (P08)
│   └─ Q2.6 O que mais o BB pode vender ao produtor além de crédito?         (P12, P31)
│
├─ Q3. No varejo, que batalhas valem a pena?
│   ├─ Q3.1 Defender o consignado da portabilidade                           (P15, P16, P27)
│   ├─ Q3.2 Disputar ou ceder o crédito pessoal e o cartão                   (P14, P17, P20)
│   ├─ Q3.3 Entrar no imobiliário pela base de servidores                    (P18)
│   └─ Q3.4 Reconquistar a pequena empresa das cooperativas                  (P30)
│
├─ Q4. A vantagem de funding ainda existe?
│   ├─ Q4.1 O custo de captação relativo subiu?                              (P22)
│   ├─ Q4.2 LCA, poupança rural e depósitos judiciais: o que se perde        (P06, P23, P24)
│   └─ Q4.3 Marca e confiança atraem depósito em momentos de estresse?       (P25)
│
├─ Q5. A capilaridade é ativo ou custo?
│   ├─ Q5.1 Onde o BB é o único banco, ele ganha mais?                       (P26)
│   ├─ Q5.2 O que acontece quando chega uma cooperativa?                     (P26, P13)
│   └─ Q5.3 Custo de servir contra digitais                                  (P41)
│
├─ Q6. Com que capital?
│   ├─ Q6.1 O capital é a restrição ativa?                                   (P45)
│   └─ Q6.2 Quais mercados pagam o capital que consomem?                     (P45, P04)
│
└─ Q7. O que muda as regras do jogo nos próximos 3 anos?
    ├─ Pix e Open Finance                                                    (P35, P36)
    ├─ Tributação da LCA, regras do consignado, assimetria das cooperativas  (P06, P16, P49)
    ├─ Clima                                                                 (P09)
    └─ IA e dados                                                            (P42, P43)
```

---

## Anexo 1. Método e ressalvas do cálculo preliminar

**[IFD].** Arquivos públicos lidos pelo site do IF.data (`www3.bcb.gov.br/ifdata/rest/...`), como descrito em
[FI] §2.1:

- índices `relatorios` (até 12/2024) e `relatorios2025a2030`; para cada data-base, `info`, `cadastro` e `dados_N`;
- relatórios usados: "Carteira de crédito ativa Pessoa Física – modalidade e prazo de vencimento", "… Pessoa
  Jurídica – modalidade e prazo de vencimento", "… por região geográfica", "Passivo" e "Resumo";
- participação = saldo da instituição ÷ soma dos saldos de todas as instituições do cadastro daquele perímetro;
- "Sicredi" e "Sicoob" = soma de todas as entidades cujo nome contém o nome do sistema (banco cooperativo e
  cooperativas); "cooperativas singulares" = tipo de consolidado bancário `b3S`;
- vencidos = coluna "Vencido a partir de 15 dias" ÷ total da modalidade. **Não é** a inadimplência acima de 90 dias.

Ressalvas que a camada de dados precisa tratar antes de qualquer conclusão:

1. **Mudança de perímetro.** Até 12/2024, os relatórios de crédito existem só para o **conglomerado financeiro**
   (seleção 1005). De 03/2025 em diante, só para o **prudencial** (1009), que inclui as instituições de pagamento.
   Isso desloca cartão e crédito pessoal (o Nubank passa de "instituição de pagamento" a "não bancário de crédito")
   e infla o crescimento desses mercados. Para o BB, o efeito no numerador é pequeno; no denominador, não.
2. **Res. CMN 4.966 e Cosif 2025.** Os saldos e os vencidos de 2025 em diante não são comparáveis sem ponte
   ([FI] §0, item 3). O aumento dos vencidos em 2025–26 mistura deterioração real com regra nova de baixa a prejuízo.
3. **Anomalia em 12/2024.** O total de PJ salta para R$ 3.634 bi (R$ 2.630 bi em 12/2023 e R$ 3.244 bi em 12/2025)
   e a fatia do Itaú vai a 24%. Parece duplicação. A data-base foi omitida das tabelas.
4. **Soma do sistema.** É a soma das instituições que reportam, não o total oficial do SFN. O próprio relatório
   avisa que há tolerância frente ao contábil. No passivo, a soma inclui **dupla contagem dos sistemas
   cooperativos** (depósitos de cooperativas em centrais e no banco cooperativo), o que reduz um pouco a fatia de
   todos os bancos nos depósitos a prazo e interfinanceiros. Depósitos à vista e LCA são pouco afetados.
5. **Rural no IF.data × SGS.** "Rural e agroindustrial PF" soma R$ 686 bi no IF.data; a série SGS 20609 (rural PF)
   marca R$ 550,5 bi em out/2026. As definições diferem e precisam ser reconciliadas.
6. **Só sete datas-base.** Não há sazonalidade nem teste estatístico. É um retrato, não uma série.

**[EST].** ESTBAN por município, arquivos `202212_ESTBAN.csv.zip` e `202606_ESTBAN.csv.zip`. Contei municípios com
agência por banco, municípios em que o BB é o único CNPJ presente e agências processadas.

- O ESTBAN **não cobre cooperativas nem bancos sem agência** ([FI] §2.4). "Único banco" não quer dizer "única
  instituição financeira".
- Os **valores absolutos de 06/2026 parecem dobrados** frente ao IF.data (poupança do BB de R$ 432 bi no ESTBAN
  contra cerca de R$ 217 bi no IF.data). Usei só contagens. As participações do ESTBAN (por exemplo, 56,5% dos
  financiamentos rurais em 06/2026 contra 62,0% em 12/2022) apontam na mesma direção do IF.data, mas ficam fora das
  tabelas até a camada de dados validar o arquivo.
- O arquivo de 12/2019 não foi encontrado no endereço novo (404).

Os scripts do cálculo ficaram fora do repositório, na pasta de rascunho da sessão (o caminho está na mensagem
de entrega). São descartáveis: a camada `data/ifs/` deve reproduzir e substituir estes números.

## Anexo 2. Fontes de imprensa e relatórios

Todas lidas por resumo de busca em 28/11/2026. Antes de usar em proposta, conferir na fonte primária (release do
RI, fato relevante no CVM IPE, boletim oficial).

| Marca | Fonte | Data | Endereço |
|---|---|---|---|
| I-01 | Seu Dinheiro, resultado do BB no 3T26 | nov/2026 | https://www.seudinheiro.com/2026/empresas/agronegocio-esta-cobrando-o-preco-no-banco-do-brasil-inadimplencia-dispara-lucro-encolhe-e-acionistas-ficam-sem-uma-parte-dos-dividendos-miql/ |
| I-02 | Gazeta do Povo, resultado do BB no 3T26 | nov/2026 | https://www.gazetadopovo.com.br/economia/banco-do-brasil-tem-tombo-no-lucro-com-disparada-da-inadimplencia-do-agro/ |
| I-03 | Times Brasil, BB corta projeção e payout | nov/2026 | https://timesbrasil.com.br/empresas-e-negocios/bancos-fintechs/bb-tem-queda-de-665-no-lucro-e-reduz-previsao-para-2026/ |
| I-04 | Band, lucro do BB em 2025 (R$ 20,68 bi) | 2026 | https://www.band.com.br/economia/banco-do-brasil-tem-lucro-de-r-2068-bilhoes-em-2025 |
| I-05 | Seu Dinheiro, Itaú no 3T26 | nov/2026 | https://www.seudinheiro.com/2026/empresas/itau-itub4-com-lucro-roe-rentabilidade-banco-balanco-do-3t26-miql/ |
| I-06 | Acionista e Brapi, bancos privados no 3T26 | nov/2026 | https://acionista.com.br/resultados-bancos-3t26/ · https://brapi.dev/news/bancos-privados-lucram-r-22-6-bi-no-3-tri-com-itau-f34450fa |
| I-07 | NeoFeed, Nubank no 3T26 | nov/2026 | https://neofeed.com.br/negocios/nubank-lucra-us-11-bilhao-ve-roe-recuar-e-se-prepara-para-cenario-mais-dificil-em-2027/ |
| I-08 | Band e Nubank, base de clientes no Brasil | abr/2026 | https://www.band.com.br/economia/nubank-anuncia-que-investira-r-45-bilhoes-no-brasil-em-2026 |
| I-09 | Brapi e BrasilAgro, inadimplência do agro na Caixa | nov/2026 | https://brapi.dev/news/inadimplencia-do-agro-na-caixa-chega-a-25-44-apos-renegociar-r-bb76b733 |
| I-10 | Sicredi, resultado de 2025 | fev/2026 | https://www.sicredi.com.br/coop/norte-sc/noticias/cooperativismo/sicredi-cresce-146-em-ativos-e-total-alcanca-r-455-bilhoes/ |
| I-11 | Sicoob, Plano Safra 2026/27 | 2026 | https://www.sicoob.com.br/web/sicoobguaranicredi/noticias/-/asset_publisher/xAioIawpOI5S/content/id/322684129 |
| I-12 | MAPA, boletim de desempenho do crédito rural, safra 2025/26 | jul/2026 | https://www.gov.br/agricultura/pt-br/assuntos/noticias/mapa-divulga-boletim-de-desempenho-na-safra-2025-2026/boletim_credito_rural_empresarialsempronaf_jul25_jun26_06-07-26.pdf |
| I-13 | MAPA, Boletim de Finanças Privadas do Agro; CNN, mercado de capitais com 33% | nov/2026 | https://www.gov.br/agricultura/pt-br/assuntos/politica-agricola/boletim-de-financas-privadas-do-agro/boletim-de-financas-privadas-do-agro-nov.2026 · https://www.cnnbrasil.com.br/agro/exclusivo-mercado-de-capitais-ja-banca-33-do-credito-do-agro/ |
| I-14 | Serasa Experian, recuperação judicial no agro | ago/2026 | https://www.serasaexperian.com.br/sala-de-imprensa/agronegocios/recuperacao-judicial-agro-tem-alta-de-22-por-cento-e-acumula-474-pedidos-do-recurso-no-primeiro-trimestre-de-2026-mostram-dados-ineditos-da-serasa-experian/ · https://revistacultivar.com.br/noticias/pedidos-de-recuperacao-judicial-no-agro-caem-20-7-no-2o-trimestre |
| I-15 | Senado, sumário da MPV 1.376/2026 | jul/2026 | https://www12.senado.leg.br/publicacoes/estudos-legislativos/tipos-de-estudos/sumarios-de-proposicoes/mpv1376 |
| I-16 | Forbes Agro, BB e a MP 1.376 (até R$ 100 bi) | ago/2026 | https://forbes.com.br/forbes-agro/2026/08/bb-renegocia-ate-r-100-bilhoes-em-dividas-do-agro-via-mp-1-376/ |
| I-17 | Canal Rural, BB prevê renegociar R$ 20 bi | 2026 | https://www.canalrural.com.br/agricultura/banco-do-brasil-preve-renegociar-r-20-bilhoes-em-dividas-rurais/ |
| I-18 | Canal Rural, BB no Crédito do Trabalhador (R$ 18,2 bi); Seu Dinheiro, estimativa do BofA | 2025–2026 | https://www.canalrural.com.br/economia/banco-do-brasil-desembolsa-r-182-bilhoes-no-credito-do-trabalhador-em-pouco-mais-de-um-ano/ · https://www.seudinheiro.com/2025/empresas/credito-consignado-privado-ganha-espaco-no-mercado-sob-lideranca-do-banco-do-brasil-bbas3-diz-bofa-paty/ |
| I-19 | Let's Money, BB com cerca de 25% do consignado de servidores; Relatório da Administração 2025 do BB (clientes digitais) | 2026 | https://www.letsmoney.com.br/noticias/bb-credito-trabalhador-18-bilhoes/ |
| I-20 | SBT News, BCB sobre a inadimplência do consignado privado | out/2026 | https://sbtnews.sbt.com.br/noticia/economia/bc-consignado-privado-tem-inadimplencia-maior-que-pessoal |
| I-21 | Finsiders, Open Finance e crédito | 2026 | https://finsidersbrasil.com.br/regulamentacao/open-finance-ja-destrava-mais-de-r-30-bi-em-credito-aponta-bc/ |
| I-22 | Agência Brasil, portabilidade de crédito digital | fev/2026 | https://agenciabrasil.ebc.com.br/economia/noticia/2026-02/portabilidade-de-credito-ja-pode-ser-feita-de-forma-digital |
| I-23 | Agência Gov, seis anos do Pix | nov/2026 | https://agenciagov.ebc.com.br/noticias/202611/pix-celebra-6-anos-como-motor-de-inclusao-e-eficiencia-financeira-em-todo-o-brasil |
| I-24 | Band, Pix com 54,7% das transações | abr/2026 | https://www.band.com.br/economia/noticias/pix-lidera-pagamentos-no-brasil-com-547-das-transacoes-diz-banco-central-202604081055 |
| I-25 | Capital Aberto, tributação de LCI e LCA (PL 5.853/2026) | nov/2026 | https://capitalaberto.com.br/regulacao/2026/11/tributacao-de-lci-e-lca-pode-mudar-estrutura-de-captacao |
| I-26 | Investidor10, BB Seguridade no 3T26 | nov/2026 | https://investidor10.com.br/noticias/lucro-da-bb-seguridade-bbse3-recua-5-1-no-3t26-para-r-2-43-bilhoes-123670/ |
| I-27 | Brapi, prêmios da Brasilseg e projeção cortada | nov/2026 | https://brapi.dev/news/lucro-da-bb-seguridade-supera-consenso-mas-projecao-da-brasilseg-e-cortada-bde74fc3 |
| I-28 | NeoFeed e Let's Money, participação das adquirentes (pesquisa UBS BB) | jan/2026 | https://neofeed.com.br/negocios/na-disputa-das-adquirentes-rede-do-itau-avanca · https://www.letsmoney.com.br/noticias/rede-itau-lidera-volume-adquirentes/ |
| I-29 | Forbes, maiores gestoras (Quantum com dados da ANBIMA) | mar/2026 | https://forbes.com.br/forbes-money/2026/03/quais-sao-as-maiores-gestoras-de-patrimonio-do-brasil/ |
| I-30 | TJRJ, cobrança de competitividade nos depósitos judiciais | mar/2026 | https://www.tjrj.jus.br/noticias/noticia/-/visualizar-conteudo/5111210/405680636 |
| I-31 | Jornal Grande Bahia, CNJ e os depósitos judiciais no BRB | jun/2026 | https://jornalgrandebahia.com.br/2026/06/cnj-cobra-tribunais-sobre-r-30-bilhoes-em-depositos-judiciais-no-brb-e-amplia-pressao-apos-crise-do-banco/ |
| I-32 | AgFeed e Money Times, Agrolend | 2026 | https://agfeed.com.br/financas/agrolend-bate-r-600-milhoes-em-carteira-em-meio-a-safra-recorde-e-credito-seletivo · https://www.moneytimes.com.br/no-vacuo-dos-bancoes-banco-digital-mira-dobrar-carteira-no-agro-para-r-2-bilhoes-em-meio-ao-ciclo-de-rjs-e-inadimplencia-pads/ |
| I-33 | Exame e outros, desligamento da plataforma do Drex | set–nov/2025 | https://exame.com/noticias-sobre/drex/ (reconfirmar na página do Drex no BCB) |
| I-34 | Brasil de Fato e NSC Total, regras do saque-aniversário do FGTS (datas conflitantes entre veículos) | nov/2025–2026 | https://www.brasildefato.com.br/2025/11/01/novas-regras-do-saque-aniversario-do-fgts-entram-em-vigor-neste-sabado/ · https://www.nsctotal.com.br/economia/emprestimo-saque-aniversario-fgts-adiado-2027 |

**[ASSOC]** e **[FEB]** são `docs/sources/associacoes-bancarias.md` e `docs/sources/febraban.md`, que indicam onde
buscar os números setoriais (Monitor Abecs, AnuárioCoop da OCB, estudos da Zetta e da ABIPAG, Pesquisa ABCD/PwC,
Panorama de Crédito e Pesquisa de Tecnologia Bancária da FEBRABAN).
