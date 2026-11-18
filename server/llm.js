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
  return async function llm(messages, maxTokens) {
    let last;
    for (const model of models.length ? models : DEFAULT_MODELS) {
      try {
        const r = await fetchImpl(ROUTER, {
          method: "POST",
          headers: { Authorization: `Bearer ${env.HF_TOKEN}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature: 0.3 }),
        });
        const out = await r.json();
        const text = (out.choices?.[0]?.message?.content || "").replace(/<think>[\s\S]*?<\/think>/g, "").trim();
        if (r.ok && text) return { text, model };
        last = out.error?.message || out.error || `HTTP ${r.status}`;
      } catch (e) {
        last = e.message;
      }
    }
    throw new Error(`LLM indisponível (${String(last).slice(0, 120)})`);
  };
}
