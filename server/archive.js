// Query core over a topic's published archive. No HTTP, no LLM: every interface (site API, the
// Pergunte agent, and later REST/MCP/A2A adapters) calls these functions, so they all agree.
//
// The archive is what the Python pipeline publishes per topic:
//   <topic>/data.json     digests, Evolução, annual reviews, watchlist, themes (see src/pawatch/render.py)
//   <topic>/library.json  every paper the triage scored >= 5, with its original abstract (src/pawatch/library.py)
//   <topic>/search.json   the same documents as corpus() below, with BM25 statistics and an inverted index
//                         precomputed by src/pawatch/searchindex.py (search() falls back to corpus()+rank())

export const TOPIC_RE = /^[a-z0-9-]{1,40}$/;
export const DEFAULT_K = 18;

const STOP = new Set(("a o os as um uma uns umas de da do das dos em no na nos nas por para pra com sem sobre entre e ou que " +
  "qual quais quanto como onde quando porque se ser é são foi há ter tem mais menos muito muita isso isto esse essa este esta " +
  "eu você vocês nós ele ela eles elas me te lhe meu minha seu sua the of and or to in on for with by from at as is are was be " +
  "what which how why when does do did can could should would about into than that this these those it its an any some").split(" "));

export function tokens(text) {
  return (text || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9]+/).filter((t) => t.length > 2 && !STOP.has(t))
    .map((t) => (t.length > 4 && t.endsWith("s") ? t.slice(0, -1) : t));
}

/**
 * Load a topic's archive. `fetchAsset(path)` returns a fetch Response for a published file
 * (in Pages Functions: (p) => env.ASSETS.fetch(new URL(p, request.url))).
 * Returns null when the topic does not exist; a missing library is not an error.
 */
export async function loadArchive(fetchAsset, topic) {
  if (!TOPIC_RE.test(topic || "")) return null;
  const res = await fetchAsset(`/${topic}/data.json`);
  if (!res.ok) return null;
  const data = await res.json();
  const optional = async (p) => {
    try {
      const r = await fetchAsset(p);
      return r.ok ? await r.json() : null;
    } catch { return null; }
  };
  // Prefer the precomputed index; the library is then only needed for getPaper, so load it lazily.
  const index = await optional(`/${topic}/search.json`);
  const archive = { slug: topic, name: data.topic?.name || topic, data, index, library: [] };
  if (!index) archive.library = (await optional(`/${topic}/library.json`)) || [];
  archive.loadLibrary = async () => {
    if (!archive.library.length) archive.library = (await optional(`/${topic}/library.json`)) || [];
    return archive.library;
  };
  return archive;
}

/** Archives of every other topic listed in /topics.json (for questions that cross topic borders). */
export async function loadOtherArchives(fetchAsset, slug) {
  let topics = [];
  try {
    const r = await fetchAsset("/topics.json");
    if (r.ok) topics = await r.json();
  } catch { /* single-topic answers still work */ }
  const all = await Promise.all(topics.filter((t) => t.slug !== slug).map((t) => loadArchive(fetchAsset, t.slug)));
  return all.filter(Boolean);
}

/** BM25 over a precomputed index (src/pawatch/searchindex.py): only the postings of the query terms are read. */
export function rankIndex(index, terms, k = DEFAULT_K, keep = null, withScores = false) {
  const { weights, phrases } = queryTerms(terms);
  const scores = new Map();
  for (const [t, w] of weights) {
    const p = index.postings[t];
    if (!p) continue;
    const df = p.length / 2;
    const idf = Math.log(1 + (index.n - df + 0.5) / (df + 0.5));
    for (let j = 0; j < p.length; j += 2) {
      const i = p[j], f = p[j + 1];
      const s = w * idf * (f * 2.2) / (f + 1.2 * (0.25 + 0.75 * index.len[i] / index.avgdl));
      scores.set(i, (scores.get(i) || 0) + s);
    }
  }
  if (phrases.length) for (const [i, s] of scores) scores.set(i, s + phraseBonus(tokens(index.docs[i].text || ""), phrases));
  return [...scores.entries()]
    .filter(([i]) => !keep || keep(index.docs[i]))
    .sort((a, b) => b[1] - a[1] || a[0] - b[0]).slice(0, k).map(([i, s]) => (withScores ? { ...index.docs[i], score: s } : index.docs[i]));
}

