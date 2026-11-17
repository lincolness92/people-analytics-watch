// POST /api/feedback — store one reader reaction in Cloudflare KV (binding FEEDBACK).
// Runs behind functions/_middleware.js, so only people with the site password get here.
// The daily workflow exports new entries to data/<topic>/feedback.json (python -m pawatch feedback).

const KINDS = new Set(["paper", "marco", "digest", "evolucao", "watchlist", "site", "resposta"]);
const VOTES = new Set(["up", "down", "none"]);

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function onRequestPost({ request, env }) {
  if (!env.FEEDBACK) return json({ ok: false, error: "armazenamento de feedback não configurado" }, 503);
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "JSON inválido" }, 400);
  }
  const topic = str(body.topic, 40);
  const kind = str(body.kind, 20);
  const vote = body.vote == null ? "" : str(body.vote, 10);
  const comment = str(body.comment, 2000);
  if (!/^[a-z0-9-]{1,40}$/.test(topic)) return json({ ok: false, error: "tema inválido" }, 400);
  if (!KINDS.has(kind)) return json({ ok: false, error: "tipo inválido" }, 400);
  if (vote && !VOTES.has(vote)) return json({ ok: false, error: "voto inválido" }, 400);
  if (!vote && !comment) return json({ ok: false, error: "nada para registrar" }, 400);

  const now = new Date().toISOString();
  const entry = {
    topic, kind, vote: vote || null, comment: comment || null,
    ref: str(body.ref, 500), title: str(body.title, 300),
    name: str(body.name, 60) || null, voter: str(body.voter, 40) || null,
    at: now,
  };
  const key = `fb:${topic}:${now}:${crypto.randomUUID().slice(0, 8)}`;
  await env.FEEDBACK.put(key, JSON.stringify(entry));
  return json({ ok: true });
}

export const onRequest = () => json({ ok: false, error: "use POST" }, 405);
