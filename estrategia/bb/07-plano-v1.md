# Plano de guerra do Banco do Brasil, v1

Versão para **terça-feira, 01/12/2026**. Escrita em 28/11/2026, com os dados coletados nesse dia.

**Regras.** Só informação pública. Nada interno do BB. Todo número tem fonte, data e arquivo no repositório. Nenhuma
magnitude vem de opinião: o retorno sai de fórmula sobre premissas e aparece como faixa. **Nada aqui é
recomendação.** As propostas da seção 8 são condicionais: cada uma diz de que premissas depende e em que estado elas
estão.

**Estado da evidência.** Todo resultado deste plano é **preliminar e sem pré-registro**, salvo G01 e S01, que
tiveram pré-registro leve. O dossiê de fatos não tem aprovação humana (H1). O estado de cada premissa está em
[`06-estado-premissas.md`](06-estado-premissas.md).

Siglas das fontes: **F-nnn** = fato do dossiê ([`conselho/R0/dossie.json`](conselho/R0/dossie.json)); **A1 a A8** =
análises ([`analises/README.md`](analises/README.md)); participações calculadas sobre o IF.data pela camada
`data/ifs/`.

---

## 1. Sumário em uma página

O BB vive duas histórias ao mesmo tempo. Os remédios são diferentes, e o plano as separa.

**História 1, aguda: o ciclo do agro.** Consome lucro e capital agora.

**História 2, lenta: perda de participação.** Começou antes do ciclo e continua. O agro a esconde.

| # | Número | Fonte e data |
|---|---|---|
| 1 | Lucro líquido ajustado de **R$ 1,3 bi** no 3T26 (−66,5% em um ano); R$ 8,6 bi em nove meses (−42,4%) | F-001, Apresentação do 3T26, CVM IPE, 11/11/2026 |
| 2 | Projeções de 2026 revistas: custo do crédito de R$ 65–70 bi para **R$ 80–83 bi**; lucro de R$ 18–22 bi para **R$ 9–11 bi** | F-008, fato relevante de 11/11/2026, CVM IPE |
| 3 | Inadimplência acima de 90 dias do agro do BB: 4,84% (set/25) → **6,92%** (set/26). Carteira agro de R$ 403,6 bi | F-006, Apresentação do 3T26 |
| 4 | Capital principal: 11,16% (set/25) → **10,80%** (set/26). Basileia: 14,81% → 13,45% | F-007, Apresentação do 3T26 |
| 5 | Inadimplência do crédito rural PF no sistema: 0,80% (out/22) → **9,59%** (out/26); na parcela a taxa de mercado, 0,51% → **17,21%** | F-012, SGS 21148 e 21146, BCB |
| 6 | Participação do BB no crédito PF + PJ: 19,0% (03/2016) → **13,8%** (06/2026). Ganharam digitais (+6,2 p.p.) e cooperativas (+4,8) | A1, IF.data via `data/ifs/shares/national_ifdata.csv` |
| 7 | Rural PF: 62,35% (12/2019) → **53,46%** (06/2026). A queda se deu em 2019–2023; quem mais ganhou foi a Caixa (+6,7 p.p.) | F-021 e A1 |
| 8 | LCA: 49,38% → **32,55%**. Depósitos à vista: 21,49% → **16,63%**. Captações totais: 18,37% → 14,50% (12/2019 → 06/2026) | F-042, F-038, F-044 |
| 9 | Comércio exterior PJ: 18,42% → **25,43%**, de 2º para 1º. É o único produto grande em que o BB ganhou | F-031 e A8 |
| 10 | Nas mesmas células de UF, porte, programa e fonte, o atraso rural do BB fica **7,5 p.p.** acima do das cooperativas (IC 95%: 6,6 a 8,8; 09/2026) | A2, SICOR, `data/rural/a2/mix_bb_menos_coop_sicor.csv` |

**O que a rodada 1 mudou em relação à v0.**

1. A perda de participação é de competição, não de composição: o efeito competitivo explica 132% da queda em dez
   anos (A1).
2. No rural, o problema do BB é de **segmento**, não de região: 94,5% do aumento do atraso está em médio e grande
   produtor e 64,3% em recursos a taxa de mercado. Por UF, o aumento acompanha a carteira (A2).
3. Três apostas do lado "lutar" não passaram: quem cresceu rápido não tem atraso pior (P07), a surpresa de safra não
   antecipa a inadimplência (S01), e a garantia de imóvel não serve como regra nacional (G01, frágil).
4. O custo de captação do BB subiu frente aos pares (A4), mas a causa medida é o peso das operações compromissadas,
   não o preço do depósito (A8).
5. A tese "sem o agro, o banco vai bem" (P04) **segue sem teste**. É a primeira da fila.

---

## 2. Diagnóstico validado

### 2.1 Onde o BB era forte e perde, para quem e desde quando

