# Repositórios e papers com código para os métodos do diagnóstico

Levantamento feito em **28/11/2026** para o Research Watch. A pergunta é: *que código aberto já implementa os
métodos de que o diagnóstico dos bancos vai precisar, e quanto dele dá para reaproveitar?* Os temas seguem a
ordem de prioridade do plano: crédito rural, clima, competição, precificação, dados públicos e avaliação
causal. A versão para máquina está em [`repos-metodos.json`](repos-metodos.json), com as mesmas entradas:
**59 repositórios**, **12 papers com código** e 4 papers no alvo sem código.

Complementa, sem repetir, [`fatores-externos-e-propostas.md`](fatores-externos-e-propostas.md) (fontes de dados e
desenho dos métodos) e [`financas-instituicoes.md`](financas-instituicoes.md) (fontes do lado do banco). Aqui só
entra código.

Como foi verificado:
- cada repositório foi aberto pela API do GitHub em 28/11/2026: estrelas, licença, arquivado ou não, data do
  último commit no branch padrão e README;
- pacotes R tiveram a licença lida no `DESCRIPTION`, porque o GitHub mostra "NOASSERTION";
- versões no PyPI foram conferidas quando o pacote é instalável;
- papers: DOI resolvido e página do pacote de replicação aberta. Onde o pacote pede login (openICPSR), está
  anotado;
- nenhum repositório foi clonado nem executado. "Usar direto" quer dizer que a API e a licença servem, não que
  rodou aqui.

**Onde isso roda.** O pipeline (`src/pawatch/`) é stdlib pura e continua assim. As bibliotecas de método entram
numa camada de análise separada, com ambiente próprio, que lê o que o pipeline coletou e devolve tabelas e
afirmações. Por isso, para coleta, o veredito costuma ser "só referência" (copiar o endpoint ou a regra, não a
dependência). Para método, "usar direto" vale dentro dessa camada.

---

## Recomendação

### (a) Nowcast da inadimplência rural por UF e município, só com dado público

Os cinco que dão o protótipo mais rápido, na ordem de montagem:

