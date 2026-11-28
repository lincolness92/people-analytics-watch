# Estado das premissas depois da rodada 1 (v1)

Versão para **terça-feira, 01/12/2026**. Escrita em 28/11/2026, com os dados coletados nesse dia. Só informação
pública. Nada interno do BB.

Este arquivo junta três coisas: o que o conselho de modelos disse de cada premissa
([`conselho/R5/relatorio.md`](conselho/R5/relatorio.md)), o que as análises mediram
([`analises/README.md`](analises/README.md)) e o estado que resulta disso. O plano que usa estes estados é o
[`07-plano-v1.md`](07-plano-v1.md).

## Como ler

- **Estado.** Quatro valores: *sugere confirmar*, *sugere refutar*, *inconclusivo*, *não testada*. Nenhuma premissa
  está "confirmada" ou "refutada". O motivo está nas duas linhas abaixo.
- **Preliminar, sem pré-registro.** As análises 1 a 6 e 8 usaram as regras de leitura de
  [`04-proximos-passos.md`](04-proximos-passos.md) §4, mas os limiares não foram gravados com data antes de ver o
  resultado. A exceção é a Análise 7 (G01 e S01), que teve pré-registro leve
  ([`a7_preregistro.json`](../../labs/rural/resultados/a7_preregistro.json), 28/11/2026, 07:20 UTC).
- **O dossiê não foi aprovado (H1) e os juízes não foram calibrados com nota humana (H2).** As notas do conselho
  ordenam, não decidem.
- **Conselho.** Nota de 0 a 18 (média de três juízes); classe *consenso* ou *disputa*; p mediana = probabilidade
  mediana de a premissa ser verdadeira, só nas 55 premissas v0; desacordos pelo id de
  [`conselho/desacordos.jsonl`](conselho/desacordos.jsonl). Fonte: [`conselho/R5/agregado.json`](conselho/R5/agregado.json).
- **Evidência.** A análise, o número e o arquivo. Caminhos relativos a `estrategia/bb/`, salvo quando começam por
  `data/` ou `labs/` (raiz do repositório).
- **Três definições de atraso rural, que não se comparam em nível:** SICOR (saldo inteiro da operação marcada),
  IF.data (parcelas vencidas há 15 dias ou mais) e SCR.data (mais de 90 dias). Compara-se a ordem e a direção.

## 1. Premissas com evidência

São 49 linhas: 24 premissas v0, 21 linhas com premissas novas do conselho (26 ids) e 4 das frentes Atena (G, S),
retorno (R) e fundação (F).

### Agro e crédito rural

