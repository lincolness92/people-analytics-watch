// Tracing: span tree, JSON form for KV, OTLP protobuf encoding (decoded back here) and export config.
import { test } from "node:test";
import assert from "node:assert/strict";
import { encodeTraces, exportTrace, KIND, otlpConfig, Tracer } from "../../server/trace.js";
import { ask } from "../../server/agent.js";

// minimal protobuf reader: [[field, wire, value]] (value = Uint8Array for length-delimited, BigInt otherwise)
function read(buf) {
  const out = [];
  let i = 0;
  const varint = () => { let r = 0n, s = 0n, b; do { b = buf[i++]; r |= BigInt(b & 127) << s; s += 7n; } while (b & 128); return r; };
  while (i < buf.length) {
    const key = Number(varint()), f = key >> 3, w = key & 7;
    if (w === 0) out.push([f, w, varint()]);
    else if (w === 1) { let v = 0n; for (let k = 0; k < 8; k++) v |= BigInt(buf[i + k]) << BigInt(8 * k); i += 8; out.push([f, w, v]); }
    else if (w === 2) { const n = Number(varint()); out.push([f, w, buf.slice(i, i + n)]); i += n; }
    else throw new Error(`wire ${w}`);
  }
  return out;
}
const field = (msg, f) => msg.filter((x) => x[0] === f).map((x) => x[2]);
const str = (u8) => new TextDecoder().decode(u8);

test("spans nest, end, record errors and serialize for KV", async () => {
  const t = new Tracer();
  const root = t.start("ask", KIND.AGENT, { "input.value": "q" });
  await t.span("child", KIND.LLM, {}, root, async (s) => { s.set("llm.model_name", "m"); });
  await assert.rejects(t.span("bad", KIND.TOOL, {}, root, async () => { throw new Error("boom"); }));
  root.end();
  const j = t.toJSON();
  assert.equal(j.trace_id.length, 32);
  assert.deepEqual(j.spans.map((s) => [s.name, s.parent_id === j.spans[0].span_id || s.parent_id === null]), [["ask", true], ["child", true], ["bad", true]]);
  assert.equal(j.spans[2].status, "error: boom");
  assert.equal(j.spans[1].attrs["openinference.span.kind"], "LLM");
});

test("OTLP protobuf decodes to the right structure", () => {
  const t = new Tracer();
  const r = t.start("ask", KIND.AGENT, { n: 3, x: 1.5, ok: true, s: "texto ç" });
  t.start("child", KIND.LLM, {}, r).end();
  r.end();
  const req = read(encodeTraces(t, { "service.name": "svc" }));
  const rs = read(field(req, 1)[0]);
  const res = read(field(rs, 1)[0]);
  assert.equal(str(field(read(field(res, 1)[0]), 1)[0]), "service.name");
  const spans = field(read(field(rs, 2)[0]), 2).map(read);
  assert.equal(spans.length, 2);
  const [a, b] = spans;
  assert.equal(field(a, 1)[0].length, 16);                       // trace_id bytes
  assert.equal(field(a, 2)[0].length, 8);                        // span_id bytes
  assert.equal(str(field(a, 5)[0]), "ask");
  assert.deepEqual([...field(b, 4)[0]], [...field(a, 2)[0]]);    // child's parent = root span id
  assert.ok(field(a, 8)[0] >= field(a, 7)[0]);                   // end >= start
  const attrs = Object.fromEntries(field(a, 9).map(read).map((kv) => [str(field(kv, 1)[0]), read(field(kv, 2)[0])[0]]));
  assert.equal(str(attrs.s[2]), "texto ç");
  assert.equal(attrs.n[2], 3n);
  assert.equal(attrs.ok[2], 1n);
  assert.equal(attrs.x[1], 1);                                   // double is fixed64
  assert.equal(read(field(a, 15)[0]).find((x) => x[0] === 3)[2], 1n); // status OK
});

