/* Sinal — design port of the "Sinal" prototype onto the live data.json and the site's APIs.
   The first half (mapping) is pure and also runs under node for checks; the second half is the UI. */
(function () {
"use strict";

/* =====================================================================
   MAPPING: data.json -> the fields the prototype's views use
   ===================================================================== */
const MON = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
const WD = ["dom","seg","ter","qua","qui","sex","sáb"];
const WDL = ["domingo","segunda","terça","quarta","quinta","sexta","sábado"];
const MES = { janeiro:1, fevereiro:2, "março":3, marco:3, abril:4, maio:5, junho:6, julho:7, agosto:8, setembro:9, outubro:10, novembro:11, dezembro:12 };

const pad2 = (n) => String(n).padStart(2, "0");
const isoOf = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const dateOf = (iso) => new Date(String(iso).slice(0, 10) + "T12:00:00");
const daysBetween = (a, b) => Math.round((dateOf(b) - dateOf(a)) / 864e5);
const stripMark = (s) => String(s || "").replace(/^[^\p{L}\p{N}]+\s*/u, "").trim();
const fold = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "");
const ucFirst = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const sum = (a) => a.reduce((s, x) => s + (+x || 0), 0);

// First sentence and the rest (same rules as the main site: skips initials, "et al.", never splits **bold**).
const ABBR = new Set(["al","fig","vs","ex","sr","sra","dr","dra","p","pp","cf","no","nº","approx","aprox","inc","co","art"]);
function splitFirst(text) {
  const s = String(text || "").trim();
  const re = /[.!?](?=\s+["“'(*]*[A-ZÀ-Ý0-9])/g;
  let m;
  while ((m = re.exec(s))) {
    const head = s.slice(0, m.index + 1);
    if (head.length < 40) continue;
    if ((head.match(/\*\*/g) || []).length % 2) continue;
    const word = (s.slice(0, m.index).match(/(\S+)$/) || ["", ""])[1].replace(/^[("“*]+/, "");
    if (/^[A-Z]$/.test(word) || /^([A-Z]\.)+[A-Z]$/.test(word) || ABBR.has(word.toLowerCase())) continue;
    return [head, s.slice(m.index + 1).trim()];
  }
  return [s, ""];
}

// themes: {key: "📊 Label"} -> {key: {code (3 letters, unique), name (short), full, ci (colour index)}}
function themeMap(themes) {
  const out = {}, used = new Set();
  Object.entries(themes || {}).forEach(([k, label], i) => {
    const full = stripMark(typeof label === "string" ? label : (label && (label.full || label.name)) || k) || k;
    const words = fold(full).toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean);
    const w0 = words[0] || "", w1 = words[1] || "";
    const cands = [];
    if (w0) cands.push(w0.length >= 3 ? w0.slice(0, 3) : (w0 + w1).slice(0, 3));
    if (words.length >= 3) cands.push(words.slice(0, 3).map((w) => w[0]).join(""));
    if (w0 && w1) cands.push(w0[0] + w1.slice(0, 2));
    if (w0.length >= 4) cands.push(w0[0] + w0.slice(2, 4));
    cands.push(fold(k).toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3));
    let code = cands.find((c) => c.length === 3 && !used.has(c));
    if (!code) { const base = (cands[0] || "TM").slice(0, 2); let n = 1; while (used.has(base + n)) n++; code = base + n; }
    used.add(code);
    let name = full;
    if (name.length > 24) {
      const c = name.split(/[,:]/)[0].trim();
      if (c.length >= 3) name = c;
      if (name.length > 28) name = name.split(" & ")[0].trim();
    }
    out[k] = { code, name, full, ci: i % 12 };
  });
  return out;
}

// digests[].items (kind main, text = summary) + digests[].quick (kind quick, text = note)
function itemsOf(raw) {
  const out = [];
  for (const d of raw.digests || []) {
    for (const [kind, list] of [["main", d.items || []], ["quick", d.quick || []]]) {
      for (const it of list) {
        out.push({
          id: it.key || it.url || it.title, kind, digest: d.date,
          title: it.title || it.original_title || "", orig: it.original_title || "",
          url: it.url || "", venue: it.venue || "", date: it.date || d.date,
          authors: it.authors || [], origin: it.origin || "", score: +it.score || 0, theme: it.theme || "",
          text: kind === "main" ? (it.summary || it.note || "") : (it.note || it.summary || ""),
          watchAuthors: it.watch_authors || [], watchSource: it.watch_source || "",
          watch: !!((it.watch_authors || []).length || it.watch_journal || it.watch_source),
          cited: +it.cited_by || 0,
        });
      }
    }
  }
  out.sort((a, b) => b.digest.localeCompare(a.digest) || b.score - a.score);
  const seen = new Set();
  return out.filter((it) => (seen.has(it.id) ? false : (seen.add(it.id), true)));
}

function digestsOf(raw) {
  return (raw.digests || []).map((d) => ({
    date: d.date, from: (d.period && d.period.from) || d.date, to: (d.period && d.period.to) || d.date,
    headline: d.headline || "", trend: d.trend || "",
    n: (d.items || []).length + (d.quick || []).length, nMain: (d.items || []).length,
    cands: (d.stats && +d.stats.candidates) || 0,
  })).sort((a, b) => b.date.localeCompare(a.date));
}

function evoOf(raw) {
  const ev = raw.evolution;
  if (!ev || !Array.isArray(ev.eras) || !ev.eras.length) return null;
  const eras = ev.eras.map((e) => {
    const ms = e.milestones || [];
    return { key: e.key, label: e.label || e.key || "", title: e.title || "", summary: e.summary || "", ms, hasNew: ms.some((m) => m.new) };
  });
  const all = eras.flatMap((e) => e.ms);
  const years = all.map((m) => +m.year).filter((y) => y > 1000);
  const now = (ev.now && ev.now.summary) || "";
  const [nowFirst, nowRest] = splitFirst(now);
  return {
    generated: ev.generated || "", month: ev.month || "", overview: ev.overview || "",
    now, nowFirst, nowRest, open: (ev.now && ev.now.open_questions) || [],
    eras, all, nMs: all.length, firstYear: years.length ? Math.min(...years) : null,
    added: (ev.changes && ev.changes.added) || [], since: (ev.changes && ev.changes.since) || "",
  };
}

// "money mule / money mules" -> "Money mule"; raw boolean queries -> first words
function growthLabel(label) {
  const s = String(label || "");
  if (/\bOR\b|\bAND\b|[()"]/.test(s)) {
    const words = [...new Set(s.replace(/[()"]/g, " ").split(/\s+/).filter((w) => w && !/^(OR|AND|NOT)$/.test(w)))];
    return ucFirst(words.slice(0, 3).join(" · "));
  }
  return ucFirst(s.split(/\s+\/\s+/)[0].trim());
}

// growth s = [year-2, year-1, year-to-date], proj = full-year projection (as in the prototype's sparklines)
function annualOf(raw) {
  const A = raw.annual || {};
  const years = Object.keys(A).map(Number).filter((y) => y > 1000 && A[y]).sort((a, b) => a - b);
  if (!years.length) return null;
  const y = years[years.length - 1], a = A[y], p = A[y - 1];
  const until = a.partial && a.generated ? `${a.generated.slice(8, 10)}/${a.generated.slice(5, 7)}` : "";
  const growth = (a.growth || []).filter((g) => Number.isFinite(+g.change) && Number.isFinite(+g.cur)).map((g) => {
    const pg = p && (p.growth || []).find((x) => x.label === g.label);
    return {
      label: growthLabel(g.label), raw: g.label,
      s: [pg && Number.isFinite(+pg.prev) ? +pg.prev : null, Number.isFinite(+g.prev) ? +g.prev : null, +g.cur],
      proj: Number.isFinite(+g.cur_full_year) ? +g.cur_full_year : +g.cur, chg: +g.change,
    };
  });
  const trends = (a.trends || []).map((t) => ({ title: t.title || "", text: t.text || "", stat: trendStat(t, growth) }));
  return { year: y, partial: !!a.partial, until, overview: a.overview || "", trends, growth, highlights: a.highlights || [] };
}

// The subtopic a takeaway talks about: a growth query term that appears in the takeaway's text (earliest wins).
function trendStat(t, growth) {
  const txt = fold(`${t.title || ""} ${t.text || ""}`.toLowerCase());
  let best = null, pos = Infinity;
  for (const g of growth) {
    for (const part of String(g.raw).split(/\s*\/\s*/)) {
      const p = fold(part.toLowerCase()).trim();
      if (p.length < 4 || /\b(or|and)\b|[()"]/.test(p)) continue;
      const i = txt.indexOf(p);
      if (i >= 0 && i < pos) { best = g; pos = i; }
    }
  }
  return best;
}

// Upcoming dates written in each norm's "effective" text ("1º de janeiro de 2027", "01/12/2026"), with the clause around them.
const DATE_RE = /(\d{1,2})\s*[º°]?\s*(?:de\s+(janeiro|fevereiro|março|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s+de\s+|\/(\d{1,2})\/)(\d{4})/gi;
function deadlinesOf(regs, today, horizon = 400) {
  const out = [], seen = new Set();
  for (const r of regs || []) {
    if (r.revoked || r.cancelled || !r.effective) continue;
    const clauses = String(r.effective).split(/;\s+|\.\s+(?=[A-ZÀ-Ý])/);
    for (const clause of clauses) {
      for (const m of clause.matchAll(DATE_RE)) {
        const mo = m[2] ? MES[m[2].toLowerCase()] : +m[3], d = +m[1], y = +m[4];
        if (!(mo >= 1 && mo <= 12 && d >= 1 && d <= 31)) continue;
        const iso = `${y}-${pad2(mo)}-${pad2(d)}`;
        const n = daysBetween(today, iso);
        if (n < 0 || n > horizon) continue;
        const k = `${r.id || r.title}|${iso}`;
        if (seen.has(k)) continue;
        seen.add(k);
        let what = clause.trim().replace(/\.$/, "").replace(/^(e|E|Ou|ou)\s+/, "");
        if (what.length > 170) what = what.slice(0, 168).replace(/\s+\S*$/, "") + "…";
        out.push({ date: iso, norm: String(r.title || "").replace(/N°/, "nº"), what: ucFirst(what), theme: r.theme || "", url: r.url || "" });
      }
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6);
}

// Radar: subtopics placed by how fast they grow (rings) — derived, not an editorial call.
const RINGS = [["Em alta", "var(--adopt)", 1], ["Crescendo", "var(--trial)", 0.5], ["Moderado", "var(--assess)", 0.2], ["Estável", "var(--ink-3)", -Infinity]];
const ringOf = (chg) => RINGS.findIndex((r) => chg >= r[2]);
function radarOf(growth) {
  let list = (growth || []).slice();
  if (list.length > 16) list = list.sort((a, b) => b.proj - a.proj).slice(0, 16);
  list = list.map((g) => ({ ...g, r: ringOf(g.chg) })).sort((a, b) => a.r - b.r || b.chg - a.chg);
  const R0 = [0, 52, 92, 128], R1 = [52, 92, 128, 156], OFF = [20, 62, 8, 44]; // n === 1: a fixed spot per ring; otherwise spread, leaving the ring labels at 12 o'clock clear
  const byR = [[], [], [], []];
  list.forEach((b, i) => { b.i = i + 1; b.id = "g" + i; byR[b.r].push(b); });
  byR.forEach((arr, r) => arr.forEach((b, j) => {
    const n = arr.length;
    b.ang = n === 1 ? 60 + OFF[r] * 3 : 15 + (j + 0.5) * 330 / n + (r % 2 ? 6 : 0);
    const t = n === 1 ? 0.55 : (r === 0 ? (j % 2 ? 0.78 : 0.45) : (j % 2 ? 0.7 : 0.38));
    b.rad = R0[r] + (R1[r] - R0[r]) * t;
  }));
  return list;
}

function landingOf(raw) {
  const ds = digestsOf(raw).slice(0, 10).reverse();
  const last = ds[ds.length - 1];
  const an = annualOf(raw), ev = evoOf(raw);
  const top = an && an.growth.length ? an.growth.slice().sort((a, b) => b.chg - a.chg)[0] : null;
  const hd = digestsOf(raw).find((d) => d.headline);
  return {
    slug: (raw.topic || {}).slug, name: (raw.topic || {}).name || "", generated: raw.generated || "",
    headline: hd ? hd.headline : "", per: ds.map((d) => d.n), days: ds.map((d) => d.date), total: sum(ds.map((d) => d.n)),
    items7: last ? sum(ds.filter((d) => daysBetween(d.date, last.date) < 7).map((d) => d.n)) : 0,
    top, era: ev ? ev.eras[ev.eras.length - 1].title : "", nreg: (raw.regulation || []).length, ms: ev ? ev.nMs : 0,
  };
}

function buildModel(raw, today) {
  const regs = (raw.regulation || []).slice().sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  const annual = annualOf(raw);
  const digests = digestsOf(raw);
  return {
    slug: (raw.topic || {}).slug || "", name: (raw.topic || {}).name || "Research Watch", generated: raw.generated || "",
    topics: raw.topics || [], themes: themeMap(raw.themes), items: itemsOf(raw), digests,
    headlineDigest: digests.find((d) => d.headline) || null,
    evo: evoOf(raw), annual, regs, deadlines: deadlinesOf(regs, today),
    radar: annual ? radarOf(annual.growth) : [],
    watchlist: raw.watchlist || {}, landing: landingOf(raw), offline: !!raw.offline,
  };
}

const MAP = { themeMap, itemsOf, digestsOf, evoOf, annualOf, growthLabel, trendStat, deadlinesOf, radarOf, landingOf, buildModel, splitFirst };
if (typeof document === "undefined") { if (typeof module !== "undefined") module.exports = MAP; return; }

/* =====================================================================
   UI
   ===================================================================== */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const app = $("#app");
const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g, "$1<em>$2</em>");
const safeUrl = (u) => (/^https?:\/\//i.test(u || "") ? u : "#");
const TODAY = isoOf(new Date());
const dd = (iso) => { const [, m, d] = String(iso).slice(0, 10).split("-"); return `${d}.${m}`; };
const ddy = (iso) => { const [y, m, d] = String(iso).slice(0, 10).split("-"); return `${d}.${m}.${y}`; };
const dayDiff = (iso) => daysBetween(TODAY, iso);
const fmtPct = (c) => (c >= 0 ? "+" : "−") + Math.abs(Math.round(c * 100)) + "%";
const nf = (n) => Number(n || 0).toLocaleString("pt-BR");
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } },
};
// same key and format as web/app.js, so the per-voter limits are shared
const voterId = () => {
  let v = store.get("paw_voter", "");
  if (!v) { v = Math.random().toString(36).slice(2, 12); store.set("paw_voter", v); }
  return v;
};

let M = null;          // model built from data.json
let T = {};            // themes
let VISIT = { prev: null };
const apiOn = () => M && !M.offline && /^https?:$/.test(location.protocol);

const ICON = {
  arr: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 8h10M9 4l4 4-4 4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  ne: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" class="arr"><path d="M5 11l6-6M6 5h5v5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  chev: '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 4.5l3 3 3-3"/></svg>',
  up: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 14V8H2.5L8 2l5.5 6H11v6z" stroke-linejoin="round"/></svg>',
  down: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 2v6H2.5L8 14l5.5-6H11V2z" stroke-linejoin="round"/></svg>',
  mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" stroke-linecap="round"/></svg>',
  send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M12 19V5M6 11l6-6 6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  filt: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 4h12M4.5 8h7M7 12h2" stroke-linecap="round"/></svg>',
  info: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6.2"/><path d="M8 7.2v4M8 4.9v.1" stroke-linecap="round"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" stroke-linecap="round"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z" stroke-linejoin="round"/></svg>',
  auto: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/></svg>',
  stop: '<svg viewBox="0 0 24 24"><rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5" stroke-linecap="round"/></svg>',
};

/* ---------- small renderers ---------- */
const tc = (th) => `--tc:var(--t-${T[th] ? T[th].ci : 0})`;
const codeTag = (th) => (T[th] ? `<span class="code" style="${tc(th)}" title="${esc(T[th].full)}">${esc(T[th].code)}</span>` : "");
const ORIGIN = { arxiv: "arXiv", busca: "Busca", watchlist: "Watchlist", fonte: "Notícia ou relatório", journal: "Periódico" };

function whyOf(it) {
  const t = (it.text || "").replace(/\*\*/g, "").replace(/\*/g, "");
  if (it.kind === "quick") {
    const m = t.split(/;\s|\s—\s|: /);
    return m.length > 1 ? ucFirst(m[m.length - 1]) : t;
  }
  const ss = t.split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/);
  const k = ss.find((s) => /[Ll]ição|Para (bancos|quem|um banco|gestores|times|empresas|o RH|RH|líderes)|recado|[Ii]mplicação prática/.test(s));
  return ucFirst((k || ss[ss.length - 1] || t).replace(/^(A )?[Ll]ição( prática)?( é que|:)?\s*/, ""));
}

function spark(s, proj, w = 72, h = 24) {
  const vals = [s[0], s[1], proj];
  const max = Math.max(1, ...vals.filter((v) => v != null), s[2] || 0) * 1.08, p = 3;
  const X = (i) => p + i * (w - 2 * p) / 2, Y = (v) => h - p - (v / max) * (h - 2 * p);
  const a = s[0] != null && s[1] != null ? `M${X(0)},${Y(s[0])}L${X(1)},${Y(s[1])}` : "";
  const b = s[1] != null ? `M${X(1)},${Y(s[1])}L${X(2)},${Y(proj)}` : "";
  return `<svg class="spk" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true">${a ? `<path class="a ${RM ? "" : "draw"}" d="${a}"/>` : ""}${b ? `<path class="p" d="${b}"/>` : ""}${s[2] !== proj ? `<circle class="h" cx="${X(2)}" cy="${Y(s[2])}" r="2"/>` : ""}<circle cx="${X(2)}" cy="${Y(proj)}" r="2.6"/></svg>`;
}
function meter(score) {
  let b = ""; for (let i = 1; i <= 10; i++) b += `<i class="${i <= score ? "on" : ""}"></i>`;
  return `<span class="meter ${score >= 8 ? "hi" : ""}" aria-label="Nota ${score} de 10"><span class="bars" aria-hidden="true">${b}</span><b>${score}</b></span>`;
}
function trace(per) {
  const m = Math.max(...per, 1);
  return `<div class="trace" aria-hidden="true">${per.map((v, i) => `<i class="${v ? "" : "z"}" style="height:${v ? Math.max(8, v / m * 100) : 6}%;animation-delay:${i * 40}ms"></i>`).join("")}</div>`;
}
function shortVenue(v) {
  v = String(v || "").replace(/\s*\(.*?\)/g, "").trim();
  return v.length > 34 ? v.slice(0, 32) + "…" : v;
}
const STATUS = [["em alta", "s-hot"], ["crescendo", "s-up"], ["moderado", "s-mid"], ["estável", "s-flat"]];
const statusOf = (c) => STATUS[ringOf(c)];

/* ---------- "desde sua última visita" (own key; same session rule as the main site) ---------- */
function setupVisit() {
  const key = `sinal_visit|${M.slug}`;
  const rec = store.get(key, null);
  const snap = { ts: Date.now(), at: TODAY, digest: (M.digests[0] || {}).date || "", evo: (M.evo || {}).generated || "" };
  let prev = null;
  if (rec && rec.cur && typeof rec.cur.ts === "number") prev = Date.now() - rec.cur.ts > 3600e3 ? rec.cur : (rec.prev || null);
  store.set(key, { prev, cur: snap });
  VISIT = { prev };
}
const LAST = () => (VISIT.prev && VISIT.prev.digest) || "";
const isNew = (it) => !!LAST() && it.digest > LAST();
const cutoff = () => LAST() || (M.digests[0] ? M.digests[0].from : "");

/* ---------- radar ---------- */
function radarSVG() {
  const R = [52, 92, 128, 156];
  let s = `<svg viewBox="-172 -174 344 348" role="img" aria-label="Radar de subtemas por crescimento">`;
  for (let i = 3; i >= 0; i--) s += `<circle class="ring f${i}" r="${R[i]}"/>`;
  s += `<line class="axis" x1="-160" y1="0" x2="160" y2="0"/><line class="axis" x1="0" y1="-160" x2="0" y2="160"/>`;
  for (let a = 0; a < 360; a += 10) { const rad = (a - 90) * Math.PI / 180, l = a % 90 === 0 ? 7 : 3; s += `<line class="tick" x1="${Math.cos(rad) * 156}" y1="${Math.sin(rad) * 156}" x2="${Math.cos(rad) * (156 + l)}" y2="${Math.sin(rad) * (156 + l)}"/>`; }
  RINGS.forEach((t, i) => { s += `<text x="0" y="${-R[i] + 11}" text-anchor="middle" style="font-size:7px;paint-order:stroke;stroke:var(--surface);stroke-width:3px">${esc(t[0].toUpperCase())}</text>`; });
  s += `<defs><linearGradient id="swg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="var(--signal)" stop-opacity="0"/><stop offset="1" stop-color="var(--signal)" stop-opacity=".38"/></linearGradient></defs>`;
  const wedge = (() => { const r = 156, a1 = (-90 - 40) * Math.PI / 180, a2 = (-90) * Math.PI / 180; return `M0,0 L${Math.cos(a1) * r},${Math.sin(a1) * r} A${r},${r} 0 0 1 ${Math.cos(a2) * r},${Math.sin(a2) * r} Z`; })();
  s += `<g class="sweep"><path d="${wedge}" fill="url(#swg)"/><line x1="0" y1="0" x2="0" y2="-156" stroke="var(--signal)" stroke-width="1.5"/></g>`;
  M.radar.forEach((b) => {
    const rad = (b.ang - 90) * Math.PI / 180, x = Math.cos(rad) * b.rad, y = Math.sin(rad) * b.rad;
    const delay = ((b.ang % 360) / 360) * 2.4 * 0.88;
    s += `<g class="blip" data-b="${b.id}" tabindex="0" role="button" aria-label="${b.i}. ${esc(b.label)}, ${RINGS[b.r][0]}" style="animation-delay:${delay.toFixed(2)}s"><circle class="halo" cx="${x}" cy="${y}" r="10" stroke="${RINGS[b.r][1]}"/><circle cx="${x}" cy="${y}" r="9" fill="${RINGS[b.r][1]}"/><text x="${x}" y="${y}">${b.i}</text></g>`;
  });
  return s + `<circle r="2.5" fill="var(--ink)"/></svg>`;
}
function radarBlock() {
  const a = M.annual;
  const groups = RINGS.map((rg, ri) => {
    const its = M.radar.filter((b) => b.r === ri);
    if (!its.length) return "";
    return `<div class="rgroup"><h4 style="color:${rg[1]}"><i style="background:${rg[1]}"></i>${rg[0]} <span class="dim">· ${its.length}</span></h4>${its.map((b) => `
      <button class="ritem" data-b="${b.id}"><span class="bn" style="background:${rg[1]}">${b.i}</span><span><b>${esc(b.label)}</b><span class="w">${fmtPct(b.chg)} em ${a.year}${a.partial ? " (projetado)" : ""} · ${b.s[1] != null ? `${nf(b.s[1])} → ` : ""}${nf(b.proj)} trabalhos/ano</span><a href="#/pergunte?q=${encodeURIComponent(`O que a pesquisa recente diz sobre ${b.raw}?`)}" onclick="event.stopPropagation()">Perguntar sobre este subtema →</a></span></button>`).join("")}</div>`;
  }).join("");
  return `<div class="radar-wrap"><div class="panel radar boot" id="radar">${radarSVG()}<div class="rings-key">${RINGS.map((r) => `<span><i style="background:${r[1]}"></i>${r[0]}</span>`).join("")}</div></div>
    <div class="rlist" id="rlist">${groups}</div></div>`;
}
const radarNote = () => `<p class="lab" style="margin:10px 0 0;text-transform:none;letter-spacing:0">Anéis pelo crescimento ${M.annual.year - 1}→${M.annual.year} no OpenAlex: em alta ≥ +100%, crescendo ≥ +50%, moderado ≥ +20%, estável abaixo disso.${M.annual.partial && M.annual.until ? ` ${M.annual.year} projetado a partir da contagem até ${M.annual.until}.` : ""}</p>`;
function wireRadar(root) {
  const sel = (id, scroll) => {
    $$(".blip", root).forEach((g) => g.classList.toggle("sel", g.dataset.b === id));
    $$(".ritem", root).forEach((g) => g.classList.toggle("sel", g.dataset.b === id));
    const it = $(`.ritem[data-b="${id}"]`, root);
    if (scroll && it && innerWidth < 980) it.scrollIntoView({ behavior: RM ? "auto" : "smooth", block: "center" });
  };
  $$(".blip", root).forEach((g) => { g.addEventListener("click", () => sel(g.dataset.b, true)); g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); sel(g.dataset.b, true); } }); });
  $$(".ritem", root).forEach((g) => g.addEventListener("click", () => sel(g.dataset.b, false)));
}

/* ---------- ask examples (generic, built from the topic's own themes, like the main site) ---------- */
const ONBOARD_Q = "Estou chegando agora neste campo: quais conceitos, marcos e debates preciso conhecer primeiro, e por onde começo a ler?";
const lcFirst = (s) => (!s || /^\S{1,3}\b/.test(s) || /^\S[A-Z]/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1));
function intents() {
  const th = Object.values(T).map((t) => lcFirst(t.full));
  const t0 = th[0] || "este tema", t1 = th[1] || t0, t2 = th[2] || t0;
  const hasReg = M.regs.length > 0;
  return [
    ["Panorama", '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6"/><path d="M2 8h12M8 2c2 2 2 10 0 12M8 2c-2 2-2 10 0 12"/></svg>',
      [ONBOARD_Q, `Qual é o estado da arte em ${t0} hoje, e o que mudou nos últimos dois anos?`]],
    ["Evidência", '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 2v12M11 2v12M2 5h6M8 11h6"/></svg>',
      [`Há evidência de que as abordagens de ${t1} funcionam na prática? Com que tamanho de efeito e quais limitações?`, `Existe código aberto ou implementação disponível para os métodos de ${t2}?`]],
    ["Regulação", '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 2v12M3 5h10M3 5l-1.5 4h3zM13 5l-1.5 4h3zM5 14h6"/></svg>',
      [hasReg ? "O que a regulação exige hoje neste tema, e quais normas recentes mudaram as obrigações?" : "Quais normas, diretrizes ou exigências legais tocam este tema?"]],
    ["Para gestão", '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 13h12M4 13V8M8 13V4M12 13V6"/></svg>',
      ["Quais pesquisadores, instituições e fontes de referência vale acompanhar neste tema, e por quê?", "Monte um plano de estudo de 3 meses para eu me qualificar neste tema, com leituras do arquivo em ordem."]],
  ];
}

/* =====================================================================
   VIEWS
   ===================================================================== */
let chN = 0;
const ch = () => String(chN++).padStart(2, "0");

function vHome() {
  chN = 0;
  const cut = cutoff();
  const win = M.items.filter((it) => cut && it.digest > cut);
  const winDs = M.digests.filter((d) => cut && d.date > cut);
  const ev = M.evo, an = M.annual;
  const nMs = ev && (!VISIT.prev || !VISIT.prev.evo || ev.generated > VISIT.prev.evo) ? ev.added.length : 0;
  const soon = M.deadlines.filter((x) => dayDiff(x.date) >= 0);
  const ds = M.digests.slice(0, 10).reverse();
  const weekAgo = M.digests[0] ? M.digests[0].from : "";
  const recent = M.items.filter((it) => it.digest > weekAgo);
  const top3 = (recent.length >= 3 ? recent : M.items).slice().sort((a, b) => b.score - a.score || b.date.localeCompare(a.date)).slice(0, 3);
  const prevAt = VISIT.prev && VISIT.prev.at;
  const tile3 = soon.length
    ? `<a class="ro hot" href="#deadlines"><span class="v num">${dayDiff(soon[0].date)}<small>dias</small></span><span class="k">até o próximo prazo regulatório</span>${ICON.ne}</a>`
    : M.regs.length
      ? `<a class="ro" href="../carta/#/regulacao"><span class="v num" data-count="${M.regs.length}">0</span><span class="k">normas no acervo</span>${ICON.ne}</a>`
      : `<a class="ro" href="#/mapa"><span class="v num" data-count="${an ? an.highlights.length : 0}">0</span><span class="k">destaques de ${an ? an.year : "do ano"}</span>${ICON.ne}</a>`;
  const subsOn = an && an.growth.length;
  const dlOn = M.deadlines.length || M.regs.length;
  const ex = intents().flatMap((x) => x[2]).slice(1, 4);
  return `
  <section class="ph rv">
    <div class="lab"><span>${esc(M.name)}</span><span>·</span><span>atualizado ${ddy(M.generated)}</span></div>
    <h1>${prevAt ? `O que mudou desde ${WDL[dateOf(prevAt).getDay()]}` : "O que mudou nesta semana"}</h1>
  </section>
  <div class="home">
  <div>
    <section class="mod rv" aria-labelledby="h-since">
      <div class="mod-h"><span class="ch">${ch()}</span><h2 id="h-since">${prevAt ? "Desde sua última visita" : "Últimos 7 dias"}</h2><span class="r">${prevAt ? `${WD[dateOf(prevAt).getDay()]} ${dd(prevAt)}` : (cut ? `desde ${dd(cut)}` : "")}</span></div>
      <div class="since">
        <a class="ro" href="#/novidades"><span class="v num" data-count="${win.length}">0</span><span class="k">${win.length === 1 ? "item novo" : "itens novos"} no digest</span>${ICON.ne}</a>
        <a class="ro" href="#/mapa"><span class="v num" data-count="${nMs}">0</span><span class="k">marcos novos na Evolução</span>${ICON.ne}</a>
        ${tile3}
        <a class="ro" href="#/novidades"><span class="v num" data-count="${sum(winDs.map((d) => d.cands))}">0</span><span class="k">candidatos triados pela IA</span>${ICON.ne}</a>
      </div>
      ${ds.length ? `<div class="since-foot"><span class="lab">itens por dia · ${dd(ds[0].date)}–${dd(ds[ds.length - 1].date)}</span><span class="lab">${sum(ds.map((d) => d.n))} no período</span></div>
      <div style="margin-top:6px">${trace(ds.map((d) => d.n))}</div>` : ""}
    </section>
    ${ev ? `
    <section class="mod rv" aria-labelledby="h-state">
      <div class="mod-h"><span class="ch">${ch()}</span><h2 id="h-state">Estado do campo</h2><span class="r">Evolução${ev.month ? ` · ${MON[+ev.month.slice(5, 7) - 1]} ${ev.month.slice(0, 4)}` : ""}</span></div>
      <div class="panel state">
        <div class="era"><span class="code" style="--tc:var(--signal)">ERA ${ev.eras.length}/${ev.eras.length} · ${esc(eraShort(ev.eras[ev.eras.length - 1].label))}</span><span class="lab">${ev.nMs} marcos${ev.firstYear ? ` desde ${ev.firstYear}` : ""}</span></div>
        <h3>${esc(ev.eras[ev.eras.length - 1].title)}</h3>
        <p>${md(ev.nowFirst)}</p>
        ${ev.nowRest ? `<details><summary><span class="go">Ler a síntese completa ${ICON.chev.replace("<svg", '<svg width="12" height="12"')}</span></summary><p style="margin-top:2px">${md(ev.nowRest)}</p></details>` : ""}
        ${ev.open.length ? `<div class="lab" style="margin-top:6px">Perguntas em aberto</div>
        <div class="oq">${ev.open.map((q, i) => `<span><b>Q${i + 1}</b>${esc(q)}</span>`).join("")}</div>` : ""}
      </div>
    </section>` : ""}
    ${an && an.trends.length ? `
    <section class="mod rv" aria-labelledby="h-tk">
      <div class="mod-h"><span class="ch">${ch()}</span><h2 id="h-tk">${an.trends.length} ${an.trends.length === 1 ? "conclusão" : "conclusões"} de ${an.year}</h2><span class="r">${an.until ? `até ${an.until}` : ""}</span></div>
      <ol class="tk">${an.trends.map((t, i) => `
        <li><span class="n">${String(i + 1).padStart(2, "0")}</span><h3>${esc(t.title)}</h3>
          ${t.stat ? `<div class="st"><div class="v" style="${t.stat.chg < 0.2 ? "color:var(--ink-2)" : ""}">${fmtPct(t.stat.chg)}</div>${spark(t.stat.s, t.stat.proj, 64, 22)}<span class="k">${esc(t.stat.label.toLowerCase())}</span></div>` : ""}
          <p>${md(t.text)}</p><button class="x" aria-expanded="false">mais</button></li>`).join("")}</ol>
    </section>` : ""}
  </div>
  <div>
    ${subsOn ? `
    <section class="mod rv" aria-labelledby="h-subs">
      <div class="mod-h"><span class="ch">${ch()}</span><h2 id="h-subs">Subtemas</h2>
        <span class="r"><span class="seg" id="sortSeg" role="group" aria-label="Ordenar"><span class="ind"></span><button aria-pressed="true" data-s="chg">Δ</button><button aria-pressed="false" data-s="vol">Volume</button></span></span></div>
      <div class="subs" id="subs"></div>
      <div class="legend"><span><i></i>${an.year - 2}→${an.year - 1}</span><span><i class="dash" style="border-color:var(--signal)"></i>${an.year}${an.partial ? " projetado" : ""}</span>${an.partial && an.until ? `<span>○ até ${an.until}</span>` : ""}</div>
      <p class="lab" style="margin:8px 0 0;text-transform:none;letter-spacing:0">Trabalhos por ano no OpenAlex, por subtema monitorado.</p>
    </section>` : ""}
    ${dlOn ? `
    <section class="mod rv" id="deadlines" aria-labelledby="h-dl">
      <div class="mod-h"><span class="ch">${ch()}</span><h2 id="h-dl">Prazos regulatórios</h2><span class="r"><a href="../carta/#/regulacao">${M.regs.length} ${M.regs.length === 1 ? "norma" : "normas"} →</a></span></div>
      ${M.deadlines.length ? `<div class="panel dl">${deadlineAxis()}${M.deadlines.map((x) => { const n = dayDiff(x.date); return `
        <div class="dlrow ${n <= 30 ? "soon" : ""}"><div class="cd"><b>${n}</b><span>${n === 1 ? "dia" : "dias"}<br>${dd(x.date)}</span></div><div class="w"><span class="lab">${esc(x.norm)}</span>${esc(x.what)}</div></div>`; }).join("")}</div>
      <p class="lab" style="margin:6px 0 0;text-transform:none;letter-spacing:0">Datas futuras citadas na vigência de cada norma.</p>` : ""}
      ${M.regs.length ? `<div class="norms">${M.regs.slice(0, 2).map((r) => `
        <a class="norm" href="${esc(safeUrl(r.url))}" target="_blank" rel="noopener" style="text-decoration:none;display:block"><div class="t"><b>${esc(String(r.title || "").replace("N°", "nº"))}</b><span class="mono dim">${r.date ? ddy(r.date) : ""}</span></div><p>${esc(r.summary || r.subject || "")}</p>
        ${(r.techniques || []).length ? `<div class="req">${r.techniques.slice(0, 2).map((t) => `<span>${esc(t)}</span>`).join("")}</div>` : ""}</a>`).join("")}</div>` : ""}
    </section>` : ""}
  </div>
  ${M.radar.length ? `
  <section class="mod rv full-w" aria-labelledby="h-radar">
    <div class="mod-h"><span class="ch">${ch()}</span><h2 id="h-radar">Onde o campo cresce</h2><span class="sketch">derivado do OpenAlex</span><span class="r"><a href="#/mapa">mapa →</a></span></div>
    ${radarBlock()}
    ${radarNote()}
  </section>` : ""}
  ${top3.length ? `
  <section class="mod rv full-w" aria-labelledby="h-best">
    <div class="mod-h"><span class="ch">${ch()}</span><h2 id="h-best">Melhores da semana</h2><span class="r"><a href="#/novidades">todas →</a></span></div>
    <div class="items">${top3.map(itemCard).join("")}</div>
  </section>` : ""}
  <section class="mod rv full-w" aria-labelledby="h-ask">
    <div class="mod-h"><span class="ch">${ch()}</span><h2 id="h-ask">Pergunte ao Watch</h2><span class="r">fontes numeradas</span></div>
    <div class="panel ask-entry">
      <form class="composer" id="homeAsk"><textarea rows="1" maxlength="600" placeholder="Pergunte ao Watch…" aria-label="Sua pergunta"></textarea><span class="wave" aria-hidden="true">${waveBars()}</span><button type="button" class="mic" aria-label="Falar a pergunta" aria-pressed="false" hidden>${ICON.mic}</button><button class="send" aria-label="Enviar">${ICON.send}</button></form>
      <div class="exq">${ex.map((q) => `<button data-q="${esc(q)}">${esc(q)}</button>`).join("")}</div>
    </div>
  </section>
  </div>`;
}
const eraShort = (l) => String(l || "").replace(/\s+em diante$/, "+").replace(/^até\s+/, "≤");
const waveBars = () => Array.from({ length: 28 }, (_, i) => `<i style="animation-delay:${(i * 53 % 600)}ms"></i>`).join("");

function deadlineAxis() {
  const last = M.deadlines[M.deadlines.length - 1].date;
  const start = dateOf(TODAY);
  const end = new Date(Math.max(dateOf(last).getTime() + 30 * 864e5, start.getTime() + 90 * 864e5));
  const span = end - start;
  const pos = (d) => Math.max(0, Math.min(100, (d - start) / span * 100)).toFixed(2);
  const months = Math.round(span / (30.4 * 864e5));
  const every = months > 8 ? 2 : 1;
  let s = "";
  for (let m = new Date(start.getFullYear(), start.getMonth() + 1, 1, 12); m < end; m.setMonth(m.getMonth() + 1)) {
    const p = pos(m);
    s += `<span class="m" style="left:${p}%"></span>${(m.getMonth() % every === 0) ? `<span class="ml" style="left:${p}%">${MON[m.getMonth()]}${m.getMonth() === 0 ? " " + String(m.getFullYear()).slice(2) : ""}</span>` : ""}`;
  }
  return `<div class="dl-axis" aria-hidden="true"><span class="base"></span>${s}<span class="now" style="left:0"></span>${M.deadlines.map((x) => `<span class="pt ${dayDiff(x.date) <= 30 ? "soon" : ""}" style="left:${pos(dateOf(x.date))}%" title="${esc(x.norm)}"></span>`).join("")}</div>`;
}

function renderSubs(mode) {
  const subs = M.annual.growth.slice();
  subs.sort(mode === "vol" ? (a, b) => b.proj - a.proj : (a, b) => b.chg - a.chg);
  const el = $("#subs"); if (!el) return;
  const first = {}; $$(".sub", el).forEach((r) => { first[r.dataset.k] = r.getBoundingClientRect().top; });
  el.innerHTML = subs.slice(0, 8).map((g) => { const [st, cl] = statusOf(g.chg); return `
    <div class="sub" data-k="${esc(g.raw)}"><div class="nm">${esc(g.label)}<span class="lab"><span class="status ${cl}"${cl === "s-mid" ? ' style="color:var(--assess)"' : ""}>${st}</span> · ${nf(g.proj)} trab.</span></div>${spark(g.s, g.proj, 74, 26)}<div class="d" style="color:${g.chg >= 1 ? "var(--adopt)" : "inherit"}">${fmtPct(g.chg)}</div></div>`; }).join("");
  if (!RM) $$(".sub", el).forEach((r) => {
    const f = first[r.dataset.k]; if (f == null) return; const d = f - r.getBoundingClientRect().top; if (!d) return;
    r.style.transition = "none"; r.style.transform = `translateY(${d}px)`; requestAnimationFrame(() => { r.style.transition = ""; r.style.transform = ""; });
  });
}
function wireSeg(seg, on) {
  if (!seg) return;
  const ind = $(".ind", seg);
  const place = () => { const b = $('button[aria-pressed="true"]', seg); if (!b) return; ind.style.left = b.offsetLeft + "px"; ind.style.width = b.offsetWidth + "px"; };
  $$("button", seg).forEach((b) => b.addEventListener("click", () => { $$("button", seg).forEach((x) => x.setAttribute("aria-pressed", x === b)); place(); on(b.dataset.s); }));
  requestAnimationFrame(place); if (document.fonts) document.fonts.ready.then(place);
}
function countUp(root) {
  $$("[data-count]", root).forEach((el) => {
    const to = +el.dataset.count; if (RM || !to) { el.textContent = to; return; }
    const t0 = performance.now(), dur = 1100;
    const step = (t) => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(to * e); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
}

const votes = () => store.get("paw_votes", {});
const voteKey = (ref) => `${M.slug}|paper|${ref}`;
function itemCard(it) {
  const src = it.venue ? it.venue.replace(/\s*\(.*?\)\s*/g, " ").trim() : (ORIGIN[it.origin] || it.origin);
  const v = votes()[voteKey(it.id)];
  const au = it.authors.length > 3 ? `${it.authors.slice(0, 3).join(", ")} +${it.authors.length - 3}` : it.authors.join(", ");
  return `<article class="it" data-id="${esc(it.id)}" data-title="${esc(it.title)}">
    <div class="it-h">${codeTag(it.theme)}<span class="src">${esc(src)} · ${dd(it.date)}</span>${meter(it.score)}</div>
    <h3><a href="${esc(safeUrl(it.url))}" target="_blank" rel="noopener">${esc(it.title)}</a></h3>
    ${it.orig && it.orig !== it.title ? `<p class="orig">${esc(it.orig)}</p>` : ""}
    <p class="why"><span class="lab">por que importa</span><span>${md(whyOf(it))}</span></p>
    <div class="badges">${isNew(it) ? '<span class="bd new">novo</span>' : ""}${it.watch ? `<span class="bd watch">${esc(it.watchAuthors[0] || it.watchSource || "watchlist")}</span>` : ""}${it.origin && it.origin !== "watchlist" ? `<span class="bd">${esc(ORIGIN[it.origin] || it.origin)}</span>` : ""}${it.kind === "quick" ? '<span class="bd">nota rápida</span>' : ""}</div>
    <div class="full"><div><p>${md(it.text)}</p><div class="meta">${esc(au)}${it.cited ? ` · ${it.cited} citações` : ""}<br><a href="${esc(safeUrl(it.url))}" target="_blank" rel="noopener" style="color:var(--signal-ink)">abrir a fonte ↗</a></div></div></div>
    <div class="it-x"><button class="more" aria-expanded="false">${ICON.chev} <span>resumo completo</span></button>
      ${apiOn() ? `<span class="fb"><button aria-label="Útil" data-v="up" aria-pressed="${v === "up"}">${ICON.up}</button><button aria-label="Não útil" data-v="down" aria-pressed="${v === "down"}">${ICON.down}</button></span>` : ""}</div>
  </article>`;
}
function wireItems(root) {
  $$(".it", root).forEach((a) => {
    const b = $(".more", a);
    b.addEventListener("click", () => { const o = a.classList.toggle("open"); b.setAttribute("aria-expanded", o); $("span", b).textContent = o ? "recolher" : "resumo completo"; });
    $$(".fb button", a).forEach((f) => f.addEventListener("click", () => sendVote(a, f)));
  });
}
// 👍/👎 -> POST /api/feedback, same payload and local vote store as the main site
async function sendVote(card, btn) {
  const ref = card.dataset.id, all = votes(), k = voteKey(ref);
  const vote = all[k] === btn.dataset.v ? "none" : btn.dataset.v;
  btn.disabled = true;
  try {
    const r = await fetch("/api/feedback", {
      method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
      body: JSON.stringify({ topic: M.slug, kind: "paper", ref, title: card.dataset.title, voter: voterId(), vote, name: store.get("paw_name", "") || null }),
    });
    const out = await r.json().catch(() => ({}));
    if (!r.ok || !out.ok) throw new Error(out.error || r.status);
    if (vote === "none") delete all[k]; else all[k] = vote;
    store.set("paw_votes", all);
    $$(".fb button", card).forEach((x) => x.setAttribute("aria-pressed", x.dataset.v === vote));
    $("#live").textContent = "Obrigado!";
  } catch (e) { $("#live").textContent = `Não foi possível enviar (${e.message}).`; }
  btn.disabled = false;
}

/* ---------- novidades ---------- */
const F = { themes: new Set(), min: 6, origin: "all", per: "w" };
function vNews() {
  const g = M.headlineDigest, ds = M.digests;
  return `<section class="ph sm rv"><div class="lab"><span>Novidades</span><span>·</span><span>${ds.length ? `${dd(ds[ds.length - 1].date)}–${ddy(ds[0].date)}` : ""}</span></div>
    <h1>${esc(g ? ucFirst(g.headline) : "Sem itens novos no período")}</h1></section>
  <div class="feed">
    <aside>
      <div class="feed-head">
        <div class="seg" id="perSeg" role="group" aria-label="Período" style="align-self:start"><span class="ind"></span>${[["d", "Dia"], ["w", "Semana"], ["m", "Tudo"]].map(([k, l]) => `<button aria-pressed="${F.per === k}" data-s="${k}">${l}</button>`).join("")}</div>
        <div class="filters" id="chips"><button class="chip fbtn" id="openF">${ICON.filt} Filtros</button>${Object.entries(T).map(([k, t]) => `<button class="chip" data-th="${k}" aria-pressed="${F.themes.has(k)}" style="--tc:var(--t-${t.ci})" title="${esc(t.full)}"><span class="c"></span>${esc(t.code)}<span class="side-only" style="font-family:var(--sans);font-size:12.5px;color:var(--ink-2)">${esc(t.name)}</span></button>`).join("")}</div>
        <div class="panel trendbox side-only"><span class="lab">Nota mínima</span><input class="range" type="range" min="1" max="9" value="${F.min}" id="minR" aria-label="Nota mínima"><div class="mono dim" id="minV">≥ ${F.min}</div></div>
        ${g && g.trend ? `<details class="panel trendbox"><summary class="lab" style="cursor:pointer">Tendência do período · ${dd(g.date)}</summary><p>${md(g.trend)}</p></details>` : ""}
      </div>
    </aside>
    <div id="feed"></div>
  </div>`;
}
function feedList() {
  const latest = M.digests.find((d) => d.n) || M.digests[0];
  const from = F.per === "d" ? (latest ? latest.date : "") : F.per === "w" ? (M.digests[0] ? M.digests[0].from : "") : "";
  return M.items.filter((it) => (F.per === "d" ? it.digest === from : (!from || it.digest > from))
    && (!F.themes.size || F.themes.has(it.theme)) && it.score >= F.min && (F.origin === "all" || it.origin === F.origin));
}
function renderFeed() {
  const list = feedList();
  const days = {}; list.forEach((it) => (days[it.digest] = days[it.digest] || []).push(it));
  const el = $("#feed");
  el.innerHTML = Object.keys(days).length ? Object.entries(days).map(([d, its]) => {
    const dt = dateOf(d);
    return `<div class="daygrp"><div class="dayh"><span class="lab" style="color:var(--ink)">${WD[dt.getDay()]} ${dd(d)}${LAST() && d > LAST() ? ' <span style="color:var(--signal)">· novo</span>' : ""}</span><span class="lab">${its.length} ${its.length > 1 ? "itens" : "item"}</span></div><div class="items">${its.map(itemCard).join("")}</div></div>`;
  }).join("")
    : `<div class="panel empty">Nenhum item com esses filtros. <button class="chip" id="clr" style="margin:10px auto 0">limpar filtros</button></div>`;
  wireItems(el);
  const c = $("#clr"); if (c) c.addEventListener("click", () => { F.themes.clear(); F.min = 1; F.origin = "all"; F.per = "m"; route(); });
  $("#live").textContent = `${list.length} itens`;
}
function syncChips() {
  $$("#chips .chip[data-th]").forEach((c) => c.setAttribute("aria-pressed", F.themes.has(c.dataset.th)));
  const r = $("#minR"); if (r) { r.value = F.min; $("#minV").textContent = "≥ " + F.min; }
}
function openFilters() {
  const origins = [...new Set(M.items.map((i) => i.origin).filter(Boolean))];
  sheet(`<h3>Filtros</h3>
    <div class="grp"><span class="lab">Subtema</span><div class="chips">${Object.entries(T).map(([k, t]) => `<button class="chip" data-th="${k}" aria-pressed="${F.themes.has(k)}" style="--tc:var(--t-${t.ci})"><span class="c"></span>${esc(t.name)}</button>`).join("")}</div></div>
    <div class="grp"><span class="lab">Nota mínima · <span id="smv">${F.min}</span></span><input class="range" type="range" min="1" max="9" value="${F.min}" id="sMin"></div>
    <div class="grp"><span class="lab">Origem</span><div class="chips">${[["all", "Todas"], ...origins.map((o) => [o, ORIGIN[o] || o])].map(([k, l]) => `<button class="chip" data-o="${esc(k)}" aria-pressed="${F.origin === k}">${esc(l)}</button>`).join("")}</div></div>
    <div style="display:flex;gap:8px;margin-top:22px"><button class="btn ghost" id="sClr" style="flex:1">Limpar</button><button class="btn sig" id="sOk" style="flex:2">Ver resultados</button></div>`, (root) => {
    $$("[data-th]", root).forEach((b) => b.addEventListener("click", () => { const k = b.dataset.th; if (F.themes.has(k)) F.themes.delete(k); else F.themes.add(k); b.setAttribute("aria-pressed", F.themes.has(k)); }));
    $$("[data-o]", root).forEach((b) => b.addEventListener("click", () => { F.origin = b.dataset.o; $$("[data-o]", root).forEach((x) => x.setAttribute("aria-pressed", x === b)); }));
    $("#sMin", root).addEventListener("input", (e) => { F.min = +e.target.value; $("#smv", root).textContent = F.min; });
    $("#sClr", root).addEventListener("click", () => { F.themes.clear(); F.min = 1; F.origin = "all"; closeSheet(); syncChips(); renderFeed(); });
    $("#sOk", root).addEventListener("click", () => { closeSheet(); syncChips(); renderFeed(); });
  });
}

/* ---------- mapa ---------- */
function vMap() {
  const ev = M.evo, an = M.annual;
  return `<section class="ph rv"><div class="lab"><span>Mapa</span><span>·</span><span>${[M.radar.length ? "radar de subtemas" : "", ev ? "eras do campo" : ""].filter(Boolean).join(" · ")}</span></div><h1>Para onde vai o campo</h1>
    ${M.radar.length ? `<p class="lede">${M.radar.length} subtemas em quatro anéis, pelo crescimento de ${an.year - 1} para ${an.year} no OpenAlex. Toque num ponto para ver os números.</p>` : ""}</section>
    ${M.radar.length ? `<section class="mod rv"><div class="mod-h"><span class="ch">R1</span><h2>Radar</h2><span class="sketch">derivado do OpenAlex</span></div>${radarBlock()}${radarNote()}</section>` : ""}
    ${ev ? `<section class="mod rv"><div class="mod-h"><span class="ch">R2</span><h2>Eras do campo</h2><span class="r">${ev.eras.length} eras · ${ev.nMs} marcos</span></div>
      <div class="panel" style="padding:14px 14px 4px"><div class="tl">${ev.eras.map((e, i) => `<div class="tl-i ${i === ev.eras.length - 1 ? "hl" : ""}"><span class="y">${esc(eraShort(e.label))}</span><b>${esc(e.title)}</b><p>${md(splitFirst(e.summary)[0])}</p><span class="lab">${e.ms.length} marcos${e.hasNew ? ' · <span style="color:var(--signal)">novo marco</span>' : ""}</span></div>`).join("")}</div></div>
      <a class="go" href="../carta/#/evolucao">Ver todos os marcos no Carta →</a></section>` : ""}
    ${!M.radar.length && !ev ? `<div class="panel empty">Ainda não há retrospectiva nem Evolução para este tema.</div>` : ""}`;
}

/* ---------- pergunte (POST /api/ask, like web/app.js) ---------- */
const askState = { history: [], busy: false, pending: "", draft: "", error: "" };
function vAsk() {
  const has = askState.history.length > 0 || askState.pending;
  const ev = M.evo, an = M.annual;
  const parts = [M.regs.length ? `${M.regs.length} normas` : "", ev ? `${ev.nMs} marcos da Evolução` : "", an ? `do anual de ${an.year}` : "", M.items.length ? `${M.items.length} itens recentes` : ""].filter(Boolean);
  const lede = parts.length ? `Responde a partir de ${parts.slice(0, -1).join(", ")}${parts.length > 1 ? " e de " : ""}${parts[parts.length - 1]} do arquivo deste tema. Toda afirmação traz o número da fonte.` : "Responde a partir do arquivo deste tema, com fontes numeradas.";
  const on = apiOn();
  return `<div class="askwrap">
  <section class="ph rv"><div class="lab"><span>Pergunte</span><span>·</span><span>agente com fontes numeradas</span></div>
    <h1>${has ? "Resposta" : "Pergunte ao Watch"}</h1>
    ${has ? "" : `<p class="lede">${esc(lede)}</p>`}
    ${on ? "" : `<div class="notice">${ICON.info}<span>As respostas só funcionam no site publicado. Nesta cópia, os exemplos abaixo mostram o que dá para perguntar.</span></div>`}</section>
  ${has ? `<div id="thread">${askState.history.map(turnHtml).join("")}${askState.pending ? `<div class="qbub"><div>${esc(askState.pending)}</div></div><div class="ans"><div class="step"><span class="sp"></span>consultando o arquivo… leva uns 20 a 40 segundos</div></div>` : ""}</div>
    ${!askState.busy ? `<div style="display:flex;justify-content:flex-end"><button class="reset" id="askReset">nova conversa</button></div>` : ""}` : ""}
  ${askState.error ? `<p class="ans-err" role="status">${esc(askState.error)}</p>` : ""}
  ${has ? (askState.busy ? "" : `<section class="mod related"><div class="mod-h"><h2>Outras perguntas</h2></div>${intents().flatMap((x) => x[2]).filter((q) => !askState.history.some((h) => h.q === q)).slice(0, 3).map((x) => `<button data-q="${esc(x)}"><span>${esc(x)}</span>${ICON.arr}</button>`).join("")}</section>`)
    : `<div class="intents rv">${intents().map(([n, ic, qs]) => `<div class="intent"><h3>${ic}${esc(n)}</h3>${qs.map((x) => `<button data-q="${esc(x)}"${on ? "" : " disabled"}><span>${esc(x)}</span>${ICON.arr}</button>`).join("")}</div>`).join("")}</div>`}
  </div>
  ${on ? `<div class="dock"><form class="composer" id="askForm"><textarea rows="1" maxlength="600" enterkeyhint="send" placeholder="${has ? "Pergunte mais…" : "Escreva ou fale sua pergunta"}" aria-label="Sua pergunta"></textarea><span class="wave" aria-hidden="true">${waveBars()}</span><button type="button" class="mic" aria-label="Falar a pergunta" aria-pressed="false" hidden>${ICON.mic}</button><button class="send" aria-label="Enviar"${askState.busy ? " disabled" : ""}>${ICON.send}</button></form></div>` : ""}`;
}
// answer text -> HTML with [n] as citation buttons (same block rules as web/app.js renderAnswer)
function answerHtml(a, ti, fresh) {
  const cite = (s) => s.replace(/\[(\d{1,2})\]/g, (_, n) => `<button class="cite" data-t="${ti}" data-c="${n}" aria-label="Fonte ${n}">${n}</button>`);
  let k = 0;
  const st = () => (fresh && !RM ? ` class="rvp" style="animation-delay:${(k++) * 90}ms"` : "");
  const block = (p) => {
    const lines = p.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length && lines.every((l) => /^[-*•] /.test(l))) return `<ul${st()}>${lines.map((l) => `<li>${cite(l.slice(2))}</li>`).join("")}</ul>`;
    return lines.map((l) => (/^#{1,4} /.test(l) || /^<strong>[^<]+<\/strong>:?$/.test(l)
      ? `<h4${st()}>${cite(l.replace(/^#{1,4} /, ""))}</h4>`
      : /^[-*•] /.test(l) ? `<p${st()}>• ${cite(l.slice(2))}</p>` : `<p${st()}>${cite(l)}</p>`)).join("");
  };
  return md(a).split(/\n{2,}/).map(block).join("");
}
function usedSources(h) {
  const used = new Set([...String(h.a).matchAll(/\[(\d{1,2})\]/g)].map((m) => +m[1]));
  return h.sources.filter((x) => used.has(x.n)).sort((a, b) => a.n - b.n);
}
function turnHtml(h, ti) {
  const list = usedSources(h);
  const fresh = h.fresh; h.fresh = false;
  return `<div class="qbub"><div>${esc(h.q)}</div></div>
  <div class="ans" data-t="${ti}">
    <div class="ans-meta"><span class="lab">${plural(list.length, "fonte citada", "fontes citadas")}${h.sources.length > list.length ? ` · ${h.sources.length} consultadas` : ""}</span>${h.ms ? `<span class="lab">resposta em ${(h.ms / 1000).toFixed(1).replace(".", ",")} s</span>` : ""}</div>
    ${list.length ? `<div class="srcs">${list.map((s, i) => `<button class="sc" data-t="${ti}" data-c="${s.n}" style="animation-delay:${fresh && !RM ? i * 90 : 0}ms"><span class="n"><span>[${s.n}]</span><span>${esc(s.when ? String(s.when).slice(0, 10) : "")}</span></span><b>${esc(s.title)}</b><span>${esc(s.kind || "")}</span></button>`).join("")}</div>` : ""}
    <div class="ans-body">${answerHtml(h.a, ti, fresh)}</div>
  </div>`;
}
function wireCites(root) {
  const hl = (t, n, on) => { $$(`[data-t="${t}"][data-c="${n}"]`, root).forEach((x) => x.classList.toggle("hl", on)); };
  $$(".cite, .sc", root).forEach((c) => {
    c.addEventListener("mouseenter", () => hl(c.dataset.t, c.dataset.c, true));
    c.addEventListener("mouseleave", () => hl(c.dataset.t, c.dataset.c, false));
    c.addEventListener("click", () => openSource(+c.dataset.t, +c.dataset.c));
  });
}
function openSource(ti, n) {
  const h = askState.history[ti]; if (!h) return;
  const s = h.sources.find((x) => x.n === n) || { n, title: `Fonte ${n}` };
  const plain = String(h.a).replace(/\*\*/g, "").replace(/\n+/g, " ");
  const sent = plain.split(/(?<=[.!?])\s+/).find((x) => x.includes(`[${n}]`)) || "";
  sheet(`<span class="lab">Fonte [${n}]</span><h3 style="margin-top:6px">${esc(s.title)}</h3><p class="mono dim" style="margin:6px 0 0">${esc([s.kind, s.when].filter(Boolean).join(" · "))}</p>
    ${sent ? `<div class="panel" style="padding:12px;margin-top:14px;background:var(--sunk)"><span class="lab">usada para afirmar</span><p style="margin:6px 0 0;font-size:14.5px">${md(sent.replace(/\s?\[\d{1,2}\]/g, "").replace(/^[-*•#]+\s*/, ""))}</p></div>` : ""}
    <div style="display:flex;gap:8px;margin-top:18px">${s.url ? `<a class="btn sig" href="${esc(safeUrl(s.url))}" target="_blank" rel="noopener" style="flex:1">Abrir a fonte ↗</a>` : ""}<button class="btn ghost" id="sx"${s.url ? "" : ' style="flex:1"'}>Fechar</button></div>`, (r) => $("#sx", r).addEventListener("click", closeSheet));
}
async function ask(q) {
  q = String(q || "").trim();
  if (!apiOn() || askState.busy || q.length < 5) return;
  askState.busy = true; askState.pending = q; askState.draft = ""; askState.error = "";
  showAsk(true);
  const t0 = performance.now();
  try {
    const r = await fetch("/api/ask", {
      method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
      body: JSON.stringify({ topic: M.slug, question: q, voter: voterId(), name: store.get("paw_name", "") || null,
        history: askState.history.slice(-2).map((h) => ({ q: h.q, a: h.a })) }),
    });
    const out = await r.json().catch(() => ({}));
    if (!r.ok || !out.ok) throw new Error(out.error || r.status);
    askState.history.push({ q, a: out.answer || "", sources: out.sources || [], ms: performance.now() - t0, fresh: true });
  } catch (err) {
    askState.error = `Não foi possível responder (${err.message}).`;
    askState.draft = q;
  }
  askState.busy = false; askState.pending = "";
  if (document.body.dataset.route === "pergunte") {
    showAsk(false);
    const all = $$(".qbub", app);
    if (all.length) all[all.length - 1].scrollIntoView({ block: "start", behavior: RM ? "auto" : "smooth" });
  }
}
function showAsk(scrollPending) {
  app.innerHTML = vAsk();
  const f = $("#askForm");
  if (f) { wireComposer(f, (q) => ask(q)); $("textarea", f).value = askState.draft || ""; }
  $$("[data-q]", app).forEach((b) => b.addEventListener("click", () => ask(b.dataset.q)));
  const rs = $("#askReset"); if (rs) rs.addEventListener("click", () => { askState.history = []; askState.error = ""; askState.draft = ""; showAsk(); });
  wireCites(app);
  if (scrollPending) { const st = $(".step", app); if (st) st.scrollIntoView({ block: "center" }); }
}

/* ---------- composer + voice (/api/stt, like web/app.js) ---------- */
const voice = { stt: false, rec: null };
function wireComposer(form, onSend) {
  const ta = $("textarea", form), mic = $(".mic", form);
  const grow = () => { ta.style.height = "auto"; ta.style.height = Math.min(140, ta.scrollHeight) + "px"; };
  ta.addEventListener("input", () => { if (form.id === "askForm") askState.draft = ta.value; grow(); });
  ta.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.requestSubmit ? form.requestSubmit() : onSend(ta.value.trim()); } });
  form.addEventListener("submit", (e) => { e.preventDefault(); const v = ta.value.trim(); if (v.length >= 5) onSend(v); });
  if (mic && voice.stt) { mic.hidden = false; mic.addEventListener("click", () => toggleRec(form, ta, mic)); }
}
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
  const Ctx = window.AudioContext || window.webkitAudioContext, ctx = new Ctx();
  try {
    const dec = await ctx.decodeAudioData(await blob.arrayBuffer());
    const off = new OfflineAudioContext(1, Math.ceil(dec.duration * 16000), 16000);
    const src = off.createBufferSource(); src.buffer = dec; src.connect(off.destination); src.start();
    return encodeWav((await off.startRendering()).getChannelData(0), 16000);
  } finally { if (ctx.close) ctx.close(); }
}
async function transcribe(blob) {
  let body = blob;
  try { body = await toWav16k(blob); } catch { /* send as recorded */ }
  const type = (body.type || "audio/webm").split(";")[0];
  const r = await fetch(`/api/stt?voter=${encodeURIComponent(voterId())}`, { method: "POST", headers: { "Content-Type": type }, body });
  const out = await r.json().catch(() => ({}));
  if (!r.ok || !out.ok) throw new Error(out.error || `HTTP ${r.status}`);
  return out.text || "";
}
function setListening(form, mic, on) {
  form.classList.toggle("listening", on); mic.classList.toggle("live", on); mic.setAttribute("aria-pressed", on);
  mic.innerHTML = on ? ICON.stop : ICON.mic;
  mic.setAttribute("aria-label", on ? "Parar e transcrever" : "Falar a pergunta");
  $("#live").textContent = on ? "Ouvindo" : "";
}
async function toggleRec(form, ta, mic) {
  if (voice.rec) { voice.rec.recorder.stop(); return; }
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { mic.title = "Sem acesso ao microfone"; return; }
  const recorder = new MediaRecorder(stream), chunks = [];
  recorder.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
  recorder.onstop = async () => {
    stream.getTracks().forEach((t) => t.stop());
    clearTimeout(voice.rec && voice.rec.timer); voice.rec = null;
    setListening(form, mic, false);
    mic.classList.add("busy"); mic.disabled = true;
    try {
      const text = await transcribe(new Blob(chunks, { type: recorder.mimeType || "audio/webm" }));
      if (text) { ta.value = (ta.value && !/\s$/.test(ta.value) ? ta.value + " " : ta.value) + text; ta.dispatchEvent(new Event("input")); ta.focus(); }
    } catch (e) { mic.title = `Não deu para transcrever: ${e.message}`; }
    mic.classList.remove("busy"); mic.disabled = false;
  };
  recorder.start();
  voice.rec = { recorder, timer: setTimeout(() => recorder.state === "recording" && recorder.stop(), 85000) };
  setListening(form, mic, true);
}
function initVoice() {
  if (!/^https?:$/.test(location.protocol) || window.isSecureContext === false || !navigator.mediaDevices || !window.MediaRecorder || M.offline) return;
  fetch("/api/stt", { cache: "no-store" }).then((r) => (r.ok ? r.json() : {})).catch(() => ({})).then((s) => {
    voice.stt = !!s.enabled;
    if (voice.stt) $$("form.composer").forEach((f) => { const m = $(".mic", f); if (m && m.hidden) { m.hidden = false; m.addEventListener("click", () => toggleRec(f, $("textarea", f), m)); } });
  });
}

/* ---------- temas (landing) ---------- */
const LAND = {};
function vLanding() {
  const ts = M.topics.length ? M.topics : [{ slug: M.slug, name: M.name }];
  LAND[M.slug] = M.landing;
  return `<section class="ph rv"><div class="lab"><span>Research Watch</span><span>·</span><span>${plural(ts.length, "tema", "temas")} · atualizado ${ddy(M.generated)}</span></div>
    <h1>${ts.length === 1 ? "Um campo" : `${["", "Um", "Dois", "Três", "Quatro", "Cinco", "Seis"][ts.length] || ts.length} campos`}, um digest por dia.</h1>
    <p class="lede">Cada tema guarda a memória do estado da arte: digest diário, eras do campo, retrospectiva anual, normas, pessoas e um agente que responde com fontes.</p></section>
  <div class="chs" style="margin-top:20px" id="chs">${ts.map((t, i) => landCard(t, i)).join("")}</div>
  <section class="mod rv"><div class="panel" style="padding:16px;display:grid;gap:10px"><b style="font-size:17px">Peça o seu Watch</b><span style="color:var(--ink-2);font-size:14.5px">Sugira um tema novo; o pedido vira a montagem de fontes, subtemas, pessoas e a primeira Evolução.</span><a class="btn ghost" href="../../#/criar" style="justify-self:start">Sugerir um tema</a></div></section>`;
}
function landCard(t, i) {
  const L = LAND[t.slug];
  const href = t.slug === M.slug ? "#/" : `../../../${encodeURIComponent(t.slug)}/designs/sinal/`;
  if (!L) return `<a class="chn rv" data-slug="${esc(t.slug)}" style="animation-delay:${i * 90}ms" href="${href}"><div class="chn-h"><span class="ix">${String(i + 1).padStart(2, "0")}</span><b>${esc(t.name)}</b></div><div class="chn-b"><p class="lab">carregando…</p></div><div class="chn-f"><span></span><span class="go">abrir →</span></div></a>`;
  return `<a class="chn rv" data-slug="${esc(t.slug)}" style="animation-delay:${i * 90}ms" href="${href}"><div class="chn-h"><span class="ix">${String(i + 1).padStart(2, "0")}</span><b>${esc(L.name || t.name)}</b><span class="live"><i></i>${L.generated ? `atualizado ${dd(L.generated)}` : "ao vivo"}</span></div>
    <div class="chn-b">${L.headline ? `<p class="hl">${esc(L.headline.replace(/\.$/, ""))}</p>` : ""}
      ${L.per.length ? `<div class="chn-trace">${trace(L.per)}<span class="lab" style="text-align:right">${L.total}<br>itens</span></div>` : ""}
      <div class="chn-ro"><div><span class="lab">itens 7d</span><div class="v">${L.items7}</div></div><div><span class="lab">em alta</span><div class="v up">${L.top ? fmtPct(L.top.chg) : "–"}</div></div><div><span class="lab">normas</span><div class="v">${L.nreg}</div></div></div>
      ${L.top ? `<div class="chn-top">${spark(L.top.s, L.top.proj, 64, 22)}<span><b>${esc(L.top.label)}</b> é o subtema que mais cresce: ${L.top.s[1] != null ? `${nf(L.top.s[1])} → ` : ""}${nf(L.top.proj)} trabalhos/ano</span></div>` : ""}</div>
    <div class="chn-f"><span>${L.era ? `Era atual: ${esc(L.era)}` : ""}</span><span class="go">abrir →</span></div></a>`;
}
function loadLanding() {
  (M.topics || []).forEach((t, i) => {
    if (LAND[t.slug]) return;
    fetch(`../../../${encodeURIComponent(t.slug)}/data.json`, { cache: "no-cache" })
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then((d) => { LAND[t.slug] = landingOf(d); })
      .catch(() => { LAND[t.slug] = { name: t.name, per: [], total: 0, items7: 0, top: null, nreg: 0, era: "", headline: "", generated: "" }; })
      .then(() => { const el = $(`.chn[data-slug="${CSS.escape(t.slug)}"]`); if (el) el.outerHTML = landCard(t, i); });
  });
}

/* ---------- mais ---------- */
function vMore() {
  const row = (h, ic, t, s) => `<a href="${h}">${ic}<span><b>${t}</b><span>${s}</span></span>${ICON.arr.replace("<svg", '<svg width="14" height="14"')}</a>`;
  const I = (p) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">${p}</svg>`;
  const ev = M.evo, an = M.annual, wl = M.watchlist || {};
  const ppl = (wl.researchers || []).length, jr = (wl.journals || []).length, ce = (wl.centers || []).length;
  return `<section class="ph rv"><div class="lab"><span>Mais</span></div><h1>Tudo do tema</h1></section>
  <div class="panel more-list rv" style="margin-top:16px">
    ${ev ? row("#/mapa", I('<path d="M3 12h4l3-7 4 14 3-7h4" stroke-linejoin="round"/>'), "Evolução", `${ev.eras.length} eras, ${ev.nMs} marcos${ev.firstYear ? ` desde ${ev.firstYear}` : ""}`) : ""}
    ${an ? row(`../carta/#/anual/${an.year}`, I('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'), `Retrospectiva ${an.year}`, `${plural(an.trends.length, "conclusão", "conclusões")}, ${plural(an.highlights.length, "destaque", "destaques")}, ${an.growth.length} subtemas · no Carta`) : ""}
    ${M.regs.length ? row("../carta/#/regulacao", I('<path d="M12 3v18M5 7h14M5 7l-2 5h4zM19 7l-2 5h4z"/>'), "Regulação", `${M.regs.length} normas e padrões, com o que exigem · no Carta`) : ""}
    ${ppl || jr || ce ? row("../carta/#/pessoas", I('<circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6M16 4.5a3.5 3.5 0 0 1 0 7M18 14c2 .8 3 2.8 3 6"/>'), "Pessoas & instituições", `${[ppl ? `${ppl} pesquisadores` : "", jr ? `${jr} revistas` : "", ce ? `${ce} centros` : ""].filter(Boolean).join(", ")} · no Carta`) : ""}
    ${row("#/temas", I('<rect x="3" y="4" width="7" height="7"/><rect x="14" y="4" width="7" height="7"/><rect x="3" y="15" width="7" height="5"/><rect x="14" y="15" width="7" height="5"/>'), "Todos os temas", M.topics.map((t) => t.name).join(", "))}
    ${row("../", I('<path d="M20 12H5M11 6l-6 6 6 6" stroke-linecap="round" stroke-linejoin="round"/>'), "Trocar de design", "Carta, clássico e os outros")}
  </div>
  <section class="mod rv"><div class="mod-h"><h2>Aparência</h2></div><span class="seg" id="thSeg"><span class="ind"></span><button data-s="auto" aria-pressed="${theme() === "auto"}">Automático</button><button data-s="light" aria-pressed="${theme() === "light"}">Claro</button><button data-s="dark" aria-pressed="${theme() === "dark"}">Escuro</button></span></section>`;
}

/* ---------- busca (local, over the loaded data) ---------- */
function searchDocs() {
  const out = [];
  M.items.forEach((it) => out.push({ k: it.kind === "quick" ? "nota rápida" : "digest", t: it.title, u: it.url, w: it.digest, x: `${it.title} ${it.orig} ${it.text} ${it.authors.join(" ")}` }));
  if (M.evo) M.evo.all.forEach((m) => out.push({ k: "marco", t: m.title, u: m.url, w: String(m.year || ""), x: `${m.title} ${m.why || ""} ${(m.authors || []).join(" ")}` }));
  if (M.annual) M.annual.highlights.forEach((h) => out.push({ k: `destaque ${M.annual.year}`, t: h.title, u: h.url, w: h.date, x: `${h.title} ${h.original_title || ""} ${h.why || ""}` }));
  M.regs.forEach((r) => out.push({ k: "norma", t: r.title, u: r.url, w: r.date, x: `${r.title} ${r.subject || ""} ${r.summary || ""} ${(r.techniques || []).join(" ")}` }));
  return out.map((d) => ({ ...d, f: fold(d.x.toLowerCase()) }));
}
let DOCS = null;
function openSearch() {
  DOCS = DOCS || searchDocs();
  sheet(`<h3>Buscar no tema</h3><label class="sr-in">${ICON.search}<input id="srQ" type="search" placeholder="papers, marcos, normas…" aria-label="Buscar" autocomplete="off"></label><div class="sr-res" id="srR"></div>
    <p class="lab" style="margin-top:12px;text-transform:none;letter-spacing:0">${DOCS.length} documentos deste tema.</p>`, (root) => {
    const q = $("#srQ", root), res = $("#srR", root);
    q.addEventListener("input", () => {
      const terms = fold(q.value.toLowerCase()).split(/\s+/).filter((w) => w.length > 1);
      if (!terms.length) { res.innerHTML = ""; return; }
      const hits = DOCS.filter((d) => terms.every((t) => d.f.includes(t))).slice(0, 20);
      res.innerHTML = hits.length ? hits.map((d) => `<a href="${esc(safeUrl(d.u))}" target="_blank" rel="noopener"><b>${esc(d.t)}</b><span>${esc(d.k)}${d.w ? ` · ${esc(String(d.w).slice(0, 10))}` : ""}</span></a>`).join("")
        : `<div class="empty" style="background:var(--surface)">Nada encontrado.</div>`;
    });
    setTimeout(() => q.focus(), 50);
  });
}

/* ---------- sheet ---------- */
const sh = $("#sheet");
function sheet(html, wire) { $("#sheetIn").innerHTML = `<div class="grab"></div>` + html; if (wire) wire($("#sheetIn")); if (!sh.open) { try { sh.showModal(); } catch { sh.setAttribute("open", ""); } } }
function closeSheet() { try { sh.close(); } catch { sh.removeAttribute("open"); } }
sh.addEventListener("click", (e) => { if (e.target === sh) closeSheet(); });

/* ---------- theme (light / dark / auto) ---------- */
function theme() { try { return localStorage.getItem("rw.theme") || "auto"; } catch { return "auto"; } }
function setTheme(t) {
  if (t === "auto") delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t;
  try { localStorage.setItem("rw.theme", t); } catch { /* private mode */ }
  $("#themeBtn").innerHTML = ICON[t === "auto" ? "auto" : t === "dark" ? "moon" : "sun"];
}
$("#themeBtn").addEventListener("click", () => { const o = ["auto", "light", "dark"]; setTheme(o[(o.indexOf(theme()) + 1) % 3]); });

/* ---------- router ---------- */
function route() {
  if (!M) return;
  const h = location.hash.replace(/^#/, "") || "/";
  if (!h.startsWith("/")) return; // in-page anchor (#deadlines)
  const [path, qs] = h.split("?"); const params = new URLSearchParams(qs || "");
  const key = path.split("/").filter(Boolean)[0] || "inicio";
  const nav = { novidades: "novidades", mapa: "mapa", pergunte: "pergunte", mais: "mais", temas: "", inicio: "inicio" }[key];
  $$(".nav a").forEach((a) => { if (a.dataset.nav === nav) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
  document.body.dataset.route = key;
  if (sh.open) closeSheet();
  if (key === "pergunte") {
    const q = params.get("q");
    if (q) { try { history.replaceState(null, "", "#/pergunte"); } catch { /* ok */ } }
    showAsk();
    scrollTo(0, 0);
    if (q) { if (apiOn()) ask(q); else { askState.draft = q; const ta = $("#askForm textarea"); if (ta) ta.value = q; } }
    app.focus({ preventScroll: true });
    return;
  }
  let html;
  switch (key) {
    case "novidades": html = vNews(); break;
    case "mapa": html = vMap(); break;
    case "temas": html = vLanding(); break;
    case "mais": html = vMore(); break;
    default: html = vHome();
  }
  app.innerHTML = html;
  scrollTo(0, 0);
  countUp(app);
  if ($("#radar")) wireRadar(app);
  wireItems(app);
  $$(".tk .x", app).forEach((b) => b.addEventListener("click", () => { const li = b.closest("li"); const o = li.classList.toggle("open"); b.textContent = o ? "menos" : "mais"; b.setAttribute("aria-expanded", o); }));
  if ($("#subs")) { renderSubs("chg"); wireSeg($("#sortSeg"), renderSubs); }
  if (key === "novidades") {
    renderFeed();
    wireSeg($("#perSeg"), (v) => { F.per = v; renderFeed(); });
    $$("#chips .chip[data-th]").forEach((c) => c.addEventListener("click", () => { const k = c.dataset.th; if (F.themes.has(k)) F.themes.delete(k); else F.themes.add(k); syncChips(); renderFeed(); }));
    $("#openF").addEventListener("click", openFilters);
    const r = $("#minR"); if (r) r.addEventListener("input", (e) => { F.min = +e.target.value; $("#minV").textContent = "≥ " + F.min; renderFeed(); });
  }
  if (key === "temas") loadLanding();
  if (key === "mais") wireSeg($("#thSeg"), setTheme);
  const ha = $("#homeAsk");
  if (ha) {
    wireComposer(ha, (q) => { location.hash = "#/pergunte?q=" + encodeURIComponent(q); });
    $$(".exq [data-q]", app).forEach((b) => b.addEventListener("click", () => { location.hash = "#/pergunte?q=" + encodeURIComponent(b.dataset.q); }));
  }
  app.focus({ preventScroll: true });
}

setTheme(theme());
$("#searchBtn").addEventListener("click", () => { if (M) openSearch(); });
fetch("../../data.json", { cache: "no-cache" })
  .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
  .then((raw) => {
    M = buildModel(raw, TODAY);
    T = M.themes;
    document.title = `${M.name} · Sinal`;
    $("#topicName").textContent = M.name;
    $("#topicPill").setAttribute("aria-label", `Tema atual: ${M.name}. Trocar tema`);
    setupVisit();
    addEventListener("hashchange", route);
    route();
    initVoice();
  })
  .catch((e) => { app.innerHTML = `<div class="panel empty" style="margin-top:40px">Não foi possível carregar os dados (${esc(e.message)}).</div>`; });
})();
