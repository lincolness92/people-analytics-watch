# Retrospectiva 2026 (parcial) — Bank Fraud Watch

<sub>gerado em 2026-11-26 · 456 obras · modelo deepseek-ai/DeepSeek-V4.1-Flash:deepinfra</sub>

O ano de 2026, até 26/11, foi marcado pela escalada de fraudes de engenharia social e de contas/mulas, enquanto a detecção técnica migrou para grafos e agentes com memória atualizável. Os crescimentos mais fortes vieram de money mule (+244%; 3,4x), account takeover/SIM swap (+124%; 2,2x), APP fraud (+93%; 1,9x) e graph neural networks (+100%; 2,0x), com AML (+54%; 1,5x) e fraud detection/financial institution (+27%; 1,3x) também em alta. Nos destaques, PersonaAgent mostrou pontuação de anomalias transacional com personas recarregáveis, enquanto ROC-AUC foi questionado para dados altamente desbalanceados e IA apareceu associada a mais perdas operacionais em bancos dos EUA. Em golpes, manuais de 'pig butchering' e o benchmark PreScam expuseram táticas psicológicas e a progressão de conversas fraudulentas. O Brasil não aparece nas listas de publicação analisadas, apesar da relevância local de Pix, MED e Open Finance.

## Tendências

- **Mulas e lavagem disparam**: Money mule cresceu +244% (3,4x), de 34 para 117 publicações projetadas, e anti-money laundering avançou +54% (1,5x), de 555 para 855; ambos têm 7 papers avaliados no arquivo. O sinal é de pressão regulatória e operacional sobre redes de contas laranja e PLD/CFT.
- **Grafos e detecção transacional em tempo real**: Graph neural networks subiram +100% (2,0x), de 253 para 505, e fraud detection/financial institution cresceu +27% (1,3x), de 1.753 para 2.221. PersonaAgent ilustra a direção: memória de personas recarregável para entidades e interações em pagamentos, com atualização semanal offline.
- **Golpes conversacionais e APP fraud**: APP fraud avançou +93% (1,9x), de 95 para 183, e os destaques Pig Butchering e PreScam mostram foco em táticas psicológicas e progressão de conversas. PreScam estrutura 177.989 relatos brutos em 11.573 conversas para prever a evolução de golpes desde os primeiros turnos.
- **Account takeover e autenticação sob pressão**: Account takeover/SIM swap cresceu +124% (2,2x), de 160 para 359, e behavioral biometrics subiu +40% (1,4x), de 225 para 314. O volume ainda é menor que fraude de cartão (+27%; 1,3x), mas o ritmo indica prioridade crescente em autenticação e identidade.
- **Métricas e risco operacional em revisão**: Operational risk/Basel cresceu +63% (1,6x), de 63 para 103, e os destaques ROC-AUC e AI and Operational Losses questionam métricas e governança. O primeiro mostra que ROC-AUC pode mascarar diferenças em fraude de cartão com 0,17% de positivos; o segundo associa mais investimento em IA a maiores perdas operacionais em BHCs dos EUA.

## Onde a inovação acontece

A inovação segue concentrada na academia, com 345 trabalhos (74,7%), enquanto empresas somam 22 (4,8%) e governo/reguladores 12 (2,6%). EUA (89), China (69), Índia (48) e Reino Unido (42) lideram as publicações; Bélgica (21) e Austrália (19) também aparecem. Entre empresas, Visa (11) e Ant Group (7) puxam a produção, seguidas por Uber AI (5) e Nvidia (4); o Brasil não aparece nas listas de países, instituições ou empresas.

## Destaques

- **[PersonaAgent: pontuação de anomalias transacional com memória de personas recarregável](https://doi.org/10.48550/arxiv.2611.08094)** — arXiv · 8/10 · 0 cit. (📊 Modelos, dados e métricas de fraude)
  - Propõe um framework agêntico que representa sinais de comportamento de entidades como personas em memória recarregável, com atualização semanal offline. Importa para redes de pagamento porque ataca a defasagem entre mudança de padrões e ciclo de atualização do modelo.
- **[Por que ROC-AUC engana em dados altamente desbalanceados](https://doi.org/10.3390/technologies14010054)** — Technologies · 7/10 · 43 cit. (📊 Modelos, dados e métricas de fraude)
  - Reavalia ROC-AUC em fraude de cartão com 0,17% de positivos e mostra que MCC, F2-score, H-measure e PR-AUC capturam melhor custos assimétricos. É acionável para escolha de métrica em modelos de fraude com forte desbalanceamento.
- **[IA e perdas operacionais em bancos dos EUA](https://doi.org/10.1093/rcfs/cfag003)** — The Review of Corporate Finance Studies · 7/10 · 12 cit. (📊 Modelos, dados e métricas de fraude)
  - Usa dados supervisoris de perdas operacionais de BHCs e mostra que maior investimento em IA se associa a mais perdas por ativo, puxadas por fraude externa, questões com clientes e falhas de sistema. Alerta para governança de IA e risco operacional, inclusive em eventos de cauda.
- **[Fake it till you make it: táticas psicológicas e de comunicação por trás de 'pig butchering'](https://doi.org/10.1093/cybsec/tyag003)** — Journal of Cybersecurity · 7/10 · 10 cit. (🎣 Golpes e engenharia social)
  - Analisa manuais de golpistas e revela táticas sistemáticas de comunicação, relacionamento e motivação para ganhar confiança e comprometer vítimas. Ajuda a orientar detecção e conscientização em golpes de romance e investimento.
- **[PreScam: benchmark para prever progressão de golpes desde conversas iniciais](https://doi.org/10.48550/arxiv.2605.12243)** — arXiv · 7/10 · 3 cit. (🎣 Golpes e engenharia social)
  - Estrutura 177.989 relatos brutos em 11.573 conversas para modelar como golpes evoluem ao longo do tempo, em vez de apenas detectar lures estáticos. É relevante para fraudes conversacionais, romance e investimento, que se desenrolam em múltiplos turnos.

## Volume por subtema

| Subtema | 2025 | 2026 | Variação |
|---|---|---|---|
| money mule / money mules | 34 | 117* | +244% |
| account takeover / SIM swap | 160 | 359* | +124% |
| graph neural network / graph neural networks | 253 | 505* | +100% |
| authorized push payment / APP fraud | 95 | 183* | +93% |
| operational risk / Basel | 63 | 103* | +63% |
| anti-money laundering / money laundering | 555 | 855* | +54% |
| behavioral biometrics / behavioural biometrics | 225 | 314* | +40% |
| open banking / open finance | 105 | 137* | +30% |
| fraud detection / financial institution | 1753 | 2221* | +27% |
| credit card fraud / card fraud | 610 | 772* | +27% |

<sub>* ano em curso, projetado para 12 meses.</sub>
