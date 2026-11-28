# Registro de premissas testáveis (v0)

Rascunho de **28/11/2026**. São **55 premissas**, agrupadas por mercado. Cada uma traz: o enunciado, por que
importa, como testar com fonte pública, o resultado que confirma e o que refuta, e a decisão que muda em cada caso.
As marcas de fonte ([IFD], [EST], [FE], [FI], [I-nn], [M], [H]) estão explicadas em [`00-mapa.md`](00-mapa.md).

## Como ler

- **Uma premissa é uma aposta, não uma conclusão.** O campo "Hoje" diz o que a evidência preliminar sugere. Onde
  está escrito [IFD] ou [EST], o número é um cálculo preliminar meu, que a camada de dados (`data/ifs/`) precisa
  refazer.
- **Limiares.** Os valores de "confirma se" e "refuta se" são propostas iniciais. Devem ser fixados **antes** de
  rodar o teste (pré-registro leve, como pede `docs/sources/fatores-externos-e-propostas.md` §2.6) e podem ser
  contestados pelo conselho de modelos ([`03-conselho.md`](03-conselho.md)).
- **Entre "confirma" e "refuta" há uma zona inconclusiva.** Resultado nessa zona não muda decisão: pede mais dado
  ou outro teste.
- **Fontes.** "`data/ifs/`" é a camada em construção (IF.data, ESTBAN, Pilar 3, CVM IPE e séries de participação).
  As outras fontes estão mapeadas em `docs/sources/`. Onde a fonte ainda não foi mapeada, está escrito **(fonte
  nova)**.

## As 10 de maior valor de decisão

Critério: nota de 1 a 3 em três eixos, multiplicadas. **Tamanho** (quanto resultado ou capital está em jogo),
**incerteza** (quão dividida está a evidência hoje) e **alavanca** (o resultado do teste leva a decisões
realmente diferentes). As notas são minhas e estão abertas à contestação.

| # | Premissa | Tamanho | Incerteza | Alavanca | Nota |
|---|---|---|---|---|---|
| **P02** | As cooperativas têm inadimplência rural menor por causa do modelo, não do mix | 3 | 3 | 3 | 27 |
| **P03** | A inadimplência do agro do BB é concentrada, não disseminada | 3 | 3 | 3 | 27 |
| **P04** | Sem o agro, o ROE do BB fica perto de 17% | 3 | 3 | 3 | 27 |
| **P01** | A perda de participação no crédito rural é estrutural | 3 | 2 | 3 | 18 |
| **P09** | O risco climático é previsível o bastante para entrar no preço e no limite | 3 | 3 | 2 | 18 |
| **P22** | O custo relativo de captação do BB subiu | 3 | 3 | 2 | 18 |
| **P45** | O capital é a restrição ativa: não dá para defender tudo | 3 | 2 | 3 | 18 |
| **P15** | A portabilidade vai corroer a posição no consignado | 3 | 2 | 3 | 18 |
| **P26** | Onde o BB é o único banco, ele ganha mais e perde menos | 2 | 3 | 3 | 18 |
| **P14** | O crédito pessoal perdido para os digitais era cliente rentável | 2 | 3 | 3 | 18 |

---

## A. Agro e crédito rural

### P01 [top 10] A perda de participação no crédito rural é estrutural
- **Enunciado.** A queda da fatia do BB no crédito rural PF começou antes do ciclo de inadimplência e continuaria
  mesmo sem ele.
- **Por que importa.** Se for estrutural, sanear a carteira não devolve a liderança: é preciso mudar o modelo.
- **Como testar.** `data/ifs/shares/`: IF.data, "Rural e agroindustrial PF", trimestral de 03/2014 a 09/2026, por
  instituição e por sistema cooperativo; ESTBAN verbete 163, mensal, por UF; SICOR (contratações por instituição e
  segmento, safras 2013/14 a 2026/27). Teste de quebra estrutural na série e decomposição por UF.
- **Confirma se** a fatia cai pelo menos 0,5 p.p. ao ano de forma estatisticamente significativa já no período
  2017–2023. **Refuta se** mais de 70% da queda total ocorre depois de 12/2023.
- **Decisão.** Verdadeira → plano de defesa por microrregião contra cooperativas, Caixa e mercado de capitais.
  Falsa → a prioridade é sanear e retomar a originação quando o ciclo virar.
- **Hoje.** 62,4% (12/2019) → 55,8% (12/2022) → 53,7% (12/2023) → 53,5% (06/2026) [IFD]. Quase toda a queda
  (8,6 dos 8,9 p.p.) veio antes de 2024: sugere **verdadeira**.

### P02 [top 10] As cooperativas têm inadimplência rural menor por causa do modelo, não do mix
- **Enunciado.** Controlando por região, porte do produtor, cultura e fonte de recursos, as cooperativas de
  crédito ainda têm atraso menor que o BB no crédito rural.
- **Por que importa.** É a pergunta que separa "copiar o modelo" de "mudar o mix". E põe em xeque a vantagem de
  dados do BB (V7).
- **Como testar.** IF.data (vencidos por modalidade e instituição, trimestral, 2014–2026); SCR.data (inadimplência
  por UF × modalidade × porte × origem de recursos); SICOR (mix por programa: Pronaf, Pronamp, demais; custeio,
  investimento; cultura; seguro); ESTBAN × PAM (exposição municipal por cultura). Painel instituição × UF × trimestre
  com efeitos fixos de UF-tempo.
- **Confirma se** sobra diferença de pelo menos 2 p.p. depois dos controles. **Refuta se** a diferença cai abaixo
  de 0,5 p.p. quando se controla por porte e região.
- **Decisão.** Verdadeira → trazer os mecanismos (limite por produtor, relacionamento local, garantia, assistência
  técnica, incentivo do gerente) para a política de crédito do BB. Falsa → o problema é a concentração em médio e
  grande produtor: rebalancear o mix, não o modelo.
- **Hoje.** Vencidos acima de 15 dias no rural PF em 06/2026: BB 6,2%; Sicredi 1,2%; Sicoob 1,5%; cooperativas
  singulares 2,2%; sistema 5,6%; Caixa 14,4% [IFD]. Diferença bruta grande, sem controle de mix.

### P03 [top 10] A inadimplência do agro do BB é concentrada
- **Enunciado.** A maior parte do aumento da inadimplência vem de um grupo delimitado: médios e grandes produtores
  de soja, milho e pecuária no Centro-Oeste, em operações com taxas de mercado.
- **Por que importa.** Concentrada, pede cirurgia. Disseminada, pede revisão de toda a política de crédito rural.
- **Como testar.** ESTBAN (verbetes 163 e 174, por município e agência do BB) × IBGE PAM (cultura dominante);
  IF.data por região e por nível de risco; SCR.data por UF, porte e origem de recursos; SGS 21146 contra 21148;
  CNJ Datajud (recuperações judiciais por comarca); releases do BB (abertura por linha). Curva de concentração do
  aumento de provisões por município.
- **Confirma se** 15% dos municípios explicam pelo menos 60% do aumento, e a parcela com taxas de mercado explica
  mais da metade. **Refuta se** o aumento é proporcional à carteira em todas as regiões e portes.
