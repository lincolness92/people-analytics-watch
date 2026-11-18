// Tests for the serving core (server/) and the /api/ask adapter. Run: node --test tests/js
import { test } from "node:test";
import assert from "node:assert/strict";
import { corpus, getAnnual, getDigest, getPaper, listTopics, loadArchive, rank, search, tokens } from "../../server/archive.js";
import { ask, NOT_FOUND } from "../../server/agent.js";

const DATA = {
  topic: { slug: "fraude-bancaria", name: "Bank Fraud Watch" },
  topics: [{ slug: "people-analytics", name: "People Analytics Watch" }, { slug: "fraude-bancaria", name: "Bank Fraud Watch" }],
  themes: { mules_aml: "🕸️ Contas laranja, mulas & PLD/CFT", cards: "💳 Cartões & e-commerce" },
  digests: [
    { date: "2026-11-17", trend: "Golpes via Pix crescem.", items: [{ title: "Money mule detection with graph neural networks",
      url: "https://doi.org/1", venue: "KDD", summary: "Grafos para contas mula.", theme: "mules_aml", authors: ["A. Silva"] }],
      quick: [{ title: "Card-not-present fraud", url: "https://doi.org/2", note: "cartões" }] },
    { date: "2026-11-16", items: [], quick: [] },
  ],
  evolution: { generated: "2026-11-17", eras: [{ label: "2010–2017", title: "ML", summary: "", milestones: [
    { title: "Credit card fraud detection: a realistic modeling", url: "https://doi.org/3", year: 2017, why: "Concept drift.", theme: "cards" }] }],
    now: { summary: "Fronteira em grafos.", open_questions: [] } },
  annual: { 2026: { year: 2026, partial: true, overview: "Mulas cresceram +224%.", innovation: "Academia.",
    trends: [{ title: "Grafos e mulas", text: "Money mule +224%." }],
    highlights: [{ title: "Federated AML", url: "https://doi.org/4", date: "2026-03-01", why: "Lavagem.", theme: "mules_aml" }] } },
};
const LIBRARY = [
  { title: "Money mule detection with graph neural networks", url: "https://doi.org/1", abstract: "dup of the digest item" },
  { title: "Synthetic identity fraud in onboarding", url: "https://doi.org/5", abstract: "KYC and synthetic identities.", score: 6 },
];
const archive = { slug: "fraude-bancaria", name: "Bank Fraud Watch", data: DATA, library: LIBRARY };

test("tokens folds accents, drops stopwords and plurals", () => {
  assert.deepEqual(tokens("Detecção de contas laranjas"), ["deteccao", "conta", "laranja"]);
});

test("corpus covers every part of the archive and skips library duplicates", () => {
  const kinds = corpus(DATA, LIBRARY).map((d) => d.kind);
  assert.deepEqual(kinds, ["paper", "paper", "tendência", "marco", "evolução", "retrospectiva 2026 (parcial)",
    "retrospectiva 2026 (parcial)", "retrospectiva 2026 (parcial)", "destaque de 2026", "paper triado"]);
});

test("search ranks by relevance and can filter by kind", () => {
  assert.ok(search(archive, "money mule graph", { k: 3 }).some((d) => d.url === "https://doi.org/1"));
  assert.equal(search(archive, "graph neural networks", { kinds: ["paper"] })[0].url, "https://doi.org/1");
  assert.equal(search(archive, "synthetic identity onboarding")[0].kind, "paper triado");
  assert.ok(search(archive, "mule", { kinds: ["retrospectiva", "destaque"] }).every((d) => /^(retrospectiva|destaque)/.test(d.kind)));
  assert.deepEqual(rank(corpus(DATA, LIBRARY), ["inexistente"]), []);
});

test("query helpers", () => {
  assert.equal(listTopics(archive).length, 2);
  assert.equal(getDigest(archive).date, "2026-11-17");
  assert.equal(getDigest(archive, "2026-11-16").date, "2026-11-16");
  assert.equal(getDigest(archive, "2000-01-01"), null);
  assert.equal(getAnnual(archive, 2026).overview, "Mulas cresceram +224%.");
});

test("getPaper finds every appearance of a paper", async () => {
  assert.deepEqual((await getPaper(archive, "https://doi.org/1")).appearances.map((a) => a.in), ["digest 2026-11-17", "biblioteca"]);
  assert.equal(await getPaper(archive, "https://nope"), null);
});

