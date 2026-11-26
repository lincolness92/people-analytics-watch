/* Carteira: a Research Watch design, ported from the "Carteira" prototype.
   Reads the topic's live data.json (../../data.json) and the other topics' data.json for the wallet of topics.
   The first half is pure data mapping (no DOM; it also runs under node for checks); the second half is the UI. */
(function () {
"use strict";

/* =====================================================================================================
   1. Helpers and data mapping (pure)
   ===================================================================================================== */
const MON = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
const MONTHS = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
const WD = ["dom","seg","ter","qua","qui","sex","sáb"], WDL = ["domingo","segunda","terça","quarta","quinta","sexta","sábado"];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const md = s => esc(s).replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g,"$1<em>$2</em>");
const plain = s => String(s || "").replace(/\*\*/g,"").replace(/\*/g,"");
const safeUrl = u => (/^https?:\/\//i.test(u || "") ? u : "#");
const stripMark = s => String(s || "").replace(/^[^\p{L}\p{N}]+\s*/u, "");
const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
const dt = iso => new Date(String(iso).slice(0,10) + "T12:00:00");
const dmy = iso => { const d = dt(iso); return `${d.getDate()} ${MON[d.getMonth()]}`; };
const ddmm = iso => { const d = dt(iso); return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}`; };
const pct = c => (c >= 0 ? "+" : "") + Math.round(c * 100) + "%";
const isoOf = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const addDays = (iso, n) => { const d = dt(iso); d.setDate(d.getDate() + n); return isoOf(d); };
const daysBetween = (from, to) => Math.round((dt(to) - dt(from)) / 864e5);
const nf = n => Number(n || 0).toLocaleString("pt-BR");
const sentences = s => String(s || "").trim().split(/(?<=[.!?])\s+(?=["“'(]*[A-ZÀ-Ý0-9])/).filter(Boolean);

// Subthemes, in data.json order; each takes a palette slot (--p0..--p7) by position.
function themesOf(data) {
  return Object.entries(data.themes || {}).map(([key, v], idx) => ({ key, label: stripMark(v) || key, idx }));
}

// Every digest item (main and quick mentions) as one flat list, newest digest first, best score first.
function itemsOf(data) {
  const out = [];
  (data.digests || []).forEach(d => {
    const push = (it, kind) => out.push({
      id: it.key || it.url || `${d.date}|${it.title}`,
      kind, digest: d.date,
      title: it.title || it.original_title || "",
      orig: it.original_title || it.title || "",
      url: it.url || "", venue: it.venue || "", date: it.date || d.date,
      authors: Array.isArray(it.authors) ? it.authors : [],
      score: Number(it.score) || 0, theme: it.theme || "",
      text: (kind === "main" ? it.summary : it.note) || it.summary || it.note || "",
      watch: it.origin === "watchlist" || !!(it.watch_authors && it.watch_authors.length) || !!it.watch_journal || !!it.watch_source,
    });
    (d.items || []).forEach(it => push(it, "main"));
    (d.quick || []).forEach(it => push(it, "quick"));
  });
  return out.sort((a, b) => b.digest.localeCompare(a.digest) || b.score - a.score);
}

function digestsOf(data) {
  return (data.digests || []).map(d => ({
    date: d.date, n: (d.items || []).length + (d.quick || []).length,
    headline: d.headline || "", trend: d.trend || "",
    from: (d.period && d.period.from) || d.date, to: (d.period && d.period.to) || d.date,
  })).sort((a, b) => b.date.localeCompare(a.date));
}

// "Por que importa": the sentence that carries the lesson, else the last one (prototype heuristic, made generic).
function whyOf(it) {
  const t = plain(it.text);
  if (!t) return "";
  if (it.kind === "quick") { const m = t.split(/;\s|\s—\s|: /); return cap(m.length > 1 ? m[m.length - 1] : t); }
  const ss = sentences(t);
  const k = ss.find(s => /[Ll]ição|recado|Na prática|Para (bancos|quem|um banco|empresas|times|gestores|o RH|líderes)|[Ii]mplicação/.test(s));
  return cap((k || ss[ss.length - 1] || t).replace(/^(.*?,\s*)?(A )?[Ll]ição( prática)?( é que|:)\s*/, "").replace(/^(A )?[Ll]ição( prática)?\s*/, ""));
}
const shortVenue = v => { v = String(v || "").replace(/\s*\(.*?\)/g, "").replace(/ — .*/, "").trim(); return v.length > 30 ? v.slice(0, 28) + "…" : v; };

// What is new since the reader's previous visit (same record as the main site: paw_visit|<slug>).
function sinceOf(items, digests, prev) {
  const latest = digests.find(d => d.n > 0) || null;
  if (prev && prev.digest) {
    const fresh = items.filter(it => it.digest > prev.digest);
    if (fresh.length) return { mode: "visit", prevAt: prev.at || prev.digest, items: fresh, latest };
  }
  return { mode: prev ? "nonew" : "latest", prevAt: prev ? (prev.at || prev.digest) : "", latest,
    items: latest ? items.filter(it => it.digest === latest.date) : [] };
}

// Dates written in regulation texts: "1º de janeiro de 2027" and "1º/12/2025" / "01/12/2026" (with their position).
function datesIn(text) {
  const out = [];
  const s = String(text || "");
  const re1 = new RegExp(`(\\d{1,2})º?\\s+de\\s+(${MONTHS.join("|")})\\s+de\\s+(\\d{4})`, "gi");
  let m;
  while ((m = re1.exec(s))) out.push({ iso: `${m[3]}-${String(MONTHS.indexOf(m[2].toLowerCase()) + 1).padStart(2,"0")}-${m[1].padStart(2,"0")}`, i: m.index, len: m[0].length });
  const re2 = /\b(\d{1,2})º?\/(\d{1,2})\/(\d{4})\b/g;
  while ((m = re2.exec(s))) out.push({ iso: `${m[3]}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`, i: m.index, len: m[0].length });
  return out.filter(x => !isNaN(dt(x.iso)));
}
const parseDates = text => datesIn(text).map(x => x.iso);
// A short excerpt of a long clause, centred on the date it mentions.
function around(cl, i, len) {
  if (cl.length <= 120) return cl;
  let a = Math.max(0, i - 70), b = Math.min(cl.length, i + len + 40);
  if (a > 0) a = cl.indexOf(" ", a) + 1;
  if (b < cl.length) { const sp = cl.lastIndexOf(" ", b); if (sp > i + len) b = sp; }
  return (a > 0 ? "…" : "") + cl.slice(a, b).replace(/[,;:\s]+$/, "") + (b < cl.length ? "…" : "");
}

// Upcoming regulatory dates, read from each norm's "effective" text (revocations are not deadlines).
function deadlinesOf(data, today) {
  const out = [];
  (data.regulation || []).forEach(r => {
    if (r.revoked || r.cancelled || !r.effective) return;
    let best = null;
    String(r.effective).split(/;\s+|\.\s+(?=[A-ZÀ-Ý])/).forEach(cl => {
      if (/revoga/i.test(cl)) return;
      const c = cl.trim().replace(/\.$/, "");
      datesIn(c).forEach(d => { if (d.iso > today && (!best || d.iso < best.date)) best = { date: d.iso, clause: around(c, d.i, d.len) }; });
    });
    if (best) out.push({ ...best, norm: r.title || [r.type, r.number].filter(Boolean).join(" "), url: r.url || "",
      what: sentences(plain(r.summary))[0] || r.subject || "", theme: r.theme || "", days: daysBetween(today, best.date) });
  });
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

// The growth row a yearly trend talks about: its label terms in the text, else the same "+N%" figure.
function matchGrowth(text, growth) {
  const raw = String(text || ""), t = raw.toLowerCase().replace(/\s*\/\s*/g, "/");
  let best = null, bestPos = Infinity;
  growth.forEach(g => {
    const lab = String(g.label || "").toLowerCase();
    const cands = [lab.replace(/\s*\/\s*/g, "/"), ...lab.split(/\s*\/\s*/)].filter(x => x.length >= 4);
    cands.forEach(c => { const p = t.indexOf(c); if (p >= 0 && p < bestPos) { best = g; bestPos = p; } });
  });
  // the same "+N%" figure as a growth row counts too; the earliest mention in the text wins
  const rawPos = raw.replace(/\s*\/\s*/g, "/");
  for (const m of rawPos.matchAll(/\+(\d+)%/g)) {
    if (m.index >= bestPos) break;
    const g = growth.find(x => x.prev > 0 && Math.round(x.chg * 100) === +m[1]);
    if (g) { best = g; bestPos = m.index; break; }
  }
  return best;
}
const queryLike = l => /\bOR\b|\bAND\b|[()"]/.test(l || "");

function annualOf(data) {
  const A = data.annual || {};
  const years = Object.keys(A).sort();
  if (!years.length) return null;
  const y = years[years.length - 1], a = A[y], pa = A[String(+y - 1)] || null;
  const prevOf = label => { const g = pa && (pa.growth || []).find(x => x.label === label); return g ? g.prev : null; };
  const G = (a.growth || []).filter(g => g && g.label && g.prev > 0).map(g => ({
    label: g.label, prev: g.prev, cur: g.cur, proj: g.cur_full_year ?? g.cur, chg: g.change, prev2: prevOf(g.label),
  }));
  return {
    year: +y, partial: !!a.partial, until: a.partial && a.generated ? ddmm(a.generated) : "",
    overview: a.overview || "",
    trends: (a.trends || []).map(t => ({ title: t.title, text: t.text, g: matchGrowth(t.text, G) })),
    growth: G.filter(g => !queryLike(g.label)).sort((p, q) => q.chg - p.chg),
    nHighlights: (a.highlights || []).length, nGrowth: G.length,
  };
}

function eraRange(e, ms, isLast, nowYear) {
  const ys = ms.map(m => m.year).filter(Boolean);
  const lo = ys.length ? Math.min(...ys) : nowYear, hi = ys.length ? Math.max(...ys) : nowYear;
  const nums = [...new Set((`${e.key || ""} ${e.label || ""}`.match(/\d{4}/g) || []).map(Number))];
  if (nums.length >= 2) return [nums[0], nums[1]];
  if (nums.length === 1) {
    if (/at[eé]|≤|antes/i.test(`${e.key} ${e.label}`)) return [Math.min(lo, nums[0]), nums[0]];
    return [nums[0], Math.max(isLast ? nowYear : nums[0], hi)];
  }
  return [lo, hi];
}

function evoOf(data, nowYear) {
  const ev = data.evolution;
  if (!ev || !Array.isArray(ev.eras) || !ev.eras.length) return null;
  const eras = ev.eras.map((e, i, all) => {
    const ms = (e.milestones || []).map(m => ({ year: +m.year || 0, title: m.title || "", authors: m.authors || [],
      cited: +m.cited_by || 0, theme: m.theme || "", why: m.why || "", isNew: !!m.new, url: m.url || "", venue: m.venue || "" }));
    return { key: e.key, label: e.label || e.key, title: e.title || "", summary: e.summary || "", ms,
      range: eraRange(e, ms, i === all.length - 1, nowYear) };
  });
  const all = eras.flatMap(e => e.ms);
  const ch = ev.changes || {};
  const nowS = (ev.now && ev.now.summary) || "";
  const ss = sentences(nowS);
  const syn = ss.find(s => /síntese/i.test(s)) || ss[ss.length - 1] || "";
  return {
    generated: ev.generated || "", overview: ev.overview || "", now: nowS,
    statement: cap(syn.replace(/^(Em\s+)?(A\s+|Na\s+)?síntese[^,:]*?(é que|:|,)\s*/i, "")),
    eras, nMs: all.length, minYear: all.length ? Math.min(...all.map(m => m.year).filter(Boolean)) : null,
    added: ch.added || [], removed: ch.removed || [], note: ch.note || "",
    threads: (ev.threads || []).filter(t => t && t.line),
  };
}

function watchCounts(data) {
  const w = data.watchlist || {};
  const n = k => (Array.isArray(w[k]) ? w[k].length : 0);
  return { researchers: n("researchers"), journals: n("journals"), centers: n("centers"), practitioners: n("practitioners") };
}

// One topic, summarised for the wallet of topics (#/temas).
function landingOf(data) {
  const digests = digestsOf(data), items = itemsOf(data);
  const latest = digests.find(d => d.headline) || digests[0] || null;
  const an = annualOf(data), ev = evoOf(data, new Date().getFullYear());
  const newest = digests.length ? digests[0].date : "";
  const top = an && an.growth.length ? an.growth[0] : null;
  return {
    slug: (data.topic && data.topic.slug) || "",
    brand: brandOf(data.topic), name: (data.topic && data.topic.name) || "",
    headline: latest ? latest.headline : "", date: newest,
    per: digests.slice().reverse().map(d => d.n), ndig: digests.length,
    total: items.length, items7: newest ? items.filter(it => it.digest > addDays(newest, -7)).length : 0,
    top, year: an ? an.year : null, partial: an ? an.partial : false,
    era: ev ? ev.eras[ev.eras.length - 1].title : "", nreg: (data.regulation || []).length,
  };
}
function brandOf(t) { return (t && ((t.brand && t.brand.text) || t.name)) || "Research Watch"; }

// Ask examples: the main site's set (web/app.js askExamples), plus a few generic ones, grouped by reader.
const ONBOARD_Q = "Estou chegando agora neste campo: quais conceitos, marcos e debates preciso conhecer primeiro, e por onde começo a ler?";
const lcFirst = s => (!s || /^\S{1,3}\b/.test(s) || /^\S[A-Z]/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1));
function askExamples(data) {
  const th = Object.values(data.themes || {}).map(t => lcFirst(stripMark(t)));
  const t0 = th[0] || "este tema", t1 = th[1] || t0, t2 = th[2] || t0;
  const hasReg = (data.regulation || []).length > 0;
  return [
    { intent: "Panorama para quem chega", q: ONBOARD_Q },
    { intent: "Estado da arte", q: `Qual é o estado da arte em ${t0} hoje, e o que mudou nos últimos dois anos?` },
    { intent: "Funciona?", q: `Há evidência de que as abordagens de ${t1} funcionam na prática? Com que tamanho de efeito e quais limitações?` },
    { intent: "Quem acompanhar", q: "Quais pesquisadores, instituições e fontes de referência vale acompanhar neste tema, e por quê?" },
    { intent: "Tem código?", q: `Existe código aberto ou implementação disponível para os métodos de ${t2}?` },
    { intent: "O que a regulação exige?", q: hasReg
      ? "O que a regulação exige hoje neste tema, e quais normas recentes mudaram as obrigações?"
      : "Quais normas, diretrizes ou exigências legais tocam este tema?" },
    { intent: "Plano de qualificação", q: "Monte um plano de estudo de 3 meses para eu me qualificar neste tema, com leituras do arquivo em ordem." },
    { intent: "Minha ideia de projeto faz sentido?", q: "Tenho uma ideia de projeto: [descreva aqui]. Ela faz sentido à luz do que a pesquisa mostra? O que já foi tentado e quais os riscos?", select: "[descreva aqui]" },
  ];
}
function personasOf(data) {
  const ex = askExamples(data), an = annualOf(data);
  const y = an ? an.year : new Date().getFullYear();
  const th = Object.values(data.themes || {}).map(t => lcFirst(stripMark(t)));
  const t1 = th[1] || th[0] || "este tema";
  const hasReg = (data.regulation || []).length > 0;
  const E = i => ({ k: ex[i].intent, q: ex[i].q, select: ex[i].select });
  return {
    "Recém-chegado": [E(0), { k: "Panorama do ano", q: `O que mudou neste tema em ${y}, e por quê?` }, E(3), E(6)],
    "Especialista": [E(1), E(2), E(4), { k: "Comparar", q: "Quais abordagens disputam o estado da arte neste tema, e o que a evidência diz de cada uma?" }],
    "Gestor": [{ k: "Decidir", q: "Quais apostas deste tema já têm evidência suficiente para virar projeto, e quais ainda são experimentais?" },
      E(5), { k: "Medir", q: `Como medir se uma iniciativa de ${t1} está funcionando? Que métricas a pesquisa usa?` }, E(7)],
    "Diretoria": [{ k: "Tendências", q: `Quais subtemas mais cresceram em ${y}, e o que isso significa para a nossa estratégia?` },
      { k: "Regulação", q: hasReg ? "Quais normas recentes mudam nossas obrigações neste tema, e com que prazos?" : "Quais exigências legais ou diretrizes tocam este tema?" },
      { k: "Aposta", q: "Onde vale investir neste tema no próximo ano, segundo a pesquisa recente?" },
      { k: "Benchmark", q: "Quem mais publica neste tema: academia, empresas ou governo?" }],
  };
}

// The whole model the views read.
function build(data, opts) {
  const today = (opts && opts.today) || isoOf(new Date());
  const items = itemsOf(data), digests = digestsOf(data);
  const themes = themesOf(data);
  return {
    today, topic: { slug: (data.topic && data.topic.slug) || "", brand: brandOf(data.topic), name: (data.topic && data.topic.name) || "" },
    topics: (data.topics || []).filter(t => t && t.slug),
    generated: data.generated || today,
    themes, themeIdx: Object.fromEntries(themes.map(t => [t.key, t.idx])), themeLabel: Object.fromEntries(themes.map(t => [t.key, t.label])),
    items, digests, since: sinceOf(items, digests, opts && opts.prev),
    headline: (digests.find(d => d.headline) || {}).headline || "", trend: (digests.find(d => d.trend) || {}).trend || "",
    deadlines: deadlinesOf(data, today), nreg: (data.regulation || []).length,
    annual: annualOf(data), evo: evoOf(data, +today.slice(0, 4)), watch: watchCounts(data),
    examples: askExamples(data), personas: personasOf(data), landing: landingOf(data),
  };
}

const API = { build, itemsOf, digestsOf, sinceOf, deadlinesOf, parseDates, annualOf, evoOf, landingOf, matchGrowth, whyOf, askExamples, personasOf };
if (typeof window === "undefined") { if (typeof module !== "undefined") module.exports = API; return; }

/* =====================================================================================================
   2. UI
   ===================================================================================================== */
const $ = (s, el = document) => el.querySelector(s), $$ = (s, el = document) => [...el.querySelectorAll(s)];
const app = $("#app");
const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } },
};
// Same key and format as web/app.js, so ask limits are shared with the main site.
const voterId = () => {
  let v = store.get("paw_voter", "");
  if (!v) { v = Math.random().toString(36).slice(2, 12); store.set("paw_voter", v); }
  return v;
};
let DATA = null, V = null, current = "";
const fbOn = () => DATA && !DATA.offline && /^https?:$/.test(location.protocol);

const P = i => `var(--p${((i % 8) + 8) % 8})`;
const tIdx = k => (V.themeIdx[k] ?? 6);
const M = k => `--m:${P(tIdx(k))}`;
const TL = k => V.themeLabel[k] || k || "Geral";
const ERA_P = [6, 7, 5, 3, 0, 2, 4, 1], STORY_P = [2, 4, 5, 0, 3, 1, 6, 7], INTENT_P = [0, 5, 3, 1];
const TOPIC_C = ["#0E6B58", "#2B2A33", "#3B2F86", "#8A5A12", "#1F5C99", "#A82C6E"];
const kindColor = k => { let h = 0; for (const c of String(k || "")) h = (h * 31 + c.charCodeAt(0)) >>> 0; return P(h % 8); };
const yy = iso => (iso.slice(0, 4) !== V.today.slice(0, 4) ? ` ${iso.slice(2, 4)}` : "");

const ICON = {
  arr:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  plus:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M8 3v10M3 8h10" stroke-linecap="round"/></svg>',
  x:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke-linecap="round"/></svg>',
  chev:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 6l4 4 4-4" stroke-linecap="round"/></svg>',
  mic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true"><rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" stroke-linecap="round"/></svg>',
  send:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  filt:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M2 4h12M4.5 8h7M7 12h2" stroke-linecap="round"/></svg>',
  play:'<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M4 2.5v11l9-5.5z"/></svg>',
  pause:'<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><rect x="3.5" y="2.5" width="3" height="11" rx="1"/><rect x="9.5" y="2.5" width="3" height="11" rx="1"/></svg>',
  info:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="8" cy="8" r="6.2"/><path d="M8 7.2v4M8 4.9v.1" stroke-linecap="round"/></svg>',
  ext:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M6 3H3.5v9.5H13V10M9 3h4v4M13 3L7.5 8.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  sun:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" stroke-linecap="round"/></svg>',
  moon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true"><path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z" stroke-linejoin="round"/></svg>',
  auto:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/></svg>',
  back:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true"><path d="M10 6l-6 6 6 6M4 12h16" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};
const arr14 = ICON.arr.replace("<svg", '<svg width="14" height="14"'), arr16 = ICON.arr.replace("<svg", '<svg width="16" height="16"');

function barcode(seed, w = 220, h = 16) {
  let s = 0; for (const c of seed) s = (s * 31 + c.charCodeAt(0)) >>> 0;
  let x = 0, r = "";
  while (x < w) { s = (s * 1103515245 + 12345) >>> 0; const bw = 1 + (s >>> 8) % 3, gap = 1 + (s >>> 12) % 3; r += `<rect x="${x}" width="${bw}" height="${h}"/>`; x += bw + gap; }
  return `<svg class="barcode" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" width="100%" height="${h}" fill="currentColor" aria-hidden="true">${r}</svg>`;
}

// ---------- "desde sua última visita" (same record as the main site) ----------
const SESSION_GAP = 60 * 60 * 1000;
function setupVisit(d) {
  const key = `paw_visit|${d.topic.slug}`;
  const rec = store.get(key, null);
  const snap = { ts: Date.now(), at: isoOf(new Date()), digest: (d.digests[0] || {}).date || "", evo: (d.evolution || {}).generated || "" };
  let prev = null;
  if (rec && rec.cur && typeof rec.cur.ts === "number") prev = Date.now() - rec.cur.ts > SESSION_GAP ? rec.cur : (rec.prev || null);
  store.set(key, { prev, cur: snap });
  return prev;
}
let PREV = null;
const isNew = it => !!(PREV && PREV.digest && it.digest > PREV.digest);

/* ---------- item card + detail sheet ---------- */
function ic(it) {
  return `<article class="ic ${it.score >= 8 ? "hi" : ""}" data-id="${esc(it.id)}" style="${M(it.theme)}">
    <div class="tp"><span class="sw"></span><span class="tl">${esc(TL(it.theme))}</span><span class="scr" aria-label="nota ${it.score} de 10"><b>${it.score}</b><span>/10</span></span></div>
    <h3><button class="stretch" aria-haspopup="dialog">${esc(it.title)}</button></h3>
    <p class="why"><b>Por que importa:</b> ${esc(whyOf(it))}</p>
    <div class="bt">${isNew(it) ? '<span class="pb new">Novo</span>' : ""}${it.watch ? '<span class="pb wl">Watchlist</span>' : ""}<span>${esc(shortVenue(it.venue))} · ${dmy(it.date)}</span></div>
    <span class="open" aria-hidden="true">${ICON.plus}</span>
  </article>`;
}
function wireCards(root) { $$(".ic", root).forEach(b => b.addEventListener("click", () => openItem(b.dataset.id, b))); }
const sh = $("#sheet");
function showSheet() {
  if (!sh.open) { try { sh.showModal(); } catch { sh.setAttribute("open", ""); } }
  sh.scrollTop = 0; const t = $("#shIn"); t.setAttribute("tabindex", "-1"); t.focus({ preventScroll: true });
}
function closeSheet() { if (sh.open) sh.close(); }
sh.addEventListener("click", e => { if (e.target === sh) closeSheet(); });
function wireClose() { const c = $("#shIn [data-close]"); if (c) c.addEventListener("click", closeSheet); }
function openItem(id, from) {
  const it = V.items.find(x => x.id === id); if (!it) return;
  const au = it.authors.length > 3 ? `${it.authors.slice(0, 3).join(", ")} et al.` : it.authors.join(", ");
  const html = `<div class="grab"></div><div class="sh-head mat" style="${M(it.theme)};view-transition-name:hero">
      <div class="row"><span>${esc(TL(it.theme))}</span><span class="big">${it.score}<span style="font-size:14px;opacity:.75">/10</span></span></div>
      <h3>${esc(it.title)}</h3>${it.orig && it.orig !== it.title ? `<p class="orig">${esc(it.orig)}</p>` : ""}</div>
    <div class="sh-body">
      <h4>POR QUE IMPORTA</h4><p style="color:var(--ink);font-weight:550">${esc(whyOf(it))}</p>
      ${it.kind === "main" ? `<h4>RESUMO</h4><p>${md(it.text)}</p>` : ""}
      <h4>FONTE</h4><p>${esc([it.venue, dmy(it.date) + yy(it.date), au].filter(Boolean).join(" · "))}</p>
      <div style="display:flex;gap:8px;margin-top:20px">${it.url ? `<a class="btn" style="flex:1" href="${esc(safeUrl(it.url))}" target="_blank" rel="noopener">Abrir a fonte ${ICON.ext}</a>` : ""}<button class="btn sec2" data-close${it.url ? "" : ' style="flex:1"'}>Fechar</button></div>
    </div>`;
  const go = () => { $("#shIn").innerHTML = html; wireClose(); showSheet(); };
  if (document.startViewTransition && !RM && from && !sh.open) {
    from.style.viewTransitionName = "hero";
    const tr = document.startViewTransition(() => { from.style.viewTransitionName = ""; go(); });
    tr.finished.catch(() => {});
  } else go();
}
function sheet(html, wire) { $("#shIn").innerHTML = `<div class="grab"></div><div class="sh-body" style="padding-top:4px">${html}</div>`; wire && wire($("#shIn")); showSheet(); }

/* ---------- Início ---------- */
function vHome() {
  const S = V.since, an = V.annual, ev = V.evo, next = V.deadlines[0];
  const fresh = S.items.slice().sort((a, b) => b.score - a.score).slice(0, 8).reverse();
  const n = S.items.length;
  const eyebrow = `Atualizado em ${dmy(V.generated)}` + (S.mode === "visit" ? ` · desde ${WDL[dt(S.prevAt).getDay()]}, ${dmy(S.prevAt)}`
    : S.mode === "nonew" ? ` · nada novo desde ${dmy(S.prevAt)}` : "");
  const lead = !n ? "Nenhum achado ainda" : S.mode === "visit" ? `${n} ${n === 1 ? "achado novo" : "achados novos"}`
    : `${n} ${n === 1 ? "achado" : "achados"} no último digest`;
  const dl = next ? `, <em>1 prazo</em> em ${next.days} ${next.days === 1 ? "dia" : "dias"}.` : ".";
  const top3 = V.items.slice().sort((a, b) => b.score - a.score || b.date.localeCompare(a.date)).slice(0, 3);
  const ds = V.digests;
  const range = ds.length ? `de ${dmy(ds[ds.length - 1].date)} a ${dmy(ds[0].date)}` : "";
  const ex = V.examples.slice(1, 4);
  const bars = an ? an.growth.slice(0, 7) : [];
  const trends = an ? an.trends : [];
  const nAdded = ev ? ev.added.length : 0;
  return `
  <section class="hero rv"><span class="eyebrow">${esc(eyebrow)}</span>
    <h1>${esc(lead)}${dl}</h1></section>
  <div class="home">
    <section class="sec rv" style="margin-top:22px" aria-label="${S.mode === "visit" ? "Desde sua última visita" : "Último digest"}">
      ${fresh.length ? `<div class="wallet" id="wallet">${fresh.map((it, i) => `
        <article class="wcard mat" data-id="${esc(it.id)}" style="${M(it.theme)};z-index:${i + 1};animation-delay:${i * 110}ms">
          <div class="row"><span class="tl">${esc(TL(it.theme))}</span><span class="sc" aria-label="nota ${it.score}">${it.score}</span></div>
          <h3><button class="stretch">${esc(it.title)}</button></h3><p>${esc(whyOf(it))}</p>
          <div class="foot"><span>${esc(shortVenue(it.venue))}</span><span>${dmy(it.date)}</span></div></article>`).join("")}</div>` : ""}
      <div class="wallet-meta"><a class="tag" href="#/novidades"><b>${n}</b> ${S.mode === "visit" ? "itens novos" : "itens no último digest"}</a>${ev
        ? `<a class="tag" href="#/evolucao"><b>${nAdded || ev.nMs}</b> ${nAdded ? "marcos novos na Evolução" : "marcos na Evolução"}</a>` : ""}${next
        ? `<a class="tag hot" href="#prazos" data-scroll="prazos"><b>${next.days}</b> dias p/ o próximo prazo</a>` : ""}</div>
    </section>
    ${ev && ev.statement ? `<section class="sec rv" style="margin-top:22px" aria-label="Estado do campo">
      <div class="statement"><span class="eyebrow">Estado do campo, em uma frase</span>
        <q style="margin-top:8px">${esc(ev.statement)}</q>
        <div class="era"><a class="era-pill" href="#/evolucao"><i>Era ${ev.eras.length}</i>${esc(ev.eras[ev.eras.length - 1].title)}</a></div>
        <details><summary>Ler a síntese do mês ${ICON.chev.replace("<svg", '<svg width="14" height="14" style="margin-left:4px"')}</summary><p>${md(ev.now)}</p></details>
      </div>
    </section>` : ""}
    ${trends.length ? `<section class="sec rv" aria-label="Conclusões de ${an.year}">
      <div class="sec-h"><div><h2>${an.year} em ${trends.length} ${trends.length === 1 ? "conclusão" : "conclusões"}</h2><p>${an.partial && an.until ? `Retrospectiva até ${an.until}` : "Retrospectiva do ano"} · toque para avançar</p></div></div>
      <div class="stories mat" id="stories" style="--m:${P(STORY_P[0])}">
        <div class="bars">${trends.map(() => `<span><i></i></span>`).join("")}</div>
        ${trends.map((t, i) => story(t, i, trends.length, an)).join("")}
        <button class="tap l" aria-label="Conclusão anterior"></button><button class="tap r" aria-label="Próxima conclusão"></button>
      </div>
    </section>` : ""}
    ${bars.length ? `<section class="sec rv" aria-labelledby="h-sub">
      <div class="sec-h"><div><h2 id="h-sub">Subtemas que mais crescem</h2><p>Trabalhos por ano no OpenAlex</p></div></div>
      <div class="gbars" id="gbars">${bars.map(g => `
        <div class="gb" data-cur="${g.cur}" data-proj="${g.proj}" data-prev="${g.prev}"><div class="t"><b>${esc(g.label)}</b><span class="${g.chg >= 1 ? "up" : ""}">${pct(g.chg)}</span></div>
        <div class="track"><span class="cur"></span><span class="proj"></span><span class="prev" title="${an.year - 1}"></span></div>
        <div class="meta"><span>${nf(g.prev)} → ${nf(g.proj)}</span>${g.chg >= 1 ? '<span class="st-hot">em alta</span>' : ""}</div></div>`).join("")}</div>
      <div class="gkey"><span><i></i>${an.year}${an.partial && an.until ? ` até ${an.until}` : ""}</span>${an.partial ? '<span><i class="h"></i>projeção do ano</span>' : ""}<span><i class="m"></i>nível de ${an.year - 1}</span></div>
    </section>` : ""}
    ${V.deadlines.length ? `<section class="sec rv span" id="prazos" aria-labelledby="h-dl">
      <div class="sec-h"><div><h2 id="h-dl">Prazos regulatórios</h2><p>O que vence e o que a norma trata</p></div><a class="more" href="../carta/#/regulacao">${V.nreg} normas ${ICON.arr}</a></div>
      <div class="tickets">${V.deadlines.slice(0, 4).map(x => `
        <div class="tkt ${x.days <= 30 ? "soon" : ""}"><div class="stub"><small>vence em</small><b>${x.days}</b><small>${x.days === 1 ? "dia" : "dias"}</small></div>
          <div class="body"><div class="n"><span>${esc(x.norm)}</span><span class="muted tnum">${dmy(x.date)}${yy(x.date)}</span></div><p>${esc(x.what)}</p><p class="cl" title="${esc(x.clause)}">${esc(x.clause)}</p>${barcode(x.norm)}</div></div>`).join("")}</div>
    </section>` : ""}
    ${top3.length ? `<section class="sec rv span" aria-labelledby="h-best">
      <div class="sec-h"><div><h2 id="h-best">Melhores do período</h2><p>Maior nota entre ${V.items.length} itens ${range}</p></div><a class="more" href="#/novidades">Ver todas ${ICON.arr}</a></div>
      <div class="cards grid3">${top3.map(ic).join("")}</div>
    </section>` : ""}
    <section class="sec rv span" aria-labelledby="h-ask">
      <div class="sec-h"><div><h2 id="h-ask">Pergunte ao Watch</h2><p>Respostas com fontes numeradas${voice.stt ? ", por texto ou voz" : ""}</p></div></div>
      <a class="ask-entry" href="#/pergunte"><span>${esc(V.examples[1].q)}</span>${voice.stt ? `<span class="cbtn" aria-hidden="true">${ICON.mic}</span>` : ""}<span class="cbtn go" aria-hidden="true">${ICON.send}</span></a>
      <div class="exs">${ex.map(x => `<a href="#/pergunte?q=${encodeURIComponent(x.q)}">${esc(x.q)}</a>`).join("")}</div>
    </section>
  </div>`;
}
function story(t, i, n, an) {
  const g = t.g;
  let big = "";
  if (g) {
    const vals = [g.prev2, g.prev, g.proj].filter(v => v != null);
    const mx = Math.max(...vals, 1);
    const yrs = [g.prev2 != null ? [g.prev2, an.year - 2, ""] : null, [g.prev, an.year - 1, ""], [g.proj, an.year, an.partial ? "p" : "c"]].filter(Boolean);
    big = `<div class="big">${pct(g.chg)}<small>${esc(g.label)} · trabalhos/ano, ${an.year - 1} → ${an.year}</small></div>
      <div class="yrs" aria-hidden="true">${yrs.map(([v, y, c]) => `<div class="${c}" style="height:${Math.max(4, v / mx * 100)}%"><span>${String(y).slice(2)}${c === "p" ? "*" : ""}</span></div>`).join("")}</div>`;
  }
  return `<article class="story" data-p="${STORY_P[i % 8]}"><div class="n"><span>${i + 1} de ${n}</span></div>
    ${big}<h3>${esc(t.title)}</h3><p>${md(t.text)}</p></article>`;
}
function layoutWallet(open) {
  const w = $("#wallet"); if (!w) return;
  const cards = $$(".wcard", w), n = cards.length, peek = 58;
  const h = cards.map(c => c.offsetHeight);
  if (open) { let y = 0; cards.forEach((c, i) => { c.style.top = y + "px"; y += h[i] + 10; }); w.style.height = y - 10 + "px"; }
  else { cards.forEach((c, i) => { c.style.top = (i * peek) + "px"; }); w.style.height = ((n - 1) * peek + Math.max(...h)) + "px"; }
  w.dataset.open = open ? "1" : "";
}
function wireWallet() {
  const w = $("#wallet"); if (!w) return;
  $$(".wcard", w).forEach(c => { c.style.minHeight = "200px"; });
  layoutWallet(false);
  if (!RM) w.classList.add("deal");
  $$(".wcard", w).forEach((c, i, arr) => c.addEventListener("click", () => {
    if (!w.dataset.open && i < arr.length - 1) { layoutWallet(true); return; }
    openItem(c.dataset.id, c);
  }));
}
function wireStories() {
  const st = $("#stories"); if (!st) return;
  const s = $$(".story", st), bars = $$(".bars span", st);
  let cur = 0;
  const show = i => {
    cur = (i + s.length) % s.length;
    s.forEach((x, k) => x.classList.toggle("on", k === cur));
    bars.forEach((b, k) => { b.classList.toggle("done", k < cur); b.classList.remove("on"); });
    void bars[cur].offsetWidth;
    if (!RM) bars[cur].classList.add("on"); else bars[cur].classList.add("done");
    st.style.setProperty("--m", P(+s[cur].dataset.p));
    $("#live").textContent = `Conclusão ${cur + 1} de ${s.length}`;
  };
  bars.forEach(b => $("i", b).addEventListener("animationend", () => { if (document.body.contains(st)) show(cur + 1); }));
  $(".tap.l", st).addEventListener("click", () => show(cur - 1));
  $(".tap.r", st).addEventListener("click", () => show(cur + 1));
  st.addEventListener("pointerdown", () => st.classList.add("paused"));
  st.addEventListener("pointerup", () => st.classList.remove("paused"));
  st.addEventListener("mouseenter", () => st.classList.add("paused"));
  st.addEventListener("mouseleave", () => st.classList.remove("paused"));
  show(0);
}
function wireBars() {
  const rows = $$(".gb"); if (!rows.length) return;
  const max = Math.max(...rows.map(r => Math.max(+r.dataset.proj, +r.dataset.prev, +r.dataset.cur)), 1);
  const fill = r => { const c = +r.dataset.cur, p = Math.max(+r.dataset.proj, c), v = +r.dataset.prev;
    $(".cur", r).style.width = c / max * 100 + "%"; const pr = $(".proj", r); pr.style.left = c / max * 100 + "%"; pr.style.width = (p - c) / max * 100 + "%"; $(".prev", r).style.left = `calc(${v / max * 100}% - 1px)`; };
  if (RM || !("IntersectionObserver" in window)) { rows.forEach(fill); return; }
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { fill(e.target); io.unobserve(e.target); } }), { threshold: .4 });
  rows.forEach(r => io.observe(r));
}

