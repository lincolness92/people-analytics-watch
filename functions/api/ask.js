// POST /api/ask — HTTP adapter for the Pergunte agent (server/agent.js) over the query core
// (server/archive.js). This file only does protocol work: input validation, the daily per-person
// limit, question logging in KV (prefix "ask:") and the JSON response the site expects.
// Behind functions/_middleware.js (site password). Needs the Pages secret HF_TOKEN; optional PAW_MODEL.

import { loadArchive, loadOtherArchives, loadPapers, TOPIC_RE } from "../../server/archive.js";
import { ask } from "../../server/agent.js";
import { makeLLM } from "../../server/llm.js";
import { exportTrace, Tracer } from "../../server/trace.js";

const DAILY_LIMIT = 40;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function onRequestPost({ request, env, waitUntil }) {
  if (!env.HF_TOKEN) return json({ ok: false, error: "IA não configurada (HF_TOKEN)" }, 503);
  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: "JSON inválido" }, 400); }
  const topic = str(body.topic, 40);
  const question = str(body.question, 600);
  const voter = str(body.voter, 40) || "anon";
  if (!TOPIC_RE.test(topic)) return json({ ok: false, error: "tema inválido" }, 400);
  if (question.length < 5) return json({ ok: false, error: "pergunta muito curta" }, 400);
  const history = (Array.isArray(body.history) ? body.history : []).slice(-2)
    .map((h) => ({ q: str(h?.q, 600), a: str(h?.a, 1500) })).filter((h) => h.q && h.a);

  const day = new Date().toISOString().slice(0, 10);
  const rlKey = `rl:${day}:${voter}`;
  if (env.FEEDBACK) {
    const used = parseInt((await env.FEEDBACK.get(rlKey)) || "0", 10);
    if (used >= DAILY_LIMIT) return json({ ok: false, error: `limite de ${DAILY_LIMIT} perguntas por dia atingido` }, 429);
    await env.FEEDBACK.put(rlKey, String(used + 1), { expirationTtl: 60 * 60 * 36 });
  }

  const fetchAsset = (p) => env.ASSETS.fetch(new URL(p, request.url));
  const archive = await loadArchive(fetchAsset, topic);
  if (!archive) return json({ ok: false, error: "tema não encontrado" }, 404);

  const tracer = new Tracer({ "deployment.environment": "site" });
  const sessionId = str(body.session, 60) || voter;
  let result;
  try {
    const [papers, others] = await Promise.all([loadPapers(fetchAsset), loadOtherArchives(fetchAsset, topic)]);
    result = await ask({ archive, question, history, llm: makeLLM(env), papers, others, tracer,
      attrs: { "user.id": voter, "session.id": sessionId, "interface": "site" } });
  } catch (e) {
    await keepTrace(env, waitUntil, tracer, { topic, question, voter, error: e.message });
    return json({ ok: false, error: e.message }, 502);
  }
  await keepTrace(env, waitUntil, tracer, null);
  if (!result.sources.length) return json({ ok: true, answer: result.answer, sources: [] });

  if (env.FEEDBACK) {
    const key = `ask:${topic}:${new Date().toISOString()}:${crypto.randomUUID().slice(0, 8)}`;
    // full trace (search terms, sources, answer) so a bad answer can be diagnosed from the export, not re-run
    await env.FEEDBACK.put(key, JSON.stringify({ topic, question, voter, name: str(body.name, 60) || null,
      sources: result.sources.length, model: result.model, answer_chars: result.answer.length, at: new Date().toISOString(),
      terms: (result.terms || []).slice(0, 30), history: history.map((h) => h.q),
      source_list: result.sources.map((s) => `[${s.n}] ${s.kind} | ${s.title}`.slice(0, 200)),
      answer: result.answer.slice(0, 6000), trace_id: tracer.traceId, trace: tracer.toJSON() }));
  }
  return json({ ok: true, answer: result.answer, model: result.model, sources: result.sources });
}

// Send the trace to the OTLP backend (Phoenix) without delaying the reply; failed questions are kept in KV too.
async function keepTrace(env, waitUntil, tracer, failure) {
  const job = exportTrace(env, tracer);
  if (waitUntil) waitUntil(job); else await job;
  if (failure && env.FEEDBACK) {
    await env.FEEDBACK.put(`ask:${failure.topic}:${new Date().toISOString()}:${crypto.randomUUID().slice(0, 8)}`,
      JSON.stringify({ ...failure, at: new Date().toISOString(), trace_id: tracer.traceId, trace: tracer.toJSON() }));
  }
}

export const onRequest = () => json({ ok: false, error: "use POST" }, 405);
