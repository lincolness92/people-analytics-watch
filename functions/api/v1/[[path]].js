// REST v1 — read-only HTTP API over the query core, for scripts and integrations. Bearer token (server/auth.js),
// not the site password. Every route maps to one tool of server/tools.js:
//
//   GET  /api/v1/topics                                 list_topics
//   GET  /api/v1/topics/:topic/search?q=&k=&kinds=a,b   search_archive
//   GET  /api/v1/topics/:topic/digests                  list_digests
//   GET  /api/v1/topics/:topic/digests/latest|:date     get_digest
//   GET  /api/v1/topics/:topic/evolution                get_evolution
//   GET  /api/v1/topics/:topic/annual[/:year]           get_annual_review
//   GET  /api/v1/topics/:topic/paper?url=               get_paper
//   POST /api/v1/topics/:topic/ask  {"question": "..."} ask_archive
//   GET  /api/v1/tools                                  the tool catalog (names, descriptions, input schemas)
//
// Responses: {"ok": true, "data": ...} or {"ok": false, "error": "..."} with the HTTP status.

import { checkBearer } from "../../../server/auth.js";
import { makeContext } from "../../../server/context.js";
import { callTool, ToolError, TOOLS } from "../../../server/tools.js";

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });

function route(method, parts, url, body) {
  const q = (k) => url.searchParams.get(k);
  if (method === "GET" && parts.length === 1 && parts[0] === "tools") {
    return { static: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })) };
  }
  if (parts[0] !== "topics") return null;
  if (method === "GET" && parts.length === 1) return { tool: "list_topics", args: {} };
  const topic = parts[1];
  const [what, sub] = parts.slice(2);
  if (method === "POST" && what === "ask" && !sub) return { tool: "ask_archive", args: { topic, question: String(body?.question || "") } };
  if (method !== "GET") return null;
  if (what === "search" && !sub) {
    const args = { topic, query: q("q") || "" };
    if (q("k")) args.k = parseInt(q("k"), 10);
    if (q("kinds")) args.kinds = q("kinds").split(",").map((s) => s.trim()).filter(Boolean);
    return { tool: "search_archive", args };
  }
  if (what === "digests" && !sub) return { tool: "list_digests", args: { topic } };
  if (what === "digests") return { tool: "get_digest", args: sub === "latest" ? { topic } : { topic, date: sub } };
  if (what === "evolution" && !sub) return { tool: "get_evolution", args: { topic } };
  if (what === "annual") return { tool: "get_annual_review", args: sub ? { topic, year: parseInt(sub, 10) } : { topic } };
  if (what === "paper" && !sub) return { tool: "get_paper", args: { topic, url: q("url") || "" } };
  return null;
}

export async function onRequest({ request, env, params }) {
  const auth = await checkBearer(request, env);
  if (!auth.ok) return json({ ok: false, error: auth.error }, auth.status);
  const url = new URL(request.url);
  const parts = [].concat(params.path || []).filter(Boolean);
  let body = null;
  if (request.method === "POST") {
    try { body = await request.json(); } catch { return json({ ok: false, error: "JSON inválido" }, 400); }
  }
  const r = route(request.method, parts, url, body);
  if (!r) return json({ ok: false, error: "rota não encontrada (ver GET /api/v1/tools)" }, 404);
  if (r.static) return json({ ok: true, data: r.static });
  try {
    const data = await callTool(r.tool, r.args, makeContext({ request, env, client: auth.client }));
    if (data === null) return json({ ok: false, error: "não encontrado" }, 404);
    return json({ ok: true, data });
  } catch (e) {
    return json({ ok: false, error: e.message }, e instanceof ToolError ? e.status : 502);
  }
}