/* ---------- Novidades ---------- */
const F = { day: "all", themes: new Set() };
function themeCounts() { const c = {}; V.items.forEach(i => { c[i.theme] = (c[i.theme] || 0) + 1; }); return c; }
function vNews() {
  const ds = V.digests;
  const counts = themeCounts(), mx = Math.max(1, ...Object.values(counts));
  return `<section class="hero rv"><span class="eyebrow">Novidades${ds.length ? ` · de ${dmy(ds[ds.length - 1].date)} a ${dmy(ds[0].date)}` : ""}</span>
    <h1 style="font-size:clamp(30px,8vw,52px)">${esc(cap(V.headline) || "Ainda sem digest com destaques.")}</h1></section>
  <div class="daystrip" role="group" aria-label="Escolher dia">
    <button class="day all" data-d="all" aria-pressed="true">Tudo <span class="muted">${V.items.length}</span></button>
    ${ds.map(d => { const x = dt(d.date); return `<button class="day" data-d="${d.date}" aria-pressed="false" ${d.n ? "" : "disabled"} aria-label="${WDL[x.getDay()]} ${x.getDate()}, ${d.n} ${d.n === 1 ? "item" : "itens"}"><small>${WD[x.getDay()]}</small><b>${x.getDate()}</b><span class="dots">${"<i></i>".repeat(Math.min(d.n, 4))}</span></button>`; }).join("")}
  </div>
  <div class="feedw">
    <div>
      <div class="fbar"><button class="fbtn" id="openF">${ICON.filt} Filtrar</button><span id="fchips" style="display:contents"></span></div>
      <div id="feed"></div>
    </div>
    <aside>
      ${V.trend ? `<details class="trend mat" style="--m:${P(6)}"><summary>Tendência do período ${ICON.chev}</summary><p>${md(V.trend)}</p></details>` : ""}
      ${Object.keys(counts).length ? `<div class="statement thm"><span class="eyebrow">Por subtema no período</span>${Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([k, n]) => `<button class="trow" data-k="${esc(k)}" style="${M(k)}"><span>${esc(TL(k))}</span><span class="tb"><i style="width:${n / mx * 100}%"></i></span><b>${n}</b></button>`).join("")}</div>` : ""}
    </aside>
  </div>`;
}
function renderFeed() {
  const list = V.items.filter(it => (F.day === "all" || it.digest === F.day) && (!F.themes.size || F.themes.has(it.theme)));
  const g = {}; list.forEach(it => (g[it.digest] = g[it.digest] || []).push(it));
  $("#feed").innerHTML = list.length ? Object.entries(g).sort((a, b) => b[0].localeCompare(a[0])).map(([d, its]) => { const x = dt(d); return `<div class="dayhead"><b>${cap(WDL[x.getDay()])}, ${dmy(d)}</b><span>${its.length} ${its.length > 1 ? "itens" : "item"}${PREV && PREV.digest && d > PREV.digest ? " · novos" : ""}</span></div><div class="cards">${its.map(ic).join("")}</div>`; }).join("")
    : `<div class="statement" style="margin-top:16px;text-align:center"><p class="muted">Nada com esses filtros.</p></div>`;
  $("#fchips").innerHTML = [...F.themes].map(k => `<button class="fchip" data-k="${esc(k)}" style="${M(k)}"><i></i>${esc(TL(k))}${ICON.x}</button>`).join("");
  $$(".fchip").forEach(c => c.addEventListener("click", () => { F.themes.delete(c.dataset.k); renderFeed(); }));
  $$(".day").forEach(b => b.setAttribute("aria-pressed", b.dataset.d === F.day));
  wireCards($("#feed"));
  $("#live").textContent = `${list.length} itens`;
}
function openFilters() {
  const counts = themeCounts();
  sheet(`<h3 style="font-size:24px">Filtrar novidades</h3><p class="muted" style="margin:4px 0 14px">Subtemas do digest</p>
    <div class="chips">${V.themes.map(t => `<button class="ch" data-k="${esc(t.key)}" style="${M(t.key)}" aria-pressed="${F.themes.has(t.key)}"><i></i>${esc(t.label)} <span class="muted">${counts[t.key] || 0}</span></button>`).join("")}</div>
    <div style="display:flex;gap:8px;margin-top:24px"><button class="btn sec2" id="fc" style="flex:1">Limpar</button><button class="btn" id="fo" style="flex:2">Mostrar itens</button></div>`, r => {
    $$(".ch", r).forEach(b => b.addEventListener("click", () => { const k = b.dataset.k; F.themes.has(k) ? F.themes.delete(k) : F.themes.add(k); b.setAttribute("aria-pressed", F.themes.has(k)); }));
    $("#fc", r).addEventListener("click", () => { F.themes.clear(); closeSheet(); renderFeed(); });
    $("#fo", r).addEventListener("click", () => { closeSheet(); renderFeed(); });
  });
}

