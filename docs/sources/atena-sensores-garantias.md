# Atena: sensores (degraus 3 a 6) e garantias

Levantamento de **28/11/2026** para o Panorama 1 do plano do BB ([`05-panoramas.md`](../../estrategia/bb/05-panoramas.md)
§1). A pergunta do Atena é: no crédito rural, **lutar** (defender e reprecificar) ou **recuar**? Este documento mapeia
duas coisas que a decisão pede:

- os **sensores** dos degraus 3 a 6 (safra e preço, comercialização, logística global, observação da Terra);
- as **garantias**: o que a lei diz e que dado público testa se a garantia muda a perda dado o default (LGD) na prática.

No fim estão as premissas **G01–G03** e **S01–S05**, no esquema de
[`03-conselho.md`](../../estrategia/bb/03-conselho.md) §5. Elas não foram copiadas para `01-premissas.md`.

A versão para máquina está em [`atena-sensores-garantias.json`](atena-sensores-garantias.json): 53 fontes e as
8 premissas. Das 53, 27 deram o dado no teste, 18 responderam sem o dado (login, JavaScript, chave) ou foram
confirmadas só por busca, e 8 falharam. Cada fonte traz URL, endpoint, o que mede, granularidade, histórico, frequência, defasagem, formato,
licença, custo, o teste de 28/11 e as premissas que alimenta.

**O que não está aqui.** Os degraus 1 (SGS, SCR.data, SICOR) e 2 (NASA POWER, CHIRPS) estão no laboratório rural.
O mapa geral de fatores externos está em [`fatores-externos-e-propostas.md`](fatores-externos-e-propostas.md). As
leis bancárias e os formatos estão em [`leis-ontologias-formatos.md`](leis-ontologias-formatos.md). Onde uma fonte já
estava nesses mapas, este documento só aprofunda: tabela, endpoint, licença e o teste do dia (campo `aprofunda` no
JSON).

**Como foi testado.** Chamadas pequenas em 28/11/2026, com User-Agent genérico. Onde falhou, o motivo está
anotado e nada foi contornado: sem desligar o TLS, sem fingir ser navegador, sem passar por desafio antirrobô. Os
números citados saíram dessas chamadas. Onde o dado veio de busca, está escrito "por busca".

---

## Resumo

- **O degrau 3 é barato e está pronto.** O IBGE (LSPA 6588 e PAM 5457) responde em menos de meio segundo, por UF e
  por município, sem chave. A Conab publica uma planilha por levantamento e o progresso semanal de plantio e
  colheita. O CEPEA dá o XLS direto, mas sob **CC BY-NC 4.0**: uso comercial pede licença. A **B3 proíbe coleta
  automatizada**, inclusive por IA. Futuro agrícola, só com licença.
- **O degrau 4 é viável, com atrito.** A API do Comex Stat segue quebrada (erro de banco de dados do servidor). Os
  CSV brutos usam certificado da cadeia ICP-Brasil/SERPRO, que o sistema não reconhece. A surpresa boa é o
  **IMF PortWatch**: toneladas exportadas por porto e por dia, estimadas por AIS, de 2019 a 20/11/2026, grátis, para
  103 portos brasileiros. Os line-ups de Paranaguá e Santos são HTML aberto. Os de Rio Grande e Itaqui não.
- **O degrau 5 vale pouco agora.** O Comtrade só tem a China mensal até 12/2024. A base da alfândega chinesa
  (GACC) tem desafio antirrobô. AIS grátis cobre só a costa. AIS comercial tem preço público baixo na VesselFinder
  (€ 330 por 10 mil créditos); Kpler, MarineTraffic e Spire, só por cotação. O PortWatch cobre boa parte da
  pergunta sem custo.
- **O degrau 6 é aberto e cabe em casa por município, não por talhão no país inteiro.** Copernicus, Earth Search
  (AWS), Planetary Computer e Brazil Data Cube responderam, todos grátis. MODIS a 250 m por município custa dezenas de
  GB por ano. Sentinel-2 no Brasil agrícola inteiro passa de 10 TB por ano. O **CAR responde por WFS** (222.127
  imóveis em MT, com área e módulos fiscais). O SIGEF não respondeu.
- **Garantias: a lei avançou, o dado de execução não existe.** A Lei 13.986/2020 tira o patrimônio rural em
  afetação da recuperação judicial (RJ). A Lei 14.711/2023 criou a execução extrajudicial da hipoteca e deixou o saldo
  remanescente devido. Três coisas pesam contra:
  1. o **STF (Tema 961)** protege a pequena propriedade rural mesmo dada em garantia, e uma decisão de 21/09/2026
     estende o raciocínio à alienação fiduciária;
  2. o **STJ (Súmula 298)** faz do alongamento um direito do devedor;
  3. liminares de 2026 suspenderam leilões de fazendas.

  Não há base pública de leilões extrajudiciais. O teste começa por amostra manual de editais.

---

## 1. Degrau 3: safra e preço

