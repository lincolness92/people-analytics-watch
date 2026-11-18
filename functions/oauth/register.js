// POST /oauth/register — OAuth dynamic client registration (RFC 7591) for MCP clients such as Claude.
import { registerClient } from "../../server/oauth.js";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (body, status) => new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json", "Cache-Control": "no-store" } });

export async function onRequestPost({ request, env }) {
  if (!env.SITE_PASSWORD) return json({ error: "temporarily_unavailable" }, 503);
  let meta;
  try { meta = await request.json(); } catch { return json({ error: "invalid_client_metadata", error_description: "JSON inválido" }, 400); }
  const r = await registerClient(env, meta);
  return json(r, r.error ? 400 : 201);
}

export const onRequestOptions = () => new Response(null, { status: 204, headers: CORS });
