# Análises do diagnóstico do BB (dados públicos)

Primeira rodada de 28/11/2026 das análises 1, 3, 4 e 5 de [`04-proximos-passos.md`](../04-proximos-passos.md) §4,
revisada no mesmo dia com o CDI (A4) e as taxas de juros por instituição (A5), mais as Análises 6 (dez anos de resultado)
e 8 (concorrência por mercado), as duas para [`05-panoramas.md`](../05-panoramas.md) §3. A
Análise 2 (inadimplência rural ajustada ao mix) depende de SCR.data e SICOR e está com outro fluxo.

Tudo aqui é **preliminar e sem pré-registro**: as regras de leitura são as do §4, mas os limiares não foram fixados
com data antes de rodar. Só dado público. Nenhum número interno do BB.

## Como rodar

Da raiz do repositório, só Python 3 (stdlib; use `python3` se `python` não existir). Lê `data/ifs/` (inclusive os brutos em cache e a base local, aberta só
para leitura) e grava em `estrategia/bb/analises/out/`. A4 e A5 baixam, uma vez, o CDI (SGS 4391) e as taxas de juros
do BCB (Olinda `taxaJuros/v2`, ~3 min na primeira vez); a A8 baixa o GFDD (FRED e API do Banco Mundial) e os betas
de Drechsler–Savov–Schnabl. Tudo vai para `estrategia/bb/analises/raw/`, que fica fora do git; nas rodadas seguintes
usam o cache.

```
python estrategia/bb/analises/a1_quem_ganhou.py       # ~30 s (bootstrap do teste de quebra)
python estrategia/bb/analises/a3_contestabilidade.py  # ~3 s
python estrategia/bb/analises/a4_passivo.py           # ~25 s
python estrategia/bb/analises/a5_varejo_pf.py         # ~40 s (+3 min na 1ª vez: taxajuros.py)
python estrategia/bb/analises/a6_resultado_10anos.py  # ~2 s
python estrategia/bb/analises/a8_concorrencia.py      # ~45 s (+ ~15 s na 1ª vez: GFDD e betas de DSS para raw/)
```

`_comum.py` tem a leitura das séries, os grupos de concorrentes e a extração de campos do IF.data que a camada ainda
não exporta (vencidos por modalidade, despesa de captação, compromissadas, letras financeiras, exterior). Ele usa as
funções de leitura de `src/pawatch/ifs/` sem alterar nada lá.

## Índice

| Análise | Texto | Script | Premissas |
|---|---|---|---|
| 1. Quem ficou com cada ponto que o BB perdeu | [a1.md](a1.md) | [a1_quem_ganhou.py](a1_quem_ganhou.py) | P01, P13, P14, P15, P30 (P07, P50) |
| 3. Mapa municipal de contestabilidade | [a3.md](a3.md) | [a3_contestabilidade.py](a3_contestabilidade.py) | P26, P13, P27, P30, P41 |
| 4. Passivo e custo implícito de captação | [a4.md](a4.md) | [a4_passivo.py](a4_passivo.py) | P22, P06, P24, P25 |
| 5. Varejo PF: volume, risco e preço | [a5.md](a5.md) | [a5_varejo_pf.py](a5_varejo_pf.py), [taxajuros.py](taxajuros.py) | P14, P15, P16, P17, P18, P30 |
| 6. Dez anos de resultado (panorama §3) | [a6.md](a6.md) | [a6_resultado_10anos.py](a6_resultado_10anos.py) | descritiva |
| 7. Atena: garantias e surpresa de safra (pré-registro leve) | [a7_atena_g01_s01.md](a7_atena_g01_s01.md) | [g01_garantias.py](../../../labs/rural/g01_garantias.py), [s01_safra.py](../../../labs/rural/s01_safra.py) | G01, S01 |
| 8. Concorrência por mercado: HHI, Lerner, beta, mapa mercado × concorrente (panorama §3) | [a8.md](a8.md) | [a8_concorrencia.py](a8_concorrencia.py), [_concorrencia.py](_concorrencia.py) | P22, P06, P14, P13, P30, P31 |

## Manchetes

