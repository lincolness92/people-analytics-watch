// Tests for the external adapters: auth, REST v1, MCP, A2A and the middleware routing. Run: node --test tests/js/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { checkBearer, makeToken } from "../../server/auth.js";
import { agentCard } from "../../server/a2a.js";
import { TOOLS } from "../../server/tools.js";

const SITE = "https://site.example";
const PASSWORD = "senha-de-teste";
const TOPICS = [{ slug: "fraude-bancaria", name: "Bank Fraud Watch", description: "Fraude" }];
const DATA = {
  topic: { slug: "fraude-bancaria", name: "Bank Fraud Watch" }, topics: TOPICS, themes: { mules: "🕸️ Mulas" },
  digests: [{ date: "2026-11-17", headline: "semana de mulas", trend: "Mulas crescem.", stats: {},
    items: [{ title: "Money mule detection with graphs", url: "https://doi.org/1", venue: "KDD", summary: "Grafos.", score: 8, theme: "mules" }], quick: [] }],
  evolution: { generated: "2026-11-17", eras: [], now: { summary: "Agora." } },
  annual: { 2026: { year: 2026, partial: true, overview: "Ano de mulas.", highlights: [], trends: [], growth: [], geography: {} } },
};
const FILES = { "/topics.json": TOPICS, "/fraude-bancaria/data.json": DATA };

function env(extra = {}) {
  const kv = new Map();
  return {
    SITE_PASSWORD: PASSWORD, HF_TOKEN: "hf",
    ASSETS: { fetch: async (u) => { const p = new URL(u).pathname; return p in FILES ? new Response(JSON.stringify(FILES[p])) : new Response("", { status: 404 }); } },
    FEEDBACK: { get: async (k) => kv.get(k) ?? null, put: async (k, v) => { kv.set(k, v); } },
    ...extra,
  };
}
const fakeLLM = () => {
  globalThis.fetch = async (_u, init) => {
    const b = JSON.parse(init.body);
    return new Response(JSON.stringify({ choices: [{ message: { content: b.max_tokens === 1000 ? "money mule, graph, mule account, laranja, fraud" : "Use grafos [1]." } }] }));
  };
};
const req = (path, { method = "GET", token, body } = {}) => new Request(SITE + path, {
  method, headers: token ? { Authorization: `Bearer ${token}` } : {}, body: body ? JSON.stringify(body) : undefined });

test("tokens: valid, wrong, malformed, revoked", async () => {
  const t = await makeToken(PASSWORD, "claude");
  assert.match(t, /^paw_claude_[0-9a-f]{32}$/);
  assert.deepEqual(await checkBearer(req("/x", { token: t }), env()), { ok: true, client: "claude" });
  assert.equal((await checkBearer(req("/x", { token: t.replace(/.$/, "0") === t ? t.replace(/.$/, "1") : t.replace(/.$/, "0") }), env())).status, 401);
  assert.equal((await checkBearer(req("/x", { token: await makeToken("outra", "claude") }), env())).status, 401);
  assert.equal((await checkBearer(req("/x"), env())).status, 401);
  assert.equal((await checkBearer(req("/x", { token: t }), env({ API_REVOKED: "x, claude" }))).status, 401);
  assert.equal((await checkBearer(req("/x", { token: t }), env({ SITE_PASSWORD: "" }))).status, 503);
});

test("REST v1 routes map to the tools", async () => {
  const { onRequest } = await import("../../functions/api/v1/[[path]].js");
  const token = await makeToken(PASSWORD, "script");
  const call = async (path, opts = {}) => {
    const p = new URL(SITE + path).pathname.replace(/^\/api\/v1\/?/, "");
    const r = await onRequest({ request: req(path, { token, ...opts }), env: env(), params: { path: p ? p.split("/") : [] } });
    return [r.status, await r.json()];
  };
  assert.equal((await onRequest({ request: req("/api/v1/topics"), env: env(), params: { path: ["topics"] } })).status, 401);
  assert.deepEqual((await call("/api/v1/topics"))[1].data, TOPICS);
  assert.equal((await call("/api/v1/tools"))[1].data.length, TOOLS.length);
  const [, s] = await call("/api/v1/topics/fraude-bancaria/search?q=money%20mule&k=3");
  assert.equal(s.data[0].url, "https://doi.org/1");
  assert.ok("snippet" in s.data[0] && !("text" in s.data[0]));
  assert.equal((await call("/api/v1/topics/fraude-bancaria/digests"))[1].data[0].headline, "semana de mulas");
  assert.equal((await call("/api/v1/topics/fraude-bancaria/digests/latest"))[1].data.date, "2026-11-17");
  assert.equal((await call("/api/v1/topics/fraude-bancaria/digests/2001-01-01"))[0], 404);
  assert.equal((await call("/api/v1/topics/fraude-bancaria/annual/2026"))[1].data.overview, "Ano de mulas.");
  assert.equal((await call("/api/v1/topics/nao-existe/evolution"))[0], 404);
  assert.equal((await call("/api/v1/topics/fraude-bancaria/search"))[0], 400); // q is required
  assert.equal((await call("/api/v1/nada"))[0], 404);
  fakeLLM();
  const [st, a] = await call("/api/v1/topics/fraude-bancaria/ask", { method: "POST", body: { question: "como achar mulas?" } });
  assert.equal(st, 200);
  assert.equal(a.data.answer, "Use grafos [1].");
});

