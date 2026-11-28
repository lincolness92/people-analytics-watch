# Instituições financeiras: dicionário de dados (`data/ifs/`)

Camada genérica de dados públicos sobre instituições financeiras, feita para diagnóstico competitivo com evidência.
O primeiro uso é um diagnóstico do Banco do Brasil, mas nada no código é específico de um banco: o que entra, como cada
métrica é achada e como as séries são montadas está em `config/ifs/*.json`. Código em `src/pawatch/ifs/`, só stdlib
(`csv`, `json`, `sqlite3`, `zipfile`, `gzip`). Fontes mapeadas em `docs/sources/financas-instituicoes.md` e
`docs/sources/fatores-externos-e-propostas.md`.

```
python -m pawatch ifs collect [--source ifdata,estban,km1,ipe] [--since AAAA-MM] [--refresh] [--reparse]
python -m pawatch ifs registry      # cadastro mestre (precisa do IF.data da data-base mais recente)
python -m pawatch ifs shares        # participação de mercado + resumo
```

Ordem na primeira vez: `collect --source ifdata` → `registry` → `collect --source estban,km1,ipe` → `shares`. Depois,
`collect` e `shares` bastam (o `registry` só precisa rodar de novo quando sair uma data-base nova do IF.data ou mudar a
configuração). Nenhum comando chama LLM, então nenhum abre trace (`src/pawatch/trace.py`).

## Regras gerais

- **Unidades.** Valores monetários em **R$ (unidades)**, como vêm nos arquivos do IF.data e do ESTBAN (o site do IF.data
  mostra em R$ mil). O KM1 é convertido para R$ (ver abaixo). Índices do IF.data (`indice_basileia`) em fração
  (0,139 = 13,9%); índices do KM1 em **%**. Contagens (agências, clientes) em unidades. Participações (`share`) em fração.
- **Períodos.** `period` = AAAAMM da data-base (IF.data: trimestral, 03/06/09/12; ESTBAN: mensal). KM1: `quarter` =
  `AAAA-T` e `period` equivalente (2026-2 → 202606).
- **Proveniência.** Cada tabela leva a URL e a data de coleta, por linha ou por arquivo de proveniência ao lado. Os
  arquivos brutos ficam em `data/ifs/raw/` (comprimidos, com um `.meta.json` com URL e data) e **não vão para o git**;
  a base completa `data/ifs/ifs.sqlite` também não (é refeita dos brutos com `collect --source ifdata --reparse`).
- **Nada é emendado.** Quebras de série vão como flag junto do número (`cosif`, `crosses_cosif_break`,
  `perimeter_change`, `absent`). Não há interpolação nem ajuste.
- **Coleta educada.** Chamadas sequenciais, com pausa de 1 s, pelo `http.py` do projeto (retentativas com espera).
  Incremental: o IF.data só baixa data-base nova ou regerada (o índice traz a data de geração de cada relatório; em
  dezembro o BCB republica os quatro trimestres anteriores); o ESTBAN só meses novos (e tenta de novo, por 12 meses, os
  que ainda não saíram); o KM1 só URLs novas do catálogo; o IPE baixa o ano corrente toda vez e os anteriores se faltarem.

## Quebras e ressalvas que importam

1. **Cosif 2025 (03/2025).** Res. CMN 4.966 e IN BCB 426–433: o IF.data passou a ter um índice próprio
   (`relatorios2025a2030`) e novos campos contábeis (outros ids). As métricas são achadas pelo **nome** do relatório e
   da coluna (regex em `config/ifs/ifdata.json`), então a série continua, mas a definição de ativo, passivo, carteira
   e resultado mudou. Toda linha tem `cosif` = `cosif_antigo` | `cosif2025`; toda variação diz se `crosses_cosif_break`.
2. **Perímetro do crédito (03/2025).** Até 2024-12 os relatórios de carteira por modalidade, porte, região e clientes
   saíam no **conglomerado financeiro (1005)**; desde 2025-03 só no **prudencial (1009)**. A série `credito` usa um e
   depois o outro (`level` em cada linha; `perimeter_change` nas variações de 3 e 5 anos). No total (Resumo), onde há
   os dois, a diferença entre 1005 e 1009 é pequena para os grandes (BB 06/2026: ativo 2.583,8 × 2.583,6 bi).
