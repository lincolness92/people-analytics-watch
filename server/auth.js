// Bearer tokens for external clients (REST v1, MCP, A2A). They are derived from the site password, so
// no new secret has to reach Cloudflare:
//   token = "paw_" + name + "_" + first 32 hex of HMAC-SHA256(key = "paw-api-v1:" + SITE_PASSWORD, message = name)
// Generate one with `python -m pawatch api-token <name>` (needs SITE_PASSWORD in the environment).
// Revoke a client by adding its name to REVOKED below or to the optional Pages env API_REVOKED
// ("a,b"); changing SITE_PASSWORD revokes every token at once.

export const NAME_RE = /^[a-z0-9-]{1,32}$/;
const REVOKED = [];

async function hmacHex(secret, message) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function sameString(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function makeToken(sitePassword, name) {
  if (!NAME_RE.test(name)) throw new Error("nome inválido");
  return `paw_${name}_${(await hmacHex(`paw-api-v1:${sitePassword}`, name)).slice(0, 32)}`;
}

/** {ok: true, client} or {ok: false, status, error}. */
export async function checkBearer(request, env) {
  if (!env.SITE_PASSWORD) return { ok: false, status: 503, error: "acesso externo não configurado (SITE_PASSWORD)" };
  const m = /^Bearer\s+(paw_([a-z0-9-]{1,32})_[0-9a-f]{32})$/.exec(request.headers.get("Authorization") || "");
  if (!m) return { ok: false, status: 401, error: "envie Authorization: Bearer <token>" };
  const [, token, name] = m;
  const revoked = new Set([...REVOKED, ...(env.API_REVOKED || "").split(",").map((s) => s.trim()).filter(Boolean)]);
  if (revoked.has(name) || !sameString(token, await makeToken(env.SITE_PASSWORD, name))) {
    return { ok: false, status: 401, error: "token inválido ou revogado" };
  }
  return { ok: true, client: name };
}

/** Per-client daily quota in KV (when bound). Returns an error string when exhausted. */
export async function spendQuota(env, client, bucket, limit) {
  if (!env.FEEDBACK) return null;
  const key = `rl:${bucket}:${new Date().toISOString().slice(0, 10)}:${client}`;
  const used = parseInt((await env.FEEDBACK.get(key)) || "0", 10);
  if (used >= limit) return `limite de ${limit} por dia atingido`;
  await env.FEEDBACK.put(key, String(used + 1), { expirationTtl: 60 * 60 * 36 });
  return null;
}