| Fonte | Endpoint e granularidade | Histórico e frequência | Licença e custo | Teste 28/11 | Uso no Atena |
|---|---|---|---|---|---|
| **IBGE LSPA** (SIDRA 6588) | `apisidra.ibge.gov.br/values/t/6588/n3/{UF}/v/35/p/last%201/c48/39443`. Variáveis: área plantada e colhida, produção, rendimento. Brasil, região e UF | 2006-09 a 2026-10; mensal | pública, grátis | **200** em 0,4 s. Soja out/2026: PR 21,97 Mt; MT 50,67 Mt | S01 (surpresa de safra = revisão mensal) |
| **IBGE PAM** (SIDRA 5457) | `.../t/5457/n6/{mun}/v/214,216,8331/p/{ano}/c782/40124`. Município × cultura | 1974 a 2025; anual (~9 meses de defasagem) | pública, grátis | **200**. Sorriso (MT) 2024: 2,08 Mt de soja em 599 mil ha | S05 (gabarito do NDVI), G01 |
| **Conab, levantamento de safra** | uma XLSX por levantamento (ex. `site_previsao_de_safra-por_produto-nov-2026.xlsx`). Produto × UF | 12 levantamentos por safra | pública; páginas gov.br em CC BY-ND 3.0 | página do 2º lev. 2026/27 **200**. O portal de série histórica (TXT) **falhou**: nome do certificado TLS não confere | S01 |
| **Conab, progresso de safra** | página semanal: % semeado e colhido, condição. UF | semanal | pública | **200**; última semana: 02–08/11/2026 | S01, S05 (calendário observado) |
| **Conab, calendário de plantio e colheita** | PDF por cultura e UF (edições 2020 e 2022) | irregular | pública | por busca; não baixado | janela típica; por município, usar o ZARC |
| **Conab, monitoramento agrícola** | PDF mensal com anomalia do índice de vegetação por região produtora | mensal | pública | **200**, 3,2 MB (nov/2026) | S05 (produto pronto, para comparar) |
| **Conab, custos de produção** | custo por ha e por saca, por cultura e polo (~50) | por safra | pública | página **200**; planilhas no portal com TLS quebrado | S02, G03 |
| **CEPEA/ESALQ** | XLS direto: `cepea.org.br/br/indicador/series/soja.aspx?id=92`. Praça; diária | décadas; diária | **CC BY-NC 4.0** | **200**, 384 KB. Soja PR 27/11/2026: R$ 160,74/sc | S02, G03 |
| **B3, futuros agrícolas** | boletim diário (CCM, BGI, SJC, ICF) | diária | termos da B3: **coleta automatizada vedada**, inclusive por IA; market data pago | página 200; **não coletado** | S02 só com licença |
| **MAPA ZARC** | CKAN `dados.agricultura.gov.br`; API Agritec `api.cnptia.embrapa.br/agritec/v2/zoneamento`. Município × cultura × solo × decêndio | por safra (portarias) | CC BY; Agritec pede OAuth2 (cadastro grátis) | CKAN: **conexão expirou** (o DNS resolve). Agritec: **401** "Missing Credentials" (o endpoint existe) | S01, S05 (janela de plantio por município) |

**Leitura.** O par LSPA (mensal, UF) e PAM (anual, município) basta para medir a surpresa de safra. A Conab soma o
calendário observado e o custo. Para preço, o CEPEA é a fonte, mas a licença NC barra o uso pelo banco sem acordo.
O ZARC já foi alcançado no mapa anterior: a falha de hoje parece instabilidade do servidor.

## 2. Degrau 4: comercialização

| Fonte | Endpoint e granularidade | Histórico e frequência | Licença e custo | Teste 28/11 | Uso no Atena |
|---|---|---|---|---|---|
| **Comex Stat, API** | `POST api-comexstat.mdic.gov.br/general` com NCM, UF, via, URF (porto), mês | 1997 em diante; mensal | pública | **500**: "password authentication failed for user usr_comexstat" (erro do servidor, igual ao de 28/11 no mapa anterior) | S03 |
| **Comex Stat, CSV bruto** | `balanca.mdic.gov.br/balanca/bd/comexstat-bd/ncm/EXP_{ano}.csv`; base MUN por município; tabelas URF, NCM, VIA | 1997–2026; mensal | pública | lista de links **200**. Download **falhou**: certificado da AC SERPRO (ICP-Brasil) fora do repositório padrão. O host antigo tem certificado **vencido em 03/10/2026** | S03 |
| **IMF PortWatch** | ArcGIS `services9.arcgis.com/.../Daily_Ports_Data/FeatureServer/0/query`. Escalas e toneladas de importação e exportação por tipo de navio. 103 portos BR | 2019-01-01 a 2026-11-20; diária, atualizada por semana | atribuição ao FMI e ao UN Global Platform; reuso comercial pede permissão; treino de LLM vedado | **200**. Paranaguá 19/11: 4 escalas de granel sólido, 156.393 t exportadas (estimativa) | S03, S04 |
| **Paranaguá (APPA), line-up** | HTML, inclusive retroativo: navio, IMO, sentido, mercadoria, toneladas, datas | contínuo | pública; sem termos publicados | **200**, 222 KB; soja, farelo, milho e adubo de nov/2026 | S03 |
| **Santos (APS), navios esperados e mensário** | HTML (esperados) e PDF (mensário) | contínuo; mensal | pública | **200**; "EMB SOJA A GRANEL", 58–70 mil t por navio | S03 |
| **Rio Grande (Portos RS), line-up** | link "público" do PortoWeb | — | pública | devolve **tela de login**; sem www, erro de nome no TLS | usar PortWatch e Comex Stat |
| **Itaqui (EMAP), navios** | HTML com lista carregada por JavaScript | — | pública | **200** sem dados no HTML; "programados" 404 | Arco Norte via PortWatch (Itaqui, Santarém, Vila do Conde, Itacoatiara) |
| **ANTAQ, Estatístico Aquaviário** | ZIP anual por atracação e carga | 2010 em diante; mensal | aberta | **DNS não resolveu** (`web3.antaq.gov.br`); página gov.br 404 | S03 (testar de novo) |
| **Conab, boletim logístico** | PDF: fretes por rota, exportação por porto | mensal | pública | **200**; edições listadas são de 2024 | S03 |
| **IMEA, comercialização (MT)** | % da soja e do milho já vendidos em MT | mensal | termos não verificados | **200**, conteúdo por JS; PDF não baixado | S03 (único ritmo de venda público achado) |
| **USDA AMS, Brazil Soybean Transportation** | PDF trimestral: frete Sorriso→portos, frete marítimo, custo até Xangai | ~2004 em diante; trimestral | domínio público | **200**, 5,5 MB (1º–2º tri/2026): custo até Xangai +31–34% | S02, S03 |