3. **Conglomerado prudencial antigo × novo (09/2023).** O nível 1004 (regra antiga) vai até 2023-06; o 1009 (Res. CMN
   4.950) começa em 2023-09. A série `prudencial` encadeia os dois.
4. **Falhas de cadastro do BCB.** Em algumas datas uma entidade aponta para um conglomerado financeiro que não existe no
   cadastro 1005 (ex.: Volkswagen em 2025-06). A instituição some do nível naquela data, junto do total. As variações
   marcam `absent = gap_base|gap_latest`, deixam `delta_pp` vazio e não entram no ranking de ganhadores e perdedores.
5. **Sistemas cooperativos.** Sicredi e Sicoob são a soma bruta do banco cooperativo, das centrais e das singulares
   cujo nome contém o padrão (`name_regex` em `config/ifs/registry.json`). Ativo, captações, depósitos e PL têm dupla
   contagem (depósito da singular na central e no banco); as carteiras de crédito por cliente, não. Índices (unidade `ratio`, como o de Basileia) não
   são somáveis: para instituições com mais de uma entidade no nível, a linha de índice não é gravada. Cooperativa sem o
   nome do sistema na razão social fica fora.
6. **ESTBAN: linhas com o total do banco embutido.** Desde 2025 (Itaú em Brasília em 2025-09 e 2025-11 a 2026-03) e
   para quase todos os bancos desde **2026-04**, a linha de um município (quase sempre Brasília) traz o valor do
   município **mais o total nacional do banco**. Sem tratamento, o crédito do sistema no ESTBAN dobra em 2026-04
   (6,2 → 12,5 tri). O coletor detecta a assinatura (a UF salta mais da metade do total do banco no mês anterior, o
   total publicado do banco quase dobra, e "valor real = (linha − resto do país)/2" fica perto do mês anterior) e
   corrige a linha; num mês em que ≥ 20 bancos mostram o padrão no mesmo município, corrige também o banco cuja única
   linha relevante é esse município (ex.: Banco Sicoob). Bruto e corrigido ficam em `data/ifs/estban/fixes.csv`.
   Bancos de uma linha só que fogem disso não são corrigidos.
7. **ESTBAN: bancos que somem num mês.** Itaú em 2023-06, Santander em 2025-03, BTG em 2019-12, C6 em 2024-03; o
   arquivo de 2023-07 tem só parte dos bancos. Esses meses não entram nas comparações: usa-se o mês completo anterior
   (`month_used` em `regional_estban.csv`; `summary.json → estban.months_replaced` e `incomplete_months`).
8. **ESTBAN: local de registro, não do cliente.** O saldo fica no município da dependência que registrou a operação.
   Carteiras centralizadas na sede (BB e Caixa em Brasília, Bradesco em Osasco, Itaú em São Paulo) inflam o
   Centro-Oeste e o Sudeste. Para a região do tomador, use `reg_*` do IF.data.
9. **ESTBAN** só cobre bancos com agência: não há cooperativas nem bancos digitais sem agência. A participação regional
   do ESTBAN é dentro desse universo. Para os digitais, use o crédito por região do IF.data (`reg_*`).
10. **Lucro e tarifas** do IF.data são **acumulados no semestre**: março = jan–mar, junho = jan–jun, setembro = jul–set,
   dezembro = jul–dez. Não somar trimestres.
11. **Carteira do Resumo × carteira por modalidade.** `carteira_credito` (Resumo) é a carteira classificada (até 2024) /
   carteira de crédito (2025+) do balanço; `pf_total + pj_total` vem dos relatórios de crédito (SCR, com o exterior
   à parte). Os números não batem exatamente, e nenhum dos dois é a "carteira ampliada" dos releases.