| Mercado | BB: de → para | Para quem | Quando | Fonte |
|---|---|---|---|---|
| Crédito PF + PJ | 19,0% → 13,8% | Digitais +6,2; cooperativas +4,8 | 2016–2019 para os privados grandes (+7,3, depois devolvidos); 2019–2026 para cooperativas e digitais | A1 |
| Rural PF | 61,9% → 53,5% | Caixa +6,7 e Basa +2,0 em 2019–2023; cooperativas +5,7 em 2016–2019 e +2,3 em 2023–2026 | Quebra estimada em 12/2020 (p = 0,037). Quase parou em 2023–2026 (−0,3) | A1 |
| Pessoal sem consignação | 26,6% → 14,0% | Nubank +15,1; Mercado Pago +3,6 | Contínuo; −2,7 p.p. desde 12/2023 | A1, A5 |
| Cartão | 13,8% → 9,4% | Nubank +15,5; Mercado Pago +4,2. Os privados grandes perderam 21,1 | Contínuo | A1 |
| Consignado | 22,5% → 19,2% (ainda 1º) | C6 +5,2; Agibank +3,5; BTG +2,9 | Contínuo, lento | A1, A5 |
| Habitação | 7,5% → 3,2% | Itaú +4,4; Bradesco +3,4 | Carteira do BB encolhe 1,7% ao ano desde 12/2023 | A5 |
| PJ capital de giro | 23,0% → 10,9% | Sicoob +6,6; Sicredi +5,7 | −6,1 p.p. só desde 12/2023 (parte é antecipação de recebíveis entrando no relatório) | A1 |
| LCA | 68,6% → 32,6% | Cooperativas +17,9 | −7,4 p.p. só desde 12/2023 | A4, A8 |
| Depósitos à vista | 19,9% → 16,6% | Sicredi +7,1; Sicoob +5,4 | Saldo do BB −20,8% desde 12/2023, com o sistema estável | A4 |
| Sul (tomador) | 21,2% → 13,3% | Cooperativas +10,9 | Contínuo | A1 |

Datas: 03/2016 → 06/2026, IF.data. As tabelas completas estão em [`analises/a1.md`](analises/a1.md) e
[`analises/a4.md`](analises/a4.md).

**Resultado em dez anos (A6, IF.data, ROE contábil aproximado).** O BB teve dois ciclos. Em 2022–2024 rendeu 6,5 a
9,6 p.p. acima dos três privados grandes e chegou a 20,5% do lucro do grupo de 13 (2023). Em 2025 caiu para 10,3% e
no 1º semestre de 2026, para 7,1% anualizado: 12º de 13 em ROE. Tem a menor folga de capital entre os cinco grandes
(Basileia de 13,9% em 06/2026, contra 15,3% a 15,6%).

**Poder de preço (A8).** A margem do BB sobre o custo marginal (índice de Lerner) ficou em 0,18 a 0,23 desde 2017.
Está na mediana dos bancos. A do Nubank está em 0,34 a 0,42. No crédito pessoal, o Nubank cobra 107% ao ano e o BB,
61%; o atraso é de 8,4% contra 4,6% (A5, 2026). **No crédito pessoal, o BB perdeu participação sendo mais barato.** No capital de giro foi o contrário: o BB passou
de mais barato (percentil 8 em 2019) para acima da mediana (percentil 58 em 2023) e perdeu 6,1 p.p. em 2023–2026 (A5). Entre instituições,
preço menor não explica quem ganhou (correlação de −0,31 a +0,36 em todos os produtos).

### 2.2 Onde o BB ganha

| Onde | Número | Ressalva | Fonte |
|---|---|---|---|
| Comércio exterior PJ | 13,7% → 25,4%, 1º | −0,4 p.p. desde 12/2023; o Itaú ganhou 6,9 em dez anos | A1, A8 |
| Municípios em que é o único banco com agência | 558 em 08/2026 (437 em 12/2022). Depósitos de varejo ali: +14,4% desde 12/2022, contra −3,3% onde nada mudou | O dado não vê cooperativas. São 6,3% dos depósitos de varejo do BB | A3 |
| Preço do depósito | Na alta de juros de 2021–2023, sem compromissadas, o BB repassou 0,57 do CDI: 2º menor entre os grandes (privados 0,62) | A participação nos depósitos cai | A8 |
| Risco no varejo PF | Atraso de 4,6% no pessoal (sistema 6,4%) e de 0,53% no consignado (sistema 1,37%) | Atraso de 15 dias, não perda | A5 |
| PJ investimento | 29,0%, +4,7 p.p. desde 12/2023 | Série PJ de 2016–2019 pouco confiável | A8 |

### 2.3 O que o diagnóstico ainda não tem

- Resultado e capital por segmento (P04). Sem isso, não se sabe quanto do problema é agro.
- Margem por produto. Sem ela, "manter" e "atacar" não têm conta de retorno.
- Cooperativas por município. Sem elas, a vantagem da rede não se mede.

---

## 3. Panorama 1, Atena: lutar ou recuar no crédito rural

**Pergunta.** O BB defende e reprecifica a carteira rural (lutar) ou sai do risco que não controla (recuar)?

### 3.1 A tabela de evidência

| Premissa | Estado | Número | O que diz para "lutar" | O que diz para "recuar" |
|---|---|---|---|---|
| **P01** a perda no rural é estrutural | sugere confirmar | −1,9 p.p. ao ano em 2019–2023; quebra em 12/2020 | A posição já não era defendida antes do ciclo | A favor. Mas a queda parou em 2023–2026, e quem ganhou (Caixa) hoje tem 31,2% de atraso no SICOR |
| **P02** cooperativas têm atraso menor nas mesmas células | sugere confirmar | 7,5 p.p. (6,6 a 8,8) em 09/2026; era 1,1 em 12/2023 | A favor, se a causa for o modelo: alguém empresta nas mesmas células com atraso muito menor | A favor, se a causa for seleção: os melhores clientes já estão com as cooperativas |
| **P42** o BB não seleciona melhor que o sistema | sugere confirmar | resíduo de +1,1 p.p. (−0,8 a +3,1) | Há o que melhorar na seleção | A vantagem de dados no rural não aparece |
| **P03** a inadimplência é concentrada | inconclusivo | 94,5% do aumento em médio e grande; 64,3% a taxa de mercado (37,1% da carteira). Por UF, proporcional | O alvo é um segmento, não uma região | O recuo, se houver, é de um segmento e não do rural inteiro |
| **P07** quem cresceu rápido sofre mais | sugere refutar | Spearman 0,11 (p = 0,39; n = 71) | Contra: não dá para contar com o recuo dos que cresceram | — |
| **P09** o clima prevê a inadimplência (por UF) | sugere refutar | o modelo com clima erra 8% a 75% mais que o último valor em 6 e 9 meses | Contra: por UF, sensor de clima não entra no preço | A favor: o risco é pouco previsível neste recorte |
| **S01** a surpresa de safra antecipa | **sugere refutar (firme, pré-registro leve)** | erro +12,8% e +83,1% contra a ponte nacional | Contra | A favor, em parte: o choque de 2023–2026 parece de preço e juro (S02, sem teste) |
| **G01** a exposição está em imóvel executável | **sugere refutar (frágil, pré-registro leve)** | 47,1% do valor (limiar: 50%); BB 53,7%; cobertura de 29,6% | Só onde o imóvel é grande: MS, MT, GO, PI, PA | Em MG, PR, RS e SC (36% do valor fora do Pronaf do BB), a garantia de imóvel vale menos |
| P05, P11, P45 | não testadas | — | — | São as três premissas do lado "recuar" que faltam |

