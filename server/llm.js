// LLM client used by the serving side (OpenAI-compatible chat), routed by price — same rules as the pipeline
// (src/pawatch/llm.py). The only module that knows about providers: swap them here and nothing else changes.
//
// The model list (PAW_MODEL, comma-separated, else DEFAULT_MODELS) is a quality order. For each model the route is
// chosen by what the providers publish right now: Hugging Face /v1/models lists every live provider with its price
// per 1M input/output tokens (route "<model>:<provider>"); DeepSeek's platform gives model names on /models and its
// prices (peak and off-peak, with the peak hours) on the official pricing page (route "deepseek:<id>"). Each call
// ranks the routes by its own estimated cost at the current hour, cheapest first; a failed route moves to the next.
// Filters: live, uptime >= MIN_UPTIME, no 4-bit quantization unless PAW_ALLOW_4BIT=1. Prices are cached for an
// hour per isolate; if a source cannot be read, the built-in table stands in.

const ROUTER = "https://router.huggingface.co/v1/chat/completions";
const HF_MODELS = "https://router.huggingface.co/v1/models";
const DEEPSEEK = "https://api.deepseek.com/chat/completions";
const DEEPSEEK_MODELS = "https://api.deepseek.com/models";
const DEEPSEEK_PRICING = "https://api-docs.deepseek.com/quick_start/pricing.md";
export const DEFAULT_MODELS = ["deepseek-ai/DeepSeek-V4.1-Flash", "openai/gpt-oss-120b"]; // Qwen3.5-122B dropped 26/11/2026: refused by the router

// Stand-ins: US$ per 1M tokens at PEAK (off-peak is half): [input cache hit, input cache miss, output] — Nov 2026.
const DEEPSEEK_PRICES = { "deepseek-flash": [0.006, 0.30, 1.20], "deepseek-v4-pro": [0.044, 1.32, 3.96] };
const DEEPSEEK_PEAK_UTC = [[1, 4], [6, 10]];
const DEEPSEEK_NAMES = { "deepseek-ai/DeepSeek-V4.1-Flash": "deepseek-flash" };
const LOW_BIT = /(fp|int|nf|q)4/i;
const MIN_UPTIME = 97;
const MAX_ROUTES = 3;
const BOOK_TTL_MS = 3600e3;

export function deepseekPeak(d = new Date(), windows = DEEPSEEK_PEAK_UTC) {
  const h = d.getUTCHours(), wd = d.getUTCDay();
  return wd >= 1 && wd <= 5 && windows.some(([a, b]) => h >= a && h < b);
}

function deepseekTable(model, prices) {
  if (prices?.[model]) return prices[model];
  const p = DEEPSEEK_PRICES[model] || DEEPSEEK_PRICES["deepseek-flash"];
  return { peak: p, off: p.map((x) => x / 2) };
}

export function deepseekCost(model, u, when = new Date(), prices = null, windows = DEEPSEEK_PEAK_UTC) {
  const [hitP, missP, outP] = deepseekTable(model, prices)[deepseekPeak(when, windows) ? "peak" : "off"];
  const hit = u?.prompt_cache_hit_tokens || 0;
  const miss = u?.prompt_cache_miss_tokens ?? ((u?.prompt_tokens || 0) - hit);
  return (hit * hitP + miss * missP + (u?.completion_tokens || 0) * outP) / 1e6;
}

/** Prices and peak hours from DeepSeek's Markdown pricing page. */
export function parseDeepseekPricing(md) {
  let cols = null;
  const raw = {};
  for (const line of md.split("\n")) {
    const cells = line.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
    if (!cols && cells[0] === "MODEL") { cols = cells.filter((c) => c && c !== "MODEL").map((c) => c.replace(/\(\d+\)$/, "").trim()); continue; }
    if (!cols || cells.length <= cols.length) continue;
    const label = cells.slice(0, -cols.length).join(" ").toUpperCase();
    const kind = label.includes("CACHE HIT") ? 0 : label.includes("CACHE MISS") ? 1 : label.includes("OUTPUT") ? 2 : -1;
    const win = label.includes("OFF-PEAK") ? "off" : label.includes("PEAK") ? "peak" : null;
    if (kind < 0 || !win) continue;
    cells.slice(-cols.length).forEach((cell, i) => {
      const m = cell.match(/\$\s*([\d.]+)/);
      if (m) ((raw[cols[i]] ||= { peak: [null, null, null], off: [null, null, null] })[win][kind] = parseFloat(m[1]));
    });
  }
  const prices = Object.fromEntries(Object.entries(raw).filter(([, d]) => !d.peak.includes(null) && !d.off.includes(null)));
  const i = md.indexOf("Peak hours");
  const windows = i < 0 ? [] : [...md.slice(i, i + 300).matchAll(/(\d{1,2}):00\s*-\s*(\d{1,2}):00/g)].map((m) => [+m[1], +m[2]]);
  return { prices, windows: windows.length ? windows : DEEPSEEK_PEAK_UTC };
}