12. **Porte do tomador instável em alguns emissores.** A carteira PJ do PagBank vai e volta entre "Micro" e
    "Indisponível" de um trimestre para o outro (R$ 0,5 mi em 2025-06, R$ 39,9 bi em 2025-09, R$ 0,1 bi em 2026-03,
    R$ 44,4 bi em 2026-06). As séries `pj_micro`…`pj_grande` repetem o que o banco informou; leia a variação de
    participação por porte junto com a série da instituição.
13. **Pilar 3 (KM1).** Emissores publicam em latin-1, com caractere de controle ou em quase-JSON (Santander 2021-3: `;`
    e vírgula decimal); o leitor aceita os três. Documento que diz um trimestre ainda não encerrado é descartado (Safra
    publicou em "2026-4" os números de 2025-4). Há URLs do catálogo que dão 404, 422 ou erro de certificado
    (Sicredi, Sicoob, Stellantis, BofA, BNP, Daycoval, BNB, Mercantil em parte do período): ficam em `state.json` e
    só são tentadas de novo com `--refresh`.

## Arquivos versionados

### `data/ifs/registry.json` — cadastro mestre

Uma entrada por instituição ou conglomerado. Quem entra (`config/ifs/registry.json`): as 40 maiores por ativo total no
nível prudencial da data-base mais recente, mais as listadas em `include` (bancos digitais e instituições de
pagamento) e os sistemas cooperativos. Topo do arquivo: `generated_at`, `as_of` (data-base usada), `selection`,
`sources` (arquivos do IF.data com URL e data, cadastros da CVM, API da GLEIF, catálogo DASFN).

| Campo | Fonte | Descrição |
|---|---|---|
| `id` | curadoria ou derivado do nome | identificador estável usado em todas as tabelas |
| `name` | curadoria ou IF.data | nome curto |
| `kind` | IF.data (TD) | `conglomerado`, `independente` ou `sistema cooperativo` |
| `ifdata_name` | IF.data cadastro 1009 | nome do conglomerado prudencial |
| `type`, `tcb` | IF.data (TCB) | b1 banco comercial/múltiplo com carteira comercial/caixa; b2 múltiplo sem carteira comercial, investimento ou câmbio; b3S/b3C cooperativas; b4 desenvolvimento; n1 não bancário de crédito; n2 mercado de capitais; n4 instituição de pagamento |
| `segment` | IF.data (SR) | segmento prudencial S1–S5 (Res. CMN 4.553/2017) |
| `control_type` | IF.data (TC) | público, privado nacional, privado com controle estrangeiro |
| `uf`, `city` | IF.data | sede do conglomerado |
| `ifdata.prudential_code` | IF.data | código do conglomerado prudencial (C00xxxxx) na data `as_of` |
| `ifdata.prudential_entity` | IF.data | código numérico da entidade no nível 1009 (1.000.000.000 + número) |
| `ifdata.financial_codes` | IF.data | conglomerado(s) financeiro(s) dos membros |
| `ifdata.name_regex` | config | só sistemas: padrão de nome das cooperativas do sistema |
| `leader_cnpj8` | config `include`/curadoria, senão o maior membro por ativo | CNPJ-base que ancora a instituição no tempo (ver `membership`) |
| `leader_cnpj14`, `leader_cnpj`, `leader_cnpj14_source` | CVM, ou calculado | CNPJ completo da matriz. Sem registro na CVM, é o CNPJ-base + 0001 + dígitos verificadores calculados |
| `leader_name` | IF.data 1006 | razão social do líder |
| `members[]` | IF.data 1006 | entidades autorizadas do conglomerado: `cnpj8`, `name`, `tcb`, `ti` (tipo de instituição), `total_assets` (R$). Sistemas: as 25 maiores e `members_count` |
| `total_assets`, `rank_assets` | IF.data Resumo 1009 | ativo total (R$) e posição na data `as_of` (sistemas: soma bruta, sem posição) |
| `cvm[]` | CVM `cad_cia_aberta.csv` e `cad_cia_estrang.csv` | companhias abertas cujo CNPJ-base é de um membro (ou em `cvm_extra` da curadoria): `code`, `name`, `cnpj14`, `status`, `sector`, `control` (controle acionário declarado), `register`, `matched` |
| `lei` | GLEIF (`filter[entity.registeredAs]` = CNPJ formatado do líder) | `lei`, `legal_name`, `status`, `source` (URL), `fetched_at` |
| `lei_listed` | GLEIF | LEI da holding ou banco listado, quando é outra entidade (ex.: Itaú Unibanco Holding) |
| `pillar3` | catálogo DASFN | `cnpj14` que publica o KM1 (preferência: o líder), `name`, `resources` (nº de recursos KM1 no catálogo) |
| `tickers`, `controller` | **curadoria manual** | listados em `curated_fields`; conferir antes de uso externo |

