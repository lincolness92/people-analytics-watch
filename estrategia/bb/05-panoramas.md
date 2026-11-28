# Os panoramas do plano (v0)

Rascunho de **28/11/2026**, a partir da conversa com o autor do pedido. O plano de guerra não é um documento só. São
três panoramas de alcance diferente, apoiados em uma camada de conhecimento (o estado da arte) e em uma fundação
(dados). Cada panorama termina em **decisões**, e cada decisão pende de **premissas testáveis**
([`01-premissas.md`](01-premissas.md)). Tudo com dado público. Ao levar para dentro, as premissas são trocadas pelo
dado interno e os retornos são recalculados (seção 6).

```
                ┌──────────────────────────────────────────────────────────────────┐
  Panorama 3    │  TOMADA HOSTIL: todos os mercados, 10 anos, todos os concorrentes  │
                │   ┌─────────────────────────────────────────────────┐            │
  Panorama 2    │   │  VANTAGENS INJUSTAS: onde só o BB pode jogar     │            │
                │   │   ┌─────────────────────────────────────────┐   │            │
  Panorama 1    │   │   │  ATENA: a crise do agro (decisão agora)  │   │            │
                │   │   └─────────────────────────────────────────┘   │            │
                │   └─────────────────────────────────────────────────┘            │
                └──────────────────────────────────────────────────────────────────┘
  Camada        estado da arte (Research Watch): papers, repositórios, bancos, hubs, radar Febraban × mundo
  Fundação      dados de qualidade, integração e cultura de dados; medição de retorno (ROI de dados e IA)
```

Os panoramas 1 e 2 são recortes do 3: o mapa completo dá o contexto, e os recortes dão a prioridade.

---

## 1. Atena: a crise do agro

Atena é a deusa da estratégia na guerra. O nome vale para o módulo de decisão em crise: genérico, aplicável a qualquer
instituição e a qualquer carteira em choque. O primeiro caso é o crédito rural do BB.

**Pergunta.** No crédito rural, o BB luta (defende e reprecifica a carteira) ou recua (sai do risco que não controla e
concentra capital onde tem vantagem)?

**As duas posições, como hipóteses.**

| Posição | O que diz | Premissas que precisam ser verdadeiras |
|---|---|---|
| **Lutar** | O ciclo é climático e de preço, logo é previsível em parte. Com sensores (clima, safra, comercialização) e garantias executáveis, o risco entra no preço e no limite | P09 (clima previsível), P02/P03 (inadimplência concentrada e explicável), P11 (renegociação cura), P07 (quem cresceu rápido vai sofrer mais) |
| **Recuar** | O risco não é controlável (El Niño, preço internacional, política agrícola). A vantagem do BB está em outro lugar | P01 (perda estrutural), P05 (o melhor risco foi para o mercado de capitais), P45 (capital é a restrição ativa) |

**Garantias.** Uma linha já em curso no mercado é o contrato com garantia executável: alienação fiduciária de imóvel
rural, patrimônio rural em afetação e Cédula Imobiliária Rural (Lei 13.986/2020), e o marco das garantias
(Lei 14.711/2023). A premissa a testar é se a garantia muda a perda dado o default **na prática**: prazo e
custo de execução, valor de recuperação de terra por região e risco reputacional e político de retomar fazendas. É
pergunta de dado (leilões, cartórios, jurisprudência, preço de terra), não de opinião. → premissas novas G01–G03
(a escrever).

**Sensores, do mais barato ao mais caro.** Só se sobe um degrau quando o de baixo não basta para a decisão.

| Degrau | O que mede | Fontes públicas | Estado |
|---|---|---|---|
| 1 | Inadimplência e saldo rural por UF, modalidade, porte e programa | SGS, SCR.data, SICOR, IF.data | coletando (laboratório rural) |
| 2 | Clima: chuva, temperatura e seca por município e o calendário da cultura (plantio, colheita) | NASA POWER, CHIRPS, INMET, Zarc (MAPA), Conab | protótipo de previsão por UF |
| 3 | Safra e preço: produção esperada, preço recebido, margem do produtor | IBGE (LSPA, PAM), Conab, CEPEA, B3 | mapeado em `docs/sources/` |
| 4 | Comercialização: o produtor está vendendo? Fluxo de exportação por porto e produto | Comex Stat (MDIC), line-ups de portos, Secex | a mapear |
| 5 | Logística global: navios (AIS), fluxo de cargas e importação dos destinos | dados AIS abertos ou comerciais, UN Comtrade | a mapear; custo a avaliar |
| 6 | Observação da Terra: área plantada, vigor da lavoura e estresse hídrico por talhão | Sentinel-2, Landsat, MODIS (NDVI), MapBiomas | a mapear |

**Entrega.** Um monitor de risco rural por UF e município, uma tabela "lutar × recuar" com o estado de cada premissa e,
para cada posição, uma proposta no modelo de [`04-proximos-passos.md`](04-proximos-passos.md) §2.

## 2. As vantagens injustas

**Pergunta.** Onde o BB tem algo que os outros não conseguem copiar a custo razoável, e quanto isso vale?

