# Finanças, estrutura, mercados e produtos das instituições financeiras: mapa de fontes públicas

Levantamento feito em **28/11/2026** para o Research Watch. Ele responde a esta pergunta: *de onde tirar, por vias
legais e de preferência por API, os números, a estrutura societária, a presença regional, os produtos e preços e os
fatos relevantes de cada banco, primeiro no Brasil e depois nos grandes bancos globais?* O documento só mapeia e
avalia. Não traz coletor nem cópia de dados.

- **Método.** Li o repositório (README, VISION e `docs/sources/*`) e fiz **chamadas de teste pequenas** com o
  User-Agent do projeto. Na SEC usei `ResearchWatch/0.1`. O maior arquivo baixado foi uma amostra de 15,7 MB do
  IF.data, usada para montar o ranking da §3. Bloqueios foram anotados e nada foi contornado. A coluna "Teste" diz o
  que cada fonte respondeu em 28/11/2026.
- **Versão para máquina.** [`financas-instituicoes.json`](financas-instituicoes.json) traz as 52 fontes com os
  mesmos campos, as chaves de identificação, as instituições-alvo com seus códigos, as 46 chamadas verificadas e as
  fases.
- **Escalas.** *Esforço* é a estimativa em dias até o primeiro coletor útil. *Valor* (alta, média ou baixa) mede o
  quanto a fonte ajuda a responder perguntas sobre bancos.
- **O que não foi refeito.** FEBRABAN e ABBC estão em [`febraban.md`](febraban.md) e
  [`associacoes-bancarias.md`](associacoes-bancarias.md). Ontologias, XBRL como formato e a pilha de armazenamento
  estão em [`leis-ontologias-formatos.md`](leis-ontologias-formatos.md). Fatores externos (agro, clima, macro) e o
  estudo de eventos estão em [`fatores-externos-e-propostas.md`](fatores-externos-e-propostas.md).

---

## 0. O que mais importa (achados)

1. **O Pilar 3 dos bancos brasileiros já existe como API, e quase ninguém sabe.** O catálogo **DASFN** do BCB
   aponta, para cada instituição, URLs JSON com as tabelas padronizadas do Pilar 3: KM1, OV1, CC1, CR1 a CR5, LIQ1,
   LR1, IRRBB, LI1/LIA e mais (60 tabelas). São **247 instituições e 9.944 recursos**, entre elas BB, Bradesco,
   Santander, Caixa, BTG, Itaú Unibanco S.A., Nu, Inter, Sicredi e Sicoob.
   - A KM1 sozinha dá Basileia, CET1, RWA, alavancagem, LCR e NSFR, com o **mesmo código BCBS** usado na Europa.
   - Com isso, ler PDF de GRSAC deixa de ser necessário para os indicadores de capital e liquidez.
   - Teste: a KM1 de 2026-T2 do BTG e a do BB responderam 200.
2. **A API OData do IF.data está quebrada, mas o site serve os mesmos dados em JSON.**
   - Em `olinda…/IFDATA`, `IfDataCadastro` e `IfDataValores` devolvem **500** para qualquer data-base. Só
     `ListaDeRelatorio` responde. (O levantamento de fatores externos anotou o mesmo 500 como "parâmetro a acertar".
     Não é o parâmetro.)
   - O site `www3.bcb.gov.br/ifdata` lê **arquivos JSON públicos**: um índice, um cadastro, um dicionário e os dados
     por data-base. Foi por eles que montei o top 10 da §3.
3. **Há uma quebra de série em 03/2025.** O novo padrão contábil (Cosif 2025, Res. CMN 4.966 e IN BCB 426 a 433)
   mudou os relatórios de ativo e de resultado.
   - O IF.data passou a ter um **índice separado** (`relatorios2025a2030`), com ids de campo novos.
   - Os balancetes usam códigos de conta de 10 dígitos e ganharam a coluna `TAXONOMIA`.
   - Qualquer série longa por banco precisa de uma ponte entre as contas antigas e as novas.
4. **Os balancetes e o ESTBAN saem em lotes trimestrais** (Comunicado 44.132/2025). Jan–mar sai em 31/5, abr–jun em
   31/8, jul–set em 30/11 e out–dez em 31/3. O dado mensal chega de 2 a 5 meses depois.
   - Os arquivos de 06/2026 foram regravados em 23/11/2026.
   - Os de 09/2026 ainda davam 404 em 28/11.
5. **Duas publicações saíram do ar.**
   - O **Relatório de Economia Bancária** foi descontinuado pela Res. BCB 460/2025, e a última edição é a de 2023.
     Concentração e participação de mercado terão de ser calculadas por nós.
   - O **EU-wide Transparency Exercise** da EBA foi descontinuado em jun/2025. Ele dá lugar ao **Pillar 3 Data Hub**
     (P3DH, no portal EDAP), cujo acesso anônimo não consegui confirmar.
6. **A estrutura dos conglomerados não está em uma fonte só.**
   - O IF.data lista só as entidades **autorizadas** de cada conglomerado prudencial (16 no Itaú).
   - A GLEIF dá 20 "filhas finais" ao Itaú, quando o grupo tem centenas de entidades.
   - O QSA da Receita, para **sociedades anônimas**, traz os **administradores, não os acionistas** (64 diretores e
     conselheiros na Itaú Unibanco Holding).
   - A árvore completa sai de **FRE (CVM) + GLEIF + Receita (Sócios das limitadas)**, nessa ordem.
7. **Para releases e fatos relevantes, o caminho legal e estável é a CVM, não o site de RI.**
   - O IPE (2 MB por ano) indexa todo fato relevante, comunicado, **press-release de resultados**, apresentação e
     **relatório de agência de rating**, com o link do PDF no RAD.
   - Os sites de RI do Itaú e do Santander devolvem **403** a robôs.
8. **Os produtos e preços por banco existem, mas com qualidade desigual.** Há as taxas de juros por instituição e
   modalidade e as tarifas (BCB), e as APIs abertas do Open Finance (105 organizações no diretório).
   - O BB publica no Open Finance o consignado com **todas as taxas em 0,000000**.
   - Por isso, Open Finance entra como "declarado", e a taxa efetiva vem do BCB.
9. **Os grandes globais são viáveis pela SEC.** `data.sec.gov` respondeu com User-Agent genérico.
   - Itaú, Bradesco, Santander Brasil, Nu, Inter&Co, XP e 19 dos 29 G-SIBs estão lá, com XBRL (`ifrs-full` ou
     `us-gaap`).
   - `www.sec.gov` exige um User-Agent com contato (403 sem ele).
   - O FFIEC NIC (FR Y-9C) está atrás de CAPTCHA, mas a FDIC tem API aberta.
   - O Stooq passou a exigir JavaScript. O preço oficial e gratuito no Brasil é o **COTAHIST da B3**.

---

## 1. Chaves de identificação (como ligar as fontes)

| Chave | Emissor | Onde aparece | Observação |
|---|---|---|---|
| **CNPJ** (8 dígitos base / 14 completo) | Receita | Todas as bases do BCB, CVM, Receita, GLEIF (`registeredAs`), Open Finance | Chave principal no Brasil. O BCB usa o CNPJ-base, e o do BB é `00000000` |
| **Código IF.data / conglomerado** (`C00xxxxx`) | BCB | IF.data, balancetes (`COD_CONGL`), ranking de reclamações (pelo nome) | O prudencial e o financeiro têm códigos diferentes. No Itaú, `C0080099` é o prudencial e `C0010069` o financeiro |
| **ISPB** | BCB | Pix, SPB | Casa com o CNPJ pela lista de participantes do STR |
| **COMPE** | BCB | Agências, Open Finance | É o número do banco |
| **Código CVM** | CVM | DFP, ITR, FRE, IPE e B3 (`codeCVM`) | |
| **Ticker / ISIN** | B3 e bolsas | COTAHIST, APIs da B3, SEC | |
| **LEI** (ISO 17442) | GLEIF | GLEIF, EBA, ESMA, SEC (em parte) | Chave global. No Brasil, o CNPJ fica em `registeredAs` |
| **CIK** | SEC | EDGAR | |
| **RSSD / CERT** | Fed / FDIC | FDIC, FFIEC | Bancos americanos |