const WATCH_KINDS = { researchers: "pessoa de referência", historical: "pessoa de referência (histórica)",
  journals: "revista ou evento de referência", centers: "instituição de referência", practitioners: "praticante de referência" };
const j = (...parts) => parts.map((p) => (p === null || p === undefined ? "" : String(p))).join(" ");

/** Every searchable unit of the archive, as {kind, title, url, when, venue, text}. Mirror of build_docs (searchindex.py). */
export function corpus(data, library = [], repos = []) {
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
  for (const [year, a] of Object.entries(data.annual || {})) {
    const label = `retrospectiva ${year}${a.partial ? " (parcial)" : ""}`;
    if (a.overview) docs.push({ kind: label, title: `Panorama de ${year}`, url: null, when: year, text: a.overview });
    if (a.innovation) docs.push({ kind: label, title: `Onde a inovação acontece em ${year}`, url: null, when: year, text: a.innovation });
    for (const t of a.trends || []) docs.push({ kind: label, title: t.title, url: null, when: year, text: `${t.title}. ${t.text}` });
    for (const h of a.highlights || []) {
      docs.push({ kind: `destaque de ${year}`, title: h.title, url: h.url, when: (h.date || year).slice(0, 10), venue: h.venue,
        text: [h.title, h.original_title, h.why, h.venue, (h.authors || []).join(" "), data.themes?.[h.theme]].join(" ") });
    }
  }
  // Library: triaged papers with their original abstracts; skip what the curated parts already cover.
  const seen = new Set(docs.map((d) => d.url).filter(Boolean));
  for (const p of library) {
    if (!p.url || seen.has(p.url)) continue;
    seen.add(p.url);
    docs.push({ kind: "paper triado", title: p.title, url: p.url, when: p.date, venue: p.venue,
      text: [p.title, p.abstract, p.venue, (p.authors || []).join(" "), data.themes?.[p.theme]].join(" ") });
  }
  // Watchlist: who and what the curation follows
  for (const [key, items] of Object.entries(data.watchlist || {})) {
    for (const w of Array.isArray(items) ? items : []) {
      docs.push({ kind: WATCH_KINDS[key] || "referência", title: w.name, url: w.url ?? null, when: null, venue: null,
        text: j(w.name, w.institution, w.org, w.region, w.area, w.why) });
    }
  }
  // Code: repositories found in the papers
  for (const r of repos) {
    const name = r.url.replace(/\/$/, "").split("/").slice(-2).join("/");
    docs.push({ kind: "código" + (r.own ? " dos autores" : ""), title: name, url: r.url, when: (r.pushed_at || "").slice(0, 10) || null, venue: null,
      text: j(name, r.description, (r.paper_titles || []).join(" | "), r.language, r.stars != null ? `${r.stars} estrelas` : null, r.license,
        (r.readme || "").slice(0, 1500)) });
  }
  return docs;
}

/**
 * Query terms → {weights: Map(token → weight), phrases: [{toks, w}]}. A term is a string (weight 1) or {text, w}.
 * Multi-word terms also count as phrases: a document holding the words in order gets a bonus, so
 * "foundation model" beats a document that only mentions "model" many times.
 */
export function queryTerms(terms) {
  const weights = new Map(), phrases = [];
  for (const t of terms) {
    const text = typeof t === "string" ? t : t.text;
    const w = typeof t === "string" ? 1 : t.w;
    const toks = tokens(text);
    for (const tok of toks) weights.set(tok, Math.max(weights.get(tok) || 0, w));
    if (toks.length >= 2 && toks.length <= 4) phrases.push({ toks, w });
  }
  return { weights, phrases };
}