**Leitura.** A pergunta "o grão está saindo?" tem resposta grátis no PortWatch, por porto e por dia, com oito dias
de atraso. O Comex Stat dá a origem por UF. Para usá-lo, o operador precisa decidir instalar a cadeia ICP-Brasil
publicada pelo ITI. É uma decisão de confiança, não um contorno. O ritmo de venda do produtor só tem fonte pública
em MT (IMEA). As outras séries são de consultorias pagas.

## 3. Degrau 5: logística global

| Fonte | O que dá | Limite | Custo | Teste 28/11 | Uso no Atena |
|---|---|---|---|---|---|
| **UN Comtrade** (`comtradeapi.un.org/public/v1/preview/...`) | comércio bilateral por HS e mês | China mensal só até **2024-12** (última carga em 07/2025); 429 na segunda chamada seguida | grátis com limite; premium pago | **200**. Brasil 2024, HS 1201: 98,8 Mt exportadas, 72,6 Mt para a China | S04 (pesos estruturais, não o presente) |
| **GACC** (alfândega da China) | importação mensal por produto; por país, na base online | base online com **desafio JS antirrobô** (412) | grátis | tabelas mensais em inglês **200** | S04 |
| **aisstream.io** | AIS em tempo real por WebSocket, com chave grátis | só antenas em terra; sem histórico nem SLA | grátis | documentação **200** | S04 |
| **AISHub** | AIS agregado de voluntários | exige enviar dados de um receptor próprio | grátis com contrapartida | **200** | S04 |
| **Global Fishing Watch API** | eventos de navio (porto, encontros) | foco em pesca; uso não comercial | grátis com token | **401** sem token | — |
| **VesselFinder** | posições, escalas, dados do navio | — | 10 mil créditos = € 330; 20 mil = € 625; 50 mil = € 1.470; 1 crédito por posição terrestre, 5–10 por satélite; frota de 20 navios por hora = € 140/mês | preços nas páginas oficiais, por busca | S04 refutada → começar aqui |
| **Kpler / MarineTraffic, Spire** | AIS de satélite e fluxo de carga por navio | — | sem preço público; contrato anual | página 200 | só se S04 for refutada |
| **Frete: Baltic (BDI) e substitutos** | BDI é da Baltic Exchange (pago). Substitutos: GTR semanal do USDA (fretes de grãos, com rotas do Brasil) e o ETF BDRY (não oficial, via Yahoo) | BDRY é futuro de frete, não o índice | GTR grátis | GTR 26/11/2026 **200**; BDRY **200** (12,12–12,84) | S04 |

**Leitura.** Para a pergunta do Atena (risco por UF em 1 a 2 trimestres), o degrau 5 entra como teste, não como
coletor. A premissa S04 foi escrita para o gasto ter de provar que vale.

## 4. Degrau 6: observação da Terra

| Fonte | Acesso | Resolução e histórico | Licença e custo | Teste 28/11 | Uso no Atena |
|---|---|---|---|---|---|
| **Copernicus Data Space** | STAC `stac.dataspace.copernicus.eu/v1`; OData `catalogue.dataspace.copernicus.eu` | Sentinel-2 L2A, 10 m, ~5 dias, desde 2015 | aberto; download com conta grátis | **200**. Tile 21LXG (Sorriso): cenas de 18/11 (67,5% de nuvem), 21/11 e 26/11. Produto de 0,66–1,09 GB | S05, G01 |
| **Earth Search (AWS Open Data)** | STAC `earth-search.aws.element84.com/v1`; COG em `s3://sentinel-cogs` | S2 L2A em COG; Landsat | aberto; sem conta | **200**; leitura parcial do B04 deu **206** em 0,8 s | S05 (melhor caminho para servidor doméstico) |
| **Planetary Computer** | STAC `planetarycomputer.microsoft.com/api/stac/v1` + token SAS anônimo | S2, Landsat, MODIS e outros | aberto | STAC e token **200** | S05 |
| **Google Earth Engine** | API com projeto Cloud | catálogo completo | não comercial grátis (150 EECU-hora); comercial: US$ 0,40/EECU-hora, ou US$ 500 e US$ 2.000/mês | termos por busca | pesquisa sim; uso pelo banco é comercial |
| **ORNL DAAC, MODIS subsets** | REST `modis.ornl.gov/rst/api/v1/MOD13Q1/subset?...` | NDVI/EVI 250 m, 16 dias, desde 2000 | aberto, sem conta | **200** em 16 s; composição de 30/09/2026 | S05 |
| **Brazil Data Cube (INPE)** | STAC `data.inpe.br/bdc/stac/v1` | cubos S2 e Landsat de 16 dias, MOD13Q1 em COG, CBERS | aberto | **200** | S05 (cubo sem nuvem pronto) |
| **MapBiomas, coleção 11** | XLSX de estatísticas; rasters em GEE e GCS | 30 m, anual desde 1985; coleção publicada em 08/2026 | CC BY 4.0 | **200** | S05 (máscara de soja), G01 |
| **MapBiomas Alerta** | GraphQL `plataforma.alerta.mapbiomas.org/api/v2/graphql` | alertas validados × CAR | CC BY 4.0; login para dados | **200** | G01 (imóvel embargado não serve de garantia) |
| **SICAR / CAR** | WFS `geoserver.car.gov.br/geoserver/sicar/wfs`, uma camada por UF | polígono, situação, condição, área, **módulos fiscais**, município; sem nome nem CPF | público; declaratório | **200**; MT: **222.127** imóveis. A página de download entra em laço (captcha) | G01, S05 |
| **SIGEF / Acervo Fundiário (INCRA)** | consulta de parcelas; shapefiles | parcelas certificadas | público | **falhou**: "Request Rejected" (firewall) e DNS do acervo | G01 (matrícula e qualidade da garantia) |