O **cadastro mestre** é a primeira entrega, porque todas as outras dependem dele. Ele junta, para cada instituição
ou entidade, CNPJ, código IF.data (prudencial e financeiro), código CVM, tickers, LEI, CIK e ISPB. Também guarda o
"pai" e a fonte de cada ligação.

---

## 2. Inventário: Brasil

Na coluna "Acesso", **api** é uma consulta parametrizada, **bulk** é o download de um arquivo inteiro e **scrape** é a
leitura de uma página HTML.

### 2.1 Demonstrações e dados prudenciais (BCB)

| Fonte | O que cobre | Instituições / período | Formato · acesso | Frequência | Identificadores | Licença | Extração | Esforço (d) | Valor | Teste |
|---|---|---|---|---|---|---|---|---|---|---|
| **IF.data: arquivos JSON do site** | Resumo (ativo total, crédito, TVM, captações, PL, lucro, Basileia, imobilização, agências e postos), Ativo, Passivo, DRE, Capital, Segmentação S1–S5 e 8 relatórios de crédito (PF/PJ por modalidade e prazo, CNAE, porte, indexador, **região**, nº de clientes). Três visões: prudencial (1009), financeiro (1005) e individual (1006) | Todas as autorizadas. Contábil desde 03/2000, prudencial desde 03/2014, crédito desde 06/2012. Em 06/2026: 1.398 prudenciais/independentes e 1.622 individuais | JSON · bulk. O índice fica em `ifdata/rest/relatorios` (até 12/2024) e em `rest/relatorios2025a2030`; os arquivos em `rest/arquivos?nomeArquivo=ifdata_2025_2030/AAAAMM/...` | Trimestral (60 dias; dez em 90 dias) | Código IF.data, C00xxxxx, CNPJ-base da líder | ODbL | Ler o índice; baixar cadastro, `info` (nomes dos campos) e o `dados_N` indicado; casar o `lid` das colunas do `trel` com o `i` do `dados`. Valores em R$ | 2,5 | **alta** | 200: índice 2025+, cadastro 06/2026 (742 KB), dados 06/2026 (15,7 MB) |
| IF.data: API OData (Olinda) | Mesmo conteúdo | — | JSON · api | — | CodInst | ODbL | Manter teste de saúde semanal; migrar quando voltar | 0,5 | média | `ListaDeRelatorio` 200; `IfDataCadastro` e `IfDataValores` **500** em todas as datas |
| **Balancetes Cosif** (4010/4016 individual, 4040/4046 financeiro, 4060/4066 prudencial) | Saldos de todas as contas até o nível 4. Desde 2025, contas de 10 dígitos e coluna `TAXONOMIA` | Todas as que enviam Cosif; mensal; histórico longo | CSV em ZIP (latin-1, `;`) · bulk: `bcb.gov.br/content/estabilidadefinanceira/cosif/{Bancos,Conglomerados-prudenciais,Sociedades}/AAAAMM….csv.zip` | Mensal, em lotes trimestrais | CNPJ-base, COD_CONGL, conta Cosif | ODbL | ZIP mensal por grupo, filtrado pelos alvos. Dá o detalhe que o IF.data não mostra (provisões, contas de resultado) | 1,5 | **alta** | 06/2026 Bancos 200 (1,55 MB) e Prudencial 200 (1,73 MB; PL 4066 do Itaú = R$ 249,8 bi); 09/2026 404 (sai em 30/11) |
| **Plano de contas Cosif** | Elenco de contas (código, nome, função, atributos) e manual | Vigente e histórico 2024 | CSV em ZIP, PDF · bulk | Quando a norma muda | Conta Cosif | ODbL | Carga única como vocabulário | 0,5 | **alta** | 200 (54 KB) |
| **DASFN: Pilar 3 como API** | KM1, OV1, CC1/CC2/CCA, CR1–CR5, CCR, SEC, MR, IRRBB, LIQ1/LIQ2, LR1/LR2, LI1/LI2/LIA, REM, GSIB1 etc. | 247 instituições, desde 2020; layout v2 a partir de 2025-T4 em alguns emissores | JSON · api. Catálogo `olinda…/DASFN/versao/v1/odata/Recursos`; dados no domínio de cada banco | Trimestral, semestral ou anual por tabela | CNPJ (14), código BCBS, período AAAA-T | Dados abertos por determinação do BCB; o conteúdo é da instituição | Um GET no catálogo (2,5 MB), filtro por alvo e tabela, só o período novo. **Normalizar unidade** (o BB publica em R$ mil e o BTG em R$ milhões) | 1,5 | **alta** | Catálogo 200; KM1 v2 2026-T2 do BTG 200 e do BB 200; o layout v1 do BB nesse período dá 422 |
| SGS | Séries agregadas (juros, crédito, inadimplência, spread) | Sistema | JSON · api | Diária a mensal | Código SGS | ODbL | Lista curada; denominador de participação de mercado | 0,5 | média | 200 (série 432) |
| Relatório de Estabilidade Financeira | Rentabilidade, crédito, capital, liquidez e estresse do SFN, com planilhas | Sistema e segmentos | PDF + XLSX · scrape (página Angular; conteúdo por `api/paginasite/sitebcb/publicacoes/ref`) | Semestral (mai, nov) | Edição | Público | Diff da página; PDF e planilhas da edição nova | 1 | média | API da página 200 (só o título; a lista de edições vem de outro serviço) |
| Relatório de Economia Bancária | Concentração, spread, eficiência | Até 2023 | PDF | **Descontinuado** | Ano | Público | Só histórico | 0 | baixa | Página diz "Publicação descontinuada" (Res. BCB 460/2025) |
| FEBRABAN e ABBC | Agregados do setor (crédito, spread, tecnologia) | Setor | PDF, HTML, RSS | Semanal a anual | Edição | — | Ver os documentos próprios | 0 | média | Ver `febraban.md` e `associacoes-bancarias.md` |

### 2.2 Mercado de capitais (CVM, B3, RI)