test("export uses the standard OTel env and never throws", async () => {
  assert.equal(otlpConfig({}), null);
  const cfg = otlpConfig({ OTEL_EXPORTER_OTLP_ENDPOINT: "https://x/", OTEL_EXPORTER_OTLP_HEADERS: "api_key=abc,Authorization=Bearer%20t" });
  assert.equal(cfg.endpoint, "https://x/v1/traces");
  assert.deepEqual(cfg.headers, { api_key: "abc", Authorization: "Bearer t" });
  const t = new Tracer();
  t.start("a", KIND.CHAIN).end();
  let sent;
  const status = await exportTrace({ OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: "https://p/v1/traces", OTEL_EXPORTER_OTLP_HEADERS: "api_key=k" }, t,
    async (url, init) => { sent = { url, init }; return new Response(null, { status: 200 }); });
  assert.equal(status, "ok");
  assert.equal(sent.init.headers["Content-Type"], "application/x-protobuf");
  assert.equal(sent.init.headers.api_key, "k");
  assert.equal(await exportTrace({ OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: "https://p" }, t, async () => { throw new Error("down"); }), "falhou: down");
  assert.equal(await exportTrace({}, t), "sem backend");
});

test("the agent emits one span per step", async () => {
  const archive = { slug: "x", name: "X", library: [], index: null,
    data: { themes: {}, digests: [{ date: "2026-11-17", items: [{ title: "Money mule graphs", url: "u1", summary: "graphs" }], quick: [] }] } };
  const llm = async (m, max) => ({ text: max === 300 ? "money mule, graph, mule account, laranja, fraud" : "ok [1]", model: "fake",
    usage: { prompt_tokens: 10, completion_tokens: 2, total_tokens: 12 }, attempts: [{ model: "a", ok: false }, { model: "fake", ok: true }] });
  const tracer = new Tracer();
  await ask({ archive, question: "como achar mulas com grafos?", llm, tracer, attrs: { "user.id": "u" } });
  const j = tracer.toJSON();
  assert.deepEqual(j.spans.map((s) => s.name), ["ask", "expand_terms", "search", "fulltext", "answer"]);
  const answer = j.spans.find((s) => s.name === "answer").attrs;
  assert.equal(answer["llm.token_count.total"], 12);
  assert.equal(answer["llm.fallbacks"], 1);
  assert.equal(j.spans[0].attrs["user.id"], "u");
  assert.equal(j.spans.find((s) => s.name === "search").attrs["retrieval.documents.0.document.id"], "u1");
});

