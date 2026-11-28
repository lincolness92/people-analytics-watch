# Análise 7. Atena: garantias (G01) e surpresa de safra (S01)

Versão de **28/11/2026**, para o Panorama 1 ([`05-panoramas.md`](../05-panoramas.md) §1). Testa as duas premissas
mais baratas do Atena, do mapa [`atena-sensores-garantias.md`](../../../docs/sources/atena-sensores-garantias.md) §6.
Só dado público. Nenhum número interno do BB.

Scripts: [`labs/rural/g01_garantias.py`](../../../labs/rural/g01_garantias.py) e
[`labs/rural/s01_safra.py`](../../../labs/rural/s01_safra.py). Saídas em `labs/rural/resultados/` (`g01_*`, `s01_*`).

## Resumo

| Premissa | Leitura (pré-registro leve) | Número decisivo | Força |
|---|---|---|---|
| **G01**: a exposição fora do Pronaf está em imóvel de ≥ 4 módulos fiscais | **refuta** | M = 47,1% do valor (limiar de refutação: < 50%) | frágil: o município só cobre 29,6% do valor; limites de 13,9% a 84,3% |
| **S01**: a surpresa de safra antecipa a inadimplência em 2–3 trimestres | **refuta** | erro +12,8% (h = 6) e +83,1% (h = 9) contra a ponte; −0,3% a +0,3% contra o clima | firme: IC acima de zero; nem o modelo enxuto melhora |

- **G01.** No crédito com município conhecido (SICOR, safras 2020/21 a 2025/26), 47% do valor fora do Pronaf está
  em município onde ≥ 70% da área do CAR é de imóvel com 4 ou mais módulos fiscais (CAR, 28/11/2026). No BB, 54%
  (inconclusivo). O país se divide: **MS, MT, GO, PI e PA passam; MG, PR, RS e SC falham**. Esses quatro somam 36% do
  valor fora do Pronaf do BB. O crédito de mercado quase não tem município no dado público (0,7% de cobertura).
- **S01.** A revisão do LSPA (IBGE, 09/2006 a 10/2026) não melhora a previsão da inadimplência rural >90 dias por UF
  (SCR.data, até 09/2026). Nem sobre o clima, nem sobre a ponte nacional. Nas cinco UFs de grãos, a correlação é zero.
- **Para o Atena.** A garantia de imóvel serve para lutar onde o imóvel é grande (Centro-Oeste, Matopiba). No Sul e
  em MG, não. O sensor de safra por UF não paga; o próximo teste é a margem (S02).

---

## 0. Pré-registro leve

Os limiares foram copiados do documento de premissas e gravados em
[`labs/rural/resultados/a7_preregistro.json`](../../../labs/rural/resultados/a7_preregistro.json) em
**28/11/2026, 07:20:44 UTC**, antes de baixar o CAR e o LSPA e antes de rodar qualquer estimativa. SHA-256 do arquivo
na hora: `10feedeca09cb4d9d1bc9050f8894c58f5fe2d958cc49505832122ac49423e32`. É leve: o arquivo não foi publicado
fora do repositório antes do teste, e os microdados do SICOR já estavam no laboratório (usados na Análise 2),
embora não com este recorte.

| Premissa | Confirma se | Refuta se | Senão |
|---|---|---|---|
| **G01** | ≥ 70% do valor fora do Pronaf está em municípios onde ≥ 70% da área do CAR é de imóveis com 4 ou mais módulos fiscais | < 50% do valor fora do Pronaf cumpre essa condição | inconclusivo |
| **S01** | redução do erro ≥ 10% nos horizontes de 2 e 3 trimestres | redução < 3% | inconclusivo |

**Definições fixadas no pré-registro** (resumo; o texto completo está no JSON):

