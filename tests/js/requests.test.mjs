import { test } from "node:test";
import assert from "node:assert/strict";

test("topic request: validation, issue body with the JSON block, status from comments", async () => {
  const R = await import("../../server/requests.js");
  assert.match(R.validateRequest({ nome: "ab", escopo: "x".repeat(30) }).error, /nome/);
  assert.match(R.validateRequest({ nome: "Risco de crédito", escopo: "curto" }).error, /escopo/);
  const { request } = R.validateRequest({ nome: " Risco de crédito ", escopo: "Modelos de PD e cobrança com ML em bancos",
    perguntas: "Funciona?\n\nQuem faz?", fontes: "BIS", name: "Ana" });
  assert.deepEqual(request.perguntas, ["Funciona?", "Quem faz?"]);
  const issue = R.issueFor(request);
  assert.equal(issue.title, "Pedido de tema: Risco de crédito");
  assert.deepEqual(issue.labels, ["pedido-de-tema"]);
  const block = issue.body.match(/```json\n([\s\S]+?)\n```/)[1];
  assert.equal(JSON.parse(block).nome, "Risco de crédito");
  const comments = [{ body: "**Status: em criação**\nComeçou.", created_at: "2026-11-26T01:00:00Z" },
    { body: "Rascunho gerado.", created_at: "2026-11-26T01:05:00Z" },
    { body: "**Status: em revisão** PR: https://github.com/o/r/pull/12", created_at: "2026-11-26T01:20:00Z" }];
  assert.equal(R.statusOf({ state: "open" }, []), "recebido");
  assert.equal(R.statusOf({ state: "open" }, comments), "em revisão");
  assert.equal(R.statusOf({ state: "closed" }, comments), "no ar");
  const p = R.progress({ number: 7, title: "Pedido de tema: Risco", state: "open", created_at: "x", html_url: "u" }, comments);
  assert.equal(p.title, "Risco");
  assert.equal(p.pr, "https://github.com/o/r/pull/12");
  assert.equal(p.steps.length, 3);
});

test("topic request endpoint: opens the issue with the token, keeps the request per person, reports progress", async () => {
  const { onRequestPost, onRequestGet } = await import("../../functions/api/topic-request.js");
  const kv = new Map();
  const env = { GITHUB_TOKEN: "t", FEEDBACK: { get: async (k) => kv.get(k) ?? null, put: async (k, v) => { kv.set(k, v); } } };
  const calls = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push([init.method || "GET", url.replace("https://api.github.com/repos/lincolness92/people-analytics-watch", "")]);
    if (init.method === "POST") return new Response(JSON.stringify({ number: 41, html_url: "https://github.com/x/issues/41" }));
    if (url.endsWith("/comments?per_page=50")) return new Response(JSON.stringify([{ body: "**Status: em criação**", created_at: "2026-11-26T01:00:00Z" }]));
    return new Response(JSON.stringify({ number: 41, title: "Pedido de tema: Risco de crédito", state: "open", created_at: "2026-11-26T00:59:00Z", html_url: "u" }));
  };
  try {
    const post = await onRequestPost({ env, request: new Request("https://x/api/topic-request", { method: "POST",
      body: JSON.stringify({ nome: "Risco de crédito", escopo: "Modelos de PD e cobrança com ML em bancos", voter: "v1" }) }) });
    const out = await post.json();
    assert.equal(out.ok, true);
    assert.equal(out.number, 41);
    assert.deepEqual(calls[0], ["POST", "/issues"]);
    const get = await onRequestGet({ env, request: new Request("https://x/api/topic-request?voter=v1") });
    const list = await get.json();
    assert.equal(list.requests[0].status, "em criação");
    assert.equal(list.requests[0].title, "Risco de crédito");
  } finally { globalThis.fetch = realFetch; }
});