**O que cabe num servidor doméstico.**

- **Por município, com MODIS ou VIIRS: sim.** Um ponto ou janela pela API do ORNL custa segundos. A série toda de um
  município cabe em kilobytes. O Brasil agrícola inteiro em MOD13Q1 são cerca de 12–15 tiles × 23 composições por
  ano: dezenas de GB por ano (estimativa).
- **Por talhão, com Sentinel-2: só em amostra.** Um produto L2A tem ~1 GB (medido). O Brasil agrícola tem centenas
  de tiles, com ~70 passagens por ano: mais de 10 TB por ano. Com COG e leitura só das bandas vermelha e NIR na
  janela do imóvel, uma amostra de 20 municípios ou de algumas centenas de garantias cabe em dezenas de GB por safra.
- **Cuidado com a continuidade.** Terra e Aqua (MODIS) estão no fim da vida útil. O substituto é o VIIRS (VNP13,
  500 m), também no ORNL e no Earthdata.

## 5. Garantias e recuperação

### 5.1 O que a lei diz (texto lido em 28/11/2026, na Câmara; o Planalto recusou a conexão)

| Norma | O que importa para a LGD |
|---|---|
| **Lei 13.986/2020** (07/04/2020) | Art. 10 §4º: o terreno, as acessões e as benfeitorias do **patrimônio rural em afetação** vinculado a CIR ou CPR não são atingidos por falência, insolvência ou RJ. **Exceções: lavouras, bens móveis e semoventes.** §3º II: é impenhorável para outras dívidas. Art. 17: a **Cédula Imobiliária Rural** pode ser liquidada com a entrega do imóvel afetado |
| **Lei 14.711/2023** (30/10/2023) | Art. 9º: **execução extrajudicial da hipoteca** pelo registro de imóveis. Lei 9.514, art. 27 §2º: no 2º leilão vale lance ≥ dívida; se não houver, o credor pode aceitar **≥ 50% da avaliação**. §5º-A: o **saldo remanescente segue devido**, salvo imóvel residencial (art. 26-A). Art. 9º-A: extensão da alienação fiduciária a novas operações. Código Civil, art. 853-A: agente de garantia |
| **Lei 11.101/2005, art. 49** (redação da Lei 14.112/2020) | Na RJ do produtor só entram créditos da atividade rural (§6º). **Recursos controlados ficam fora** (§7º), salvo os não renegociados antes do pedido (§8º). Dívida de compra de terra dos últimos 3 anos fica fora (§9º). A CPR com liquidação física ou barter fica fora pela Lei 8.929, art. 11 (fonte secundária) |

A aplicação do art. 9º da Lei 14.711 às cédulas rurais hipotecárias (DL 167/1967) pede leitura jurídica. Não foi
verificada.

### 5.2 Jurisprudência (por busca e notícias oficiais; inteiro teor não lido)

- **STF, Tema 982** (RE 860.631, 26/10/2023). A execução extrajudicial da Lei 9.514 é constitucional. É a base da
  alienação fiduciária.
- **STF, Tema 961** (ARE 1.038.507, 2020). A pequena propriedade rural familiar (menos de 4 módulos fiscais) é
  impenhorável, **mesmo dada em hipoteca**. Uma decisão de 21/09/2026 estende o raciocínio a outras garantias reais,
  como a alienação fiduciária (registrodeimoveis.org.br). Os tribunais estaduais divergem no alcance.
- **STJ, Tema 1145** (22/06/2022). O produtor com mais de 2 anos de atividade pode pedir RJ se estiver registrado na
  Junta na data do pedido.
- **STJ, Súmula 298.** O alongamento da dívida rural é direito do devedor, não faculdade do banco. Decisões de 2026
  em MT a aplicam para suspender cobrança.

### 5.3 Dado que testaria "a garantia muda a LGD na prática"

| Pergunta | Fonte | Estado em 28/11 |
|---|---|---|
| Quanto da exposição está em imóvel protegido (< 4 módulos fiscais)? | **SICAR WFS** (área, `m_fiscal`, situação) × **SICOR** por município | **pronto**: WFS 200; o SICOR está no laboratório |
| Quanto vale a terra, por região? | **RFB VTN** (município × 6 classes de aptidão, anual, publicado em 08/2026); **Deral-PR** (anual desde 1998, PDF); **IEA-SP** (desde os anos 1970); INCRA PPR | VTN por busca (URL oficial não achada); Deral **200**; IEA DNS falhou; INCRA 404. Série de mercado nacional só paga (S&P Global, ex-AgraFNP) |
| Quanto tempo e quanto custa executar? | **CNJ Justiça em Números** (tempo por fase e tribunal); **DataJud** (contagem por classe e assunto) | Justiça em Números **200** (edição 2026); DataJud **429** e tempo esgotado (cluster cheio) |
| O leilão sai, e por quanto? | editais de leiloeiros e cartórios | **sem base pública**. Começar por amostra manual; pedir dados ao ONR e ao CNJ via LAI |
| Quantos produtores vão à RJ? | **Serasa** (releases trimestrais) | por busca: 2025 = 1.990 pedidos no agro (recorde); 1º tri/2026 = 474 (+21,9%); 2º tri/2026 = 448 (−20,7%); produtor PF no 2º tri = 197. Os grupos se sobrepõem e não somam |
| Para onde vai a jurisprudência? | **STJ dados abertos** (CKAN, espelhos de acórdãos por turma, JSON mensal, CC BY) | **200**; 22 pacotes; 3ª Turma até 31/10/2026 |