/* ---------- Evolução ---------- */
const EVO = { v: 980, era: -1, timer: null };
const eraShort = l => String(l).replace(/^(\d{4}) em diante$/, "$1+").replace(/^até /, "≤");
const eraBig = l => String(l).replace(/^(\d{4}) em diante$/, "$1 →").replace(/^até (\d{4})$/, "→ $1");
function vEvo() {
  const ev = V.evo;
  if (!ev) return `<section class="hero rv"><span class="eyebrow">Evolução</span><h1 style="font-size:clamp(34px,9vw,60px)">A Evolução deste tema ainda não foi gerada.</h1></section>`;
  const N = ev.eras.length, W = 340, H = 96, padL = 6, padR = 6, base = 70, sw = (W - padL - padR) / N;
  let axis = `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true">`;
  ev.eras.forEach((e, i) => { const x0 = padL + sw * i; axis += `<rect class="seg" data-e="${i}" x="${x0}" y="${base - 50}" width="${sw - 3}" height="56" rx="8"/><text x="${x0 + 6}" y="${base + 20}">${esc(eraShort(e.label))}</text>`; });
  ev.eras.forEach((e, i) => { const ms = e.ms.slice().sort((a, b) => a.year - b.year || b.cited - a.cited); const x0 = padL + sw * i;
    ms.forEach((m, j) => { const x = x0 + 8 + (sw - 19) * (j + .5) / ms.length, r = 2.2 + Math.log10(m.cited + 1) * 1.05, y = base - 8 - Math.min(38, Math.log10(m.cited + 1) * 9.5);
      axis += `<circle class="ms" data-e="${i}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${P(tIdx(m.theme))}" stroke="var(--paper)" stroke-width="1"><title>${m.year} · ${esc(m.title)}</title></circle>`; }); });
  axis += `<line id="cursor" x1="0" x2="0" y1="${base - 54}" y2="${base + 8}" stroke="var(--hot)" stroke-width="2"/></svg>`;
  const upd = ev.generated ? ` · atualizada em ${MON[dt(ev.generated).getMonth()]} ${ev.generated.slice(0, 4)}` : "";
  return `<section class="hero rv"><span class="eyebrow">Evolução · ${N} eras · ${ev.nMs} marcos${upd}</span>
    <h1 style="font-size:clamp(34px,9vw,60px)">Como o campo chegou até aqui.</h1>
    ${ev.overview ? `<p>${md(sentences(ev.overview)[0])}</p>` : ""}</section>
  <div class="evo">
    <div class="stick">
      <section class="sec" style="margin-top:22px">
        <div class="scrub"><div class="sec-h" style="margin:0 2px 6px"><div><h2 style="font-size:17px">Arraste pela linha do tempo</h2><p>Cada ponto é um marco · altura e tamanho = citações · cada era ocupa ${N === 5 ? "um quinto" : `1/${N}`}</p></div></div>
          ${axis}
          <div class="scrub-ctl"><button class="play" id="play" aria-label="Reproduzir a linha do tempo">${ICON.play}</button><input type="range" id="yr" min="0" max="1000" value="${EVO.v}" aria-label="Ano"><span class="yearbig" id="yb"></span></div>
        </div>
        <div class="deck" id="deck">${ev.eras.map((e, i) => { const nn = e.ms.filter(m => m.isNew).length; return `
          <div class="ecard mat id1" data-i="${i}" style="--m:${P(ERA_P[i % 8])}"><div class="rng">${esc(eraBig(e.label))}</div><h3>${esc(e.title)}</h3>
            <div class="foot"><span>${e.ms.length} marcos${nn ? ` · ${nn} ${nn === 1 ? "novo" : "novos"}` : ""}</span><span class="idx">Era ${i + 1}/${N}</span></div></div>`; }).join("")}</div>
        <p class="era-sum" id="esum"></p>
      </section>
    </div>
    <div>
      <section class="sec" style="margin-top:22px"><div class="sec-h"><div><h2 id="mh">Marcos da era</h2><p>Toque para ver por que importa</p></div></div><div class="mlist" id="mlist"></div></section>
      ${ev.added.length || ev.removed.length ? `<section class="sec"><div class="sec-h"><div><h2>O que mudou este mês</h2><p>Revisão de ${dmy(ev.generated)}${yy(ev.generated)}</p></div></div>
        <div class="chg">${ev.added.map(a => `<div><i class="p">+</i><span><b>${esc(a.title)}</b> <span class="muted">(${esc(a.year)})</span></span></div>`).join("")}${ev.removed.map(a => `<div><i class="m">−</i><span class="muted">${esc(a.title)} (${esc(a.year)})</span></div>`).join("")}</div>
        ${ev.note ? `<p class="era-sum">${md(ev.note)}</p>` : ""}</section>` : ""}
    </div>
    ${ev.threads.length ? `<section class="sec" style="grid-column:1 / -1"><div class="sec-h"><div><h2>Fios por subtema</h2><p>Como cada linha de pesquisa andou</p></div></div>
      <div class="threads">${ev.threads.map(t => `<div class="thr mat" style="${M(t.theme)}"><b>${esc(TL(t.theme))}</b><p>${md(t.line)}</p></div>`).join("")}</div></section>` : ""}
  </div>`;
}
function setEvo(v) {
  const ev = V.evo, N = ev.eras.length;
  EVO.v = v;
  const f = v / 1000, i = Math.min(N - 1, Math.floor(f * N)), within = f * N - i;
  const [a, b] = ev.eras[i].range; const yr = Math.round(a + (b - a) * Math.min(1, within));
  $("#yb").textContent = yr;
  const cur = $("#cursor"); const W = 340, x = 6 + (W - 12) * f * 0.995; cur.setAttribute("x1", x); cur.setAttribute("x2", x);
  $$(".scrub .seg").forEach(s => s.classList.toggle("on", +s.dataset.e === i));
  $$(".scrub .ms").forEach(s => s.classList.toggle("off", +s.dataset.e !== i));
  $$(".ecard").forEach(c => { const k = +c.dataset.i - i;
    c.style.zIndex = 10 - Math.abs(k);
    c.style.transform = k < 0 ? `translate(-112%, 10px) rotate(-8deg)` : `translateY(${-k * 10}px) scale(${1 - k * .045})`;
    c.style.opacity = k < 0 || k > 3 ? 0 : 1;
    c.style.filter = k > 0 ? `brightness(${1 - k * .1})` : "none";
  });
  if (EVO.era !== i || !$("#mlist").children.length) {
    EVO.era = i;
    const e = ev.eras[i];
    $("#esum").textContent = sentences(e.summary).slice(0, 2).join(" ");
    $("#mh").textContent = `Marcos de ${e.label}`;
    $("#mlist").innerHTML = e.ms.slice().sort((x, y) => x.year - y.year).map(m => `<button class="mi" data-y="${m.year}" aria-expanded="false"><span class="y">${m.year}</span><span><b>${esc(m.title)}</b><span class="a">${esc(m.authors.slice(0, 2).join(", "))}${m.authors.length > 2 ? " et al." : ""} · ${nf(m.cited)} citações${m.isNew ? ' · <span style="color:var(--hot);font-weight:700">novo</span>' : ""}</span>${m.why ? `<span class="why">${esc(m.why)}${m.url ? ` <a href="${esc(safeUrl(m.url))}" target="_blank" rel="noopener" style="font-weight:650">Abrir</a>` : ""}</span>` : ""}</span></button>`).join("");
    $$("#mlist .mi").forEach(bt => bt.addEventListener("click", e2 => { if (e2.target.closest("a")) return; const o = bt.classList.toggle("open"); bt.setAttribute("aria-expanded", o); }));
  }
  let best = null, bd = 1e9; $$("#mlist .mi").forEach(bt => { const d = Math.abs(+bt.dataset.y - yr); if (d < bd) { bd = d; best = bt; } });
  $$("#mlist .mi").forEach(bt => bt.classList.toggle("near", bt === best));
}
function wireEvo() {
  const r = $("#yr"); if (!r) return;
  EVO.era = -1;
  r.addEventListener("input", () => { stopPlay(); setEvo(+r.value); });
  $("#play").addEventListener("click", () => { EVO.timer ? stopPlay() : startPlay(); });
  setEvo(EVO.v);
}
function startPlay() {
  const r = $("#yr"); let v = +r.value >= 990 ? 0 : +r.value; $("#play").innerHTML = ICON.pause; $("#play").setAttribute("aria-label", "Pausar");
  const t0 = performance.now(), v0 = v, dur = (1000 - v0) * 9;
  const step = t => { if (!EVO.timer) return; v = Math.min(1000, v0 + (t - t0) / dur * (1000 - v0)); r.value = v; setEvo(v); if (v < 1000) EVO.timer = requestAnimationFrame(step); else stopPlay(); };
  EVO.timer = requestAnimationFrame(step);
}
function stopPlay() { if (EVO.timer) cancelAnimationFrame(EVO.timer); EVO.timer = null; const p = $("#play"); if (p) { p.innerHTML = ICON.play; p.setAttribute("aria-label", "Reproduzir a linha do tempo"); } }

