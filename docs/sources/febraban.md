# FEBRABAN: mapa completo de publicações

Levantamento manual feito em **25/11/2026**. Cobre tudo o que a FEBRABAN publica e foi pensado para uma plataforma genérica de monitoramento de pesquisa bancária. Os temas **Bank Tech & AI Watch** (`topics/tecnologia-bancaria/`) e **Bank Fraud Watch** (`topics/fraude-bancaria/`) são só os primeiros casos de uso. Este documento mapeia as fontes; não traz scraper nem cópia de conteúdo. A versão para máquina está em [`febraban.json`](febraban.json): 74 itens, cada um com `subjects` (tags livres) e `priority` (`geral` para um watch bancário genérico, mais as prioridades dos dois temas).

Organização: §0 domínios; §1–§5 tecnologia, IA, ciber e fraude (o primeiro recorte); §6 mídia e institucional; **§6A–§6H os demais assuntos** (economia e crédito, regulação e posicionamentos, autorregulação e consumidor, ESG, inclusão e educação financeira, pagamentos e padrões, pessoas e trabalho, eventos); §7 como consumir.

Todas as URLs foram testadas com o User-Agent do projeto (`Mozilla/5.0 (compatible; people-analytics-watch/0.1; research digest)`). As datas de "última edição" vêm do próprio site, do release de imprensa ou do `Last-Modified` do PDF. A fonte de cada data está indicada.

O que já está mapeado e **não foi refeito aqui**: os eventos (Febraban Tech, Febraban SEC), que estão em `topics/tecnologia-bancaria/INVENTARIO.md`, e as fontes já monitoradas (YouTube `UCOWExcTuCxhqwRkyiu0z35w` e a página de notícias do portal). Comento as duas só onde há algo a corrigir (ver §8).

---

## 0. Estrutura dos domínios

| Domínio | O que é | Tecnologia | robots.txt | Observações para automação |
|---|---|---|---|---|
| `portal.febraban.org.br` (e `febraban.org.br`, `www.febraban.org.br`, que redirecionam para cá) | Portal institucional: releases, publicações, pesquisas, Lab de Cibersegurança, antifraude | ASP.NET MVC. As páginas `/pagina/{id}/{secao}/pt-br/{slug}` vêm com o conteúdo no HTML do servidor. As listagens usam endpoints JSON (`/Noticias/GetItems`, `/paginas/getitems`, `/FebrabanNews/PodGetItems`, `/FebrabanNews/VidGetItems`, `/Antifraude/PodGetItems`) | Bloqueia `/Busca/`, `/DetalheTech`, `/DetalheMeuBolso`, `/Noticias/GestaoNewsLetter`, `/en/`, `/en-us/` e parâmetros de rastreamento (`?utm_`, `?gclid`, `?s=`, `?ref=` etc.). Declara `Sitemap: /sitemap.xml` | O `sitemap.xml` é **estático e defasado**: 857 `<loc>`, notícias até o id 4280 (~abr/2025), sem `<lastmod>`, com URLs sujas. Não serve para descobrir novidades. **Não há RSS**: `/rss` e `/feed` devolvem 302 para a home |
| `cmsarquivos.febraban.org.br` | Repositório de arquivos (todos os PDFs do portal) | IIS/estático. A raiz responde 403 | Não tem (404) | Os PDFs são públicos e diretos, sem login. Padrão: `https://cmsarquivos.febraban.org.br/Arquivos/documentos/PDF/<nome livre>.pdf`. Os nomes são **livres e inconsistentes**, com espaços, acentos e às vezes acentos **NFD** (ex.: `Banca%CC%81ria` em vez de `Banc%C3%A1ria`). Normalize antes de deduplicar. Imagens ficam em `/Arquivos/imagens/` |
| `tecemergentes.febraban.org.br` | **Radar de Tecnologias**, o portal do Estudo de Tecnologias Emergentes (Febraban + Accenture) | Página estática única de **~28 MB** que traz embutidos as imagens (base64) e os 4 PDFs (blocos `<script data-arquivo="...">`) | Não tem (404). O sitemap também não existe (404) | Rótulo interno "v2.2 (2026-10-27)". `Last-Modified` 17/11/2026. O próprio site diz: "Publicação estática, atualizada por substituição do pacote", "sem cookies e sem integrações externas" |
| `febrabantech.febraban.org.br` (antiga plataforma **noomis**; `noomis.febraban.org.br` redireciona para cá) | Portal de conteúdo Febraban Tech: notícias, colunistas, temas, eventos | SPA Angular 7. O HTML do servidor só traz `<title>` e `og:description` (o texto do artigo não vem no HTML) | Bloqueia `/pesquisa?query=*`. Declara `sitemap.xml` (**502**), `sitemapnews.xml` (ok) e `podcast.xml` (ok, mas parado em 2022) | O **`sitemapnews.xml` é a única via estável**: é um news sitemap rolante, com título, data e palavras-chave. O bundle JS respondeu 500 ao nosso UA e não insisti. A API interna da SPA não foi mapeada |
| `febrabantech.com` / `www.febrabantech.com` | Site do **evento** Febraban Tech (edição corrente): agenda, palestrantes, notícias, vídeos, inscrição | SPA React (tem AuthProvider/LoginModal, ou seja, área logada) | `Allow: /`. O sitemap aponta para `https://9kml1lxttg.execute-api.us-east-1.amazonaws.com/hmg/content/sitemapEvento` (API Gateway em ambiente "hmg") | O `/sitemap.xml` responde 200 com 262 URLs: 89 `/noticias/<slug>`, 159 `/videos/<uuid>` e páginas fixas. Não tem `<lastmod>`. Páginas sem conteúdo no servidor (5 KB) |
| `conteudo.febraban.org.br` | Landing pages com formulários (RD Station), por exemplo `/cyberlab` | Estático + formulário RD Station | `Disallow:` vazio (permite tudo) | Cadastro **restrito a associados** para receber relatórios do CyberLab |
| `febrabaneducacao.com.br` | Febraban Educação: cursos, certificações, summits | WordPress-like (o sitemap existe) | Permite tudo, exceto carrinho e pagamento | `/feed/` responde HTML, não RSS. Os estudos ficam em `materiais.febrabaneducacao.com.br` (formulário) |
| `fin.org.br` | **Fin**, Confederação Nacional das Instituições Financeiras (ex-CNF). Entidade irmã, não é a FEBRABAN | WordPress | Permite tudo. Sitemap `sitemap_index.xml` | **RSS funcional**: `https://fin.org.br/feed/` |
| `www.autorregulacaobancaria.com.br` | Autorregulação bancária | — | **`Disallow: /`** (proíbe tudo) | Não automatizar. Usar a página espelho do portal (§6) |
| `indice.febraban.org.br`, `meubolsoemdia.com.br`, `feriadosbancarios…`, `buscabanco.org.br`, `arearestrita.febraban.org.br` | Saúde financeira, educação financeira, utilidades, área de associados | — | — | Fora do escopo dos dois temas |

**Termos de uso.** O portal não tem página de termos de uso: o rodapé só traz a "Política de Privacidade e de Cookies", que trata de cookies e Google Analytics e não diz nada sobre acesso automatizado ou reprodução. Os PDFs do estudo de tecnologias emergentes trazem "Copyright © 2026 Febraban & Accenture. All rights reserved". A página `febrabantech.febraban.org.br/termos-de-uso` é SPA e o texto não pôde ser lido sem JS. Na prática: ler, indexar e resumir com link para a fonte pode; republicar o PDF ou trechos longos, não.

---

## 1. Pesquisas e estudos (tecnologia e IA)