### 5.4 Risco político e reputacional (evidência pública, sem nomes)

- **Renegociação por medida provisória, em série.** A MP 1.314/2025 (05/09/2025) abriu R$ 12 bi para renegociar
  dívida rural e perdeu a vigência em 12/02/2026. A MP 1.376/2026 (15/07/2026) veio em seguida, com regras pelo CMN.
  Cada rodada muda o valor da garantia: a dívida renegociada sai da RJ (art. 49 §8º), mas o prazo da execução se
  alonga.
- **Liminares contra leilão de fazenda em 2026**, em GO, MT e RO. Os motivos citados: falha na intimação do devedor,
  alongamento pela Súmula 298 e pequena propriedade pelo Tema 961. Advogados de credores lembram que a liminar não
  extingue a dívida. A cobertura vem de imprensa setorial e de escritórios: viés de seleção.
- **Como medir sem opinião:** eventos por mês e UF (MPs, resoluções do CMN, liminares noticiadas, pedidos de RJ). O
  resultado entra como variável de "custo político" em G02.

---

## 6. Premissas propostas

No esquema de `03-conselho.md` §5. Os limiares são propostas iniciais, a fixar antes do teste. `sicor`, `scr_data` e
`chirps` são as fontes do laboratório rural. As premissas estão também no JSON (`premissas`).

