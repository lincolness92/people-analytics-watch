# Tema `risco-credito-ia` (Credit Risk AI Watch): revisão do rascunho e primeira coleta

Pedido: issue #1 ("Risco de crédito com IA"). Criado em 26/11/2026 pela rotina "Peça o seu Watch".

## Como o rascunho foi feito

- `new-topic` com o LLM padrão falhou: o DeepSeek V4.1 Flash teve a saída cortada no limite de 9000 tokens nas quatro rotas, o Qwen 3.5 não estava disponível e o gpt-oss-120b não respondeu em 25 min.
- O rascunho (`.draft.json`) foi então escrito a partir do escopo, das perguntas e das fontes do pedido. O `new-topic` o reaproveitou para testar as buscas no OpenAlex, confirmar pesquisadores e journals e procurar feeds.
- Resultado: 13 de 18 pesquisadores sugeridos confirmados automaticamente. Os outros 5 (Fuster, Ramadorai, Blattner, Gillis, Babaev) foram conferidos à mão no OpenAlex. 21 autores vieram das citações, e 10 foram retirados por estarem fora do escopo ou terem sinal fraco (bonds corporativos, ML genérico, coautores de um paper só, afiliação de homônimo).

## Revisão independente (outro modelo, Fable)

25 correções (7 altas, 12 médias, 6 baixas) e 11 sugestões. O relatório completo está abaixo.

**Aplicado:** 23 das 25 correções na íntegra; R3 em parte; T3 superada pelas âncoras reais de T4. Das 11 sugestões, 10 aplicadas (P1, P2, Q8, Q9, R6, T4, T5, T6, F1, E2); R7 só pedia manter os termos.
- R1: SR 26-2 (17/4/2026) entra como marco vigente; a SR 11-7 fica como histórica. Conferido na página do Fed.
- R3 em parte: as normas do Bacen/CMN (4.557, BCB 303, BCB 352, 5.004, 5.349, 5.350, BCB 610, BCB 601) não entram como marcos curados. A busca do Bacen já as traz, e elas apareceriam duas vezes no site. Os termos de busca foram ampliados para cobri-las (R5), e o marco curado da Resolução CMN 4.966 saiu pelo mesmo motivo. Entrou só a Lei 15.252/2025, que é lei e não norma do Bacen. A primeira coleta, abaixo, mostra se as normas foram achadas.
- R6: entraram os marcos com data conferida na página: BCBS (princípios de risco de crédito de 2025 e newsletter de IA/ML de 2022), FSB (2024), acórdão SCHUFA, CCD2, Lei 12.414, Lei 14.690, CDC art. 42 e PL 2338.
- T4: as âncoras de triagem agora são três papers reais e uma norma real (escolhidos pela revisão), mais duas âncoras baixas de exemplo (dados UCI e crédito corporativo).

**Precisa de decisão humana:**
- Escopo (T6): o `audience` foi além do pedido e inclui LGD/EAD, IFRS 9, capital e PMEs tratadas como varejo. Confirmar com o solicitante.
- Não verificado: a situação atual da Circular 2022-03 do CFPB (site com 403; o marco diz "verificar"); as páginas do Planalto, que não responderam deste ambiente (as URLs seguem o padrão das já usadas em outros temas); a URL das diretrizes de PD/LGD da EBA (não incluídas).
- Correa-Bahnsen: a instituição atual não foi verificada.
- Feng Shen está no limite do escopo, porque os trabalhos recentes são de bonds corporativos.

## Primeira coleta (30 dias, 27/10 a 26/11/2026)

`python -m pawatch run --topic risco-credito-ia --lookback 30`:

| Etapa | Resultado |
|---|---|
| OpenAlex | 26 chamadas (≈ US$ 0,02), 557 resultados brutos |
| arXiv | 19 na janela |
| Fontes web | 25 itens de 9 das 17 fontes: Bacen 7, PRA 4, Fed 6, BIS 5, NY Fed 3. Sem itens no período: CRC, FSI, Febraban, EBA, Philadelphia Fed, FSB, Nubank, NBER |
| Candidatos após dedupe | 473; 220 foram à triagem (teto `max_candidates_for_llm`; na janela diária de 7 dias o teto não deve ser atingido) |
| Biblioteca | +58 papers com nota ≥ 5 |
| Digest | 12 selecionados e 6 menções; custo do LLM US$ 0,037 (9 chamadas, 1 falha com fallback) |
| Regulação (Bacen) | 605 normas encontradas pelos 15 termos e triadas; 150 com nota ≥ 6, 147 delas com ficha e no site. Notas: 75 com 6, 43 com 7, 21 com 8, 10 com 9 e 1 com 10 |

**Digest:** "Semana de avanços regulatórios no crédito e validação de modelos sob mudança de regime". Os 12 itens estão
no escopo do pedido:
- cobrança (3): alocação de casos com restrição de capacidade, benchmark de avaliação off-policy em cobrança
  (JUBILEE) e *forbearance* hipotecário;
- modelos fundacionais em transações (4): o paper que compara modelos fundacionais e gradient boosting em sequências
  financeiras (pergunta 1 do pedido), TAPES, ID2Pattern e INTENT;
- validação e risco de modelo (2), perda esperada (1);
- regulação (2): as novas regras do BC e do CMN de 25/11 sobre oferta de crédito e endividamento.

**Normas-chave achadas pela busca:** Res. CMN 4.966 (nota 10), Res. BCB 303 (IRB, 9), Res. CMN 5.004 (9), Res. CMN
5.350 (8), Res. CMN 5.349 (7) e Res. BCB 601 (7).

**Normas-chave que a busca não trouxe**, por isso viraram marcos curados:
- Res. BCB 610 (limites do rotativo) teve nota 1 e Res. BCB 352 (provisão) nota 3. A triagem lê só a ementa
  ("Altera a Resolução BCB nº 96… contas de pagamento"), que não diz do que a norma trata.
- Res. CMN 4.557 nem aparece: até 2020 as resoluções do CMN têm o tipo "Resolução", que não está em
  `bacen.types` deste tema nem dos outros (ver "decisão humana" no PR).

**Execução:** o `run` foi interrompido pelo limite de 50 min da rotina quando já gravava as fichas (110 de 150). O
digest já estava salvo. As fichas foram completadas com `python -m pawatch regulation --topic risco-credito-ia` e o
Markdown com `python -m pawatch render`.

---

## Relatório da revisão: Revisão do rascunho do tema `risco-credito-ia`

Revisado em 26/11/2026 contra o pedido "Risco de crédito com IA". Nenhum arquivo do repositório foi alterado. As correções em formato aplicável estão em um JSON à parte (não versionado) (mesmos IDs).

**Resultado:** 25 correções (7 altas, 12 médias, 6 baixas) e 11 sugestões.

### As cinco mais importantes