| Fonte | O que cobre | Instituições / período | Formato · acesso | Frequência | Identificadores | Licença | Extração | Esforço (d) | Valor | Teste |
|---|---|---|---|---|---|---|---|---|---|---|
| **CVM: cadastro de companhias** | Código CVM, CNPJ, situação, setor, controle, auditor | 21 bancos ativos no setor "Bancos" | CSV · bulk `dados.cvm.gov.br/dados/CIA_ABERTA/CAD/DADOS/cad_cia_aberta.csv` | Diária | CD_CVM, CNPJ | Dados abertos CVM (ODbL, conforme o portal) | Download diário de 1 MB | 0,3 | **alta** | 200 |
| **CVM: DFP e ITR** | Balanço, DRE, DFC, DMPL, DVA (individual e consolidado), linha a linha | Companhias abertas; DFP desde 2010, ITR desde 2011 | CSV em ZIP anual · bulk `…/DOC/{DFP,ITR}/DADOS/…_AAAA.zip` | O ZIP do ano é regravado | CD_CVM, CD_CONTA (plano CVM), VERSAO | Idem | Baixar quando mudar (ETag), filtrar bancos, ficar com a última versão. **Bancos: só as contas de topo**, o detalhe está nas notas (PDF). **Não há XBRL** nos dados abertos da CVM | 1,5 | **alta** | Listagens 200: dfp_2025 12 MB, itr_2026 28 MB (22/11/2026); não baixados |
| **CVM: Formulário de Referência (FRE)** | 50 tabelas, entre elas **posição acionária** (controladores), **participação em sociedades** (controladas e coligadas com CNPJ), grupo econômico e reestruturações, partes relacionadas, administração e remuneração | Companhias abertas, desde 2010 | CSV em ZIP anual · bulk `…/DOC/FRE/DADOS/` + `META/` | Anual, com reapresentações | CNPJ da companhia e da participada | Idem | `participacao_sociedade` + `posicao_acionaria` dão a árvore declarada | 1,5 | **alta** | Metadados 200 (50 tabelas); fre_2026 8 MB |
| **CVM: IPE** (fatos relevantes, comunicados, releases, ratings) | Índice de todos os documentos eventuais, com categoria, tipo, espécie, assunto, data e link do PDF | Todas as companhias abertas | CSV em ZIP anual · bulk `…/DOC/IPE/DADOS/ipe_cia_aberta_AAAA.zip`; PDF no RAD | Quase diária | Codigo_CVM, Protocolo_Entrega | Idem | Diff diário por protocolo, filtro por Codigo_CVM, PDF só dos itens novos | 1,5 | **alta** | 200 (2 MB; 41.625 documentos e 2.255 fatos relevantes em 2026). Fatos relevantes de 2026: BB 11, Bradesco 8, Itaú 8, Santander 6, BTG 3. Download do RAD 200 (PDF) |
| CVM: RAD/ENET | Consulta de todos os documentos e visualização das DFs | Idem | HTML/PDF · scrape | Contínua | Protocolo | Público, sem API | Só pelos links do IPE | 0,5 | média | 200 (PDF) |
| **B3: COTAHIST** | Cotação diária de todos os papéis desde 1986 | Todos | TXT largura fixa em ZIP · bulk `bvmf.bmfbovespa.com.br/InstDados/SerHist/COTAHIST_{AAAAA,DDDMMAAAA}.ZIP` | Diária | Ticker, ISIN | Gratuito; redistribuição segue as regras de market data da B3 | Arquivo diário (≈ 450 KB) filtrado pelos tickers dos bancos e BDRs (ROXO34, INBR32) | 1 | **alta** | HEAD 200: anual 2026 98 MB; diário 26/11 445 KB |
| B3: APIs do site de empresas listadas | Emissores (com código CVM e CNPJ), capital, nº de ações, **proventos** com data "com", subscrições, composição de índices | Listadas | JSON (parâmetro em base64) · api não documentada | Diária | issuingCompany, codeCVM | Uso do site; pode mudar | Semanal por emissor | 1 | média | 200: busca "itau" (8 emissores, inclusive de dívida), dados do ITUB (capital R$ 136,9 bi), carteira do IBOV (76 papéis) |
| Sites de RI | Releases, apresentações, **planilhas de séries**, Pilar 3/GRSAC em PDF, guidance | Listados e grandes não listados | PDF, XLSX, HTML · scrape | Trimestral | URL | Conteúdo do banco; uso interno com link | Diff trimestral; preferir a planilha; PDF só no que faltar | 2 | média | 200 em BB, Bradesco, BTG, Caixa, Nu, Inter, Sicredi e Sicoob. **403 em Itaú e Santander** |

### 2.3 Estrutura dos conglomerados

| Fonte | O que cobre | Formato · acesso | Frequência | Identificadores | Licença | Extração | Esforço (d) | Valor | Teste |
|---|---|---|---|---|---|---|---|---|---|
| **IF.data cadastro individual (1006)** | Cada entidade **autorizada** com o código do seu conglomerado prudencial (`c15`) e financeiro (`c14`) | JSON · bulk | Trimestral | CNPJ-base, C00xxxxx | ODbL | Agrupar por `c15` | 0,5 | **alta** | 200 (1.622 entidades; 16 no Itaú: Itaú Unibanco S.A., Itaucard, Redecard IP, Luizacred, Avenue, Itaú Corretora…) |
| Instituições em funcionamento (Unicad) | Sedes de bancos, cooperativas, sociedades, consórcios; **domínios verificados**; **tomadores de BaaS** | JSON · api OData | Mensal | CNPJ8 | ODbL | Snapshot mensal | 0,5 | **alta** | 200 |
| BcBase | Entidades supervisionadas e cooperativas (classe: singular, central, confederação) | JSON · api | Mensal | CNPJ8/14, código Bacen, Sisbacen | ODbL | Montar Sicredi e Sicoob como sistemas | 0,5 | média | Serviço 200; consulta com `dataBase` **500** |
| **CVM FRE** | Controladas e coligadas declaradas; controladores; reestruturações | CSV · bulk | Anual | CNPJ | ODbL | Ver §2.2 | 1,5 | **alta** | 200 |
| **GLEIF nível 1 e 2** | LEI e relações de consolidação (pai direto e final; filhas) | JSON:API · api; Golden Copy diária | Diária | LEI, CNPJ | CC0 | CNPJ → LEI → `ultimate-children` | 1 | **alta** | Itaú Holding `5493002W2IVG62O3ZJ94`: 8 filhas diretas (inclusive Itaú Chile e Itaú BBA International) e 20 finais; pai direto com exceção "NATURAL_PERSONS" |
| **Receita: CNPJ dados abertos** | Empresas, Estabelecimentos e **Sócios** (QSA) | CSV em ZIP · bulk (WebDAV público do compartilhamento "CNPJ") | Mensal | CNPJ, CNPJ/CPF do sócio (CPF mascarado) | Dados públicos; LGPD para pessoas físicas | DuckDB fora do repositório: sócios PJ do grupo, iterando filhas | 3 | **alta** | PROPFIND 207; 2026-11 (gerado em 16/11): Empresas0 581 MB, Socios0 256 MB, Estabelecimentos0 2,3 GB. A URL antiga dá 404 |
| BrasilAPI / minhareceita.org | Ficha unitária com QSA | JSON · api | Segue a Receita | CNPJ | Projetos abertos, sem SLA | Só para checagem pontual | 0,3 | média | 200; QSA de S.A. = administradores |
| Juntas Comerciais | Atos societários, ficha completa | PDF/certidão · manual | — | NIRE | Pago; CAPTCHA | **Não automatizar**; atas chegam pela CVM (IPE: Assembleia, Reunião da Administração) | 0 | baixa | Não testado |

**Como montar a árvore de um conglomerado (e repetir a parte financeira por entidade):**

1. **Núcleo autorizado.** IF.data 1006, agrupando por `c15` (conglomerado prudencial). Cada entidade tem balancete
   4010 próprio e, se for relevante, Pilar 3 próprio no DASFN. Assim a parte financeira se repete entidade por
   entidade.
2. **Árvore declarada.** CVM FRE (`participacao_sociedade`) da holding e das controladas abertas. Ela traz a
   participação em % e as entidades não financeiras (seguradoras, holdings, empresas de tecnologia).
3. **Exterior.** GLEIF nível 2 (Chile, Colômbia, Reino Unido, Panamá no caso do Itaú) e o 20-F na SEC (a lista
   de subsidiárias significativas fica no Exhibit 8).
4. **O resto.** Receita, `Socios*.zip`: as empresas cujo sócio PJ tem CNPJ-base já na árvore. Pega bem as
   limitadas e mal as S.A. Cada aresta guarda a fonte e a data. Quando duas fontes divergem, vale a mais forte, na
   ordem CVM > BCB > GLEIF > Receita.
5. **Escopo prudencial × contábil.** As tabelas LI1 e LIA do Pilar 3 (DASFN) explicam a diferença entre o
   consolidado contábil e o prudencial. Servem para não comparar perímetros diferentes.

### 2.4 Mercados, geografia e produtos