- **G01.** CAR: imóvel rural (`IRU`), situação ativo (`AT`), foto de 28/11/2026. SICOR: valor contratado
  (`VL_PARC_CREDITO`) das operações emitidas de 01/07/2020 a 30/06/2026 (safras 2020/21 a 2025/26), programa
  diferente de Pronaf. M = valor em municípios que passam ÷ valor com município conhecido e presente no CAR. Decide o
  sistema inteiro. BB, taxa de mercado, UF e limites de cobertura são leituras secundárias.
- **S01.** O calendário e o alvo do `nowcast.py`. Horizontes decisivos h = 6 e 9 meses. Duas comparações:
  **A (literal do documento)**: CLIMA+S contra CLIMA (o M1 do monitor). **B (decisiva)**: PONTE+C+S contra a barra
  min(PONTE, PONTE+C), porque o monitor usa a ponte nacional e só muda se a safra ganhar dela. Confirma se B ≥ 10%
  em h = 6 e 9, com IC 95% da diferença de MAE abaixo de zero; refuta se B < 3% nos dois.

**Desvios do pré-registro**, todos anotados:

1. O WFS do CAR não devolve CSV quando se pedem só alguns campos (erro do servidor); a coleta usou GeoJSON sem
   geometria, com paginação por chave (`cod_imovel`). Mesmo conceito, mesmo resultado (testado no AC: agregados
   idênticos aos da paginação por posição).
2. Acrescentei, **fora do pré-registro e marcadas como exploratórias**: em G01, duas imputações do valor sem
   município; em S01, um modelo enxuto PONTE+S (ponte + só a safra), um recorte das cinco maiores UFs de grãos e a
   correlação na amostra toda. Nenhuma delas muda a regra de leitura.

---

## 1. G01: a exposição fora do Pronaf está em imóvel executável?

### Dados

- **SICAR (CAR)**, WFS público `geoserver.car.gov.br/geoserver/sicar/wfs`, 27 camadas, coletadas em 28/11/2026
  (07:26 a 08:43 UTC). 8.581.836 registros; 7.811.778 imóveis rurais ativos (`IRU`, `AT`) com 474,6 milhões de ha
  declarados (o Censo Agropecuário 2017 do IBGE contou 351 milhões de ha em estabelecimentos). Guardei só agregados por município × tipo × situação × classe de módulo fiscal
  (`data/rural/raw/car_municipio_mf.csv.gz`; resumo versionado em `data/rural/car_municipio_resumo.csv`). Sem nome,
  sem CPF, sem código de imóvel. 4 códigos repetidos na paginação (PA 1, SP 3), contados uma vez.
- **SICOR (BCB)**, microdados já baixados no laboratório: 3.017.694 operações fora do Pronaf emitidas de 07/2020 a
  06/2026, R$ 1.758 bi contratados. Com o Pronaf, R$ 2.085 bi; o Pronaf é 15,7% do valor (BB 15,4%; demais IFs
  15,8%).
- **IBGE PAM 5457**, valor da produção das lavouras por município, 2025 (só na imputação exploratória).

### Método

1. CAR: por município, área dos imóveis rurais ativos e área dos que têm `m_fiscal` ≥ 4 (o campo do próprio CAR).
   Parcela de área ≥ 4 MF = a segunda ÷ a primeira. Classes de apoio: < 1, 1–4, 4–15 e > 15 MF (Lei 8.629/1993,
   art. 4º).
2. SICOR: soma do valor contratado por IF (BB ou demais), UF, município, programa, categoria do emitente, fonte e
   safra. O município vem do complemento (`CD_IBGE_MUNICIPIO`), juntado por `REF_BACEN` + `NU_ORDEM`.
3. M = valor em municípios com parcela ≥ 70% ÷ valor com município conhecido. Limites, imputação e cortes como no
   pré-registro.

### Cobertura (o limite que manda neste teste)