```json
{"id": "G01", "versao": 1, "origem": "atena-v0", "autor": "mapa-fontes", "mercado": "agro",
 "enunciado": "Nas UFs e municípios com mais crédito rural fora do Pronaf, a maior parte da área está em imóveis com 4 ou mais módulos fiscais, fora da proteção da pequena propriedade (STF Tema 961). Logo, a garantia de imóvel pode ser executada na maior parte da exposição.",
 "por_que_importa": "Se a garantia não pode ser executada, ela não muda a LGD. O Tema 961 e a decisão de 09/2026 ampliam a proteção para além da hipoteca.",
 "teste": {"fontes": ["sicar-wfs", "sicor", "ibge-pam-5457", "mapbiomas"],
           "metrica": "parcela da área do CAR ativo em imóveis com m_fiscal ≥ 4, por município, ponderada pelo valor contratado no SICOR fora do Pronaf",
           "periodo": "CAR: foto de 11/2026; SICOR: safras 2020/21 a 2025/26",
           "comparacao": "entre UFs; e entre a carteira total e a parte com taxa de mercado"},
 "confirma_se": "≥ 70% do valor fora do Pronaf está em municípios onde ≥ 70% da área do CAR é de imóveis com 4 ou mais módulos fiscais",
 "refuta_se": "< 50% do valor fora do Pronaf cumpre essa condição",
 "decisao": {"se_verdadeira": "Lutar: alienação fiduciária ou CIR com patrimônio em afetação como padrão para médio e grande produtor, com LGD menor no preço",
             "se_falsa": "A garantia de imóvel vale pouco onde está o risco: seguro, CPR com penhor de safra e limite por produtor; recuar onde não houver garantia executável"},
 "fatos": [], "valor_decisao": {"tamanho": 3, "incerteza": 2, "alavanca": 3}}

{"id": "G02", "versao": 1, "origem": "atena-v0", "autor": "mapa-fontes", "mercado": "agro",
 "enunciado": "Depois da Lei 14.711/2023, a execução extrajudicial de imóvel rural chega à arrematação ou à adjudicação em até 12 meses, e menos de 30% dos casos são suspensos na Justiça (liminar, RJ, alongamento).",
 "por_que_importa": "O valor da garantia depende do prazo e do custo. Se metade das execuções para na Justiça, a garantia só vale no papel e o custo político cresce.",
 "teste": {"fontes": ["leiloes-extrajudiciais", "cnj-datajud", "stj-precedentes", "serasa-rj-agro", "risco-politico-rural"],
           "metrica": "(a) tempo mediano da consolidação ao leilão; (b) parcela de leilões rurais suspensos ou anulados; (c) ações contra leilão e pedidos de RJ de produtor por 1.000 contratos (DataJud; SICOR no denominador)",
           "periodo": "2021 a 2026, com corte em 30/10/2023",
           "comparacao": "antes × depois da Lei 14.711; rural × residencial urbano; UFs com e sem onda de RJ"},
 "confirma_se": "tempo mediano ≤ 12 meses e suspensão < 30% numa amostra de editais com n ≥ 200",
 "refuta_se": "tempo mediano > 24 meses ou suspensão > 50%",
 "decisao": {"se_verdadeira": "Lutar: trocar a garantia na renegociação (hipoteca por alienação fiduciária ou CIR) e reduzir a provisão das operações com garantia nova",
             "se_falsa": "Não dar crédito de LGD à garantia de imóvel no preço; tratar a renegociação como a cura; reavaliar a carteira com taxa de mercado"},
 "fatos": [], "valor_decisao": {"tamanho": 3, "incerteza": 3, "alavanca": 3}}

{"id": "G03", "versao": 1, "origem": "atena-v0", "autor": "mapa-fontes", "mercado": "agro",
 "enunciado": "O preço da terra nas regiões de maior inadimplência rural caiu menos de 15% em termos reais desde o pico de 2023–2024. Com o desconto de leilão (lance de 50% da avaliação), a garantia ainda cobre a dívida típica por hectare.",
 "por_que_importa": "A garantia protege só enquanto a terra vale mais que a dívida. Se a terra cai junto com a safra, a garantia falha quando mais se precisa dela.",
 "teste": {"fontes": ["rfb-vtn", "deral-precos-terras", "iea-sp-terras", "sicor", "scr_data", "conab-custos"],
           "metrica": "variação real do VTN e do preço de terra por município ou região (IPCA); LTV implícito = saldo rural por hectare financiado ÷ (0,5 × preço da terra)",
           "periodo": "2019 a 2026",
           "comparacao": "quartil de maior × menor inadimplência rural por UF (SCR.data); PR e SP como controle de qualidade do VTN"},
 "confirma_se": "queda real < 15% no quartil de maior inadimplência e LTV implícito ≤ 0,8",
 "refuta_se": "queda real > 25% ou LTV implícito > 1,0 no quartil de maior inadimplência",
 "decisao": {"se_verdadeira": "Lutar com garantia: limite por LTV e por preço de terra da região",
             "se_falsa": "Recuar onde terra e safra caem juntas; exigir seguro e garantia de safra; reduzir o limite por produtor"},
 "fatos": [], "valor_decisao": {"tamanho": 3, "incerteza": 2, "alavanca": 2}}

{"id": "S01", "versao": 1, "origem": "atena-v0", "autor": "mapa-fontes", "mercado": "agro",
 "enunciado": "A surpresa de safra por UF (revisões do LSPA e da Conab frente à 1ª estimativa) antecipa em 2 a 3 trimestres a alta da inadimplência rural da UF, além do que o clima (degrau 2) já explica.",
 "por_que_importa": "O degrau 3 custa quase nada. Se acrescenta informação, entra no monitor já.",
 "teste": {"fontes": ["ibge-lspa-6588", "conab-safra-xlsx", "conab-progresso", "scr_data", "chirps"],
           "metrica": "erro absoluto médio da previsão de inadimplência rural por UF, fora da amostra, origem móvel",
           "periodo": "2012T1 a 2026T3",
           "comparacao": "clima (degrau 2) × clima + surpresa de safra; ingênuo sazonal como piso"},
 "confirma_se": "redução do erro ≥ 10% nos horizontes de 2 e 3 trimestres",
 "refuta_se": "redução < 3%",
 "decisao": {"se_verdadeira": "Subir o degrau 3 no monitor por UF (custo de dados zero)",
             "se_falsa": "Ficar nos degraus 1 e 2; usar a safra só como narrativa"},
 "fatos": [], "valor_decisao": {"tamanho": 2, "incerteza": 2, "alavanca": 2}}

{"id": "S02", "versao": 1, "origem": "atena-v0", "autor": "mapa-fontes", "mercado": "agro",
 "enunciado": "A margem do produtor por hectare (preço na colheita × produtividade − custo Conab) explica a inadimplência rural por UF melhor que a produtividade sozinha: o choque de 2023–2026 é mais de preço e custo do que de quebra física.",
 "por_que_importa": "Separa a tese 'clima' (lutar com sensores) da tese 'preço' (risco que o banco não controla, que puxa para recuar ou para hedge).",
 "teste": {"fontes": ["cepea-indicadores", "conab-custos", "ibge-pam-5457", "ibge-lspa-6588", "scr_data", "usda-ams-brazil-soy"],
           "metrica": "R² parcial e ganho fora da amostra da margem por hectare sobre o modelo só com produtividade, em painel UF × safra",
           "periodo": "safras 2010/11 a 2025/26",
           "comparacao": "margem × produtividade × clima; soja e milho separados"},
 "confirma_se": "a margem eleva o R² parcial em ≥ 0,10 e domina a produtividade em 2023–2026",
 "refuta_se": "ganho < 0,03 ou a produtividade domina",
 "decisao": {"se_verdadeira": "Precificar e limitar por margem (cenários de preço e custo); oferecer hedge e CPR com preço travado",
             "se_falsa": "Concentrar o monitor em clima e safra (S01, S05)"},
 "fatos": [], "valor_decisao": {"tamanho": 3, "incerteza": 3, "alavanca": 2}}

{"id": "S03", "versao": 1, "origem": "atena-v0", "autor": "mapa-fontes", "mercado": "agro",
 "enunciado": "O ritmo de exportação de grãos por UF e porto (Comex Stat mensal e PortWatch diário) desvia do padrão sazonal 1 a 2 meses antes do aumento de atraso no crédito rural das UFs exportadoras.",
 "por_que_importa": "Produtor que retém grão espera preço ou não tem o que vender. Os dois casos mudam o risco do custeio que vence.",
 "teste": {"fontes": ["comexstat-bulk", "imf-portwatch-ports", "appa-lineup", "santos-navios-esperados", "imea-comercializacao", "scr_data"],
           "metrica": "anomalia sazonal de toneladas exportadas (NCM 1201, 1005, 2304) por UF e porto; ganho de previsão do atraso 15–90 dias sobre S01",
           "periodo": "2019-01 a 2026-10 (limite do PortWatch); Comex Stat desde 1997",
           "comparacao": "S01 × S01 + comercialização"},
 "confirma_se": "redução adicional do erro ≥ 5% no horizonte de 1 a 2 meses",
 "refuta_se": "redução < 2%",
 "decisao": {"se_verdadeira": "Pôr o degrau 4 no monitor (PortWatch grátis; Comex Stat quando o TLS for resolvido)",
             "se_falsa": "Não manter coletor de portos; Comex Stat só como contexto"},
 "fatos": [], "valor_decisao": {"tamanho": 2, "incerteza": 3, "alavanca": 2}}

{"id": "S04", "versao": 1, "origem": "atena-v0", "autor": "mapa-fontes", "mercado": "agro",
 "enunciado": "Dados logísticos globais (AIS de chegada na China, frete marítimo, importação da GACC) não acrescentam previsão de risco rural por UF além do degrau 4, num horizonte de 1 a 2 trimestres.",
 "por_que_importa": "É o primeiro degrau com custo real (AIS comercial). A premissa é escrita para o gasto ter de se justificar.",
 "teste": {"fontes": ["imf-portwatch-ports", "gacc-china", "baltic-proxies", "un-comtrade", "scr_data"],
           "metrica": "ganho de previsão do modelo S03 ao somar importação chinesa de soja (GACC), frete (GTR) e chegadas a portos chineses (PortWatch)",
           "periodo": "2019 a 2026",
           "comparacao": "S03 × S03 + logística global"},
 "confirma_se": "ganho < 2% (não vale pagar)",
 "refuta_se": "ganho ≥ 5%",
 "decisao": {"se_verdadeira": "Não comprar AIS comercial; ficar com PortWatch e GACC",
             "se_falsa": "Orçar AIS: começar pela VesselFinder (a partir de € 330) e só depois cotar Kpler"},
 "fatos": [], "valor_decisao": {"tamanho": 1, "incerteza": 2, "alavanca": 2}}

{"id": "S05", "versao": 1, "origem": "atena-v0", "autor": "mapa-fontes", "mercado": "agro",
 "enunciado": "A anomalia de NDVI no pico vegetativo (MODIS 250 m, só sobre a soja do MapBiomas) por município prevê o rendimento da PAM com correlação ≥ 0,6 e chega 6 a 9 meses antes do IBGE.",
 "por_que_importa": "Dá a quebra por município durante a safra, antes do vencimento do custeio, num servidor doméstico.",
 "teste": {"fontes": ["ornl-modis-subsets", "bdc-inpe", "mapbiomas", "ibge-pam-5457", "conab-monitoramento", "chirps"],
           "metrica": "correlação entre a anomalia de NDVI (dez–fev) e o desvio de rendimento da soja na PAM, por município; ganho sobre o SPI do CHIRPS",
           "periodo": "safras 2001/02 a 2024/25",
           "comparacao": "NDVI × chuva (degrau 2) × os dois; municípios de MT, GO, PR e RS"},
 "confirma_se": "r ≥ 0,6 e ganho sobre a chuva em ≥ 2/3 dos municípios testados",
 "refuta_se": "r < 0,4",
 "decisao": {"se_verdadeira": "Ligar o degrau 6 por município (MODIS/VIIRS); Sentinel-2 só em amostra e para avaliar garantias",
             "se_falsa": "Usar o boletim de monitoramento da Conab como sinal pronto, sem pipeline de satélite"},
 "fatos": [], "valor_decisao": {"tamanho": 2, "incerteza": 2, "alavanca": 2}}
```