Candidatas, todas como hipótese: a relação com o setor público (folha, convênios, repasses, depósitos judiciais), a
rede nos municípios onde é o único banco (577 em 08/2026, F-019), o comércio exterior (25,4% do sistema, único
produto em que ganhou participação desde 2019, F-031), o agro fora do crédito (dados, seguro, comercialização), a marca
e a confiança e o custo de captação. Cada uma vira premissa com teste (P26, P12, P30 e as do bloco D do registro).

**Entrega.** Um ranking das vantagens por valor e defensabilidade, com o que as ameaça (regulação, digitais,
cooperativas) e o que custaria transformá-las em receita.

## 3. A tomada hostil: o mapa de todos os mercados

**Pergunta.** Se o objetivo fosse liderar cada mercado em que o BB atua, o que seria preciso, mercado por mercado?

Não é recomendação de monopólio (há limites concorrenciais e regulatórios, e eles entram como restrição). É uma forma
de **mapear tudo**: cada mercado com o tamanho, a participação nos últimos dez anos, quem entrou, quem cresceu, a
economia do produto (margem, risco, capital) e a jogada que devolveria a liderança, com custo.

| Bloco | Conteúdo | Fonte |
|---|---|---|
| Dez anos de resultado | Lucro, ROE, margem, custo do crédito, eficiência, capital: BB e pares, 2016–2026 | IF.data (camada `data/ifs/`), DFP/ITR na CVM, Pilar 3 |
| Dez anos de participação | Por produto, região, porte e instrumento de captação | `data/ifs/shares/` (Análise 1) |
| Quem apareceu | Entrantes por ano: digitais, cooperativas, instituições de pagamento, plataformas | IF.data (cadastro), registry |
| Como se pega de volta | Para cada mercado: atacar (preço, canal, produto), comprar (M&A), parceria, ou sair | propostas, com premissas |

**Entrega.** Um mapa mercado × concorrente com a jogada candidata de cada célula e as premissas que a sustentam.

---

## 4. A camada de conhecimento: o estado da arte

O Research Watch é a ferramenta: ele acompanha o mundo em massa, por API, e não só uma lista curada. A meta é fazer
melhor que um radar curado, e mostrar onde ele está errado ou atrasado.

1. **Tecnologia bancária como um todo.** O que os grandes bancos do mundo estão fazendo (IA, dados, plataformas,
   pagamentos, risco), onde estão os hubs de inovação e quem lidera cada tema.
2. **Radar Febraban × mundo.** Comparar os temas do Radar de Tecnologias e da Pesquisa Febraban de Tecnologia Bancária
   com o que a literatura, os repositórios e os bancos líderes mostram: o que o radar tem, o que falta, o que está
   superestimado e o que o mundo já deixou para trás.
3. **Papers e repositórios ligados.** Para os temas que importam, ler os papers de fato, guardar e ligar. Cada ligação
   vira uma **ficha de aplicação**:

```yaml
problema: "inadimplência rural depende do clima e do preço"
tecnica: "previsão com índices de seca (SPEI) e preço futuro, por município"
evidencia: [{paper, ano, resultado_reportado, dado_usado, link_do_codigo}]
aplicacao_aqui: "monitor de risco por UF; limite e preço por região"
premissa: "a técnica reproduz no Brasil com dado público (ganho sobre o ingênuo ≥ X%)"
como_medir_aqui: "previsão fora da amostra, origem móvel; depois, dado interno"
retorno: "→ proposta prop-AAAA-NN"
```

## 5. A fundação: dados e medição de retorno

- **Dados de qualidade, na marra.** A tese é que nada acima funciona sem dado integrado e confiável, e que isso
  exige um programa de cima para baixo: cada área é dona dos seus dados, com metas de qualidade, integração
  obrigatória e cultura de dados. A pesquisa vai reunir o que funciona e o que fracassa (casos de bancos, estudos,
  normas como BCBS 239) e transformar em premissas testáveis.
- **ROI de dados, analytics e IA.** Como se mede o retorno de um ativo de dados, de uma equipe de dados e de uma área
  de inteligência de mercado. Métodos de valoração de dados, atribuição de valor a modelos, experimentos, opções reais.
  Isso define o campo `4_retorno_esperado` das propostas e como ele se atualiza.

## 6. Como as premissas e os retornos se atualizam

Cada passo muda o estado de uma premissa (hipótese → apoiada → confirmada, ou refutada), e cada proposta recalcula o
retorno a partir das premissas por fórmula. Com dado público, o resultado é um **intervalo**. Ao levar para dentro, a
mesma estrutura recebe o dado interno: onde estamos hoje, qual premissa se confirma, e o retorno esperado de cada
proposta passa a ser medido, não estimado.

## 7. O conselho

O conselho de modelos ([`03-conselho.md`](03-conselho.md)) é independente e cresce: Astra e Gemini entram como cadeiras
quando houver acesso, e o protocolo admite um enxame (várias instâncias por família, com papéis diferentes: geração,
red team, juízes, especialistas por mercado). A régua é qualidade, não economia.