/* ---------- Pergunte (POST /api/ask, same request as web/app.js) ---------- */
const askState = { history: [], busy: false, pending: "", draft: "", error: "", fresh: -1 };
let PERSONA = "Especialista";
function sourcesUsed(h) {
  const used = new Set([...String(h.a).matchAll(/\[(\d{1,2})\]/g)].map(m => +m[1]));
  return (h.sources || []).filter(x => used.has(x.n)).sort((a, b) => a.n - b.n);
}
function answerHtml(h, ti, animate) {
  const cite = n => { const s = (h.sources || []).find(x => x.n === +n);
    return s ? `<button class="cit" data-t="${ti}" data-c="${n}" style="background:${kindColor(s.kind)}" aria-label="Fonte ${n}: ${esc(s.title)}">${n}</button>` : `<span class="cit nolink">${n}</span>`; };
  const withCites = s => s.replace(/\[(\d{1,2})\]/g, (_, n) => cite(n));
  let k = 0;
  const rv = () => animate && !RM ? ` class="rv" style="animation-delay:${(k++) * 0.18}s"` : "";
  const block = p => {
    const lines = p.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length && lines.every(l => /^[-*•] /.test(l))) return `<ul${rv()}>${lines.map(l => `<li>${withCites(l.slice(2))}</li>`).join("")}</ul>`;
    return lines.map(l => /^#{1,4} /.test(l) || /^<strong>[^<]+<\/strong>:?$/.test(l)
      ? `<h4${rv()}>${withCites(l.replace(/^#{1,4} /, ""))}</h4>`
      : /^[-*•] /.test(l) ? `<p${rv()}>• ${withCites(l.slice(2))}</p>` : `<p${rv()}>${withCites(l)}</p>`).join("");
  };
  return md(h.a).split(/\n{2,}/).map(block).join("");
}
const PEEK = 24, CW = 168;
function fanHtml(list, ti) {
  if (!list.length) return "";
  return `<div class="fan-wrap"><div class="fan" data-t="${ti}" style="width:${CW + (list.length - 1) * PEEK}px" aria-label="Fontes; toque para abrir o leque">${list.map((s, i) => `<button class="sc mat" data-c="${s.n}" style="--m:${kindColor(s.kind)};left:${i * PEEK}px;z-index:${list.length - i};width:${CW}px"><span class="n">${s.n}</span><b>${esc(s.title)}</b><span>${esc([s.kind, s.when ? String(s.when).slice(0, 10) : ""].filter(Boolean).join(" · "))}</span></button>`).join("")}</div></div><p class="fanhint">${list.length} ${list.length === 1 ? "fonte" : "fontes"} · toque no maço para espalhar</p>`;
}
function vAsk(params) {
  const q = params.get("q");
  if (q) { askState.draft = q; try { history.replaceState(null, "", "#/pergunte"); } catch { /* keep */ } }
  const has = askState.history.length > 0 || !!askState.pending;
  const on = fbOn();
  let body;
  if (!has) {
    const ev = V.evo, an = V.annual;
    const parts = [V.items.length ? `${V.items.length} itens recentes` : "", ev ? `${ev.nMs} marcos da Evolução` : "",
      an ? "as retrospectivas anuais" : "", V.nreg ? `${V.nreg} normas` : "", "pessoas de referência e a biblioteca de papers triados"].filter(Boolean);
    const list = parts.length > 1 ? parts.slice(0, -1).join(", ") + " e " + parts[parts.length - 1] : parts[0];
    body = `<section class="hero rv"><span class="eyebrow">Pergunte · agente com fontes numeradas</span>
      <h1 style="font-size:clamp(34px,9.5vw,60px)">O que você precisa saber hoje?</h1>
      <p>Responde a partir do arquivo deste tema (${esc(list)}), sempre com o número da fonte. Se o arquivo não cobre o assunto, diz.</p></section>
      ${on ? "" : `<div class="mocknote" style="margin-top:16px">${ICON.info}<span>As respostas só funcionam no site publicado. Nesta cópia, os exemplos mostram o que dá para perguntar.</span></div>`}
      <div class="personas" role="group" aria-label="Eu sou">${Object.keys(V.personas).map(p => `<button class="ch" data-p="${esc(p)}" aria-pressed="${p === PERSONA}">${esc(p)}</button>`).join("")}</div>
      <div class="intent-grid" id="ig"></div>`;
  } else {
    const turns = askState.history.map((h, ti) => `<section class="turn" data-turn="${ti}"><div class="q rv"><div>${esc(h.q)}</div></div>
        ${fanHtml(sourcesUsed(h), ti)}<div class="answer">${answerHtml(h, ti, ti === askState.fresh)}</div></section>`).join("");
    const pend = askState.pending ? `<section class="turn pending"><div class="q rv"><div>${esc(askState.pending)}</div></div>
        <div class="pend"><span class="typing"><i></i><i></i><i></i></span><span>Consultando o arquivo… leva uns 20 a 40 segundos.</span></div></section>` : "";
    const asked = new Set(askState.history.map(h => h.q));
    const rel = V.examples.filter(x => !x.select && !asked.has(x.q)).slice(1, 4);
    body = `<section class="hero rv" style="padding-top:8px"><span class="eyebrow">Pergunte · resposta com fontes</span></section>
      ${turns}${pend}
      ${askState.error ? `<div class="ask-err" role="alert">${esc(askState.error)}</div>` : ""}
      <div class="ask-tools"><span>${askState.history.length ? "Seguimentos usam a conversa acima." : ""}</span><button type="button" class="linkbtn" id="askReset"${askState.busy ? " disabled" : ""}>Nova conversa</button></div>
      ${!askState.pending && rel.length ? `<section class="sec" style="margin-top:22px"><div class="sec-h"><div><h2 style="font-size:19px">Continue por aqui</h2></div></div><div class="rel">${rel.map(x => `<button data-q="${esc(x.q)}"><span>${esc(x.q)}</span>${ICON.arr}</button>`).join("")}</div></section>` : ""}`;
  }
  return `<div class="askw">${body}</div>${composer(has ? "Pergunte mais…" : voice.stt ? "Escreva ou toque no microfone" : "Escreva sua pergunta", on)}`;
}
const composer = (ph, on) => `<form class="composer" id="cmp"${on ? "" : ' aria-disabled="true"'}><textarea rows="1" maxlength="600" enterkeyhint="send" placeholder="${esc(ph)}" aria-label="Sua pergunta"${on ? "" : " disabled"}></textarea><button type="button" class="cbtn" id="micB" aria-label="Falar a pergunta"${voice.stt && on ? "" : " hidden"}>${ICON.mic}</button><button class="cbtn go" aria-label="Enviar"${on && !askState.busy ? "" : " disabled"}>${ICON.send}</button></form>`;
function renderIntents() {
  const el = $("#ig"); if (!el) return;
  el.innerHTML = V.personas[PERSONA].map((x, i) => `<button class="ig mat rv" style="--m:${P(INTENT_P[i % 4] + Object.keys(V.personas).indexOf(PERSONA))};animation-delay:${i * 60}ms" data-i="${i}"><small>${esc(x.k)}</small><span>${esc(x.q)}</span></button>`).join("");
  $$(".ig", el).forEach(b => b.addEventListener("click", () => {
    const x = V.personas[PERSONA][+b.dataset.i];
    const ta = $("#cmp textarea"); if (!ta) return;
    ta.disabled = false; ta.value = x.q; askState.draft = x.q; ta.dispatchEvent(new Event("input"));
    if (!fbOn()) { ta.disabled = true; return; }
    ta.focus();
    if (x.select) { const i = x.q.indexOf(x.select); ta.setSelectionRange(i, i + x.select.length); }
  }));
  $$(".personas .ch").forEach(c => c.setAttribute("aria-pressed", c.dataset.p === PERSONA));
}
function wireAnswers() {
  $$(".fan").forEach(fanEl => {
    const n = $$(".sc", fanEl).length, hint = fanEl.parentElement.nextElementSibling;
    const spread = open => { fanEl.classList.toggle("open", open); $$(".sc", fanEl).forEach((c, i) => { c.style.left = (open ? i * (CW + 8) : i * PEEK) + "px"; });
      fanEl.style.width = (open ? n * (CW + 8) : CW + (n - 1) * PEEK) + "px";
      if (hint) hint.textContent = `${n} ${n === 1 ? "fonte" : "fontes"} · ${open ? "toque numa fonte para ver o trecho" : "toque no maço para espalhar"}`; };
    fanEl.addEventListener("click", e => { const c = e.target.closest(".sc"); if ((fanEl.classList.contains("open") || n === 1) && c) openSrc(+fanEl.dataset.t, +c.dataset.c); else spread(true); });
  });
  $$(".answer .cit[data-c]").forEach(c => c.addEventListener("click", () => openSrc(+c.dataset.t, +c.dataset.c)));
  $$(".rel button").forEach(b => b.addEventListener("click", () => { const ta = $("#cmp textarea"); if (!ta || ta.disabled) return; ta.value = b.dataset.q; ta.dispatchEvent(new Event("input")); ta.focus(); }));
  const rs = $("#askReset"); if (rs) rs.addEventListener("click", () => { askState.history = []; askState.error = ""; askState.draft = ""; askState.fresh = -1; route(); });
}
function openSrc(ti, n) {
  const h = askState.history[ti]; if (!h) return;
  const s = (h.sources || []).find(x => x.n === n); if (!s) return;
  const sents = String(h.a).split(/\n+/).flatMap(l => sentences(plain(l).replace(/^[-*•#\s]+/, ""))).filter(x => x.includes(`[${n}]`));
  const claim = sents.slice(0, 2).join(" ").replace(/\s?\[\d{1,2}\]/g, "");
  $("#shIn").innerHTML = `<div class="grab"></div><div class="sh-head mat" style="--m:${kindColor(s.kind)}"><div class="row"><span>Fonte ${n}</span><span>${esc([s.kind, s.when ? String(s.when).slice(0, 10) : ""].filter(Boolean).join(" · "))}</span></div><h3>${esc(s.title)}</h3></div>
    <div class="sh-body">${claim ? `<h4>USADA PARA AFIRMAR</h4><p style="color:var(--ink)">${esc(claim)}</p>` : ""}
    <div style="display:flex;gap:8px;margin-top:20px">${s.url ? `<a class="btn" style="flex:1" href="${esc(safeUrl(s.url))}" target="_blank" rel="noopener">Abrir a fonte ${ICON.ext}</a>` : ""}<button class="btn sec2" data-close${s.url ? "" : ' style="flex:1"'}>Fechar</button></div></div>`;
  wireClose(); showSheet();
}
function wireComposer() {
  const f = $("#cmp"); if (!f) return;
  const ta = $("textarea", f);
  const grow = () => { ta.style.height = "auto"; ta.style.height = Math.min(120, ta.scrollHeight) + "px"; };
  ta.value = askState.draft || "";
  ta.addEventListener("input", () => { askState.draft = ta.value; grow(); });
  ta.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey && matchMedia("(min-width: 760px)").matches) { e.preventDefault(); f.requestSubmit ? f.requestSubmit() : submitAsk(); } });
  $(".cbtn.go", f).addEventListener("mousedown", e => e.preventDefault());
  f.addEventListener("submit", e => { e.preventDefault(); submitAsk(); });
  $("#micB").addEventListener("click", () => listen(ta));
  grow();
  if (askState.draft && fbOn()) ta.focus();
}
async function submitAsk() {
  const ta = $("#cmp textarea");
  const q = ((ta && ta.value) || "").trim();
  if (!fbOn() || q.length < 5 || askState.busy) return;
  askState.busy = true; askState.pending = q; askState.draft = ""; askState.error = ""; askState.fresh = -1;
  if (current === "pergunte") { route(); const p = $(".turn.pending"); if (p) p.scrollIntoView({ block: "start" }); }
  try {
    const r = await fetch("/api/ask", {
      method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
      body: JSON.stringify({ topic: DATA.topic.slug, question: q, voter: voterId(), name: store.get("paw_name", "") || null,
        history: askState.history.slice(-2).map(h => ({ q: h.q, a: h.a })) }),
    });
    const out = await r.json().catch(() => ({}));
    if (!r.ok || !out.ok) throw new Error(out.error || r.status);
    askState.history.push({ q, a: out.answer || "", sources: out.sources || [] });
    askState.fresh = askState.history.length - 1;
  } catch (err) {
    askState.error = `Não foi possível responder (${err.message}).`;
    askState.draft = q;
  }
  askState.busy = false; askState.pending = "";
  if (current !== "pergunte") return;
  route();
  const turns = $$(".turn");
  if (askState.error) { const e = $(".ask-err"); if (e) e.scrollIntoView({ block: "center" }); }
  else if (turns.length) turns[turns.length - 1].scrollIntoView({ block: "start" });
}

/* ---------- voice: /api/stt behind the orb (same flow as web/app.js) ---------- */
const voice = { stt: false, rec: null };
function encodeWav(samples, rate) {
  const buf = new ArrayBuffer(44 + samples.length * 2), v = new DataView(buf);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, "RIFF"); v.setUint32(4, 36 + samples.length * 2, true); w(8, "WAVE"); w(12, "fmt ");
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, rate, true);
  v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, "data");
  v.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) { const x = Math.max(-1, Math.min(1, samples[i])); v.setInt16(44 + i * 2, x < 0 ? x * 0x8000 : x * 0x7fff, true); }
  return new Blob([buf], { type: "audio/wav" });
}
async function toWav16k(blob) {
  const Ctx = window.AudioContext || window.webkitAudioContext; const ctx = new Ctx();
  try {
    const decoded = await ctx.decodeAudioData(await blob.arrayBuffer());
    const off = new OfflineAudioContext(1, Math.ceil(decoded.duration * 16000), 16000);
    const src = off.createBufferSource(); src.buffer = decoded; src.connect(off.destination); src.start();
    return encodeWav((await off.startRendering()).getChannelData(0), 16000);
  } finally { ctx.close && ctx.close(); }
}
async function transcribe(blob) {
  let body = blob;
  try { body = await toWav16k(blob); } catch { /* webm/ogg go as recorded */ }
  const type = (body.type || "audio/webm").split(";")[0];
  const r = await fetch(`/api/stt?voter=${encodeURIComponent(voterId())}`, { method: "POST", headers: { "Content-Type": type }, body });
  const out = await r.json().catch(() => ({}));
  if (!r.ok || !out.ok) throw new Error(out.error || `HTTP ${r.status}`);
  return out.text || "";
}
const orb = $("#orb"), orbText = $("#orbText"), orbHint = $("#orbHint");
const orbOff = (ms = 0) => setTimeout(() => orb.classList.remove("on"), ms);
async function listen(ta) {
  if (voice.rec) return;
  orb.classList.add("on"); orbText.textContent = "Pode falar…"; orbHint.textContent = "Toque na bola quando terminar";
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
  catch { orbText.textContent = "Sem acesso ao microfone"; orbHint.textContent = ""; orbOff(1600); return; }
  const recorder = new MediaRecorder(stream), chunks = [];
  const rec = voice.rec = { recorder, cancel: false, timer: setTimeout(() => recorder.state === "recording" && recorder.stop(), 85000) };
  recorder.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
  recorder.onstop = async () => {
    stream.getTracks().forEach(t => t.stop()); clearTimeout(rec.timer); voice.rec = null;
    if (rec.cancel) { orbOff(); return; }
    orbText.textContent = "Transcrevendo…"; orbHint.textContent = "";
    try {
      const text = await transcribe(new Blob(chunks, { type: recorder.mimeType || "audio/webm" }));
      orbOff();
      if (text) { ta.value = (ta.value && !/\s$/.test(ta.value) ? ta.value + " " : ta.value) + text; ta.dispatchEvent(new Event("input")); ta.focus(); }
    } catch (e) { orbText.textContent = `Não deu para transcrever (${e.message}).`; orbOff(2200); }
  };
  recorder.start();
}
$("#orbBall").addEventListener("click", () => { if (voice.rec && voice.rec.recorder.state === "recording") voice.rec.recorder.stop(); });
$("#orbX").addEventListener("click", () => { if (voice.rec) { voice.rec.cancel = true; if (voice.rec.recorder.state === "recording") voice.rec.recorder.stop(); } else orbOff(); });
function probeVoice() {
  if (!/^https?:$/.test(location.protocol) || window.isSecureContext === false || DATA.offline) return;
  fetch("/api/stt", { cache: "no-store" }).then(r => (r.ok ? r.json() : {})).catch(() => ({})).then(s => {
    voice.stt = !!(s && s.enabled) && !!(navigator.mediaDevices && window.MediaRecorder);
    const b = $("#micB"); if (b && voice.stt && fbOn()) b.hidden = false;
  });
}

