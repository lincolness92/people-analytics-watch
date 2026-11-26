// The "Pergunte" agent: answers a question about one topic using only its archive, citing sources as [n].
// It is a client of the query core (archive.js) like any other interface; the LLM is injected, so the
// agent can be tested with a fake one and reused by any adapter (site API today; REST/MCP/A2A later).
//
// 1) the LLM expands the question into PT+EN search terms; 2) archive.search ranks the archive;
// 3) the LLM answers from the top sources only.

import { loadFulltext, paperKey, rankChunks, search } from "./archive.js";
import { KIND, Tracer } from "./trace.js";

/** Run one LLM call inside an LLM span with OpenInference attributes (messages, model, tokens, fallbacks). */
async function tracedLLM(tracer, parent, name, llm, messages, maxTokens, opts) {
  return tracer.span(name, KIND.LLM, { "llm.invocation_parameters": JSON.stringify({ max_tokens: maxTokens, ...opts }) }, parent, async (s) => {
    messages.forEach((m, i) => s.set(`llm.input_messages.${i}.message.role`, m.role).set(`llm.input_messages.${i}.message.content`, m.content));
    s.set("input.value", messages.at(-1).content);
    try {
      const r = await llm(messages, maxTokens, opts);
      s.setMany({ "llm.model_name": r.model, "output.value": r.text, "llm.output_messages.0.message.role": "assistant",
        "llm.output_messages.0.message.content": r.text,
        "llm.token_count.prompt": r.usage?.prompt_tokens, "llm.token_count.completion": r.usage?.completion_tokens,
        "llm.token_count.total": r.usage?.total_tokens, "llm.fallbacks": (r.attempts || []).filter((a) => !a.ok).length,
        "llm.cost.total": r.cost, "llm.provider.route": String(r.model).startsWith("deepseek:") ? "deepseek" : `huggingface:${String(r.model).split(":")[1] || "auto"}`,
        "llm.attempts": JSON.stringify(r.attempts || []) });
      return r;
    } catch (e) {
      s.set("llm.attempts", JSON.stringify(e.attempts || []));
      throw e;
    }
  });
}

/** A source's text without its title repeated at the start (the title is printed just before it). */
function bodyOf(s) {
  let t = String(s.text || "");
  for (const title of [s.title, s.original_title]) {
    if (title && t.startsWith(title)) t = t.slice(title.length).trimStart();
  }
  return t;
}

/** OpenInference retrieval documents on a span. */
function setDocs(span, docs) {
  docs.forEach((d, i) => span.setMany({ [`retrieval.documents.${i}.document.id`]: d.url || d.title,
    [`retrieval.documents.${i}.document.score`]: d.score, [`retrieval.documents.${i}.document.content`]: `${d.title}\n${(d.text || "").slice(0, 500)}`,
    [`retrieval.documents.${i}.document.metadata`]: JSON.stringify({ kind: d.kind, when: d.when, topic: d.topic || null }) }));
}

const FULLTEXT_PAPERS = 8;   // hits whose stored full text is searched (passages then compete across papers)
const FULLTEXT_CHUNKS = 6;   // passages added to the sources
const OTHER_WEIGHT = 0.75;   // other topics' hits compete on score with the home topic's, discounted
const SCORE_FLOOR = 0.35;    // hits scoring under this fraction of the best one are left out (fewer, more pertinent sources)
const SOURCE_CHARS = 1400;   // text per source shown to the LLM
const MAX_OTHER = 8;         // at most this many sources from other topics
const MAX_HITS = 20;
export const ANSWER_TOKENS = 8000;

export const NOT_FOUND = "Não encontrei nada no arquivo deste tema sobre isso. Tente outras palavras, ou um assunto mais próximo dos temas cobertos.";