- **Decisão.** Verdadeira → limites por grupo econômico e por praça, reforço de garantias e cobrança
  especializada, preservando a franquia do pequeno e do médio. Falsa → reprecificar e redesenhar a concessão em toda
  a carteira.
- **Hoje.** A administração afirma que é concentrada ([I-02], nov/2026). No sistema, a parcela com taxas de
  mercado tem 17,2% de inadimplência contra 9,6% do total [FE]. Falta o teste independente.

### P04 [top 10] Sem o agro, o ROE do BB fica perto de 17%
- **Enunciado.** Excluindo a carteira de agronegócio (resultado e capital alocado), o retorno do BB está no
  mesmo patamar de Bradesco e acima de Santander.
- **Por que importa.** É a afirmação central da administração. Se for falsa, o problema é a franquia inteira.
- **Como testar.** Reconstrução com dado público: custo do crédito e margem por carteira (releases e nota de
  segmentos em DFP/ITR, via CVM); RWA por classe de exposição (DASFN, tabelas OV1 e CR do Pilar 3); despesas
  rateadas por saldo. Série trimestral 2019–2026 e comparação com o ROE dos pares.
- **Confirma se** o ROE reconstruído sem o agro fica entre 15% e 19% nos últimos quatro trimestres. **Refuta se**
  fica abaixo de 13%.
- **Decisão.** Verdadeira → concentrar energia em sanear o agro e proteger o resto. Falsa → plano amplo de margem,
  despesa e mix em todo o banco.
- **Hoje.** Declaração da administração ([I-01]). Sinais contrários: perda de participação em quase todas as
  linhas de PF e no passivo barato [IFD]. **Aberta.**

### P05 O mercado de capitais está levando o melhor risco do agro
- **Enunciado.** CPR, CRA e Fiagro financiam cada vez mais os grandes produtores e as cadeias integradas, e
  deixam para o balanço dos bancos o risco pior.
- **Por que importa.** Decide se o BB deve carregar o crédito ou originar e distribuir.
- **Como testar.** MAPA, Boletim de Finanças Privadas do Agro (estoques mensais de CPR, CRA, LCA e Fiagro);
  SICOR por porte; SCR.data (inadimplência por porte); CVM, dados abertos de fundos (inadimplência das carteiras de
  Fiagro e FIDC do agro).
- **Confirma se** o crescimento fora do balanço se concentra em tomadores grandes e a inadimplência desses
  veículos é menor que a bancária na mesma UF e porte. **Refuta se** a inadimplência dos veículos é igual ou maior.
- **Decisão.** Verdadeira → BB como originador e distribuidor (securitização, fundos próprios, registro de CPR).
  Falsa → o balanço continua sendo a vantagem.
- **Hoje.** CPR com 43% do crédito concedido na safra 2025/26 [I-12]; estoque de CPR de R$ 593,8 bi em out/2026;
  CRA e Fiagro com 33% do "crédito rural em mercado" no fim de 2025 (19% em 2021) [I-13].

### P06 A liderança do BB em LCA erodiu, e a tributação pode acelerar isso
- **Enunciado.** O BB deixou de ser o emissor dominante de LCA, e uma eventual tributação reduz ainda mais a
  vantagem de custo do funding do crédito rural livre.
- **Por que importa.** A LCA financia a parcela do crédito rural com taxa de mercado, justamente a de pior risco.
- **Como testar.** IF.data, relatório Passivo, linha LCA, trimestral 2014–2026 por instituição; taxa de emissão em
  % do CDI por emissor (Data ANBIMA ou B3, **fonte nova**); tramitação do PL 5.853/2026 (Câmara, API v2).
- **Confirma se** a fatia do BB cai mais de 10 p.p. em 5 anos e a taxa paga pelo BB converge para a dos pares.
  **Refuta se** a queda é só efeito do crescimento das cooperativas sobre base pequena, sem perda de preço.
- **Decisão.** Verdadeira → rever o preço do crédito rural livre com custo de funding de mercado. Falsa → manter.
- **Hoje.** 49,4% (12/2019) → 32,6% (06/2026); Sicredi e Sicoob somados de 2,8% para 15,0% [IFD]. PL propõe 7,5%
  de IR [I-25].

### P07 Quem cresceu rápido no rural agora tem a pior inadimplência, e o recuo abre espaço
- **Enunciado.** O ritmo de ganho de participação em 2020–2023 prediz a inadimplência de 2025–2026 entre
  instituições. A Caixa é o caso extremo e está recuando.
- **Por que importa.** Dá uma regra de governança (limite de velocidade) e aponta de quem recapturar clientes bons.
- **Como testar.** IF.data: variação de participação no rural PF de 12/2019 a 12/2023 contra vencidos em 06/2026,
  por instituição (corte transversal com 20 a 30 instituições); releases da Caixa; SICOR (contratações recentes).
- **Confirma se** a correlação é positiva e significativa. **Refuta se** não há relação.
- **Decisão.** Verdadeira → limites internos de velocidade por praça e programa de captura seletiva de clientes de
  concorrentes em retirada. Falsa → o crescimento em si não é o problema.
- **Hoje.** Caixa: 1,2% → 6,8% do rural PF [IFD]; inadimplência acima de 90 dias de 25,4% e contratações em queda
  de 23% em 2026 [I-09]. Cooperativas cresceram e têm atraso baixo: **evidência mista**.

### P08 O seguro rural reduz a perda, e a queda dos prêmios eleva o risco da próxima safra
- **Enunciado.** Operações com seguro ou Proagro perdem menos, e a retração de 2026 na contratação de seguro
  aumenta a perda dado o inadimplemento em 2027.
- **Por que importa.** Define se vale exigir ou subsidiar seguro em vez de dar desconto de taxa.
- **Como testar.** SICOR (tipo de seguro por contrato, por município); MAPA SISSER (apólices, prêmio, sinistro por
  município e cultura); SUSEP SES; SCR.data (inadimplência por UF). Painel município × safra.
- **Confirma se** municípios com maior cobertura têm inadimplência significativamente menor após choque climático.
  **Refuta se** a cobertura não altera o resultado.
- **Decisão.** Verdadeira → seguro como condição ou subsídio cruzado. Falsa → priorizar garantias reais e limite.
- **Hoje.** Prêmios de seguro agrícola da Brasilseg caíram 32,3% no 3T26 e os de penhor rural, 24,6% [I-27].

### P09 [top 10] O risco climático é previsível o bastante para entrar no preço e no limite
- **Enunciado.** Um escore feito só com dado público (ZARC, índice ENSO, chuva e umidade do solo, NDVI) antecipa
  em 6 a 9 meses a inadimplência rural por UF ou município.
- **Por que importa.** É a base das duas propostas ilustrativas de `fatores-externos-e-propostas.md` §4.3 e §4.4.
- **Como testar.** Backtest 2019–2026 fora da amostra: alvo em SCR.data (inadimplência rural por UF) e SISSER
  (sinistralidade por município); preditores em CHIRPS, ERA5-Land, NOAA ONI, MAPA ZARC e IBGE PAM. Comparar com o
  baseline sazonal.