| Fonte | O que cobre | Formato · acesso | Frequência | Identificadores | Licença | Extração | Esforço (d) | Valor | Teste |
|---|---|---|---|---|---|---|---|---|---|
| **ESTBAN** (doc. 4500) por município e por agência | Verbetes do balancete (crédito por tipo, depósitos à vista, poupança e a prazo…) por banco × município e por agência | CSV em ZIP · bulk `bcb.gov.br/content/estatisticas/estatistica_bancaria_estban/{municipio,agencia}/AAAAMM_ESTBAN[_AG].csv.zip` | Mensal, em lotes trimestrais | CNPJ-base, CODMUN (BCB) + UF | ODbL | Participação por município, UF e região. **Não cobre cooperativas nem bancos sem agência** | 1,5 | **alta** | 06/2026 município 200 (883 KB; 7.951 linhas) e agência 200 (1,4 MB); 09/2026 404. A URL antiga `www4…/estban` dá 404 |
| IF.data: crédito por região | Carteira por região geográfica, modalidade, CNAE e porte, por conglomerado | JSON · bulk | Trimestral | Código IF.data | ODbL | Pegada regional dos bancos digitais (que não estão no ESTBAN) | (no IF.data) | **alta** | 200 |
| **Agências, postos, PAE, correspondentes** | Endereço, CEP, município IBGE e data de início de cada ponto | JSON · api OData `Informes_Agencias`; arquivos no CKAN | Mensal | CNPJ da agência, COMPE, IBGE | ODbL | Snapshot mensal; o diff mostra aberturas e fechamentos | 1 | média | 200 (`Agencias?$top=1`); `$count` 403 |
| Pix: dados abertos | Chaves por participante (ISPB), transações por município, **estatísticas de fraude**, CNAE e porte do recebedor | JSON · api OData | Mensal | ISPB, IBGE | ODbL | Chaves por ISPB como proxy de base ativa | 1 | média | 200 (`ChavesPix` 31/10/2026) |
| **Taxas de juros por IF** | Taxa média e posição no ranking por modalidade e instituição | JSON · api OData `taxaJuros/v2` | Mensal e semanal | cnpj8 | ODbL | Coletor mensal | 0,5 | **alta** | 200 (set/2026: no imobiliário prefixado, Caixa 10,94% a.a. em 1º e Banco XP 14,57% a.a. em 2º) |
| Tarifas por IF | Valor máximo por serviço, PF e PJ | JSON · api OData | Quando muda | CNPJ8, código do serviço | ODbL | Uma chamada por banco e tipo de pessoa | 0,5 | média | 200 (BB PF, ~4 s) |
| **Ranking de reclamações** | Índice, reclamações procedentes e clientes por instituição ou conglomerado | CSV · api por período `www3.bcb.gov.br/rdrweb/rest/ext/ranking` | Trimestral | Nome do conglomerado (o CNPJ vem vazio) | ODbL | Equivalência nome → código IF.data | 0,5 | média | 200 (2026-T2, 28,5 KB) |
| Ranking de ouvidorias | Nota de qualidade da ouvidoria | CSV/JSON · bulk | Semestral | CNPJ | ODbL | Idem | 0,5 | baixa | Pacote no CKAN; não baixado |
| **Open Finance: diretório** | Participantes, marcas, CNPJ e endpoints de cada API | JSON · api `data.directory.openbankingbrasil.org.br/participants` | Contínua | CNPJ, OrganisationId | Público | GET diário; extrair endpoints `opendata-*` e `channels_*` | 0,5 | **alta** | 200 (4,5 MB; 105 organizações) |
| **Open Finance: APIs abertas** | Contas, empréstimos, financiamentos, cartões, cheque especial, antecipação, investimentos, seguros, previdência, câmbio, credenciamento; canais (agências, eletrônicos, telefone, correspondentes, ATMs compartilhados) | JSON paginado · api (sem autenticação) | Contínua | `participant.cnpjNumber`, enums OFB | Público (regulação do Open Finance) | Coletor semanal; validar valores; cruzar com a taxa média do BCB | 2,5 | **alta** | BB empréstimos 200 (**taxas 0,000000**); Nubank contas 200 (rendimento 100% DI; saque em ATM R$ 6,50) |
| DASFN: canais, taxas de cartões, Pix Saque | Taxas de cartão de crédito por período (`/itens/ultimo`), agências, pontos de Pix Saque e Troco | JSON · api | Mensal | CNPJ | Dados abertos das instituições | Ler o catálogo e chamar o último período | 1 | média | Catálogo 200 (93 recursos de taxas, inclusive Caixa, BB, Nu, Itaú e Bradesco) |

**Participação de mercado.** Ela é calculada assim:

- **Nacional:** conglomerado / total do sistema no IF.data, por ativo, crédito, depósitos, PL e lucro.
- **Por modalidade:** IF.data, carteira PF/PJ por modalidade.
- **Regional:** ESTBAN para os bancos com agência e IF.data por região para os digitais.
- **Concentração:** IHH e RC4, calculados por nós a partir dessas bases, já que o REB saiu do ar.

### 2.5 Fatos relevantes: de onde vêm e como classificar

As fontes são três:

- **CVM IPE**, para as companhias abertas brasileiras;
- **SEC 6-K/8-K**, para os bancos com ADR e os americanos;
- **B3**, para os proventos e eventos de capital.

O IPE já traz uma pré-classificação nos campos `Categoria`, `Tipo`, `Espécie` e `Assunto`. No caso do Santander em
2026, o `Assunto` dizia "Sucessão de Diretor Presidente", "Reorganização Societária – Incorporação, Cisão ou Fusão",
"OPA", "OPA – Aumento Relação de Permuta" e "Novo Laudo de Avaliação OPA Voluntária".

Taxonomia proposta: uma classe principal, mais subclasses e a entidade afetada.

| Classe | Exemplos | Sinal no IPE | KPI que pode mexer |
|---|---|---|---|
| Resultados e guidance | Divulgação trimestral, revisão de projeções | `Dados Econômico-Financeiros / Press-release`; fato relevante com "projeções" | Lucro, ROE, custo do crédito |
| M&A e reorganização | Aquisição, venda de participação, incorporação, cisão, **OPA**, fechamento de capital | `Assunto` com "Reorganização", "OPA", "Aquisição"; `Comunicado / Aquisição/Alienação de Participação` | Estrutura, ativo, capital |
| Capital e remuneração | JCP, dividendos, recompra, aumento de capital, dívida subordinada, AT1/Nível 2 | `Aviso aos Acionistas`; `Relatório Proventos`; B3 `cashDividends` | Basileia, payout |
| Governança | Troca de CEO e diretoria, conselho, auditor, comitê de auditoria | `Assunto` "Sucessão…"; `Comunicado / Mudança de Auditor` | — |
| Rating | Elevação ou rebaixamento, perspectiva | `Dados Econômico-Financeiros / Relatório de Agência de Rating` (399 no ano) | Custo de captação |
| Regulação e supervisão | Sanção, autorização, mudança de segmento (S1–S5), exigência adicional de capital | Fato relevante + norma do BCB (cruzar com `regulation.json`) | Capital |
| Jurídico e contingências | Ações relevantes, acordos, provisões | Fato relevante | Lucro |
| Operação e tecnologia | Incidente cibernético, indisponibilidade, fraude relevante | Fato relevante / comunicado | Reputação; tema de fraude |
| Produtos e parcerias | Parceria de distribuição, joint venture, lançamento | Comunicado ao mercado | Crédito, receitas de serviço |

**Método.** Primeiro, regras sobre os campos do IPE, o que é barato e cobre a maioria dos casos. Para os fatos
relevantes com `Tipo` vazio, um LLM lê o texto do PDF e preenche `{classe, subclasse, entidades (com CNPJ), contraparte,
valor, data efetiva, KPI afetado, citação}`. Essa é a mesma triagem com rubrica que o pipeline já usa nas normas do
Bacen.

---

## 3. Instituições-alvo

### 3.1 Brasil: top 10 por ativo total (IF.data, conglomerado prudencial, 06/2026)

