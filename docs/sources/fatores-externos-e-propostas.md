# Fatores externos, métodos de ligação e propostas de investimento

Levantamento feito em **28/11/2026** para o Research Watch. A pergunta que ele responde é: *de onde vêm os
dados e quais métodos usar para ligar o resultado de um banco grande brasileiro (ou um fato relevante dele) a
fatores externos, e como transformar o que se descobre em propostas de investimento com preço, retorno e
medição.* O documento só mapeia e avalia. Não traz coletor nem cópia de dados. A versão para máquina do
inventário está em [`fatores-externos-e-propostas.json`](fatores-externos-e-propostas.json): 52 fontes, cada uma
com cobertura, granularidade, formato, API, licença, método de extração, esforço em dias, a métrica do banco que
ela ajuda a explicar e o resultado de uma chamada de teste.

Todos os testes de acesso foram chamadas pequenas, feitas em 28/11/2026 com um User-Agent genérico. Onde o
teste falhou, o motivo está anotado e nada foi contornado (sem desligar a verificação de TLS, sem fingir ser um
navegador). Os números da §0 e dos exemplos foram tirados dessas chamadas. As fontes estão indicadas.

Organização:
- §0 o que os dados públicos já mostram hoje;
- §1 inventário de fontes e cadeias de transmissão;
- §2 métodos para ligar fatores a resultados;
- §3 precificação e medição de ganhos;
- §4 modelo de proposta, caminho do paper à reprodução e dois exemplos ilustrativos;
- §5 viabilidade;
- §6 recomendação em fases;
- §7 riscos.

---

## Resumo

- **O caso que motiva tudo já está nos dados abertos.** A inadimplência do crédito rural de pessoas físicas no
  sistema foi de 0,80% (out/2022) para **9,59% (out/2026)**, e para **17,21%** na parcela com taxas de mercado
  (BCB SGS 21148 e 21146). Em 11/11/2026, o BB revisou o custo do crédito de 2026 de R$ 65–70 bi para
  **R$ 80–83 bi** e o lucro ajustado de R$ 18–22 bi para **R$ 9–11 bi**. O motivo citado foi a inadimplência do
  agro (fato relevante na CVM). O retorno anormal acumulado da ação foi de **−9,3% em [−1, +3] pregões**
  (estudo de evento feito aqui, ilustrativo).
- **As melhores fontes são públicas, têm API e licença aberta.** São elas:
  - BCB: SGS, SCR.data, IF.data, ESTBAN, SICOR e Focus;
  - IBGE SIDRA: LSPA e PAM;
  - MAPA: ZARC e SISSER (CC-BY);
  - CVM IPE, para as datas e o texto dos fatos relevantes;
  - para clima, CHIRPS, ERA5 e NOAA ONI;
  - INPE TerraBrasilis e MapBiomas, para a parte ambiental;
  - CEPEA e Pink Sheet do Banco Mundial, para preços e insumos.
- **Onde o dado público acaba.** Não há inadimplência por banco e município. ESTBAN dá saldos por banco e
  município, IF.data dá risco por banco e região, e SCR.data dá inadimplência por UF e modalidade para o
  sistema. Para o banco individual no nível fino, o dado tem de vir de dentro do banco. A plataforma deve
  nascer preparada para essa troca (princípio 8 do `VISION.md`).
- **Métodos recomendados.** Estudo de evento para fatos relevantes. Painel regional (UF e município) com efeitos
  fixos e erros espaciais para ligar clima, safra e preço à inadimplência. Nowcasting mensal da inadimplência
  rural. Diferenças em diferenças com tratamento escalonado para choques como secas e enchentes. Um grafo
  *entidade → exposição → fator* em que o LLM **propõe** ligações e o código **verifica** cada uma.
- **Precificação e ganho.** O conjunto padrão é este:
  - risk-based pricing com FTP e RAROC contra o custo do capital, para produto de crédito;
  - VPL com cenários e payback, para projeto;
  - opção real (piloto antes de escalar), para iniciativas incertas;
  - medição por grupo de controle (A/B ou holdout) e, quando não der para sortear, diferenças em diferenças.

---

## 0. O que os dados públicos já mostram (28/11/2026)

**Inadimplência do crédito rural de pessoas físicas (recursos direcionados), sistema financeiro, em %**
(BCB SGS 21148 = total; 21146 = parcela com taxas de mercado)

| Mês | out/22 | out/23 | out/24 | abr/25 | out/25 | abr/26 | jul/26 | out/26 |
|---|---|---|---|---|---|---|---|---|
| Rural PF total (21148) | 0,80 | 1,05 | 2,36 | 3,25 | 6,22 | 7,51 | 8,79 | **9,59** |
| Rural PF taxas de mercado (21146) | 0,51 | 1,11 | 3,58 | 5,29 | 11,51 | 13,39 | 15,55 | **17,21** |

O saldo da mesma carteira era de **R$ 550,5 bi** em out/2026 (SGS 20609). O rural PJ é bem menor (R$ 130,6 bi,
SGS 20597) e tem inadimplência baixa (0,91%, SGS 21136). A inadimplência total do sistema estava em 5,10%
(SGS 21082). Atenção: a Res. CMN 4.966/21 (perda esperada, em vigor desde jan/2025) mudou a contabilização da
provisão. Toda série que atravessa 2025 tem uma quebra estrutural possível.

**Projeções do Banco do Brasil para 2026** (fatos relevantes no IPE da CVM, lidos no PDF)

| Indicador | 11/02/2026 | 13/05/2026 (1T26) | 11/11/2026 (revisada) | Realizado 9M26 |
|---|---|---|---|---|
| Carteira agronegócios | −2% a 2% | (não lido) | −3% a −1% | 1,2% |
| Margem financeira bruta | 4% a 8% | 7% a 11% | 2,5% a 4,5% | 7,4% |
| Custo do crédito (R$ bi) | 53 a 58 | 65 a 70 | **80 a 83** | 58,6 |
| Lucro líquido ajustado (R$ bi) | 22 a 26 | 18 a 22 | **9 a 11** | 8,6 |

Os valores de 13/05 foram tirados da coluna "Anterior" do fato de 11/11. O texto de 11/11 atribui a revisão
"à continuidade da elevação da inadimplência da carteira de agronegócios" e às renegociações no âmbito da
MP nº 1.376/2026, "abaixo do inicialmente esperado". Também cita a concentração de vencimentos no 3T26.

**Outros sinais externos do mesmo dia:**
- ONI (NOAA CPC) de ago–out/2026 em **+2,46**, um El Niño forte em curso. O padrão histórico é seca no Norte e
  no Nordeste (inclusive no MATOPIBA), chuva acima da média no Sul e chuva irregular no Centro-Oeste. A safra de
  soja 2026/27 está em plantio.
- Soja CEPEA/Paranaguá a **R$ 166,81/saca** em 27/11/2026 (+4,99% no mês).
- O IBGE LSPA de out/2026 estimava **174,99 milhões de t** de soja para o Brasil.

Isso dá um caso real e atual para tudo o que vem a seguir.

---

## 1. Inventário de fontes

Legenda:
- **Esforço**: dias-pessoa para a fonte ficar ingerida numa tabela utilizável, sem modelagem.
- **Teste**: resultado da chamada de 28/11/2026.
- **Licença**: "pública" quer dizer dado de governo sem licença explícita (uso livre com citação).

Os detalhes completos estão no JSON.

### 1.1 O alvo: resultados do banco e do sistema