1. **R1** — a SR 11-7 foi substituída pela SR 26-2 em 17/4/2026; o rascunho a trata como vigente.
2. **R3** — faltam as normas brasileiras centrais, inclusive o pacote de 25/11/2026 sobre endividamento, limites do rotativo e renegociação (CMN 5.349, CMN 5.350, BCB 610).
3. **T1** — `prefilter_keywords` tem `ead`, `irb` e termos genéricos sem limite de palavra; quase todo abstract vira "no tema" e ganha bônus de journal de elite.
4. **Q5 e Q7** — não há busca de modelos fundacionais em transações sem termo de crédito; o paper de 13/11/2026 que responde à pergunta 1 do pedido não é achado pela busca do arXiv nem pela busca 6.
5. **Q1** — a busca de cobrança traz ruído por causa de `"collections strategy"` (14 resultados em 30 dias, todos fora do tema).

### O que foi conferido e o que não foi

- **Conferido:** os 31 IDs de autor e os 14 de journal no OpenAlex (nenhum homônimo; 3 perfis divididos); todas as URLs do rascunho por HTTP; cada busca do OpenAlex e a do arXiv com janela de 30 dias; cada fonte web com o código do projeto (`web.list_urls`, `web.parse_feed`); cada termo do Bacen com `regulation.bcb_search`; textos das normas do BCB com `regulation.bcb_text`; as contas de `final_score` das 5 âncoras (todas corretas).
- **Datas e fatos dos marcos do rascunho:** sem erro encontrado além de R1 e R2. As datas foram conferidas contra o que eu sei de cada norma, e na própria página só para Resolução CMN 4.966 e para as publicações do BIS; não reli os textos integrais. As URLs antigas do BIS e da EBA redirecionam e respondem 200.
- **Não verificado:** situação atual da Circular 2022-03 do CFPB (site devolve 403); se Jonathan Crook segue como diretor do CRC; o anexo da SR 26-2 (só li a carta); a citação de Calabrese em W4 e três datas em R6 (marcadas "de memória"); o conteúdo integral das normas de 25/11/2026 (li os trechos citados nos resumos).
- **Limite do teste do arXiv:** a API devolveu páginas de tamanhos diferentes entre chamadas; os números de Q7 devem ser repetidos.

### 1. Pessoas e instituições

#### Correções

**W1 — severidade alta**  
Arquivo e campo: `topics/risco-credito-ia/watchlist.json: researchers[Stefan Lessmann, Christophe Pérignon, Alejandro Correa-Bahnsen]`  
Problema: Perfis divididos no OpenAlex. Os trabalhos de 2026 de Lessmann em crédito (Tabular Foundation Models for Credit Risk Prediction, findr) estão em outro perfil; o ID de Pérignon é o perfil menor (27 trabalhos, h 12) e o principal tem 78 trabalhos e h 23; o de Correa-Bahnsen tem 6 trabalhos e o principal tem 21 e h 14. Nenhum ID aponta para homônimo.  
Correção: 
```json
{
 "set_alt_openalex_ids": {
  "Stefan Lessmann": [
   "A5120407920"
  ],
  "Christophe Pérignon": [
   "A5111672040",
   "A5121166378"
  ],
  "Alejandro Correa-Bahnsen": [
   "A5078471733"
  ]
 },
 "note": "O perfil principal de Correa-Bahnsen é dominado por fraude em cartão; instituição conhecida é a Rappi (não verificado no OpenAlex, que mostra UC Berkeley)."
}
```

**W2 — severidade média**  
Arquivo e campo: `topics/risco-credito-ia/watchlist.json: researchers`  
Problema: Fora do escopo do pedido (crédito corporativo e mercado de capitais ficam fora) ou generalistas. O coletor traz todos os trabalhos do autor com bônus de +3 no prefilter. Nazemi: recuperação de títulos corporativos e retornos de bonds. Hájek: 577 trabalhos, recentes sobre emissões, IVA e simulação cardíaca. Korangi: 7 trabalhos, o mais citado é default de empresas mid-cap; também soberanos.  
Correção: 
```json
{
 "remove": [
  "Abdolreza Nazemi (A5021618573)",
  "Petr Hájek (A5036484429)",
  "Kamesh Korangi (A5032019506)"
 ],
 "borderline_keep": "Feng Shen (A5101877322): reject inference está no tema, mas os trabalhos de 2026 são de bonds corporativos."
}
```

**W3 — severidade média**  
Arquivo e campo: `topics/risco-credito-ia/watchlist.json: centers[Financial Stability Institute (FSI/BIS)].url`  
Problema: https://www.bis.org/fsi/ devolve 404.  
Correção: 
```json
{
 "replace_with": "https://www.bis.org/about/fsi/overview"
}
```

**W4 — severidade baixa**  
Arquivo e campo: `topics/risco-credito-ia/watchlist.json: researchers[*].area, .why`  
Problema: Textos gerados automaticamente com erro: (a) Harald Scheule com área 'Risco sistêmico de carteiras hipotecárias'; ele é coautor de Credit Risk Analytics (2016) e trabalha com LGD e provisões. (b) Mee Chi So, Feng Shen e Kamesh Korangi repetem o mesmo título duas vezes. (c) Hurlin é justificado por um paper de 2 citações. (d) Calabrese: 'Modelling SME loan defaults as rare events, JORS 2016' parece misturar dois artigos (de memória: o de eventos raros é do Journal of Applied Statistics, 2013; não verificado).  
Correção: 
```json
{
 "Harald Scheule": {
  "area": "LGD, provisões e risco de crédito hipotecário",
  "why": "Coautor de Credit Risk Analytics: Measurement Techniques, Applications, and Examples (2016) e de The impact of loan loss provisioning on bank capital requirements (2018)."
 },
 "Mee Chi So": {
  "why": "Modelling repayment patterns in the collections process for unsecured consumer debt (2015) e Debtor level collection operations using Bayesian dynamic programming (2019)."
 },
 "Christophe Hurlin": {
  "why": "Machine Learning or Econometrics for Credit Scoring: Let's Get the Best of Both Worlds (609 citações no OpenAlex) e The Fairness of Credit Scoring Models."
 },
 "Raffaella Calabrese": {
  "why": "Interpretable machine learning for imbalanced credit scoring datasets (2023) e Enhancing credit scoring with alternative data (2020)."
 }
}
```

**W5 — severidade média**  
Arquivo e campo: `topics/risco-credito-ia/watchlist.json: journals[Expert Systems with Applications]`  
Problema: Megajournal (32.897 trabalhos no OpenAlex). O coletor de journals pega no máximo 300 trabalhos por execução somando os 14 journals; ESWA e EJOR sozinhos enchem a cota e cortam os demais. Com o defeito T1, esses itens ainda ganham bônus de elite.  
Correção: 
```json
{
 "remove": "Expert Systems with Applications (S13144211)",
 "note": "Os papers de crédito do ESWA continuam entrando pelas buscas."
}
```