| Série | Cobertura | Editora / parceiro | Formato | Periodicidade | Histórico | Última edição | Listagem | Padrão de arquivo | Acesso |
|---|---|---|---|---|---|---|---|---|---|
| **Pesquisa FEBRABAN de Tecnologia Bancária** | Orçamento e investimento dos bancos em TI (total, IA/analytics, cloud, cibersegurança), transações por canal (mobile, internet, agências, Pix), prioridades tecnológicas, uso de IA. **É a fonte brasileira de referência para gasto dos bancos com tecnologia** | FEBRABAN, executada pela **Deloitte** | PDF (2 volumes/etapas por ano; há "versão imprensa" e "versão completa") | Anual, em 2 etapas: Vol. 1 (investimentos) em abr–jun e Vol. 2 (transações e IA) em jun–ago, lançada no Febraban Tech | **34ª edição em 2026**, ou seja, a série começa no início dos anos 1990 (a Deloitte numera as edições). O portal só lista 2023–2026. Há releases desde 2017 (ex.: 03/05/2018, "R$ 19,5 bi em 2017") | **2026 Vol. 2 (versão completa)**, divulgada em 25/08/2026 (release 4490; PDF de 27/08/2026, 13 MB). Vol. 1 2026 divulgada em 26/06/2026 (release 4469) | `https://portal.febraban.org.br/pagina/3106/1117/pt-br/pesquisa` | Sem padrão. Exemplos: `Pesquisa%20de%20Tecnologia%20Banc%C3%A1ria%202026%20-%20Vol_%202%20Vers%C3%A3o%20Completa.pdf`, `Pesquisa%20Febraban%202026%20V1.pdf`, `Pesquisa%20Febraban%20de%20Tecnologia%20Banca%CC%81ria%202025%20-%20Vol_2%20-%20VF.pdf`. Os releases trazem variantes extras (`Pesquisa%20Febraban%202026.pdf`, `...2026%20v_2.pdf`, `...2026%20-%20Vol1.pdf`) | Público, sem cadastro. A Deloitte espelha a pesquisa em `deloitte.com/br/pt/Industries/financial-services/research/pesquisa-febraban-tecnologia-bancaria.html`, com download via landing `pesquisas.lp.deloittecomunicacao.com.br/...` (provável formulário) |
| **Estudo de Tecnologias Emergentes para o Setor Bancário** | Tendências tecnológicas para bancos: IA generativa, agentes, banco conversacional, comércio agêntico, computação quântica e PQC, ativos digitais e tokenização, identidade e segurança digital. Traz radar de maturidade × impacto | FEBRABAN (Diretoria de Inovação e Tecnologia Bancária / Grupo de Novas Tecnologias) com a **Accenture** (2025 também cita a Amazon e os bancos participantes) | PDF + portal interativo (§2) | Anual, em set–dez | **1ª edição em 18/09/2024** (28 tendências, 135 tecnologias; release 4182). 2ª em 08/12/2025 (4 temas: IA no SDLC, agentes, quântica, identidade; release 4396). **3ª em 18/11/2026** (35 tendências, 6 teses; release 4524) | **2026**: `.../PDF/Estudo%20de%20Tecnologias%20Emergentes%20para%20o%20setor%20banc%C3%A1rio%202026.pdf` (36 p., 3,3 MB, `Last-Modified` 18/11/2026) | `https://portal.febraban.org.br/pagina/3443/1202/pt-br/tecnologiasemergentes` (nova) e `https://portal.febraban.org.br/pagina/3353/52/pt-br/estudo-tecnologias-emergentes` (dentro de Publicações) | `Estudo de [Tt]ecnologias [Ee]mergentes para o setor bancário {ANO}[ _texto].pdf`. 2024 só saiu como PDF de imprensa: `FBB_Techs_Emergentes_Relatorio_imprensa_VF.pdf` | Público. "All rights reserved" |
| **Observatório FEBRABAN** (FEBRABAN-Ipespe) | Opinião pública. Temas variam, e vários tocam tecnologia, fraude e dados: segurança de dados (jul/2021), inclusão digital de idosos (set/2022), **percepção dos brasileiros sobre IA (jun/2026)** | FEBRABAN + **Ipespe** | PDF (apresentação), nacional + regional | ~2–3 por ano | Jun/2020 → **Jun/2026** (PDF de 03/07/2026; release 4474, "Entusiasmo e preocupação dividem visão dos brasileiros sobre IA") | `.../PDF/Observatorio_Febraban_Junho_VF.pdf` | `https://portal.febraban.org.br/pagina/3284/52/pt-br/pesquisa-observatorio` | Livre (ex.: `observatorio%20julho%202025.pdf`, `OBSERVATO%CC%81RIO_FEBRABAN_DEZ_25_VF%20ppt.pdf`) | Público |
| **Pesquisa de Aprendizagem Corporativa** | Educação corporativa e futuro do trabalho diante das tecnologias emergentes | Febraban Educação + **Deloitte** | PDF por formulário | Pontual (página de 26/08/2025) | 1 edição | — | `https://portal.febraban.org.br/pagina/3399/52/pt-br/aprendizagemcorporativa` → `https://materiais.febrabaneducacao.com.br/pesquisa-educacao-corporativa` | — | **Exige cadastro** (landing com formulário) |
| Releases com estatística própria | Ex.: uso de cheques (02/04/2026, release 4440, série desde 1995); "dez tecnologias que vão decolar nos bancos" (08/01/2019, release 3238) | FEBRABAN | HTML (release); às vezes vídeo via WeTransfer | Irregular | — | — | Ver §6 (releases) | — | Público. Os links `we.tl` expiram |

## 2. Radares

Há **dois produtos com "Radar" no nome**, e eles são bem diferentes:

| Produto | O que é | Formato | Periodicidade | Histórico | Última | URL | Automação |
|---|---|---|---|---|---|---|---|
| **FEBRABAN · Radar de Tecnologias** (*o radar de tecnologia propriamente dito*) | Portal do Estudo de Tecnologias Emergentes (Febraban & Accenture). Radar interativo com **35 tecnologias** em **5 domínios** (IA & Dados; Segurança Digital; Arquiteturas Computacionais; Convergência Ciberfísica; DLT & Criptoativos) × **3 faixas de maturidade** (Conceitual, Emergente, Em escala), impacto de 1 a 5 e status 2026 (novo/reformulado/mantido). Traz ainda **6 teses**, **287 cases** de mercado, **368 fontes** (350 artigos e notícias, 18 relatórios), glossário, metodologia e uma página de edições (2024 · 2025 · 2026) | HTML estático de arquivo único (~28 MB), com 4 PDFs embutidos: `FBB - Estudo Tecnologias Emergentes 2024.pdf`, `… 2025.pdf`, `… 2026.pdf` e **`FBB - Radar de Tecnologias 2026.pdf`** (este último **só existe embutido aqui**; não está no cmsarquivos) | Anual (acompanha o estudo) | Radar criado em 2024 (28 tendências), atualizado em 2026 (35) | Edição 2026, publicada em 17–18/11/2026 | `https://tecemergentes.febraban.org.br/` (rotas com hash: `#radar`, `#radar/tecnologias?dominio=ia-dados`, `#referencias/case-<tecnologia>-cNN`, `#edicoes`, `#metodologia`) | Não há robots, sitemap nem feed. Monitorar `Last-Modified`/`ETag` com HEAD. Quando mudar, baixar uma vez e extrair do HTML os registros de tecnologia/tese/case (o texto todo está no HTML, sem JS) |
| **Radar FEBRABAN** (*não é radar de tecnologia*) | Pesquisa de opinião trimestral FEBRABAN-Ipespe sobre expectativas dos brasileiros: economia e consumo, bancos, **Pix, proteção de dados, golpes**, meios de informação. Recortes nacional e regional | PDF | Trimestral (irregular) | Mar/2021 → **Set/2025** (PDF de 08/10/2025). Nenhuma edição em 2026 até 25/11/2026, possivelmente descontinuado | `.../PDF/Radar%20Febraban%20setembro%202025%20vf.pdf` | `https://portal.febraban.org.br/pagina/3306/52/pt-br/radarfebraban2021` | Page diff da listagem. Nomes livres (`Radar%20Febraban%20jun2025.pdf`, `RADAR%20SETEMBRO%2024.pdf`...) |

Não achei outro "radar de tendências" ou "radar de inovação" da FEBRABAN. O podcast teve um episódio "Tecnologias emergentes: o que vem depois da IA?" (08/10/2026), e o portal Febraban Tech publica matérias de "futurismo" (§4).

## 3. Dados e estatísticas

