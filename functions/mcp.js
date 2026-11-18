// MCP server (Streamable HTTP transport, stateless, JSON responses) at POST /mcp.
// Tools = server/tools.js, so they are the same as REST v1. Bearer token (server/auth.js).
// Connect, e.g.:  claude mcp add --transport http research-watch https://<site>/mcp --header "Authorization: Bearer <token>"

import { checkBearer } from "../server/auth.js";
import { makeContext } from "../server/context.js";
import { callTool, ToolError, TOOLS } from "../server/tools.js";

const SUPPORTED = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];
const SERVER = { name: "research-watch", title: "Research Watch", version: "1.0.0" };
const INSTRUCTIONS = "Arquivo curado de pesquisa state-of-the-art, um por tema (people analytics, fraude bancária, " +
  "tecnologia e IA em bancos...). Comece por list_topics; use search_archive para achar fontes e get_paper/get_digest/" +
  "get_evolution/get_annual_review para detalhes. ask_archive responde em linguagem natural citando as fontes, mas é lento.";

const reply = (body, status = 200) => new Response(body === null ? null : JSON.stringify(body), {
  status, headers: body === null ? {} : { "Content-Type": "application/json", "Cache-Control": "no-store" } });
const result = (id, r) => ({ jsonrpc: "2.0", id, result: r });
const error = (id, code, message) => ({ jsonrpc: "2.0", id: id ?? null, error: { code, message } });

export async function onRequestPost({ request, env }) {
  const auth = await checkBearer(request, env);
  if (!auth.ok) return new Response(JSON.stringify(error(null, -32001, auth.error)), {
    status: auth.status, headers: { "Content-Type": "application/json", "WWW-Authenticate": "Bearer" } });
  let msg;
  try { msg = await request.json(); } catch { return reply(error(null, -32700, "JSON inválido"), 400); }
  if (Array.isArray(msg)) return reply(error(null, -32600, "lotes não são suportados"), 400);
  if (!msg || msg.jsonrpc !== "2.0" || typeof msg.method !== "string") return reply(error(msg?.id, -32600, "requisição JSON-RPC inválida"), 400);
  const { id, method, params = {} } = msg;
  if (id === undefined) return reply(null, 202); // notification (e.g. notifications/initialized): nothing to answer

  switch (method) {
    case "initialize": {
      const v = SUPPORTED.includes(params.protocolVersion) ? params.protocolVersion : SUPPORTED[0];
      return reply(result(id, { protocolVersion: v, capabilities: { tools: { listChanged: false } }, serverInfo: SERVER, instructions: INSTRUCTIONS }));
    }
    case "ping":
      return reply(result(id, {}));
    case "tools/list":
      return reply(result(id, { tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })) }));
    case "tools/call": {
      try {
        const data = await callTool(params.name, params.arguments || {}, makeContext({ request, env, client: auth.client }));
        const structured = data !== null && typeof data === "object" && !Array.isArray(data) ? data : { result: data };
        return reply(result(id, { content: [{ type: "text", text: JSON.stringify(data ?? null) }], structuredContent: structured, isError: false }));
      } catch (e) {
        if (e instanceof ToolError && e.status === 404 && /ferramenta desconhecida/.test(e.message)) return reply(error(id, -32602, e.message));
        // tool failures are results the model can read and react to, not protocol errors
        return reply(result(id, { content: [{ type: "text", text: e.message }], isError: true }));
      }
    }
    default:
      return reply(error(id, -32601, `método não suportado: ${method}`));
  }
}

export const onRequestGet = () => new Response(null, { status: 405, headers: { Allow: "POST" } });
export const onRequestDelete = () => new Response(null, { status: 405, headers: { Allow: "POST" } });