| id | Enunciado curto | Conselho (nota; classe; p mediana; desacordos) | Evidência até aqui | Estado |
|---|---|---|---|---|
| **P01** | A perda de participação no rural PF é estrutural (começou antes do ciclo) | 12,7; consenso; p = 0,65 | [A1](analises/a1.md): −1,90 p.p./ano em 12/2019–09/2023; quebra em 12/2020 (sup-F, p = 0,037). Mas +0,5 p.p. em 2016–2019 e −0,3 em 2023–2026; em 2019–2023 quem levou foi a Caixa (+6,7), não as cooperativas (+1,8). IF.data; `analises/out/a1_quebra_rural_pf.json` | sugere confirmar. Preliminar, sem pré-registro |
| **C4-N02** | A perda no rural (56,68% → 48,70%, PF + PJ) foi para cooperativas e Caixa | 15; disputa; D-039 | [A1](analises/a1.md), [A8](analises/a8.md): em dez anos, Caixa +4,9, Sicredi +2,9, Basa +2,6 (rural PF + PJ). No PF, cooperativas +5,7 em 2016–2019 e +2,3 em 2023–2026; Caixa +6,7 em 2019–2023. `analises/out/a1_quem_ganhou.csv`, `a8_mapa_mercados.csv` | sugere confirmar. Preliminar, sem pré-registro |
| **C1-N05** | ≥ 60% da perda no rural PF foi em recursos direcionados a outros bancos públicos | 17; consenso | [A1](analises/a1.md): Caixa (+6,7) e Basa (+2,0) somam a queda de 8,6 p.p. de 2019–2023. A fonte dos recursos (equalizado, fundo constitucional) não foi aberta. `a1_variacao_por_instituicao.csv` | inconclusivo (indício a favor). Preliminar, sem pré-registro |
| **P02** | Nas mesmas células, as cooperativas têm atraso rural menor que o BB | 13; consenso; p = 0,47 | [A2](analises/a2.md): BB − cooperativas dentro da célula (UF × porte × programa × fonte) = 7,5 p.p. (IC 95%: 6,6 a 8,8) em 09/2026; 1,1 p.p. em 12/2023. SCR.data, Banco − Cooperativa: 4,7 p.p. O dado não separa modelo de seleção de cliente. SICOR; `data/rural/a2/mix_bb_menos_coop_sicor.csv` | sugere confirmar. Preliminar, sem pré-registro |
| **P42** | A escala de dados do BB não vira melhor seleção de risco | 12; consenso; p = 0,50 | [A2](analises/a2.md): resíduo do BB contra o mix = +1,1 p.p. (IC −0,8 a +3,1) em 09/2026; +3,6 (+1,1 a +6,2) na medida ampla. Só no rural. `data/rural/a2/mix_residuos_sicor.csv` | sugere confirmar. Preliminar, sem pré-registro |
| **C1-N02** | A inadimplência rural do BB é ≥ 1 p.p. menor que a prevista pelo mix | 17; consenso | [A2](analises/a2.md): observado 11,36% × esperado 10,26%; resíduo +1,1 p.p. (IC −0,8 a +3,1). O sinal é o contrário do pedido. `mix_residuos_sicor.csv` | sugere refutar. Preliminar, sem pré-registro |
| **C2-N01** | A inadimplência rural do BB é ≤ à do resto do sistema, em definição alinhada | 17; consenso | [A2](analises/a2.md): SICOR 09/2026, BB 11,36% × esperado com as taxas do resto do sistema 10,26%; IF.data 06/2026 (≥ 15 dias), BB 6,18% × sistema 5,62%. Não é o > 90 dias. `serie_sicor_situacao.csv`, `serie_ifdata_venc15.csv` | sugere refutar. Preliminar, sem pré-registro |
| **C4-N01** | O agro do BB (6,92%) é melhor que o sistema rural PF (9,59%) | 12,3; disputa; D-038 | [A2](analises/a2.md): a comparação mistura definições (carteira agro ampliada do BB × rural PF do SGS). Nas definições alinhadas o BB fica um pouco acima do sistema (linha acima) | sugere refutar. Preliminar, sem pré-registro |
| **C5-N01** | A inadimplência do agro do BB é choque sistêmico, não seleção pior que a dos pares | 15,7; disputa; D-052 | [A2](analises/a2.md): contra o resto do sistema, o resíduo do BB não difere de zero (+1,1; IC −0,8 a +3,1). Contra as cooperativas, difere (7,5 p.p.). Caixa: +22,6 p.p. | inconclusivo. Preliminar, sem pré-registro |
| **P03** | O aumento da inadimplência do agro do BB é concentrado | 16; consenso; p = 0,55 | [A2](analises/a2.md): 94,5% do aumento (12/2023–09/2026) em médio e grande produtor (76,1% da carteira); 64,3% em recursos não controlados (37,1%). Por UF, proporcional à carteira (Centro-Oeste: 34,4% do aumento × 34,6% da carteira). Por município, não testável (cobertura de 26% do saldo em atraso). `data/rural/a2/p03_aumento_por_dimensao_bb_2023-12_2026-09.csv` | inconclusivo (segmento: sim; geografia: não). Preliminar, sem pré-registro |
| **C2-N03** | A maior parte da perda do agro do BB vem de operações a taxa de mercado | 15,7; disputa; D-027 | [A2](analises/a2.md): 64,3% do aumento do saldo em atraso vem de recursos não controlados; atraso de 18,8% × 7,0% nos controlados. É atraso no SICOR, não perda. Mesmo arquivo de P03 | sugere confirmar. Preliminar, sem pré-registro |
| **C1-N03** | ≥ 60% do vencido do agro do BB está em crédito a taxa de mercado | 14,7; disputa; D-025 | [A2](analises/a2.md): do aumento, 64,3%. Do estoque, cerca de 61% (derivado aqui da tabela 5.3: 18,8% × 37,1% contra 7,0% × 62,9%). No limite, e em atraso do SICOR, não > 90 dias | inconclusivo (no limite). Preliminar, sem pré-registro |
| **C5-N02** | A parcela a taxa de mercado concentra a inadimplência, e o BB pode reduzi-la sem perder o direcionado | 13,7; disputa; D-053 | [A2](analises/a2.md): a primeira metade passa (linhas acima). A segunda (reduzir sem perder o negócio) não tem teste | inconclusivo. Preliminar, sem pré-registro |
| **P07** | Quem cresceu rápido no rural em 2020–2023 tem a pior inadimplência agora | 13; consenso; p = 0,43 | [A2](analises/a2.md): Spearman 0,105 (IC −0,146 a 0,344; p = 0,39; n = 71). A Caixa é um caso (14,4% de vencido), não a regra. `data/rural/a2/p07_corte_transversal.csv` | sugere refutar. Preliminar, sem pré-registro |
| **P09** | Um escore público (clima, preço, juro) antecipa a inadimplência rural em 6 a 9 meses | 13; consenso; p = 0,45 | [lab. rural](../../labs/rural/README.md): por UF, o modelo com clima, preços e Selic (M1) erra mais que o último valor em h = 6 (1,08×) e h = 9 (1,75×). Por município e com atraso curto, não testado. `labs/rural/resultados/nowcast_avaliacao.csv` | sugere refutar (no recorte por UF). Preliminar, sem pré-registro |
| **C1-N04 / C2-N02** | Choques de produção e preço por UF explicam a alta do atraso rural | 16,3; consenso<br>17,3; consenso | [A7](analises/a7_atena_g01_s01.md): a surpresa de safra (produção) não antecipa o atraso por UF (S01). A parte de preço e margem (S02) não foi testada | inconclusivo (produção: indício contra). Preliminar, sem pré-registro |
| **P13** | O avanço das cooperativas no Sul se repete nas outras regiões | 11,7; consenso; p = 0,50 | [A1](analises/a1.md), [A8](analises/a8.md): Sul +10,9 p.p. para cooperativas em dez anos. Fora do Sul o ganho delas não acelerou em 2023–2026 (−0,3 a +0,6); Nordeste e Sudeste perderam para digitais | inconclusivo. Preliminar, sem pré-registro |

### Varejo pessoa física