#### Sugestões

**P1**  
Incluir quem falta em cobrança, modelos em transações, validação e Brasil. IDs conferidos no OpenAlex em 26/11/2026.  
Proposta: 
```json
{
 "add_researchers": [
  {
   "name": "Naveed Chehrazi",
   "institution": "Washington University in St. Louis",
   "region": "EUA",
   "area": "Otimização de cobrança de cartões",
   "why": "Dynamic Credit-Collections Optimization (Management Science, 2019) e Dynamic Valuation of Delinquent Credit-Card Accounts.",
   "openalex_id": "A5082576697",
   "openalex_note": "conferido; h-index 8, 15 trabalhos; também publica sobre estoques",
   "links": {}
  },
  {
   "name": "Christine Laudenbach",
   "institution": "Goethe University Frankfurt / SAFE",
   "region": "Europa",
   "area": "Experimentos em cobrança e crédito ao consumidor",
   "why": "Personal Communication in an Automated World: Evidence from Loan Repayments (Journal of Finance, 2024) e Leveraging BNPL Data in Consumer Banking (2025).",
   "openalex_id": "A5063735471",
   "openalex_note": "conferido; h-index 13, 42 trabalhos",
   "links": {}
  },
  {
   "name": "Rinaldo Artes",
   "institution": "Insper",
   "region": "Brasil",
   "area": "Credit scoring e recuperação de crédito no Brasil",
   "why": "Spatial dependence in credit risk and its improvement in credit scoring; The role of loan forbearance in the recovery of financi... (2026); Estimating credit and profit scoring of a Brazilian credit union (2019).",
   "openalex_id": "A5047598029",
   "openalex_note": "conferido; h-index 23, 87 trabalhos; também publica em bioestatística",
   "links": {}
  },
  {
   "name": "Herbert Kimura",
   "institution": "Universidade de Brasília",
   "region": "Brasil",
   "area": "ML em risco de crédito no Brasil",
   "why": "Machine learning models for credit analysis improvements: Predicting low-income families' default (Applied Soft Computing, 2019) e Machine learning predictivity applied to consumer creditworthiness (2020).",
   "openalex_id": "A5090500337",
   "openalex_note": "conferido; h-index 36, 212 trabalhos; generalista de finanças",
   "links": {},
   "alt_openalex_ids": [
    "A5112787166"
   ]
  },
  {
   "name": "Flávio Barboza",
   "institution": "Universidade Federal de Uberlândia",
   "region": "Brasil",
   "area": "ML em crédito e equidade no Brasil",
   "why": "Coautor dos dois trabalhos acima e de Towards Fair AI: Mitigating Bias in Credit Decisions — A Systematic Literature Review.",
   "openalex_id": "A5052752987",
   "openalex_note": "conferido; h-index 14, 58 trabalhos",
   "links": {}
  },
  {
   "name": "Sérgio Mikio Koyama",
   "institution": "Banco Central do Brasil",
   "region": "Brasil",
   "area": "Crédito e risco de crédito no Brasil (pesquisa do BCB)",
   "why": "Credit Risk Measurement and the Regulation of Bank Capital and Provision Requirements e estudos de elasticidade da demanda de crédito livre.",
   "openalex_id": "A5004535304",
   "openalex_note": "conferido; h-index 7, 19 trabalhos",
   "links": {}
  },
  {
   "name": "Ivan Kireev",
   "institution": "Sber AI Lab",
   "region": "Outros",
   "area": "Modelos de sequências de eventos bancários",
   "why": "CoLES: Contrastive Learning for Event Sequences with Self-Supervision (SIGMOD 2022), LLM4ES e Multimodal Banking Dataset (2025).",
   "openalex_id": "A5015195285",
   "openalex_note": "conferido; h-index 8, 11 trabalhos; OpenAlex sem instituição",
   "links": {}
  },
  {
   "name": "Chin-Chia Michael Yeh",
   "institution": "Visa Research",
   "region": "EUA",
   "area": "Modelos fundacionais de transações",
   "why": "TransactionGPT (arXiv, 2025) e TREASURE: A Transformer-Based Foundation Model for High-Volume Transaction Understanding (KDD 2026).",
   "openalex_id": "A5011045620",
   "openalex_note": "conferido; h-index 28, 101 trabalhos; publica também ML genérico",
   "links": {}
  },
  {
   "name": "Wouter Verbeke",
   "institution": "KU Leuven",
   "region": "Europa",
   "area": "Modelos orientados a lucro e inferência causal em decisões de crédito",
   "why": "Profit-driven analytics e explicabilidade em pesquisa operacional (Explainable AI for Operational Research, EJOR 2023).",
   "openalex_id": "A5075484247",
   "openalex_note": "conferido; h-index 37, 190 trabalhos; OpenAlex aponta também LIRIS",
   "links": {}
  },
  {
   "name": "Joseph L. Breeden",
   "institution": "Deep Future Analytics",
   "region": "EUA",
   "area": "Risco de modelo, safras e perda esperada",
   "why": "A survey of machine learning in credit risk e Multihorizon discrete time survival models.",
   "openalex_id": "A5031699638",
   "openalex_note": "conferido; h-index 13, 80 trabalhos; OpenAlex aponta Santa Fe Community College; perfil mistura trabalhos de física",
   "links": {}
  }
 ],
 "considered_not_added": "Sumit Agarwal (A5076309222), Leonardo Gambacorta (A5047191177) e David J. Hand (A5033380454) são referências, mas têm 260 a 738 trabalhos fora do tema; Tobias Berg (A5074576628) e Agus Sudjianto (A5001331464) têm perfis contaminados por homônimos. Autores do paper do Nubank (arXiv 2507.23267) não têm ID limpo no OpenAlex. Não consegui confirmar se Jonathan Crook segue como diretor do CRC."
}
```

**P2**  
Incluir os journals de praticantes de risco de crédito e de validação (IDs achados por busca de nome no OpenAlex).  
Proposta: 
```json
{
 "add_journals": [
  {
   "name": "The Journal of Credit Risk",
   "openalex_source_id": "S60036207"
  },
  {
   "name": "The Journal of Risk Model Validation",
   "openalex_source_id": "S2765036361"
  },
  {
   "name": "Journal of Banking Regulation",
   "openalex_source_id": "S185277049"
  }
 ]
}
```

### 2. Buscas

#### Correções

**Q1 — severidade alta**  
Arquivo e campo: `topics/risco-credito-ia/queries.json: openalex.queries[3]`  
Problema: A frase "collections strategy" não é tratada como frase exata: sozinha devolve 14 trabalhos em 30 dias, todos fora do tema (malware, design de proteínas, biblioteconomia). Sem ela a busca cai de 25 para 9 resultados, quase todos no tema.  
Correção: 
```json
{
 "replace_with": "(\"debt collection\" OR \"debt collections\" OR \"collection agency\" OR \"debt collectors\" OR \"delinquent accounts\" OR \"delinquent borrowers\" OR \"past-due\" OR \"loan recovery\" OR \"debt recovery\") AND (bank OR credit OR loan OR borrower OR consumer OR debtor)",
 "tested": "40 resultados em 30 dias; inclui artigos jurídicos de cobrança abusiva, que a triagem descarta."
}
```