| Série | Cobertura | Formato | Periodicidade | Última | Listagem | Relevância |
|---|---|---|---|---|---|---|
| Pesquisa de Tecnologia Bancária (ver §1) | Gasto em TI, transações por canal | PDF | Anual | 2026 | `/pagina/3106/1117/pt-br/pesquisa` | **Principal dado de tecnologia** |
| Pesquisa de Economia Bancária e Expectativas | Projeções de crédito, Selic, câmbio (bancos) | PDF ("vImprensa") | ~Mensal/bimestral | Nov/2026 | `https://portal.febraban.org.br/pagina/3235/1120/pt-br/expectativas` | Baixa (economia) |
| ISEB – Informativo Semanal de Economia Bancária | Boletim semanal + vídeo no YouTube | PDF `ISEB_DDmmmAA.pdf` (ex.: `ISEB_23nov26.pdf`) | Semanal | 23/11/2026 | `https://portal.febraban.org.br/pagina/3413/1121/pt-br/iseb-2026` (uma página por ano: 3337=2024, 3364=2025) | Baixa |
| Panorama do Mercado de Crédito | Crédito, inadimplência e spread (dados BCB) | PDF | Mensal | Set/2026 | `https://portal.febraban.org.br/pagina/3130/26/pt-br/panorama` | Baixa |
| Pesquisa Especial de Crédito | Crédito | PDF | Mensal | Out/2026 | `https://portal.febraban.org.br/pagina/3290/21/pt-br/especial` | Baixa |
| Estudos Febraban de Economia / Spread | Estudos avulsos (taxas de adquirentes, crédito MPE...) | PDF | Irregular | — | `/pagina/3141/26/...`, `/pagina/3252/26/...` | Baixa (o comparativo de taxas de adquirentes toca pagamentos) |
| Relatório de Ouvidorias | Indicadores de reclamações e canais. **A edição 2025 tem foco em integridade digital e fraudes** | PDF (2023 feita com a Deloitte) | Anual | Ed. 2025, publicada em 01/04/2026 (`Febraban%20-%20RAO%202025-2026_Vers%C3%A3oEnvio30_03.pdf`) | `https://portal.febraban.org.br/pagina/3244/52/pt-br/relatorio-ouvidorias-geral` (2017→2025) | **Média para fraude** |

Não há API nem dashboard público de estatística. Quase tudo sai em PDF. As exceções são algumas planilhas XLSX (taxonomia, padronização de extratos; ver §6D e §6F) e os endpoints JSON de feriados. As séries de economia estão detalhadas, com histórico e padrão de arquivo, em **§6A**.

## 4. Eventos e conteúdo do Febraban Tech (além do YouTube)

| Item | O que é | URL | Formato / descoberta | Acesso |
|---|---|---|---|---|
| **Portal Febraban Tech (ex-noomis)** | Notícias e análises diárias sobre IA, segurança, pagamentos, futurismo, regulação. Inclui colunas de **especialistas** (`/especialista/<autor>/<slug>`) e coberturas dos eventos (Febraban Tech, Febraban SEC, PLDFT, G-Risc) | `https://febrabantech.febraban.org.br/` · temas: `/temas/{inteligencia-artificial, seguranca, futurismo, blockchain, meios-de-pagamento, banco-digital, fintechs, regulacao, infraestrutura, big-data, inovacao}` | **`https://febrabantech.febraban.org.br/sitemapnews.xml`** (news sitemap com `publication_date`, `title` e `news:keywords`, ex.: "segurança cibernética, golpe, fraude"; rolante, 4 itens em 25/11/2026). URLs `/temas/<tema>/<slug>`. O HTML do servidor só tem título e `og:description` | Público. SPA: texto completo só com JS |
| **Site do evento (febrabantech.com)** | Edição corrente: agenda, trilhas, palestrantes, expositores, **notícias de cobertura** (89 na edição 2026) e **vídeos** (159 páginas `/videos/<uuid>`) | `https://febrabantech.com/` · sitemap `https://febrabantech.com/sitemap.xml` | Sitemap sem `<lastmod>`. Slugs descritivos em `/noticias/<slug>`. Páginas sem conteúdo no servidor | A área de vídeos/transmissão parece exigir login (bundle tem AuthProvider/LoginModal). **Não confirmado** sem navegador. Não achei PDFs de apresentações publicados |
| Agenda / palestrantes | Febraban Tech 2026 (24–26/08/2026, Distrito Anhembi): tema "Agentes Inteligentes, liderança humana", ~627 palestrantes e 220 painéis (segundo a imprensa). 2027: 24–26/08 | `https://febrabantech.com/agenda`, `/palestrantes` | SPA (só com JS) | Público com JS. **Sem PDF de programação** |
| **Arena Fintech** (competição de startups) | 12 finalistas. Vencedoras em 2026: Fintalk e Carbigdata. Antes chamada "Ciab Fintech Day"/"concurso de fintechs" (2017–2019) | Notícias em `febrabantech.com/noticias/febraban-tech-2026-anuncia-as-12-finalistas-da-competicao-arena-fintech` e `.../fintalk-e-carbigdata-vencem-competicao-da-arena-fintech` | Via sitemap do evento e releases | Público |
| Prêmios | Não achei um "Prêmio Febraban Tech" de tecnologia em funcionamento. O Prêmio ANPEC-Febraban é de economia bancária (`/pagina/3348/1123/...`) | — | — | — |
| "Febraban Tech Insights" | **Não existe** com esse nome (busca no site e na web). O mais próximo: colunas de especialistas no portal Febraban Tech e releases da Pesquisa | — | — | — |
| Pesquisa de Tecnologia no evento | A 2ª etapa da Pesquisa é sempre lançada no evento (painel + release) | ver §1 | — | — |
| Releases do evento | Lançamento da edição seguinte (out–nov), atrações (mai–ago), balanço de público | `/Noticias/GetItems?selectedText=Febraban%20Tech` | JSON | Público |
| Legado | `febrabantech.com/evento/febraban-tech-2023/destaques`, Ciab FEBRABAN (até 2021); `ciab.com.br` não resolve | — | — | Histórico |

## 5. Cibersegurança e fraude