**Análise 1.** O BB caiu de 19,0% para 13,8% do crédito PF + PJ entre 03/2016 e 06/2026 (IF.data). Os ganhos foram de
digitais (+6,2 p.p.) e cooperativas (+4,8); os privados grandes ganharam até 2019 e devolveram depois. A perda é de
competição, não de composição: o efeito competitivo explica 132% da queda na janela toda (o BB estava nos produtos que
mais cresceram), e 69% na última janela, no limite da regra de 70%. No rural PF, a queda é significativa antes de
12/2023 (−1,9 p.p. por ano em 12/2019–09/2023; quebra estimada em 12/2020, p = 0,04 por bootstrap), o que sugere
confirmar P01; mas quem levou a maior parte em 2019–2023 foi a Caixa (+6,7 p.p.), e a queda quase parou em
2023–2026 (−0,3).

**Análise 3.** Em 08/2026 (ESTBAN), o BB é o único banco com agência em 558 municípios (437 em 12/2022) e divide só
com outros públicos em 503 (286). Entre 12/2022 e 08/2026, Bradesco saiu de 368 municípios onde o BB está, Itaú de 259
e Santander de 193; o BB não saiu de nenhum município onde era o único. Onde um privado saiu, os depósitos de varejo
do BB **não** subiram mais que nos demais municípios. A metade de P26 que fala de cooperativas não pode ser testada:
o ESTBAN não tem cooperativas. P26 fica inconclusiva.

**Análise 4.** A participação do BB caiu em quase todo o passivo de varejo: LCA de 68,6% para 32,6% (as cooperativas
levaram +17,9 p.p.), depósitos à vista de 21,1% para 16,6% só desde 12/2023 (saldo −20,8% com o sistema estável),
depósitos totais de 22,4% para 14,8%. Com o CDI (SGS 4391), o custo implícito de captação do BB menos o dos pares
piorou **+7,8 p.p. do CDI** entre as médias de 2017–2019 (+0,7) e 2022–2024 (+8,5), acima do limiar de 3 p.p.:
sugere confirmar P22 na Cosif antiga. Na Cosif nova (2025–1S2026, janela separada) o BB está 0,6 a 4,3 p.p. do CDI
acima dos privados. Na COVID, a participação do BB nos depósitos caiu 1,6 p.p. em dois trimestres: sugere refutar P25.

**Análise 5.** No não consignado, o BB caiu de 26,6% para 14,0% (03/2016–06/2026); o Nubank levou +15,1 p.p. O
Nubank cobra 107% a.a. e o BB 61% (2026, BCB taxaJuros), com atraso de 8,4% × 4,6%: a margem ajustada ao risco do
digital fica acima, o que sugere confirmar P14. Entre instituições, preço baixo não explica ganho de participação
(Spearman entre −0,31 e +0,36 em todos os produtos). No consignado público, onde lidera, o BB passou do percentil 29
(2019) para 56–61 (2025–2026) de preço, acima de Nubank e Banco Sicredi: vulnerável à portabilidade (P15, ainda sem
efeito medido). No capital de giro, o BB foi do mais barato (percentil 8, 2019) para acima da mediana (58, 2023) e
perdeu 6,1 p.p. em 2023–2026 (P30). O atraso do consignado no sistema quase dobrou desde 12/2024 (0,83% → 1,37%).

**Análise 6.** O ROE aproximado do BB (IF.data, lucro do ano ÷ PL médio) ficou abaixo ou perto do dos privados em
2016–2019, 6,5 a 9,6 p.p. acima em 2022–2024 (2º do grupo de 13 em 2023, 20,5% do lucro do grupo), e caiu para 10,3%
em 2025 e 7,1% no 1º semestre de 2026 anualizado: 12º de 13 em ROE e 8º em lucro. Em dez anos, quem mais subiu no lucro
foi Nubank (de prejuízo a R$ 24,0 bi em 2025), BTG, Itaú (R$ 19,1 → 51,1 bi) e as cooperativas (R$ 3,5 → 15,2 bi).

**Análise 8.** A concentração caiu em 36 de 40 séries do IF.data entre 03/2016 e 06/2026. O crédito PF + PJ foi de
1.203 para 949 pontos de HHI. Só habitação, rural, infraestrutura, PJ habitacional, poupança e LCI seguem
elevados (faixas do BCB). A conta bate com o REB 2023 do BCB: IHHn do crédito 0,0976 × 0,0990 publicado em 12/2023;
RC4 dos mercados relevantes a até 1,9 p.p.