| Fonte | Cobertura e granularidade | Formato e API | Licença | Esforço | Explica / é o quê | Teste |
|---|---|---|---|---|---|---|
| **BCB SGS** | Brasil; diária ou mensal; milhares de séries de crédito por modalidade e PF/PJ | JSON, REST `api.bcb.gov.br/dados/serie/bcdata.sgs.{n}` | aberta | 0,5 | variável dependente do sistema: inadimplência rural (21148, 21146, 21136), saldos, spreads, Selic | 200 |
| **SCR.data** | sistema, por UF × modalidade × CNAE/ocupação × porte × origem de recursos; mensal, com ~60 d de defasagem | CSV (zip anual), CKAN `scr_data` | aberta | 2 | inadimplência e ativo problemático **regionais**; é o "mercado" contra o qual comparar o banco | 200 (metadados) |
| **IF.data** | por instituição; trimestral; carteira por nível de risco, **região**, modalidade e indexador; capital | OData `olinda.bcb.gov.br/.../IFDATA` | aberta | 1,5 | carteira rural do banco por risco; RWA e capital para o RAROC | 200 em `ListaDeRelatorio`; `IfDataCadastro` deu 500 (parâmetro a acertar) |
| **ESTBAN** | por **banco × município** (e agência); mensal; saldos COSIF (financiamentos rurais, provisões, depósitos) | CSV em ZIP | aberta | 2 | **exposição do banco por município**: é o peso que liga o banco a safra e clima locais | página nova é SPA; a URL antiga de arquivos deu 404 |
| **SICOR** | contratos rurais por município × produto × programa × fonte × seguro; mensal desde 2013 | OData `.../SICOR/versao/v2` | aberta | 1,5 | exposição nova de cada safra; parcela com Proagro ou seguro; fonte de recursos (para FTP) | 200 com `$filter` (sem filtro, timeout) |
| **CVM IPE** | todas as abertas; por evento (data de entrega) | CSV em ZIP anual (≈ 2 MB) + PDF no RAD | ODbL | 1 | **datas e texto** de fatos relevantes e guidance | 200; 2.255 fatos relevantes em 2026; 11 do BB |
| **CVM ITR/DFP** | trimestral, padronizado | CSV em ZIP | ODbL | 1 | lucro, PDD e margem | mesmo servidor (200) |
| **RI do banco** | trimestral; agro por linha; inadimplência >90 d por segmento; premissas do guidance | PDF, XLSX | do banco | 2 | séries do próprio banco | 200 |
| **B3** (COTAHIST, derivativos) | diária | TXT de largura fixa em ZIP | termos B3 (redistribuição restrita) | 1,5 | retorno da ação para estudo de evento; futuros de milho e boi | 200 (HTML) |
| Yahoo chart (não oficial) | diária | JSON | uso pessoal | 0,2 | só protótipo | 200 |
| **Normativos BCB/CMN** | por evento | JSON | pública | 0,5 (já no pipeline) | mudanças de regra: MCR 2-9, Res. 4.966, renegociações | 200; Res. CMN 5.081/2023 e 5.193/2024 confirmadas |

### 1.2 Agro: o que se planta onde, quando e quanto

| Fonte | Cobertura e granularidade | Formato e API | Licença | Esforço | Métrica do banco que explica | Teste |
|---|---|---|---|---|---|---|
| **CONAB** (acompanhamento de safra, séries, progresso de plantio e colheita, custos de produção) | UF; 12 levantamentos por safra + progresso semanal; custos por região | PDF, XLSX, TXT; sem API | pública | 2 | quebra estimada por UF vs. inadimplência regional; custo vs. receita (margem do produtor) | o portal de downloads **falhou na verificação de TLS**; a página gov.br/conab deu 200 |
| **IBGE LSPA** (SIDRA 6588) | UF; mensal; área, produção e rendimento da safra corrente | JSON, API SIDRA | pública | 0,5 | revisões de estimativa (surpresa de safra) | 200 (soja out/26 = 174,99 Mt) |
| **IBGE PAM** (SIDRA 5457) | **município × cultura**; anual (defasagem ~10 meses) | JSON, API SIDRA | pública | 1 | "o que se planta onde"; choque de rendimento municipal | 200 |
| IBGE PPM e Censo Agro 2017 | município; rebanhos; estrutura fundiária, uso de crédito, irrigação | JSON, API SIDRA | pública | 1 | exposição à pecuária; perfil do tomador | 200 |
| **MapBiomas** (uso da terra) | pixel de 30 m e município; anual desde 1985 | XLSX, GEE | CC BY 4.0 | 2 | confirma a área de soja e pasto; detecta expansão | 200 |
| Embrapa AgroAPI (SATVeg, ClimAPI, Agritec) | ponto ou polígono; NDVI a cada 16 d | JSON, OAuth2 com cadastro | termos Embrapa | 2 | anomalia de vegetação **durante** a safra (sinal precoce) | 200 (portal) |

**Calendário que importa para o crédito** (Centro-Sul; datas típicas, que variam por UF e ZARC):

| Cultura | Plantio | Colheita | Vencimento típico do custeio |
|---|---|---|---|
| Soja | set–dez | jan–abr | mar–jun |
| Milho 2ª safra | jan–mar (após a soja) | jun–ago | jul–out |
| Milho 1ª safra (Sul) | ago–nov | fev–abr | abr–jun |
| Trigo (Sul) | abr–jun | set–nov | nov–jan |
| Café | perene | mai–set | set–dez |
| Cana | perene | abr–nov | conforme a moagem |

O custeio é contratado antes do plantio e vence depois da colheita. Por isso, um choque de clima no
florescimento (dez–fev, no caso da soja) aparece no atraso **3 a 6 meses depois**, e na inadimplência acima de
90 dias **6 a 9 meses depois**. O "baixo nível de pontualizações" e a "concentração de vencimentos no 3T26"
citados no fato relevante do BB seguem esse calendário. Os vencimentos de 2025/26 foram prorrogados por
renegociação.

### 1.3 Agro: preços, insumos e origem dos insumos

| Fonte | Cobertura e granularidade | Formato e API | Licença | Esforço | Métrica do banco que explica | Teste |
|---|---|---|---|---|---|---|
| **CEPEA/ESALQ** | praça (porto, estado); diária; soja, milho, boi, café, algodão, açúcar, etanol, leite, trigo, arroz, suínos, frango | HTML + XLS; sem API | reprodução com citação | 1 | receita do produtor (preço na colheita vs. no plantio); valor da garantia (penhor, CPR) | 200 (soja R$ 166,81) |
| **B3 futuros agro** | contrato; diária; milho (CCM), boi (BGI), soja (SJC), café (ICF), etanol | arquivos de histórico | termos B3 | 1,5 | curva esperada de preço, usada como cenário | 200 (HTML) |
| **USDA WASDE / FAS PSD** | país × commodity; mensal | CSV/XML; PSD com chave | domínio público (EUA) | 1 | estoques globais que antecipam preço | PSD "Bad API Key"; WASDE 403 para o nosso UA |
| **World Bank Pink Sheet** | mundial; mensal; **ureia, DAP, TSP, KCl**, rocha fosfática, grãos, energia | XLSX (0,8 MB) | CC BY 4.0 | 0,3 | relação de troca grão/fertilizante; custo do produtor | 200 |
| **Comex Stat** | NCM × **país de origem** × UF/município; mensal | JSON, REST `api-comexstat.mdic.gov.br` | pública | 1 | preço implícito (US$/t) e origem dos fertilizantes (NCM 3102–3105) e defensivos (3808) | **500** (erro interno do servidor, autenticação do banco de dados deles); testar de novo |
| ANDA | UF; mensal; entregas de fertilizantes | PDF (detalhe para associados) | da associação | 1 | demanda de insumo (proxy de área e tecnologia) | não testado |

**Origem dos insumos.** O Brasil importa a maior parte dos fertilizantes de N, P e K (Rússia, Canadá, China,
Marrocos, Belarus e Oriente Médio são origens recorrentes; confirmar a participação no Comex Stat). O choque de
2022 mostrou a cadeia completa:

*preço internacional (Pink Sheet) × câmbio (SGS) → custo do custeio (CONAB custos) → margem do produtor →
capacidade de pagamento*

Com o Comex Stat dá para montar, por UF importadora, a concentração por país de origem (HHI). Isso vira um
indicador de risco de oferta.

### 1.4 Agro: risco, seguro e regras

