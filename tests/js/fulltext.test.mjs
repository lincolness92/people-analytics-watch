// Full-text store on the serving side: paper lookup, passage ranking, read_paper/list_repos tools, agent passages.
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadPapers, paperKey, rankChunks } from "../../server/archive.js";
import { ask } from "../../server/agent.js";
import { callTool } from "../../server/tools.js";

const INDEX = {
  "arxiv:2303.17564": { title: "BloombergGPT", year: 2023, topics: ["tecnologia-bancaria"], roles: ["marco"], has_text: true,
    file: "arxiv_2303.17564.json", urls: ["https://doi.org/10.48550/arxiv.2303.17564", "https://openalex.org/W1"], repos: [] },
  "doi:10.1/closed": { title: "Closed classic", topics: ["people-analytics"], has_text: false, reason: "sem cópia aberta", urls: ["https://doi.org/10.1/CLOSED"] },
};
const PAPER = { key: "arxiv:2303.17564", title: "BloombergGPT", year: 2023, source: { kind: "html", url: "https://arxiv.org/html/2303.17564" },
  sections: [{ name: "Introduction", text: "We train a 50 billion parameter model on financial data.\n\nIt mixes FinPile with public datasets." },
             { name: "Results", text: "BloombergGPT outperforms similarly sized models on financial tasks such as sentiment analysis and NER." }],
  repos: [{ url: "https://github.com/acme/fin-eval", own: true, context: "code is available at github.com/acme/fin-eval" }] };
const REPOS = { "https://github.com/acme/fin-eval": { url: "https://github.com/acme/fin-eval", papers: ["arxiv:2303.17564"], topics: ["tecnologia-bancaria"],
  own: true, stars: 120, language: "Python", description: "Financial NLP evaluation", readme: "# fin-eval\nBenchmarks for finance LLMs" } };
const FILES = { "/papers/index.json": INDEX, "/papers/arxiv_2303.17564.json": PAPER, "/papers/repos.json": REPOS };
const fetchAsset = async (p) => (p in FILES ? new Response(JSON.stringify(FILES[p])) : new Response("", { status: 404 }));

test("paperKey resolves URLs, DOIs and arXiv ids to the shared key", async () => {
  const papers = await loadPapers(fetchAsset);
  for (const ref of ["arxiv:2303.17564", "2303.17564", "2303.17564v2", "https://doi.org/10.48550/arxiv.2303.17564", "10.48550/arXiv.2303.17564", "https://openalex.org/W1"]) {
    assert.equal(paperKey(papers, ref), "arxiv:2303.17564", ref);
  }
  assert.equal(paperKey(papers, "https://doi.org/10.1/closed"), "doi:10.1/closed");
  assert.equal(paperKey(papers, "https://nao/existe"), null);
});

test("rankChunks finds the passage that answers", () => {
  const top = rankChunks(PAPER, ["sentiment NER financial tasks"], 1)[0];
  assert.equal(top.section, "Results");
});

test("read_paper and list_repos tools", async () => {
  const ctx = { papers: () => loadPapers(fetchAsset) };
  const full = await callTool("read_paper", { paper: "2303.17564" }, ctx);
  assert.equal(full.has_text, true);
  assert.deepEqual(full.sections, ["Introduction", "Results"]);
  assert.equal(full.text[0].name, "Introduction");
  const q = await callTool("read_paper", { paper: "https://doi.org/10.48550/arxiv.2303.17564", query: "parameters FinPile" }, ctx);
  assert.equal(q.excerpts[0].section, "Introduction");
  const closed = await callTool("read_paper", { paper: "10.1/closed" }, ctx);
  assert.equal(closed.has_text, false);
  await assert.rejects(callTool("read_paper", { paper: "10.9/nao" }, ctx), /fora do acervo/);
  const repos = await callTool("list_repos", { topic: "tecnologia-bancaria", query: "finance benchmark" }, ctx);
  assert.equal(repos[0].url, "https://github.com/acme/fin-eval");
  assert.deepEqual(repos[0].paper_titles, ["BloombergGPT"]);
  assert.ok(repos[0].readme_excerpt.startsWith("# fin-eval"));
  assert.deepEqual(await callTool("list_repos", { topic: "people-analytics" }, ctx), []);
});

test("agent adds full-text passages of the top papers to its sources", async () => {
  const archive = { slug: "tecnologia-bancaria", name: "Bank Tech", library: [], index: null,
    data: { themes: {}, digests: [{ date: "2026-11-17", items: [{ title: "BloombergGPT finance LLM", url: "https://doi.org/10.48550/arxiv.2303.17564", summary: "LLM for finance" }], quick: [] }] } };
  let block = "";
  const llm = async (messages, max) => {
    if (max === 300) return { text: "financial tasks, sentiment, LLM finance", model: "f" };
    block = messages.at(-1).content;
    return { text: "Supera em tarefas financeiras [2].", model: "f" };
  };
  const r = await ask({ archive, question: "Como o BloombergGPT se sai em tarefas financeiras?", llm, papers: await loadPapers(fetchAsset) });
  assert.ok(r.sources.some((s) => s.kind === "texto completo" && s.title.startsWith("BloombergGPT — ")));
  assert.match(block, /\(texto completo, 2023\) BloombergGPT — Results/);
});