**Q2 — severidade média**  
Arquivo e campo: `topics/risco-credito-ia/queries.json: openalex.queries[11]`  
Problema: "recovery rate" combinado com "machine learning" traz criptoanálise, aquecedor solar e vegetação (visto nos resultados de 30 dias).  
Correção: 
```json
{
 "replace_with": "(\"loss given default\" OR \"exposure at default\" OR \"credit conversion factor\" OR (\"recovery rate\" AND (loan OR loans OR mortgage OR \"credit card\" OR \"non-performing\"))) AND (retail OR consumer OR mortgage OR \"credit card\" OR \"machine learning\" OR model OR bank)",
 "tested": "7 resultados em 30 dias, sem o ruído."
}
```

**Q3 — severidade média**  
Arquivo e campo: `topics/risco-credito-ia/queries.json: openalex.queries[2]`  
Problema: A busca de behavior score devolve 1 trabalho em 30 dias, fora do tema (comércio de energia P2P). O termo é raro na literatura; o subtema (gestão de conta, cartão, atraso) fica sem cobertura.  
Correção: 
```json
{
 "replace_with": "(\"credit card\" OR \"revolving credit\" OR overdraft OR \"credit line\") AND (delinquency OR \"early warning\" OR \"behavioral scoring\" OR \"behavioural scoring\" OR \"behavior score\" OR utilization OR \"account management\" OR \"roll rate\") AND (model OR prediction OR \"machine learning\" OR scoring)",
 "tested": "10 resultados em 30 dias; ainda entra fraude em cartão, que a triagem descarta."
}
```

**Q4 — severidade média**  
Arquivo e campo: `topics/risco-credito-ia/queries.json: openalex.queries[15]`  
Problema: "Basel III" com "credit risk" traz estudos de rentabilidade e governança de bancos (Nepal, Indonésia, Bangladesh), sem modelo de crédito.  
Correção: 
```json
{
 "replace_with": "(\"internal ratings-based\" OR \"IRB approach\" OR \"IRB models\" OR \"IRB model\" OR \"risk-weighted assets\" OR \"output floor\") AND (\"probability of default\" OR \"loss given default\" OR \"PD model\" OR \"internal models\" OR \"model validation\" OR \"machine learning\" OR retail OR mortgage)",
 "tested": "3 resultados em 30 dias, 2 no tema."
}
```

**Q5 — severidade alta**  
Arquivo e campo: `topics/risco-credito-ia/queries.json: openalex.queries (nova)`  
Problema: Não há busca de modelos fundacionais em transações sem termo de crédito. As buscas 6 e 7 exigem 'credit risk/scoring/default'. O paper 'How Much Do Foundation Models Add to Gradient Boosting on Financial Event Sequences?' (arXiv 2611.18914, 13/11/2026), que responde à pergunta 1 do pedido, não aparece na busca 6 nem na busca do arXiv do rascunho; na busca 7 não está entre os 8 primeiros de 13 (não conferi os demais).  
Correção: 
```json
{
 "add_query": "(\"foundation model\" OR \"foundation models\" OR \"self-supervised\" OR pretraining OR \"pre-trained\" OR \"representation learning\" OR transformer) AND (\"transaction data\" OR \"transactional data\" OR \"banking transactions\" OR \"financial transactions\" OR \"payment transactions\" OR \"transaction sequences\" OR \"event sequences\")",
 "tested": "17 resultados em 30 dias; traz esse paper, ID2Pattern, TAPES e INTENT."
}
```

**Q6 — severidade média**  
Arquivo e campo: `topics/risco-credito-ia/queries.json: openalex.queries (nova)`  
Problema: IA generativa em cobrança e renegociação está no pedido (pergunta 2) e não tem busca própria.  
Correção: 
```json
{
 "add_query": "(\"large language model\" OR \"large language models\" OR LLM OR chatbot OR \"generative AI\" OR \"conversational agent\" OR \"voice agent\") AND (\"debt collection\" OR \"debt collections\" OR \"debt negotiation\" OR \"debt recovery\" OR \"delinquent\" OR \"loan repayment\" OR \"debt restructuring\")",
 "tested": "2 resultados em 30 dias (1 no tema); volume baixo, mas é o subtema pedido."
}
```

**Q7 — severidade média**  
Arquivo e campo: `topics/risco-credito-ia/queries.json: arxiv.query`  
Problema: A busca do arXiv devolveu 4 itens em 30 dias, nenhum claramente no tema, e perde o paper de modelos fundacionais citado em Q5. Faltam cs.AI, cs.CL, cs.CE, q-fin.CP e econ.GN e termos de limites, reject inference e transações.  
Correção: 
```json
{
 "replace_with": "(cat:q-fin.RM OR cat:q-fin.ST OR cat:q-fin.GN OR cat:q-fin.CP OR cat:cs.LG OR cat:cs.AI OR cat:cs.CL OR cat:cs.CE OR cat:stat.ML OR cat:stat.AP OR cat:cs.CY OR cat:econ.GN) AND (abs:\"credit scoring\" OR abs:\"credit risk\" OR abs:\"probability of default\" OR abs:\"loan default\" OR abs:\"default prediction\" OR abs:\"debt collection\" OR abs:\"debt collections\" OR abs:\"credit card default\" OR abs:\"consumer credit\" OR abs:\"loss given default\" OR abs:\"behavioral scoring\" OR abs:\"expected credit loss\" OR abs:\"credit limit\" OR abs:\"reject inference\" OR abs:\"credit underwriting\" OR abs:\"loan repayment\" OR abs:\"consumer lending\" OR abs:\"creditworthiness\" OR (abs:\"foundation model\" AND abs:transaction) OR (abs:\"event sequences\" AND (abs:banking OR abs:financial)) OR (abs:\"transaction\" AND abs:\"self-supervised\" AND abs:bank))",
 "tested": "10 itens em 30 dias, incluindo o paper de Q5. A API do arXiv devolveu páginas inconsistentes entre chamadas; repetir o teste."
}
```

#### Sugestões