| id | Enunciado curto | Conselho (nota; classe; p mediana; desacordos) | Evidência até aqui | Estado |
|---|---|---|---|---|
| **P14** | O crédito pessoal perdido para os digitais era cliente rentável | 12; consenso; p = 0,50 | [A5](analises/a5.md): Nubank cobra 107% a.a. e o BB 61% (2026, taxaJuros/BCB); vencido 8,4% × 4,6% (06/2026). Rendas − provisão: 27,9% × 8,5% a.a. [A8](analises/a8.md): Lerner do Nubank 0,34–0,42 × BB 0,18–0,21. Falta perda efetiva e custo de captação. `analises/out/a5_taxas_por_ano.csv` | sugere confirmar. Preliminar, sem pré-registro |
| **C2-N08** | O BB perdeu participação no pessoal e no cartão em volume de maior risco | 17,3; consenso | [A5](analises/a5.md): quem ganhou tem atraso maior (Nubank 8,4%, Mercado Pago 21,6% × BB 4,6% no não consignado). Convive com P14: risco maior e margem maior. `a5_vencidos_15d.csv` | sugere confirmar. Preliminar, sem pré-registro |
| **C1-N10** | A perda no pessoal foi escolha de risco: o BB caiu junto com Itaú e Bradesco | 16,7; disputa; D-026 | [A1](analises/a1.md): no não consignado, privados grandes −5,1 p.p. e BB −12,6 em dez anos; digitais +22,5. A queda do BB é 2,5 vezes a dos três privados somados | inconclusivo. Preliminar, sem pré-registro |
| **C4-N03** | A perda no pessoal sem consignação é estrutural, dominada pelo Nubank | 13,7; disputa; D-040 | [A1](analises/a1.md), [A5](analises/a5.md): 26,6% → 14,0% (03/2016–06/2026); Nubank +15,1. "Irreversível" não é testável | sugere confirmar (o fato). Preliminar, sem pré-registro |
| **P15** | A portabilidade vai corroer a posição no consignado | 12,3; consenso; p = 0,47 | [A5](analises/a5.md): efeito ainda não medível. Preço do BB no consignado público foi do percentil 29 (2019) para 61 (2025) e 56 (2026): 25,2% a.a. × 20,7% (Nubank) e 19,5% (Banco Sicredi). Portabilidade do pessoal (fev/2026): +0,77 p.p. contra o controle, dentro do ruído. `a5_portabilidade.csv` | inconclusivo (sinal de vulnerabilidade). Preliminar, sem pré-registro |
| **P16** | O consignado privado cresce com risco pior do que parece | 11; consenso; p = 0,55 | [A5](analises/a5.md): atraso do consignado no sistema de 0,83% (12/2024) para 1,37% (06/2026); BB 0,53%. O IF.data não separa o privado | inconclusivo (indício a favor). Preliminar, sem pré-registro |
| **P17** | No cartão, o BB tem posição mediana e risco em alta | 12; consenso; p = 0,60 | [A5](analises/a5.md): 4º em saldo (9,4%); atraso de 6,3% (12/2024) para 9,4% (03/2026), contra 8,7% → 11,7% no sistema. O 15,4% de 06/2026 é suspeito | sugere confirmar. Preliminar, sem pré-registro |
| **P18** | O imobiliário é espaço em branco para a base de servidores | 13; consenso; p = 0,57 | [A5](analises/a5.md): carteira do BB −1,7% a.a. em 2023–2026 com o sistema a +12,5%; 7,7% → 3,2%. Não diz se a base quer o produto | inconclusivo (informa). Preliminar, sem pré-registro |
| **P19** | Em veículos, o caminho é a participação societária, não o balanço próprio | 14; disputa; p = 0,50; D-002, D-003 | README das análises, problema 2: o salto do BB em veículos (R$ 4,5 → 13,8 bi em 12/2024) parece reclassificação. Informa o desacordo D-002 | inconclusivo (informa). Preliminar, sem pré-registro |

### Funding

