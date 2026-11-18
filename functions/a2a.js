// A2A JSON-RPC endpoint (POST /a2a). The agent card is served at /.well-known/agent-card.json by
// functions/_middleware.js. Bearer token (server/auth.js). Logic in server/a2a.js.

import { handleRpc } from "../server/a2a.js";
import { checkBearer } from "../server/auth.js";
import { makeContext } from "../server/context.js";

const reply = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

export async function onRequestPost({ request, env, waitUntil }) {
  const auth = await checkBearer(request, env);
  if (!auth.ok) return reply({ jsonrpc: "2.0", id: null, error: { code: -32001, message: auth.error } }, auth.status);
  let msg;
  try { msg = await request.json(); } catch { return reply({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "JSON inválido" } }, 400); }
  const ctx = makeContext({ request, env, client: auth.client, waitUntil, iface: "a2a" });
  try {
    return reply(await handleRpc(msg, ctx));
  } finally {
    ctx.flush();
  }
}

export const onRequestGet = () => new Response(null, { status: 405, headers: { Allow: "POST" } });