`membership(con, registry, period, level)` (em `registry.py`) liga, em qualquer data-base, os códigos do IF.data às
instituições: acha o líder (ou, se ele ainda não existia, outro membro) no cadastro individual daquela data, pega o
conglomerado prudencial dele e daí os códigos no nível pedido (1004/1009: o prudencial; 1005: os conglomerados
financeiros dos membros e as independentes, como as instituições de pagamento; 1006: os membros). Sistemas: mais as
entidades cujo nome casa com `name_regex`. Assim a série acompanha fusões e trocas de código sem mapa manual.

### `data/ifs/ifdata/values.csv` — valores das instituições do cadastro

Uma linha por `period × inst_id × metric × series`. Só instituições do cadastro (o total do sistema está em
`system_totals.csv`; todas as entidades, na base local).

| Coluna | Descrição |
|---|---|
| `period` | data-base AAAAMM |
| `inst_id` | `registry.json` |
| `metric` | ver a tabela de métricas abaixo |
| `series` | `financeiro`, `credito` ou `prudencial` (config/ifs/ifdata.json → `series`) |
| `level` | nível do IF.data usado naquela data (1004, 1005, 1009) |
| `value` | soma das entidades da instituição no nível (R$, contagem ou fração conforme `unit`) |
| `unit` | `BRL`, `count`, `ratio` |
| `cosif` | `cosif_antigo` (até 2024-12) ou `cosif2025` |

As métricas `ativo_total`, `carteira_credito`, `captacoes`, `patrimonio_liquido`, `lucro_liquido` e `indice_basileia`
saem também na série `prudencial` (config/ifs/shares.json → `also_prudential`), para ranking no perímetro prudencial.

### `data/ifs/ifdata/system_totals.csv`

`period, metric, series, level, total, entities, registry_value, others_value, unit, cosif`: total do sistema (soma de
todas as entidades do nível), número de entidades com valor, parte das instituições do cadastro e dos demais.

### `data/ifs/ifdata/provenance.json`

Por data-base: `generated` (datas de geração dos relatórios no índice do BCB), `extracted_at`, `files[]` (`file`,
`url`, `fetched_at`, `generated`) e `columns` (por nível e métrica: relatório, caminho da coluna e `lid` encontrados).
É o registro de onde cada número saiu.

### Métricas do IF.data (`config/ifs/ifdata.json`)

Relatório e coluna são regex sobre o nome do relatório e o caminho da coluna (`Pai > Filho`). Série: `financeiro`
(1005 em todo o período), `credito` (1005 até 2024-12, 1009 desde 2025-03), `prudencial` (1004 → 1009). `share` diz
se entra no cálculo de participação.