- **Confirma se** a AUC fora da amostra é de pelo menos 0,70 e supera o baseline. **Refuta se** fica abaixo de 0,60.
- **Decisão.** Verdadeira → monitor de risco de safra e preço por risco na parcela de taxa livre. Falsa →
  proteger-se com garantia, seguro e limites, sem tentar prever.
- **Hoje.** El Niño forte em curso (ONI +2,46) no plantio da safra 2026/27 [FE]. Sem teste.

### P10 As recuperações judiciais de produtores antecipam a inadimplência
- **Enunciado.** O fluxo de pedidos de recuperação judicial rural por comarca é um sinal antecedente de 2 a 4
  trimestres da inadimplência rural regional.
- **Por que importa.** Daria um alerta precoce barato.
- **Como testar.** CNJ Datajud (processos por comarca e classe); Serasa (indicador trimestral); SCR.data e SGS 21148.
  Correlação defasada por UF, com placebo.
- **Confirma se** a defasagem de 2 a 4 trimestres é significativa. **Refuta se** os pedidos são coincidentes ou
  atrasados.
- **Decisão.** Verdadeira → incluir no monitor de P09. Falsa → descartar o sinal.
- **Hoje.** 1.990 pedidos em 2025 (recorde); 474 no 1T26 (+21,9%) e 448 no 2T26 (−20,7%), enquanto a
  inadimplência seguiu subindo [I-14], [FE]. O recuo no 2T26 sem recuo da inadimplência sugere **coincidente ou
  fraca**.

### P11 A renegociação da MP 1.376/2026 adia, mas não cura
- **Enunciado.** A adesão fica abaixo do necessário e a carteira renegociada volta a atrasar em proporção alta.
- **Por que importa.** Define a provisão adicional e o tamanho do problema em 2027.
- **Como testar.** Fatos relevantes e releases do BB (CVM IPE): carteira renegociada, taxa de cura; balancetes
  Cosif 2025 (contas de operações renegociadas); SGS 21148; atos do CMN que regulamentam a MP.
- **Confirma se** até o 1T27 a adesão é menor que metade do elegível, ou a carteira renegociada apresenta atraso
  acima do dobro da carteira normal. **Refuta se** a inadimplência do agro cai por dois trimestres seguidos com a
  renegociação.
- **Decisão.** Verdadeira → provisão e execução de garantias no centro do plano de 2027. Falsa → a carteira se
  normaliza e a prioridade volta a ser a originação.
- **Hoje.** O fato relevante de 11/11/2026 cita renegociações "abaixo do inicialmente esperado" [FE]. Em
  setembro e outubro, o recebimento teria ficado perto de 70%, contra 90% esperados (imprensa de nov/2026 sobre a
  teleconferência; conferir na transcrição).

### P12 A relação com o agro é subutilizada fora do crédito
- **Enunciado.** A fatia do BB nos demais serviços ao produtor (seguro, consórcio de máquinas, câmbio, pagamentos
  da cadeia, investimentos) é bem menor que os 53% do crédito.
- **Por que importa.** Receita que consome pouco capital, num momento de capital apertado.
- **Como testar.** SUSEP SES (prêmios de seguro rural por seguradora); BCB, dados de consórcios por
  administradora e segmento (**fonte nova**); IF.data (comércio exterior e câmbio); releases da BB Seguridade.
- **Confirma se** a fatia em pelo menos três desses serviços é menor que metade da fatia no crédito rural.
  **Refuta se** já é comparável.
- **Decisão.** Verdadeira → plano de venda cruzada para o produtor, com meta por serviço. Falsa → o espaço é pequeno.
- **Hoje.** Comércio exterior: 25,4% [IFD]. Demais: [H].

### P13 O Sul mostra o que as outras regiões vão viver
- **Enunciado.** O avanço das cooperativas no Sul se repete, com atraso, no Centro-Oeste e no Sudeste.
- **Por que importa.** Indica onde defender antes de perder.
- **Como testar.** IF.data por região (2012–2026); Unicad e BcBase (pontos de atendimento de cooperativas por
  município e data de abertura); ESTBAN (BB por município). Curvas de adoção por UF.
- **Confirma se** a fatia das cooperativas no Centro-Oeste e no Sudeste segue trajetória paralela à do Sul com
  defasagem. **Refuta se** estaciona.
- **Decisão.** Verdadeira → defesa preventiva nas praças de fronteira. Falsa → tratar o Sul como caso à parte.
- **Hoje.** Cooperativas singulares: Sul 10,6% → 16,8%; Centro-Oeste 6,0% → 7,7%; Sudeste 2,5% → 4,5% [IFD].

---

## B. Varejo pessoa física

### P14 [top 10] O crédito pessoal perdido para os digitais era cliente rentável
- **Enunciado.** A queda do BB no crédito pessoal sem consignação veio de clientes de risco aceitável que
  migraram, e não de risco que o BB evitou.
- **Por que importa.** Decide se vale disputar esse mercado ou cedê-lo.
- **Como testar.** IF.data (saldo, vencidos e número de clientes por instituição, 2019–2026); BCB, taxas de juros
  por instituição e modalidade (`taxaJuros/v2`); cálculo de margem ajustada ao risco aproximada = taxa − vencidos ×
  perda presumida, BB contra Nubank e Mercado Pago.
- **Confirma se** a margem ajustada ao risco dos digitais é igual ou maior que a do BB. **Refuta se** é claramente
  menor (cresceram comprando risco).
- **Decisão.** Verdadeira → disputar com oferta digital e preço por risco. Falsa → ceder o segmento e concentrar o
  capital no consignado.
- **Hoje.** BB 22,5% → 14,0%; Nubank 0,2% → 15,1%. Vencidos acima de 15 dias: Nubank 8,4%, BB 4,6%, sistema 6,4%
  [IFD]. Falta a taxa cobrada.

### P15 [top 10] A portabilidade vai corroer a posição no consignado
- **Enunciado.** Com a portabilidade pelo Open Finance chegando ao consignado, o BB perde participação ou margem
  de forma mensurável em 12 meses.
- **Por que importa.** O consignado (cerca de R$ 154 bi no BB, [IFD]) é o ativo PF de menor risco do banco.
- **Como testar.** IF.data (consignado por instituição, trimestral); BCB, estatísticas de portabilidade de crédito
  (**fonte nova**); taxas de juros do consignado por instituição; Open Finance, endpoints `opendata-loans`.
  Comparação antes e depois da data de início, com o crédito pessoal (portável desde fev/2026) como caso anterior.
- **Confirma se** a fatia do BB cai mais de 1 p.p. em 12 meses ou a taxa média cai mais que a dos pares.
  **Refuta se** nada muda em 4 trimestres.
- **Decisão.** Verdadeira → retenção ativa (preço dinâmico, refinanciamento proativo) e uso ofensivo da
  portabilidade sobre clientes de outros bancos. Falsa → manter a política atual.
- **Hoje.** 21,2% → 19,2% em 6,5 anos, ainda sem portabilidade digital [IFD]. Início previsto para nov/2026 [I-22].

### P16 O Crédito do Trabalhador cresce com risco pior do que parece
- **Enunciado.** O consignado privado tem inadimplência próxima à do crédito pessoal, e a liderança inicial do BB
  na originação se traduz em perda acima da precificada.