O município vem do complemento do SICOR. Ele cobre **29,6% do valor fora do Pronaf do sistema e 25,1% do BB**
(R$ 520 bi e R$ 176 bi). Por safra, o BB fica entre 18% (2023/24) e 33% (2024/25). É pior que os 51% do saldo do BB
em 09/2026 citados no README do laboratório. O buraco não é aleatório:

- crédito com **fonte não controlada** (taxa de mercado): cobertura de **0,7%** (R$ 6 bi de R$ 928 bi);
- no Pronaf, a cobertura por valor é de 77–78% (operações emitidas em 2025, BB e demais).

Ou seja: o dado municipal mostra bem o crédito controlado e mal o crédito de mercado, que é justamente o do grande
produtor. A leitura abaixo vale para o valor com município. O resto entra só nos limites e na imputação.

### Resultado (`g01_resultado.json`, `g01_por_uf.csv`)

| Recorte | Valor fora do Pronaf (R$ bi) | Cobertura | **M** | Limites (pior–melhor) | Imputado: SICOR / PAM (exploratório) | Leitura |
|---|---|---|---|---|---|---|
| **Sistema** (decide) | 1.758 | 29,6% | **47,1%** | 13,9%–84,3% | 47,2% / 50,7% | **refuta** (frágil) |
| BB | 699 | 25,1% | 53,7% | 13,5%–88,3% | 50,9% / 55,2% | inconclusivo |
| Demais IFs | 1.059 | 32,5% | 43,7% | 14,2%–81,7% | — | refuta |
| Sem programa | 1.303 | 18,4% | 59,4% | 10,9%–92,5% | — | inconclusivo |
| Pronamp | 286 | 39,6% | 29,2% | 11,6%–71,9% | — | refuta |
| Categoria grande | 1.024 | 28,6% | 57,4% | 16,4%–87,8% | 53,8% / 55,1% | inconclusivo |
| Categoria média | 650 | 29,5% | 33,8% | 10,0%–80,4% | 39,1% / 45,8% | refuta |
| Variante: CAR ativo + pendente, sistema | 1.758 | 29,6% | 47,3% | — | — | refuta |

M = parcela do valor (com município) em municípios onde ≥ 70% da área do CAR ativo é de imóveis com 4 ou mais
módulos fiscais. Limites: todo o valor sem município cai em município que falha (pior) ou que passa (melhor).
Imputação SICOR: o valor sem município de cada célula UF × categoria × fonte segue o valor com município da mesma
célula. Imputação PAM: segue o valor da produção das lavouras dos municípios da UF.

**Leitura pelo pré-registro: refuta, por pouco e com cobertura fraca.** M do sistema = 47,1%, abaixo do limiar de
50%. Mas os limites de cobertura cruzam os dois limiares (13,9% a 84,3%), e a imputação pela PAM dá 50,7%
(inconclusivo). A forma honesta de dizer: **no crédito que tem município, menos da metade do valor fora do Pronaf
está em município de imóvel grande; para o crédito de mercado, o dado público não responde.**

**Sensibilidade ao limiar de área** (`g01_sensibilidade_limiar.csv`; o pré-registro fixa 70%):

| Limiar de área ≥ 4 MF no município | 50% | 60% | **70%** | 80% | 90% |
|---|---|---|---|---|---|
| M, sistema | 68,9% | 58,2% | **47,1%** | 31,8% | 10,2% |
| M, BB | 75,7% | 65,2% | **53,7%** | 37,0% | 12,3% |

O resultado depende muito do limiar. A média ponderada pelo valor da parcela de área ≥ 4 MF é 61,7% no sistema e
65,5% no BB: o crédito típico está num município onde cerca de 1/3 da área é de pequena propriedade.

**Por UF, o mapa se divide em dois** (sistema; M com o valor coberto; cobertura entre parênteses):