| id | O quê | Relatório | Série | Unidade |
|---|---|---|---|---|
| `ativo_total` | Ativo total | Resumo | financeiro | R$ |
| `carteira_credito` | Carteira de crédito (classificada até 2024) | Resumo | financeiro | R$ |
| `captacoes` | Captações (depósitos + compromissadas + títulos + repasses) | Resumo | financeiro | R$ |
| `patrimonio_liquido` | Patrimônio líquido | Resumo | financeiro | R$ |
| `lucro_liquido` | Lucro líquido, acumulado no semestre | Resumo | financeiro | R$ (sem share) |
| `indice_basileia` | Índice de Basileia | Resumo | prudencial | fração (sem share) |
| `agencias`, `postos` | Número de agências e de postos de atendimento | Resumo (campo de cadastro) | financeiro | contagem |
| `depositos_total` | Depósitos (a) | Passivo | financeiro | R$ |
| `depositos_vista`, `depositos_poupanca`, `depositos_prazo` | Depósitos à vista (a1), de poupança (a2), a prazo (a4) | Passivo | financeiro | R$ |
| `lci`, `lca` | Letras de crédito imobiliário (c1) e do agronegócio (c2) | Passivo | financeiro | R$ |
| `rendas_tarifas` | Rendas de tarifas bancárias ((d2) até 2024, (m) desde 2025), acumulado no semestre | DRE | financeiro | R$ |
| `pf_total` | Carteira PF total | Crédito PF por modalidade | credito | R$ |
| `pf_consignado`, `pf_nao_consignado`, `pf_veiculos`, `pf_habitacao`, `pf_cartao`, `pf_rural`, `pf_outros` | Carteira PF por modalidade (coluna "Total" de cada modalidade, vencido + a vencer) | idem | credito | R$ |
| `pj_total` | Carteira PJ total | Crédito PJ por modalidade | credito | R$ |
| `pj_capital_giro`, `pj_investimento`, `pj_cheque_especial`, `pj_recebiveis`, `pj_comex`, `pj_infraestrutura`, `pj_rural`, `pj_habitacional`, `pj_outros` | Carteira PJ por modalidade. `pj_cheque_especial` se chamava "Capital de Giro Rotativo" até 2017 (mesmo campo no BCB) | idem | credito | R$ |
| `pj_micro`, `pj_pequena`, `pj_media`, `pj_grande` | Carteira PJ por porte do tomador | Crédito PJ por porte | credito | R$ |
| `reg_total`, `reg_sudeste`, `reg_sul`, `reg_nordeste`, `reg_norte`, `reg_centro_oeste` | Carteira por região geográfica do tomador | Crédito por região | credito | R$ |
| `reg_nao_informada`, `reg_exterior` | Região não informada; exterior | idem | credito | R$ (sem share) |
| `clientes_credito`, `operacoes_credito` | Clientes e operações de crédito ativas | Crédito: quantidade de clientes | credito | contagem |
| `credito_rural` | `pf_rural + pj_rural` (derivada) | — | credito | R$ |
| `credito_imobiliario` | `pf_habitacao + pj_habitacional` (derivada) | — | credito | R$ |
| `credito_pf_pj` | `pf_total + pj_total` (derivada) | — | credito | R$ |

A participação de `clientes_credito` é aproximada: um cliente com crédito em dois bancos conta nos dois, e o total
do sistema soma as instituições.

### `data/ifs/shares/national_ifdata.csv` — participação nacional

`period, inst_id, metric, level, value, system_total, share, rank, cosif`. `share = value / system_total` no mesmo
nível e data; `rank` é a posição entre todas as unidades do sistema (instituições do cadastro e entidades soltas),
1 = maior. `inst_id = _demais` é o resto do sistema.

### `data/ifs/shares/changes_ifdata.csv` — variação de participação

Uma linha por `metric × inst_id × horizon_years` (1, 3, 5), comparando o período mais recente com o mesmo mês h anos
antes.

| Coluna | Descrição |
|---|---|
| `period_base`, `period_latest` | as duas pontas |
| `share_base`, `share_latest` | participações (fração) |
| `delta_pp` | `100 × (share_latest − share_base)`, em pontos percentuais; vazio se houver lacuna de cadastro |
| `absent` | `base`: não existia/não tinha valor na base (conta como 0); `latest`: idem no fim; `gap_base`/`gap_latest`: existia, mas faltou no cadastro do nível (sem variação) |
| `system_growth` | crescimento do total do sistema entre as pontas (fração) |
| `crosses_cosif_break` | `True` se a base é anterior a 03/2025 e o fim é depois |
| `perimeter_change`, `level_base`, `level_latest` | se o nível do IF.data mudou entre as pontas (crédito: 1005 → 1009) |

