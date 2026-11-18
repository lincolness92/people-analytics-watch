// End-to-end OAuth 2.1 flow for the MCP endpoint, as an MCP client (e.g. Claude) runs it. Run: node --test tests/js/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const SITE = "https://site.example";
const PASSWORD = "senha-de-teste";
const REDIRECT = "https://claude.ai/api/mcp/auth_callback";
const TOPICS = [{ slug: "fraude-bancaria", name: "Bank Fraud Watch", description: "" }];
const DATA = { topic: { slug: "fraude-bancaria", name: "Bank Fraud Watch" }, topics: TOPICS, themes: {},
  digests: [{ date: "2026-11-17", stats: {}, items: [{ title: "Money mule graphs", url: "u1", score: 8, theme: "x" }], quick: [] }] };

function env(extra = {}) {
  const kv = new Map();
  const files = { "/topics.json": TOPICS, "/fraude-bancaria/data.json": DATA };
  return { SITE_PASSWORD: PASSWORD,
    ASSETS: { fetch: async (u) => { const p = new URL(u).pathname; return p in files ? new Response(JSON.stringify(files[p])) : new Response("", { status: 404 }); } },
    FEEDBACK: { get: async (k) => kv.get(k) ?? null, put: async (k, v) => { kv.set(k, v); } }, ...extra };
}
const b64url = (buf) => Buffer.from(buf).toString("base64url");
async function pkce() {
  const verifier = b64url(crypto.getRandomValues(new Uint8Array(32)));
  return { verifier, challenge: b64url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))) };
}
const mcpCall = async (E, token, method = "tools/list") => {
  const { onRequestPost } = await import("../../functions/mcp.js");
  return onRequestPost({ env: E, request: new Request(`${SITE}/mcp`, { method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method }) }) });
};
const tokenCall = async (E, params) => {
  const { onRequestPost } = await import("../../functions/oauth/token.js");
  const r = await onRequestPost({ env: E, request: new Request(`${SITE}/oauth/token`, { method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(params).toString() }) });
  return [r.status, await r.json()];
};

async function authorizeFlow(E, { resource = `${SITE}/mcp` } = {}) {
  // discovery
  const { onRequest: mw } = await import("../../functions/_middleware.js");
  const prm = await (await mw({ env: E, next: async () => new Response("x"), request: new Request(`${SITE}/.well-known/oauth-protected-resource`) })).json();
  const asm = await (await mw({ env: E, next: async () => new Response("x"), request: new Request(`${SITE}/.well-known/oauth-authorization-server`) })).json();
  assert.equal(prm.resource, `${SITE}/mcp`);
  assert.deepEqual(prm.authorization_servers, [SITE]);
  assert.equal(asm.token_endpoint, `${SITE}/oauth/token`);
  assert.deepEqual(asm.code_challenge_methods_supported, ["S256"]);
  // registration
  const { onRequestPost: register } = await import("../../functions/oauth/register.js");
  const reg = await register({ env: E, request: new Request(asm.registration_endpoint, { method: "POST",
    body: JSON.stringify({ client_name: "Claude", redirect_uris: [REDIRECT], token_endpoint_auth_method: "none" }) }) });
  assert.equal(reg.status, 201);
  const { client_id } = await reg.json();
  // consent (GET shows the screen; POST approves)
  const { verifier, challenge } = await pkce();
  const q = { response_type: "code", client_id, redirect_uri: REDIRECT, code_challenge: challenge, code_challenge_method: "S256",
    state: "xyz", scope: "archive", resource };
  const az = await import("../../functions/oauth/authorize.js");
  const screen = await az.onRequestGet({ env: E, request: new Request(`${SITE}/oauth/authorize?${new URLSearchParams(q)}`) });
  assert.equal(screen.status, 200);
  assert.match(await screen.text(), /Claude/);
  const approved = await az.onRequestPost({ env: E, request: new Request(`${SITE}/oauth/authorize`, { method: "POST",
    body: new URLSearchParams({ ...q, decision: "allow" }) }) });
  assert.equal(approved.status, 302);
  const back = new URL(approved.headers.get("Location"));
  assert.equal(back.origin + back.pathname, REDIRECT);
  assert.equal(back.searchParams.get("state"), "xyz");
  return { client_id, verifier, code: back.searchParams.get("code") };
}

