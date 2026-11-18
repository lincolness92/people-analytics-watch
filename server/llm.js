// LLM client used by the serving side (OpenAI-compatible chat via Hugging Face Inference Providers).
// The only module that knows about the provider: swap it here and nothing else changes.

const ROUTER = "https://router.huggingface.co/v1/chat/completions";
const DEEPSEEK = "https://api.deepseek.com/chat/completions";
export const DEFAULT_MODELS = ["deepseek-ai/DeepSeek-V4.1-Flash", "Qwen/Qwen3.5-122B-A10B"];
const DEEPSEEK_FALLBACK = "deepseek:deepseek-flash";

// US$ per 1M tokens at PEAK (off-peak is half): [input cache hit, input cache miss, output] — api-docs.deepseek.com, Nov 2026.
const DEEPSEEK_PRICES = { "deepseek-flash": [0.006, 0.30, 1.20], "deepseek-v4-pro": [0.044, 1.32, 3.96] };
export function deepseekPeak(d = new Date()) {
  const h = d.getUTCHours(), wd = d.getUTCDay();
  return wd >= 1 && wd <= 5 && ((h >= 1 && h < 4) || (h >= 6 && h < 10));
}
export function deepseekCost(model, u, when = new Date()) {
  const [hitP, missP, outP] = DEEPSEEK_PRICES[model] || DEEPSEEK_PRICES["deepseek-flash"];
  const hit = u?.prompt_cache_hit_tokens || 0;
  const miss = u?.prompt_cache_miss_tokens ?? ((u?.prompt_tokens || 0) - hit);
  return (deepseekPeak(when) ? 1 : 0.5) * (hit * hitP + miss * missP + (u?.completion_tokens || 0) * outP) / 1e6;
}

/** The models to try: PAW_MODEL (comma-separated; "deepseek:<id>" = DeepSeek platform) or the defaults, plus DeepSeek
 * direct as a last resort when DEEPSEEK_API_KEY is set. */
export function modelList(env) {
  const ms = (env.PAW_MODEL || "").split(",").map((m) => m.trim()).filter(Boolean);
  const list = ms.length ? ms : [...DEFAULT_MODELS];
  if (env.DEEPSEEK_API_KEY && !list.some((m) => m.startsWith("deepseek:"))) list.push(DEEPSEEK_FALLBACK);
  return list;
}

/**
 * Returns llm(messages, maxTokens) -> {text, model}, trying each model in turn.
 * `env` needs HF_TOKEN; optional PAW_MODEL (comma-separated models).
 */
export function makeLLM(env, fetchImpl = fetch) {
  const models = modelList(env);
  // opts.reasoning = "none" turns off the models' hidden reasoning (both default to it): ~1 s instead of 4–17 s,
  // and no chance of the reasoning leaking into the reply. Worth it for short mechanical steps.
  // Returns {text, model, usage, attempts}: attempts lists every model tried (fallbacks included), for tracing.
  return async function llm(messages, maxTokens, opts = {}) {
    let last;
    const attempts = [];
    for (const model of models) {
      const t0 = Date.now();
      const direct = model.startsWith("deepseek:");
      const apiModel = direct ? model.slice(9) : model;
      if ((direct && !env.DEEPSEEK_API_KEY) || (!direct && !env.HF_TOKEN)) continue;
      try {
        const r = await fetchImpl(direct ? DEEPSEEK : ROUTER, {
          method: "POST",
          headers: { Authorization: `Bearer ${direct ? env.DEEPSEEK_API_KEY : env.HF_TOKEN}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: apiModel, messages, max_tokens: maxTokens, temperature: 0.3,
            ...(opts.reasoning ? { reasoning_effort: opts.reasoning } : {}) }),
        });
        const out = await r.json();
        const text = (out.choices?.[0]?.message?.content || "").replace(/<think>[\s\S]*?<\/think>/g, "").trim();
        if (r.ok && text) {
          const usage = out.usage || null;
          const cost = usage ? (direct ? deepseekCost(apiModel, usage) : Number(usage.cost || 0)) : 0;
          attempts.push({ model, ok: true, ms: Date.now() - t0, cost });
          return { text, model, usage, cost, attempts };
        }
        last = out.error?.message || out.error || (r.ok ? "resposta vazia" : `HTTP ${r.status}`);
      } catch (e) {
        last = e.message;
      }
      attempts.push({ model, ok: false, ms: Date.now() - t0, error: String(last).slice(0, 200) });
    }
    const err = new Error(`LLM indisponível (${String(last).slice(0, 120)})`);
    err.attempts = attempts;
    throw err;
  };
}