| Item | Cobertura | Formato | Data | URL | Acesso |
|---|---|---|---|---|---|
| **Laboratório de Segurança Cibernética (CyberLab), página pública** | Criado em set/2020. Lista os estudos públicos | HTML + PDF | — | `https://portal.febraban.org.br/pagina/3322/1108/pt-br/lab-seguranca-cibernetica` | Público |
| ↳ Estudo Exploratório em Inteligência Cibernética: Compartilhamento e Colaboração | Compartilhamento de threat intel no setor | PDF, 15 MB | `Last-Modified` 29/04/2026 | `.../PDF/Estudo%20Explorat%C3%B3rio%20em%20Intelig%C3%AAncia%20Cibern%C3%A9tica%20-%20Compartilhamento%20e%20Colabora%C3%A7%C3%A3o.pdf` | Público |
| ↳ Guia de Boas Práticas de Segurança da Informação (2026) | Guia setorial | PDF, 15 MB | 03/06/2026 | `.../PDF/Guia%20de%20Boas%20Pr%C3%A1ticas%20-%20Febraban%20-%202026.pdf` | Público |
| ↳ Estudo de Ameaças Cibernéticas | Panorama de ameaças em 2024 a partir da ferramenta de threat intelligence do Lab | PDF, 22 p. | Criado em dez/2024; publicado em 13/02/2025 | `.../PDF/Estudo%20de%20Amea%C3%A7as%20Ciberneticas.pdf` | Público |
| ↳ Relatório: Criptografia Quântica | Quântica, PQC e impacto nos bancos brasileiros | PDF, 23 p. | dez/2023 (publicado em 13/02/2025) | `.../PDF/Relat%C3%B3rio%20-%20Criptografia%20Qu%C3%A2ntica.pdf` | Público |
| ↳ Segurança em IA Generativa: Desafios, Riscos e Medidas Preventivas | Deepfake, clonagem de voz, riscos de LLM | PDF, 35 p. | publicado em 13/02/2025 | `.../PDF/Report%20Febraban%20-%20Os%20Riscos%20de%20Seguran%C3%A7a%20da%20IA%20Generativa-compactado.pdf` | Público |
| **CyberLab: relatórios para associados** | Relatórios, treinamentos, simulações (CTF, wargame, crise cibernética) e EAD | E-mail / EAD | — | `https://conteudo.febraban.org.br/cyberlab` (formulário RD Station) | **Restrito a associados FEBRABAN.** Não automatizar |
| **Golpes e Fraudes (AntiFraude)** | Catálogo de golpes para o consumidor (15 fichas: falsa central, falso advogado, Pix errado, mão fantasma, falso boleto...) + links de segurança dos bancos | HTML via JSON | Fichas atualizadas até 16/11/2026 (uma tem a data errada, 2030-09-09) | `https://portal.febraban.org.br/AntiFraude` · JSON `https://portal.febraban.org.br/Antifraude/PodGetItems?page=N` → `/DetalheAntifraude/{IdAntifraude}/pt-br/` | Público. Útil como **taxonomia de golpes** |
| Releases antifraude | Alertas de golpes (falso advogado, QR Code falso, falso emprego...), campanhas ("Pare e Pense", Porchat, Rafael Portugal), parcerias (SSP-SP, FGC, CIN). ~65 releases com "fraude" | HTML | Contínuo | `/Noticias/GetItems?selectedText=fraude` (também `golpe`, `cibern`) | Público |
| **Selo de Prevenção a Fraudes** | Selo setorial (CNF/Fin + Febraban, lançado em 22/10/2024). Inscrições até 15/06/2026 | HTML | — | `https://portal.febraban.org.br/pagina/3426/1183/pt-br/selo-prevencao-fraudes` → `https://fin.org.br/selo-fin` | Público |
| **Aliança Nacional de Combate a Fraudes Bancárias Digitais** | Acordo MJSP–FEBRABAN: mais de 20 ações em 60 meses. O plano em PDF está no gov.br | HTML / PDF | — | `https://portal.febraban.org.br/pagina/3411/1136/pt-br/alianca-nacional` → `https://www.gov.br/mj/pt-br/assuntos/alianca-nacional-de-combate-a-fraudes-bancarias-digitais` | Público |
| Celular Seguro / roubo de celular | Orientações (MJSP + Febraban + Anatel) | HTML estático | — | `https://portal.febraban.org.br/pagina/3309/1106/pt-br/orientacoes-roubo-celular` | Público. Baixa |
| Crédito consignado / DDA | Orientações de prevenção | HTML | — | `/pagina/3321/1111/...`, `/pagina/3051/1088/pt-br/dda` | Baixa |
| Febraban SEC / PLDFT / G-Risc | Congressos de fraude, PLD e riscos. **Já inventariados**; a cobertura sai no portal Febraban Tech (`/temas/seguranca/...`) | — | SEC 18–19/03/2026; PLDFT+G-Risc nov/2026 | ver INVENTARIO.md | — |
| Febraban Educação: fraude/ciber | Cursos e certificação "Prevenção a Fraudes" (`/certificacoes/fraudPrevention/`), Summit Cyber Segurança, curso gratuito de cibersegurança do Lab | HTML | — | `https://febrabaneducacao.com.br/` | Cursos pagos. Baixa para o watch |
| **Fin (ex-CNF), notícias** | Antifraude setorial (Global Anti-Scam Alliance, fórum no STJ), Pix, regulação | **RSS** | Ativo (19/11/2026) | `https://fin.org.br/feed/` | Público (entidade irmã) |

## 6. Outros (institucional, imprensa, mídia)

| Item | O que é | URL / feed | Observações |
|---|---|---|---|
| **Releases (Notícias)** | ~1.000 releases (125 páginas × 8), de 2017 até hoje | Listagem `https://portal.febraban.org.br/Noticias`. **JSON** `https://portal.febraban.org.br/Noticias/GetItems?page=N&selectedData=AAAA&selectedText=<termo>` (campos `IdTexto`, `Descricaop`, `Resumop`, `Publicar` em `/Date(ms)/`). Item: `/noticia/{IdTexto}/pt-br/` | Sem RSS. O filtro `selectedText` busca no título e no resumo e não é bloqueado pelo robots (diferente de `/Busca/`). Os releases linkam os PDFs novos (às vezes antes da página de listagem) |
| Publicações (seção 52) | Índice geral de publicações (23 itens: tecnologias emergentes, Observatório, Radar, Ouvidorias, guias, autorregulação, BETs...) | `https://portal.febraban.org.br/paginas/52/pt-br` · JSON `https://portal.febraban.org.br/paginas/getitems?page=N&selectedText=&idSecao=52` (`ID_CONTEUDO`, `DS_TITULO_TEXTO`, `TX_URL_AMIGAVEL`, `DT_INIC_VIGE`) | `DT_INIC_VIGE` muda quando a página é editada, o que serve de **sinal de atualização** (ex.: 3353, tecnologias emergentes, mudou para 18/11/2026). O mesmo endpoint funciona para outras seções (`idSecao=1117`, `1202`, `1108`...) |
| **Febraban Podcast** | 358 episódios desde 06/04/2020. Temporada 2026 forte em IA, fraude, cibercrime, Open Finance, quântica, data centers. Inclui "Dicas Meu Bolso em Dia" | **RSS `https://anchor.fm/s/1b75a63c/podcast/rss`** (Spotify for Creators). Apple id 1525761621. Índice no portal: JSON `/FebrabanNews/PodGetItems?page=N` | Último em 12/11/2026. Filtrar por título |
| Febraban News: vídeos | Vídeos curtos (ISEB, golpes, segurança) | JSON `/FebrabanNews/VidGetItems?page=N` → links do YouTube | Já cobertos pelo YouTube institucional |
| noomiscast | Podcast antigo do noomis (blockchain, IA, open banking) | `https://febrabantech.febraban.org.br/podcast.xml` | **Parado**: 160 episódios, 27/04/2020 → 05/04/2022. Só histórico |
| YouTube FEBRABAN (institucional) | `@FEBRABANoficial`, canal `UCOWExcTuCxhqwRkyiu0z35w` | `https://www.youtube.com/feeds/videos.xml?channel_id=UCOWExcTuCxhqwRkyiu0z35w` | **Já monitorado** (ver §8). Último vídeo 25/11/2026; publicou "Estudo de Tecnologias Emergentes 2026" em 24/11/2026 |
| YouTube FEBRABAN TECH | `@febrabantech`, canal `UCndkRD4447sJHXukUIU7UiA` | `https://www.youtube.com/feeds/videos.xml?channel_id=UCndkRD4447sJHXukUIU7UiA` | **Inativo desde 11/01/2024**. Não vale monitorar |
| YouTube Febraban Educação | `UCuPmpvDBG3rrpyeGPbVG4Vw` | feed equivalente | Baixa |
| Sala de Imprensa | Só contatos (imprensa@febraban.org.br) | `/pagina/3157/62/pt-br/noticias-sala-imprensa` | Sem conteúdo |
| Relatório Anual institucional | Último localizado: **RA 2020** (`.../PDF/Febraban_RA_2020_final.pdf`). A URL antiga `/paginas/19/...relatorio-anual` agora mostra o Relatório de Transparência Salarial | — | Parece **descontinuado** |
| Relatório Anual da Autorregulação | 8ª edição, referente a 2024 (PDF `.../PDF/Autorregulacao2025-V2_Completo.pdf`, de 03/04/2025, linkado em `/pagina/3396/52/...`). A de 2023 é `.../PDF/Autorregulacao2024_2.pdf`. Série desde 2017 | Listagem `https://portal.febraban.org.br/pagina/3374/16/pt-br/Relatório%20Anual` | **O primeiro link da listagem (`.../PDF/Autorregulacao/relatorio-anual/Autorregulacao2024_2.pdf`) dá 404.** `autorregulacaobancaria.com.br` proíbe robôs; usar o portal. Detalhes em §6C |
| Informativo Regulatório Mensal (IRM) | Boletim de regulação prudencial (Basileia etc.), produzido pela DIRPRAE | PDFs antigos `.../PDF/irm-<mes>%20de%20<ano>.pdf`, `IRM_outubro_21.pdf`. A página `/pagina/3317/1122/pt-br/irm-2022` redireciona para a home. O menu "Informativo Mensal de Regulação Bancária" é `#` | Hoje parece ser **só por e-mail/assinatura**. Fora do escopo |
| Informativo ESG, Hub de Sustentabilidade, Taxonomia Verde | Sustentabilidade | `/pagina/3431/1189/...` etc. | Fora do escopo |
| Comitês e grupos de trabalho | Não há página pública que liste comitês técnicos com publicações próprias. O Grupo de Novas Tecnologias aparece como coautor do Estudo de Tecnologias Emergentes, o Comitê de Ouvidoria no Relatório de Ouvidorias, e o CyberLab tem página própria. A página "Grupos de Trabalho" (`/pagina/3435/1193/...`) é de sustentabilidade | — | — |
| Revistas | A antiga **Revista Ciab FEBRABAN/Noomis** não tem edição recente localizável. Não há revista ativa no portal | — | — |
| Newsletters | Cadastro em `/Noticias/GestaoNewsLetter` (bloqueado no robots); IRM por assinatura; CyberLab para associados | — | Não automatizar |