test("unauthenticated MCP call points to the OAuth metadata", async () => {
  const r = await mcpCall(env(), null);
  assert.equal(r.status, 401);
  assert.match(r.headers.get("WWW-Authenticate"), /resource_metadata="https:\/\/site\.example\/\.well-known\/oauth-protected-resource"/);
});

test("full flow: register → consent → code + PKCE → tokens → MCP → refresh", async () => {
  const E = env();
  const { client_id, verifier, code } = await authorizeFlow(E);
  const [st, tok] = await tokenCall(E, { grant_type: "authorization_code", code, client_id, redirect_uri: REDIRECT, code_verifier: verifier });
  assert.equal(st, 200);
  assert.equal(tok.token_type, "Bearer");
  assert.ok(tok.access_token.startsWith("pat_") && tok.refresh_token.startsWith("prt_"));
  const list = await (await mcpCall(E, tok.access_token)).json();
  assert.ok(list.result.tools.length > 0);
  // the code is single-use
  const [st2, again] = await tokenCall(E, { grant_type: "authorization_code", code, client_id, redirect_uri: REDIRECT, code_verifier: verifier });
  assert.equal(st2, 400);
  assert.equal(again.error, "invalid_grant");
  // refresh
  const [st3, ref] = await tokenCall(E, { grant_type: "refresh_token", refresh_token: tok.refresh_token, client_id });
  assert.equal(st3, 200);
  assert.equal((await mcpCall(E, ref.access_token)).status, 200);
});

test("rejects wrong PKCE verifier, bad redirect, tampered and revoked tokens", async () => {
  const E = env();
  const { client_id, code } = await authorizeFlow(E);
  const [, bad] = await tokenCall(E, { grant_type: "authorization_code", code, client_id, redirect_uri: REDIRECT, code_verifier: "x".repeat(43) });
  assert.equal(bad.error, "invalid_grant");
  const { client_id: c2, verifier, code: code2 } = await authorizeFlow(E);
  const [, tok] = await tokenCall(E, { grant_type: "authorization_code", code: code2, client_id: c2, redirect_uri: REDIRECT, code_verifier: verifier });
  const tampered = tok.access_token.slice(0, -2) + (tok.access_token.endsWith("AA") ? "BB" : "AA");
  assert.equal((await mcpCall(E, tampered)).status, 401);
  assert.equal((await mcpCall({ ...E, API_REVOKED: "oauth-claude" }, tok.access_token)).status, 401);
  assert.equal((await mcpCall({ ...E, SITE_PASSWORD: "outra" }, tok.access_token)).status, 401); // password change revokes
  const az = await import("../../functions/oauth/authorize.js");
  const evil = await az.onRequestGet({ env: E, request: new Request(`${SITE}/oauth/authorize?${new URLSearchParams({
    response_type: "code", client_id: c2, redirect_uri: "https://evil.example/cb", code_challenge: "a".repeat(43), code_challenge_method: "S256" })}`) });
  assert.equal(evil.status, 400);
  const { onRequestPost: register } = await import("../../functions/oauth/register.js");
  const r = await register({ env: E, request: new Request(`${SITE}/oauth/register`, { method: "POST", body: JSON.stringify({ redirect_uris: ["http://evil.example/cb"] }) }) });
  assert.equal(r.status, 400);
});

test("consent screen stays behind the site password; token and register endpoints do not", async () => {
  const { onRequest: mw } = await import("../../functions/_middleware.js");
  const next = async () => new Response("next");
  const call = (path) => mw({ env: env(), next, request: new Request(SITE + path, { method: path.startsWith("/oauth/authorize") ? "GET" : "POST" }) });
  assert.equal((await call("/oauth/authorize?client_id=x")).status, 401);
  assert.equal(await (await call("/oauth/token")).text(), "next");
  assert.equal(await (await call("/oauth/register")).text(), "next");
});
