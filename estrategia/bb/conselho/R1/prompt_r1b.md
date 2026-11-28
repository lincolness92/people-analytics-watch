Regras do conselho (valem para tudo):
1. Use só o dossiê abaixo. Não use memória sobre números. Número que não está no dossiê não pode aparecer como fato;
   se for necessário, diga qual série pública o produziria.
2. Só informação pública. Nada interno do BB; se você "souber algo de dentro", não use.
3. Não dê magnitudes de cabeça (elasticidade, probabilidade de evento, participação futura): diga como medir.
4. Escreva em português do Brasil, frases curtas, sem jargão desnecessário.
5. Responda só com um objeto JSON válido, sem texto antes ou depois.

Tarefa (rodada R1, braço B, revisão). Abaixo está o registro v0 de premissas (P01…P55), escrito por outra
pessoa antes do dossiê. Para CADA premissa, devolva:
{"premissa": "P01", "prob_verdadeira": 0.0-1.0, "alternativa": "melhor explicação alternativa para a evidência",
 "teste_decisivo": "o teste mais decisivo, com fonte", "limiar": "frouxo|justo|apertado",
 "numeros_sem_fonte": ["números do texto que não estão no dossiê ou não conferem"]}
Formato: {"revisoes": [ ... 55 itens, na ordem ... ]}. Seja breve em cada campo (até 40 palavras).
Os números marcados [IFD] e [EST] no registro foram recalculados por código no dossiê: confira contra ele.