| id | Enunciado curto | Conselho (nota; classe; p mediana; desacordos) | Evidência até aqui | Estado |
|---|---|---|---|---|
| **P22** | O custo relativo de captação do BB subiu | 13; consenso; p = 0,55 | [A4](analises/a4.md): BB − pares piorou +7,8 p.p. do CDI entre 2017–2019 (+0,7) e 2022–2024 (+8,5); limiar de 3. [A8](analises/a8.md): é mix. Beta 0,74 × 0,71 dos privados; sem compromissadas, 0,57 × 0,62. Compromissadas: 42,7% do saldo do BB × 25,6%. Série quebra na Cosif 2025. `analises/out/a4_regra_p22.csv`, `a8_beta_ciclos.csv` | sugere confirmar (o custo médio); a causa não é o preço do depósito. Preliminar, sem pré-registro |
| **C1-N13** | O custo subiu ≥ 5 p.p. do CDI a mais que os pares, por perda de depósitos à vista e LCA | 17,7; consenso | [A4](analises/a4.md): a magnitude passa em outra janela (+7,8). [A4](analises/a4.md) e [A8](analises/a8.md): a causa não passa. À vista ÷ captações caiu igual no BB (6,3% → 4,5%) e nos pares (6,0% → 4,5%) | inconclusivo (magnitude: sim; causa: indício contra). Preliminar, sem pré-registro |
| **C4-N05 / C5-N08 / C5-N09** | A perda de LCA e de depósitos à vista encarece o funding e aperta a margem | 14; disputa; D-042<br>14,3; disputa; D-057<br>12,3; consenso | Mesma evidência de C1-N13: a perda de participação é real (linha P06), o efeito no custo médio não aparece | inconclusivo (indício contra o mecanismo). Preliminar, sem pré-registro |
| **P06** | A liderança do BB em LCA erodiu | 12,7; disputa; p = 0,72; D-001 | [A4](analises/a4.md), [A8](analises/a8.md): 68,6% (03/2016) → 49,4% (12/2019) → 32,6% (06/2026); −7,4 p.p. só desde 12/2023; cooperativas +17,9. HHI da LCA 4.812 → 1.473. A parte de tributação não é testável. `a4_serie_participacao_bb.csv` | sugere confirmar (a erosão). Preliminar, sem pré-registro |
| **P24** | A poupança rural encolhe | 16; consenso; p = 0,47 | [A4](analises/a4.md): o IF.data não separa a poupança rural. Poupança total: 21,1% → 20,7% | inconclusivo. Preliminar, sem pré-registro |
| **C4-N13** | A poupança do BB é estável | 16; disputa; D-049 | [A4](analises/a4.md): 21,14% (12/2019) → 20,65% (06/2026); saldo +4,4% em 2023–2026, igual ao sistema (4,6%) | sugere confirmar. Preliminar, sem pré-registro |
| **P25** | No estresse, o depósito corre para o BB | 15; consenso; p = 0,50 | [A4](analises/a4.md): na COVID a participação do BB nos depósitos caiu 1,57 p.p. em dois trimestres. Na liquidação do Banco Master, +0,26 p.p., dentro do ruído. `a4_estresse.csv` | sugere refutar. Preliminar, sem pré-registro |

### Rede física e municípios

| id | Enunciado curto | Conselho (nota; classe; p mediana; desacordos) | Evidência até aqui | Estado |
|---|---|---|---|---|
| **P26** | Onde o BB é o único banco, ele ganha mais e perde menos | 13,3; disputa; p = 0,57; D-007 | [A3](analises/a3.md): 558 municípios "só BB" em 08/2026 (ESTBAN). Depósitos de varejo +14,4% ali × −3,3% onde nada mudou (2022–2026). Quando um privado sai, não sobem (−2,9% × −4,3%). A metade "cooperativa" não é testável: o ESTBAN não tem cooperativas. `analises/out/a3_eventos_depositos_bb.csv` | inconclusivo. Preliminar, sem pré-registro |
| **C1-N08** | Nos municípios só BB, a captação cresceu mais | 17,7; consenso | [A3](analises/a3.md): +14,4% × −3,3% (12/2022–08/2026, nominal). Sem PIB municipal para normalizar, como a premissa pede | inconclusivo (indício a favor). Preliminar, sem pré-registro |
| **C2-N14** | Os municípios só BB têm mais depósito barato por real de crédito | 17,3; consenso | [A3](analises/a3.md): crédito ÷ depósitos de varejo = 1,71 nos "só BB" × 1,61 em todos os municípios com BB (cerca de 1,60 nos demais, derivado). Menos depósito por real de crédito, não mais. `a3_classes.csv` | sugere refutar. Preliminar, sem pré-registro |
| **C5-N11** | A alta da fatia do BB em agências vem do fechamento dos concorrentes | 14; disputa | [A3](analises/a3.md): municípios com agência, 01/2016 → 08/2026: BB 2.932 → 2.300; Bradesco 2.313 → 1.197; Itaú 1.192 → 735. `a3_presenca_por_banco.csv` | sugere confirmar. Preliminar, sem pré-registro |
| **P41** | A rede física é um custo que os digitais não têm | 13,7; disputa; p = 0,53; D-015 | [A3](analises/a3.md): 3.606 agências em 2.287 municípios (sem sedes). Custo por cliente não medido | inconclusivo (informa). Preliminar, sem pré-registro |

### Pessoa jurídica

| id | Enunciado curto | Conselho (nota; classe; p mediana; desacordos) | Evidência até aqui | Estado |
|---|---|---|---|---|
| **P30** | As cooperativas tomaram o capital de giro da pequena empresa | 12,3; consenso; p = 0,60 | [A1](analises/a1.md): giro, cooperativas +15,2 e BB −12,1 em dez anos; porte pequeno, +17,3 e −18,1. [A5](analises/a5.md): preço do BB no giro foi do percentil 8 (2019) para 58 (2023). [A8](analises/a8.md) lê inconclusivo: porte instável em 2025–2026 e PagBank e Stone inflam 2023–2026 | inconclusivo (indício a favor; as análises divergem). Preliminar, sem pré-registro |
| **C2-N10** | A perda em micro, pequena e média empresa é real, não reclassificação | 18; consenso | README das análises, problemas 5 e 6: há reclassificação de porte em 2025–2026. [A1](analises/a1.md): a ponte 09/2024–03/2025 mostra pouca mudança na maioria dos produtos. `a1_ponte_2024_2025.csv` | inconclusivo. Preliminar, sem pré-registro |
| **P31 / C4-N04 / C5-N07** | O comércio exterior é a franquia PJ que cresce | 15,7; disputa; p = 0,57; D-009<br>14,3; disputa; D-041<br>15,3; disputa; D-056 | [A1](analises/a1.md), [A8](analises/a8.md): 13,7% (03/2016) → 18,4% (12/2019) → 25,4% (06/2026); de 2º para 1º. −0,4 p.p. desde 12/2023; Itaú +6,9 em dez anos. A ligação com o agro e o preço (C1-N12) não foram testados | sugere confirmar (o crescimento). Preliminar, sem pré-registro |
| **C4-N12** | O BB recuperou parte do PJ investimento | 15,3; consenso | [A8](analises/a8.md): 29,0% em 06/2026, +4,7 p.p. desde 12/2023. Modalidades PJ de 2016–2019 são pouco confiáveis | sugere confirmar (o fato). Preliminar, sem pré-registro |
| **P50** | Estrangeiros e bancos de montadora são nicho | 11,7; consenso; p = 0,70 | [A1](analises/a1.md), [A8](analises/a8.md): em veículos, Stellantis +3,1 e Volkswagen +3,0 em 2023–2026; no PJ investimento, Volkswagen +3,8. No rural, sem sinal | inconclusivo. Preliminar, sem pré-registro |