---

## 6A. Economia e crédito

| Série | Cobertura | Formato | Periodicidade | Histórico | Última edição | Listagem | Padrão de arquivo |
|---|---|---|---|---|---|---|---|
| **Pesquisa FEBRABAN de Economia Bancária e Expectativas** | Projeções dos bancos para o crédito (total, livre, direcionado, PF/PJ), inadimplência, Selic e câmbio; leitura da ata do Copom | PDF ("versão imprensa") + release | ~a cada Copom (8–10 por ano) | fev/2023 → **nov/2026** (31 edições listadas) | Nov/2026 (PDF de 18/11/2026) | `https://portal.febraban.org.br/pagina/3235/1120/pt-br/expectativas` | `Pesquisa FEBRABAN de Economia Bancária e Expectativas - {Mês} de {AAAA}_{vImprensa\|v_imprensa\|imprensa}.pdf` |
| **ISEB: Informativo Semanal de Economia Bancária** | Conjuntura semanal: crédito, juros, inflação. Tem vídeo semanal no YouTube | PDF + vídeo | Semanal (segundas) | Páginas anuais 2024, 2025 e 2026 (~50 edições/ano) | 23/11/2026 (`ISEB_23nov26.pdf`) | `/pagina/3413/1121/pt-br/iseb-2026` (2024 = 3337, 2025 = 3364) | `ISEB_{DD}{mmm}{AA}.pdf`, com variações (`ISEB_23 dez24.pdf`, `ISEB_15 jan.pdf`). Uma página nova por ano |
| **Panorama do Mercado de Crédito** | Crédito, inadimplência e spread, a partir das notas do BCB | PDF | Mensal | jan/2016 → set/2026 (95 edições) | Set/2026 | `/pagina/3130/26/pt-br/panorama` | `Panorama de Crédito_{mmmAA}.pdf` ou `Panorama de Crédito - {Mmm}{AA}.pdf` |
| **Pesquisa Especial de Crédito** | Prévia mensal da carteira com dados dos bancos (origem dos releases "Carteira de crédito deve crescer x%") | PDF | Mensal | jan/2024 → out/2026 (34 edições) | Out/2026 | `/pagina/3290/21/pt-br/especial` | `Pesquisa Especial Crédito_{mês}_{AA} - versão imprensa.pdf` (padrão estável, previsível) |
| **Estudo do Spread Bancário** | Decomposição do spread (inadimplência, tributos, custos, margem) | PDF | ~Bienal | 2017 (release 3133) → 2025 | 2025 (`Composição Spread_Site.pdf`, de 22/10/2025; o nome não tem ano e pode ser sobrescrito) | `/pagina/3252/26/pt-br/estudos-spread-bancario` | Livre |
| Estudos Febraban de Economia (avulsos) | Taxas de adquirentes independentes vs. de bancos; crédito a MPEs; endividamento das famílias | PDF | Irregular | — | — | `/pagina/3141/26/pt-br/apresentacoes-setor-bancario` | Livre |
| **Prêmio ANPEC-FEBRABAN de Economia Bancária** | Prêmio acadêmico (desde 2009; 18ª edição em 2026). Publica os trabalhos vencedores | PDF | Anual (out–nov) | 2009 → 2026 | Trabalhos 2026 (PDF de 27/10/2026) | `/pagina/3348/1123/pt-br/premio-economia-2026` (o id 3348 se mantém e o slug muda por ano) | `{Nome do autor} - {título}.pdf` |
| Livro "Como fazer os juros serem mais baixos no Brasil" | Agenda do setor para o ambiente de crédito (2ª edição) | PDF | Pontual | — | `Juros Mais Baixos 2.pdf` | `/pagina/3257/52/pt-br/juros-baixos-brasil` | — |
| Releases de dados | Carteira de crédito, cheques (série desde 1995), transações digitais | HTML | Mensal/irregular | — | — | JSON `/Noticias/GetItems` | — |

A FEBRABAN **não** publica um "Relatório de Economia Bancária" (esse é do Banco Central). Os equivalentes da FEBRABAN são o Estudo do Spread, o Panorama e as pesquisas acima.

## 6B. Regulação e posicionamentos

| Item | O que é | Onde | Observações |
|---|---|---|---|
| **Notas, notas conjuntas e respostas** | Posições públicas: autonomia e competência do BC (dez/2025–jun/2026), reporte de sustentabilidade (jun/2026), "Resposta da Febraban às postagens de David Vélez" (PDF, 05/12/2025) | Releases (JSON `selectedText=Nota`); às vezes uma página em Publicações (`/pagina/3410/52/pt-br/resposta-nubank`) | Sem feed próprio. Filtrar releases por título |
| Fórum Técnico de Entidades do Setor de Pagamentos | ABBC, Abecs, Abipag, Abranet, Febraban e Zetta. Em out/2025 levou 10 medidas de segurança digital ao BC | Release 4379 | Pagamentos e fraude |
| Agenda regulatória socioambiental | Mapa das normas BCB/CMN (PRSAC, Res. 4.327, 4.945, 4.943, 4.557...) com links para o bcb.gov.br | `/pagina/3437/1195/pt-br/agenda-regulatoria-autorregulacao` | Estático |
| Informativo Regulatório Mensal (IRM) | Ver §6 (por assinatura; PDFs públicos até 2021) | — | — |
| Guia de Boas Práticas de Compliance | Comissão de Compliance | `/pagina/3228/52/pt-br/guia-compliance` | **O PDF dá 404** |
| Consultas públicas | A URL antiga `/pagina/3292/1103/pt-br/consulta-publica` hoje abre a página da Taxonomia. Não há página de respostas da FEBRABAN a consultas públicas | — | — |

## 6C. Autorregulação, consumidor e ouvidoria

| Item | Conteúdo | Formato / data | URL | Notas |
|---|---|---|---|---|
| **SARB: Código e normativos** | Código de Conduta Ética e Autorregulação Bancária + ~69 normativos (vigentes e revogados: idosos, vulneráveis, crédito responsável, cobrança...), termo de adesão (DOCX), recomendações, lista de auditores, selo, PES (sistema logado) | PDF/DOCX; contínuo | `/pagina/3370/16/pt-br/Normativos` | Arquivos em `.../PDF/Autorregulacao/normativos/`. A Recomendação 001/2024 (`.../Autorregulacao/recomendacoes/...`) dá 404. `pes.febraban.org.br` exige login |
| **Relatório Anual da Autorregulação** | 8ª edição (2024) | PDF, 03/04/2025 | `/pagina/3374/16/...` e `/pagina/3396/52/...` | Ver §6 (link quebrado na listagem) |
| **Autorregulação do Consignado** (FEBRABAN + ABBC) | Convenção, documento correlato, comunicados; página "Indicadores" (sem dados no HTML do servidor); "Não me Perturbe". **Sanções mensais a correspondentes saem em releases** (2.202 em abr/2026; "mais de 2,2 mil" em 25/11/2026) | PDF + release mensal | `/pagina/3381/1133/pt-br/Documentos`; releases `selectedText=consignado` | Os números mensais são uma série boa para extrair dos releases |
| Autorregulação da Portabilidade de Crédito | Convenção, documento correlato, recomendações do Comitê Gestor (mais de 600 signatárias) | PDF | `/pagina/3387/1134/pt-br/Documentos` | `.../PDF/Autorregulacao/portabilidade-documentos/` |
| **Relatório de Ouvidorias** | Ver §3 (2017→2025) | PDF anual | `/pagina/3244/52/...` | — |
| Cartilhas e guias ao consumidor | Canais de Atendimento (nov/2024), consignado, venda casada no crédito rural, guias de uso responsável do crédito e de suitability (em `cmsarquivos.autorregulacaobancaria.com.br`) | PDF | `/pagina/3055/30/...`, `/pagina/3142/52/...`, `/pagina/3289/52/...` | Estáticos |
| Estudo Nacional sobre BETs | Pesquisa quantitativa sobre apostas online (out/2024) | PDF, 19/12/2024 | `/pagina/3363/52/pt-br/estudo-nacional-bets` | Tema retomado no Observatório de jul/2025 |
| Semarc Nacional | Seminário de relacionamento com o consumidor (nov/2026) | Evento (SPA) | `https://febrabantech.febraban.org.br/eventos/semarcnacional2026` | Ver §6H |
| Busca Banco / Atendimento Bancos | Utilitários (agências, canais) | HTML | `https://www.buscabanco.org.br/`, `/AtendimentoBancos` | Não é conteúdo de pesquisa |