**Q8**  
Buscas adicionais testadas (resultados em 30 dias): português (17), calibração e drift (27), experimentos de lembrete e cobrança (6).  
Proposta: 
```json
{
 "add_queries": [
  "(\"risco de crédito\" OR \"inadimplência\" OR \"escore de crédito\" OR \"concessão de crédito\" OR \"cobrança de dívidas\" OR \"renegociação de dívidas\" OR superendividamento OR \"cadastro positivo\") AND (modelo OR \"aprendizado de máquina\" OR \"machine learning\" OR \"inteligência artificial\" OR regulação OR bancos)",
  "(calibration OR \"concept drift\" OR \"population drift\" OR \"dataset shift\" OR \"model monitoring\" OR \"population stability\") AND (\"credit scoring\" OR \"credit risk\" OR \"probability of default\" OR \"loan default\")",
  "(repayment OR delinquency OR collections OR arrears) AND (reminder OR reminders OR nudge OR nudges OR \"text messages\" OR \"field experiment\" OR \"randomized controlled trial\") AND (loan OR loans OR \"credit card\" OR borrowers OR debt)"
 ]
}
```

**Q9**  
A busca 10 (model risk) traz textos genéricos de 'IA em bancos'. Versão mais estreita testada: 17 resultados em 30 dias contra 36.  
Proposta: 
```json
{
 "replace_query_9_with": "(\"model risk management\" OR \"model validation\" OR \"model governance\" OR \"SR 11-7\" OR \"challenger model\") AND (bank OR banks OR banking OR credit) AND (\"machine learning\" OR \"artificial intelligence\" OR \"credit risk\" OR \"probability of default\" OR scoring)"
}
```

### 3. Fontes

#### Correções

**S1 — severidade média**  
Arquivo e campo: `topics/risco-credito-ia/sources.json: sources[Financial Stability Board].watch`  
Problema: O campo watch aponta para 'Financial Stability Board (FSB)', que não existe em watchlist.json (centers).  
Correção: 
```json
{
 "add_center": {
  "name": "Financial Stability Board (FSB)",
  "url": "https://www.fsb.org/",
  "why": "Relatórios sobre IA e estabilidade financeira (The Financial Stability Implications of Artificial Intelligence, 14/11/2024).",
  "institution": "FSB"
 }
}
```

**S2 — severidade baixa**  
Arquivo e campo: `topics/risco-credito-ia/sources.json: sources[Nubank Engineering].pattern`  
Problema: O padrão casa com posts genéricos de IA e gestão (4 de 10 itens do feed hoje, nenhum de crédito) por causa de model, risk, \bAI\b e \bML\b.  
Correção: 
```json
{
 "replace_with": "(?i)credit|crédito|risco|foundation model|transformer|transaction|transaç|collection|cobran|underwriting|limit|default|inadimpl|fraud"
}
```

**S3 — severidade baixa**  
Arquivo e campo: `topics/risco-credito-ia/sources.json: sources[BIS — Comitê de Basileia (BCBS), BIS — Financial Stability Institute].pattern`  
Problema: O padrão casa com 8 links de navegação (/publications/research, /authors, /aer, /qr, /bulletin, /bis-paper, /working-paper, /central-bank). A página do BCBS só expõe 3 publicações. O mesmo ocorre em topics/fraude-bancaria.  
Correção: 
```json
{
 "replace_with": "/publications/(?!research$|authors$|aer$|qr$|bulletin$|bis-paper$|working-paper$|central-bank$)[a-z0-9-]+$"
}
```

**S4 — severidade baixa**  
Arquivo e campo: `topics/risco-credito-ia/sources.json: sources[Febraban — notícias].url`  
Problema: A URL redireciona para a home do portal; a coleta funciona hoje só com os 4 links de notícia da home. O mesmo ocorre em topics/fraude-bancaria.  
Correção: 
```json
{
 "replace_with": "https://portal.febraban.org.br/",
 "note": "Não achei listagem de notícias com URL estável."
}
```

#### Sugestões

**F1**  
As seis fontes pedidas estão cobertas: CRC (página de notícias, 10 links), JBF e EJOR (journals no OpenAlex, IDs corretos), BIS (4 fontes), Bacen (2 feeds), Febraban (ver S4). Fontes extras com feed funcionando.  
Proposta: 
```json
{
 "add_sources": [
  {
   "name": "NY Fed — Liberty Street Economics",
   "kind": "rss",
   "url": "https://libertystreeteconomics.newyorkfed.org/feed/",
   "pattern": "(?i)credit|debt|delinquen|loan|borrow|mortgage|card|household"
  },
  {
   "name": "NBER — novos working papers",
   "kind": "rss",
   "url": "https://www.nber.org/rss/new.xml",
   "pattern": "(?i)credit|loan|lending|default|borrow|debt|mortgage|delinquen|fintech"
  }
 ],
 "note": "Cada uma precisa de entrada correspondente em watchlist.json. Não achei feed dos Trabalhos para Discussão nem do Relatório de Economia Bancária do BCB. O feed da EBA hoje só traz alertas de e-mail e chamadas; 0 de 10 itens casam com o padrão."
}
```

### 4. Regulação

#### Correções

**R1 — severidade alta**  
Arquivo e campo: `topics/risco-credito-ia/regulation.json: landmarks[SR 11-7]; topics/risco-credito-ia/watchlist.json: centers[Federal Reserve Board].why`  
Problema: A SR 11-7 é apresentada como a referência vigente, mas foi substituída em 17/4/2026 pela SR 26-2 (Revised Guidance on Model Risk Management, Fed/OCC/FDIC). Verificado em federalreserve.gov (a carta diz 'supersedes and replaces SR letter 11-7'). O anexo da SR 26-2 não foi lido; o resumo usa só o texto da carta.  
Correção: 
```json
{
 "add_landmark": {
  "regulator": "Federal Reserve / OCC / FDIC (EUA)",
  "title": "SR 26-2 — Revised Guidance on Model Risk Management",
  "date": "2026-04-17",
  "url": "https://www.federalreserve.gov/supervisionreg/srletters/SR2602.htm",
  "summary": "Orientação conjunta das três agências que substitui a SR 11-7 (2011) e a SR 21-8 (2021). Atualiza os princípios de gestão de risco de modelos e enfatiza uma abordagem baseada em risco, proporcional ao perfil de risco de modelo, ao porte e à complexidade da instituição; mais relevante para organizações com mais de US$ 30 bilhões em ativos.",
  "theme": "model_risk",
  "techniques": [
   "validação independente",
   "abordagem baseada em risco",
   "governança de modelos"
  ]
 },
 "replace_summary_SR_11-7": "Orientação supervisora que foi a referência mundial em gestão de risco de modelos de 2011 a 2026: desenvolvimento, uso, validação independente (solidez conceitual, monitoramento contínuo, análise de resultados), governança e inventário. Substituída em 17/4/2026 pela SR 26-2.",
 "replace_center_why": "SR 26-2 (2026, substitui a SR 11-7) sobre gestão de risco de modelos e pesquisa em crédito ao consumidor."
}
```

