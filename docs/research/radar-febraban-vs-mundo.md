# Radar Febraban × mundo

Versão 1, **2026-11-28**. Análise de lacunas entre o que a Febraban mapeia em tecnologia bancária e o que o mundo mostra em evidência pública. Dados públicos apenas. Sem informação interna de banco e sem dados pessoais. Os dados completos estão em [`radar-febraban-vs-mundo.json`](radar-febraban-vs-mundo.json).

Ligação com o plano: este documento é a camada de conhecimento descrita em `estrategia/bb/05-panoramas.md` §4, item 2. As fichas da seção 5 seguem o modelo daquele parágrafo.

## Resumo

- Comparamos **45 temas**: as 35 tecnologias do Radar 2026 e 10 temas que o mundo trata e o Radar não. Vereditos: 21 alinhados, 8 em que a Febraban está atrasada, 6 superestimados e 10 ausentes.
- O Radar classifica pagamentos agênticos como 'Conceitual', mas o Alipay fez mais de 120 milhões de pagamentos por agente em uma semana e 300 milhões até maio/2026; no Brasil, 10 milhões de clientes usam Pix com IA ([Febraban/Accenture, 2026-11-17](https://tecemergentes.febraban.org.br/), [Ant Group (Alipay, MYbank), 2026-02-13](https://www.businesswire.com/news/home/20260213770962/en/Alipay-AI-Payment-Exceeds-120-Million-Transactions-in-One-Week-as-Agentic-Commerce-Accelerates-in-China) ‡, [Nubank (Nu Holdings), 2026-05-14](https://www.mobiletime.com.br/noticias/14/05/2026/pix-ia-nubank-10-mi/))
- PQC é 'Conceitual' no Radar e tem prioridade média/alta em só 8% dos bancos, mas o NIST publicou o plano final de transição e o BIS já migrou um sistema de pagamento real; o próprio Estudo manda iniciar a migração 'agora' ([Febraban/Deloitte, 2026-06](https://cmsarquivos.febraban.org.br/Arquivos/documentos/PDF/Pesquisa%20Febraban%202026%20V1.pdf), [NIST, 2026-10-27](https://csrc.nist.gov/pubs/ir/8547/final), [BIS Innovation Hub – Eurosystem Centre (Frankfurt/Paris), 2025-12-11](https://www.bis.org/project/leap))
- O Radar não tem nenhuma tecnologia de trilho de pagamento, de Open Finance ou de modernização de core, justamente onde o Brasil lidera ou onde está o maior gargalo (core banking 62% fora da nuvem; só 7% dos bancos extraem valor do Open Finance) ([Febraban/Deloitte, 2026-08-25](https://cmsarquivos.febraban.org.br/Arquivos/documentos/PDF/Pesquisa%20de%20Tecnologia%20Banc%C3%A1ria%202026%20-%20Vol_%202%20Vers%C3%A3o%20Completa.pdf), [Febraban/Deloitte, 2026-08-25](https://cmsarquivos.febraban.org.br/Arquivos/documentos/PDF/Pesquisa%20de%20Tecnologia%20Banc%C3%A1ria%202026%20-%20Vol_%202%20Vers%C3%A3o%20Completa.pdf))
- O Estudo recomenda 'participar do Drex Fase 2', mas o BC desligou a plataforma DLT do Drex em nov/2025 e a primeira entrega é de gravames sem DLT; enquanto isso, o Eurosistema pôs o Pontes em produção em 21/09/2026 ([Febraban/Accenture, 2026-11-18](https://cmsarquivos.febraban.org.br/Arquivos/documentos/PDF/Estudo%20de%20Tecnologias%20Emergentes%20para%20o%20setor%20banc%C3%A1rio%202026.pdf), [BCB (Brasil), 2025-11-04](https://forbes.com.br/escolhas-do-editor/2025/11/banco-central-abandona-o-blockchain-do-drex-o-projeto-do-real-digital/), [BCE / Eurosistema (euro digital, Pontes, Appia), 2026-09-21](https://ecb.europa.eu/press/pr/date/2026/html/ecb.pr260921~e754847a7b.en.html))
- Ativos digitais e tokenização têm impacto 3, o menor do domínio DLT, mas a Kinexys do JPMorgan liquida em média US$ 7 bi por dia e 37 bancos europeus criaram uma stablecoin em euro licenciada ([Febraban/Accenture, 2026-11-17](https://tecemergentes.febraban.org.br/), [JPMorgan Chase, 2026-10-19](https://www.jpmorgan.com/payments/newsroom/jpm-coin-live-on-ethereum), [BBVA, 2026-10-14](https://www.ledgerinsights.com/qivalis-stablecoin-consortium-secures-dutch-emi-license/))
- Na pesquisa, pagamentos agênticos é o tema que mais acelera em 2026 (8,8x sobre 2025, normalizado pelo total do OpenAlex), seguido de modelos fundacionais tabulares (3,4x), agentes em finanças (2,6x) e segurança de IA (2,5x). Computação quântica em finanças (0,79x) e CBDC (0,95x) perdem espaço, ao contrário do impacto 5 e 4 que o Radar lhes dá. O Radar cita só 7 cases para proteção contra fraudes com IA, menos que os 9 de biotech ([Febraban/Accenture, 2026-11-17](https://tecemergentes.febraban.org.br/), [OpenAlex, 2026-11-28](https://api.openalex.org/works))

## 1. O que a Febraban mapeia (edições e datas)

| Publicação | Edição | Data | Autoria | O que traz |
|---|---|---|---|---|
| [Radar de Tecnologias (portal do Estudo de Tecnologias Emergentes)](https://tecemergentes.febraban.org.br/) | 2026 (build v2.2 de 27/10/2026) | 2026-11-17 (Last-Modified) | Febraban e Accenture | 35 tecnologias em 5 domínios, com maturidade (Conceitual, Emergente, Em escala), impacto 1–5 e status 2026; 6 teses; cases e fontes por tecnologia. Os dados vêm num objeto JSON embutido na página (window.RADAR_DADOS). |
| [Estudo de Tecnologias Emergentes para o setor bancário 2026](https://cmsarquivos.febraban.org.br/Arquivos/documentos/PDF/Estudo%20de%20Tecnologias%20Emergentes%20para%20o%20setor%20banc%C3%A1rio%202026.pdf) | 3ª edição | 2026-11-18 | Febraban (Diretoria de Inovação e Tecnologia Bancária, Grupo de Novas Tecnologias) e Accenture | 36 páginas. 35 tendências, 433 tecnologias subjacentes, 238 cases, mais de 650 fontes. 6 teses. Benchmark com imersão na China e em Singapura (20+ sessões, 14 empresas). Matriz escalar/experimentar/preparar. |
| [Pesquisa Febraban de Tecnologia Bancária 2026, Vol. 1 (versão executiva)](https://cmsarquivos.febraban.org.br/Arquivos/documentos/PDF/Pesquisa%20Febraban%202026%20V1.pdf) | 34ª edição | 2026-06 (release de 26/06/2026) | Febraban e Deloitte | 25 bancos, ~85% dos ativos; coleta dez/2025–mar/2026. Orçamento, prioridades por tecnologia, estratégias de diferenciação, volumetria. |
| [Pesquisa Febraban de Tecnologia Bancária 2026, Vol. 2 (versão completa)](https://cmsarquivos.febraban.org.br/Arquivos/documentos/PDF/Pesquisa%20de%20Tecnologia%20Banc%C3%A1ria%202026%20-%20Vol_%202%20Vers%C3%A3o%20Completa.pdf) | 34ª edição | 2026-08-25 | Febraban e Deloitte | Detalhe de IA e agentes, LLMs, governança de IA, cloud, cibersegurança e fraude, computação quântica, inovação, ativos digitais, Open Finance, transações por canal e Pix. |

Nota: o PDF do Estudo diz 238 cases e mais de 650 fontes. O portal soma 294 cases e 405 fontes nas fichas das 35 tecnologias. As fontes não explicam a diferença; usamos as contagens do portal por tecnologia.

### 1.1 Radar de Tecnologias 2026: as 35 tecnologias e como a Febraban as classifica

Maturidade: Conceitual, Emergente ou Em escala. Impacto: 1 a 5. Fonte: dados estruturados do portal (`window.RADAR_DADOS`, edição 2026), [Radar de Tecnologias, 17/11/2026](https://tecemergentes.febraban.org.br/).

| Domínio | Tecnologia | Maturidade | Impacto | Status 2026 | Teses | Cases citados |
|---|---|---|---|---|---|---|
| IA & Dados | Modelos fundacionais | Em escala | 5 | Mantida em 2026 | IA & Agentes, Banco Conversacional | 13 |
| IA & Dados | IA no SDLC | Em escala | 5 | Mantida em 2026 | IA & Agentes | 8 |
| IA & Dados | Agentes de IA | Emergente | 5 | Mantida em 2026 | IA & Agentes, Banco Conversacional, Comércio Agêntico | 17 |
| IA & Dados | Orquestração e Conectividade para Agentes | Emergente | 4 | Nova ou reformulada em 2026 | IA & Agentes, Banco Conversacional | 6 |
| IA & Dados | Grafos de Conhecimento e Ontologias | Emergente | 4 | Nova ou reformulada em 2026 | IA & Agentes | 10 |
| IA & Dados | Pagamentos Agênticos e Finanças Delegadas | Conceitual | 5 | Mantida em 2026 | Banco Conversacional, Comércio Agêntico | 14 |
| IA & Dados | IA Explicável e Responsável | Emergente | 4 | Mantida em 2026 | IA & Agentes | 6 |
| IA & Dados | Federated Learning e Privacy ML | Conceitual | 4 | Nova ou reformulada em 2026 |  | 6 |
| IA & Dados | Edge AI | Emergente | 4 | Nova ou reformulada em 2026 |  | 5 |
| Segurança Digital | Identidade e Autenticação | Em escala | 5 | Mantida em 2026 | Comércio Agêntico, Segurança Digital | 15 |
| Segurança Digital | Proteção contra fraudes com IA | Emergente | 5 | Nova ou reformulada em 2026 | Comércio Agêntico, Segurança Digital | 7 |
| Segurança Digital | IA Defensiva em Operações de Segurança | Emergente | 5 | Nova ou reformulada em 2026 | Segurança Digital | 8 |
| Segurança Digital | Proteção de soluções com IA | Conceitual | 5 | Nova ou reformulada em 2026 | Segurança Digital | 7 |
| Segurança Digital | Cibersegurança Pós-Quântica | Conceitual | 5 | Mantida em 2026 | Computação Quântica, Segurança Digital | 10 |
| Segurança Digital | Crypto Agility e Migração PQC | Conceitual | 5 | Nova ou reformulada em 2026 | Computação Quântica, Segurança Digital | 6 |
| Segurança Digital | Privacy Preserving Computation | Conceitual | 4 | Mantida em 2026 | Segurança Digital | 8 |
| Convergência Ciberfísica | Physical AI e Robótica de Fundação | Conceitual | 3 | Nova ou reformulada em 2026 |  | 9 |
| Convergência Ciberfísica | Biotech e Augmentação Humana | Conceitual | 2 | Nova ou reformulada em 2026 |  | 9 |
| Convergência Ciberfísica | Gêmeos Digitais | Emergente | 4 | Mantida em 2026 |  | 7 |
| Convergência Ciberfísica | Spatial Computing e Interfaces Imersivas | Emergente | 2 | Nova ou reformulada em 2026 |  | 5 |
| Arquiteturas Computacionais | Computação Quântica | Conceitual | 5 | Mantida em 2026 | Computação Quântica | 13 |
| Arquiteturas Computacionais | IA na Operação de Tecnologia | Emergente | 4 | Nova ou reformulada em 2026 |  | 9 |
| Arquiteturas Computacionais | Edge Computing & IoT | Em escala | 4 | Mantida em 2026 |  | 7 |
| Arquiteturas Computacionais | Embedded Finance e Banking as a Platform | Emergente | 4 | Nova ou reformulada em 2026 | Banco Conversacional, Comércio Agêntico | 7 |
| Arquiteturas Computacionais | Nanomateriais e Novas Mídias de Armazenamento | Conceitual | 1 | Nova ou reformulada em 2026 |  | 5 |
| Arquiteturas Computacionais | Processadores Beyond Silicon | Conceitual | 4 | Mantida em 2026 |  | 5 |
| Arquiteturas Computacionais | Infraestrutura de Energia para Datacenters | Emergente | 5 | Mantida em 2026 |  | 6 |
| Arquiteturas Computacionais | Conectividade Avançada 5G-6G | Emergente | 3 | Mantida em 2026 |  | 8 |
| Arquiteturas Computacionais | Green Tech | Emergente | 3 | Mantida em 2026 |  | 6 |
| DLT & Criptoativos | Ativos Digitais e Tokenização | Emergente | 3 | Nova ou reformulada em 2026 | Ativos Digitais | 13 |
| DLT & Criptoativos | Tokenização de Ativos Reais (RWA) | Emergente | 4 | Mantida em 2026 | Ativos Digitais | 7 |
| DLT & Criptoativos | Smart Contracts | Em escala | 4 | Mantida em 2026 | Ativos Digitais | 9 |
| DLT & Criptoativos | CBDC e Moedas Digitais | Emergente | 4 | Mantida em 2026 | Ativos Digitais | 12 |
| DLT & Criptoativos | DApps & DeFi | Emergente | 3 | Mantida em 2026 | Ativos Digitais | 6 |
| DLT & Criptoativos | Seguros Paramétricos | Conceitual | 4 | Nova ou reformulada em 2026 |  | 5 |

### 1.2 As seis teses do Estudo 2026 e a recomendação de cada uma

Fonte: [Estudo de Tecnologias Emergentes 2026, p. 6 e p. 34, 18/11/2026](https://cmsarquivos.febraban.org.br/Arquivos/documentos/PDF/Estudo%20de%20Tecnologias%20Emergentes%20para%20o%20setor%20banc%C3%A1rio%202026.pdf).

| Tese | Pergunta | Escalar agora | Experimentar com disciplina | Preparar as fundações |
|---|---|---|---|---|
| 1. IA & Agentes | Até que ponto a IA já evoluiu de assistente para agente que executa processos complexos? | Focar em poucos domínios de alto valor com métricas; escalar com governança e monitoramento. | Reimaginar e automatizar processos de ponta a ponta com agentes. | Bases de dados e conhecimento proprietárias; pessoas, incentivos e cultura de IA. |
| 2. Banco conversacional | Como construir marca, dados e relação quando a interface passa a ser um LLM? | Personalizar ofertas com dados transacionais; jornadas proativas e execução segura nos canais próprios. | Presença em plataformas de IA e marketplaces; experiências com GenUI nativo. | Expor produtos de forma padronizada para LLMs e agentes (ex.: MCP); relevância de marca nas interfaces de IA. |
| 3. Comércio agêntico | Como identificar, autorizar e auditar agentes que compram em nome do cliente? | Identidade e consentimento de usuários e agentes; controles adaptativos de fraude e PLD sobre ações de agentes. | Agentes financeiros próprios; tornar o banco descobrível por agentes. | Serviços modulares via APIs e padrões abertos; regras para finanças delegadas, responsabilidade e disputas. |
| 4. Computação quântica | Como iniciar o inventário criptográfico e a migração PQC antes do Q-Day? | Inventariar ativos criptográficos (CBOM) priorizando exposição a 'colha agora, decifre depois'; iniciar a migração PQC nos sistemas mais críticos. | Pilotos com parceiros (ex.: Febraban + CESAR); ambiente de testes PQC. | Arquitetura cripto-ágil; ecossistema de talentos e parcerias. |
| 5. Ativos virtuais & tokenização | Que adaptações de infraestrutura e como os bancos usarão o dinheiro programável e pagamentos agênticos? | Definir posição (emitir, custodiar ou facilitar); adequar câmbio, capital (SCO60) e PLD/FT. | Pilotos agênticos em pagamentos e tesouraria; participar do Drex Fase 2 e lançar depósitos tokenizados. | Custódia institucional e criptoagilidade; convergência entre Pix, Open Finance e DLT. |
| 6. Segurança digital | Como estar um passo à frente, na velocidade da máquina, das ameaças com IA? | SOC em velocidade de máquina com validação humana; proteger jornadas contra deepfakes e fraude sintética. | Controles de agentes (inventário, limites, trilha); evoluir o compartilhamento setorial de informações de fraude. | Segurança desde o desenvolvimento e mapa de Shadow AI; gestão de terceiros críticos (modelos, nuvem, fornecedores). |

### 1.3 Pesquisa Febraban de Tecnologia Bancária 2026 (34ª edição): como os bancos se posicionam

| Indicador | Valor | Fonte |
|---|---|---|
| Orçamento total de tecnologia (21 bancos) | R$ 46,8 bi (2025) → R$ 50,4 bi (2026, expectativa); +8%; +58% em 5 anos | [Pesquisa 2026 Vol. 1, p. 6 (jun/2026)](https://cmsarquivos.febraban.org.br/Arquivos/documentos/PDF/Pesquisa%20Febraban%202026%20V1.pdf) |
| IA, analytics e big data no orçamento (16 bancos) | R$ 2,76 bi (2025) → R$ 2,97 bi (2026e), +8% | [Pesquisa 2026 Vol. 2, p. 9 (25/08/2026)](https://cmsarquivos.febraban.org.br/Arquivos/documentos/PDF/Pesquisa%20de%20Tecnologia%20Banc%C3%A1ria%202026%20-%20Vol_%202%20Vers%C3%A3o%20Completa.pdf) |
| Migração para cloud no orçamento (16 bancos) | R$ 3,0 bi → R$ 3,9 bi (+30%) | [Pesquisa 2026 Vol. 2, p. 9 (25/08/2026)](https://cmsarquivos.febraban.org.br/Arquivos/documentos/PDF/Pesquisa%20de%20Tecnologia%20Banc%C3%A1ria%202026%20-%20Vol_%202%20Vers%C3%A3o%20Completa.pdf) |
| Pix e Open Finance no orçamento (12 bancos) | Pix R$ 940 mi → R$ 871 mi (−7%); Open Finance R$ 396 mi → R$ 395,9 mi (−1%) | [Pesquisa 2026 Vol. 2, p. 9 (25/08/2026)](https://cmsarquivos.febraban.org.br/Arquivos/documentos/PDF/Pesquisa%20de%20Tecnologia%20Banc%C3%A1ria%202026%20-%20Vol_%202%20Vers%C3%A3o%20Completa.pdf) |
| Prioridade média/alta de investimento (25 bancos) | Cibersegurança 100%; Cloud 84%; IA generativa 84%; IA 80%; Blockchain 32%; Computação quântica 8% | [Pesquisa 2026 Vol. 1, p. 9 (jun/2026)](https://cmsarquivos.febraban.org.br/Arquivos/documentos/PDF/Pesquisa%20Febraban%202026%20V1.pdf) |
| Maturidade média/alta (25 bancos) | Cibersegurança 96%; Cloud 72%; IA 40%; IA generativa 28%; Blockchain 25%; Computação quântica 8% | [Pesquisa 2026 Vol. 2, p. 52 (25/08/2026)](https://cmsarquivos.febraban.org.br/Arquivos/documentos/PDF/Pesquisa%20de%20Tecnologia%20Banc%C3%A1ria%202026%20-%20Vol_%202%20Vers%C3%A3o%20Completa.pdf) |
| IA para experiência do cliente em larga escala | 20% dos bancos | [Pesquisa 2026 Vol. 1, p. 12 (jun/2026)](https://cmsarquivos.febraban.org.br/Arquivos/documentos/PDF/Pesquisa%20Febraban%202026%20V1.pdf) |
| Agentes de IA | 52% adotam; 16% em larga escala com captura de valor; 36% em pequena escala | [Pesquisa 2026 Vol. 2, p. 20 (25/08/2026)](https://cmsarquivos.febraban.org.br/Arquivos/documentos/PDF/Pesquisa%20de%20Tecnologia%20Banc%C3%A1ria%202026%20-%20Vol_%202%20Vers%C3%A3o%20Completa.pdf) |
| Aplicações de agentes (17 bancos) | Automação interna 76%; atendimento 71%; suporte a equipes 71%; risco e compliance 47% | [Pesquisa 2026 Vol. 2, p. 21 (25/08/2026)](https://cmsarquivos.febraban.org.br/Arquivos/documentos/PDF/Pesquisa%20de%20Tecnologia%20Banc%C3%A1ria%202026%20-%20Vol_%202%20Vers%C3%A3o%20Completa.pdf) |
| LLMs e técnicas (21–25 bancos) | RAG 94%; MCP 50%; SLMs 39%; 2+ provedores de LLM 36%; on-premise 8% | [Pesquisa 2026 Vol. 2, p. 22 (25/08/2026)](https://cmsarquivos.febraban.org.br/Arquivos/documentos/PDF/Pesquisa%20de%20Tecnologia%20Banc%C3%A1ria%202026%20-%20Vol_%202%20Vers%C3%A3o%20Completa.pdf) |
| IA no desenvolvimento (25 bancos) | Geração de código: 20% em larga escala, 72% em exploração; teste de código: 16% em larga escala | [Pesquisa 2026 Vol. 2, p. 23 (25/08/2026)](https://cmsarquivos.febraban.org.br/Arquivos/documentos/PDF/Pesquisa%20de%20Tecnologia%20Banc%C3%A1ria%202026%20-%20Vol_%202%20Vers%C3%A3o%20Completa.pdf) |
| Gestão de risco de LLM (23 bancos) | Red teaming 30%; testes adversariais 30%; sem práticas de governança 17% | [Pesquisa 2026 Vol. 2, p. 26 (25/08/2026)](https://cmsarquivos.febraban.org.br/Arquivos/documentos/PDF/Pesquisa%20de%20Tecnologia%20Banc%C3%A1ria%202026%20-%20Vol_%202%20Vers%C3%A3o%20Completa.pdf) |
| Risco de concentração em IA (12 bancos) | 50% monitoram concentração em provedores; 33% têm plano de saída | [Pesquisa 2026 Vol. 2, p. 25 (25/08/2026)](https://cmsarquivos.febraban.org.br/Arquivos/documentos/PDF/Pesquisa%20de%20Tecnologia%20Banc%C3%A1ria%202026%20-%20Vol_%202%20Vers%C3%A3o%20Completa.pdf) |
| Cloud por sistema | Core banking: 21% migrado, 62% ainda não; Cartões: 16% migrado, 62% não | [Pesquisa 2026 Vol. 2, p. 27 (25/08/2026)](https://cmsarquivos.febraban.org.br/Arquivos/documentos/PDF/Pesquisa%20de%20Tecnologia%20Banc%C3%A1ria%202026%20-%20Vol_%202%20Vers%C3%A3o%20Completa.pdf) |
| Antifraude e PLD (25 bancos) | MFA 88%; monitoramento preditivo 76%; biometria comportamental 60%; IA/ML para fraude 56% | [Pesquisa 2026 Vol. 2, p. 35 (25/08/2026)](https://cmsarquivos.febraban.org.br/Arquivos/documentos/PDF/Pesquisa%20de%20Tecnologia%20Banc%C3%A1ria%202026%20-%20Vol_%202%20Vers%C3%A3o%20Completa.pdf) |
| Computação quântica (14 bancos) | 29% já relevante; 14% em até 2 anos; 28% acima de 3 anos; 29% não relevante. PQC é o tema prioritário | [Pesquisa 2026 Vol. 2, p. 36 (25/08/2026)](https://cmsarquivos.febraban.org.br/Arquivos/documentos/PDF/Pesquisa%20de%20Tecnologia%20Banc%C3%A1ria%202026%20-%20Vol_%202%20Vers%C3%A3o%20Completa.pdf) |
| Prioridades de inovação (18 bancos) | Migração de dados para nuvem 88%; GenAI 82%; tokenização e custódia 30%; monetização de dados 30%; blockchain 22% | [Pesquisa 2026 Vol. 2, p. 46 (25/08/2026)](https://cmsarquivos.febraban.org.br/Arquivos/documentos/PDF/Pesquisa%20de%20Tecnologia%20Banc%C3%A1ria%202026%20-%20Vol_%202%20Vers%C3%A3o%20Completa.pdf) |
| Como medem inovação (24 bancos) | Experiência do cliente 50%; ROI financeiro 42%; aumento de receita 8% | [Pesquisa 2026 Vol. 2, p. 47 (25/08/2026)](https://cmsarquivos.febraban.org.br/Arquivos/documentos/PDF/Pesquisa%20de%20Tecnologia%20Banc%C3%A1ria%202026%20-%20Vol_%202%20Vers%C3%A3o%20Completa.pdf) |
| Ativos digitais (23 bancos) | 65% não operam; 9% operam custódia e tokenização integradas | [Pesquisa 2026 Vol. 2, p. 53 (25/08/2026)](https://cmsarquivos.febraban.org.br/Arquivos/documentos/PDF/Pesquisa%20de%20Tecnologia%20Banc%C3%A1ria%202026%20-%20Vol_%202%20Vers%C3%A3o%20Completa.pdf) |
| Open Finance | 7% extraem benefício significativo e 52% esperam extrair; uso dos dados: CRM 51%, pagamentos 16%, crédito 7% | [Pesquisa 2026 Vol. 2, p. 56 (25/08/2026)](https://cmsarquivos.febraban.org.br/Arquivos/documentos/PDF/Pesquisa%20de%20Tecnologia%20Banc%C3%A1ria%202026%20-%20Vol_%202%20Vers%C3%A3o%20Completa.pdf) |

## 2. O que o mundo mostra

### 2.1 Bancos líderes: práticas públicas com número

Seleção por banco (3 fatos). A lista completa (134 fatos datados) está no JSON, em `praticas_bancos`. Valores de IA em moeda são autodeclarados pelos bancos, sem conciliação com o resultado. ‡ = conferido só em resultado de busca.

| Banco | Dimensão | Fato | Fonte |
|---|---|---|---|
| JPMorgan Chase | Orçamento/pessoas | Orçamento de tecnologia de ~US$19,8 bi para 2026 (≈+10% vs. US$18 bi em 2025). | [JPMorgan Chase, 2026-04](https://www.jpmorganchase.com/content/dam/jpmc/jpmorgan-chase-and-co/investor-relations/documents/annualreport-2025.pdf) |
| JPMorgan Chase | IA/GenAI | Mais de 90% dos engenheiros usam assistentes de código com IA e mais de 65 mil colaboradores do CIB usam ativamente o LLM Suite. | [JPMorgan Chase, 2026-04](https://www.jpmorganchase.com/content/dam/jpmc/jpmorgan-chase-and-co/investor-relations/documents/annualreport-2025.pdf) |
| JPMorgan Chase | IA/GenAI | Varejo (CCB) reporta ~60% de aumento anual no valor gerado por IA/ML e meta de >40% de eficiência bruta de produtividade em Operações até 2030; foco agora em capacidades agênticas (código, marketing, pricing). | [JPMorgan Chase, 2026-04](https://www.jpmorganchase.com/content/dam/jpmc/jpmorgan-chase-and-co/investor-relations/documents/annualreport-2025.pdf) |
| Bank of America | Orçamento/pessoas | Orçamento de tecnologia de US$13,5 bi, com 30% destinados a novas iniciativas, incluindo IA. | [Bank of America, 2026-04-15](https://www.bankingdive.com/news/bank-of-america-gopalkrishnan-ai-strategy/817544/) |
| Bank of America | Orçamento/pessoas | Cerca de 60 mil pessoas trabalham nas tecnologias do banco (CTO). | [Bank of America, 2026-03-17](https://fortune.com/2026/03/17/inside-bank-of-americas-build-once-ai-strategy/) |
| Bank of America | IA/GenAI | Assistentes de código com IA usados por 18 mil desenvolvedores, com ganho de ~20% em partes do ciclo de desenvolvimento. | [Bank of America, 2025-11-05](https://fortune.com/2025/11/05/bank-of-america-prioritizes-bigger-ai-initiatives-as-annual-spending-on-new-tech-increased-by-44-over-the-past-decade) |
| Capital One | IA/GenAI | Chat Concierge, sistema multiagente próprio em produção em sites de concessionárias, converte leads em compradores 55% melhor; latência caiu 5x desde o lançamento. | [Capital One, 2025-12-15](https://fortune.com/2025/12/15/agentic-artificial-intelligence-automation-capital-one/) |
| Capital One | IA/GenAI | Framework multiagente reaproveitado para atendimento de chamadas sobre fraude ('build once, reuse'). | [Capital One, 2026-04-08](https://www.capitalone.com/tech/ai/nvidia-gtc-2026/) |
| Capital One | IA/GenAI | Comprou a fintech Brex (US$5 bi; ~35 mil clientes), que traz suíte de produtos de IA agêntica para pagamentos empresariais. | [Capital One, 2026-04-08](https://www.americanbanker.com/payments/news/capital-one-closes-brex-acquisition) |
| Citigroup | IA/GenAI | Ferramentas próprias de IA para >182 mil funcionários; 30 mil desenvolvedores com IA geraram ~100 mil horas/semana de capacidade. | [Citigroup, 2026-03](https://www.citigroup.com/rcs/citigpa/storage/public/Annual_Report/2025/stronger-bank-built-to-perform.pdf) |
| Citigroup | IA/GenAI | Stylus Workspaces chega a >180 mil pessoas, >65 mi de interações com IA desde dez/2024 e adoção >87%; Devin remapeou 30+ anos de código legado em 2 dias. | [Citigroup, 2026-09-22](https://www.citigroup.com/global/news/perspectives/2026/competitive-differentiator-david-griffiths-building-worlds-most-ai-empowered-financial-institution) |
| Citigroup | IA/GenAI | Lançou o Arc (abr/2026), plataforma para agentes de IA embutidos em todas as linhas de negócio, inicialmente para desenvolvedores. | [Citigroup, 2026-04-30](https://www.citigroup.com/global/news/perspectives/2026/print/introducing-ai-agents-next-phase-citi-artificial-intelligence-journey) |
| Wells Fargo | IA/GenAI | Assistente Fargo superou 1 bi de interações com clientes em menos de 3 anos; 33 mi de usuários mobile ativos (fev/2026). | [Wells Fargo, 2026-03-26](https://newsroom.wf.com/news-releases/news-details/2026/Wells-Fargo-Reaches-Major-Digital-Milestones/default.aspx) |
| Wells Fargo | IA/GenAI | Iniciou a oferta de IA generativa e agêntica (Google Agentspace) para todos os ~215 mil funcionários. | [Wells Fargo, 2025-08-05](https://www.americanbanker.com/news/wells-fargo-plans-to-unleash-googles-agentic-ai-bank-wide) |
| Wells Fargo | IA/GenAI | CEO afirma que ferramentas de genAI deixaram engenheiros 30%–35% mais eficientes em escrever código; quadro caiu de 275 mil (2019) para ~210 mil (set/2025). | [Wells Fargo, 2025-12-10](https://finance.yahoo.com/news/wells-fargo-signals-more-job-112410378.html) |
| HSBC | IA/GenAI | Mais de 600 casos de uso de IA em operação; >20 mil desenvolvedores com assistentes de código (15% de eficiência no tempo de codificação); assistente genAI do CIB apoia 3 mi de interações/ano. | [HSBC, 2026-08-17](https://www.hsbc.com/who-we-are/hsbc-and-digital/hsbc-and-ai/transforming-hsbc-with-ai) |
| HSBC | Core | Já aposentou >1.100 de 3.000 aplicações legadas/não estratégicas (de >9 mil), meta de concluir até 2028; TI ≈20% das despesas operacionais (US$36,4 bi em 2025). | [HSBC, 2026-02-26](https://www.thestack.technology/hsbc-retiring-apps-ai/) |
| HSBC | Orçamento/pessoas | CEO indica que ~20% das despesas vão para TI (≈US$7 bi sobre opex de US$36,4 bi em 2025, estimativa derivada). | [HSBC, 2026-02-26](https://www.thestack.technology/hsbc-retiring-apps-ai/) |
| BBVA | IA/GenAI | Estendeu o ChatGPT Enterprise a todos os 120 mil funcionários em 25 países (10x a base anterior de 11 mil, que poupava ~3 h/semana). | [BBVA, 2025-12-12](https://openai.com/index/bbva-collaboration-expansion/) |
| BBVA | IA/GenAI | 75% dos funcionários usam IA recorrentemente (economia média de 2,4 h/semana); produtividade de desenvolvedores +28%; agentes de voz resolvem ~90% das interações em pilotos no Peru e México. | [BBVA, 2026-10-06](https://www.bbva.com/es/innovacion/bbva-crea-un-modelo-para-escalar-la-ia-a-todo-el-grupo-e-impulsar-su-transformacion-centrada-en-el-cliente/) |
| BBVA | IA/GenAI | Criou 'The Frame', marco comum para criar, implantar e governar agentes de IA em escala; assistente Blue (modelos OpenAI) terá roll-out gradual a pessoas e empresas em 2027. | [BBVA, 2026-10-06](https://www.bbva.com/es/innovacion/bbva-crea-un-modelo-para-escalar-la-ia-a-todo-el-grupo-e-impulsar-su-transformacion-centrada-en-el-cliente/) |
| Banco Santander | IA/GenAI | Meta de >€1 bi de valor de negócio com IA em 2026–2028; €35 mi no 1T26 e >€200 mi esperados em 2026; acesso a IA para todos os 185 mil funcionários. | [Banco Santander, 2026-06-22](https://www.santander.com/en/stories/santander-turns-its-ai-first-strategy-into-measurable-impact-and-extends-ai-access-to-all-185000-employees) |
| Banco Santander | IA/GenAI | Mais de 17 mil pessoas usam IA agêntica no desenvolvimento de software e 40% do código já é gerado por IA; >280 agentes de automação de processos em produção. | [Banco Santander, 2026-06-22](https://www.santander.com/en/stories/santander-turns-its-ai-first-strategy-into-measurable-impact-and-extends-ai-access-to-all-185000-employees) |
| Banco Santander | IA/GenAI | Com NVIDIA, custo por interação de atendimento caiu de ~€5 para ~€0,03 em casos experimentais (corte >50% em um deployment). | [Banco Santander, 2026-10-19](https://www.santander.com/en/press-room/press-releases/2026/10/santander-builds-ai-capabilities-that-improve-performance-and-lower-costs-using-nvidia-ai-infrastructure) |
| ING | IA/GenAI | Chatbot genAI em 7 países; 82% de processamento direto (STP) em 245 jornadas de varejo; IA generativa e agêntica listadas como alavancas de eficiência para 2026. | [ING, 2026-01-30](https://ing.com/binaries/content/assets/documents/results/4qfy2025/4qfy2025-ing-results-presentation.pdf) |
| ING | IA/GenAI | Agente de IA para análise de hipotecas na Holanda, piloto iniciado em mar/2026, em escala gradual com supervisão humana. | [ING, 2026-06-08](https://ing.com/news/2026/how-ing-uses-agentic-ai-to-speed-up-mortgage-decisions.html) |
| ING | IA/GenAI | Corte de ~1.250 vagas globais em 2026, parte em PLD/AML (área de ~6 mil pessoas), dentro de programa de €350 mi de economia com mais IA e automação. | [ING, 2026-03-18](https://www.dutchnews.nl/2026/03/ing-to-cut-1250-jobs-worldwide-many-in-anti-money-laundering/) |
| UBS | IA/GenAI | Assistente Red usado por 52 mil funcionários; 55 mil licenças de Microsoft 365 Copilot; 8 mi de prompts no 2T25 (4x fim de 2024); >280 casos de uso ativos. | [UBS, 2025-08-26](https://www.netzwoche.ch/news/2025-08-26/ubs-setzt-im-grossen-stil-auf-generative-ki) |
| UBS | IA/GenAI | STAAT Insights economiza ~1.200 horas/semana de assessores; UBS é o único europeu no top 10 do Evident AI Index 2026 (6º). | [UBS, 2026-10-07](https://www.euronews.com/2026/10/07/ubs-only-european-bank-in-top-10-of-ai-adoption-as-jpmorgan-chase-leads) |
| Lloyds Banking Group | IA/GenAI | GenAI gerou ~£50 mi de valor em 2025 (>50 soluções) e o banco espera >£100 mi em 2026, escalando IA agêntica. | [Lloyds Banking Group, 2026-01-29](https://fstech.co.uk/fst/Lloyds_Banking_Group_Targets_100m_AI_Value.php) |
| Lloyds Banking Group | IA/GenAI | ~5 mil engenheiros usam GitHub Copilot; ferramenta Athena usada por 20 mil colaboradores (-66% no tempo de busca); conversão de código legado 50% melhor. | [Lloyds Banking Group, 2026-01-29](https://fstech.co.uk/fst/Lloyds_Banking_Group_Targets_100m_AI_Value.php) |
| Lloyds Banking Group | Orçamento/pessoas | Investimento em transformação digital acima de £4 bi. | [Lloyds Banking Group, 2026-01-29](https://fstech.co.uk/fst/Lloyds_Banking_Group_Targets_100m_AI_Value.php) |
| Barclays | IA/GenAI | Acordo para levar Microsoft 365 Copilot a 100 mil funcionários, após piloto com 15 mil, incluindo agente 'Colleague AI Agent'. | [Barclays, 2025-06](https://www.computerweekly.com/news/366625580/Barclays-rolls-out-Microsoft-Copilot-to-100000-employees-as-AI-adoption-gathers-pace) |
| Barclays | Quântica/PQC | Pesquisa quântica desde 2017 (algoritmo de clearing, otimização de portfólio com IBM) e migração para criptografia resistente a quântica. | [Barclays, 2026-03-27](https://thequantuminsider.com/2026/03/27/15-plus-global-banks-probing-the-wonderful-world-of-quantum-technologies/) |
| BNP Paribas | Tokenização | Membro fundador do Qivalis, joint venture de bancos europeus para stablecoin em euro (licença EMI do DNB em out/2026). | [BNP Paribas, 2025-12-02](https://cdn-group.bnpparibas.com/uploads/file/20251202_Qivalis,%20joint%20venture%20of%20a%20European%20banking%20consortium,%20to%20launch%20euro%20stablecoin%20in%20the%20second%20half%20of%202026_1.pdf) |
| BNP Paribas | Quântica/PQC | Times quânticos dedicados no CIB, experimentos com Pasqal (otimização de colateral, derivativos) e membro do Quantum Safe Financial Forum. | [BNP Paribas, 2026-03-27](https://thequantuminsider.com/2026/03/27/15-plus-global-banks-probing-the-wonderful-world-of-quantum-technologies/) |
| DBS | IA/GenAI | DBS atribuiu valor econômico de cerca de SGD 1 bilhão em 2025 às iniciativas de dados/IA/ML, com mais de 2.000 modelos em mais de 430 casos de uso. | [DBS, 2026-02](https://www.dbs.com/annualreports/2025/letter-from-chairman-ceo.html) |
| DBS | IA/GenAI | O valor econômico atribuído à IA subiu cerca de um terço, de SGD 750 milhões em 2024 para SGD 1 bilhão em 2025. | [DBS, 2026-01](https://www.fccsingapore.com/news/n/news/dbs-says-ai-push-is-paying-off-as-it-shifts-from-efficiency-tool-to-growth-engine.html) |
| DBS | IA/GenAI | Cerca de dois terços dos funcionários usam GenAI no dia a dia; o chatbot corporativo DBS Joy atendeu mais de 20 mil clientes corporativos/PMEs desde jul/2025 e o assistente de código com IA agêntica reduz em até 20% o tempo de certas tarefas. | [DBS, 2026-02](https://www.dbs.com/annualreports/2025/letter-from-chairman-ceo.html) |
| Commonwealth Bank of Australia (CBA) | Ciber/fraude | CBA reportou queda de 76% nas perdas de clientes com golpes desde o pico (2S25 vs 1S23) e investimento de mais de A$900 milhões no FY25 contra fraude, golpes, crime financeiro e ciberameaças. | [Commonwealth Bank of Australia (CBA), 2025-08-11](https://www.commbank.com.au/content/commbank-neo/articles/newsroom/2025/08/commbank-customer-scam-losses-fall-truyu.html) |
| Commonwealth Bank of Australia (CBA) | Ciber/fraude | A detecção de golpes e fraudes com IA contribuiu para redução de ~20% nas perdas de clientes entre jul e dez/2025; CBA ficou em 4º lugar global no Evident AI Index 2025. | [Commonwealth Bank of Australia (CBA), 2026-04-10](https://www.commbank.com.au/business/brighter-perspectives/commbank-ai-protect-customers-and-power-innovation.html) |
| Commonwealth Bank of Australia (CBA) | IA/GenAI | CBA lançou a 'AI Factory' na AWS para treinar e ajustar modelos com dados proprietários, rodando um modelo de deep learning sobre 3 trilhões de pontos de dados de 4 bilhões de transações; o assistente GenAI para gerentes PJ respondeu mais de 250 mil perguntas. | [Commonwealth Bank of Australia (CBA), 2025-09](https://www.commbank.com.au/content/dam/commbank-assets/investors/2025-09/annual-review-2025.pdf) |
| Nubank (Nu Holdings) | IA/GenAI | O modelo fundacional proprietário NuFormer (autossupervisionado, treinado em mais de uma década de transações de 100+ milhões de clientes) está em produção em cartão no Brasil e México e crédito pessoal no Brasil; a nova versão quadruplicou contexto e velocidade de treino/inferência. | [Nubank (Nu Holdings), 2026-08-13](https://nu.com/en/newsroom/company/nu-holdings-ltd-reports-second-quarter-2026-financial-results) |
| Nubank (Nu Holdings) | IA/GenAI | Agentes de IA já atendem mais de 60% das conversas de suporte no Brasil, com qualidade igual ou superior à humana. | [Nubank (Nu Holdings), 2026-08-13](https://nu.com/en/newsroom/company/nu-holdings-ltd-reports-second-quarter-2026-financial-results) |
| Nubank (Nu Holdings) | IA/GenAI | No 1T26, 10 milhões de clientes ativos mensais usavam Pix com IA e 15 milhões usavam funcionalidades do 'AI Private Banker'; produtividade de engenharia subiu 50% a/a e consumo de tokens cresceu 10x desde jan/2026. | [Nubank (Nu Holdings), 2026-05-14](https://www.mobiletime.com.br/noticias/14/05/2026/pix-ia-nubank-10-mi/) |
| Itaú Unibanco | Core | Itaú roda mais de 70% dos serviços de negócio na AWS e planeja aposentar o mainframe e sair totalmente do data center até o fim de 2028, usando AWS Transform/Kiro (descoberta de aplicações de 3 meses para 2 semanas; ~75% menos tempo de migração por aplicação). | [Itaú Unibanco, 2026](https://aws.amazon.com/solutions/case-studies/itau-aws-transform-mainframe/) |
| Itaú Unibanco | Dados | O CEO afirmou na Febraban Tech 2024 que 100% dos dados do banco já estão na nuvem e 70% da modernização planejada foi concluída, faltando descomissionar o mainframe. | [Itaú Unibanco, 2024-06-25](https://convergenciadigital.com.br/inovacao/itau-unibanco-ja-tem-100-dos-seus-dados-na-nuvem-para-avancar-na-ia) |
| Itaú Unibanco | IA/GenAI | Itaú usa o agente de engenharia Devin (Cognition) em todos os times de tecnologia, ~75% deles de forma autônoma: +30% de volume de entregas, migrações 6x mais rápidas, 70% dos alertas de segurança de análise estática resolvidos e cobertura de testes de ~50% para 90%+. | [Itaú Unibanco, 2026-01-19](https://www.baguete.com.br/public/noticias/itau-usa-agente-de-ia-da-cognition) |
| Bradesco | IA/GenAI | A IA generativa resolve 82% das demandas no primeiro nível de atendimento; mais de 10 milhões de clientes usam o chat com IA e há cerca de 450 casos de uso de IA em andamento. | [Bradesco, 2025-10-27](https://www.bloomberglinea.com.br/negocios/ia-generativa-resolve-82-dos-atendimentos-iniciais-no-bradesco-diz-diretora/?outputType=amp) |
| Bradesco | IA/GenAI | A IA em cobrança, que analisa 18 mil ligações por dia, gerou mais de R$400 milhões em benefícios capturados em 2025; ganho de produtividade de 40% em tecnologia com o BIA Tech. | [Bradesco, 2025-10-27](https://www.bloomberglinea.com.br/negocios/ia-generativa-resolve-82-dos-atendimentos-iniciais-no-bradesco-diz-diretora/?outputType=amp) |
| Bradesco | IA/GenAI | A BIA atende 29 milhões de clientes e a retenção no atendimento automatizado subiu de 60% para 89%; uma arquitetura de agentes refez em 5 minutos um modelo de crédito que levara 3 meses a 10 cientistas de dados. | [Bradesco, 2026-05-20](https://forbes.com.br/forbes-tech/2026/05/entenda-como-humanos-e-agentes-trabalham-juntos-no-bradesco/) |
| Revolut | Ciber/fraude | Em 2025 os sistemas da Revolut analisaram mais de 10 bilhões de transações; modelos avançados de IA elevaram em quase 10x os casos revisados por dia e mais de 1/3 da força de trabalho atua em prevenção a crimes financeiros. | [Revolut, 2026-03-24](https://assets.revolut.com/pdf/annualreport2025.pdf) |
| Revolut | IA/GenAI | O Assistant (chatbot com LLM) resolve mais de 75% das consultas de clientes e elevou o NPS em 12 p.p.; a plataforma de IA tem gateway de LLM com provedores externos e modelos próprios ajustados, além de framework agêntico em desenvolvimento. | [Revolut, 2026-03-24](https://assets.revolut.com/pdf/annualreport2025.pdf) |
| Revolut | IA/GenAI | Revolut Research e NVIDIA publicaram o PRAGMA, modelo fundacional bancário (até 1B parâmetros) treinado em 26 milhões de históricos de usuários (~24 bilhões de eventos, 111 países). | [Revolut, 2026-04](https://philippdubach.com/posts/inside-pragma-revoluts-foundation-model-for-banking/index.md) |
| Monzo | IA/GenAI | No FY2026, 87% das equipes de tecnologia usavam ferramentas de IA semanalmente e as ferramentas de código com IA respondiam por 22% de todo o código commitado. | [Monzo, 2026-05-19](https://monzo.com/annual-report/2026/Monzo-Annual-Report-2026.pdf) |
| Monzo | IA/GenAI | O autoatendimento com IA trata 62% dos chats de entrada e resolve sozinho 55% deles, com satisfação de 4,4/5. | [Monzo, 2026-05-19](https://monzo.com/annual-report/2026/Monzo-Annual-Report-2026.pdf) |
| Monzo | Ciber/fraude | Monzo evitou mais de 3x o valor de fraude do ano anterior; aprendizado de representação multi-fraude elevou a detecção em ~30%, pausas em pagamentos pararam 25% mais golpes e um agente de IA antifraude resolve tarefas em ~30 s (90x mais rápido). | [Monzo, 2026-05-19](https://monzo.com/annual-report/2026/Monzo-Annual-Report-2026.pdf) |
| Ant Group (Alipay, MYbank) | Orçamento/pessoas | Ant Group investiu recorde de RMB 35 bilhões (~US$5,2 bi) em P&D em 2025, acima de 10% da receita pelo quarto ano seguido, com foco em LLMs fundacionais, pagamentos com IA e saúde. | [Ant Group (Alipay, MYbank), 2026-06-17](https://www.thestandard.com.hk/finance/article/334961/Ant-Group-logs-record-35-billion-yuan-in-RD-in-2025-over-10-percent-of-revenue) |
| Ant Group (Alipay, MYbank) | IA/GenAI | Ant lançou e abriu o código do Ling-1T, LLM de 1 trilhão de parâmetros da família Bailing (Ling 2.0), pré-treinado em mais de 20 trilhões de tokens. | [Ant Group (Alipay, MYbank), 2025-10-09](https://www.businesswire.com/news/home/20251009240721/en/Ant-Group-Unveils-Ling-AI-Model-Family-and-Launches-Trillion-Parameter-Language-Model-Ling-1T) ‡ |
| Ant Group (Alipay, MYbank) | Pagamentos | O AI Pay do Alipay (pagamento por agentes de IA via voz/apps) processou mais de 120 milhões de transações em uma semana (5–11/fev/2026) e passou de 100 milhões de usuários. | [Ant Group (Alipay, MYbank), 2026-02-13](https://www.businesswire.com/news/home/20260213770962/en/Alipay-AI-Payment-Exceeds-120-Million-Transactions-in-One-Week-as-Agentic-Commerce-Accelerates-in-China) ‡ |
| WeBank | IA/GenAI | Em 2025 o WeBank operava mais de 100 cenários de aplicação de IA, mais de 800 agentes de IA e mais de 60 'funcionários digitais' em sua estratégia de banco AI-native. | [WeBank, 2026-03-16](https://www.aap.com.au/aapreleases/cision20260316ae10617) |
| WeBank | Orçamento/pessoas | Até o fim de 2025 o WeBank atendeu mais de 430 milhões de clientes pessoa física e mais de 7 milhões de pequenas e microempresas, com o Weiyedai concedendo RMB 1,8 trilhão em crédito. | [WeBank, 2026-03-16](https://www.aap.com.au/aapreleases/cision20260316ae10617) |
| ICBC | Orçamento/pessoas | O investimento em tecnologia do ICBC atingiu RMB 28,588 bilhões em 2025. | [ICBC, 2026-03-27](https://longbridge.com/news/280880183) |
| ICBC | IA/GenAI | Com a iniciativa 'Lead AI+', o ICBC colocou mais de 500 aplicações de IA em mais de 30 áreas de negócio e seus funcionários digitais de IA realizaram trabalho equivalente a 55 mil pessoas-ano. | [ICBC, 2026-03-27](https://longbridge.com/news/280880183) |
| ICBC | IA/GenAI | O ICBC mantém pool de computação para LLMs majoritariamente com chips domésticos integrando mais de 10 modelos e um dataset financeiro de 1 trilhão de tokens; o assistente de precificação elevou a automação de transações para 96%. | [ICBC, 2026-04-16](https://en-cyd.youth.cn/news/202604/t20260416_809459.htm) |
| China Merchants Bank (CMB) | Orçamento/pessoas | CMB gastou mais de RMB 12,9 bilhões em TI em 2025 (4,31% da receita operacional). | [China Merchants Bank (CMB), 2026-03-27](https://www.itiger.com/news/1161824517) |
| China Merchants Bank (CMB) | IA/GenAI | CMB implantou 856 cenários de aplicação com LLMs e 183 modelos de domínio; a vazão diária de tokens cresceu 10,1x vs 2024 e o assistente DevAgent cobre mais de 97% dos desenvolvedores. | [China Merchants Bank (CMB), 2026-03-27](https://www.itiger.com/news/1161824517) |
| China Merchants Bank (CMB) | IA/GenAI | Os cenários de LLM substituíram mais de 15,56 milhões de horas de trabalho manual em 2025, equivalente a mais de 8.000 funcionários em tempo integral. | [China Merchants Bank (CMB), 2026-04-16](https://en-cyd.youth.cn/news/202604/t20260416_809459.htm) |
| Mercado Pago (Mercado Libre) | Pagamentos | No 3T26 o Mercado Pago chegou a 92,9 milhões de usuários ativos mensais (+29% a/a), TPV de US$109 bilhões (+53%) e carteira de crédito de US$17,9 bilhões (+62%). | [Mercado Pago (Mercado Libre), 2026-11-06](https://dplnews.com/?p=336397) |
| Mercado Pago (Mercado Libre) | IA/GenAI | No 3T25 o Mercado Livre lançou ferramentas de IA agêntica, incluindo o primeiro assistente de IA da fintech para tarefas como fazer e agendar transferências. | [Mercado Pago (Mercado Libre), 2025-10-29](https://www.aol.com/articles/mercadolibre-meli-q3-2025-earnings-233251355.html) |
| KakaoBank | IA/GenAI | KakaoBank lançou o 'KakaoBank AI', janela conversacional integrada (busca, calculadora e transferência por IA) com aba própria no app. | [KakaoBank, 2025-12-15](https://www.asiae.co.kr/en/article/2025121509114183684) |
| KakaoBank | Pagamentos | O 'AI Transfer' permite pedir transferências em linguagem natural, com a IA executando a transação. | [KakaoBank, 2025-11-24](https://www.asiae.co.kr/en/article/2025112409102248810) |
| KakaoBank | IA/GenAI | O serviço de IA conversacional da KakaoBank superou 1 milhão de usuários em 100 dias após o lançamento. | [KakaoBank, 2025-09-10](https://www.asiae.co.kr/en/article/2025091009202963838) |

**Evident AI Index 2026** ([Evident, 2026-10-06](https://evidentinsights.com/ai-index/)): 1º JPMorganChase, 2º Capital One, 3º Royal Bank of Canada, 4º CommBank, 5º Wells Fargo, 6º UBS, 7º Bank of America, 8º Citigroup, 9º Morgan Stanley, 10º TD Bank, 11º HSBC, 12º Goldman Sachs. Nenhum banco latino-americano no top 20. Na edição 2025, JPMorgan teve 79,0 e Capital One 78,1 pontos ([cobertura Teradata](https://www.teradata.com/insights/articles/which-banks-are-leading-in-ai)).

- Bancos divulgaram >1.100 casos de uso distintos de IA desde 2021; 12 de 50 bancos reportam retorno realizado ou projetado (ante 8). ([fonte](https://www.euronews.com/2026/10/07/ubs-only-european-bank-in-top-10-of-ai-adoption-as-jpmorgan-chase-leads))
- Apenas 12% dos casos de uso rastreados divulgam efeito em KPIs operacionais; capacidade de IA dos bancos avançou ~3x mais rápido que a média 2023–2025. ([fonte](https://letsdatascience.com/news/jpmorgan-leads-evidents-2026-ai-banking-index-f2be85d9))
- Exemplos de resultados citados: Morgan Stanley DevGen.AI liberou >1 mi de horas de desenvolvedores; UBS STAAT Insights ~1.200 h/semana; Lloyds ~£50 mi (2025). Evident planeja 5º pilar de 'outcomes' em 2027. ([fonte](https://www.euronews.com/2026/10/07/ubs-only-european-bank-in-top-10-of-ai-adoption-as-jpmorgan-chase-leads))

### 2.2 Reguladores e bancos centrais

| Quem | Fato | Fonte |
|---|---|---|
| BCB (Brasil) | Pix bateu recorde de 319,7 milhões de transações em um dia (06/11/2026), somando R$180,5 bilhões; o recorde anterior era 318,1 milhões em 04/09/2026. | [BCB (Brasil), 2026-11-09](https://www.jornaldocomercio.com/economia/2026/11/1269821-pix-atinge-novo-recorde-com-3197-milhoes-de-transacoes-em-um-unico-dia.html) |
| BCB (Brasil) | Em 2025 o Pix teve quase 80 bilhões de transações (+25,7%) e mais de R$35 trilhões (+33,8%); o Pix Automático entrou em operação em 16/06/2025 e o Pix por aproximação via Jornada sem Redirecionamento foi lançado em 2025. | [BCB (Brasil), 2026-08](https://www.bcb.gov.br/content/estabilidadefinanceira/pix/relatorio_de_gestao_pix/relatorio_gestao_pix_2026.pdf) |
| BCB (Brasil) | Pix iniciados via APIs do Open Finance cresceram mais de 8x em 2025, de 7,4 milhões em 2024 para 64,5 milhões. | [BCB (Brasil), 2026-08](https://www.bcb.gov.br/content/estabilidadefinanceira/pix/relatorio_de_gestao_pix/relatorio_gestao_pix_2026.pdf) |
| BCB (Brasil) | O Open Finance Brasil registrava 208,79 milhões de consentimentos ativos (31/07/2026), 129,78 milhões de PF com consentimento de transmissão e 7,14 bilhões de chamadas de API de dados abertos. | [BCB (Brasil), 2026-08-27](https://www.letsmoney.com.br/noticias/open-finance-208-milhoes-consentimentos-governanca/) |
| BCB (Brasil) | O MED 2.0 tornou-se obrigatório em 02/02/2026: rastreia recursos por contas intermediárias, permite contestação pelo app sem contato humano e bloqueio por até 11 dias; base na Resolução BCB 493/2025. | [BCB (Brasil), 2026-02-02](https://agenciabrasil.ebc.com.br/economia/noticia/2026-02/novas-regras-de-seguranca-do-pix-entram-em-vigor-veja-mudancas) |
| BCB (Brasil) | CMN e BC publicaram em dez/2025 a Resolução CMN 5.274 e a Resolução BCB 538, endurecendo requisitos de segurança cibernética, contratação de nuvem e conexão à RSFN (Pix/STR), com adequação até 01/03/2026. | [BCB (Brasil), 2025-12](https://www.machadomeyer.com.br/pt/inteligencia-juridica/publicacoes-ij/direito-digital/bcb-novas-regras-para-aumentar-a-ciberseguranca-do-sfn-e-do-spb) |
| BCB (Brasil) | O BC comunicou o desligamento da plataforma de testes do Drex baseada em Hyperledger Besu/EVM, considerada inadequada em privacidade/segurança e custo. | [BCB (Brasil), 2025-11-04](https://forbes.com.br/escolhas-do-editor/2025/11/banco-central-abandona-o-blockchain-do-drex-o-projeto-do-real-digital/) |
| BCB (Brasil) | Em ago/2025 o BC anunciou que a próxima fase do Drex não usaria DLT, com primeira entrega prevista para 2026 focada em reconciliação de gravames para garantia de crédito. | [BCB (Brasil), 2025-08](https://exame.com/future-of-money/drex-reduz-uso-de-tecnologia-blockchain-e-pode-ter-lancamento-em-2026) ‡ |
| MAS (Singapura) | MAS consultou Diretrizes de Gestão de Risco de IA para todas as instituições financeiras, cobrindo GenAI e agentes de IA, com inventário de IA e avaliação de materialidade. | [MAS (Singapura), 2025-11-13](https://www.mas.gov.sg/news/media-releases/2025/mas-guidelines-for-artificial-intelligence-risk-management) |
| MAS (Singapura) | As diretrizes finais de risco de IA do MAS foram publicadas com resposta à consulta, com implementação faseada (seções 3–4 a partir de out/2027). | [MAS (Singapura), 2026-10-07](https://www.mas.gov.sg/-/media/mas-media-library/publications/consultations/bd/2025/response-to-feedback-received-on-guidelines-on-artificial-intelligence-risk-management.pdf) ‡ |
| MAS (Singapura) | MAS lançou o BLOOM para liquidação com passivos bancários tokenizados e stablecoins reguladas, e concluiu com DBS, OCBC e UOB o primeiro teste ao vivo de wCBDC em SGD para empréstimos interbancários overnight. | [MAS (Singapura), 2025-11-13](https://www.mas.gov.sg/publications/annual-report/2026/annual-report-2025-2026/innovative-and-inclusive-financial-centre/digital-assets-and-asset-tokenisation) |
| RBA (Austrália) | RBA e DFCRC publicaram o relatório final do Project Acacia (20 casos de uso de ativos tokenizados no atacado com ESA, wCBDC piloto, depósitos tokenizados e stablecoins), concluindo que moeda de banco central segue fundacional. | [RBA (Austrália), 2026-05-18](https://www.rba.gov.au/media-releases/2026/mr-26-13.html) |
| ACCC/NASC (Austrália) | Australianos perderam A$2,18 bilhões com golpes em 2025 (+7,8% a/a), com investimentos fraudulentos somando A$837,7 milhões. | [ACCC/NASC (Austrália), 2026-03-30](https://www.cyberdaily.au/security/13400-scams-cost-australians-over-2bn-in-2025-says-accc) |
| Treasury (Austrália) | O CDR tinha cerca de 226 mil consumidores e mais de 300 mil arranjos de compartilhamento ativos em meados de out/2025, com adoção ainda lenta. | [Treasury (Austrália), 2025-10](https://treasury.gov.au/sites/default/files/2025-10/p2025-706894-kelly.pdf) ‡ |
| AP+ (Austrália) | A NPP processou quase 2 bilhões de pagamentos em tempo real em 2025, com volume crescendo ~15% a/a e valor ~22%. | [AP+ (Austrália), 2025-11](https://www.auspayplus.com.au/?p=8213) ‡ |
| NPCI/RBI (Índia) | O UPI processou recorde de 25,47 bilhões de transações em out/2026, no valor de ₹31,53 lakh crore, +23% a/a em volume. | [NPCI/RBI (Índia), 2026-11](https://inc42.com/buzz/upi-transactions-rise-5-8-mom-to-record-25-47-bn-in-october/) |
| RBI/Sahamati (Índia) | O ecossistema Account Aggregator superou 500 milhões de consentimentos atendidos, 2,8 bilhões de contas habilitadas e ₹3,82 lakh crore em crédito no FY26; RBI reconheceu a Sahamati como SRO em jun/2026. | [RBI/Sahamati (Índia), 2026-09-02](https://sahamati.org.in/?p=1274421) |
| RBI (Índia) | O RBI publicou o relatório do comitê FREE-AI com 7 'Sutras', 6 pilares e 26 recomendações para IA responsável no setor financeiro. | [RBI (Índia), 2025-08-13](https://website.rbi.org.in/documents/d/rbi/rbi-free-ai-committee-report_13082025) |
| PBoC (China) | A partir de 01/01/2026 bancos podem pagar juros sobre saldos de e-CNY em carteiras verificadas (de 'dinheiro digital' para 'depósito digital'); até nov/2025 o e-CNY somava 3,48 bilhões de transações e RMB 16,7 trilhões. | [PBoC (China), 2025-12-29](https://www.theblock.co/news/regulation/2025-12-29-china-interest-digital-yuan-383824) |
| contexto regulatório | Regra 1033 da CFPB (open banking EUA): prazo inicial de 01/04/2026 para bancos >US$250 bi suspenso por liminar judicial e regra em reconsideração pela CFPB. | [contexto regulatório, 2026-04-09](https://www.cozen.com/news-resources/publications/2026/section-1033-compliance-date-open-banking-rule-enjoined-and-under-reconsideration) |
| contexto regulatório | PSD3/PSR: acordo político Parlamento–Conselho em 27/11/2025 (barreiras a open banking, verificação nome–IBAN contra fraude); publicação esperada em 2026 e vigência em 2027. Status do FIDA não confirmado nesta pesquisa. | [contexto regulatório, 2026-03](https://www.dlapiper.com/en/insights/publications/2026/03/psd3-and-psr) |
| contexto regulatório | Grandes bancos dos EUA (JPM, BofA, Citi, Wells; Santander participa) planejam rede compartilhada de depósitos tokenizados operada pela The Clearing House, ligada a RTP/CHIPS, para o 1S27. | [contexto regulatório, 2026-06-05](https://thepaypers.com/fintech/news/major-us-banks-plan-tokenised-deposit-network-for-2027) |

### 2.3 Sinais de pesquisa e de código (OpenAlex, arXiv, GitHub)

Coleta em 2026-11-28. OpenAlex: obras com o termo no título ou resumo, por ano de publicação. arXiv: o mesmo filtro restrito à fonte arXiv no OpenAlex (a API do arXiv recusou as consultas por limite de taxa). GitHub: repositórios públicos criados no ano, até 27/11.

**Cuidado com 2026.** O total de obras no OpenAlex saltou de 14,5 mi (2025) para 19,2 mi (2026 até nov.), e os repositórios novos no GitHub de 52,2 mi para 89,9 mi no mesmo período. Por isso todo crescimento abaixo é **normalizado** pela base (participação por milhão). Crescimento bruto engana.

| Tema | OpenAlex 2022 | 2025 | 2026 (parcial) | Cresc. norm. 2025/2022 | Cresc. norm. 2026/2025 | arXiv 2025 | GitHub novos 2026 | GitHub norm. 2026/2025 | Repositório mais estrelado e ativo na busca (não curado) |
|---|---|---|---|---|---|---|---|---|---|
| Modelos fundacionais tabulares/temporais | 1 | 326 | 1485 | 221,36 | 3,44 | 87 | 311 | 4,51 | [PriorLabs/TabPFN](https://github.com/PriorLabs/TabPFN) |
| IA generativa/LLM em bancos | 12 | 1126 | 2738 | 63,71 | 1,84 | 133 | 779 | 3,83 | [python279/stock-predict](https://github.com/python279/stock-predict) |
| Segurança de soluções de IA (prompt injection, red teaming) | 31 | 1578 | 5262 | 34,56 | 2,52 | 762 | 12226 | 7,58 | [NVIDIA/SkillSpector](https://github.com/NVIDIA/SkillSpector) |
| IA no ciclo de software (SDLC) | 90 | 1062 | 1850 | 8,01 | 1,32 | 217 | 81395 | 7,58 | [obra/superpowers](https://github.com/obra/superpowers) |
| Energia/infra para datacenters de IA | 98 | 1148 | 2879 | 7,95 | 1,89 | 74 | 98 | 2,28 | [mohammadrezwankhan/datacenter-twin-lab](https://github.com/mohammadrezwankhan/datacenter-twin-lab) |
| Agentes de IA em finanças | 104 | 1094 | 3822 | 7,14 | 2,64 | 194 | 5135 | 3,2 | [TauricResearch/TradingAgents](https://github.com/TauricResearch/TradingAgents) |
| Modelos fundacionais de transações | 7 | 65 | 99 | 6,31 | 1,15 | 10 | 23 | 2,67 | [NVIDIA-AI-Blueprints/transaction-foundation-model](https://github.com/NVIDIA-AI-Blueprints/transaction-foundation-model) |
| Deepfake/voz sintética em fraude e KYC * | 78 | 679 | 1275 | 5,91 | 1,42 | 29 | 8398 | 1,13 | [flyingby/Awesome-Deepfake-Generation-and-Detection](https://github.com/flyingby/Awesome-Deepfake-Generation-and-Detection) |
| Aprendizado federado/privacy ML em finanças | 153 | 1306 | 1532 | 5,8 | 0,89 | 74 | 149 | 1,8 | [RahulAutade2288/fraud-detection-federated](https://github.com/RahulAutade2288/fraud-detection-federated) |
| Risco climático em crédito/agro | 15 | 114 | 196 | 5,16 | 1,3 | 1 | 2301 | 2,13 | [CLIMADA-project/climada_python](https://github.com/CLIMADA-project/climada_python) |
| Computação quântica em finanças | 145 | 1059 | 1113 | 4,96 | 0,79 | 89 | 272 | 1,12 | [qiskit-community/qiskit-finance](https://github.com/qiskit-community/qiskit-finance) |
| Governança de IA e risco de modelo | 58 | 420 | 1335 | 4,92 | 2,4 | 7 | 1009 | 1,03 | [skfolio/skfolio](https://github.com/skfolio/skfolio) |
| Pagamentos/comércio agêntico | 5 | 36 | 421 | 4,89 | 8,84 | 3 | 601 | 5,29 | [alsk1992/CloddsBot](https://github.com/alsk1992/CloddsBot) |
| Tokenização (RWA, depósitos tokenizados) | 40 | 287 | 675 | 4,87 | 1,78 | 11 | 413 | 1,74 | [Kronova-Intelligent-Systems/asset-intel-orchestration-engine](https://github.com/Kronova-Intelligent-Systems/asset-intel-orchestration-engine) |
| GNN para fraude/AML | 71 | 504 | 782 | 4,82 | 1,17 | 38 | 283 | 2,35 | [waittim/graph-fraud-detection](https://github.com/waittim/graph-fraud-detection) |
| Edge AI/on-device em finanças | 96 | 637 | 700 | 4,51 | 0,83 | 10 | 2449 | 5,64 | [Zackriya-Solutions/meetily](https://github.com/Zackriya-Solutions/meetily) |
| Embedded finance/BaaS | 40 | 241 | 406 | 4,09 | 1,27 | 1 | 301 | 1,47 | — |
| Gêmeos digitais em finanças | 101 | 584 | 1124 | 3,93 | 1,45 | 6 | 28 | 16,26 | — |
| Computação que preserva privacidade (HE, MPC, TEE) | 138 | 672 | 900 | 3,31 | 1,01 | 40 | 695 | 0,62 | [microsoft/SEAL](https://github.com/microsoft/SEAL) |
| Dados sintéticos em finanças | 114 | 539 | 806 | 3,21 | 1,13 | 63 | 310 | 3,6 | [rapiddweller/datamimic](https://github.com/rapiddweller/datamimic) |
| IA na operação de TI (AIOps) | 93 | 409 | 955 | 2,99 | 1,76 | 58 | 5391 | 3,62 | [ccfos/nightingale](https://github.com/ccfos/nightingale) |
| Qualidade e governança de dados (BCBS 239, data mesh) * | 147 | 643 | 1105 | 2,97 | 1,3 | 4 | 1258 | 1,58 | [marcomusy/vedo](https://github.com/marcomusy/vedo) |
| Criptografia pós-quântica | 864 | 3710 | 7098 | 2,92 | 1,45 | 223 | 2587 | 2,66 | [authelia/authelia](https://github.com/authelia/authelia) |
| IA defensiva em SOC | 393 | 1545 | 3243 | 2,67 | 1,59 | 138 | 1829 | 3,13 | [beenuar/AiSOC](https://github.com/beenuar/AiSOC) |
| Causal ML/uplift em decisões de crédito e cobrança | 30 | 118 | 241 | 2,67 | 1,54 | 11 | 810 | 3,62 | [uber/causalml](https://github.com/uber/causalml) |
| AML com machine learning | 254 | 985 | 1041 | 2,63 | 0,8 | 30 | 744 | 1,94 | — |
| Modernização de core/mainframe (incl. COBOL com LLM) | 55 | 199 | 346 | 2,46 | 1,31 | 25 | 241 | 2,54 | [Azure-Samples/Legacy-Modernization-Agents](https://github.com/Azure-Samples/Legacy-Modernization-Agents) |
| Stablecoins | 261 | 852 | 1809 | 2,22 | 1,6 | 24 | 4431 | 1,42 | [remix-project-org/remix-project](https://github.com/remix-project-org/remix-project) |
| Pagamentos instantâneos (Pix, UPI, FedNow) * | 623 | 1951 | 3915 | 2,13 | 1,52 | 16 | 386 | 2,38 | [codespar/mcp-dev-latam](https://github.com/codespar/mcp-dev-latam) |
| Golpes APP, contas-mula e engenharia social * | 118 | 338 | 656 | 1,94 | 1,47 | 10 | 4088 | 3,99 | — |
| CBDC e moedas digitais | 569 | 1530 | 1923 | 1,83 | 0,95 | 18 | 323 | 1,31 | [xlnfinance/xln](https://github.com/xlnfinance/xln) |
| Biometria comportamental | 329 | 801 | 932 | 1,65 | 0,88 | 26 | 397 | 2,02 | — |
| Smart contracts | 3640 | 8797 | 8956 | 1,64 | 0,77 | 333 | 1888 | 1,02 | [OpenZeppelin/openzeppelin-contracts](https://github.com/OpenZeppelin/openzeppelin-contracts) |
| Open banking/Open Finance | 227 | 502 | 761 | 1,5 | 1,15 | 8 | 262 | 2,34 | [OpenBankProject/OBP-API](https://github.com/OpenBankProject/OBP-API) |
| Seguros paramétricos | 133 | 280 | 410 | 1,43 | 1,11 | 7 | 808 | 4,47 | — |
| DeFi e dApps * | 5441 | 10780 | 9527 | 1,35 | 0,67 | 117 | 24479 | 1,05 | [DefinitelyTyped/DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) |
| IA explicável e justa em crédito | 989 | 1954 | 3095 | 1,34 | 1,2 | 59 | 701 | 3,04 | — |
| Spatial computing/imersivo em bancos * | 119 | 211 | 179 | 1,2 | 0,64 | 2 | 0 | 0,0 | — |
| Grafos de conhecimento/ontologias em finanças | 121 | 191 | 435 | 1,07 | 1,72 | 3 | 56 | 1,91 | — |

\* Busca com ruído: DeFi e dApps: a busca 'DeFi' no OpenAlex e 'defi' no GitHub pegam palavras não relacionadas (ex.: DefinitelyTyped); Pagamentos instantâneos (Pix, UPI, FedNow): siglas 'Pix' e 'UPI' colidem com outros sentidos; Qualidade e governança de dados (BCBS 239, data mesh): no GitHub, 'data mesh' traz projetos de malha 3D; Deepfake/voz sintética em fraude e KYC: no GitHub a busca é geral, não só finanças; Golpes APP, contas-mula e engenharia social: no GitHub a busca 'scam detection' é geral; Spatial computing/imersivo em bancos: volume pequeno. As buscas exatas estão no JSON (`sinais_pesquisa.temas`).

Leitura: os temas que mais ganham espaço relativo na pesquisa desde 2022 são Modelos fundacionais tabulares/temporais, IA generativa/LLM em bancos, Segurança de soluções de IA (prompt injection, red teaming), IA no ciclo de software (SDLC), Energia/infra para datacenters de IA, Agentes de IA em finanças, Modelos fundacionais de transações, Deepfake/voz sintética em fraude e KYC. Em 2026, o que mais acelera (normalizado sobre 2025) é pagamentos agênticos (8,84x), seguido de modelos fundacionais tabulares, agentes em finanças e segurança de IA. Perdem espaço relativo em 2026: computação quântica em finanças (0,79x), CBDC (0,95x), smart contracts e DeFi.

Quem publica: Índia lidera em volume de artigos sobre IA em bancos (2024–2026) e EUA em artigos citados; entre bancos, o Ant Group tem 2.437 obras no OpenAlex, contra 667 do JPMorgan ([Hangzhou, 2026-11-28](https://api.openalex.org/works?filter=institutions.id:I4405270328,publication_year:2024-2026)).

### 2.4 Hubs de inovação: quem lidera o quê

| Hub | Tipo | Lidera em | Evidência |
|---|---|---|---|
| Hong Kong | city | ranking GFCI de fintech (1º); dinheiro tokenizado e depósitos tokenizados (Ensemble); sandbox de IA generativa/agêntica; sede do centro BIS com mais projetos | Hong Kong é o 1º centro no ranking de FinTech do GFCI 39, com nota 767. ([fonte, 2026-03-26](https://www.longfinance.net/documents/4325/GFCI_39_Report_2026.03.26_v1.1.pdf)) |
| Shenzhen | city | fintech (2º-3º no GFCI); bancos digitais e IA (WeBank/Tencent) | Shenzhen é o 2º centro no ranking de FinTech do GFCI 39 (nota 757). ([fonte, 2026-03-26](https://www.longfinance.net/documents/4325/GFCI_39_Report_2026.03.26_v1.1.pdf)) |
| New York | city | centro financeiro nº 1 do GFCI; fintech de mercados de capitais e bancos líderes em IA (JPMorgan, Goldman, Morgan Stanley); inovação de banco central (NY Innovation Center do Fed) | Nova York é o 1º centro financeiro geral do GFCI 39 e o 3º em FinTech. ([fonte, 2026-03-26](https://www.longfinance.net/documents/4325/GFCI_39_Report_2026.03.26_v1.1.pdf)) |
| London | city | regulação pró-inovação (sandboxes de IA da FCA); maior polo de investimento fintech da Europa; dados sintéticos/AML | O Reino Unido recebeu US$ 10,96 bi de investimento em fintech em 2025, o maior volume da região EMEA. ([fonte, 2026-02-11](https://kpmg.com/xx/en/media/press-releases/2026/02/global-fintech-investment-rebounds-in-2025-supported-by-stronger-exit-activity.html)) |
| Singapore | city | regulação/sandboxes (MAS); tokenização (Project Guardian); gestão de risco de IA (MindForge); pagamentos transfronteiriços (Nexus) | Singapura é o 4º centro em FinTech nos GFCI 39 e GFCI 40. ([fonte, 2026-03-26](https://www.longfinance.net/documents/4325/GFCI_39_Report_2026.03.26_v1.1.pdf)) |
| San Francisco / Bay Area | city | fintech e IA aplicada (ecossistema de startups) | San Francisco é o 7º centro em FinTech no GFCI 39 (era 6º no GFCI 38) e 5º no índice geral. ([fonte, 2026-03-26](https://www.longfinance.net/documents/4325/GFCI_39_Report_2026.03.26_v1.1.pdf)) |
| Shanghai | city | fintech (top 6 GFCI); finanças digitais da China continental | Xangai subiu para 6º no ranking de FinTech do GFCI 39 e para 6º no índice geral. ([fonte, 2026-03-26](https://www.longfinance.net/documents/4325/GFCI_39_Report_2026.03.26_v1.1.pdf)) |
| Hangzhou | city | IA aplicada a crédito/pagamentos (Ant Group/Alipay); modelos de linguagem abertos (Ling); ecossistema de IA | Hangzhou é 47º em FinTech no GFCI 39 (subiu 5 posições). ([fonte, 2026-03-26](https://www.longfinance.net/documents/4325/GFCI_39_Report_2026.03.26_v1.1.pdf)) |
| Beijing | city | regtech/suptech e fintech da China continental | Pequim lidera o ranking Global FinTech Hub publicado pelo instituto FIRST de Pequim em 2025. ([fonte, 2025-10-29](https://english.beijing.gov.cn/latest/news/202511/t20251103_4251608.html)) |
| Tel Aviv / Israel | country | antifraude e risk-tech; cibersegurança aplicada a finanças; trading e investimentos | Em 2024 as fintechs israelenses captaram US$ 1,1 bi em 81 negócios, e fintech foi a 2ª maior categoria de tech em Israel (12% do capital), atrás de cibersegurança (39%). ([fonte, 2025-01](https://viola-group.com/wp-content/uploads/2025/02/Israeli-Fintech-2025_07.pdf)) |
| Bangalore / Mumbai (Índia) | country | infraestrutura pública digital de pagamentos (UPI); centros de capacidade global (GCC) de bancos; crédito digital (ULI) | A UPI processou o recorde de 25,47 bi de transações (₹31,53 lakh crore) em outubro de 2026, alta de 23% a/a em volume. ([fonte, 2026-11](https://inc42.com/buzz/upi-transactions-rise-5-8-mom-to-record-25-47-bn-in-october/)) |
| São Paulo / Brasil | country | pagamentos instantâneos (Pix); bancos digitais (Nubank); open finance | O Pix registrou 76 bi de transações em 2026 até outubro (+17,6% a/a) e é usado por 154 milhões de pessoas, 89% da população adulta. ([fonte, 2026-11-16](https://agenciagov.ebc.com.br/noticias/202611/pix-celebra-6-anos-como-motor-de-inclusao-e-eficiencia-financeira-em-todo-o-brasil)) |
| Zurich | city | tokenização e infraestrutura de mercado (BIS Swiss Centre); IA em banco (UBS) | Zurique é 20º em FinTech e 11º no índice geral do GFCI 39. ([fonte, 2026-03-26](https://www.longfinance.net/documents/4325/GFCI_39_Report_2026.03.26_v1.1.pdf)) |
| Amsterdam | city | pagamentos (adquirência/processamento) | Amsterdã subiu 7 posições, para 32º, no ranking de FinTech do GFCI 39, e para 20º no índice geral. ([fonte, 2026-03-26](https://www.longfinance.net/documents/4325/GFCI_39_Report_2026.03.26_v1.1.pdf)) |
| Paris | city | CBDC de atacado e tokenização (Eurosystem/Banque de France); IA em supervisão | Paris é 21º em FinTech no GFCI 39. ([fonte, 2026-03-26](https://www.longfinance.net/documents/4325/GFCI_39_Report_2026.03.26_v1.1.pdf)) |
| Frankfurt | city | liquidação DLT em dinheiro de banco central (Pontes); criptografia pós-quântica em pagamentos (Leap) | Frankfurt é 39º em FinTech no GFCI 39. ([fonte, 2026-03-26](https://www.longfinance.net/documents/4325/GFCI_39_Report_2026.03.26_v1.1.pdf)) |
| Dubai | city | fintech no Oriente Médio; potencial futuro (GFCI) | Dubai é 9º em FinTech e 7º no índice geral do GFCI 39. ([fonte, 2026-03-26](https://www.longfinance.net/documents/4325/GFCI_39_Report_2026.03.26_v1.1.pdf)) |
| Abu Dhabi | city | fintech e ativos digitais (ADGM); open finance transfronteiriço (Banco Central dos EAU) | Abu Dhabi subiu 5 posições, para 18º, no ranking de FinTech do GFCI 39. ([fonte, 2026-03-26](https://www.longfinance.net/documents/4325/GFCI_39_Report_2026.03.26_v1.1.pdf)) |
| Toronto | city | IA em bancos (RBC, TD); IA para supervisão (BIS Toronto) | O RBC é 3º e o TD está no top 10 do Evident AI Index 2026, que tem dois bancos canadenses entre os 10 primeiros. ([fonte, 2026-10-07](https://www.euronews.com/2026/10/07/ubs-only-european-bank-in-top-10-of-ai-adoption-as-jpmorgan-chase-leads)) |
| Sydney | city | IA em bancos (Commonwealth Bank) | O Commonwealth Bank of Australia é o 4º no Evident AI Index 2026, o mais bem colocado fora da América do Norte. ([fonte, 2026-10-07](https://www.euronews.com/2026/10/07/ubs-only-european-bank-in-top-10-of-ai-adoption-as-jpmorgan-chase-leads)) |
| Vilnius / Lituânia | country | licenciamento de instituições de pagamento e moeda eletrônica na UE; pagamentos | A Lituânia tinha 248 fintechs ativas no fim de 2025 (231 em Vilnius), com cerca de 7,8 mil empregados. ([fonte, 2025-12](https://investlithuania.com/fintech-overview-2026/)) |
| Nairobi / Quênia | country | dinheiro móvel (M-Pesa); crédito por celular | O M-Pesa movimentou KES 41,68 trilhões (+8,9%) em 46,4 bi de transações (+25,1%) no ano fiscal encerrado em março de 2026. ([fonte, 2026-05-07](https://tech-ish.com/2026/05/07/safaricom-fy26-mpesa-results-explained/)) |
| Jakarta / Indonésia | country | pagamentos instantâneos transfronteiriços (Nexus) | Jacarta é 72º no ranking de FinTech do GFCI 39. ([fonte, 2026-03-26](https://www.longfinance.net/documents/4325/GFCI_39_Report_2026.03.26_v1.1.pdf)) |
| Stockholm / Nórdicos | city | cibersegurança e IA em infraestruturas de mercado (BIS Nordic); AML com tecnologias de privacidade | Estocolmo subiu 9 posições, para 17º, no ranking de FinTech do GFCI 39. ([fonte, 2026-03-26](https://www.longfinance.net/documents/4325/GFCI_39_Report_2026.03.26_v1.1.pdf)) |
| BIS Innovation Hub (visão geral) | bis_centre | CBDC de atacado; tokenização; IA para supervisão; cibersegurança/quântico; finanças verdes | O BIS lista 50 projetos do Innovation Hub: 23 em andamento, 22 concluídos e 5 encerrados. ([fonte, 2026-11](https://www.bis.org/about/bisih/projects.htm?m=268)) |
| BIS Innovation Hub – Swiss Centre (Basileia/Zurique) | bis_centre | tokenização; IA em analytics; política monetária programável | O Projeto Agorá (Eurosystem, Londres, Suíço e Toronto) reúne 8 bancos centrais e mais de 40 instituições via IIF; nos testes com valor real de julho de 2026, o tempo médio até a liquidação foi de cerca de 80 segundos. ([fonte, 2026-05-27](https://www.bis.org/project/agora)) |
| BIS Innovation Hub – Hong Kong Centre | bis_centre | open finance transfronteiriço; finanças verdes com IA; risco climático | O Projeto Aperta interligou sistemas de open finance de 5 economias (Reino Unido, EAU, Brasil, Hong Kong e Índia) com uma camada neutra de interoperabilidade; o BCB foi parceiro. ([fonte, 2026-05-29](https://www.bis.org/project/aperta)) |
| BIS Innovation Hub – Singapore Centre | bis_centre | pagamentos transfronteiriços; compliance-by-design; FX tokenizado | O Projeto Nexus foi concluído e entregue à Nexus Global Payments, criada em 2025 pelos bancos centrais de Índia, Indonésia, Malásia, Filipinas, Singapura e Tailândia. ([fonte, 2025](https://www.bis.org/project/nexus)) |
| BIS Innovation Hub – London Centre | bis_centre | AML com analytics de pagamentos; agentes LLM e risco de mercado | O Projeto Hertha mostrou que analytics de sistemas de pagamento ajudam bancos a achar 12% mais contas ilícitas, e 26% mais em comportamentos inéditos. ([fonte, 2025-06-05](https://www.bis.org/project/hertha)) |
| BIS Innovation Hub – Nordic Centre (Estocolmo) | bis_centre | AML com IA e tecnologias de privacidade; cibersegurança; CBDC offline | O Projeto Aurora encontrou até 3 vezes mais lavagem de dinheiro e até 80% menos falsos positivos com IA e análise de rede colaborativa, frente a regras isoladas. ([fonte, 2025-07-07](https://www.bis.org/project/aurora)) |
| BIS Innovation Hub – Eurosystem Centre (Frankfurt/Paris) | bis_centre | criptografia pós-quântica; IA generativa para estatística e clima | A fase 2 do Projeto Leap confirmou ser viável migrar um sistema de pagamento operacional para criptografia pós-quântica, mas com aumento relevante do tempo de processamento. ([fonte, 2025-12-11](https://www.bis.org/project/leap)) |
| BIS Innovation Hub – Toronto Innovation Centre | bis_centre | IA para supervisão (suptech) | O Projeto AISE testa arquiteturas de IA para supervisão de pagamentos de varejo e um assistente virtual para supervisores, com rastreabilidade de evidências. ([fonte, 2026-04-15](https://www.bis.org/project/aise)) |
| FCA (Reino Unido) – AI Lab | regulator_unit | sandboxes de IA (Supercharged Sandbox, AI Live Testing); dados sintéticos para AML | O Supercharged Sandbox teve 132 candidatos e 22 selecionados na coorte 1 (set/2025–jan/2026) e 199 candidatos e 21 selecionados na coorte 2 (jul–dez/2026), com apoio de NVIDIA, NayaOne e Anthropic. ([fonte, 2026-07-13](https://www.fca.org.uk/firms/innovation/supercharged-sandbox)) |
| MAS (Singapura) | regulator_unit | tokenização (Project Guardian); gestão de risco de IA (MindForge/BuildFin.ai) | O consórcio MindForge, com 24 bancos, seguradoras e outras empresas, publicou um kit de gestão de risco de IA que cobre IA tradicional, generativa e agêntica. ([fonte, 2026-03-20](https://www.mas.gov.sg/news/media-releases/2026/mas-partners-industry-to-develop-ai-risk-management-toolkit-for-the-financial-sector)) |
| HKMA (Hong Kong) | regulator_unit | depósitos tokenizados 24/7 (Ensemble); sandbox de IA agêntica | A 1ª coorte do GenA.I. Sandbox++ (HKMA, SFC, IA e MPFA) selecionou 36 casos de uso de quase 100 propostas, com 30 instituições financeiras e 27 parceiros de tecnologia, com foco em IA agêntica. ([fonte, 2026-08-27](https://www.hkma.gov.hk/eng/news-and-media/press-releases/2026/08/20260827-3/)) |
| Banco Central do Brasil (LIFT, Pix, Drex) | regulator_unit | pagamentos instantâneos (Pix); laboratório de inovação com o mercado (LIFT); tokenização (Drex) | O LIFT, laboratório do BCB com a Fenasbac, abriu o ciclo LIFT Lab 2026 no LIFT Day, com temas como dados climáticos e ativos reais tokenizados. ([fonte, 2026-03](https://luma.com/LIFTDay-2026)) |
| RBI / Reserve Bank Innovation Hub (Índia) | regulator_unit | crédito digital (ULI); pagamentos (UPI, via NPCI) | A Unified Lending Interface tinha 64 credores (41 bancos e 23 NBFCs) usando mais de 136 serviços de dados em 12 jornadas de crédito, segundo o relatório Trend and Progress do RBI. ([fonte, 2025-12-30](https://www.insightsonindia.com/2025/12/30/trend-and-progress-of-banking-in-india-2024-25-report/)) |
| Federal Reserve / OCC (EUA) | regulator_unit | supervisão de cripto/fintech integrada à rotina | O Fed encerrou o programa de supervisão de atividades novas (cripto e fintech) e devolveu essa supervisão ao processo normal. ([fonte, 2025-08-15](https://www.federalreserve.gov/newsevents/pressreleases/bcreg20250815a.htm)) |
| BCE / Eurosistema (euro digital, Pontes, Appia) | regulator_unit | liquidação DLT em dinheiro de banco central; CBDC de varejo | O Pontes entrou em operação em 21/09/2026, com implementação completa prevista até 2028; o Appia, ecossistema DLT de longo prazo, deve ter blueprint até 2028. ([fonte, 2026-09-21](https://ecb.europa.eu/press/pr/date/2026/html/ecb.pr260921~e754847a7b.en.html)) |
| EBA (UE) | regulator_unit | IA em crédito sob o AI Act; fórum de facilitadores de inovação (EFIF) | O mapeamento da EBA não encontrou contradições significativas entre o AI Act e a legislação bancária e de pagamentos da UE; IA para score de crédito de pessoas físicas é de alto risco. ([fonte, 2025-11-21](https://www.eba.europa.eu/sites/default/files/2025-11/d8b999ce-a1d9-4964-9606-971bbc2aaf89/AI Act implications for the EU banking sector.pdf)) |
| JPMorgan Chase – AI Research e Global Technology Applied Research | bank_lab | IA em banco (nº 1 Evident); computação quântica (aleatoriedade certificada) | O JPMorgan Chase lidera o Evident AI Index pelo 5º ano seguido (edição 2026, 50 bancos). ([fonte, 2026-10-07](https://www.euronews.com/2026/10/07/ubs-only-european-bank-in-top-10-of-ai-adoption-as-jpmorgan-chase-leads)) |
| Capital One – AI research | bank_lab | IA em banco (nº 2 Evident); pagamentos B2B com IA agêntica (Brex) | O Capital One é o 2º no Evident AI Index 2026. ([fonte, 2026-10-07](https://www.euronews.com/2026/10/07/ubs-only-european-bank-in-top-10-of-ai-adoption-as-jpmorgan-chase-leads)) |
| BBVA (AI Factory / IA generativa) | bank_lab | IA generativa em escala para funcionários | O BBVA vai estender o ChatGPT Enterprise a todos os seus 120 mil funcionários em 25 países, 10 vezes a base anterior de 11 mil. ([fonte, 2025-12-12](https://openai.com/index/bbva-collaboration-expansion/)) |
| HSBC (quântico) | bank_lab | computação quântica aplicada a trading | O HSBC e a IBM relataram melhora de até 34% na previsão de execução de ordens no mercado europeu de bonds corporativos com computação quântica híbrida. ([fonte, 2025-09-25](https://www.hsbc.com/news-and-views/news/media-releases/2025/hsbc-demonstrates-worlds-first-known-quantum-enabled-algorithmic-trading-with-ibm)) |
| DBS (Singapura) | bank_lab | IA em produção com valor econômico medido | O DBS gerou cerca de S$ 1 bi de valor econômico com analytics e IA/ML em 2025, com mais de 2.000 modelos e 430 casos de uso. ([fonte, 2026-02](https://www.dbs.com/annualreports/2025/ceo-reflections.html)) |
| Itaú Unibanco – ICTi (Instituto de Ciência e Tecnologia Itaú) | bank_lab | pesquisa aplicada em IA e computação quântica | O ICTi recebeu cerca de R$ 100 mi do Itaú em 2025, tem cerca de 70 pesquisas em 5 temas (IA, computação quântica, robótica, neurociência e realidade estendida) e parcerias com 11 universidades brasileiras. ([fonte, 2026-05-12](https://neofeed.com.br/inovacao/instituto-de-ciencia-e-tecnologia-entra-na-rota-global-e-carimba-o-passaporte-da-inovacao-no-itau/)) |
| Nubank – AI Core / pesquisa | bank_lab | modelos fundacionais sobre transações | O Nubank publicou o nuFormer, modelo transformer autossupervisionado sobre sequências de transações, com ganhos em recomendação em larga escala. ([fonte, 2025-07-31](https://arxiv.org/abs/2507.23267)) |
| Ant Group – pesquisa (inclusionAI) | bank_lab | LLMs abertos; IA para pagamentos e crédito | O Ant Group abriu o Ling-1T, modelo de 1 trilhão de parâmetros (cerca de 50 bi ativos por token) sob licença MIT. ([fonte, 2025-10](https://huggingface.co/inclusionAI/Ling-1T)) |
| WeBank (Shenzhen) | bank_lab | aprendizado federado (FATE) | O framework de aprendizado federado FATE, criado pelo WeBank, passou a ser hospedado pela Linux Foundation e inclui o módulo FATE-LLM. ([fonte, 2019-06-25](https://www.linuxfoundation.org/press/press-release/the-linux-foundation-will-host-the-federated-ai-enabler-to-responsibly-advance-data-modeling)) |
| Goldman Sachs | bank_lab | assistente de IA generativa para toda a firma | O Goldman Sachs lançou o GS AI Assistant para cerca de 10 mil funcionários, com meta de cobrir todos os trabalhadores do conhecimento em 2025. ([fonte, 2025-01-21](https://www.nbcnews.com/business/business-news/goldman-sachs-launches-ai-assistant-employees-artificial-intelligence-rcna188643)) |
| Morgan Stanley | bank_lab | IA para modernização de código legado | A ferramenta interna DevGen.AI revisou cerca de 9 milhões de linhas de código legado e poupou cerca de 280 mil horas de 15 mil desenvolvedores. ([fonte, 2025-06-03](https://www.entrepreneur.com/business-news/morgan-stanley-builds-ai-tool-that-fixes-major-coding-issue/492697)) |
| Wells Fargo | bank_lab | IA agêntica para funcionários | Mais de 2.000 funcionários do Wells Fargo usavam o Google Agentspace, com plano de expansão a todas as equipes. ([fonte, 2025-08-05](https://finance.yahoo.com/news/wells-fargo-taps-google-cloud-154248721.html)) |
| Santander | bank_lab | testes de IA em produção sob supervisão | O Santander participou da 1ª coorte do AI Live Testing da FCA. ([fonte, 2026-04-21](https://www.fca.org.uk/news/press-releases/fca-announces-second-cohort-ai-live-testing)) |
| FINOS (Fintech Open Source Foundation / Linux Foundation) | consortium | padrões abertos de governança de IA e nuvem para bancos | A FINOS lançou o Common Controls for AI Services com BMO, Citi, Morgan Stanley, RBC e Bank of America, além de Microsoft, Google Cloud, AWS e Red Hat. ([fonte, 2025-06-24](https://www.finos.org/press/global-financial-institutions-and-technology-leaders-collaborate-under-finos-to-launch-open-source-common-controls-for-ai-services)) |
| MIT Digital Currency Initiative | consortium | pesquisa em CBDC e infraestrutura financeira | O Projeto Hamilton/OpenCBDC do MIT DCI com o Fed de Boston foi concluído em fevereiro de 2023; a fase 2 virou o projeto independente PArSEC. ([fonte, 2023-02](https://www.dci.mit.edu/project-hamilton-and-opencbdc-faqs)) |
| Alan Turing Institute (finanças) | consortium | dados sintéticos e AML | O Turing Institute é parceiro da FCA no dataset sintético de AML disponibilizado no Digital Sandbox. ([fonte, 2026-04-15](https://www.fca.org.uk/publications/research-notes/research-note-synthetic-data-anti-money-laundering-project-report)) |
| Cambridge Centre for Alternative Finance (CCAF) | consortium | mensuração global de adoção de IA em serviços financeiros | O relatório 2026 do CCAF mostra que 81% das empresas financeiras pesquisadas adotam IA, e que fintechs lideram as incumbentes na adoção avançada (47% vs 30%); 130 reguladores responderam. ([fonte, 2026-04-28](https://www.jbs.cam.ac.uk/faculty-research/centres/alternative-finance/publications/2026-global-ai-in-financial-services-report/)) |
| Institute of International Finance (Agorá) | consortium | coordenação do setor privado em tokenização de atacado | O IIF convocou mais de 40 instituições financeiras para o Projeto Agorá do BIS. ([fonte, 2026-05-27](https://www.bis.org/project/agora)) |

**Rankings.**

- [KPMG Pulse of Fintech H2 2025 (ano 2025, VC+PE+M&A, US$ bi)](https://kpmg.com/xx/en/media/press-releases/2026/02/global-fintech-investment-rebounds-in-2025-supported-by-stronger-exit-activity.html), 2026-02-11: 1º Estados Unidos (US$ 56.6 bi), 2º Reino Unido (US$ 10.96 bi), 3º Nórdicos (US$ 5.3 bi), 4º Índia (US$ 3.5 bi), 5º Canadá (US$ 2.4 bi), 6º Brasil (US$ 1.9 bi), 7º França (US$ 1.0 bi), 8º Alemanha (US$ 0.966 bi).
- [KPMG Pulse of Fintech H1 2026 (US$ bi)](https://kpmg.com/xx/en/media/press-releases/2026/08/momentum-building-in-fintech-market-as-investment-concentrates-on-scaling-business-models.html), 2026-08-25: 1º Estados Unidos (US$ 80.8 bi), 2º Reino Unido (US$ 2.5 bi), 3º Índia (US$ 2.0 bi), 4º Alemanha (US$ 1.6 bi), 5º Oriente Médio (US$ 1.4 bi), 5º Nórdicos (US$ 1.4 bi), 7º França (US$ 1.2 bi), 8º Canadá (US$ 1.0 bi).
- [GFCI 39 – FinTech ranking (Z/Yen e CDI)](https://www.longfinance.net/documents/4325/GFCI_39_Report_2026.03.26_v1.1.pdf), 2026-03-26: 1 Hong Kong (767), 2 Shenzhen (757), 3 Nova York (751), 4 Singapura (747), 5 Londres (746), 6 Xangai, 7 San Francisco, 8 Guangzhou.
- [GFCI 40 – FinTech ranking (Z/Yen e CDI)](https://mondovisione.com/news/global-financial-centres-index-40-asian-financial-centres-challenge-the-establ-2026916/), 2026-09-16: 1 Hong Kong, 2 Nova York, 3 Shenzhen, 4 Singapura, 5 Xangai, 6 Londres.
- [Global FinTech Hub ranking – Beijing FIRST (Frontier Institute of Regulation and Supervision Technology)](https://english.beijing.gov.cn/latest/news/202511/t20251103_4251608.html), 2025-10-29: 1 Pequim, 2 San Francisco (Vale do Silício), 3 Nova York, 4 Londres, 5 Xangai, 6 Shenzhen, 7 Hangzhou, 8 Singapura.
- [Evident AI Index for Banks 2026 (maturidade em IA de 50 bancos)](https://www.euronews.com/2026/10/07/ubs-only-european-bank-in-top-10-of-ai-adoption-as-jpmorgan-chase-leads), 2026-10-07: 1 JPMorgan Chase, 2 Capital One, 3 RBC, 4 Commonwealth Bank of Australia, 6 UBS, 11 HSBC, 15 Lloyds, 17 NatWest.
- [OpenAlex – produção científica sobre IA/ML em bancos por país (consulta própria em título e resumo, 2024–2026)](https://api.openalex.org/works?filter=title_and_abstract.search:(%22artificial%20intelligence%22%20OR%20%22machine%20learning%22%20OR%20%22deep%20learning%22%20OR%20%22large%20language%20model%22)%20AND%20(bank%20OR%20banking%20OR%20banks),publication_year:2024-2026&group_by=authorships.countries), 2026-11-28: 1º Índia (3324), 2º Estados Unidos (2000), 3º China (1424), 4º Indonésia (1029), 5º Reino Unido (601), 6º Nigéria (386), 7º Rússia (376), 8º Paquistão (370).

### 2.5 Líderes por tema

| Tema | Quem lidera (bancos, hubs, institutos) | Evidência |
|---|---|---|
| IA generativa em escala (funcionários e código) | JPMorgan, Capital One, Santander, BBVA, Citi; hubs Nova York, Toronto (RBC, TD), São Francisco | [JPMorgan Chase, 2026-04](https://www.jpmorganchase.com/content/dam/jpmc/jpmorgan-chase-and-co/investor-relations/documents/annualreport-2025.pdf) [Banco Santander, 2026-06-22](https://www.santander.com/en/stories/santander-turns-its-ai-first-strategy-into-measurable-impact-and-extends-ai-access-to-all-185000-employees) [Citigroup, 2026-03](https://www.citigroup.com/rcs/citigpa/storage/public/Annual_Report/2025/stronger-bank-built-to-perform.pdf) |
| Agentes e pagamentos agênticos | Ant/Alipay (Hangzhou), Nubank (São Paulo), Capital One/Brex; protocolos abertos do Google (AP2/A2A) | [Ant Group (Alipay, MYbank), 2026-02-13](https://www.businesswire.com/news/home/20260213770962/en/Alipay-AI-Payment-Exceeds-120-Million-Transactions-in-One-Week-as-Agentic-Commerce-Accelerates-in-China) ‡ [Nubank (Nu Holdings), 2026-05-14](https://www.mobiletime.com.br/noticias/14/05/2026/pix-ia-nubank-10-mi/) [Capital One, 2026-04-08](https://www.americanbanker.com/payments/news/capital-one-closes-brex-acquisition) |
| Modelos fundacionais de transações | Nubank (São Paulo), Revolut (Londres), CBA (Sydney), Ant (Hangzhou), ICBC | [Nubank (Nu Holdings), 2026-08-13](https://nu.com/en/newsroom/company/nu-holdings-ltd-reports-second-quarter-2026-financial-results) [Revolut, 2026-04](https://philippdubach.com/posts/inside-pragma-revoluts-foundation-model-for-banking/index.md) [Commonwealth Bank of Australia (CBA), 2025-09](https://www.commbank.com.au/content/dam/commbank-assets/investors/2025-09/annual-review-2025.pdf) |
| Golpes e antifraude | CBA (Sydney), DBS (Singapura), Monzo e Revolut (Londres), Tel Aviv (risk-tech), BIS Nordic (Aurora) e BIS London (Hertha) | [Commonwealth Bank of Australia (CBA), 2025-08-11](https://www.commbank.com.au/content/commbank-neo/articles/newsroom/2025/08/commbank-customer-scam-losses-fall-truyu.html) [DBS, 2026-02](https://www.dbs.com/annualreports/2025/cro-statement.html) [BIS Innovation Hub – Nordic Centre (Estocolmo), 2025-07-07](https://www.bis.org/project/aurora) [Tel Aviv / Israel, 2025-01](https://viola-group.com/wp-content/uploads/2025/02/Israeli-Fintech-2025_07.pdf) |
| Criptografia pós-quântica | BIS Eurosystem Centre (Leap), JPMorgan (Q-CAN), NIST (EUA), Comissão Europeia; no Brasil, ICTi do Itaú | [BIS Innovation Hub – Eurosystem Centre (Frankfurt/Paris), 2025-12-11](https://www.bis.org/project/leap) [JPMorgan Chase, 2024](https://www.jpmorgan.com/technology/news/firm-establishes-quantum-secured-crypto-agile-network) [Itaú Unibanco, 2026-09-01](https://www.baguete.com.br/noticias/itau-aposta-em-computacao-quantica) |
| Computação quântica aplicada | JPMorgan (Nova York), HSBC com IBM (Londres), BNP com Pasqal (Paris) | [JPMorgan Chase, 2025-03-26](https://www.olcf.ornl.gov/2025/05/05/quantum-computing-experiment-realizes-verifiably-random-number/) [HSBC, 2025-09-25](https://www.hsbc.com/news-and-views/news/media-releases/2025/hsbc-demonstrates-worlds-first-known-quantum-enabled-algorithmic-trading-with-ibm) [BNP Paribas, 2026-03-27](https://thequantuminsider.com/2026/03/27/15-plus-global-banks-probing-the-wonderful-world-of-quantum-technologies/) |
| Depósitos tokenizados e dinheiro de banco central tokenizado | JPMorgan Kinexys (Nova York), HSBC e HKMA Ensemble (Hong Kong), Citi, MAS (Singapura), Eurosistema Pontes (Frankfurt/Paris), consórcio Qivalis (Amsterdã) | [JPMorgan Chase, 2026-10-19](https://www.jpmorgan.com/payments/newsroom/jpm-coin-live-on-ethereum) [Hong Kong, 2026-11-02](https://www.hkma.gov.hk/eng/news-and-media/press-releases/2026/11/20261102-5/) [BCE / Eurosistema (euro digital, Pontes, Appia), 2026-09-21](https://ecb.europa.eu/press/pr/date/2026/html/ecb.pr260921~e754847a7b.en.html) [BBVA, 2026-10-14](https://www.ledgerinsights.com/qivalis-stablecoin-consortium-secures-dutch-emi-license/) |
| Pagamentos instantâneos e infraestrutura pública digital | Brasil (Pix), Índia (UPI), Singapura e BIS (Nexus), UE (Wero/SEPA Inst), Quênia (M-Pesa) | [BCB (Brasil), 2026-11-09](https://www.jornaldocomercio.com/economia/2026/11/1269821-pix-atinge-novo-recorde-com-3197-milhoes-de-transacoes-em-um-unico-dia.html) [NPCI/RBI (Índia), 2026-11](https://inc42.com/buzz/upi-transactions-rise-5-8-mom-to-record-25-47-bn-in-october/) [BIS Innovation Hub – Singapore Centre, 2025](https://www.bis.org/project/nexus) [Nairobi / Quênia, 2026-05-07](https://tech-ish.com/2026/05/07/safaricom-fy26-mpesa-results-explained/) |
| Open finance | Brasil (consentimentos), Índia (Account Aggregator), JPMorgan (volume de API), BIS Hong Kong (Aperta) | [BCB (Brasil), 2026-08-27](https://www.letsmoney.com.br/noticias/open-finance-208-milhoes-consentimentos-governanca/) [RBI/Sahamati (Índia), 2026-09-02](https://sahamati.org.in/?p=1274421) [JPMorgan Chase, 2026-04](https://www.jpmorganchase.com/content/dam/jpmc/jpmorgan-chase-and-co/investor-relations/documents/annualreport-2025.pdf) [BIS Innovation Hub – Hong Kong Centre, 2026-05-29](https://www.bis.org/project/aperta) |
| Modernização de core com IA | Itaú (São Paulo), Santander (Gravity), HSBC, Citi, Morgan Stanley; centros de capacidade (GCC) bancários em Bangalore | [Itaú Unibanco, 2026](https://aws.amazon.com/solutions/case-studies/itau-aws-transform-mainframe/) [Banco Santander, 2025-06-19](https://www.santander.com/en/press-room/press-releases/2025/06/santander-completes-the-digitalization-of-its-technology-infrastructure-in-spain-with-the-deployment-of-gravity) [Morgan Stanley, 2025-06-03](https://www.entrepreneur.com/business-news/morgan-stanley-builds-ai-tool-that-fixes-major-coding-issue/492697) [Bangalore / Mumbai (Índia), 2026-10-14](https://zinnov.com/centers-of-excellence/why-hyderabad-is-drawing-the-next-wave-of-bfsi-gccs-blog/) |
| Regulação e governança de IA | MAS (Singapura), FCA (Londres), RBI (Índia), EBA (UE), FINOS | [MAS (Singapura), 2026-10-07](https://www.mas.gov.sg/-/media/mas-media-library/publications/consultations/bd/2025/response-to-feedback-received-on-guidelines-on-artificial-intelligence-risk-management.pdf) ‡ [FCA (Reino Unido) – AI Lab, 2026-07-13](https://www.fca.org.uk/firms/innovation/supercharged-sandbox) [RBI (Índia), 2025-08-13](https://website.rbi.org.in/documents/d/rbi/rbi-free-ai-committee-report_13082025) [FINOS (Fintech Open Source Foundation / Linux Foundation), 2025-06-24](https://www.finos.org/press/global-financial-institutions-and-technology-leaders-collaborate-under-finos-to-launch-open-source-common-controls-for-ai-services) |
| Valor de IA medido e publicado | DBS, JPMorgan, Santander, Lloyds, Bradesco | [DBS, 2026-02](https://www.dbs.com/annualreports/2025/letter-from-chairman-ceo.html) [Banco Santander, 2026-06-22](https://www.santander.com/en/stories/santander-turns-its-ai-first-strategy-into-measurable-impact-and-extends-ai-access-to-all-185000-employees) [Bradesco, 2025-10-27](https://www.bloomberglinea.com.br/negocios/ia-generativa-resolve-82-dos-atendimentos-iniciais-no-bradesco-diz-diretora/?outputType=amp) |

## 3. Tabela de lacunas

Veredito: **alinhado**; **Febraban atrasado** (o mundo já está mais à frente do que a classificação diz); **Febraban superestima** (impacto ou maturidade acima da evidência); **ausente no radar**. Sinais = volume no OpenAlex e repositórios novos no GitHub, normalizados.

| # | Tema | Posição Febraban | Evidência do mundo | Sinais | Veredito | Por que importa para um grande banco brasileiro |
|---|---|---|---|---|---|---|
| L01 | Modelos fundacionais (LLMs gerais) | Radar: Em escala, impacto 5, mantida. Pesquisa: 48% usam 1 provedor de LLM, 36% usam 2 ou mais; 94% usam RAG (p. 22). | Mais de 90% dos engenheiros usam assistentes de código com IA e mais de 65 mil colaboradores do CIB usam ativamente o LLM Suite. [JPMorgan Chase, 2026-04](https://www.jpmorganchase.com/content/dam/jpmc/jpmorgan-chase-and-co/investor-relations/documents/annualreport-2025.pdf); Estendeu o ChatGPT Enterprise a todos os 120 mil funcionários em 25 países (10x a base anterior de 11 mil, que poupava ~3 h/semana). [BBVA, 2025-12-12](https://openai.com/index/bbva-collaboration-expansion/); Meta de >€1 bi de valor de negócio com IA em 2026–2028; €35 mi no 1T26 e >€200 mi esperados em 2026; acesso a IA para todos os 185 mil funcionários. [Banco Santander, 2026-06-22](https://www.santander.com/en/stories/santander-turns-its-ai-first-strategy-into-measurable-impact-and-extends-ai-access-to-all-185000-employees) | OpenAlex 12→1126 (2022→2025; 63,71x normalizado); GitHub 779 repos novos em 2026 (3,83x normalizado vs 2025) | **alinhado** | LLM de uso geral já é commodity nos líderes. A diferença está no que vem por cima: dados próprios, integração e medição de valor. |
| L02 | IA no ciclo de desenvolvimento (SDLC) | Radar: Em escala, impacto 5. Pesquisa: geração de código só 20% em larga escala e 72% em exploração; teste de código 16% em larga escala (Vol. 2, p. 23). | Mais de 90% dos engenheiros usam assistentes de código com IA e mais de 65 mil colaboradores do CIB usam ativamente o LLM Suite. [JPMorgan Chase, 2026-04](https://www.jpmorganchase.com/content/dam/jpmc/jpmorgan-chase-and-co/investor-relations/documents/annualreport-2025.pdf); Mais de 17 mil pessoas usam IA agêntica no desenvolvimento de software e 40% do código já é gerado por IA; >280 agentes de automação de processos em produção. [Banco Santander, 2026-06-22](https://www.santander.com/en/stories/santander-turns-its-ai-first-strategy-into-measurable-impact-and-extends-ai-access-to-all-185000-employees); Itaú usa o agente de engenharia Devin (Cognition) em todos os times de tecnologia, ~75% deles de forma autônoma: +30% de volume de entregas, migrações 6x mais rápidas, 70% dos alertas de segurança de análise estática resolvidos e cobertura de testes de ~50% para 90%+. [Itaú Unibanco, 2026-01-19](https://www.baguete.com.br/public/noticias/itau-usa-agente-de-ia-da-cognition) | OpenAlex 90→1062 (2022→2025; 8,01x normalizado); GitHub 81395 repos novos em 2026 (7,58x normalizado vs 2025) | **alinhado** | O Radar acerta. O setor, não: a Pesquisa mostra que só 1 em 5 bancos usa geração de código em escala, enquanto líderes já medem % do código escrito por IA. |
| L03 | Agentes de IA | Radar: Emergente, impacto 5. Pesquisa: 52% adotam agentes, só 16% em larga escala com captura de valor (Vol. 2, p. 20). | Agentes de IA já atendem mais de 60% das conversas de suporte no Brasil, com qualidade igual ou superior à humana. [Nubank (Nu Holdings), 2026-08-13](https://nu.com/en/newsroom/company/nu-holdings-ltd-reports-second-quarter-2026-financial-results); Em 2025 o WeBank operava mais de 100 cenários de aplicação de IA, mais de 800 agentes de IA e mais de 60 'funcionários digitais' em sua estratégia de banco AI-native. [WeBank, 2026-03-16](https://www.aap.com.au/aapreleases/cision20260316ae10617); Chat Concierge, sistema multiagente próprio em produção em sites de concessionárias, converte leads em compradores 55% melhor; latência caiu 5x desde o lançamento. [Capital One, 2025-12-15](https://fortune.com/2025/12/15/agentic-artificial-intelligence-automation-capital-one/) | OpenAlex 104→1094 (2022→2025; 7,14x normalizado); GitHub 5135 repos novos em 2026 (3,2x normalizado vs 2025) | **alinhado** | Emergente é correto no agregado. Mas há bolsões em escala (atendimento, operações), e os líderes já têm plataformas de governança de agentes. |
| L04 | Orquestração e conectividade para agentes (MCP, A2A) | Radar: Emergente, impacto 4, nova em 2026. Pesquisa: 50% dos bancos já usam MCP (Vol. 2, p. 22). | Protocolo AP2 estende o A2A e funciona com MCP; mais de 60 organizações no lançamento. [Google Cloud, 2025-09-16](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol) | OpenAlex 104→1094 (2022→2025; 7,14x normalizado); GitHub 5135 repos novos em 2026 (3,2x normalizado vs 2025) | **alinhado** | Metade dos bancos brasileiros já usa MCP. O tema é de padrão aberto e muda rápido; vale acompanhar as especificações, não só os produtos. |
| L05 | Grafos de conhecimento e ontologias | Radar: Emergente, impacto 4, nova em 2026. | — | OpenAlex 121→191 (2022→2025; 1,07x normalizado); GitHub 56 repos novos em 2026 (1,91x normalizado vs 2025) | **alinhado** | Crescimento de pesquisa modesto em finanças. Útil como camada semântica para agentes e para linhagem de dados. |
| L06 | Pagamentos agênticos e finanças delegadas | Radar: Conceitual, impacto 5, mantida. Tese 3 (Comércio agêntico) põe 'desenvolver agentes financeiros próprios' em experimentar (Estudo, p. 34). | O AI Pay do Alipay (pagamento por agentes de IA via voz/apps) processou mais de 120 milhões de transações em uma semana (5–11/fev/2026) e passou de 100 milhões de usuários. [Ant Group (Alipay, MYbank), 2026-02-13](https://www.businesswire.com/news/home/20260213770962/en/Alipay-AI-Payment-Exceeds-120-Million-Transactions-in-One-Week-as-Agentic-Commerce-Accelerates-in-China) ‡; Até maio/2026 foram concluídos 300 milhões de pagamentos feitos por agentes de IA no Alipay, que tem ~1 bilhão de usuários. [Ant Group (Alipay, MYbank), 2026-06-17](https://www.thestandard.com.hk/finance/article/334961/Ant-Group-logs-record-35-billion-yuan-in-RD-in-2025-over-10-percent-of-revenue); No 1T26, 10 milhões de clientes ativos mensais usavam Pix com IA e 15 milhões usavam funcionalidades do 'AI Private Banker'; produtividade de engenharia subiu 50% a/a e consumo de tokens cresceu 10x desde jan/2026. [Nubank (Nu Holdings), 2026-05-14](https://www.mobiletime.com.br/noticias/14/05/2026/pix-ia-nubank-10-mi/) | OpenAlex 5→36 (2022→2025; 4,89x normalizado); GitHub 601 repos novos em 2026 (5,29x normalizado vs 2025) | **Febraban atrasado** | Não é conceitual: há centenas de milhões de pagamentos por agente na China e Pix por IA no Brasil. Quem não definir identidade, limites e disputa para agentes perde o checkout. |
| L07 | IA explicável e responsável | Radar: Emergente, impacto 4. Pesquisa: avaliação de explicabilidade avançada em só 21% (Vol. 2, p. 24); 17% sem prática de governança de LLM (p. 26). | As diretrizes finais de risco de IA do MAS foram publicadas com resposta à consulta, com implementação faseada (seções 3–4 a partir de out/2027). [MAS (Singapura), 2026-10-07](https://www.mas.gov.sg/-/media/mas-media-library/publications/consultations/bd/2025/response-to-feedback-received-on-guidelines-on-artificial-intelligence-risk-management.pdf) ‡; O RBI publicou o relatório do comitê FREE-AI com 7 'Sutras', 6 pilares e 26 recomendações para IA responsável no setor financeiro. [RBI (Índia), 2025-08-13](https://website.rbi.org.in/documents/d/rbi/rbi-free-ai-committee-report_13082025); O mapeamento da EBA não encontrou contradições significativas entre o AI Act e a legislação bancária e de pagamentos da UE; IA para score de crédito de pessoas físicas é de alto risco. [EBA (UE), 2025-11-21](https://www.eba.europa.eu/sites/default/files/2025-11/d8b999ce-a1d9-4964-9606-971bbc2aaf89/AI Act implications for the EU banking sector.pdf) | OpenAlex 989→1954 (2022→2025; 1,34x normalizado); GitHub 701 repos novos em 2026 (3,04x normalizado vs 2025) | **alinhado** | O mundo migrou de 'explicabilidade' para gestão de risco de IA (inventário, materialidade, agentes). O BC deve seguir o mesmo caminho. |
| L08 | Aprendizado federado e privacy ML | Radar: Conceitual, impacto 4, nova em 2026. Tese 6 propõe 'evoluir o compartilhamento de informações de fraudes setoriais' (Estudo, p. 34). | O Projeto Aurora encontrou até 3 vezes mais lavagem de dinheiro e até 80% menos falsos positivos com IA e análise de rede colaborativa, frente a regras isoladas. [BIS Innovation Hub – Nordic Centre (Estocolmo), 2025-07-07](https://www.bis.org/project/aurora); O framework de aprendizado federado FATE, criado pelo WeBank, passou a ser hospedado pela Linux Foundation e inclui o módulo FATE-LLM. [WeBank (Shenzhen), 2019-06-25](https://www.linuxfoundation.org/press/press-release/the-linux-foundation-will-host-the-federated-ai-enabler-to-responsibly-advance-data-modeling); O Projeto Mandala, de compliance embutido em transações transfronteiriças com provas verificáveis sem expor dados de clientes, iniciou sua fase 2 em novembro de 2025. [BIS Innovation Hub – Singapore Centre, 2025-11-30](https://www.bis.org/project/mandala) | OpenAlex 153→1306 (2022→2025; 5,8x normalizado); GitHub 149 repos novos em 2026 (1,8x normalizado vs 2025) | **Febraban atrasado** | O BIS já mostrou ganho real com análise colaborativa sob privacidade (até 3x mais lavagem detectada). É a técnica que viabiliza a tese de compartilhar dados de fraude entre bancos. |
| L09 | Edge AI | Radar: Emergente, impacto 4, nova em 2026. | — | OpenAlex 96→637 (2022→2025; 4,51x normalizado); GitHub 2449 repos novos em 2026 (5,64x normalizado vs 2025) | **Febraban superestima** | Não achamos caso bancário com números. Impacto 4 parece alto; o uso provável é biometria e antifraude no aparelho. |
| L10 | Identidade e autenticação | Radar: Em escala, impacto 5. Pesquisa: MFA 88%, biometria comportamental 60% entre as frentes antifraude (Vol. 2, p. 35). | Redução de 21% a/a nas taxas de reclamações de fraude e golpes em todos os meios de pagamento, com passkeys e novos modelos de login suspeito. [JPMorgan Chase, 2026-04](https://www.jpmorganchase.com/content/dam/jpmc/jpmorgan-chase-and-co/investor-relations/documents/annualreport-2025.pdf) | OpenAlex 329→801 (2022→2025; 1,65x normalizado); GitHub 397 repos novos em 2026 (2,02x normalizado vs 2025) | **alinhado** | Alinhado. A próxima fronteira é identidade de agentes (quem autorizou o agente), que o Radar trata em comércio agêntico. |
| L11 | Proteção contra fraudes com IA | Radar: Emergente, impacto 5, reformulada. Pesquisa: 56% usam IA/ML para detecção de fraude (Vol. 2, p. 35); ganho médio de eficiência 11% em 2025 (Vol. 1, p. 14). | CBA reportou queda de 76% nas perdas de clientes com golpes desde o pico (2S25 vs 1S23) e investimento de mais de A$900 milhões no FY25 contra fraude, golpes, crime financeiro e ciberameaças. [Commonwealth Bank of Australia (CBA), 2025-08-11](https://www.commbank.com.au/content/commbank-neo/articles/newsroom/2025/08/commbank-customer-scam-losses-fall-truyu.html); Em 2025 os 'scam saves' cresceram 35%, controles temporais no provisionamento de cartões em carteiras móveis cortaram 98% desses golpes e a extensão do monitoramento IA/ML ao varejo melhorou em 175% a detecção de maus atores. [DBS, 2026-02](https://www.dbs.com/annualreports/2025/cro-statement.html); Em 2025 os sistemas da Revolut analisaram mais de 10 bilhões de transações; modelos avançados de IA elevaram em quase 10x os casos revisados por dia e mais de 1/3 da força de trabalho atua em prevenção a crimes financeiros. [Revolut, 2026-03-24](https://assets.revolut.com/pdf/annualreport2025.pdf) | OpenAlex 71→504 (2022→2025; 4,82x normalizado); GitHub 283 repos novos em 2026 (2,35x normalizado vs 2025) | **Febraban atrasado** | Nos líderes isto está em escala há anos, com perdas medidas. Chamar de 'Emergente' tira urgência de algo que já define a perda com golpes. |
| L12 | IA defensiva em operações de segurança (SOC) | Radar: Emergente, impacto 5. Pesquisa: 77% usam IA para detecção de ameaças; 31% para resposta automatizada (Vol. 1, p. 13). | O Projeto Raven desenvolve IA para avaliar a maturidade de cibersegurança e resiliência do sistema financeiro. [BIS Innovation Hub – Nordic Centre (Estocolmo), 2024-04-30](https://www.bis.org/project/raven) | OpenAlex 393→1545 (2022→2025; 2,67x normalizado); GitHub 1829 repos novos em 2026 (3,13x normalizado vs 2025) | **alinhado** | Alinhado, e a pesquisa cresce rápido. |
| L13 | Proteção de soluções com IA (prompt injection, red teaming, controles de agentes) | Radar: Conceitual, impacto 5, nova em 2026. Pesquisa: red teaming de LLM em 30%, testes adversariais 30% (Vol. 2, p. 26). | A FINOS lançou o Common Controls for AI Services com BMO, Citi, Morgan Stanley, RBC e Bank of America, além de Microsoft, Google Cloud, AWS e Red Hat. [FINOS (Fintech Open Source Foundation / Linux Foundation), 2025-06-24](https://www.finos.org/press/global-financial-institutions-and-technology-leaders-collaborate-under-finos-to-launch-open-source-common-controls-for-ai-services); O consórcio MindForge, com 24 bancos, seguradoras e outras empresas, publicou um kit de gestão de risco de IA que cobre IA tradicional, generativa e agêntica. [MAS (Singapura), 2026-03-20](https://www.mas.gov.sg/news/media-releases/2026/mas-partners-industry-to-develop-ai-risk-management-toolkit-for-the-financial-sector); AgentDojo: ambiente de teste de ataques e defesas de prompt injection em agentes. [Debenedetti et al., 2024](https://doi.org/10.52202/079017-2636) | OpenAlex 31→1578 (2022→2025; 34,56x normalizado); GitHub 12226 repos novos em 2026 (7,58x normalizado vs 2025) | **Febraban atrasado** | Há benchmarks, controles abertos (FINOS) e kits de regulador (MAS). Com agentes em produção, isto é controle de hoje, não conceito. |
| L14 | Cibersegurança pós-quântica | Radar: Conceitual, impacto 5. Pesquisa: 29% acham quântica relevante hoje; PQC é o tema quântico nº 1 (Vol. 2, p. 36); quântica tem prioridade média/alta em só 8% (Vol. 1, p. 9). | NIST IR 8547 final: plano de transição para criptografia pós-quântica (versão final). [NIST, 2026-10-27](https://csrc.nist.gov/pubs/ir/8547/final); Roteiro coordenado da UE para a transição a PQC. [Comissão Europeia, 2025-06-23](https://digital-strategy.ec.europa.eu/en/library/coordinated-implementation-roadmap-transition-post-quantum-cryptography); A fase 2 do Projeto Leap confirmou ser viável migrar um sistema de pagamento operacional para criptografia pós-quântica, mas com aumento relevante do tempo de processamento. [BIS Innovation Hub – Eurosystem Centre (Frankfurt/Paris), 2025-12-11](https://www.bis.org/project/leap) | OpenAlex 864→3710 (2022→2025; 2,92x normalizado); GitHub 2587 repos novos em 2026 (2,66x normalizado vs 2025) | **Febraban atrasado** | Padrões finais existem e o BIS migrou um sistema de pagamento real. É programa de engenharia de anos, com risco 'colha agora, decifre depois'. |
| L15 | Cripto-agilidade e migração PQC | Radar: Conceitual, impacto 5, nova. Tese 4 manda inventariar ativos criptográficos (CBOM) e iniciar a migração nos sistemas críticos 'agora' (Estudo, p. 34). | A fase 2 do Projeto Leap confirmou ser viável migrar um sistema de pagamento operacional para criptografia pós-quântica, mas com aumento relevante do tempo de processamento. [BIS Innovation Hub – Eurosystem Centre (Frankfurt/Paris), 2025-12-11](https://www.bis.org/project/leap); Opera rede 'quantum-secured crypto-agile' (Q-CAN) com QKD protegendo VPNs em fibra de 100 Gbps entre data centers; estratégia dupla PQC + QKD. [JPMorgan Chase, 2024](https://www.jpmorgan.com/technology/news/firm-establishes-quantum-secured-crypto-agile-network) | OpenAlex 864→3710 (2022→2025; 2,92x normalizado); GitHub 2587 repos novos em 2026 (2,66x normalizado vs 2025) | **Febraban atrasado** | Contradição interna: o Estudo manda 'escalar agora' o inventário, mas o Radar classifica como Conceitual. A maturidade da técnica é Emergente. |
| L16 | Computação que preserva privacidade (HE, MPC, ZK) | Radar: Conceitual, impacto 4. | O Projeto Mandala, de compliance embutido em transações transfronteiriças com provas verificáveis sem expor dados de clientes, iniciou sua fase 2 em novembro de 2025. [BIS Innovation Hub – Singapore Centre, 2025-11-30](https://www.bis.org/project/mandala); O Projeto Aurora encontrou até 3 vezes mais lavagem de dinheiro e até 80% menos falsos positivos com IA e análise de rede colaborativa, frente a regras isoladas. [BIS Innovation Hub – Nordic Centre (Estocolmo), 2025-07-07](https://www.bis.org/project/aurora) | OpenAlex 138→672 (2022→2025; 3,31x normalizado); GitHub 695 repos novos em 2026 (0,62x normalizado vs 2025) | **alinhado** | Alinhado. Pilotos de banco central avançam; produção em banco ainda é rara. |
| L17 | Physical AI e robótica de fundação | Radar: Conceitual, impacto 3. | — | — | **alinhado** | Baixa relevância direta para banco. |
| L18 | Biotech e augmentação humana | Radar: Conceitual, impacto 2. | — | — | **alinhado** | Baixa relevância direta para banco. |
| L19 | Gêmeos digitais | Radar: Emergente, impacto 4. | O Projeto Danu criou um gêmeo digital de risco climático que integra 17 fontes de dados ambientais e de ativos. [BIS Innovation Hub – Hong Kong Centre, 2026-11-24](https://www.bis.org/project/danu) | OpenAlex 101→584 (2022→2025; 3,93x normalizado); GitHub 28 repos novos em 2026 (16,26x normalizado vs 2025) | **alinhado** | O uso mais forte em finanças é risco climático e de rede (BIS Danu), não gêmeo do cliente. |
| L20 | Spatial computing e interfaces imersivas | Radar: Emergente, impacto 2, reformulada. | — | OpenAlex 119→211 (2022→2025; 1,2x normalizado) | **Febraban superestima** | A pesquisa sobre metaverso/imersivo em bancos encolhe em termos relativos desde 2023. 'Emergente' sugere avanço que não aparece. |
| L21 | Computação quântica (uso de negócio) | Radar: Conceitual, impacto 5. Pesquisa: maturidade baixa em 92% dos bancos (Vol. 2, p. 52). | Teste com IBM (processador Heron) melhorou em até 34% a previsão de execução de ordens em títulos corporativos europeus — sem negociações reais. [HSBC, 2025-09-25](https://www.hsbc.com/news-and-views/news/media-releases/2025/hsbc-demonstrates-worlds-first-known-quantum-enabled-algorithmic-trading-with-ibm); Demonstrou 'aleatoriedade certificada' em computador quântico de 56 qubits (Quantinuum H2), publicada na Nature: 71.313 bits de entropia certificados. [JPMorgan Chase, 2025-03-26](https://www.olcf.ornl.gov/2025/05/05/quantum-computing-experiment-realizes-verifiably-random-number/) | OpenAlex 145→1059 (2022→2025; 4,96x normalizado); GitHub 272 repos novos em 2026 (1,12x normalizado vs 2025) | **Febraban superestima** | Os melhores resultados ainda são testes sem operação real. Impacto 5 para a computação em si é alto; a urgência real é a PQC (L14–L15). |
| L22 | IA na operação de tecnologia (AIOps) | Radar: Emergente, impacto 4, nova. | ~2/3 das transações online processadas na nuvem em 2025, meta de 90% em 2029; incidentes tecnológicos relevantes -53% em três anos. [BBVA, 2026-10-06](https://www.bbva.com/es/innovacion/bbva-crea-un-modelo-para-escalar-la-ia-a-todo-el-grupo-e-impulsar-su-transformacion-centrada-en-el-cliente/) | OpenAlex 93→409 (2022→2025; 2,99x normalizado); GitHub 5391 repos novos em 2026 (3,62x normalizado vs 2025) | **alinhado** | Alinhado. Incidentes e custo de operação são onde aparece retorno rápido. |
| L23 | Edge computing e IoT | Radar: Em escala, impacto 4. | — | OpenAlex 96→637 (2022→2025; 4,51x normalizado); GitHub 2449 repos novos em 2026 (5,64x normalizado vs 2025) | **alinhado** | Infraestrutura geral. Para banco com agro, IoT de campo é sensor de risco de crédito. |
| L24 | Embedded finance e banking as a platform | Radar: Emergente, impacto 4, nova. | No 3T26 o Mercado Pago chegou a 92,9 milhões de usuários ativos mensais (+29% a/a), TPV de US$109 bilhões (+53%) e carteira de crédito de US$17,9 bilhões (+62%). [Mercado Pago (Mercado Libre), 2026-11-06](https://dplnews.com/?p=336397) | OpenAlex 40→241 (2022→2025; 4,09x normalizado); GitHub 301 repos novos em 2026 (1,47x normalizado vs 2025) | **alinhado** | No Brasil já é disputa de mercado (plataformas com crédito e Pix). Ver L36 (Pix) e L37 (Open Finance). |
| L25 | Nanomateriais e novas mídias de armazenamento | Radar: Conceitual, impacto 1. | — | — | **alinhado** | Fora do horizonte de decisão de um banco. |
| L26 | Processadores beyond silicon | Radar: Conceitual, impacto 4. | — | — | **Febraban superestima** | Banco compra capacidade em nuvem; o efeito chega via preço de inferência. Impacto 4 é alto para algo fora do controle do banco. |
| L27 | Infraestrutura de energia para datacenters | Radar: Emergente, impacto 5. | Com NVIDIA, custo por interação de atendimento caiu de ~€5 para ~€0,03 em casos experimentais (corte >50% em um deployment). [Banco Santander, 2026-10-19](https://www.santander.com/en/press-room/press-releases/2026/10/santander-builds-ai-capabilities-that-improve-performance-and-lower-costs-using-nvidia-ai-infrastructure) | OpenAlex 98→1148 (2022→2025; 7,95x normalizado); GitHub 98 repos novos em 2026 (2,28x normalizado vs 2025) | **Febraban superestima** | É problema do provedor. O que o banco controla é o custo por interação e a escolha de modelo (ver L43, FinOps de IA). |
| L28 | Conectividade avançada 5G/6G | Radar: Emergente, impacto 3. | — | — | **alinhado** | Infraestrutura geral; relevância indireta. |
| L29 | Green tech | Radar: Emergente, impacto 3. Pesquisa: 87% oferecem produtos ESG (Vol. 1). | — | OpenAlex 15→114 (2022→2025; 5,16x normalizado); GitHub 2301 repos novos em 2026 (2,13x normalizado vs 2025) | **alinhado** | O ponto de banco é dado climático no crédito (ver L42), não a tecnologia verde em si. |
| L30 | Ativos digitais e tokenização (depósitos tokenizados e stablecoins reguladas) | Radar: Emergente, impacto 3 (o menor do domínio). Pesquisa: 65% dos bancos não operam tokenização nem custódia (Vol. 2, p. 53). Tese 5 põe 'lançar depósitos tokenizados' em experimentar (Estudo, p. 34). | Kinexys acumula >US$4 tri processados e média de US$7 bi/dia; JPM Coin (JPMD), depósito tokenizado em USD, lançado na Base (nov/2025) e ativo na Ethereum (out/2026). [JPMorgan Chase, 2026-10-19](https://www.jpmorgan.com/payments/newsroom/jpm-coin-live-on-ethereum); Tokenised Deposit Service ativo em HK, Singapura, Luxemburgo, Reino Unido e EUA (abr/2026) e EAU (jun/2026), para clientes corporativos/institucionais. [HSBC, 2026-04-13](https://www.about.us.hsbc.com/newsroom/press-releases/hsbc-expands-tokenized-deposit-service-to-the-united-states); Citi Token Services ativo em 7 mercados (EUA, Irlanda, HK, Singapura, Reino Unido, Japão, EAU), em USD e EUR; no Investor Day foi reportado volume próximo de US$1 bi/dia (dado reportado pela imprensa). [Citigroup, 2026-09-28](https://www.citigroup.com/global/news/press-release/2026/citi-token-services-expands-global-footprint-japan-united-arab-emirates) | OpenAlex 40→287 (2022→2025; 4,87x normalizado); GitHub 413 repos novos em 2026 (1,74x normalizado vs 2025) | **Febraban atrasado** | Depósito tokenizado é produção nos maiores bancos (US$ 7 bi/dia só na Kinexys). Impacto 3 subestima a ameaça das stablecoins à captação e ao câmbio. |
| L31 | Tokenização de ativos reais (RWA) | Radar: Emergente, impacto 4. | DBS emitiu notas estruturadas tokenizadas na blockchain pública Ethereum (primeiro uso de rede pública pelo banco), distribuídas via ADDX, DigiFT e HydraX para investidores credenciados. [DBS, 2025-08](https://cointelegraph.com/news/dbs-tokenized-structured-notes-ethereum-crypto); A Ant Digital Technologies busca levar US$8,4 bilhões em ativos de energia e outros RWAs para blockchain e participa do sandbox Project Ensemble da HKMA. [Ant Group (Alipay, MYbank), 2025-09-09](https://www.theblock.co/news/business/2025-09-09-ant-group-tokenize-energy-assets-369959); O Projeto Agorá (Eurosystem, Londres, Suíço e Toronto) reúne 8 bancos centrais e mais de 40 instituições via IIF; nos testes com valor real de julho de 2026, o tempo médio até a liquidação foi de cerca de 80 segundos. [BIS Innovation Hub – Swiss Centre (Basileia/Zurique), 2026-05-27](https://www.bis.org/project/agora) | OpenAlex 40→287 (2022→2025; 4,87x normalizado); GitHub 413 repos novos em 2026 (1,74x normalizado vs 2025) | **alinhado** | Alinhado. Colateral tokenizado (Project Guardian) é o uso mais próximo de crédito. |
| L32 | Smart contracts | Radar: Em escala, impacto 4. | DBS Token Services (Treasury Tokens, Conditional Payments, Programmable Rewards) roda em blockchain permissionada compatível com EVM com liquidação 24/7; DBS participou com OCBC e UOB do teste ao vivo de wCBDC do MAS em nov/2025. [DBS, 2025-11-12](https://www.dbs.com/blockchain/how-dbs-is-shaping-a-trusted-digital-asset-ecosystem.html) | OpenAlex 3640→8797 (2022→2025; 1,64x normalizado); GitHub 1888 repos novos em 2026 (1,02x normalizado vs 2025) | **alinhado** | Em escala em DeFi e em plataformas de bancos líderes; no Brasil depende do destino do Drex. |
| L33 | CBDC e moedas digitais (Drex) | Radar: Emergente, impacto 4. Tese 5 recomenda 'participar do Drex Fase 2' (Estudo, p. 34). | O BC comunicou o desligamento da plataforma de testes do Drex baseada em Hyperledger Besu/EVM, considerada inadequada em privacidade/segurança e custo. [BCB (Brasil), 2025-11-04](https://forbes.com.br/escolhas-do-editor/2025/11/banco-central-abandona-o-blockchain-do-drex-o-projeto-do-real-digital/); Em ago/2025 o BC anunciou que a próxima fase do Drex não usaria DLT, com primeira entrega prevista para 2026 focada em reconciliação de gravames para garantia de crédito. [BCB (Brasil), 2025-08](https://exame.com/future-of-money/drex-reduz-uso-de-tecnologia-blockchain-e-pode-ter-lancamento-em-2026) ‡; O Pontes entrou em operação em 21/09/2026, com implementação completa prevista até 2028; o Appia, ecossistema DLT de longo prazo, deve ter blueprint até 2028. [BCE / Eurosistema (euro digital, Pontes, Appia), 2026-09-21](https://ecb.europa.eu/press/pr/date/2026/html/ecb.pr260921~e754847a7b.en.html) | OpenAlex 569→1530 (2022→2025; 1,83x normalizado); GitHub 323 repos novos em 2026 (1,31x normalizado vs 2025) | **Febraban superestima** | O BC desligou a plataforma DLT do Drex em nov/2025; a 1ª entrega é registro de gravames sem DLT. O valor no atacado vem de dinheiro de banco central tokenizado (Pontes, Ensemble), não de CBDC de varejo. |
| L34 | DApps e DeFi | Radar: Emergente, impacto 3. | — | OpenAlex 5441→10780 (2022→2025; 1,35x normalizado); GitHub 24479 repos novos em 2026 (1,05x normalizado vs 2025) | **alinhado** | Relevância para banco: custódia e integração, com risco regulatório alto. |
| L35 | Seguros paramétricos | Radar: Conceitual, impacto 4, nova em 2026. | Seguro por índice com rede neural reduz risco de base frente a contratos lineares. [Management Science, 2023](https://doi.org/10.1287/mnsc.2023.4902); O Projeto Danu criou um gêmeo digital de risco climático que integra 17 fontes de dados ambientais e de ativos. [BIS Innovation Hub – Hong Kong Centre, 2026-11-24](https://www.bis.org/project/danu) | OpenAlex 133→280 (2022→2025; 1,43x normalizado); GitHub 808 repos novos em 2026 (4,47x normalizado vs 2025) | **Febraban atrasado** | Seguro por índice existe há décadas (clima, safra). 'Conceitual' ignora isso. Para carteira agro, é proteção do crédito contra seca. |
| L36 | Trilhos de pagamento instantâneo (Pix Automático, por aproximação, crédito; FedNow, Wero, UPI) | Ausente do Radar. A Pesquisa mede volumes (Pix, heavy users) e vê 'Pix crédito' como oportunidade (Vol. 2, p. 77); orçamento de Pix cai 7% em 2026 (Vol. 2, p. 9). | Pix iniciados via APIs do Open Finance cresceram mais de 8x em 2025, de 7,4 milhões em 2024 para 64,5 milhões. [BCB (Brasil), 2026-08](https://www.bcb.gov.br/content/estabilidadefinanceira/pix/relatorio_de_gestao_pix/relatorio_gestao_pix_2026.pdf); Pix bateu recorde de 319,7 milhões de transações em um dia (06/11/2026), somando R$180,5 bilhões; o recorde anterior era 318,1 milhões em 04/09/2026. [BCB (Brasil), 2026-11-09](https://www.jornaldocomercio.com/economia/2026/11/1269821-pix-atinge-novo-recorde-com-3197-milhoes-de-transacoes-em-um-unico-dia.html); O UPI processou recorde de 25,47 bilhões de transações em out/2026, no valor de ₹31,53 lakh crore, +23% a/a em volume. [NPCI/RBI (Índia), 2026-11](https://inc42.com/buzz/upi-transactions-rise-5-8-mom-to-record-25-47-bn-in-october/) | OpenAlex 623→1951 (2022→2025; 2,13x normalizado); GitHub 386 repos novos em 2026 (2,38x normalizado vs 2025) | **ausente no radar** | O Brasil lidera aqui, e o tema não aparece no Radar. Mas os trilhos são onde entram agentes, tokens e golpes; tirar do radar é perder o mapa da disputa. |
| L37 | Open Finance como ativo de dados (crédito, pricing, iniciação de pagamento) | Ausente do Radar. Pesquisa: só 7% dos bancos extraem benefício significativo; dados usados sobretudo em CRM (51%) e pouco em crédito (7%) (Vol. 2, p. 55–56). | O Open Finance Brasil registrava 208,79 milhões de consentimentos ativos (31/07/2026), 129,78 milhões de PF com consentimento de transmissão e 7,14 bilhões de chamadas de API de dados abertos. [BCB (Brasil), 2026-08-27](https://www.letsmoney.com.br/noticias/open-finance-208-milhoes-consentimentos-governanca/); Em 2025, ajudou >32 mi de clientes a compartilhar dados com >15 mil apps; APIs de dados recebem ~2 bi de chamadas/mês (>700/s); defende acordos comerciais com agregadores. [JPMorgan Chase, 2026-04](https://www.jpmorganchase.com/content/dam/jpmc/jpmorgan-chase-and-co/investor-relations/documents/annualreport-2025.pdf); O ecossistema Account Aggregator superou 500 milhões de consentimentos atendidos, 2,8 bilhões de contas habilitadas e ₹3,82 lakh crore em crédito no FY26; RBI reconheceu a Sahamati como SRO em jun/2026. [RBI/Sahamati (Índia), 2026-09-02](https://sahamati.org.in/?p=1274421) | OpenAlex 227→502 (2022→2025; 1,5x normalizado); GitHub 262 repos novos em 2026 (2,34x normalizado vs 2025) | **ausente no radar** | 208 milhões de consentimentos e quase nenhum uso em crédito. Quem transformar esse dado em limite e preço ganha cliente do concorrente. |
| L38 | Modernização de core e saída do mainframe com IA | Ausente do Radar (aparece só como 'integrar legados via MCPs/APIs', Estudo p. 33). Pesquisa: core banking 62% não migrado para cloud e 21% migrado (Vol. 2, p. 27); legado é a principal barreira à inovação (p. 47). | Itaú roda mais de 70% dos serviços de negócio na AWS e planeja aposentar o mainframe e sair totalmente do data center até o fim de 2028, usando AWS Transform/Kiro (descoberta de aplicações de 3 meses para 2 semanas; ~75% menos tempo de migração por aplicação). [Itaú Unibanco, 2026](https://aws.amazon.com/solutions/case-studies/itau-aws-transform-mainframe/); Stylus Workspaces chega a >180 mil pessoas, >65 mi de interações com IA desde dez/2024 e adoção >87%; Devin remapeou 30+ anos de código legado em 2 dias. [Citigroup, 2026-09-22](https://www.citigroup.com/global/news/perspectives/2026/competitive-differentiator-david-griffiths-building-worlds-most-ai-empowered-financial-institution); A ferramenta interna DevGen.AI revisou cerca de 9 milhões de linhas de código legado e poupou cerca de 280 mil horas de 15 mil desenvolvedores. [Morgan Stanley, 2025-06-03](https://www.entrepreneur.com/business-news/morgan-stanley-builds-ai-tool-that-fixes-major-coding-issue/492697) | OpenAlex 55→199 (2022→2025; 2,46x normalizado); GitHub 241 repos novos em 2026 (2,54x normalizado vs 2025) | **ausente no radar** | A IA mudou a economia da migração (descoberta e tradução de código). É a alavanca de custo e de velocidade mais visível nos líderes. |
| L39 | Modelos fundacionais de transações (dados próprios) | Ausente como tema. O Radar fala de modelos fundacionais em geral; a Tese 1 pede 'bases de dados proprietárias' (Estudo, p. 34). | O modelo fundacional proprietário NuFormer (autossupervisionado, treinado em mais de uma década de transações de 100+ milhões de clientes) está em produção em cartão no Brasil e México e crédito pessoal no Brasil; a nova versão quadruplicou contexto e velocidade de treino/inferência. [Nubank (Nu Holdings), 2026-08-13](https://nu.com/en/newsroom/company/nu-holdings-ltd-reports-second-quarter-2026-financial-results); Revolut Research e NVIDIA publicaram o PRAGMA, modelo fundacional bancário (até 1B parâmetros) treinado em 26 milhões de históricos de usuários (~24 bilhões de eventos, 111 países). [Revolut, 2026-04](https://philippdubach.com/posts/inside-pragma-revoluts-foundation-model-for-banking/index.md); CBA lançou a 'AI Factory' na AWS para treinar e ajustar modelos com dados proprietários, rodando um modelo de deep learning sobre 3 trilhões de pontos de dados de 4 bilhões de transações; o assistente GenAI para gerentes PJ respondeu mais de 250 mil perguntas. [Commonwealth Bank of Australia (CBA), 2025-09](https://www.commbank.com.au/content/dam/commbank-assets/investors/2025-09/annual-review-2025.pdf) | OpenAlex 7→65 (2022→2025; 6,31x normalizado); GitHub 23 repos novos em 2026 (2,67x normalizado vs 2025) | **ausente no radar** | É a maior vantagem de quem tem histórico longo de transações. Neobancos já operam isso em crédito e cartões. |
| L40 | Golpes autorizados (APP), contas-mula e verificação de recebedor | Ausente como tecnologia. O Radar trata fraude em geral; a Tese 6 cita deepfakes e fraude sintética (Estudo, p. 34). | O NameCheck evitou mais de A$880 milhões em pagamentos equivocados e golpes desde 2023; as perdas de clientes com fraude e golpes caíram mais de 30% no FY25. [Commonwealth Bank of Australia (CBA), 2025-09](https://www.commbank.com.au/content/dam/commbank-assets/investors/2025-09/annual-review-2025.pdf); O Projeto Hertha mostrou que analytics de sistemas de pagamento ajudam bancos a achar 12% mais contas ilícitas, e 26% mais em comportamentos inéditos. [BIS Innovation Hub – London Centre, 2025-06-05](https://www.bis.org/project/hertha); O MED 2.0 tornou-se obrigatório em 02/02/2026: rastreia recursos por contas intermediárias, permite contestação pelo app sem contato humano e bloqueio por até 11 dias; base na Resolução BCB 493/2025. [BCB (Brasil), 2026-02-02](https://agenciabrasil.ebc.com.br/economia/noticia/2026-02/novas-regras-de-seguranca-do-pix-entram-em-vigor-veja-mudancas) | OpenAlex 118→338 (2022→2025; 1,94x normalizado); GitHub 4088 repos novos em 2026 (3,99x normalizado vs 2025) | **ausente no radar** | Com pagamento instantâneo, a perda migra para o golpe que o cliente autoriza. Detectar a conta-mula no recebimento é o controle mais barato. |
| L41 | Medição de valor (ROI) de dados e IA | Ausente do Radar. Pesquisa: só 8% medem inovação por aumento de receita e 42% por ROI (Vol. 2, p. 47); o Estudo pede 'casos com ROI mensurável' (p. 33). | DBS atribuiu valor econômico de cerca de SGD 1 bilhão em 2025 às iniciativas de dados/IA/ML, com mais de 2.000 modelos em mais de 430 casos de uso. [DBS, 2026-02](https://www.dbs.com/annualreports/2025/letter-from-chairman-ceo.html); Meta de >€1 bi de valor de negócio com IA em 2026–2028; €35 mi no 1T26 e >€200 mi esperados em 2026; acesso a IA para todos os 185 mil funcionários. [Banco Santander, 2026-06-22](https://www.santander.com/en/stories/santander-turns-its-ai-first-strategy-into-measurable-impact-and-extends-ai-access-to-all-185000-employees); GenAI gerou ~£50 mi de valor em 2025 (>50 soluções) e o banco espera >£100 mi em 2026, escalando IA agêntica. [Lloyds Banking Group, 2026-01-29](https://fstech.co.uk/fst/Lloyds_Banking_Group_Targets_100m_AI_Value.php) | — | **ausente no radar** | Os líderes publicam valor em moeda. Sem medição, o orçamento de IA vira custo e não decisão. |
| L42 | Risco climático e dados geoespaciais no crédito | Ausente do Radar (Green Tech é genérico). | O Projeto Danu criou um gêmeo digital de risco climático que integra 17 fontes de dados ambientais e de ativos. [BIS Innovation Hub – Hong Kong Centre, 2026-11-24](https://www.bis.org/project/danu); CRISK mede a exposição de bancos a risco climático. [Jung, Engle e Berner, 2025](https://doi.org/10.1016/j.jfineco.2025.104076) | OpenAlex 15→114 (2022→2025; 5,16x normalizado); GitHub 2301 repos novos em 2026 (2,13x normalizado vs 2025) | **ausente no radar** | Para banco com carteira agro, clima é o principal motor de inadimplência. Dado público (satélite, chuva) já permite monitor por município. |
| L43 | FinOps de IA, soberania e risco de concentração de provedores | Ausente como tecnologia; o Estudo cita 'disciplina de custos' e '63% usam foundation models externos' (p. 32). Pesquisa: 50% monitoram concentração e só 33% têm plano de saída (Vol. 2, p. 25). | Com NVIDIA, custo por interação de atendimento caiu de ~€5 para ~€0,03 em casos experimentais (corte >50% em um deployment). [Banco Santander, 2026-10-19](https://www.santander.com/en/press-room/press-releases/2026/10/santander-builds-ai-capabilities-that-improve-performance-and-lower-costs-using-nvidia-ai-infrastructure); CMN e BC publicaram em dez/2025 a Resolução CMN 5.274 e a Resolução BCB 538, endurecendo requisitos de segurança cibernética, contratação de nuvem e conexão à RSFN (Pix/STR), com adequação até 01/03/2026. [BCB (Brasil), 2025-12](https://www.machadomeyer.com.br/pt/inteligencia-juridica/publicacoes-ij/direito-digital/bcb-novas-regras-para-aumentar-a-ciberseguranca-do-sfn-e-do-spb); Desde abril de 2024 o Bradesco usa plataforma proprietária de GenAI (Bridge) sobre arquitetura multinuvem, centralizando curadoria de modelos e guardrails. [Bradesco, 2025-10-27](https://www.bloomberglinea.com.br/negocios/ia-generativa-resolve-82-dos-atendimentos-iniciais-no-bradesco-diz-diretora/?outputType=amp) | — | **ausente no radar** | Custo de inferência cresce antes do retorno. Plataforma multi-modelo e plano de saída viraram exigência de resiliência. |
| L44 | Dados sintéticos para modelos e testes | Ausente do Radar. | A FCA, o Alan Turing Institute, a Plenitude e a Napier AI criaram um dataset sintético de AML a partir de dados reais de varejo bancário do Reino Unido. [FCA (Reino Unido) – AI Lab, 2026-04-15](https://www.fca.org.uk/publications/research-notes/research-note-synthetic-data-anti-money-laundering-project-report) | OpenAlex 114→539 (2022→2025; 3,21x normalizado); GitHub 310 repos novos em 2026 (3,6x normalizado vs 2025) | **ausente no radar** | Permite treinar e testar antifraude e PLD sem expor cliente, e compartilhar com parceiros e reguladores. |
| L45 | Plataforma e qualidade de dados (dados como produto) | Ausente como tema; 'dados de qualidade e interoperabilidade' aparece só como habilitador (Estudo, p. 33). | Plataforma única de dados e IA (ADA) 100% em nuvem AWS: 8,4 PB, >30 mil datasets, >100 mil tarefas/dia, 7.500 profissionais de dados e 40 mil usuários de negócio. [BBVA, 2026-01-12](https://www.bbva.com/en/innovation/bbva-completes-its-global-move-to-the-cloud-with-a-single-data-and-artificial-intelligence-platform/); A plataforma de dados ADA reduziu o ciclo de implantação de modelos para 7 a 10 semanas e o tempo de deploy de código em 25%; mais de 85% dos testes de regressão são automatizados; meta 2026 é stack totalmente cloud-optimised e 'Agentic AI enablement'. [DBS, 2026-02](https://www.dbs.com/annualreports/2025/cio-statement.html); Investiu US$1,5 bi em dados nos últimos cinco anos. [Bank of America, 2025-11-05](https://fortune.com/2025/11/05/bank-of-america-prioritizes-bigger-ai-initiatives-as-annual-spending-on-new-tech-increased-by-44-over-the-past-decade) | OpenAlex 147→643 (2022→2025; 2,97x normalizado); GitHub 1258 repos novos em 2026 (1,58x normalizado vs 2025) | **ausente no radar** | Todos os casos de IA com número citados acima rodam sobre uma plataforma única de dados. Sem ela, não há escala. |

Evidências adicionais por lacuna (até 7 por linha) estão no JSON, em `lacunas[].mundo`.

## 4. As 10 maiores lacunas

Critério: relevância para um grande banco brasileiro × força da evidência × distância da posição Febraban.

| Ficha | Lacuna | Veredito | Em uma frase |
|---|---|---|---|
| F01 | Pagamentos agênticos com Pix e cartão (L06) | Febraban atrasado | Agentes de IA começam a comprar e pagar pelo cliente. |
| F02 | Inventário criptográfico e migração pós-quântica (L14, L15) | Febraban atrasado | Dados cifrados hoje podem ser decifrados no futuro ('colha agora, decifre depois'). |
| F03 | Golpe autorizado e conta-mula no Pix (L40, L11, L08) | Febraban atrasado / ausente no radar | Com pagamento instantâneo, a perda migra para o golpe que o próprio cliente autoriza. |
| F04 | Saída do mainframe com IA (L38) | ausente no radar | O legado é a principal barreira para escalar inovação (Pesquisa Febraban 2026, Vol. 2, p. 47). |
| F05 | Modelo fundacional de transações (L39) | ausente no radar | Modelos de crédito, fraude e oferta são treinados um a um, com features feitas à mão. |
| F06 | Depósito tokenizado e resposta às stablecoins (L30, L33) | Febraban atrasado / Febraban superestima | Stablecoins reguladas e depósitos tokenizados mudam liquidação, câmbio e captação. |
| F07 | Open Finance para crédito e preço (L37) | ausente no radar | O Brasil tem centenas de milhões de consentimentos, mas só 7% dos bancos extraem benefício significativo e quase ninguém usa os dados em crédito. |
| F08 | Medir o valor de dados e IA (L41) | ausente no radar | Os líderes publicam valor de IA em moeda; o setor brasileiro mede pouco (8% por receita). |
| F09 | Seguro paramétrico e risco climático no crédito agro (L35, L42) | Febraban atrasado / ausente no radar | Seca e calor elevam a inadimplência rural. |
| F10 | Controles de segurança para agentes de IA (L13) | Febraban atrasado | Agentes com acesso a dados e a sistemas podem ser desviados por prompt injection. |

## 5. Fichas de aplicação

Modelo de `estrategia/bb/05-panoramas.md` §4. Premissas são hipóteses a testar com dado público e, depois, com dado interno. Onde há 'X', o limiar será fixado na proposta.

### F01. Pagamentos agênticos com Pix e cartão

```yaml
lacunas: [L06]
problema: "Agentes de IA começam a comprar e pagar pelo cliente. O banco que não for 'descobrível' e autorizável por agentes perde o checkout e o dado da compra."
tecnica: "Mandatos assinados (intenção e carrinho) com credencial verificável, limites delegados por agente, token de pagamento por agente e trilha auditável (AP2/A2A, MCP)."
evidencia:
  - fonte: "Ant Group (Alipay, MYbank) — Business Wire – Alipay AI Payment exceeds 120 million transactions in one week"
    ano: 2026
    resultado_reportado: "O AI Pay do Alipay (pagamento por agentes de IA via voz/apps) processou mais de 120 milhões de transações em uma semana (5–11/fev/2026) e passou de 100 milhões de usuários."
    dado_usado: "transações do Alipay"
    link: https://www.businesswire.com/news/home/20260213770962/en/Alipay-AI-Payment-Exceeds-120-Million-Transactions-in-One-Week-as-Agentic-Commerce-Accelerates-in-China
  - fonte: "Ant Group (Alipay, MYbank) — The Standard (HK) – Ant Group 2025 R&D"
    ano: 2026
    resultado_reportado: "Até maio/2026 foram concluídos 300 milhões de pagamentos feitos por agentes de IA no Alipay, que tem ~1 bilhão de usuários."
    dado_usado: "transações do Alipay"
    link: https://www.thestandard.com.hk/finance/article/334961/Ant-Group-logs-record-35-billion-yuan-in-RD-in-2025-over-10-percent-of-revenue
  - fonte: "Nubank (Nu Holdings) — Mobile Time – Pix com IA do Nubank chega a 10 milhões"
    ano: 2026
    resultado_reportado: "No 1T26, 10 milhões de clientes ativos mensais usavam Pix com IA e 15 milhões usavam funcionalidades do 'AI Private Banker'; produtividade de engenharia subiu 50% a/a e consumo de tokens cresceu 10x desde jan/2026."
    dado_usado: "base de clientes Nubank"
    link: https://www.mobiletime.com.br/noticias/14/05/2026/pix-ia-nubank-10-mi/
  - fonte: "Google Cloud — AP2"
    ano: 2025
    resultado_reportado: "Protocolo aberto com 60+ organizações; aceita cartão, transferência instantânea e stablecoin."
    dado_usado: "especificação"
    link: https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol
    link_do_codigo: https://github.com/google-agentic-commerce/AP2
aplicacao_aqui: "Piloto de Pix e cartão iniciados por agente para clientes PF e PJ, com limite por agente, revogação no app e contestação própria para pagamento delegado."
premissa: "Clientes usam pagamento delegado a agente com taxa de fraude e contestação não maior que a do Pix comum (razão ≤ 1,0) e conversão maior que o fluxo manual."
como_medir_aqui: "Teste A/B em público restrito: conversão, ticket, fraude por mil transações, contestações e tempo de resolução, 90 dias."
retorno: "→ proposta a abrir (prop-AAAA-NN)"
```

### F02. Inventário criptográfico e migração pós-quântica

```yaml
lacunas: [L14, L15]
problema: "Dados cifrados hoje podem ser decifrados no futuro ('colha agora, decifre depois'). A migração leva de 5 a 10 anos em ambiente bancário complexo (Estudo Febraban 2026, p. 32)."
tecnica: "Inventário de ativos criptográficos (CBOM), classificação por exposição e vida útil do dado, arquitetura cripto-ágil e algoritmos padronizados (ML-KEM, ML-DSA) em modo híbrido."
evidencia:
  - fonte: "BIS Innovation Hub – Eurosystem Centre (Frankfurt/Paris) — BIS Innovation Hub – Eurosystem Centre (Frankfurt/Paris)"
    ano: 2025
    resultado_reportado: "A fase 2 do Projeto Leap confirmou ser viável migrar um sistema de pagamento operacional para criptografia pós-quântica, mas com aumento relevante do tempo de processamento."
    dado_usado: "sistema de pagamento operacional do Eurosistema"
    link: https://www.bis.org/project/leap
  - fonte: "NIST — IR 8547 (final)"
    ano: 2026
    resultado_reportado: "Plano de transição para criptografia pós-quântica publicado em versão final."
    dado_usado: "norma"
    link: https://csrc.nist.gov/pubs/ir/8547/final
    link_do_codigo: https://github.com/open-quantum-safe/liboqs
  - fonte: "JPMorgan Chase — J.P. Morgan – Firm establishes quantum-secured crypto-agile network"
    ano: 2024
    resultado_reportado: "Opera rede 'quantum-secured crypto-agile' (Q-CAN) com QKD protegendo VPNs em fibra de 100 Gbps entre data centers; estratégia dupla PQC + QKD."
    dado_usado: "divulgação do próprio banco"
    link: https://www.jpmorgan.com/technology/news/firm-establishes-quantum-secured-crypto-agile-network
  - fonte: "Itaú Unibanco — Baguete – Itaú aposta em computação quântica"
    ano: 2026
    resultado_reportado: "O ICTi do Itaú (~100 pesquisadores) faz inventário criptográfico e mapeamento de vulnerabilidades para adotar protocolos pós-quânticos e pesquisa computação quântica para otimização de portfólio e detecção de fraude; espera aplicações comerciais em 2028–29."
    dado_usado: "divulgação do próprio banco"
    link: https://www.baguete.com.br/noticias/itau-aposta-em-computacao-quantica
aplicacao_aqui: "Programa de cripto-agilidade: CBOM dos sistemas de pagamento e canais, prioridade por dado de vida longa (contratos, crédito rural de longo prazo), piloto híbrido em um canal."
premissa: "Um inventário automatizado cobre ≥ 90% dos usos de criptografia dos sistemas críticos em 6 meses, e o modo híbrido adiciona latência ≤ 10% no canal piloto."
como_medir_aqui: "Cobertura do CBOM (% de sistemas e chaves catalogados), % de tráfego em TLS híbrido, latência p95 antes e depois, número de dependências de fornecedor sem roteiro PQC."
retorno: "→ proposta a abrir (prop-AAAA-NN)"
```

### F03. Golpe autorizado e conta-mula no Pix

```yaml
lacunas: [L40, L11, L08]
problema: "Com pagamento instantâneo, a perda migra para o golpe que o próprio cliente autoriza. O dinheiro passa por contas-mula em minutos."
tecnica: "Grafo de transações com GNN para achar contas-mula no recebimento, verificação de nome do recebedor antes do envio, pausas com fricção calibrada por risco e compartilhamento de sinais entre bancos sob privacidade (análise federada)."
evidencia:
  - fonte: "BIS Innovation Hub – London Centre — BIS Innovation Hub – London Centre"
    ano: 2025
    resultado_reportado: "O Projeto Hertha mostrou que analytics de sistemas de pagamento ajudam bancos a achar 12% mais contas ilícitas, e 26% mais em comportamentos inéditos."
    dado_usado: "dados de sistema de pagamento (simulação)"
    link: https://www.bis.org/project/hertha
  - fonte: "BIS Innovation Hub – Nordic Centre (Estocolmo) — BIS Innovation Hub – Nordic Centre (Estocolmo)"
    ano: 2025
    resultado_reportado: "O Projeto Aurora encontrou até 3 vezes mais lavagem de dinheiro e até 80% menos falsos positivos com IA e análise de rede colaborativa, frente a regras isoladas."
    dado_usado: "dados sintéticos de pagamentos"
    link: https://www.bis.org/project/aurora
  - fonte: "Commonwealth Bank of Australia (CBA) — CBA Annual Review 2025"
    ano: 2025
    resultado_reportado: "O NameCheck evitou mais de A$880 milhões em pagamentos equivocados e golpes desde 2023; as perdas de clientes com fraude e golpes caíram mais de 30% no FY25."
    dado_usado: "divulgação do próprio banco"
    link: https://www.commbank.com.au/content/dam/commbank-assets/investors/2025-09/annual-review-2025.pdf
  - fonte: "Commonwealth Bank of Australia (CBA) — CommBank newsroom – Customer scam losses fall / Truyu"
    ano: 2025
    resultado_reportado: "CBA reportou queda de 76% nas perdas de clientes com golpes desde o pico (2S25 vs 1S23) e investimento de mais de A$900 milhões no FY25 contra fraude, golpes, crime financeiro e ciberameaças."
    dado_usado: "divulgação do próprio banco"
    link: https://www.commbank.com.au/content/commbank-neo/articles/newsroom/2025/08/commbank-customer-scam-losses-fall-truyu.html
  - fonte: "DBS — DBS Annual Report 2025 – CRO statement"
    ano: 2026
    resultado_reportado: "Em 2025 os 'scam saves' cresceram 35%, controles temporais no provisionamento de cartões em carteiras móveis cortaram 98% desses golpes e a extensão do monitoramento IA/ML ao varejo melhorou em 175% a detecção de maus atores."
    dado_usado: "divulgação do próprio banco"
    link: https://www.dbs.com/annualreports/2025/cro-statement.html
  - fonte: "Egressy et al. (IBM) — Multi-GNN"
    ano: 2024
    resultado_reportado: "GNN para multigrafos direcionados detecta padrões de lavagem melhor que GNN padrão em dados sintéticos de AML."
    dado_usado: "dados sintéticos IBM AML"
    link: https://github.com/IBM/Multi-GNN
    link_do_codigo: https://github.com/IBM/Multi-GNN
  - fonte: "BCB (Brasil) — Agência Brasil – Novas regras de segurança do Pix entram em vigor"
    ano: 2026
    resultado_reportado: "O MED 2.0 tornou-se obrigatório em 02/02/2026: rastreia recursos por contas intermediárias, permite contestação pelo app sem contato humano e bloqueio por até 11 dias; base na Resolução BCB 493/2025."
    dado_usado: "norma BCB"
    link: https://agenciabrasil.ebc.com.br/economia/noticia/2026-02/novas-regras-de-seguranca-do-pix-entram-em-vigor-veja-mudancas
aplicacao_aqui: "Modelo de risco do recebedor (conta-mula) no Pix de entrada, integrado ao MED 2.0; aviso de nome divergente e pausa curta em pagamentos de alto risco."
premissa: "Score de conta-mula no recebimento reduz em ≥ 20% o valor perdido com golpes autorizados sem elevar a taxa de abandono do Pix acima de 0,5 p.p."
como_medir_aqui: "Perda por golpe por mil transações, recuperação via MED, falsos positivos, abandono; desenho com grupo de controle por região ou por faixa de risco."
retorno: "→ proposta a abrir (prop-AAAA-NN)"
```

### F04. Saída do mainframe com IA

```yaml
lacunas: [L38]
problema: "O legado é a principal barreira para escalar inovação (Pesquisa Febraban 2026, Vol. 2, p. 47). Core banking segue 62% fora da nuvem no setor (p. 27)."
tecnica: "Agentes de engenharia para descoberta de aplicações, documentação e tradução de código (COBOL→Java), com testes gerados e equivalência verificada."
evidencia:
  - fonte: "Itaú Unibanco — AWS case study – Itaú Unibanco AWS Transform for mainframe"
    ano: 2026
    resultado_reportado: "Itaú roda mais de 70% dos serviços de negócio na AWS e planeja aposentar o mainframe e sair totalmente do data center até o fim de 2028, usando AWS Transform/Kiro (descoberta de aplicações de 3 meses para 2 semanas; ~75% menos tempo de migração por aplicação)."
    dado_usado: "divulgação do próprio banco"
    link: https://aws.amazon.com/solutions/case-studies/itau-aws-transform-mainframe/
  - fonte: "Itaú Unibanco — Baguete – Itaú usa agente de IA da Cognition"
    ano: 2026
    resultado_reportado: "Itaú usa o agente de engenharia Devin (Cognition) em todos os times de tecnologia, ~75% deles de forma autônoma: +30% de volume de entregas, migrações 6x mais rápidas, 70% dos alertas de segurança de análise estática resolvidos e cobertura de testes de ~50% para 90%+."
    dado_usado: "divulgação do próprio banco"
    link: https://www.baguete.com.br/public/noticias/itau-usa-agente-de-ia-da-cognition
  - fonte: "Citigroup — Citi Perspectives – David Griffiths: building the world's most AI-empowered financial institution"
    ano: 2026
    resultado_reportado: "Stylus Workspaces chega a >180 mil pessoas, >65 mi de interações com IA desde dez/2024 e adoção >87%; Devin remapeou 30+ anos de código legado em 2 dias."
    dado_usado: "divulgação do próprio banco"
    link: https://www.citigroup.com/global/news/perspectives/2026/competitive-differentiator-david-griffiths-building-worlds-most-ai-empowered-financial-institution
  - fonte: "Morgan Stanley — Morgan Stanley"
    ano: 2025
    resultado_reportado: "A ferramenta interna DevGen.AI revisou cerca de 9 milhões de linhas de código legado e poupou cerca de 280 mil horas de 15 mil desenvolvedores."
    dado_usado: "divulgação do próprio banco"
    link: https://www.entrepreneur.com/business-news/morgan-stanley-builds-ai-tool-that-fixes-major-coding-issue/492697
  - fonte: "Azure Samples — Legacy-Modernization-Agents"
    ano: 2025
    resultado_reportado: "Agentes de referência para modernização de COBOL."
    dado_usado: "código de exemplo"
    link: https://github.com/Azure-Samples/Legacy-Modernization-Agents
    link_do_codigo: https://github.com/Azure-Samples/Legacy-Modernization-Agents
  - fonte: "LLM4Code 2024 — COBOL→Java"
    ano: 2024
    resultado_reportado: "Tradução de COBOL de baixo recurso para Java correto e legível com refinamento."
    dado_usado: "código COBOL"
    link: https://doi.org/10.1145/3643795.3648388
aplicacao_aqui: "Piloto em um domínio de baixo risco (ex.: relatórios batch): descoberta automatizada, tradução, testes de equivalência e medição de tempo e defeitos."
premissa: "Com agentes, o tempo de descoberta e migração por aplicação cai ≥ 50% sem aumento de defeitos em produção."
como_medir_aqui: "Horas por aplicação migrada, defeitos pós-migração, cobertura de testes, MIPS desligados, custo mensal antes e depois."
retorno: "→ proposta a abrir (prop-AAAA-NN)"
```

### F05. Modelo fundacional de transações

```yaml
lacunas: [L39]
problema: "Modelos de crédito, fraude e oferta são treinados um a um, com features feitas à mão. Quem tem décadas de transações não usa essa vantagem."
tecnica: "Transformer autossupervisionado sobre sequências de transações tokenizadas, com embeddings reutilizados por vários modelos; alternativa leve com modelos fundacionais tabulares."
evidencia:
  - fonte: "Nubank (Nu Holdings) — Nu Holdings – Second Quarter 2026 Financial Results"
    ano: 2026
    resultado_reportado: "O modelo fundacional proprietário NuFormer (autossupervisionado, treinado em mais de uma década de transações de 100+ milhões de clientes) está em produção em cartão no Brasil e México e crédito pessoal no Brasil; a nova versão quadruplicou contexto e velocidade de treino/inferência."
    dado_usado: "divulgação do próprio banco"
    link: https://nu.com/en/newsroom/company/nu-holdings-ltd-reports-second-quarter-2026-financial-results
  - fonte: "Nubank – AI Core / pesquisa — Nubank – AI Core / pesquisa"
    ano: 2025
    resultado_reportado: "O Nubank publicou o nuFormer, modelo transformer autossupervisionado sobre sequências de transações, com ganhos em recomendação em larga escala."
    dado_usado: "transações de clientes Nubank"
    link: https://arxiv.org/abs/2507.23267
    link_do_codigo: https://arxiv.org/abs/2507.23267
  - fonte: "Revolut — arXiv 2604.08649 (resumo em philippdubach.com – Inside PRAGMA)"
    ano: 2026
    resultado_reportado: "Revolut Research e NVIDIA publicaram o PRAGMA, modelo fundacional bancário (até 1B parâmetros) treinado em 26 milhões de históricos de usuários (~24 bilhões de eventos, 111 países)."
    dado_usado: "divulgação do próprio banco"
    link: https://philippdubach.com/posts/inside-pragma-revoluts-foundation-model-for-banking/index.md
  - fonte: "Commonwealth Bank of Australia (CBA) — CBA Annual Review 2025"
    ano: 2025
    resultado_reportado: "CBA lançou a 'AI Factory' na AWS para treinar e ajustar modelos com dados proprietários, rodando um modelo de deep learning sobre 3 trilhões de pontos de dados de 4 bilhões de transações; o assistente GenAI para gerentes PJ respondeu mais de 250 mil perguntas."
    dado_usado: "divulgação do próprio banco"
    link: https://www.commbank.com.au/content/dam/commbank-assets/investors/2025-09/annual-review-2025.pdf
  - fonte: "NVIDIA — transaction-foundation-model"
    ano: 2026
    resultado_reportado: "Blueprint aberto para treinar modelo fundacional de transações."
    dado_usado: "dados de exemplo"
    link: https://github.com/NVIDIA-AI-Blueprints/transaction-foundation-model
    link_do_codigo: https://github.com/NVIDIA-AI-Blueprints/transaction-foundation-model
  - fonte: "Hollmann et al. — TabPFN"
    ano: 2025
    resultado_reportado: "Modelo fundacional tabular supera métodos ajustados em bases pequenas."
    dado_usado: "benchmarks tabulares públicos"
    link: https://doi.org/10.1038/s41586-024-08328-6
    link_do_codigo: https://github.com/PriorLabs/TabPFN
aplicacao_aqui: "Embeddings de transação para cartão e crédito PF; comparação com o modelo atual em uma carteira."
premissa: "Embeddings de transação somados ao modelo atual elevam o AUC/KS de crédito em ≥ 2 p.p. fora da amostra."
como_medir_aqui: "Validação fora do tempo (origem móvel), ganho de KS/AUC, estabilidade (PSI) e custo de treino e inferência."
retorno: "→ proposta a abrir (prop-AAAA-NN)"
```

### F06. Depósito tokenizado e resposta às stablecoins

```yaml
lacunas: [L30, L33]
problema: "Stablecoins reguladas e depósitos tokenizados mudam liquidação, câmbio e captação. O Drex não terá DLT na primeira entrega."
tecnica: "Depósito tokenizado em rede permissionada com liquidação 24/7, pagamentos condicionais (programáveis) e interoperabilidade com dinheiro de banco central tokenizado."
evidencia:
  - fonte: "JPMorgan Chase — J.P. Morgan Kinexys – JPM Coin goes live on Ethereum"
    ano: 2026
    resultado_reportado: "Kinexys acumula >US$4 tri processados e média de US$7 bi/dia; JPM Coin (JPMD), depósito tokenizado em USD, lançado na Base (nov/2025) e ativo na Ethereum (out/2026)."
    dado_usado: "divulgação do próprio banco"
    link: https://www.jpmorgan.com/payments/newsroom/jpm-coin-live-on-ethereum
  - fonte: "HSBC — HSBC US – HSBC expands Tokenized Deposit Service to the United States"
    ano: 2026
    resultado_reportado: "Tokenised Deposit Service ativo em HK, Singapura, Luxemburgo, Reino Unido e EUA (abr/2026) e EAU (jun/2026), para clientes corporativos/institucionais."
    dado_usado: "divulgação do próprio banco"
    link: https://www.about.us.hsbc.com/newsroom/press-releases/hsbc-expands-tokenized-deposit-service-to-the-united-states
  - fonte: "Citigroup — Citi Press Release – Citi Token Services expands to Japan and UAE"
    ano: 2026
    resultado_reportado: "Citi Token Services ativo em 7 mercados (EUA, Irlanda, HK, Singapura, Reino Unido, Japão, EAU), em USD e EUR; no Investor Day foi reportado volume próximo de US$1 bi/dia (dado reportado pela imprensa)."
    dado_usado: "divulgação do próprio banco"
    link: https://www.citigroup.com/global/news/press-release/2026/citi-token-services-expands-global-footprint-japan-united-arab-emirates
  - fonte: "BBVA — Ledger Insights – Qivalis stablecoin consortium secures Dutch EMI license"
    ano: 2026
    resultado_reportado: "Aderiu (12º membro) ao consórcio Qivalis de stablecoin em euro sob MiCAR; Qivalis obteve licença EMI do DNB em out/2026 e já reúne 37 bancos."
    dado_usado: "divulgação do próprio banco"
    link: https://www.ledgerinsights.com/qivalis-stablecoin-consortium-secures-dutch-emi-license/
  - fonte: "Hong Kong — Hong Kong"
    ano: 2026
    resultado_reportado: "O piloto EnsembleTX da HKMA passou a liquidar 24/7 depósitos tokenizados em dinheiro de banco central tokenizado, com 12 bancos e 20 empresas participantes."
    dado_usado: "liquidação interbancária HKMA"
    link: https://www.hkma.gov.hk/eng/news-and-media/press-releases/2026/11/20261102-5/
  - fonte: "BCE / Eurosistema (euro digital, Pontes, Appia) — BCE / Eurosistema (euro digital, Pontes, Appia)"
    ano: 2026
    resultado_reportado: "O Pontes entrou em operação em 21/09/2026, com implementação completa prevista até 2028; o Appia, ecossistema DLT de longo prazo, deve ter blueprint até 2028."
    dado_usado: "liquidação no Eurosistema"
    link: https://ecb.europa.eu/press/pr/date/2026/html/ecb.pr260921~e754847a7b.en.html
  - fonte: "BCB (Brasil) — Exame – Drex reduz uso de tecnologia blockchain e pode ter lançamento em 2026"
    ano: 2025
    resultado_reportado: "Em ago/2025 o BC anunciou que a próxima fase do Drex não usaria DLT, com primeira entrega prevista para 2026 focada em reconciliação de gravames para garantia de crédito."
    dado_usado: "comunicação do BC (via imprensa)"
    link: https://exame.com/future-of-money/drex-reduz-uso-de-tecnologia-blockchain-e-pode-ter-lancamento-em-2026
  - fonte: "BIS Bulletin — Stablecoins versus tokenised deposits"
    ano: 2023
    resultado_reportado: "Depósitos tokenizados preservam a singularidade da moeda; stablecoins não."
    dado_usado: "análise conceitual"
    link: https://openalex.org/W7113494319
aplicacao_aqui: "Caso PJ: pagamentos condicionais e tesouraria 24/7 entre empresas de um mesmo grupo e cadeia de fornecedores, com lastro em depósito."
premissa: "Clientes PJ com fluxo internacional ou de cadeia pagariam por liquidação 24/7 programável; volume potencial ≥ X% do fluxo de câmbio atual."
como_medir_aqui: "Entrevistas e teste de interesse com clientes PJ; volume de câmbio e pagamentos a fornecedores fora do horário; custo de conciliação evitado."
retorno: "→ proposta a abrir (prop-AAAA-NN)"
```

### F07. Open Finance para crédito e preço

```yaml
lacunas: [L37]
problema: "O Brasil tem centenas de milhões de consentimentos, mas só 7% dos bancos extraem benefício significativo e quase ninguém usa os dados em crédito."
tecnica: "Features de fluxo de caixa a partir de dados compartilhados (renda, gastos, saldo), modelo de crédito com e sem esses dados, e iniciação de pagamento para portabilidade."
evidencia:
  - fonte: "BCB (Brasil) — Let's Money (dados do dashboard Open Finance Brasil)"
    ano: 2026
    resultado_reportado: "O Open Finance Brasil registrava 208,79 milhões de consentimentos ativos (31/07/2026), 129,78 milhões de PF com consentimento de transmissão e 7,14 bilhões de chamadas de API de dados abertos."
    dado_usado: "dados do Open Finance Brasil"
    link: https://www.letsmoney.com.br/noticias/open-finance-208-milhoes-consentimentos-governanca/
  - fonte: "BCB (Brasil) — BCB – Relatório de Gestão do Pix 2023-2025"
    ano: 2026
    resultado_reportado: "Pix iniciados via APIs do Open Finance cresceram mais de 8x em 2025, de 7,4 milhões em 2024 para 64,5 milhões."
    dado_usado: "relatório de gestão do Pix"
    link: https://www.bcb.gov.br/content/estabilidadefinanceira/pix/relatorio_de_gestao_pix/relatorio_gestao_pix_2026.pdf
  - fonte: "JPMorgan Chase — JPMorganChase Annual Report 2025 – Carta do CCB"
    ano: 2026
    resultado_reportado: "Em 2025, ajudou >32 mi de clientes a compartilhar dados com >15 mil apps; APIs de dados recebem ~2 bi de chamadas/mês (>700/s); defende acordos comerciais com agregadores."
    dado_usado: "divulgação do próprio banco"
    link: https://www.jpmorganchase.com/content/dam/jpmc/jpmorgan-chase-and-co/investor-relations/documents/annualreport-2025.pdf
  - fonte: "RBI/Sahamati (Índia) — Sahamati – 5th AA Foundation Day press release"
    ano: 2026
    resultado_reportado: "O ecossistema Account Aggregator superou 500 milhões de consentimentos atendidos, 2,8 bilhões de contas habilitadas e ₹3,82 lakh crore em crédito no FY26; RBI reconheceu a Sahamati como SRO em jun/2026."
    dado_usado: "ecossistema indiano"
    link: https://sahamati.org.in/?p=1274421
  - fonte: "Babina et al. — JFE"
    ano: 2025
    resultado_reportado: "Open banking aumenta a entrada de fintechs."
    dado_usado: "painel de países"
    link: https://doi.org/10.1016/j.jfineco.2024.103950
  - fonte: "Journal of Risk and Financial Management"
    ano: 2023
    resultado_reportado: "Modelo de crédito com dados de open banking, explicado com SHAP."
    dado_usado: "dados de open banking (Noruega)"
    link: https://doi.org/10.3390/jrfm16040221
aplicacao_aqui: "Oferta de crédito pré-aprovado para não clientes que compartilham dados; preço por fluxo de caixa, não só por bureau."
premissa: "Dados de Open Finance elevam o KS do modelo de crédito PF em ≥ 3 p.p. para clientes de relacionamento curto."
como_medir_aqui: "Backtest com e sem dados compartilhados; taxa de aprovação e inadimplência 90 dias; custo por cliente adquirido."
retorno: "→ proposta a abrir (prop-AAAA-NN)"
```

### F08. Medir o valor de dados e IA

```yaml
lacunas: [L41]
problema: "Os líderes publicam valor de IA em moeda; o setor brasileiro mede pouco (8% por receita). Sem medida, a IA concorre com orçamento como custo."
tecnica: "Registro de casos de uso com linha de base, grupo de controle e atribuição; contabilidade de valor (receita, custo, perda evitada) revisada por finanças."
evidencia:
  - fonte: "DBS — DBS Annual Report 2025 – Letter from Chairman and CEO"
    ano: 2026
    resultado_reportado: "DBS atribuiu valor econômico de cerca de SGD 1 bilhão em 2025 às iniciativas de dados/IA/ML, com mais de 2.000 modelos em mais de 430 casos de uso."
    dado_usado: "divulgação do próprio banco"
    link: https://www.dbs.com/annualreports/2025/letter-from-chairman-ceo.html
  - fonte: "Banco Santander — Santander – AI-first strategy into measurable impact, AI access to all 185,000 employees"
    ano: 2026
    resultado_reportado: "Meta de >€1 bi de valor de negócio com IA em 2026–2028; €35 mi no 1T26 e >€200 mi esperados em 2026; acesso a IA para todos os 185 mil funcionários."
    dado_usado: "divulgação do próprio banco"
    link: https://www.santander.com/en/stories/santander-turns-its-ai-first-strategy-into-measurable-impact-and-extends-ai-access-to-all-185000-employees
  - fonte: "Lloyds Banking Group — FStech – Lloyds Banking Group targets £100m AI value"
    ano: 2026
    resultado_reportado: "GenAI gerou ~£50 mi de valor em 2025 (>50 soluções) e o banco espera >£100 mi em 2026, escalando IA agêntica."
    dado_usado: "divulgação do próprio banco"
    link: https://fstech.co.uk/fst/Lloyds_Banking_Group_Targets_100m_AI_Value.php
  - fonte: "Bradesco — Bloomberg Línea – IA generativa resolve 82% dos atendimentos iniciais no Bradesco"
    ano: 2025
    resultado_reportado: "A IA em cobrança, que analisa 18 mil ligações por dia, gerou mais de R$400 milhões em benefícios capturados em 2025; ganho de produtividade de 40% em tecnologia com o BIA Tech."
    dado_usado: "divulgação do próprio banco"
    link: https://www.bloomberglinea.com.br/negocios/ia-generativa-resolve-82-dos-atendimentos-iniciais-no-bradesco-diz-diretora/?outputType=amp
  - fonte: "Evident AI Index 2026 (cobertura)"
    ano: 2026
    resultado_reportado: "Só 12% dos casos de uso rastreados divulgam efeito em KPI; 12 de 50 bancos reportam retorno."
    dado_usado: "divulgações públicas de 50 bancos"
    link: https://www.euronews.com/2026/10/07/ubs-only-european-bank-in-top-10-of-ai-adoption-as-jpmorgan-chase-leads
  - fonte: "Cui et al. — Management Science"
    ano: 2026
    resultado_reportado: "Experimentos de campo medem ganho de produtividade de desenvolvedores com IA."
    dado_usado: "três empresas, experimento aleatorizado"
    link: https://doi.org/10.1287/mnsc.2025.00535
aplicacao_aqui: "Painel de valor de IA: cada caso com dono, métrica, linha de base e controle; fechamento trimestral com finanças."
premissa: "Ao menos 60% dos casos em produção conseguem uma métrica de valor com grupo de controle em 2 trimestres."
como_medir_aqui: "% de casos com medição causal, valor atribuído por trimestre, dispersão entre valor estimado e realizado."
retorno: "→ proposta a abrir (prop-AAAA-NN)"
```

### F09. Seguro paramétrico e risco climático no crédito agro

```yaml
lacunas: [L35, L42]
problema: "Seca e calor elevam a inadimplência rural. Renegociar depois custa mais que proteger antes."
tecnica: "Índice climático por município (chuva, seca, NDVI) para gatilho de seguro paramétrico e para limite e preço do crédito; monitor com dado público."
evidencia:
  - fonte: "Management Science (artigo sobre seguro por índice com rede neural)"
    ano: 2023
    resultado_reportado: "Seguro por índice com rede neural reduz risco de base frente a contratos lineares."
    dado_usado: "dados de clima e produtividade agrícola"
    link: https://doi.org/10.1287/mnsc.2023.4902
  - fonte: "BIS Innovation Hub – Hong Kong Centre — BIS Innovation Hub – Hong Kong Centre"
    ano: 2026
    resultado_reportado: "O Projeto Danu criou um gêmeo digital de risco climático que integra 17 fontes de dados ambientais e de ativos."
    dado_usado: "17 fontes de dados ambientais e de ativos"
    link: https://www.bis.org/project/danu
  - fonte: "Jung, Engle e Berner — JFE"
    ano: 2025
    resultado_reportado: "CRISK mede a exposição de bancos a risco climático."
    dado_usado: "preços de ações de bancos"
    link: https://doi.org/10.1016/j.jfineco.2025.104076
aplicacao_aqui: "Crédito de custeio com proteção paramétrica embutida em regiões de maior risco de seca; preço ajustado por índice climático."
premissa: "Um índice de seca por município explica parte relevante da inadimplência rural (ganho sobre o modelo ingênuo ≥ X%) e o gatilho paramétrico reduz a perda líquida da carteira."
como_medir_aqui: "Previsão fora da amostra com origem móvel por safra; perda esperada com e sem proteção; risco de base medido contra produtividade observada."
retorno: "→ proposta a abrir (prop-AAAA-NN)"
```

### F10. Controles de segurança para agentes de IA

```yaml
lacunas: [L13]
problema: "Agentes com acesso a dados e a sistemas podem ser desviados por prompt injection. Só 30% dos bancos fazem red teaming de LLM (Pesquisa 2026, Vol. 2, p. 26)."
tecnica: "Inventário de agentes, privilégio mínimo por ferramenta, controle de fluxo de informação, red teaming contínuo com benchmarks abertos e controles comuns do setor."
evidencia:
  - fonte: "Debenedetti et al. — AgentDojo (NeurIPS)"
    ano: 2024
    resultado_reportado: "Ambiente para medir ataques e defesas de prompt injection em agentes."
    dado_usado: "tarefas de agentes simuladas"
    link: https://doi.org/10.52202/079017-2636
    link_do_codigo: https://github.com/ethz-spylab/agentdojo
  - fonte: "FINOS (Fintech Open Source Foundation / Linux Foundation) — FINOS (Fintech Open Source Foundation / Linux Foundation)"
    ano: 2025
    resultado_reportado: "A FINOS lançou o Common Controls for AI Services com BMO, Citi, Morgan Stanley, RBC e Bank of America, além de Microsoft, Google Cloud, AWS e Red Hat."
    dado_usado: "consórcio de bancos e nuvens"
    link: https://www.finos.org/press/global-financial-institutions-and-technology-leaders-collaborate-under-finos-to-launch-open-source-common-controls-for-ai-services
    link_do_codigo: https://github.com/finos/ai-governance-framework
  - fonte: "MAS (Singapura) — MAS (Singapura)"
    ano: 2026
    resultado_reportado: "O consórcio MindForge, com 24 bancos, seguradoras e outras empresas, publicou um kit de gestão de risco de IA que cobre IA tradicional, generativa e agêntica."
    dado_usado: "consórcio de 24 instituições"
    link: https://www.mas.gov.sg/news/media-releases/2026/mas-partners-industry-to-develop-ai-risk-management-toolkit-for-the-financial-sector
  - fonte: "MAS (Singapura) — MAS – Response to feedback on Guidelines on AI Risk Management"
    ano: 2026
    resultado_reportado: "As diretrizes finais de risco de IA do MAS foram publicadas com resposta à consulta, com implementação faseada (seções 3–4 a partir de out/2027)."
    dado_usado: "norma MAS"
    link: https://www.mas.gov.sg/-/media/mas-media-library/publications/consultations/bd/2025/response-to-feedback-received-on-guidelines-on-artificial-intelligence-risk-management.pdf
aplicacao_aqui: "Gate de produção para agentes: inventário, limite de autoridade, trilha e teste adversarial obrigatório antes de liberar ação com dinheiro."
premissa: "Um conjunto padrão de testes adversariais reduz a taxa de sucesso de ataques nos agentes internos para < 5% sem perder > 5 p.p. de utilidade."
como_medir_aqui: "Taxa de sucesso de ataque e utilidade no benchmark interno; incidentes por agente; % de agentes inventariados."
retorno: "→ proposta a abrir (prop-AAAA-NN)"
```

## 6. Como manter isto atualizado: proposta de temas e feeds

Proposta apenas. Nenhum tema foi criado e nenhum código foi alterado.

**O que o Research Watch já cobre hoje** (biblioteca e digests de `tecnologia-bancaria` e `fraude-bancaria`, contagem por termo em 28/11/2026):

| Termo | Itens na biblioteca tecnologia-bancaria | Dias de digest com o termo (de 11) | Itens em fraude-bancaria |
|---|---|---|---|
| pagamentos/comércio agêntico | 16 | 9 | 0 |
| criptografia pós-quântica | 0 | 0 | 0 |
| depósitos tokenizados | 3 | 1 | 0 |
| stablecoins | 14 | 2 | 1 |
| Drex/CBDC | 14 | 3 | 0 |
| golpes/contas-mula | 6 | 4 | 36 |
| core/mainframe/COBOL | 2 | 0 | 2 |
| modelo fundacional de transações | 5 | 3 | 3 |
| open finance | 11 | 5 | 2 |
| seguro paramétrico | 2 | 0 | 1 |
| dados sintéticos | 0 | 1 | 2 |
| deepfake | 0 | 0 | 12 |
| aprendizado federado | 3 | 1 | 8 |
| risco climático | 4 | 0 | 0 |

Lacunas de cobertura do próprio Research Watch: zero itens sobre criptografia pós-quântica nos dois temas; quase nada sobre core/mainframe, seguro paramétrico e risco climático; o tema `tecnologia-bancaria` não tem fontes de BIS, bancos centrais (MAS, HKMA, BCE, RBI) nem fontes da China ou da Índia (essas fontes regulatórias existem só em `fraude-bancaria`).

### P1. Novo tema: cripto-pós-quântica no setor financeiro

Lacunas L14–L15. Zero cobertura hoje. Padrões e prazos mudam por norma (NIST, UE, BIS) e por release de biblioteca.

```json
{
  "slug": "pqc-financeiro",
  "name": "Post-Quantum Finance Watch",
  "prefilter_keywords": "post-quantum|pós-quântic|pqc|quantum-safe|crypto-agil|cripto-ágil|ml-kem|ml-dsa|kyber|dilithium|cbom|harvest now|q-day|qkd",
  "themes": {
    "standards": "Normas e prazos (NIST, UE, BCB)",
    "migration": "Inventário (CBOM) e migração",
    "payments": "PQC em pagamentos e mensageria",
    "quantum_threat": "Estado da ameaça quântica"
  },
  "openalex": {
    "queries": [
      "(\"post-quantum\" OR \"quantum-safe\" OR \"crypto-agility\") AND (bank OR banking OR financial OR payment)",
      "(\"ML-KEM\" OR Kyber OR \"ML-DSA\" OR Dilithium) AND (performance OR migration OR TLS OR \"hybrid\")",
      "(\"cryptographic inventory\" OR CBOM OR \"cryptographic bill of materials\")"
    ]
  },
  "arxiv": {
    "query": "cat:cs.CR AND (abs:\"post-quantum\" OR abs:\"crypto-agility\" OR abs:\"ML-KEM\")"
  },
  "sources": [
    {
      "name": "NIST CSRC — notícias",
      "kind": "page",
      "url": "https://csrc.nist.gov/news",
      "pattern": "post-quantum|PQC|8547|FIPS 20"
    },
    {
      "name": "liboqs (releases)",
      "kind": "rss",
      "url": "https://github.com/open-quantum-safe/liboqs/releases.atom"
    },
    {
      "name": "BIS Innovation Hub — projetos",
      "kind": "page",
      "url": "https://www.bis.org/about/bisih/projects.htm",
      "pattern": "leap|quantum"
    },
    {
      "name": "Comissão Europeia — roteiro PQC",
      "kind": "page",
      "url": "https://digital-strategy.ec.europa.eu/en/library/coordinated-implementation-roadmap-transition-post-quantum-cryptography"
    }
  ],
  "watch_signals": {
    "openalex_group_by_year": true,
    "github_search": "post-quantum cryptography"
  }
}
```

### P2. Novo tema: dinheiro tokenizado (depósitos tokenizados, stablecoins, dinheiro de banco central)

Lacunas L30 e L33. Muda por anúncio de regulador e de consórcio, não por paper. Hoje há 3 itens sobre depósitos tokenizados na biblioteca.

```json
{
  "slug": "dinheiro-tokenizado",
  "name": "Tokenized Money Watch",
  "prefilter_keywords": "tokeni|deposit token|depósito tokenizado|stablecoin|cbdc|drex|wholesale|unified ledger|kinexys|ensemble|pontes|agorá|agora|guardian|qivalis",
  "openalex": {
    "queries": [
      "\"tokenized deposits\" OR \"tokenised deposits\" OR \"deposit tokens\" OR \"tokenised money\" OR \"unified ledger\"",
      "stablecoin AND (bank OR deposits OR \"monetary policy\" OR regulation)"
    ]
  },
  "sources": [
    {
      "name": "BCE — press releases",
      "kind": "page",
      "url": "https://www.ecb.europa.eu/press/pr/html/index.en.html",
      "pattern": "tokeni|Pontes|Appia|digital euro"
    },
    {
      "name": "HKMA — press releases",
      "kind": "page",
      "url": "https://www.hkma.gov.hk/eng/news-and-media/press-releases/",
      "pattern": "Ensemble|tokeni|stablecoin"
    },
    {
      "name": "MAS — notícias",
      "kind": "page",
      "url": "https://www.mas.gov.sg/news",
      "pattern": "Guardian|BLOOM|tokeni"
    },
    {
      "name": "BIS Innovation Hub — projetos",
      "kind": "page",
      "url": "https://www.bis.org/about/bisih/projects.htm"
    },
    {
      "name": "BCB — Drex",
      "kind": "page",
      "url": "https://www.bcb.gov.br/estabilidadefinanceira/drex"
    },
    {
      "name": "J.P. Morgan Payments — newsroom (Kinexys)",
      "kind": "page",
      "url": "https://www.jpmorgan.com/payments/newsroom"
    },
    {
      "name": "Ledger Insights",
      "kind": "rss",
      "url": "https://www.ledgerinsights.com/feed/",
      "_doc": "feed a confirmar"
    }
  ]
}
```

### P3. Ampliar `tecnologia-bancaria`: buscas e fontes para as lacunas ausentes

Lacunas L06, L38, L39, L41, L43 e L45. O tema já tem 'comércio agêntico' e 'modelos fundacionais', mas não acompanha protocolos, modernização de core nem medição de valor.

```json
{
  "openalex": {
    "queries_novas": [
      "\"agentic commerce\" OR \"agentic payments\" OR \"agent payments protocol\" OR (\"AI agents\" AND (mandate OR checkout OR \"payment authorization\"))",
      "(COBOL OR mainframe OR \"legacy code\") AND (\"large language model\" OR LLM OR \"code translation\" OR modernization)",
      "(\"foundation model\" OR \"self-supervised\" OR transformer) AND (\"transaction data\" OR \"transaction sequences\" OR \"card transactions\")",
      "\"tabular foundation model\" OR TabPFN OR \"time series foundation model\"",
      "(\"return on investment\" OR \"business value\" OR \"field experiment\") AND (\"generative AI\" OR \"machine learning\") AND (bank OR banking)",
      "(\"inference cost\" OR FinOps OR \"model routing\" OR \"small language model\") AND (enterprise OR bank OR \"financial services\")"
    ]
  },
  "themes_novos": {
    "core_modernization": "🧱 Modernização de core e saída do mainframe",
    "ai_value": "📏 Medição de valor de IA",
    "ai_finops": "💸 Custo e soberania de modelos"
  },
  "sources_novas": [
    {
      "name": "AP2 (releases)",
      "kind": "rss",
      "url": "https://github.com/google-agentic-commerce/AP2/releases.atom"
    },
    {
      "name": "a2a-x402 (releases)",
      "kind": "rss",
      "url": "https://github.com/google-agentic-commerce/a2a-x402/releases.atom"
    },
    {
      "name": "NVIDIA transaction-foundation-model (commits)",
      "kind": "rss",
      "url": "https://github.com/NVIDIA-AI-Blueprints/transaction-foundation-model/commits.atom"
    },
    {
      "name": "BIS Innovation Hub — projetos",
      "kind": "page",
      "url": "https://www.bis.org/about/bisih/projects.htm"
    },
    {
      "name": "MAS — notícias",
      "kind": "page",
      "url": "https://www.mas.gov.sg/news"
    },
    {
      "name": "Evident AI Index",
      "kind": "page",
      "url": "https://evidentinsights.com/ai-index/"
    },
    {
      "name": "Ant Group — notícias",
      "kind": "page",
      "url": "https://www.antgroup.com/en/news-media",
      "_doc": "URL e padrão a confirmar"
    },
    {
      "name": "NPCI — estatísticas UPI",
      "kind": "page",
      "url": "https://www.npci.org.in/what-we-do/upi/product-statistics"
    }
  ]
}
```

### P4. Ampliar `fraude-bancaria`: golpe autorizado, conta-mula e verificação de recebedor

Lacuna L40. O tema tem 36 itens sobre golpes e 18 sobre mulas, mas não acompanha os projetos de banco central e as normas de reembolso e verificação.

```json
{
  "openalex": {
    "queries_novas": [
      "\"money mule\" OR \"mule accounts\" OR \"mule detection\"",
      "(\"authorized push payment\" OR \"authorised push payment\" OR \"APP fraud\" OR \"confirmation of payee\" OR \"verification of payee\")",
      "(\"graph neural network\" OR \"network analytics\") AND (\"money laundering\" OR mule OR \"payment fraud\")"
    ]
  },
  "sources_novas": [
    {
      "name": "BIS Innovation Hub — projetos (Hertha, Aurora)",
      "kind": "page",
      "url": "https://www.bis.org/about/bisih/projects.htm",
      "pattern": "hertha|aurora|mandala"
    },
    {
      "name": "BCB — Pix (estatísticas e MED)",
      "kind": "page",
      "url": "https://www.bcb.gov.br/estabilidadefinanceira/pix"
    },
    {
      "name": "IBM Multi-GNN (commits)",
      "kind": "rss",
      "url": "https://github.com/IBM/Multi-GNN/commits.atom"
    }
  ]
}
```

### P5. Novo tema: risco climático e seguro paramétrico no crédito

Lacunas L35 (seguros paramétricos) e L42 (risco climático). Conversa com o laboratório rural (`data/rural/`) e o Panorama 1 (Atena).

```json
{
  "slug": "risco-climatico-credito",
  "name": "Climate Credit Risk Watch",
  "prefilter_keywords": "climate risk|risco climático|drought|seca|el niño|enso|parametric|paramétric|index insurance|crop|safra|ndvi|spei|chirps",
  "openalex": {
    "queries": [
      "(\"climate risk\" OR drought OR \"extreme weather\" OR ENSO) AND (\"loan default\" OR \"credit risk\" OR \"agricultural credit\" OR \"bank lending\")",
      "(\"parametric insurance\" OR \"index insurance\" OR \"index-based insurance\") AND (agriculture OR agricultural OR crop OR drought)"
    ]
  },
  "sources": [
    {
      "name": "BIS Innovation Hub — projetos (Danu, Gaia)",
      "kind": "page",
      "url": "https://www.bis.org/about/bisih/projects.htm",
      "pattern": "danu|gaia|climate"
    },
    {
      "name": "NGFS — publicações",
      "kind": "page",
      "url": "https://www.ngfs.net/en/publications-and-statistics/publications"
    },
    {
      "name": "CLIMADA (releases)",
      "kind": "rss",
      "url": "https://github.com/CLIMADA-project/climada_python/releases.atom"
    }
  ]
}
```

### P6. Monitor do próprio Radar Febraban (diff anual automático)

O portal traz os dados do Radar em JSON estruturado (`window.RADAR_DADOS`). Dá para comparar edições e reavaliar esta análise sem trabalho manual.

```json
{
  "job": "radar-febraban-diff",
  "frequencia": "semanal (HEAD com ETag/Last-Modified); GET só se mudar",
  "url": "https://tecemergentes.febraban.org.br/",
  "extrair": "objeto JSON após 'window.RADAR_DADOS = ' (ignorar blocos base64 de PDF)",
  "campos": [
    "slug",
    "titulo",
    "dominio",
    "maturidade",
    "impacto",
    "statusRotulo",
    "teses",
    "cases",
    "fontes"
  ],
  "saida": "data/febraban/radar/<edicao>.json + diff (novas, removidas, mudança de maturidade ou impacto)",
  "tambem": "Pesquisa de Tecnologia Bancária e Estudo (PDF) pelo mapa existente em docs/sources/febraban.json"
}
```

### P7. Barômetro mensal de sinais (pesquisa e código) por tema

Repete a seção 2.3 todo mês, com normalização, e acende alerta quando um tema ausente do Radar acelera.

```json
{
  "job": "barometro-sinais",
  "frequencia": "mensal",
  "openalex": "group_by=publication_year para cada busca de docs/research/radar-febraban-vs-mundo.json (sinais_pesquisa.temas[].openalex_query), mais o total de obras do período",
  "github": "search/repositories com created:<período> para cada github_query, mais o total de repositórios criados",
  "alerta": "crescimento normalizado ≥ 1,5x em 6 meses em tema com veredito 'ausente no radar' ou 'Febraban atrasado'",
  "custo_estimado": "~40 chamadas OpenAlex (≈ US$ 0,04) e ~200 chamadas GitHub por mês"
}
```

## 7. Método e limitações

- Febraban: lemos o HTML do portal do Radar (o objeto JSON `window.RADAR_DADOS`, 35 registros) e o texto dos três PDFs (pdftotext), com páginas citadas. Arquivos baixados em 28/11/2026 e mantidos fora do repositório.
- Bancos, reguladores e hubs: pesquisa web em 28/11/2026, priorizando relatório anual, investor day, release oficial e blog de engenharia. Cada fato tem URL e data. ‡ marca fato conferido só em resultado de busca.
- Pesquisa: OpenAlex API (busca em título e resumo, `group_by=publication_year`, com chave do projeto), 39 buscas booleanas; arXiv medido pelo OpenAlex restrito à fonte arXiv, porque a API do arXiv recusou por limite de taxa.
- Código: GitHub Search API (repositórios criados por ano até 27/11 e repositórios com 50+ estrelas e push desde 01/06/2026).
- Normalização: participação por milhão de obras (OpenAlex) ou de repositórios criados (GitHub) no mesmo período. Os totais crescem 32% (OpenAlex 2026 vs 2025) e 72% (GitHub) e distorcem qualquer crescimento bruto.
- Vereditos: julgamento do analista sobre a distância entre a classificação Febraban e a evidência, explicado linha a linha. Não são pontuação automática.
- Contagens por palavra-chave medem atenção, não qualidade. Há ruído em siglas (Pix, UPI, DeFi). As buscas estão no JSON para reprodução.
- 2026 é ano parcial. A comparação 2026/2025 subestima o ano cheio em cerca de 10%.
- Valores de IA publicados por bancos são autodeclarados e não conciliados com o resultado.
- Fatos posteriores a jun/2026 vieram de páginas lidas nesta pesquisa; alguns sites bloquearam leitura e ficaram marcados com ‡.
- O Drex tem calendário instável; a situação descrita é a da imprensa de ago–nov/2025 e de março/2026. Conferir na página oficial do BC antes de decidir.
- Marcos de prazo do roteiro europeu de PQC e do NIST IR 8547 não foram lidos no texto integral; citamos só a existência e a data dos documentos.
- Nenhum dado interno de banco foi usado. As premissas das fichas precisam ser testadas primeiro com dado público e depois com dado interno.

