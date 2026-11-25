// Run the reference questions (evals/questions.json) through the Pergunte agent, offline, over the built site
// (dist/, from `python -m pawatch render`). Saves one JSON per run in evals/runs/ with, per question: the answer,
// the sources the agent saw (full text of the source block, for the judge), terms, route, cost and latency.
//
//   node evals/run.mjs --label baseline [--model "deepseek-ai/DeepSeek-V4.1-Flash"] [--only fraude-bancaria] [--ids a,b]
//   node evals/run.mjs --ids fraude-bancaria:skills --merge evals/runs/<file>.json   (re-run some, replace them)
//
// Keys: HF_TOKEN and/or DEEPSEEK_API_KEY in the environment. --model sets PAW_MODEL for the answering agent.

import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ANSWER_TOKENS, ask } from "../server/agent.js";
import { loadArchive, loadOtherArchives, loadPapers } from "../server/archive.js";
import { makeLLM } from "../server/llm.js";
import { Tracer } from "../server/trace.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");

const arg = (name, def = null) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : def; };

/** Expand templates × topics, plus the real questions, into [{id, topic, intent, persona, text, rubric}]. */
export function expandQuestions(bank) {
  const out = [];
  for (const [topic, slots] of Object.entries(bank.topics)) {
    for (const [intent, t] of Object.entries(bank.templates)) {
      const map = bank.slot_map?.[intent] || {};
      const text = t.text.replace(/\{(\w+)\}/g, (_, k) => slots[map[k] || k] ?? slots[k] ?? `{${k}}`);
      out.push({ id: `${topic}:${intent}`, topic, intent, persona: t.persona, text, rubric: t.rubric });
    }
  }
  bank.real.forEach((r, i) => out.push({ id: `${r.topic}:real${i + 1}`, topic: r.topic, intent: "real", persona: "usuário real", text: r.text,
    rubric: ["responde diretamente ao que foi perguntado", "evidência concreta (números, casos, papers) quando houver", "fontes pertinentes citadas", "honestidade sobre o que o acervo não cobre"] }));
  return out;
}

const fetchAsset = async (p) => {
  try {
    const body = await readFile(path.join(DIST, p.replace(/^\//, "")));
    return new Response(body, { status: 200 });
  } catch {
    return new Response("not found", { status: 404 });
  }
};

async function main() {
  const label = arg("label", "run");
  const model = arg("model");
  const only = arg("only");
  const ids = arg("ids")?.split(",");
  const bank = JSON.parse(await readFile(path.join(ROOT, "evals/questions.json"), "utf8"));
  let qs = expandQuestions(bank);
  if (only) qs = qs.filter((q) => q.topic === only);
  if (ids) qs = qs.filter((q) => ids.includes(q.id));
  const env = { HF_TOKEN: process.env.HF_TOKEN, DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY, ...(model ? { PAW_MODEL: model } : {}) };
  const papers = await loadPapers(fetchAsset);
  const cache = new Map();
  const archive = (slug) => (cache.has(slug) ? cache.get(slug) : cache.set(slug, Promise.all([loadArchive(fetchAsset, slug), loadOtherArchives(fetchAsset, slug)])).get(slug));

  const results = [];
  let next = 0;
  async function worker() {
    while (next < qs.length) {
      const q = qs[next++];
      const [a, others] = await archive(q.topic);
      const base = makeLLM(env);
      const calls = [];
      const llm = async (messages, maxTokens, opts) => {
        const r = await base(messages, maxTokens, opts);
        calls.push({ maxTokens, model: r.model, cost: r.cost, usage: r.usage, attempts: r.attempts, messages });
        return r;
      };
      const t0 = Date.now();
      try {
        const out = await ask({ archive: a, question: q.text, llm, papers, others, tracer: new Tracer() });
        const answerCall = calls.find((c) => c.maxTokens === ANSWER_TOKENS);
        results.push({ ...q, ok: true, answer: out.answer, model: out.model, terms: out.terms, sources: out.sources,
          source_block: answerCall ? answerCall.messages.at(-1).content : "", ms: Date.now() - t0,
          cost: calls.reduce((s, c) => s + (c.cost || 0), 0), routes: calls.map((c) => c.model),
          tokens: calls.reduce((s, c) => s + (c.usage?.prompt_tokens || 0) + (c.usage?.completion_tokens || 0), 0) });
        console.error(`ok   ${q.id} ${((Date.now() - t0) / 1000).toFixed(1)}s ${out.sources.length} fontes`);
      } catch (e) {
        results.push({ ...q, ok: false, error: e.message, attempts: e.attempts || calls.at(-1)?.attempts || [], ms: Date.now() - t0 });
        console.error(`ERRO ${q.id} ${e.message}`);
      }
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker));
  results.sort((x, y) => qs.findIndex((q) => q.id === x.id) - qs.findIndex((q) => q.id === y.id));
  await mkdir(path.join(ROOT, "evals/runs"), { recursive: true });
  const file = arg("merge") ? path.resolve(arg("merge")) : path.join(ROOT, "evals/runs", `${new Date().toISOString().slice(0, 10)}-${label}.json`);
  if (arg("merge")) {  // re-ran some questions: replace them in an existing run file
    const prev = JSON.parse(await readFile(file, "utf8"));
    const byId = new Map(results.map((r) => [r.id, r]));
    prev.results = prev.results.map((r) => byId.get(r.id) || r);
    results.splice(0, results.length, ...prev.results);
  }
  await writeFile(file, JSON.stringify({ label, model: model || "padrão", at: new Date().toISOString(), results }, null, 1));
  const cost = results.reduce((s, r) => s + (r.cost || 0), 0);
  console.error(`\n${results.filter((r) => r.ok).length}/${results.length} respondidas, custo US$ ${cost.toFixed(4)} → ${path.relative(ROOT, file)}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main();