**R2 — severidade alta**  
Arquivo e campo: `topics/risco-credito-ia/regulation.json: landmarks[AI Act].summary`  
Problema: O resumo diz 'Obrigações de alto risco previstas para 2/8/2026 — verificar o calendário atual'. A página da Comissão Europeia (regulatory-framework-ai) informa hoje que as obrigações dos sistemas de alto risco valem a partir de 2/12/2027, após o AI Omnibus.  
Correção: 
```json
{
 "replace_last_sentence": "As obrigações dos sistemas de alto risco valem a partir de 2/12/2027, data adiada pelo AI Omnibus (antes, 2/8/2026)."
}
```

**R3 — severidade alta**  
Arquivo e campo: `topics/risco-credito-ia/regulation.json: landmarks`  
Problema: Faltam as normas brasileiras centrais do tema: só há 4 marcos do Brasil e nenhum sobre gerenciamento de risco de crédito, IRB, regras de provisão do BCB, oferta de crédito e limites. A Resolução CMN 4.557 é citada no watchlist, mas não é marco. O pacote de 25/11/2026 (CMN 5.349 e 5.350, BCB 610) trata diretamente de concessão, limites e renegociação. Datas e textos conferidos na API de normativos do BCB e no Planalto.  
Correção: 
```json
{
 "add_landmarks": [
  {
   "regulator": "Conselho Monetário Nacional (Brasil)",
   "title": "Resolução CMN 4.557/2017 — estrutura de gerenciamento de riscos e de capital",
   "date": "2017-02-23",
   "url": "https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?tipo=Resolu%C3%A7%C3%A3o&numero=4557",
   "summary": "Norma-base do gerenciamento de riscos das instituições: define risco de crédito (art. 21), os requisitos do gerenciamento do risco de crédito (art. 23) e os ativos problemáticos (art. 24). Alterada pela Resolução CMN 5.349, de 25/11/2026.",
   "theme": "model_risk",
   "techniques": [
    "gerenciamento do risco de crédito",
    "ativos problemáticos",
    "apetite por risco (RAS)"
   ]
  },
  {
   "regulator": "Banco Central do Brasil",
   "title": "Resolução BCB 303/2023 — abordagens IRB para risco de crédito (RWA CIRB)",
   "date": "2023-03-16",
   "url": "https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?tipo=Resolu%C3%A7%C3%A3o+BCB&numero=303",
   "summary": "Estabelece o cálculo dos ativos ponderados pelo risco de crédito por sistemas internos de classificação (abordagens IRB) autorizados pelo Banco Central; é a norma brasileira dos modelos internos de PD, LGD e EAD para capital. A Instrução Normativa BCB 609, de 11/4/2025, detalha o relatório de candidatura.",
   "theme": "expected_loss",
   "techniques": [
    "modelos IRB de PD, LGD e EAD",
    "validação de sistemas internos de classificação"
   ]
  },
  {
   "regulator": "Banco Central do Brasil",
   "title": "Resolução BCB 352/2023 — instrumentos financeiros e provisão para perdas esperadas",
   "date": "2023-11-23",
   "url": "https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?tipo=Resolu%C3%A7%C3%A3o+BCB&numero=352",
   "summary": "Conceitos e critérios contábeis de instrumentos financeiros; operacionaliza a constituição de provisão para perdas esperadas associadas ao risco de crédito da Resolução CMN 4.966, com segregação dos ativos em carteiras (a Carteira 5 é citada na Resolução CMN 5.350). Esclarecida pela Instrução Normativa BCB 560, de 6/12/2024.",
   "theme": "expected_loss",
   "techniques": [
    "provisão por perda esperada",
    "carteiras de provisionamento"
   ]
  },
  {
   "regulator": "Conselho Monetário Nacional (Brasil)",
   "title": "Resolução CMN 5.004/2022 — oferta, contratação e prestação de serviços de operações de crédito",
   "date": "2022-03-24",
   "url": "https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?tipo=Resolu%C3%A7%C3%A3o+CMN&numero=5004",
   "summary": "Requisitos a observar na oferta, na contratação e na prestação de serviços de operações de crédito e de arrendamento mercantil financeiro. Alterada pela Resolução CMN 5.350, de 25/11/2026.",
   "theme": "pd_origination",
   "techniques": [
    "oferta e contratação de crédito",
    "concessão responsável"
   ]
  },
  {
   "regulator": "Conselho Monetário Nacional (Brasil)",
   "title": "Resolução CMN 5.349/2026 — risco de crédito associado ao endividamento (ETI e CFI)",
   "date": "2026-11-25",
   "url": "https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?tipo=Resolu%C3%A7%C3%A3o+CMN&numero=5349",
   "summary": "Altera a Resolução 4.557: exige política e procedimentos para o risco de crédito associado ao endividamento da contraparte, com os indicadores Endividamento Total Individual (ETI) e Comprometimento Financeiro Individual (CFI), patamares de CFI de risco elevado e excessivo, limite de exposição a contrapartes de CFI elevado e restrição a novas obrigações para CFI excessivo. Inclui no risco a não observância da legislação de prevenção do superendividamento e crédito responsável. Em vigor em 1/7/2027.",
   "theme": "pd_origination",
   "techniques": [
    "capacidade de pagamento",
    "indicadores ETI e CFI",
    "limites de exposição"
   ]
  },
  {
   "regulator": "Conselho Monetário Nacional (Brasil)",
   "title": "Resolução CMN 5.350/2026 — restrições à contratação de crédito por clientes em atraso",
   "date": "2026-11-25",
   "url": "https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?tipo=Resolu%C3%A7%C3%A3o+CMN&numero=5350",
   "summary": "Altera a Resolução CMN 5.004: tratativas de oferta podem ocorrer por voz ou aplicativo de mensagens, mas a contratação só se conclui em canal eletrônico com autenticação ou presencialmente; clientes com atraso de 90 dias ou mais, ou com indicativo de não pagamento (Carteira 5), ficam restritos a renegociação, portabilidade ou migração de saldo sem novo desembolso, com exceções (consignado, garantia real suficiente). A instituição deve consolidar as operações do cliente no SFN usando SCR e Open Finance. Em vigor em 1/7/2027.",
   "theme": "collections",
   "techniques": [
    "renegociação",
    "elegibilidade de concessão",
    "dados do SCR e Open Finance"
   ]
  },
  {
   "regulator": "Banco Central do Brasil",
   "title": "Resolução BCB 610/2026 — limite de crédito de quem usa o rotativo com frequência",
   "date": "2026-11-25",
   "url": "https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?tipo=Resolu%C3%A7%C3%A3o+BCB&numero=610",
   "summary": "Altera a Resolução BCB 96: o emissor de instrumento pós-pago deve não aumentar e reduzir gradualmente o limite de crédito do titular que financiou pelo rotativo três ou mais faturas nos últimos seis meses, até que pague seis faturas consecutivas integralmente ou liquide o saldo financiado; exige comunicação prévia e uso de dados do SCR e do Open Finance. Aprovada em sessão de 24/11/2026; em vigor em 1/1/2027 (art. 6º-C) e 1/7/2027 (demais).",
   "theme": "behavior_limits",
   "techniques": [
    "gestão de limites de cartão",
    "crédito rotativo"
   ]
  },
  {
   "regulator": "Banco Central do Brasil",
   "title": "Resolução BCB 601/2026 — Painel de Dívidas Consolidadas",
   "date": "2026-10-23",
   "url": "https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?tipo=Resolu%C3%A7%C3%A3o+BCB&numero=601",
   "summary": "Obriga as instituições a oferecer a clientes pessoa física um painel com as obrigações financeiras consolidadas, a avaliação de adequação do crédito ao perfil (suitability) e o comprometimento da capacidade mensal de pagamento, apurada por critérios conservadores e verificáveis. Em vigor em 1/7/2027 (arts. 10 e 11 na publicação).",
   "theme": "behavior_limits",
   "techniques": [
    "capacidade de pagamento",
    "suitability de crédito"
   ]
  },
  {
   "regulator": "Brasil",
   "title": "Lei 15.252/2025 — direitos da pessoa natural usuária de serviços financeiros",
   "date": "2025-11-04",
   "url": "https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/L15252.htm",
   "summary": "Cria os direitos à portabilidade salarial automática, ao débito automático entre instituições, à informação e à contratação de crédito em modalidade especial com juros reduzidos; regulamentada pela Resolução CMN 5.299, de 4/5/2026, e base das Resoluções BCB 601 e 602.",
   "theme": "regulation",
   "techniques": [
    "portabilidade salarial",
    "crédito com juros reduzidos"
   ]
  }
 ]
}
```