| Fonte | Cobertura e granularidade | Formato e API | Licença | Esforço | Métrica do banco que explica | Teste |
|---|---|---|---|---|---|---|
| **MAPA ZARC** (tábua de risco, cultivares) | **município × cultura × solo × decêndio** | CSV, CKAN `dados.agricultura.gov.br` | CC BY | 1,5 | risco ex ante da operação (plantio fora da janela; risco de 20/30/40%); é pré-requisito do Proagro e da subvenção | 200 |
| **MAPA SISSER** (seguro rural subvencionado) | apólice × município × cultura; prêmio, importância segurada, sinistro | CSV, CKAN | CC BY | 1 | sinistralidade local (perda observada); cobertura que reduz a LGD | 200 |
| SUSEP SES | seguradora × UF; mensal | bases em ZIP | pública | 1 | sinistralidade rural agregada | 200 |
| SICOR (tipo de seguro) | contrato | OData | aberta | (já em 1.1) | parcela da carteira com Proagro ou seguro | 200 |

### 1.5 Clima e tempo

| Fonte | Cobertura e granularidade | Formato e API | Licença | Esforço | Métrica do banco que explica | Teste |
|---|---|---|---|---|---|---|
| **CHIRPS v3.0** | grade de 0,05° (~5 km); diária e mensal desde 1981 | GeoTIFF, NetCDF | pública (citar o CHC) | 2 | anomalia de chuva e SPI por município e mês | 200 no v3.0 (o caminho do v2.0 deu 404) |
| **ERA5-Land** (Copernicus CDS) | ~9 km; horária desde 1950; **umidade do solo**, temperatura, evapotranspiração | NetCDF, `cdsapi` com conta | CC BY 4.0 | 3 | calor e seca no florescimento (melhor preditor de quebra do que a chuva sozinha) | 200 no catálogo |
| **INMET** | ~600 estações; horária | JSON (a lista de estações é aberta; os dados pedem token), CSV anual | pública | 2 | validação em solo; séries longas | lista 200 (665 automáticas); dados sem token: 204 |
| **NOAA CPC ONI** | índice global; mensal | TXT | domínio público | 0,2 | regime da safra (El Niño ou La Niña) como cenário | 200 (ONI +2,46) |
| **Monitor de Secas (ANA)** | polígonos de severidade S0–S4; mensal | shapefile | pública | 1 | tratamento "seca" em painel ou DiD | 200 (SPA) |
| CEMADEN | estações e municípios monitorados; umidade do solo, alertas | CSV, mapas | pública | 2 | seca agrícola e desastres | 200 |
| S2iD / Atlas de Desastres | município; por evento (decretos de emergência) | CSV, XLSX | pública | 1 | choque de desastre; gatilho de prorrogação | não testado |

**Como o clima vira número por município.** Agregação zonal da grade (média ponderada pela área agrícola do
MapBiomas no município). As variáveis são de estação de crescimento: chuva acumulada, SPI-3, graus-dia acima de
30 °C, umidade do solo no florescimento. Usar as janelas do ZARC e do calendário da CONAB para cada cultura.
Isso segue Schlenker & Roberts (2009): o dano é não linear na temperatura. Dell, Jones & Olken (2014) mostram
como usar clima em painel sem cair em armadilhas.

### 1.6 Ambiental e ESG (regras do crédito rural)

O MCR, Cap. 2, Seção 9 ("Impedimentos sociais, ambientais e climáticos"), foi ajustado pela
**Res. CMN 5.081/2023** e pela **5.193/2024** (as duas confirmadas na API de normativos do BCB). Ele proíbe ou
restringe o crédito rural para imóveis com:
- CAR cancelado ou suspenso;
- embargo ambiental;
- sobreposição com terra indígena, unidade de conservação ou floresta pública;
- empregador no cadastro de trabalho análogo à escravidão.

O gerenciamento do risco social, ambiental e climático é exigido pela Res. CMN 4.943/2021 e pela
Res. CMN 4.945/2021 (PRSAC). Isso torna as fontes abaixo **variáveis de elegibilidade e de risco**, não só de
reputação. A literatura brasileira tem evidência causal disso: Assunção, Gandour & Rocha (2020, *Economic
Journal*) mostram que a Res. 3.545/2008 reduziu o crédito e o desmatamento na Amazônia.

| Fonte | Cobertura e granularidade | Formato e API | Licença | Esforço | Métrica do banco que explica | Teste |
|---|---|---|---|---|---|---|
| **INPE TerraBrasilis** (PRODES, DETER) | polígono; anual (PRODES) e quase diária (DETER) | WFS/WMS, shapefile | aberta (citar o INPE) | 2 | carteira sobre desmatamento recente; elegibilidade | 200 (93 camadas WFS) |
| **MapBiomas Alerta** | imóvel (alerta validado com laudo, cruzado com o CAR) | API GraphQL com cadastro | CC BY 4.0 | 2 | triagem por imóvel | não testado (estatísticas: 200) |
| **SICAR / CAR** | imóvel | shapefile por município; consulta pública com captcha | pública | 3 | situação do CAR | **falhou** (laço de redirecionamento sem navegador) |
| **IBAMA embargos** | polígono e CPF/CNPJ | CSV, shapefile (CKAN) | aberta | 1 | impedimento por embargo | 200 |
| Cadastro de empregadores (MTE) | CPF/CNPJ; semestral | PDF, XLSX | pública | 0,5 | impedimento social | não testado |

### 1.7 Macro

| Fonte | Cobertura e granularidade | Formato e API | Licença | Esforço | Métrica do banco que explica | Teste |
|---|---|---|---|---|---|---|
| **BCB Focus** | Brasil; por data de coleta (dá a safra de expectativas) | OData | aberta | 0,5 | cenário base; "surpresa" vs. expectativa | 200 |
| **IBGE** (PIB trimestral, PNAD, IPCA, PMC, PMS, PIM) | Brasil/UF; mensal e trimestral | API SIDRA | pública | 1 | renda e emprego (PD de PF), varejo | 200 |
| Ipeadata | Brasil/UF/município | OData4 | pública | 0,5 | séries longas e regionais | 200 |
| FRED / ALFRED | global | REST com chave | termos FRED | 0,3 | juros e dólar globais; safras de dados para backtest | 400 sem chave (esperado) |
| FMI (SDMX) e Banco Mundial | país | SDMX, JSON | FMI; CC BY 4.0 | 0,5 | cenário global | 200 |

### 1.8 Setores sensíveis para o crédito

| Setor | Fonte | Granularidade | Formato | Esforço | Métrica do banco que explica | Teste |
|---|---|---|---|---|---|---|
| Imobiliário | FipeZap | cidade; mensal | XLSX | 0,5 | valor da garantia (LTV), demanda | 200 |
| Imobiliário | ABECIP (SBPE, poupança) | Brasil/UF; mensal | PDF, XLSX | 1 | originação e funding (FTP) | home 200; página antiga de estatísticas 404 |
| Imobiliário | IVG-R e séries do BCB (SGS) | Brasil; mensal | JSON | 0,2 | LGD do imobiliário | via SGS |
| Veículos e máquinas | Anfavea (inclui máquinas agrícolas), Fenabrave | UF; mensal | XLSX, PDF | 1 | CDC veículos; investimento rural | Anfavea 200; Fenabrave: timeout |
| Veículos | B3 (financiamentos via SNG) | Brasil/UF; mensal | release | 0,5 | originação de CDC | não testado |
| Emprego e consignado | Novo CAGED e RAIS (PDET) | município × CNAE; mensal | microdados 7z | 2 | PD de PF; consignado privado | a página mudou (404); FTP não testado |
| Consignado INSS | Boletim da Previdência; resoluções do CNPS (teto de juros) | município; mensal | XLSX, PDF | 1 | **teto de preço** (restrição do pricing) | não testado |
| Consumo | Serasa (inadimplência; RJ inclusive de produtor rural), CNC PEIC | Brasil/UF; mensal | release | 0,5 | endividamento; RJ no agro | não testado |
| Judicial | **CNJ Datajud** (API pública) | processo, comarca | JSON (Elasticsearch) com APIKey pública do CNJ | 2 | **fluxo de recuperações judiciais rurais por comarca** (antecede a perda e a LGD) | 401 sem chave (esperado) |