const PHRASE_BONUS = 2.0;
function phraseBonus(docToks, phrases) {
  let b = 0;
  for (const { toks, w } of phrases) {
    for (let i = 0; i + toks.length <= docToks.length; i++) {
      let ok = true;
      for (let j = 0; j < toks.length && ok; j++) ok = docToks[i + j] === toks[j];
      if (ok) { b += PHRASE_BONUS * w; break; }
    }
  }
  return b;
}

/** BM25 over the docs for a list of query terms (strings or {text, w}); best k first. */
export function rank(docs, terms, k = DEFAULT_K, withScores = false) {
  const toks = docs.map((d) => tokens(d.text));
  const df = new Map();
  for (const ts of toks) for (const t of new Set(ts)) df.set(t, (df.get(t) || 0) + 1);
  const N = docs.length || 1;
  const avg = toks.reduce((s, ts) => s + ts.length, 0) / N || 1;
  const { weights, phrases } = queryTerms(terms);
  const scored = docs.map((d, i) => {
    const tf = new Map();
    for (const t of toks[i]) tf.set(t, (tf.get(t) || 0) + 1);
    let s = 0;
    for (const [t, w] of weights) {
      const f = tf.get(t);
      if (!f) continue;
      const idf = Math.log(1 + (N - df.get(t) + 0.5) / (df.get(t) + 0.5));
      s += w * idf * (f * 2.2) / (f + 1.2 * (0.25 + 0.75 * toks[i].length / avg)); // BM25
    }
    if (s > 0 && phrases.length) s += phraseBonus(tokens((d.text || "").slice(0, 900)), phrases);
    return { d, s };
  });
  const top = scored.filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, k);
  return withScores ? top.map((x) => ({ ...x.d, score: x.s })) : top.map((x) => x.d);
}

// ---------- full text of papers (shared store dist/papers/, built by src/pawatch/fulltext.py) ----------

/** Shared paper index {key: {title, urls, topics, has_text, file, sections, repos, ...}} plus url → key aliases. */
export async function loadPapers(fetchAsset) {
  const opt = async (p) => { try { const r = await fetchAsset(p); return r.ok ? await r.json() : null; } catch { return null; } };
  const index = (await opt("/papers/index.json")) || {};
  const byUrl = new Map();
  for (const [key, e] of Object.entries(index)) {
    for (const u of e.urls || []) byUrl.set(normUrl(u), key);
    byUrl.set(key, key);
  }
  return { index, byUrl, fetchAsset, cache: new Map(), repos: null, opt };
}

const normUrl = (u) => String(u || "").trim().toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//, "doi:").replace(/\/+$/, "");

/** Key of a paper from a URL, DOI ("10.x/..." or "doi:..."), arXiv id ("arxiv:..." or "2303.17564") or exact key. */
export function paperKey(papers, ref) {
  if (!ref) return null;
  const r = String(ref).trim();
  const tries = [r, normUrl(r), `doi:${r.toLowerCase()}`, `arxiv:${r.replace(/^arxiv:/i, "").replace(/v\d+$/, "")}`,
    normUrl(`https://doi.org/${r}`)];
  for (const t of tries) if (papers.byUrl.has(t)) return papers.byUrl.get(t);
  return null;
}

/** Stored full text of a paper ({key, title, source, sections:[{name,text}], repos}) or null. */
export async function loadFulltext(papers, key) {
  const e = papers.index[key];
  if (!e?.has_text || !e.file) return null;
  if (!papers.cache.has(key)) papers.cache.set(key, papers.opt(`/papers/${e.file}`));
  return papers.cache.get(key);
}

