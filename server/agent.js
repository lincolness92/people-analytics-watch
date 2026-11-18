// The "Pergunte" agent: answers a question about one topic using only its archive, citing sources as [n].
// It is a client of the query core (archive.js) like any other interface; the LLM is injected, so the
// agent can be tested with a fake one and reused by any adapter (site API today; REST/MCP/A2A later).
//
// 1) the LLM expands the question into PT+EN search terms; 2) archive.search ranks the archive;
// 3) the LLM answers from the top sources only.

import { search } from "./archive.js";

export const NOT_FOUND = "Não encontrei nada no arquivo deste tema sobre isso. Tente outras palavras, ou um assunto mais próximo dos temas cobertos.";

const TERMS_SYSTEM = "Você gera termos de busca. Responda só com uma linha de 8 a 20 termos/expressões separados por vírgula, " +
  "em português E em inglês (sinônimos, conceitos técnicos, nomes de construtos), sem explicação.";

function answerSystem(name) {
  return `Você é o assistente do ${name}, um arquivo curado de pesquisa. Responda em PT-BR, de forma direta e concreta, ` +
    `usando SOMENTE as fontes numeradas fornecidas. Cite as fontes no texto como [1], [2] logo após cada afirmação. ` +
    `Não invente papers, números ou autores. Se as fontes não respondem bem à pergunta, diga isso claramente e diga o que elas cobrem. ` +
    `Fontes "paper triado" trazem o resumo original de papers que a curadoria avaliou mas não necessariamente destacou; ` +
    `"destaque", "marco" e "retrospectiva" já passaram por uma seleção mais rígida — prefira-os quando disserem o mesmo. ` +
    `Formato: 1 a 3 parágrafos curtos; pode usar **negrito** em termos-chave. Sem cabeçalhos, sem lista de referências no fim.`;
}

/**
 * @param archive  from archive.loadArchive
 * @param question the user's question
 * @param history  up to the last exchanges [{q, a}]
 * @param llm      async (messages, maxTokens) => {text, model}
 * @returns {answer, model, sources: [{n, kind, title, url, when}]}; throws if the answering LLM call fails
 */
export async function ask({ archive, question, history = [], llm }) {
  const name = archive.name;
  // 1) search terms in PT and EN (titles are mostly English, questions Portuguese)
  let terms = [question, ...history.map((h) => h.q)];
  try {
    const { text } = await llm([
      { role: "system", content: TERMS_SYSTEM },
      { role: "user", content: `Tema do arquivo: ${name}.\nPergunta: ${question}${history.length ? `\nContexto anterior: ${history.map((h) => h.q).join(" | ")}` : ""}` },
    ], 300);
    terms = terms.concat(text.split(/[,;\n]/));
  } catch { /* fall back to the question's own words */ }

  const sources = search(archive, terms);
  if (!sources.length) return { answer: NOT_FOUND, model: null, sources: [] };

  // 2) answer from the sources only
  const block = sources.map((s, i) =>
    `[${i + 1}] (${s.kind}${s.when ? `, ${s.when}` : ""}${s.venue ? `, ${s.venue}` : ""}) ${s.title}\n${s.text.slice(0, 900)}`).join("\n\n");
  const messages = [{ role: "system", content: answerSystem(name) }];
  for (const h of history) messages.push({ role: "user", content: h.q }, { role: "assistant", content: h.a });
  messages.push({ role: "user", content: `Fontes:\n\n${block}\n\nPergunta: ${question}` });
  const { text: answer, model } = await llm(messages, 2500);
  return { answer, model, sources: sources.map((s, i) => ({ n: i + 1, kind: s.kind, title: s.title, url: s.url, when: s.when })) };
}