### Capital e resultado

| id | Enunciado curto | Conselho (nota; classe; p mediana; desacordos) | Evidência até aqui | Estado |
|---|---|---|---|---|
| **P45** | O capital é a restrição ativa | 12,3; consenso; p = 0,65 | Dossiê F-007: capital principal 11,16% (set/25) → 10,80% (set/26). [A6](analises/a6.md): Basileia de 13,9% em 06/2026, a menor entre os cinco grandes (15,3% a 15,6%). Folga contra o requerimento não calculada | inconclusivo (informa). Preliminar, sem pré-registro |
| **P04** | Sem o agro, o ROE do BB fica no patamar dos pares | 16,3; consenso; p = 0,38 | Só a simulação da administração (dossiê F-015, não auditada). [A6](analises/a6.md): ROE do BB 6,5 a 9,6 p.p. acima dos privados em 2022–2024, com o agro. Sem resultado por segmento | não testada. Preliminar, sem pré-registro |

### Atena, medição e dados (pré-registro leve só em G01 e S01)

| id | Enunciado curto | Conselho (nota; classe; p mediana; desacordos) | Evidência até aqui | Estado |
|---|---|---|---|---|
| **G01** | A exposição fora do Pronaf está em imóvel executável (≥ 4 módulos fiscais) | fora da rodada 1 | [A7](analises/a7_atena_g01_s01.md): M = 47,1% do valor com município (limiar de refutação: < 50%). BB: 53,7%. Cobertura de 29,6% do valor; limites de 13,9% a 84,3%. MS, MT, GO, PI e PA passam; MG, PR, RS e SC falham. `labs/rural/resultados/g01_resultado.json` | **sugere refutar (frágil). Pré-registro leve** |
| **S01** | A surpresa de safra antecipa a inadimplência rural em 2 a 3 trimestres | fora da rodada 1 | [A7](analises/a7_atena_g01_s01.md): contra a ponte nacional, o erro sobe 12,8% (h = 6) e 83,1% (h = 9), com IC acima de zero; contra o clima, −0,3% a +0,3%. `labs/rural/resultados/s01_avaliacao.csv` | **sugere refutar (firme). Pré-registro leve** |
| **R10** | Os nowcasts da camada pública batem o ingênuo em ≥ 10% | fora da rodada 1 | [lab. rural](../../labs/rural/README.md): a ponte nacional corta o erro do último valor em 13% (h = 1 e 2), 10% (h = 3) e 5% a 7% (h = 6 a 12), com IC que não cruza zero. Sem teste de Diebold-Mariano. O modelo com clima não bate. `nowcast_avaliacao.csv` | inconclusivo (passa só no curto prazo). Preliminar, sem pré-registro |
| **F12** | O dado público tem defeitos medíveis nas dimensões da RC 18 | fora da rodada 1 | [README das análises](analises/README.md): 24 problemas de dado catalogados (consistência, comparabilidade, completude). O teste formal nas 12 dimensões não foi rodado | inconclusivo (indício a favor). Preliminar, sem pré-registro |

### Premissas ainda sem teste

- **v0 (31):** P05, P08, P10, P11, P12, P20, P21, P23, P27, P28, P29, P32 a P40, P43, P44, P46 a P49, P51 a P55.
- **Novas do conselho (46 de 72):** entre elas as 15 da cadeira c3, que são previsões com data em 2027 (por exemplo,
  "capital principal acima de 11,5% em set/2027"). Só o tempo as resolve; ficam como placar de previsões.
- **Atena:** G02, G03, S02 a S05 ([`atena-sensores-garantias.md`](../../docs/sources/atena-sensores-garantias.md) §6).
- **Retorno e fundação:** R01 a R09, R11 a R13 ([`roi-dados-ia.md`](../../docs/research/roi-dados-ia.md) §8); F01 a
  F11 ([`fundacao-dados.md`](../../docs/research/fundacao-dados.md) §7).

### Resumo dos estados