test("MCP: initialize, tools/list, tools/call, errors", async () => {
  const { onRequestPost } = await import("../../functions/mcp.js");
  const token = await makeToken(PASSWORD, "claude");
  const rpc = async (msg, tk = token) => {
    const r = await onRequestPost({ request: req("/mcp", { method: "POST", token: tk, body: msg }), env: env() });
    return [r.status, r.status === 202 ? null : await r.json()];
  };
  assert.equal((await rpc({ jsonrpc: "2.0", id: 1, method: "tools/list" }, null))[0], 401);
  const [, init] = await rpc({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "t", version: "0" } } });
  assert.equal(init.result.protocolVersion, "2025-06-18");
  assert.deepEqual(init.result.capabilities, { tools: { listChanged: false } });
  assert.equal((await rpc({ jsonrpc: "2.0", method: "notifications/initialized" }))[0], 202);
  const [, list] = await rpc({ jsonrpc: "2.0", id: 2, method: "tools/list" });
  assert.deepEqual(list.result.tools.map((t) => t.name), TOOLS.map((t) => t.name));
  assert.ok(list.result.tools.every((t) => t.inputSchema.type === "object"));
  const [, call] = await rpc({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "search_archive", arguments: { topic: "fraude-bancaria", query: "money mule" } } });
  assert.equal(call.result.isError, false);
  assert.equal(JSON.parse(call.result.content[0].text)[0].url, "https://doi.org/1");
  const [, bad] = await rpc({ jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "get_digest", arguments: { topic: "nao-existe" } } });
  assert.equal(bad.result.isError, true);
  assert.equal((await rpc({ jsonrpc: "2.0", id: 5, method: "tools/call", params: { name: "nope", arguments: {} } }))[1].error.code, -32602);
  assert.equal((await rpc({ jsonrpc: "2.0", id: 6, method: "resources/list" }))[1].error.code, -32601);
});

test("A2A: agent card and message/send", async () => {
  const card = agentCard(SITE, TOPICS);
  assert.equal(card.url, `${SITE}/a2a`);
  assert.equal(card.skills[0].id, "ask-research-archive");
  assert.deepEqual(card.security, [{ bearer: [] }]);
  const { onRequestPost } = await import("../../functions/a2a.js");
  const token = await makeToken(PASSWORD, "agente-x");
  const send = async (message) => (await onRequestPost({ request: req("/a2a", { method: "POST", token,
    body: { jsonrpc: "2.0", id: "1", method: "message/send", params: { message } } }), env: env() })).json();
  const missing = await send({ role: "user", messageId: "m1", parts: [{ kind: "text", text: "como achar mulas?" }] });
  assert.equal(missing.error.code, -32602);
  assert.deepEqual(missing.error.data.topics, ["fraude-bancaria"]);
  fakeLLM();
  const ok = await send({ role: "user", messageId: "m2", metadata: { topic: "fraude-bancaria" }, parts: [{ kind: "text", text: "como achar mulas?" }] });
  assert.equal(ok.result.kind, "message");
  assert.equal(ok.result.role, "agent");
  assert.equal(ok.result.parts[0].text, "Use grafos [1].");
  assert.equal(ok.result.parts[1].data.sources[0].url, "https://doi.org/1");
});

test("middleware: token routes skip the password, agent card is public, token page needs the login", async () => {
  const { onRequest } = await import("../../functions/_middleware.js");
  const next = async () => new Response("next");
  const mw = (path, headers = {}) => onRequest({ request: new Request(SITE + path, { headers }), env: env(), next });
  assert.equal(await (await mw("/api/v1/topics")).text(), "next");
  assert.equal(await (await mw("/mcp")).text(), "next");
  assert.equal((await mw("/fraude-bancaria/data.json")).status, 401); // the site itself stays behind the password
  const card = await (await mw("/.well-known/agent-card.json")).json();
  assert.equal(card.skills[0].tags.includes("fraude-bancaria"), true);
  assert.equal((await mw("/__api-token?name=claude")).status, 401);
  const crypto = globalThis.crypto;
  const hash = [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`paw-v1:${PASSWORD}`)))]
    .map((b) => b.toString(16).padStart(2, "0")).join("");
  const page = await (await mw("/__api-token?name=claude", { Cookie: `paw_auth=${hash}` })).json();
  assert.equal(page.token, await makeToken(PASSWORD, "claude"));
});