## 6D. Sustentabilidade e ESG

Não existe uma "Pesquisa de Sustentabilidade" nem uma "Agenda ESG" com esse nome. A produção de ESG está no **Hub Febraban de Sustentabilidade e Clima** (`/pagina/3430/1188/pt-br/hub-sustentabilidade`), em várias páginas temáticas:

| Série | Conteúdo | Formato | Periodicidade | Histórico / última | Listagem | Notas |
|---|---|---|---|---|---|---|
| **Taxonomia de Finanças Sustentáveis** (ex-Taxonomia Verde) + **Aplicação ao crédito bancário** | Guia explicativo (2021, 2026), **lista de CNAEs em XLSX** (2021; 2026 de 03/08/2026) e estudo anual da carteira de crédito do SFN classificada pela taxonomia (dados do SCR/BCB, série 2012→2025) | PDF + **XLSX** | Anual (~jul) | 2014 ("O SFN e a Economia Verde"), "Mensurando recursos na Economia Verde" 2015–2021, aplicação 2021→**2025 (PDF de 30/07/2026)** | `/pagina/3292/1103/pt-br/taxonomia-verde` | As planilhas ficam em `.../documentos/MSExcel/` |
| **Relatório para a COP** | Compromissos e resultados dos bancos em finanças sustentáveis e clima. PT e EN | PDF | Anual (out–nov) | COP30 (31/10/2025) → **COP31 (04/11/2026)** | `/pagina/3428/1184/pt-br/evolucao-financas-sustentaveis` | `Relatório Febraban_COP{NN}[_inglês].pdf` |
| **Gestão de riscos sociais, ambientais e climáticos** | Guia de Implementação **IFRS S1/S2** para IFs (31/07/2026) + apêndice técnico, riscos de desmatamento e cadeias livres de conversão (2026), roadmap de desmatamento (2025), **Roadmap TCFD-FSB** 2018–2023, ferramentas de risco climático (2021), capital natural (2017) | PDF | 2–4 por ano | 2017 → 2026 | `/pagina/3432/1190/...` e `/pagina/3439/1198/...` | Parcerias antigas: FGVces, CDP |
| Emissões financiadas | Fatores de Emissão para Emissões Financiadas no Brasil (12/06/2026), guia de mensuração de GEE (2020), precificação de carbono (2017) | PDF | Irregular | 2017 → 2026 | `/pagina/3433/1191/...` | — |
| Finanças sustentáveis (estudos) | Governança dos mercados regulados de carbono (2025), Guia de Dívida Sustentável (out/2023), energia solar (2018), green bonds e CRA (2015) | PDF | Irregular | 2015 → 2025 | `/pagina/3434/1192/...` | — |
| Informativo ESG | Newsletter de sustentabilidade, cidadania financeira, autorregulação e consumidor | — | — | **Nenhuma edição pública listada** | `/pagina/3431/1189/pt-br/informativo-esg` | Provavelmente só por e-mail |
| Política, atuação, grupos de trabalho, desenvolvimento setorial | Política de sustentabilidade; GTs só para associados; participação em IFC, UNEP FI/PRB | HTML | Estático | — | `/pagina/3429/1185/...`, `/pagina/3435/1193/...`, `/pagina/3436/1194/...` | Referência |
| Fórum de Finanças Sustentáveis | Evento com Anbima e CNSeg (COP30, 12/11/2025) | Release | Anual | — | release 4372 | — |
| Observatório (sustentabilidade, set/2021) e Censo da Diversidade | Ver §1 e §6G | — | — | — | — | — |

## 6E. Inclusão e educação financeira

| Item | Conteúdo | Formato | Periodicidade | Última | URL / feed | Notas |
|---|---|---|---|---|---|---|
| **Meu Bolso em Dia** | Portal gratuito (ACT BCB + FEBRABAN, 2021): ~702 matérias, 26 vídeos, 16 planilhas, 12 e-books, trilhas, mutirão de dívidas | HTML/vídeo/e-book | Contínua | lastmod 25/11/2026 | `https://meubolsoemdia.com.br/` · **sitemap com `<lastmod>`**: `https://meubolsoemdia.com.br/sitemap.xml` | robots: só `/busca?q=*` bloqueado. O espelho no portal (`/DetalheMeuBolso`) é bloqueado |
| **I-SFB: Índice de Saúde Financeira do Brasileiro** + relatório anual "A Saúde Financeira do Brasileiro" | Índice criado com o BCB (2021); relatórios 2022→2025; manual metodológico; materiais em EN. Prêmio Felaban 2025 | PDF (Azure Blob) | Anual | **2025 (12/01/2026). Essa edição não está linkada no site**: foi achada pelo padrão de URL | `https://indice.febraban.org.br/` · `https://pefmbddiag.blob.core.windows.net/cdn/downloads/A_Saude_Financeira_do_Brasileiro_{AAAA}.pdf` | Sem robots.txt |
| Guia de boas práticas de educação financeira no setor bancário | Guia setorial | PDF | Pontual | 03/11/2025 | `/pagina/3408/52/...` | — |
| Avaliação de impacto do Meu Bolso em Dia | Toolkit de avaliação de impacto | PDF | Pontual | 27/05/2026 | `/pagina/3442/52/...` | — |
| Observatório (educação financeira, jul/2025) | Ver §1 | — | — | — | — | — |
| Assistente de IA de educação financeira | Lançado com Amazon e Flexa Cloud (release 4509, 21/10/2026) | Produto | — | — | — | Notícia, não publicação |
| YouTube Meu Bolso em Dia | Vídeos (ativo) | Vídeo | Semanal | 24/11/2026 | feed `channel_id=UCYnDw_6Yi_xrYyN2LYE9oAw` | — |
| Podcast "Dicas Meu Bolso em Dia" | No mesmo RSS do Febraban Podcast | Áudio | — | 04/11/2026 | anchor.fm (§6) | — |

## 6F. Pagamentos, padrões técnicos e dados de referência

| Item | Conteúdo | Formato | Última versão | URL | Notas |
|---|---|---|---|---|---|
| **Layouts FEBRABAN** | **CNAB240 v11.0** (15/09/2026), **Código de Barras v8** (12/05/2026), Débito Automático v9 (mar/2026), autorização de cancelamento, protesto centralizado v4.3, ICF | PDF | Set/2026 | `/pagina/3425/33/pt-br/layout-febraban` | Versão e data no nome do arquivo. Bom sinal de mudança de padrão interbancário |
| Nova Plataforma da Cobrança (boletos) | Convenção da Cobrança (05/02/2021), convênio do RCO | PDF | 2021 | `/pagina/3150/1094/...` | A página antiga 3150/52 redireciona para a home |
| DDA | Débito Direto Autorizado | PDF | — | `/pagina/3051/1088/pt-br/dda` | — |
| Padronização de extratos | Literais padronizadas (XLSX) | **XLSX** | 2024 | `/pagina/3345/33/...` → `.../MSExcel/1_2_2024_final.xlsx` | Dataset |
| Compe por Imagem | Manual operacional v7 (2020) | PDF | 2020 | `/pagina/3169/33/...` | — |
| Códigos de Arrecadação | Tabela de códigos de convênios de arrecadação | HTML (~1,2 MB) | Contínua | `/CodigosPublicados` | Dataset de referência |
| Sefaz-SP | Correspondências por município (IPVA/multas) | HTML | — | `/sefaz` | Utilitário |
| **Feriados Bancários** | Calendário nacional e municipal | **JSON** | Anual | `https://feriadosbancarios.febraban.org.br/Home/ObterFeriadosFederais?ano=AAAA` | Sem robots.txt |
| Pix, Open Finance e transações | Não há série própria. Os números vêm na Pesquisa de Tecnologia (§1), nos releases e no Fórum de Pagamentos (§6B) | — | — | — | — |