| Estado | Premissas |
|---|---|
| Sugere confirmar | P01, P02, P42, P14, P17, P22 (o custo médio), P06, C4-N02, C2-N03, C2-N08, C4-N03, C4-N13, C5-N11, C4-N12, P31 (o crescimento) |
| Sugere refutar | P07, P09 (por UF), P25, C1-N02, C2-N01, C4-N01, C2-N14, **G01 (frágil)**, **S01 (firme)** |
| Inconclusivo | P03, P13, P15, P16, P18, P19, P24, P26, P30, P41, P45, P50, C1-N05, C5-N01, C1-N03, C5-N02, C1-N04, C2-N02, C1-N10, C1-N13, C4-N05, C5-N08, C5-N09, C1-N08, C2-N10, R10, F12 |
| Não testada (das dez de maior valor) | P04 |

## 2. As 15 a testar em seguida

Critério: prioridade de teste do conselho (`prioridade_teste` em `agregado.json`), peso na decisão do plano e custo
do teste. A coluna "onde" diz se o dado público fecha a conta ou se só o dado interno fecha.

| # | Premissas | Por que agora | Teste decisivo | Dado que falta | Onde |
|---|---|---|---|---|---|
| 1 | **P04**, C1-N01, C2-N05 | Separa as duas histórias. C1-N01 tem a maior prioridade do conselho (0,667) | Inadimplência e resultado do BB com e sem o agro, set/25 e set/26. Custo de capital por dado de mercado como régua | Análise do Desempenho e ITR do 3T26 (nota de segmentos); Pilar 3; B3 COTAHIST e curva de juros | público, em parte |
| 2 | **P03** (metade geográfica) | Prioridade 0,600. Decide se o remédio é por região ou por segmento | Curva de concentração do aumento do atraso por município | Município das operações do SICOR fora do complemento (pedido via LAI ao BCB); no banco, atraso por operação | interno fecha |
| 3 | **P02** (modelo ou seleção) | Sustenta a proposta de maior alcance no rural | Rodar de novo com pré-registro: SCR.data como medida principal, SICOR por instituição, por safra de contratação. Dentro do banco: piloto com sorteio | Próxima safra de dados (SICOR e SCR.data de 12/2026); desenho do piloto | interno fecha |
| 4 | **S02** | Separa a tese "clima" da tese "preço e custo". Decide se mais sensor ajuda | Margem por hectare × produtividade, painel UF × safra, fora da amostra | CEPEA (licença CC BY-NC), custos da Conab (portal com TLS quebrado em 28/11), PAM | público |
| 5 | **G02** | G01 é só condição necessária. O valor da garantia depende de prazo e suspensão | Amostra de editais de leilão rural (n ≥ 200): tempo até a arrematação e parcela suspensa, antes e depois da Lei 14.711 | Editais; DataJud; pedidos via LAI ao ONR e ao CNJ | público, manual |
| 6 | **G03** | A garantia só protege se a terra vale mais que a dívida | Variação real do preço da terra e LTV implícito no quartil de UFs de maior inadimplência | VTN da Receita; Deral-PR; IEA-SP | público |
| 7 | **G01** (de novo) | A leitura atual é frágil: cobertura de 29,6% | Mesmo teste com cobertura acima de 80% e limiar fixado por critério jurídico | Município do SICOR (LAI); no banco, CAR ou matrícula por operação | interno fecha |
| 8 | **P22**, C1-N13 | Prioridade 0,622. As análises 4 e 8 divergem na causa | Decomposição mix × preço por instrumento, com ponte da Cosif 2025 | Balancetes Cosif (4010/4016) com despesa por tipo de captação | público |
| 9 | **C2-N04** | Prioridade 0,593. Diz se o BB está ganhando o risco que os outros largam | Participação do BB nas contratações da safra 2026/27 por fonte e porte, mês a mês, contra a safra anterior | Já no laboratório (SICOR, operações de 07/2026 em diante) | público |
| 10 | **P26**, C2-N13 | A vantagem municipal depende de haver ou não cooperativa ao lado | Diferenças em diferenças com tratamento escalonado: entrada de cooperativa e saída de banco | Postos de cooperativas (Unicad); cadastro de agências com datas; IBGE municipal | público |
| 11 | **P15** | O consignado é o produto em que o BB lidera e está mais caro que os entrantes | Variação de participação e de taxa do BB depois do início da portabilidade, com controle | Estatísticas de portabilidade do BCB; IF.data de 12/2026 e 03/2027 | público, com o tempo |
| 12 | **P45**, C1-N07, C2-N07 | Prioridade 0,667. Sem capital, não há como defender tudo | Decomposição da variação do capital principal (lucro, proventos, RWA) e folga contra o requerimento | Pilar 3 (OV1, CC1); proventos na B3 e no IPE | público |
| 13 | **C4-N14**, C1-N09 | Prioridade 0,527. O conselho diverge: custo é ou não é o problema | Índice de eficiência do BB e dos pares na mesma definição, dez anos | DRE do IF.data (o leitor já existe em `_comum.py`) | público |
| 14 | **P14** | Leitura atual usa atraso, não perda | Margem ajustada ao risco com perda efetiva e custo de captação de cada instituição | Baixas a prejuízo por produto; SCR.data | público, em parte |
| 15 | **P11** | Decide se a renegociação cura ou adia | Coorte das operações prorrogadas e renegociadas no SICOR: quanto volta a atrasar em 6 e 12 meses | Já no laboratório (situação por operação) | público |

Reserva: P30 e C2-N10 (um só perímetro, SCR.data por porte), P46 (efeito da Res. 4.966 na provisão), P09 por
município com atraso de 15 a 90 dias, S03 (PortWatch, depois de S02).

## 3. O que o conselho ensinou

