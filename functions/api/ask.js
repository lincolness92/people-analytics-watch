// POST /api/ask — answer a question about one topic, citing only papers from its archive.
// Behind functions/_middleware.js (site password). Needs the Pages secret HF_TOKEN; optional PAW_MODEL.
// 1) the LLM expands the question into PT+EN search terms; 2) lexical ranking over the topic's
// data.json (digest items, quick mentions, Evolução milestones, trends); 3) the LLM answers from
// the top sources only, citing them as [n]. Questions are logged in KV (prefix "ask:") when bound.

const ROUTER = "https://router.huggingface.co/v1/chat/completions";
const DEFAULT_MODELS = ["deepseek-ai/DeepSeek-V4.1-Flash", "Qwen/Qwen3.5-122B-A10B"];
const DAILY_LIMIT = 40;
const TOP_K = 18;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

const STOP = new Set(("a o os as um uma uns umas de da do das dos em no na nos nas por para pra com sem sobre entre e ou que " +
  "qual quais quanto como onde quando porque se ser é são foi há ter tem mais menos muito muita isso isto esse essa este esta " +
  "eu você vocês nós ele ela eles elas me te lhe meu minha seu sua the of and or to in on for with by from at as is are was be " +
  "what which how why when does do did can could should would about into than that this these those it its an any some").split(" "));

export function tokens(text) {
  return (text || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9]+/).filter((t) => t.length > 2 && !STOP.has(t))
    .map((t) => (t.length > 4 && t.endsWith("s") ? t.slice(0, -1) : t));
}

export function corpus(data) {
  const docs = [];
  for (const d of data.digests || []) {
    for (const it of d.items || []) {
      docs.push({ kind: "paper", title: it.title, url: it.url, when: d.date, venue: it.venue,
        text: [it.title, it.original_title, it.summary, it.venue, (it.authors || []).join(" "), data.themes?.[it.theme]].join(" ") });
    }
    for (const q of d.quick || []) {
      docs.push({ kind: "paper", title: q.title, url: q.url, when: d.date, venue: q.venue,
        text: [q.title, q.original_title, q.note, q.venue].join(" ") });
    }
    if (d.trend) docs.push({ kind: "tendência", title: `Tendência de ${d.date}`, url: null, when: d.date, text: d.trend });
  }
  const ev = data.evolution;
  if (ev) {
    for (const e of ev.eras || []) {
      for (const m of e.milestones || []) {
        docs.push({ kind: "marco", title: m.title, url: m.url, when: String(m.year || ""), venue: m.venue,
          text: [m.title, m.why, (m.authors || []).join(" "), e.title, e.summary, data.themes?.[m.theme]].join(" ") });
      }
    }
    if (ev.now?.summary) docs.push({ kind: "evolução", title: "Onde estamos agora", url: null, when: ev.generated,
      text: [ev.now.summary, ...(ev.now.open_questions || [])].join(" ") });
  }
  return docs;
}

export function rank(docs, terms, k = TOP_K) {
  const toks = docs.map((d) => tokens(d.text));
  const df = new Map();
  for (const ts of toks) for (const t of new Set(ts)) df.set(t, (df.get(t) || 0) + 1);
  const N = docs.length || 1;
  const avg = toks.reduce((s, ts) => s + ts.length, 0) / N || 1;
  const q = [...new Set(terms.flatMap(tokens))];
  const scored = docs.map((d, i) => {
    const tf = new Map();
    for (const t of toks[i]) tf.set(t, (tf.get(t) || 0) + 1);
    let s = 0;
    for (const t of q) {
      const f = tf.get(t);
      if (!f) continue;
      const idf = Math.log(1 + (N - df.get(t) + 0.5) / (df.get(t) + 0.5));
      s += idf * (f * 2.2) / (f + 1.2 * (0.25 + 0.75 * toks[i].length / avg)); // BM25
    }
    return { d, s };
  });
  return scored.filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, k).map((x) => x.d);
}