Ranking montado a partir dos arquivos do IF.data (`cadastro202606_1009` + `dados202606_1`, gerados em 18/08/2026).
Valores em R$ bilhões. O lucro é o do 1º semestre de 2026. LEI pela GLEIF e CIK pela SEC, todos consultados em 28/11.

| # | Conglomerado | Código IF.data | Seg. | Ativo | PL | Lucro 1S26 | CNPJ líder | CVM | Tickers | LEI | SEC CIK |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Itaú Unibanco | C0080099 | S1 | 2.846,4 | 249,8 | 24,7 | 60.872.504/0001-23 | 19348 | ITUB3/4, ITUB | 5493002W2IVG62O3ZJ94 | 1132597 |
| 2 | Banco do Brasil | C0080329 | S1 | 2.583,6 | 181,8 | 6,6 | 00.000.000/0001-91 | 1023 | BBAS3 | QE0Q0253K88YAGNPE356 | — |
| 3 | Caixa | C0080738 | S1 | 2.386,0 | 118,8 | 6,6 | 00.360.305/0001-04 | — (não listada) | — | 254900EX2KZ57WQ1PL07 | — |
| 4 | Bradesco | C0080075 | S1 | 2.015,2 | 185,2 | 12,1 | 60.746.948/0001-12 | 906 | BBDC3/4, BBD | 549300CTUU1RFXHQJE44 | 1160330 |
| 5 | Santander Brasil | C0080185 | S1 | 1.314,9 | 106,7 | 7,7 | 90.400.888/0001-42 | 20532 | SANB3/4/11, BSBR | 549300D1H731B30TSI43 | 1471055 |
| 6 | BNDES | C0081847 | S2 | 1.058,0 | 180,5 | 11,0 | — | — | — | — | — |
| 7 | BTG Pactual | C0080336 | S1 | 858,4 | 84,3 | 9,5 | 30.306.294/0001-45 | 22616 | BPAC3/5/11 | ZXLTQRYIK6IJH3R0IK66 | — |
| 8 | Nubank (Nu Pagamentos, prudencial) | C0084693 | S2 | 363,3 | 23,3 | 4,1 | 18.236.120/0001-58 | — | NU, ROXO34 | 25490039HH2GPH6TUN09 (Nu Pagamentos) | 1691493 (Nu Holdings) |
| 9 | XP | C0082475 | S2 | 305,3 | 12,5 | 0,4 | — | — | XP | 5493008KDA8NBZRJST80 (XP Inc.) | 1787425 |
| 10 | Safra | C0080109 | S2 | 273,6 | 18,7 | 1,9 | — | — | — | — | — |

**Fora do top 10, mas pedidos no escopo:**

| Instituição | Situação no IF.data | Ativo | Chaves | Observação |
|---|---|---|---|---|
| **Sistema Sicoob** | Banco Sicoob, prudencial C0080879 (S2), mais 276 cooperativas independentes (S3–S5) | Banco: 223,4. Soma bruta de 277 entidades: 729,5 | Banco Sicoob 02.038.232/0001-64; LEI 254900YR7GLPBCLLMT79 | A soma tem **dupla contagem** (depósitos das cooperativas no banco e nas centrais). Para tratar como sistema: classe de cooperativa (BcBase), mais eliminação interfinanceira, mais as DFs combinadas que o sistema publica |
| **Sistema Sicredi** | Banco Sicredi, prudencial C0080745 (S2), mais 105 cooperativas | Banco: 235,3. Soma bruta de 106 entidades: 656,9 | Banco Sicredi 01.181.521/0001-55; LEI 213800I3REPPXE1XZ437 | Mesma ressalva. O Sicredi publica DF combinada do sistema (PDF) |
| **Inter** | C0080996 (S3) | 101,3 | Banco Inter 00.416.968/0001-01; LEI 254900WOPB382XD4D411; Inter&Co CIK 1864163; INTR, INBR32 | Logo abaixo no ranking: Banrisul 172,6, C6 170,6, Citibank 169,1, Votorantim 154,3, Mercado Pago 125,0 |

O ranking muda conforme a régua (ativo, crédito, PL ou clientes), e o Watch deve mostrar a régua usada. Por
carteira de crédito, a Caixa lidera (R$ 1.379 bi), à frente de Itaú (1.235) e BB (1.128).

### 3.2 Global: os 29 G-SIBs de 2026 (FSB, novembro de 2026)

| Bucket (sobrecapital em 2028) | Bancos | Melhor via de dados |
|---|---|---|
| 4 (2,5%) | JPMorgan Chase | SEC 10-K/10-Q + XBRL; FDIC (subsidiária bancária, CERT 628) |
| 3 (2,0%) | Bank of America, **BNP Paribas** (subiu do 2), Citigroup, HSBC, ICBC | SEC (BAC, C, HSBC); BNP: Pilar 3/P3DH e site; ICBC: HKEXnews |
| 2 (1,5%) | Agricultural Bank of China, Bank of China, Barclays, China Construction Bank, Goldman Sachs, Groupe Crédit Agricole, UBS | SEC (Barclays, GS, UBS); demais: Pilar 3/site/HKEXnews |
| 1 (1,0%) | Bank of Communications, BNY, Deutsche Bank, Groupe BPCE, ING, Mizuho, Morgan Stanley, **MUFG** (desceu do 2), Royal Bank of Canada, Santander, Société Générale, Standard Chartered, State Street, Sumitomo Mitsui FG, Toronto-Dominion, Wells Fargo | SEC para 12 deles (RBC e TD por 40-F); BPCE, SocGen, StanChart e BoCom pelo Pilar 3 e pelo site |

CIKs verificados na SEC: JPM 19617, BAC 70858, C 831001, WFC 72971, GS 886982, MS 895421, BNY 1390777, STT 93751,
HSBC 1089113, Barclays 312069, UBS 1610520, Santander 891478, Deutsche 1159508, ING 1039765, MUFG 67088,
SMFG 1022837, Mizuho 1335730, RBC 1000275 e TD 947263. Sem SEC ficam BNP, Crédit Agricole, BPCE, SocGen, Standard
Chartered e os cinco chineses.

---

## 4. Inventário: global