- **Por que importa.** O BB declarou meta de 20% desse mercado [I-19].
- **Como testar.** BCB (boxes do Relatório de Política Monetária e SGS do consignado privado, código a fixar);
  Ministério do Trabalho (volumes por instituição); releases do BB.
- **Confirma se** a inadimplência da modalidade, por safra de concessão, supera a do crédito pessoal sem
  consignação. **Refuta se** estabiliza perto da do consignado tradicional.
- **Decisão.** Verdadeira → crescer só com modelo de risco por empregador e rotatividade. Falsa → acelerar.
- **Hoje.** O BCB apontou, em out/2026, inadimplência acima da do crédito pessoal a partir do 5º mês [I-20].

### P17 No cartão, o BB tem posição mediana e risco em alta
- **Enunciado.** O BB perde participação no cartão e, ao mesmo tempo, vê os atrasos subirem acima do sistema.
- **Por que importa.** Perder mercado e piorar o risco juntos indica seleção adversa.
- **Como testar.** IF.data (cartão: saldo e vencidos por instituição); DASFN (taxas de cartão por emissor);
  Monitor Abecs (volume do mercado).
- **Confirma se** os vencidos do BB ficam acima do sistema por 3 trimestres seguidos. **Refuta se** convergem.
- **Decisão.** Verdadeira → reduzir limites e reposicionar o cartão como produto de relacionamento. Falsa → manter.
- **Hoje.** Fatia de 11,6% → 9,4%. Vencidos acima de 15 dias: BB 15,4%, sistema 12,1% (06/2026) [IFD].

### P18 O imobiliário é um espaço em branco para a base de servidores
- **Enunciado.** O BB tem uma base de clientes de renda estável e quase não participa do crédito habitacional.
- **Por que importa.** É o maior mercado de crédito PF (R$ 1,4 tri) e fideliza por décadas.
- **Como testar.** IF.data (habitação por instituição); taxas de juros do imobiliário por instituição; RAIS
  (servidores por município); estrutura de funding (a poupança do BB é majoritariamente rural e tem direcionamento
  próprio: [H] a confirmar nas normas do MCR).
- **Confirma se** o BB tem fatia de habitação menor que um terço da sua fatia de consignado em todas as regiões e
  dispõe de funding compatível. **Refuta se** falta funding de longo prazo a custo competitivo.
- **Decisão.** Verdadeira → oferta dirigida a servidores com funding de mercado. Falsa → parceria ou distribuição.
- **Hoje.** 7,7% → 3,2% [IFD]. O saldo do BB ficou parado em cerca de R$ 46 bi enquanto o mercado dobrou.

### P19 Em veículos, o caminho é a participação no Banco BV
- **Enunciado.** O BB compete em veículos por meio da participação societária no Banco BV, e o balanço próprio é
  irrelevante.
- **Por que importa.** Evita gastar capital num mercado em que já há um veículo.
- **Como testar.** CVM FRE do BB (participações em sociedades); IF.data (veículos por instituição, incluindo o BV).
- **Confirma se** a participação no BV é relevante e o BV mantém fatia. **Refuta se** a participação foi vendida
  ou o BV perde mercado.
- **Decisão.** Verdadeira → não abrir frente própria. Falsa → reavaliar.
- **Hoje.** BB direto com 2,5% [IFD]. Participação no BV: [M], a confirmar.

### P20 A conta principal dos mais jovens saiu do BB
- **Enunciado.** O BB mantém a principalidade onde há folha e perde nos demais clientes.
- **Por que importa.** Sem principalidade, não há depósito barato nem dado de comportamento.
- **Como testar.** IF.data (depósitos à vista e número de clientes); Pix, dados abertos (chaves e transações por
  participante); pesquisas públicas (Raio X do Investidor da ANBIMA; Datafolha para a Abecs).
- **Confirma se** a fatia do BB nas transações Pix é menor que a fatia nos depósitos e cai mais rápido.
  **Refuta se** acompanha.
- **Decisão.** Verdadeira → programa de principalidade por público. Falsa → foco em rentabilizar a base atual.
- **Hoje.** Depósitos à vista: 22,3% → 17,0% [IFD]. O Nubank informa 113 milhões de clientes no Brasil [I-08].

### P21 A qualidade do atendimento é um diferencial mensurável
- **Enunciado.** O BB tem índice de reclamações menor que o dos pares e o dos digitais.
- **Por que importa.** Se for verdade, é argumento de marca; se não, é fragilidade.
- **Como testar.** BCB, ranking de reclamações (trimestral, 2019–2026) e ranking de ouvidorias.
- **Confirma se** o BB fica no melhor terço entre os dez maiores por 8 trimestres. **Refuta se** fica no pior.
- **Decisão.** Verdadeira → usar na comunicação e na retenção. Falsa → corrigir antes de qualquer ofensiva.
- **Hoje.** [H]. Sem cálculo.

---

## C. Funding e marca

### P22 [top 10] O custo relativo de captação do BB subiu
- **Enunciado.** A perda de participação em depósitos à vista e LCA já aparece no custo médio de captação,
  medido em % do CDI, frente aos pares.
- **Por que importa.** O funding barato sustenta a margem e o preço do crédito rural e do consignado.
- **Como testar.** IF.data (Passivo e Demonstração de Resultado) e balancetes Cosif: despesa de captação ÷ saldo
  médio captado, por semestre, 2014–2026, BB contra Itaú, Bradesco, Santander, Caixa e Sicredi; DASFN (LIQ1 e NSFR).
- **Confirma se** o custo do BB em % do CDI sobe pelo menos 3 p.p. em relação à média dos pares em 5 anos.
  **Refuta se** o diferencial fica estável.
- **Decisão.** Verdadeira → defender depósitos (gestão de caixa de prefeituras e do agro, remuneração automática)
  e reprecificar ativos. Falsa → a perda de participação é só de volume, e a vantagem de preço continua.
- **Hoje.** Depósitos à vista 22,3% → 17,0%; LCA 49,4% → 32,6%; captações 18,7% → 14,9% [IFD]. Custo: sem cálculo.

### P23 Os depósitos judiciais deixaram de ser cativos
- **Enunciado.** Tribunais passaram a licitar ou renegociar a custódia dos depósitos judiciais, e o BB perde saldo
  ou paga mais por ele.
- **Por que importa.** É funding estável e barato, obtido por posição institucional.
- **Como testar.** Balancetes Cosif (conta de depósitos judiciais por instituição); ESTBAN (verbete 414, se voltar
  a ser aberto); editais e contratos dos tribunais (PNCP e diários oficiais, **fonte nova**); atos do CNJ.
- **Confirma se** o saldo do BB cai ou a remuneração paga aos tribunais sobe em pelo menos três grandes tribunais
  até 2027. **Refuta se** os contratos são renovados nas mesmas condições.
- **Decisão.** Verdadeira → precificar a disputa tribunal a tribunal. Falsa → manter.
- **Hoje.** O TJRJ cobrou mais competitividade do BB (contrato vence em jul/2027) [I-30]. Outros tribunais levaram
  depósitos a um banco regional, com crise posterior [I-31].