Fontes: A1, [A2](analises/a2.md), [A7](analises/a7_atena_g01_s01.md), [laboratório rural](../../labs/rural/README.md).

**Leitura.** Nenhuma das duas posições tem as suas premissas de pé. A evidência aponta para um desenho por
segmento:

- o aumento do atraso está no **médio e grande produtor a taxa de mercado**. Ali o atraso do BB é de 18,8%, contra
  7,0% nos recursos controlados (SICOR, 09/2026);
- a garantia de imóvel só ajuda em parte do país;
- os sensores de safra e de clima, por UF, não antecipam o atraso.

Isso é uma hipótese de desenho, não uma conclusão. Vira proposta condicional na seção 8 (PC-2, PC-3, PC-4).

### 3.2 O monitor: o que o dado sustenta hoje

O protótipo ([`labs/rural/nowcast.py`](../../labs/rural/nowcast.py)) prevê a inadimplência rural acima de 90 dias
por UF (SCR.data). O que funciona é simples: a **ponte nacional** (a UF acompanha o mês seguinte do país, SGS
21148). Ela corta o erro do último valor em 13% a um e dois meses e em 5% a 7% de seis a doze meses, com intervalo
que não cruza zero. O modelo com clima, preços e Selic não bate o último valor no período todo.

A previsão de 12 meses é "fica onde está, com risco para cima". Exemplos (origem 09/2026, faixa p10–p90 para
09/2027): GO 12,6% (12,1–16,0); MT 8,1% (7,5–11,5); MS 12,1% (11,6–15,5); RS 5,1% (4,5–8,5). Arquivo:
`labs/rural/resultados/nowcast_previsao_uf.csv`.

### 3.3 A escada de sensores: quais degraus pagam

| Degrau | O que mede | Custo | Resultado | Decisão sugerida |
|---|---|---|---|---|
| 1 | Inadimplência e saldo por UF (SGS, SCR.data, SICOR, IF.data) | grátis | A ponte nacional bate o ingênuo | **Paga. Manter** |
| 2 | Clima por UF (NASA POWER) | grátis | Não bate o ingênuo no período todo; bate só em 2025–2026 a um mês | **Não paga por UF.** Fica como protótipo; testar por município |
| 3 | Safra e preço (LSPA, PAM, Conab, CEPEA) | grátis, com licença para o CEPEA | Safra por UF: S01 refutada. Margem (S02): sem teste | **Safra não paga.** Testar a margem antes de subir |
| 4 | Comercialização (PortWatch, Comex Stat, line-ups) | grátis, com atrito | Sem teste (S03) | Só depois de S02 |
| 5 | Logística global (AIS, alfândega da China) | pago (a partir de € 330) | Sem teste (S04) | Não comprar antes de S03 |
| 6 | Satélite por município (MODIS, Sentinel) | grátis; dezenas de GB por ano | Sem teste (S05) | Depois de S02. Se o choque é de preço, mais sensor de lavoura não ajuda |

Regra mantida: só se sobe um degrau quando o de baixo não basta. Hoje o limite não é o sensor, é o **recorte**: o
dado público não tem atraso por banco e município. Com o dado interno, os degraus 2 e 3 podem ser testados por
município. Detalhe das fontes em
[`atena-sensores-garantias.md`](../../docs/sources/atena-sensores-garantias.md).

### 3.4 Garantias: a lei e a prática

| Na lei | Na prática |
|---|---|
| Lei 13.986/2020: o patrimônio rural em afetação fica fora da recuperação judicial | STF, Tema 961: a pequena propriedade rural (menos de 4 módulos fiscais) é impenhorável mesmo dada em garantia. Decisão de 21/09/2026 estende o raciocínio à alienação fiduciária |
| Lei 14.711/2023: execução extrajudicial da hipoteca; o saldo remanescente segue devido | STJ, Súmula 298: o alongamento da dívida rural é direito do devedor |
| STF, Tema 982 (2023): a execução extrajudicial é constitucional | Liminares de 2026 suspenderam leilões de fazendas em GO, MT e RO |
| — | Renegociação por medida provisória em série (MP 1.314/2025; MP 1.376/2026) |

A jurisprudência foi lida por busca e notícia oficial, não no inteiro teor. **Não há base pública de leilões, prazos
ou valores de recuperação de imóvel rural.** G01 mede só a condição necessária (o imóvel é grande o bastante para
ser executado). G02 (prazo e suspensão) e G03 (preço da terra) não foram testadas. Sem elas, não se dá à garantia
nenhum efeito sobre a perda.

---

## 4. Panorama 2: as vantagens injustas