/* ---------- Temas (wallet of topics) ---------- */
const LAND = {};
let landLoading = false;
function loadLanding() {
  if (landLoading) return; landLoading = true;
  LAND[V.topic.slug] = V.landing;
  Promise.all(V.topics.filter(t => t.slug !== V.topic.slug).map(t =>
    fetch(`../../../${encodeURIComponent(t.slug)}/data.json`, { cache: "no-cache" })
      .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(d => { LAND[t.slug] = landingOf(d); })
      .catch(() => { LAND[t.slug] = null; })))
    .then(() => { if (current === "temas") route(); });
}
const topicHref = slug => (slug === V.topic.slug ? "#/" : `../../../${encodeURIComponent(slug)}/designs/carteira/`);
function vLanding() {
  const ts = V.topics.length ? V.topics : [{ slug: V.topic.slug, name: V.topic.name }];
  const cards = ts.map((t, i) => {
    const L = LAND[t.slug];
    const head = `<div class="hd"><span class="chip-emv" aria-hidden="true"></span><b>${esc(L ? L.brand : t.name)}</b>${L ? `<span class="new">${L.items7} na semana</span>` : ""}</div>`;
    let inner;
    if (!L) inner = `<p class="hl">${t.slug in LAND ? "Não foi possível carregar este tema agora." : "Carregando…"}</p>`;
    else {
      const m = Math.max(1, ...L.per);
      inner = `${L.headline ? `<p class="hl">${esc(L.headline.replace(/\.$/, ""))}</p>` : ""}
      <div class="sig">${L.top ? `<div><small>em alta</small><b>${pct(L.top.chg)}</b><small class="lbl" title="${esc(L.top.label)}">${esc(L.top.label.split(" / ")[0])}</small></div>` : ""}<div><small>itens</small><b>${L.total}</b><small>${L.ndig} digests</small></div><div><small>normas</small><b>${L.nreg}</b><small>monitoradas</small></div></div>
      <div class="bars" aria-hidden="true">${L.per.map(v => `<i class="${v ? "" : "z"}" style="height:${v ? Math.max(10, v / m * 100) : 6}%"></i>`).join("")}</div>`;
    }
    return `<a class="tc mat" href="${topicHref(t.slug)}" style="--m:${TOPIC_C[i % TOPIC_C.length]};z-index:${i + 1};animation-delay:${i * 140}ms" data-i="${i}">
      ${head}${inner}
      <div class="ft"><span>${L && L.era ? `Era: ${esc(L.era)}` : ""}</span><span class="go">${t.slug === V.topic.slug ? "Você está aqui" : "Abrir"} ${arr14}</span></div>
    </a>`;
  }).join("");
  const sig = ts.map(t => LAND[t.slug]).filter(L => L && L.top);
  return `<section class="hero rv"><span class="eyebrow">Research Watch · ${dmy(V.generated)}</span><h1>Sua carteira de temas.</h1><p>Cada cartão guarda a memória viva de um campo: o que saiu na semana, o que está crescendo, o que vence e o que perguntar.</p></section>
  <div class="lw" id="lw">${cards}</div>
  ${sig.length ? `<section class="sec rv"><div class="sec-h"><div><h2>O sinal mais forte de cada tema</h2><p>O subtema que mais cresce em cada campo, no OpenAlex</p></div></div>
    <div class="cross">${sig.map(L => `<div><b>${esc(L.brand)}</b>“${esc(L.top.label)}” vai de ${nf(L.top.prev)} trabalhos em ${L.year - 1} para ${nf(L.top.proj)}${L.partial ? " projetados" : ""} em ${L.year} (${pct(L.top.chg)}).</div>`).join("")}</div></section>` : ""}
  ${fbOn() ? `<section class="sec rv"><div class="statement" style="display:grid;gap:10px"><h2 style="font-size:22px">Peça o seu Watch</h2><span class="muted">Um tema novo, criado e revisado para você: fontes, subtemas, pessoas e a primeira Evolução.</span><a class="btn" href="../../#/criar" style="justify-self:start">Sugerir um tema</a></div></section>` : ""}`;
}
function layoutLanding() {
  const lw = $("#lw"); if (!lw || innerWidth >= 1000) { if (lw) lw.style.height = ""; return; }
  const cs = $$(".tc", lw); if (!cs.length) return;
  const sel = +(lw.dataset.sel ?? -1), peek = 76;
  let y = 0;
  cs.forEach((c, i) => { c.style.top = y + "px"; y += (sel === i || (sel < 0 && i === cs.length - 1)) ? c.offsetHeight + 12 : peek; });
  lw.style.height = (sel < 0 ? (cs.length - 1) * peek + cs[cs.length - 1].offsetHeight : y - 12) + "px";
}
function wireLanding() {
  const lw = $("#lw"); if (!lw) return;
  if (!RM && !lw.dataset.dealt) lw.classList.add("deal");
  $$(".tc", lw).forEach((c, i, arr) => c.addEventListener("click", e => { if (innerWidth < 1000 && +(lw.dataset.sel ?? arr.length - 1) !== i) { e.preventDefault(); lw.dataset.sel = i; layoutLanding(); } }));
  layoutLanding();
}
addEventListener("resize", () => { if (current === "temas") layoutLanding(); });