### 1.9 Notícias e eventos

| Fonte | Cobertura e granularidade | Formato | Licença | Esforço | Uso | Teste |
|---|---|---|---|---|---|---|
| **CVM IPE** | todas as abertas | CSV + PDF | ODbL | 1 | data exata e texto do evento | 200 |
| **GDELT DOC 2.0** | global, em português; tom, temas e lugar | JSON | uso livre com citação | 1 | volume e tom de notícias (atenção, seca, RJ) | 429 (limite de 1 consulta a cada 5 s) |
| **RSS** (Agência Brasil, InfoMoney, Valor, Notícias Agrícolas, Canal Rural) | artigo | RSS | Agência Brasil CC BY 4.0; demais só título, link e resumo | 0,5 | eventos e narrativa no digest (o pipeline já lê RSS) | 200 (Agência Brasil, InfoMoney) |
| Normativos do BCB | norma | JSON | pública | (já no pipeline) | mudança de regra | 200 |

### 1.10 Cadeias de transmissão (do fator à métrica)

```
Clima (CHIRPS/ERA5/ONI) ─┐
ZARC (janela, risco) ────┼─▶ Produtividade (LSPA/PAM/CONAB, NDVI) ─┐
                         │                                         ├─▶ Receita do produtor ─┐
Preço (CEPEA, B3, WASDE) ┴─────────────────────────────────────────┘                        │
Fertilizante (Pink Sheet × câmbio, Comex Stat: origem) ─▶ Custo (CONAB custos) ─────────────┤
Juros (Selic, Focus) ─▶ Custo da dívida e do rolamento ─────────────────────────────────────┤
Seguro e Proagro (SISSER, SICOR) ─▶ Indenização (reduz a perda) ────────────────────────────┤
                                                                                            ▼
                                          Capacidade de pagamento ─▶ atraso, renegociação, RJ (Datajud)
                                                                                            ▼
Exposição do banco (ESTBAN por município, IF.data por região, SICOR por produto) ×  PD/LGD locais
                                                                                            ▼
                     Inadimplência e custo do crédito (SGS, SCR.data, RI) ─▶ lucro e guidance ─▶ preço da ação (B3, CVM IPE)
Regras: MCR 2-9 (CAR, embargo, PRODES), Res. 4.966 (provisão), MPs de renegociação ─▶ alteram cada elo
```

### 1.11 Chaves de ligação (o que precisa de tabela de equivalência)

- **Município**: o código IBGE de 7 dígitos é a chave universal. ESTBAN e SICOR usam códigos próprios ou nome +
  UF, e a equivalência tem de ser montada e testada.
- **Cultura**: os produtos do SICOR (ex.: "SOJA", com variações) não batem com os da PAM, do ZARC e da CONAB.
  Uma tabela de equivalência curada, com ~40 culturas, resolve.
- **Banco**: CNPJ-base, código do conglomerado no IF.data e código CVM.
- **Datas**: data de entrega do IPE (com hora) vs. pregão. O evento vale no primeiro pregão depois da entrega.
- **Grade → município**: média zonal ponderada pela área agrícola (MapBiomas).

---

## 2. Métodos para ligar fatores a resultados e a fatos relevantes

### 2.1 Estudo de evento em torno de fatos relevantes

**O que é.** Mede o retorno anormal da ação na data do anúncio, comparado com um modelo de retorno normal.
Normalmente é o modelo de mercado contra o Ibovespa, estimado numa janela anterior. É a forma padrão de dizer
"o mercado considerou isso novidade, e de que tamanho" (MacKinlay, 1997).

**Desenho para o Watch:**
- datas e texto vêm do CVM IPE;
- preços vêm da B3 (ou de fornecedor licenciado);
- janela de estimação [−130, −11] pregões; janelas de evento [0, +1] e [−1, +3];
- com muitos eventos, usar os testes de Boehmer-Musumeci-Poulsen (1991), Corrado (postos, 1989) e o ajuste de
  Kolari & Pynnönen (2010) para eventos na mesma data;
- comparar com pares (ITUB4, BBDC4, SANB11) para separar o efeito do banco do efeito do setor;
- medir a **surpresa**: guidance novo menos o anterior, ou resultado menos o consenso.

**Exemplo executado aqui (ilustrativo).** BBAS3 contra o Ibovespa, preços diários do Yahoo (não oficial, só
para protótipo). Modelo de mercado estimado com até 120 pregões antes do evento.

| Evento (fato relevante BB) | β | AR dia +1 | CAR [−1, +3] | t (ingênuo) |
|---|---|---|---|---|
| 13/05/2026, Projeções 1T26 (lucro 22–26 → 18–22; custo do crédito 53–58 → 65–70) | 1,23 | −0,69% | −1,00% | −0,37 |
| 12/08/2026, resultado 2T26 / remuneração (sem fato de guidance) | 1,10 | −3,88% | −6,89% | −2,51 |
| 11/11/2026, Projeções revisadas (custo do crédito → 80–83; lucro → 9–11) | 1,87 | **−7,83%** | **−9,30%** | −2,53 |

Com cerca de 5,73 bi de ações (conferir no Formulário de Referência) e o fechamento de R$ 17,10 antes do evento,
o CAR de −9,3% equivale a uns **R$ 9 bi** de valor de mercado. É da mesma ordem do corte de R$ 10 bi no ponto
médio do lucro de 2026.

Leituras e cuidados:
1. Em 11/11, o resultado do 3T26 e a política de remuneração 2026–27 saíram junto com o guidance. O efeito é
   do **pacote**, não só do guidance.
2. O β de 1,87 mostra que o risco da ação mudou no período. Vale usar a janela de estimação antes do choque do
   agro, ou um modelo com fatores.
3. Em 26/11/2026 a ação subiu 12,6% num dia, e a causa não foi verificada aqui. Isso mostra por que janelas
   longas misturam eventos.
4. A revisão de maio (lucro −R$ 4 bi no ponto médio) quase não mexeu no preço. Ou o mercado já esperava, ou a
   surpresa tem de ser medida contra o consenso e não contra o guidance anterior.

Script do exemplo: `es.py` no scratchpad da sessão (não versionado).

### 2.2 Painel e regressões regionais

**Pergunta típica:** quanto a inadimplência rural de uma região sobe por desvio-padrão de seca ou de queda de
preço, e com que defasagem?

**Desenho:**

$NPL_{r,t} = \sum_k \beta_k \, Choque_{r,t-k} + \gamma X_{r,t} + \alpha_r + \delta_t + \varepsilon_{r,t}$

- r = UF (SCR.data) ou município (exposição ESTBAN × perda observada SISSER/CONAB);
- efeitos fixos de região e de tempo; o efeito de tempo absorve Selic, Res. 4.966 e preço nacional;
- variação de **preço local** vem de base e frete, e de exposição: participação de cada cultura (PAM) × preço da
  cultura (CEPEA). O choque é do tipo *shift-share*, à la Bartik; ler Goldsmith-Pinkham, Sorkin & Swift (2020);
- erros-padrão de Conley (1999), porque clima é correlacionado no espaço, ou agrupados por mesorregião.

**Métrica do banco:** inadimplência agro do banco ≈ Σ (exposição do banco no município, ESTBAN) × (PD estimada
do município pelo painel). Comparar com o que o banco divulga no RI valida o elo.

### 2.3 Nowcasting

O objetivo é estimar **hoje** a inadimplência rural que só será divulgada em 2 meses (SGS e SCR.data), ou o custo
do crédito do trimestre antes do release.