### P24 A poupança rural encolhe e leva junto o funding direcionado
- **Enunciado.** A captação líquida da poupança é negativa, e isso reduz a fonte obrigatória do crédito rural do BB.
- **Por que importa.** Obriga a trocar funding barato por LCA ou recursos livres.
- **Como testar.** SGS (saldo e captação líquida da poupança rural, código a fixar); IF.data (poupança por
  instituição); SICOR (fonte de recursos das contratações do BB).
- **Confirma se** a parcela do crédito rural do BB financiada por poupança cai mais de 5 p.p. em 3 safras.
  **Refuta se** fica estável.
- **Decisão.** Verdadeira → novo desenho de funding do rural. Falsa → sem ação.
- **Hoje.** Fatia do BB na poupança estável (21,1% → 20,7%) [IFD]. Composição das fontes: sem cálculo.

### P25 Em momentos de estresse, o depósito corre para o BB
- **Enunciado.** Quando um banco médio ou digital entra em crise, o BB ganha depósitos acima da sua fatia.
- **Por que importa.** Mede o valor da marca em reais.
- **Como testar.** ESTBAN e IF.data (depósitos por instituição) em torno de eventos de 2023 a 2026; estudo de
  evento com os fatos relevantes e as intervenções (CVM IPE; comunicados do BCB).
- **Confirma se** a captação líquida do BB nos dois trimestres seguintes supera a esperada pela sua fatia.
  **Refuta se** o fluxo vai para Caixa, Itaú ou títulos públicos.
- **Decisão.** Verdadeira → produto e comunicação de "porto seguro". Falsa → a marca não rende funding.
- **Hoje.** [H]. O episódio de 2026 com um banco regional [I-31] é um experimento natural disponível.

---

## D. Setor público e rede física

### P26 [top 10] Onde o BB é o único banco, ele ganha mais e perde menos
- **Enunciado.** Nos municípios em que só o BB tem agência, a fatia de depósitos e de crédito é maior e mais
  estável, até a chegada de uma cooperativa.