**R4 — severidade média**  
Arquivo e campo: `topics/risco-credito-ia/regulation.json: bacen.terms`  
Problema: O termo "cadastro positivo" devolve 0 normas na busca do BCB desde 2017 (as normas falam em 'informações de adimplemento' e 'histórico de crédito').  
Correção: 
```json
{
 "replace": {
  "\"cadastro positivo\"": "\"histórico de crédito\""
 },
 "note": "\"histórico de crédito\" devolve 1 norma (Resolução 4.737/2019)."
}
```

**R5 — severidade média**  
Arquivo e campo: `topics/risco-credito-ia/regulation.json: bacen.terms`  
Problema: O termo cobrança devolve 329 normas, a maioria sobre tarifas, boletos e liquidação; "cobrança de dívidas" devolve 0. Faltam termos de IRB, ativos problemáticos, rotativo e endividamento.  
Correção: 
```json
{
 "remove": [
  "cobrança"
 ],
 "add": [
  "\"ativos problemáticos\"",
  "endividamento",
  "\"crédito rotativo\"",
  "\"concessão de crédito\"",
  "\"sistemas internos de classificação\"",
  "\"provisão para perdas\""
 ],
 "counts_since_2017": {
  "\"ativos problemáticos\"": 38,
  "endividamento": 52,
  "\"crédito rotativo\"": 60,
  "\"concessão de crédito\"": 111,
  "\"sistemas internos de classificação\"": 18,
  "\"provisão para perdas\"": 83
 }
}
```

#### Sugestões

**R6**  
Marcos internacionais e brasileiros que valem incluir. URLs com 200 em 26/11/2026, salvo indicação.  
Proposta: 
```json
{
 "add_landmarks_min": [
  {
   "regulator": "Comitê de Basileia (BCBS/BIS)",
   "title": "Principles for the management of credit risk (revisão de 2025)",
   "date": "2025-04-30",
   "url": "https://www.bis.org/bcbs/publ/d595.htm",
   "note": "data conferida na página; a versão original é de 27/9/2000"
  },
  {
   "regulator": "Comitê de Basileia (BCBS/BIS)",
   "title": "Newsletter on artificial intelligence and machine learning",
   "date": "2022-03-16",
   "url": "https://www.bis.org/publ/bcbs_nl27.htm"
  },
  {
   "regulator": "Comitê de Basileia (BCBS/BIS)",
   "title": "Digitalisation of finance",
   "date": "2024-05-16",
   "url": "https://www.bis.org/bcbs/publ/d575.htm"
  },
  {
   "regulator": "Financial Stability Board",
   "title": "The Financial Stability Implications of Artificial Intelligence",
   "date": "2024-11-14",
   "url": "https://www.fsb.org/2024/11/the-financial-stability-implications-of-artificial-intelligence/"
  },
  {
   "regulator": "Tribunal de Justiça da União Europeia",
   "title": "Acórdão SCHUFA (C-634/21): score de crédito como decisão automatizada",
   "date": "2023-12-07",
   "url": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:62021CJ0634",
   "note": "data de memória; paralelo direto com o art. 20 da LGPD"
  },
  {
   "regulator": "União Europeia",
   "title": "Diretiva (UE) 2023/2225 — crédito ao consumidor (CCD2)",
   "date": "2023-10-18",
   "url": "https://eur-lex.europa.eu/eli/dir/2023/2225/oj",
   "note": "data e conteúdo (avaliação de solvência, intervenção humana) de memória"
  },
  {
   "regulator": "Brasil",
   "title": "Lei 12.414/2011 — Cadastro Positivo",
   "date": "2011-06-09",
   "url": "https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12414.htm"
  },
  {
   "regulator": "Brasil",
   "title": "Lei 14.690/2023 — Desenrola Brasil e teto dos juros do rotativo",
   "date": "2023-10-03",
   "url": "https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2023/lei/l14690.htm",
   "note": "data de memória; regulamentada pela Resolução CMN 5.112, de 21/12/2023"
  },
  {
   "regulator": "Brasil",
   "title": "Código de Defesa do Consumidor — Lei 8.078/1990 (art. 42: cobrança de dívidas)",
   "date": "1990-09-11",
   "url": "https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm"
  },
  {
   "regulator": "Câmara dos Deputados (Brasil)",
   "title": "PL 2338/2023 — marco legal da inteligência artificial",
   "date": "2025-03-17",
   "url": "https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2487262",
   "note": "em tramitação; situação 'Aguardando Parecer' em 13/11/2026 pela API da Câmara; URL responde 200"
  }
 ],
 "not_verified": "EBA Guidelines on PD and LGD estimation (EBA/GL/2017/16): as URLs que tentei deram 404. CFPB Circular 2022-03: o site bloqueia robôs (403); não confirmei se foi revogada em 2025. Regulation F do CFPB (cobrança): não verificada."
}
```

**R7**  
Em bacen.terms, 'risco de crédito' (347 normas) e 'gerenciamento de riscos' (140) são amplos, mas cobrem o núcleo; manter e observar o custo da triagem. 'inteligência artificial' devolve só 2 normas internas do BCB e 'risco de modelo' devolve 2; não vale incluir.

### 5. Rubrica e âncoras de triagem

#### Correções