test("loadArchive validates the slug and tolerates a missing library", async () => {
  const files = { "/fraude-bancaria/data.json": DATA };
  const fetchAsset = async (p) => (files[p] ? new Response(JSON.stringify(files[p])) : new Response("", { status: 404 }));
  assert.equal(await loadArchive(fetchAsset, "../etc"), null);
  assert.equal(await loadArchive(fetchAsset, "nao-existe"), null);
  const a = await loadArchive(fetchAsset, "fraude-bancaria");
  assert.equal(a.name, "Bank Fraud Watch");
  assert.deepEqual(a.library, []);
});

test("agent answers from ranked sources and cites them", async () => {
  const calls = [];
  const llm = async (messages, maxTokens) => {
    calls.push(messages);
    return maxTokens === 300 ? { text: "money mule, contas laranja, graph, mule accounts, laranjas", model: "fake" } : { text: "Resposta [1].", model: "fake" };
  };
  const r = await ask({ archive, question: "Como detectar contas laranja?", llm });
  assert.equal(r.answer, "Resposta [1].");
  assert.equal(r.sources[0].n, 1);
  assert.equal(r.sources[0].url, "https://doi.org/1");
  assert.match(calls[1].at(-1).content, /^Fontes:\n\n\[1\] \(paper, 2026-11-17, KDD\)/);
});

test("agent ignores reasoning instead of terms, and adds hits from other topics", async () => {
  const { parseTerms } = await import("../../server/agent.js");
  assert.deepEqual(parseTerms("Thinking Process:\n1. **Analyze:** terms, one, line, comma, separated"), []);
  assert.deepEqual(parseTerms("<think>x, y, z, w, v</think>\nself-supervised, foundation model, pre-training, transformer, BERT"),
    ["self-supervised", "foundation model", "pre-training", "transformer", "BERT"]);
  const other = { slug: "tecnologia-bancaria", name: "Bank Tech & AI Watch", library: [], index: null,
    data: { themes: {}, digests: [{ date: "2026-11-10", items: [{ title: "PRAGMA foundation model for banking events", url: "https://doi.org/9", summary: "self-supervised" }], quick: [] }] } };
  const llm = async (m, max) => (max === 300 ? { text: "Thinking...\nself-supervised, foundation model, pre-training, transformer, mule" } : { text: "ok", model: "f" });
  const r = await ask({ archive, question: "modelos fundacionais auto supervisionados?", llm, others: [other] });
  const cross = r.sources.find((s) => s.url === "https://doi.org/9");
  assert.ok(cross, "hit from the other topic");
  assert.match(cross.kind, /· tema Bank Tech & AI Watch$/);
});

test("agent says so when nothing matches, without a second LLM call", async () => {
  let n = 0;
  const llm = async () => { n++; throw new Error("down"); };
  const r = await ask({ archive, question: "receita de bolo de chocolate", llm });
  assert.deepEqual({ answer: r.answer, model: r.model, sources: r.sources }, { answer: NOT_FOUND, model: null, sources: [] });
  assert.equal(n, 1);
});

test("/api/ask adapter keeps the response contract", async () => {
  const { onRequestPost } = await import("../../functions/api/ask.js");
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (_url, init) => {
    const body = JSON.parse(init.body);
    const text = body.max_tokens === 300 ? "money mule, graph, mule account, laranja, fraud" : "Use grafos [1].";
    return new Response(JSON.stringify({ choices: [{ message: { content: text } }] }));
  };
  try {
    const kv = new Map();
    const env = {
      HF_TOKEN: "x",
      ASSETS: { fetch: async (u) => new URL(u).pathname === "/fraude-bancaria/data.json"
        ? new Response(JSON.stringify(DATA)) : new Response("", { status: 404 }) },
      FEEDBACK: { get: async (k) => kv.get(k) ?? null, put: async (k, v) => { kv.set(k, v); } },
    };
    const post = (b) => onRequestPost({ request: new Request("https://site/api/ask", { method: "POST", body: JSON.stringify(b) }), env });
    const ok = await (await post({ topic: "fraude-bancaria", question: "money mule com grafos?", voter: "v1" })).json();
    assert.equal(ok.ok, true);
    assert.equal(ok.answer, "Use grafos [1].");
    assert.deepEqual(Object.keys(ok.sources[0]), ["n", "kind", "title", "url", "when"]);
    assert.ok([...kv.keys()].some((k) => k.startsWith("ask:fraude-bancaria:")));
    assert.equal((await post({ topic: "../x", question: "pergunta válida" })).status, 400);
    assert.equal((await post({ topic: "nao-existe", question: "pergunta válida" })).status, 404);
  } finally {
    globalThis.fetch = realFetch;
  }
});