| Fonte | O que cobre | Formato · acesso | Frequência | Identificadores | Licença | Extração | Esforço (d) | Valor | Teste |
|---|---|---|---|---|---|---|---|---|---|
| **SEC EDGAR submissions** | Todos os filings por emissor (10-K, 10-Q, 8-K; 20-F, 6-K; 40-F) | JSON · api `data.sec.gov/submissions/CIK##########.json` | Minutos após o filing | CIK, ticker, accession | Domínio público; ≤ 10 req/s; User-Agent declarado | Polling diário por CIK; 6-K/8-K novos → classificador de fatos | 1 | **alta** | 200 para 26 CIKs (Nu: 171 6-K e 5 20-F nos recentes). `www.sec.gov/files/company_tickers.json` **403** sem contato no User-Agent |
| **SEC XBRL** (companyfacts, companyconcept, frames) | Todos os fatos XBRL por conceito e período | JSON · api | A cada filing | CIK, `taxonomia:conceito`, frame | Domínio público | Mapear conceitos `ifrs-full` e `us-gaap` para o dicionário de KPIs. Estrangeiros: em geral só o anual (20-F) | 1,5 | **alta** | JPM `Assets` 200 (2026-09-30: US$ 5,09 tri); Itaú 200 (336 `ifrs-full` + 339 `us-gaap`); Nu 200 (151 `ifrs-full`); frame CY2025Q4I 200 |
| **FDIC BankFind** | +1.000 variáveis do call report por banco segurado; estrutura (holding RSSD); histórico de fusões; agências (SOD) | JSON/CSV · api `api.fdic.gov/banks/{institutions,financials,history,locations,sod}` | Trimestral | CERT, RSSD | Domínio público | Consulta por CERT com `fields=`. `banks.data.fdic.gov` redireciona (301) | 0,5 | média | 200 (JPMorgan Chase Bank, N.A.: 171 trimestres; ROE 17,64% em 09/2026) |
| FFIEC CDR | Call report completo (MDRM) e UBPR | TXT/XBRL · bulk + REST com token gratuito | Trimestral | IDRSSD | Domínio público | Só se a FDIC não bastar | 1 | baixa | Página de bulk 200; REST 401 sem token |
| FFIEC NIC (FR Y-9C e estrutura) | Consolidado das holdings; relações de controle | CSV/XML · bulk | Trimestral | RSSD | Domínio público | Download manual enquanto houver CAPTCHA; holdings listadas pelo 10-Q | 1 | média | **403 CAPTCHA**; Chicago Fed (histórico até 2021) 200 |
| Fed Large Commercial Banks | Ranking trimestral dos bancos americanos | HTML · scrape leve | Trimestral | RSSD | Domínio público | Snapshot | 0,3 | baixa | 200 |
| BCE SUP e CBD2 | Indicadores **agregados** dos bancos significativos e do sistema da UE | SDMX · api `data-api.ecb.europa.eu` | Trimestral | Chave SDMX | Reuso com citação | Benchmark europeu | 0,5 | média | 200 (SUP: 28.344 séries; CBD2: 66.139) |
| EBA Transparency Exercise | Banco a banco: capital, RWA, NPE, crédito por NACE, soberano | CSV/XLSX · bulk | **Descontinuado** (última edição dez/2025) | LEI | Reuso com citação | Carga única do histórico | 1 | média | Página 200 com aviso de descontinuação; `tr_cre.csv` 123 MB |
| **EBA Pillar 3 Data Hub (EDAP)** | Pilar 3 padronizado de todas as instituições grandes da UE/EEE | Web; exportação a confirmar | Por template | LEI, template EU KM1 | Reuso com citação | Investigar; é o par europeu do DASFN | 2 | **alta** (se abrir) | Página 200; EDAP 302 para seleção de "tenant" |
| Pilar 3 nos sites dos G-SIBs | Templates BCBS em PDF/XLSX | PDF/XLSX · scrape | Trimestral | LEI | Conteúdo do banco | Preferir XLSX; mesmo esquema da KM1 do DASFN | 3 | média | Não testado banco a banco |
| **FSB/BCBS: lista de G-SIBs** | Universo dos bancos globais e buckets; indicadores do BCBS | HTML/PDF/XLSX | Anual | Nome → LEI | Público | Carga anual | 0,2 | **alta** | 200 (lista de 2026) |
| BIS Consolidated Banking Statistics | Exposições internacionais por nacionalidade do banco | SDMX · api | Trimestral | País | Reuso com citação | Contexto | 0,5 | baixa | 200 |
| EDINET (Japão) | Relatórios dos bancos japoneses em XBRL | XBRL · api (chave gratuita) | Diária | Código EDINET | Uso livre com cadastro | Desnecessário: MUFG, SMFG e Mizuho entregam 20-F | 0,5 | baixa | 401 sem chave |
| **Preços: B3 COTAHIST** | Ações e BDRs no Brasil | Ver §2.2 | Diária | Ticker | Ver §2.2 | Preço oficial gratuito | (§2.2) | **alta** | 200 |
| Preços: Yahoo Finance | Global, inclusive `.SA` | JSON · api não oficial | Diária | Ticker Yahoo | **Os termos proíbem uso automatizado** | Só protótipo | 0,3 | baixa | 200 |
| Preços: Stooq | CSV global | CSV | Diária | — | Uso pessoal | Inviável hoje | 0 | baixa | 200, mas com desafio JavaScript e sem CSV |

Para preços fora do Brasil em produção, as opções são um fornecedor licenciado ou o preço de fechamento
informado nos próprios filings e sites. Não testei APIs com chave (Alpha Vantage, Tiingo, Polygon), que têm cotas
gratuitas pequenas.

---

## 5. Entidades e conceitos nos releases: vocabulários e extração

### 5.1 Vocabulários candidatos

| Vocabulário | Para quê | Decisão |
|---|---|---|
| **Templates BCBS do Pilar 3** (KM1, OV1, LR1, LIQ1, NSFR…) | KPIs prudenciais com código internacional. O DASFN usa os mesmos códigos e a EBA também | **Adotar como canônico** para capital e liquidez |
| **Cosif 2025** (plano de contas) e campos do IF.data | Contas e agregados brasileiros (ativo total, carteira, PL, lucro) | **Adotar** para o contábil brasileiro, com ponte 2024 → 2025 |
| Equivalência de modalidades IF.data × SCR (`Equivalencia_Modalidades.xlsx`, link na página do IF.data) | Lista controlada de **produtos de crédito** (consignado, imobiliário, veículos, cartão, rural, capital de giro…) | **Adotar** como vocabulário de produtos de crédito |
| Enums do Open Finance (tipos de conta, empréstimo, cartão, tarifa) | Vocabulário de **produtos e tarifas** | **Adotar** para produtos de varejo |
| IFRS Taxonomy (`ifrs-full`) e US GAAP | Ler o XBRL da SEC e comparar com os globais | **Mapear** os KPIs aos elementos |
| FIBO | Tipos de entidade (banco, cooperativa, holding), controle societário, produtos | **Mapear** cerca de 30 classes, sem importar (ver `leis-ontologias-formatos.md`) |
| MDRM (FFIEC) e EBA DPM | Itens dos relatórios regulatórios dos EUA e da UE | Só se formos além da FDIC e da EBA |

### 5.2 Dicionário de KPIs (v0)

| KPI | Definição usada | Fonte estruturada no Brasil | Pilar 3 | XBRL (aprox.) | Como aparece no release |
|---|---|---|---|---|---|
| Ativo total | Ativo consolidado | IF.data Resumo "Ativo Total" | — | `ifrs-full:Assets`, `us-gaap:Assets` | "ativos totais" |
| Carteira de crédito | Carteira classificada / ampliada | IF.data Resumo e relatórios de crédito | — | `ifrs-full:LoansAndAdvancesToCustomers` (varia) | "carteira ampliada" inclui garantias e títulos privados: **não é igual** à do IF.data |
| Margem financeira (NII) | Receita − despesa de juros | DRE IF.data / balancete (contas 7 e 8) | — | `us-gaap:InterestIncomeExpenseNet`; em IFRS, receita e despesa de juros em separado (bancos usam extensões) | "margem financeira com clientes / com o mercado" |
| Custo do crédito / cost of risk | PDD líquida de recuperações / carteira média | DRE IF.data; balancete | — | `us-gaap:ProvisionForLoanLeaseAndOtherLosses`; IFRS 9 impairment | "custo do crédito", "custo do risco (% da carteira)" |
| Inadimplência (NPL 90) | Atraso > 90 dias / carteira | IF.data, faixas de vencidos por modalidade | CR1 (exposições inadimplidas) | — | "NPL 90", "inadimplência acima de 90 dias"; NPL 15–90 como antecedente |
| Cobertura | PDD / NPL 90 | Derivado | — | — | "índice de cobertura" |
| ROE / ROAE | Lucro anualizado / PL médio | Derivado de IF.data (lucro semestral) ou DFP | — | — | "ROAE recorrente": cuidado com lucro **recorrente × contábil** |
| Índice de eficiência | Despesas não decorrentes de juros / receitas | DRE | — | — | Varia por banco (com ou sem impostos) |
| Basileia, Nível 1, CET1 | Capital / RWA | IF.data "Índice de Basileia"; **KM1 linhas 5–7** | KM1 | — | "índice de capital principal" |
| RWA | Ativos ponderados pelo risco | KM1 linha 4, OV1 | KM1, OV1 | — | — |
| Alavancagem | Nível 1 / exposição total | KM1 linhas 13–14 | KM1, LR1 | — | "razão de alavancagem" |
| LCR, NSFR | Liquidez de curto e de longo prazo | KM1 linhas 15–20 | LIQ1, LIQ2 | — | — |
| Agências e postos | Pontos físicos | IF.data Resumo; API de agências | — | — | — |
| Clientes | Base ativa | IF.data, nº de clientes de crédito; chaves Pix | — | — | "clientes ativos" (cada banco define) |
| Rating | Nota, escala, perspectiva, agência | CVM IPE "Relatório de Agência de Rating" | — | — | Seção de ratings da apresentação |
| Segmentos | Varejo, atacado, PJ, agro, seguros… | Nota de segmentos das DFs (IFRS 8); 20-F | — | Segmentos XBRL na SEC | DRE gerencial por segmento |