### `data/ifs/shares/regional_estban.csv` — participação regional (ESTBAN)

Formato largo: `month` (mês pedido), `month_used` (mês de fato usado: o anterior completo, se no pedido faltou banco
relevante), `geo_type (uf|regiao|brasil), geo, inst_id`, e para cada métrica do ESTBAN o valor (R$) e
`<métrica>_share` (fração do total da UF/região/Brasil dentro do universo ESTBAN). `inst_id = _sistema` traz o total
e `_demais` os bancos fora do cadastro. Meses: os fins de trimestre, o mês mais recente e os mesmos meses 1, 3 e 5
anos antes.

### `data/ifs/shares/changes_estban.csv`

Como `changes_ifdata.csv`, por `metric × geo_type × geo × inst_id × horizon_years`, sem as colunas do Cosif (o ESTBAN
não teve essa quebra; a mudança de leiaute dos verbetes rurais está tratada na própria métrica).

### `data/ifs/shares/municipios_estban_latest.csv`

Mês mais recente do ESTBAN, por município: `month, uf, codmun_ibge, municipio, inst_id, metric, value (R$),
municipal_total (R$, todos os bancos do município), share`. Métricas: `credito_total`, `credito_rural`,
`depositos_total`. Só instituições do cadastro.

### Métricas do ESTBAN (`config/ifs/estban.json`)

Cada métrica soma os verbetes do documento 4500 que existem no arquivo do mês. O ESTBAN é por **banco** (CNPJ-base),
ligado à instituição pelo cadastro 1006 do IF.data mais próximo.

| id | Verbetes |
|---|---|
| `credito_total` | 160 operações de crédito |
| `emprestimos_titulos` | 161 empréstimos e títulos descontados |
| `financiamentos` | 162 financiamentos |
| `credito_rural` | 163 + 164 + 165 + 166 + 167 (até ~2019 vinham separados agrícola/pecuária, custeio/investimento/comercialização; depois só 163 e 167) |
| `credito_imobiliario` | 169 financiamentos imobiliários |
| `depositos_vista` | 401 (coluna que soma 401 a 419) |
| `depositos_poupanca` | 420 |
| `depositos_prazo` | 432 |
| `depositos_total` | 401 + 420 + 432 |
| `ativo_total` | 399 total do ativo |

### `data/ifs/shares/summary.json` — resumo

- `definitions`, `flags`: o que cada número quer dizer e as ressalvas acima.
- `names`: `inst_id → nome`.
- `ifdata.metrics.<métrica>`: `label`, `unit`, `group`, `series`, `latest_period`, `level_latest`, `system_total`,
  `top` (as 10 maiores participações), `others_share`, e `horizons.<1|3|5>`: `period_base`, `crosses_cosif_break`,
  `perimeter_change`, `gainers` e `losers` (as 5 maiores altas e quedas em pp entre as instituições do cadastro, com
  `share_base` e `share_latest`) e `others_delta_pp`.
- `estban`: `latest_month`, `months`, `months_replaced`, `incomplete_months` e, por métrica e geografia (regiões e BR), `top` e `horizons` com ganhadores e
  perdedores.
- `institutions.<id>.<métrica>`: `share_latest`, `period_latest`, `delta_pp_1y`, `delta_pp_3y`, `delta_pp_5y`.
- `sources`: onde está a proveniência completa.

### `data/ifs/pillar3/km1.csv` — Pilar 3, KM1

Uma linha por `inst_id × quarter × field`, com o número do documento mais recente que trouxe aquele trimestre.

| Coluna | Descrição |
|---|---|
| `cnpj14` | CNPJ que publica (catálogo DASFN) |
| `quarter`, `period` | trimestre (`2026-2`) e AAAAMM |
| `field`, `label` | código BCBS do campo (`km1_1` … `km1_20`) e rótulo (config/ifs/pillar3.json) |
| `value`, `unit` | normalizado: R$ para valores, % para índices |
| `raw_value`, `factor` | número publicado e fator aplicado (1, 1.000 ou 1.000.000 para valores; 1 ou 100 para índices) |
| `scale_method` | `ifdata` (fator escolhido comparando a exposição de alavancagem `km1_13` com o ativo total prudencial do IF.data do mesmo trimestre) ou `magnitude` (palpite pela ordem de grandeza, quando não há IF.data) |
| `layout` | `v1` (plano) ou `v2` (blocos com t, t_1..t_4) |
| `reported_in` | trimestre do documento de onde veio o número (reapresentações valem) |
| `source_url`, `fetched_at` | URL do JSON do emissor e data da coleta |