| Passa (M ≥ 70%) | No meio | Falha (M < 50%) |
|---|---|---|
| MS 96% (26%), MT 86% (22%), PI 83% (53%), PA 73% (50%), GO 71% (23%), DF 100% | BA 69%, TO 67%, RR 61%, SP 51% | AL 45%, RS 41%, MA 33%, PB 32%, RJ 25%, MG 24%, PE 21%, PR 20%, ES 18%, RO 11%, SC 5%, SE 3%, CE 2%, AC 0% |

No BB: MS 96%, MT 86%, PI 80% passam; GO 69%, TO 64%, PA 61%, BA 55% ficam no meio; RS 47%, SP 47%, MG 30%,
MA 28%, PR 23%, ES 15%, SC 5% e RO 3% falham. **MG, PR, RS e SC somam R$ 253 bi do valor fora do Pronaf do BB (36%)
e falham.** Ali, a área está em imóvel pequeno (CAR: 39% a 59% da área em ≥ 4 MF), e a proteção do Tema 961 alcança
boa parte das garantias de imóvel.

**O perfil do BB é diferente.** Fora do Pronaf, 56% do valor do BB é de médio produtor (demais IFs: 24%) e 41% de
grande (demais: 70%) (`g01_categoria.csv`, SICOR, safras 2020/21 a 2025/26). O médio produtor está em municípios de
imóvel menor (M = 33,8%).

### O que o teste não mede (vieses, nas duas direções)

1. **Falácia ecológica.** O teste mede a área do município, não o imóvel do devedor. Dentro do município, quem toma
   crédito fora do Pronaf tende a ter imóvel maior que a média: o Pronaf exige até 4 módulos fiscais (Lei 11.326/2006,
   art. 3º). Isso puxa M **para cima** do que o teste mostra.
2. **CAR declaratório.** Imóvel dividido em vários CAR parece pequeno; condomínio e sobreposição inflam a área. O
   total declarado (474,6 Mha) passa da área dos estabelecimentos agropecuários do Censo 2017 (351 Mha). Direção
   incerta.
3. **Arrendamento.** Parte grande da soja é plantada em terra arrendada. O devedor não dá a terra em garantia. Aí a
   garantia é de safra (penhor, CPR), e o Tema 961 não é a questão. O SICOR não diz o tipo de garantia.
4. **Crédito de mercado quase sem município** (0,7% de cobertura). É o maior buraco. O crédito de mercado é do
   grande produtor e deve estar mais concentrado nos municípios que passam.
5. **Garantia ≠ executável.** Passar em G01 é condição necessária. G02 (prazo e suspensão de leilões) e G03 (preço da
   terra) dizem se a garantia vale na prática.

### O que fecharia a lacuna

- **No banco:** o tipo de garantia e a matrícula ou o CAR de cada operação, cruzado com `m_fiscal`. É uma junção
  simples e responde G01 direto, operação por operação.
- **No dado público:** pedir ao BCB, via LAI, o município das operações do SICOR que não estão no complemento
  (70% do valor fora do Pronaf). Com cobertura acima de 80%, os limites se fecham.
- **SIGEF/INCRA** (parcelas certificadas), quando o serviço voltar (falhou em 28/11), para medir o imóvel real e não
  o declarado.
- **Rodar de novo com limiar fixado por critério jurídico.** O pré-registro usou 70% da área. Se o conselho quiser
  outro critério (ex.: parcela de imóveis, não de área), registrar antes.

**Decisão sugerida.** A premissa pede uma regra única para o país. O dado diz que ela não serve. **Lutar com
garantia de imóvel (alienação fiduciária, CIR) faz sentido no Centro-Oeste e no Matopiba de imóvel grande.** Em MG,
PR, RS e SC, onde está mais de 1/3 do crédito fora do Pronaf do BB, a garantia de imóvel vale menos. Ali entram
seguro, penhor de safra e CPR, e limite por produtor (`decisao.se_falsa`).

---

## 2. S01: a surpresa de safra antecipa a inadimplência?

### Dados