**Pergunta.** Onde o BB tem algo que os outros não copiam a custo razoável?

O ranking por valor **não pode ser feito de fora**: falta a margem por produto e por município. O que o dado público
permite é ordenar por evidência de que a vantagem existe e por tamanho da ameaça.

| Candidata | Evidência de que existe | O que a ameaça | Estado |
|---|---|---|---|
| **Comércio exterior** | 13,7% → 25,4%, de 2º para 1º; um dos poucos mercados em que a concentração subiu (A8) | Itaú (+6,9 em dez anos); −0,4 desde 12/2023. Não se sabe se o ganho veio com desconto de preço (C1-N12) nem se depende do agro (P31) | P31: sugere confirmar (o crescimento) |
| **Rede em municípios sem outro banco** | 558 municípios; R$ 36,8 bi de depósitos e R$ 62,8 bi de crédito (R$ 39,0 bi rural) em 08/2026; cresce mais que o resto (A3) | Cooperativas, que o dado não vê. Quando um banco privado sai, os depósitos do BB **não** sobem. 330 municípios que eram "só BB" ficaram sem agência desde 2016 | P26: inconclusivo |
| **Franquia de depósitos** | Beta de 0,57 sem compromissadas, 2º menor entre os grandes (A8). Poupança estável em 20,7% | Depósitos à vista: saldo −20,8% desde 12/2023. LCA: −7,4 p.p. desde 12/2023. No estresse, o depósito não correu para o BB (P25 sugere refutar) | P22 e P06: sugerem confirmar |
| **Consignado e folha** | 1º, com 19,2%; atraso de 0,53% contra 1,37% do sistema (A5) | Preço: do percentil 29 (2019) para 56 (2026) no consignado público; 25,2% ao ano contra 20,7% do Nubank. Portabilidade | P15: inconclusivo, com sinal de vulnerabilidade |
| **Liderança no rural** | 53,5% do rural PF; líder em 22 UFs no ESTBAN (A8) | Não vira melhor seleção (P42). Atraso 7,5 p.p. acima das cooperativas nas mesmas células | P42: sugere confirmar |
| **Disciplina de risco no varejo** | Atraso menor que o do sistema no pessoal e no consignado | É também o motivo da perda de participação: quem ganhou aceita mais risco e cobra mais (P14) | P14: sugere confirmar |
| Relação com o setor público; agro fora do crédito; marca | Sem teste (P12, P27, P28, P29) | — | não testadas |

Duas leituras que mudam a conversa:

1. **A vantagem de depósito existe no preço, não no volume.** O BB paga pouco pelo depósito que tem, e tem cada vez
   menos.
2. **Uma premissa de nota alta no conselho não passou.** Os municípios "só BB" têm *menos* depósito de varejo por
   real de crédito (razão de 1,71 contra 1,61 no total), não mais. Eles são praça de crédito rural, não de captação.

---

## 5. Panorama 3: a tomada hostil

**Pergunta.** Mercado por mercado, o que seria preciso para liderar? É um modo de mapear tudo, não uma recomendação.
Os limites concorrenciais entram como restrição.

**O terreno (A8, IF.data, 03/2016 → 06/2026).**

- A concentração caiu em 36 de 40 séries. No crédito total, o HHI foi de 1.203 para 949 pontos. A conta bate com o
  Relatório de Economia Bancária de 2023 do BCB.
- Só seis mercados seguem com concentração elevada: habitação, rural, infraestrutura, PJ habitacional, poupança e
  LCI. Todos têm crédito direcionado ou captação com regra.
- A maior desconcentração está onde o BB perdeu: na LCA, de 4.812 para 1.473 pontos.

**O mapa.** São 37 mercados, cada um com a jogada candidata que uma regra mecânica dá, a premissa que teria de ser
verdade e o dado que a testa. Arquivo: `analises/out/a8_mapa_mercados.csv`; resumo em
[`analises/a8.md`](analises/a8.md) §5.

| Jogada | Mercados | Exemplos | Premissa que teria de ser verdade |
|---|---|---|---|
| **Atacar canal** | 16 | Pessoal, cartão, capital de giro, PJ pequena e média, Sul, Nordeste, depósitos à vista, LCA, poupança | O entrante ganha por canal (presença, experiência, custo de servir), não por aceitar mais risco |
| Atacar produto | 13 | Consignado, habitação, veículos, recebíveis, PJ rural, LCI, depósitos a prazo | Falta produto ou oferta, não distribuição |
| Manter | 7 | Rural PF, PJ investimento, comércio exterior, Centro-Oeste | A posição paga o custo de capital do produto |
| Sair (rever presença) | 1 | PJ micro | Sinal fraco: o número vem de reclassificação. Não ler |
| Comprar | 0 | — | — |
| Atacar preço | 0 | — | — |

**Por que "comprar" não dispara.** Onde o BB é pequeno e o mercado é concentrado, quem concentra é a Caixa ou o
BNDES. Não há alvo privado com 3% ou mais: o maior é o Inter, com 0,7% da habitação e 2,3% da LCI. E nos mercados
em que há alvo, a compra elevaria o HHI acima da referência de 200 pontos citada para o CADE, lida em fonte
secundária (consignado com o C6: +202; pessoal com o Nubank: +422).

**Por que "atacar preço" não dispara.** O BB ficou mais caro (consignado: percentil 32 → 50; capital de giro:
14 → 38), mas segue na mediana ou abaixo. E preço menor não explicou ganho de participação em nenhum produto (A5).
Nada aqui sustenta que baixar preço devolve participação.