Normalização dos índices: compara `km1_5` publicado com `km1_1 / km1_4` (CET1/RWA calculado, sem unidade). Se bate com
a fração, os índices (`ratio_fields`) são multiplicados por 100. Exemplo do problema: o BB publica valores em R$ mil e
índices em %; o BTG, valores em R$ milhões e índices em fração. `data/ifs/pillar3/state.json` guarda o status de cada
URL (200, 404, 422…); `catalog_provenance.json`, a URL e a data do catálogo.

### `data/ifs/ipe/ipe.csv` — CVM IPE

Fatos relevantes e comunicados ao mercado (categorias em `config/ifs/ipe.json`) das companhias de `registry.json →
cvm[]`, desde 2016: `inst_id, codigo_cvm, empresa, cnpj, data_referencia, data_entrega, categoria, tipo, especie,
assunto, protocolo, versao, link_pdf (RAD), source_url (ZIP anual), fetched_at`. Uma linha por protocolo (a maior
versão). Só metadados: o PDF não é baixado. Uma instituição pode ter mais de um código CVM (holding, banco, leasing
do grupo).

### `data/ifs/estban/files.csv` e `fixes.csv`

`files.csv`: por mês, a URL do ZIP, a data da coleta, a data de geração que o BCB escreve no arquivo e o número de
linhas. `fixes.csv`: cada linha corrigida (ver a ressalva 6): `month, cnpj8, uf, codmun, metric, raw, corrected,
bank_total_raw` (soma publicada do banco) e `prev_bank_total` (total corrigido do mês anterior).

### `data/ifs/estban/state.json`

Meses tentados e ainda não publicados (`missing`). Os arquivos saem em lotes trimestrais (jan–mar em 31/5, abr–jun em
31/8, jul–set em 30/11, out–dez em 31/3).

## Base local (fora do git): `data/ifs/ifs.sqlite`

| Tabela | Conteúdo |
|---|---|
| `ifdata_files` | arquivo, URL, data de coleta e de geração, por data-base |
| `ifdata_periods` | data-base, geração, data da extração e as colunas achadas para cada métrica |
| `ifdata_entities` | cadastro de todas as entidades de todos os níveis por data-base (código, nome, TCB, TD, TC, TI, segmento, UF, cidade, conglomerado financeiro e prudencial) |
| `ifdata_values` | valores de **todas** as entidades (não só do cadastro), sem zeros |
| `estban_files` | mês, URL, data de coleta, data de geração, verbetes do leiaute, nº de linhas |
| `estban_uf` | agregado banco × UF × mês × métrica, com o nº de municípios |
| `estban_names` | CNPJ-base → nome no ESTBAN |
| `estban_fixes` | linhas do ESTBAN com o total do banco embutido, bruto e corrigido |

## Como acrescentar

- **Uma métrica do IF.data:** uma linha em `config/ifs/ifdata.json` (relatório e coluna por regex; série; `share`), e
  `python -m pawatch ifs collect --source ifdata --reparse` (sem rede) e `shares`.
- **Uma instituição:** `include` (pelo CNPJ-base do líder) ou `rank.top_n` em `config/ifs/registry.json`; curadoria
  opcional; `registry` e `shares`.
- **Outro sistema cooperativo** (Cresol, Unicred, Ailos): uma entrada em `systems` com `name_regex` e o CNPJ do banco
  ou central.
- **Outro país:** os módulos são por fonte; um país novo é um coletor novo que grava no mesmo formato
  (`period, inst_id, metric, value` com proveniência) e entra no `registry` pelas suas chaves (LEI, CIK...).
