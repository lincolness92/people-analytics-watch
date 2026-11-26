/* Grifo: the Watch as an annotated reading.
   Live port of the "Grifo" prototype. Reads ../../data.json (written by render.py for each topic)
   and maps it onto the shapes the prototype views were drawn for. The mapping layer (Grifo.model)
   is pure, so it can be run in node against any topic's data.json. */
const Grifo = (() => {
  "use strict";
  const MES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  /* **bold** in the summaries marks the key figure: Grifo draws it as a highlighter stroke */
  const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<span class="k">$1</span>').replace(/\*(.+?)\*/g, "<em>$1</em>");
  const isIso = (s) => /^\d{4}-\d{2}-\d{2}/.test(String(s || ""));
  const dt = (iso) => new Date(String(iso).slice(0, 10) + "T12:00:00");
  const fmtD = (iso) => { if (!isIso(iso)) return String(iso || ""); const d = dt(iso); return `${d.getDate()} ${MES[d.getMonth()]}`; };
  const fmtDY = (iso) => { if (!isIso(iso)) return String(iso || ""); const d = dt(iso); return `${d.getDate()} ${MES[d.getMonth()]} ${d.getFullYear()}`; };
  const fmtDM = (iso) => { const d = dt(iso); return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`; };
  const fmtN = (n) => Number(n || 0).toLocaleString("pt-BR");
  const days = (a, b) => Math.round((dt(b) - dt(a)) / 864e5);
  const pct = (ch) => (ch == null ? "—" : (ch >= 0 ? "+" : "−") + Math.round(Math.abs(ch) * 100) + "%");
  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  const todayIso = () => { const t = new Date(); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`; };
  const stripMark = (s) => String(s || "").replace(/^[^\p{L}\p{N}]+\s*/u, "");
  const NUM_F = ["nenhuma", "uma", "duas", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez"];
  const NUM_M = ["nenhum", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez"];
  const nw = (n, fem) => (n >= 0 && n <= 10 ? (fem ? NUM_F : NUM_M)[n] : String(n));
  const safeUrl = (u) => (/^https?:\/\//i.test(u || "") ? u : "#");

  /* sentence splitting, same rules as web/app.js splitFirst (skips initials, "et al.", never inside **bold**) */
  const ABBR = new Set(["al", "fig", "vs", "ex", "sr", "sra", "dr", "dra", "p", "pp", "cf", "no", "nº", "approx", "aprox", "inc", "co", "art", "res"]);
  function cuts(s) {
    const out = [], re = /[.!?](?=\s+["“'(*]*[A-ZÀ-Ý0-9])/g;
    let m;
    while ((m = re.exec(s))) {
      const head = s.slice(0, m.index + 1);
      if ((head.match(/\*\*/g) || []).length % 2) continue;
      const word = (s.slice(0, m.index).match(/(\S+)$/) || ["", ""])[1].replace(/^[("“*]+/, "");
      if (/^[A-Z]$/.test(word) || /^([A-Z]\.)+[A-Z]$/.test(word) || ABBR.has(word.toLowerCase())) continue;
      out.push(m.index + 1);
    }
    return out;
  }
  function splitFirst(text) {
    const s = String(text || "").trim();
    const i = cuts(s).find((c) => c >= 40);
    return i ? [s.slice(0, i), s.slice(i).trim()] : [s, ""];
  }
  /* a full item's summary ends with the practical lesson: Grifo shows it as "→ why", the rest folds away */
  function splitLast(text) {
    const s = String(text || "").trim();
    const c = cuts(s).filter((i) => i >= 40 && s.length - i >= 40);
    if (!c.length) return ["", s];
    const i = c[c.length - 1];
    return [s.slice(0, i), s.slice(i).trim()];
  }

  /* ---------- subtopic growth (annual[Y].growth) ---------- */
  function seriesName(g) {
    let l = String(g.label || "");
    if (/\b(OR|AND)\b|[()"]/.test(l)) {
      /* label is a raw query: name it by the first term of its first two groups */
      const groups = String(g.query || l).split(/\s+AND\s+/).map((x) => x.replace(/[()"]/g, "").split(/\s+OR\s+/)[0].trim()).filter(Boolean);
      l = groups.slice(0, 2).join(" + ");
    } else {
      const [a, b] = l.split(" / ");
      if (b && (b.toLowerCase().startsWith(a.toLowerCase()) || a.toLowerCase().startsWith(b.toLowerCase()))) l = a;
    }
    return cap(l);
  }
  function buildAnnual(annual) {
    const ys = Object.keys(annual || {}).sort();
    if (!ys.length) return null;
    const Y = ys[ys.length - 1], cur = annual[Y], prev = ys.length > 1 ? annual[ys[ys.length - 2]] : null;
    const series = (cur.growth || []).filter((g) => g.change != null).map((g) => {
      const p = prev && (prev.growth || []).find((x) => x.label === g.label);
      const y2 = g.cur_full_year != null ? g.cur_full_year : g.cur;
      return { l: g.label, q: g.query || "", name: seriesName(g), y0: p ? p.prev : null, y1: g.prev, y2, ytd: g.cur,
        ch: g.change, chPrev: p && p.change != null ? p.change : null, years: [+Y - 2, +Y - 1, +Y] };
    });
    return {
      year: +Y, partial: !!cur.partial, until: cur.partial && cur.generated ? fmtDM(cur.generated) : "",
      prevYear: prev ? +ys[ys.length - 2] : null, overview: cur.overview || "", trends: cur.trends || [],
      works: (cur.geography || {}).works || (cur.stats || {}).works || 0, series,
    };
  }
  /* which subtopic a trend paragraph talks about: its label in the text, else its "de X para Y" counts,
     else a unique "+N%" figure. No match: the card goes without a chart. */
  function matchSeries(text, list, used) {
    const t = String(text || "").toLowerCase(), pool = list.filter((s) => !used.has(s.l));
    let best = null, bi = Infinity;
    pool.forEach((s) => [s.l.replace(/\s*\/\s*/g, "/"), s.l].forEach((f) => { const i = t.indexOf(f.toLowerCase()); if (i >= 0 && i < bi) { bi = i; best = s; } }));
    if (best) return best;
    const num = (x) => +x.replace(/\./g, "").replace(",", ".");
    for (const m of String(text).matchAll(/de\s+(\d[\d.]*)\s+para\s+(\d[\d.]*)/g)) {
      const a = num(m[1]), b = num(m[2]);
      const s = pool.find((x) => x.y1 === a && (x.y2 === b || x.ytd === b));
      if (s) return s;
    }
    for (const m of String(text).matchAll(/\+(\d+)%/g)) {
      const c = pool.filter((x) => Math.round(x.ch * 100) === +m[1]);
      if (c.length === 1) return c[0];
    }
    return null;
  }

  /* ---------- deadlines read from each norm's "effective" text ---------- */
  const MONTHS = { janeiro: 1, fevereiro: 2, "março": 3, marco: 3, abril: 4, maio: 5, junho: 6, julho: 7, agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12 };
  const iso3 = (y, m, d) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  function datesIn(c) {
    const out = [];
    for (const m of c.matchAll(/(\d{1,2})º?\s+de\s+(janeiro|fevereiro|março|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s+de\s+(\d{4})/gi))
      out.push({ iso: iso3(m[3], MONTHS[m[2].toLowerCase()], m[1]), idx: m.index });
    for (const m of c.matchAll(/(\d{1,2})º?\/(\d{1,2})\/(\d{4})/g))
      if (+m[2] >= 1 && +m[2] <= 12 && +m[1] >= 1 && +m[1] <= 31) out.push({ iso: iso3(m[3], m[2], m[1]), idx: m.index });
    return out;
  }
  /* the words of the effective text that go with one date: the whole clause when short, else its lead-in
     (before ":") plus the stretch around the date */
  function around(c, idx) {
    let l = c.trim();
    if (l.length > 120) {
      const colon = c.lastIndexOf(": ", idx), comma = c.lastIndexOf(", ", idx);
      const st = Math.max(0, colon >= 0 ? colon + 2 : 0, comma >= 0 ? comma + 2 : 0);
      const ends = [", ", " (", ";"].map((x) => c.indexOf(x, idx + 6)).filter((x) => x > 0);
      const seg = c.slice(st, ends.length ? Math.min(...ends) : c.length).trim().replace(/^e\s+/i, "");
      l = (colon > 0 && colon < st ? c.slice(0, colon).trim() + ": " : "") + seg;
    }
    l = l.replace(/^e\s+/i, "").replace(/[.\s]+$/, "");
    return l.length > 150 ? l.slice(0, 148).replace(/\s+\S*$/, "") + "…" : l;
  }
  function regDeadlines(r) {
    const eff = String(r.effective || "");
    if (!eff || r.revoked || r.cancelled) return [];
    const out = [], seen = new Set();
    eff.split(/;\s+|\.\s+(?=[A-ZÀ-Ý])/).forEach((c) => {
      if (/revog|texto original|reda[çc]/i.test(c)) return;
      datesIn(c).forEach((d) => {
        const before = c.slice(Math.max(0, d.idx - 26), d.idx);
        if (/publica\w*\s*[(,]?\s*$|publicada em\s*$/i.test(before)) return;
        if (r.date && d.iso <= r.date.slice(0, 10)) return;
        if (seen.has(d.iso)) return;
        seen.add(d.iso);
        out.push({ d: d.iso, l: cap(around(c, d.idx)) });
      });
    });
    return out;
  }

  /* ---------- the whole model ---------- */
  function model(data, today) {
    today = today || todayIso();
    const topic = data.topic || {}, brand = topic.brand || {};
    const themeKeys = Object.keys(data.themes || {});
    const TH = {}, TS = {}, TC = {};
    themeKeys.forEach((k, i) => {
      const full = stripMark(data.themes[k]);
      const cutAt = [": ", " & "].map((x) => full.indexOf(x)).filter((x) => x >= 6);
      TH[k] = full; TS[k] = cutAt.length ? full.slice(0, Math.min(...cutAt)) : full; TC[k] = "tc" + (i % 12);
    });
    const th = (k) => TH[k] || k, ts = (k) => TS[k] || k, tc = (k) => TC[k] || "tc7";

    const digests = (data.digests || []).map((d) => ({
      date: d.date, from: (d.period || {}).from || d.date, to: (d.period || {}).to || d.date,
      headline: d.headline || "", trend: d.trend || "", c: (d.stats || {}).candidates || 0,
      s: (d.items || []).length, q: (d.quick || []).length,
    }));
    const triage = digests.slice().sort((a, b) => (a.date < b.date ? -1 : 1));
    const toItem = (it, dg, kind) => {
      const [sum, why] = kind === "full" ? splitLast(it.summary) : ["", it.note || it.summary || ""];
      return { k: it.key || it.url || it.title, t: it.title || it.original_title || "", ot: it.original_title && it.original_title !== it.title ? it.original_title : "",
        u: safeUrl(it.url), v: it.venue || "", d: it.date || dg, au: it.authors || [], s: it.score || 0, th: it.theme || "", o: it.origin || "",
        wa: it.watch_authors || [], dg, kind, sum, why };
    };
    const items = [];
    (data.digests || []).forEach((d) => {
      (d.items || []).forEach((it) => items.push(toItem(it, d.date, "full")));
      (d.quick || []).forEach((it) => items.push(toItem(it, d.date, "quick")));
    });

    const ev = data.evolution && (data.evolution.eras || []).length ? data.evolution : null;
    let evolution = null;
    if (ev) {
      const curYear = +String(ev.generated || today).slice(0, 4);
      const eras = ev.eras.map((e) => {
        const ms = (e.milestones || []).map((m) => ({ id: String(m.id || m.url || m.title), t: m.title || "", y: +m.year || 0, v: m.venue || "", au: m.authors || [],
          c: m.cited_by || 0, th: m.theme || "", s: m.score || 0, why: m.why || "", new: !!m.new, u: safeUrl(m.url) }));
        const yrs = ms.map((m) => m.y).filter(Boolean), nums = (String(e.label || "").match(/\d{4}/g) || []).map(Number);
        const lo = yrs.length ? Math.min(...yrs) : null, hi = yrs.length ? Math.max(...yrs) : null;
        let a, b;
        if (nums.length >= 2) { a = nums[0]; b = nums[1]; }
        else if (/até/i.test(e.label) && nums.length) { b = nums[0]; a = lo != null && lo < b ? lo : b - 5; }
        else if (nums.length) { a = nums[0]; b = Math.max(curYear, hi || a); }
        else { a = lo || curYear; b = hi || curYear; }
        if (b <= a) b = a + 1;
        return { key: e.key, label: e.label || "", title: e.title || "", summary: e.summary || "", ms, range: [a, b] };
      });
      evolution = {
        generated: ev.generated || "", overview: ev.overview || "",
        now: { summary: ((ev.now || {}).summary) || "", open_questions: ((ev.now || {}).open_questions) || [] },
        changes: ev.changes ? { since: ev.changes.since || "", added: ev.changes.added || [], removed: ev.changes.removed || [], note: ev.changes.note || "" } : null,
        threads: ev.threads || [], eras,
      };
    }
    const nMilestones = evolution ? evolution.eras.reduce((s, e) => s + e.ms.length, 0) : 0;

    const regulation = (data.regulation || []).map((r) => ({
      id: r.id, t: String(r.title || r.id || "").replace(/N[°º]\s*/g, "nº "), d: r.date || "", sum: r.summary || r.subject || "",
      req: r.requires || [], eff: r.effective || "", u: safeUrl(r.url), revoked: !!(r.revoked || r.cancelled), dl: regDeadlines(r),
    }));
    const deadlines = regulation.flatMap((r) => r.dl.map((d) => ({ d: d.d, l: d.l, r, left: days(today, d.d) }))).sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0));
    const lastReg = regulation.filter((r) => !r.revoked && r.d).sort((a, b) => (a.d < b.d ? 1 : -1));

    const annual = buildAnnual(data.annual);
    let takeaways = [];
    if (annual) {
      const used = new Set();
      takeaways = annual.trends.map((t, i) => {
        const s = matchSeries(t.text, annual.series, used);
        if (s) used.add(s.l);
        return { title: t.title || "", text: t.text || "", s, cls: ["c-g", "c-b", "c-o", "c-y", "c-t", "c-p", "c-v", "c-n"][i % 8] };
      });
    }
    const headD = digests.find((d) => d.headline);

    return {
      today, slug: topic.slug || "", name: topic.name || "", brand: brand.text || topic.name || "Research", brandEm: brand.em || "Watch",
      focus: topic.focus || "", desc: topic.description || "", generated: data.generated || "", offline: !!data.offline,
      topics: data.topics || [], themeKeys, th, ts, tc, digests, triage, items, evolution, nMilestones,
      regulation, deadlines, next: deadlines.filter((d) => d.left >= 0), lastReg, nReg: regulation.length,
      annual, takeaways, headline: headD ? headD.headline : "",
      people: ((data.watchlist || {}).researchers || []).length,
    };
  }

  return { model, esc, md, fmtD, fmtDY, fmtDM, fmtN, days, pct, cap, nw, splitFirst, splitLast, todayIso, safeUrl, isIso, dt, MES };
})();
if (typeof module === "object" && module.exports) module.exports = Grifo;

/* ================================ UI ================================ */
if (typeof document !== "undefined") (function () {
  "use strict";
  const { esc, md, fmtD, fmtDY, fmtN, days, pct, cap, nw, splitFirst, todayIso, safeUrl, dt, MES } = Grifo;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const app = $("#app"), sheet = $("#sheet"), tip = $("#tip");
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isWide = () => matchMedia("(min-width:1000px)").matches;

  /* storage: same JSON encoding as web/app.js, so paw_voter and paw_name are shared with the main site */
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } },
  };
  const voterId = () => {
    let v = store.get("paw_voter", "");
    if (!v) { v = Math.random().toString(36).slice(2, 12); store.set("paw_voter", v); }
    return v;
  };

  /* theme switch: [data-theme] overrides prefers-color-scheme */
  function setTheme(t) { if (t === "auto") document.documentElement.removeAttribute("data-theme"); else document.documentElement.setAttribute("data-theme", t); store.set("grifo-theme", t); }
  (function () { const t = new URLSearchParams(location.search).get("theme") || store.get("grifo-theme", null); if (t && t !== "auto") document.documentElement.setAttribute("data-theme", t); })();
  const curTheme = () => document.documentElement.getAttribute("data-theme") || "auto";

  let DATA = null, F = null, VISIT = null, current = "";
  const TODAY = todayIso();
  const askOn = () => DATA && !DATA.offline && /^https?:$/.test(location.protocol);

  /* ---------- "desde sua última visita": own key, same session rule as web/app.js ---------- */
  const SESSION_GAP = 60 * 60 * 1000;
  const vkey = (slug) => `grifo_visit|${slug}`;
  const snapshot = () => ({ ts: Date.now(), at: TODAY, digest: (F.digests[0] || {}).date || "", evo: (F.evolution || {}).generated || "" });
  function setupVisit() {
    const rec = store.get(vkey(F.slug), null);
    let prev = null;
    if (rec && rec.cur && typeof rec.cur.ts === "number") prev = Date.now() - rec.cur.ts > SESSION_GAP ? rec.cur : (rec.prev || null);
    store.set(vkey(F.slug), { prev, cur: snapshot() });
    VISIT = prev;
  }
  function markRead() { const s = snapshot(); store.set(vkey(F.slug), { prev: s, cur: s }); VISIT = s; }
  const isNew = (dg) => !!(VISIT && VISIT.digest && dg > VISIT.digest);
  function sinceCounts() {
    const its = F.items.filter((i) => isNew(i.dg));
    const E = F.evolution;
    const ms = VISIT && E && VISIT.evo && E.generated > VISIT.evo ? ((E.changes || {}).added || []).length || E.eras.reduce((s, e) => s + e.ms.filter((m) => m.new).length, 0) : 0;
    const regs = VISIT ? F.regulation.filter((r) => r.d && r.d.slice(0, 10) > VISIT.at).length : 0;
    return { full: its.filter((i) => i.kind === "full").length, quick: its.filter((i) => i.kind === "quick").length, digests: new Set(its.map((i) => i.dg)).size, ms, regs };
  }

  const ORIGIN = { arxiv: "arXiv", watchlist: "Watchlist", busca: "Busca", fonte: "Fonte", journal: "Journal" };
  const CIRC = '<svg viewBox="0 0 120 50" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M9 29C5 13 38 4 68 5c30 1 48 9 45 23-3 13-31 19-59 18C27 45 8 40 8 27c0-9 14-18 34-21"/></svg>';
  const circ = (t, red) => `<span class="circ ${red ? "red" : ""}">${t}${CIRC}</span>`;
  const kick = (ix, t, extra = "") => `<p class="kick"><span class="ix">${ix}</span><span>${t}</span>${extra}</p>`;
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  const inDays = (n) => (n === 0 ? "hoje" : n === 1 ? "amanhã" : `em ${n} dias`);

  function observeSweeps() {
    const els = $$(".sweep:not(.on)");
    if (reduced() || !("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("on")); return; }
    const io = new IntersectionObserver((en) => en.forEach((e) => { if (e.isIntersecting) { $$(".k,.hl", e.target).forEach((m, i) => m.style.setProperty("--i", i)); e.target.classList.add("on"); io.unobserve(e.target); } }), { threshold: .3 });
    els.forEach((e) => io.observe(e));
  }

  /* highlighter marks on running text: **bold** when the writer marked it, else the first few hard figures */
  const NUMRE = /(?<![\w/.,])[+−-]?\d[\d.,]*(?:\s?%|\s?x\b|\s(?:mil|milhão|milhões|bilhão|bilhões|trilhões)(?:\s+de\s+[\p{L}-]+)?)/gu;
  function mark(t) {
    const h = esc(t);
    if (/\*\*.+?\*\*/.test(h)) return h.replace(/\*\*(.+?)\*\*/g, '<span class="hl">$1</span>').replace(/\*(.+?)\*/g, "<em>$1</em>");
    let n = 0;
    return h.replace(NUMRE, (m) => (n++ < 3 ? `<span class="hl">${m}</span>` : m)).replace(/\*(.+?)\*/g, "<em>$1</em>");
  }
  /* the state-of-the-field headline: highlight what the field "is in" (after "está na fase de", "está em" …) */
  function markHead(head) {
    const h = esc(head);
    const m = h.match(/\b(?:está|estão|vive|entrou|entra)\s+(?:(?:na|no|numa|num|em)\s+(?:fase|era|momento|etapa)\s+(?:de|da|do|das|dos)\s+|em\s+|na\s+|no\s+)?/i);
    const STOP = /^(de|da|do|das|dos|a|à|ao|aos|em|no|na|nos|nas|para|com|que|por|aplicad\w*|voltad\w*|centrad\w*)$/i;
    const wrap = (start) => {
      const rest = h.slice(start), words = rest.split(/(\s+)/);
      let out = "", k = 0, i = 0;
      for (; i < words.length; i++) { const w = words[i]; if (!w.trim()) { out += w; continue; } if (k >= 4 || STOP.test(w.replace(/[,.;:]+$/, "")) && k > 0) break; out += w; k++; if (/[,;:]$/.test(w)) { i++; break; } }
      const body = out.replace(/\s+$/, ""), tail = rest.slice(body.length);
      return body ? `${h.slice(0, start)}<span class="hl">${body}</span>${tail}` : h;
    };
    if (m) return wrap(m.index + m[0].length);
    const ws = h.split(" ");
    return ws.length > 3 ? `${ws.slice(0, -2).join(" ")} <span class="hl">${ws.slice(-2).join(" ")}</span>` : h;
  }
  function splitNow(summary) {
    const [s0, rest] = splitFirst(summary);
    let head = s0.replace(/[.:]\s*$/, ""), tail = rest;
    const ci = s0.indexOf(":");
    if (ci > 20 && ci < s0.length - 1) { head = s0.slice(0, ci); tail = cap(s0.slice(ci + 1).trim()) + (rest ? " " + rest : ""); }
    if (head.length > 170) { const c = head.indexOf(", ", 50); if (c > 0) { tail = cap(head.slice(c + 2)) + ". " + tail; head = head.slice(0, c); } }
    return [head, tail.trim()];
  }

  /* ---------- item ficha ---------- */
  function ficha(i) {
    const meta = `<p class="meta">${isNew(i.dg) ? '<span class="novo">novo</span><span>·</span>' : ""}<span>${esc(i.v)}</span>${i.d ? `<span>·</span><span>${fmtD(i.d)}</span>` : ""}${i.au.length ? `<span>·</span><span>${esc(i.au[0])}${i.au.length > 1 ? " et al." : ""}</span>` : ""}${i.wa.length ? `<span>·</span><span class="wl">na watchlist: ${esc(i.wa[0])}</span>` : i.o ? `<span>·</span><span>via ${esc(ORIGIN[i.o] || i.o)}</span>` : ""}</p>`;
    const tab = esc(F.ts(i.th));
    if (i.kind === "quick") return `<article class="fi q ${F.tc(i.th)}"><div class="hd"><span class="tab">${tab} · nota rápida</span><span class="sc" aria-label="Nota ${i.s} de 10">${i.s}<small>/10</small></span></div>
      <h3><a href="${esc(i.u)}" target="_blank" rel="noopener">${esc(i.t)}</a></h3><p class="why"><span>${md(i.why)}</span></p>${meta}</article>`;
    return `<article class="fi ${F.tc(i.th)} sweep"><div class="hd"><span class="tab">${tab}</span><span class="sc" aria-label="Nota ${i.s} de 10">${i.s}<small>/10</small></span></div>
      <h3>${esc(i.t)}</h3><p class="why"><span>${md(i.why)}</span></p>
      ${i.sum || i.ot ? `<div class="sum"><div>${i.sum ? `<p>${md(i.sum)}</p>` : ""}${i.ot ? `<p class="ot">${esc(i.ot)}</p>` : ""}</div></div>` : ""}${meta}
      <div class="act">${i.sum || i.ot ? '<button class="tg" data-toggle aria-expanded="false">Resumo completo</button>' : ""}<a class="lk" href="${esc(i.u)}" target="_blank" rel="noopener">Abrir a fonte</a></div></article>`;
  }
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-toggle]"); if (t) { const c = t.closest(".fi"); const on = c.classList.toggle("open"); t.setAttribute("aria-expanded", String(on)); }
    const o = e.target.closest("[data-open]"); if (o) { const el = o.closest(o.dataset.open); if (el) el.classList.toggle("open"); if (o.dataset.hide) o.hidden = true; }
  });

  /* ---------- charts ---------- */
  function slope(s, cls) {
    const raw = [s.y0, s.y1, s.y2], X = [22, 140, 246], idx = [0, 1, 2].filter((i) => raw[i] != null), W = 290, H = 150;
    const max = Math.max(1, ...idx.map((i) => raw[i])), Y = (v) => +(H - 26 - (v / max) * (H - 82)).toFixed(1), b = H - 26, last = idx[idx.length - 1];
    const ay = Y(raw[2]) - 30, proj = F.annual.partial;
    const yl = (i) => `${s.years[i]}${i === 2 && proj ? " proj." : ""}`;
    const solid = idx.filter((i) => i < 2);
    return `<svg class="slope ${cls}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(s.name)}: ${idx.map((i) => `${fmtN(raw[i])} publicações em ${yl(i)}`).join(", ")}, ${pct(s.ch)}">
      <path class="area" d="M${X[idx[0]]} ${b}${idx.map((i) => `L${X[i]} ${Y(raw[i])}`).join("")}L${X[last]} ${b}Z"/>
      ${solid.length > 1 ? `<polyline class="ln" points="${solid.map((i) => `${X[i]},${Y(raw[i])}`).join(" ")}"/>` : ""}<line class="ln ${proj ? "proj" : ""}" x1="${X[1]}" y1="${Y(raw[1])}" x2="${X[2]}" y2="${Y(raw[2])}"/>
      ${idx.map((i) => `<circle class="pt" cx="${X[i]}" cy="${Y(raw[i])}" r="4"/><text class="v" x="${X[i]}" y="${i === 2 ? Y(raw[i]) + 20 : Y(raw[i]) - 10}" text-anchor="${i === 0 ? "start" : i === 2 ? "end" : "middle"}" ${i === 0 ? `dx="-6"` : i === 2 ? `dx="-9"` : ""}>${fmtN(raw[i])}</text><text x="${X[i]}" y="${H - 8}" text-anchor="middle">${yl(i)}</text>`).join("")}
      <g transform="translate(${X[2] - 34} ${ay - 12})"><path class="pc" d="M30 1c22-3 44 2 42 13S46 28 26 25 0 13 11 6 37-2 52 2"/><text class="ann" x="35" y="18" text-anchor="middle">${pct(s.ch)}</text></g></svg>`;
  }
  const hiNum = (t) => esc(t).replace(/\(([+−-]\d+(?:[.,]\d+)?%)(?=[,)])/g, '(<span class="k">$1</span>');

  /* questions that work for any topic (same set as web/app.js askExamples) */
  const ONBOARD_Q = "Estou chegando agora neste campo: quais conceitos, marcos e debates preciso conhecer primeiro, e por onde começo a ler?";
  function askExamples() {
    const lc = (s) => (!s || /^\S{1,3}\b/.test(s) || /^\S[A-Z]/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1));
    const th = F.themeKeys.map((k) => lc(F.th(k)));
    const t0 = th[0] || "este tema", t1 = th[1] || t0, t2 = th[2] || t0;
    return [
      { k: "Panorama para quem chega", q: ONBOARD_Q },
      { k: "Estado da arte", q: `Qual é o estado da arte em ${t0} hoje, e o que mudou nos últimos dois anos?` },
      { k: "Funciona?", q: `Há evidência de que as abordagens de ${t1} funcionam na prática? Com que tamanho de efeito e quais limitações?` },
      { k: "Quem acompanhar", q: "Quais pesquisadores, instituições e fontes de referência vale acompanhar neste tema, e por quê?" },
      { k: "Tem código?", q: `Existe código aberto ou implementação disponível para os métodos de ${t2}?` },
      { k: "Regulação", q: F.nReg ? "O que a regulação exige hoje neste tema, e quais normas recentes mudaram as obrigações?" : "Quais normas, diretrizes ou exigências legais tocam este tema?" },
      { k: "Plano de qualificação", q: "Monte um plano de estudo de 3 meses para eu me qualificar neste tema, com leituras do arquivo em ordem." },
      { k: "Para decidir", q: "Tenho uma ideia de projeto: [descreva aqui]. Ela faz sentido à luz do que a pesquisa mostra? O que já foi tentado e quais os riscos?", select: "[descreva aqui]" },
    ];
  }
  const EXC = ["c-b", "c-g", "c-y", "c-n", "c-p", "c-v", "c-o", "c-t"];

  /* ---------- home ---------- */
  function sinceBlock() {
    const nx = F.next[0], dlPart = nx ? ` e um prazo que vence ${circ(inDays(nx.left), true)}` : "";
    if (!VISIT) {
      const nF = F.items.filter((i) => i.kind === "full").length, nQ = F.items.length - nF;
      return `<div class="since sweep"><p>Primeira visita por aqui. O arquivo recente tem <a class="k" href="#/novidades">${plural(nF, "destaque", "destaques")}</a> e <a class="k" href="#/novidades">${plural(nQ, "nota rápida", "notas rápidas")}</a> em ${plural(F.digests.length, "digest", "digests")}${F.nMilestones ? `, <a class="k c-b" href="#/evolucao">${F.nMilestones} marcos</a> na Evolução` : ""}${dlPart}.</p>
        <p class="small">Na próxima visita, esta faixa mostra o que entrou desde hoje.</p></div>`;
    }
    const c = sinceCounts();
    if (!c.full && !c.quick && !c.ms && !c.regs) return `<p class="since">Você está em dia.${VISIT.at < TODAY ? ` <span class="small">Última visita em ${fmtD(VISIT.at)}.</span>` : ""}</p>`;
    const parts = [];
    if (c.full) parts.push(`<a class="k" href="#/novidades">${plural(c.full, "destaque", "destaques")}</a>`);
    if (c.quick) parts.push(`<a class="k" href="#/novidades">${plural(c.quick, "nota rápida", "notas rápidas")}</a>`);
    let s = parts.join(" e ");
    if (parts.length) s += ` em ${plural(c.digests, "digest", "digests")}`;
    const more = [];
    if (c.ms) more.push(`<a class="k c-b" href="#/evolucao">${plural(c.ms, "marco novo", "marcos novos")}</a> na Evolução`);
    if (c.regs) more.push(`<a class="k c-n" href="../carta/#/regulacao">${plural(c.regs, "norma nova", "normas novas")}</a>`);
    const all = [s, ...more].filter(Boolean);
    const body = all.length > 1 ? all.slice(0, -1).join(", ") + (dlPart ? ", " : " e ") + all[all.length - 1] : all[0];
    return `<div class="since sweep"><p>Desde <b>${fmtD(VISIT.at)}</b>, sua última visita: ${body}${dlPart}.</p>
      <p class="small"><button data-lv>Marcar tudo como lido</button></p></div>`;
  }

  function viewHome() {
    const E = F.evolution, A = F.annual;
    const best = F.items.filter((i) => i.kind === "full").sort((a, b) => b.s - a.s || (a.dg < b.dg ? 1 : -1)).slice(0, 3);
    const span = F.triage.length ? days(F.triage[0].from || F.triage[0].date, F.triage[F.triage.length - 1].date) + 1 : 0;
    const series = A ? A.series : [], hasPrev = series.some((s) => s.chPrev != null);
    const maxV = Math.max(0.1, ...series.map((s) => Math.max(s.ch || 0, s.chPrev || 0)));
    let yr = A ? A.year : 0, allB = false;
    const dl = F.next.slice(0, 4).concat(F.deadlines.filter((d) => d.left < 0).reverse().slice(0, 1));
    const secs = [];
    if (E && E.now.summary) {
      const [head, rest] = splitNow(E.now.summary), qs = E.now.open_questions;
      secs.push((ix) => `<section class="state sec two" style="margin-top:34px"><div>
        ${kick(ix, "O campo agora", `<span class="small" style="margin-left:auto;font-weight:500;letter-spacing:0;text-transform:none">atualizado em ${fmtD(E.generated || F.generated)}</span>`)}
        <h1 class="sweep">${markHead(head)}.</h1>
        ${rest ? `<div data-st><p class="lede clamp sweep" style="--n:7">${mark(rest)}</p><button class="lk" data-open="[data-st]" data-hide="1">Continuar lendo</button></div>` : ""}</div>
        ${qs.length ? `<aside class="mn"><h3>${plural(qs.length, "questão em aberto", "questões em aberto")}</h3><ol>${qs.map((q, i) => `<li><b>${i + 1}</b><span>${esc(q)}</span></li>`).join("")}</ol></aside>` : "<div></div>"}
      </section>`);
    }
    if (A && F.takeaways.length) {
      const n = F.takeaways.length;
      secs.push((ix) => `<section class="sec">${kick(ix, "Retrospectiva " + A.year + (A.partial ? " · parcial até " + A.until : ""))}<h2 class="h">O ano em ${nw(n, true)} ${n === 1 ? "conclusão" : "conclusões"}</h2>
        <div class="deck" data-deck tabindex="0" aria-label="${cap(nw(n, true))} conclusões: deslize para ver todas">${F.takeaways.map((t, i) => `<article class="tk ${t.cls}"><span class="no">${i + 1}</span><h3>${esc(t.title)}</h3>${t.s ? `${slope(t.s, t.cls)}<p class="cap">${esc(t.s.name)} · publicações por ano no OpenAlex</p>` : ""}<p class="clamp" style="--n:${t.s ? 5 : 12}">${hiNum(t.text)}</p></article>`).join("")}</div>
        <div class="dots" data-dots>${F.takeaways.map((_, i) => `<i class="${i ? "" : "on"}"></i>`).join("")}<span style="display:flex;gap:6px"><button class="ib" data-deck-go="-1" aria-label="Conclusão anterior" style="background:var(--wash);border-radius:14px 17px 13px 18px">←</button><button class="ib" data-deck-go="1" aria-label="Próxima conclusão" style="background:var(--wash);border-radius:17px 13px 18px 14px">→</button></span></div>
      </section>`);
    }
    if (series.length) {
      secs.push((ix) => `<section class="sec two"><div>${kick(ix, "Subtemas")}<h2 class="h">O que cresce, e o que perdeu ritmo</h2>
        ${hasPrev ? `<div class="tog" role="group" aria-label="Ano do ritmo de crescimento"><button data-yr="${A.prevYear}" aria-pressed="false">Ritmo de ${A.prevYear}</button><button data-yr="${A.year}" aria-pressed="true">Ritmo de ${A.year}</button></div>` : ""}
        <ol class="bars" data-bars></ol>
        <div class="lgd small"><span><i class="b"></i>crescimento no ano ${hasPrev ? "escolhido" : A.year}</span>${hasPrev ? '<span><i class="t"></i>crescimento no outro ano</span>' : ""}</div>
        ${series.length > 8 ? `<button class="lk" data-allb>Ver os ${series.length} subtemas</button>` : ""}</div>
        <aside class="mn"><h3>Como ler</h3><p class="serif" style="font-size:15.5px;line-height:1.45">Cada barra é a variação anual de publicações no OpenAlex para o subtema.${A.partial ? ` ${A.year} é uma projeção feita com a contagem até ${A.until}.` : ""}${hasPrev ? " Quando a barra passa o traço, o subtema acelerou." : ""}</p></aside>
      </section>`);
    }
    if (dl.length) {
      secs.push((ix) => `<section class="sec">${kick(ix, "Regulação")}<h2 class="h">${F.next.length ? "Prazos que estão chegando" : "Último prazo registrado"}</h2>
        <ol class="dl sweep" style="margin-top:18px">${dl.map((d) => { const past = d.left < 0, D = dt(d.d); return `<li><div class="date">${String(D.getDate()).padStart(2, "0")}<small>${MES[D.getMonth()]} ${D.getFullYear()}</small></div><div>
          <p class="in ${past ? "past" : ""}">${past ? `há ${Math.abs(d.left)} ${Math.abs(d.left) === 1 ? "dia" : "dias"}` : circ(inDays(d.left), true)}</p><h3>${d.r.u !== "#" ? `<a href="${esc(d.r.u)}" target="_blank" rel="noopener" style="text-decoration:none">${esc(d.r.t)}</a>` : esc(d.r.t)}</h3><p class="clamp" style="--n:4"><b style="font-family:var(--d);font-size:15px;color:var(--ink)">${esc(d.l)}.</b> ${esc(d.r.sum)}</p>
          ${d.r.req.length ? `<ul class="req">${d.r.req.slice(0, 3).map((q) => `<li>${esc(q)}</li>`).join("")}</ul><button class="lk" data-open="li" data-hide="1">O que a norma exige</button>` : ""}</div></li>`; }).join("")}</ol>
        <p class="small" style="margin-top:10px">${F.nReg} normas no arquivo; datas lidas do texto de cada uma. <a class="pen" href="../carta/#/regulacao">Ver todas no Carta</a></p>
      </section>`);
    }
    if (best.length) {
      secs.push((ix) => `<section class="sec">${kick(ix, span > 1 ? `Melhores dos últimos ${span} dias` : "Melhores do digest")}<h2 class="h">${cap(nw(best.length, true))} ${best.length === 1 ? "leitura que vale" : "leituras que valem"} o tempo</h2>
        <div class="three">${best.map(ficha).join("")}</div><a class="lk arrow" href="#/novidades">Todas as novidades</a>
      </section>`);
    }
    secs.push((ix) => `<section class="sec">${kick(ix, "Pergunte")}<h2 class="h">Pergunte ao arquivo</h2>
        <ul class="exq" style="margin-top:16px">${askExamples().slice(0, 3).map((x, i) => `<li><a href="#/pergunte?q=${encodeURIComponent(x.q)}"><span class="tab ${EXC[i]}">${esc(x.k)}</span><b>${esc(x.q)}</b></a></li>`).join("")}</ul>
        <a class="btn" href="#/pergunte" style="margin-top:18px">Fazer outra pergunta</a>
      </section>`);
    app.innerHTML = sinceBlock() + secs.map((f, i) => f(String(i + 1).padStart(2, "0"))).join("") + foot();

    const bars = $("[data-bars]");
    const row = (s) => {
      const v = yr === A.year ? s.ch : s.chPrev, o = yr === A.year ? s.chPrev : s.ch, d = s.chPrev == null ? 0 : s.ch - s.chPrev;
      const w = (x) => Math.max(0, Math.min(100, (x || 0) / maxV * 100)).toFixed(1);
      const ytd = A.partial && s.ytd !== s.y2 ? ` (${fmtN(s.ytd)} até ${A.until})` : "";
      const counts = [s.y0 != null ? `${fmtN(s.y0)} publicações em ${s.years[0]}` : "", `${fmtN(s.y1)} em ${s.years[1]}`, `${fmtN(s.y2)} ${A.partial ? "projetadas para" : "em"} ${s.years[2]}${ytd}`].filter(Boolean).join(", ");
      return `<li data-k="${esc(s.l)}"><button data-open="li" aria-label="${esc(s.name)}: ${pct(v)} em ${yr}" title="${esc(s.q)}"><span class="n">${esc(s.name)}${d > .2 && s.ch >= .7 ? "<small>acelerou</small>" : d < -.8 ? '<small class="cool">perdeu ritmo</small>' : ""}</span><span class="v">${pct(v)}</span>
        <span class="trk"><i class="bar" style="width:${w(v)}%"></i>${o != null ? `<i class="oth" style="left:${w(o)}%"></i>` : ""}</span>
        <span class="x">${cap(counts)}.${s.chPrev != null ? ` Ritmo: ${pct(s.chPrev)} em ${A.prevYear}, ${pct(s.ch)} em ${A.year}.` : ""}</span></button></li>`;
    };
    const paintBars = (flip) => {
      if (!bars) return;
      const first = {}; if (flip) $$("li", bars).forEach((li) => { first[li.dataset.k] = li.getBoundingClientRect().top; });
      const key = (s) => (yr === A.year ? s.ch : s.chPrev == null ? -9 : s.chPrev);
      bars.innerHTML = series.slice().sort((a, b) => key(b) - key(a)).slice(0, allB ? 999 : 8).map(row).join("");
      if (flip && !reduced()) $$("li", bars).forEach((li) => { const f = first[li.dataset.k]; if (f == null) return; const dy = f - li.getBoundingClientRect().top; if (!dy) return; li.animate([{ transform: `translateY(${dy}px)` }, { transform: "none" }], { duration: 520, easing: "cubic-bezier(.3,.7,.2,1)" }); });
    };
    paintBars(false);
    const deck = $("[data-deck]"), dots = $$("[data-dots] i");
    if (deck) deck.addEventListener("scroll", () => { const c = deck.scrollLeft + deck.clientWidth / 2; let bi = 0, bd = 1e9; $$(".tk", deck).forEach((t, i) => { const d = Math.abs(t.offsetLeft + t.offsetWidth / 2 - c); if (d < bd) { bd = d; bi = i; } }); dots.forEach((d, i) => d.classList.toggle("on", i === bi)); }, { passive: true });
    app.onclick = (e) => {
      const y = e.target.closest("[data-yr]"); if (y) { yr = +y.dataset.yr; $$("[data-yr]").forEach((b) => b.setAttribute("aria-pressed", String(b === y))); paintBars(true); }
      const ab = e.target.closest("[data-allb]"); if (ab) { allB = true; ab.hidden = true; paintBars(false); }
      const dg = e.target.closest("[data-deck-go]"); if (dg && deck) deck.scrollBy({ left: +dg.dataset.deckGo * ($(".tk", deck).offsetWidth + 14), behavior: reduced() ? "auto" : "smooth" });
      if (e.target.closest("[data-lv]")) { markRead(); render(); }
    };
  }
  const foot = () => `<footer class="foot small"><span>${esc(F.name)} · dados de ${fmtDY(F.generated)}</span><a class="pen" href="../">Trocar de design</a></footer>`;

  /* ---------- novidades ---------- */
  const scores = () => F.items.map((i) => i.s);
  const baseMin = () => (F.items.length ? Math.min(...scores()) : 6);
  const FS = { themes: new Set(), origins: new Set(), min: null, kind: "todos", day: null };
  function viewFeed() {
    if (FS.min == null) FS.min = baseMin();
    const tri = F.triage, totC = tri.reduce((a, t) => a + t.c, 0), nF = F.items.filter((i) => i.kind === "full").length, nQ = F.items.length - nF;
    const b0 = baseMin(), maxS = F.items.length ? Math.max(...scores()) : 8, mins = [b0, b0 + 1, b0 + 2].filter((n) => n <= maxS);
    const origins = Object.keys(ORIGIN).filter((k) => F.items.some((i) => i.o === k)).concat([...new Set(F.items.map((i) => i.o))].filter((k) => k && !ORIGIN[k]));
    const active = () => FS.themes.size + FS.origins.size + (FS.min > b0 ? 1 : 0) + (FS.kind !== "todos" ? 1 : 0);
    const filt = () => F.items.filter((i) => (!FS.day || i.dg === FS.day) && (!FS.themes.size || FS.themes.has(i.th)) && (!FS.origins.size || FS.origins.has(i.o)) && i.s >= FS.min && (FS.kind === "todos" || i.kind === FS.kind));
    const themeKeys = F.themeKeys.concat([...new Set(F.items.map((i) => i.th))].filter((k) => k && !F.themeKeys.includes(k)));
    const filters = () => `<div class="fs"><h4>Tema</h4><div class="o">${themeKeys.map((k) => { const n = F.items.filter((i) => i.th === k).length; return n ? `<button class="ch ${F.tc(k)}" data-f="themes" data-v="${esc(k)}" aria-pressed="${FS.themes.has(k)}"><i></i>${esc(F.ts(k))} <small>${n}</small></button>` : ""; }).join("")}</div>
      ${origins.length > 1 ? `<h4>Origem</h4><div class="o">${origins.map((k) => `<button class="ch" data-f="origins" data-v="${esc(k)}" aria-pressed="${FS.origins.has(k)}">${esc(ORIGIN[k] || k)}</button>`).join("")}</div>` : ""}
      ${mins.length > 1 ? `<h4>Nota mínima</h4><div class="o">${mins.map((n) => `<button class="ch" data-f="min" data-v="${n}" aria-pressed="${FS.min === n}">${n}+</button>`).join("")}</div>` : ""}
      <h4>Tipo</h4><div class="o">${[["todos", "Tudo"], ["full", "Destaques"], ["quick", "Notas rápidas"]].map(([k, l]) => `<button class="ch" data-f="kind" data-v="${k}" aria-pressed="${FS.kind === k}">${l}</button>`).join("")}</div></div>`;
    const trend = () => { const d = F.digests.find((x) => x.date === FS.day && x.trend) || F.digests.find((x) => x.trend); if (!d) return "";
      return `<div class="trend" data-tr><p class="kick" style="margin-bottom:8px"><span class="pen">Tendência · ${fmtD(d.date)}</span></p>${d.headline ? `<h3>${esc(cap(d.headline))}</h3>` : ""}<p class="clamp" style="--n:5">${esc(d.trend)}</p><button class="lk" data-open="[data-tr]" data-hide="1">Ler inteira</button></div>`; };
    const list = () => { const its = filt();
      if (!its.length) { const t = FS.day && tri.find((x) => x.date === FS.day); return `<p class="empty">Nada com esses filtros${FS.day ? ` em ${fmtD(FS.day)}` : ""}. ${t && !(t.s + t.q) ? `Nesse dia o pipeline leu ${plural(t.c, "candidato", "candidatos")} e nenhum passou no corte.` : ""}</p>`; }
      let h = ""; F.digests.forEach((d) => { const g = its.filter((i) => i.dg === d.date); if (!g.length) return; g.sort((a, b) => (a.kind === b.kind ? b.s - a.s : a.kind === "full" ? -1 : 1));
        h += `<div class="dgh"><b>${fmtD(d.date)}</b><span>${g.length} ${g.length === 1 ? "item" : "itens"} de ${plural(d.c, "candidato lido", "candidatos lidos")}</span></div>${g.map(ficha).join("")}`; }); return h; };
    app.innerHTML = `<h1 class="pg">Novidades</h1><p class="lede sweep">${tri.length ? `De ${fmtD(tri[0].date)} a ${fmtD(tri[tri.length - 1].date)}, o pipeline leu <span class="k">${fmtN(totC)} candidatos</span> e guardou ${plural(nF, "destaque", "destaques")} e ${plural(nQ, "nota rápida", "notas rápidas")}.` : "Ainda não há digests neste tema."}</p>
      <div class="daysx" role="group" aria-label="Filtrar por dia do digest"><button class="day" data-day="" aria-pressed="true"><b>Tudo</b><small>${plural(tri.length, "digest", "digests")}</small></button>${tri.slice().reverse().map((t) => `<button class="day ${t.s + t.q ? "" : "zero"}" data-day="${t.date}" aria-pressed="false" aria-label="${fmtD(t.date)}: ${t.s + t.q} itens de ${t.c} candidatos"><b>${dt(t.date).getDate()}</b><small>${t.s + t.q ? (t.s + t.q) + (t.s + t.q === 1 ? " item" : " itens") : "nenhum"}</small></button>`).join("")}</div>
      <div class="feedg"><div><div data-trend-m></div>
        <div class="fbar"><button class="btn line filt" data-sheet>Filtrar <span class="badge" data-cnt hidden></span></button><span class="small cnt" data-fcount></span></div>
        <div data-list></div></div>
        <aside class="rail"><div data-trend-d></div><div data-filters>${filters()}</div></aside></div>${foot()}`;
    const wide = isWide();
    const paint = () => { $("[data-list]").innerHTML = list(); const n = active(), c = $("[data-cnt]"); c.hidden = !n; c.textContent = n; $("[data-fcount]").textContent = `${filt().length} de ${F.items.length} itens`; $$("[data-day]").forEach((b) => b.setAttribute("aria-pressed", String((b.dataset.day || null) === FS.day)));
      $(wide ? "[data-trend-d]" : "[data-trend-m]").innerHTML = trend(); observeSweeps(); };
    const onF = (e) => { const b = e.target.closest("[data-f]"); if (!b) return false; const k = b.dataset.f, v = b.dataset.v;
      if (k === "min") FS.min = FS.min === +v ? b0 : +v; else if (k === "kind") FS.kind = v; else FS[k].has(v) ? FS[k].delete(v) : FS[k].add(v);
      $$("[data-filters]").forEach((x) => { x.innerHTML = filters(); }); paint(); return true; };
    app.onclick = (e) => { if (onF(e)) return; const d = e.target.closest("[data-day]"); if (d) { FS.day = d.dataset.day || null; paint(); }
      if (e.target.closest("[data-sheet]")) openSheet("Filtrar", `<div data-filters>${filters()}</div><button class="btn" style="width:100%;margin-top:24px" data-close>Ver itens</button>`, onF); };
    paint();
  }

  /* ---------- evolução ---------- */
  function viewEvo() {
    const E = F.evolution;
    if (!E) { app.innerHTML = `<h1 class="pg">Evolução</h1><p class="empty">A Evolução ainda não foi gerada para este tema. Ela é atualizada todo mês.</p>${foot()}`; return; }
    const eras = E.eras, RNG = eras.map((e) => e.range), NE = eras.length;
    const all = eras.flatMap((e, ei) => e.ms.map((m) => ({ ...m, ei }))).sort((a, b) => a.y - b.y || b.c - a.c);
    if (!all.length) { app.innerHTML = `<h1 class="pg">Evolução</h1><p class="lede">${esc(E.overview)}</p>${foot()}`; return; }
    const lanes = F.themeKeys.filter((k) => all.some((m) => m.th === k)).concat([...new Set(all.map((m) => m.th))].filter((k) => !F.themeKeys.includes(k)));
    const wide = isWide(), LW = wide ? 132 : 104, LH = 58;
    const CW = wide ? Math.max(150, Math.floor((Math.min(innerWidth, 1160) - 80 - LW) / NE) - 1) : 232;
    const W = CW * NE, H = LH * lanes.length + 22;
    const rad = (m) => +(4.5 + Math.log10(Math.max(m.c, 5)) * 2.1).toFixed(1);
    const pos = {};
    lanes.forEach((ln, li) => { eras.forEach((e, ei) => { const g = all.filter((m) => m.th === ln && m.ei === ei); const seen = {};
      g.forEach((m) => { const [a, b] = RNG[ei], yy = Math.max(a - .7, Math.min(b, m.y || a)); const k = (seen[m.y] = (seen[m.y] || 0) + 1);
        pos[m.id + "|" + ei] = { x: +(ei * CW + 20 + ((yy - a + .7) / (b - a + .7)) * (CW - 40)).toFixed(1), y: li * LH + LH / 2 + (k > 1 ? (k % 2 ? -13 : 13) : 0) }; }); }); });
    const P = (m) => pos[m.id + "|" + m.ei];
    const lastEra = eras[NE - 1].ms.length ? NE - 1 : all[all.length - 1].ei;
    let thread = null, era = null, sel = all.filter((m) => m.ei === lastEra).sort((a, b) => b.c - a.c)[0] || all[all.length - 1];
    const eraShort = (l) => l.replace(" em diante", "+").replace(/^até\s*/i, "≤ ");
    const svg = () => { let s = `<svg class="tlsvg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Linha do tempo com ${all.length} marcos de ${all[0].y} a ${all[all.length - 1].y}, em ${lanes.length} linhas temáticas">`;
      for (let i = 0; i <= NE; i++) s += `<line class="gl" x1="${i * CW + .5}" x2="${i * CW + .5}" y1="0" y2="${H}"/>`;
      lanes.forEach((_, i) => { s += `<line class="gl" x1="0" x2="${W}" y1="${(i + 1) * LH - .5}" y2="${(i + 1) * LH - .5}"/>`; });
      RNG.forEach(([a, b], i) => { s += `<text class="yr" x="${i * CW + 8}" y="${H - 5}">${a}</text><text class="yr" x="${(i + 1) * CW - 8}" y="${H - 5}" text-anchor="end">${b}</text>`; });
      if (thread) { const pts = all.filter((m) => m.th === thread).map(P); if (pts.length > 1) { let d = `M${pts[0].x} ${pts[0].y}`; for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], mx = (a.x + b.x) / 2; d += `C${mx} ${a.y - 6} ${mx} ${b.y + 6} ${b.x} ${b.y}`; } s += `<path class="fio" pathLength="1" d="${d}"/>`; } }
      all.slice().sort((a, b) => b.c - a.c).forEach((m) => { const p = P(m), r = rad(m); s += `<g class="m ${F.tc(m.th)} ${m.new ? "new" : ""} ${sel && sel.id === m.id && sel.ei === m.ei ? "sel" : ""} ${thread && m.th !== thread ? "dim" : ""}" data-m="${esc(m.id)}|${m.ei}" role="button" tabindex="0" aria-label="${m.y}: ${esc(m.t)}" data-tip="${m.y} · ${esc(m.t.slice(0, 70))} · ${fmtN(m.c)} citações">
        <circle cx="${p.x}" cy="${p.y}" r="${Math.max(r + 6, 16)}" fill="transparent"/><circle class="rg" cx="${p.x}" cy="${p.y}" r="${r}"/><circle class="d" cx="${p.x}" cy="${p.y}" r="${r}"/>${m.new ? `<circle class="nw" cx="${p.x}" cy="${p.y}" r="${r + 4.5}"/>` : ""}</g>`; });
      return s + "</svg>"; };
    const det = () => { if (era != null) { const e = eras[era]; return `<span class="yr">${esc(eraShort(e.label).replace(" ", ""))}</span><p class="kick"><span class="pen">Era ${era + 1} de ${NE} · ${plural(e.ms.length, "marco", "marcos")}</span></p><h3>${esc(e.title)}</h3><p>${esc(e.summary)}</p><div class="nav"><span></span><button data-era-x>Voltar aos marcos</button></div>`; }
      const m = sel, pool = thread ? all.filter((x) => x.th === thread) : all, i = pool.indexOf(m);
      return `<span class="yr">${m.y}</span><p><span class="tab ${F.tc(m.th)}" style="margin:0;border-radius:9px 4px 10px 5px">${esc(F.ts(m.th))}</span>${m.new ? ' <span class="small" style="color:var(--red);font-weight:700;margin-left:6px">novo no mapa</span>' : ""}</p>
        <h3>${esc(m.t)}</h3><p class="by">${[m.au.slice(0, 4).join(", ") + (m.au.length > 4 ? " et al." : ""), m.v, `${fmtN(m.c)} citações`, m.s ? `nota ${m.s}/10` : ""].filter(Boolean).map(esc).join(" · ")}</p><p>${esc(m.why)}</p>
        <div class="nav"><button data-step="-1" ${i <= 0 ? "disabled" : ""}>← anterior</button>${m.u !== "#" ? `<a class="lk" href="${esc(m.u)}" target="_blank" rel="noopener">Abrir a obra</a>` : "<span></span>"}<button data-step="1" ${i >= pool.length - 1 ? "disabled" : ""}>próximo →</button></div>`; };
    const fio = () => { const t = E.threads.find((x) => x.theme === thread); return t ? `<aside class="mn ${F.tc(thread)}" style="margin-top:18px"><h3>O fio de ${esc(F.ts(thread))}</h3><p class="serif" style="font-size:16px;line-height:1.5">${esc(t.line)}</p></aside>` : thread ? "" : `<p class="small" style="margin-top:12px">Escolha um tema para puxar o fio: a linha liga os marcos em ordem${E.threads.length ? " e a nota conta a história" : ""}. Tamanho do ponto = citações (escala log).${all.some((m) => m.new) && E.changes && E.changes.since ? ` Contorno tracejado = entrou no mapa desde ${fmtD(E.changes.since)}.` : ""}</p>`; };
    const ch = E.changes, nA = ch ? ch.added.length : 0, nR = ch ? ch.removed.length : 0;
    app.innerHTML = `<h1 class="pg">Evolução</h1>${E.overview ? `<p class="lede clamp" style="--n:4;max-width:70ch" data-ov>${esc(E.overview)}</p><button class="lk" data-open-ov>Ler o panorama inteiro</button>` : ""}
      <section class="sec" style="margin-top:34px">${kick("01", `${all.length} marcos · ${all[0].y} a ${all[all.length - 1].y}`)}<h2 class="h">Puxe um fio</h2>
        <div class="thr" role="group" aria-label="Destacar um tema"><button class="ch" data-th="" aria-pressed="true">Todos</button>${lanes.map((k) => `<button class="ch ${F.tc(k)}" data-th="${esc(k)}" aria-pressed="false"><i></i>${esc(F.ts(k))} <small>${all.filter((m) => m.th === k).length}</small></button>`).join("")}</div>
        <div class="eranav" role="group" aria-label="Ir para uma era" style="grid-template-columns:repeat(${NE},1fr)">${eras.map((e, i) => `<button data-goto="${i}">${esc(eraShort(e.label))}</button>`).join("")}</div>
          <div class="tlx" data-hscroll style="--cw:${CW}px;--lw:${LW}px;--lh:${LH}px"><div class="tl-in" style="width:${LW + W}px">
            <div class="eras"><span class="sp"></span>${eras.map((e, i) => `<button class="era" data-era="${i}" aria-pressed="false"><b>${esc(e.label)}</b><span>${esc(e.title)}</span></button>`).join("")}</div>
            <div class="lanes"><div class="lab">${lanes.map((k) => `<div class="${F.tc(k)}" title="${esc(F.th(k))}"><i></i><span>${esc(F.ts(k))}</span></div>`).join("")}</div><div data-svg></div></div></div></div>
        <div class="two" style="gap:0 56px"><div class="det" data-det aria-live="polite"></div><div data-fio></div></div>
      </section>
      ${E.now.summary ? `<section class="sec two"><div>${kick("02", "Agora")}<h2 class="h">Onde o campo está</h2><div data-nw><p class="lede clamp sweep" style="--n:8">${mark(E.now.summary)}</p><button class="lk" data-open="[data-nw]" data-hide="1">Continuar lendo</button></div></div>
        ${E.now.open_questions.length ? `<aside class="mn"><h3>${plural(E.now.open_questions.length, "questão em aberto", "questões em aberto")}</h3><ol>${E.now.open_questions.map((q, i) => `<li><b>${i + 1}</b><span>${esc(q)}</span></li>`).join("")}</ol></aside>` : "<div></div>"}</section>` : ""}
      ${nA + nR ? `<section class="sec two"><div>${kick("03", "O que mudou desde " + fmtD(ch.since))}<h2 class="h">${[nA ? `${cap(nw(nA))} ${nA === 1 ? "entrou" : "entraram"}` : "", nR ? `${nA ? nw(nR) : cap(nw(nR))} ${nR === 1 ? "saiu" : "saíram"}` : ""].filter(Boolean).join(", ")}</h2>
        <ul class="diff" style="margin-top:16px">${ch.added.map((a) => `<li class="add"><span>${esc(a.title)}${a.year ? `<small>${a.year}</small>` : ""}</span></li>`).join("")}${ch.removed.map((a) => `<li class="rem"><span>${esc(a.title)}</span></li>`).join("")}</ul></div>
        ${ch.note ? `<aside class="mn"><h3>Por quê</h3><p class="serif" style="font-size:15.5px;line-height:1.45">${esc(ch.note)}</p></aside>` : "<div></div>"}</section>` : ""}${foot()}`;
    const paint = (keepScroll) => { $("[data-svg]").innerHTML = svg(); $("[data-det]").innerHTML = det(); $("[data-fio]").innerHTML = fio();
      $$("[data-th]").forEach((b) => b.setAttribute("aria-pressed", String((b.dataset.th || null) === thread))); $$("[data-era]").forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.era === era)));
      if (!keepScroll && sel && era == null) { const sc = $(".tlx"), p = P(sel); sc.scrollTo({ left: Math.max(0, p.x + LW - sc.clientWidth / 2 - LW / 2), behavior: reduced() ? "auto" : "smooth" }); } };
    const pick = (id) => { const j = id.lastIndexOf("|"), mid = id.slice(0, j), ei = +id.slice(j + 1); sel = all.find((m) => m.id === mid && m.ei === ei) || sel; era = null; paint(true); };
    app.onclick = (e) => {
      const m = e.target.closest("[data-m]"); if (m) return pick(m.dataset.m);
      const t = e.target.closest("[data-th]"); if (t) { thread = t.dataset.th || null; if (thread) { sel = all.filter((x) => x.th === thread).pop(); era = null; } paint(); return; }
      const er = e.target.closest("[data-era]"); if (er) { era = era === +er.dataset.era ? null : +er.dataset.era; paint(true); return; }
      if (e.target.closest("[data-era-x]")) { era = null; paint(true); return; }
      const st = e.target.closest("[data-step]"); if (st) { const pool = thread ? all.filter((x) => x.th === thread) : all; let i = pool.indexOf(sel); if (i < 0) i = 0; sel = pool[Math.max(0, Math.min(pool.length - 1, i + +st.dataset.step))] || sel; paint(); return; }
      const go = e.target.closest("[data-goto]"); if (go) { $(".tlx").scrollTo({ left: +go.dataset.goto * CW, behavior: reduced() ? "auto" : "smooth" }); return; }
      const ov = e.target.closest("[data-open-ov]"); if (ov) { $("[data-ov]").classList.add("open"); ov.hidden = true; }
    };
    app.onkeydown = (e) => { const m = e.target.closest && e.target.closest("[data-m]"); if (m && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); pick(m.dataset.m); } };
    paint();
    const sc = $(".tlx"), nav = $$("[data-goto]"); const onSc = () => { const c = sc.scrollLeft + (sc.clientWidth - LW) / 2; nav.forEach((b, i) => b.setAttribute("aria-current", String(c >= i * CW && c < (i + 1) * CW))); };
    sc.addEventListener("scroll", onSc, { passive: true }); setTimeout(onSc, 60);
  }

  /* ---------- pergunte (POST /api/ask, same request as web/app.js) ---------- */
  const askState = { history: [], busy: false, draft: "", pending: "", msg: "", animate: -1 };
  const voice = { stt: false, rec: null };
  const MIC = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="7" y="2.5" width="6" height="9.5" rx="3"/><path d="M4 9.5a6 6 0 0 0 12 0M10 15.5v3"/></svg>', SEND = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M10 16V4M5 9l5-5 5 5"/></svg>';
  const WAVE = (label) => `<div class="wave" aria-live="polite">${"<i></i>".repeat(12)}<span>${label}</span></div>`;

  function answerParts(h, ti) {
    const used = new Set([...String(h.a).matchAll(/\[(\d{1,2})\]/g)].map((m) => +m[1]));
    const list = (h.sources || []).filter((x) => used.has(x.n)).sort((a, b) => a.n - b.n);
    const has = (n) => list.some((x) => x.n === +n);
    const withCites = (s) => s.replace(/\s?\[(\d{1,2})\]/g, (_, n) => (has(n) ? `<button class="ct" data-c="${ti}:${n}" aria-label="Fonte ${n}">${n}</button>` : `<span class="ct">${n}</span>`));
    const amd = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g, "$1<em>$2</em>");
    const isHead = (l) => /^#{1,4} /.test(l) || /^\*\*[^*]+\*\*:?$/.test(l);
    const isLi = (l) => /^([-*•]|\d+[.)]) /.test(l);
    const block = (p) => {
      const lines = p.split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.length && lines.every(isLi)) return `<ul class="lst">${lines.map((l) => `<li><span>${withCites(amd(l.replace(/^([-*•]|\d+[.)]) /, "")))}</span></li>`).join("")}</ul>`;
      return lines.map((l) => isHead(l) ? `<h3>${withCites(esc(l.replace(/^#{1,4} /, "").replace(/\*\*/g, "").replace(/:$/, "")))}</h3>`
        : isLi(l) ? `<ul class="lst"><li><span>${withCites(amd(l.replace(/^([-*•]|\d+[.)]) /, "")))}</span></li></ul>` : `<p>${withCites(amd(l))}</p>`).join("");
    };
    const blocks = String(h.a || "").trim().split(/\n{2,}/);
    let verd = "";
    const b0 = (blocks[0] || "").trim();
    if (b0 && !b0.includes("\n") && !isHead(b0) && !isLi(b0)) {
      const [a, b] = splitFirst(b0);
      verd = a.length <= 260 ? `<p class="verd sweep"><span class="hl">${withCites(amd(a))}</span> ${withCites(amd(b))}</p>` : `<p class="verd">${withCites(amd(b0))}</p>`;
      blocks.shift();
    }
    return { list, verd, body: blocks.map(block).join("") };
  }
  const whenS = (w, long) => (w ? (Grifo.isIso(w) ? (long ? fmtDY(w) : fmtD(w)) : String(w)) : "");
  function turnHtml(h, ti) {
    const { list, verd, body } = answerParts(h, ti);
    const kinds = {}; list.forEach((x) => { kinds[x.kind || "fonte"] = (kinds[x.kind || "fonte"] || 0) + 1; });
    const H = ti === 0 ? "h1" : "h2";
    return `<section class="turn" data-turn="${ti}"><${H} class="qh">${esc(h.q)}</${H}>
      <div class="askg"><div style="min-width:0">
        ${list.length ? `<div class="srcx" role="list" aria-label="Fontes da resposta">${list.map((s) => `<button class="src" role="listitem" data-s="${ti}:${s.n}"><span class="n">${s.n}</span><b>${esc(s.title)}</b><span>${esc([s.kind, whenS(s.when)].filter(Boolean).join(" · "))}</span></button>`).join("")}</div>` : ""}
        ${verd}<div class="ans" data-ans>${body}</div></div>
        <aside class="side">${list.length ? `<p class="kick" style="margin-bottom:6px"><span class="pen">${plural(list.length, "fonte", "fontes")} · ${Object.entries(kinds).map(([k, n]) => `${n} ${esc(k)}`).join(", ")}</span></p><ol>${list.map((s) => `<li data-s="${ti}:${s.n}"><span class="n">${s.n}</span><button><b>${esc(s.title)}</b><small>${esc([s.kind, whenS(s.when, true)].filter(Boolean).join(" · "))}</small></button></li>`).join("")}</ol>` : '<p class="small">A resposta não citou fontes do arquivo.</p>'}</aside></div></section>`;
  }
  function composer() {
    const has = askState.history.length > 0;
    return `<div class="composer${voice.stt ? "" : " nomic"}" id="composer"><div class="meta"><span id="ask-msg" role="status">${esc(askState.msg || (askState.busy ? "Consultando o arquivo…" : has ? "Seguimentos usam a conversa acima." : "Leva uns 20 a 40 segundos."))}</span>${has && !askState.busy ? '<button type="button" data-reset>nova conversa</button>' : ""}</div>
      <form><textarea name="q" rows="1" maxlength="600" enterkeyhint="send" placeholder="${voice.stt ? "Escreva ou fale a sua pergunta" : "Escreva a sua pergunta"}" aria-label="Sua pergunta"></textarea>
      ${WAVE("Ouvindo")}
      ${voice.stt ? `<button type="button" class="mic" aria-label="Falar a pergunta" aria-pressed="false">${MIC}</button>` : ""}<button class="send" aria-label="Enviar pergunta"${askState.busy ? " disabled" : ""}>${SEND}</button></form></div>`;
  }
  function viewAsk(q) {
    document.body.classList.add("has-composer");
    if (q) { askState.draft = q; try { history.replaceState(null, "", "#/pergunte"); } catch { /* the param just stays */ } }
    const on = askOn(), ex = askExamples(), has = askState.history.length > 0 || askState.pending;
    const exList = `<ul class="exq" style="margin-top:12px">${ex.map((x, i) => `<li><button type="button" data-ex="${i}"><span class="tab ${EXC[i % EXC.length]}">${esc(x.k)}</span><b>${esc(x.q)}</b></button></li>`).join("")}</ul>`;
    const parts = [F.digests.length ? plural(F.digests.length, "digest", "digests") : "", F.nMilestones ? `${F.nMilestones} marcos` : "", F.nReg ? plural(F.nReg, "norma", "normas") : ""].filter(Boolean);
    const intro = `<p class="lede sweep">O agente responde com <span class="k">fontes numeradas</span>, tiradas só do arquivo deste tema${parts.length ? `: ${parts.slice(0, -1).join(", ")}${parts.length > 1 ? " e " : ""}${parts[parts.length - 1]}, além da biblioteca de papers triados` : ""}. Se o arquivo não cobre o assunto, ele diz.</p>`;
    const notice = on ? "" : '<p class="notice">As respostas só funcionam no site publicado. Nesta cópia, os exemplos mostram o que dá para perguntar.</p>';
    if (!has) {
      app.innerHTML = `<div class="askp"><h1 class="pg">Pergunte</h1>${intro}${notice}
        <section class="sec" style="margin-top:36px">${kick("→", on ? "Comece por um exemplo" : "O que dá para perguntar")}${exList}</section></div>${on ? composer() : ""}`;
    } else {
      app.innerHTML = `<div class="askp"><p class="crumb"><button class="lk" data-reset>← Nova conversa</button><span class="sk">responde com fontes</span></p>
        ${askState.history.map(turnHtml).join("")}
        ${askState.pending ? `<section class="turn pend"><${askState.history.length ? "h2" : "h1"} class="qh">${esc(askState.pending)}</${askState.history.length ? "h2" : "h1"}><p>${WAVE("")}Consultando o arquivo… leva uns 20 a 40 segundos.</p></section>` : ""}
        <details class="sec" style="margin-top:56px"><summary class="lk">Exemplos de perguntas</summary>${exList}</details></div>${on ? composer() : ""}`;
    }
    if (!reduced() && askState.animate >= 0) {
      const t = $(`[data-turn="${askState.animate}"]`); let n = 0;
      if (t) $$("[data-ans] p, [data-ans] li span", t).forEach((p) => { Array.from(p.childNodes).forEach((ch) => { if (ch.nodeType === 3) { const f = document.createDocumentFragment(); ch.textContent.split(/(\s+)/).forEach((w) => { if (!w.trim()) { f.appendChild(document.createTextNode(w)); return; } const sp = document.createElement("span"); sp.className = "w"; sp.style.animationDelay = (500 + Math.min(n++, 400) * 10) + "ms"; sp.textContent = w; f.appendChild(sp); }); p.replaceChild(f, ch); } else if (ch.classList) { ch.classList.add("w"); ch.style.animationDelay = (500 + Math.min(n, 400) * 10) + "ms"; } }); });
      askState.animate = -1;
    }
    observeSweeps();
    const c = $("#composer");
    let ta = null;
    if (c) {
      ta = $("textarea", c);
      const form = $("form", c);
      const grow = () => { ta.style.height = "46px"; ta.style.height = `${Math.min(ta.scrollHeight, 140)}px`; };
      ta.value = askState.draft || "";
      ta.addEventListener("input", () => { askState.draft = ta.value; grow(); });
      ta.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey && isWide()) { e.preventDefault(); form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event("submit", { cancelable: true })); } });
      $(".send", c).addEventListener("mousedown", (e) => e.preventDefault());
      form.addEventListener("submit", (e) => { e.preventDefault(); ask(ta.value.trim()); });
      const mic = $(".mic", c); if (mic) mic.addEventListener("click", () => toggleMic(c, mic, ta));
      if (ta.value) grow();
      if (q && on) ta.focus();
    }
    app.onclick = (e) => {
      const x = e.target.closest("[data-ex]");
      if (x) { const it = ex[+x.dataset.ex]; askState.draft = it.q; if (ta) { ta.value = it.q; ta.dispatchEvent(new Event("input")); ta.focus(); if (it.select) { const i = it.q.indexOf(it.select); ta.setSelectionRange(i, i + it.select.length); } } return; }
      if (e.target.closest("[data-reset]")) { if (askState.busy) return; askState.history = []; askState.draft = ""; askState.msg = ""; viewAsk(); scrollTo(0, 0); return; }
      const cb = e.target.closest("[data-c]"), sb = e.target.closest("[data-s]"); const id = cb ? cb.dataset.c : sb ? sb.dataset.s : null; if (!id) return;
      const [ti, n] = id.split(":").map(Number), h = askState.history[ti]; if (!h) return;
      const src = (h.sources || []).find((s) => s.n === n); if (!src) return;
      const turn = $(`[data-turn="${ti}"]`), wide = isWide();
      $$("[data-s]", turn).forEach((s) => s.classList.toggle("hit", s.dataset.s === id)); $$(".ct", turn).forEach((c2) => c2.classList.toggle("hit", c2.dataset.c === id));
      if (cb && !wide) { const s = $(`.src[data-s="${id}"]`, turn); if (s) s.scrollIntoView({ inline: "center", block: "nearest", behavior: reduced() ? "auto" : "smooth" }); }
      if (sb || !wide) openSheet("Fonte " + n, `<p class="small" style="margin-top:10px">${esc([src.kind, whenS(src.when, true)].filter(Boolean).join(" · "))}</p><h3 style="font:750 22px/1.15 var(--d);font-stretch:88%;margin:8px 0 14px">${esc(src.title)}</h3>
        <p class="small" style="margin:12px 0 18px">Fonte ${n} citada na resposta a “${esc(h.q.length > 90 ? h.q.slice(0, 88) + "…" : h.q)}”.</p>${src.url && safeUrl(src.url) !== "#" ? `<a class="btn" href="${esc(safeUrl(src.url))}" target="_blank" rel="noopener">Abrir a fonte</a>` : ""}`);
    };
  }
  async function ask(q) {
    if (!askOn() || q.length < 5 || askState.busy) return;
    askState.busy = true; askState.pending = q; askState.draft = ""; askState.msg = "";
    viewAsk();
    const pend = $(".turn.pend"); if (pend) pend.scrollIntoView({ block: "start", behavior: reduced() ? "auto" : "smooth" });
    try {
      const r = await fetch("/api/ask", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
        body: JSON.stringify({ topic: DATA.topic.slug, question: q, voter: voterId(), name: store.get("paw_name", "") || null,
          history: askState.history.slice(-2).map((h) => ({ q: h.q, a: h.a })) }),
      });
      const out = await r.json().catch(() => ({}));
      if (!r.ok || !out.ok) throw new Error(out.error || r.status);
      askState.history.push({ q, a: out.answer || "", sources: out.sources || [] });
      askState.busy = false; askState.pending = ""; askState.animate = askState.history.length - 1;
      if (current !== "pergunte") return;
      viewAsk();
      const t = $(`[data-turn="${askState.history.length - 1}"]`); if (t) t.scrollIntoView({ block: "start" });
    } catch (err) {
      askState.busy = false; askState.pending = ""; askState.draft = q; askState.msg = `Não foi possível responder (${err.message}).`;
      if (current !== "pergunte") return;
      viewAsk();
    }
  }

  /* voice input: /api/stt, recorded audio re-encoded as WAV mono 16 kHz (as web/app.js does) */
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
      const decoded = await ctx.decodeAudioData(await blob.arrayBuffer());
      const off = new OfflineAudioContext(1, Math.ceil(decoded.duration * 16000), 16000);
      const src = off.createBufferSource(); src.buffer = decoded; src.connect(off.destination); src.start();
      return encodeWav((await off.startRendering()).getChannelData(0), 16000);
    } finally { if (ctx.close) ctx.close(); }
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
  async function toggleMic(c, btn, field) {
    if (voice.rec) { voice.rec.recorder.stop(); return; }
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { btn.title = "Sem acesso ao microfone"; return; }
    const recorder = new MediaRecorder(stream), chunks = [], label = $(".wave span", c);
    const setOn = (on) => { c.classList.toggle("listening", on); btn.classList.toggle("on", on); btn.setAttribute("aria-pressed", String(on)); };
    recorder.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop()); clearTimeout(voice.rec && voice.rec.timer); voice.rec = null;
      label.textContent = "Transcrevendo…"; btn.disabled = true;
      try {
        const text = await transcribe(new Blob(chunks, { type: recorder.mimeType || "audio/webm" }));
        if (text) { field.value = (field.value && !/\s$/.test(field.value) ? field.value + " " : field.value) + text; field.dispatchEvent(new Event("input")); }
      } catch (e) { btn.title = `Não deu para transcrever: ${e.message}`; }
      btn.disabled = false; label.textContent = "Ouvindo"; setOn(false); field.focus();
    };
    recorder.start();
    voice.rec = { recorder, timer: setTimeout(() => recorder.state === "recording" && recorder.stop(), 85000) };
    setOn(true);
  }
  function initVoice() {
    if (!askOn() || window.isSecureContext === false) return;
    fetch("/api/stt", { cache: "no-store" }).then((r) => (r.ok ? r.json() : {})).catch(() => ({})).then((s) => {
      voice.stt = !!s.enabled && !!(navigator.mediaDevices && window.MediaRecorder);
      if (voice.stt && current === "pergunte" && !askState.busy) { const ta = $("#composer textarea"); if (ta) askState.draft = ta.value; viewAsk(); }
    });
  }

  /* ---------- temas ---------- */
  const others = {};
  function loadTopic(slug) {
    if (!others[slug]) others[slug] = fetch(`../../../${encodeURIComponent(slug)}/data.json`, { cache: "no-cache" }).then((r) => (r.ok ? r.json() : null)).then((d) => (d ? Grifo.model(d, TODAY) : null)).catch(() => null);
    return others[slug];
  }
  async function viewTopics() {
    const list = F.topics.length ? F.topics : [{ slug: F.slug, name: F.name }];
    app.innerHTML = `<h1 class="pg" style="margin-bottom:8px">${list.length === 1 ? "Um tema" : `${cap(nw(list.length))} temas`}, uma memória viva</h1><p class="loading">Carregando os temas…</p>`;
    const ms = await Promise.all(list.filter((t) => t.slug !== F.slug).map((t) => loadTopic(t.slug)));
    if (current !== "temas") return;
    const all = [F].concat(ms.filter(Boolean)), CL = ["c-y", "c-b", "c-p", "c-g", "c-v"];
    const block = (t, i) => {
      const last = t.digests[0], max = Math.max(1, ...t.triage.map((x) => x.c)), top = (t.annual ? t.annual.series : []).slice().sort((a, b) => b.ch - a.ch)[0];
      const dl = t.next[0], lr = t.lastReg[0], href = t.slug === F.slug ? "#/" : `../../../${encodeURIComponent(t.slug)}/designs/grifo/`;
      const rec = store.get(vkey(t.slug), null), prev = t.slug === F.slug ? VISIT : rec && rec.cur ? (Date.now() - rec.cur.ts > SESSION_GAP ? rec.cur : rec.prev) : null;
      const nNew = prev && prev.digest ? t.items.filter((x) => x.kind === "full" && x.dg > prev.digest).length : t.items.filter((x) => x.kind === "full").length;
      const ixl = prev && prev.digest ? `${plural(nNew, "destaque", "destaques")} desde ${fmtD(prev.at)}` : `${plural(nNew, "destaque", "destaques")} em ${plural(t.digests.length, "digest", "digests")}`;
      const hl = t.headline || t.desc, words = hl.split(" "), cut = Math.min(words.length, 5);
      const facts = [];
      if (top) facts.push(`<li><span><b>${esc(top.name)}</b><small>subtema que mais cresce · ${fmtN(top.y1)} → ${fmtN(top.y2)} publicações/ano</small></span><span class="v">${circ(pct(top.ch))}</span></li>`);
      if (dl || lr) facts.push(`<li><span><b>${esc((dl ? dl.r : lr).t)}</b><small>${dl ? "próximo prazo · " + fmtDY(dl.d) : "norma mais recente · " + fmtDY(lr.d)}</small></span>${dl ? `<span class="v" style="color:var(--red)">${dl.left} d</span>` : "<span></span>"}</li>`);
      facts.push(`<li><span><b>${[t.nMilestones ? `${t.nMilestones} marcos` : "", t.nReg ? plural(t.nReg, "norma", "normas") : ""].filter(Boolean).join(", ") || plural(t.items.length, "item", "itens")}</b><small>${t.annual && t.annual.works ? `${fmtN(t.annual.works)} trabalhos mapeados em ${t.annual.year}` : `${plural(t.digests.length, "digest", "digests")} no arquivo recente`}</small></span><span></span></li>`);
      return `<article class="tp ${CL[i % CL.length]}"><div><p class="ix">${String(i + 1).padStart(2, "0")} · ${ixl}</p><h2><a href="${href}">${esc(t.brand)}</a></h2>
        <p class="hd sweep"><span class="hl">${esc(cap(words.slice(0, cut).join(" ")))}</span> ${esc(words.slice(cut).join(" "))}</p><a class="lk arrow" href="${href}">${t.slug === F.slug ? "Abrir o tema" : "Abrir este tema no Grifo"}</a></div>
        <div>${t.triage.length ? `<div class="pulse" role="img" aria-label="Candidatos lidos por dia nos últimos ${t.triage.length} digests" data-tip="Candidatos lidos por dia, ${fmtD(t.triage[0].date)} a ${fmtD(t.triage[t.triage.length - 1].date)}">${t.triage.map((x, k) => `<i class="${k === t.triage.length - 1 ? "last" : ""}" style="height:${Math.max(6, x.c / max * 100).toFixed(0)}%"></i>`).join("")}</div>` : ""}
        ${last ? `<p class="small" style="margin-top:6px">No último digest, ${plural(last.c, "candidato lido", "candidatos lidos")} e ${plural(last.s, "destaque", "destaques")}.</p>` : ""}
        <ul class="facts sweep">${facts.join("")}</ul></div></article>`;
    };
    /* the same paper (same key or url) kept by more than one Watch */
    const seen = new Map();
    all.forEach((t) => t.items.forEach((it) => { const k = it.k || it.u; if (!k) return; const g = seen.get(k) || []; if (!g.some((x) => x.t === t)) g.push({ t, it }); seen.set(k, g); }));
    const latest = (g) => g.reduce((m, x) => (x.it.dg > m ? x.it.dg : m), "");
    const cross = [...seen.values()].filter((g) => g.length > 1).sort((a, b) => (latest(b) > latest(a) ? 1 : latest(b) < latest(a) ? -1 : 0)).slice(0, 4);
    app.innerHTML = `<h1 class="pg" style="margin-bottom:8px">${all.length === 1 ? "Um tema" : `${cap(nw(all.length))} temas`}, uma memória viva</h1><p class="lede" style="max-width:62ch;margin-bottom:34px">O Research Watch lê o que sai sobre cada assunto, guarda o que importa e mostra o estado da arte: digests, evolução do campo, retrospectiva anual, regulação e um agente que responde com fontes.</p>
      ${all.map(block).join("")}
      <section class="sec two"><div>${cross.length ? `${kick("∩", "Sinais que cruzam temas")}<h2 class="h">Apareceu em mais de um Watch</h2>
        <ol class="cross" style="margin-top:14px">${cross.map((g, i) => { const mine = g.find((x) => x.t === F) || g[0]; return `<li><b>${i + 1}</b><div><h3>${esc(mine.it.t)}</h3><p>${g.map((x) => `${x.it.kind === "full" ? "destaque" : "nota rápida"} no ${esc(x.t.brand)} ${esc(x.t.brandEm)} (${fmtD(x.it.dg)})`).join(" · ")}</p></div></li>`; }).join("")}</ol>` : ""}</div>
        <aside class="mn"><h3>Outro assunto?</h3><p class="serif" style="font-size:16px;line-height:1.45">Um Watch novo precisa de um foco, uma lista de quem acompanhar e os subtemas a medir.</p><a class="btn" href="../../#/criar" style="margin-top:14px">Pedir um Watch</a></aside></section>${foot()}`;
    observeSweeps();
  }

  /* ---------- shell ---------- */
  function openSheet(title, html, onClick) {
    sheet.innerHTML = `<div class="sh"><div class="sh-h"><h2>${esc(title)}</h2><button class="ib" data-close aria-label="Fechar"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m4 4 10 10M14 4 4 14"/></svg></button></div>${html}</div>`;
    sheet.onclick = (e) => { if (e.target === sheet || e.target.closest("[data-close]")) { sheet.close(); return; } if (onClick) onClick(e);
      const th = e.target.closest("[data-theme-set]"); if (th) { setTheme(th.dataset.themeSet); $$("[data-theme-set]", sheet).forEach((x) => x.setAttribute("aria-pressed", String(x === th))); }
      if (e.target.closest("a[href^='#/']")) sheet.close(); };
    if (!sheet.open) { try { sheet.showModal(); } catch { sheet.setAttribute("open", ""); } }
  }
  function openMore() {
    const row = (href, t, d, ext) => `<li><a href="${href}"><span>${t}<small>${d}</small></span><span class="pen">${ext ? "↗" : "→"}</span></a></li>`;
    const names = F.topics.map((t) => t.name.replace(/\s*Watch$/, "")).join(", ");
    const A = F.annual;
    openSheet("Mais", `<ul class="ml" style="margin-top:10px">
      ${F.topics.length > 1 ? row("#/temas", "Trocar de tema", esc(names)) : ""}
      ${row("#/evolucao", "Evolução", F.evolution ? `${F.nMilestones} marcos em ${plural(F.evolution.eras.length, "era", "eras")}` : "ainda não gerada")}
      ${F.nReg ? row("../carta/#/regulacao", "Regulação", `${F.nReg} normas, com o que cada uma exige · no Carta`, true) : ""}
      ${A ? row(`../carta/#/anual/${A.year}`, "Anual " + A.year, (A.partial ? "Retrospectiva parcial até " + A.until : "Retrospectiva do ano") + " · no Carta", true) : ""}
      ${row("../carta/#/pessoas", "Pessoas & instituições", (F.people ? `${F.people} pesquisadores na watchlist` : "Watchlist do tema") + " · no Carta", true)}
      ${row("../", "Trocar de design", "Carta, clássico e os outros", true)}</ul>
      <h3 class="kick" style="margin:24px 0 10px"><span>Aparência</span></h3><div class="tog" style="grid-template-columns:repeat(3,1fr);margin:0;display:grid">${[["auto", "Sistema"], ["light", "Claro"], ["dark", "Escuro"]].map(([k, l]) => `<button data-theme-set="${k}" aria-pressed="${curTheme() === k}">${l}</button>`).join("")}</div>`);
  }
  const NAV = [["inicio", "#/", "Início"], ["novidades", "#/novidades", "Novidades"], ["mapa", "#/evolucao", "Mapa"], ["pergunte", "#/pergunte", "Pergunte"], ["mais", "", "Mais"]];
  function shell(cur) {
    $("#dock").innerHTML = NAV.map(([k, h, l]) => h ? `<a href="${h}" ${k === cur ? 'aria-current="page"' : ""}><span>${l}</span></a>` : `<button data-more><span>${l}</span></button>`).join("");
    $("#nav-d").innerHTML = NAV.map(([k, h, l]) => h ? `<a href="${h}" ${k === cur ? 'aria-current="page"' : ""}><span>${l}</span></a>` : `<a href="#" data-more><span>${l}</span></a>`).join("");
    $("#wm-a").textContent = cur === "temas" ? "Research" : F.brand;
    $("#wm-b").textContent = cur === "temas" ? "Watch" : F.brandEm;
  }
  document.addEventListener("click", (e) => { if (e.target.closest("[data-more]")) { e.preventDefault(); if (F) openMore(); } });
  $("#theme-b").addEventListener("click", () => { const dark = curTheme() === "dark" || (curTheme() === "auto" && matchMedia("(prefers-color-scheme:dark)").matches); setTheme(dark ? "light" : "dark"); });
  document.addEventListener("pointermove", (e) => { const t = e.target.closest && e.target.closest("[data-tip]"); if (!t || e.pointerType === "touch") { tip.classList.remove("on"); return; } tip.textContent = t.dataset.tip; tip.style.left = Math.min(innerWidth - 135, Math.max(135, e.clientX)) + "px"; tip.style.top = e.clientY + "px"; tip.classList.add("on"); });
  const route = () => { const h = location.hash.replace(/^#\/?/, ""); const qi = h.indexOf("?"); const p = qi >= 0 ? h.slice(0, qi) : h; return { parts: p.split("/").filter(Boolean), q: new URLSearchParams(qi >= 0 ? h.slice(qi + 1) : "") }; };
  function render() {
    app.onclick = null; app.onkeydown = null;
    document.body.classList.remove("has-composer");
    if (sheet.open) sheet.close();
    const r = route(), p = r.parts[0] || "";
    if (p === "novidades") { current = "novidades"; shell("novidades"); viewFeed(); }
    else if (p === "evolucao" || p === "mapa") { current = "mapa"; shell("mapa"); viewEvo(); }
    else if (p === "pergunte") { current = "pergunte"; shell("pergunte"); viewAsk(r.q.get("q")); }
    else if (p === "temas") { current = "temas"; shell("temas"); viewTopics(); }
    else { current = "inicio"; shell("inicio"); viewHome(); }
    scrollTo(0, 0); observeSweeps();
  }
  try { history.scrollRestoration = "manual"; } catch { /* older browsers */ }

  fetch("../../data.json", { cache: "no-cache" })
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then((d) => {
      DATA = d; F = Grifo.model(d, TODAY);
      document.title = `${F.name || "Research Watch"} · Grifo`;
      setupVisit();
      addEventListener("hashchange", render);
      render();
      initVoice();
    })
    .catch((e) => { app.innerHTML = `<p class="empty">Não foi possível carregar os dados (${esc(e.message)}). <a class="pen" href="../../?design=classico">Abrir o site clássico</a></p>`; });
})();
