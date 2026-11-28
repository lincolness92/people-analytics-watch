# Leis, ontologias e formatos: mapa e recomendação

Mapeamento feito em **28/11/2026** para três frentes do Research Watch que vão além das normas do Bacen:

1. **Leis e regulação**: leis federais, decretos, MPs, projetos de lei, DOU, CMN, CVM, ANPD, SUSEP e CADE; depois UE, BIS/BCBS, EUA e Reino Unido.
2. **Organização do conhecimento**: ontologias e vocabulários formais aos quais podemos nos ligar, e como desenhar o nosso grafo (entidades, afirmações, evidências).
3. **Formatos, armazenamento e processamento**: PDF, XBRL/XML, séries, HTML e RDF; que pilha usar e quando Rust compensa.

- **Método.** Leitura do repositório (README, VISION, `docs/sources/*`, `src/pawatch/regulation.py`) e **chamadas de teste pequenas** com curl, uma a uma. Não houve download em massa nem scraper versionado, e nenhum arquivo existente foi alterado. A coluna "Teste" diz o que respondeu em 28/11/2026.
- **Versão para máquina.** [`leis-ontologias-formatos.json`](leis-ontologias-formatos.json) traz os mesmos dados e mais as seções `linking` e `phases`.
- **Escalas.** *Esforço* é uma estimativa em dias para o primeiro coletor ou uso útil. *Valor* (alta, média ou baixa) é o valor para um observatório bancário genérico.
- **Mapeamento paralelo.** As finanças das instituições (IF.data, balancetes, DFP/ITR, SEC, Pilar 3 como dado) ficam em `docs/sources/financas-instituicoes.*`. Aqui só entra o que diz respeito ao formato e ao armazenamento.

## 0. O que já existe e o que falta

- **O que já funciona.** `regulation.py` coleta pela API de normativos do BCB, que já inclui as **Resoluções CMN** (515 no índice; a mais recente é a 5.353, de 26/11/2026) e as Resoluções Conjuntas. Faz a triagem por LLM e a ficha (o que exige, a quem, vigência, técnicas). Os marcos internacionais (GAFI, PSR etc.) são curados à mão em `topics/*/regulation.json`.
- **A lacuna principal** é a ligação **lei → norma que a regulamenta**. A função `bcb_text()` já baixa o campo `Referencias`, que traz a base legal de cada norma, mas ele não é guardado. Na Res. CMN 4.893, por exemplo, o campo diz "Lei nº 4.595/1964, arts. 4º, inciso VIII, e 9º.;#Lei nº 4.728/1965, art. 9º.;# … Lei Complementar nº 130/2009…". Hoje as normas têm id interno (`bcb:Resolução BCB:584`) e nenhum identificador padrão.
- **A melhor descoberta deste levantamento** é o **normas.leg.br**. Ele tem uma API pública (não documentada) que devolve, para cada lei federal, **JSON-LD schema.org `Legislation` sob CC BY 4.0**, com a URN LEX, o texto **multivigente por dispositivo**, as alterações, as menções, o processo legislativo e a publicação no DOU. Resolve de uma vez o "Planalto sem API".

---

## 1. Leis e regulação

### 1.1 Brasil