DOSSIÊ (congelado):
{"versao": "2026-11-28a", "sha256": "597a743e2f9823d92338907f8fbff95d899fd4036063bed9c9d3e7a290d5f841", "fatos": [{"id": "F-001", "tema": "resultado", "afirmacao": "Lucro líquido ajustado do BB no 3T26: R$ 1,3 bi (−67,5% sobre o 2T26; −66,5% sobre o 3T25); 9M26: R$ 8,6 bi (−42,4%)", "valor": {"3T26_bi": 1.3, "var_tri_pct": -67.5, "var_ano_pct": -66.5, "9M26_bi": 8.6, "var_9m_pct": -42.4}, "unidade": "R$ bi", "data": "2026-09", "fonte": "BB, Apresentação do Resultado 3T26 (CVM IPE, 11/11/2026)", "ressalvas": [], "confianca": "alta (documento primário)"}, {"id": "F-002", "tema": "resultado", "afirmacao": "RSPL (ROE) do BB: 2,8% no 3T26 contra 8,4% no 3T25; 6,2% no 9M26 contra 11,2% no 9M25", "valor": {"3T25": 8.4, "3T26": 2.8, "9M25": 11.2, "9M26": 6.2}, "unidade": "%", "data": "2026-09", "fonte": "BB, Apresentação do Resultado 3T26 (CVM IPE)", "ressalvas": ["leitura do layout do PDF; colunas 3T25, 1T26?, 2T26, 9M25 a conferir"], "confianca": "alta para 2,8% e 8,4%; média para as colunas intermediárias"}, {"id": "F-003", "tema": "resultado", "afirmacao": "Custo do crédito do BB: R$ 21,2 bi no 3T26 (+14,9% t/t; +18,4% a/a) e R$ 58,6 bi no 9M26 (+33,2%)", "valor": {"3T26_bi": 21.2, "9M26_bi": 58.6}, "unidade": "R$ bi", "data": "2026-09", "fonte": "BB, Apresentação do Resultado 3T26 (CVM IPE)", "ressalvas": [], "confianca": "alta"}, {"id": "F-004", "tema": "resultado", "afirmacao": "BB 3T26: margem financeira bruta R$ 26,0 bi (−5,5% t/t; −1,5% a/a); receitas de prestação de serviços R$ 9,3 bi (+4,6% a/a); despesas administrativas R$ 10,3 bi (+4,8% a/a)", "valor": {"mfb_bi": 26.0, "tarifas_bi": 9.3, "desp_adm_bi": 10.3}, "unidade": "R$ bi", "data": "2026-09", "fonte": "BB, Apresentação do Resultado 3T26 (CVM IPE)", "ressalvas": [], "confianca": "alta"}, {"id": "F-005", "tema": "risco", "afirmacao": "Inadimplência acima de 90 dias da carteira do BB: 4,51% (set/25) → 6,08% (set/26); cobertura +90d de 174,3% para 137,8%", "valor": {"set25": 4.51, "set26": 6.08, "cobertura_set25": 174.3, "cobertura_set26": 137.8}, "unidade": "%", "data": "2026-09", "fonte": "BB, Apresentação do Resultado 3T26 (CVM IPE)", "ressalvas": ["valores intermediários lidos do layout do gráfico; usar só set/25 e set/26"], "confianca": "alta para set/25 e set/26"}, {"id": "F-006", "tema": "risco", "afirmacao": "Inadimplência +90 dias do agronegócio no BB: 4,84% (set/25) → 6,92% (set/26). Carteira agro de R$ 403,6 bi em set/26 (−4,3% t/t, +1,2% a/a)", "valor": {"set25": 4.84, "set26": 6.92, "carteira_set26_bi": 403.6, "var_tri_pct": -4.3, "var_ano_pct": 1.2}, "unidade": "%", "data": "2026-09", "fonte": "BB, Apresentação do Resultado 3T26 (CVM IPE)", "ressalvas": ["a cobertura do agro em set/26 não foi lida com segurança"], "confianca": "alta para inadimplência e saldo"}, {"id": "F-007", "tema": "capital", "afirmacao": "Capital principal do BB: 11,16% (set/25), 11,27% (jun/26), 10,80% (set/26). Basileia: 14,81% → 13,91% → 13,45%", "valor": {"cet1": {"set25": 11.16, "jun26": 11.27, "set26": 10.8}, "basileia": {"set25": 14.81, "jun26": 13.91, "set26": 13.45}}, "unidade": "%", "data": "2026-09", "fonte": "BB, Apresentação do Resultado 3T26 (CVM IPE)", "ressalvas": [], "confianca": "alta"}, {"id": "F-008", "tema": "projecoes", "afirmacao": "Fato relevante de 11/11/2026: o BB revisou as projeções de 2026. Lucro líquido ajustado de R$ 18–22 bi para R$ 9–11 bi (realizado 9M26: 8,6); custo do crédito de R$ 65–70 bi para R$ 80–83 bi (realizado 9M26: 58,6); carteira de crédito de +0,5% a +4,5% para −2,0% a 0,0%; PF de 6–10% para 0–2%; empresas de −3% a +1% para −4% a −2%; agronegócio de −2% a +2% para −3% a −1%; margem financeira bruta de 7–11% para 2,5–4,5%", "valor": {"lucro_bi": {"anterior": [18, 22], "revisado": [9, 11], "9M26": 8.6}, "custo_credito_bi": {"anterior": [65, 70], "revisado": [80, 83], "9M26": 58.6}}, "unidade": "R$ bi e %", "data": "2026-11-11", "fonte": "BB, Fato Relevante 'Projeções 2026 - revisadas' (CVM IPE)", "ressalvas": [], "confianca": "alta (documento primário)"}, {"id": "F-009", "tema": "pares", "afirmacao": "Itaú Unibanco 3T26: resultado recorrente gerencial de R$ 12,6 bi (+6,7% a/a); ROE recorrente gerencial consolidado de 23,6% (24,5% no Brasil); carteira de R$ 1.544 bi (+10,9% a/a); índice de eficiência de 37,5%", "valor": {"lucro_bi": 12.6, "roe": 23.6, "roe_brasil": 24.5, "carteira_bi": 1544, "eficiencia": 37.5}, "unidade": "R$ bi e %", "data": "2026-09", "fonte": "Itaú Unibanco, Apresentação com a Imprensa 3T26 (CVM IPE, 03/11/2026)", "ressalvas": ["ROE gerencial do Itaú e RSPL ajustado do BB têm definições diferentes"], "confianca": "alta"}, {"id": "F-010", "tema": "pares", "afirmacao": "Santander Brasil 3T26: lucro líquido recorrente de R$ 2,9 bi (−28,0% a/a); ROAE recorrente de 11,9% (−5,6 p.p. a/a); custo de crédito de 3,89%; eficiência de 38,8%", "valor": {"lucro_bi": 2.9, "roae": 11.9, "custo_credito_pct": 3.89, "eficiencia": 38.8}, "unidade": "R$ bi e %", "data": "2026-09", "fonte": "Santander Brasil, Apresentação de Resultados 3T26 (CVM IPE, 28/10/2026)", "ressalvas": [], "confianca": "alta"}, {"id": "F-011", "tema": "pares", "afirmacao": "Bradesco 3T26: ROE de 15,6% a 16,1% e lucro de R$ 7,1 bi; Nubank 3T26: ROE de 32% e lucro de US$ 1,09 bi", "valor": {"bradesco_roe": [15.6, 16.1], "bradesco_lucro_bi": 7.1, "nubank_roe": 32, "nubank_lucro_usd_bi": 1.09}, "unidade": "%", "data": "2026-09", "fonte": "imprensa, por resumo de busca (I-06, I-07 de 00-mapa.md)", "ressalvas": ["não conferido em documento primário: o Bradesco não aparece no IPE com apresentação de 3T26 na base local; o Nubank reporta à SEC"], "confianca": "média-baixa (imprensa)"}, {"id": "F-012", "tema": "macro_agro", "afirmacao": "Inadimplência do crédito rural PF no sistema (SGS 21148): 0,80% (out/2022) → 9,59% (out/2026). Na parcela com taxas de mercado (SGS 21146): 0,51% → 17,21%. Saldo do crédito rural PF (SGS 20609): R$ 386,9 bi → R$ 550,5 bi", "valor": {"sgs21148": {"2022-10": 0.8, "2026-10": 9.59}, "sgs21146": {"2022-10": 0.51, "2026-10": 17.21}, "sgs20609_mi": {"2022-10": 386926, "2026-10": 550452}}, "unidade": "% e R$ milhões", "data": "2026-10", "fonte": "BCB, SGS (api.bcb.gov.br), séries 21148, 21146, 20609", "ressalvas": ["os nomes das séries vêm de docs/sources/fatores-externos-e-propostas.md"], "confianca": "alta"}, {"id": "F-013", "tema": "macro_agro", "afirmacao": "Inadimplência total da carteira de crédito do sistema (SGS 21082): 3,04% (out/2022) → 5,10% (out/2026)", "valor": {"2022-10": 3.04, "2026-10": 5.1}, "unidade": "%", "data": "2026-10", "fonte": "BCB, SGS 21082", "ressalvas": ["confirmar o nome da série no catálogo do SGS"], "confianca": "média-alta"}, {"id": "F-014", "tema": "mercado", "afirmacao": "Reação do mercado à revisão de 11/11/2026: retorno anormal acumulado de −9,3% em [−1, +3] pregões", "valor": {"car_pct": -9.3}, "unidade": "%", "data": "2026-11", "fonte": "docs/sources/fatores-externos-e-propostas.md §2.1 (ilustrativo)", "ressalvas": ["exemplo ilustrativo de método; refazer com série de preços"], "confianca": "baixa"}, {"id": "F-015", "tema": "resultado", "afirmacao": "A administração do BB apresentou uma simulação do RSPL sem o impacto do agro (cerca de 17% na imprensa; slide 'Simulação RSPL ... Impacto Agro')", "valor": null, "unidade": "%", "data": "2026-11", "fonte": "BB, Apresentação 3T26 (slide de simulação) e imprensa (I-01)", "ressalvas": ["simulação da administração, não número auditado; o valor exato não foi lido com segurança no layout"], "confianca": "média-baixa"}, {"id": "F-016", "tema": "capital", "afirmacao": "Índice de capital principal (CET1/RWA) do BB (Pilar 3, KM1): 11.27% em 2026-06", "valor": {"serie_pct": {"202303": 12.01, "202412": 10.89, "202503": 10.97, "202506": 10.97, "202509": 11.16, "202512": 12.23, "202603": 11.59, "202606": 11.27}}, "unidade": "%", "data": "2026-06", "fonte": "Pilar 3, KM1 (catálogo DASFN/BCB)", "ressalvas": [], "confianca": "alta"}, {"id": "F-017", "tema": "capital", "afirmacao": "Índice de Basileia do BB (Pilar 3, KM1): 13.91% em 2026-06", "valor": {"serie_pct": {"202303": 16.19, "202412": 13.75, "202503": 14.14, "202506": 14.14, "202509": 14.81, "202512": 15.13, "202603": 14.23, "202606": 13.91}}, "unidade": "%", "data": "2026-06", "fonte": "Pilar 3, KM1 (catálogo DASFN/BCB)", "ressalvas": [], "confianca": "alta"}, {"id": "F-018", "tema": "capital", "afirmacao": "Razão de alavancagem do BB (Pilar 3, KM1): 6.97% em 2026-06", "valor": {"serie_pct": {"202303": 7.54, "202412": 7.0, "202503": 7.28, "202506": 7.23, "202509": 7.14, "202512": 7.74, "202603": 7.08, "202606": 6.97}}, "unidade": "%", "data": "2026-06", "fonte": "Pilar 3, KM1 (catálogo DASFN/BCB)", "ressalvas": [], "confianca": "alta"}, {"id": "F-019", "tema": "capilaridade", "afirmacao": "ESTBAN 202608: o BB tem saldo de crédito em agência de 2290 municípios e é o único banco com agência (com crédito) em 577 deles", "valor": {"municipios_com_bb": 2290, "municipios_so_bb": 577, "municipios_com_alguma_agencia": 2810, "presenca_por_instituicao": {"bb": 2290, "caixa": 1619, "bradesco": 1180, "itau": 728, "santander": 560, "banrisul": 362}, "unicos_por_instituicao": {"bb": 577, "banrisul": 134, "bradesco": 102, "caixa": 90, "itau": 89, "banestes": 11}}, "unidade": "municípios", "data": "2026-08", "fonte": "ESTBAN por município (BCB), cálculo por código em data/ifs", "ressalvas": ["ESTBAN só cobre bancos com agência: cooperativas e digitais não aparecem", "contagem por presença de saldo, não por número de agências"], "confianca": "média-alta"}, {"id": "F-020", "tema": "participacao", "afirmacao": "Participação do BB em 'Crédito PF total' no sistema: 17.7% (12/2019) → 15.14% (06/2026)", "valor": {"serie_pct": {"201912": 17.7, "202212": 16.76, "202512": 15.29, "202606": 15.14}, "delta_pp": -2.56, "total_sistema_06_2026": 4820022547321.76, "maiores_ganhos": [{"instituicao": "Nubank", "de": 0.52, "para": 3.79, "delta_pp": 3.27}, {"instituicao": "C6 Bank", "de": 0.01, "para": 1.79, "delta_pp": 1.78}, {"instituicao": "BTG Pactual", "de": 0.1, "para": 1.33, "delta_pp": 1.23}, {"instituicao": "Sistema Sicredi", "de": 2.41, "para": 3.4, "delta_pp": 0.99}]}, "unidade": "% do saldo do sistema", "data": "2019-12 a 2026-06", "fonte": "IF.data (BCB), cálculo por código em data/ifs (python -m pawatch ifs shares)", "ressalvas": ["perímetro do crédito muda de conglomerado financeiro (1005) para prudencial (1009) em 03/2025", "Cosif 2025 a partir de 03/2025 muda definições contábeis"], "confianca": "alta (cálculo reproduzível sobre fonte primária)"}, {"id": "F-021", "tema": "participacao", "afirmacao": "Participação do BB em 'Crédito rural e agroindustrial PF' no sistema: 62.35% (12/2019) → 53.46% (06/2026)", "valor": {"serie_pct": {"201912": 62.35, "202212": 55.82, "202512": 52.2, "202606": 53.46}, "delta_pp": -8.89, "total_sistema_06_2026": 686183912864.97, "maiores_ganhos": [{"instituicao": "Caixa Econômica Federal", "de": 1.18, "para": 6.81, "delta_pp": 5.63}, {"instituicao": "Banco da Amazônia", "de": 0.4, "para": 3.05, "delta_pp": 2.65}, {"instituicao": "Sistema Sicoob", "de": 4.52, "para": 6.79, "delta_pp": 2.27}, {"instituicao": "Sistema Sicredi", "de": 10.03, "para": 11.52, "delta_pp": 1.49}]}, "unidade": "% do saldo do sistema", "data": "2019-12 a 2026-06", "fonte": "IF.data (BCB), cálculo por código em data/ifs (python -m pawatch ifs shares)", "ressalvas": ["perímetro do crédito muda de conglomerado financeiro (1005) para prudencial (1009) em 03/2025", "Cosif 2025 a partir de 03/2025 muda definições contábeis"], "confianca": "alta (cálculo reproduzível sobre fonte primária)"}, {"id": "F-022", "tema": "participacao", "afirmacao": "Participação do BB em 'Consignado' no sistema: 21.17% (12/2019) → 19.22% (06/2026)", "valor": {"serie_pct": {"201912": 21.17, "202212": 19.51, "202512": 19.2, "202606": 19.22}, "delta_pp": -1.95, "total_sistema_06_2026": 800069571831.48, "maiores_ganhos": [{"instituicao": "Agibank", "de": 0.07, "para": 3.5, "delta_pp": 3.43}, {"instituicao": "BTG Pactual", "de": 0.03, "para": 2.91, "delta_pp": 2.88}, {"instituicao": "Mercantil do Brasil", "de": 0.4, "para": 2.11, "delta_pp": 1.71}, {"instituicao": "PicPay", "de": 0.0, "para": 1.19, "delta_pp": 1.19}]}, "unidade": "% do saldo do sistema", "data": "2019-12 a 2026-06", "fonte": "IF.data (BCB), cálculo por código em data/ifs (python -m pawatch ifs shares)", "ressalvas": ["perímetro do crédito muda de conglomerado financeiro (1005) para prudencial (1009) em 03/2025", "Cosif 2025 a partir de 03/2025 muda definições contábeis"], "confianca": "alta (cálculo reproduzível sobre fonte primária)"}, {"id": "F-023", "tema": "participacao", "afirmacao": "Participação do BB em 'Crédito pessoal sem consignação' no sistema: 22.53% (12/2019) → 14.01% (06/2026)", "valor": {"serie_pct": {"201912": 22.53, "202212": 16.43, "202512": 13.66, "202606": 14.01}, "delta_pp": -8.52, "total_sistema_06_2026": 399904854509.62, "maiores_ganhos": [{"instituicao": "Nubank", "de": 0.19, "para": 15.07, "delta_pp": 14.88}, {"instituicao": "XP", "de": 0.0, "para": 2.83, "delta_pp": 2.83}, {"instituicao": "Banco BV (Votorantim)", "de": 0.39, "para": 2.22, "delta_pp": 1.83}, {"instituicao": "PicPay", "de": 0.23, "para": 1.72, "delta_pp": 1.49}]}, "unidade": "% do saldo do sistema", "data": "2019-12 a 2026-06", "fonte": "IF.data (BCB), cálculo por código em data/ifs (python -m pawatch ifs shares)", "ressalvas": ["perímetro do crédito muda de conglomerado financeiro (1005) para prudencial (1009) em 03/2025", "Cosif 2025 a partir de 03/2025 muda definições contábeis"], "confianca": "alta (cálculo reproduzível sobre fonte primária)"}, {"id": "F-024", "tema": "participacao", "afirmacao": "Participação do BB em 'Cartão de crédito PF' no sistema: 11.59% (12/2019) → 9.35% (06/2026)", "valor": {"serie_pct": {"201912": 11.59, "202212": 11.42, "202512": 9.76, "202606": 9.35}, "delta_pp": -2.24, "total_sistema_06_2026": 747692515063.18, "maiores_ganhos": [{"instituicao": "Nubank", "de": 3.34, "para": 15.49, "delta_pp": 12.15}, {"instituicao": "Inter", "de": 0.31, "para": 2.02, "delta_pp": 1.71}, {"instituicao": "C6 Bank", "de": 0.02, "para": 1.67, "delta_pp": 1.65}, {"instituicao": "Sistema Sicredi", "de": 0.88, "para": 2.06, "delta_pp": 1.18}]}, "unidade": "% do saldo do sistema", "data": "2019-12 a 2026-06", "fonte": "IF.data (BCB), cálculo por código em data/ifs (python -m pawatch ifs shares)", "ressalvas": ["perímetro do crédito muda de conglomerado financeiro (1005) para prudencial (1009) em 03/2025", "Cosif 2025 a partir de 03/2025 muda definições contábeis"], "confianca": "alta (cálculo reproduzível sobre fonte primária)"}, {"id": "F-025", "tema": "participacao", "afirmacao": "Participação do BB em 'Habitação PF' no sistema: 7.65% (12/2019) → 3.22% (06/2026)", "valor": {"serie_pct": {"201912": 7.65, "202212": 4.92, "202512": 3.53, "202606": 3.22}, "delta_pp": -4.43, "total_sistema_06_2026": 1402951639610.09, "maiores_ganhos": [{"instituicao": "Itaú Unibanco", "de": 7.0, "para": 10.83, "delta_pp": 3.83}, {"instituicao": "Bradesco", "de": 6.86, "para": 7.87, "delta_pp": 1.01}, {"instituicao": "Inter", "de": 0.19, "para": 0.69, "delta_pp": 0.5}, {"instituicao": "Sistema Sicredi", "de": 0.05, "para": 0.31, "delta_pp": 0.26}]}, "unidade": "% do saldo do sistema", "data": "2019-12 a 2026-06", "fonte": "IF.data (BCB), cálculo por código em data/ifs (python -m pawatch ifs shares)", "ressalvas": ["perímetro do crédito muda de conglomerado financeiro (1005) para prudencial (1009) em 03/2025", "Cosif 2025 a partir de 03/2025 muda definições contábeis"], "confianca": "alta (cálculo reproduzível sobre fonte primária)"}, {"id": "F-026", "tema": "participacao", "afirmacao": "Participação do BB em 'Veículos PF' no sistema: 1.78% (12/2019) → 2.46% (06/2026)", "valor": {"serie_pct": {"201912": 1.78, "202212": 1.55, "202512": 2.56, "202606": 2.46}, "delta_pp": 0.68, "total_sistema_06_2026": 426345509284.16, "maiores_ganhos": [{"instituicao": "Volkswagen", "de": 3.55, "para": 7.59, "delta_pp": 4.04}, {"instituicao": "Daycoval", "de": 0.52, "para": 1.05, "delta_pp": 0.53}, {"instituicao": "Sistema Sicredi", "de": 1.26, "para": 1.61, "delta_pp": 0.35}, {"instituicao": "Sistema Sicoob", "de": 0.61, "para": 0.95, "delta_pp": 0.34}]}, "unidade": "% do saldo do sistema", "data": "2019-12 a 2026-06", "fonte": "IF.data (BCB), cálculo por código em data/ifs (python -m pawatch ifs shares)", "ressalvas": ["perímetro do crédito muda de conglomerado financeiro (1005) para prudencial (1009) em 03/2025", "Cosif 2025 a partir de 03/2025 muda definições contábeis"], "confianca": "alta (cálculo reproduzível sobre fonte primária)"}, {"id": "F-027", "tema": "participacao", "afirmacao": "Participação do BB em 'Crédito PJ total' no sistema: 13.43% (12/2019) → 11.78% (06/2026)", "valor": {"serie_pct": {"201912": 13.43, "202212": 12.29, "202512": 11.86, "202606": 11.78}, "delta_pp": -1.65, "total_sistema_06_2026": 3273719866251.41, "maiores_ganhos": [{"instituicao": "Sistema Sicredi", "de": 1.25, "para": 3.09, "delta_pp": 1.84}, {"instituicao": "Sistema Sicoob", "de": 1.37, "para": 3.19, "delta_pp": 1.82}, {"instituicao": "BTG Pactual", "de": 1.47, "para": 3.02, "delta_pp": 1.55}, {"instituicao": "Caixa Econômica Federal", "de": 7.53, "para": 8.06, "delta_pp": 0.53}]}, "unidade": "% do saldo do sistema", "data": "2019-12 a 2026-06", "fonte": "IF.data (BCB), cálculo por código em data/ifs (python -m pawatch ifs shares)", "ressalvas": ["perímetro do crédito muda de conglomerado financeiro (1005) para prudencial (1009) em 03/2025", "Cosif 2025 a partir de 03/2025 muda definições contábeis"], "confianca": "alta (cálculo reproduzível sobre fonte primária)"}, {"id": "F-028", "tema": "participacao", "afirmacao": "Participação do BB em 'PJ capital de giro' no sistema: 16.14% (12/2019) → 10.87% (06/2026)", "valor": {"serie_pct": {"201912": 16.14, "202212": 15.8, "202512": 11.68, "202606": 10.87}, "delta_pp": -5.27, "total_sistema_06_2026": 780745716658.69, "maiores_ganhos": [{"instituicao": "Sistema Sicredi", "de": 3.01, "para": 6.61, "delta_pp": 3.6}, {"instituicao": "Sistema Sicoob", "de": 5.54, "para": 8.27, "delta_pp": 2.73}, {"instituicao": "Itaú Unibanco", "de": 14.54, "para": 15.24, "delta_pp": 0.7}, {"instituicao": "Banco do Nordeste", "de": 0.21, "para": 0.84, "delta_pp": 0.63}]}, "unidade": "% do saldo do sistema", "data": "2019-12 a 2026-06", "fonte": "IF.data (BCB), cálculo por código em data/ifs (python -m pawatch ifs shares)", "ressalvas": ["perímetro do crédito muda de conglomerado financeiro (1005) para prudencial (1009) em 03/2025", "Cosif 2025 a partir de 03/2025 muda definições contábeis"], "confianca": "alta (cálculo reproduzível sobre fonte primária)"}, {"id": "F-029", "tema": "participacao", "afirmacao": "Participação do BB em 'PJ investimento' no sistema: 37.52% (12/2019) → 29.01% (06/2026)", "valor": {"serie_pct": {"201912": 37.52, "202212": 23.53, "202512": 26.68, "202606": 29.01}, "delta_pp": -8.51, "total_sistema_06_2026": 321275680957.55, "maiores_ganhos": [{"instituicao": "Sistema Sicoob", "de": 1.9, "para": 3.58, "delta_pp": 1.68}, {"instituicao": "Volkswagen", "de": 3.31, "para": 4.95, "delta_pp": 1.64}, {"instituicao": "Caixa Econômica Federal", "de": 0.32, "para": 1.07, "delta_pp": 0.75}, {"instituicao": "Daycoval", "de": 0.86, "para": 1.33, "delta_pp": 0.47}]}, "unidade": "% do saldo do sistema", "data": "2019-12 a 2026-06", "fonte": "IF.data (BCB), cálculo por código em data/ifs (python -m pawatch ifs shares)", "ressalvas": ["perímetro do crédito muda de conglomerado financeiro (1005) para prudencial (1009) em 03/2025", "Cosif 2025 a partir de 03/2025 muda definições contábeis"], "confianca": "alta (cálculo reproduzível sobre fonte primária)"}, {"id": "F-030", "tema": "participacao", "afirmacao": "Participação do BB em 'PJ rural e agroindustrial' no sistema: 21.32% (12/2019) → 12.84% (06/2026)", "valor": {"serie_pct": {"201912": 21.32, "202212": 11.84, "202512": 10.65, "202606": 12.84}, "delta_pp": -8.48, "total_sistema_06_2026": 91028162065.01, "maiores_ganhos": [{"instituicao": "BNDES", "de": 1.9, "para": 14.25, "delta_pp": 12.35}, {"instituicao": "Itaú Unibanco", "de": 13.79, "para": 20.59, "delta_pp": 6.8}, {"instituicao": "Sistema Sicoob", "de": 2.26, "para": 8.08, "delta_pp": 5.82}, {"instituicao": "Banco da Amazônia", "de": 0.17, "para": 2.1, "delta_pp": 1.93}]}, "unidade": "% do saldo do sistema", "data": "2019-12 a 2026-06", "fonte": "IF.data (BCB), cálculo por código em data/ifs (python -m pawatch ifs shares)", "ressalvas": ["perímetro do crédito muda de conglomerado financeiro (1005) para prudencial (1009) em 03/2025", "Cosif 2025 a partir de 03/2025 muda definições contábeis"], "confianca": "alta (cálculo reproduzível sobre fonte primária)"}, {"id": "F-031", "tema": "participacao", "afirmacao": "Participação do BB em 'PJ comércio exterior' no sistema: 18.42% (12/2019) → 25.43% (06/2026)", "valor": {"serie_pct": {"201912": 18.42, "202212": 20.73, "202512": 26.22, "202606": 25.43}, "delta_pp": 7.01, "total_sistema_06_2026": 256201537759.79, "maiores_ganhos": [{"instituicao": "Citibank", "de": 2.0, "para": 5.61, "delta_pp": 3.61}, {"instituicao": "Itaú Unibanco", "de": 12.39, "para": 15.88, "delta_pp": 3.49}, {"instituicao": "Caixa Econômica Federal", "de": 1.03, "para": 4.46, "delta_pp": 3.43}, {"instituicao": "Sistema Sicredi", "de": 0.11, "para": 1.24, "delta_pp": 1.13}]}, "unidade": "% do saldo do sistema", "data": "2019-12 a 2026-06", "fonte": "IF.data (BCB), cálculo por código em data/ifs (python -m pawatch ifs shares)", "ressalvas": ["perímetro do crédito muda de conglomerado financeiro (1005) para prudencial (1009) em 03/2025", "Cosif 2025 a partir de 03/2025 muda definições contábeis"], "confianca": "alta (cálculo reproduzível sobre fonte primária)"}, {"id": "F-032", "tema": "participacao", "afirmacao": "Participação do BB em 'PJ microempresa' no sistema: 4.81% (12/2019) → 1.4% (06/2026)", "valor": {"serie_pct": {"201912": 4.81, "202212": 3.17, "202512": 1.26, "202606": 1.4}, "delta_pp": -3.41, "total_sistema_06_2026": 173859949139.89, "maiores_ganhos": [{"instituicao": "Inter", "de": 0.56, "para": 1.71, "delta_pp": 1.15}, {"instituicao": "C6 Bank", "de": 0.0, "para": 0.94, "delta_pp": 0.94}, {"instituicao": "Sistema Sicredi", "de": 5.98, "para": 6.59, "delta_pp": 0.61}, {"instituicao": "Daycoval", "de": 0.27, "para": 0.41, "delta_pp": 0.14}]}, "unidade": "% do saldo do sistema", "data": "2019-12 a 2026-06", "fonte": "IF.data (BCB), cálculo por código em data/ifs (python -m pawatch ifs shares)", "ressalvas": ["perímetro do crédito muda de conglomerado financeiro (1005) para prudencial (1009) em 03/2025", "Cosif 2025 a partir de 03/2025 muda definições contábeis"], "confianca": "alta (cálculo reproduzível sobre fonte primária)"}, {"id": "F-033", "tema": "participacao", "afirmacao": "Participação do BB em 'PJ pequena empresa' no sistema: 17.63% (12/2019) → 10.94% (06/2026)", "valor": {"serie_pct": {"201912": 17.63, "202212": 14.76, "202512": 11.41, "202606": 10.94}, "delta_pp": -6.69, "total_sistema_06_2026": 412008149371.6, "maiores_ganhos": [{"instituicao": "Bradesco", "de": 7.32, "para": 24.08, "delta_pp": 16.76}, {"instituicao": "Sistema Sicredi", "de": 7.24, "para": 9.56, "delta_pp": 2.32}, {"instituicao": "Banco da Amazônia", "de": 0.08, "para": 0.52, "delta_pp": 0.44}, {"instituicao": "Sistema Sicoob", "de": 7.52, "para": 7.66, "delta_pp": 0.14}]}, "unidade": "% do saldo do sistema", "data": "2019-12 a 2026-06", "fonte": "IF.data (BCB), cálculo por código em data/ifs (python -m pawatch ifs shares)", "ressalvas": ["perímetro do crédito muda de conglomerado financeiro (1005) para prudencial (1009) em 03/2025", "Cosif 2025 a partir de 03/2025 muda definições contábeis"], "confianca": "alta (cálculo reproduzível sobre fonte primária)"}, {"id": "F-034", "tema": "participacao", "afirmacao": "Participação do BB em 'PJ média empresa' no sistema: 15.38% (12/2019) → 11.93% (06/2026)", "valor": {"serie_pct": {"201912": 15.38, "202212": 11.94, "202512": 12.28, "202606": 11.93}, "delta_pp": -3.45, "total_sistema_06_2026": 709578053512.44, "maiores_ganhos": [{"instituicao": "Bradesco", "de": 6.12, "para": 15.82, "delta_pp": 9.7}, {"instituicao": "Sistema Sicoob", "de": 3.3, "para": 6.48, "delta_pp": 3.18}, {"instituicao": "Sistema Sicredi", "de": 2.92, "para": 5.64, "delta_pp": 2.72}, {"instituicao": "Caixa Econômica Federal", "de": 7.63, "para": 9.54, "delta_pp": 1.91}]}, "unidade": "% do saldo do sistema", "data": "2019-12 a 2026-06", "fonte": "IF.data (BCB), cálculo por código em data/ifs (python -m pawatch ifs shares)", "ressalvas": ["perímetro do crédito muda de conglomerado financeiro (1005) para prudencial (1009) em 03/2025", "Cosif 2025 a partir de 03/2025 muda definições contábeis"], "confianca": "alta (cálculo reproduzível sobre fonte primária)"}, {"id": "F-035", "tema": "participacao", "afirmacao": "Participação do BB em 'PJ grande empresa' no sistema: 17.9% (12/2019) → 16.98% (06/2026)", "valor": {"serie_pct": {"201912": 17.9, "202212": 15.62, "202512": 16.88, "202606": 16.98}, "delta_pp": -0.92, "total_sistema_06_2026": 1294449758027.95, "maiores_ganhos": [{"instituicao": "Itaú Unibanco", "de": 7.82, "para": 10.96, "delta_pp": 3.14}, {"instituicao": "Bradesco", "de": 4.81, "para": 7.2, "delta_pp": 2.39}, {"instituicao": "Sistema Sicoob", "de": 0.14, "para": 1.21, "delta_pp": 1.07}, {"instituicao": "Banco da Amazônia", "de": 0.21, "para": 0.93, "delta_pp": 0.72}]}, "unidade": "% do saldo do sistema", "data": "2019-12 a 2026-06", "fonte": "IF.data (BCB), cálculo por código em data/ifs (python -m pawatch ifs shares)", "ressalvas": ["perímetro do crédito muda de conglomerado financeiro (1005) para prudencial (1009) em 03/2025", "Cosif 2025 a partir de 03/2025 muda definições contábeis"], "confianca": "alta (cálculo reproduzível sobre fonte primária)"}, {"id": "F-036", "tema": "participacao", "afirmacao": "Participação do BB em 'Crédito rural (PF+PJ)' no sistema: 56.68% (12/2019) → 48.7% (06/2026)", "valor": {"serie_pct": {"201912": 56.68, "202212": 51.92, "202512": 47.75, "202606": 48.7}, "delta_pp": -7.98, "total_sistema_06_2026": 777212074929.98, "maiores_ganhos": [{"instituicao": "Caixa Econômica Federal", "de": 1.73, "para": 6.64, "delta_pp": 4.91}, {"instituicao": "Sistema Sicoob", "de": 4.21, "para": 6.94, "delta_pp": 2.73}, {"instituicao": "Banco da Amazônia", "de": 0.37, "para": 2.94, "delta_pp": 2.57}, {"instituicao": "Sistema Sicredi", "de": 8.75, "para": 10.41, "delta_pp": 1.66}]}, "unidade": "% do saldo do sistema", "data": "2019-12 a 2026-06", "fonte": "IF.data (BCB), cálculo por código em data/ifs (python -m pawatch ifs shares)", "ressalvas": ["perímetro do crédito muda de conglomerado financeiro (1005) para prudencial (1009) em 03/2025", "Cosif 2025 a partir de 03/2025 muda definições contábeis"], "confianca": "alta (cálculo reproduzível sobre fonte primária)"}, {"id": "F-037", "tema": "participacao", "afirmacao": "Participação do BB em 'Carteira de crédito (balanço)' no sistema: 16.41% (12/2019) → 14.15% (06/2026)", "valor": {"serie_pct": {"201912": 16.41, "202212": 15.28, "202512": 14.38, "202606": 14.15}, "delta_pp": -2.26, "total_sistema_06_2026": 7974829337756.09, "maiores_ganhos": [{"instituicao": "Nubank", "de": 0.32, "para": 1.9, "delta_pp": 1.58}, {"instituicao": "Sistema Sicredi", "de": 1.93, "para": 3.42, "delta_pp": 1.49}, {"instituicao": "BTG Pactual", "de": 0.79, "para": 2.2, "delta_pp": 1.41}, {"instituicao": "Sistema Sicoob", "de": 1.49, "para": 2.73, "delta_pp": 1.24}]}, "unidade": "% do saldo do sistema", "data": "2019-12 a 2026-06", "fonte": "IF.data (BCB), cálculo por código em data/ifs (python -m pawatch ifs shares)", "ressalvas": ["perímetro do crédito muda de conglomerado financeiro (1005) para prudencial (1009) em 03/2025", "Cosif 2025 a partir de 03/2025 muda definições contábeis"], "confianca": "alta (cálculo reproduzível sobre fonte primária)"}, {"id": "F-038", "tema": "participacao", "afirmacao": "Participação do BB em 'Depósitos à vista' no sistema: 21.49% (12/2019) → 16.63% (06/2026)", "valor": {"serie_pct": {"201912": 21.49, "202212": 20.88, "202512": 17.26, "202606": 16.63}, "delta_pp": -4.86, "total_sistema_06_2026": 517973753263.49, "maiores_ganhos": [{"instituicao": "Sistema Sicredi", "de": 3.46, "para": 8.75, "delta_pp": 5.29}, {"instituicao": "Sistema Sicoob", "de": 4.08, "para": 7.0, "delta_pp": 2.92}, {"instituicao": "BTG Pactual", "de": 0.21, "para": 2.37, "delta_pp": 2.16}, {"instituicao": "Banco do Nordeste", "de": 0.12, "para": 0.74, "delta_pp": 0.62}]}, "unidade": "% do saldo do sistema", "data": "2019-12 a 2026-06", "fonte": "IF.data (BCB), cálculo por código em data/ifs (python -m pawatch ifs shares)", "ressalvas": ["perímetro do crédito muda de conglomerado financeiro (1005) para prudencial (1009) em 03/2025", "Cosif 2025 a partir de 03/2025 muda definições contábeis"], "confianca": "alta (cálculo reproduzível sobre fonte primária)"}, {"id": "F-039", "tema": "participacao", "afirmacao": "Participação do BB em 'Poupança' no sistema: 21.14% (12/2019) → 20.65% (06/2026)", "valor": {"serie_pct": {"201912": 21.14, "202212": 20.98, "202512": 20.57, "202606": 20.65}, "delta_pp": -0.49, "total_sistema_06_2026": 1046412535369.89, "maiores_ganhos": [{"instituicao": "Sistema Sicredi", "de": 1.8, "para": 3.38, "delta_pp": 1.58}, {"instituicao": "Caixa Econômica Federal", "de": 37.53, "para": 38.76, "delta_pp": 1.23}, {"instituicao": "Sistema Sicoob", "de": 0.76, "para": 1.46, "delta_pp": 0.7}, {"instituicao": "Banestes", "de": 0.36, "para": 0.45, "delta_pp": 0.09}]}, "unidade": "% do saldo do sistema", "data": "2019-12 a 2026-06", "fonte": "IF.data (BCB), cálculo por código em data/ifs (python -m pawatch ifs shares)", "ressalvas": ["perímetro do crédito muda de conglomerado financeiro (1005) para prudencial (1009) em 03/2025", "Cosif 2025 a partir de 03/2025 muda definições contábeis"], "confianca": "alta (cálculo reproduzível sobre fonte primária)"}, {"id": "F-040", "tema": "participacao", "afirmacao": "Participação do BB em 'Depósitos a prazo' no sistema: 14.49% (12/2019) → 13.37% (06/2026)", "valor": {"serie_pct": {"201912": 14.49, "202212": 14.19, "202512": 12.91, "202606": 13.37}, "delta_pp": -1.12, "total_sistema_06_2026": 4763838195629.62, "maiores_ganhos": [{"instituicao": "BTG Pactual", "de": 1.73, "para": 4.29, "delta_pp": 2.56}, {"instituicao": "Sistema Sicredi", "de": 2.56, "para": 4.29, "delta_pp": 1.73}, {"instituicao": "C6 Bank", "de": 0.07, "para": 1.66, "delta_pp": 1.59}, {"instituicao": "XP", "de": 0.0, "para": 1.46, "delta_pp": 1.46}]}, "unidade": "% do saldo do sistema", "data": "2019-12 a 2026-06", "fonte": "IF.data (BCB), cálculo por código em data/ifs (python -m pawatch ifs shares)", "ressalvas": ["perímetro do crédito muda de conglomerado financeiro (1005) para prudencial (1009) em 03/2025", "Cosif 2025 a partir de 03/2025 muda definições contábeis"], "confianca": "alta (cálculo reproduzível sobre fonte primária)"}, {"id": "F-041", "tema": "participacao", "afirmacao": "Participação do BB em 'Depósitos totais' no sistema: 17.76% (12/2019) → 14.79% (06/2026)", "valor": {"serie_pct": {"201912": 17.76, "202212": 16.22, "202512": 14.24, "202606": 14.79}, "delta_pp": -2.97, "total_sistema_06_2026": 6931914790436.12, "maiores_ganhos": [{"instituicao": "Nubank", "de": 0.18, "para": 2.73, "delta_pp": 2.55}, {"instituicao": "BTG Pactual", "de": 0.96, "para": 3.21, "delta_pp": 2.25}, {"instituicao": "Sistema Sicredi", "de": 2.61, "para": 4.84, "delta_pp": 2.23}, {"instituicao": "Sistema Sicoob", "de": 3.25, "para": 5.24, "delta_pp": 1.99}]}, "unidade": "% do saldo do sistema", "data": "2019-12 a 2026-06", "fonte": "IF.data (BCB), cálculo por código em data/ifs (python -m pawatch ifs shares)", "ressalvas": ["perímetro do crédito muda de conglomerado financeiro (1005) para prudencial (1009) em 03/2025", "Cosif 2025 a partir de 03/2025 muda definições contábeis"], "confianca": "alta (cálculo reproduzível sobre fonte primária)"}, {"id": "F-042", "tema": "participacao", "afirmacao": "Participação do BB em 'LCA' no sistema: 49.38% (12/2019) → 32.55% (06/2026)", "valor": {"serie_pct": {"201912": 49.38, "202212": 36.31, "202512": 35.62, "202606": 32.55}, "delta_pp": -16.83, "total_sistema_06_2026": 563317546922.21, "maiores_ganhos": [{"instituicao": "Sistema Sicredi", "de": 0.77, "para": 7.62, "delta_pp": 6.85}, {"instituicao": "Sistema Sicoob", "de": 2.04, "para": 7.42, "delta_pp": 5.38}, {"instituicao": "BTG Pactual", "de": 1.13, "para": 3.02, "delta_pp": 1.89}, {"instituicao": "Bradesco", "de": 8.56, "para": 10.42, "delta_pp": 1.86}]}, "unidade": "% do saldo do sistema", "data": "2019-12 a 2026-06", "fonte": "IF.data (BCB), cálculo por código em data/ifs (python -m pawatch ifs shares)", "ressalvas": ["perímetro do crédito muda de conglomerado financeiro (1005) para prudencial (1009) em 03/2025", "Cosif 2025 a partir de 03/2025 muda definições contábeis"], "confianca": "alta (cálculo reproduzível sobre fonte primária)"}, {"id": "F-043", "tema": "participacao", "afirmacao": "Participação do BB em 'LCI' no sistema: 11.96% (12/2019) → 2.87% (06/2026)", "valor": {"serie_pct": {"201912": 11.96, "202212": 5.12, "202512": 3.22, "202606": 2.87}, "delta_pp": -9.09, "total_sistema_06_2026": 537293819385.82, "maiores_ganhos": [{"instituicao": "Caixa Econômica Federal", "de": 33.95, "para": 50.47, "delta_pp": 16.52}, {"instituicao": "Itaú Unibanco", "de": 5.37, "para": 14.99, "delta_pp": 9.62}, {"instituicao": "Inter", "de": 1.22, "para": 2.31, "delta_pp": 1.09}]}, "unidade": "% do saldo do sistema", "data": "2019-12 a 2026-06", "fonte": "IF.data (BCB), cálculo por código em data/ifs (python -m pawatch ifs shares)", "ressalvas": ["perímetro do crédito muda de conglomerado financeiro (1005) para prudencial (1009) em 03/2025", "Cosif 2025 a partir de 03/2025 muda definições contábeis"], "confianca": "alta (cálculo reproduzível sobre fonte primária)"}, {"id": "F-044", "tema": "participacao", "afirmacao": "Participação do BB em 'Captações totais' no sistema: 18.37% (12/2019) → 14.5% (06/2026)", "valor": {"serie_pct": {"201912": 18.37, "202212": 17.13, "202512": 14.34, "202606": 14.5}, "delta_pp": -3.87, "total_sistema_06_2026": 14268909841195.84, "maiores_ganhos": [{"instituicao": "BTG Pactual", "de": 1.48, "para": 4.41, "delta_pp": 2.93}, {"instituicao": "XP", "de": 0.26, "para": 1.81, "delta_pp": 1.55}, {"instituicao": "Sistema Sicredi", "de": 1.71, "para": 3.22, "delta_pp": 1.51}, {"instituicao": "Nubank", "de": 0.09, "para": 1.6, "delta_pp": 1.51}]}, "unidade": "% do saldo do sistema", "data": "2019-12 a 2026-06", "fonte": "IF.data (BCB), cálculo por código em data/ifs (python -m pawatch ifs shares)", "ressalvas": ["perímetro do crédito muda de conglomerado financeiro (1005) para prudencial (1009) em 03/2025", "Cosif 2025 a partir de 03/2025 muda definições contábeis"], "confianca": "alta (cálculo reproduzível sobre fonte primária)"}, {"id": "F-045", "tema": "participacao", "afirmacao": "Participação do BB em 'Ativo total' no sistema: 15.62% (12/2019) → 13.28% (06/2026)", "valor": {"serie_pct": {"201912": 15.62, "202212": 14.73, "202512": 13.39, "202606": 13.28}, "delta_pp": -2.34, "total_sistema_06_2026": 19458902519890.11, "maiores_ganhos": [{"instituicao": "BTG Pactual", "de": 1.96, "para": 4.56, "delta_pp": 2.6}, {"instituicao": "Sistema Sicoob", "de": 1.8, "para": 3.75, "delta_pp": 1.95}, {"instituicao": "Nubank", "de": 0.22, "para": 2.01, "delta_pp": 1.79}, {"instituicao": "Sistema Sicredi", "de": 1.78, "para": 3.37, "delta_pp": 1.59}]}, "unidade": "% do saldo do sistema", "data": "2019-12 a 2026-06", "fonte": "IF.data (BCB), cálculo por código em data/ifs (python -m pawatch ifs shares)", "ressalvas": ["perímetro do crédito muda de conglomerado financeiro (1005) para prudencial (1009) em 03/2025", "Cosif 2025 a partir de 03/2025 muda definições contábeis"], "confianca": "alta (cálculo reproduzível sobre fonte primária)"}, {"id": "F-046", "tema": "participacao", "afirmacao": "Participação do BB em 'Patrimônio líquido' no sistema: 10.81% (12/2019) → 10.48% (06/2026)", "valor": {"serie_pct": {"201912": 10.81, "202212": 11.98, "202512": 11.25, "202606": 10.48}, "delta_pp": -0.33, "total_sistema_06_2026": 1741431940036.39, "maiores_ganhos": [{"instituicao": "BTG Pactual", "de": 2.32, "para": 4.59, "delta_pp": 2.27}, {"instituicao": "Nubank", "de": 0.11, "para": 2.2, "delta_pp": 2.09}, {"instituicao": "Sistema Sicoob", "de": 2.11, "para": 3.68, "delta_pp": 1.57}, {"instituicao": "Sistema Sicredi", "de": 2.15, "para": 3.66, "delta_pp": 1.51}]}, "unidade": "% do saldo do sistema", "data": "2019-12 a 2026-06", "fonte": "IF.data (BCB), cálculo por código em data/ifs (python -m pawatch ifs shares)", "ressalvas": ["perímetro do crédito muda de conglomerado financeiro (1005) para prudencial (1009) em 03/2025", "Cosif 2025 a partir de 03/2025 muda definições contábeis"], "confianca": "alta (cálculo reproduzível sobre fonte primária)"}, {"id": "F-047", "tema": "participacao", "afirmacao": "Participação do BB em 'Rendas de tarifas' no sistema: 19.67% (12/2019) → 15.54% (06/2026)", "valor": {"serie_pct": {"201912": 19.67, "202212": 16.58, "202512": 15.43, "202606": 15.54}, "delta_pp": -4.13, "total_sistema_06_2026": 20793876528.44, "maiores_ganhos": [{"instituicao": "Santander Brasil", "de": 8.89, "para": 13.45, "delta_pp": 4.56}, {"instituicao": "Sistema Sicredi", "de": 1.38, "para": 3.43, "delta_pp": 2.05}, {"instituicao": "BTG Pactual", "de": 0.08, "para": 1.93, "delta_pp": 1.85}, {"instituicao": "Sistema Sicoob", "de": 1.43, "para": 3.21, "delta_pp": 1.78}]}, "unidade": "% do saldo do sistema", "data": "2019-12 a 2026-06", "fonte": "IF.data (BCB), cálculo por código em data/ifs (python -m pawatch ifs shares)", "ressalvas": ["perímetro do crédito muda de conglomerado financeiro (1005) para prudencial (1009) em 03/2025", "Cosif 2025 a partir de 03/2025 muda definições contábeis"], "confianca": "alta (cálculo reproduzível sobre fonte primária)"}, {"id": "F-048", "tema": "participacao", "afirmacao": "Participação do BB em 'Agências' no sistema: 20.41% (12/2019) → 26.4% (06/2026)", "valor": {"serie_pct": {"201912": 20.41, "202212": 21.42, "202512": 24.77, "202606": 26.4}, "delta_pp": 5.99, "total_sistema_06_2026": 14922.0, "maiores_ganhos": [{"instituicao": "Caixa Econômica Federal", "de": 15.78, "para": 20.12, "delta_pp": 4.34}, {"instituicao": "Banrisul", "de": 2.44, "para": 3.41, "delta_pp": 0.97}, {"instituicao": "Safra", "de": 0.56, "para": 1.27, "delta_pp": 0.71}, {"instituicao": "Banco do Nordeste", "de": 1.38, "para": 2.02, "delta_pp": 0.64}]}, "unidade": "% do total", "data": "2019-12 a 2026-06", "fonte": "IF.data (BCB), cálculo por código em data/ifs (python -m pawatch ifs shares)", "ressalvas": ["perímetro do crédito muda de conglomerado financeiro (1005) para prudencial (1009) em 03/2025", "Cosif 2025 a partir de 03/2025 muda definições contábeis"], "confianca": "alta (cálculo reproduzível sobre fonte primária)"}, {"id": "F-049", "tema": "participacao", "afirmacao": "Participação do BB em 'Clientes com crédito' no sistema: 8.14% (12/2019) → 8.22% (06/2026)", "valor": {"serie_pct": {"201912": 8.14, "202212": 6.71, "202512": 8.46, "202606": 8.22}, "delta_pp": 0.08, "total_sistema_06_2026": 405452526.0, "maiores_ganhos": [{"instituicao": "Nubank", "de": 4.62, "para": 16.22, "delta_pp": 11.6}, {"instituicao": "Mercado Pago", "de": 0.0, "para": 4.06, "delta_pp": 4.06}, {"instituicao": "PicPay", "de": 0.16, "para": 3.04, "delta_pp": 2.88}, {"instituicao": "C6 Bank", "de": 0.04, "para": 2.23, "delta_pp": 2.19}]}, "unidade": "% do total", "data": "2019-12 a 2026-06", "fonte": "IF.data (BCB), cálculo por código em data/ifs (python -m pawatch ifs shares)", "ressalvas": ["perímetro do crédito muda de conglomerado financeiro (1005) para prudencial (1009) em 03/2025", "Cosif 2025 a partir de 03/2025 muda definições contábeis"], "confianca": "alta (cálculo reproduzível sobre fonte primária)"}, {"id": "F-050", "tema": "participacao", "afirmacao": "Participação do BB em 'Crédito na região Norte' no sistema: 24.18% (12/2019) → 21.35% (06/2026)", "valor": {"serie_pct": {"201912": 24.18, "202212": 22.5, "202512": 21.16, "202606": 21.35}, "delta_pp": -2.83, "total_sistema_06_2026": 421411395313.58, "maiores_ganhos": [{"instituicao": "Banco da Amazônia", "de": 0.6, "para": 6.13, "delta_pp": 5.53}, {"instituicao": "Nubank", "de": 0.23, "para": 3.39, "delta_pp": 3.16}, {"instituicao": "C6 Bank", "de": 0.0, "para": 1.68, "delta_pp": 1.68}, {"instituicao": "BTG Pactual", "de": 0.27, "para": 1.7, "delta_pp": 1.43}]}, "unidade": "% do saldo do sistema", "data": "2019-12 a 2026-06", "fonte": "IF.data (BCB), cálculo por código em data/ifs (python -m pawatch ifs shares)", "ressalvas": ["perímetro do crédito muda de conglomerado financeiro (1005) para prudencial (1009) em 03/2025", "Cosif 2025 a partir de 03/2025 muda definições contábeis"], "confianca": "alta (cálculo reproduzível sobre fonte primária)"}, {"id": "F-051", "tema": "participacao", "afirmacao": "Participação do BB em 'Crédito na região Nordeste' no sistema: 17.77% (12/2019) → 16.79% (06/2026)", "valor": {"serie_pct": {"201912": 17.77, "202212": 17.51, "202512": 16.69, "202606": 16.79}, "delta_pp": -0.98, "total_sistema_06_2026": 1084591339388.98, "maiores_ganhos": [{"instituicao": "Nubank", "de": 0.49, "para": 4.28, "delta_pp": 3.79}, {"instituicao": "C6 Bank", "de": 0.0, "para": 2.08, "delta_pp": 2.08}, {"instituicao": "BTG Pactual", "de": 0.18, "para": 1.4, "delta_pp": 1.22}, {"instituicao": "Mercado Pago", "de": 0.0, "para": 0.9, "delta_pp": 0.9}]}, "unidade": "% do saldo do sistema", "data": "2019-12 a 2026-06", "fonte": "IF.data (BCB), cálculo por código em data/ifs (python -m pawatch ifs shares)", "ressalvas": ["perímetro do crédito muda de conglomerado financeiro (1005) para prudencial (1009) em 03/2025", "Cosif 2025 a partir de 03/2025 muda definições contábeis"], "confianca": "alta (cálculo reproduzível sobre fonte primária)"}, {"id": "F-052", "tema": "participacao", "afirmacao": "Participação do BB em 'Crédito na região Centro-Oeste' no sistema: 23.95% (12/2019) → 22.74% (06/2026)", "valor": {"serie_pct": {"201912": 23.95, "202212": 22.92, "202512": 22.84, "202606": 22.74}, "delta_pp": -1.21, "total_sistema_06_2026": 931640160575.32, "maiores_ganhos": [{"instituicao": "Nubank", "de": 0.22, "para": 2.03, "delta_pp": 1.81}, {"instituicao": "BTG Pactual", "de": 0.84, "para": 2.29, "delta_pp": 1.45}, {"instituicao": "Sistema Sicoob", "de": 1.04, "para": 2.21, "delta_pp": 1.17}, {"instituicao": "Sistema Sicredi", "de": 4.22, "para": 5.27, "delta_pp": 1.05}]}, "unidade": "% do saldo do sistema", "data": "2019-12 a 2026-06", "fonte": "IF.data (BCB), cálculo por código em data/ifs (python -m pawatch ifs shares)", "ressalvas": ["perímetro do crédito muda de conglomerado financeiro (1005) para prudencial (1009) em 03/2025", "Cosif 2025 a partir de 03/2025 muda definições contábeis"], "confianca": "alta (cálculo reproduzível sobre fonte primária)"}, {"id": "F-053", "tema": "participacao", "afirmacao": "Participação do BB em 'Crédito na região Sudeste' no sistema: 14.59% (12/2019) → 11.52% (06/2026)", "valor": {"serie_pct": {"201912": 14.59, "202212": 12.87, "202512": 11.78, "202606": 11.52}, "delta_pp": -3.07, "total_sistema_06_2026": 3434534516246.44, "maiores_ganhos": [{"instituicao": "Nubank", "de": 0.3, "para": 2.44, "delta_pp": 2.14}, {"instituicao": "PagBank (PagSeguro)", "de": 0.0, "para": 1.35, "delta_pp": 1.35}, {"instituicao": "Sistema Sicoob", "de": 1.76, "para": 2.97, "delta_pp": 1.21}, {"instituicao": "Itaú Unibanco", "de": 13.5, "para": 14.69, "delta_pp": 1.19}]}, "unidade": "% do saldo do sistema", "data": "2019-12 a 2026-06", "fonte": "IF.data (BCB), cálculo por código em data/ifs (python -m pawatch ifs shares)", "ressalvas": ["perímetro do crédito muda de conglomerado financeiro (1005) para prudencial (1009) em 03/2025", "Cosif 2025 a partir de 03/2025 muda definições contábeis"], "confianca": "alta (cálculo reproduzível sobre fonte primária)"}, {"id": "F-054", "tema": "participacao", "afirmacao": "Participação do BB em 'Crédito na região Sul' no sistema: 16.93% (12/2019) → 13.34% (06/2026)", "valor": {"serie_pct": {"201912": 16.93, "202212": 15.35, "202512": 13.49, "202606": 13.34}, "delta_pp": -3.59, "total_sistema_06_2026": 1486029387730.84, "maiores_ganhos": [{"instituicao": "Sistema Sicredi", "de": 6.93, "para": 10.03, "delta_pp": 3.1}, {"instituicao": "Sistema Sicoob", "de": 2.4, "para": 4.38, "delta_pp": 1.98}, {"instituicao": "Nubank", "de": 0.3, "para": 1.89, "delta_pp": 1.59}, {"instituicao": "C6 Bank", "de": 0.0, "para": 0.98, "delta_pp": 0.98}]}, "unidade": "% do saldo do sistema", "data": "2019-12 a 2026-06", "fonte": "IF.data (BCB), cálculo por código em data/ifs (python -m pawatch ifs shares)", "ressalvas": ["perímetro do crédito muda de conglomerado financeiro (1005) para prudencial (1009) em 03/2025", "Cosif 2025 a partir de 03/2025 muda definições contábeis"], "confianca": "alta (cálculo reproduzível sobre fonte primária)"}], "fontes_disponiveis": ["CNPJ (8 dígitos base / 14 completo)", "Código IF.data / conglomerado (C00xxxxx)", "ISPB", "Código COMPE (número do banco)", "Código CVM", "Ticker e ISIN", "LEI (ISO 17442)", "CIK", "RSSD (Fed) e CERT (FDIC)", "IF.data: arquivos JSON do site (www3.bcb.gov.br/ifdata)", "IF.data: API OData (Olinda)", "Balancetes e balanços (Cosif): documentos 4010, 4016, 4040, 4046, 4060, 4066", "Cosif: plano de contas e manual", "DASFN: Pilar 3 como API (dados abertos das instituições do SFN)", "SGS: Sistema Gerenciador de Séries Temporais", "Relatório de Estabilidade Financeira (REF)", "Relatório de Economia Bancária (REB)", "Ranking de Instituições por Índice de Reclamações", "Ranking de Qualidade de Ouvidorias", "Taxas de juros por instituição e modalidade", "Tarifas bancárias por instituição", "Relação de instituições em funcionamento (Unicad)", "BcBase: dados cadastrais de entidades supervisionadas", "Pix: estatísticas por participante e por município", "ESTBAN: estatística bancária por município e por agência (documento 4500)", "Agências, postos de atendimento, postos eletrônicos e correspondentes", "Open Finance Brasil: diretório de participantes", "Open Finance Brasil: APIs abertas de produtos, tarifas, taxas e canais (antiga fase 1)", "DASFN: canais de atendimento, taxas de cartões e pontos de Pix Saque/Troco", "CVM: cadastro de companhias abertas", "CVM: DFP e ITR (demonstrações padronizadas)", "CVM: Formulário de Referência (FRE)", "CVM: IPE (informações periódicas e eventuais): fatos relevantes, comunicados, releases, ratings", "CVM: RAD/ENET (consulta externa de documentos)", "B3: séries históricas de cotações (COTAHIST)", "B3: APIs do site de empresas listadas (proventos, eventos, capital)", "Sites de relações com investidores (RI) dos bancos", "FEBRABAN e ABBC: dados agregados do setor", "Receita Federal: CNPJ dados abertos (Empresas, Estabelecimentos, Sócios)", "APIs de consulta unitária de CNPJ (BrasilAPI, minhareceita.org)", "GLEIF: LEI nível 1 e relações nível 2 (pai direto e final)", "Juntas Comerciais (JUCESP, JUCERJA...) e REDESIM", "SEC EDGAR: submissions API (lista de filings por empresa)", "SEC EDGAR: XBRL companyfacts, companyconcept e frames", "FDIC BankFind Suite API (instituições, financials, histórico, agências)", "FFIEC CDR: call reports (FFIEC 031/041/051) e UBPR", "FFIEC NIC: FR Y-9C (holdings) e estrutura organizacional", "Federal Reserve: Large Commercial Banks (lista trimestral)", "BCE: Supervisory Banking Statistics (SUP) e Consolidated Banking Data (CBD2)", "EBA: EU-wide Transparency Exercise (última edição 2025)", "EBA Pillar 3 Data Hub (P3DH) no EDAP", "Relatórios de Pilar 3 dos bancos globais (PDF/XLSX nos sites)", "FSB/BCBS: lista de G-SIBs e indicadores do exercício", "BIS: Consolidated Banking Statistics", "EDINET (FSA do Japão): relatórios de valores mobiliários", "Yahoo Finance (endpoint não oficial de gráficos)", "Stooq (CSV de preços)", "Templates de divulgação do BCBS (Pilar 3: KM1, OV1, CC1, LR1, LIQ1, NSFR...)", "Taxonomias XBRL: IFRS Accounting Taxonomy e US GAAP", "FIBO (Financial Industry Business Ontology)", "MDRM (FFIEC/Fed) e EBA DPM (FINREP/COREP)", "Cadastro mestre e chaves", "Números prudenciais e contábeis do Brasil", "Produtos, preços e reputação", "Estrutura dos conglomerados", "Geografia e extração de releases", "Bancos globais", "BCB SGS - Sistema Gerenciador de Séries Temporais", "SCR.data - Painel de Operações de Crédito", "IF.data", "ESTBAN - Estatística Bancária por Município", "SICOR - Matriz de Dados do Crédito Rural", "Relatório Focus - expectativas de mercado", "Busca de normativos do BCB/CMN", "CVM Dados Abertos - IPE (fatos relevantes, comunicados, releases)", "CVM Dados Abertos - ITR/DFP (demonstrações financeiras)", "Sites de RI dos bancos (Análise do Desempenho, séries históricas, guidance)", "B3 - cotações históricas (COTAHIST) e derivativos", "Yahoo Finance chart API (não oficial)", "CONAB - Acompanhamento da Safra de Grãos e séries históricas", "IBGE LSPA - Levantamento Sistemático da Produção Agrícola (SIDRA t.6588)", "IBGE PAM - Produção Agrícola Municipal (SIDRA t.5457)", "IBGE PPM (pecuária municipal) e Censo Agropecuário 2017", "MAPA - ZARC (Zoneamento Agrícola de Risco Climático): tábua de risco e cultivares", "MAPA - SISSER / Atlas do Seguro Rural (PSR)", "SUSEP SES - estatísticas de seguros (ramo rural)", "Embrapa AgroAPI (ClimAPI, SATVeg, Agritec, AgroTermos...)", "CEPEA/ESALQ - indicadores de preços agropecuários", "USDA WASDE e FAS PSD Online", "World Bank Commodity Price Data (Pink Sheet)", "Comex Stat - exportações e importações por NCM, país e UF/município", "ANDA - entregas de fertilizantes", "INMET - estações meteorológicas (API e dados históricos)", "CHIRPS v3.0 - precipitação por satélite + estações", "ERA5 / ERA5-Land (Copernicus Climate Data Store)", "NOAA CPC - índices ENSO (ONI) e previsões", "CEMADEN - pluviômetros, umidade do solo e alertas", "Monitor de Secas (ANA)", "S2iD / Atlas Digital de Desastres (decretos de emergência)", "INPE TerraBrasilis - PRODES e DETER", "MapBiomas (cobertura e uso da terra, Alerta, Fogo, Água)", "SICAR - Cadastro Ambiental Rural", "IBAMA - áreas embargadas e autos de infração", "Cadastro de Empregadores (trabalho análogo à escravidão)", "IBGE - PIB trimestral, PNAD Contínua, IPCA, PMC, PMS, PIM", "Ipeadata", "FRED / ALFRED", "FMI (SDMX) e Banco Mundial (API de indicadores)", "Índice FipeZap (venda e locação residencial e comercial)", "ABECIP - financiamento imobiliário (SBPE) e poupança", "IVG-R e séries imobiliárias do BCB", "Fenabrave (emplacamentos) e Anfavea (produção, vendas, exportação)", "B3 - financiamentos de veículos (SNG)", "Novo CAGED e RAIS (PDET/MTE)", "INSS/Dataprev e CNPS - benefícios e teto de juros do consignado", "Serasa Experian (inadimplência, recuperações judiciais) e CNC PEIC", "CNJ Datajud - API pública de processos", "GDELT DOC 2.0 e GKG", "RSS de imprensa econômica e agro (Agência Brasil, InfoMoney, Valor, Notícias Agrícolas, Canal Rural)"]}

REGISTRO v0:
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