Ferramentas:
- equações-ponte e MIDAS para misturar frequências diária, mensal e trimestral (Ghysels, Santa-Clara & Valkanov,
  2004);
- modelos de fatores dinâmicos (Giannone, Reichlin & Small, 2008; Bańbura et al., 2013);
- gradient boosting com validação temporal (*rolling origin*), contra o baseline ingênuo (último valor e
  sazonal).

Sinais diários e semanais:
- preço CEPEA e futuros B3;
- chuva CHIRPS e ERA5;
- volume de RJs no Datajud;
- tom de notícias no GDELT;
- Focus;
- contratações no SICOR.

Regra de ouro: usar só o que estava disponível na data (safras de dados). Focus e ALFRED guardam safras. Para
as demais fontes, o Watch deve **guardar o que coletou em cada dia**, como já faz com os digests.

### 2.4 Inferência causal (o básico que evita conclusões erradas)

| Técnica | Quando usar aqui | Exemplo | Cuidado |
|---|---|---|---|
| Diferenças em diferenças com tratamento escalonado | choque que atinge regiões em datas diferentes (seca, enchente, decreto de emergência, embargo) | municípios com seca severa (Monitor de Secas) vs. sem seca, antes e depois | o TWFE simples é viesado com efeitos heterogêneos: usar Callaway & Sant'Anna (2021), Sun & Abraham (2021) ou de Chaisemartin & D'Haultfœuille (2020); ver Goodman-Bacon (2021) |
| Controle sintético | uma unidade tratada (um estado, um banco) | RS depois das enchentes de mai/2024 vs. combinação de outros estados | precisa de pré-período longo e bom ajuste (Abadie, Diamond & Hainmueller, 2010) |
| Variável instrumental | separar o efeito da renda agrícola sobre o pagamento | chuva como instrumento da produtividade e da renda | a exclusão é discutível (chuva afeta mais coisas) |
| Regressão descontínua | regra com limiar | janela do ZARC; limites de enquadramento no Pronaf/Pronamp; data de corte de normas | manipulação perto do corte |
| DAG e lista de confundidores | sempre, antes de rodar | Selic afeta preço, câmbio e inadimplência ao mesmo tempo | não controlar mediadores (ex.: renegociação) |
| Granger e correlações defasadas | só para triagem | — | não é causalidade |

Leituras de entrada: Cunningham, *Causal Inference: The Mixtape* (2021); Huntington-Klein, *The Effect* (2022);
Angrist & Pischke (2009).

### 2.5 Grafo de conhecimento: entidade → exposição → fator

Encaixa na fase 4 do `VISION.md` (grafo de entidades e afirmações).

- **Nós:**
  - entidades: Banco, Segmento/Carteira, Produto, Região/Município, Cultura;
  - fatores: Clima, Preço, Insumo, Regra, Evento;
  - documentos: Paper, Norma, Notícia, Fato Relevante.
- **Arestas com atributos:**
  - `EXPOSTO_A` (banco → município), com peso tirado do ESTBAN, data e fonte;
  - `PRODUZ` (município → cultura), da PAM, com participação no valor da produção;
  - `SENSÍVEL_A` (cultura → fator): sinal, elasticidade, defasagem, intervalo de confiança, método, fonte;
  - `RESTRINGE` (norma → produto);
  - `ANUNCIA` (fato → métrica).
- **Afirmação** (o formato do VISION): "o choque X na região R, com defasagem L, mudou a métrica M em β
  (IC 95%), pelo método Y, nos dados D, com os limites Z".
- **Propagação**: exposição do banco a um fator = Σ peso × sensibilidade. Daí sai a pergunta respondível: "quanto
  da carteira do banco está exposto ao El Niño de 2026 em soja no MATOPIBA?".

Armazenamento: começar com tabelas (Parquet ou JSON no repo) e consultas em Python. Passar a um banco de grafo só
se as consultas pedirem.

### 2.6 Até onde confiar no LLM para propor ligações

| Tarefa | Confiança | Como verificar |
|---|---|---|
| Sugerir canais plausíveis ("El Niño → seca no MATOPIBA → soja → custeio") | **alta** para hipóteses | cada hipótese vira uma aresta *candidata*, com o teste que a confirmaria |
| Extrair afirmações de papers e notícias (sinal, magnitude, método, dados) | média | citação literal e posição no texto; checagem automática de números contra a fonte; amostra revisada por humano |
| Dizer magnitude ou elasticidade "de cabeça" | **baixa** | nunca usar sem fonte; recalcular com dados |
| Escolher o método e escrever o código | média | testes, dados sintéticos com efeito conhecido, revisão |
| Afirmar causalidade a partir de correlação | **baixa**: LLMs erram nisso de forma sistemática (Jin et al., 2023, Corr2Cause; Kıcıman et al., 2023) | exigir desenho causal explícito (§2.4) e teste placebo |

**Regra do Watch:** o LLM propõe, o código mede e a pessoa aprova. Uma aresta só passa de *candidata* a
*verificada* quando cumpre as quatro condições:
1. tem fonte primária citada;
2. foi estimada nos dados com intervalo de confiança;
3. passou num placebo (fator defasado para o futuro, região não exposta);
4. foi registrada antes de ver o resultado fora da amostra (pré-registro leve: hipótese, métrica e janela
   escritas antes).

O juiz e as perguntas de referência que já existem em `evals/` podem medir a taxa de ligações propostas pelo LLM
que sobrevivem à verificação, e essa taxa vira métrica do laço de melhoria.

### 2.7 Comparação dos métodos

| Método | Pergunta que responde | Dados mínimos | Esforço (d) | Força | Armadilha principal |
|---|---|---|---|---|---|
| Estudo de evento | o mercado viu novidade? quanto valeu? | datas (CVM IPE) + preços diários | 2 | rápido, objetivo | eventos confundidos; poucos eventos |
| Painel regional | quanto o fator move a métrica, e com que defasagem | painel UF/município × mês | 5 | usa toda a variação regional | correlação espacial; endogeneidade da exposição |
| Nowcasting | qual é o número hoje | séries de alta frequência + safras de dados | 4 | útil para gestão | vazamento de informação futura |
| DiD / controle sintético | o choque causou? | tratamento bem definido + pré-período | 4 | causalidade crível | tendências paralelas; TWFE viesado |
| Grafo exposição → fator | quem está exposto a quê | ESTBAN, PAM, sensibilidades | 6 | responde perguntas novas por composição | sensibilidades erradas se propagam |
| LLM propositor | que ligações valem testar | corpus do Watch | 3 | amplitude, velocidade | alucinação de magnitude e causalidade |

---

## 3. Precificação e medição de ganhos

### 3.1 Os métodos

- **Risk-based pricing.** taxa = FTP + prêmio de liquidez + custo operacional + **perda esperada** (PD × LGD,
  com EAD) + **custo do capital** (capital alocado × (Ke − rendimento do capital)) + margem. A PD e a LGD devem
  ser as mesmas da provisão (Res. CMN 4.966, perda esperada), ajustadas para o ciclo e o horizonte do contrato.
- **RAROC / RORAC.**
  - RAROC = (receita − custos − perda esperada + retorno do capital) × (1 − IR) / **capital econômico**;
  - RORAC usa o capital regulatório (RWA × índice-alvo);
  - cria valor se RAROC > Ke. É o padrão de bancos desde o caso Bank of America (Zaik, Walter, Kelling & James,
    1996).
- **EVA / lucro econômico.** EVA = lucro − Ke × capital alocado. É o RAROC em reais, que soma por carteira e por
  unidade. Serve para comparar áreas e acompanhar a criação de valor por trimestre.
- **FTP (preço de transferência de fundos).** Cobra de cada ativo o custo do funding de **mesmo prazo e
  indexador** (curva DI, LCA, poupança, recursos equalizados) e paga ao passivo. Sem FTP, o produto parece
  rentável só porque usa funding barato que é de outro. No rural, o FTP separa recursos obrigatórios, poupança
  rural, LCA, equalizados (Tesouro) e livres (SICOR traz a fonte de recursos).
