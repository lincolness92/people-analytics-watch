// OAuth 2.1 authorization server for the MCP endpoint (MCP authorization spec): protected-resource and
// authorization-server metadata (RFC 9728, RFC 8414), dynamic client registration (RFC 7591), authorization
// code + PKCE S256, refresh tokens, and audience-bound access tokens (RFC 8707 "resource").
//
// Stateless: client ids, codes and tokens are HMAC-signed blobs whose key derives from SITE_PASSWORD, so no
// new secret or database is needed and changing the password revokes everything. KV (FEEDBACK), when bound,
// only enforces single-use authorization codes. The person approving must be logged in to the site.

export const SCOPE = "archive";
const ACCESS_TTL = 60 * 60;              // 1 h
const REFRESH_TTL = 60 * 60 * 24 * 30;  // 30 days
const CODE_TTL = 120;                    // 2 min

const enc = new TextEncoder();
const b64url = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64url = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));
const now = () => Math.floor(Date.now() / 1000);

async function hmac(env, data) {
  const key = await crypto.subtle.importKey("raw", enc.encode(`paw-oauth-v1:${env.SITE_PASSWORD}`), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}

function sameString(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export async function seal(env, prefix, payload) {
  const body = b64url(enc.encode(JSON.stringify(payload)));
  return `${prefix}${body}.${await hmac(env, prefix + body)}`;
}

export async function unseal(env, prefix, token) {
  if (typeof token !== "string" || !token.startsWith(prefix)) return null;
  const [body, sig] = token.slice(prefix.length).split(".");
  if (!body || !sig || !sameString(sig, await hmac(env, prefix + body))) return null;
  try {
    const p = JSON.parse(new TextDecoder().decode(fromB64url(body)));
    return p.exp && p.exp < now() ? null : p;
  } catch { return null; }
}

// ---------- metadata ----------

export const resourceUrl = (origin) => `${origin}/mcp`;

export function protectedResourceMetadata(origin) {
  return { resource: resourceUrl(origin), authorization_servers: [origin], scopes_supported: [SCOPE],
    bearer_methods_supported: ["header"], resource_name: "Research Watch (MCP)" };
}

export function authorizationServerMetadata(origin) {
  return {
    issuer: origin,
    authorization_endpoint: `${origin}/oauth/authorize`,
    token_endpoint: `${origin}/oauth/token`,
    registration_endpoint: `${origin}/oauth/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
    scopes_supported: [SCOPE],
  };
}

export function wwwAuthenticate(origin, error = null) {
  return `Bearer resource_metadata="${origin}/.well-known/oauth-protected-resource"${error ? `, error="${error}"` : ""}, scope="${SCOPE}"`;
}

// ---------- clients (RFC 7591, public clients, no secret) ----------

const okRedirect = (u) => {
  try {
    const x = new URL(u);
    if (x.hash) return false;
    return x.protocol === "https:" || (x.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(x.hostname));
  } catch { return false; }
};

/** Client label used for quotas and revocation (server/auth.js REVOKED / API_REVOKED). */
export function clientLabel(name) {
  const slug = (name || "cliente").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `oauth-${slug || "cliente"}`.slice(0, 32);
}

export async function registerClient(env, meta) {
  const uris = Array.isArray(meta?.redirect_uris) ? meta.redirect_uris.filter((u) => typeof u === "string") : [];
  if (!uris.length || uris.length > 10 || !uris.every(okRedirect)) {
    return { error: "invalid_redirect_uri", error_description: "redirect_uris: https, ou http em localhost" };
  }
  const name = String(meta.client_name || "Cliente MCP").slice(0, 80);
  const client_id = await seal(env, "pc_", { n: name, r: uris, t: now() });
  return { client_id, client_id_issued_at: now(), client_name: name, redirect_uris: uris,
    grant_types: ["authorization_code", "refresh_token"], response_types: ["code"], token_endpoint_auth_method: "none" };
}

export const readClient = (env, client_id) => unseal(env, "pc_", client_id);

// ---------- authorization ----------

/** Validate an authorization request; returns {client, params} or {error}. */
export async function checkAuthorizeRequest(env, q, origin) {
  const client = await readClient(env, q.client_id);
  if (!client) return { error: "client_id desconhecido ou inválido" };
  if (!client.r.includes(q.redirect_uri)) return { error: "redirect_uri não registrado para este cliente" };
  if (q.response_type !== "code") return { error: "response_type deve ser code", redirect: true };
  if (q.code_challenge_method !== "S256" || !/^[A-Za-z0-9._~-]{43,128}$/.test(q.code_challenge || "")) {
    return { error: "PKCE S256 obrigatório", redirect: true };
  }
  if (q.resource && q.resource !== resourceUrl(origin) && q.resource !== origin) return { error: "resource inválido", redirect: true };
  return { client, params: { client_id: q.client_id, redirect_uri: q.redirect_uri, code_challenge: q.code_challenge,
    state: q.state || "", scope: SCOPE, resource: q.resource || resourceUrl(origin) } };
}

export async function issueCode(env, p) {
  return seal(env, "pcode_", { c: p.client_id, r: p.redirect_uri, ch: p.code_challenge, res: p.resource, s: p.scope,
    j: crypto.randomUUID(), exp: now() + CODE_TTL });
}

async function sha256b64url(text) {
  return b64url(await crypto.subtle.digest("SHA-256", enc.encode(text)));
}

async function tokensFor(env, client, client_id, resource, scope) {
  const label = clientLabel(client.n);
  const access_token = await seal(env, "pat_", { typ: "a", c: label, cid: client_id.slice(-16), aud: resource, s: scope, exp: now() + ACCESS_TTL });
  const refresh_token = await seal(env, "prt_", { typ: "r", c: client_id, aud: resource, s: scope, exp: now() + REFRESH_TTL });
  return { access_token, token_type: "Bearer", expires_in: ACCESS_TTL, refresh_token, scope };
}

/** Token endpoint logic for a form body (URLSearchParams). Returns [status, json]. */
export async function exchange(env, form) {
  const err = (error, error_description, status = 400) => [status, { error, error_description }];
  const grant = form.get("grant_type");
  if (grant === "authorization_code") {
    const code = await unseal(env, "pcode_", form.get("code"));
    if (!code) return err("invalid_grant", "código inválido ou expirado");
    if (form.get("client_id") !== code.c) return err("invalid_grant", "client_id não confere");
    if (form.get("redirect_uri") !== code.r) return err("invalid_grant", "redirect_uri não confere");
    if ((await sha256b64url(form.get("code_verifier") || "")) !== code.ch) return err("invalid_grant", "code_verifier não confere (PKCE)");
    if (env.FEEDBACK) {
      const used = `oauth:code:${code.j}`;
      if (await env.FEEDBACK.get(used)) return err("invalid_grant", "código já usado");
      await env.FEEDBACK.put(used, "1", { expirationTtl: CODE_TTL * 2 });
    }
    const client = await readClient(env, code.c);
    if (!client) return err("invalid_client", "cliente inválido", 401);
    return [200, await tokensFor(env, client, code.c, code.res, code.s)];
  }
  if (grant === "refresh_token") {
    const rt = await unseal(env, "prt_", form.get("refresh_token"));
    if (!rt || rt.typ !== "r") return err("invalid_grant", "refresh_token inválido ou expirado");
    if (form.get("client_id") && form.get("client_id") !== rt.c) return err("invalid_grant", "client_id não confere");
    const client = await readClient(env, rt.c);
    if (!client) return err("invalid_client", "cliente inválido", 401);
    return [200, await tokensFor(env, client, rt.c, rt.aud, rt.s)];
  }
  return err("unsupported_grant_type", "use authorization_code ou refresh_token");
}

/** {ok, client} for a valid access token bound to this server, else {ok:false}. */
export async function verifyAccessToken(env, token, origin) {
  const p = await unseal(env, "pat_", token);
  if (!p || p.typ !== "a") return { ok: false };
  if (p.aud !== resourceUrl(origin) && p.aud !== origin) return { ok: false };
  return { ok: true, client: p.c };
}
