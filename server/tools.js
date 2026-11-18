// Tool catalog over the query core: one definition per capability (name, description, JSON Schema of the
// input, handler). The REST v1 and MCP adapters expose exactly this list, so they cannot drift apart.

import { DEFAULT_K, getAnnual, getDigest, getEvolution, getPaper, loadFulltext, loadRepos, paperKey, rank, rankChunks, search, TOPIC_RE } from "./archive.js";
import { ask } from "./agent.js";
import { KIND } from "./trace.js";

const topicArg = { type: "string", description: "Slug do tema (ver list_topics), ex.: fraude-bancaria", pattern: TOPIC_RE.source };

export const ASK_DAILY_LIMIT = 40;

export class ToolError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

/** ctx = { topics(): [{slug,name,description}], archive(slug), llm(), quota(bucket, limit) } */
export const TOOLS = [
  {
    name: "list_topics",
    description: "Lista os temas do arquivo de pesquisa (slug, nome e descrição).",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    run: async (_args, ctx) => ctx.topics(),
  },
  {
    name: "search_archive",
    description: "Busca no arquivo curado de um tema (papers dos digests, biblioteca de papers triados com resumo, " +
      "marcos da Evolução, retrospectivas anuais, tendências). Devolve os documentos mais relevantes (BM25).",
    inputSchema: {
      type: "object", required: ["topic", "query"], additionalProperties: false,
      properties: {
        topic: topicArg,
        query: { type: "string", description: "Termos de busca; vale misturar português e inglês." },
        k: { type: "integer", minimum: 1, maximum: 50, default: DEFAULT_K },
        kinds: { type: "array", items: { type: "string" }, description: "Filtra por tipo (prefixo): paper, paper triado, marco, destaque, retrospectiva, tendência, evolução" },
      },
    },
    run: async (a, ctx) => search(await ctx.archive(a.topic), a.query, { k: Math.min(50, Math.max(1, a.k || DEFAULT_K)), kinds: a.kinds })
      .map(({ kind, title, url, when, venue, text }) => ({ kind, title, url, when, venue, snippet: (text || "").slice(0, 400) })),
  },
  {
    name: "get_digest",
    description: "Digest de um tema numa data (AAAA-MM-DD) ou o mais recente: papers selecionados, menções rápidas e tendência.",
    inputSchema: { type: "object", required: ["topic"], additionalProperties: false,
      properties: { topic: topicArg, date: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" } } },
    run: async (a, ctx) => getDigest(await ctx.archive(a.topic), a.date || null),
  },
  {
    name: "list_digests",
    description: "Datas dos digests disponíveis de um tema, com a manchete de cada um.",
    inputSchema: { type: "object", required: ["topic"], additionalProperties: false, properties: { topic: topicArg } },
    run: async (a, ctx) => ((await ctx.archive(a.topic)).data.digests || [])
      .map((d) => ({ date: d.date, headline: d.headline || "", selected: (d.items || []).length })),
  },
  {
    name: "get_evolution",
    description: "Evolução do estado da arte do tema: épocas, marcos (papers que definiram cada época), fios por tema e onde estamos agora.",
    inputSchema: { type: "object", required: ["topic"], additionalProperties: false, properties: { topic: topicArg } },
    run: async (a, ctx) => getEvolution(await ctx.archive(a.topic)),
  },
  {
    name: "get_annual_review",
    description: "Retrospectiva anual do tema: destaques, tendências, volume por subtema e quem publica. Sem ano, devolve todos os anos.",
    inputSchema: { type: "object", required: ["topic"], additionalProperties: false,
      properties: { topic: topicArg, year: { type: "integer", minimum: 2000, maximum: 2100 } } },
    run: async (a, ctx) => getAnnual(await ctx.archive(a.topic), a.year || null),
  },
  {
    name: "get_paper",
    description: "Tudo o que o arquivo sabe sobre um paper (por URL/DOI): em que digests, marcos, retrospectivas e na biblioteca ele aparece.",
    inputSchema: { type: "object", required: ["topic", "url"], additionalProperties: false,
      properties: { topic: topicArg, url: { type: "string" } } },
    run: async (a, ctx) => getPaper(await ctx.archive(a.topic), a.url),
  },
  {
    name: "read_paper",
    description: "Texto completo (cópia aberta e legal) de um paper do acervo: marcos da Evolução e destaques das retrospectivas. " +
      "Aceita URL, DOI ou id do arXiv. Com `query`, devolve só os trechos mais relevantes; com `section`, só aquela seção; " +
      "sem nenhum, as seções até `max_chars`. Inclui os repositórios de código citados no paper.",
    inputSchema: { type: "object", required: ["paper"], additionalProperties: false,
      properties: { paper: { type: "string", description: "URL, DOI (10.x/...) ou arXiv (2303.17564)" },
        query: { type: "string" }, section: { type: "string" }, max_chars: { type: "integer", minimum: 1000, maximum: 60000, default: 12000 } } },
    run: async (a, ctx) => {
      const papers = await ctx.papers();
      const key = paperKey(papers, a.paper);
      if (!key) throw new ToolError("paper fora do acervo de texto completo (só marcos e destaques); use get_paper/search_archive", 404);
      const e = papers.index[key];
      const base = { key, title: e.title, year: e.year, topics: e.topics, roles: e.roles, repos: e.repos || [] };
      const doc = await loadFulltext(papers, key);
      if (!doc) return { ...base, has_text: false, reason: e.reason || "sem cópia aberta" };
      const meta = { ...base, has_text: true, source: doc.source, sections: doc.sections.map((s) => s.name), repo_details: doc.repos };
      if (a.query) return { ...meta, excerpts: rankChunks(doc, [a.query], 8).map(({ section, text }) => ({ section, text })) };
      const max = Math.min(60000, a.max_chars || 12000);
      const secs = a.section ? doc.sections.filter((s) => s.name.toLowerCase().startsWith(a.section.toLowerCase())) : doc.sections;
      let left = max;
      const text = [];
      for (const s of secs) { if (left <= 0) break; text.push({ name: s.name, text: s.text.slice(0, left) }); left -= s.text.length; }
      return { ...meta, text, truncated: left < 0 };
    },
  },
  {
    name: "list_repos",
    description: "Repositórios de código e dados citados pelos papers do acervo (GitHub, GitLab, Hugging Face, Zenodo...), com " +
      "estrelas, linguagem, último push, se é o código do próprio paper e um trecho do README. Filtre por tema e/ou termos. " +
      "Para ver a implementação, clone a URL (`clone`).",
    inputSchema: { type: "object", additionalProperties: false,
      properties: { topic: topicArg, query: { type: "string" }, own_only: { type: "boolean", default: false },
        k: { type: "integer", minimum: 1, maximum: 100, default: 30 } } },
    run: async (a, ctx) => {
      const papers = await ctx.papers();
      const repos = Object.values(await loadRepos(papers))
        .filter((r) => (!a.topic || (r.topics || []).includes(a.topic)) && (!a.own_only || r.own));
      const titled = repos.map((r) => ({ ...r, paper_titles: (r.papers || []).map((k) => papers.index[k]?.title).filter(Boolean) }));
      const pick = a.query
        ? rank(titled.map((r) => ({ ...r, text: [r.url, r.description, r.language, (r.readme || "").slice(0, 2000), ...r.paper_titles].join(" ") })), [a.query], a.k || 30)
        : titled.sort((x, y) => (y.own - x.own) || ((y.stars || 0) - (x.stars || 0)));
      return pick.slice(0, a.k || 30).map(({ text, readme, ...r }) => ({ ...r, readme_excerpt: (readme || "").slice(0, 800) }));
    },
  },
  {
    name: "ask_archive",
    description: "Pergunta em linguagem natural respondida pelo agente do arquivo, usando só as fontes do tema e citando-as como [n]. " +
      `Usa um LLM (20–40 s); limite de ${ASK_DAILY_LIMIT} por cliente por dia.`,
    inputSchema: { type: "object", required: ["topic", "question"], additionalProperties: false,
      properties: { topic: topicArg, question: { type: "string", minLength: 5, maxLength: 600 } } },
    run: async (a, ctx) => {
      const over = await ctx.quota("ask", ASK_DAILY_LIMIT);
      if (over) throw new ToolError(over, 429);
      return ask({ archive: await ctx.archive(a.topic), question: a.question.slice(0, 600), llm: ctx.llm(), papers: await ctx.papers(),
        others: ctx.others ? await ctx.others(a.topic) : [], tracer: ctx.tracer, parent: ctx.parentSpan, attrs: ctx.traceAttrs });
    },
  },
];

const BY_NAME = new Map(TOOLS.map((t) => [t.name, t]));

/** Minimal argument check against the tool's inputSchema (required + types + pattern), then run it. */
export async function callTool(name, args, ctx) {
  const tool = BY_NAME.get(name);
  if (!tool) throw new ToolError(`ferramenta desconhecida: ${name}`, 404);
  const a = args && typeof args === "object" ? args : {};
  const { properties = {}, required = [] } = tool.inputSchema;
  for (const k of required) if (a[k] === undefined || a[k] === "") throw new ToolError(`parâmetro obrigatório: ${k}`);
  for (const [k, v] of Object.entries(a)) {
    const p = properties[k];
    if (!p) throw new ToolError(`parâmetro desconhecido: ${k}`);
    const ok = p.type === "integer" ? Number.isInteger(v) : p.type === "array" ? Array.isArray(v) : typeof v === p.type;
    if (!ok) throw new ToolError(`parâmetro ${k} deve ser ${p.type}`);
    if (p.pattern && !new RegExp(p.pattern).test(v)) throw new ToolError(`parâmetro ${k} inválido`);
  }
  if (!ctx.tracer) return tool.run(a, ctx);
  // one TOOL span per call; ask_archive nests its own agent spans under it
  return ctx.tracer.span(`tool:${name}`, KIND.TOOL, { "tool.name": name, "tool.parameters": JSON.stringify(a), "input.value": JSON.stringify(a),
    ...(ctx.traceAttrs || {}) }, null, async (s) => {
    const out = await tool.run(a, { ...ctx, parentSpan: s });
    s.set("output.value", JSON.stringify(out ?? null).slice(0, 4000));
    return out;
  });
}
