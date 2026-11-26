// Topic requests ("Peça o seu Watch"): someone on the site asks for a new topic; the request becomes a GitHub
// issue labelled "pedido-de-tema", which fires a Claude routine that drafts the topic, has it reviewed by a second
// model, runs a first collection and opens a pull request for human review. The issue is the queue and the
// audit trail; its comments are the progress the requester sees ("**Status: em criação**" and so on).
// Pages: GITHUB_TOKEN (fine-grained, Issues read/write on the repo), optional GITHUB_REPO.

export const REPO_DEFAULT = "lincolness92/people-analytics-watch";
export const LABEL = "pedido-de-tema";
export const STATUSES = ["recebido", "em criação", "em revisão", "no ar", "recusado"];

const clip = (v, max) => (typeof v === "string" ? v.trim().replace(/\s+\n/g, "\n").slice(0, max) : "");

/** The request from the form, cleaned and bounded; {error} when it cannot be accepted. */
export function validateRequest(body) {
  const r = {
    nome: clip(body?.nome, 80),
    escopo: clip(body?.escopo, 1500),
    perguntas: (Array.isArray(body?.perguntas) ? body.perguntas : String(body?.perguntas || "").split("\n"))
      .map((q) => clip(q, 300)).filter(Boolean).slice(0, 6),
    fontes_sugeridas: clip(body?.fontes, 1000),
    publico: clip(body?.publico, 200),
    solicitante: clip(body?.name, 60),
  };
  if (r.nome.length < 3) return { error: "dê um nome ao tema (3 caracteres ou mais)" };
  if (r.escopo.length < 20) return { error: "descreva o escopo em pelo menos uma frase" };
  return { request: r };
}

/** Issue title and body; the JSON block is what the routine reads. */
export function issueFor(r) {
  const q = r.perguntas.length ? r.perguntas.map((x) => `- ${x}`).join("\n") : "_(nenhuma)_";
  const body = [`Pedido feito pelo site${r.solicitante ? ` por **${r.solicitante}**` : ""}.`, "",
    `**Escopo:** ${r.escopo}`, "", `**Perguntas que o tema deve responder:**`, q, "",
    `**Fontes sugeridas:** ${r.fontes_sugeridas || "_(nenhuma)_"}`, `**Público:** ${r.publico || "_(não informado)_"}`, "",
    "O processamento é automático: uma rotina gera o rascunho, faz a revisão independente, roda a primeira coleta e abre um PR para revisão humana.",
    "", "```json", JSON.stringify(r, null, 2), "```"].join("\n");
  return { title: `Pedido de tema: ${r.nome}`, body, labels: [LABEL] };
}

/** Status of a request from its issue: the last "**Status: …**" comment wins; a closed issue with no status = no ar. */
export function statusOf(issue, comments) {
  let status = "recebido";
  for (const c of comments) {
    const m = String(c.body || "").match(/^\*\*Status:\s*([^*]+?)\s*\*\*/i);
    if (m) status = m[1].toLowerCase();
  }
  if (issue?.state === "closed" && !["recusado", "no ar"].includes(status)) status = "no ar";
  return status;
}

export function makeGitHub(env, fetchImpl = fetch) {
  const repo = env.GITHUB_REPO || REPO_DEFAULT;
  const call = async (path, init = {}) => {
    const r = await fetchImpl(`https://api.github.com/repos/${repo}${path}`, { ...init,
      headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: "application/vnd.github+json",
        "User-Agent": "research-watch", "X-GitHub-Api-Version": "2022-11-28", ...(init.body ? { "Content-Type": "application/json" } : {}) } });
    if (!r.ok) throw Object.assign(new Error(`GitHub HTTP ${r.status}`), { status: 502 });
    return r.json();
  };
  return {
    repo,
    createIssue: (issue) => call("/issues", { method: "POST", body: JSON.stringify(issue) }),
    issue: (n) => call(`/issues/${n}`),
    comments: (n) => call(`/issues/${n}/comments?per_page=50`),
  };
}

/** Progress shown to the requester: status, the timeline of comments (bot markers stripped), PR link when there is one. */
export function progress(issue, comments) {
  const steps = comments.map((c) => ({ at: c.created_at, text: String(c.body || "").replace(/<!--[\s\S]*?-->/g, "").trim().slice(0, 600) }))
    .filter((s) => s.text);
  const pr = comments.map((c) => String(c.body || "").match(/https:\/\/github\.com\/[^\s)]+\/pull\/\d+/)).find(Boolean);
  return { number: issue.number, title: issue.title.replace(/^Pedido de tema:\s*/, ""), status: statusOf(issue, comments),
    opened: issue.created_at, url: issue.html_url, pr: pr ? pr[0] : null, steps };
}