**Ordem sugerida de teste** (valor de decisão ÷ custo): G01 e S01 primeiro (dado pronto e grátis), depois S02 e
G03, depois S05 e S03. G02 pede a amostra manual de editais, que é o trabalho mais caro. S04 só depois de S03.

## 7. Lacunas e riscos

- **Servidores do governo instáveis no dia.** Falharam: Comex Stat (API e TLS), portal da Conab (TLS), CKAN do MAPA
  (tempo esgotado), ANTAQ, IEA-SP e acervo do INCRA (DNS), SIGEF (firewall), DataJud (fila cheia), Planalto
  (conexão recusada). Antes de dar uma fonte por perdida, testar de novo em outro dia.
- **Licenças que barram o uso pelo banco.** CEPEA (NC), B3 (coleta vedada), PortWatch (reuso comercial com
  permissão), Earth Engine (comercial pago). No estudo público, tudo serve com citação. Para levar para dentro, a
  licença entra no custo da proposta.
- **Dado pessoal.** O CAR pelo WFS não traz nome nem CPF, e assim deve ficar: não cruzar com outras bases para
  identificar proprietários. O DataJud só em agregado. Os line-ups trazem empresas e navios, não pessoas.
- **Execução de garantia é a maior lacuna.** Não há série pública de leilões, prazos ou valores de recuperação de
  imóvel rural. G02 depende de uma amostra manual e de pedidos via LAI.
- **Jurisprudência em movimento.** A extensão do Tema 961 à alienação fiduciária (09/2026) é decisão individual. Se
  virar entendimento do plenário, G01 muda de peso.

### Referências (acessadas em 28/11/2026)