- **Por que importa.** Decide se a capilaridade é ativo a ampliar ou custo a cortar.
- **Como testar.** `data/ifs/estban/` (mensal por município, 2014–2026); BCB, cadastro de agências e postos
  (aberturas e fechamentos); Unicad e BcBase (pontos de cooperativas por município e data). Diferenças em
  diferenças escalonado (Callaway e Sant'Anna) com dois eventos: saída de banco privado e entrada de cooperativa.
- **Confirma se** a saída de um concorrente eleva depósitos do BB no município, e a entrada de cooperativa os
  reduz em mais de 10% em 3 anos. **Refuta se** nenhum dos eventos altera a trajetória.
- **Decisão.** Verdadeira → mapa de prioridade municipal: defender onde a cooperativa está chegando, ocupar onde
  o privado saiu. Falsa → reduzir a rede sem perda relevante.
- **Hoje.** BB em 2.300 municípios; único banco em 555 (437 em 12/2022); sistema com 23% menos agências [EST].

### P27 A folha do setor público vale mais do que o BB paga por ela, mas já não prende o cliente
- **Enunciado.** O valor de uma folha de pagamento (consignado, depósitos, seguros) supera o preço pago nos
  leilões, mas a portabilidade de salário e de crédito reduz esse valor a cada ano.
- **Por que importa.** Define o lance máximo em cada licitação de folha.
- **Como testar.** PNCP e diários oficiais (contratos de folha: vencedor, valor, prazo, **fonte nova**); RAIS
  (servidores por ente); IF.data e ESTBAN (consignado e depósitos por município antes e depois da troca de banco).
- **Confirma se** a troca de banco da folha desloca mais de 20% do consignado local em 3 anos. **Refuta se** o
  deslocamento é pequeno (o cliente já não segue a folha).
- **Decisão.** Verdadeira → disputar folhas com valuation por valor do cliente. Falsa → pagar menos e investir
  em retenção direta.
- **Hoje.** BB com cerca de 25% do consignado de servidores ([I-19], um veículo). Sem série de leilões.

### P28 A relação com o governo dá escala e cobra em concentração e em desconto
- **Enunciado.** O papel de agente de políticas públicas traz volume e receita, mas concentra risco no agro e
  alimenta o desconto de governança na ação.
- **Por que importa.** É a condição de contorno de todo o plano.
- **Como testar.** Tesouro (equalização paga por instituição, **fonte nova**); SICOR (fonte de recursos); DFP do
  BB (nota de partes relacionadas); estudo de evento com fatos relevantes e anúncios de política (CVM IPE; B3).
- **Confirma se** a receita ligada a programas é relevante e os anúncios de política geram retorno anormal
  negativo. **Refuta se** os eventos políticos não movem o preço.
- **Decisão.** Verdadeira → propor regras explícitas de precificação e de limite para operações de política.
  Falsa → tratar como ruído.
- **Hoje.** Retorno anormal de −9,3% na revisão de 11/11/2026 (pacote de resultado e projeção) [FE]. [H] no resto.

### P29 O BB lidera o dinheiro dos municípios e dos regimes próprios, com taxa baixa
- **Enunciado.** A BB Asset concentra recursos de regimes próprios de previdência e de caixa de prefeituras, com
  taxa de administração média inferior à do mercado.
- **Por que importa.** Volume sem margem é vulnerável a concorrentes de plataforma.
- **Como testar.** CADPREV (demonstrativos de aplicações dos regimes próprios, **fonte nova**); CVM, dados
  abertos de fundos (patrimônio, captação e taxa por gestor); ranking de gestão da ANBIMA.
- **Confirma se** a fatia do BB nos regimes próprios supera 30% e a taxa média é menor que a mediana.
  **Refuta se** a fatia é comparável à dos pares.
- **Decisão.** Verdadeira → defender com serviço (assessoria atuarial, ALM) em vez de taxa. Falsa → sem ação.
- **Hoje.** [H]. Fontes de imprensa conflitam sobre o patrimônio da BB Asset [I-29].

---

## E. Pessoa jurídica

### P30 As cooperativas tomaram o capital de giro da pequena empresa
- **Enunciado.** A perda do BB em capital de giro PJ se concentra em micro e pequenas empresas e foi para as
  cooperativas.
- **Por que importa.** É o cliente PJ que mais traz depósito à vista.
- **Como testar.** IF.data (PJ por porte do tomador e por modalidade, por instituição); taxas de juros de capital
  de giro por instituição; dados públicos de programas garantidos (Pronampe e FGO).
- **Confirma se** mais de 60% da perda do BB está nos portes micro e pequeno. **Refuta se** está em médias e
  grandes (migração para o mercado de capitais).
- **Decisão.** Verdadeira → oferta para MPE com gerente local e conta integrada. Falsa → ver P33.
- **Hoje.** BB 16,1% → 10,9%; cooperativas singulares 10,7% → 18,6% [IFD]. Sem abertura por porte.

### P31 O comércio exterior é a franquia PJ que cresce e se liga ao agro
- **Enunciado.** O ganho do BB em comércio exterior vem do financiamento à exportação da cadeia do agro.
- **Por que importa.** É onde a relação com o agro rende sem carregar o risco do produtor.
- **Como testar.** IF.data (comércio exterior por instituição; CNAE do tomador); IF.data, relatório de câmbio;
  Comex Stat (exportações por UF e produto).
- **Confirma se** mais da metade da carteira de comércio exterior do BB está em CNAEs do agro e da agroindústria.
  **Refuta se** está dispersa.
- **Decisão.** Verdadeira → ampliar com câmbio, hedge e adiantamentos para cooperativas e tradings. Falsa →
  tratar como linha de atacado comum.
- **Hoje.** 18,4% → 25,4% [IFD].

### P32 No crédito de investimento, o BB perdeu espaço como repassador
- **Enunciado.** A queda no crédito de investimento PJ reflete menor uso de repasses e a entrada de cooperativas.
- **Por que importa.** Indica se o BB ainda é o canal natural de recursos de fomento.
- **Como testar.** IF.data (PJ investimento por instituição); dados abertos do BNDES (operações indiretas por
  agente financeiro, **fonte nova**).
- **Confirma se** a fatia do BB nas operações indiretas do BNDES cai junto. **Refuta se** se mantém.
- **Decisão.** Verdadeira → rever a estratégia de repasse. Falsa → a queda é de recursos próprios.
- **Hoje.** 37,5% → 29,0% (com recuperação desde 12/2022) [IFD].

### P33 A grande empresa foi para o mercado de capitais, e o BB capta pouco desse fluxo
- **Enunciado.** A fatia do BB na originação e distribuição de renda fixa corporativa é bem menor que sua fatia
  no crédito PJ.
- **Por que importa.** É receita de serviço, sem consumo de capital.
- **Como testar.** Rankings de originação e distribuição da ANBIMA (2019–2026); boletins de mercado de capitais.
- **Confirma se** a fatia em originação é menor que metade da fatia no crédito PJ (11,8%). **Refuta se** é comparável.
- **Decisão.** Verdadeira → reforçar o banco de investimento, sobretudo em títulos do agro. Falsa → sem ação.
- **Hoje.** [H].

---

## F. Pagamentos e canais

### P34 A Cielo deixou de dar vantagem ao banco
- **Enunciado.** Com a fatia atual, a adquirência não garante mais a conta principal do lojista para o BB.
- **Por que importa.** Decide entre integrar a Cielo à oferta do banco ou reduzir a exposição.
- **Como testar.** BCB, estatísticas de pagamentos de varejo (credenciadores, **fonte nova**); Monitor Abecs;
  demonstrações da Cielo; IF.data (recebíveis PJ por instituição).
- **Confirma se** a fatia do BB em operações com recebíveis fica parada enquanto a das adquirentes independentes
  cresce. **Refuta se** o BB ganha em recebíveis.
- **Decisão.** Verdadeira → integração total (conta, maquininha e antecipação num pacote) ou saída. Falsa → manter.
- **Hoje.** Rede 18%, Cielo 17%, PagBank 17%, Stone 15%, Mercado Pago 9% do volume (jan/2026) [I-28]. BB com 5,6%
  das operações com recebíveis, estável [IFD].

### P35 O Pix tirou receita de tarifa e tornou o depósito mais móvel
- **Enunciado.** A receita de serviços de conta corrente do BB cai em termos reais desde 2021, e a rotatividade
  dos depósitos à vista aumentou.
- **Por que importa.** Dimensiona quanto da receita de serviços precisa ser reposta.
- **Como testar.** DFP/ITR e releases do BB (receita de prestação de serviços por linha); BCB, tarifas por
  instituição; Pix, dados abertos por participante.
- **Confirma se** a receita de conta corrente e de transferências cai mais de 15% em termos reais em 5 anos.
  **Refuta se** fica estável.
- **Decisão.** Verdadeira → reposição com serviços sobre o Pix (cobrança recorrente, crédito no ato do pagamento).
  Falsa → sem urgência.
- **Hoje.** Pix com 54,7% das transações de varejo [I-24]. Receita do BB por linha: sem leitura.

### P36 No Open Finance, o BB entrega mais dados do que recebe
- **Enunciado.** O BB é transmissor líquido de dados: mais clientes autorizam o envio dos seus dados do BB para
  outros do que o inverso.
- **Por que importa.** Quem só transmite alimenta o modelo de risco do concorrente.
- **Como testar.** Painéis públicos do Open Finance Brasil (consentimentos por instituição transmissora e
  receptora, **fonte nova**); diretório de participantes.
- **Confirma se** a razão recebidos ÷ transmitidos do BB é menor que 0,5. **Refuta se** é próxima de 1 ou maior.
- **Decisão.** Verdadeira → jornada ativa de captura de dados e de portabilidade. Falsa → manter.
- **Hoje.** [H]. Cerca de 200 milhões de consentimentos no sistema em 2026 [I-21].

### P37 As instituições de pagamento capturaram o fluxo do pequeno lojista
- **Enunciado.** Adquirentes independentes e marketplaces usam o fluxo de vendas para dar crédito e reter o saldo
  do pequeno lojista.
- **Por que importa.** É o mesmo cliente de P30, atacado por outro flanco.
- **Como testar.** IF.data (crédito PJ e saldo de contas de pagamento pré-pagas por conglomerado prudencial);
  demonstrações das adquirentes listadas.
- **Confirma se** o crédito PJ dessas instituições cresce mais de 20% ao ano por 3 anos. **Refuta se** estaciona.
- **Decisão.** Verdadeira → oferta integrada com a Cielo (P34). Falsa → sem ação.
- **Hoje.** Mercado Pago com cerca de metade do saldo de contas pré-pagas do sistema (R$ 119 bi) e 3,6% do
  crédito pessoal sem consignação [IFD].

---

## G. Conglomerado

### P38 A seguridade depende do canal do banco
- **Enunciado.** Os prêmios da Brasilseg acompanham a originação de crédito do BB, com pouca venda independente.
- **Por que importa.** A empresa mais rentável do grupo herda o ciclo do banco.
- **Como testar.** Releases da BB Seguridade (prêmios por linha, trimestral); SUSEP SES; originação de crédito
  rural (SICOR) e consignado (IF.data). Correlação e elasticidade.
- **Confirma se** mais de 70% da variação dos prêmios de rural e prestamista é explicada pela originação do BB.
  **Refuta se** a relação é fraca.
- **Decisão.** Verdadeira → diversificar canais e produtos não ligados a crédito. Falsa → sem ação.
- **Hoje.** Prêmios da Brasilseg −19% no 3T26; agrícola −32,3%; prestamista −26,9% [I-27].

### P39 A gestão de recursos tem volume alto e margem baixa
- **Enunciado.** A BB Asset lidera em patrimônio, mas com concentração em renda fixa e fundos do setor público, e
  perde o investidor de alta renda para plataformas.
- **Por que importa.** Indica onde está a receita por real gerido.
- **Como testar.** CVM, dados abertos de fundos (patrimônio, captação líquida e taxa por gestor e classe,
  2019–2026); ranking de gestão da ANBIMA.
- **Confirma se** a captação líquida da BB Asset em fundos de varejo de maior taxa é negativa por 3 anos.
  **Refuta se** é positiva.
- **Decisão.** Verdadeira → arquitetura aberta e assessoria. Falsa → manter.
- **Hoje.** [H]; fontes conflitantes [I-29].

### P40 O consórcio cresce como substituto do crédito caro
- **Enunciado.** Com juro alto, o consórcio de máquinas agrícolas e veículos pesados cresce mais que o
  financiamento, e o BB está bem posicionado.
- **Por que importa.** Receita de taxa sem risco de crédito.
- **Como testar.** BCB, dados de consórcios por administradora e segmento (**fonte nova**); Anfavea (máquinas).
- **Confirma se** as cotas ativas do segmento crescem mais que o crédito de investimento rural por 2 anos e a BB
  Consórcios ganha fatia. **Refuta se** perde.
- **Decisão.** Verdadeira → meta própria e oferta casada com o crédito rural. Falsa → sem ação.
- **Hoje.** [H].

---

## H. Eficiência, dados e IA

### P41 A rede física é um custo que os digitais não têm
- **Enunciado.** A despesa administrativa por cliente do BB é várias vezes a dos bancos digitais, e a diferença
  não é coberta por receita por cliente.
- **Por que importa.** Junto com P26, decide o formato da rede.
- **Como testar.** IF.data (Demonstração de Resultado: despesas de pessoal e administrativas; número de clientes);
  releases (base de clientes); cadastro de agências.
- **Confirma se** a razão receita ÷ despesa por cliente do BB é menor que a do Nubank e do Inter. **Refuta se** é maior.
- **Decisão.** Verdadeira → formato leve de agência e digitalização do atendimento. Falsa → a rede se paga.
- **Hoje.** [H].

### P42 A escala de dados do BB não vira melhor seleção de risco
- **Enunciado.** Com mais histórico que qualquer concorrente no rural e no setor público, o BB deveria ter
  inadimplência ajustada ao mix menor que a do sistema. Não tem.
- **Por que importa.** Se confirmada, o investimento prioritário é em modelos e não em mais dados.
- **Como testar.** O mesmo painel de P02, estendido ao consignado e ao crédito pessoal: inadimplência do BB menos
  a esperada pelo mix (região, modalidade, porte), 2014–2026.
- **Confirma se** o resíduo do BB é zero ou positivo no rural e no pessoal. **Refuta se** é negativo e
  significativo (o BB seleciona melhor).
- **Decisão.** Verdadeira → programa de modelos de risco com dado proprietário mais dado público (P09).
  Falsa → a vantagem existe e deve ser estendida.
- **Hoje.** Rural: BB 6,2% contra 5,6% do sistema. Consignado: BB 0,5% contra 1,4% (aqui o BB é melhor) [IFD].

### P43 A IA favorece quem tem dado proprietário e escala de atendimento
- **Enunciado.** Bancos que divulgam uso amplo de IA em atendimento e crédito mostram ganho mensurável de
  eficiência nos 2 anos seguintes.
- **Por que importa.** Dá a ordem de grandeza do ganho possível para o BB.
- **Como testar.** Pesquisa FEBRABAN de Tecnologia Bancária (gasto e uso); releases dos bancos (CVM IPE); IF.data
  (índice de eficiência); ranking de reclamações.
- **Confirma se** há melhora de eficiência associada, com defasagem, nos bancos que mais investiram. **Refuta se**
  não há relação.
- **Decisão.** Verdadeira → metas de eficiência atreladas a casos de uso. Falsa → investir com cautela.
- **Hoje.** [H]. Testabilidade baixa: a divulgação é desigual.

### P44 A base do BB envelhece mais rápido que a do sistema
- **Enunciado.** A base ativa do BB tem idade média maior e renova menos que a dos concorrentes.
- **Por que importa.** Risco de perda lenta de principalidade.
- **Como testar.** Pesquisas públicas com recorte etário (Raio X do Investidor, Datafolha); dados do Pix por
  faixa etária (sistema); releases do BB. Sem fonte pública por instituição.
- **Confirma se** as pesquisas mostram o BB sub-representado abaixo de 30 anos por 3 edições. **Refuta se** não.
- **Decisão.** Verdadeira → oferta de entrada (universitário, primeiro emprego, filho de produtor). Falsa → sem ação.
- **Hoje.** [H]. Testabilidade baixa com dado público.

---

## I. Capital, regulação e entrantes

### P45 [top 10] O capital é a restrição ativa
- **Enunciado.** Com capital principal perto de 10,8% e lucro comprimido, o BB não tem capital para defender
  participação em todos os mercados ao mesmo tempo.
- **Por que importa.** Transforma o plano numa escolha de prioridades por retorno sobre capital.
- **Como testar.** DASFN (KM1, OV1 e tabelas CR do BB, trimestral, 2020–2026); exigências regulatórias vigentes;
  simulação de consumo de RWA por mercado sob cenários de crescimento.
- **Confirma se** a folga sobre o mínimo regulatório com adicionais é menor que 1,5 p.p. no cenário base de 2027.
  **Refuta se** passa de 2,5 p.p.
- **Decisão.** Verdadeira → orçamento de capital por mercado, com corte explícito do que não paga o capital.
  Falsa → há espaço para ofensiva em mais de uma frente.
- **Hoje.** Capital principal de 10,80% (11,16% um ano antes); payout no mínimo de 25% [I-01], [I-03].

### P46 A Res. 4.966 explica parte do salto do custo do crédito
- **Enunciado.** Uma parte mensurável do aumento da provisão do BB em 2025–26 vem da regra de perda esperada
  aplicada a créditos rurais de parcela única, e não de deterioração adicional.
- **Por que importa.** Separa o efeito contábil do econômico e muda a leitura do pico.
- **Como testar.** Balancetes Cosif (contas novas de provisão por estágio); IF.data antes e depois de 03/2025;
  comparação BB contra pares com menos crédito de parcela única; notas explicativas (DFP).
- **Confirma se** o aumento da provisão do BB supera o dos vencidos em proporção maior que a dos pares.
  **Refuta se** a proporção é igual.
- **Decisão.** Verdadeira → parte do custo se reverte quando a carteira gira; projeções menos pessimistas.
  Falsa → o custo é todo econômico.
- **Hoje.** [H]. A quebra de série de 03/2025 está documentada [FI].

### P47 A concentração no agro é grande frente ao capital
- **Enunciado.** A exposição do BB ao agronegócio equivale a mais de duas vezes o seu patrimônio, e um choque
  regional consome capital de forma relevante.
- **Por que importa.** Justifica limites de concentração e transferência de risco.
- **Como testar.** Releases (carteira agro); IF.data (patrimônio); ESTBAN × PAM (concentração por cultura e UF);
  cenário de perda com as sensibilidades de P09.
- **Confirma se** um choque de 1 desvio-padrão na principal cultura consome mais de 0,5 p.p. de capital principal.
  **Refuta se** consome menos de 0,2 p.p.
- **Decisão.** Verdadeira → limites, seguro e securitização para reduzir concentração. Falsa → a concentração é
  suportável.
- **Hoje.** Carteira agro de R$ 403,6 bi [I-01] contra patrimônio de R$ 181,8 bi (06/2026, [FI] §3.1): 2,2 vezes.

### P48 Juro alto por mais tempo prolonga o ciclo do agro
- **Enunciado.** A inadimplência rural responde mais ao custo de rolagem (Selic) do que a preço e clima.
- **Por que importa.** Se o juro for o fator dominante, a saída do ciclo depende da política monetária.
- **Como testar.** Painel UF × mês de `fatores-externos-e-propostas.md` §2.2: SCR.data contra Selic (SGS 432),
  preços (CEPEA), clima (CHIRPS) e custos (CONAB, Pink Sheet). Decomposição da variância.
- **Confirma se** o juro explica a maior parcela da variação desde 2023. **Refuta se** preço e clima dominam.
- **Decisão.** Verdadeira → cenário de saída ligado ao Focus. Falsa → foco em clima e preço (P09).
- **Hoje.** [H]. Selic em 13,75% [FE].

### P49 A assimetria regulatória a favor das cooperativas está diminuindo
- **Enunciado.** Mudanças em exigibilidades, tributação e regras prudenciais reduzem a vantagem de custo das
  cooperativas nos próximos 3 anos.
- **Por que importa.** Se a vantagem delas for regulatória e temporária, esperar pode ser melhor que imitar.
- **Como testar.** Normativos do BCB e do CMN (pipeline do repositório); proposições no Congresso (Câmara e
  Senado); custo de captação e eficiência das cooperativas (IF.data).
- **Confirma se** há normas aprovadas que elevam o custo das cooperativas de forma mensurável. **Refuta se** as
  mudanças são marginais.
- **Decisão.** Verdadeira → defender no curto prazo e pressionar por isonomia. Falsa → competir no modelo (P02).
- **Hoje.** O boletim do MAPA cita o início de exigibilidades sobre depósitos à vista de cooperativas [I-12].

### P50 Estrangeiros e bancos de montadora são nicho
- **Enunciado.** Rabobank, bancos de fabricantes de máquinas e outros estrangeiros não ameaçam a fatia do BB.
- **Por que importa.** Evita gastar atenção onde não há disputa.
- **Como testar.** IF.data (rural PF e PJ por instituição).
- **Confirma se** a soma deles fica abaixo de 5% e não cresce. **Refuta se** passa de 8% ou cresce 1 p.p. ao ano.
- **Decisão.** Verdadeira → monitorar apenas. Falsa → analisar o modelo.
- **Hoje.** Rabobank 1,9% → 0,3% do rural PF; John Deere perto de 1,8% até 12/2024 [IFD].

### P51 Nas agfintechs, a ameaça é o modelo e não o volume
- **Enunciado.** As agfintechs são pequenas em carteira, mas originam para fundos e podem crescer como canal do
  mercado de capitais (P05).
- **Por que importa.** Define parceria, aquisição ou cópia.
- **Como testar.** CVM (carteiras de Fiagro e FIDC por originador); Pesquisa ABCD/PwC; releases das empresas.
- **Confirma se** o volume originado por elas para veículos de mercado cresce mais de 50% ao ano. **Refuta se** estaciona.
- **Decisão.** Verdadeira → parceria de originação com dado de satélite e funding do BB. Falsa → monitorar.
- **Hoje.** Agrolend com R$ 968 mi de carteira no fim de 2025 e meta de R$ 2 bi [I-32].

### P52 As big techs ainda não são concorrentes de balanço
- **Enunciado.** As grandes plataformas atuam em iniciação de pagamento e carteira digital, sem crédito relevante.
- **Por que importa.** Indica quando a ameaça muda de natureza.
- **Como testar.** Pix (transações por iniciador de pagamento); cadastro de instituições autorizadas (Unicad);
  IF.data.
- **Confirma se** nenhuma tem carteira de crédito acima de 0,5% do sistema até 2027. **Refuta se** alguma obtém
  licença bancária e passa disso.
- **Decisão.** Verdadeira → parceria de distribuição. Falsa → tratar como P14.
- **Hoje.** [H]. A exceção é o Mercado Pago, já tratado em P37.

### P53 Drex e tokenização não mudam o jogo em 3 anos
- **Enunciado.** A infraestrutura pública de tokenização não entra em produção no horizonte do plano; iniciativas
  privadas ficam restritas a nichos.
- **Por que importa.** Evita investimento prematuro e mantém uma opção barata.
- **Como testar.** Comunicados do BCB; registros da B3 (CPR como valor mobiliário); normativos da CVM.
- **Confirma se** não há piloto público retomado até o fim de 2027. **Refuta se** há cronograma oficial de produção.
- **Decisão.** Verdadeira → manter equipe mínima e observar a CPR tokenizada. Falsa → reavaliar.
- **Hoje.** Plataforma de testes desligada em nov/2025 (imprensa, [I-33]; reconfirmar na fonte oficial).

### P54 As restrições ao saque-aniversário do FGTS afetam pouco o BB
- **Enunciado.** A antecipação do saque-aniversário era produto de bancos médios e fintechs; a restrição quase
  não toca o resultado do BB.
- **Por que importa.** Baixa prioridade, se confirmada.
- **Como testar.** IF.data (crédito pessoal por instituição); releases; resoluções do Conselho Curador do FGTS.
- **Confirma se** a carteira do BB nessa linha é menor que 1% do seu crédito PF. **Refuta se** é maior.
- **Decisão.** Verdadeira → ignorar. Falsa → dimensionar.
- **Hoje.** [H]. As datas de vigência conflitam entre veículos [I-34].

### P55 O preço da ação embute um desconto de governança que o agro ampliou
- **Enunciado.** O BB negocia com desconto persistente de preço sobre valor patrimonial frente aos pares, e o
  desconto aumenta em eventos ligados a política pública e a revisões de projeção.
- **Por que importa.** O custo de capital entra em toda conta de retorno do plano.
- **Como testar.** B3 COTAHIST (preço diário); CVM (patrimônio por ação); estudo de evento sobre todos os fatos
  relevantes do BB de 2019 a 2026, com pares como controle (método em `fatores-externos-e-propostas.md` §2.1).
- **Confirma se** o desconto médio supera 30% e os eventos de política têm retorno anormal negativo significativo.
  **Refuta se** o desconto acompanha só o ROE.
- **Decisão.** Verdadeira → medidas de previsibilidade (projeções, política de crédito de programas, payout).
  Falsa → o desconto se fecha com o resultado.
- **Hoje.** Retorno anormal de −9,3% em 11/11/2026 e de −6,9% em 12/08/2026 (ilustrativos) [FE].

---

## Resumo por estado da evidência

| Estado hoje | Premissas |
|---|---|
| Evidência preliminar **a favor** | P01, P05, P06, P13, P16, P17, P18, P30, P31, P38, P45, P47 |
| Evidência preliminar **mista** | P02, P03, P07, P10, P11, P14, P15, P22, P26, P34, P42 |
| **Sem evidência** (só hipótese) | P04, P08, P09, P12, P19–P21, P23–P25, P27–P29, P32, P33, P35–P37, P39–P41, P43, P44, P46, P48–P55 |

Testabilidade baixa com dado público (declarar o limite em vez de forçar o teste): P43, P44 e, em parte, P04 e P27.
