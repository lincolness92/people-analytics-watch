/* Carta: the Watch as a navigation chart.
   Port of the "Carta" prototype onto live data. Two layers in one file:
   1. MODEL: pure functions that turn ../../data.json into what each block shows (no DOM; Node can require it).
   2. UI: the prototype's views, painted from the model. Runs only in a browser. */
(function (root) {
  "use strict";

  /* =====================================================================
     1. MODEL (pure)
     ===================================================================== */
  const MES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const MESES = { janeiro: 1, fevereiro: 2, "março": 3, marco: 3, abril: 4, maio: 5, junho: 6, julho: 7, agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12 };
  const dt = (iso) => new Date(String(iso).slice(0, 10) + "T12:00:00");
  const isoOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const addDays = (iso, n) => { const d = dt(iso); d.setDate(d.getDate() + n); return isoOf(d); };
  const fmtD = (iso) => { const d = dt(iso); return `${d.getDate()} ${MES[d.getMonth()]}`; };
  const fmtDY = (iso) => { const d = dt(iso); return `${d.getDate()} ${MES[d.getMonth()]} ${d.getFullYear()}`; };
  const fmtDM = (iso) => { const d = dt(iso); return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`; };
  const fmtN = (n) => (n == null || isNaN(n) ? "—" : Number(n).toLocaleString("pt-BR"));
  const days = (a, b) => Math.round((dt(b) - dt(a)) / 864e5);
  const pct = (ch) => (ch == null || isNaN(ch) ? "—" : (ch >= 0 ? "+" : "−") + Math.round(Math.abs(ch) * 100) + "%");
  const stripMark = (s) => String(s || "").replace(/^[^\p{L}\p{N}]+\s*/u, "");
  const lcFirst = (s) => (!s || /^\S{1,3}\b/.test(s) || /^\S[A-Z]/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1));
  const ucFirst = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");
  const todayIso = () => isoOf(new Date());

  /* sentences: same boundary rules as web/app.js splitFirst (skips initials, "et al.", never inside **bold**) */
  const ABBR = new Set(["al", "fig", "vs", "ex", "sr", "sra", "dr", "dra", "p", "pp", "cf", "no", "nº", "approx", "aprox", "inc", "co"]);
  function sentences(text) {
    const s = String(text || "").trim();
    const out = [];
    const re = /[.!?](?=\s+["“'(*]*[A-ZÀ-Ý0-9])/g;
    let start = 0, m;
    while ((m = re.exec(s))) {
      const head = s.slice(start, m.index + 1);
      if (head.length < 30) continue;
      if ((s.slice(0, m.index + 1).match(/\*\*/g) || []).length % 2) continue;
      const word = (s.slice(0, m.index).match(/(\S+)$/) || ["", ""])[1].replace(/^[("“*]+/, "");
      if (/^[A-Z]$/.test(word) || /^([A-Z]\.)+[A-Z]$/.test(word) || ABBR.has(word.toLowerCase())) continue;
      out.push(head.trim());
      start = m.index + 1;
    }
    const rest = s.slice(start).trim();
    if (rest) out.push(rest);
    return out;
  }
  /* "Por que importa": the summaries close on the practical lesson, so the card leads with the last sentence */
  function whyOf(summary) {
    const ss = sentences(summary);
    if (ss.length < 2) return ss[0] || "";
    const last = ss[ss.length - 1];
    return last.length < 60 ? ss.slice(-2).join(" ") : last;
  }

  /* ---- items: every digest item (destaque) and quick note, flattened ---- */
  function allItems(d) {
    const out = [];
    for (const g of d.digests || []) {
      const norm = (i, kind) => ({
        k: i.key || i.url, t: i.title || i.original_title || "", ot: i.original_title && i.original_title !== i.title ? i.original_title : "",
        u: i.url || "", v: i.venue || "", d: i.date || g.date, au: i.authors || [], s: Number(i.score) || 0, th: i.theme || "",
        o: i.origin || "", wa: i.watch_authors || [], dg: g.date, kind,
        sum: kind === "full" ? i.summary || "" : "", why: kind === "full" ? whyOf(i.summary) : i.note || i.summary || "",
      });
      for (const i of g.items || []) out.push(norm(i, "full"));
      for (const i of g.quick || []) out.push(norm(i, "quick"));
    }
    return out;
  }

  /* ---- triage tape: candidates read per digest, items kept (oldest first) ---- */
  function triage(d) {
    return (d.digests || []).map((g) => ({
      d: g.date, c: (g.stats && (g.stats.candidates != null ? g.stats.candidates : g.stats.triaged)) || 0,
      s: (g.items || []).length, q: (g.quick || []).length,
    })).sort((a, b) => (a.d < b.d ? -1 : 1));
  }
  const digestsWithTrend = (d) => (d.digests || []).filter((g) => g.trend && g.headline);
  const headlineOf = (d) => { const g = (d.digests || []).find((x) => x.headline); return g ? g.headline : ""; };

  /* ---- annual retrospective: latest year, and the one before for the 2024→2025 rate ---- */
  function annualPair(d) {
    const ys = Object.keys(d.annual || {}).sort();
    if (!ys.length) return { year: null, a: null, prev: null };
    const y = ys[ys.length - 1];
    return { year: +y, a: d.annual[y], prev: d.annual[String(+y - 1)] || null };
  }
  const untilOf = (a) => (a && a.partial && a.generated ? fmtDM(a.generated) : null);

  /* ---- subtopics (annual.growth): three-point series 2024, 2025, 2026 projected ---- */
  const normLabel = (l) => String(l || "").toLowerCase().replace(/\s*\/\s*/g, "/").replace(/\s+/g, " ").trim();
  /* the subject terms of a subtopic: the OpenAlex query is "(subject terms) AND (context)", so take the first
     top-level AND group that names a subject (two or more terms, or one multi-word phrase) */
  function splitTop(q) {
    const parts = []; let depth = 0, inQ = false, cur = "";
    for (let i = 0; i < q.length; i++) {
      const c = q[i];
      if (c === '"') inQ = !inQ;
      else if (!inQ) {
        if (c === "(") depth++; else if (c === ")") depth--;
        else if (depth === 0 && q.startsWith(" AND ", i)) { parts.push(cur); cur = ""; i += 4; continue; }
      }
      cur += c;
    }
    parts.push(cur);
    return parts.map((x) => x.trim()).filter(Boolean);
  }
  function groupTerms(g) {
    let s = g.trim();
    if (s.startsWith("(") && s.endsWith(")")) {
      let depth = 0, wraps = true, inQ = false;
      for (let i = 0; i < s.length - 1; i++) { const c = s[i]; if (c === '"') inQ = !inQ; else if (!inQ) { if (c === "(") depth++; else if (c === ")") depth--; if (depth === 0) { wraps = false; break; } } }
      if (wraps) s = s.slice(1, -1);
    }
    const out = [];
    let depth = 0, inQ = false, cur = "";
    const flush = () => { const w = cur.trim(); if (w && !/^(OR|AND|NOT)$/.test(w) && depth === 0) out.push(w); cur = ""; };
    for (const c of s) {
      if (c === '"') { if (inQ) { out.push(cur.trim()); cur = ""; } else flush(); inQ = !inQ; continue; }
      if (inQ) { cur += c; continue; }
      if (c === "(" || c === ")") { flush(); depth += c === "(" ? 1 : -1; continue; }
      if (/\s/.test(c)) { flush(); continue; }
      cur += c;
    }
    flush();
    return Array.from(new Set(out.filter((t) => t.length > 1)));
  }
  function termsOf(g) {
    const q = String(g.query || "").trim();
    if (q) {
      const groups = splitTop(q).map(groupTerms).filter((t) => t.length);
      const pick = groups.find((t) => t.length >= 2 || /\s/.test(t[0])) || groups[0];
      if (pick && pick.length) return { terms: pick, groups };
    }
    const t = String(g.label || "").split(/\s*\/\s*/).map((x) => x.replace(/[()"*]/g, "").trim()).filter(Boolean);
    return { terms: t, groups: [t] };
  }
  function subName(label) {
    const l = String(label || "");
    if (/\bOR\b|\bAND\b|\(/.test(l)) {
      const groups = l.split(/\)\s*AND\s*\(|\s+AND\s+/i).map((x) => x.split(/\s+OR\s+/i).map((t) => t.replace(/[()"*]/g, "").trim()).filter(Boolean));
      const a = (groups[0] || []).slice(0, 2).join(" / "), b = groups[1] && groups[1][0];
      return ucFirst(b ? `${a} + ${b}` : a);
    }
    return /^[a-zà-ý]/.test(l) ? ucFirst(l) : l;
  }
  /* status from the two growth rates we have (2025 and 2026 projected) — same rule as the prototype */
  function subStatus(s) {
    const a = s.ch, b = s.ch25 == null ? a : s.ch25;
    if (a >= 0.7 && a > b + 0.2) return { k: "acel", l: "Acelerando" };
    if (a >= 1) return { k: "alta", l: "Em alta" };
    if (a < 0.4 && b >= 1) return { k: "esfria", l: "Esfriando" };
    if (a >= 0.4) return { k: "cresce", l: "Crescendo" };
    return { k: "estavel", l: "Estável" };
  }
  function buildSeries(d) {
    const { a, prev } = annualPair(d);
    if (!a || !Array.isArray(a.growth)) return [];
    const prevBy = {};
    ((prev && prev.growth) || []).forEach((g) => { prevBy[normLabel(g.label)] = g; });
    const out = a.growth.filter((g) => g && g.label).map((g) => {
      const p = prevBy[normLabel(g.label)];
      const y25 = g.prev != null ? g.prev : p ? p.cur : null;
      const ytd = g.cur != null ? g.cur : null;
      const y26 = g.cur_full_year != null ? g.cur_full_year : ytd;
      const y24 = p ? p.prev : null;
      const ch = g.change != null ? g.change : y25 ? y26 / y25 - 1 : null;
      const ch25 = p && p.change != null ? p.change : null;
      const tq = termsOf(g);
      /* a label that is itself a boolean query (no curated name) is matched with the whole query: every AND group */
      const strict = /\sAND\s/.test(g.label);
      const s = { l: g.label, name: subName(g.label), terms: tq.terms, groups: strict ? tq.groups : [tq.terms], y24, y25, ytd, y26, ch, ch25 };
      s.st = subStatus(s);
      s.pts = [y24, y25, y26];
      return s;
    }).filter((s) => s.ch != null);
    out.sort((x, y) => y.ch - x.ch);
    out.forEach((s, i) => { s.i = i + 1; });
    return out;
  }

  /* term match on word boundaries (short acronyms like "APP" must not hit "happen") */
  const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  function matcher(groups) {
    const gs = (groups || []).map((terms) => (terms || []).filter((t) => t && t.length > 1).map((t) => new RegExp(`(^|[^\\p{L}\\p{N}])${reEsc(t)}($|[^\\p{L}\\p{N}])`, "iu"))).filter((g) => g.length);
    return (...texts) => { const s = texts.filter(Boolean).join(" | "); return gs.length > 0 && gs.every((res) => res.some((r) => r.test(s))); };
  }

  /* ---- "2026 em cinco conclusões": each annual trend paired with the subtopic it quotes ---- */
  function takeaways(d, series) {
    const { a } = annualPair(d);
    if (!a || !Array.isArray(a.trends)) return [];
    return a.trends.map((t) => {
      const text = String(t.text || ""), low = text.toLowerCase().replace(/\s*\/\s*/g, "/");
      let best = null, pos = Infinity;
      for (const s of series) {
        /* 1) the label as the text writes it ("instant payment/instant payments") */
        let p = low.indexOf(normLabel(s.l));
        /* 2) the figures it quotes ("de 130 para 957") */
        if (p < 0 && s.y25 != null && s.y26 != null) p = text.indexOf(`${fmtN(s.y25)} para ${fmtN(s.y26)}`);
        if (p >= 0 && p < pos) { pos = p; best = s; }
      }
      return { title: t.title || "", text, s: best };
    });
  }

  /* ---- regulation deadlines, read from each norm's "effective" text ---- */
  const DATE_RES = [
    { re: /(\d{1,2})\s*(?:º|°|o)?\s+de\s+(janeiro|fevereiro|março|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s+de\s+(\d{4})/gi, f: (m) => [+m[3], MESES[m[2].toLowerCase()], +m[1]] },
    { re: /\b(\d{1,2})\s*(?:º|°)?\/(\d{1,2})\/(\d{4})\b/g, f: (m) => [+m[3], +m[2], +m[1]] },
  ];
  function datesIn(text) {
    const out = [];
    for (const { re, f } of DATE_RES) {
      re.lastIndex = 0; let m;
      while ((m = re.exec(text))) {
        const [y, mo, da] = f(m);
        if (!y || !mo || mo > 12 || !da || da > 31) continue;
        out.push({ iso: `${y}-${String(mo).padStart(2, "0")}-${String(da).padStart(2, "0")}`, at: m.index });
      }
    }
    return out.sort((x, y) => x.at - y.at);
  }
  function parseDeadlines(r) {
    const eff = String(r.effective || "").trim();
    if (!eff || r.revoked || r.cancelled) return [];
    const pub = String(r.date || "").slice(0, 10);
    const seen = new Set(), out = [];
    eff.split(/;\s*|\.\s+(?=[A-ZÀ-Ý])/).forEach((clause) => {
      const c = clause.trim().replace(/\.$/, "");
      if (!c) return;
      datesIn(c).forEach(({ iso }) => {
        if ((pub && iso <= pub) || seen.has(iso)) return; /* "na data de publicação (2/4/2026)" is not a deadline */
        seen.add(iso);
        out.push({ d: iso, l: ucFirst(c.length > 150 ? c.slice(0, 148).replace(/\s+\S*$/, "") + "…" : c) });
      });
    });
    return out;
  }
  function deadlines(d, today) {
    const all = (d.regulation || []).flatMap((r) => parseDeadlines(r).map((x) => ({ d: x.d, l: x.l, r, left: days(today, x.d) })))
      .sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0));
    return { all, next: all.filter((x) => x.left >= 0) };
  }
  const regSorted = (d) => (d.regulation || []).slice().sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));

  /* ---- radar of subtopics: ring = growth status, quadrant = volume band ---- */
  const RINGS = [
    { k: "acel", l: "Acelerando", d: "Ritmo de 2026 de +70% ou mais e ao menos 20 pontos acima do ritmo de 2025." },
    { k: "alta", l: "Em alta", d: "Publicações ao menos dobram em 2026, sem aceleração forte frente a 2025." },
    { k: "cresce", l: "Crescendo", d: "Crescimento de 40% a 100% em 2026, sem aceleração forte frente a 2025." },
    { k: "resto", l: "Estável ou esfriando", d: "Menos de +40% em 2026; esfriando quando o ritmo de 2025 tinha passado de +100%." },
  ];
  const ringOf = (s) => (s.st.k === "acel" ? 0 : s.st.k === "alta" ? 1 : s.st.k === "cresce" ? 2 : 3);
  const RR = [56, 92, 124, 152];
  const BAND = [[22, 47], [64, 84], [99, 117], [131, 146]];
  const A_IN = 14; /* keep blips off the axes, where the ring labels sit */
  const pol = (r, a) => [+(r * Math.sin(a * Math.PI / 180)).toFixed(1), +(-r * Math.cos(a * Math.PI / 180)).toFixed(1)];
  function radarModel(series) {
    const blips = series.map((s) => ({ id: s.i, s, ring: ringOf(s) }));
    const byVol = blips.slice().sort((a, b) => (b.s.y26 || 0) - (a.s.y26 || 0));
    const nq = Math.min(4, blips.length);
    const quads = [];
    for (let qi = 0; qi < nq; qi++) {
      const lo = Math.floor(qi * byVol.length / nq), hi = Math.floor((qi + 1) * byVol.length / nq);
      const g = byVol.slice(lo, hi);
      g.forEach((b) => { b.q = qi; });
      const vmax = g[0].s.y26, vmin = g[g.length - 1].s.y26;
      quads.push({ k: qi, l: vmin === vmax ? `Vol. ${fmtN(vmin)}/ano` : `Vol. ${fmtN(vmin)}–${fmtN(vmax)}/ano`, min: vmin, max: vmax });
    }
    place(blips);
    return { rings: RINGS, quads, blips };
  }
  /* even spread inside each quadrant × ring cell, then a few rounds of repulsion so numbers never overlap */
  function place(blips) {
    const groups = {};
    blips.forEach((b) => { (groups[b.q + "|" + b.ring] = groups[b.q + "|" + b.ring] || []).push(b); });
    blips.forEach((b) => {
      const g = groups[b.q + "|" + b.ring], k = g.indexOf(b), n = g.length;
      const a0 = b.q * 90 + A_IN, span = 90 - 2 * A_IN, [r0, r1] = BAND[b.ring];
      b.a = a0 + ((k + 0.5) / n) * span;
      b.r = n > 1 ? (k % 2 ? r0 + (r1 - r0) * 0.75 : r0 + (r1 - r0) * 0.25) : (r0 + r1) / 2;
    });
    const MIN = 23;
    for (let it = 0; it < 120; it++) {
      let moved = false;
      blips.forEach((b) => { [b.x, b.y] = pol(b.r, b.a); });
      for (let i = 0; i < blips.length; i++) for (let j = i + 1; j < blips.length; j++) {
        const p = blips[i], q = blips[j], dx = q.x - p.x, dy = q.y - p.y, dd = Math.hypot(dx, dy) || 0.01;
        if (dd >= MIN) continue;
        moved = true;
        const push = (MIN - dd) / 2;
        [[p, -1], [q, 1]].forEach(([b, sg]) => {
          const nx = b.x + sg * dx / dd * push, ny = b.y + sg * dy / dd * push;
          let r = Math.hypot(nx, ny), a = (Math.atan2(nx, -ny) * 180 / Math.PI + 360) % 360;
          const [r0, r1] = BAND[b.ring], a0 = b.q * 90 + A_IN - 6, a1 = b.q * 90 + 96 - A_IN;
          if (b.q === 0 && a > 270) a -= 360;
          b.r = Math.max(r0, Math.min(r1, r));
          b.a = Math.max(a0, Math.min(a1, a));
        });
      }
      if (!moved) break;
    }
    blips.forEach((b) => { [b.x, b.y] = pol(b.r, b.a); });
  }

  /* ---- things the archive holds about one subtopic (ficha) ---- */
  function subtopicFile(d, s, items) {
    const hit = matcher(s.groups);
    const its = items.filter((i) => hit(i.t, i.ot, i.sum, i.why)).sort((a, b) => b.s - a.s || (a.dg < b.dg ? 1 : -1));
    const hl = [];
    Object.keys(d.annual || {}).sort().reverse().forEach((y) => ((d.annual[y] || {}).highlights || []).forEach((h) => {
      if (hit(h.title, h.original_title, h.why) && !hl.some((x) => x.url === h.url)) hl.push({ ...h, year: y });
    }));
    const ms = [];
    ((d.evolution || {}).eras || []).forEach((e) => (e.milestones || []).forEach((m) => { if (hit(m.title, m.why)) ms.push({ ...m, era: e.label }); }));
    ms.sort((a, b) => (a.year || 0) - (b.year || 0));
    const regs = regSorted(d).filter((r) => hit(r.title, r.subject, r.summary, (r.techniques || []).join(" ; ")));
    const oq = (((d.evolution || {}).now || {}).open_questions || []).filter((q) => hit(q));
    return { items: its, highlights: hl, milestones: ms, regs, oq };
  }

  /* ---- "since your last visit" ---- */
  function sinceCounts(d, items, lastVisit) {
    const its = items.filter((i) => i.dg > lastVisit);
    const ev = d.evolution || {};
    const evNew = ev.generated && ev.generated > lastVisit;
    const ms = evNew ? (((ev.changes || {}).added || []).length || (ev.eras || []).reduce((n, e) => n + (e.milestones || []).filter((m) => m.new).length, 0)) : 0;
    const regs = (d.regulation || []).filter((r) => String(r.date || "").slice(0, 10) > lastVisit).length;
    return { full: its.filter((i) => i.kind === "full").length, quick: its.filter((i) => i.kind === "quick").length, digests: new Set(its.map((i) => i.dg)).size, ms, regs };
  }
  /* first visit: count from the day before the oldest digest in the file (the whole window is "new") */
  const firstVisitDate = (d) => { const t = triage(d); return t.length ? addDays(t[0].d, -1) : addDays(todayIso(), -7); };

  const nMilestones = (d) => ((d.evolution || {}).eras || []).reduce((n, e) => n + (e.milestones || []).length, 0);
  const works = (d) => { const { a } = annualPair(d); return a && a.geography && a.geography.works != null ? a.geography.works : a && a.stats ? a.stats.works : null; };

  /* ---- topic card on the landing ---- */
  function topicSummary(d, today, lastVisit) {
    const t = d.topic || {}, b = t.brand || {};
    const series = buildSeries(d), tri = triage(d), dl = deadlines(d, today);
    const lr = regSorted(d)[0] || null;
    return {
      slug: t.slug, name: t.name, brand: b.text || t.name || t.slug, em: b.em || "Watch",
      headline: headlineOf(d), triage: tri, last: tri[tri.length - 1] || null,
      top: series.slice().sort((x, y) => y.ch - x.ch)[0] || null,
      nextDl: dl.next[0] || null, lastReg: lr, lrNew: !!(lr && lr.date && days(String(lr.date).slice(0, 10), today) <= 3),
      nMilestones: nMilestones(d), nReg: (d.regulation || []).length, works26: works(d), year: annualPair(d).year,
      nNew: lastVisit ? tri.filter((x) => x.d > lastVisit).reduce((n, x) => n + x.s, 0) : 0,
    };
  }
  /* items that show up in more than one Watch (same key or url) */
  function crossSignals(topics) {
    const by = {};
    topics.forEach((tp) => allItems(tp.data).forEach((i) => {
      const k = i.k || i.u; if (!k) return;
      const e = (by[k] = by[k] || []);
      if (!e.some((x) => x.slug === tp.slug)) e.push({ slug: tp.slug, brand: tp.brand, t: i.t, dg: i.dg, kind: i.kind, u: i.u });
    }));
    return Object.values(by).filter((e) => e.length > 1)
      .map((e) => ({ t: e[0].t, u: e[0].u, at: e.map((x) => x), last: e.reduce((m, x) => (x.dg > m ? x.dg : m), "") }))
      .sort((a, b) => (a.last < b.last ? 1 : -1));
  }

  /* ---- ask examples, built from the topic like web/app.js does ---- */
  function askExamples(d) {
    const th = Object.values(d.themes || {}).map((t) => lcFirst(stripMark(t)));
    const t0 = th[0] || "este tema", t1 = th[1] || t0;
    const hasReg = (d.regulation || []).length > 0;
    return [
      { k: "Estado da arte", q: `Qual é o estado da arte em ${t0} hoje, e o que mudou nos últimos dois anos?` },
      { k: "Funciona?", q: `Há evidência de que as abordagens de ${t1} funcionam na prática? Com que tamanho de efeito e quais limitações?` },
      { k: "Para quem chega", q: "Estou chegando agora neste campo: quais conceitos, marcos e debates preciso conhecer primeiro, e por onde começo a ler?" },
      { k: "Regulação", q: hasReg ? "O que a regulação exige hoje neste tema, e quais normas recentes mudaram as obrigações?" : "Quais normas, diretrizes ou exigências legais tocam este tema?" },
      { k: "Quem acompanhar", q: "Quais pesquisadores, instituições e fontes de referência vale acompanhar neste tema, e por quê?" },
    ];
  }

  function model(d, today, lastVisit) {
    const items = allItems(d), series = buildSeries(d), ap = annualPair(d);
    return {
      d, today, items, series, triage: triage(d), annual: ap, until: untilOf(ap.a),
      takeaways: takeaways(d, series), deadlines: deadlines(d, today), radar: radarModel(series),
      since: sinceCounts(d, items, lastVisit), nMilestones: nMilestones(d), nReg: (d.regulation || []).length, works26: works(d),
      examples: askExamples(d),
    };
  }

  /* ---- search: same tokens and BM25 as web/app.js (and src/pawatch/searchindex.py) ---- */
  const STOP = new Set(("a o os as um uma uns umas de da do das dos em no na nos nas por para pra com sem sobre entre e ou que " +
    "qual quais quanto como onde quando porque se ser é são foi há ter tem mais menos muito muita isso isto esse essa este esta " +
    "eu você vocês nós ele ela eles elas me te lhe meu minha seu sua the of and or to in on for with by from at as is are was be " +
    "what which how why when does do did can could should would about into than that this these those it its an any some").split(" "));
  const fold = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const tokens = (text) => fold(text).split(/[^a-z0-9]+/).filter((t) => t.length > 2 && !STOP.has(t))
    .map((t) => (t.length > 4 && t.endsWith("s") ? t.slice(0, -1) : t));
  /* offline fallback (no search.json): the same documents, built from data.json — port of web/app.js localIndex */
  function localIndex(data) {
    const j = (...p) => p.map((x) => (x == null ? "" : String(x))).join(" ");
    const th = data.themes || {}, docs = [];
    for (const d of data.digests || []) {
      for (const it of d.items || []) docs.push({ kind: it.origin === "fonte" ? "notícia ou relatório" : "paper", title: it.title, url: it.url, when: d.date, venue: it.venue,
        text: j(it.title, it.original_title, it.summary, it.venue, (it.authors || []).join(" "), th[it.theme]) });
      for (const q of d.quick || []) docs.push({ kind: q.origin === "fonte" ? "notícia ou relatório" : "paper", title: q.title, url: q.url, when: d.date, venue: q.venue,
        text: j(q.title, q.original_title, q.note, q.venue) });
      if (d.trend) docs.push({ kind: "tendência", title: `Tendência de ${d.date}`, url: null, when: d.date, text: d.trend });
    }
    const ev = data.evolution;
    if (ev) {
      for (const e of ev.eras || []) {
        if (e.summary) docs.push({ kind: "fase da evolução", title: e.title, url: null, when: e.label || null, text: j(e.title, e.summary) });
        for (const m of e.milestones || []) docs.push({ kind: "marco", title: m.title, url: m.url, when: String(m.year || ""), venue: m.venue, text: j(m.title, m.why, (m.authors || []).join(" "), th[m.theme]) });
      }
      if (ev.now && ev.now.summary) docs.push({ kind: "evolução", title: "Onde estamos agora", url: null, when: ev.generated, text: [ev.now.summary, ...(ev.now.open_questions || [])].join(" ") });
    }
    for (const [y, a] of Object.entries(data.annual || {})) {
      const label = `retrospectiva ${y}${a.partial ? " (parcial)" : ""}`;
      if (a.overview) docs.push({ kind: label, title: `Panorama de ${y}`, url: null, when: y, text: a.overview });
      for (const t of a.trends || []) docs.push({ kind: label, title: t.title, url: null, when: y, text: `${t.title}. ${t.text}` });
      for (const h of a.highlights || []) docs.push({ kind: `destaque de ${y}`, title: h.title, url: h.url, when: (h.date || y).slice(0, 10), venue: h.venue, text: j(h.title, h.original_title, h.why, h.venue, (h.authors || []).join(" "), th[h.theme]) });
    }
    const WK = { researchers: "pessoa de referência", historical: "pessoa de referência (histórica)", journals: "revista ou evento de referência", centers: "instituição de referência", practitioners: "praticante de referência" };
    for (const [k, xs] of Object.entries(data.watchlist || {})) for (const w of Array.isArray(xs) ? xs : []) docs.push({ kind: WK[k] || "referência", title: w.name, url: w.url || null, when: null, text: j(w.name, w.institution, w.org, w.region, w.area, w.why) });
    for (const g of data.regulation || []) docs.push({ kind: `norma · ${g.regulator}${g.revoked ? " (revogada)" : ""}`, title: g.title, url: g.url, when: g.date,
      text: j(g.title, g.subject, g.summary, (g.requires || []).join(" "), g.applies_to, g.effective, (g.techniques || []).join(" "), g.status_note) });
    const len = [], postings = {};
    docs.forEach((d, i) => {
      const toks = tokens(d.text); len.push(toks.length);
      const tf = {}; for (const t of toks) tf[t] = (tf[t] || 0) + 1;
      for (const [t, f] of Object.entries(tf)) (postings[t] || (postings[t] = [])).push(i, f);
    });
    return { n: docs.length, avgdl: docs.length ? len.reduce((s, x) => s + x, 0) / docs.length : 1, docs, len, postings };
  }
  function searchIndex(ix, q, keys) {
    const weights = new Map();
    for (const t of tokens(q)) weights.set(t, 1);
    /* search as you type: the last, still incomplete word also matches longer terms that start with it */
    const lastRaw = /\s$/.test(q) ? "" : (fold(q).match(/([a-z0-9]+)$/) || ["", ""])[1];
    if (lastRaw.length >= 3) {
      let n = 0;
      for (const k of keys || Object.keys(ix.postings)) if (k !== lastRaw && k.startsWith(lastRaw) && !weights.has(k)) { weights.set(k, 0.7); if (++n >= 40) break; }
    }
    const scores = new Map();
    for (const [t, w] of weights) {
      const p = ix.postings[t]; if (!p) continue;
      const df = p.length / 2, idf = Math.log(1 + (ix.n - df + 0.5) / (df + 0.5));
      for (let j = 0; j < p.length; j += 2) { const i = p[j], f = p[j + 1]; scores.set(i, (scores.get(i) || 0) + w * idf * (f * 2.2) / (f + 1.2 * (0.25 + 0.75 * ix.len[i] / ix.avgdl))); }
    }
    return { terms: [...weights.keys()], hits: [...scores.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0]).slice(0, 80).map(([i, s]) => ({ ...ix.docs[i], score: s })) };
  }
  const SEARCH_GROUPS = [["paper", "Papers"], ["news", "Notícias e relatórios"], ["marco", "Marcos da evolução"], ["norma", "Normas e regulação"],
    ["pessoa", "Pessoas de referência"], ["inst", "Instituições, revistas e fontes"], ["codigo", "Código"], ["destaque", "Destaques do ano"],
    ["anual", "Retrospectivas"], ["tend", "Tendências dos digests"], ["evo", "Evolução"]];
  function kindGroup(k) {
    k = k || "";
    if (k === "paper" || k === "paper triado") return "paper";
    if (k === "notícia ou relatório") return "news";
    if (k === "marco") return "marco";
    if (k.startsWith("norma")) return "norma";
    if (k.startsWith("pessoa")) return "pessoa";
    if (k.startsWith("código")) return "codigo";
    if (/^(revista|instituição|praticante|referência)/.test(k)) return "inst";
    if (k.startsWith("destaque")) return "destaque";
    if (k.startsWith("retrospectiva")) return "anual";
    if (k === "tendência") return "tend";
    return "evo";
  }
  /* where a hit opens inside the Carta (external url first, like the current site) */
  function docLink(doc) {
    const g = kindGroup(doc.kind);
    if (doc.url) return { href: doc.url, ext: true };
    if (g === "tend" && doc.when) return { href: `#/novidades/${String(doc.when).slice(0, 10)}` };
    if (g === "anual" || g === "destaque") return { href: `#/anual/${String(doc.when || "").slice(0, 4)}` };
    if (g === "norma") return { href: `#/regulacao?q=${encodeURIComponent(doc.title || "")}` };
    if (g === "pessoa" || g === "inst") return { href: "#/pessoas" };
    return { href: "#/evolucao" };
  }

  const MODEL = { MES, dt, fmtD, fmtDY, fmtDM, fmtN, days, pct, addDays, todayIso, stripMark, sentences, whyOf, allItems, triage, digestsWithTrend, headlineOf, annualPair, untilOf, buildSeries, subName, termsOf, subStatus, matcher, takeaways, datesIn, parseDeadlines, deadlines, regSorted, radarModel, RINGS, RR, BAND, pol, subtopicFile, sinceCounts, firstVisitDate, nMilestones, works, topicSummary, crossSignals, askExamples, model, tokens, localIndex, searchIndex, kindGroup, docLink, SEARCH_GROUPS };
  if (typeof module !== "undefined" && module.exports) module.exports = MODEL;
  if (typeof document === "undefined") return;

  /* =====================================================================
     2. UI
     ===================================================================== */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  /* **bold** marks the key figure in summaries: Carta styles it as a chart highlight (.k) */
  const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<span class="k">$1</span>').replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g, "$1<em>$2</em>");
  const mdA = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g, "$1<em>$2</em>");
  const safeUrl = (u) => (/^https?:\/\//i.test(u || "") ? u : "#");

  /* storage: JSON values, every access guarded (same convention as web/app.js, so paw_voter is shared) */
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } },
  };
  const voterId = () => {
    let v = store.get("paw_voter", "");
    if (!v) { v = Math.random().toString(36).slice(2, 12); store.set("paw_voter", v); }
    return v;
  };
  const lvKey = (slug) => `carta_last_visit|${slug}`;

  function setTheme(t) {
    if (t === "auto") document.documentElement.removeAttribute("data-theme"); else document.documentElement.setAttribute("data-theme", t);
    try { localStorage.setItem("carta-theme", t); } catch { /* private mode */ }
  }
  const curTheme = () => document.documentElement.getAttribute("data-theme") || "auto";
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const route = () => { const h = location.hash.replace(/^#\/?/, ""); const i = h.indexOf("?"); const p = i >= 0 ? h.slice(0, i) : h; return { parts: p.split("/").filter(Boolean).map((x) => { try { return decodeURIComponent(x); } catch { return x; } }), q: new URLSearchParams(i >= 0 ? h.slice(i + 1) : "") }; };

  const app = $("#app"), sheet = $("#sheet"), tip = $("#tip");
  const ROOT = document.documentElement.hasAttribute("data-carta-root");
  let TOPICS = [];
  let DATA = null, M = null, TODAY = todayIso(), lastVisit = "", SLUG = "", TH = {}, cleanup = null, current = "";
  const ORIGIN = { arxiv: "arXiv", watchlist: "Watchlist", busca: "Busca", fonte: "Fonte", journal: "Journal" };
  const IC = {
    inicio: '<svg viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="11" cy="11" r="8"/><circle cx="11" cy="11" r="3.2"/><path d="M11 1v4M11 17v4M1 11h4M17 11h4"/></svg>',
    novidades: '<svg viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3 5h16M3 11h16M3 17h10"/><circle cx="18" cy="17" r="1.6" fill="currentColor" stroke="none"/></svg>',
    mapa: '<svg viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M11 11 17.5 4.5"/><path d="M3 11a8 8 0 1 0 8-8"/><path d="M6.5 11A4.5 4.5 0 1 0 11 6.5" stroke-dasharray="1.6 2"/><circle cx="11" cy="11" r="1.4" fill="currentColor" stroke="none"/></svg>',
    pergunte: '<svg viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3 4h16v11H9l-4 4v-4H3z"/><path d="M7 8h8M7 11h5"/></svg>',
    mais: '<svg viewBox="0 0 22 22" fill="currentColor"><rect x="3" y="9.5" width="3" height="3"/><rect x="9.5" y="9.5" width="3" height="3"/><rect x="16" y="9.5" width="3" height="3"/></svg>',
    mic: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="7" y="2.5" width="6" height="9.5" rx="3"/><path d="M4 9.5a6 6 0 0 0 12 0M10 15.5v3"/></svg>',
    stop: '<svg width="18" height="18" viewBox="0 0 18 18"><rect x="4" y="4" width="10" height="10" fill="currentColor"/></svg>',
    send: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 10h13M11 5l5 5-5 5"/></svg>',
    speaker: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M2.5 7v4h3l4 3.2V3.8L5.5 7z"/><path d="M12.2 6.3a3.5 3.5 0 0 1 0 5.4M14.3 4.2a6.5 6.5 0 0 1 0 9.6"/></svg>',
    close: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m4 4 10 10M14 4 4 14"/></svg>',
    up: '<svg viewBox="0 0 11 9" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 8 5 3l2 2 3-4"/></svg>',
    flat: '<svg viewBox="0 0 11 9" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 5h9"/></svg>',
    down: '<svg viewBox="0 0 11 9" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 2c4 0 5 5 9 5"/></svg>',
  };
  const NAV = [["inicio", "#/", "Início"], ["novidades", "#/novidades", "Novidades"], ["mapa", "#/mapa", "Mapa"], ["pergunte", "#/pergunte", "Pergunte"], ["mais", "", "Mais"]];
  const plate = (cls, title, code, body, extra = "") => `<section class="plate ${cls}"><div class="lg"><h2>${title}</h2><span class="mono code${extra ? "" : " pc"}">${extra || code}</span></div>${body}</section>`;
  const stIcon = (k) => (k === "acel" || k === "alta" || k === "cresce" ? IC.up : k === "esfria" ? IC.down : IC.flat);
  const isNew = (iso) => iso > lastVisit;
  const askOn = () => DATA && !DATA.offline && /^https?:$/.test(location.protocol);
  const seriesAt = (i) => M.series.find((s) => s.i === +i);
  const ytdLabel = () => (M.until ? `até ${M.until}` : "no ano");

  /* ---------- charts ---------- */
  function spark(s, w = 92, h = 30) {
    const raw = s.pts, p = raw.map((v, i) => (v == null ? (i === 0 ? (raw[1] != null ? raw[1] : 0) : raw[i - 1] || 0) : v));
    const max = Math.max(...p, s.ytd || 0) || 1;
    const X = [5, w / 2, w - 7], Y = (v) => +(h - 5 - (v / max) * (h - 11)).toFixed(1);
    const has0 = raw[0] != null;
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(s.name)}: ${has0 ? fmtN(raw[0]) + " publicações em 2024, " : ""}${fmtN(p[1])} em 2025, ${fmtN(p[2])} projetadas para 2026">
      <line class="base" x1="0" y1="${h - 3.5}" x2="${w}" y2="${h - 3.5}"/>
      ${has0 ? `<polyline class="ln" points="${X[0]},${Y(p[0])} ${X[1]},${Y(p[1])}"/>` : ""}
      <line class="ln proj" x1="${X[1]}" y1="${Y(p[1])}" x2="${X[2]}" y2="${Y(p[2])}"/>
      ${has0 ? `<circle class="pt" cx="${X[0]}" cy="${Y(p[0])}" r="2"/>` : ""}<circle class="pt" cx="${X[1]}" cy="${Y(p[1])}" r="2"/>
      ${s.ytd ? `<line class="ytd" x1="${X[2] - 4}" x2="${X[2] + 4}" y1="${Y(s.ytd)}" y2="${Y(s.ytd)}"/>` : ""}
      <circle class="end" cx="${X[2]}" cy="${Y(p[2])}" r="3"/></svg>`;
  }
  const RMID = [30, 74, 108, 138];
  const arc = (r, a0, a1, cw) => { const [x0, y0] = pol(r, a0), [x1, y1] = pol(r, a1); return `M${x0} ${y0}A${r} ${r} 0 0 ${cw ? 1 : 0} ${x1} ${y1}`; };
  const blipCls = (b) => (b.ring === 0 ? "novo" : b.ring === 1 ? "sobe" : "");
  function radarSVG(o = {}) {
    const uid = o.uid || "r", R = M.radar;
    let s = `<svg class="radar ${o.cls || ""}" viewBox="-180 -180 360 360" role="img" aria-label="Radar dos subtemas: ${R.blips.length} subtemas em quatro anéis, de Acelerando no centro a Estável ou esfriando na borda"><defs>
      <linearGradient id="${uid}g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="var(--mag)" stop-opacity="0"/><stop offset="1" stop-color="var(--mag)" stop-opacity=".28"/></linearGradient>`;
    R.quads.forEach((q, i) => { const top = i === 0 || i === 3; s += `<path id="${uid}q${i}" d="${top ? arc(160, i * 90 + 6, i * 90 + 84, true) : arc(169, i * 90 + 84, i * 90 + 6, false)}"/>`; });
    s += `</defs>`;
    for (let i = 3; i >= 1; i--) s += `<path class="band" data-band="${i}" d="M0 ${-RR[i]}A${RR[i]} ${RR[i]} 0 1 1 -.01 ${-RR[i]}ZM0 ${-RR[i - 1]}A${RR[i - 1]} ${RR[i - 1]} 0 1 0 .01 ${-RR[i - 1]}Z" fill-rule="evenodd"/>`;
    s += `<circle class="band" data-band="0" r="${RR[0]}"/><circle class="disc" r="${RR[0]}"/>`;
    RR.forEach((r) => { s += `<circle class="ring" r="${r}"/>`; });
    s += `<line class="ax" x1="0" y1="${-RR[3]}" x2="0" y2="${RR[3]}"/><line class="ax" x1="${-RR[3]}" y1="0" x2="${RR[3]}" y2="0"/>`;
    for (let a = 0; a < 360; a += 10) { const l = a % 30 === 0 ? 5 : 2.5; const [x0, y0] = pol(RR[3], a), [x1, y1] = pol(RR[3] + l, a); s += `<line class="tk" x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}"/>`; }
    if (!o.mini) {
      R.quads.forEach((q, i) => { s += `<text class="ql"><textPath href="#${uid}q${i}" startOffset="50%" text-anchor="middle">${esc(q.l)}</textPath></text>`; });
      s += `<text class="rl" x="0" y="3" text-anchor="middle">Acelerando</text><text class="rl" x="0" y="${-RMID[1] + 2}" text-anchor="middle">Em alta</text><text class="rl" x="0" y="${-RMID[2] + 2}" text-anchor="middle">Crescendo</text><text class="rl" x="0" y="${-RMID[3] + 2}" text-anchor="middle">Estável/esfria</text>`;
    }
    s += `<g class="sweep"><path d="M0 0L0 ${-RR[3]}A${RR[3]} ${RR[3]} 0 0 0 ${pol(RR[3], -38)[0]} ${pol(RR[3], -38)[1]}Z" fill="url(#${uid}g)"/><line x1="0" y1="0" x2="0" y2="${-RR[3]}" stroke="var(--mag)" stroke-width="1.2"/></g>`;
    R.blips.forEach((b) => {
      const cls = blipCls(b);
      if (o.mini && o.only !== b.id) { s += `<circle cx="${b.x}" cy="${b.y}" r="3" fill="var(--ink3)" opacity=".5"/>`; return; }
      s += `<g class="blip ${cls} ${o.only === b.id ? "sel" : ""}" data-blip="${b.id}" style="--a:${b.a.toFixed(0)}" role="button" tabindex="0" aria-label="${b.id}. ${esc(b.s.name)}, ${RINGS[b.ring].l}">
        ${b.ring === 0 ? `<circle class="halo" cx="${b.x}" cy="${b.y}" r="12"/>` : ""}<circle class="selr" cx="${b.x}" cy="${b.y}" r="15"/>
        <circle cx="${b.x}" cy="${b.y}" r="17" fill="transparent"/><circle class="b" cx="${b.x}" cy="${b.y}" r="8.5"/><text x="${b.x}" y="${b.y + 3.3}">${b.id}</text></g>`;
    });
    return s + `</svg>`;
  }
  const blipBy = (id) => M.radar.blips.find((b) => b.id === +id);
  const stTag = (s) => s.st.k === "acel" ? '<span class="tag new">Acelerando</span>' : s.st.k === "alta" ? '<span class="tag fill">Em alta</span>' : s.st.k === "esfria" ? '<span class="tag amber">Esfriando</span>' : `<span class="tag soft">${esc(s.st.l)}</span>`;
  const numbers = (s) => `${s.y24 != null ? `2024: ${fmtN(s.y24)} · ` : ""}2025: ${fmtN(s.y25)} · 2026 ${ytdLabel()}: ${fmtN(s.ytd)}${s.y26 !== s.ytd ? ` (projeção ${fmtN(s.y26)})` : ""}`;
  const paceText = (s) => `Ritmo de ${pct(s.ch)} em 2026${s.ch25 != null ? `, contra ${pct(s.ch25)} em 2025` : ""}.`;
  function readout(b) {
    const q = M.radar.quads[b.q], s = b.s;
    return `<div class="hd"><span class="tag">${String(b.id).padStart(2, "0")} · ${RINGS[b.ring].l}</span><span class="tag soft">${esc(q.l)}</span>${stTag(s)}</div>
      <h3>${esc(s.name)}</h3><p>${esc(numbers(s))}. ${esc(paceText(s))}</p><a class="go" href="#/subtema/${b.id}">Abrir ficha</a>`;
  }
  function radarBlock(sel, withList) {
    const R = M.radar, counts = RINGS.map((r, i) => R.blips.filter((b) => b.ring === i).length);
    return `<div class="radar-box" data-radar>
      ${radarSVG({ uid: "h" })}
      <div class="rings-ctl" role="group" aria-label="Filtrar por anel">${RINGS.map((r, i) => `<button data-ring="${i}" aria-pressed="false"><b>${counts[i]}</b>${r.l}</button>`).join("")}</div>
      <div class="readout" aria-live="polite" data-readout>${readout(blipBy(sel))}</div>
      ${withList ? `<ul class="rlist" data-rlist></ul>` : ""}
      <div class="legend mono"><span><i class="novo"></i>acelerando</span><span><i class="sobe"></i>em alta</span><span><i></i>demais</span></div>
      <p class="note">Posições calculadas: o anel é a situação do subtema (ritmo de 2026 contra o de 2025) e o quadrante é a faixa de volume anual projetado. Contagens do OpenAlex na retrospectiva ${M.annual.year || ""}.</p>
    </div>`;
  }
  function bindRadar(root, sel, listAll) {
    const box = $("[data-radar]", root); if (!box) return;
    const svg = $(".radar", box), ro = $("[data-readout]", box), list = $("[data-rlist]", box), B = M.radar.blips;
    let ring = null, cur = sel;
    const paint = () => {
      $$(".blip", svg).forEach((g) => { const b = blipBy(g.dataset.blip); g.classList.toggle("sel", b.id === cur); g.classList.toggle("dim", ring != null && b.ring !== ring); });
      $$(".band", svg).forEach((x) => x.classList.toggle("on", ring != null && +x.dataset.band === ring));
      $$("[data-ring]", box).forEach((x) => x.setAttribute("aria-pressed", String(+x.dataset.ring === ring)));
      ro.innerHTML = readout(blipBy(cur));
      if (list) list.innerHTML = B.filter((b) => (ring == null ? listAll : b.ring === ring)).map((b) => `<li><button data-pick="${b.id}"><span class="n ${blipCls(b)}">${b.id}</span><span>${esc(b.s.name)}</span><span class="tag soft">${pct(b.s.ch)}</span></button></li>`).join("");
    };
    box.addEventListener("click", (e) => {
      const g = e.target.closest("[data-blip]"), r = e.target.closest("[data-ring]"), p = e.target.closest("[data-pick]");
      if (g) { cur = +g.dataset.blip; paint(); }
      if (p) { cur = +p.dataset.pick; paint(); ro.scrollIntoView({ block: "nearest", behavior: reduced() ? "auto" : "smooth" }); }
      if (r) {
        const k = +r.dataset.ring, first = B.find((b) => b.ring === k);
        if (!first) return;
        ring = ring === k ? null : k;
        if (ring != null && blipBy(cur).ring !== ring) cur = first.id;
        paint();
      }
    });
    box.addEventListener("keydown", (e) => { const g = e.target.closest("[data-blip]"); if (g && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); cur = +g.dataset.blip; paint(); } });
    paint();
    if (!reduced() && "IntersectionObserver" in window) {
      const io = new IntersectionObserver((en) => { if (en[0].isIntersecting) { svg.classList.add("run"); io.disconnect(); } }, { threshold: 0.35 });
      io.observe(svg);
    }
  }

  /* ---------- item card ---------- */
  function itemCard(i, open) {
    const tks = Array.from({ length: 10 }, (_, k) => `<i class="${k < i.s ? "on" : ""}"></i>`).join("");
    const tags = `<span class="tag">${esc(TH[i.th] || i.th)}</span>${i.wa.length && i.o === "watchlist" ? "" : i.o ? `<span class="tag soft">${esc(ORIGIN[i.o] || i.o)}</span>` : ""}${i.wa.length ? `<span class="tag fill">Watchlist · ${esc(i.wa[0])}</span>` : ""}${isNew(i.dg) ? '<span class="tag new">Novo</span>' : ""}`;
    const meta = `${esc(i.v)}${i.d ? " · " + (i.dg ? fmtD(i.d) : fmtDY(i.d)) : ""}${i.au.length ? " · " + esc(i.au[0]) + (i.au.length > 1 ? " et al." : "") : ""}${i.cited != null ? ` · ${fmtN(i.cited)} citações` : ""}`;
    if (i.kind === "quick") return `<article class="it q"><div class="sc" aria-label="Nota ${i.s} de 10"><b>${i.s}</b><small>NOTA</small></div><div>
      <div class="tags">${tags}<span class="tag soft">Nota rápida</span></div><h3><a href="${esc(safeUrl(i.u))}" target="_blank" rel="noopener">${esc(i.t)}</a></h3>${i.why ? `<p class="why">${md(i.why)}</p>` : ""}<p class="meta">${meta}</p></div></article>`;
    return `<article class="it ${open ? "open" : ""}"><div class="sc" aria-label="Nota ${i.s} de 10"><b>${i.s}</b><div class="tks" aria-hidden="true">${tks}</div><small>DE 10</small></div><div>
      <div class="tags">${tags}</div><h3>${esc(i.t)}</h3>
      <p class="why"><span class="mono">Por que importa</span>${md(i.why)}</p>
      <div class="sum"><div><p>${md(i.sum)}</p>${i.ot ? `<p class="ot">Título original: ${esc(i.ot)}</p>` : ""}</div></div>
      <p class="meta">${meta}</p>
      <div class="act"><button class="tg" data-toggle aria-expanded="${open ? "true" : "false"}">Resumo</button>${i.u ? `<a class="lnk" href="${esc(safeUrl(i.u))}" target="_blank" rel="noopener">Abrir fonte</a>` : ""}</div></div></article>`;
  }
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-toggle]"); if (t) { const c = t.closest(".it"); const on = c.classList.toggle("open"); t.setAttribute("aria-expanded", String(on)); }
    const o = e.target.closest("[data-open]"); if (o) { const box = o.closest(o.dataset.open); if (box) box.classList.toggle("open"); }
  });

  /* ---------- home ---------- */
  function sinceStrip() {
    const c = M.since, nx = M.deadlines.next[0], first = !store.get(lvKey(SLUG), null);
    if (lastVisit >= TODAY) return `<section class="since done"><div class="hd mono"><span>Em dia · última visita hoje, ${fmtD(TODAY)}</span><button data-lv="${firstVisitDate(DATA)}">Ver de novo os ${M.triage.length} digests</button></div></section>`;
    return `<section class="since" aria-label="Desde sua última visita"><div class="hd mono"><span>${first ? `Primeira visita · desde ${fmtD(addDays(lastVisit, 1))}` : `Desde ${fmtD(lastVisit)}`}</span><button data-lv="${TODAY}">Marcar como visto</button></div>
      <div class="cells"><a href="#/novidades"><b>${c.full}</b><span>${c.full === 1 ? "destaque novo" : "destaques novos"}</span></a><a href="#/novidades"><b>${c.quick}</b><span>${c.quick === 1 ? "nota rápida" : "notas rápidas"}</span></a><a href="#/mapa"><b>${c.ms}</b><span>marcos na Evolução</span></a>
      ${nx ? `<a class="dl" href="#dl"><b>${nx.left} d</b><span>para o próximo prazo</span></a>` : `<a href="#dl"><b>${c.regs}</b><span>${c.regs === 1 ? "norma nova" : "normas novas"}</span></a>`}</div></section>`;
  }
  function deadlineAxis() {
    const D = M.deadlines;
    const nextLast = D.next.length ? D.next[Math.min(D.next.length, 6) - 1].d : TODAY;
    let a = addDays(TODAY, -45), b = nextLast > addDays(TODAY, 45) ? addDays(nextLast, 20) : addDays(TODAY, 50);
    const shown = D.all.filter((x) => x.d >= a && x.d <= b);
    const span = days(a, b), W = 340, X = (iso) => +(8 + (days(a, iso) / span) * (W - 16)).toFixed(1);
    let s = `<svg class="axis" viewBox="0 0 ${W} 64" role="img" aria-label="Linha do tempo de prazos: ${esc(shown.map((x) => fmtDY(x.d)).join(", "))}"><line class="ln" x1="0" x2="${W}" y1="38" y2="38"/>`;
    const step = span > 300 ? 3 : span > 160 ? 2 : 1;
    const m0 = dt(a); m0.setDate(1); m0.setMonth(m0.getMonth() + 1);
    for (let k = 0; ; k += step) {
      const m = new Date(m0); m.setMonth(m0.getMonth() + k); const iso = isoOf(m); if (iso > b) break;
      const l = MES[m.getMonth()] + (m.getMonth() === 0 || k === 0 ? " " + String(m.getFullYear()).slice(2) : "");
      s += `<line class="mt" x1="${X(iso)}" x2="${X(iso)}" y1="34" y2="42"/><text x="${X(iso) + 4}" y="56">${l}</text>`;
    }
    const up = shown.filter((x) => x.left >= 0);
    if (up.length) s += `<line class="span" x1="${X(TODAY)}" x2="${X(up[up.length - 1].d)}" y1="38" y2="38"/>`;
    s += `<line class="today" x1="${X(TODAY)}" x2="${X(TODAY)}" y1="14" y2="46"/><text class="today-t" x="${X(TODAY) - 4}" y="11" text-anchor="end">hoje ${fmtD(TODAY)}</text>`;
    let lastT = -99;
    shown.forEach((x) => {
      const past = x.left < 0, cx = X(x.d);
      s += `<circle class="dl ${past ? "past" : ""}" cx="${cx}" cy="38" r="5.5" data-tip="${esc(x.r.title)} · ${fmtDY(x.d)} · ${esc(x.l)}"/>`;
      if (!past && cx - lastT > 26) { s += `<text class="dl-t" x="${cx}" y="26" text-anchor="middle">D−${x.left}</text>`; lastT = cx; }
    });
    return s + `</svg>`;
  }
  function deadlineList() {
    const D = M.deadlines, up = D.next.slice(0, 6).concat(D.all.filter((x) => x.left < 0).reverse().slice(0, 1));
    return `<ol class="dls">${up.map((x) => { const past = x.left < 0, r = x.r, s0 = String(r.summary || r.subject || "").split(". ")[0]; return `<li><div class="hd"><div class="cd ${past ? "past" : ""}"><b>${past ? Math.abs(x.left) : x.left}</b><span>${past ? "dias atrás" : "dias"}</span></div>
      <div><h3>${esc(r.title)}</h3><p class="what"><b>${fmtDY(x.d)}</b> · ${esc(x.l)}.${s0 ? ` ${esc(s0.replace(/\.$/, ""))}.` : ""}</p>${(r.requires || []).length ? `<button class="lnk" data-open="li">O que exige</button>` : r.url ? `<a class="lnk" href="${esc(safeUrl(r.url))}" target="_blank" rel="noopener">Abrir a norma</a>` : ""}</div></div>
      <ul class="req">${(r.requires || []).slice(0, 3).map((q) => `<li>${esc(q)}</li>`).join("")}${r.url ? `<li><a href="${esc(safeUrl(r.url))}" target="_blank" rel="noopener">Texto da norma</a></li>` : ""}</ul></li>`; }).join("")}</ol>`;
  }
  function latestRegs() {
    const rs = regSorted(DATA).slice(0, 3);
    return `<ul class="kv">${rs.map((r) => `<li><b>${esc(r.title)} <span class="tag soft" style="vertical-align:2px">${fmtDY(r.date)}</span></b><span>${esc(String(r.summary || "").split(". ")[0].replace(/\.$/, ""))}.</span></li>`).join("")}</ul>`;
  }
  function sounding(rows) {
    return rows.map((s) => `<li><button class="r" data-open="li" data-tip="${s.y24 != null ? `2024: ${fmtN(s.y24)} · ` : ""}2025: ${fmtN(s.y25)} · 2026 ${ytdLabel()}: ${fmtN(s.ytd)} · projeção: ${fmtN(s.y26)}">
      <span class="n">${esc(s.name)}</span><span class="t st ${s.st.k}">${stIcon(s.st.k)}${s.st.l}</span><span class="s">${spark(s)}</span><span class="v">${pct(s.ch)}<small>${fmtN(s.y26)}/ano</small></span></button>
      <div class="x"><div class="xg"><div><b>${fmtN(s.y24)}</b><span>2024</span></div><div><b>${fmtN(s.y25)}</b><span>2025</span></div><div><b>${fmtN(s.ytd)}</b><span>${esc(ytdLabel())}</span></div><div><b>${fmtN(s.y26)}</b><span>proj. 2026</span></div></div>
      ${pace(s)}<a class="go" href="#/subtema/${s.i}">Abrir ficha</a></div></li>`).join("");
  }
  function pace(s) {
    const top = Math.max(2.4, ...M.series.map((x) => Math.max(x.ch || 0, x.ch25 || 0)).filter((v) => v < 10));
    const w = (v) => Math.max(0, Math.min(100, (v || 0) / top * 100)).toFixed(0);
    return `<div class="pace">${s.ch25 != null ? `<span>Ritmo 2025</span><i style="width:${w(s.ch25)}%"></i><b>${pct(s.ch25)}</b>` : ""}<span>Ritmo 2026</span><i class="cur" style="width:${w(s.ch)}%"></i><b>${pct(s.ch)}</b></div>`;
  }
  const hiNum = (t) => esc(t).replace(/\(([+−-]\d+(?:[.,]\d+)?%)/g, '(<span class="k">$1</span>');

  function viewHome() {
    const ev = DATA.evolution || {}, now = ev.now || {}, summary = now.summary || "";
    const s0 = summary.split(/(?<=\.)\s/)[0], ci = s0.indexOf(":");
    const cut = ci > 20 && ci < 110;
    const first = cut ? s0.slice(0, ci) + "." : s0, rest = (cut ? s0.slice(ci + 1).trim().replace(/^./, (c) => c.toUpperCase()) + " " : "") + summary.slice(s0.length).trim();
    const oqs = now.open_questions || [];
    const best = M.items.filter((i) => i.kind === "full").sort((a, b) => b.s - a.s || (a.dg < b.dg ? 1 : -1)).slice(0, 3);
    const S = M.series, tri = M.triage;
    let sf = "todos", all = false;
    const wide = matchMedia("(min-width:1000px)").matches;
    const rowsFor = () => { const r = S.filter((s) => sf === "todos" || s.st.k === sf); return all || sf !== "todos" ? r : r.slice(0, wide ? 9 : 6); };
    const stCount = (k) => S.filter((s) => s.st.k === k).length;
    const sel = M.radar.blips.length ? M.radar.blips[0].id : null;
    const ask = M.examples[0];
    const hasDl = M.deadlines.next.length > 0;
    const period = tri.length ? `${fmtD(tri[0].d)}–${fmtD(tri[tri.length - 1].d)}` : "";
    app.innerHTML = `<div class="home enter anim">
      ${sinceStrip()}
      <div class="colL">${summary ? plate("p-state", "Estado do campo", "A1", `<div data-st><p class="lead">${esc(first)}</p>${rest ? `<p class="more-t">${esc(rest)}</p><button class="lnk" data-open="[data-st]">Ler a síntese inteira</button>` : ""}</div>
        ${oqs.length ? `<p class="mono" style="color:var(--ink3);margin-top:10px">Questões em aberto · ${oqs.length}</p>
        <ol class="oq">${oqs.map((q, i) => `<li><span class="mono">Q${i + 1}</span><span>${esc(q)}</span></li>`).join("")}</ol>
        ${oqs.length > 2 ? `<button class="lnk" data-oq>Ver as ${oqs.length} questões</button>` : ""}` : ""}`) : ""}
      ${M.takeaways.length ? plate("p-take", `${M.annual.year} em ${M.takeaways.length === 5 ? "cinco" : M.takeaways.length} ${M.takeaways.length === 1 ? "conclusão" : "conclusões"}`, "A3", `<ol class="tk-l">${M.takeaways.map((t, i) => `<li><span class="num">${i + 1}</span><div><button class="t" data-open="li"><h3>${esc(t.title)}</h3><p>${hiNum(t.text)}</p></button>
        ${t.s ? `<div class="row2">${spark(t.s, 72, 24)}<span class="mono">${esc(t.s.name)} ${pct(t.s.ch)}</span></div>` : ""}</div></li>`).join("")}</ol><p class="note">Retrospectiva ${M.until ? `parcial, até ${M.until}` : "do ano"}. Contagens do OpenAlex.</p>`) : ""}
      ${S.length ? plate("p-snd", "Subtemas · publicações por ano", "A4", `<div class="chips" role="group" aria-label="Filtrar por situação">
        ${[["todos", "Todos", S.length], ["acel", "Acelerando", stCount("acel")], ["alta", "Em alta", stCount("alta")], ["esfria", "Esfriando", stCount("esfria")]].filter(([k, , n]) => k === "todos" || n).map(([k, l, n]) => `<button class="chip" data-sf="${k}" aria-pressed="${k === "todos"}">${l} <small>${n}</small></button>`).join("")}</div>
        <ul class="snd" data-snd></ul><button class="lnk" data-all>Mostrar os ${S.length} subtemas</button>
        <p class="note">Série de três pontos: 2024, 2025 e 2026 projetado (tracejado) a partir da contagem ${esc(ytdLabel())}, marcada em magenta. A situação compara o ritmo de 2026 com o de 2025.</p>`) : ""}
      </div><div class="colR">${sel ? plate("p-radar", "Radar dos subtemas", "", radarBlock(sel, wide), '<span class="mono">Calculado</span>') : ""}
      ${hasDl ? plate("p-dl", "Avisos · prazos regulatórios", "A5", `<div id="dl">${deadlineAxis()}${deadlineList()}</div><p class="note">${M.nReg} normas no arquivo. Datas lidas automaticamente do campo de vigência de cada norma; confira no texto oficial.</p>`)
        : M.nReg ? plate("p-dl", "Regulação · últimas normas", "A5", `<div id="dl">${latestRegs()}</div><p class="note">${M.nReg} ${M.nReg === 1 ? "norma" : "normas"} no arquivo, nenhuma com prazo futuro no texto de vigência.</p>`) : ""}
      </div>${best.length ? plate("p-best", "Melhores do período", "A6", `<div class="best">${best.map((i) => itemCard(i)).join("")}</div><a class="go" href="#/novidades">Ver todas as novidades</a>`, period ? `<span class="mono">${period}</span>` : "") : ""}
      <a class="cta" href="#/pergunte?q=${encodeURIComponent(ask.q)}"><span><span class="mono" style="opacity:.7">Pergunte ao arquivo</span><br><b>“${esc(ask.q)}”</b></span><span class="go">Perguntar</span></a>
    </div>`;
    const paintS = () => { const ul = $("[data-snd]"); if (!ul) return; ul.innerHTML = sounding(rowsFor()); $("[data-all]").hidden = all || sf !== "todos" || S.length <= (wide ? 9 : 6); };
    paintS();
    function homeClick(e) {
      const f = e.target.closest("[data-sf]"); if (f) { sf = f.dataset.sf; $$("[data-sf]").forEach((x) => x.setAttribute("aria-pressed", String(x === f))); paintS(); }
      if (e.target.closest("[data-all]")) { all = true; paintS(); }
      const oq = e.target.closest("[data-oq]"); if (oq) { $(".oq").classList.add("all"); oq.hidden = true; }
      const lv = e.target.closest("[data-lv]"); if (lv) { setLastVisit(lv.dataset.lv); app.removeEventListener("click", homeClick); viewHome(); }
    }
    app.addEventListener("click", homeClick);
    cleanup = () => app.removeEventListener("click", homeClick);
    if (sel) bindRadar(app, sel, wide);
  }
  function setLastVisit(iso) {
    lastVisit = iso;
    store.set(lvKey(SLUG), iso);
    M.since = sinceCounts(DATA, M.items, lastVisit);
  }

  /* ---------- feed ---------- */
  const FS = { themes: new Set(), origins: new Set(), min: 6, kind: "todos", day: null };
  let FLOOR = 6;
  function viewFeed(day) {
    if (day && M.triage.some((t) => t.d === day)) FS.day = day;
    const tri = M.triage, items = M.items, maxC = Math.max(1, ...tri.map((t) => t.c)), totC = tri.reduce((a, t) => a + t.c, 0);
    const nF = items.filter((i) => i.kind === "full").length, nQ = items.length - nF;
    const active = () => FS.themes.size + FS.origins.size + (FS.min > FLOOR ? 1 : 0) + (FS.kind !== "todos" ? 1 : 0);
    const filt = () => items.filter((i) => (!FS.day || i.dg === FS.day) && (!FS.themes.size || FS.themes.has(i.th)) && (!FS.origins.size || FS.origins.has(i.o)) && i.s >= FS.min && (FS.kind === "todos" || i.kind === FS.kind));
    const origins = Array.from(new Set(items.map((i) => i.o).filter(Boolean)));
    const mins = Array.from(new Set([FLOOR, 7, 8])).filter((n) => n >= FLOOR);
    const filters = () => `<fieldset class="fset"><legend class="mono">Tema</legend><div class="fopts">${Object.keys(TH).map((k) => { const n = items.filter((i) => i.th === k).length; return n ? `<button class="chip" data-f="themes" data-v="${esc(k)}" aria-pressed="${FS.themes.has(k)}">${esc(TH[k])} <small>${n}</small></button>` : ""; }).join("")}</div></fieldset>
      <fieldset class="fset"><legend class="mono">Origem</legend><div class="fopts">${origins.map((k) => `<button class="chip" data-f="origins" data-v="${esc(k)}" aria-pressed="${FS.origins.has(k)}">${esc(ORIGIN[k] || k)}</button>`).join("")}</div></fieldset>
      <fieldset class="fset"><legend class="mono">Nota mínima</legend><div class="fopts">${mins.map((n) => `<button class="chip" data-f="min" data-v="${n}" aria-pressed="${FS.min === n}">${n}+</button>`).join("")}</div></fieldset>
      <fieldset class="fset"><legend class="mono">Tipo</legend><div class="fopts">${[["todos", "Tudo"], ["full", "Destaques"], ["quick", "Notas rápidas"]].map(([k, l]) => `<button class="chip" data-f="kind" data-v="${k}" aria-pressed="${FS.kind === k}">${l}</button>`).join("")}</div></fieldset>`;
    const list = () => {
      const its = filt();
      if (!its.length) {
        const day = FS.day && tri.find((t) => t.d === FS.day);
        return `<p class="empty">Nenhum item com esses filtros${FS.day ? ` em ${fmtD(FS.day)}` : ""}.${day && !active() ? ` O digest desse dia leu ${fmtN(day.c)} candidatos e nenhum passou no corte.` : ""}</p>`;
      }
      let h = "";
      (DATA.digests || []).forEach((d) => { const g = its.filter((i) => i.dg === d.date); if (!g.length) return;
        g.sort((a, b) => (a.kind === b.kind ? b.s - a.s : a.kind === "full" ? -1 : 1));
        h += `<div class="dgh"><b>${fmtD(d.date)}</b><span>${esc(ucFirst(d.headline || ""))}</span></div>${g.map((i) => itemCard(i)).join("")}`; });
      return h;
    };
    const withTrend = digestsWithTrend(DATA);
    const trendOf = () => (FS.day && withTrend.find((x) => x.date === FS.day)) || withTrend[0];
    const trend = () => { const d = trendOf(); return d ? `<div class="trend" data-tr><h3>${esc(ucFirst(d.headline))}</h3><p>${esc(d.trend)}</p><button class="lnk" data-open="[data-tr]">Ler a tendência inteira</button></div>` : ""; };
    app.innerHTML = `<h1 class="pg">Novidades</h1><p class="sub">${tri.length ? `${fmtD(tri[0].d)} a ${fmtDY(tri[tri.length - 1].d)}. ` : ""}O pipeline leu <b>${fmtN(totC)}</b> candidatos em ${tri.length} digests e guardou <b>${nF}</b> ${nF === 1 ? "destaque" : "destaques"} e <b>${nQ}</b> ${nQ === 1 ? "nota rápida" : "notas rápidas"}.</p>
      <div class="tape" style="--n:${tri.length || 1}" role="group" aria-label="Triagem por dia: toque para filtrar">${tri.map((t) => `<button data-day="${t.d}" aria-pressed="false" class="${t.s + t.q ? "" : "zero"}" data-tip="${fmtD(t.d)} · ${fmtN(t.c)} candidatos · ${t.s} destaques · ${t.q} notas"><span class="bar"><span class="sel" style="bottom:${(t.c / maxC * 100).toFixed(0)}%;margin-bottom:3px">${t.s + t.q || "·"}</span><i style="height:${(t.c / maxC * 100).toFixed(0)}%"></i></span><span class="d">${dt(t.d).getDate()}/${dt(t.d).getMonth() + 1}</span></button>`).join("")}</div>
      <p class="note" style="margin-top:6px">Barras: candidatos lidos por dia. Número: itens que passaram no corte.</p>
      <div class="feed-l"><aside class="rail" data-filters>${filters()}</aside><div>
      ${withTrend.length ? plate("", "Tendência do período", "", `<div data-trend>${trend()}</div>`, `<span data-trd>${fmtD(trendOf().date)}</span>`) : ""}
      <div class="fbar"><button class="btn filt" data-sheet="filters">Filtros <span class="cnt" data-cnt hidden></span></button><span class="mono fcount" data-fcount></span></div>
      <div data-list></div></div></div>`;
    const paint = () => {
      $("[data-list]").innerHTML = list(); const n = active(); const c = $("[data-cnt]"); c.hidden = !n; c.textContent = n;
      $("[data-fcount]").textContent = `${filt().length} de ${items.length} itens${FS.day ? " · " + fmtD(FS.day) : ""}`;
      $$("[data-day]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.day === FS.day)));
      const tr = $("[data-trend]"); if (tr) { tr.innerHTML = trend(); $("[data-trd]").textContent = fmtD(trendOf().date); }
    };
    const onF = (e) => {
      const b = e.target.closest("[data-f]"); if (!b) return false; const k = b.dataset.f, v = b.dataset.v;
      if (k === "min") FS.min = FS.min === +v ? FLOOR : +v; else if (k === "kind") FS.kind = v; else (FS[k].has(v) ? FS[k].delete(v) : FS[k].add(v));
      $$("[data-filters]").forEach((x) => { x.innerHTML = filters(); }); paint(); return true;
    };
    const click = (e) => {
      if (onF(e)) return;
      const d = e.target.closest("[data-day]"); if (d) { FS.day = FS.day === d.dataset.day ? null : d.dataset.day; paint(); }
      if (e.target.closest('[data-sheet="filters"]')) openSheet("Filtros", `<div data-filters>${filters()}</div><button class="btn pri" style="width:100%;justify-content:center" data-close>Ver itens</button>`, onF);
    };
    app.addEventListener("click", click); cleanup = () => app.removeEventListener("click", click);
    paint();
  }

  /* ---------- map ---------- */
  function viewMap() {
    const ev = DATA.evolution || {}, eras = ev.eras || [], sel = M.radar.blips.length ? M.radar.blips[0].id : null;
    const foc = String((DATA.topic || {}).focus || "").replace(/^(a|o|as|os) /, "");
    const month = M.annual.a && M.annual.a.generated ? `${MES[dt(M.annual.a.generated).getMonth()]} ${dt(M.annual.a.generated).getFullYear()}` : "";
    app.innerHTML = `<h1 class="pg">Mapa</h1><p class="sub">${foc ? `Os subtemas de ${esc(foc)}: ` : ""}o anel mostra o ritmo de crescimento, o quadrante mostra o volume anual. Toque num subtema para ler os números e abrir a ficha.</p>
      <div class="tech"><div>${sel ? plate("", `Radar${month ? " · " + month : ""}`, "", radarBlock(sel, true), '<span class="mono">Calculado</span>') : `<p class="empty">Este tema ainda não tem retrospectiva anual com subtemas.</p>`}</div>
      <aside>${eras.length ? plate("", "Evolução do campo", "B2", `<ol class="tl">${eras.map((e) => { const ms = e.milestones || [], nn = ms.filter((m) => m.new).length; return `<li><span class="d">${esc(e.label)}</span><span class="dot"></span><span><b>${esc(e.title)}</b><span class="n">${ms.length} ${ms.length === 1 ? "marco" : "marcos"}${nn ? ` · <span style="color:var(--mag)">${nn} ${nn === 1 ? "novo" : "novos"}</span>` : ""}</span></span></li>`; }).join("")}</ol><p class="note">${M.nMilestones} marcos em ${eras.length} eras.</p><a class="go" href="#/evolucao">Abrir a Evolução</a>`) : ""}</aside></div>`;
    if (sel) bindRadar(app, sel, true);
  }

  /* ---------- subtopic file (the prototype's "ficha de técnica", built from the archive) ---------- */
  function viewSub(id) {
    const b = blipBy(id) || M.radar.blips[0];
    if (!b) { app.innerHTML = `<p class="empty">Sem subtemas neste tema.</p>`; return; }
    const s = b.s, q = M.radar.quads[b.q], F = subtopicFile(DATA, s, M.items);
    const any = F.items.length + F.highlights.length + F.milestones.length + F.regs.length + F.oq.length;
    const askQ = `O que o arquivo sabe sobre ${s.name}?`;
    app.innerHTML = `<p class="crumb mono"><a href="#/mapa">Mapa</a><span>/</span><span>Radar</span><span>/</span><span>${String(b.id).padStart(2, "0")}</span></p>
      <div class="tech"><div>
        <h1>${esc(s.name)}</h1><p class="sub">Subtema da retrospectiva ${M.annual.year}. Termos contados: ${esc(s.groups.map((g) => g.join(", ")).join(" + "))}.</p>
        <div class="ro"><div><span class="mono">Anel</span><b>${RINGS[b.ring].l}</b></div><div><span class="mono">Ritmo 2025</span><b>${pct(s.ch25)}</b></div>
          <div><span class="mono">Volume 2026</span><b>${fmtN(s.y26)}</b><div class="mat" role="img" aria-label="Faixa de volume ${4 - b.q} de 4">${[0, 1, 2, 3].map((i) => `<i class="${i <= 3 - b.q ? "on" : ""}"></i>`).join("")}</div></div>
          <div class="anim"><span class="mono">Publicações</span><b>${pct(s.ch)}</b>${spark(s, 120, 28)}</div></div>
        <p class="note" style="margin-top:6px">${esc(numbers(s))} publicações/ano no OpenAlex.</p>
        ${plate("", "Por que está no anel " + RINGS[b.ring].l, "C1", `<p class="lead" style="font-size:18px">${esc(paceText(s))} ${esc(RINGS[b.ring].d)}</p>`)}
        ${F.items.length ? plate("", "No arquivo · itens que citam o subtema", "C2", F.items.slice(0, 8).map((i) => itemCard(i)).join(""), `${F.items.length} ${F.items.length === 1 ? "item" : "itens"}`) : ""}
        ${F.highlights.length ? plate("", "Destaques das retrospectivas", "C3", `<ul class="kv">${F.highlights.slice(0, 6).map((h) => `<li><b><a href="${esc(safeUrl(h.url))}" target="_blank" rel="noopener">${esc(h.title)}</a> <span class="tag soft" style="vertical-align:2px">${esc(h.year)}</span></b><span>${esc(h.venue || "")}${h.date ? " · " + fmtDY(h.date) : ""}${h.why ? ". " + esc(h.why) : ""}</span></li>`).join("")}</ul>`) : ""}
        ${F.milestones.length ? plate("", "Marcos da Evolução", "C4", `<ol class="tl">${F.milestones.slice(0, 8).map((m) => `<li><span class="d">${esc(m.year || m.era || "")}</span><span class="dot"></span><span><b>${esc(m.title)}</b><span class="n">${esc(String(m.why || "").split(". ")[0])}</span></span></li>`).join("")}</ol>`) : ""}
        ${F.regs.length ? plate("", "Normas que citam os termos", "C5", `<ul class="kv">${F.regs.slice(0, 5).map((r) => `<li><b>${esc(r.title)} <span class="tag soft" style="vertical-align:2px">${fmtDY(r.date)}</span></b><span>${esc(String(r.summary || "").split(". ")[0].replace(/\.$/, ""))}.</span></li>`).join("")}</ul>`) : ""}
        ${F.oq.length ? plate("", "Questões em aberto", "C6", `<ol class="oq all">${F.oq.map((o, i) => `<li><span class="mono">Q${i + 1}</span><span>${esc(o)}</span></li>`).join("")}</ol>`) : ""}
        ${any ? "" : `<p class="note" style="margin-top:18px">Nenhum item dos digests, destaque anual, marco ou norma do arquivo cita os termos deste subtema. A contagem vem do OpenAlex, fora do arquivo.</p>`}
        <p class="note" style="margin-top:18px">Ligação por termos: entram aqui os registros do arquivo cujo título ou resumo cita um dos termos do subtema.</p>
        <a class="cta" href="#/pergunte?q=${encodeURIComponent(askQ)}"><span><span class="mono" style="opacity:.7">Pergunte sobre este subtema</span><br><b>“${esc(askQ)}”</b></span><span class="go">Perguntar</span></a>
      </div><aside>
        ${plate("", "Posição no radar", "", `${radarSVG({ uid: "t", mini: true, only: b.id })}<p class="note">${esc(q.l)} · ${esc(RINGS[b.ring].d)}</p>`, esc(q.l))}
        ${plate("", "Ritmo ano a ano", "", `<div class="xg"><div><b>${fmtN(s.y24)}</b><span>2024</span></div><div><b>${fmtN(s.y25)}</b><span>2025</span></div><div><b>${fmtN(s.ytd)}</b><span>${esc(ytdLabel())}</span></div><div><b>${fmtN(s.y26)}</b><span>proj. 2026</span></div></div>${pace(s)}`)}
      </aside></div>`;
  }

  /* ---------- ask (POST /api/ask, same contract as web/app.js) ---------- */
  const askState = { history: [], busy: false, pending: "", draft: "", err: "", fresh: -1 };
  const voice = { stt: false, tts: false, agent: false, rec: null, audio: null };
  function renderTurn(h, ti) {
    const used = new Set([...String(h.a).matchAll(/\[(\d{1,2})\]/g)].map((m) => +m[1]));
    const list = (h.sources || []).filter((x) => used.has(x.n)).sort((a, b) => a.n - b.n);
    const cite = (n) => (list.some((x) => x.n === +n) ? `<button class="cite" data-c="${n}" data-t="${ti}" aria-label="Fonte ${n}">${n}</button>` : `<span class="cite">${n}</span>`);
    const wc = (s) => s.replace(/\[(\d{1,2})\]/g, (_, n) => cite(n));
    const blocks = mdA(h.a).split(/\n{2,}/).map((p) => p.split("\n").map((l) => l.trim()).filter(Boolean)).filter((ls) => ls.length);
    const html = (lines) => {
      if (lines.every((l) => /^[-*•] /.test(l))) return `<ul>${lines.map((l) => `<li><span>${wc(l.slice(2))}</span></li>`).join("")}</ul>`;
      return lines.map((l) => (/^#{1,4} /.test(l) || /^<strong>[^<]+<\/strong>:?$/.test(l) ? `<h3>${wc(l.replace(/^#{1,4} /, "").replace(/<\/?strong>/g, ""))}</h3>` : /^[-*•] /.test(l) ? `<ul><li><span>${wc(l.slice(2))}</span></li></ul>` : `<p>${wc(l)}</p>`)).join("");
    };
    /* the opening paragraph goes in the framed box when it is short and plain, like the prototype's short answer */
    const b0 = blocks[0], lead = b0 && b0.length === 1 && !/^(#{1,4} |[-*•] |<strong>[^<]+<\/strong>:?$)/.test(b0[0]) && b0[0].replace(/<[^>]+>/g, "").length <= 340;
    const kinds = {};
    list.forEach((x) => { const k = x.kind || "fonte"; kinds[k] = (kinds[k] || 0) + 1; });
    return `<section class="turn" data-turn="${ti}"><h2 class="q-h">${esc(h.q)}</h2>
      ${list.length ? `<p class="mono" style="color:var(--ink3)">${list.length} ${list.length === 1 ? "fonte" : "fontes"} · ${Object.entries(kinds).map(([k, n]) => `${n} ${esc(k)}`).join(", ")}</p>
      <div class="srcs" role="list" aria-label="Fontes">${list.map((s) => `<button class="src ${/norm|regul|lei/i.test(s.kind || "") ? "norma" : ""}" role="listitem" data-s="${s.n}" data-t="${ti}"><span class="n">${s.n}</span><b>${esc(s.title)}</b><span>${esc(s.kind || "")}${s.when ? " · " + esc(String(s.when).slice(0, 10)) : ""}</span></button>`).join("")}</div>` : ""}
      ${lead ? `<div class="verdict"><span class="mono">Resposta</span>${wc(b0[0])}</div>` : ""}
      <div class="ans" data-ans>${blocks.slice(lead ? 1 : 0).map(html).join("")}</div>
      <div class="turn-act"><button type="button" class="btn speak" data-speak="${ti}" aria-pressed="false" aria-label="Ouvir esta resposta"${voice.tts ? "" : " hidden"}>${IC.speaker}<span>Ouvir</span></button>${fbBar("resposta", h.q, h.q)}</div></section>`;
  }
  function composer() {
    return `<div class="composer" id="composer"><div class="hint mono"><span id="ask-msg" role="status">${esc(askState.err || (askState.busy ? "Consultando o arquivo…" : askState.history.length ? "Seguimentos usam a conversa acima." : "Leva uns 20 a 40 segundos."))}</span>${askState.history.length && !askState.busy ? `<button type="button" data-reset>Nova conversa</button>` : ""}</div>
      <form class="${voice.stt ? "" : "nomic"}"><textarea name="q" rows="1" maxlength="600" enterkeyhint="send" placeholder="Pergunte ao arquivo…" aria-label="Sua pergunta"></textarea>
      <div class="lvl" aria-live="polite">${"<i></i>".repeat(14)}<span class="mono">Ouvindo · toque para parar</span></div>
      <button type="button" class="mic" aria-label="Falar a pergunta" aria-pressed="false"${voice.stt ? "" : " hidden"}>${IC.mic}</button><button class="send" aria-label="Enviar pergunta"${askState.busy ? " disabled" : ""}>${IC.send}</button></form></div>`;
  }
  function viewAsk(params) {
    document.body.classList.add("has-composer");
    const on = askOn(), pre = params && params.get("q"), autoGo = params && params.get("go") === "1";
    if (pre) { askState.draft = pre; try { history.replaceState(null, "", "#/pergunte"); } catch { /* the param just stays */ } }
    const has = askState.history.length > 0 || askState.busy;
    const intro = `<h1 class="pg">Pergunte</h1><p class="sub">Respostas com fontes numeradas, tiradas só do arquivo deste tema: ${M.triage.length} digests, ${M.nMilestones} marcos da Evolução${M.nReg ? `, ${M.nReg} normas` : ""}, retrospectivas e a biblioteca de papers. Fale ou escreva.</p>`;
    const exs = plate("", "Exemplos por intenção", "D1", `<ul class="ex">${M.examples.map((x, i) => `<li><a href="#/pergunte" data-ex="${i}"><span class="mono">${esc(x.k)}</span><b>${esc(x.q)}</b></a></li>`).join("")}</ul>`);
    app.innerHTML = `<div class="ask">${has ? `<p class="crumb mono"><a href="#/pergunte" data-reset>Pergunte</a><span>/</span><span>Conversa</span></p>` : intro}
      ${on ? `<div class="talk-slot" id="talk-slot"></div>` : `<div class="notice">As respostas só funcionam no site publicado. Nesta cópia, os exemplos mostram o que dá para perguntar.</div>`}
      ${askState.history.map(renderTurn).join("")}
      ${askState.busy ? `<section class="turn"><h2 class="q-h">${esc(askState.pending)}</h2><div class="pending" aria-live="polite">${"<i></i>".repeat(10)}<span class="mono">Consultando o arquivo · leva uns 20 a 40 segundos</span></div></section>` : ""}
      ${has ? "" : exs}</div>${on ? composer() : ""}`;
    if (askState.fresh >= 0) { animateTurn($(`[data-turn="${askState.fresh}"]`)); askState.fresh = -1; }
    const submit = (e) => fbSubmit(e);
    const click = (e) => {
      if (e.target.closest("[data-fb-vote], [data-fb-open]")) { fbClick(e); return; }
      const sp = e.target.closest("[data-speak]"); if (sp) { const h = askState.history[+sp.dataset.speak]; if (h) speak(sp, speechText(h.a)); return; }
      const ex = e.target.closest("[data-ex]");
      if (ex) { e.preventDefault(); const x = M.examples[+ex.dataset.ex]; askState.draft = x.q; const ta = $("#composer textarea"); if (ta) { ta.value = x.q; grow(ta); ta.focus(); } return; }
      if (e.target.closest("[data-reset]")) { e.preventDefault(); if (askState.busy) return; askState.history = []; askState.err = ""; askState.draft = ""; viewAsk(); return; }
      const c = e.target.closest("[data-c]"), s = e.target.closest("[data-s]"); const n = c ? c.dataset.c : s ? s.dataset.s : null; if (!n) return;
      const ti = +(c || s).dataset.t, turn = $(`[data-turn="${ti}"]`), h = askState.history[ti]; if (!h || !turn) return;
      $$(".src", turn).forEach((x) => x.classList.toggle("hit", x.dataset.s === String(n))); $$(".cite", turn).forEach((x) => x.classList.toggle("hit", x.dataset.c === String(n)));
      if (c) { const sc = $(`.src[data-s="${n}"]`, turn); if (sc) sc.scrollIntoView({ inline: "center", block: "nearest", behavior: reduced() ? "auto" : "smooth" }); }
      const src = (h.sources || []).find((x) => x.n === +n); if (!src) return;
      if (s || matchMedia("(max-width:719px)").matches) openSheet("Fonte " + n, `<p class="mono" style="color:var(--ink3)">${esc(src.kind || "fonte")}${src.when ? " · " + esc(src.when) : ""}</p><h3 style="font:650 20px/1.25 var(--f);margin:8px 0 16px">${esc(src.title)}</h3>
        ${src.url ? `<a class="btn pri" href="${esc(safeUrl(src.url))}" target="_blank" rel="noopener">Abrir a fonte</a>` : `<p class="note">Fonte sem link público no arquivo.</p>`}`);
    };
    app.addEventListener("click", click); app.addEventListener("submit", submit);
    cleanup = () => { app.removeEventListener("click", click); app.removeEventListener("submit", submit); };
    talkSlot();
    if (on) bindComposer();
    const ta = $("#composer textarea");
    if (autoGo && on && !askState.busy && (askState.draft || "").trim().length >= 5) sendAsk(askState.draft.trim());
    else if (pre && ta) ta.focus();
  }
  const grow = (ta) => { ta.style.height = "auto"; ta.style.height = `${Math.min(Math.max(ta.scrollHeight, 46), 160)}px`; };
  function bindComposer() {
    const c = $("#composer"), form = $("form", c), ta = $("textarea", c), mic = $(".mic", c);
    ta.value = askState.draft || ""; grow(ta);
    ta.addEventListener("input", () => { askState.draft = ta.value; grow(ta); });
    ta.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey && matchMedia("(min-width:760px)").matches) { e.preventDefault(); form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event("submit", { cancelable: true })); } });
    $(".send", c).addEventListener("mousedown", (e) => e.preventDefault());
    form.addEventListener("submit", (e) => { e.preventDefault(); const q = ta.value.trim(); if (q.length >= 5 && !askState.busy) sendAsk(q); });
    mic.addEventListener("click", () => toggleMic(c, mic, ta));
  }
  async function sendAsk(q) {
    askState.busy = true; askState.pending = q; askState.draft = ""; askState.err = "";
    if (current === "pergunte") { viewAskSafe(); const p = $(".pending"); if (p) p.closest(".turn").scrollIntoView({ block: "start", behavior: reduced() ? "auto" : "smooth" }); }
    try {
      const r = await fetch("/api/ask", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
        body: JSON.stringify({ topic: DATA.topic.slug, question: q, voter: voterId(), name: store.get("paw_name", "") || null,
          history: askState.history.slice(-2).map((h) => ({ q: h.q, a: h.a })) }),
      });
      const out = await r.json().catch(() => ({}));
      if (!r.ok || !out.ok) throw new Error(out.error || r.status);
      askState.history.push({ q, a: out.answer || "", sources: out.sources || [] });
      askState.busy = false; askState.pending = ""; askState.fresh = askState.history.length - 1;
      if (current !== "pergunte") return;
      viewAskSafe();
      const t = $(`[data-turn="${askState.history.length - 1}"]`); if (t) t.scrollIntoView({ block: "start" });
    } catch (err) {
      askState.busy = false; askState.pending = ""; askState.draft = q; askState.err = `Não foi possível responder (${err.message}).`;
      if (current === "pergunte") viewAskSafe();
    }
  }
  function viewAskSafe() { if (cleanup) { cleanup(); cleanup = null; } viewAsk(); }
  /* word-by-word reveal of a fresh answer (the prototype's typing effect) */
  function animateTurn(turn) {
    if (!turn || reduced()) return;
    let n = 0;
    $$("[data-ans] p, [data-ans] li > span, [data-ans] h3, .verdict", turn).forEach((p) => {
      const walk = (node) => Array.from(node.childNodes).forEach((ch) => {
        if (ch.nodeType === 3) {
          const f = document.createDocumentFragment();
          ch.textContent.split(/(\s+)/).forEach((w) => { if (!w.trim()) { f.appendChild(document.createTextNode(w)); return; } const sp = document.createElement("span"); sp.className = "w"; sp.style.animationDelay = Math.min(n++ * 9, 4000) + "ms"; sp.textContent = w; f.appendChild(sp); });
          node.replaceChild(f, ch);
        } else if (ch.classList && ch.classList.contains("cite")) { ch.classList.add("w"); ch.style.animationDelay = Math.min(n * 9, 4000) + "ms"; }
        else if (!ch.classList || !ch.classList.contains("mono")) walk(ch);
      });
      walk(p);
    });
  }

  /* voice input: /api/stt, recorded audio re-encoded as WAV mono 16 kHz (same pipeline as web/app.js) */
  function encodeWav(samples, rate) {
    const buf = new ArrayBuffer(44 + samples.length * 2), v = new DataView(buf);
    const w = (o, str) => { for (let i = 0; i < str.length; i++) v.setUint8(o + i, str.charCodeAt(i)); };
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
  async function toggleMic(c, btn, ta) {
    const setOn = (on) => { c.classList.toggle("listening", on); btn.classList.toggle("on", on); btn.setAttribute("aria-pressed", String(on)); btn.innerHTML = on ? IC.stop : IC.mic; };
    if (voice.rec) { voice.rec.recorder.stop(); return; }
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { const m = $("#ask-msg"); if (m) m.textContent = "Sem acesso ao microfone."; return; }
    const recorder = new MediaRecorder(stream), chunks = [];
    recorder.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop()); clearTimeout(voice.rec && voice.rec.timer); voice.rec = null;
      setOn(false); btn.classList.add("busy"); btn.disabled = true;
      const m = $("#ask-msg"); if (m) m.textContent = "Transcrevendo…";
      try {
        const text = await transcribe(new Blob(chunks, { type: recorder.mimeType || "audio/webm" }));
        if (text && ta.isConnected) { ta.value = (ta.value && !/\s$/.test(ta.value) ? ta.value + " " : ta.value) + text; ta.dispatchEvent(new Event("input", { bubbles: true })); ta.focus(); }
        if (m) m.textContent = "Confira o texto e envie.";
      } catch (e) { if (m) m.textContent = `Não deu para transcrever (${e.message}).`; }
      btn.classList.remove("busy"); btn.disabled = false;
    };
    recorder.start();
    voice.rec = { recorder, timer: setTimeout(() => recorder.state === "recording" && recorder.stop(), 85000) };
    setOn(true);
  }
  function initVoice() {
    if (!askOn() || window.isSecureContext === false) return;
    const probe = (path) => fetch(path, { cache: "no-store" }).then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
    if (navigator.mediaDevices && window.MediaRecorder) probe("/api/stt").then((s) => {
      voice.stt = !!(s && s.enabled);
      if (voice.stt && current === "pergunte") { const f = $("#composer form"), m = $("#composer .mic"); if (f) f.classList.remove("nomic"); if (m) m.hidden = false; }
    });
    probe("/api/tts").then((t) => { voice.tts = !!(t && t.enabled); if (voice.tts) $$("[data-speak]").forEach((b) => { b.hidden = false; }); });
    probe("/api/voice-session").then((v) => { voice.agent = !!(v && v.enabled) && !!(navigator.mediaDevices && window.RTCPeerConnection); talkSlot(); });
  }

  /* ---------- "Ouvir": an answer read aloud (/api/tts → audio/mpeg), same toggle/stop behaviour as web/app.js speak() ---------- */
  const speechText = (a) => String(a || "").replace(/\s?\[\d{1,2}\]/g, "").replace(/\*\*?/g, "").replace(/^#{1,4}\s+/gm, "").replace(/^[-*•]\s+/gm, "").trim();
  async function speak(btn, text) {
    if (voice.audio) { voice.audio.pause(); const was = voice.audio.btn; voice.audio = null; if (was) { was.classList.remove("on"); was.setAttribute("aria-pressed", "false"); } if (was === btn) return; }
    btn.classList.add("on", "busy"); btn.setAttribute("aria-pressed", "true");
    try {
      const r = await fetch("/api/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, voter: voterId() }) });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `HTTP ${r.status}`);
      const a = new Audio(URL.createObjectURL(await r.blob()));
      a.btn = btn; voice.audio = a;
      a.onended = () => { btn.classList.remove("on"); btn.setAttribute("aria-pressed", "false"); voice.audio = null; };
      btn.classList.remove("busy");
      await a.play();
    } catch (e) { btn.classList.remove("on", "busy"); btn.setAttribute("aria-pressed", "false"); btn.title = `Não deu para ler: ${e.message}`; }
  }
  function stopSpeech() { if (voice.audio) { voice.audio.pause(); const b = voice.audio.btn; voice.audio = null; if (b) b.classList.remove("on"); } }

  /* ---------- feedback on answers: same /api/feedback payload and paw_votes store as web/app.js fbBar("resposta", q, q) ---------- */
  const fbKey = (kind, ref) => `${DATA.topic.slug}|${kind}|${ref}`;
  const THUMB = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M5 7.2 7.6 2.5c.9 0 1.6.8 1.4 1.7L8.6 6.4h3.6c.9 0 1.5.8 1.3 1.7l-.9 4.4c-.1.7-.7 1.1-1.3 1.1H5zM2.5 7.2H5v6.4H2.5z"/></svg>';
  function fbBar(kind, ref, title) {
    if (!askOn() || !ref) return "";
    const v = store.get("paw_votes", {})[fbKey(kind, ref)];
    return `<div class="fb" data-kind="${esc(kind)}" data-ref="${esc(ref)}" data-title="${esc(title || "")}">
      <button type="button" class="fb-btn" data-fb-vote="up" aria-pressed="${v === "up"}" title="Útil" aria-label="Útil">${THUMB}</button>
      <button type="button" class="fb-btn dn" data-fb-vote="down" aria-pressed="${v === "down"}" title="Não ajudou" aria-label="Não ajudou">${THUMB}</button>
      <button type="button" class="lnk" data-fb-open>Comentar</button><span class="fb-msg note" role="status"></span>
      <form class="fb-form" hidden><textarea name="comment" maxlength="2000" rows="3" placeholder="O que achou? Está certo, faltou algo, é útil para o seu dia a dia?"></textarea>
        <div class="fb-row"><input name="name" maxlength="60" placeholder="Seu nome (opcional)" value="${esc(store.get("paw_name", ""))}"><button type="submit" class="btn pri">Enviar</button></div></form></div>`;
  }
  async function fbSend(el, payload) {
    const msg = $(".fb-msg", el);
    try {
      const r = await fetch("/api/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
        body: JSON.stringify({ topic: DATA.topic.slug, kind: el.dataset.kind, ref: el.dataset.ref, title: el.dataset.title, voter: voterId(), ...payload }) });
      const out = await r.json().catch(() => ({}));
      if (!r.ok || !out.ok) throw new Error(out.error || r.status);
      if (msg) msg.textContent = payload.comment ? "Obrigado! Comentário enviado." : "Obrigado!";
      return true;
    } catch (e) { if (msg) msg.textContent = `Não foi possível enviar (${e.message}).`; return false; }
  }
  async function fbClick(e) {
    const btn = e.target.closest("[data-fb-vote], [data-fb-open]"); if (!btn) return false;
    const el = btn.closest(".fb");
    if (btn.hasAttribute("data-fb-open")) { const f = $(".fb-form", el); f.hidden = !f.hidden; if (!f.hidden) $("textarea", f).focus(); return true; }
    const votes = store.get("paw_votes", {}), k = fbKey(el.dataset.kind, el.dataset.ref);
    const vote = votes[k] === btn.dataset.fbVote ? "none" : btn.dataset.fbVote; /* clicking again undoes */
    if (await fbSend(el, { vote, name: store.get("paw_name", "") || null })) {
      if (vote === "none") delete votes[k]; else votes[k] = vote;
      store.set("paw_votes", votes);
      $$("[data-fb-vote]", el).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.fbVote === vote)));
    }
    return true;
  }
  async function fbSubmit(e) {
    const form = e.target.closest(".fb-form"); if (!form) return;
    e.preventDefault();
    const el = form.closest(".fb"), comment = form.comment.value.trim(), name = form.name.value.trim();
    if (!comment) { form.comment.focus(); return; }
    store.set("paw_name", name);
    const b = $("button", form); b.disabled = true;
    if (await fbSend(el, { comment, name: name || null })) { form.comment.value = ""; form.hidden = true; }
    b.disabled = false;
  }

  /* ---------- "Conversar por voz": real-time talk with the ElevenLabs agent (/api/voice-session), ported from web/app.js.
     For anything about the archive the agent calls the client tool consultar_acervo: the browser asks /api/ask, keeps the
     written answer (with sources) in the Pergunte history and hands the agent the text to summarise aloud. ---------- */
  const EL_CLIENT = "https://cdn.jsdelivr.net/npm/@elevenlabs/client@1.35.0/+esm";
  const TALK_STATES = { connecting: "Conectando…", listening: "Ouvindo você", speaking: "Falando", thinking: "Consultando o arquivo…", ended: "Conversa encerrada" };
  const talk = { conv: null, state: "ended", muted: false, added: 0 };
  const fmtLong = (iso) => new Date(iso + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  function talkSlot() {
    const slot = $("#talk-slot"); if (!slot) return;
    slot.innerHTML = voice.agent ? `<button type="button" class="btn pri talk-btn" id="talk-open">${IC.mic}<span>Conversar por voz</span></button><span class="note">Fale e escute; o assistente consulta o arquivo quando precisa.</span>` : "";
    const b = $("#talk-open"); if (b) b.addEventListener("click", startTalk);
  }
  function talkDialog() {
    let dlg = $("#talk"); if (dlg) return dlg;
    dlg = document.createElement("dialog");
    dlg.id = "talk"; dlg.className = "talk"; dlg.setAttribute("aria-labelledby", "talk-h");
    dlg.innerHTML = `<div class="sh"><div class="sh-h"><h2 id="talk-h" tabindex="-1">Conversa por voz</h2><button class="ico-b" data-close aria-label="Encerrar e fechar">${IC.close}</button></div>
      <div class="talk-orb" aria-hidden="true"><i></i><b></b></div>
      <p class="talk-state" id="talk-state" role="status"></p>
      <ol class="talk-log" id="talk-log" aria-live="polite"></ol>
      <div class="talk-actions"><button type="button" class="btn" id="talk-mute" aria-pressed="false">Silenciar microfone</button><button type="button" class="btn pri" id="talk-end">Encerrar</button></div></div>`;
    document.body.appendChild(dlg);
    dlg.addEventListener("click", (e) => { if (e.target === dlg || e.target.closest("[data-close]") || e.target.closest("#talk-end")) dlg.close(); });
    dlg.addEventListener("close", endTalk);
    $("#talk-mute", dlg).addEventListener("click", (e) => {
      talk.muted = !talk.muted;
      if (talk.conv) talk.conv.setMicMuted(talk.muted);
      e.currentTarget.setAttribute("aria-pressed", String(talk.muted));
      e.currentTarget.textContent = talk.muted ? "Ativar microfone" : "Silenciar microfone";
    });
    return dlg;
  }
  function setTalk(state, note) {
    talk.state = state;
    const dlg = $("#talk"); if (!dlg) return;
    dlg.dataset.state = state;
    $("#talk-state", dlg).textContent = note || TALK_STATES[state] || "";
  }
  /* expressive voices mark delivery inline ("[slow] Deixa eu ver… [normal] Olha"): kept in the traces, not shown */
  const stripAudioTags = (s) => String(s || "").replace(/\s*\[[a-zà-ú][a-zà-ú _-]{0,30}\]\s*/gi, " ").replace(/\s{2,}/g, " ").trim();
  function logTalk(who, raw) {
    const log = $("#talk-log"), text = who === "agent" ? stripAudioTags(raw) : String(raw || "").trim();
    if (!log || !text) return;
    const li = document.createElement("li");
    li.className = `talk-${who}`; li.textContent = text;
    log.appendChild(li); li.scrollIntoView({ block: "nearest" });
  }
  async function askForAgent({ pergunta } = {}) {
    const q = String(pergunta || "").trim().slice(0, 600);
    if (q.length < 5) return "A pergunta ficou curta demais para consultar o arquivo; peça para a pessoa detalhar.";
    setTalk("thinking");
    try {
      const r = await fetch("/api/ask", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
        body: JSON.stringify({ topic: DATA.topic.slug, question: q, voter: voterId(), name: store.get("paw_name", "") || null,
          history: askState.history.slice(-2).map((h) => ({ q: h.q, a: h.a })) }),
      });
      const out = await r.json().catch(() => ({}));
      if (!r.ok || !out.ok) return `O arquivo não respondeu (${out.error || r.status}). Diga isso à pessoa com franqueza.`;
      askState.history.push({ q, a: out.answer, sources: out.sources || [] });
      talk.added++;
      const used = new Set([...out.answer.matchAll(/\[(\d{1,2})\]/g)].map((m) => +m[1]));
      const srcs = (out.sources || []).filter((s) => used.has(s.n)).map((s) => `${s.title} (${s.kind}${s.when ? `, ${String(s.when).slice(0, 10)}` : ""})`);
      return `Resposta escrita do analista do arquivo. Resuma em fala, sem números de citação nem listas:\n`
        + `${out.answer.replace(/\s?\[\d{1,2}\]/g, "")}\n\nFontes citadas: ${srcs.join("; ") || "nenhuma"}`;
    } catch (e) {
      return `Falha ao consultar o arquivo (${e.message}). Diga isso à pessoa.`;
    } finally {
      if (talk.conv) setTalk("listening");
    }
  }
  async function startTalk() {
    const dlg = talkDialog();
    $("#talk-log", dlg).innerHTML = "";
    talk.added = 0; talk.muted = false;
    const mute = $("#talk-mute", dlg); mute.setAttribute("aria-pressed", "false"); mute.textContent = "Silenciar microfone";
    stopSpeech();
    setTalk("connecting");
    if (!dlg.open) dlg.showModal();
    try {
      /* ask for the microphone straight from the tap (iOS), then release it: the SDK opens its own stream */
      const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
      mic.getTracks().forEach((t) => t.stop());
      const r = await fetch("/api/voice-session", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ voter: voterId() }) });
      const out = await r.json().catch(() => ({}));
      if (!r.ok || !out.ok) throw new Error(out.error || `HTTP ${r.status}`);
      const { Conversation } = await import(EL_CLIENT);
      if (!dlg.open) return;
      const d0 = (DATA.digests || [])[0] || {};
      const conv = await Conversation.startSession({
        conversationToken: out.token,
        connectionType: "webrtc",
        dynamicVariables: { tema: DATA.topic.name, foco: DATA.topic.focus || DATA.topic.description || "", manchete: d0.headline || "", data: fmtLong(todayIso()) },
        clientTools: { consultar_acervo: askForAgent },
        onModeChange: ({ mode }) => { if (talk.state !== "thinking") setTalk(mode); },
        onMessage: (m) => logTalk(m.role === "user" || m.source === "user" ? "user" : "agent", m.message),
        onDisconnect: () => { talk.conv = null; setTalk("ended"); },
        onError: (msg) => setTalk("ended", `Erro na conversa: ${msg}`),
      });
      talk.conv = conv;
      if (!dlg.open) { endTalk(); return; }
      setTalk("listening");
    } catch (e) {
      const denied = e && (e.name === "NotAllowedError" || e.name === "SecurityError");
      setTalk("ended", denied ? "Sem acesso ao microfone. Libere nas configurações do navegador e tente de novo." : `Não deu para conectar (${e.message}).`);
    }
  }
  function endTalk() {
    const c = talk.conv;
    talk.conv = null;
    if (c) c.endSession().catch(() => {});
    if (talk.state !== "ended") setTalk("ended");
    /* the written answers (with sources) the agent fetched are now in the Pergunte history */
    if (talk.added && current === "pergunte") { talk.added = 0; viewAskSafe(); }
  }

  /* ---------- regulation (in the Carta; same data and grouping as the current site's #/regulacao) ---------- */
  const RS = { all: {} };
  function regCard(g) {
    const nx = parseDeadlines(g).filter((x) => x.d >= TODAY)[0], date = String(g.date || "").slice(0, 10);
    const tags = `<span class="tag soft">${esc(g.regulator || "")}</span>${date ? `<span class="tag soft">${fmtDY(date)}</span>` : ""}${date > lastVisit ? '<span class="tag new">Nova</span>' : ""}${g.revoked ? '<span class="tag amber">Revogada</span>' : ""}${g.status_note ? `<span class="tag soft">${esc(g.status_note)}</span>` : ""}${nx ? `<span class="tag amber" data-tip="${esc(nx.l)}">Prazo ${fmtD(nx.d)} · D−${days(TODAY, nx.d)}</span>` : ""}`;
    const det = (g.requires || []).length || g.applies_to || g.effective;
    return `<article class="reg"><div class="tags">${tags}</div>
      <h3>${g.url ? `<a href="${esc(safeUrl(g.url))}" target="_blank" rel="noopener">${esc(g.title)}</a>` : esc(g.title)}</h3>
      ${g.subject && g.source === "bacen" ? `<p class="note">${esc(g.subject)}</p>` : ""}
      <p class="rs">${md(g.summary || "")}</p>
      ${det ? `<div class="rx">${(g.requires || []).length ? `<ul class="req">${g.requires.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>` : ""}${g.applies_to ? `<p class="note"><b>A quem se aplica:</b> ${esc(g.applies_to)}</p>` : ""}${g.effective ? `<p class="note"><b>Vigência:</b> ${esc(g.effective)}</p>` : ""}</div><button class="lnk" data-open=".reg">O que exige</button>` : ""}
      ${(g.techniques || []).length ? `<div class="tags tq">${g.techniques.slice(0, 8).map((t) => `<span class="tag soft">${esc(t)}</span>`).join("")}</div>` : ""}</article>`;
  }
  function viewReg(q0) {
    const all = regSorted(DATA), br = all.filter((g) => g.source === "bacen"), intl = all.filter((g) => g.source !== "bacen");
    let q = q0 || "", timer = 0;
    app.innerHTML = `<h1 class="pg">Regulação</h1><p class="sub">Normas e padrões que tocam este tema, com o que exigem e as técnicas que afetam. Brasil: ${br.length} normativos do Banco Central e do CMN, resumidos a partir do texto oficial; internacional: ${intl.length} marcos selecionados pela curadoria. Resumos feitos por IA: confira no texto oficial.</p>
      ${all.length ? `<div class="search-box"><input class="field" type="search" data-rq placeholder="Filtrar (ex.: autenticação, prazo, nuvem)" aria-label="Filtrar normas" value="${esc(q)}"></div><p class="mono fcount" data-rc></p><div data-rl></div>` : `<p class="empty">Sem normas mapeadas para este tema ainda.</p>`}`;
    if (!all.length) return;
    const match = (g) => { const f = fold(q.trim()); return !f || fold([g.title, g.subject, g.summary, g.regulator, ...(g.techniques || []), ...(g.requires || [])].join(" ")).includes(f); };
    const section = (key, title, xs) => {
      if (!xs.length) return "";
      const open = RS.all[key] || q.trim(), shown = open ? xs : xs.slice(0, 12);
      return plate("", title, "", shown.map(regCard).join("") + (shown.length < xs.length ? `<button class="lnk" data-rall="${key}">Mostrar as ${xs.length}</button>` : ""), `${xs.length} ${xs.length === 1 ? "norma" : "normas"}`);
    };
    const paint = () => {
      const b = br.filter(match), i = intl.filter(match);
      $("[data-rl]").innerHTML = section("br", "Brasil · Banco Central e CMN", b) + section("intl", "Internacional", i) || `<p class="empty">Nenhuma norma com “${esc(q)}”.</p>`;
      $("[data-rc]").textContent = `${b.length + i.length} de ${all.length} normas`;
    };
    paint();
    const inp = $("[data-rq]");
    inp.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(() => { q = inp.value; paint(); try { history.replaceState(null, "", "#/regulacao" + (q.trim() ? "?q=" + encodeURIComponent(q.trim()) : "")); } catch { /* fine */ } }, 140); });
    const click = (e) => { const b = e.target.closest("[data-rall]"); if (b) { RS.all[b.dataset.rall] = true; paint(); } };
    app.addEventListener("click", click); cleanup = () => app.removeEventListener("click", click);
  }

  /* ---------- evolution: eras, milestones, threads (port of the current site's #/evolucao) ---------- */
  const ES = { theme: null };
  const authorsShort = (a) => (!a || !a.length ? "" : a.length > 3 ? `${a.slice(0, 3).join(", ")} et al.` : a.join(", "));
  function viewEvo() {
    const ev = DATA.evolution;
    if (!ev || !(ev.eras || []).length) { app.innerHTML = `<h1 class="pg">Evolução</h1><p class="empty">A linha do tempo do estado da arte ainda não foi gerada para este tema. Ela é montada uma vez por mês a partir da rede de citações.</p>`; return; }
    const used = new Set(ev.eras.flatMap((e) => (e.milestones || []).map((m) => m.theme)));
    const thread = ES.theme && (ev.threads || []).find((t) => t.theme === ES.theme);
    const ch = ev.changes || {}, st = ev.stats || {};
    const since = !ch.since ? "" : ch.since.length > 7 ? fmtDY(ch.since) : ch.since;
    const ms = (m) => {
      const meta = [m.venue || "", authorsShort(m.authors), m.cited_by ? `${fmtN(m.cited_by)} citações` : ""].filter(Boolean).map(esc).join(" · ");
      return `<li><span class="d">${esc(m.year ?? "")}</span><span class="dot"></span><span><b>${m.url ? `<a href="${esc(safeUrl(m.url))}" target="_blank" rel="noopener">${esc(m.title)}</a>` : esc(m.title)}${m.new ? ' <span class="tag new">Novo</span>' : ""}</b>
        <span class="n">${meta}</span>${m.why ? `<span class="n wy">${md(m.why)}</span>` : ""}${TH[m.theme] ? `<span class="tags"><span class="tag soft">${esc(TH[m.theme])}</span></span>` : ""}</span></li>`;
    };
    const eras = ev.eras.map((e) => {
      const list = (e.milestones || []).filter((m) => !ES.theme || m.theme === ES.theme);
      return plate("", esc(e.label), "", `<h3 class="era-t">${esc(e.title)}</h3>${e.summary ? `<p class="era-s">${md(e.summary)}</p>` : ""}${list.length ? `<ol class="tl ms">${list.map(ms).join("")}</ol>` : `<p class="note">Nenhum marco deste tema nesta época.</p>`}`, `${list.length} ${list.length === 1 ? "marco" : "marcos"}`);
    }).join("");
    const now = ev.now || {};
    app.innerHTML = `<h1 class="pg">Evolução</h1>${ev.overview ? `<p class="sub">${md(ev.overview)}</p>` : ""}
      <div class="ro"><div><span class="mono">Marcos</span><b>${fmtN(st.milestones != null ? st.milestones : M.nMilestones)}</b></div><div><span class="mono">Rede de obras</span><b>${fmtN(st.network)}</b></div><div><span class="mono">Eras</span><b>${ev.eras.length}</b></div><div><span class="mono">Gerado em</span><b>${ev.generated ? fmtDY(ev.generated) : "—"}</b></div></div>
      ${(ch.added || []).length || (ch.removed || []).length || ch.note ? plate("", `O que mudou${since ? " desde " + esc(since) : ""}`, "", `${ch.note ? `<p class="rs">${md(ch.note)}</p>` : ""}<ul class="chg">${(ch.added || []).map((m) => `<li><b class="add">+</b> ${esc(m.title)} <span class="note">(${esc(m.year ?? "")})</span></li>`).join("")}${(ch.removed || []).map((m) => `<li><b class="del">−</b> ${esc(m.title)} <span class="note">(${esc(m.year ?? "")})</span></li>`).join("")}</ul>`, `+${(ch.added || []).length} / −${(ch.removed || []).length}`) : ""}
      <div class="chips evo-chips" role="group" aria-label="Filtrar por tema"><button class="chip" data-evo="" aria-pressed="${!ES.theme}">Todos os temas</button>${Object.keys(TH).filter((k) => used.has(k)).map((k) => `<button class="chip" data-evo="${esc(k)}" aria-pressed="${ES.theme === k}">${esc(TH[k])}</button>`).join("")}</div>
      ${thread ? plate("", "Como este tema evoluiu", "", `<p class="lead" style="font-size:18px">${md(thread.line)}</p>`) : ""}
      ${eras}
      ${now.summary ? plate("", "Onde estamos agora", "", `<p class="rs">${md(now.summary)}</p>${(now.open_questions || []).length ? `<ol class="oq all">${now.open_questions.map((q, i) => `<li><span class="mono">Q${i + 1}</span><span>${md(q)}</span></li>`).join("")}</ol>` : ""}`) : ""}`;
    const click = (e) => { const c = e.target.closest("[data-evo]"); if (!c) return; ES.theme = c.dataset.evo || null; const y = scrollY; cleanup(); viewEvo(); scrollTo(0, y); };
    app.addEventListener("click", click); cleanup = () => app.removeEventListener("click", click);
  }

  /* ---------- annual review (port of #/anual) ---------- */
  const COUNTRY = { BR: "Brasil", US: "EUA", GB: "Reino Unido", CN: "China", DE: "Alemanha", FR: "França", IN: "Índia", CA: "Canadá", AU: "Austrália", NL: "Holanda", IT: "Itália", ES: "Espanha", CH: "Suíça", SG: "Singapura", HK: "Hong Kong", JP: "Japão", KR: "Coreia do Sul", BE: "Bélgica", SE: "Suécia", DK: "Dinamarca", IL: "Israel", TW: "Taiwan", PT: "Portugal" };
  const country = (c) => COUNTRY[c] || c || "";
  const hlItem = (h) => ({ t: h.title || "", ot: h.original_title && h.original_title !== h.title ? h.original_title : "", u: h.url || "", v: h.venue || "", d: (h.date || "").slice(0, 10), au: h.authors || [], s: Number(h.score) || 0, th: h.theme || "", o: "", wa: h.watch_authors || [], dg: "", kind: "quick", why: h.why || "", cited: h.cited_by });
  function viewAnnual(year) {
    const all = DATA.annual || {}, years = Object.keys(all).sort().reverse();
    if (!years.length) { app.innerHTML = `<h1 class="pg">Retrospectiva</h1><p class="empty">A retrospectiva ainda não foi gerada para este tema. Ela é atualizada todo mês, junto com a Evolução.</p>`; return; }
    const y = years.includes(year) ? year : years[0], a = all[y], latest = +y === M.annual.year, geo = a.geography || {}, st = a.stats || {};
    const pc = (x) => `${Math.round((x || 0) * 100)}%`;
    const list = (xs, f) => `<ol class="kvl">${xs.map((x, i) => `<li><span class="mono">${i + 1}</span><span>${f(x)}</span></li>`).join("")}</ol>`;
    const byTheme = Object.keys(TH).map((k) => [k, (a.highlights || []).filter((h) => h.theme === k)]).filter(([, xs]) => xs.length);
    const other = (a.highlights || []).filter((h) => !TH[h.theme]);
    const growth = latest ? `<ul class="snd" data-snd>${sounding(M.series)}</ul>` : `<ul class="kv">${(a.growth || []).map((g) => `<li><b>${esc(subName(g.label))} <span class="tag soft" style="vertical-align:2px">${pct(g.change)}</span></b><span>${fmtN(g.prev)} → ${fmtN(g.cur_full_year != null ? g.cur_full_year : g.cur)} publicações</span></li>`).join("")}</ul>`;
    app.innerHTML = `<div class="chips" role="group" aria-label="Ano" style="margin-top:18px">${years.map((k) => `<a class="chip" href="#/anual/${k}" aria-pressed="${k === y}">${k}${all[k].partial ? " · parcial" : ""}</a>`).join("")}</div>
      <h1 class="pg">Retrospectiva ${esc(y)}</h1>${a.partial && a.generated ? `<p class="note">Parcial, até ${fmtDY(a.generated)}.</p>` : ""}
      ${a.overview ? `<p class="sub" style="margin-top:8px">${md(a.overview)}</p>` : ""}
      <div class="ro"><div><span class="mono">Obras do ano</span><b>${fmtN(st.works != null ? st.works : geo.works)}</b></div><div><span class="mono">Avaliadas</span><b>${fmtN(st.triaged)}</b></div><div><span class="mono">Destaques</span><b>${(a.highlights || []).length}</b></div><div><span class="mono">Subtemas</span><b>${(a.growth || []).length}</b></div></div>
      ${(a.trends || []).length ? plate("", "Tendências do ano", "", `<ol class="tk-l">${(latest ? M.takeaways : a.trends.map((t) => ({ title: t.title, text: t.text, s: null }))).map((t, i) => `<li><span class="num">${i + 1}</span><div><button class="t" data-open="li"><h3>${esc(t.title || "")}</h3><p>${hiNum(t.text || "")}</p></button>${t.s ? `<div class="row2">${spark(t.s, 72, 24)}<span class="mono">${esc(t.s.name)} ${pct(t.s.ch)}</span></div>` : ""}</div></li>`).join("")}</ol>`) : ""}
      ${geo.sectors || a.innovation ? plate("", "Onde a inovação acontece", "", `${a.innovation ? `<p class="rs">${md(a.innovation)}</p>` : ""}
        ${(geo.sectors || []).length ? `<h3 class="grp-h">Quem publica</h3><div class="bars">${geo.sectors.map((s) => `<span>${esc(s.name)}</span><i><b style="width:${pc(s.share)}"></b></i><span class="v">${pc(s.share)}</span>`).join("")}</div><p class="note">% das ${fmtN(geo.works)} obras com ao menos um autor do setor.</p>` : ""}
        <div class="geo">${(geo.institutions || []).length ? `<div><h3 class="grp-h">Instituições</h3>${list(geo.institutions.slice(0, 10), (i) => `${esc(i.name)} <span class="note">· ${esc(country(i.country))} · ${i.works}</span>`)}</div>` : ""}
        ${(geo.countries || []).length ? `<div><h3 class="grp-h">Países</h3>${list(geo.countries.slice(0, 10), (c) => `${esc(country(c.code))} <span class="note">· ${c.works}</span>`)}</div>` : ""}
        ${(geo.companies || []).length ? `<div><h3 class="grp-h">Empresas que publicam</h3>${list(geo.companies.slice(0, 10), (c) => `${esc(c.name)} <span class="note">· ${esc(country(c.country))} · ${c.works}</span>`)}</div>` : ""}</div>`) : ""}
      ${(a.highlights || []).length ? plate("", "Destaques do ano", "", byTheme.map(([k, xs]) => `<h3 class="grp-h">${esc(TH[k])}</h3>${xs.map((h) => itemCard(hlItem(h))).join("")}`).join("") + (other.length ? `<h3 class="grp-h">Outros</h3>${other.map((h) => itemCard(hlItem(h))).join("")}` : ""), `${a.highlights.length}`) : ""}
      ${(a.growth || []).length ? plate("", "Volume de publicações por subtema", "", `${growth}${a.partial ? `<p class="note">Ano em curso projetado para 12 meses; o OpenAlex indexa com atraso, então a variação recente tende a sair subestimada.</p>` : ""}`) : ""}`;
  }

  /* ---------- people & institutions (port of #/watchlist) ---------- */
  function viewPeople() {
    const wl = DATA.watchlist || {}, hits = {};
    for (const g of DATA.digests || []) for (const it of [...(g.items || []), ...(g.quick || [])]) for (const n of [...(it.watch_authors || []), ...(it.watch_source ? [it.watch_source] : [])]) hits[n] = (hits[n] || 0) + 1;
    const evoHits = {};
    for (const e of (DATA.evolution || {}).eras || []) for (const m of e.milestones || []) for (const n of m.watch || []) evoHits[n] = (evoHits[n] || 0) + 1;
    const L = Object.assign({ researchers: "Pesquisadores", journals: "Journals", centers: "Centros & laboratórios", practitioners: "Praticantes & fontes", historical: "Referências históricas" }, (DATA.topic || {}).watchlist_labels || {});
    const people = wl.researchers || [], known = ["EUA", "Europa", "China/Ásia", "Brasil"];
    const regions = [...known, ...new Set(people.map((p) => p.region || "Outros").filter((r) => !known.includes(r)))];
    const person = (p) => {
      const links = Object.entries(p.links || {}).filter(([, u]) => u).map(([k, u]) => `<a href="${esc(safeUrl(u))}" target="_blank" rel="noopener">${esc(k)}</a>`);
      if (p.openalex_id) links.push(`<a href="https://openalex.org/authors/${esc(p.openalex_id)}" target="_blank" rel="noopener">openalex</a>`);
      return `<article class="ppl"><h3>${esc(p.name)}${p.status ? ` <span class="tag soft">${esc(p.status)}${p.since ? ` em ${esc(p.since)}` : ""}</span>` : ""}</h3>
        ${p.institution ? `<p class="note">${esc(p.institution)}</p>` : ""}${p.area ? `<p class="pa">${esc(p.area)}</p>` : ""}${p.why ? `<p class="pw">${esc(p.why)}</p>` : ""}
        ${hits[p.name] || evoHits[p.name] ? `<div class="tags">${hits[p.name] ? `<span class="tag new">${hits[p.name]} no arquivo</span>` : ""}${evoHits[p.name] ? `<span class="tag soft">${evoHits[p.name]} ${evoHits[p.name] === 1 ? "marco" : "marcos"} na Evolução</span>` : ""}</div>` : ""}
        ${links.length ? `<p class="pl">${links.join("")}</p>` : ""}</article>`;
    };
    const simple = (title, arr, sub) => !arr || !arr.length ? "" : plate("", esc(title), "", `<ul class="kv">${arr.map((x) => `<li><b>${x.url ? `<a href="${esc(safeUrl(x.url))}" target="_blank" rel="noopener">${esc(x.name)}</a>` : esc(x.name)}${hits[x.name] ? ` <span class="tag new" style="vertical-align:2px">${hits[x.name]} no arquivo</span>` : ""}</b><span>${sub && x[sub] ? esc(x[sub]) + " · " : ""}${esc(x.why || "")}</span></li>`).join("")}</ul>`, `${arr.length}`);
    const nOrg = ["journals", "centers", "practitioners"].reduce((s, k) => s + ((wl[k] || []).length), 0);
    app.innerHTML = `<h1 class="pg">Pessoas & instituições</h1><p class="sub">Referências monitoradas: ${people.length + (wl.historical || []).length} pessoas e ${nOrg} revistas, centros e fontes. Papers novos desses autores entram na triagem com bônus; posts, relatórios e normas das fontes ganham destaque.</p>
      ${people.length ? plate("", esc(L.researchers), "", regions.map((r) => { const g = people.filter((p) => (p.region || "Outros") === r); return g.length ? `<h3 class="grp-h">${esc(r)} · ${g.length}</h3><div class="ppl-g">${g.map(person).join("")}</div>` : ""; }).join(""), `${people.length}`) : ""}
      ${(wl.historical || []).length ? plate("", esc(L.historical), "", `<p class="note" style="margin-bottom:10px">Não são mais monitorados no dia a dia; as obras entram na <a href="#/evolucao">Evolução</a>.</p><div class="ppl-g">${wl.historical.map(person).join("")}</div>`, `${wl.historical.length}`) : ""}
      ${simple(L.journals, wl.journals)}${simple(L.centers, wl.centers, "institution")}${simple(L.practitioners, wl.practitioners, "org")}
      ${!people.length && !nOrg ? `<p class="empty">Sem watchlist neste tema.</p>` : ""}`;
  }

  /* ---------- search (../../search.json, BM25 like the current site) ---------- */
  const SX = { index: null, loading: null, keys: null, expanded: new Set() };
  function loadSearch() {
    if (SX.index) return Promise.resolve(SX.index);
    if (!SX.loading) SX.loading = (async () => {
      if (!DATA.offline && /^https?:$/.test(location.protocol)) {
        try { const r = await fetch("../../search.json"); if (r.ok) { const ix = await r.json(); if (ix && ix.postings && ix.docs) return ix; } } catch { /* local index below */ }
      }
      return localIndex(DATA);
    })().then((ix) => { SX.index = ix; SX.keys = Object.keys(ix.postings); return ix; });
    return SX.loading;
  }
  function snippet(doc, terms) {
    let text = String(doc.text || "");
    if (doc.title && text.startsWith(doc.title)) text = text.slice(doc.title.length);
    text = text.replace(/\*+/g, "").replace(/\s+/g, " ").trim();
    if (!text) return "";
    const f = text.toLowerCase().replace(/[^\u0000-\u007f]/g, (c) => c.normalize("NFD").charAt(0));
    let at = -1;
    for (const t of terms) { const m = new RegExp(`(^|[^a-z0-9])${t.replace(/[^a-z0-9]/g, "")}`).exec(f); if (m && (at < 0 || m.index < at)) at = m.index + m[1].length; }
    const start = at > 70 ? text.lastIndexOf(" ", at - 50) + 1 : 0, end = Math.min(text.length, start + 200);
    const win = text.slice(start, end), fw = f.slice(start, end);
    const alt = terms.map((t) => t.replace(/[^a-z0-9]/g, "")).filter(Boolean).join("|");
    let out = "", last = 0, m;
    if (alt) {
      const re = new RegExp(`(^|[^a-z0-9])(${alt})[a-z0-9]*`, "g");
      while ((m = re.exec(fw))) { const s = m.index + m[1].length, e = m.index + m[0].length; out += esc(win.slice(last, s)) + `<mark>${esc(win.slice(s, e))}</mark>`; last = e; if (m[0].length === 0) re.lastIndex++; }
    }
    out += esc(win.slice(last));
    return `${start > 0 ? "…" : ""}${out}${end < text.length ? "…" : ""}`;
  }
  function viewSearch(q0) {
    let q = q0 || "", timer = 0;
    app.innerHTML = `<h1 class="pg">Busca</h1><p class="sub">Papers, marcos, normas, pessoas, código e retrospectivas deste tema, em português ou inglês.</p>
      <div class="search-box"><input class="field big" type="search" data-sq placeholder="O que você procura?" aria-label="Buscar no arquivo" value="${esc(q)}" enterkeyhint="search"></div>
      <p class="mono fcount" data-ss role="status">Carregando o índice…</p><div data-sr></div>`;
    const inp = $("[data-sq]"), box = $("[data-sr]"), status = $("[data-ss]");
    const digestDates = new Set((DATA.digests || []).map((d) => d.date));
    const label = Object.fromEntries(SEARCH_GROUPS);
    const paint = () => {
      if (!SX.index) return;
      if (!tokens(q).length && (fold(q).match(/([a-z0-9]+)$/) || ["", ""])[1].length < 3) {
        status.textContent = "";
        box.innerHTML = `<p class="note">Por exemplo:</p><div class="fopts" style="margin-top:8px">${Object.keys(TH).slice(0, 8).map((k) => `<button class="chip" data-suggest="${esc(TH[k])}">${esc(TH[k])}</button>`).join("")}</div>`;
        return;
      }
      const { terms, hits } = searchIndex(SX.index, q, SX.keys);
      status.textContent = hits.length ? `${hits.length >= 80 ? "80+" : hits.length} resultados` : "Nada encontrado. Tente outras palavras, em português ou inglês.";
      const by = new Map();
      for (const h of hits) { const g = kindGroup(h.kind); if (!by.has(g)) by.set(g, []); by.get(g).push(h); }
      box.innerHTML = [...by.entries()].map(([g, xs]) => {
        const shown = SX.expanded.has(g) ? xs : xs.slice(0, 5);
        return plate("", esc(label[g] || g), "", `<ul class="res">${shown.map((h) => {
          const Lk = docLink(h), inDigest = (h.kind === "paper" || h.kind === "notícia ou relatório") && digestDates.has(h.when);
          const sub = [h.kind, h.when ? String(h.when).slice(0, 10) : "", h.venue || ""].filter(Boolean).map(esc).join(" · ");
          return `<li><a class="res-t" href="${esc(Lk.ext ? safeUrl(Lk.href) : Lk.href)}"${Lk.ext ? ' target="_blank" rel="noopener"' : ""}>${esc(h.title || "(sem título)")}${Lk.ext ? " ↗" : ""}</a>
            <p class="res-k">${sub}${inDigest ? ` · <a href="#/novidades/${esc(h.when)}">no digest</a>` : ""}</p><p class="res-s">${snippet(h, terms)}</p></li>`;
        }).join("")}</ul>${xs.length > shown.length ? `<button class="lnk" data-expand="${g}">Ver mais ${xs.length - shown.length}</button>` : ""}`, `${xs.length}`);
      }).join("");
    };
    loadSearch().then(paint).catch((e) => { status.textContent = `Não foi possível carregar a busca (${e.message}).`; });
    const go = () => { q = inp.value; SX.expanded.clear(); paint(); try { history.replaceState(null, "", "#/busca" + (q.trim() ? "?q=" + encodeURIComponent(q.trim()) : "")); } catch { /* fine */ } };
    inp.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(go, 150); });
    const click = (e) => {
      const s = e.target.closest("[data-suggest]"); if (s) { inp.value = s.dataset.suggest; go(); inp.focus(); }
      const x = e.target.closest("[data-expand]"); if (x) { SX.expanded.add(x.dataset.expand); paint(); }
    };
    app.addEventListener("click", click); cleanup = () => app.removeEventListener("click", click);
    if (!q) setTimeout(() => inp.focus(), 30);
  }

  /* ---------- topics landing (also the site root, in root mode) ---------- */
  const topicHref = (slug) => (ROOT ? `${encodeURIComponent(slug)}/` : slug === SLUG ? "#/" : `../../../${encodeURIComponent(slug)}/designs/carta/`);
  const OTHER = {};
  function loadTopic(slug) {
    if (!ROOT && slug === SLUG) return Promise.resolve(DATA);
    if (!OTHER[slug]) OTHER[slug] = fetch(`${ROOT ? "" : "../../../"}${encodeURIComponent(slug)}/data.json`, { cache: "no-cache" }).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); }).catch(() => null);
    return OTHER[slug];
  }
  function topicCard(t, i) {
    const tri = t.triage, max = Math.max(1, ...tri.map((x) => x.c)), last = t.last;
    const lastLbl = !last ? "" : last.d === TODAY ? "Hoje" : last.d === addDays(TODAY, -1) ? "Ontem" : `Em ${fmtD(last.d)}`;
    const dl = t.nextDl, lr = t.lastReg, ts = t.top, here = !ROOT && t.slug === SLUG;
    return plate("tp", "Tema " + (i + 1), "", `<h3>${esc(t.brand)} <i>${esc(t.em)}</i></h3><p class="hl">${esc(t.headline)}</p>
      ${tri.length ? `<div class="mini" role="img" aria-label="Candidatos lidos por dia nos últimos ${tri.length} digests" data-tip="Candidatos lidos por dia · ${fmtD(tri[0].d)} a ${fmtD(last.d)}">${tri.map((x, k) => `<i class="${k === tri.length - 1 ? "last" : ""}" style="height:${Math.max(4, x.c / max * 100).toFixed(0)}%"></i>`).join("")}</div>
      <p class="note">${lastLbl}: ${fmtN(last.c)} candidatos lidos, ${last.s} ${last.s === 1 ? "destaque" : "destaques"}.</p>` : ""}
      <div class="sig anim">${ts ? `<div><span class="mono">Subtema<br>em alta</span><span><b>${esc(ts.name)}</b><small>${fmtN(ts.y25)} → ${fmtN(ts.y26)} publicações/ano</small></span><span class="v">${pct(ts.ch)}</span></div>` : ""}
        ${dl || lr ? `<div><span class="mono">${dl ? "Próximo<br>prazo" : "Última<br>norma"}</span><span><b>${esc(dl ? dl.r.title : lr.title)}</b><small>${dl ? fmtDY(dl.d) + " · " + esc(dl.l) : fmtDY(lr.date)}</small></span>${dl ? `<span class="tag amber">D−${dl.left}</span>` : t.lrNew ? '<span class="tag new">Nova</span>' : "<span></span>"}</div>` : ""}
        <div><span class="mono">Arquivo</span><span><b>${t.nMilestones} marcos · ${t.nReg} normas</b><small>${t.works26 != null ? `${fmtN(t.works26)} trabalhos mapeados em ${t.year}` : "sem retrospectiva anual"}</small></span><span></span></div></div>
      <div class="foot"><a class="go" href="${topicHref(t.slug)}">Abrir o tema</a>${here ? '<span class="tag soft">Você está aqui</span>' : ""}</div>`, t.nNew ? `<span class="tag new">${t.nNew} novos</span>` : "");
  }
  function viewTopics() {
    const src = ROOT ? TOPICS : DATA.topics && DATA.topics.length ? DATA.topics : [{ slug: SLUG, name: DATA.topic.name }];
    const list = src.slice().sort((a, b) => (!ROOT && a.slug === SLUG ? -1 : !ROOT && b.slug === SLUG ? 1 : 0));
    app.innerHTML = `<h1 class="pg">Research Watch</h1><p class="sub">Memória viva do estado da arte, por tema: digests, evolução do campo, retrospectiva anual, regulação e um agente que responde com fontes.</p>
      <div class="topics enter" data-topics>${list.map((t, i) => plate("tp", "Tema " + (i + 1), "", `<h3>${esc(t.name)}</h3><p class="note">Carregando…</p>`)).join("")}</div>
      <div data-cross></div>
      <a class="cta" href="${ROOT ? `${encodeURIComponent((list[0] || {}).slug || "")}/#/criar` : "../../#/criar"}"><span><span class="mono" style="opacity:.75">Outro assunto?</span><br><b>Peça o seu Watch</b></span><span class="go">Pedir</span></a>`;
    const here = current;
    Promise.all(list.map((t) => loadTopic(t.slug).then((d) => ({ t, d })))).then((rows) => {
      if (current !== here) return;
      const ok = rows.filter((r) => r.d);
      const cards = rows.map((r, i) => (r.d ? topicCard(topicSummary(r.d, TODAY, store.get(lvKey(r.t.slug), null)), i)
        : plate("tp", "Tema " + (i + 1), "", `<h3>${esc(r.t.name)}</h3><p class="note">Não foi possível carregar os dados deste tema.</p><div class="foot"><a class="go" href="${topicHref(r.t.slug)}">Abrir o tema</a></div>`)));
      const box = $("[data-topics]"); if (box) box.innerHTML = cards.join("");
      if (ROOT && ok.length) $("#status").innerHTML = statusRoot(ok.map((r) => r.d));
      const dates = ok.flatMap((r) => triage(r.d).map((x) => x.d)).sort();
      const note = (n) => `<p class="note" style="margin-top:8px">Itens que entraram em mais de um Watch nos digests do arquivo${dates.length ? `, entre ${fmtD(dates[0])} e ${fmtD(dates[dates.length - 1])}` : ""}.${n ? "" : " Nenhum no período."}</p>`;
      const cross = crossSignals(ok.map((r) => ({ slug: r.t.slug, brand: ((r.d.topic || {}).brand || {}).text || r.t.name, data: r.d }))).slice(0, 5);
      const cb = $("[data-cross]");
      if (cb && ok.length > 1) cb.innerHTML = plate("", "Sinais que cruzam temas", "T4", cross.length ? `<ol class="cross">${cross.map((c, i) => `<li><span class="mono" style="color:var(--ink3);padding-top:4px">S${i + 1}</span><div><b>${c.u ? `<a href="${esc(safeUrl(c.u))}" target="_blank" rel="noopener">${esc(c.t)}</a>` : esc(c.t)}</b><div class="links">${c.at.map((x) => `<span>${esc(x.brand)} · ${x.kind === "full" ? "destaque" : "nota rápida"} em ${fmtD(x.dg)}${x.t !== c.t ? ` · “${esc(x.t)}”` : ""}</span>`).join("")}</div></div></li>`).join("")}</ol>${note(1)}` : note(0));
    });
  }

  /* ---------- appearance: skin + light/dark ---------- */
  const SKINS = [["papel", "Papel", "#F7F5F0", "#1D1B18", "#B4431F"], ["grafite", "Grafite", "#F6F7F9", "#111827", "#2557D6"], ["oceano", "Oceano", "#EEF4F6", "#0B2742", "#0A6B67"], ["carta", "Carta original", "#EDF3F4", "#0A2540", "#A30F68"]];
  const curSkin = () => document.documentElement.getAttribute("data-skin") || "papel";
  function setSkin(k) {
    if (!SKINS.some((s) => s[0] === k)) return;
    document.documentElement.setAttribute("data-skin", k);
    try { localStorage.setItem("carta-skin", k); } catch { /* private mode */ }
    const l = document.getElementById("skin-font"), F = window.CARTA_FONTS || {};
    if (l && F[k]) l.href = F[k];
    try { const u = new URL(location.href); if (u.searchParams.has("skin")) { u.searchParams.set("skin", k); history.replaceState(null, "", u.pathname + u.search + u.hash); } } catch { /* fine */ }
  }
  /* designs of the site: each link goes through /<slug>/?design=<key>, which saves the preference and redirects */
  const DESIGNS = [["carta", "Carta", "Este design"], ["classico", "Clássico", "O site anterior"], ["carteira", "Carteira", ""], ["sinal", "Sinal", ""], ["grifo", "Grifo", ""]];
  const designBase = () => (ROOT ? `${encodeURIComponent((TOPICS[0] || {}).slug || "")}/` : "../../");
  const designs = () => `<p class="mono" style="color:var(--ink3);margin-top:18px" id="design-h">Design</p><ul class="more-l designs">${DESIGNS.map(([k, l, d]) => k === "carta"
      ? `<li><span class="row" aria-current="true"><span>${l}<small>${d}</small></span><span class="tag new">Atual</span></span></li>`
      : `<li><a href="${designBase()}?design=${k}"><span>${l}${d ? `<small>${d}</small>` : ""}</span><span class="tag soft">Trocar</span></a></li>`).join("")}</ul>`;
  const appearance = () => `<p class="mono" style="color:var(--ink3);margin-top:18px">Estilo</p><div class="skins">${SKINS.map(([k, l, a, b, c]) => `<button data-skin-set="${k}" aria-pressed="${curSkin() === k}"><span class="sw" aria-hidden="true"><i style="background:${a}"></i><i style="background:${b}"></i><i style="background:${c}"></i></span>${l}</button>`).join("")}</div>
    <p class="mono" style="color:var(--ink3);margin-top:16px">Claro ou escuro</p><div class="seg">${[["auto", "Sistema"], ["light", "Claro"], ["dark", "Escuro"]].map(([k, l]) => `<button data-theme-set="${k}" aria-pressed="${curTheme() === k}">${l}</button>`).join("")}</div>`;

  /* ---------- shell ---------- */
  function openSheet(title, html, onClick) {
    sheet.innerHTML = `<div class="sh"><div class="sh-h"><h2>${esc(title)}</h2><button class="ico-b" data-close aria-label="Fechar">${IC.close}</button></div>${html}</div>`;
    sheet.onclick = (e) => {
      if (e.target === sheet || e.target.closest("[data-close]")) { sheet.close(); return; }
      if (onClick) onClick(e);
      const th = e.target.closest("[data-theme-set]"); if (th) { setTheme(th.dataset.themeSet); $$("[data-theme-set]", sheet).forEach((x) => x.setAttribute("aria-pressed", String(x === th))); }
      const sk = e.target.closest("[data-skin-set]"); if (sk) { setSkin(sk.dataset.skinSet); $$("[data-skin-set]", sheet).forEach((x) => x.setAttribute("aria-pressed", String(x === sk))); }
      if (e.target.closest("a[href^='#/']")) sheet.close();
    };
    if (!sheet.open) sheet.showModal();
  }
  function openMore() {
    const row = (h, t, d, tag) => `<li><a href="${h}"><span>${t}<small>${d}</small></span>${tag ? `<span class="tag soft">${tag}</span>` : ""}</a></li>`;
    const topics = DATA.topics || [], top = M.radar.blips[0], wl = DATA.watchlist || {};
    const nPeople = (wl.researchers || []).length + (wl.historical || []).length, nOrg = ["journals", "centers", "practitioners"].reduce((s, k) => s + ((wl[k] || []).length), 0);
    openSheet("Mais", `<ul class="more-l">
      ${row("#/busca", "Busca", "Papers, marcos, normas, pessoas e código deste tema")}
      ${M.nReg ? row("#/regulacao", "Regulação", `${M.nReg} normas, com o que cada uma exige`) : ""}
      ${M.nMilestones ? row("#/evolucao", "Evolução", `${M.nMilestones} marcos em ${((DATA.evolution || {}).eras || []).length} eras`) : ""}
      ${M.annual.year ? row("#/anual", `Retrospectiva ${M.annual.year}`, M.until ? `Parcial, até ${M.until}` : "Retrospectiva do ano") : ""}
      ${nPeople + nOrg ? row("#/pessoas", "Pessoas & instituições", `${nPeople} pessoas, ${nOrg} revistas, centros e fontes`) : ""}
      ${top ? row(`#/subtema/${top.id}`, "Ficha de subtema", esc(top.s.name), pct(top.s.ch)) : ""}
      ${row("#/temas", "Trocar de tema", esc(topics.map((t) => t.name.replace(/ Watch$/, "")).join(", ")), `${topics.length} ${topics.length === 1 ? "tema" : "temas"}`)}
      ${row("../../#/criar", "Peça o seu Watch", "Um tema novo, criado e revisado para você", "Site clássico")}
      <li><button type="button" class="row" data-design><span>Trocar de design<small>Clássico, Carteira, Sinal ou Grifo</small></span><span class="tag soft">5 designs</span></button></li></ul>${appearance()}${designs()}`);
  }
  const back = () => `<button type="button" class="back" data-design>Trocar de design</button>`;
  function statusRoot(datas) {
    const first = encodeURIComponent((TOPICS[0] || {}).slug || "");
    const gen = (datas || []).map((d) => d.generated).filter(Boolean).sort().pop();
    return `<span><b>${fmtDY(TODAY)}</b></span><span>${TOPICS.length} temas monitorados</span>${gen ? `<span class="live">Digest diário · última coleta ${fmtD(gen)}</span>` : ""}<a class="back" href="${first}/?design=classico">Site clássico</a><a class="back" href="${first}/designs/">Outros designs</a>`;
  }
  function shell(cur) {
    if (ROOT) {
      $("#brand-t").textContent = "Research"; $("#brand-em").textContent = "Watch";
      $("#status").innerHTML = statusRoot([]);
      return;
    }
    $("#tab").innerHTML = NAV.map(([k, h, l]) => h ? `<a href="${h}" ${k === cur ? 'aria-current="page"' : ""}>${IC[k]}<span>${l}</span></a>` : `<button data-more ${k === cur ? 'aria-current="page"' : ""}>${IC[k]}<span>${l}</span></button>`).join("");
    $("#nav-d").innerHTML = NAV.map(([k, h, l]) => h ? `<a href="${h}" ${k === cur ? 'aria-current="page"' : ""}>${l}</a>` : `<a href="#" data-more ${k === cur ? 'aria-current="page"' : ""}>${l}</a>`).join("");
    const landing = cur === "temas", b = (DATA.topic || {}).brand || {};
    $("#brand-t").textContent = landing ? "Research" : b.text || DATA.topic.name;
    $("#brand-em").textContent = landing ? "Watch" : b.em || "Watch";
    $("#status").innerHTML = back() + (landing
      ? `<span><b>${fmtDY(TODAY)}</b></span><span>${(DATA.topics || []).length} temas monitorados</span><span class="live">Digest diário · última coleta ${fmtD(DATA.generated)}</span>`
      : `<span><b>${fmtDY(TODAY)}</b></span><span class="live">Dados de ${fmtD(DATA.generated)}</span>${M.works26 != null ? `<span>${fmtN(M.works26)} trabalhos em ${M.annual.year}</span>` : ""}<span>${M.nMilestones} marcos</span><span>${M.nReg} normas</span>`);
  }
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-more]")) { e.preventDefault(); if (DATA) openMore(); }
    if (e.target.closest("#skin-b")) { e.preventDefault(); openSheet("Aparência", appearance() + designs()); }
    if (e.target.closest("[data-design]")) { e.preventDefault(); openSheet("Aparência", appearance() + designs()); const h = $("#design-h"); if (h) h.scrollIntoView({ block: "start" }); }
  });
  $("#theme-b").addEventListener("click", () => { const dark = curTheme() === "dark" || (curTheme() === "auto" && matchMedia("(prefers-color-scheme:dark)").matches); setTheme(dark ? "light" : "dark"); });
  document.addEventListener("pointermove", (e) => { const t = e.target.closest && e.target.closest("[data-tip]"); if (!t || e.pointerType === "touch") { tip.classList.remove("on"); return; } tip.textContent = t.dataset.tip; tip.style.left = Math.min(innerWidth - 130, Math.max(130, e.clientX)) + "px"; tip.style.top = e.clientY + "px"; tip.classList.add("on"); });
  function render() {
    if (cleanup) { cleanup(); cleanup = null; }
    document.body.classList.remove("has-composer");
    if (sheet.open) sheet.close();
    const tk = $("#talk"); if (tk && tk.open) tk.close();
    const r = route(), p = r.parts[0] || "";
    const go = (name, tab, fn) => { current = name; shell(tab); fn(); };
    if (p === "criar") { location.replace("../../#/criar"); return; } /* classic-only route: the redirect leaves it in the classic app */
    if (p === "novidades" || p === "d" || p === "arquivo" || p === "tendencias") go("novidades", "novidades", () => viewFeed(r.parts[1]));
    else if (p === "mapa") go("mapa", "mapa", viewMap);
    else if (p === "subtema" || p === "tecnica") go("subtema", "mapa", () => viewSub(r.parts[1]));
    else if (p === "pergunte") go("pergunte", "pergunte", () => viewAsk(r.q));
    else if (p === "temas") go("temas", "temas", viewTopics);
    else if (p === "regulacao") go("regulacao", "mais", () => viewReg(r.q.get("q")));
    else if (p === "evolucao") go("evolucao", "mapa", viewEvo);
    else if (p === "anual") go("anual", "mais", () => viewAnnual(r.parts[1]));
    else if (p === "pessoas" || p === "watchlist") go("pessoas", "mais", viewPeople);
    else if (p === "busca") go("busca", "mais", () => viewSearch(r.q.get("q")));
    else go("inicio", "inicio", viewHome);
    if (!location.hash.startsWith("#dl")) scrollTo(0, 0);
    app.setAttribute("tabindex", "-1");
  }
  try { history.scrollRestoration = "manual"; } catch { /* older browsers */ }

  const getJSON = (u) => fetch(u, { cache: "no-cache" }).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); });
  if (ROOT) {
    /* site root: only the Temas screen, reading topics.json and each <slug>/data.json */
    document.body.classList.add("root");
    getJSON("topics.json").then((ts) => {
      TOPICS = Array.isArray(ts) ? ts : [];
      if (!TOPICS.length) throw new Error("sem temas");
      current = "temas"; shell("temas"); viewTopics();
    }).catch((e) => { app.innerHTML = `<p class="empty">Não foi possível carregar os temas (${esc(e.message)}).</p>`; });
  } else {
    getJSON("../../data.json").then((d) => {
      DATA = d; SLUG = (d.topic || {}).slug || ""; TODAY = todayIso();
      TH = {}; Object.entries(d.themes || {}).forEach(([k, v]) => { TH[k] = stripMark(v); });
      lastVisit = store.get(lvKey(SLUG), null) || firstVisitDate(d);
      M = model(d, TODAY, lastVisit);
      FLOOR = Math.min(6, ...M.items.map((i) => i.s)); FS.min = FLOOR;
      document.title = `Carta · ${(d.topic || {}).name || "Research Watch"}`;
      addEventListener("hashchange", () => {
        if (location.hash === "#dl") { const el = $("#dl"); if (el) el.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "center" }); return; }
        render();
      });
      render();
      initVoice();
    }).catch((e) => { app.innerHTML = `<p class="empty">Não foi possível carregar os dados (${esc(e.message)}).</p>`; });
  }
})(typeof window !== "undefined" ? window : globalThis);