## 6G. Pessoas e trabalho

| Item | Conteúdo | Formato | Periodicidade | Última | URL |
|---|---|---|---|---|---|
| **Convenções Coletivas dos Bancários** (FENABAN) | Livros das CCTs 2018–20, 2020–22, 2022–24, 2024–26; tabela de reajustes; cartilha das normas coletivas | PDF | Bienal + reajuste anual | Reajuste 2026 (29/09/2026; vigência 01/09/2026–31/08/2028) | `/pagina/3402/9/pt-br/convencao-2025` (o slug ficou "2025"), livros em `/pagina/340{3..7}/1159/...`, cartilha em `/pagina/3404/9/...` |
| Febraban Sindical: publicações | Pesquisa sobre Justiça Gratuita nas ações trabalhistas | PDF | Irregular | 27/05/2026 | `/pagina/3441/1200/pt-br/publicacoes-sindical` |
| **Censo da Diversidade** | Censo do setor bancário (programa desde 2007); edição 2025 com site próprio | Site | Plurianual | 2025 | `https://censo.diversidade.org.br/` (robots permite tudo) |
| Pesquisa de Aprendizagem Corporativa | Com a Deloitte (formulário) | PDF | Pontual | ago/2025 | §1 |
| Certificações e cursos (Febraban Educação) | Crescimento das certificações aparece em releases (ex.: release 4430, mar/2026) | HTML | — | — | §5 |
| Relatório de Transparência Salarial | Obrigação legal da FEBRABAN como empregadora (MTE) | PDF semestral | Semestral | 2º sem/2026 | `/pagina/3048/19/...` |
| Iniciativas de igualdade, etarismo | Releases e guia de comunicação inclusiva (Febraban Educação, jul/2025) | HTML/PDF | Irregular | — | releases |

## 6H. Eventos da FEBRABAN e o conteúdo que publicam

Os eventos já estão no `INVENTARIO.md` (Febraban Tech, Febraban SEC). Aqui o foco é **onde fica o conteúdo publicado** de cada um. Regra geral: os eventos rodam na plataforma `febrabantech.febraban.org.br/eventos/<slug>` (SPA). A cobertura sai como notícia no portal Febraban Tech (`sitemapnews.xml`), em releases e no YouTube institucional. **Não localizei apresentações em PDF publicadas de nenhum evento.**

| Evento | Quando | Conteúdo publicado | Onde |
|---|---|---|---|
| Febraban Tech | Ago (2026: 24–26/08; 2027: 24–26/08) | Notícias, vídeos, Arena Fintech, lançamento da Pesquisa de Tecnologia | §4 |
| Febraban SEC (fraudes, ciber, segurança bancária) | Mar (3ª edição em 18–19/03/2026) | Cobertura no portal Febraban Tech, releases, YouTube. Transmissão para inscritos | releases 4428/4434 |
| Congresso PLDFT + G-Risc (gestão de riscos) | Out–nov (16ª edição em 17–18/11/2026) | Cobertura (ex.: "PLDFT e GRisc recebem 3.200 visitas"), releases | `/temas/seguranca/...`; releases 4514/4521/4522 |
| Semarc Nacional (relacionamento com o consumidor) | Nov/2026 | Site do evento, release | `https://febrabantech.febraban.org.br/eventos/semarcnacional2026` |
| Fórum de Finanças Sustentáveis | Na COP (12/11/2025) | Release | release 4372 |
| Summits da Febraban Educação | Irregular | Páginas de summit | `https://febrabaneducacao.com.br/summits/` |
| Página antiga "Eventos" do portal | — | Calendários de 2015/2016 e um acervo de palestras com link quebrado (404) | `/eventos`. Sem uso |

---

## 7. Como consumir depois

Legenda de prioridade: **TB** = tecnologia-bancaria, **FB** = fraude-bancaria. A = alta, M = média, B = baixa.

| # | Item | Melhor caminho de ingestão | Frequência sugerida | TB | FB | Notas |
|---|---|---|---|---|---|---|
| 1 | Pesquisa FEBRABAN de Tecnologia Bancária | **Page diff** de `/pagina/3106/1117/pt-br/pesquisa` (extrair os `href` para `cmsarquivos…/PDF/`) + releases por JSON (`selectedText=Pesquisa FEBRABAN de Tecnologia`), seguido de **download do PDF novo e extração de texto** (`pdftotext`). Também vale olhar o `DT_INIC_VIGE` de `paginas/getitems?idSecao=1117` | Semanal; diária em abr–ago | **A** | M | Picos: abr–jun (Vol. 1) e o Febraban Tech (Vol. 2). Gera bons itens de "dados" (orçamento de TI, IA, cloud, cibersegurança) |
| 2 | Estudo de Tecnologias Emergentes (PDF) | **Page diff** de `/pagina/3443/1202/...` e `/pagina/3353/52/...` + JSON `idSecao=52` (`DT_INIC_VIGE`), seguido de PDF + texto | Semanal; diária em set–dez | **A** | M | Segurança Digital é uma das 6 teses (fraude com IA, IA defensiva, PQC) |
| 3 | Radar de Tecnologias (tecemergentes) | **HEAD** com `If-Modified-Since`/`ETag`. Quando mudar, um GET (28 MB) e parsing do HTML (cards de tecnologia: nome, domínio, maturidade, impacto; teses; cases) | Semanal | **A** | M | Não indexar os base64. Dá para tirar o diff do radar ano a ano (novo/reformulado/mantido) |
| 4 | Releases FEBRABAN | **JSON** `Noticias/GetItems?page=1` (8 itens com data e resumo), filtrando por regex de título/resumo. Substitui a página atual (§8) | Diária | M | **A** | Para FB: golpes, campanhas, Aliança, SSP-SP. Para TB: pesquisa, Febraban Tech, IA |
| 5 | Portal Febraban Tech (sitemapnews) | **Sitemap** `sitemapnews.xml` (título + data + keywords). Filtrar por `news:keywords` (IA, segurança cibernética, fraude, golpe) e pegar o `og:description` da página | Diária (o sitemap é rolante) | **A** | **A** | Melhor fonte contínua de conteúdo editorial sobre IA e fraude. Texto completo só com renderização JS |
| 6 | Site do evento febrabantech.com | **Sitemap** `febrabantech.com/sitemap.xml` (diff de `/noticias/<slug>`) | Semanal; diária em jul–set | M | M | 89 matérias de cobertura em 2026, com slugs descritivos (dá para filtrar pela URL). O sitemap vem de uma API "hmg", então pode quebrar |
| 7 | Laboratório de Segurança Cibernética | **Page diff** de `/pagina/3322/1108/...` (novos PDFs), seguido de PDF + texto | Quinzenal | M | **A** | Poucos itens/ano, mas de alto valor (IA generativa, ameaças, PQC, threat intel) |
| 8 | Febraban Podcast | **RSS** `anchor.fm/s/1b75a63c/podcast/rss`, filtrando por título (IA, fraude, golpe, ciber, quântica, Open Finance, dados) | Diária | M | M | Episódios semanais, só metadados (sem transcrição) |
| 9 | Observatório FEBRABAN | **Page diff** de `/pagina/3284/52/...`, seguido de PDF + texto | Mensal | M | M | Percepção pública de IA (jun/2026), segurança de dados |
| 10 | Relatório de Ouvidorias | **Page diff** de `/pagina/3244/52/...`, seguido de PDF | Mensal (pico em mar–abr) | B | M | 2025 tem foco em fraude e integridade digital |
| 11 | Golpes e Fraudes (AntiFraude) | **JSON** `Antifraude/PodGetItems` (diff por `IdAntifraude` + `DataPublicacao`) | Semanal | B | M | Bom para taxonomia/glossário de golpes, não para notícias |
| 12 | Fin, notícias | **RSS** `fin.org.br/feed/`, filtrando por fraude/golpe/Pix/scam | Diária | B | M | Entidade irmã, não é a FEBRABAN |
| 13 | YouTube institucional | RSS do YouTube (já existe) | Diária | M | M | Já monitorado. Só renomear (§8) |
| 14 | Radar FEBRABAN (Ipespe) | Page diff mensal | Mensal | B | B | Parado desde set/2025 |
| 15 | Selo de Prevenção a Fraudes / Aliança Nacional | Manual / page diff trimestral | Trimestral | B | M | Mudanças raras. As notícias chegam pelos releases |
| 16 | Pesquisa de Aprendizagem Corporativa | **Manual** (formulário) | — | B | B | Exige cadastro |
| 17 | CyberLab para associados, IRM, newsletter | **Não consumir** | — | — | — | Restritos / por e-mail |
| 18 | Séries de economia (ISEB, Expectativas, Panorama, Especial de Crédito) | Page diff, se um dia for útil | — | B | B | Fora do escopo |
| 19 | noomiscast, YouTube @febrabantech, RA institucional | **Não consumir** | — | — | — | Parados |
| 20 | Febraban Educação | Manual | — | B | B | Catálogo de cursos |