**T1 — severidade alta**  
Arquivo e campo: `topics/risco-credito-ia/topic.json: prefilter_keywords`  
Problema: Siglas sem limite de palavra: 'ead' casa com read, lead, already; 'irb', 'lgd', 'ifrs' e termos genéricos (default, bank, provision, collections, restructuring, debt, loan, lender) casam com quase qualquer abstract. No prefilter isso marca o item como on_topic e libera o bônus dobrado de journal de elite para papers fora do tema de EJOR, ESWA, KDD e Management Science. 'crédito' está duplicado. Testado: o título 'Reading comprehension with large language models' casa com o regex atual e não casa com o proposto.  
Correção: 
```json
{
 "replace_with": "credit scor|credit risk|scorecard|probability of default|default prediction|default risk|loan default|credit default|consumer credit|retail credit|household credit|credit card|mortgage|lending|lender|borrower|underwriting|creditworth|credit limit|credit line|behaviou?ral scor|behaviou?r scor|delinquen|arrears|past[- ]due|debt collection|loan recovery|debt recovery|renegotiat|loan modification|forbearance|over-?indebted|loss given default|exposure at default|expected credit loss|\\bifrs ?9\\b|\\bcecl\\b|\\blgd\\b|\\bead\\b|\\birb\\b|internal ratings|basel|model risk|model validation|reject inference|credit bureau|alternative data|open banking|open finance|transaction data|transaction sequence|event sequence|foundation model|\\bloans?\\b|repayment|fintech|crédito|inadimpl|cobrança|renegocia|superendivid|dívida"
}
```

**T2 — severidade média**  
Arquivo e campo: `topics/risco-credito-ia/topic.json: rubric_strong`  
Problema: A cláusula 'venue de elite (EJOR, Journal of Banking & Finance, ...)' contradiz o TRIAGE_PROMPT ('título e prestígio não contam como evidência'; jr vale no máximo 1 ponto em q). Deixa o LLM dar q 9-10 por venue.  
Correção: 
```json
{
 "replace_with": "dados reais de carteiras de crédito de varejo de bancos, fintechs ou bureaus, validação out-of-time e out-of-sample, comparação contra baseline forte (regressão logística/scorecard e gradient boosting) com métricas de discriminação e calibração (AUC/Gini, KS, Brier) e impacto em lucro ou perda, experimento ou A/B em produção (concessão, limites, cobrança), ou norma/relatório de regulador com exigências ou dados novos"
}
```

**T3 — severidade baixa**  
Arquivo e campo: `topics/risco-credito-ia/topic.json: rubric_anchors[0], rubric_anchors[1]`  
Problema: A âncora 1 usa '(EJOR)' e 'venue de elite' como razão da nota, contra a regra do prompt. A âncora 2 dá q 6 a um caso com dado real em escala, fora do tempo e ganho numérico, que pela escala do prompt é q 7-8; e trata 'preprint de empresa' como defeito, quando é o tipo de evidência que a pergunta 1 do pedido procura. As contas de final_score das 5 âncoras estão corretas.  
Correção: 
```json
{
 "replace_anchor_0": "Benchmark de gradient boosting, redes profundas e regressão logística em carteira real de cartão de um banco, com validação out-of-time, AUC e KS contra scorecard e impacto em perda esperada: r 9, q 8 → 8. Pergunta central do público, dado real, baseline forte e números explícitos.",
 "replace_anchor_1": "Modelo fundacional (transformer) pré-treinado em sequências de transações de uma fintech, ajustado para PD e comparado ao LightGBM com ganho em AUC fora do tempo (arXiv): r 9, q 7 → 8. No alvo, dado real em escala e baseline forte; sem calibração nem impacto em perda, por isso não chega a q 9."
}
```

#### Sugestões

**T4**  
Trocar arquétipos por papers reais, como nos outros temas. Notas propostas a partir dos abstracts lidos no OpenAlex.  
Proposta: 
```json
{
 "anchors": [
  "Personal Communication in an Automated World: Evidence from Loan Repayments (Journal of Finance): r 9, q 7 → 8. Atribuição aleatória de atendentes a clientes em atraso num banco; efeito na cura e na reincidência, mas sem números no resumo.",
  "How Much Do Foundation Models Add to Gradient Boosting on Financial Event Sequences? (arXiv): r 8, q 7 → 7. 27 métodos, 5 sementes e intervalos por bootstrap contra LightGBM; dados sintéticos, públicos e dois proprietários de crédito comercial e churn, não de PD de varejo.",
  "Debt Collection Negotiations with Large Language Models (Findings of ACL): r 8, q 5 → 6. LLM negocia dívidas em simulação com 13 métricas; sem evidência de produção nem resultado de recuperação."
 ],
 "also_add": "uma âncora de regulador (ex.: Resolução CMN 5.349/2026, r 9, q 8 → 8: exigência nova com indicadores ETI e CFI) e manter as duas âncoras baixas atuais (dados UCI; crédito corporativo)."
}
```

**T5**  
Ampliar off_topic com o ruído visto nas buscas.  
Proposta: 
```json
{
 "append_to_off_topic": ", reestruturação de dívida soberana, determinantes de rentabilidade ou de NPL no nível do banco sem modelo de cliente, pesquisas de percepção ou aceitação de score por usuários, ensaios jurídicos de defesa do consumidor sem dados, empréstimos em cripto/DeFi, fraude em cartão"
}
```

**T6**  
O audience acrescenta ao pedido LGD/EAD, IFRS 9, capital e AI Act, e 'pequenas empresas de varejo', enquanto off_topic exclui 'previsão de falência de empresas' e o pedido exclui crédito corporativo. Vale confirmar com o solicitante e deixar explícito: PMEs só quando tratadas como varejo (score do negócio ou do sócio em carteira massificada). Vale citar no audience as normas de 25/11/2026 (ETI/CFI, limites do rotativo).

### 6. Perguntas de referência

#### Correções

**E1 — severidade baixa**  
Arquivo e campo: `evals/questions.json: topics[risco-credito-ia].tecnica`  
Problema: No template 'evidence' a frase fica '...comparados ao gradient boosting na previsão de PD traz ganho medido de verdade?', com sujeito plural e verbo singular.  
Correção: 
```json
{
 "replace_with": "O uso de modelos fundacionais treinados em dados transacionais, em vez de gradient boosting, na previsão de PD"
}
```

#### Sugestões

**E2**  
Os slots cobrem as 4 perguntas do pedido. Dois ajustes: regtema junta cinco assuntos; e nenhum slot cobre limites ou behavior score.  
Proposta: 
```json
{
 "regtema": "o uso de machine learning em modelos de crédito de varejo (validação e risco de modelo, explicabilidade e decisões automatizadas, IRB e perda esperada)",
 "evo_subtema": "credit scoring e behavior score, do scorecard logístico ao machine learning e aos modelos fundacionais"
}
```