async function chat(env, messages, maxTokens) {
  const models = (env.PAW_MODEL || "").split(",").map((m) => m.trim()).filter(Boolean);
  let last;
  for (const model of models.length ? models : DEFAULT_MODELS) {
    try {
      const r = await fetch(ROUTER, {
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
}

const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function onRequestPost({ request, env }) {
  if (!env.HF_TOKEN) return json({ ok: false, error: "IA não configurada (HF_TOKEN)" }, 503);
  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: "JSON inválido" }, 400); }
  const topic = str(body.topic, 40);
  const question = str(body.question, 600);
  const voter = str(body.voter, 40) || "anon";
  if (!/^[a-z0-9-]{1,40}$/.test(topic)) return json({ ok: false, error: "tema inválido" }, 400);
  if (question.length < 5) return json({ ok: false, error: "pergunta muito curta" }, 400);
  const history = (Array.isArray(body.history) ? body.history : []).slice(-2)
    .map((h) => ({ q: str(h?.q, 600), a: str(h?.a, 1500) })).filter((h) => h.q && h.a);

  const day = new Date().toISOString().slice(0, 10);
  const rlKey = `rl:${day}:${voter}`;
  if (env.FEEDBACK) {
    const used = parseInt((await env.FEEDBACK.get(rlKey)) || "0", 10);
    if (used >= DAILY_LIMIT) return json({ ok: false, error: `limite de ${DAILY_LIMIT} perguntas por dia atingido` }, 429);
    await env.FEEDBACK.put(rlKey, String(used + 1), { expirationTtl: 60 * 60 * 36 });
  }

  const res = await env.ASSETS.fetch(new URL(`/${topic}/data.json`, request.url));
  if (!res.ok) return json({ ok: false, error: "tema não encontrado" }, 404);
  const data = await res.json();
  const name = data.topic?.name || topic;

  // 1) search terms in PT and EN (titles are mostly English, questions Portuguese)
  let terms = [question, ...history.map((h) => h.q)];
  try {
    const { text } = await chat(env, [
      { role: "system", content: "Você gera termos de busca. Responda só com uma linha de 8 a 20 termos/expressões separados por vírgula, em português E em inglês (sinônimos, conceitos técnicos, nomes de construtos), sem explicação." },
      { role: "user", content: `Tema do arquivo: ${name}.\nPergunta: ${question}${history.length ? `\nContexto anterior: ${history.map((h) => h.q).join(" | ")}` : ""}` },
    ], 300);
    terms = terms.concat(text.split(/[,;\n]/));
  } catch { /* fall back to the question's own words */ }

  const sources = rank(corpus(data), terms);
  if (!sources.length) {
    return json({ ok: true, answer: "Não encontrei nada no arquivo deste tema sobre isso. Tente outras palavras, ou um assunto mais próximo dos temas cobertos.", sources: [] });
  }

  // 2) answer from the sources only
  const block = sources.map((s, i) =>
    `[${i + 1}] (${s.kind}${s.when ? `, ${s.when}` : ""}${s.venue ? `, ${s.venue}` : ""}) ${s.title}\n${s.text.slice(0, 900)}`).join("\n\n");
  const system = `Você é o assistente do ${name}, um arquivo curado de pesquisa. Responda em PT-BR, de forma direta e concreta, ` +
    `usando SOMENTE as fontes numeradas fornecidas. Cite as fontes no texto como [1], [2] logo após cada afirmação. ` +
    `Não invente papers, números ou autores. Se as fontes não respondem bem à pergunta, diga isso claramente e diga o que elas cobrem. ` +
    `Formato: 1 a 3 parágrafos curtos; pode usar **negrito** em termos-chave. Sem cabeçalhos, sem lista de referências no fim.`;
  const messages = [{ role: "system", content: system }];
  for (const h of history) messages.push({ role: "user", content: h.q }, { role: "assistant", content: h.a });
  messages.push({ role: "user", content: `Fontes:\n\n${block}\n\nPergunta: ${question}` });

  let answer, model;
  try {
    ({ text: answer, model } = await chat(env, messages, 2500));
  } catch (e) {
    return json({ ok: false, error: e.message }, 502);
  }

  if (env.FEEDBACK) {
    const key = `ask:${topic}:${new Date().toISOString()}:${crypto.randomUUID().slice(0, 8)}`;
    await env.FEEDBACK.put(key, JSON.stringify({ topic, question, voter, name: str(body.name, 60) || null,
      sources: sources.length, model, answer_chars: answer.length, at: new Date().toISOString() }));
  }
  return json({ ok: true, answer, model, sources: sources.map((s, i) => ({ n: i + 1, kind: s.kind, title: s.title, url: s.url, when: s.when })) });
}

export const onRequest = () => json({ ok: false, error: "use POST" }, 405);