test("LLM client: routes ranked by published prices, cheapest first, next on failure", async () => {
  const L = await import("../../server/llm.js");
  assert.equal(L.deepseekPeak(new Date("2026-11-18T02:30:00Z")), true);
  assert.equal(L.deepseekPeak(new Date("2026-11-18T11:30:00Z")), false);
  assert.equal(L.deepseekPeak(new Date("2026-11-21T02:30:00Z")), false); // Saturday
  const md = ["| MODEL | MODEL | deepseek-flash(1) |", "| --- | --- | --- |",
    "| PRICING(2) | 1M INPUT TOKENS / (CACHE HIT) | OFF-PEAK | $0.003 |", "| PRICING(2) | 1M INPUT TOKENS / (CACHE HIT) | PEAK | $0.006 |",
    "| PRICING(2) | 1M INPUT TOKENS / (CACHE MISS) | OFF-PEAK | $0.15 |", "| PRICING(2) | 1M INPUT TOKENS / (CACHE MISS) | PEAK | $0.3 |",
    "| PRICING(2) | 1M OUTPUT TOKENS | OFF-PEAK | $0.6 |", "| PRICING(2) | 1M OUTPUT TOKENS | PEAK | $1.2 |",
    "Peak hours are 01:00 - 04:00 and 06:00 - 10:00 UTC, Monday through Friday."].join("\n");
  const p = L.parseDeepseekPricing(md);
  assert.deepEqual(p.prices["deepseek-flash"], { peak: [0.006, 0.3, 1.2], off: [0.003, 0.15, 0.6] });
  assert.deepEqual(p.windows, [[1, 4], [6, 10]]);
  const u = { prompt_cache_hit_tokens: 0, prompt_cache_miss_tokens: 1e6, completion_tokens: 1e6 };
  assert.equal(L.deepseekCost("deepseek-flash", u, new Date("2026-11-18T12:00:00Z"), p.prices, p.windows).toFixed(2), "0.75");
  const hfModels = { data: [{ id: "x/Flash", providers: [
    { provider: "mid", status: "live", pricing: { input: 0.2, output: 0.8 } },
    { provider: "tiny4", status: "live", pricing: { input: 0.01, output: 0.1 }, quantization: "fp4" },
    { provider: "dear", status: "live", pricing: { input: 0.5, output: 2 } }] }] };
  const book = { hf: L.parseHfModels(hfModels, ["x/Flash"]), dsModels: { "x/Flash": "deepseek-flash" }, dsPrices: p.prices, peak: p.windows };
  assert.deepEqual(L.rankRoutes(book, "x/Flash", 1e4, 1e3, {}, new Date("2026-11-18T12:00:00Z")).map((r) => r.route),
    ["deepseek:deepseek-flash", "x/Flash:mid", "x/Flash:dear"]);   // off-peak DeepSeek is cheapest
  assert.deepEqual(L.rankRoutes(book, "x/Flash", 1e4, 1e3, {}, new Date("2026-11-18T02:00:00Z")).map((r) => r.route),
    ["x/Flash:mid", "deepseek:deepseek-flash", "x/Flash:dear"]);   // at peak it is not
  L._resetPriceBook();
  const seen = [];
  const llm = L.makeLLM({ HF_TOKEN: "h", DEEPSEEK_API_KEY: "d", PAW_MODEL: "x/Flash" }, async (url, init = {}) => {
    if (url.endsWith("/v1/models")) return new Response(JSON.stringify(hfModels));
    if (url.endsWith("/models")) return new Response(JSON.stringify({ data: [{ id: "deepseek-flash", name: "Flash" }] }));
    if (url.endsWith("pricing.md")) return new Response(md);
    const model = JSON.parse(init.body).model;
    seen.push([model, init.headers.Authorization]);
    if (seen.length === 1) return new Response(JSON.stringify({ error: "down" }), { status: 503 });
    return new Response(JSON.stringify({ choices: [{ message: { content: "ok" } }], usage: { prompt_tokens: 10, prompt_cache_miss_tokens: 10, completion_tokens: 5, cost: 0.0001 } }));
  });
  const r = await llm([{ role: "user", content: "oi" }], 50);
  assert.equal(seen.length, 2);
  assert.equal(r.model, seen[1][0]);
  assert.ok(r.cost > 0);
  assert.equal(r.attempts[0].ok, false);
  assert.ok(!seen.some(([m]) => m.endsWith(":tiny4")));
  L._resetPriceBook();
});

test("LLM client: a cut-off answer (finish_reason length) is a failed route; the next one is tried", async () => {
  const L = await import("../../server/llm.js");
  L._resetPriceBook();
  const models = { data: [{ id: "x/M", providers: [{ provider: "a", status: "live", pricing: { input: 0.1, output: 0.4 } },
    { provider: "b", status: "live", pricing: { input: 0.2, output: 0.8 } }] }] };
  const seen = [];
  const llm = L.makeLLM({ HF_TOKEN: "h", PAW_MODEL: "x/M" }, async (url, init = {}) => {
    if (url.endsWith("/v1/models")) return new Response(JSON.stringify(models));
    const m = JSON.parse(init.body).model;
    seen.push(m);
    const cut = m === "x/M:a";
    return new Response(JSON.stringify({ choices: [{ message: { content: cut ? "Resposta pela met" : "Resposta inteira." }, finish_reason: cut ? "length" : "stop" }],
      usage: { prompt_tokens: 5, completion_tokens: 5, cost: 0.00001 } }));
  });
  const r = await llm([{ role: "user", content: "oi" }], 100);
  assert.deepEqual(seen, ["x/M:a", "x/M:b"]);
  assert.equal(r.text, "Resposta inteira.");
  assert.match(r.attempts[0].error, /cortada/);
  L._resetPriceBook();
  // every route cut: the longest partial text comes back, flagged
  const llm2 = L.makeLLM({ HF_TOKEN: "h", PAW_MODEL: "x/M" }, async (url) => url.endsWith("/v1/models") ? new Response(JSON.stringify(models))
    : new Response(JSON.stringify({ choices: [{ message: { content: "parcial" }, finish_reason: "length" }] })));
  const r2 = await llm2([{ role: "user", content: "oi" }], 100);
  assert.equal(r2.truncated, true);
  L._resetPriceBook();
});
