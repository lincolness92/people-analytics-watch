// A2A (Agent2Agent) adapter: the agent card and the JSON-RPC "message/send" handler, delegating to the
// Pergunte agent (server/agent.js). Wired by functions/a2a.js (POST /a2a) and functions/_middleware.js
// (GET /.well-known/agent-card.json, public: the card holds no archive data).

import { ask } from "./agent.js";
import { ToolError, ASK_DAILY_LIMIT } from "./tools.js";

export const PROTOCOL_VERSION = "0.3.0";

export function agentCard(origin, topics) {
  const list = topics.map((t) => `${t.slug} (${t.name})`).join("; ");
  return {
    protocolVersion: PROTOCOL_VERSION,
    name: "Research Watch",
    description: "Agente de um arquivo curado de pesquisa state-of-the-art, um por tema. Responde perguntas usando só as " +
      "fontes do arquivo do tema (papers, marcos históricos, retrospectivas anuais) e cita cada uma.",
    url: `${origin}/a2a`,
    preferredTransport: "JSONRPC",
    version: "1.0.0",
    capabilities: { streaming: false, pushNotifications: false, stateTransitionHistory: false },
    defaultInputModes: ["text/plain", "application/json"],
    defaultOutputModes: ["text/plain", "application/json"],
    securitySchemes: { bearer: { type: "http", scheme: "bearer", description: "Token emitido com `python -m pawatch api-token <nome>`." } },
    security: [{ bearer: [] }],
    skills: [{
      id: "ask-research-archive",
      name: "Perguntar ao arquivo de pesquisa",
      description: `Responde em PT-BR com citações [n] e devolve as fontes (parte data). Informe o tema em ` +
        `message.metadata.topic ou numa parte data {"topic": "..."}. Temas: ${list}. Limite: ${ASK_DAILY_LIMIT} perguntas por cliente por dia.`,
      tags: ["research", "papers", "state-of-the-art", ...topics.map((t) => t.slug)],
      examples: ["O que há de mais recente sobre detecção de contas laranja com grafos?", "Como agentes de IA estão mudando pagamentos?"],
      inputModes: ["text/plain", "application/json"],
      outputModes: ["text/plain", "application/json"],
    }],
  };
}

const rpcError = (id, code, message, data) => ({ jsonrpc: "2.0", id: id ?? null, error: { code, message, ...(data ? { data } : {}) } });

/** Handle one JSON-RPC request object; returns the response object. */
export async function handleRpc(msg, ctx) {
  if (!msg || msg.jsonrpc !== "2.0" || typeof msg.method !== "string") return rpcError(msg?.id, -32600, "requisição JSON-RPC inválida");
  const { id, method, params = {} } = msg;
  if (method === "tasks/get" || method === "tasks/cancel") return rpcError(id, -32001, "tarefa não encontrada: este agente responde de forma síncrona");
  if (method !== "message/send") return rpcError(id, -32601, `método não suportado: ${method}`);

  const m = params.message || {};
  const parts = Array.isArray(m.parts) ? m.parts : [];
  const text = parts.filter((p) => p.kind === "text" && typeof p.text === "string").map((p) => p.text).join("\n").trim();
  const dataPart = parts.find((p) => p.kind === "data" && p.data && typeof p.data === "object");
  const topic = m.metadata?.topic || dataPart?.data?.topic || params.metadata?.topic;
  const topics = await ctx.topics();
  if (!topic || !topics.some((t) => t.slug === topic)) {
    return rpcError(id, -32602, "informe o tema em message.metadata.topic", { topics: topics.map((t) => t.slug) });
  }
  if (text.length < 5) return rpcError(id, -32602, "envie a pergunta numa parte de texto");
  try {
    const over = await ctx.quota("ask", ASK_DAILY_LIMIT);
    if (over) throw new ToolError(over, 429);
    const r = await ask({ archive: await ctx.archive(topic), question: text.slice(0, 600), llm: ctx.llm() });
    return {
      jsonrpc: "2.0", id,
      result: {
        kind: "message", role: "agent", messageId: crypto.randomUUID(), contextId: m.contextId || crypto.randomUUID(),
        parts: [{ kind: "text", text: r.answer }, { kind: "data", data: { topic, model: r.model, sources: r.sources } }],
      },
    };
  } catch (e) {
    return rpcError(id, -32603, e.message);
  }
}