**A ressalva que pesa.** A premissa de "atacar canal" está em dúvida no varejo PF: o Nubank tem atraso de 8,4%
contra 4,6% do BB. Ali o entrante ganha aceitando mais risco *e* cobrando mais. Nos mercados em que quem ganha são
as cooperativas (giro, depósitos à vista, LCA, Sul), a premissa não foi testada: falta o dado de pontos de
atendimento.

---

## 6. Camada de conhecimento: Radar Febraban × mundo

Documento: [`radar-febraban-vs-mundo.md`](../../docs/research/radar-febraban-vs-mundo.md) (28/11/2026). Compara 45
temas: as 35 tecnologias do Radar de Tecnologias 2026 da Febraban e 10 que o mundo trata e o Radar não. Vereditos:
21 alinhados, 8 em que o Radar está atrasado, 6 superestimados e 10 ausentes.

| Lacuna | Veredito | Por que importa para este plano |
|---|---|---|
| Seguro paramétrico e risco climático no crédito agro | atrasado e ausente | É o tema do Atena. A evidência daqui (P09 e S01 por UF) pede cautela: testar antes de comprar |
| Open Finance para crédito e preço | ausente | Só 7% dos bancos dizem extrair benefício significativo. Liga-se à portabilidade (P15) e ao fluxo de dados (P36) |
| Medir o valor de dados e IA | ausente | O setor mede pouco (8% por receita). É a seção 7 deste plano |
| Golpe autorizado e conta-mula no Pix | atrasado e ausente | Perda que cresce com o pagamento instantâneo |
| Saída do mainframe com IA | ausente | O núcleo bancário está 62% fora da nuvem; o legado é a barreira mais citada pelos próprios bancos |
| Depósito tokenizado e resposta às stablecoins | atrasado e superestimado | Toca a captação (P22). O Radar recomenda o Drex, cuja plataforma o BCB desligou em 11/2025 |
| Pagamentos por agentes de IA | atrasado | O Radar classifica como "conceitual"; já há volume em produção fora e no Brasil |
| Migração para criptografia pós-quântica | atrasado | Prioridade média ou alta em só 8% dos bancos |
| Modelo fundacional de transações; segurança de agentes de IA | ausente; atrasado | Insumos de crédito, fraude e oferta |

Por que importa: um radar curado orienta orçamento. Onde ele está atrasado ou omisso, o banco que só o segue chega
tarde. Cada lacuna tem uma ficha de aplicação com premissa e modo de medir (seção 5 do documento). Os números desta
tabela vêm das fontes citadas lá; nenhuma é dado interno.

---

## 7. Fundação: dados e medição de retorno

### 7.1 Dados

Documento: [`fundacao-dados.md`](../../docs/research/fundacao-dados.md).

- **O mandato já existe.** A Resolução Conjunta CMN/BCB 18, de 28/11/2025, obriga a ter política de qualidade das
  informações prestadas ao BCB. Cita o BCBS 239, define 12 dimensões, exige governança com o conselho, inventário,
  testes e um diretor responsável. O prazo de adequação é **31/12/2026**.
- **O histórico é ruim.** Em 11/2023, só 2 de 31 bancos globais sistêmicos cumpriam todos os princípios do
  BCBS 239, quase oito anos depois do prazo. As causas que os supervisores citam são de governança e dono, não de
  tecnologia.
- **O custo de não fazer é medido em multas** (casos públicos no documento). **O benefício positivo tem evidência
  fraca**: não há estudo causal ligando conformidade a resultado.

Opções do programa "na marra", com o que a evidência sustenta:

| Opção | Versão "na marra" | Força da evidência |
|---|---|---|
| Mandato do conselho | Metas de qualidade com o mesmo peso de capital e liquidez | forte (norma) |
| Dono por domínio | Dono responde pela meta no scorecard; sem dono, o dado não entra em decisão | forte (norma); fraca (efeito do incentivo) |
| Começar pelas decisões | 100 a 300 elementos críticos das maiores decisões e dos reportes | média |
| Integração obrigatória | "Sem contrato, sem ingestão"; "sem dado certificado, sem modelo em produção" | fraca a média |
| Prova do relatório ad hoc | Exercício trimestral: agregar a exposição a um choque novo em até um dia útil | forte |
| Cadastro único de cliente e grupo econômico | Registro de ouro com grupo e ligações produtor, cooperativa e cadeia | forte (norma) |

A lista completa (dez opções) e a sequência em fases estão no §6 do documento. A regra de sequência: primeiro o que
o regulador exige e o que sustenta capital e provisão; a arquitetura vem depois do mandato e do dono.

A ligação com este plano é direta. As duas maiores lacunas do diagnóstico (atraso por município e margem por
produto) são perguntas de dado integrado. O teste da "prova ad hoc" pode ser exatamente o P03: a exposição e o
atraso do agro por município e cadeia, em um dia.

### 7.2 Como o retorno será medido

Documento: [`roi-dados-ia.md`](../../docs/research/roi-dados-ia.md).

1. **Cada proposta usa uma fórmula do playbook** (§6.2 do documento): oito tipos de iniciativa, cada um com
   métrica, desenho, tamanho de amostra e tempo até a leitura.
2. **Cada premissa é uma distribuição, não um número.** O retorno sai por simulação e aparece como P10, P50 e P90,
   com a probabilidade de valor negativo.
3. **A priori vem de estudo rigoroso.** Número autodeclarado entra só como teto.
4. **Quando chega um teste, a premissa é atualizada** (regra de Bayes; fórmula no §7 do documento). O intervalo
   encolhe.
5. **Estados:** hipótese → apoiada → confirmada (o intervalo exclui o ponto de virada) → refutada.
6. **O que testar primeiro:** a premissa que mais mudaria a decisão, pelo custo do teste.

De fora, a medição usa substitutos públicos (participação, atraso por célula, taxa por instituição). O experimento
com sorteio só existe dentro do banco.