- **CLV (valor do cliente no ciclo de vida).** VP das margens futuras × probabilidade de retenção − custo de
  aquisição. Para decisões de relacionamento: renegociar um produtor bom que teve quebra de safra pode ter CLV
  positivo mesmo com RAROC negativo na operação.
- **VPL, TIR e payback.** VPL a Ke (ou WACC do projeto) é a regra de decisão. A TIR engana em fluxos não
  convencionais e na comparação de escalas. O payback mede o risco de prazo, mas não o valor.
- **Opções reais.** Valor de esperar, pilotar, expandir ou abandonar (Dixit & Pindyck, 1994). Na prática:
  piloto pequeno com critério de parada vale mais do que o VPL estático diz quando a incerteza é alta. É o caso
  de um modelo novo de risco climático.
- **A/B e uplift.**
  - Sorteio de quem recebe a ação (ex.: abordagem antecipada de cobrança);
  - redução de variância com covariáveis pré-período (CUPED; Deng et al., 2013);
  - modelos de uplift (T-learner, causal forest) e curva Qini (Radcliffe, 2007) para mirar em quem a ação muda;
  - referência prática: Kohavi, Tang & Xu (2020).
  - Em crédito, preço e concessão têm limites regulatórios e de tratamento justo: experimentar dentro de faixas
    aprovadas, com holdout e comitê.

### 3.2 Comparação

| Método | Quando cabe | Dados necessários | Armadilhas |
|---|---|---|---|
| Risk-based pricing | preço de cada operação ou produto | PD, LGD, EAD, curva de funding, custo operacional, capital | PD de ciclo bom usada em ciclo ruim; ignorar a correlação regional (choque climático é sistêmico) |
| RAROC / RORAC | aprovar e precificar carteira ou produto; comparar segmentos | o acima + capital econômico ou regulatório | capital mal alocado (sem concentração); hurdle fixo com Selic variável |
| EVA | avaliar unidades, área e carteira no tempo | lucro gerencial + capital alocado | ajustes contábeis arbitrários |
| FTP | todo produto com funding | curvas por prazo e indexador; fonte de recursos | FTP médio em vez de casado; não cobrar a opcionalidade (pré-pagamento) |
| CLV | iniciativas de relacionamento, retenção, renegociação | margens por cliente, retenção, cross-sell | horizontes otimistas; dupla contagem com o RAROC |
| VPL / TIR / payback | projetos de investimento (sistemas, modelos, times) | fluxos incrementais, Ke | ganho não incremental; ignorar canibalização e custo de oportunidade |
| Opções reais | projetos incertos, em etapas | cenários e probabilidades, custos por etapa | modelagem complexa demais; árvore simples basta |
| A/B, holdout, uplift | medir o ganho de verdade | sorteio ou regra de seleção conhecida | contaminação entre grupos; amostra pequena; efeito que demora (inadimplência leva meses) |
| DiD (quando não dá para sortear) | piloto por região ou agência | pré-período, grupo comparável | tendências não paralelas |

### 3.3 Conjunto padrão recomendado

1. **Produto ou operação de crédito:** risk-based pricing com **FTP casado** e PD/LGD da 4.966 ajustadas ao
   cenário. A decisão é **RAROC ≥ Ke**, com Ke = Selic esperada (Focus) + prêmio de risco do banco. Reportar
   também o EVA em R$.
2. **Iniciativa ou projeto:** **VPL a Ke** em três cenários, mais payback. Quando a incerteza for alta, desenhar
   como **opção real**: piloto, gatilho e escala.
3. **Medição:** **holdout aleatório** sempre que possível, ou DiD com pré-registro quando não for. Métrica
   primária em R$ de perda evitada ou de margem, mais métricas intermediárias que respondem rápido (atraso de
   30 dias, taxa de renegociação).
4. **Relacionamento:** CLV só como complemento, para não descartar clientes bons em choques transitórios.

---

## 4. Framework de proposta

### 4.1 Estrutura de cada proposta

```yaml
id: prop-AAAA-NN
titulo: ...
dono: área/pessoa; patrocinador
1_motivacao:          # o problema, em números (com fonte e data)
2_racional:           # a cadeia fator → métrica, com fontes (links do Watch: papers, normas, dados, fatos relevantes)
  evidencias: [ {afirmacao, fonte, método, força: forte|média|fraca} ]
3_premissas:          # cada uma com valor base, faixa, fonte e "como saberemos se é verdade"
  - {id: P1, descricao, base, pessimista, otimista, fonte, teste}
4_retorno_esperado:   # derivado das premissas, por fórmula explícita (não um número solto)
  formula: ganho = f(P1..Pn)
  vpl, tir, payback, roi, raroc (se produto), ke usado
5_sensibilidade:      # tornado (uma premissa de cada vez), cenários, ponto de equilíbrio de cada premissa
  se_P1_falsa: o que muda na decisão
6_custos:             # capex, opex, custo de oportunidade (margem perdida, capital), custo de mudança
7_tempo_ate_retorno:  # quando o primeiro R$ aparece; quando a métrica primária fica estatisticamente legível
8_medicao:            # desenho (A/B, holdout, DiD), métrica primária e secundárias, tamanho de amostra, duração, critério de parada
9_riscos:             # modelo, regulatório (MCR, 4.966, tratamento justo), reputacional, execução, dados
10_decisao:           # etapa 1 (piloto) com gatilho para etapa 2 (escala) ou abandono
```

Regras:
- Cada número vem com fonte ou com o rótulo **premissa**.
- O retorno sai das premissas por uma fórmula que se pode recalcular.
- Para cada premissa, registrar o valor em que a decisão muda.

### 4.2 Do paper à reprodução e à re-precificação

1. **Achar.** Usar o Watch (OpenAlex, arXiv e o catálogo de repositórios em `data/papers/`). O filtro é "tem
   código e dados": GitHub ou Hugging Face, pacotes de replicação (openICPSR/AEA, Dataverse, Zenodo).
2. **Reproduzir como publicado.** Os mesmos dados e o mesmo código devem dar os números do paper, dentro da
   tolerância. Registrar as diferenças. Sem reprodução, a afirmação fica como *não verificada* no grafo.
3. **Transportar.** Reestimar com dados brasileiros (fontes da §1), mantendo o desenho. Ex.: dano não linear de
   temperatura (Schlenker & Roberts) com ERA5 e PAM por município.
4. **Testar a hipótese** fora da amostra: períodos e regiões não usados. Incluir placebo e comparação com o
   baseline ingênuo.
5. **Re-precificar.** Passar a PD/LGD (ou a elasticidade) nova pela calculadora de RAROC e VPL da §3, e ver
   quanto muda a taxa mínima ou o ganho.
6. **Plano de medição.** Escrever a proposta (§4.1) com o holdout ou o DiD e a métrica primária antes de
   implantar.
7. **Registrar** no grafo como afirmação, com o status reproduzida / transportada / testada / medida em
   produção.

### 4.3 Exemplo ilustrativo 1: monitor de risco de safra para o custeio

> **Ilustração.** Os números de mercado vêm das fontes indicadas. Tamanho de carteira, PD, LGD, eficácia e
> custos são **premissas hipotéticas** escolhidas só para mostrar o método. Não são dados de nenhum banco.

**Motivação.** Os números públicos (§0):
- a inadimplência rural PF do sistema foi de 0,80% para 9,59% em quatro anos, e para 17,21% na parcela com taxa
  de mercado;
- um banco grande revisou o custo do crédito em +R$ 14 bi (ponto médio) num trimestre, citando o agro;
- há um El Niño forte (ONI +2,46) no plantio da safra 2026/27.

**Racional.** Combinar, por município × cultura e toda semana:
- o ZARC (janela e risco);
- a anomalia de chuva e umidade do solo (CHIRPS/ERA5);
- o NDVI (SATVeg);
- a estimativa de safra (LSPA/CONAB);
- a margem do produtor (CEPEA − custos CONAB, com fertilizante da Pink Sheet × câmbio);
- o fluxo de RJs (Datajud).