/** Live providers with a published price for the wanted models. */
export function parseHfModels(data, wanted) {
  const out = {};
  for (const m of data?.data || []) {
    if (!wanted.includes(m.id)) continue;
    out[m.id] = (m.providers || []).filter((p) => p.status === "live" && p.pricing?.input != null && p.pricing?.output != null)
      .map((p) => ({ provider: p.provider, in: +p.pricing.input, out: +p.pricing.output, quant: p.quantization || "", uptime: p.uptime_last_day_percent ?? null }));
  }
  return out;
}

export const pinned = (m) => m.startsWith("deepseek:") || m.includes(":");
export const modelList = (env) => {
  const ms = (env.PAW_MODEL || "").split(",").map((m) => m.trim()).filter(Boolean);
  return ms.length ? ms : [...DEFAULT_MODELS];
};

let BOOK = null; // { at, key, data } — per isolate
const DEMOTED = new Map(); // route → failures in this isolate: a route that failed goes to the back of its model's queue

async function getJSON(fetchImpl, url, headers, ms) {
  const r = await fetchImpl(url, { headers, signal: AbortSignal.timeout(ms) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

/** Current prices of every route to the wanted models (cached an hour). Never throws. */
export async function priceBook(env, wanted, fetchImpl = fetch, now = Date.now()) {
  const key = `${!!env.HF_TOKEN}|${!!env.DEEPSEEK_API_KEY}|${[...wanted].sort().join(",")}`;
  if (BOOK && BOOK.key === key && now - BOOK.at < BOOK_TTL_MS) return BOOK.data;
  const book = { hf: {}, dsModels: {}, dsPrices: {}, peak: DEEPSEEK_PEAK_UTC, sources: {} };
  const jobs = [];
  if (env.HF_TOKEN && wanted.length) {
    jobs.push(getJSON(fetchImpl, HF_MODELS, { Authorization: `Bearer ${env.HF_TOKEN}` }, 6000)
      .then((d) => { book.hf = parseHfModels(d, wanted); book.sources.hf = "api"; })
      .catch((e) => { book.sources.hf = `indisponível (${e.message})`; }));
  }
  if (env.DEEPSEEK_API_KEY) {
    jobs.push(getJSON(fetchImpl, DEEPSEEK_MODELS, { Authorization: `Bearer ${env.DEEPSEEK_API_KEY}` }, 6000)
      .then((d) => {
        const names = Object.fromEntries((d.data || []).map((m) => [(m.name || "").toLowerCase(), m.id]));
        for (const w of wanted) { const n = names[w.split("/").pop().toLowerCase()]; if (n) book.dsModels[w] = n; }
      })
      .catch(() => { for (const w of wanted) if (DEEPSEEK_NAMES[w]) book.dsModels[w] = DEEPSEEK_NAMES[w]; }));
    jobs.push(fetchImpl(DEEPSEEK_PRICING, { signal: AbortSignal.timeout(6000) })
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((md) => { const p = parseDeepseekPricing(md); book.dsPrices = p.prices; book.peak = p.windows; })
      .catch(() => {})
      .then(() => { book.sources.deepseek = Object.keys(book.dsPrices).length ? "página de preços" : "tabela interna"; }));
  }
  await Promise.all(jobs);
  BOOK = { at: now, key, data: book };
  return book;
}

/** Routes to one model, cheapest first for a call of estIn/estOut tokens: [{route, est, price}]. */
export function rankRoutes(book, model, estIn, estOut, env = {}, when = new Date()) {
  const cands = [];
  for (const r of book.hf[model] || []) {
    if ((LOW_BIT.test(r.quant) && env.PAW_ALLOW_4BIT !== "1") || (r.uptime != null && r.uptime < MIN_UPTIME)) continue;
    cands.push({ route: `${model}:${r.provider}`, est: (estIn * r.in + estOut * r.out) / 1e6, price: `${r.in}/${r.out}` });
  }
  const ds = book.dsModels[model];
  if (ds) {
    const peak = deepseekPeak(when, book.peak);
    const [, miss, out] = deepseekTable(ds, book.dsPrices)[peak ? "peak" : "off"];
    cands.push({ route: `deepseek:${ds}`, est: (estIn * miss + estOut * out) / 1e6, price: `${miss}/${out} ${peak ? "pico" : "fora do pico"}` });
  }
  return cands.sort((a, b) => a.est - b.est);
}

/**
 * Returns llm(messages, maxTokens, opts) -> {text, model (the route), usage, cost, attempts}, cheapest route first.
 * `env`: HF_TOKEN and/or DEEPSEEK_API_KEY; optional PAW_MODEL, PAW_ALLOW_4BIT.
 * opts.reasoning = "none" turns off the models' hidden reasoning (~1 s instead of 4–17 s); opts.expectOut is the
 * expected output length for the price comparison (default min(maxTokens, 1200)); opts.timeoutMs bounds each attempt.
 */
export function makeLLM(env, fetchImpl = fetch) {
  const models = modelList(env);
  return async function llm(messages, maxTokens, opts = {}) {
    const estIn = Math.ceil(messages.reduce((n, m) => n + String(m.content || "").length, 0) / 3) + 20;
    const estOut = opts.expectOut || Math.min(maxTokens, 1200);
    const book = await priceBook(env, models.filter((m) => !pinned(m)), fetchImpl);
    const plan = [];
    for (const m of models) {
      if (pinned(m)) { plan.push(m); continue; }
      const ranked = rankRoutes(book, m, estIn, estOut, env).sort((a, b) => (DEMOTED.get(a.route) || 0) - (DEMOTED.get(b.route) || 0));
      plan.push(...ranked.slice(0, MAX_ROUTES).map((r) => r.route));
      if (env.HF_TOKEN && !book.hf[m]) plan.push(m); // no HF price list: the router chooses the provider
    }
    let last, partial = null;
    const attempts = [];
    for (const route of plan) {
      const t0 = Date.now();
      const direct = route.startsWith("deepseek:");
      const apiModel = direct ? route.slice(9) : route;
      if ((direct && !env.DEEPSEEK_API_KEY) || (!direct && !env.HF_TOKEN)) continue;
      try {
        const r = await fetchImpl(direct ? DEEPSEEK : ROUTER, {
          method: "POST",
          signal: AbortSignal.timeout(opts.timeoutMs || (maxTokens <= 500 ? 20000 : 90000)),
          headers: { Authorization: `Bearer ${direct ? env.DEEPSEEK_API_KEY : env.HF_TOKEN}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: apiModel, messages, max_tokens: maxTokens, temperature: 0.3,
            ...(opts.reasoning ? { reasoning_effort: opts.reasoning } : {}) }),
        });
        const out = await r.json();
        const text = (out.choices?.[0]?.message?.content || "").replace(/<think>[\s\S]*?<\/think>/g, "").trim();
        const usage = out.usage || null;
        const cost = usage ? (direct ? deepseekCost(apiModel, usage, new Date(), book.dsPrices, book.peak) : Number(usage.cost || 0)) : 0;
        // finish_reason "length": the token budget ran out (often spent on hidden reasoning) and the text is cut
        // mid-sentence. That is a failed attempt: try the next route, keep the text only as a last resort.
        const cut = out.choices?.[0]?.finish_reason === "length";
        if (r.ok && text && !cut) {
          attempts.push({ model: route, ok: true, ms: Date.now() - t0, cost });
          return { text, model: route, usage, cost, attempts };
        }
        if (r.ok && text && cut && (!partial || text.length > partial.text.length)) partial = { text, model: route, usage, cost };
        last = out.error?.message || out.error || (!r.ok ? `HTTP ${r.status}` : cut ? "resposta cortada (limite de tokens)" : "resposta vazia");
        if (r.ok) { attempts.push({ model: route, ok: false, ms: Date.now() - t0, cost, error: last }); DEMOTED.set(route, (DEMOTED.get(route) || 0) + 1); continue; }
      } catch (e) {
        last = e.message;
      }
      attempts.push({ model: route, ok: false, ms: Date.now() - t0, error: String(last).slice(0, 200) });
      DEMOTED.set(route, (DEMOTED.get(route) || 0) + 1);
    }
    if (partial) return { ...partial, truncated: true, attempts };
    const err = new Error(`LLM indisponível (${String(last).slice(0, 120)})`);
    err.attempts = attempts;
    throw err;
  };
}

/** For tests: forget the cached price book. */
export const _resetPriceBook = () => { BOOK = null; DEMOTED.clear(); };