- **IBGE LSPA**, SIDRA 6588, produção (t) por UF, total de cereais, leguminosas e oleaginosas e soja, levantamentos
  de 09/2006 a 10/2026 (baixado em 28/11/2026, `data/rural/raw/lspa/`; tabela em `data/rural/lspa_uf_mensal.csv`).
- **Alvo**: inadimplência >90 dias do crédito rural por UF, SCR.data (BCB), até 09/2026. O mesmo do `nowcast.py`.
- **Clima, SGS, preços e Selic**: os do `nowcast.py` (NASA POWER, SGS 21148/21146/21136/4189, DERAL-PR).
- Conab ficou de fora: o portal de série histórica estava com TLS quebrado em 28/11 e o LSPA já dá a revisão mensal
  por UF.

### Safras de dados (vazamento)

Cada mês da tabela 6588 é a estimativa **feita naquele mês** para o ano da colheita. O caminho muda mês a mês e
não é uma série reescrita (ex.: soja em MT, ano 2026: 48,5 Mt em jan, 50,5 em mar, 50,7 em out; LSPA/IBGE). Então o
teste usa, em cada origem, só o levantamento já publicado. A origem T (dia do SCR de T, fim de T+2) usa o LSPA de
T+1, que sai por volta do dia 15 de T+2. **Limite:** o IBGE não publica um arquivo de safras de dados. Não dá para
provar que nenhum mês antigo foi corrigido depois. Se foi, o resultado é otimista para a safra, o que só reforça a
leitura abaixo.

### Método

Variáveis de safra na origem T (Y = ano de T+1): revisão do ano (LSPA de T+1 ÷ LSPA de jan/Y, em log), revisão final
do ano anterior, variação esperada contra o ano anterior (LSPA de T+1 ÷ LSPA de dez/Y−1) e revisão da soja. Ridge
reestimado em cada origem, janela que cresce, origens de 12/2017 em diante, λ escolhido como no `nowcast.py`. MAE em
p.p., média simples das 27 UFs, nas mesmas UF × origens para todos os modelos. IC 95% por bootstrap em blocos de 12
origens.

### Resultado (MAE em p.p., 27 UFs, origens 12/2017 a 09/2026 − h; `s01_avaliacao.csv`)

| h (meses) | RW | PONTE (barra) | CLIMA | CLIMA+S | PONTE+C | PONTE+C+S | A: CLIMA+S × CLIMA | B: PONTE+C+S × barra (IC 95% da dif., p.p.) |
|---|---|---|---|---|---|---|---|---|
| 3 | 0,576 | **0,519** | 0,572 | 0,571 | 0,559 | 0,556 | +0,2% | −7,2% (+0,007 a +0,059) |
| **6** | 0,907 | **0,839** | 0,975 | 0,972 | 0,949 | 0,946 | **+0,3%** | **−12,8%** (+0,023 a +0,193) |
| **9** | 1,253 | **1,169** | 2,192 | 2,199 | 2,132 | 2,141 | **−0,3%** | **−83,1%** (+0,077 a +2,682) |
| 12 | 1,530 | **1,457** | 2,718 | 2,731 | 2,643 | 2,662 | −0,5% | −82,8% (+0,129 a +3,114) |

Redução positiva = menos erro. n = 2.700 UF × origens em h = 6 e 2.619 em h = 9. RW, PONTE e CLIMA reproduzem o
`nowcast.py` (README do laboratório, 28/11/2026).

**Leitura pelo pré-registro.**

- **A (literal): refuta.** A safra muda o erro do modelo de clima em −0,3% a +0,3% nos horizontes decisivos. O
  limiar de refutação é < 3%.
- **B (decisiva): refuta.** Nos dois horizontes decisivos, o modelo com safra erra mais que a ponte nacional, e o IC
  da diferença fica todo acima de zero. O ridge sobre o resíduo da ponte sobreajusta como o M1. A safra não muda isso
  (PONTE+C+S contra PONTE+C: +0,3% em h = 6, −0,4% em h = 9).