---

## 8. Propostas condicionais

São oito. Seguem o modelo de [`04-proximos-passos.md`](04-proximos-passos.md) §2, em forma compacta. **Nenhuma é
recomendação.** Em todas:

- "premissa" depois de um termo quer dizer que só o dado interno ou um experimento dá o valor;
- "derivado" quer dizer conta feita aqui sobre números das análises;
- o custo é qualitativo quando não há número público.

### PC-1. Monitor de risco rural nos degraus que pagam

- **Motivação.** A ponte nacional corta o erro do último valor em 13% a um e dois meses. Ponderado pela carteira, o
  corte é de 43% a um mês (erro de 0,101 contra 0,178 p.p.). O modelo com clima não bate; a safra piora
  (laboratório rural, A7).
- **Premissas.** R10: inconclusivo (passa só no curto prazo). P09: sugere refutar por UF. S01: sugere refutar
  (pré-registro leve). S02: não testada.
- **Retorno.** `valor = Σ decisões 1[mudou] × (valor_nova − valor_padrão)`. Não há ganho de caixa direto. O valor
  está em decisões de limite e de provisão tomadas um a dois meses antes. Quantas decisões mudam: premissa.
- **Ponto de virada.** Se o ganho sobre o ingênuo cair abaixo de 3% fora da amostra (limiar de refutação de R10),
  o monitor não se vende como previsão.
- **Custo.** Baixo: dado grátis, código pronto. Com dado interno: integração por município.
- **Medição.** Placar de previsões contra o ingênuo, por origem; diário de decisões com registro prévio.
- **Etapas.** (1) Rodar mensal com o dado público e guardar as safras de dados. (2) Trocar o alvo pelo atraso
  interno por município. (3) Só então testar os degraus 2 e 3 de novo.

### PC-2. Política de garantias por região

- **Motivação.** G01: no crédito com município, 47,1% do valor fora do Pronaf está em município de imóvel grande
  (BB: 53,7%). MS, MT, GO, PI e PA passam. MG, PR, RS e SC falham e somam R$ 253 bi, 36% do valor fora do Pronaf do
  BB nas safras 2020/21 a 2025/26 (A7, SICOR e CAR).
- **Premissas.** G01: sugere refutar como regra nacional (frágil, pré-registro leve). G02 e G03: não testadas.
- **Retorno.** `ganho = Σ_r EAD_r × PD_r × (LGD_sem,r − LGD_com,r) − custo de constituição`.
  - `EAD_r`: valor contratado por UF (`labs/rural/resultados/g01_por_uf.csv`); público.
  - `PD_r`: substituto público, inadimplência acima de 90 dias por UF em 09/2026: GO 11,4%; MS 10,9%; MT 7,3%;
    MG 5,3%; RS 4,6%; PR 4,3% (SCR.data).
  - `LGD_sem − LGD_com`: **premissa**. Não há dado público de recuperação.
- **Ponto de virada.** Se mais de 50% das execuções forem suspensas ou o prazo mediano passar de 24 meses (limiar
  de refutação de G02), a diferença de LGD tende a zero e a proposta cai.
- **Custo.** Jurídico e de cartório por operação; risco reputacional de retomar fazendas (qualitativo).
- **Medição.** Recuperação por operação com e sem a garantia nova, por safra de contratação. De fora: amostra de
  editais.
- **Etapas.** (1) Testar G02 e G03. (2) No banco, cruzar garantia e CAR por operação. (3) Piloto nas UFs que
  passam. Onde não passa: seguro, penhor de safra, CPR e limite por produtor.

### PC-3. Reprecificar e limitar o crédito rural a taxa de mercado para médio e grande produtor

- **Motivação.** Do aumento do atraso do BB entre 12/2023 e 09/2026 (R$ 32,1 bi), 64,3% vieram de recursos não
  controlados, que são 37,1% da carteira. Atraso de 18,8% ali, contra 7,0% nos controlados (A2, SICOR).
- **Premissas.** P03: inconclusivo (a metade de segmento passa). C2-N03: sugere confirmar. P42: sugere confirmar.
  P05 e P45: não testadas.
- **Retorno.** `Δresultado = E_m × (Δspread − ΔPD × LGD) − ΔE_m × margem`.
  - `E_m` ≈ R$ 124 bi (derivado: saldo em atraso de R$ 38,0 bi ÷ 11,36% × 37,1%).
  - `ΔPD`: teto público de 11,8 p.p. (18,8% − 7,0%, em atraso do SICOR, não em perda).
  - Spread de equilíbrio: `Δspread* = ΔPD × LGD`. Para cada 10 p.p. de LGD, cerca de 1,2 p.p. de spread.
  - `LGD`, `margem` e a queda de volume `ΔE_m`: **premissa**.
- **Ponto de virada.** Se o tomador a taxa de mercado for o mesmo do crédito controlado, o risco é do produtor e
  não da linha. Aí o instrumento é limite por produtor, não preço por linha.
- **Custo.** Margem perdida no volume que sai; reação de clientes que também têm crédito direcionado.
- **Medição.** Atraso por safra de contratação, a taxa de mercado, antes e depois. De fora: SICOR por fonte e
  porte, todo mês.
- **Etapas.** (1) Testar C2-N04: o BB está ganhando participação nas contratações novas a taxa de mercado? (2) No
  banco, abrir por produtor. (3) Piloto de preço e limite em faixas aprovadas.

### PC-4. Piloto de mecanismos de cooperativa no crédito rural

- **Motivação.** Nas mesmas células, o atraso do BB fica 7,5 p.p. acima do das cooperativas (6,6 a 8,8). Era 1,1 em
  12/2023. Em outra fonte e outra definição (SCR.data, mais de 90 dias), 4,7 p.p. (A2).