/** Paragraph-sized chunks of a paper ranked by BM25 against the terms; best first. */
export function rankChunks(paper, terms, k = 6, size = 900, withScores = false) {
  const chunks = [];
  for (const s of paper.sections || []) {
    const paras = s.text.split(/\n\s*\n|\n(?=[A-Z])/);
    let buf = "";
    for (const p of paras) {
      if ((buf + " " + p).length > size && buf) { chunks.push({ section: s.name, text: buf.trim() }); buf = ""; }
      buf += " " + p;
      while (buf.length > size * 1.5) { chunks.push({ section: s.name, text: buf.slice(0, size).trim() }); buf = buf.slice(size); }
    }
    if (buf.trim()) chunks.push({ section: s.name, text: buf.trim() });
  }
  // results and conclusions answer "what did they find"; related work and future work rarely do
  const weight = (name) => /result|experiment|evaluat|finding|conclu|discussion|abstract|resumo|performance|ablation/i.test(name) ? 1.3
    : /related work|background|literature|future work|limitation|trabalhos relacionados/i.test(name) ? 0.5 : 1;
  return rank(chunks.map((c) => ({ ...c, kind: "trecho" })), terms, k * 4, true)
    .map((c) => ({ ...c, score: c.score * weight(c.section) }))
    .sort((a, b) => b.score - a.score).slice(0, k).map(({ score, ...c }) => (withScores ? { ...c, score } : c));
}

export async function loadRepos(papers) {
  if (!papers.repos) papers.repos = (await papers.opt("/papers/repos.json")) || {};
  return papers.repos;
}

// ---------- queries (the contract future adapters expose as tools/endpoints) ----------

/** Topics published on the site: [{slug, name}]. Any topic's data.json lists them all. */
export function listTopics(archive) {
  return archive.data.topics || [{ slug: archive.slug, name: archive.name }];
}

/** Search one topic. `query` is a string or a list of terms; `kinds` optionally filters by doc kind prefix. */
export function search(archive, query, { k = DEFAULT_K, kinds = null, scores = false } = {}) {
  const terms = Array.isArray(query) ? query : [query]; // strings or {text, w}
  const keep = kinds && kinds.length ? (d) => kinds.some((p) => d.kind.startsWith(p)) : null;
  if (archive.index) return rankIndex(archive.index, terms, k, keep, scores);
  let docs = corpus(archive.data, archive.library);
  if (kinds && kinds.length) docs = docs.filter((d) => kinds.some((p) => d.kind.startsWith(p)));
  return rank(docs, terms, k, scores);
}

/** One digest by date (YYYY-MM-DD), or the latest when no date is given. */
export function getDigest(archive, date = null) {
  const ds = archive.data.digests || [];
  return (date ? ds.find((d) => d.date === date) : ds[0]) || null;
}

export function getEvolution(archive) {
  return archive.data.evolution || null;
}

/** Annual review of a year, or every year available ({year: review}) when no year is given. */
export function getAnnual(archive, year = null) {
  const all = archive.data.annual || {};
  return year ? all[String(year)] || null : all;
}

/** Everything the archive knows about a paper, by URL (digest item, milestone, highlight, library entry). */
export async function getPaper(archive, url) {
  if (!url) return null;
  if (archive.loadLibrary) await archive.loadLibrary();
  const hits = [];
  const { data, library } = archive;
  for (const d of data.digests || []) {
    for (const it of [...(d.items || []), ...(d.quick || [])]) if (it.url === url) hits.push({ in: `digest ${d.date}`, ...it });
  }
  for (const e of data.evolution?.eras || []) {
    for (const m of e.milestones || []) if (m.url === url) hits.push({ in: `Evolução (${e.label})`, ...m });
  }
  for (const [year, a] of Object.entries(data.annual || {})) {
    for (const h of a.highlights || []) if (h.url === url) hits.push({ in: `retrospectiva ${year}`, ...h });
  }
  for (const p of library) if (p.url === url) hits.push({ in: "biblioteca", ...p });
  return hits.length ? { url, appearances: hits } : null;
}