**Exploratório (fora do pré-registro).**

| Teste | h = 6 | h = 9 |
|---|---|---|
| PONTE+S (ponte + só as 4 variáveis de safra) × PONTE | −6,5% (IC +0,014 a +0,093 p.p.) | −8,2% (IC +0,037 a +0,148) |
| Idem, só MT, GO, MS, PR e RS | −17,5% | −18,6% |
| B no recorte 2025–2026 (depois da Res. CMN 4.966) | +0,3% (IC −0,048 a +0,043) | −1,5% (IC −0,170 a +0,148) |
| Correlação, amostra toda, safra em T × resíduo da ponte em T+h, cinco UFs de grãos | \|r\| ≤ 0,04 nas 4 variáveis | \|r\| ≤ 0,04 |
| Idem, 27 UFs | r de −0,11 a +0,17; o sinal da revisão é **positivo** (revisão para cima, mais atraso) | r de −0,06 a +0,17 |

Mesmo o modelo mais enxuto piora. Nas UFs onde a safra mais pesa, a correlação é zero, mesmo dentro da amostra.
Nas 27 UFs, o sinal vai contra a hipótese (o esperado era revisão para baixo, mais atraso), puxado por UFs pequenas.
Não há sinal escondido que um modelo melhor acharia.

**Por que pode ser assim** (hipóteses, não testadas aqui):

1. Em 2023–2026 o choque foi de preço e de juros, mais que de quebra física (é a premissa S02). MT 2024 teve quebra
   de soja (44,5 Mt em 2023 para 39,1 Mt; LSPA/IBGE, dez/2023 e dez/2024), mas a inadimplência rural >90 dias de MT
   subiu mais depois, com safra recorde (50,2 Mt em 2025): 0,75% em 12/2023, 2,42% em 12/2024, 6,16% em 12/2025 e
   7,27% em 09/2026 (SCR.data/BCB).
2. A UF é grossa demais. A quebra é municipal, e a carteira de uma UF mistura quem quebrou e quem não.
3. Renegociação e prorrogação (MP 1.314/2025, MP 1.376/2026, Súmula 298 do STJ) adiam a entrada em atraso de
   >90 dias. O efeito da quebra fica fora da janela de 2 a 3 trimestres.

### O que fecharia a lacuna

- **Município, não UF.** PAM e LSPA municipal (onde houver) contra o atraso do SICOR por município. Hoje o
  complemento do SICOR cobre mal o recente (ver G01). Com o dado interno do BB, o teste é direto.
- **Alvo de 15 a 90 dias.** O >90 dias chega depois da renegociação. O atraso curto do SCR.data é o alvo natural
  da safra.
- **Guardar o LSPA por data de coleta.** O coletor salva o arquivo com a data. Em 12 meses há uma safra de dados
  própria.
- **Testar S02 (margem) antes de S05 (NDVI).** Se o choque é de preço, mais sensor de safra não ajuda.

**Decisão sugerida (premissa S01, `decisao.se_falsa`):** ficar nos degraus 1 e 2 no monitor por UF; usar a safra só
como narrativa. O degrau 3 continua barato, mas não paga por si no horizonte de 2 a 3 trimestres.

---

## 3. Leitura — pré-registro leve

| Premissa | Leitura | Ressalva principal |
|---|---|---|
| G01 | **refuta** (sistema, M = 47,1%); BB inconclusivo (53,7%) | cobertura de município de 29,6% do valor; o crédito de mercado não aparece; a leitura troca com o limiar de área |
| S01 | **refuta** (A e B) | LSPA tratado como safra de dados sem prova formal; alvo >90 dias por UF pode chegar tarde demais para a safra |

As duas leituras saíram das regras gravadas antes. Nenhum limiar foi mexido depois. Os testes exploratórios estão
marcados e não mudam a leitura.