1. **[python-bcb](https://github.com/wilsonfreitas/python-bcb)**: alvo e covariáveis do BCB. SGS 21148/21146 (alvo nacional), Focus, Selic e taxa por banco num só cliente MIT; o SCR.data por UF entra pelo portal de dados abertos.
2. **[Base dos Dados (sdk + pipelines)](https://github.com/basedosdados/sdk)**: SICOR e ESTBAN já tratados por município. br_bcb_sicor e br_bcb_estban com código IBGE numa consulta SQL; poupa a semana de limpeza no protótipo.
3. **[exactextract](https://github.com/isciences/exactextract) + [geobr](https://github.com/ipea/geobr)**: grade de clima → município. CHIRPS e ERA5-Land (cdsapi) agregados na malha geobr, ponderados por área ou área agrícola.
4. **[climate_indices](https://github.com/monocongo/climate_indices)**: SPI/SPEI de 1, 3 e 6 meses. BSD, ativo, calcula a grade inteira; conferir contra o SPEI do R.
5. **[mlforecast](https://github.com/Nixtla/mlforecast) + [statsforecast](https://github.com/Nixtla/statsforecast)**: nowcast por UF com backtest. Uma especificação para as 27 UFs, defasagens automáticas e validação rolling origin, contra baselines ingênuos e ETS.

Com isso, o painel explicativo (inadimplência ~ SPI defasado + choque de preço + efeitos fixos) roda no
[PyFixest](https://github.com/py-econometrics/pyfixest), e a data de mudança de regime sai do
[ruptures](https://github.com/deepcharles/ruptures). O passo mais demorado não é o modelo. É casar SICOR (contrato,
município, cultura) com ESTBAN (saldo por banco e município) e com o clima no calendário da safra.

Três cuidados que o levantamento mostrou:
- o painel climático municipal pronto ([brclimr](https://github.com/rfsaldanha/brclimr)) **para em 2020/2021**;
  para 2022-2026, recalcular com CHIRPS ou ERA5;
- a BR-DWGD é a melhor grade para o histórico, mas sai com anos de atraso;
- não há modelo aberto de PD rural brasileiro. O pacote de replicação mais útil é o do Banco Mundial sobre o
  SICOR (Pedraza et al., 2026, Stata). O paper mais próximo do nosso desenho (Oliveira et al., 2022) não tem
  código.

### (b) Diagnóstico de competição bancária

1. **[python-bcb](https://github.com/wilsonfreitas/python-bcb)**: IF.data e TaxaJuros. Balanços por conglomerado (custo, receita, captação) e taxa média por instituição e modalidade: os preços que faltam no ESTBAN.
2. **[concentrationMetrics (Open Risk)](https://github.com/open-risk/concentrationMetrics)**: HHI, CR4, Gini por município e UF. Fórmulas prontas sobre as participações do ESTBAN (crédito rural, depósitos, agências).
3. **[linearmodels](https://github.com/bashtage/linearmodels)**: Lerner, Boone e beta de depósito. Translog de custo em painel → custo marginal → Lerner; Boone por IV-GMM; beta = Δ custo de captação / ΔSelic por banco (método DSS).
4. **[PyFixest](https://github.com/py-econometrics/pyfixest)**: entrada e saída de agências. Estudo de evento escalonado: o que acontece com crédito e taxa no município quando um banco fecha ou abre agência.
5. **[PyBLP](https://github.com/jeffgortmaker/pyblp)**: demanda estrutural (segunda onda). Markups e efeito de saída por banco à la Egan, Hortaçsu & Matvos; só depois de o HHI e o Lerner mostrarem onde olhar.

Não existe pacote mantido de Lerner, Boone, beta de depósito, RAROC ou FTP. Os repositórios com esses nomes
são exercícios de uma pessoa, com 0 a 2 estrelas. São fórmulas curtas: implementar em casa, com teste contra
números publicados (os betas da página do Schnabl, o Lerner e o Boone do Brasil na Global Financial Development Database do Banco Mundial).

---

## Como ler as tabelas

- **Último commit**: data do commit mais recente no branch padrão. ★ é a contagem de estrelas no mesmo dia.
- **Maturidade**:
  - *ativo*: commit nos últimos 12 meses;
  - *parado*: sem commit há mais de 12 meses, ou arquivado;
  - *experimental*: projeto pequeno, novo ou didático, sem base de usuários (pode estar ativo).
- **Veredito**:
  - *usar direto*: instalar e chamar;
  - *adaptar*: aproveitar parte do código ou a ideia, com trabalho;
  - *só referência*: ler para entender ou validar, não depender;
  - *evitar*: há opção melhor, ou a licença ou o estado do projeto impedem.
- **Licença**: GPL e AGPL contaminam código derivado. Nesses casos, ler e reimplementar. Licença "não comercial"
  ou ausente impede reuso.

---

## 1. Risco e inadimplência do crédito rural, nowcasting

| Repositório | Linguagem · licença | Último commit · ★ | O que implementa | Dados que espera | Maturidade | Como usaríamos | Veredito |
|---|---|---|---|---|---|---|---|
| [sicor (geo-credito-rural)](https://github.com/geo-credito-rural/sicor) | Python · GPL-3.0 | 10/04/2026 · 4 | Download dos microdados do SICOR e do Proagro, dados socioambientais (impedimentos), leitura em pandas/GeoPandas e carga em PostgreSQL/PostGIS. O README diz que é didático. GPL-3: ler, não copiar. Organização 'Geo Crédito Rural' (monitoramento de crédito rural por geotecnologia). | microdados SICOR (portal BCB), shapefiles | experimental | Mapa do esquema do SICOR e do Proagro e das bases de impedimentos; guia para o coletor próprio. | **só referência** |
| [geotec (geo-credito-rural)](https://github.com/geo-credito-rural/geotec) | Jupyter Notebook · GPL-3.0 | 08/05/2026 · 25 | Material de curso: dados geoespaciais, bancos geográficos, impedimentos sociais, ambientais e climáticos, uso e cobertura da terra, séries temporais, aplicados a operações de crédito rural. | SICOR, MapBiomas, PRODES, CAR | experimental | Roteiro de como cruzar operação de crédito com polígono e uso do solo (camada ESG do diagnóstico). | **só referência** |
| [ICAE](https://github.com/negra1m/icae) | Python · sem licença | 14/03/2026 · 2 | Índice por município que cruza crédito rural do SICOR com desmatamento (PRODES) e sanções ambientais. | SICOR, PRODES, autos do IBAMA | experimental | Ideia de indicador ESG municipal; não reutilizar código (sem licença). | **só referência** |
| [statsmodels](https://github.com/statsmodels/statsmodels) | Python · BSD-3-Clause | 27/11/2026 · 11,8 mil | Modelos de fatores dinâmicos com frequências mistas e dados faltantes (DynamicFactorMQ, à la Bańbura & Modugno 2014), Markov switching, componentes não observados, SARIMAX, testes CUSUM e de raiz unitária. MIDAS em Python não tem pacote mantido (midas_pro, último commit 2020): usar equações-ponte ou o DFM. | séries mensais/trimestrais em pandas | ativo | Nowcast da inadimplência rural nacional (SGS 21148) com fator dinâmico sobre clima, preço e Focus; decomposição das notícias de cada atualização. | **usar direto** |
| [mlforecast](https://github.com/Nixtla/mlforecast) | Python · Apache-2.0 | 27/11/2026 · 1,3 mil | Previsão de muitas séries com modelos de ML (LightGBM etc.), defasagens e janelas automáticas, variáveis exógenas, validação cruzada temporal (rolling origin), intervalos conformais. Alternativas equivalentes: darts (9,6 mil estrelas) e sktime (10,1 mil). | painel longo (unique_id, ds, y) + exógenas | ativo | Nowcast da inadimplência rural por UF (SCR.data) com clima e preço defasados, uma só especificação para as 27 séries, backtest honesto. | **usar direto** |
| [statsforecast](https://github.com/Nixtla/statsforecast) | Python · Apache-2.0 | 19/11/2026 · 5,0 mil | ETS, ARIMA, Theta, sazonal ingênuo etc. em lote e rápidos. | painel longo (unique_id, ds, y) | ativo | Baselines obrigatórios do nowcast (último valor, sazonal, ETS) contra os quais o modelo com clima precisa ganhar. | **usar direto** |
| [hierarchicalforecast](https://github.com/Nixtla/hierarchicalforecast) | Python · Apache-2.0 | 26/11/2026 · 770 | Reconciliação de previsões hierárquicas (bottom-up, MinT, ERM) e probabilísticas. | previsões por nível + matriz de agregação | ativo | Fazer o nowcast por UF somar ao número nacional do SGS (e município → UF quando houver base). | **adaptar** |
| [nowcast_lstm](https://github.com/dhopp1/nowcast_lstm) | Python · MIT | 02/05/2024 · 73 | Nowcasting com LSTM e dados irregulares (ragged edge), com contribuição das variáveis. Paper: Hopp (2022), Journal of Official Statistics; UNCTAD Research Paper 2018. | séries mensais/trimestrais com bordas irregulares | parado | Ideia do tratamento da borda irregular; não vale a dependência de PyTorch para 27 séries. | **só referência** |
| [optbinning](https://github.com/guillermo-navas-palencia/optbinning) | Python · Apache-2.0 | 22/11/2026 · 538 | Binning ótimo monotônico com restrições, WoE/IV, scorecard, binning de fluxo. Alternativas: scorecardpy (MIT, 814 estrelas), toad (MIT, 529), skorecard (ING, MIT, parado desde 02/2025). | base de operações com alvo binário (default) | ativo | Só quando houver microdado do banco: PD de custeio por cliente. Com dado público, serve para faixas de risco municipais. | **adaptar** |
| [transitionMatrix (Open Risk)](https://github.com/open-risk/transitionMatrix) | Python · Apache-2.0 | 28/09/2026 · 89 | Estimação de matrizes de transição (coorte e duração), geradores, matrizes de vários períodos. | estados por período (rating, faixa de atraso) | ativo | Com o SCR.data (estoques agregados) só dá para aproximar fluxos entre em dia, vencido acima de 15 dias e inadimplido por UF; a matriz de verdade (PD de vida inteira, Res. 4.966) exige dado por contrato. | **só referência** |

**Papers com código**

| Paper | Ano | Código | Método | Como usaríamos | Veredito |
|---|---|---|---|---|---|
| [Pedraza, Miguel, dos Santos, Ruiz-Ortega, Arduini, Moreira & Sampaio. The Effects of Regulatory Information Systems on Credit Allocation: Evidence from Brazil's Rural Credit Bureau. Banco Mundial, Reproducible Research Repository.](https://reproducibility.worldbank.org/catalog/470) | 2026 | [link](https://reproducibility.worldbank.org/catalog/470/download/1342/RR_BRA_2025_508.zip) · Stata (+ Python/QGIS para uma figura) | Efeito do registro centralizado das operações de crédito rural (SICOR) sobre a alocação do crédito, com microdados do SICOR, biomas do IBGE e área protegida. Licença BSD-3 modificada. Os microdados do SICOR não vêm no pacote (o README explica como baixar). | O único pacote de replicação público encontrado que trata os microdados do SICOR de ponta a ponta: copiar a construção da base. | **adaptar** |
| [Ndlovu, Ono, Buchenau & Xue. Managing Agricultural Credit Risk in the Face of Natural Disasters: Lessons from Sub-Saharan Africa, Asia and the Americas. Banco Mundial.](https://reproducibility.worldbank.org/catalog/482) | 2026 | [link](https://reproducibility.worldbank.org/catalog/482/download/1422/FR_WLD_2026_545.zip) · R (uma figura) + Excel | Descritivo: carteira em risco e baixas de 36 instituições financeiras em 4 países depois de desastres (EM-DAT). | Lista de práticas (reestruturação, seguro, provisão) para comparar com o que o BB divulga; não é modelo. | **só referência** |

---

## 2. Risco climático: secas, clima em grade, safra, seguro paramétrico

| Repositório | Linguagem · licença | Último commit · ★ | O que implementa | Dados que espera | Maturidade | Como usaríamos | Veredito |
|---|---|---|---|---|---|---|---|
| [climate_indices](https://github.com/monocongo/climate_indices) | Python · BSD-3-Clause | 26/11/2026 · 466 | SPI, SPEI, EDDI, percentual da normal (PNP), PET, Palmer (PDSI, scPDSI); cálculo em grade inteira e CLI para NetCDF. | precipitação e temperatura mensais (série ou grade xarray) | ativo | SPI/SPEI de 1, 3 e 6 meses por município, regressores principais do painel e do nowcast. | **usar direto** |
| [standard_precip](https://github.com/e-baumer/standard_precip) | Python · Apache-2.0 | 24/11/2026 · 106 | SPI e SPEI com escolha da distribuição ajustada e tratamento de zeros. | série de precipitação (e balanço hídrico para SPEI) em pandas | ativo | Segunda implementação para conferir o climate_indices (os dois devem dar o mesmo SPI). | **adaptar** |
| [SPEI (R)](https://github.com/sbegueria/SPEI) | R · GPL-2.0+ | 25/11/2026 · 110 | Implementação de referência do SPEI e do SPI, Penman-Monteith, Hargreaves, Thornthwaite. Paper: Vicente-Serrano, Beguería & López-Moreno (2010), Journal of Climate. | séries mensais de clima | ativo | Gabarito para validar o SPEI calculado em Python. | **só referência** |
| [xclim](https://github.com/Ouranosinc/xclim) | Python · Apache-2.0 | 26/11/2026 · 411 | Centenas de indicadores climáticos sobre xarray: dias secos consecutivos, ondas de calor, graus-dia, SPI/SPEI, chuva extrema, com controle de unidades. | grade xarray (NetCDF/Zarr) diária | ativo | Indicadores de estresse na janela da cultura (veranico no enchimento de grão, calor na floração). | **usar direto** |
| [cdsapi](https://github.com/ecmwf/cdsapi) | Python · Apache-2.0 | 20/11/2026 · 325 | Cliente oficial do Copernicus Climate Data Store (ERA5, ERA5-Land, sazonais). earthkit-data (ECMWF, Apache-2.0) lê GRIB/NetCDF se for preciso. | conta gratuita no CDS (chave) | ativo | Baixar ERA5-Land mensal/diário para o Brasil (temperatura, solo, evapotranspiração). | **usar direto** |
| [Xee](https://github.com/google/Xee) | Python · Apache-2.0 | 29/10/2026 · 384 | Abre coleções do Google Earth Engine como xarray. Depende de conta e cota do GEE; para produção, preferir arquivos CHIRPS diretos. | conta GEE | ativo | Caminho rápido para CHIRPS e MODIS/NDVI já reprojetados, sem baixar arquivos. | **adaptar** |
| [exactextract](https://github.com/isciences/exactextract) | C++/Python · Apache-2.0 | 21/10/2026 · 329 | Estatística zonal exata (fração de célula coberta pelo polígono): média ponderada, soma, quantis. rasterstats (BSD-3, 565 estrelas) é mais simples e menos exato em municípios pequenos. | raster (GeoTIFF/NetCDF) + polígonos | ativo | Grade CHIRPS/ERA5 → média por município (malha geobr), ponderada por área ou por área agrícola (MapBiomas). | **usar direto** |
| [xagg](https://github.com/ks905383/xagg) | Python · GPL-3.0 | 08/04/2025 · 103 | Agregação de grade xarray para polígonos com pesos de área e pesos extras (população, área cultivada); feito para econometria clima-economia. GPL-3. Commit mais recente de 04/2025; push de 11/2025. | xarray + GeoDataFrame | ativo | Alternativa ao exactextract quando o dado já está em xarray; ponderar por área de soja/milho. | **adaptar** |
| [BR-DWGD](https://github.com/AlexandreCandidoXavier/BR-DWGD) | Python (notebooks) · sem licença no repositório | 06/08/2026 · 67 | Exemplos de uso da grade diária brasileira (chuva, Tmax, Tmin, ETo, umidade, radiação, vento, 0,1°) interpolada de estações. Paper: Xavier, Scanlon, King & Alves (2022), International Journal of Climatology, doi:10.1002/joc.7731. Grade atualizada com defasagem de anos: serve para o histórico, não para o nowcast. Precisa de ~6 GB de RAM. | arquivos NetCDF da grade (Google Drive do autor) | ativo | Clima histórico de melhor qualidade para o Brasil (calibrar o CHIRPS e o SPEI de longo prazo). | **adaptar** |
| [brclimr](https://github.com/rfsaldanha/brclimr) | R · MIT | 04/04/2024 · 7 | Estatísticas zonais por município já calculadas (BR-DWGD diário e TerraClimate mensal, com PDSI e déficit hídrico) em Parquet na nuvem, lidas via DuckDB. Cobertura: BR-DWGD até 31/07/2020 e TerraClimate até 12/2021 (página de metodologia). Não serve para 2022-2026 sem recalcular. | código IBGE do município | parado | Painel climático municipal pronto para o período histórico; dá para ler os Parquet direto do Python com DuckDB. | **adaptar** |
| [CLIMADA](https://github.com/CLIMADA-project/climada_python) | Python · GPL-3.0 | 06/11/2026 · 500 | Avaliação de risco climático perigo × exposição × vulnerabilidade, com impacto probabilístico, opções de adaptação e seguro; climada_petals traz módulos de seca e safra. Pesado para o primeiro protótipo; GPL-3. | camadas de perigo, exposição georreferenciada, funções de impacto | ativo | Referência de arquitetura para o estresse climático da carteira (exposição ESTBAN × perigo × função de dano). | **só referência** |
| [PCSE (WOFOST)](https://github.com/ajwdewit/pcse) | Python · EUPL-1.1 | 19/11/2026 · 298 | Ambiente de simulação de culturas (WOFOST, LINTUL) com clima, solo e manejo. | clima diário, solo, parâmetros da cultura | ativo | Só referência: exigiria calibrar cultivares brasileiras. AquaCrop-OSPy (Apache-2.0) é a alternativa hídrica. | **só referência** |
| [CY-Bench](https://github.com/WUR-AI/AgML-CY-Bench) | Python · EUPL-1.2 | 22/05/2026 · 57 | Benchmark de previsão de produtividade subnacional (milho e trigo, mais de 25 países, inclui Brasil via SIDRA 1612) com dados de clima, solo, FAPAR e baselines. Paper: Kallenberg, Paudel et al. (2026), Earth System Science Data 18, 3997-4018, doi:10.5194/essd-18-3997-2026. Brasil só milho e trigo; soja tem de ser montada à parte com PAM/LSPA. | produtividade por região + preditores (já no dataset do Zenodo) | ativo | Baselines e protocolo de validação para prever produtividade municipal antes da colheita (elo clima → renda → default). | **adaptar** |
| [pyam](https://github.com/IAMconsortium/pyam) | Python · Apache-2.0 | 11/11/2026 · 292 | Leitura e análise de cenários de modelos integrados (formato IAMC), inclusive os cenários do NGFS. | arquivos de cenários IAMC/NGFS | ativo | Cenários de longo prazo (NGFS) para estresse climático de transição e físico, se o diagnóstico pedir. | **só referência** |

**Papers com código**

| Paper | Ano | Código | Método | Como usaríamos | Veredito |
|---|---|---|---|---|---|
| [You, Li, Low, Lobell & Ermon. Deep Gaussian Process for Crop Yield Prediction Based on Remote Sensing Data. AAAI.](http://jiaxuanyou.me/files/Jiaxuan_AAAI17.pdf) | 2017 | [link](https://github.com/JiaxuanYou/crop_yield_prediction) · Python/TensorFlow (sem licença, commit 2021) | Histogramas de pixels MODIS por condado → CNN/LSTM + processo gaussiano espacial para produtividade de soja nos EUA. Porte em PyTorch: gabrieltseng/pycrop-yield-prediction (MIT, parado desde 2022). | Ideia de prever produtividade municipal com sensoriamento remoto; código velho, só ler. | **só referência** |
| [Bucheli, Dalhaus & Finger. Temperature effects on crop yields in heat index insurance. Food Policy 107, 102214.](https://doi.org/10.1016/j.foodpol.2021.102214) | 2022 | [link](https://github.com/AECP-ETHZ/Temperature-effects-on-crop-yields-in-heat-index-insurance) · R (Apache-2.0) | Seguro por índice de calor: limiares de temperatura por fase da cultura e redução de risco de renda. | Desenho de gatilho paramétrico (calor/seca na fase crítica) para um produto de custeio com seguro embutido. | **adaptar** |
| [Leppert, Dalhaus & Lagerkvist. Accounting for Geographic Basis Risk in Heat Index Insurance: How Spatial Interpolation Can Reduce the Cost of Risk. Weather, Climate, and Society 13(2).](https://doi.org/10.1175/WCAS-D-20-0070.1) | 2021 | [link](https://github.com/DanielLeppert/Leppert-et-al-2021-Replication-Code-Data) · R (sem licença) | Interpolação espacial (krigagem etc.) do índice climático reduz o risco de base do seguro paramétrico. | Medir o risco de base de um gatilho por município (estação × grade × lavoura). | **só referência** |
| [Michler, Viens & Shively. Risk, crop yields, and weather index insurance in village India. Journal of the Agricultural and Applied Economics Association 1, 61-81.](https://doi.org/10.1002/jaa2.9) | 2022 | [link](https://github.com/AIDELabAZ/risk_crop_insurance) · R + WinBUGS (MIT) | Decomposição bayesiana da variância da produtividade: o clima explica pouco, o risco de base é grande. | Alerta para o plano: antes de vender gatilho climático, medir quanto do default o clima explica de fato. | **só referência** |

---

## 3. Competição bancária, estrutura de mercado e custo de captação

| Repositório | Linguagem · licença | Último commit · ★ | O que implementa | Dados que espera | Maturidade | Como usaríamos | Veredito |
|---|---|---|---|---|---|---|---|
| [concentrationMetrics (Open Risk)](https://github.com/open-risk/concentrationMetrics) | Python · MIT | 18/11/2026 · 45 | HHI (e Simpson), razão de concentração CRk, Gini, Theil, Shannon, Hannah-Kay e outros índices de concentração e desigualdade. O pacote no PyPI é de 2022; o repositório segue com commits. As fórmulas são simples; dá para reimplementar em stdlib. | vetor de participações ou saldos | ativo | HHI e CR4 de crédito rural, depósitos e agências por município e UF a partir do ESTBAN. | **usar direto** |
| [PyBLP](https://github.com/jeffgortmaker/pyblp) | Python · MIT | 13/11/2026 · 297 | Demanda de produtos diferenciados (logit, logit aninhado, BLP), oferta com custos marginais e markups, simulação de fusões. Paper: Conlon & Gortmaker (2020), RAND Journal of Economics. | mercado × produto: preço, participação, características, instrumentos | ativo | Fase 2: demanda por depósitos ou crédito por banco e mercado (à la Egan, Hortaçsu & Matvos 2017), com taxa do TaxaJuros e participação do ESTBAN; dá markup e efeito de saída de agência. | **adaptar** |
| [linearmodels](https://github.com/bashtage/linearmodels) | Python · NCSA | 23/11/2026 · 1,1 mil | Painel (efeitos fixos, aleatórios, primeira diferença, Fama-MacBeth), IV-2SLS, IV-GMM, LIML, sistemas (SUR, 3SLS). | painel pandas com MultiIndex | ativo | Função custo translog por banco (IF.data) → custo marginal → Lerner; Boone por IV-GMM; beta de depósito por banco (Δ custo de captação sobre ΔSelic). | **usar direto** |
| [pyStoNED](https://github.com/ds2010/pyStoNED) | Python · GPL-3.0 | 22/02/2025 · 41 | Regressão convexa não paramétrica (CNLS), StoNED, DEA, fronteira estocástica. Usa solver externo (Pyomo/MOSEK ou similar). | insumos e produtos por banco | parado | Eficiência de custo dos bancos como controle do Lerner e checagem do translog. | **só referência** |
| [PySAL spreg + esda](https://github.com/pysal/spreg) | Python · BSD-3-Clause | 11/11/2026 · 90 | Econometria espacial (defasagem e erro espacial, GM/ML, painel espacial); o esda (264 estrelas, BSD-3, commit 24/11/2026) faz Moran's I e LISA. esda: https://github.com/pysal/esda | GeoDataFrame + matriz de vizinhança | ativo | Agrupamentos de concentração bancária e de inadimplência entre municípios; erro espacial no painel. | **adaptar** |

**Papers com código**

| Paper | Ano | Código | Método | Como usaríamos | Veredito |
|---|---|---|---|---|---|
| [Drechsler, Savov & Schnabl. The Deposits Channel of Monetary Policy. Quarterly Journal of Economics 132(4), 1819-1876.](https://academic.oup.com/qje/article/132/4/1819/3857743) | 2017 | [link](https://github.com/finardfr/Replication-code-for-The-Deposit-Channel-of-Monetary-Policy-) · R (replicação não oficial) | Poder de mercado em depósitos (HHI local) explica quanto a taxa de depósito acompanha a taxa básica (beta de depósito) e a saída de depósitos. A replicação é de terceiros (Tabela VIII, Call Reports 1994-2013) e tem heurísticas próprias; sem licença declarada. | Desenho do teste 'concentração no município (ESTBAN) → spread de captação': trocar Call Reports por ESTBAN + IF.data. | **adaptar** |
| [Drechsler, Savov & Schnabl. Banking on Deposits: Maturity Transformation without Interest Rate Risk. Journal of Finance 76(3).](https://pages.stern.nyu.edu/~pschnabl/research/DSS_deposits.pdf) | 2021 | [link](https://pages.stern.nyu.edu/~pschnabl/data/data_deposit_beta.htm) · dados (Stata e Excel) | Betas de depósito e de despesa de juros por banco dos EUA, estimados com a história toda (1984-2022); franquia de depósitos como hedge. Dados só para uso não comercial; página de abril de 2023. | Método do beta por banco para o Brasil (custo de captação do IF.data contra Selic) e ordem de grandeza para comparar. | **só referência** |
| [Egan, Hortaçsu & Matvos. Deposit Competition and Financial Fragility: Evidence from the US Banking Sector. American Economic Review 107(1), 169-216.](https://www.aeaweb.org/articles?id=10.1257/aer.20150342) | 2017 | [link](https://doi.org/10.3886/e231371v1) · pacote AEA/openICPSR | Modelo estrutural de demanda por depósitos (BLP) com risco de corrida; markups e fragilidade por banco. Pacote não aberto nesta sessão (openICPSR pede login). | Base para a fase 2 com PyBLP (demanda por depósito por banco e mercado). | **só referência** |
| [Goldsmith-Pinkham, Sorkin & Swift. Bartik Instruments: What, When, Why, and How. American Economic Review 110(8).](https://paulgp.github.io/papers/bartik_gpss.pdf) | 2020 | [link](https://github.com/paulgp/bartik-weight) · Stata e R (MIT, último commit 2019) | Shift-share como IV de participações; pesos de Rotemberg mostram quais participações movem a estimativa. | Choque de preço local = participação da cultura (PAM) × preço (CEPEA): checar quais culturas dominam o resultado. | **adaptar** |
| [Borusyak, Hull & Jaravel. Quasi-Experimental Shift-Share Research Designs. Review of Economic Studies 89(1).](https://doi.org/10.1093/restud/rdab030) | 2022 | [link](https://github.com/borusyak/shift-share) · Stata (GPL-3) | Identificação pelos choques (não pelas participações); regressão no nível do choque. | Alternativa ao GPSS quando houver muitos choques de preço independentes. | **só referência** |
| [Adão, Kolesár & Morales. Shift-Share Designs: Theory and Inference. Quarterly Journal of Economics 134(4).](https://doi.org/10.1093/qje/qjz025) | 2019 | [link](https://github.com/kolesarm/ShiftShareSE) · R (GPL-3, commit 09/11/2026) | Erros-padrão corretos em shift-share (regiões com a mesma composição têm resíduos correlacionados). | Erros-padrão do painel de choque de preço; reimplementar em Python (é uma fórmula fechada). | **adaptar** |

---

## 4. Precificação: preço do crédito, curva, FTP, CLV e churn

| Repositório | Linguagem · licença | Último commit · ★ | O que implementa | Dados que espera | Maturidade | Como usaríamos | Veredito |
|---|---|---|---|---|---|---|---|
| [lifelines](https://github.com/CamDavidsonPilon/lifelines) | Python · MIT | 07/03/2026 · 2,6 mil | Análise de sobrevivência: Kaplan-Meier, Cox, modelos paramétricos e AFT. scikit-survival (GPL-3, 1,3 mil estrelas) tem florestas de sobrevivência. | duração e evento por cliente/contrato | ativo | Tempo até o default e tempo até o churn quando houver dado do banco; com dado público, sobrevivência de agências (ESTBAN). | **usar direto** |
| [QuantLib (+ QuantLib-SWIG para Python)](https://github.com/lballabio/QuantLib) | C++ (Python via SWIG) · BSD modificada | 27/11/2026 · 7,8 mil | Curvas de juros (bootstrap), calendários, convenções de contagem, desconto, títulos, swaps, modelos de taxa curta. Open Source Risk Engine (ORE, 833 estrelas) estende o QuantLib para XVA e risco de mercado; não faz FTP nem RAROC de crédito. | taxas de mercado (DI1, pré, cupom de IPCA) | ativo | Curva pré a partir dos ajustes DI1 (B3) → taxa de transferência por prazo (FTP casado por prazo) e desconto de fluxos no RAROC. | **adaptar** |
| [rateslib](https://github.com/attack68/rateslib) | Python/Rust · não comercial (source-available) | 09/04/2026 · 372 | Curvas, títulos, swaps e futuros de juros. | taxas de mercado | ativo | Não usar: a licença é dupla, não comercial ou assinatura paga. | **evitar** |
| [PyMC-Marketing (módulo CLV)](https://github.com/pymc-labs/pymc-marketing) | Python · Apache-2.0 | 27/11/2026 · 1,3 mil | CLV bayesiano: BG/NBD, Pareto/NBD, Gamma-Gamma, modelos de churn contratual (shifted beta-geometric); também MMM. | transações por cliente (frequência, recência, valor) | ativo | Quando houver dado do cliente: valor de vida e churn do correntista; com dado público, nada. | **adaptar** |
| [lifetimes](https://github.com/CamDavidsonPilon/lifetimes) | Python · MIT | 28/06/2024 (arquivado) · 1,5 mil | BG/NBD, Pareto/NBD, Gamma-Gamma (frequentista). | transações por cliente | parado | Não usar: arquivado; o sucessor indicado é o PyMC-Marketing. | **evitar** |

---

## 5. Dados financeiros públicos do Brasil

| Repositório | Linguagem · licença | Último commit · ★ | O que implementa | Dados que espera | Maturidade | Como usaríamos | Veredito |
|---|---|---|---|---|---|---|---|
| [python-bcb](https://github.com/wilsonfreitas/python-bcb) | Python · MIT | 25/11/2026 · 130 | Cliente do SGS e das APIs OData do Olinda: IFDATA, TaxaJuros (taxa por instituição e modalidade), Expectativas (Focus), PTAX, tarifas, postos de atendimento, MercadoImobiliario, SPI; classe genérica ODataAPI para qualquer serviço do Olinda. Mesmo autor mantém o rbcb (R, MIT, commit 20/11/2026). Não cobre ESTBAN, SCR.data nem SICOR (arquivos no portal de dados abertos). | códigos SGS; nomes de endpoint OData | ativo | Protótipo: alvo (SGS 21148/21146), Focus e taxa por banco (TaxaJuros) sem escrever cliente; no pipeline stdlib, copiar só os endpoints. | **usar direto** |
| [rb3](https://github.com/wilsonfreitas/rb3) | R · MIT | 27/11/2026 · 9 | Downloaders e parsers da B3: COTAHIST, ajustes de futuros, curvas de juros (DI1, pré), índices e composição. No CRAN. Poucas estrelas, mas autor e manutenção sólidos. | datas de pregão | ativo | Ler o código para montar a curva pré (DI1) da B3, base do FTP e do desconto; preços diários para estudo de evento. | **adaptar** |
| [python-bizdays](https://github.com/wilsonfreitas/python-bizdays) | Python · MIT | 23/11/2026 · 95 | Calendários de dias úteis (inclui ANBIMA/B3), contagem e deslocamento por dias úteis. | datas | ativo | Janelas do estudo de evento em pregões e prazos em dias úteis (base 252) no preço do crédito. | **usar direto** |
| [GetDFPData2 (+ GetFREData)](https://github.com/msperlin/GetDFPData2) | R · GPL-2.0 | 04/06/2026 · 46 | Baixa e organiza DFP/ITR da CVM (balanços, DRE, fluxo de caixa); o irmão GetFREData lê o Formulário de Referência. GetFREData: https://github.com/msperlin/GetFREData (GPL-2.0, commit 04/09/2026, 5 estrelas). GPL: ler, não copiar código. | código CVM ou nome da companhia; anos | ativo | Referência de como empilhar DFP/ITR e versões reapresentadas; o FRE dá número de ações e estrutura. | **só referência** |
| [cvm-mcp](https://github.com/msperlin/cvm-mcp) | Python · MIT | 14/11/2026 · 6 | Servidor MCP sobre o portal dados.cvm.gov.br: DFP, ITR, FRE, fundos, insiders, ofertas, processos sancionadores; SQL ad hoc via DuckDB; 15 conjuntos, 111 tabelas, 34 ferramentas. Não cobre o IPE (fatos relevantes), que o pipeline já lê. Novo (nov/2026). | nada (baixa e guarda em cache) | experimental | Dar ao agente (Claude Code) consulta direta a DFP/ITR/FRE dos bancos listados sem escrever coletor. | **adaptar** |
| [Base dos Dados (sdk + pipelines)](https://github.com/basedosdados/sdk) | Python/R/SQL · MIT (sdk) | 24/07/2026 · 433 | SDK para consultar o datalake público no BigQuery. O repositório basedosdados/pipelines (53 estrelas, commit 26/11/2026, sem licença declarada) tem os fluxos br_bcb_sicor, br_bcb_estban, br_bcb_ifdata, br_bcb_agencia, br_bcb_taxa_selic e br_cvm_*. Para produção, o Watch continua com coletores próprios (ESTBAN e IF.data já existem em src/pawatch/ifs). Conferir defasagem das tabelas antes de usar no nowcast. O código de tratamento (pipelines) sem licença: só referência. | SQL; projeto Google Cloud próprio para faturar a consulta (há cota gratuita) | ativo | Atalho de protótipo: SICOR e ESTBAN já tratados e com código IBGE de município, numa consulta SQL. | **usar direto** |
| [geobr](https://github.com/ipea/geobr) | Python/R · MIT | 09/11/2026 · 975 | Malhas oficiais do IBGE (município, UF, meso/microrregião, biomas, setores) por ano, com código IBGE. | ano e código IBGE | ativo | Polígonos dos municípios para agregar clima em grade e para mapas. | **usar direto** |
| [sidrapy](https://github.com/AlanTaranti/sidrapy) | Python · MIT | 13/06/2023 (arquivado) · 87 | Cliente da API SIDRA do IBGE (PAM, LSPA, PPM etc.). Arquivado em 2023. Em R, sidrar (GPL-3, commit 19/09/2026) segue ativo. | tabela, variável, nível territorial | parado | Não usar: a API SIDRA é simples o bastante para chamar com stdlib. | **evitar** |
| [ipeadatapy](https://github.com/luanborelli/ipeadatapy) | Python · MIT | 26/12/2025 · 84 | Cliente da API do Ipeadata (séries e metadados, inclusive regionais). Em R: ipea/ipeadatar (MIT, commit 22/07/2026). | código da série | ativo | Covariáveis macro e regionais pontuais (ex.: PIB municipal, preços agrícolas históricos). | **usar direto** |
| [estbanr](https://github.com/StrategicProjects/estbanr) | R · MIT | 29/09/2026 · 0 | Download, leitura e organização do ESTBAN desde 1988; dicionário COSIF; detecção e imputação de meses não reportados por instituição; agregação por município. No CRAN desde set/2026. Poucas estrelas; o valor está na regra de não reporte. | mês e UF | experimental | Copiar a ideia de flag e imputação de não reporte para o estban.py do pipeline (evita quedas falsas de saldo). | **só referência** |
| [bacen-ifdata-scraper](https://github.com/alexcamargos/bacen-ifdata-scraper) | Python · MIT | 25/11/2026 · 17 | ETL do IF.data com Selenium (download), Polars, DuckDB e dbt. Selenium é frágil e desnecessário aqui. | relatórios do portal IF.data | experimental | Não precisa: o IF.data tem API OData (python-bcb e o ifdata.py do pipeline). | **evitar** |

---

## 6. Avaliação causal e quebras estruturais

| Repositório | Linguagem · licença | Último commit · ★ | O que implementa | Dados que espera | Maturidade | Como usaríamos | Veredito |
|---|---|---|---|---|---|---|---|
| [PyFixest](https://github.com/py-econometrics/pyfixest) | Python · MIT | 27/11/2026 · 370 | OLS/IV/GLM com efeitos fixos de alta dimensão, erros agrupados, wild bootstrap, regressão quantílica; DiD: TWFE, Did2s (Gardner), projeções locais, estudo de evento Sun-Abraham. Sintaxe do fixest (R, GPL-3, 465 estrelas), que serve de gabarito. | painel pandas/polars | ativo | Motor do painel município × mês (inadimplência ~ choque clima/preço + EF) e dos estudos de evento escalonados. | **usar direto** |
| [did (R)](https://github.com/bcallaway11/did) | R · GPL-3.0 | 30/10/2026 · 428 | DiD com vários períodos e adoção escalonada; efeitos por coorte e agregações dinâmicas. Paper: Callaway & Sant'Anna (2021), Journal of Econometrics 225(2). | painel com data de tratamento por unidade | ativo | Gabarito para conferir o csdid em Python. | **só referência** |
| [csdid (Python)](https://github.com/d2cml-ai/csdid) | Python · MIT | 28/10/2026 · 68 | Porte do Callaway & Sant'Anna para Python (ATT(g,t), agregações, gráficos). Alternativa: differences (GPL-3, 116 estrelas, commit 04/2026). | painel com data de tratamento | ativo | DiD de municípios que entram em seca severa (Monitor de Secas) em datas diferentes. | **usar direto** |
| [py_did_multiplegt_dyn](https://github.com/Credible-Answers/py_did_multiplegt_dyn) | Python · BSD-3-Clause | 23/11/2026 · 6 | Versão Python oficial do did_multiplegt_dyn: DiD com tratamento que liga e desliga, ou contínuo, efeitos dinâmicos. Paper: de Chaisemartin & D'Haultfœuille (2024), Review of Economics and Statistics. Versão Stata/R: Credible-Answers/did_multiplegt_dyn (97 estrelas, commit 20/07/2026). Python novo, poucas estrelas. | painel com tratamento por período | ativo | Choques que vão e voltam (decretos de emergência, preço abaixo do mínimo), onde Callaway-Sant'Anna não cabe. | **adaptar** |
| [HonestDiD (R)](https://github.com/asheshrambachan/HonestDiD) | R · MIT | 12/04/2026 · 261 | Inferência robusta a violações de tendências paralelas em DiD e estudo de evento. Paper: Rambachan & Roth (2023), Review of Economic Studies 90(5). Sem porte Python mantido; chamar o R à parte ou reimplementar o caso 'smoothness'. | coeficientes e covariância do estudo de evento | ativo | Teste de sensibilidade das premissas causais do plano (quanto a tendência pré pode desviar antes de o efeito sumir). | **só referência** |
| [pysyncon](https://github.com/sdfordham/pysyncon) | Python · MIT | 13/09/2026 · 85 | Controle sintético (Abadie), robusto, aumentado (Ben-Michael et al.) e penalizado; placebos e intervalos. Reconcilia com Synth e augsynth (R). Evitar SyntheticControlMethods (parado desde 2021). | painel unidade × tempo com uma unidade tratada | ativo | RS depois das enchentes de 2024 contra um RS sintético; um banco contra uma combinação de pares. | **usar direto** |
| [synthdid (R)](https://github.com/synth-inference/synthdid) | R · BSD-3-Clause | 15/01/2024 · 317 | Diferenças em diferenças sintéticas. Paper: Arkhangelsky et al. (2021), American Economic Review 111(12). | painel balanceado | parado | Gabarito do SDID; em Python, CausalPy ou pysynthdid (Apache-2.0, parado desde 2022). | **só referência** |
| [CausalPy](https://github.com/pymc-labs/CausalPy) | Python · Apache-2.0 | 26/11/2026 · 1,2 mil | Quase-experimentos bayesianos e frequentistas: DiD (inclusive escalonado), controle sintético, regressão descontínua e kink, série interrompida, IV. | DataFrame pandas | ativo | Casos de poucas unidades com incerteza honesta (ex.: corte de crédito com regra de limiar do Pronaf via RD). | **usar direto** |
| [tfcausalimpact](https://github.com/WillianFuks/tfcausalimpact) | Python · Apache-2.0 | 20/09/2026 · 683 | CausalImpact (série estrutural bayesiana) em TensorFlow Probability. Paper: Brodersen et al. (2015), Annals of Applied Statistics. Dependência pesada (TensorFlow). | série tratada + séries de controle | ativo | Efeito de uma norma (ex.: Res. 4.966) numa série nacional com controles; checagem rápida. | **adaptar** |
| [ruptures](https://github.com/deepcharles/ruptures) | Python · BSD-2-Clause | 26/05/2026 · 2,1 mil | Detecção de pontos de mudança offline (PELT, Binseg, janela, programação dinâmica) com vários custos. Paper: Truong, Oudre & Vayatis (2020), Signal Processing. | série numpy | ativo | Datar quando a inadimplência rural mudou de regime (antes de 2023?) sem escolher a data a olho. | **usar direto** |
| [mbreaks (R)](https://github.com/roga11/mbreaks) | R · GPL-2.0+ | 28/03/2024 · 2 | Bai-Perron: estimação e testes de múltiplas quebras em regressão linear, por programação dinâmica. Paper: Bai & Perron (2003), Journal of Applied Econometrics. | série e regressores | parado | Gabarito de Bai-Perron com intervalos para as datas de quebra; strucchange (CRAN) é a alternativa clássica. Para painel, xtbreak (Stata, 25 estrelas). | **só referência** |
| [eventstudy (Python)](https://github.com/LemaireJean-Baptiste/eventstudy) | Python · GPL-3.0 | 22/12/2023 · 71 | Estudo de evento financeiro: modelo de mercado, Fama-French, CAR e testes. Em R, eventstudyr (JMSLab, MIT) faz o estudo de evento econométrico de Freyaldenhoven et al.; não é o caso financeiro. | retornos diários da ação e do índice | parado | O estudo de evento de fatores-externos-e-propostas.md §2.1 já faz o básico; ler para os testes de agregação entre eventos. | **só referência** |
| [DoWhy](https://github.com/py-why/dowhy) | Python · MIT | 17/11/2026 · 8,4 mil | Inferência causal a partir de um DAG explícito: identificação, estimação e testes de refutação (placebo, causa comum aleatória, subamostra). | DataFrame + grafo causal | ativo | Automatizar a regra do Watch (aresta só vira 'verificada' com placebo): os refutadores dão o teste padrão. | **adaptar** |
| [EconML](https://github.com/py-why/EconML) | Python · MIT | 20/11/2026 · 4,9 mil | Efeitos heterogêneos: double ML, florestas causais, meta-learners, IV ortogonal. Útil depois do painel básico; não no primeiro protótipo. | tratamento, desfecho, covariáveis | ativo | Quais municípios ou culturas reagem mais ao mesmo choque de seca (heterogeneidade para o preço por risco). | **só referência** |

---

## Papers no alvo, sem código público

Entram porque o desenho é o que queremos reproduzir. O código teria de ser escrito do zero.

- [Oliveira, Oliveira, da Mata & Severnini. Effects of Climate on Bank Default. Revista Brasileira de Climatologia (2022).](https://ojs.ufgd.edu.br/rbclima/article/download/14645/8523/52092) Painel municipal do Nordeste com efeitos fixos: desvios de temperatura e chuva elevam a inadimplência, via agropecuária. É o desenho mais próximo do nosso; sem código.
- [Orestes, Silva & Zhang. Volatility and Under-Insurance in Economies with Limited Pledgeability: evidence from a frost shock. BCB Working Paper 628 (2025).](https://www.bcb.gov.br/content/publicacoes/WorkingPaperSeries/WP628.pdf) Geada como choque natural sobre crédito e seguro no Brasil, com dado do BCB; sem código público.
- [Heil, Pogach & Polson. Agricultural lending, insurance and implications of climate change. FDIC Center for Financial Research.](https://www.fdic.gov/center-financial-research/agricultural-lending-insurance-and-implications-climate-change) Como o seguro rural amortece o elo produtividade climática → atraso de empréstimos agrícolas nos EUA; sem código.
- [Liu. Save the Farms: Nonlinear Impact of Climate Change on Banks' Agricultural Lending. arXiv:2409.19463 (2024).](https://arxiv.org/abs/2409.19463) Anomalia de temperatura reduz crédito a fazendas, de forma não linear e concentrada nas pequenas; sem código.

---

## O que não existe pronto (e vai ter de ser feito em casa)

| Método | O que se acha no GitHub | O que fazer |
|---|---|---|
| Lerner e Boone para bancos | nada mantido; só papers com a receita (translog + derivada; Boone por GMM) | `linearmodels` + 1 a 2 dias de código; validar contra o Lerner e o Boone do Brasil na Global Financial Development Database (Banco Mundial) |
| Beta de depósito e custo de captação | exercícios individuais (0 estrelas); a página de dados do Schnabl dá os betas dos EUA | regressão por banco no IF.data (despesa de captação / captação contra Selic), com janelas de ciclo |
| RAROC e preço do crédito por risco | dois ou três projetos de estudante | fórmula: (spread − custo de funding − perda esperada − custo operacional) / capital econômico; curva do FTP via QuantLib |
| FTP casado por prazo | nenhum mantido | curva pré (DI1, B3) com QuantLib; prazos do SCR.data |
| Entrada e saída de agências (Bresnahan-Reiss) | nada em Python | probit ordenado (OrderedModel do statsmodels) sobre número de agências por município (ESTBAN/agências) |
| PD rural com dado público brasileiro | nenhum modelo aberto | painel municipal (PyFixest) + nowcast (mlforecast); PD por cliente só com dado interno |
| Nowcast de NPL | nenhum repositório específico | DFM do statsmodels ou mlforecast, como acima |
| Gatilho paramétrico para o Brasil | só replicações de outros países (EUA, Índia, Europa) | SPI/SPEI por município + produtividade PAM; medir risco de base como em Leppert et al. (2021) |

## Limitações deste levantamento

- Estrelas e datas mudam. O JSON guarda a data da checagem em cada entrada.
- A busca no GitHub foi por nome e descrição, em português e inglês. Código que só existe dentro de pacotes de
  replicação (openICPSR, Dataverse, sites de autores) aparece menos, e parte dele pede login.
- Nada foi executado. "Usar direto" é um juízo sobre API, licença e manutenção.
- Não houve busca sistemática em GitLab, CRAN sem GitHub ou Stata SSC. Pacotes Stata só entram como referência,
  porque a plataforma é Python.
