// /api/topic-request — "Peça o seu Watch" (server/requests.js). Behind the site password.
//   POST {nome, escopo, perguntas, fontes, publico, name, voter} → opens the GitHub issue that starts the routine
//   GET  ?voter=<id> → this person's requests with status and progress
import { issueFor, makeGitHub, progress, validateRequest } from "../../server/requests.js";
import { spendDaily } from "../../server/voice.js";

const DAILY_LIMIT = 3;
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
const voterOf = (v) => String(v || "anon").replace(/[^a-z0-9_-]/gi, "").slice(0, 40) || "anon";

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: "JSON inválido" }, 400); }
  const { request: r, error } = validateRequest(body);
  if (error) return json({ ok: false, error }, 400);
  const voter = voterOf(body.voter);
  const limited = await spendDaily(env, "req", voter, DAILY_LIMIT);
  if (limited) return json({ ok: false, error: limited }, 429);
  const at = new Date().toISOString();
  let number = null, url = null;
  if (env.GITHUB_TOKEN) {
    try {
      const issue = await makeGitHub(env).createIssue(issueFor(r));
      number = issue.number; url = issue.html_url;
    } catch (e) {
      return json({ ok: false, error: `não foi possível registrar o pedido (${e.message})` }, 502);
    }
  }
  if (env.FEEDBACK) {
    const key = `req:${voter}`;
    const mine = JSON.parse((await env.FEEDBACK.get(key)) || "[]");
    mine.unshift({ number, nome: r.nome, at, pending: !number ? r : undefined });
    await env.FEEDBACK.put(key, JSON.stringify(mine.slice(0, 20)));
  }
  return json({ ok: true, number, url, queued: !number,
    note: number ? "Pedido registrado. A criação começa em instantes; acompanhe o andamento aqui." :
      "Pedido registrado. A criação automática ainda não está ligada: ele será processado manualmente." });
}

export async function onRequestGet({ request, env }) {
  const voter = voterOf(new URL(request.url).searchParams.get("voter"));
  if (!env.FEEDBACK) return json({ ok: true, requests: [] });
  const mine = JSON.parse((await env.FEEDBACK.get(`req:${voter}`)) || "[]");
  const gh = env.GITHUB_TOKEN ? makeGitHub(env) : null;
  const out = await Promise.all(mine.map(async (m) => {
    if (!m.number || !gh) return { number: null, title: m.nome, status: "recebido", opened: m.at, steps: [] };
    try { const [i, c] = await Promise.all([gh.issue(m.number), gh.comments(m.number)]); return progress(i, c); }
    catch { return { number: m.number, title: m.nome, status: "recebido", opened: m.at, steps: [], error: "andamento indisponível agora" }; }
  }));
  return json({ ok: true, enabled: !!env.GITHUB_TOKEN, requests: out });
}