| Fonte | Cobertura | Acesso / API | Formato | Identificadores | Frequência | Licença | Extração | Esforço (d) | Valor | Teste |
|---|---|---|---|---|---|---|---|---|---|---|
| **Normas.leg.br (API pública)** | Legislação federal: leis, leis complementares, MPs, decretos, decretos-lei, emendas constitucionais. Para leis, texto estruturado por dispositivo e multivigente (cada versão de cada artigo, com período de vigência), alterações (legislationAmends), menções a outras normas, processo legislativo de origem, publicação no DOU, apelidos ("LGPD") e temas. Decretos vêm em geral só com metadados. Não cobre normas do BCB/CMN/CVM | GET https://normas.leg.br/api/public/normas?urn=<URN LEX>&tipo_documento=maior-detalhe (sem chave). Aceita URN com ano só (urn:lex:br:federal:lei:1964;4595). Endpoint não documentado: inferido do bundle do site (publicApiUrl "/api/public/") | JSON-LD (schema.org Legislation, LegislationObject; prefixo lexsdo-br); binários do texto em /api/binario/<uuid>/texto | URN LEX (legislationIdentifier), @id normas.leg.br, sameAs LexML e SIGEN; dispositivos com sufixo !art1_cpt_inc2; versões com @AAAA-MM-DD | contínua (campo dateModified por norma; LGPD: 2026-02-25) | CC BY 4.0 (license e sdLicense no próprio JSON) | Lista curada de URNs (leis do SFN) + descoberta de normas novas pela lista do Senado; guardar metadados, alterações e menções; texto por dispositivo só das leis curadas; diff por dateModified | 2 | alta | 2026-11-28: 200 para LGPD (780 KB, texto multivigente), LC 105, Decreto 10.046 (só metadados) e MP 1.202; URN do CMN devolve só eco da URN |
| **Senado Federal: Dados Abertos (legislação SIGEN e processos)** | (a) Legislação federal (SIGEN): lista por tipo/número/ano, ementa, apelidos, data de assinatura. (b) Processos legislativos (PLs, PLPs, PECs, MPs, vetos) com situação, autoria, tramitação e documento | GET https://legis.senado.leg.br/dadosabertos/legislacao/lista?tipo=LEI&ano=AAAA[&numero=N]; GET /dadosabertos/processo?termo=...&sigla=PL (substitui /materia/pesquisa/lista, deprecado desde 2025-03-18 e com desativação prevista para 2026-02-01, mas que ainda respondeu) | JSON ou XML (Accept) | id SIGEN, código 'LEI-13709-2018-08-14' (converte direto em URN LEX), id de processo/matéria | diária | dados abertos do Senado, reuso livre com citação da fonte (sem licença formal no payload) | Descoberta: listar leis/LCs/MPs/decretos do ano e comparar com o já visto (233 leis em 2026 até 26/11). PLs: busca por termos do tema + triagem LLM igual à das normas do Bacen | 2 | alta | 2026-11-28: legislacao/lista 200 (Lei 13.709 e Lei 4.595 com data e apelidos); processo 200 (PL 650/2022, fraude bancária) |
| **Câmara dos Deputados: Dados Abertos API v2** | Proposições (PL, PLP, PEC, MPV, REQ...), tramitações, autores, relatorias, temas, votações, órgãos; arquivos anuais em massa | REST https://dadosabertos.camara.leg.br/api/v2/proposicoes?keywords=&siglaTipo=&codTema=&dataApresentacaoInicio=; /proposicoes/{id}/tramitacoes; arquivos /arquivos/proposicoes/{json,csv,xlsx,xml}/proposicoes-AAAA.json | JSON, XML, CSV, XLSX | id da proposição; sigla+número+ano (PL 5895/2026); URI da API | diária | dados abertos (uso livre com citação) | Arquivo anual (1 download por ano) + filtro local por ementa/temas; API só para tramitação dos PLs triados. A busca por keywords da API é imprecisa (casa a indexação, não a ementa) | 2 | média | 2026-11-28: 200; keywords=fraude devolveu PLs sem relação (busca imprecisa); arquivo anual 2026 respondeu 206 ao Range |
| **LexML Brasil (portal, resolvedor de URN, SRU e ferramentas)** | Catálogo federado de legislação (federal, estadual, municipal), jurisprudência, proposições e doutrina; especificação da URN LEX (Partes 2 e 6); vocabulários controlados; lexml-linker (reconhece remissões em texto e devolve URNs); lexml-parser-projeto-lei | Resolvedor https://www.lexml.gov.br/urn/<URN> (HTML). SRU https://www.lexml.gov.br/busca/SRU (bloqueado por 'Verificação de segurança'). GitHub github.com/lexml: lexml-linker (Haskell, GPL-2.0, imagem Docker lexmlbr/lexml-linker), lexml-vocabulary (CSV), lexml-xml-schemas | HTML, XML (LexML), CSV (vocabulários) | URN LEX: urn:lex:br:<autoridade>:<tipo>:<data>;<número>[!dispositivo][@versão] | contínua (repositórios ativos em nov/2026) | ferramentas GPL-2.0/GPL-3.0; vocabulários sem licença declarada; conteúdo das normas é domínio público (Lei 9.610, art. 8º, IV) | Não usar o SRU. Usar a URN como identificador, os vocabulários (autoridade.csv, 600 linhas) para montar URNs, e o lexml-linker (em container, fora do pipeline principal) para extrair remissões de normas do BCB/CVM e de relatórios | 2 | alta | 2026-11-28: resolvedor 200 (Lei 4.595) e depois 503; SRU devolve página anti-robô; repositórios lexml-linker e lexml-vocabulary lidos no GitHub |
| **Planalto (Casa Civil): legislação compilada** | Texto compilado oficial de leis, decretos, MPs e códigos, com marcação de redação revogada/alterada | HTML estático por norma (https://www.planalto.gov.br/ccivil_03/leis/l4595.htm); sem API nem feed | HTML legado (FrontPage, windows-1252) | só a URL | contínua, sem sinal de atualização | domínio público (texto normativo) | Só como link de leitura e fallback de texto; normas.leg.br já traz o texto multivigente estruturado | 0,5 | baixa | 2026-11-28: 200 (Lei 4.595, 210 KB) |
| **Diário Oficial da União (Imprensa Nacional): INLABS e site in.gov.br** | Tudo o que é publicado: leis, decretos, MPs, resoluções do CMN/BCB/CVM/ANPD/SUSEP, portarias, atos de pessoal e extratos (muito ruído) | INLABS: download diário por seção (DO1, DO2, DO3, extras) com cadastro gratuito (login e senha). Busca e leitura no in.gov.br. Ferramenta de referência: Ro-DOU (gestaogovbr/Ro-dou), que usa o INLABS | XML por matéria (com metadados de órgão e tipo de ato) e PDF | id da matéria, data, seção, página; sem URN | diária (dias úteis + extras) | publicação oficial; reuso livre | Só para o que não sai por API: filtrar o XML do DO1 por órgão (Ministério da Fazenda/CMN, BCB, CVM, ANPD, SUSEP, CADE) e por tipo de ato. Login guardado como secret | 4 | média | 2026-11-28: INLABS em 'Manutenção Programada'; in.gov.br/leiturajornal e /consulta devolveram 404 (instável; reverificar) |
| **CMN: resoluções (via API de normativos do BCB)** | Resoluções CMN (e Resoluções Conjuntas), com assunto, texto, revogação, normas vinculadas e base legal | A mesma API já usada em src/pawatch/regulation.py; TipodoNormativoOWSCHCS:"Resolução CMN" | JSON + HTML do texto | tipo + número (id interno bcb:Resolução CMN:5353); proposta: URN no padrão LEX | diária | domínio público (texto normativo) | Já coberto: basta manter 'Resolução CMN' em types nos topics/*/regulation.json | 0 | alta | 2026-11-28: 515 Resoluções CMN no índice; a mais recente é a 5.353, de 26/11/2026 |
| **BCB/CMN: base legal das normas (campo Referencias)** | Para cada norma do BCB/CMN, as leis que a fundamentam, com artigos (ex.: 'Lei nº 4.595/1964, arts. 4º, inciso VIII, e 9º'), além das normas vinculadas (NormasVinculadas) e revogadas | Campo Referencias do endpoint exibenormativo (já baixado por bcb_text(), mas hoje não guardado) | texto semiestruturado separado por ';#' | tipo + número/ano → URN LEX (data resolvida pelo Senado ou pelo normas.leg.br, que aceita URN só com ano) | junto com a norma | domínio público | Regex sobre 'Lei[ Complementar] nº N/AAAA, art. X' + resolução da URN; guardar legal_basis[] em data/<tema>/regulation.json. É a ponte lei → norma que regulamenta | 1,5 | alta | 2026-11-28: Res. CMN 4.893 traz base legal em 5 leis e 12 normas vinculadas |
| **CVM: resoluções, instruções, pareceres e ofícios-circulares** | Resoluções CVM (desde 2020; substituíram as Instruções), Pareceres de Orientação, Deliberações, Ofícios-Circulares das superintendências (SEP, SIN, SMI, SNC), Notas Explicativas; planilha 'Estoque Regulatório' com as normas vigentes por grupo temático | Páginas HTML com filtro por tags (44 categorias) em conteudo.cvm.gov.br/legislacao; PDF por norma; XLSX https://conteudo.cvm.gov.br/legislacao/resolucoes/anexos/Estoque_Regulatorio_CVM.xlsx. O RSS antigo devolve 410. dados.cvm.gov.br (CKAN, ODbL) tem dados de companhias e fundos, não normas | HTML, PDF, XLSX | 'Resolução CVM 50, de 31 de agosto de 2021' (tipo + número + data); proposta: URN LEX com autoridade ministerio.fazenda;comissao.valores.mobiliarios (vocabulário LexML) | semanal a mensal | normas: domínio público; dados abertos: ODbL | Diff semanal da planilha de estoque e da página de resoluções (HEAD/ETag), texto do PDF só das normas triadas; ofícios-circulares por diff de listagem | 3 | média | 2026-11-28: página de resoluções 200; estoque XLSX 200 (60 KB, ~90 normas por tema); CKAN 200 (DFP com licença ODbL); RSS 410 |
| **ANPD: resoluções CD/ANPD, guias e enunciados** | Regulamentos da LGPD (incidentes, dosimetria, transferência internacional, encarregado, agentes de pequeno porte), guias orientativos, consultas públicas, sandbox de IA | Páginas gov.br (Plone) em /anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd; texto oficial no DOU | HTML, PDF | 'Resolução CD/ANPD nº 15/2024' | mensal ou menos | domínio público (normas); conteúdo gov.br com reuso livre | Diff da página de regulamentações e da de guias (poucas dezenas de itens); triagem LLM igual à do Bacen | 1,5 | média | 2026-11-28: página de regulamentações 200 (329 KB) |
| **SUSEP / CNSP: circulares e resoluções** | Normas de seguros, previdência aberta, capitalização, open insurance | BNPortal (www2.susep.gov.br/safe/bnportal), aplicação Angular; a API interna não foi mapeada | HTML (SPA), PDF | 'Circular SUSEP nº 666/2022', 'Resolução CNSP nº 416/2021' | mensal | domínio público (normas) | Mapear a API interna do BNPortal com o navegador antes de decidir; alternativa: DOU filtrado por SUSEP/CNSP | 3 | baixa | 2026-11-28: BNPortal 200, mas só a casca da SPA |
| **CADE: atos de concentração, guias e jurisprudência** | Atos de concentração entre instituições financeiras, inquéritos (ex.: arranjos de pagamento, credenciamento), guias, memorando com o BCB (Lei 4.595 × Lei 12.529) | SEI (pesquisa pública), site gov.br, conjuntos em dados.gov.br | HTML, PDF, CSV | número SEI do processo | semanal | dados abertos / domínio público | Adiar. Se entrar, só a lista de atos de concentração com partes que sejam instituições autorizadas (cruzando CNPJ com o cadastro do BCB) | 3 | baixa | não testado |


### 1.2 Internacional

| Fonte | Cobertura | Acesso / API | Formato | Identificadores | Frequência | Licença | Extração | Esforço (d) | Valor | Teste |
|---|---|---|---|---|---|---|---|---|---|---|
| **EUR-Lex / CELLAR (Serviço das Publicações da UE)** | Todo o direito da UE: regulamentos, diretivas, atos delegados e de execução (DORA, AI Act, PSD2/PSR, CRR/CRD, AMLR, GDPR, MiCA), jurisprudência do TJUE, trabalhos preparatórios, consolidações | SPARQL https://publications.europa.eu/webapi/rdf/sparql (sem chave; ontologia CDM); REST com negociação de conteúdo nas URIs do CELLAR e do ELI (https://eur-lex.europa.eu/eli/reg/2022/2554/oj); webservice SOAP do EUR-Lex (cadastro); RSS de buscas salvas | RDF (CDM), Formex XML, XHTML, PDF | CELEX (32022R2554), ELI, URI CELLAR (UUID), descritores EuroVoc | diária | reuso livre com citação (Decisão 2011/833/UE); metadados e vocabulários abertos | Lista curada de CELEX por tema + consulta SPARQL semanal de atos novos que alteram/citam os curados (cdm:resource_legal_amends...) ou com descritores EuroVoc de bancos/pagamentos; texto XHTML só dos curados | 3 | alta | 2026-11-28: SPARQL 200 para CELEX 32022R2554 (a 1ª consulta estourou 40 s; usar timeout longo); ELI do DORA 200 |
| **EBA: Single Rulebook interativo, Q&A, guidelines e RTS** | Normas técnicas (RTS/ITS) e orientações sobre risco, fraude em pagamentos (relatórios de fraude PSD2), TIC, AML, perguntas e respostas | Páginas HTML e PDF; o Q&A tem busca web; sem API conhecida | HTML, PDF, XLSX | EBA/GL/AAAA/NN; id de Q&A; RTS publicados também com CELEX | semanal | reuso com citação | RTS/ITS chegam pelo EUR-Lex (CELEX); guidelines e Q&A por diff de listagem | 2 | média | não testado nesta rodada |
| **BIS / BCBS: Basel Framework e publicações do Comitê de Basileia** | Basel Framework consolidado (capital, liquidez, alavancagem, supervisão, disclosure/Pilar 3, cripto), consultas, princípios (riscos operacionais, resiliência, IA/ML), avaliações RCAP | Basel Framework em https://www.bis.org/basel_framework/ (HTML com capítulos estáveis e versões por data de vigência); RSS de releases https://www.bis.org/doclist/all_pressrels.rss (traz itens do BCBS); a listagem de publicações do BCBS devolve 403 a curl | HTML, PDF | código de capítulo/parágrafo do Basel Framework (CRE20.4, OPE25, DIS20), número de publicação BCBS (dNNN) | semanal | © BIS: trechos curtos podem ser reproduzidos com citação | Mapa curado capítulo → norma BCB que implementa (ex.: DIS/Pilar 3 → Resolução BCB 54/2020; capital (CAP/RBC) → Res. CMN 4.955 e 4.958); releases pelo RSS filtrando 'Basel Committee' | 2 | alta | 2026-11-28: Basel Framework 200; RSS de releases 200 (itens do BCBS de nov/2026); /bcbs/publications 403 |
| **FSB, GAFI/FATF, CPMI, IOSCO** | Recomendações e relatórios (fraude cibernética, pagamentos transfronteiriços, IA no setor financeiro, PLD/CFT) | Páginas e RSS (o FATF já é marco curado nos temas) | HTML, PDF | título + data | mensal | reuso com citação | Manter como 'landmarks' curados em topics/*/regulation.json; RSS onde houver | 1 | média | parcial (FATF já em uso) |
| **EUA: Federal Register API** | Regras finais, propostas, avisos e atos presidenciais diários de todas as agências (Fed, OCC, FDIC, CFPB, FinCEN, SEC) | REST sem chave: https://www.federalregister.gov/api/v1/documents.json?conditions[term]=&conditions[agencies][]=federal-reserve-system&conditions[type][]=RULE | JSON, CSV; texto em XML/HTML/PDF | document_number (2026-12345), citação FR (91 FR 12345), RIN, docket, cfr_references (título/parte) | diária (dias úteis) | domínio público | Consulta diária por agências bancárias + termos do tema; cfr_references liga a regra à parte do eCFR alterada | 1,5 | média | 2026-11-28: 200; 14 documentos do Fed com 'artificial intelligence' |
| **EUA: eCFR API (Code of Federal Regulations)** | Texto consolidado e vigente do CFR com histórico ponto no tempo; Título 12 (Banks and Banking) e Título 31 (FinCEN, BSA) | REST sem chave: https://www.ecfr.gov/api/versioner/v1/titles.json, /versions/title-12.json, /full/{data}/title-12.xml?part=1033 | JSON, XML | título/parte/seção (12 CFR 1033.201) | diária | domínio público | Só as partes ligadas por cfr_references do Federal Register; guardar versões por data | 1,5 | baixa | 2026-11-28: titles.json 200 (atualizado até 2026-11-25) |
| **EUA: Congress.gov API** | Projetos de lei, leis públicas, tramitação | REST com chave gratuita do api.data.gov | JSON, XML | congresso + tipo + número (119 HR 1234); Public Law | diária | domínio público | Adiar; leis promulgadas aparecem no Federal Register/eCFR | 1 | baixa | não testado (exige chave) |
| **Reino Unido: legislation.gov.uk API** | Leis e statutory instruments consolidados ponto no tempo (FSMA 2000, Payment Services Regulations 2017, Money Laundering Regulations 2017) | Toda URL aceita /data.xml, /data.akn, /data.rdf, /data.feed (Atom de novidades em /new/data.feed) | XML (CLML), Akoma Ntoso, RDF, Atom, PDF | URI /ukpga/2000/8, /uksi/2017/752 (no estilo ELI) | diária | Open Government Licence v3.0 | Lista curada de atos + Atom de novidades filtrado por assunto; o WAF precisa ser contornado legitimamente (pedido de liberação ou outro IP) | 2 | média | 2026-11-28: HTTP 202 com 'x-amzn-waf-action: challenge' (AWS WAF) para data.xml e data.feed: bloqueado daqui |
| **Reino Unido: FCA Handbook e PRA Rulebook** | Regras de conduta (Consumer Duty, SYSC) e prudenciais; policy statements e consultas | Sites HTML; publicações com RSS | HTML, PDF | módulo + regra (SYSC 6.1.1R), PS/CP AA/NN | semanal | reuso com citação | Só policy statements e consultas por RSS, triados | 1,5 | baixa | não testado nesta rodada |


### 1.3 Identificadores

| Esquema | Exemplo | Onde se usa | Como tratamos |
|---|---|---|---|
| **URN LEX** (LexML) | `urn:lex:br:federal:lei:2018-08-14;13709`, dispositivo `…;13709!art7_cpt_inc10`, versão `…@2019-07-08` | normas.leg.br, LexML, Senado | **id canônico** das normas brasileiras |
| URN LEX "própria" para infralegais | `urn:lex:br:banco.central:resolucao:2026-08-07;584` | ainda não publicada por ninguém (o normas.leg.br não cobre BCB/CMN) | geramos no padrão LexML; a autoridade `banco.central` já está no vocabulário; o id atual vira alias |
| **CELEX** | `32022R2554` (DORA) | EUR-Lex, CELLAR | id externo das normas da UE |
| **ELI** | `https://eur-lex.europa.eu/eli/reg/2022/2554/oj`; UK `/ukpga/2000/8` | UE, Reino Unido, vários países | `sameAs` e vocabulário do export (ver §2) |
| Citação FR / CFR | `91 FR 12345`; `12 CFR 1033.201` | EUA | id externo + ligação regra → parte |
| Basel Framework | `CRE20.4`, `DIS20`, `OPE25` | BIS | id do padrão internacional |

### 1.4 Como ligar uma lei às normas que a regulamentam e aos temas bancários

1. **Lei → norma (Brasil).** O campo `Referencias` das normas BCB/CMN dá a base legal com artigo. Uma regex simples ("Lei[ Complementar] nº N/AAAA, art. X") cobre a maioria dos casos; o resto vai para o **lexml-linker**, que reconhece remissões em texto livre e devolve URNs. A URN é completada com a data pela lista do Senado, ou passada só com o ano ao normas.leg.br, que aceita `urn:lex:br:federal:lei:1964;4595`. Para CVM e ANPD, a base legal está no preâmbulo ("no uso da atribuição que lhe confere o art. X da Lei Y"), e o tratamento é o mesmo.
2. **Lei → lei.** O normas.leg.br já traz `legislationAmends` (quem esta lei altera), `@reverse.legislationApplies` (decretos que a regulamentam) e `mentions`.
3. **Norma → padrão internacional.** Um mapa curado do capítulo do Basel Framework para a norma do BCB que o implementa (ex.: DIS/Pilar 3 → Resolução BCB 54/2020) e da recomendação do GAFI para a Lei 9.613 e a Circular 3.978. São dezenas de linhas e mudam pouco.
4. **UE e EUA.** No EUR-Lex, `cdm:based_on` e as relações de alteração do CELLAR; no Federal Register, `cfr_references`; no eCFR, a seção "Authority".
5. **Temas.** A triagem LLM continua atribuindo tema e técnicas, mas aponta para **conceitos do tesauro SKOS** (§2) em vez de texto livre. A lei herda os temas das normas que a regulamentam: a LC 105 ganha "sigilo bancário" e "compartilhamento de dados" porque as normas que se apoiam nela tratam disso. Na página da lei, a pergunta "o que a regulação diz sobre X" passa a ter um caminho no grafo: **lei → normas → exigências → técnicas**.

---

## 2. Organização do conhecimento

### 2.1 Inventário de ontologias e vocabulários

Decisões possíveis: **adotar** (usar os ids e o vocabulário como estão), **mapear** (manter nosso conceito e ligá-lo com `exactMatch`/`closeMatch`), **referenciar** (só citar onde ajuda) ou **evitar**.

| Vocabulário | Domínio | Formatos e ferramentas | Maturidade | Licença | Encaixe | Decisão | Como | Esforço (d) | Valor |
|---|---|---|---|---|---|---|---|---|---|
| **FIBO (Financial Industry Business Ontology)** | finanças: entidades, papéis, produtos, contratos, regulação | OWL 2 em RDF/XML, Turtle, JSON-LD; variantes SKOS e 'production' vs 'development'. Protégé, onto-viewer (spec.edmcouncil.org/fibo), rdflib/pyoxigraph | alta; releases trimestrais (master_2026Q3 em 20/10/2026) | MIT | Bom para dar nome padrão aos tipos de entidade e produto (banco, regulador, cooperativa, conglomerado, empréstimo, cartão). Grande demais para importar: milhares de classes e axiomas OWL que não vamos raciocinar | **mapear** | ~30 classes nossas com skos:exactMatch/closeMatch para IRIs da FIBO (fibo-fbc-fct-fse:Bank, fibo-be-le-lp:LegalEntity, fibo-fnd-law-jur:Jurisdiction...). Sem importar a ontologia | 2 | média |
| **ELI (European Legislation Identifier) — ontologia e padrão de URI** | metadados de legislação (obra, expressão, manifestação; vigência; alterações; base legal) | OWL, RDFa, JSON-LD. EUR-Lex/CELLAR, legislation.gov.uk, vários Estados-membros | alta (desde 2012; 'ELI-DL' para projetos de lei) | aberta (reuso UE) | Ótimo para descrever leis e normas de qualquer país: eli:based_on (base legal), eli:changes, eli:cites, eli:in_force, eli:date_document. O schema.org Legislation, usado pelo normas.leg.br, saiu do ELI | **mapear** | Nosso modelo de 'norma' usa os campos do ELI; o export JSON-LD emite eli:* e schema:Legislation; identificadores nativos (URN LEX, CELEX) ficam como eli:id_local/sameAs | 1 | alta |
| **Akoma Ntoso (OASIS LegalDocML 1.0)** | estrutura XML de textos legislativos e judiciais | XML Schema. Editores (LIME, Bungeni), exports do legislation.gov.uk (/data.akn); LexML XML é parecido | alta como padrão (2018), adoção desigual | aberta (OASIS) | Útil para ler textos estruturados de terceiros; não precisamos produzir texto legal | **referenciar** | Consumir quando a fonte oferecer (UK), sem adotar como formato interno | 0 | baixa |
| **LKIF Core / LegalRuleML** | ontologia jurídica (normas, papéis, ações) / regras jurídicas executáveis | OWL / XML. pouca; LKIF sem manutenção real e sem licença declarada no repositório | baixa (acadêmica) | não declarada (LKIF) | Excessivo: modelam deôntica e raciocínio jurídico, que não é o nosso problema | **evitar** | — | 0 | baixa |
| **URN LEX e vocabulários LexML** | identificação de normas brasileiras (autoridade, tipo, data, número, dispositivo, versão) | especificação (PDF, Partes 2 e 6) + CSV (autoridade, localidade, tipoDocumento, evento, lingua, tipoConteudo). lexml-linker (remissões → URN), lexml-urn-formatter, resolvedor web, normas.leg.br | alta (padrão de fato no Brasil, usado pelo normas.leg.br) | vocabulários sem licença declarada; ferramentas GPL | É o identificador natural para leis e decretos. Para normas do BCB/CMN/CVM não há URN publicada, mas o padrão comporta (autoridade banco.central já está no vocabulário) | **adotar** | id canônico das normas BR = URN LEX; para BCB/CMN/CVM, gerar URN no mesmo padrão (urn:lex:br:banco.central:resolucao:2026-08-07;584) e guardar o id atual como alias | 1 | alta |
| **schema.org** | vocabulário geral (Legislation, ScholarlyArticle, Organization, BankOrCreditUnion, FinancialProduct, Claim, Dataset, SoftwareSourceCode, DefinedTerm) | JSON-LD, RDFa, Microdata. universal; validadores; LLMs conhecem bem | alta | CC BY-SA 3.0 | Ótimo para publicar (site, API, MCP): é o que buscadores e agentes entendem, e o normas.leg.br já usa | **adotar** | Cada página/entidade publicada ganha JSON-LD schema.org; os campos específicos vão em namespace próprio | 1,5 | alta |
| **SKOS (W3C)** | tesauros e taxonomias (conceito, rótulos, broader/narrower, related, mapeamentos) | RDF; JSON-LD. Skosmos, SKOS Play, rdflib; validação com qSKOS/SHACL | alta (Recomendação W3C 2009) | W3C | Exatamente o que precisamos para o tesauro próprio de temas, técnicas, métodos e riscos | **adotar** | Tesauro em JSON versionado no git (prefLabel pt/en, altLabel, broader, related, exactMatch) exportado para Turtle/JSON-LD | 2 | alta |
| **EuroVoc** | tesauro multidisciplinar da UE (finanças, direito, tecnologia), 24+ línguas incluindo português | SKOS-XL RDF, XML, CSV. Vocbench; descritores usados no CELLAR | alta | CC BY 4.0 | Bom para ligar normas (UE e nossas) a áreas de política; rótulos em pt-PT | **mapear** | exactMatch dos nossos conceitos de topo para descritores EuroVoc; usar os descritores do CELLAR para filtrar atos novos | 1 | média |
| **STW Thesaurus for Economics (ZBW) e JEL** | economia e finanças (pesquisa) | SKOS (STW); lista de códigos (JEL). SPARQL do ZBW; JEL usado por revistas | alta | STW: CC BY 4.0 (verificar); JEL: uso livre | Útil para classificar papers de economia bancária; o OpenAlex já dá tópicos | **mapear (opcional)** | Só se o tesauro próprio precisar de âncora acadêmica para temas de economia | 0,5 | baixa |
| **Wikidata** | hub geral de entidades (organizações, pessoas, leis, conceitos) | RDF, JSON, SPARQL. query.wikidata.org, dumps, OpenRefine | alta como infraestrutura; cobertura desigual | CC0 | Bom como ponte de sameAs (QID) e para rótulos multilíngues; fraco como fonte primária no Brasil: só 4 itens 'banco' têm CNPJ e nenhum deles tem LEI | **mapear** | Guardar QID como sameAs quando existir; nunca depender dele para listar bancos ou leis | 0,5 | média |
| **GLEIF LEI (Level 1 e Level 2)** | identificação de pessoas jurídicas e relações de controle (pai direto e final) | JSON:API (REST), arquivos Golden Copy diários (CSV/XML/JSON), mapeamentos LEI↔BIC, ISIN, OpenCorporates. api.gleif.org sem chave | alta (padrão ISO 17442) | CC0 | Ótimo para a espinha de entidades do conglomerado e para bancos estrangeiros; no Brasil, completar com CNPJ e o cadastro de conglomerados do BCB (cobertura LEI incompleta para controladas) | **adotar** | LEI como id externo de organização; relações direct-parent/ultimate-parent como arestas subsidiaria_de, com data | 1,5 | alta |
| **Cadastros do BCB (instituições autorizadas, conglomerados prudenciais, segmentos S1–S5)** | entidades supervisionadas brasileiras | OData (Olinda/IF.data), CSV. APIs Olinda | alta | dados abertos do BCB | É a fonte de verdade de quem é banco no Brasil e a que conglomerado pertence; a chave é o CNPJ base (8 dígitos) | **adotar** | Detalhado no mapeamento paralelo docs/sources/financas-instituicoes.*; aqui só como dono do id de organização BR | 0 | alta |
| **ISO 20022 (modelo de negócio e mensagens)** | pagamentos, cartões, valores mobiliários, câmbio: conceitos de negócio e mensagens (pacs.008, pain.001, camt.053) | e-Repository em EMF/XMI, XSD por mensagem, Excel. Editor ISO 20022, geradores de XSD; Pix e o SPB usam mensagens ISO 20022 | alta | uso livre do repositório (cadastro no site) | Útil como vocabulário de pagamentos (o que é um 'creditor agent', um 'return reason'), não como ontologia do grafo | **referenciar** | Conceitos de pagamento do tesauro com nota/related para o elemento ISO 20022; sem importar o modelo | 0,5 | baixa |
| **Taxonomias XBRL (IFRS Accounting Taxonomy, US-GAAP, ESEF) e APIs da SEC** | contas e conceitos de demonstrações financeiras | XBRL (XSD + linkbases), iXBRL; JSON da SEC (companyfacts/frames). Arelle (Apache-2.0), SEC data.sec.gov, filings.xbrl.org (ESEF) | alta | IFRS: licença da IFRS Foundation (uso livre registrado); US-GAAP e SEC: domínio público | Necessário para comparar balanços entre bancos (ver financas-instituicoes); para o grafo, só os conceitos de topo | **mapear** | Conceitos financeiros do tesauro (ativo total, Basileia, PDD) com exactMatch para o elemento IFRS/US-GAAP e a conta COSIF | 1 | média |
| **COSIF (Plano Contábil das Instituições do SFN)** | plano de contas dos bancos brasileiros (códigos hierárquicos), base dos balancetes 4010/4016 e do IF.data | páginas e arquivos do BCB; códigos nos dados do IF.data. nenhuma ontologia pública | alta (em transição para o padrão contábil da Res. CMN 4.966, vigente desde 2025) | domínio público | Vocabulário brasileiro indispensável para dados financeiros; não existe versão RDF/SKOS | **adotar (como vocabulário próprio em SKOS)** | Converter o plano em SKOS (código = notation, hierarquia = broader) quando a camada de finanças precisar; mapear contas de topo para IFRS | 2 | média |
| **ESCO (European Skills, Competences, Qualifications and Occupations)** | ocupações e habilidades (~3 mil ocupações, ~14 mil habilidades) | RDF/SKOS, CSV, API REST. API https://ec.europa.eu/esco/api, downloads por versão | alta (v1.2) | reuso livre (Decisão 2011/833/UE) | A melhor opção aberta e em português (a API devolveu 'deteção de fraude' com language=pt) | **adotar** | Habilidade no grafo = URI ESCO; mapa de habilidades por tema aponta para ESCO; extensões próprias só onde faltar (ex.: técnicas de ML muito específicas) | 2 | alta |
| **O*NET** | ocupações, habilidades, tarefas, tecnologias usadas (EUA) | CSV/Excel/MySQL, Web Services (chave gratuita). downloads trimestrais | alta | CC BY 4.0 | Complementar (tarefas e 'hot technologies'); existe correspondência oficial ESCO↔O*NET | **mapear** | Só via crosswalk ESCO↔O*NET, quando a plataforma de habilidades pedir | 1 | baixa |
| **SFIA 9** | habilidades digitais e de TI em 7 níveis | CSV, XLSX, HTML. site SFIA | alta | licença SFIA: gratuita para uso interno/não comercial com registro; uso comercial pago | Bom para TI e níveis de proficiência, mas licença restrita e foco só em TI | **referenciar** | Só se a plataforma de habilidades do trabalho já usar SFIA | 0 | baixa |
| **CBO (Classificação Brasileira de Ocupações)** | ocupações no Brasil (usada no RAIS/CAGED) | CSV/XLS. nenhuma ontologia | alta | dados públicos | Útil para ligar habilidades à realidade do mercado de trabalho brasileiro (RAIS/CAGED) | **mapear (depois)** | CBO ↔ ISCO-08 ↔ ESCO, quando houver demanda de dados de emprego | 1 | baixa |
| **PROV-O, Web Annotation e nanopublications** | proveniência, ancoragem de trechos em documentos e afirmações com evidência | RDF/JSON-LD. rdflib, pyoxigraph; seletores TextQuote/Fragment do Web Annotation | alta (PROV-O e Web Annotation são Recomendações W3C); nanopub é nicho | W3C / aberta | Dão o vocabulário para a nossa camada de afirmações: quem extraiu, de qual trecho, quando, revisado por quem | **adotar (termos)** | Modelo de afirmação próprio, com campos que exportam para prov:wasDerivedFrom, prov:wasAttributedTo e oa:TextQuoteSelector (trecho + página) | 1 | alta |
| **DOI, OpenAlex, ORCID, ROR** | papers, autores, instituições | REST/JSON. já em uso (OpenAlex) | alta | CC0 (OpenAlex, ROR); ORCID público CC0 | Já são os ids do arquivo de papers | **adotar** | Mantidos como ids externos das entidades paper/pessoa/instituição | 0 | alta |


### 2.2 Desenho do nosso modelo (onde nada serve pronto)

Nenhuma ontologia pública modela o que a VISION pede: "o método M, com os dados D, teve o resultado R contra o baseline B, com os limites L", ligado a normas, pessoas e habilidades. A proposta é um **modelo próprio e pequeno**, em tabelas, com ids externos onde eles existirem e um export para JSON-LD com vocabulários padrão.

**Entidades** (cada uma com IRI estável `https://<site>/id/<tipo>/<slug>` e `same_as[]`):

| Tipo | Ids externos | Vocabulário do export |
|---|---|---|
| `document` (paper, norma, lei, relatório, notícia, vídeo) | DOI, OpenAlex, URN LEX, CELEX, citação FR | schema:ScholarlyArticle / schema:Legislation + eli:* |
| `provision` (artigo ou dispositivo de uma norma) | URN LEX com `!art…`, parágrafo do Basel Framework | eli:LegalResourceSubdivision |
| `organization` (banco, regulador, associação, empresa, universidade) | CNPJ base, LEI, ROR, OpenAlex, QID | schema:Organization / BankOrCreditUnion; classe FIBO como `closeMatch` |
| `person` | ORCID, OpenAlex | schema:Person (só dados públicos e profissionais; nada de colaboradores, como diz a VISION) |
| `concept` (tema, técnica, método, risco, produto) | EuroVoc, Wikidata, FIBO, ISO 20022 | skos:Concept |
| `skill` | URI ESCO (O*NET via crosswalk) | skos:Concept (ESCO) |
| `dataset`, `repository` | DOI, URL do GitHub ou Hugging Face | schema:Dataset / SoftwareSourceCode |
| `jurisdiction` | código ISO 3166, Wikidata | schema:AdministrativeArea |

**Arestas** (tabela única `edge(subject, predicate, object, valid_from, valid_to, source)`), com um vocabulário fechado de ~25 predicados: `cita`, `altera`, `revoga`, `regulamenta` (norma → lei, com artigo), `implementa` (norma BR → padrão internacional), `aplica_se_a` (norma → tipo de instituição ou segmento S1–S5), `exige` (norma → obrigação), `trata_de` (documento → conceito), `usa_metodo`, `usa_dados`, `autor_de`, `afiliado_a`, `subsidiaria_de` (GLEIF/BCB), `requer_habilidade` (conceito → skill).

**Afirmações e evidências**, que são o que diferencia o Watch:

```
claim(id, kind: resultado|exigência|tendência|fato, subject→entity, predicate, object→entity|valor,
      qualifiers{dataset, baseline, metric, value, unit, population, period, limits},
      stance: suporta|contradiz, confidence, status: extraída|revisada|rejeitada)
evidence(id, claim→claim, document→entity, locator{page, section, provision_urn},
         quote (≤ 300 caracteres), extracted_by{model, prompt_version, date}, reviewed_by, reviewed_at)
```

- **Export.** O export usa `prov:wasDerivedFrom`, `prov:wasAttributedTo` e o seletor `oa:TextQuoteSelector` do Web Annotation (trecho + página), de modo que cada afirmação tem o caminho de volta à fonte, como pede o princípio 6 da VISION.
- **Afirmações que se acumulam ou se contradizem.** A Evolução "mais rigorosa" é uma consulta sobre `claim` agrupada por (sujeito, predicado), com `stance`.

### 2.3 Armazenamento do grafo

O volume hoje é pequeno: **9,8 MB** em `data/` e 236 normas triadas. Mesmo com leis, normas da UE e afirmações extraídas, o grafo fica na ordem de 10⁴–10⁵ entidades e 10⁵–10⁶ arestas, o que não pede servidor de grafo.

| Opção | Para quê | A favor | Contra | Veredito |
|---|---|---|---|---|
| **JSON versionado no git (situação atual)** | itens curados, digests, normas triadas, tesauro, configuração | simples, auditável, diff legível, sem servidor; 9,8 MB hoje | não serve para PDFs, séries grandes ou consultas com junção | manter para o que é curado e pequeno |
| **SQLite (stdlib sqlite3, JSON1, FTS5)** | grafo v0 (entidades, arestas, afirmações, evidências) e índice de texto | não quebra a regra 'stdlib pura' do pipeline; arquivo único; FTS5; roda também no Cloudflare D1 | consultas de grafo profundas exigem CTE recursiva | recomendado para o grafo de conhecimento v0 |
| **Parquet + DuckDB (e Polars)** | séries financeiras, fatos XBRL, tabelas do Pilar 3, logs/traces | colunar, compacto, rápido; DuckDB lê Parquet direto do R2/S3 e tem DuckDB-WASM para o navegador | primeira dependência fora da stdlib (decisão de projeto) | recomendado quando a camada de finanças entrar |
| **Object storage (Cloudflare R2, compatível com S3)** | PDFs, HTML bruto, ZIPs de dados abertos, dumps | sem custo de saída, já estamos no Cloudflare; nomes por hash (sha256) evitam duplicata | mais um segredo no CI | recomendado assim que guardarmos PDFs (não colocar binários no git) |
| **Triplestore RDF (Oxigraph embutido; QLever ou Jena Fuseki como servidor)** | SPARQL sobre vocabulários e export do grafo; federação com Wikidata/EUR-Lex | padrão aberto, raciocínio simples, troca com o mundo RDF | modelagem de afirmações com qualificadores fica verbosa (reificação/RDF-star); operação extra; nosso volume não pede | só Oxigraph embutido (pyoxigraph), gerado a partir do SQLite, quando houver caso de uso SPARQL |
| **Grafo de propriedades (Neo4j, Memgraph, FalkorDB, Kùzu, DuckPGQ)** | consultas de caminho e algoritmos de grafo | modelo intuitivo (arestas com propriedades), Cypher | servidor a operar (Neo4j Community é GPLv3); o Kùzu, a opção embutida, foi arquivado em 10/2025; DuckPGQ ainda é extensão experimental | não agora; reavaliar acima de ~1 M arestas ou com algoritmos de grafo |
| **Índice vetorial (sqlite-vec, LanceDB, DuckDB VSS)** | busca semântica nos textos completos | embutidos, sem servidor | custo de gerar embeddings; o BM25 atual atende | adiar até a avaliação mostrar falha de recuperação que o BM25 não resolve |


**Recomendação.** **SQLite** é a fonte de verdade do grafo. Ele é stdlib, então mantém a regra "pipeline sem dependências"; tem JSON1, FTS5 e CTE recursiva para caminhos curtos, e o mesmo arquivo serve no Cloudflare D1 se a API precisar de consultas ao vivo. O curado pequeno (tesauro, mapas lei → norma, Basel → BCB) continua em JSON no git, que tem diff legível e revisão humana. Do SQLite saem: (a) os `data.json` publicados como hoje, (b) JSON-LD por entidade no site e (c) quando houver uso, um dump N-Triples carregado em **pyoxigraph** para SPARQL local e federação com Wikidata ou EUR-Lex. Grafo de propriedades fica para depois (o Kùzu, que seria a opção embutida, foi arquivado em 10/2025).

---

## 3. Formatos, armazenamento e processamento

### 3.1 Por formato

| Formato | Onde aparece | Python | Rust | Onde ficam aquém | Recomendação | Esforço (d) |
|---|---|---|---|---|---|---|
| **PDF com texto (normas, relatórios de resultados, Pilar 3, estudos de associações)** | BCB (anexos), CVM, FEBRABAN, bancos (RI), BIS, EBA | pypdfium2 (Apache/BSD, rápido) ou pdfplumber (MIT, coordenadas de caractere); Docling (MIT, layout + tabelas, saída Markdown/JSON); Marker (código Apache-2.0, pesos com licença própria) | pdf_oxide (MIT/Apache, extração de texto rápida, 0.3.x, jovem); hayro (Apache, interpretador/rasterizador puro Rust, jovem); lopdf (baixo nível); pdfium-render (bindings do PDFium); pdf-extract (layout fraco); mupdf (AGPL) | Velocidade não é o problema no nosso volume (centenas de PDFs por mês): o difícil é ordem de leitura, colunas, rodapés e tabelas. Nenhuma biblioteca Rust reconhece estrutura de tabela; PyMuPDF é rápido mas AGPL | pypdfium2 para texto corrido; Docling para documentos com tabelas; guardar o PDF original em object storage com hash | 2 |
| **Tabelas em PDF (Pilar 3, releases de resultados, anexos estatísticos)** | RI dos bancos; tabelas padronizadas do Pilar 3 (KM1, OV1, LR1, LIQ1...) pela Res. BCB 54/2020 | pdfplumber (regras por linha/coluna), Camelot (MIT, lattice/stream), Docling (TableFormer), VLM como último recurso para páginas difíceis | nenhuma opção madura de reconhecimento de tabela | Tabelas sem linhas, células mescladas e números em formato BR (1.234,5) quebram as ferramentas genéricas. Os modelos do Pilar 3 são fixos: extração guiada por modelo (código da tabela + linhas esperadas) é mais confiável que extração genérica | Extratores por modelo de tabela do Pilar 3 (pdfplumber + validação de somas); Docling como genérico; VLM só nas páginas que falharem na validação | 5 |
| **PDF escaneado / imagem** | normas antigas, alguns anexos e ofícios | OCRmyPDF (MPL-2.0) + Tesseract (por) ; Docling com OCR; PaddleOCR | ocrs (jovem) | Qualidade de OCR em tabelas é baixa; pouco volume nos nossos casos | OCRmyPDF sob demanda, só quando o PDF não tiver texto | 0,5 |
| **XBRL / iXBRL** | SEC (EDGAR), ESEF (UE), alguns reguladores | Arelle (Apache-2.0, referência e validação); APIs JSON da SEC (companyfacts, frames) já trazem os fatos extraídos | não há parser XBRL completo em Rust; quick-xml só lê o XML | XBRL completo (dimensões, linkbases de cálculo) é complexo; reescrever não compensa. A SEC e o filings.xbrl.org (ESEF, xBRL-JSON) já entregam os fatos prontos | Consumir JSON pronto (SEC, xBRL-JSON); Arelle só para casos sem JSON | 1 |
| **XML (LexML, Formex do EUR-Lex, CLML/Akoma Ntoso do UK, eCFR, DOU/INLABS, ISO 20022)** | fontes de leis | xml.etree (stdlib) ou lxml (XPath, rápido) | quick-xml, roxmltree | Nenhuma lacuna relevante: os arquivos são pequenos | stdlib/lxml | 0,5 |
| **CSV, XLSX e OData de séries temporais (SGS, IF.data, CVM, estatísticas de associações)** | BCB, CVM, FEBRABAN, associações | DuckDB (lê CSV/Parquet/JSON direto, SQL), Polars (núcleo Rust), PyArrow; openpyxl ou python-calamine para XLSX | polars, arrow-rs, calamine | CSV do governo com ';', vírgula decimal e latin-1; colunas mudam de nome entre anos | Normalizar em Parquet particionado por fonte/ano; consultar com DuckDB | 2 |
| **HTML (Planalto, Basel Framework, páginas de reguladores, notícias)** | várias | trafilatura (Apache-2.0) para texto principal; selectolax ou html.parser (stdlib) para listagens | scraper, html5ever | Charset legado (windows-1252 no Planalto); SPAs (SUSEP, Febraban Tech) pedem navegador ou a API interna | Guardar snapshot gzip no object storage + texto extraído; diff por hash | 1 |
| **JSON-LD e RDF (normas.leg.br, CELLAR, ESCO, EuroVoc, FIBO, Wikidata)** | fontes de leis e ontologias | json (stdlib) para JSON-LD como JSON; pyld (expansão); rdflib (completo, lento acima de ~1 M triplas); pyoxigraph (Rust, rápido, SPARQL embutido) | oxigraph, sophia | rdflib fica lento com tesauros grandes (EuroVoc, ESCO completo); pyoxigraph resolve | Tratar JSON-LD como JSON no pipeline; pyoxigraph só para carregar vocabulários e responder SPARQL locais | 0,5 |


### 3.2 Pilha proposta

```
fontes ─▶ bruto (R2, nome = sha256, manifesto em JSONL)       PDFs, HTML gzip, ZIPs, XML do DOU
       ─▶ extraído (texto/Markdown por documento, JSONL)        pypdfium2 | Docling | trafilatura | json
       ─▶ estruturado
            curado e pequeno        → JSON no git (como hoje)
            grafo (entidades, arestas, afirmações, evidências) → SQLite
            séries e fatos numéricos → Parquet particionado (fonte/ano) + DuckDB
       ─▶ publicado  data.json / library.json / search.json  +  JSON-LD por entidade  (+ dump RDF opcional)
```

- **Parquet + DuckDB** entra junto com a camada de finanças (séries do SGS e do IF.data, fatos XBRL, tabelas do Pilar 3). Lá o volume e as junções justificam a primeira dependência fora da stdlib. O DuckDB lê Parquet direto do R2 e tem versão WASM, caso um visualizador no navegador venha a precisar.
- **Não colocar binários no git.** Hoje o `data/papers/` guarda texto. PDFs e HTML bruto vão para o R2 com um manifesto (url, sha256, data, content-type, licença).

### 3.3 Quando escrever em Rust

| Caso | Rust compensa? | Por quê |
|---|---|---|
| Extração de texto de PDF | **não** | Gargalo é qualidade, não velocidade; pypdfium2 já é C++ por baixo; pdf_oxide/hayro são promissores mas jovens |
| Reconhecimento de tabelas | **não** | Problema de layout/ML; não existe base em Rust; Docling/pdfplumber + validação por modelo resolvem melhor |
| Parser XBRL | **não** | SEC e ESEF já publicam fatos em JSON; Arelle cobre a validação; reescrever XBRL é meses de trabalho |
| Visualizador rápido (PDF + séries) | **não** | PDF.js e DuckDB-WASM (com Arrow) no navegador já entregam; o site é estático no Cloudflare Pages |
| Busca e índice no edge (WASM no Cloudflare) | **talvez** | Se o search.json passar de alguns MB por tema, um índice compacto (tantivy ou BM25 próprio compilado para WASM) reduz memória e latência no Worker |
| Processamento em massa (todo o DOU, todo o EDGAR, OCR em milhões de páginas) | **sim, se acontecer** | Só nesse volume o ganho de CPU (10–50x sobre Python puro) paga o custo de manter Rust; usar polars/oxigraph/quick-xml já dá a maior parte do ganho sem escrever Rust |


- **Em resumo.** Usar bibliotecas com núcleo em Rust ou C++ que já existem (Polars, pyoxigraph, DuckDB, pypdfium2) dá o ganho de desempenho sem manter código Rust.
- **Gatilho para Rust próprio.** Um passo medido do pipeline passar de ~10 min por dia, ou a busca no Worker estourar memória ou latência. Até lá, o gargalo é qualidade de extração e de LLM, não CPU.

---

## Viabilidade

**Fácil (APIs abertas, testadas hoje):**

- Leis federais: normas.leg.br (JSON-LD, CC BY 4.0) e a lista de legislação do Senado.
- Projetos de lei: Senado `/processo` e Câmara API v2 (com os arquivos anuais).
- CMN: já vem pela API do BCB. Base legal das normas BCB/CMN: o campo `Referencias`, já baixado.
- EUR-Lex: SPARQL do CELLAR e URIs ELI. EUA: Federal Register e eCFR, sem chave.
- Entidades e vocabulários: GLEIF (CC0), ESCO com rótulos em português, Wikidata.

**Médio (sem API, mas com estrutura estável):**

- CVM: planilha do estoque regulatório + diff de páginas.
- ANPD: páginas gov.br.
- BIS: Basel Framework em HTML + RSS de releases.
- Mapa curado Basel → BCB.
- Pilar 3, por modelo de tabela.
- Tesauro SKOS próprio e mapeamentos para FIBO, EuroVoc e ESCO: trabalho intelectual mais que técnico.

**Difícil ou bloqueado hoje:**

- **DOU/INLABS**: em manutenção, e o in.gov.br respondeu 404 em todas as rotas testadas.
- **Busca SRU do LexML**: página anti-robô do Senado. O resolvedor de URN oscilou entre 200 e 503.
- **legislation.gov.uk**: desafio do AWS WAF (HTTP 202) para curl, apesar de ser uma API aberta sob OGL.
- **Listagem de publicações do BCBS**: 403.
- **SUSEP**: SPA sem API mapeada.
- **Ontologias formais pesadas** (LKIF, LegalRuleML, FIBO completo): viáveis tecnicamente, mas sem retorno para o nosso uso.

**Veredito por área**

- **Leis e regulação: viável e de alto valor.** O Brasil federal e o BCB/CMN fecham em ~1 semana. A UE e os EUA, em mais ~1 semana. DOU e UK ficam para quando desbloquearem.
- **Ontologias: viável, desde que leve.** Adotar ids e vocabulários (URN LEX, ELI no export, schema.org, SKOS, ESCO, LEI) e um modelo próprio pequeno de afirmações e evidências. Importar ontologias inteiras ou subir triplestore agora seria custo sem retorno.
- **Formatos e processamento: viável com Python e bibliotecas existentes.** SQLite primeiro, Parquet/DuckDB e R2 quando a camada de finanças entrar. Rust próprio não compensa no volume atual.

## Recomendação

**A — Leis brasileiras ligadas às normas (agora)** (~8,5 dias)

- Base legal das normas BCB/CMN: ler o campo Referencias, converter em URN LEX e guardar legal_basis[] (1,5 d)
- Coletor normas.leg.br para ~40 leis curadas do SFN, com alterações, menções e texto por dispositivo; diff por dateModified (2 d)
- Descoberta de leis/LCs/MPs/decretos novos pela lista do Senado + triagem LLM igual à das normas (1 d)
- Projetos de lei: Senado /processo + arquivo anual da Câmara, triagem por tema, ficha só dos que tramitam (2 d)
- Identificadores: URN LEX para leis e para normas BCB/CMN/CVM (padrão LexML), alias do id atual (0,5 d)
- ANPD (diff de páginas) e CVM (planilha de estoque + resoluções) (1,5 d)

**B — Internacional e modelo de conhecimento v0 (2–4 semanas depois)** (~12 dias)

- EUR-Lex/CELLAR: lista curada de CELEX por tema + SPARQL semanal de alterações (3 d)
- BIS: mapa Basel Framework → norma BCB que implementa + RSS de releases (2 d)
- Federal Register (agências bancárias) com ligação ao eCFR (1,5 d)
- Grafo v0 em SQLite: entidade, aresta, afirmação, evidência; ids externos (URN, CELEX, LEI, CNPJ, DOI, OpenAlex, QID, ESCO) (3 d)
- Tesauro SKOS próprio (temas, técnicas, riscos) com exactMatch para EuroVoc/ESCO/FIBO; export JSON-LD schema.org + ELI (2,5 d)

**C — Sob demanda (quando uma pergunta de referência pedir)** (~15 dias)

- DOU via INLABS filtrado por órgão, quando o serviço voltar (4 d)
- legislation.gov.uk (depois de resolver o WAF), EBA, SUSEP, CADE (6 d)
- Camada de arquivos: R2 + Parquet/DuckDB para PDFs e séries, junto com a camada de finanças (3 d)
- Extratores do Pilar 3 por modelo de tabela + Docling (ver financas-instituicoes) (2 d de base, mais por banco)


**Deixar para depois ou não fazer:**

- Importar a FIBO inteira, LKIF, LegalRuleML, ou produzir Akoma Ntoso.
- Servidor de triplestore ou de grafo de propriedades.
- Parser próprio de PDF, de tabelas ou de XBRL em Rust.
- Raspar o SRU do LexML ou contornar o WAF do legislation.gov.uk: pedir liberação ou usar outro caminho.
- Monitorar o DOU inteiro.

**Riscos**

- **API não documentada.** O endpoint `normas.leg.br/api/public/normas` foi inferido do código do site e pode mudar sem aviso. Mitigar com teste de contrato no CI e fallback para a lista do Senado + texto do Planalto.
- **Fontes instáveis ou com proteção anti-robô** (DOU/INLABS, LexML, legislation.gov.uk, BIS). Usar o mesmo User-Agent identificado, ritmo baixo, cache por ETag, e não tentar burlar desafios.
- **Erro de ligação.** Lei errada na base legal, ou URN com a data errada. Validar cada URN contra o normas.leg.br antes de gravar e mostrar a base legal com o texto original ao lado.
- **Licenças.**
  - BIS: trechos curtos com citação.
  - CVM (dados): ODbL, que exige compartilhar derivados pela mesma licença.
  - PyMuPDF e MuPDF: AGPL, por isso evitar.
  - MinerU: licença própria. Pesos do Marker: licença com limite de receita.
  - SFIA: licença paga para uso comercial.
- **Escopo.** É muita fonte. A regra da VISION vale aqui: só entra a fonte que alguma pergunta de referência pede. As fases B e C esperam o laço de avaliação mostrar a falta.
- **Dependências.** Parquet/DuckDB rompe o "stdlib pura". A decisão deve ser explícita e ficar restrita ao módulo de dados financeiros.