Rodada 1: 5 cadeiras, 127 premissas (55 v0 e 72 novas), 254 críticas cegas, 127 réplicas, 3 juízes, agregação por
código. Custo medido nas cadeiras abertas: US$ 4,41. Resultado: 75 em consenso, 52 em disputa, 58 desacordos
abertos. Números abaixo calculados em 28/11/2026 sobre `conselho/R2/r2_*.json` e `conselho/R5/agregado.json`.

### 3.1 A severidade do crítico depende da família

| Cadeira (família) | Críticas | "Mantém" sem mudança | "Descarta" | Limiar manipulável |
|---|---|---|---|---|
| c1 (Claude Opus) | 43 | 1 (2%) | 0 | 37 (86%) |
| c3 (DeepSeek) | 72 | 5 (7%) | 6 | 60 (83%) |
| c4 (Qwen) | 72 | 16 (22%) | 1 | 59 (82%) |
| c5 (Kimi) | 67 | 38 (57%) | 0 | 66 (99%) |
| **Total** | **254** | 60 (24%) | 7 | **222 (87%)** |

- O mesmo texto recebe "mantém" de uma cadeira e "reformula" de outra. O veredito diz tanto sobre o crítico quanto
  sobre a premissa. A cadeira c5 mantém 57% do que lê; a c1, 2%.
- A cadeira c2 escreveu a v0. Não é independente no braço que parte da v0 e não criticou.
- A cadeira c5 (Kimi) entrou no lugar do Gemini, que não tinha chave. Uma primeira saída dela foi descartada
  (`conselho/R1/_descartado_kimi_x3`).

### 3.2 Os limiares são manipuláveis: 222 de 254

Em 87% das críticas, o crítico marcou que o limiar de "confirma" e "refuta" pode ser ajustado depois de ver o dado.
Nas avaliações de limiar gravadas em `agregado.json`, 104 saíram como frouxos, 159 como justos e 12 como apertados. É o achado de método mais importante
da rodada: sem pré-registro, quase qualquer resultado pode ser lido como confirmação.

### 3.3 Os juízes discordam, e de forma sistemática

- **Nível.** Nota média: c1 13,5; c3 14,7; c4 14,7. O juiz c1 é 1,2 ponto mais severo.
- **Dispersão.** Em 51 premissas a diferença entre juízes é de 4 pontos ou mais (máximo: 8, em C3-N02 e C5-N02).
  São quase todas as 52 da classe "disputa".
- **Juiz e autor.** O juiz c4 deu 16,2 às premissas da própria cadeira; os outros dois deram 12,3 e 13,9. O juiz c3
  deu 14,9 às suas; o c1 deu 12,5. As premissas das cadeiras Claude tiveram as maiores notas (17,0), e isso não vem
  do juiz Claude: ele deu 16,1, os outros dois deram 17,0 a 17,7.
- **Premissas novas pontuam mais que as v0** (15,2 × 13,1). As novas têm limiar numérico e data; as v0 são mais
  largas.
- **As probabilidades dizem pouco.** Em 47 das 55 premissas v0, a p mediana fica entre 0,40 e 0,60. A mais alta é
  P06 (0,73); a mais baixa, P10 (0,35).
- **51 dos 58 desacordos são de método** e têm a mesma saída: calibrar os juízes contra nota humana. Os 7 de valor
  de decisão são P19, P23, P43, P49, P52, P53 e P55.

### 3.4 Onde o conselho errou contra o dado

O consenso do conselho não é evidência. Três casos em que a análise foi contra uma premissa de nota alta:

| Premissa | Nota | O que a análise mostrou |
|---|---|---|
| C2-N14 (municípios só BB têm mais depósito barato por real de crédito) | 17,3 | Crédito ÷ depósitos de 1,71, acima da média de 1,61 (A3) |
| C1-N02 (o BB seleciona melhor que o mix prevê, em ≥ 1 p.p.) | 17,0 | Resíduo de +1,1 p.p., sinal contrário (A2) |
| C2-N01 (rural do BB ≤ resto do sistema) | 17,0 | BB um pouco acima nas duas fontes com definição alinhada (A2) |

E um caso em que o conselho apontou certo: a cadeira c1 avisou que "a tese 'é só o agro' não foi testada", e as
cadeiras c2, c4 e c5 pediram o mesmo dado nas lacunas (resultado e custo do crédito por segmento). Segue sem teste
(P04) e é a primeira da lista da seção 2.

## 4. Mudanças de método para a rodada 2