A tabela acima traz as prioridades para os dois temas. A tabela abaixo dá a **prioridade para um watch bancário genérico** (campo `priority.geral` no JSON) de todos os itens, incluindo os das seções §6A–§6H.

### 7.1 Prioridade geral (watch bancário genérico)

| Prioridade geral | Itens (id no JSON) | Caminho de ingestão |
|---|---|---|
| **Alta** | `febraban-releases` · `febraban-notas-posicionamentos` · `febraban-publicacoes-indice` · `febraban-pesquisa-tecnologia-bancaria` · `febraban-estudo-tecnologias-emergentes` · `febraban-radar-tecnologias` · `febrabantech-portal-noticias` · `febraban-pesquisa-expectativas` | JSON de notícias (diário, filtros por termo), JSON `paginas/getitems` (semanal), page diff das listagens + PDF/texto, `sitemapnews.xml` (diário), HEAD do radar |
| **Média** | Economia e crédito: `febraban-iseb`, `febraban-panorama-credito`, `febraban-pesquisa-especial-credito`, `febraban-estudo-spread`, `febraban-premio-anpec`. Regulação e autorregulação: `febraban-autorregulacao-normativos`, `febraban-autorregulacao-consignado`, `febraban-autorregulacao-relatorio`, `febraban-forum-pagamentos`. Consumidor: `febraban-relatorio-ouvidorias`, `febraban-observatorio`. ESG: `febraban-taxonomia-financas-sustentaveis`, `febraban-relatorio-cop`, `febraban-estudos-riscos-socioambientais`. Inclusão: `meu-bolso-em-dia`, `isfb-saude-financeira`. Pagamentos: `febraban-layouts-padroes`. Pessoas: `febraban-convencoes-coletivas`. Tecnologia e mídia: `febraban-cyberlab-estudos`, `febrabantech-evento-site`, `febraban-podcast`, `youtube-febraban-oficial`, `fin-noticias`. Eventos: `febraban-eventos-pldft-grisc`, `febraban-sec-evento` | Page diff mensal das listagens; padrões de URL previsíveis (Pesquisa Especial de Crédito, ISEB, I-SFB) permitem HEAD no período esperado; sitemaps (Meu Bolso em Dia, evento); RSS (podcast, Fin, YouTube) |
| **Baixa** | Demais itens: estudos avulsos, guias pontuais, utilitários e datasets de referência (códigos de arrecadação, feriados, extratos), itens institucionais, canais parados, conteúdo restrito | Manual ou page diff trimestral; não consumir os parados ou restritos |

**Padrões previsíveis úteis** (dá para checar com HEAD sem rastrear a listagem):
- Pesquisa Especial de Crédito: `Pesquisa%20Especial%20Cr%C3%A9dito_{mês}_{AA}%20-%20vers%C3%A3o%20imprensa.pdf`
- I-SFB: `A_Saude_Financeira_do_Brasileiro_{AAAA}.pdf` (a edição 2025 só foi achada assim)
- Relatório COP: `Relat%C3%B3rio%20Febraban_COP{NN}.pdf`
- Os demais (ISEB, Expectativas, Panorama) variam a grafia e pedem page diff.

**Links quebrados encontrados** (para não tratar como "nova publicação" quando voltarem):
- Guia de Compliance (404)
- Recomendação SARB 001/2024 (404)
- Primeiro PDF da listagem do Relatório da Autorregulação (404)
- `/pagina/3150/52/...`, `/pagina/3317/1122/...` e `/pagina/3271/50/...` redirecionam para a home
- Acervo de palestras de `/eventos` (404)

**Detecção de arquivos novos (padrão comum).** O único padrão estável é o diretório `https://cmsarquivos.febraban.org.br/Arquivos/documentos/PDF/`. Não existe índice dele (a raiz dá 403) e os nomes são livres. A forma confiável de descoberta é extrair dos HTMLs de listagem do portal (e dos releases) todos os links que começam com esse prefixo, normalizar (decodificar, Unicode NFC, minúsculas) e comparar com o que já foi visto. O `Last-Modified` dos PDFs é confiável como data de publicação.

## 8. Correções nas fontes já monitoradas (para decidir depois; não alterei nada)

1. **"Febraban Tech (YouTube)"** em `topics/tecnologia-bancaria/sources.json` aponta para `UCOWExcTuCxhqwRkyiu0z35w`, que é o canal **institucional FEBRABAN** (@FEBRABANoficial), o mesmo do "Febraban SEC (YouTube)" do tema fraude. O canal realmente chamado FEBRABAN TECH (`UCndkRD4447sJHXukUIU7UiA`) está inativo desde jan/2024. O canal institucional é a escolha certa (ele publica o conteúdo do Febraban Tech e do estudo de tecnologias emergentes). O que está errado é só o nome. O comentário `_doc` em `topics/fraude-bancaria/sources.json` ("Pendente: Febraban Tech pelo canal do YouTube") já está resolvido por esse mesmo canal.
2. **"Febraban — notícias"** em `topics/fraude-bancaria/sources.json` usa `https://portal.febraban.org.br/pagina/3271/50/pt-br/noticias`, que hoje **redireciona para a home**. Funciona por acaso (a home mostra os 4 últimos releases e o pattern `/noticia/\d+/pt-br/?$` casa), mas pega só 4 itens e sem data. Melhor trocar pelo JSON `https://portal.febraban.org.br/Noticias/GetItems?page=1&selectedData=&selectedText=` (8 itens, com data e resumo) ou pela listagem `/Noticias`.

## 9. Limitações deste levantamento

- As SPAs (`febrabantech.febraban.org.br`, `febrabantech.com`) não foram renderizadas. Ficaram sem verificação a programação detalhada, se os vídeos exigem login e se há PDFs de apresentações. Não tentei contornar o erro 500 do bundle JS nem descobrir APIs internas.
- Baixei só 4 PDFs pequenos, para confirmar autoria e data, e o HTML do radar, para ver a estrutura. Os arquivos foram descartados em seguida.
- O histórico da Pesquisa de Tecnologia Bancária antes de 2023 não está listado no portal. O início da série foi estimado pela numeração "34ª edição em 2026".
- Na ampliação (§6A–§6H), as datas de "última edição" vêm do `Last-Modified` dos arquivos (HEAD) ou do rótulo da listagem. Não abri esses PDFs. As edições anteriores do Censo da Diversidade não foram verificadas uma a uma. A página de Indicadores do consignado e a lista de associados são renderizadas por JS e não foram lidas.