O dicionário guarda também os **sinônimos PT/EN** ("margem financeira" = NII, "custo do crédito" = cost of risk,
"inadimplência 90" = NPL 90+) e o **perímetro**: contábil × gerencial × recorrente, prudencial × financeiro ×
contábil. A maior fonte de erro na comparação entre bancos é misturar perímetros.

### 5.3 Extração de releases, apresentações e PDFs

**Ordem de preferência das fontes.**

1. Dado estruturado: DASFN, IF.data, balancetes, CVM DFP/ITR e SEC XBRL.
2. A **planilha de séries históricas** do RI, quando existe.
3. O PDF do release ou da apresentação. Só para o que não existe estruturado: guidance, segmentos gerenciais,
   lucro recorrente, NPS, clientes, comentários da administração.

**Pipeline proposto.** A pilha usa o que o repositório já tem: stdlib, `pdftotext`, LLM pela rota mais barata.

1. **Descoberta.** O diff diário do CVM IPE (`Press-release`, `Apresentações a analistas`, `Fato Relevante`,
   `Relatório de Agência de Rating`) e os 6-K da SEC. Os sites de RI entram só como complemento.
2. **Texto por página.** `pdftotext -layout` para o texto; uma biblioteca de tabelas (pdfplumber ou camelot) só
   nas páginas marcadas como tabela. Apresentação em PDF é tratada como uma página por slide.
3. **Classificação de página.** DRE gerencial, carteira, qualidade do crédito, capital, guidance, segmentos,
   rating. Regras por palavras-chave, com LLM pequeno só na dúvida.
4. **Extração com esquema.** O LLM preenche
   `{kpi (do dicionário), valor, unidade, período, perímetro, segmento, página, citação}`. Ele nunca devolve um
   número sem citação e página.
5. **Normalização.** R$ mil, mi e bi; % a.a. × a.m.; trimestre × acumulado; sinal.
6. **Reconciliação.** O que tem par estruturado é checado:
   - Basileia contra a KM1;
   - PL e lucro contábil contra IF.data e DFP;
   - carteira contra o IF.data (com a ressalva da "carteira ampliada").
   Diferença acima da tolerância (ex.: 1%) vira alerta, não correção.
7. **Grafo.** Cada número vira uma **afirmação** "instituição X, KPI Y, período P, perímetro Z = V (fonte, página)",
   no formato de afirmações previsto no VISION.md. As entidades citadas também entram: segmentos, produtos (pelo
   vocabulário de modalidades e do Open Finance), agências de rating, contrapartes de M&A e executivos (só nome e
   cargo, que já são públicos).

---

## 6. Amostra de chamadas verificadas (28/11/2026)

A lista completa (46 chamadas) está em `verified_calls` no JSON. Abaixo, as que sustentam as conclusões.

| # | Fonte | Chamada | Resultado |
|---|---|---|---|
| 1 | IF.data OData | `GET olinda.bcb.gov.br/olinda/servico/IFDATA/versao/v1/odata/IfDataCadastro(AnoMes=202606)?$format=json` (e variações, 5 datas) | **500** "Erro desconhecido" |
| 2 | IF.data web | `GET www3.bcb.gov.br/ifdata/rest/relatorios2025a2030` | 200, 1,6 MB, datas 202503…202606 |
| 3 | IF.data web | `GET …/ifdata/rest/arquivos?nomeArquivo=ifdata_2025_2030/202606/dados202606_1.json` | 200, 15,7 MB; ativo total do Itaú prudencial R$ 2,846 tri |
| 4 | Balancete prudencial | `GET bcb.gov.br/content/estabilidadefinanceira/cosif/Conglomerados-prudenciais/202606BLOPRUDENCIAL.csv.zip` | 200, 1,7 MB, 85.705 linhas, gerado em 23/11/2026 |
| 5 | ESTBAN | `GET bcb.gov.br/content/estatisticas/estatistica_bancaria_estban/municipio/202606_ESTBAN.csv.zip` | 200, 883 KB; `202609` 404 |
| 6 | DASFN | `GET olinda…/DASFN/versao/v1/odata/Recursos?$top=20000&$format=json` | 200; 10.478 recursos (pilar3 9.944, canais 422, taxas de cartões 93, Pix Saque 19) |
| 7 | Pilar 3 BTG | `GET ri.btgpactual.com/api/dadosabertos/pillar3/km1/v2/2026-2` | 200; `km1_1` (CET1) t = 74.275,8 (R$ mi) |
| 8 | Pilar 3 BB | `GET api.externo.bb.com.br/dadosabertos/v1/relatorios/km1/v2/2026-2` | 200; blocos capital, RWA, índices, alavancagem, LCR, NSFR |
| 9 | Juros por IF | `GET olinda…/taxaJuros/versao/v2/odata/TaxasJurosMensalPorMes?$top=2&$orderby=Mes desc` | 200; set/2026 |
| 10 | Tarifas | `GET olinda…/ListaTarifasPorInstituicaoFinanceira(PessoaFisicaOuJuridica=@P,CNPJ=@C)?@P='F'&@C='00000000'` | 200 |
| 11 | Reclamações | `GET www3.bcb.gov.br/rdrweb/rest/ext/ranking/arquivo?ano=2026&periodicidade=TRIMESTRAL&periodo=2&tipo=Bancos+e+financeiras` | 200, CSV 28,5 KB |
| 12 | CVM IPE | `GET dados.cvm.gov.br/dados/CIA_ABERTA/DOC/IPE/DADOS/ipe_cia_aberta_2026.zip` | 200, 2 MB, 41.625 documentos |
| 13 | CVM RAD | `GET rad.cvm.gov.br/ENET/frmDownloadDocumento.aspx?…numProtocolo=1590267…` | 200, PDF |
| 14 | B3 | `HEAD bvmf.bmfbovespa.com.br/InstDados/SerHist/COTAHIST_D26112026.ZIP` | 200, 445 KB |
| 15 | B3 | `GET sistemaswebb3-listados.b3.com.br/listedCompaniesProxy/CompanyCall/GetListedSupplementCompany/<base64>` | 200; ITUB com proventos |
| 16 | Open Finance | `GET data.directory.openbankingbrasil.org.br/participants` | 200, 105 organizações |
| 17 | Open Finance BB | `GET opendata.api.bb.com.br/open-banking/opendata-loans/v1/personal-loans?page-size=1` | 200, taxas 0,000000 |
| 18 | GLEIF | `GET api.gleif.org/api/v1/lei-records/5493002W2IVG62O3ZJ94/direct-children` | 200, 8 filhas |
| 19 | Receita | `PROPFIND arquivos.receitafederal.gov.br/public.php/webdav/2026-11/` | 207, 37 arquivos |
| 20 | BrasilAPI | `GET brasilapi.com.br/api/cnpj/v1/60872504000123` | 200; QSA = 64 administradores |
| 21 | SEC | `GET data.sec.gov/api/xbrl/companyfacts/CIK0001132597.json` | 200, 968 KB |
| 22 | SEC | `GET www.sec.gov/files/company_tickers.json` | **403** (User-Agent sem contato) |
| 23 | FDIC | `GET api.fdic.gov/banks/financials?filters=CERT:628&…` | 200 |
| 24 | FFIEC NIC | `GET ffiec.gov/npw/FinancialReport/FinancialDataDownload` | **403 CAPTCHA** |
| 25 | EBA | Página do transparency exercise | 200; "discontinued starting from June 2025" |
| 26 | FSB | `GET fsb.org/uploads/P251126.pdf` | 200; 29 G-SIBs |
| 27 | Stooq | `GET stooq.com/q/d/l/?s=jpm.us&i=d` | 200 com desafio JavaScript |
| 28 | RI | Itaú e Santander | **403** |