Isso dá um escore de risco de safra que se aplica à exposição do banco (ESTBAN/SICOR, ou dados internos). Os
usos são três:
- (a) agir **antes** do vencimento nas operações sinalizadas (prorrogação com reforço de garantia, acionamento
  de seguro e Proagro, cobrança antecipada);
- (b) ajustar limite e preço do próximo custeio;
- (c) alimentar o estágio 2 da 4.966 de forma prospectiva.

**Premissas (hipotéticas):**

| Premissa | Pessimista | Base | Otimista | Como testar |
|---|---|---|---|---|
| P1 carteira de custeio exposta | R$ 100 bi | R$ 100 bi | R$ 100 bi | ESTBAN/SICOR ou dado interno |
| P2 fração sinalizada como alto risco | 10% | 15% | 20% | backtest do escore em 2021–2026 |
| P3 PD da fração sinalizada | 10% | 12% | 15% | inadimplência observada dos sinalizados no backtest |
| P4 LGD | 40% | 45% | 50% | recuperação histórica; cobertura de seguro (SISSER) |
| P5 redução relativa da perda esperada nos sinalizados pela ação antecipada | 2% | 5% | 8% | **holdout** (só é conhecida depois do piloto) |
| P6 redução da perda na originação nova (R$ 60 bi/ano, PD 6%), líquida da margem perdida | 0,5% | 1,0% | 1,5% | piloto com teto de preço e limite por escore |
| Custos | R$ 4 mi de construção + R$ 3 mi/ano | igual | igual | orçamento |
| Ke | 16% a.a. | 16% | 16% | Selic (13,75%) + prêmio |

**Retorno derivado.** Perda esperada sinalizada = P1 × P2 × P3 × P4. Ganho = (essa perda × P5) + (originação ×
PD × LGD × P6). O primeiro ano conta 50% do ganho (rampa). VPL em 3 anos a 16%:

| Cenário | Perda esperada sinalizada | Ganho/ano | VPL (3 anos) | ROI (3 anos) |
|---|---|---|---|---|
| Pessimista | R$ 400 mi | R$ 16 mi | R$ 18 mi | 2,1× |
| Base | R$ 810 mi | R$ 57 mi | R$ 92 mi | 9,9× |
| Otimista | R$ 1,5 bi | R$ 144 mi | R$ 251 mi | 27× |
| **Não funciona** (P5 = P6 = 0) | — | 0 | **−R$ 11 mi** | — |

**Sensibilidade.** A decisão depende quase só de P5. No cenário base sem P6, o VPL é zero com P5 ≈ **0,7%**.
Se a ação antecipada reduzir a perda em menos que isso, o projeto não se paga. A perda máxima (R$ 11 mi) é
pequena diante do ganho possível. É um caso típico de **opção real**: piloto de 6 meses em 2 UFs com holdout,
custando cerca de R$ 1,5 mi, e escala só se o P5 medido passar de 0,7% com intervalo de confiança.

Se P2 e P3 estiverem errados (o escore não discrimina), o ganho em (a) some e (b) vira perda de margem. O
backtest do escore (AUC e calibração contra a inadimplência observada) é o **portão** antes do piloto.

**Tempo até o retorno.** Os primeiros sinais (atraso de 30 dias, adesão à renegociação) aparecem em 3 meses. A
perda evitada só é legível depois do vencimento da safra: 6 a 9 meses.

**Medição.**
- Holdout aleatório de 20% das operações sinalizadas, sem ação antecipada.
- Métrica primária: perda (atraso > 90 dias × LGD) em 12 meses.
- Secundárias: taxa de prorrogação, acionamento de seguro e margem.
- DiD entre agências, para efeitos que vazam no nível da agência.

### 4.4 Exemplo ilustrativo 2: preço do custeio com taxa de mercado ajustado ao risco climático

> **Ilustração.** O FTP é derivado da Selic pública (SGS 432 = 13,75%). PD, LGD, custo operacional, capital
> e alíquota são **premissas hipotéticas**. Vale para a parcela com taxa livre (LCA ou recursos livres), não para
> a equalizada do Plano Safra, cuja taxa é regulada.

**Motivação.**
- A parcela com taxas de mercado tem a pior inadimplência do rural PF (17,21%, SGS 21146).
- O estudo de evento (§2.1) indica que o mercado pune o banco quando o custo do crédito agro surpreende.
- Uma taxa única para todo o país faz o banco subsidiar as regiões de maior risco climático com as de menor
  risco, e atrai justamente o risco que ele não quer (seleção adversa).

**Premissas:**
- FTP = 12,5% a.a. (≈ 91% do CDI);
- prêmio de liquidez de 0,3%;
- custo operacional de 1,0%;
- capital econômico de 10,5% da exposição, remunerado a 13%;
- IR + CSLL de 40% (a confirmar para o tipo de instituição);
- Ke = 16%.

**RAROC e taxa mínima por grupo de risco:**

| Grupo de risco climático | PD | LGD | Perda esperada | Taxa mínima (RAROC = Ke) | RAROC se cobrar 17% para todos |
|---|---|---|---|---|---|
| Baixo (ZARC 20%, sem anomalia prevista) | 3% | 35% | 1,05% | 16,3% a.a. | 20,1% |
| Médio | 6% | 40% | 2,40% | 17,6% a.a. | 12,4% |
| Alto (seca prevista pelo ENSO/ERA5, ZARC 40%) | 12% | 45% | 5,40% | 20,6% a.a. | **−4,8%** |
| Alto **com seguro** (LGD → 20%) | 12% | 20% | 2,40% | 17,6% a.a. | 12,4% |

**Leitura.**
- A taxa única de 17% cria valor no grupo de baixo risco e destrói no de alto.
- A diferença de preço justa entre os extremos é de cerca de 4,3 p.p.
- O seguro vale cerca de 3 p.p. de taxa no grupo de alto risco. Isso dá base para exigir seguro ou para
  subsidiar o prêmio em vez de dar desconto de taxa.

**O que muda se a premissa estiver errada:**
- Se a PD do grupo alto for 8% em vez de 12%, a taxa mínima cai para cerca de 18,8%.
- Se o Ke subir 2 p.p. (Selic mais alta), todas as taxas mínimas sobem cerca de 0,35 p.p. O efeito é pequeno
  diante da diferença de risco. O que manda é a PD por região, e é aí que entram os dados da §1.

**Medição.**
- Experimento de preço dentro de faixas aprovadas (teste por agência ou por município, sorteado).
- Métricas: volume, mix de risco da originação, inadimplência em 12 meses e RAROC realizado.
- Comitê e revisão de tratamento justo antes de começar.

---

## 5. Viabilidade

| Bloco | Viabilidade | Por quê |
|---|---|---|
| Resultados do sistema e do banco (SGS, SCR.data, IF.data, CVM) | **alta** | APIs estáveis, licença aberta, testadas |
| Exposição por município (ESTBAN, SICOR) | alta | aberta; falta acertar a URL nova do ESTBAN e a equivalência de códigos |
| Safra e "o que se planta onde" (LSPA, PAM, ZARC, SISSER) | **alta** | APIs e CKAN com CC-BY |
| CONAB | média | o servidor de downloads falhou na verificação TLS; os PDFs e planilhas da página gov.br funcionam |
| Preços (CEPEA, Pink Sheet) | alta | um download por dia ou mês; citar a fonte |
| B3 | média | arquivos públicos, mas redistribuição restrita; para produção, licenciar |
| Comex Stat | média | API boa, mas fora do ar no teste (erro do servidor) |
| Clima em grade (CHIRPS, ERA5) | média | aberto, mas exige processamento geoespacial (grades → município); ERA5 precisa de conta |
| Ambiental (PRODES/DETER, embargos, MapBiomas) | alta | WFS e CKAN abertos |
| CAR | **baixa** | captcha; dentro do banco a validação vem da integração oficial |
| Notícias | média | RSS e GDELT abertos, mas com limite de taxa; texto completo da imprensa paga fica fora |
| Inadimplência por banco × município | **inviável com dado público** | só com dado interno, ou como estimativa (exposição ESTBAN × PD regional) |
| Ligação ao pipeline atual | alta | stdlib Python, RSS e normativos do BCB já existem; os dados novos são tabulares e cabem em `data/` |