const TERMS_SYSTEM = "Você gera termos de busca para um arquivo de papers acadêmicos (a maioria em inglês). Responda SÓ com uma " +
  "linha de 8 a 20 termos/expressões separados por vírgula, em português E em inglês, sem raciocínio, sem explicação. " +
  "Traduza o jeito de falar da pergunta para o vocabulário da literatura: sinônimos técnicos, nomes de construtos e de " +
  "métodos, e nomes de modelos ou papers conhecidos do assunto (ex.: \"auto supervisionado com Transformer em transações\" → " +
  "self-supervised, pre-training, foundation model, transaction foundation model, sequence model, BERT, GPT). Se a pergunta " +
  "tiver um erro de digitação provável, inclua também a forma correta (ex.: \"modelos funcionais\" falando de IA → " +
  "modelos fundacionais, foundation models).";

/** The term list from the expansion reply, or [] when the model answered with something else (e.g. its reasoning). */
export function parseTerms(text) {
  const clean = String(text || "").replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  const lines = clean.split("\n").map((l) => l.trim()).filter(Boolean);
  // the list is a single comma-separated line; pick the last such line, never prose or numbered reasoning
  const line = [...lines].reverse().find((l) => (l.match(/,/g) || []).length >= 4 && !/^\s*(\d+\.|[*-])/.test(l) && l.length < 600);
  if (!line) return [];
  const terms = line.split(/[,;]/).map((t) => t.replace(/^["'*\s]+|["'*.\s]+$/g, "")).filter((t) => t && t.length <= 60);
  return terms.length >= 4 ? terms.slice(0, 24) : [];
}

// What kind of question it is decides the shape of the answer (an onboarding panorama is not three paragraphs).
// Deterministic on purpose: cheap, testable, same for every model. First match wins; "default" otherwise.
const INTENTS = [
  ["onboarding", /\b(entrando|chegando|cheguei|comecei|novo na|nova na|n[aã]o conhe[cç]o|me (conta|explica) (tudo|um pouco)|panorama|vis[aã]o geral|introdu[cç][aã]o)\b/i],
  ["training", /\b(plano de (qualifica|capacita|estudo|forma|desenvolvimento)|trilha|curr[ií]culo|ementa|roteiro de estudo|qualifica[cç][aã]o)/i],
  ["project", /\b(projeto|ideia de|faz sentido|vale a pena (fazer|investir)|devo (fazer|adotar|implementar))\b/i],
  ["regulation", /\b(regula[cçt]|regulat[oó]ri|norma(s|tiv)|bacen|banco central|resolu[cç][aã]o|circular|lgpd|anpd|ai act|compliance|supervis[aã]o|legisla[cç][aã]o|lei\b)/i],
  ["code", /\b(c[oó]digo|implementa[cç][aã]o|implementar|reposit[oó]rio|github|biblioteca|open source|c[oó]digo aberto)\b/i],
  ["industry", /\b(empresas|bancos e fintechs|fintechs|casos concretos|o que (os|as) .{0,40}est[aã]o fazendo)\b/i],
  ["who", /\b(quem (s[aã]o|[eé]|devo|deveria|est[aá])|pesquisador(es|as)? de refer[eê]ncia|grupos de pesquisa|quem acompanhar|(pessoas|institui[cç][oõ]es|grupos)[^.?]{0,40}\b(de refer[eê]ncia|acompanhar))/i],
  ["evolution", /\b(evolu|hist[oó]ri|marcos|ao longo do tempo|como (chegamos|surgiu))/i],
  ["evidence", /\b(ganho|resultado|evid[eê]ncia|funciona|medid[oa]|quanto|impacto|roi|retorno)\b/i],
];
export function intentOf(question) {
  return (INTENTS.find(([, re]) => re.test(question)) || ["default"])[0];
}

const FORMATS = {
  onboarding: `Formato: um panorama para quem está chegando, em seções curtas com títulos em **negrito** numa linha própria, nesta ordem: ` +
    `**O problema**, **Como a área chegou até aqui** (fases e marcos com ano), **O estado da arte hoje** (métodos e o que foi medido), ` +
    `**O que está em aberto**, **Tendências**, **Quem acompanhar** (pessoas e instituições das fontes), **Por onde começar** (leituras, código e dados das fontes). ` +
    `Até ~700 palavras; listas com "- " quando ajudarem.`,
  training: `Formato: um plano em etapas (ex.: semanas ou meses) com títulos em **negrito** numa linha própria; em cada etapa, ` +
    `objetivo, leituras das fontes (cite [n]), prática (código, dados ou exercício) e como verificar o aprendizado. Cubra o período pedido inteiro. Até ~700 palavras.`,
  project: `Formato: seções com títulos em **negrito** numa linha própria: **Veredito** (franco, em 2 frases), **O que já existe** (trabalhos e casos parecidos), ` +
    `**Desenho sugerido pelo estado da arte**, **Riscos** (técnicos, de dados, regulatórios), **Próximos passos**. Até ~600 palavras.`,
  code: `Formato: lista com "- " de implementações das fontes (as do tipo "código" trazem o repositório): nome com o link, a que paper corresponde, ` +
    `se é dos autores, linguagem e licença quando houver; depois um parágrafo **Por onde começar**. Se as fontes não têm código, diga isso em uma frase ` +
    `e indique no máximo 4 papers que descrevem o método e os dados que usam; não liste o acervo.`,
  who: `Formato: lista com "- " de no máximo 8 pessoas, grupos e instituições das fontes (as do tipo "pessoa/instituição de referência" e os autores dos papers), ` +
    `da mais importante para a menos; cada uma com afiliação (só quando a fonte traz) e por que importa (o trabalho de referência, citado). ` +
    `Não liste todos os coautores de um paper; pessoa histórica vai em linha separada. Separe pesquisa e prática quando der. Não traga código.`,
  industry: `Formato: lista com "- " de casos, cada um com empresa, país, o que fez, resultado ou escala (ou "sem resultado informado") e o ano da fonte; ` +
    `separe **Brasil** e **Mundo** com títulos em negrito numa linha própria. Se não houver caso brasileiro ou resultado medido, diga isso na primeira linha.`,
  evolution: `Formato: fases em ordem cronológica, cada uma com título em **negrito** numa linha própria, os marcos (ano, trabalho, citado) e o que a fase resolveu; ` +
    `feche com **Onde estamos agora**. Até ~600 palavras.`,
  regulation: `Formato: comece pelas normas das fontes do tipo "norma" — para cada uma, em lista com "- ": regulador, tipo e número, data, ` +
    `se está revogada, o que exige (concreto) e a que técnica ou processo do tema se liga, citada. Separe **Brasil** e **Internacional** com títulos em negrito numa linha própria. ` +
    `Feche com **O que isso exige de nós**: 2 a 4 pontos práticos. Se as fontes não trazem a norma que a pergunta pede, diga qual falta. Até ~600 palavras.`,
  evidence: `Abra com o que foi medido (números, contra qual baseline, com que dados) e priorize casos de bancos e empresas com dados próprios; ` +
    `deixe o contexto geral para o fim. Formato: 2 a 4 parágrafos curtos; pode usar **negrito** em termos-chave.`,
  default: `Formato: 1 a 3 parágrafos curtos; pode usar **negrito** em termos-chave. Sem cabeçalhos.`,
};

function answerSystem(name, focus, intent = "default") {
  return `Você é o assistente do ${name}, um arquivo curado de pesquisa. Responda em PT-BR, de forma direta e concreta, ` +
    (focus ? `pensando em quem usa este arquivo: o que importa é ${focus}. ` : "") +
    `Use SOMENTE as fontes numeradas fornecidas. ` +
    `Antes de escrever, verifique se as fontes tratam do núcleo da pergunta (a norma, o número, o caso, o repositório ou a pessoa pedida). Se não tratam, ` +
    `a PRIMEIRA frase diz isso de forma específica ("as fontes não trazem nenhuma norma do Banco Central sobre X"); só depois diga o que elas cobrem. ` +
    `Exceção: se a pergunta pede o que é um termo ou conceito e nenhuma fonte o define, abra com uma definição curta (1 a 2 frases) ` +
    `começando por "Definição geral (não vem do arquivo):" — só o significado, sem números, nomes, casos nem citações —; ` +
    `na frase seguinte diga que o arquivo não traz a definição e então o que ele traz sobre o termo. ` +
    `Não substitua o que falta por assunto vizinho, nem diga que as fontes "cobrem bem" o que elas só mencionam. Uma fonte só entra se trata do assunto ` +
    `da pergunta: é melhor uma seção curta do que encaixar fonte de outro assunto para completar o formato. ` +
    `Diga o tipo de evidência: norma, estudo revisado, preprint ou paper triado, notícia ou relatório, ou leitura da curadoria (frases como "Lição:" são da curadoria). ` +
    `Percentuais de retrospectivas contam publicações, não o fenômeno; resultado sem desenho de medição é alegação. ` +
    `Não ligue fatos de fontes diferentes com conhecimento seu. Cite as fontes no texto como [1], [2] logo após cada afirmação. ` +
    `Não invente papers, números ou autores. Se as fontes não respondem bem à pergunta, diga isso claramente e diga o que elas cobrem. ` +
    `Fontes "paper triado" trazem o resumo original de papers que a curadoria avaliou mas não necessariamente destacou; ` +
    `"destaque", "marco" e "retrospectiva" já passaram por uma seleção mais rígida — prefira-os quando disserem o mesmo. ` +
    `Fontes "texto completo" são trechos do próprio paper (método, resultados, números): use-as para detalhes e cite-as. ` +
    `Fontes marcadas "· tema X" vêm do arquivo de outro tema: use-as quando completarem a resposta e diga de onde vêm. ` +
    `Fontes "pessoa/instituição/revista de referência" vêm da lista de acompanhamento da curadoria; "código" são repositórios achados nos papers; ` +
    `"norma" são normas e padrões de reguladores (o texto é uma ficha feita a partir da norma). ` +
    `Sem lista de referências no fim. ${FORMATS[intent] || FORMATS.default}`;
}

/** Passages from the stored full text of the best-ranked papers (shared store, see archive.loadPapers). */
async function fulltextSources(papers, hits, terms) {
  if (!papers) return [];
  // best passages across the full texts of the hits (at most 2 per paper), not "the first papers' passages"
  const cands = [];
  let used = 0;
  for (const h of hits) {
    if (used >= FULLTEXT_PAPERS) break;
    const key = h.url && paperKey(papers, h.url);
    const doc = key && (await loadFulltext(papers, key));
    if (!doc) continue;
    used++;
    for (const c of rankChunks(doc, terms, 2, 900, true)) {
      cands.push({ kind: "texto completo", title: `${doc.title} — ${c.section}`, url: h.url, when: String(doc.year || ""), text: c.text, score: c.score });
    }
  }
  return cands.sort((a, b) => b.score - a.score).slice(0, FULLTEXT_CHUNKS).map(({ score, ...c }) => c);
}

/**
 * @param archive  from archive.loadArchive
 * @param question the user's question
 * @param history  up to the last exchanges [{q, a}]
 * @param llm      async (messages, maxTokens) => {text, model}
 * @param papers   optional, from archive.loadPapers: adds passages of stored full texts
 * @param others   optional archives of the other topics: a few of their best hits join the sources
 * @returns {answer, model, sources: [{n, kind, title, url, when}]}; throws if the answering LLM call fails
 */
export async function ask({ archive, question, history = [], llm, papers = null, others = [], tracer = null, parent = null, attrs = {} }) {
  tracer ||= new Tracer();
  const root = tracer.start("ask", KIND.AGENT, { "input.value": question, "agent.topic": archive.slug,
    "agent.history": JSON.stringify(history.map((h) => h.q)), ...attrs }, parent);
  try {
    const out = await askInner({ archive, question, history, llm, papers, others, tracer, root });
    root.setMany({ "output.value": out.answer, "agent.sources": out.sources.length });
    return out;
  } catch (e) {
    root.error(e);
    throw e;
  } finally {
    root.end();
  }
}

async function askInner({ archive, question, history, llm, papers, others, tracer, root }) {
  const name = archive.name;
  // 1) search terms in PT and EN (titles are mostly English, questions Portuguese). Earlier questions only
  // help the model read follow-ups ("e sobre isso?"); they are not search terms of their own.
  let terms = [{ text: question, w: 1 }];
  try {
    const { text } = await tracedLLM(tracer, root, "expand_terms", llm, [
      { role: "system", content: TERMS_SYSTEM },
      { role: "user", content: `Tema do arquivo: ${name}.\nPergunta: ${question}${history.length ? `\nContexto anterior: ${history.map((h) => h.q).join(" | ")}` : ""}` },
    ], 300, { reasoning: "none" }); // a mechanical step: no hidden reasoning (faster, nothing to leak)
    tracer.spans.at(-1).attrs["expand.terms"] = JSON.stringify(parseTerms(text));
    // the list comes core concept first: weight decays with position so broad tail terms cannot outvote it
    terms = terms.concat(parseTerms(text).map((t, i) => ({ text: t, w: Math.max(0.35, 1 - 0.05 * i) })));
  } catch { /* fall back to the question's own words */ }

  // one ranking across topics: the home topic's hits and the others' (discounted) compete on BM25 score
  const rs = tracer.start("search", KIND.RETRIEVER, { "input.value": JSON.stringify(terms), "retrieval.topics": JSON.stringify([archive.slug, ...others.map((o) => o.slug)]) }, root);
  const pool = search(archive, terms, { k: MAX_HITS, scores: true });
  for (const o of others) {
    for (const h of search(o, terms, { k: MAX_OTHER, scores: true })) {
      pool.push({ ...h, score: h.score * OTHER_WEIGHT, topic: o.slug, kind: `${h.kind} · tema ${o.name}` });
    }
  }
  const seenUrls = new Set();
  let nOther = 0;
  const hits = [];
  const best = Math.max(0, ...pool.map((h) => h.score));
  for (const h of pool.sort((a, b) => b.score - a.score)) {
    if (hits.length >= MAX_HITS) break;
    if (h.score < SCORE_FLOOR * best) break;
    if (h.url && seenUrls.has(h.url)) continue;
    if (h.topic && nOther >= MAX_OTHER) continue;
    if (h.url) seenUrls.add(h.url);
    if (h.topic) nOther++;
    hits.push(h);
  }
  setDocs(rs, hits);
  rs.setMany({ "retrieval.hits": hits.length, "retrieval.from_other_topics": nOther, "retrieval.pool": pool.length }).end();
  if (!hits.length) return { answer: NOT_FOUND, model: null, sources: [], terms: terms.map((t) => t.text) };
  const passages = await tracer.span("fulltext", KIND.RETRIEVER, { "input.value": JSON.stringify(terms.slice(0, 8)) }, root, async (s) => {
    const p = await fulltextSources(papers, hits, terms);
    setDocs(s, p);
    s.set("retrieval.passages", p.length);
    return p;
  });
  const sources = [...hits, ...passages];

  // 2) answer from the sources only
  const block = sources.map((s, i) =>
    `[${i + 1}] (${s.kind}${s.when ? `, ${s.when}` : ""}${s.venue ? `, ${s.venue}` : ""}) ${s.title}\n${bodyOf(s).slice(0, SOURCE_CHARS)}`).join("\n\n");
  const intent = intentOf(question);
  root.set("agent.intent", intent);
  const messages = [{ role: "system", content: answerSystem(name, archive.data.topic?.focus, intent) }];
  for (const h of history) messages.push({ role: "user", content: h.q }, { role: "assistant", content: h.a });
  messages.push({ role: "user", content: `Fontes:\n\n${block}\n\nPergunta: ${question}` });
  // ANSWER_TOKENS leaves room for the hidden reasoning some providers turn on by default; "low" makes every
  // provider reason the same small amount (a cut-off answer counts as a failed route, see server/llm.js).
  const { text: answer, model } = await tracedLLM(tracer, root, "answer", llm, messages, ANSWER_TOKENS, { reasoning: "low", expectOut: 1500 });
  return { answer, model, intent, terms: terms.map((t) => t.text), sources: sources.map((s, i) => ({ n: i + 1, kind: s.kind, title: s.title, url: s.url, when: s.when })) };
}