| Mudança | O que é | Por quê |
|---|---|---|
| **Pré-registro (H2)** | Para cada premissa da seção 2: métrica, período, comparação e limiares gravados com data e hash antes de baixar o dado. O modelo é o da Análise 7 | 222 de 254 limiares manipuláveis |
| **Calibração humana** | Uma pessoa dá nota a 10 premissas pela rubrica. Cada juiz é ajustado (nível e escala) contra essa nota | 51 desacordos de método; juízes com 1,2 ponto de diferença de nível |
| **Juiz não julga a própria cadeira** | O juiz fica fora das premissas que a sua família escreveu | c4: 16,2 para as suas, 12,3 e 13,9 dos outros |
| **Severidade normalizada** | O veredito de cada crítico entra como desvio em relação à sua taxa de "mantém" | 2% a 57% de "mantém" conforme a família |
| **Cadeiras Astra e Gemini** | Entram quando houver acesso. A cadeira que escreveu a v0 sai do braço que parte dela | Mais famílias; hoje duas das cinco cadeiras são da mesma família |
| **Enxame** | Várias instâncias por família, com papéis separados: geração, red team, juízes e especialistas por mercado (rural, funding, varejo, PJ) | Um crítico por família confunde o papel com a família |
| **Dossiê aprovado (H1)** | Conferir por amostra na fonte primária; tirar ou marcar os fatos de imprensa (F-011) e os lidos do layout do PDF (F-002, F-005, F-006, F-015) | O dossiê entrou na rodada 1 sem aprovação |
| **R6 com dado** | O conselho lê os resultados contra o pré-registro. Só aí uma premissa muda de estado | Regra de `04-proximos-passos.md` §1 |
| **Placar de previsões** | As premissas com data (cadeira c3) viram previsões a resolver em 2027, com Brier contra o ingênuo | Mede a calibração do conselho com fatos |

## 5. Inconsistências entre os documentos e as análises

Nada foi corrigido nos arquivos de origem. Fica aqui a lista, para a pessoa decidir.

| # | Onde | O que diverge | Leitura |
|---|---|---|---|
| 1 | `00-mapa.md` × A3 × dossiê | Municípios em que o BB é o único banco: **555** (v0, 06/2026), **558** (A3, 08/2026, por agência, sem sedes), **577** (F-019, 08/2026, por saldo de crédito). O conselho usou 577 | Três definições. Fixar uma no pré-registro |
| 2 | A4 × A8 | A4: o custo relativo de captação subiu (P22 sugere confirmar). A8: sem compromissadas, o beta do BB é o 2º menor; o custo maior é mix | Não se contradizem, mas mudam a decisão: o problema não é o preço do depósito. Várias premissas do conselho supõem que é |
| 3 | A1 × A8 | P30: A1 lê "sugere confirmar"; A8 lê "inconclusivo" | Aqui fica inconclusivo, com indício a favor |
| 4 | Conselho × A2 | C4-N01 compara 6,92% (agro do BB) com 9,59% (rural PF do sistema) e conclui carteira melhor. Com definição alinhada, o BB fica acima do sistema | Comparação de definições diferentes |
| 5 | Imprensa × A2 | A administração localiza o problema no Centro-Oeste ([I-02] em `00-mapa.md`). No SICOR, o Centro-Oeste tem 34,4% do aumento e 34,6% da carteira | A concentração é de segmento, não de região |
| 6 | A8, regra do mapa | "Atacar canal" supõe que o entrante ganha por canal e não por aceitar mais risco. A5 mostra o Nubank com 8,4% de vencido contra 4,6% do BB | A própria A8 anota. No varejo PF a premissa da jogada está em dúvida |
| 7 | A1 | P01 "sugere confirmar", mas a queda quase parou em 2023–2026 (−0,3 p.p.) e quem ganhou em 2019–2023 foi a Caixa, que hoje tem 31,2% de atraso no SICOR e perde participação (−1,1) | "Estrutural" pode ser um episódio de política pública. Ver teste 9 |
| 8 | `00-mapa.md` × dossiê e A4 | Depósitos à vista: 22,3% → 17,0% (v0) × 21,49% → 16,63% (F-038). Captações: 18,7% → 14,9% × 18,37% → 14,50%. LCA: as duas pontas de partida (49,4% em 12/2019; 68,6% em 03/2016) aparecem misturadas; A8 escreve 32,5% e A4, 32,6% | Perímetros e datas diferentes. Vale o dossiê |
| 9 | Participação no rural | 53,5% (PF, IF.data), 48,7% (PF + PJ, IF.data), 55,9% (ESTBAN, só bancos). A v0 fala em −6,6 p.p. até 12/2022; a A1, em −8,6 até 12/2023 | Dizer sempre qual recorte |
| 10 | A2 × A7 | Cobertura de município no SICOR: 51% do saldo do BB (A2) × 25,1% do valor contratado (A7) × 0,7% do crédito de fonte não controlada | Medidas diferentes. A menor é a que importa para o crédito de mercado |
| 11 | A6 × dossiê | ROE do BB: 7,1% (1º semestre de 2026 anualizado, contábil, IF.data) × 2,8% no 3T26 e 6,2% no 9M26 (ajustado, release) | Definições e períodos diferentes |
| 12 | `00-mapa.md` × A3 | "2.300 municípios, estável desde 12/2022" × 2.932 em 01/2016. O BB também saiu de municípios; 330 que eram "só BB" ficaram sem agência | A estabilidade é só do período recente |
| 13 | `00-mapa.md` × README das análises | Veículos aparece como ganho (+0,7 p.p.); o README aponta reclassificação em 12/2024 | Não ler como ganho |
| 14 | `ROADMAP.md` × dossiê | "54 fatos conferidos em fonte primária"; F-011 (Bradesco e Nubank) é de imprensa, F-014 é ilustrativo e o dossiê não tem H1 | Ajustar o texto depois de H1 |
| 15 | `03-conselho.md` × rodada | O protocolo previa Gemini na cadeira E; rodou Kimi. Os juízes foram c1, c3 e c4 | Registrado em `cadeiras.json` |
| 16 | A5 | Vencido do cartão do BB: 9,4% (03/2026) → 15,4% (06/2026) em um trimestre | Provável erro de reporte; não usar a ponta |