- **Premissas.** P02: sugere confirmar. O dado público **não separa** modelo (limite por produtor, gerente local,
  acompanhamento) de seleção de cliente.
- **Retorno.** `ganho = E_piloto × f × (a_BB − a_coop) × LGD − custo do piloto`.
  - `a_BB − a_coop`: 7,5 p.p. É **teto**, não expectativa.
  - `f`, a fração do hiato que o modelo explica: **premissa**. Vai de 0 (é tudo seleção) a 1.
  - Ordem de grandeza do teto: sobre um saldo de cerca de R$ 335 bi (derivado), 7,5 p.p. (6,6 a 8,8) são cerca de
    R$ 22 a 30 bi de saldo em atraso, antes de `f` e de `LGD`.
- **Ponto de virada.** `f* = custo ÷ (E_piloto × 7,5 p.p. × LGD)`. Se o piloto medir `f` abaixo disso, encerra.
- **Custo.** Pessoas em campo e mudança de alçada (qualitativo).
- **Medição.** Entrada escalonada por praça, com sorteio da ordem. Atraso de 15 a 90 dias em 6 e 12 meses.
- **Etapas.** (1) Pré-registrar P02 e rodar de novo. (2) Piloto em praças sorteadas. (3) Escala só se o intervalo
  de `f` excluir `f*`.

### PC-5. Funding: tratar o mix antes do preço

- **Motivação.** O custo de captação do BB frente aos pares piorou 7,8 p.p. do CDI entre 2017–2019 e 2022–2024
  (A4). Mas, sem compromissadas, o BB repassa 0,57 do CDI, contra 0,62 dos privados. As compromissadas são 42,7% do
  saldo do BB, contra 25,6% (A8).
- **Premissas.** P22: sugere confirmar (o custo médio). P06: sugere confirmar. P25: sugere refutar.
- **Retorno.** `Δcusto = S × [Σ_i (w_i,BB − w_i,ref) × c_i + Σ_i w_i,ref × (c_i,BB − c_i,ref)]`. O primeiro termo é
  mix; o segundo, preço.
  - Pesos `w`: públicos (IF.data).
  - Custo por instrumento `c_i`: **premissa** até a leitura dos balancetes Cosif.
- **Ponto de virada.** Se as compromissadas financiam uma carteira de títulos casada, o custo médio maior não é
  perda de franquia, e P22 deixa de pedir ação. Se o segundo termo for positivo, o problema é preço e o plano muda.
- **Custo.** Defender depósito à vista e LCA pelo canal custa rede e atendimento (qualitativo).
- **Medição.** Custo por instrumento contra os pares, por semestre; participação em depósitos à vista e LCA.
- **Etapas.** (1) Decomposição com os balancetes. (2) Só depois, meta por instrumento.

### PC-6. Mapa de prioridade municipal

- **Motivação.** O BB é o único banco com agência em 558 municípios, com R$ 36,8 bi de depósitos e R$ 62,8 bi de
  crédito. Bradesco, Itaú e Santander saíram de 368, 259 e 193 municípios onde o BB está, desde 12/2022 (A3).
- **Premissas.** P26: inconclusivo. C2-N14: sugere refutar. A saída de um concorrente **não** elevou os depósitos
  do BB.
- **Retorno.** `valor_m = Dep_m × (CDI − c_dep) + Créd_m × margem_m − custo fixo_m`, para cada município.
  - `Dep_m` e `Créd_m`: públicos (`analises/out/a3_municipios_ultimo_mes.csv`).
  - Margem e custo por agência: **premissa**.
- **Ponto de virada.** Se houver cooperativa na maioria dos 558 (C2-N13, sem teste), a exclusividade é menor do
  que parece e a classe "defender" encolhe.
- **Custo.** Custo fixo da rede (qualitativo).
- **Medição.** Depósitos e crédito por classe de município, todo mês, contra municípios parecidos.
- **Etapas.** (1) Juntar os postos de cooperativas e o IBGE. (2) Estimar o efeito de entrada e saída. (3) Só então
  classificar em defender, ocupar e enxugar.

### PC-7. Defesa do consignado público sob portabilidade

- **Motivação.** O BB lidera (19,2%) e ficou mais caro: percentil 29 (2019), 56 (2026). Cobra 25,2% ao ano, contra
  20,7% do Nubank e 19,5% do Banco Sicredi (A5, BCB).
- **Premissas.** P15: inconclusivo, com sinal de vulnerabilidade. A portabilidade do crédito pessoal (fev/2026) não
  mostrou perda (+0,77 p.p. contra o controle, dentro do ruído).
- **Retorno.** Não agir custa `S × q × m`. Igualar preço custa `S × s × Δp`. Agir se `q × m > s × Δp`.
  - `S`: cerca de R$ 154 bi de consignado total (derivado: 19,2% de R$ 800 bi). A parte pública: premissa.
  - `Δp`: até 4,5 p.p. ao ano (público).
  - `q` (fração que porta), `m` (margem) e `s` (fração a reprecificar): **premissa**.
- **Ponto de virada.** `q* = s × Δp ÷ m`.
- **Custo.** Margem cedida no reprecificado.
- **Medição.** Pedidos de portabilidade por instituição (BCB) e participação trimestral.
- **Etapas.** (1) Acompanhar os dois primeiros trimestres de portabilidade. (2) Reprecificar só as faixas em que o
  `q` medido passar de `q*`.

### PC-8. Programa de dados ancorado na RC 18, começando pelo agro