/* ---------- Mais ---------- */
function vMore() {
  const I = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true">${p}</svg>`;
  const row = (h, p, ic, t, s) => `<a href="${h}"><span class="ico" style="background:${P(p)}">${ic}</span><span><b>${t}</b><span>${s}</span></span>${arr16}</a>`;
  const ev = V.evo, an = V.annual, w = V.watch;
  const wl = [w.researchers && `${w.researchers} pesquisadores`, w.journals && `${w.journals} revistas`, w.centers && `${w.centers} centros`].filter(Boolean).join(", ");
  return `<section class="hero rv"><span class="eyebrow">Mais</span><h1 style="font-size:44px">Tudo do tema</h1></section>
  <div class="lst rv" style="margin-top:18px">
    ${ev ? row("#/evolucao", 6, I('<path d="M3 12h4l3-7 4 14 3-7h4" stroke-linejoin="round"/>'), "Evolução", `${ev.eras.length} eras e ${ev.nMs} marcos${ev.minYear ? ` desde ${ev.minYear}` : ""}`) : ""}
    ${an ? row(`../carta/#/anual/${an.year}`, 0, I('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'), `Retrospectiva ${an.year}`, `${an.trends.length} conclusões, ${an.nHighlights} destaques, ${an.nGrowth} subtemas · no Carta`) : ""}
    ${V.nreg ? row("../carta/#/regulacao", 7, I('<path d="M12 3v18M5 7h14M5 7l-2 5h4zM19 7l-2 5h4z"/>'), "Regulação", `${V.nreg} normas, com o que exigem e quando · no Carta`) : ""}
    ${wl ? row("../carta/#/pessoas", 5, I('<circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6"/>'), "Pessoas & instituições", `${wl} · no Carta`) : ""}
    ${row("#/temas", 2, I('<rect x="3" y="6" width="18" height="12" rx="3"/><path d="M3 10h18"/>'), "Todos os temas", `Sua carteira com ${Math.max(1, V.topics.length)} ${V.topics.length === 1 ? "tema" : "temas"}`)}
    ${row("../", 3, ICON.back, "Trocar de design", "Carta, clássico e os outros")}
  </div>
  <section class="sec rv"><div class="sec-h"><h2>Aparência</h2></div><div class="seg3" id="th">${[["auto","Automático"],["light","Claro"],["dark","Escuro"]].map(([k, l]) => `<button data-t="${k}" aria-pressed="${theme() === k}">${l}</button>`).join("")}</div></section>`;
}

/* ---------- theme + router ---------- */
function theme() { try { return localStorage.getItem("rw.theme") || "auto"; } catch { return "auto"; } }
function setTheme(t) {
  if (t === "auto") delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t;
  try { localStorage.setItem("rw.theme", t); } catch { /* private mode */ }
  $("#themeBtn").innerHTML = ICON[t === "auto" ? "auto" : t === "dark" ? "moon" : "sun"];
  $$("#th button").forEach(b => b.setAttribute("aria-pressed", b.dataset.t === t));
}
$("#themeBtn").addEventListener("click", () => { const o = ["auto", "light", "dark"]; setTheme(o[(o.indexOf(theme()) + 1) % 3]); });
setTheme(theme());
document.addEventListener("click", e => {
  const a = e.target.closest("[data-scroll]"); if (!a) return;
  const t = document.getElementById(a.dataset.scroll); if (!t) return;
  e.preventDefault(); t.scrollIntoView({ behavior: RM ? "auto" : "smooth", block: "start" });
});
function route() {
  const h = location.hash.replace(/^#/, "") || "/";
  if (!h.startsWith("/")) return;
  stopPlay(); closeSheet();
  const [path, qs] = h.split("?"); const params = new URLSearchParams(qs || "");
  const key = path.split("/").filter(Boolean)[0] || "inicio";
  const views = { novidades: vNews, evolucao: vEvo, pergunte: () => vAsk(params), temas: vLanding, mais: vMore };
  const k = views[key] ? key : "inicio";
  const nav = { novidades: "novidades", evolucao: "mapa", pergunte: "pergunte", mais: "mais", inicio: "inicio", temas: "mais" }[k];
  $$(".dock a").forEach(a => { if (a.dataset.nav === nav) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
  const same = current === k;
  current = k;
  document.body.dataset.route = k;
  app.innerHTML = (views[k] || vHome)();
  if (!same || k !== "pergunte") scrollTo(0, 0);
  wireCards(app);
  if (k === "inicio") { wireWallet(); wireStories(); wireBars(); }
  if (k === "novidades") { renderFeed(); $("#openF").addEventListener("click", openFilters);
    $$(".trow").forEach(b => b.addEventListener("click", () => { const kk = b.dataset.k; F.themes.has(kk) ? F.themes.delete(kk) : F.themes.add(kk); renderFeed(); }));
    const tr = $(".trend"); if (tr && innerWidth >= 1000) tr.open = true;
    $$(".day").forEach(b => b.addEventListener("click", () => { F.day = b.dataset.d; renderFeed(); })); }
  if (k === "evolucao" && V.evo) wireEvo();
  if (k === "pergunte") { wireComposer(); renderIntents(); wireAnswers(); askState.fresh = -1;
    $$(".personas .ch").forEach(c => c.addEventListener("click", () => { PERSONA = c.dataset.p; renderIntents(); })); }
  if (k === "temas") { wireLanding(); loadLanding(); }
  if (k === "mais") $$("#th button").forEach(b => b.addEventListener("click", () => setTheme(b.dataset.t)));
  if (!same) app.focus({ preventScroll: true });
}

fetch("../../data.json", { cache: "no-cache" })
  .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
  .then(d => {
    DATA = d;
    PREV = setupVisit(d);
    V = build(d, { prev: PREV });
    document.title = `Carteira · ${V.topic.brand}`;
    $("#topicName").textContent = V.topic.brand;
    $("#topicSub").textContent = `Research Watch · ${Math.max(1, V.topics.length)} ${V.topics.length === 1 ? "tema" : "temas"}`;
    $("#switch").setAttribute("aria-label", `Tema atual: ${V.topic.brand}. Ver todos os temas`);
    addEventListener("hashchange", route);
    route();
    probeVoice();
  })
  .catch(e => { app.innerHTML = `<div class="statement" style="margin-top:24px"><p>Não foi possível carregar os dados (${esc(e.message)}).</p><p><a href="../../?design=classico">Abrir o site clássico</a></p></div>`; });
})();