- IBGE SIDRA, tabelas [6588](https://sidra.ibge.gov.br/tabela/6588) e [5457](https://sidra.ibge.gov.br/tabela/5457).
- Conab: [safra de grãos](https://www.gov.br/conab/pt-br/atuacao/informacoes-agropecuarias/safras/safra-de-graos/boletim-da-safra-de-graos), [progresso de safra](https://www.gov.br/conab/pt-br/atuacao/informacoes-agropecuarias/safras/progresso-de-safra), [custos](https://www.gov.br/conab/pt-br/atuacao/informacoes-agropecuarias/custos-de-producao), [boletim logístico](https://www.gov.br/conab/pt-br/atuacao/logistica/boletim-logistico).
- [CEPEA, indicador da soja](https://www.cepea.org.br/br/indicador/soja.aspx). [B3, boletim diário](https://www2.bmf.com.br/pages/portal/bmfbovespa/lumis/lum-ajustes-do-pregao-ptBR.asp).
- [MAPA, ZARC](https://www.gov.br/agricultura/pt-br/assuntos/riscos-seguro/programa-nacional-de-zoneamento-agricola-de-risco-climatico).
- [MDIC, base de dados bruta](https://www.gov.br/mdic/pt-br/assuntos/comercio-exterior/estatisticas/base-de-dados-bruta). [IMF PortWatch](https://portwatch.imf.org/). [FMI, termos de uso](https://www.imf.org/en/about/copyright-and-terms).
- [APPA, line-up](https://www.appaweb.appa.pr.gov.br/appaweb/pesquisa.aspx?WCI=relLineUpRetroativo). [Porto de Santos, navios esperados](https://www.portodesantos.com.br/informacoes-operacionais/operacoes-portuarias/navegacao-e-movimento-de-navios/navios-esperados-carga/). [Porto do Itaqui](https://www.portodoitaqui.com/porto-agora/navios/esperados). [IMEA](https://www.imea.com.br/imea-site/relatorios-mercado).
- USDA AMS: [Brazil Soybean Transportation](https://www.ams.usda.gov/services/transportation-analysis/brazil), [Grain Transportation Report](https://www.ams.usda.gov/services/transportation-analysis/gtr).
- [UN Comtrade](https://comtradeplus.un.org/). [GACC, relatórios mensais](http://english.customs.gov.cn/statics/report/monthly.html). [aisstream.io](https://aisstream.io/documentation). [AISHub](https://www.aishub.net/api). [VesselFinder, Vessel Positions API](https://www.vesselfinder.com/vessel-positions-api). [MarineTraffic/Kpler, data services](https://www.marinetraffic.com/en/ais-api-services).
- [Copernicus Data Space](https://dataspace.copernicus.eu/). [Earth Search](https://earth-search.aws.element84.com/v1). [Planetary Computer](https://planetarycomputer.microsoft.com/api/stac/v1). [Earth Engine, tiers não comerciais](https://developers.google.com/earth-engine/guides/noncommercial_tiers) e [preços](https://cloud.google.com/earth-engine/pricing). [ORNL MODIS web service](https://modis.ornl.gov/data/modis_webservice.html). [Brazil Data Cube](https://data.inpe.br/bdc/stac/v1/). [MapBiomas, estatísticas](https://brasil.mapbiomas.org/downloads/estatisticas/). [SICAR WFS](https://geoserver.car.gov.br/geoserver/sicar/wfs?service=WFS&request=GetCapabilities).
- Leis (texto consolidado da Câmara): [13.986/2020](https://www2.camara.leg.br/legin/fed/lei/2020/lei-13986-7-abril-2020-789955-normaatualizada-pl.html), [14.711/2023](https://www2.camara.leg.br/legin/fed/lei/2023/lei-14711-30-outubro-2023-794873-normaatualizada-pl.html), [11.101/2005](https://www2.camara.leg.br/legin/fed/lei/2005/lei-11101-9-fevereiro-2005-535663-normaatualizada-pl.html), [MP 1.314/2025](https://www2.camara.leg.br/legin/fed/medpro/2025/medidaprovisoria-1314-5-setembro-2025-797939-normaatualizada-pe.html).
- STF: [Tema 982, notícia do STF](https://noticias.stf.jus.br/?p=59370); Tema 961, [decisão de 21/09/2026](https://www.registrodeimoveis.org.br/fachin-determina-revisao-de-penhora-de-propriedade-hipotecada). STJ: [Tema 1145](https://www.conjur.com.br/2022-jun-29/produtor-rural-inscrito-junta-pedir-recuperacao-judicial/), [dados abertos](https://dadosabertos.web.stj.jus.br/).
- CNJ: [DataJud, acesso](https://datajud-wiki.cnj.jus.br/api-publica/acesso), [Justiça em Números](https://www.cnj.jus.br/pesquisas-judiciarias/justica-em-numeros/).
- Serasa Experian, [RJ no agro, 1º tri/2026](https://www.serasaexperian.com.br/sala-de-imprensa/agronegocios/recuperacao-judicial-agro-tem-alta-de-22-por-cento-e-acumula-474-pedidos-do-recurso-no-primeiro-trimestre-de-2026-mostram-dados-ineditos-da-serasa-experian/); [2º tri/2026](https://revistacultivar.com.br/noticias/pedidos-de-recuperacao-judicial-no-agro-caem-20-7-no-2o-trimestre).
- Preço de terra: [Deral-PR](https://www.agricultura.pr.gov.br/terras); [VTN 2026 (Fenacon)](https://fenacon.org.br/noticias/receita-federal-divulga-tabela-nacional-do-valor-da-terra-nua-2026/).
- Liminares de 2026 contra leilões rurais (exemplo): [Canal Rural](https://www.canalrural.com.br/radar/justica-suspende-leilao-de-fazenda-avaliada-em-r-776-milhoes/). MP 1.376/2026: [Agência Brasil](https://agenciabrasil.ebc.com.br/politica/noticia/2026-07/mp-de-renegociacao-de-dividas-rurais-preve-punicoes-contra-fraudes/).
