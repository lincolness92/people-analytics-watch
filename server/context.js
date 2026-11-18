// Request context shared by the external adapters (REST v1, MCP, A2A): loads archives from the published
// files (cached per request), exposes the topic list, the LLM and the per-client quota.

import { loadArchive } from "./archive.js";
import { spendQuota } from "./auth.js";
import { makeLLM } from "./llm.js";
import { ToolError } from "./tools.js";

export function makeContext({ request, env, client }) {
  const fetchAsset = (p) => env.ASSETS.fetch(new URL(p, request.url));
  const cache = new Map();
  return {
    client,
    async topics() {
      const r = await fetchAsset("/topics.json");
      if (!r.ok) throw new ToolError("lista de temas indisponível", 503);
      return r.json();
    },
    async archive(slug) {
      if (!cache.has(slug)) cache.set(slug, loadArchive(fetchAsset, slug));
      const a = await cache.get(slug);
      if (!a) throw new ToolError(`tema não encontrado: ${slug}`, 404);
      return a;
    },
    llm() {
      if (!env.HF_TOKEN) throw new ToolError("IA não configurada (HF_TOKEN)", 503);
      return makeLLM(env);
    },
    quota: (bucket, limit) => spendQuota(env, client, bucket, limit),
  };
}