O Lerner mediano dos bancos (translog no painel do IF.data) foi de 0,28–0,31 (2017–2021) para 0,18–0,21 (2022–2026).
Isso está na faixa do GFDD do Banco Mundial para o Brasil (0,21–0,31 em 2010–2014; a série acaba em 2014, sem ano
em comum). O BB fica em 0,18–0,23 desde 2017, na mediana dos bancos desde 2023. O Nubank fica em 0,34–0,42. O
Boone do GFDD (por ROA) não reproduz.

Na alta de 2021–2023, o beta de captação do BB foi de 0,74 (privados 0,71, Itaú 0,62). Sem as compromissadas, foi
de 0,57, o 2º menor entre os grandes: o custo maior do BB (A4) é mix, não preço do depósito. Os betas dos EUA (DSS)
são 0,35–0,39. No mapa mercado × concorrente, a hipótese mais frequente é "atacar canal" (16 de 37 mercados, contra
digitais e cooperativas). "Comprar" e "atacar preço" não aparecem: não há alvo privado de 3% ou mais nos mercados
concentrados, e o BB não está acima da mediana de preço.

## Problemas de dado encontrados (para a camada `data/ifs/`; nada foi corrigido aqui)

| # | Onde | O quê | Efeito nas análises |
|---|---|---|---|
| 1 | IF.data 12/2024 | Totais anômalos: PJ do sistema +26,8% num trimestre e volta (R$ 2.865 → 3.634 → 3.021 bi); Itaú PJ R$ 548 → 874 → 549 bi e PF R$ 524 → 656 → 553 bi | 12/2024 não é ponta de janela |
| 2 | IF.data, BB veículos | Saldo de R$ 4,5 bi (09/2024) → R$ 13,8 bi (12/2024), e fica em R$ 10–12 bi; participação 1,3% → 3,8% | O "ganho" do BB em veículos em 2023–2026 é provavelmente reclassificação |
| 3 | IF.data, PJ por modalidade 2016–2019 | Quedas estranhas no sistema com o total PJ em −10%: habitacional −64%, infraestrutura −32%, rural PJ −34%, "outros" −27%; BB "outros PJ" 47% → 21% | Variações por modalidade PJ em 2016–2019 lidas com cautela |
| 4 | IF.data, total por modalidade | O "Total da Carteira" PF e PJ inclui tomadores no exterior, que não estão em nenhuma modalidade (PJ exterior R$ 578 bi em 06/2026; diferença de 9%–12% entre soma das modalidades e total) | A decomposição usa o exterior como célula |
| 5 | IF.data, porte PJ 2025–2026 | PagBank aparece com R$ 44,4 bi em "micro" em 06/2026 (zero em 06/2025); Nubank sai de "pequena" (R$ 4,8 → 0,6 bi) para "micro" (R$ 0,5 → 9,8 bi); micro do sistema R$ 102 → 174 bi | Variação por porte em 2025–2026 é reclassificação |
| 6 | IF.data, PagBank e Stone | Capital de giro do PagBank R$ 0 (12/2023) → R$ 33,7 bi (12/2024); Stone R$ 0 → R$ 30,7 bi (06/2026). Parece antecipação de recebíveis entrando no relatório | O ganho dos "digitais" em capital de giro em 2023–2026 não é crédito bancário comparável |
| 7 | IF.data, Caixa cartão | Saldo R$ 17,8 bi (03/2025) → R$ 5,7 bi (06/2025) | Atraso e participação da Caixa em cartão sem comparação |
| 8 | IF.data, vencidos 06/2026 | Saltos de um trimestre: BB cartão 9,4% → 15,4%; BTG veículos 7,8% → 13,5%; Nubank não consignado 12,3% → 8,4% e cartão 13,6% → 10,3% | Conferir antes de usar o último trimestre |
| 9 | IF.data, BB habitação | Vencido de 0,11% vai a 1,25% (03 a 09/2025) e volta a 0,11% (06/2026) | Provável erro de reporte |
| 10 | IF.data, Nubank 2019 | Vencido de cartão do Nubank = 0 em 2019 | Atraso do Nubank só é comparável depois |
| 11 | IF.data, DRE na Cosif 2025 | Despesa de captação muda de (b1) para (g1); a da Caixa salta de 8,5% para 12,1% a.a. do saldo | Custo implícito não é comparável no tempo através de 2025 |
| 12 | ESTBAN, sedes | BB: crédito em Brasília R$ 117,7 bi (12/2024) → R$ 212,9 bi (06/2025); depósitos a prazo em Brasília R$ 22,7 bi (12/2019) → R$ 159,5 bi (12/2024). Depósitos do sistema em São Paulo R$ 346 bi (01/2016) → R$ 1.495 bi (08/2026) | Agregados municipais excluem Brasília, São Paulo e Osasco; eventos usam depósitos à vista + poupança |
| 13 | ESTBAN, dobra de 2026 | **Já corrigida pela camada** (`estban_fixes`, 3.181 linhas). Depósitos do BB no ESTBAN ÷ IF.data = 0,955 em 06/2026, como antes (0,93–0,96 desde 2016) | Nenhum |
| 14 | ESTBAN, Kirton Bank (ex-HSBC) | Em 01/2016 não é ligado ao Bradesco (o cadastro do IF.data mais próximo é 03/2016) | Tratado como Bradesco na Análise 3 |
| 15 | ESTBAN, cobertura | 726 municípios tinham agência em 01/2016 e nenhuma em 08/2026; postos de atendimento não aparecem | "Sem banco" quer dizer "sem agência" |
| 16 | Camada, cobertura | IF.data começa em 03/2016 e ESTBAN em 01/2016 (o plano pedia 2014) | Janela 2014–2019 virou 03/2016–12/2019 |
| 17 | Camada, arquivos | `regional_estban.csv` não tem a coluna `month_used` que o código atual de `shares.py` grava: o arquivo é anterior ao código | Não usado aqui; a camada ainda está em ajuste |
| 18 | IF.data, tarifas na Cosif 2025 | A linha de tarifas muda de (d2) para (m): o sistema cai de R$ 56,4 bi (2024) para R$ 42,5 bi (2025); o Nubank fica sem tarifas desde 2025 | Tarifas comparáveis só dentro de cada regime |
| 19 | IF.data, Basileia dos sistemas | `indice_basileia` de Sicoob e Sicredi em `values.csv` é a soma dos índices das cooperativas (ex.: 6.689% para o Sicoob em 06/2026) | Deixado vazio na Análise 6; a camada deveria não somar índices |
| 20 | taxaJuros (BCB), cooperativas | Só o Banco Sicoob e o Banco Sicredi reportam; as singulares não. Banco Sicoob com taxas implausíveis no pessoal não consignado (2,2% a.a. em 2023) | Taxas "cooperativas" não representam os sistemas |
| 21 | IF.data, cooperativas na Cosif 2025 | A renda da centralização financeira da singular foi para "Outras Receitas (t)": singulares de R$ 2,3–3,0 bi por semestre (2024) para R$ 12,6–17,2 bi (2025) | A8 soma outras receitas na receita das cooperativas, nos dois regimes |
| 22 | IF.data, bancos cooperativos e IPs na Cosif 2025 | Banco Sicredi com receita de 5,5% e custo de 10,0% do ativo (2025); Mercado Pago e PagBank com Lerner negativo desde 2025 | Sistemas medidos só pelas singulares; IPs em 2025–2026 não lidas |
| 23 | IF.data, linha (b1) na Cosif antiga | Inclui variação cambial das captações externas; o hedge fica em derivativos (a4) e câmbio (a5, b4). Sem eles na receita, o Lerner de 2020 e 2024 cai pela metade, e o beta do corte de 2023–2024 fica negativo nos bancos com captação externa | A8 soma derivativos e câmbio na receita; o corte de 2023–2024 não é lido |
| 24 | Benchmarks externos | GFDD: Lerner, Boone e H do Brasil só até 2014, e fora da API do Banco Mundial (cópia no FRED). O REB foi descontinuado em 2025 (Res. BCB 460) e publica o Lerner só em gráfico. O PDF do Guia H do CADE não abriu em 28/11/2026 | Conferência de nível sem ano em comum; faixas do CADE de fonte secundária |

## O que mais falta (fontes públicas)

CDI e taxas de juros já baixados aqui (levar para a camada `data/ifs/`); volume concedido por instituição e modalidade
(para ponderar as taxas); SCR.data;
SICOR; cadastro de agências e postos com datas; pontos de atendimento de cooperativas (Unicad); IBGE municipal;
balancetes Cosif para despesa por instrumento (beta de depósito sem compromissadas por premissa); IF.data de
2014–2015 (sobreposição com o GFDD); volume concedido por instituição (elasticidade da participação ao preço).