- **Motivação.** Prazo regulatório em 31/12/2026. As duas maiores lacunas deste plano são de dado integrado.
- **Premissas.** F01 a F11: não testadas. F12: inconclusivo, com indício a favor (24 problemas de dado público
  catalogados no README das análises).
- **Retorno.** `benefício = horas de reconciliação × custo-hora × redução + perda regulatória evitada`. Todos os
  termos: **premissa**. A evidência de benefício é fraca; a de custo de não fazer é forte.
- **Ponto de virada.** Se o primeiro exercício ad hoc (agro por município e cadeia) já sair em um dia útil, o
  programa não é a restrição.
- **Custo.** Tempo de executivos e donos de domínio; tecnologia depois.
- **Medição.** Tempo do exercício ad hoc; percentual de elementos críticos com dono e meta.
- **Etapas.** (1) Mandato e primeiro exercício em 90 dias. (2) Núcleo em 3 a 12 meses. (3) Domínios comerciais
  depois.

**O que ficou de fora, e por quê.** Originar para distribuir no agro (P05 e P45 sem teste). Imobiliário para
servidores (P18 só informa). Pacote do produtor além do crédito (P12 sem teste). Orçamento de capital por mercado
(P45 e P04 sem teste). Nenhuma tem ainda uma premissa com evidência.

---

## 9. O que levar para dentro

A estrutura não muda. Troca-se a premissa pelo dado interno e recalcula-se a fórmula.

| Premissa ou termo | Substituto público usado | Dado interno que o troca | O que se recalcula |
|---|---|---|---|
| P04 | Simulação da administração | Resultado e capital por segmento | A separação das duas histórias; o tamanho de cada proposta |
| P03 | Atraso por UF e por segmento (SICOR) | Atraso por operação, município e grupo econômico | PC-3; o alvo do monitor (PC-1) |
| P02, termo `f` | Hiato de 7,5 p.p. por célula | Piloto com sorteio; atraso por produtor | PC-4: de teto para efeito medido |
| G01, G02, G03, LGD | Área do CAR por município; lei e notícia | Garantia, matrícula ou CAR por operação; recuperação por operação | PC-2 |
| `c_i` por instrumento | Custo médio implícito (IF.data) | Custo e saldo por instrumento e por segmento de cliente | PC-5 |
| Margem por município | Saldos do ESTBAN | Resultado por agência; clientes e produtos por município | PC-6 |
| `q`, `m`, `s` | Preço relativo (BCB) | Pedidos de portabilidade recebidos e margem por convênio | PC-7 |
| P14, P30 | Atraso de 15 dias e taxa média | Perda efetiva e margem por cliente perdido | As jogadas "atacar canal" do mapa |
| P09, S01, S02 | Painel por UF | Painel por município, com atraso de 15 a 90 dias | A escada de sensores |

Como o retorno é recalculado:

1. Cada termo marcado "premissa" recebe uma distribuição a priori larga.
2. O dado interno entra como observação e estreita a distribuição (seção 7.2).
3. A fórmula é rodada de novo. Sai a faixa P10–P90 e a probabilidade de valor negativo.
4. A proposta muda de etapa só se o intervalo excluir o ponto de virada.

Em ambiente corporativo, o conselho de modelos usa só os provedores aprovados e as regras de retenção de cada um
([`03-conselho.md`](03-conselho.md) §9).

---

## 10. Decisões pendentes para a pessoa

| # | Decisão | O que destrava | Detalhe |
|---|---|---|---|
| 1 | **H1: aprovar o dossiê** | A rodada 2 do conselho e o uso dos números da seção 1 | Conferir por amostra. Atenção a F-002, F-005, F-006 e F-015 (lidos do layout do PDF) e a F-011 (imprensa). Arquivo: `conselho/R0/dossie.json` |
| 2 | **H2: escolher as premissas e fixar os limiares** | O pré-registro e os 15 testes de `06-estado-premissas.md` §2 | Em 222 de 254 críticas o limiar foi marcado como manipulável. Decidir também a definição de "município só BB" (555, 558 ou 577) |
| 3 | **Calibração dos juízes** | Fecha 51 dos 58 desacordos | Dar nota a 10 premissas pela rubrica |
| 4 | **Licença do CEPEA** (CC BY-NC) | S02, o teste que decide se mais sensor ajuda | Para o estudo público, basta citar. Para uso no banco, pede acordo |
| 5 | **Licença da B3** | Futuros agrícolas em S02 | Os termos proíbem coleta automatizada. Sem licença, S02 roda só com preço à vista |
| 6 | **Cadeia ICP-Brasil para o Comex Stat** | S03 (comercialização por UF) | Instalar ou não a cadeia de certificados publicada pelo ITI. É decisão de confiança, não contorno |
| 7 | **Astra e Gemini como cadeiras** | Mais famílias no conselho; tira o autor da v0 do braço que parte dela | Depende de acesso |
| 8 | **Pedido via LAI ao BCB** | P03 e G01 com cobertura alta | Município das operações do SICOR que não estão no complemento (cerca de 70% do valor fora do Pronaf) |
| 9 | **Qual panorama vem primeiro na rodada 2** | A ordem dos 15 testes | Sugestão, a confirmar: P04 antes de tudo, porque separa as duas histórias |

---

## Limites deste plano

- Feito de fora. Não há inadimplência por banco e município, nem margem por produto, em fonte pública.
- Sem pré-registro, salvo G01 e S01. Sem aprovação do dossiê. Juízes sem calibração.
- Três definições de atraso rural, que não se comparam em nível.
- Quebras de 2025 (Res. CMN 4.966, Cosif nova, troca de perímetro no IF.data) atravessam quase todas as séries.
- A lista de divergências entre documentos e análises está em
  [`06-estado-premissas.md`](06-estado-premissas.md) §5.
