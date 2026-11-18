// LLM client used by the serving side (OpenAI-compatible chat via Hugging Face Inference Providers).
// The only module that knows about the provider: swap it here and nothing else changes.

const ROUTER = "https://router.huggingface.co/v1/chat/completions";
export const DEFAULT_MODELS = ["deepseek-ai/DeepSeek-V4.1-Flash", "Qwen/Qwen3.5-122B-A10B"];

/**
 * Returns llm(messages, maxTokens) -> {text, model}, trying each model in turn.
 * `env` needs HF_TOKEN; optional PAW_MODEL (comma-separated models).
 */
export function makeLLM(env, fetchImpl = fetch) {
  const models = (env.PAW_MODEL || "").split(",").map((m) => m.trim()).filter(Boolean);
  // opts.reasoning = "none" turns off the models' hidden reasoning (both default to it): ~1 s instead of 4–17 s,
  // and no chance of the reasoning leaking into the reply. Worth it for short mechanical steps.
  // Returns {text, model, usage, attempts}: attempts lists every model tried (fallbacks included), for tracing.
  return async function llm(messages, maxTokens, opts = {}) {
    let last;
    const attempts = [];
    for (const model of models.length ? models : DEFAULT_MODELS) {
      const t0 = Date.now();
      try {
        const r = await fetchImpl(ROUTER, {
          method: "POST",
          headers: { Authorization: `Bearer ${env.HF_TOKEN}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature: 0.3,
            ...(opts.reasoning ? { reasoning_effort: opts.reasoning } : {}) }),
        });
        const out = await r.json();
        const text = (out.choices?.[0]?.message?.content || "").replace(/<think>[\s\S]*?<\/think>/g, "").trim();
        if (r.ok && text) {
          attempts.push({ model, ok: true, ms: Date.now() - t0 });
          return { text, model, usage: out.usage || null, attempts };
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