---

## 7. Viabilidade

| Bloco | Viabilidade | Por quê | Principais riscos |
|---|---|---|---|
| Números prudenciais e contábeis (BR) | **Alta** | IF.data, balancetes e DASFN são abertos (ODbL), completos e por instituição | Quebra de série de 2025; API OData quebrada; atraso de 2 a 5 meses; unidades diferentes entre emissores do DASFN |
| Fatos relevantes e releases (BR) | **Alta** | O CVM IPE é diário, completo e tem link do PDF | Extração de PDF (custo de LLM, erro de número): reconciliar sempre |
| Produtos e preços (BR) | **Alta** para juros e tarifas; **média** para Open Finance | Juros e tarifas vêm do BCB; o Open Finance é declarado pela instituição | Valores zerados ou desatualizados; enums diferentes entre versões |
| Estrutura dos conglomerados | **Média** | Núcleo autorizado e árvore declarada são fáceis; o resto pede a Receita (GB) | QSA de S.A. sem acionistas; GLEIF parcial; volume da Receita; LGPD (não guardar CPF nem nomes de pessoas físicas sócias) |
| Geografia e participação de mercado | **Alta** para bancos com agência; **média** para digitais | ESTBAN e agências são abertos; para digitais, IF.data por região e Pix | ESTBAN sem cooperativas e digitais; equivalência CODMUN ↔ IBGE |
| Sistemas cooperativos (Sicredi, Sicoob) | **Média** | Dados por cooperativa existem | Somar sem eliminar a dupla contagem infla o sistema; usar as DFs combinadas publicadas |
| Bancos globais | **Alta** (EUA e emissores na SEC); **média** (UE e China) | `data.sec.gov` e FDIC abertos | P3DH sem acesso anônimo confirmado; Pilar 3 da UE e da China em PDF; FFIEC NIC com CAPTCHA |
| Preços de ações | **Alta** no Brasil (COTAHIST); **baixa** fora sem licença | — | Termos de uso (B3 para redistribuição; Yahoo proíbe automação) |

**Riscos transversais.**

- **Instabilidade de APIs do BCB.** Houve 500 no IF.data OData e no BcBase. É preciso teste de saúde e caminho
  alternativo (arquivos do site).
- **Bloqueio de robôs.** Itaú e Santander no RI, FFIEC NIC e Stooq. A regra continua a mesma: não contornar.
- **SEC.** O User-Agent com contato precisa ser configurado com um dado que o dono do projeto aprove.
- **Volume.** Receita e COTAHIST anual não entram no git. Ficam em DuckDB ou Parquet fora do repositório, e só o
  derivado pequeno é versionado.
- **Comparabilidade.** Perímetros, recorrente × contábil, carteira "ampliada" × classificada.

---

## 8. Recomendação (fases, com esforço)

O Watch deve passar a ter **instituição** como entidade de primeira classe. Cada instituição ganha uma ficha com
números trimestrais, estrutura, produtos e preços, e fatos. As perguntas que isso destrava:

- "qual o índice de Basileia do BB contra o do Itaú?";
- "quem lidera o crédito imobiliário e a que taxa?";
- "o que o Santander comunicou ao mercado em 2026?";
- "onde o Bradesco fechou agências?".

| Fase | Entrega | Fontes | Dias |
|---|---|---|---|
| **0. Cadastro mestre** | Tabela das instituições-alvo (top 10 BR + Sicredi, Sicoob e Inter + 29 G-SIBs) com CNPJ, código IF.data, CVM, ticker, LEI e CIK; snapshot mensal do Unicad e do cadastro CVM | Instituições em funcionamento, CVM cadastro, GLEIF, SEC, FSB | 1,5 |
| **1. Números do Brasil** | Coletor do IF.data web (Resumo, Capital, DRE, Segmentação, crédito por região e modalidade) com a ponte 2024 → 2025; balancete prudencial mensal; **DASFN Pilar 3** (KM1, OV1, LIQ1, LR1); CVM DFP/ITR (topo); **CVM IPE diário**; dicionário de KPIs v0 | IF.data, balancetes, DASFN, CVM | 5 |
| **2. Produtos, preços e reputação** | Juros e tarifas por banco; Open Finance (diretório + `opendata-*`, semanal) com checagem de qualidade; taxas de cartões; reclamações e ouvidorias | BCB, Open Finance, DASFN | 4 |
| **3. Estrutura** | Grafo do conglomerado: IF.data 1006 → FRE → GLEIF → Receita (DuckDB local), com fonte por aresta; finanças por entidade autorizada (4010 + Pilar 3 próprio) | IF.data, CVM FRE, GLEIF, Receita | 4 |
| **4. Geografia e releases** | ESTBAN e agências (participação regional), Pix por participante; pipeline de releases e apresentações com reconciliação; classificador de fatos relevantes | ESTBAN, agências, Pix, CVM IPE, RI | 6 |
| **5. Bancos globais** | SEC submissions + companyfacts dos G-SIBs na SEC e dos ADRs brasileiros; FDIC; EBA 2025 (carga única) e investigação do P3DH; Pilar 3 por XLSX/PDF dos que não estão na SEC | SEC, FDIC, EBA, sites | 4 |
| **Total** | | | **≈ 24,5 dias** |

**Primeiros passos (esta semana, cerca de 2 dias).**

1. Gerar o cadastro mestre a partir de IF.data 1009, CVM cadastro e GLEIF, e conferir à mão as 13 instituições
   da §3.1.
2. Coletor do **DASFN KM1** para essas 13. Ele é pequeno, estável e dá a resposta mais pedida (capital e liquidez)
   com número oficial.
3. Coletor do **CVM IPE** diário filtrado pelos códigos CVM dos bancos, ligado à triagem por LLM que já existe para
   as normas do Bacen. Isso põe fatos relevantes e releases no digest dos temas bancários.
4. Coletor do IF.data web para a data-base 09/2026 assim que ela sair (prazo: 30/11/2026). Servirá também de teste
   da ponte de série.

**O que não fazer agora:** scraping de RI que bloqueia robôs, Juntas Comerciais, FFIEC NIC (CAPTCHA), preços pelo
Yahoo em produção, carga da Receita inteira sem uma pergunta que precise dela.

---

## 9. Limitações deste levantamento

- **Downloads.** Baixei só amostras: IF.data 06/2026 (cadastro e um arquivo de dados), balancete prudencial
  06/2026, ESTBAN 06/2026 (município), CVM cadastro, IPE 2026, metadados do FRE, o diretório do Open Finance e o
  catálogo do DASFN. Os arquivos ficaram fora do repositório.
- **Números da §3.** São do arquivo `dados202606_1` e não foram reconciliados com os releases. Diferenças de
  perímetro são esperadas (ex.: lucro contábil × recorrente).
- **Sem verificação:**
  - o formato do parâmetro `dataBase` do BcBase;
  - o nome dos ZIPs de balancete de cooperativas e de conglomerados financeiros;
  - o acesso programático ao EDAP/P3DH;
  - os relatórios de Pilar 3 dos G-SIBs um a um;
  - APIs de preço com chave.
- **Somas dos sistemas.** As de Sicredi e Sicoob são brutas (com dupla contagem), servem para ordem de grandeza e
  não para ranking.
- **LEI e CIK.** O LEI da Nu Holdings não foi encontrado pela busca aproximada da GLEIF. O CIK da Inter&Co veio da
  busca de entidades da SEC (`efts.sec.gov`).
