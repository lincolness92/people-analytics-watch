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

/** OpenInference retrieval documents on a span. */
function setDocs(span, docs) {
  docs.forEach((d, i) => span.setMany({ [`retrieval.documents.${i}.document.id`]: d.url || d.title,
    [`retrieval.documents.${i}.document.score`]: d.score, [`retrieval.documents.${i}.document.content`]: `${d.title}\n${(d.text || "").slice(0, 500)}`,
    [`retrieval.documents.${i}.document.metadata`]: JSON.stringify({ kind: d.kind, when: d.when, topic: d.topic || null }) }));
}

const FULLTEXT_PAPERS = 8;   // hits whose stored full text is searched (passages then compete across papers)
const FULLTEXT_CHUNKS = 6;   // passages added to the sources
const OTHER_WEIGHT = 0.85;   // other topics' hits compete on score with the home topic's, slightly discounted
const MAX_OTHER = 8;         // at most this many sources from other topics
const MAX_HITS = 20;

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

function answerSystem(name, focus) {
  return `Você é o assistente do ${name}, um arquivo curado de pesquisa. Responda em PT-BR, de forma direta e concreta, ` +
    (focus ? `pensando em quem usa este arquivo: o que importa é ${focus}. ` : "") +
    `Quando a pergunta for sobre ganhos, resultados ou evidência, abra com o que foi medido (números, contra qual baseline, ` +
    `com que dados) e priorize casos de bancos e empresas com dados próprios; deixe o contexto geral para o fim. ` +
    `usando SOMENTE as fontes numeradas fornecidas. Cite as fontes no texto como [1], [2] logo após cada afirmação. ` +
    `Não invente papers, números ou autores. Se as fontes não respondem bem à pergunta, diga isso claramente e diga o que elas cobrem. ` +
    `Fontes "paper triado" trazem o resumo original de papers que a curadoria avaliou mas não necessariamente destacou; ` +
    `"destaque", "marco" e "retrospectiva" já passaram por uma seleção mais rígida — prefira-os quando disserem o mesmo. ` +
    `Fontes "texto completo" são trechos do próprio paper (método, resultados, números): use-as para detalhes e cite-as. ` +
    `Fontes marcadas "· tema X" vêm do arquivo de outro tema: use-as quando completarem a resposta e diga de onde vêm. ` +
    `Formato: 1 a 3 parágrafos curtos; pode usar **negrito** em termos-chave. Sem cabeçalhos, sem lista de referências no fim.`;
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
  for (const h of pool.sort((a, b) => b.score - a.score)) {
    if (hits.length >= MAX_HITS) break;
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
    `[${i + 1}] (${s.kind}${s.when ? `, ${s.when}` : ""}${s.venue ? `, ${s.venue}` : ""}) ${s.title}\n${s.text.slice(0, 900)}`).join("\n\n");
  const messages = [{ role: "system", content: answerSystem(name, archive.data.topic?.focus) }];
  for (const h of history) messages.push({ role: "user", content: h.q }, { role: "assistant", content: h.a });
  messages.push({ role: "user", content: `Fontes:\n\n${block}\n\nPergunta: ${question}` });
  const { text: answer, model } = await tracedLLM(tracer, root, "answer", llm, messages, 2500, {});
  return { answer, model, terms: terms.map((t) => t.text), sources: sources.map((s, i) => ({ n: i + 1, kind: s.kind, title: s.title, url: s.url, when: s.when })) };
}
