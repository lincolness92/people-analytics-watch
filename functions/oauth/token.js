// POST /oauth/token — authorization_code (with PKCE) and refresh_token grants. Public clients, no secret.
import { exchange } from "../../server/oauth.js";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (body, status) => new Response(JSON.stringify(body), {
  status, headers: { ...CORS, "Content-Type": "application/json", "Cache-Control": "no-store", Pragma: "no-cache" } });

export async function onRequestPost({ request, env }) {
  if (!env.SITE_PASSWORD) return json({ error: "temporarily_unavailable" }, 503);
  let form;
  const type = request.headers.get("Content-Type") || "";
  try {
    form = type.includes("application/json") ? new URLSearchParams(await request.json()) : new URLSearchParams(await request.text());
  } catch { return json({ error: "invalid_request", error_description: "corpo inválido" }, 400); }
  const [status, body] = await exchange(env, form);
  return json(body, status);
}

export const onRequestOptions = () => new Response(null, { status: 204, headers: CORS });