---

## 6. Recomendação (em fases, com esforço aproximado)

| Fase | O que entrega | Esforço |
|---|---|---|
| **0. Base rápida** | coletores incrementais de SGS (≈ 30 séries de crédito, rural e juros), Focus, IF.data (agro por banco e região), CVM IPE (fatos relevantes de bancos) e ONI; equivalências município, cultura e banco | 4 d |
| **1. Painel agro municipal** | ESTBAN + SICOR (exposição); PAM, LSPA e CONAB (safra); ZARC e SISSER (risco e seguro); CHIRPS (chuva por município); CEPEA e Pink Sheet (preço e insumo); SCR.data (inadimplência por UF) | 10 d |
| **2. Métodos** | biblioteca de estudo de evento para os fatos relevantes dos bancos listados (com pares e surpresa); painel UF × mês da inadimplência rural contra clima e preço; nowcast mensal da SGS 21148 com backtest | 8 d |
| **3. Grafo e LLM verificado** | tabelas de exposição e sensibilidade; LLM que propõe arestas a partir do corpus do Watch; verificação automática (fonte, estimativa, placebo); métrica de sobrevivência das ligações no `evals/` | 6 d |
| **4. Propostas** | modelo §4.1 como esquema JSON; calculadora de RAROC, VPL e cenários (tornado, ponto de equilíbrio); as 2 propostas desta página reescritas com dados reais; plano de medição | 5 d |
| **Depois** | ERA5 (umidade do solo), NDVI, Datajud (RJs rurais), GDELT; trocar estimativas públicas por dado interno ao levar para o trabalho | 8–10 d |

**Total até a fase 4: ≈ 33 dias-pessoa.** Primeiros passos concretos, nesta ordem:
1. SGS + IF.data + CVM IPE: em 2 dias já dá a série "inadimplência agro do sistema vs. do banco vs. reação da
   ação".
2. ESTBAN + PAM: o mapa de exposição do banco por cultura.
3. CHIRPS + ZARC: o primeiro fator climático por município.

Um tema novo do Watch, "Risco de crédito agro e clima", com as consultas do OpenAlex e as normas do MCR, abastece
o lado da evidência (papers e normas) ao mesmo tempo.

---

## 7. Riscos e ressalvas

- **Quebras estruturais.** A Res. 4.966 (2025), as renegociações por MP (2025–26) e as mudanças no MCR alteram a
  relação entre fator e inadimplência. Modelar com dummies de regime e validar fora da amostra depois da quebra.
- **Causalidade falsa.** Selic, câmbio e preço de grãos se movem juntos. Sem desenho causal (§2.4), a "ligação"
  é correlação. O LLM agrava esse risco se for usado como fonte de magnitude.
- **Granularidade enganosa.** O ESTBAN registra a carteira na agência, não no imóvel. Produtores grandes
  contratam em outro município. Usar o SICOR (município do empreendimento) para conferir.
- **Defasagem e revisão.** SCR.data sai com ~60 dias, a PAM com ~10 meses, e o LSPA e a CONAB revisam mês a mês.
  É preciso guardar as safras de dados para não usar informação futura.
- **Licenças.** B3 e parte da imprensa restringem a redistribuição. O Yahoo não serve para produção. CEPEA e
  FipeZap pedem citação. Manter a licença no JSON e respeitá-la no site.
- **Instabilidade de servidores públicos.** No teste, CONAB (TLS), Comex Stat (erro 500), ESTBAN (URL mudou),
  CAGED (página mudou) e IF.data (500 num parâmetro) falharam. Os coletores precisam de retentativa, alerta e
  cópia local do último dado bom (como já faz a retrospectiva do repo).
- **Regulatório e de conduta.** Preço por região e risco climático precisa de governança: tratamento justo,
  crédito direcionado com taxa regulada, e LGPD se entrar dado de imóvel ou CPF. Experimentos de preço só dentro
  de faixas aprovadas.
- **Estratégia exposta.** As perguntas sobre exposição do banco revelam estratégia. No trabalho, só com
  provedores de IA aprovados (`VISION.md`, riscos).

---

### Referências citadas

- Abadie, A., Diamond, A. & Hainmueller, J. (2010). Synthetic control methods for comparative case studies. *JASA*.
- Angrist, J. & Pischke, J.-S. (2009). *Mostly Harmless Econometrics*. Princeton.
- Assunção, J., Gandour, C. & Rocha, R. (2020). The effect of rural credit on deforestation: evidence from the Brazilian Amazon. *Economic Journal*.
- Bańbura, M., Giannone, D., Modugno, M. & Reichlin, L. (2013). Now-casting and the real-time data flow. *Handbook of Economic Forecasting*.
- Boehmer, E., Musumeci, J. & Poulsen, A. (1991). Event-study methodology under conditions of event-induced variance. *JFE*.
- Callaway, B. & Sant'Anna, P. (2021). Difference-in-differences with multiple time periods. *J. Econometrics*.
- Conley, T. (1999). GMM estimation with cross sectional dependence. *J. Econometrics*.
- Corrado, C. (1989). A nonparametric test for abnormal security-price performance in event studies. *JFE*.
- Cunningham, S. (2021). *Causal Inference: The Mixtape*. Yale.
- de Chaisemartin, C. & D'Haultfœuille, X. (2020). Two-way fixed effects estimators with heterogeneous treatment effects. *AER*.
- Dell, M., Jones, B. & Olken, B. (2014). What do we learn from the weather? *JEL*.
- Deng, A., Xu, Y., Kohavi, R. & Walker, T. (2013). Improving the sensitivity of online controlled experiments by utilizing pre-experiment data (CUPED). *WSDM*.
- Dixit, A. & Pindyck, R. (1994). *Investment under Uncertainty*. Princeton.
- Ghysels, E., Santa-Clara, P. & Valkanov, R. (2004). The MIDAS touch: mixed data sampling regression models.
- Giannone, D., Reichlin, L. & Small, D. (2008). Nowcasting: the real-time informational content of macroeconomic data. *JME*.
- Goldsmith-Pinkham, P., Sorkin, I. & Swift, H. (2020). Bartik instruments: what, when, why, and how. *AER*.
- Goodman-Bacon, A. (2021). Difference-in-differences with variation in treatment timing. *J. Econometrics*.
- Huntington-Klein, N. (2022). *The Effect*. CRC.
- Jin, Z. et al. (2023). Can large language models infer causation from correlation? (Corr2Cause). arXiv:2306.05836.
- Kıcıman, E., Ness, R., Sharma, A. & Tan, C. (2023). Causal reasoning and large language models. arXiv:2305.00050.
- Kohavi, R., Tang, D. & Xu, Y. (2020). *Trustworthy Online Controlled Experiments*. Cambridge.
- Kolari, J. & Pynnönen, S. (2010). Event study testing with cross-sectional correlation of abnormal returns. *RFS*.
- MacKinlay, A. C. (1997). Event studies in economics and finance. *JEL*.
- Radcliffe, N. (2007). Using control groups to target on predicted lift (Qini). *Direct Marketing Analytics Journal*.
- Schlenker, W. & Roberts, M. (2009). Nonlinear temperature effects indicate severe damages to U.S. crop yields. *PNAS*.
- Sun, L. & Abraham, S. (2021). Estimating dynamic treatment effects in event studies with heterogeneous treatment effects. *J. Econometrics*.
- Zaik, E., Walter, J., Kelling, G. & James, C. (1996). RAROC at Bank of America. *J. Applied Corporate Finance*.
