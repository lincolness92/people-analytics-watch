(() => {
  "use strict";

  const app = document.getElementById("app");
  let DATA = null;
  let VISIT = { prev: null };
  const state = { q: "", themes: new Set(), minScore: 6, onlyWatch: false, region: "" };
  const wide = () => window.matchMedia("(min-width: 760px)").matches;

  // ---------- helpers ----------
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const md = (s) => esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g, "$1<em>$2</em>");
  const safeUrl = (u) => (/^https?:\/\//i.test(u || "") ? u : "#");
  const fmtDate = (iso, opts = { day: "2-digit", month: "long", year: "numeric" }) =>
    new Date(iso + "T12:00:00").toLocaleDateString("pt-BR", opts);
  const fmtShort = (iso) => fmtDate(iso, { day: "2-digit", month: "short", year: "numeric" });
  const scoreClass = (s) => (s >= 8 ? "hi" : s >= 6 ? "mid" : "lo");
  const themeLabel = (k) => (DATA.themes[k] || k);
  const stripMark = (s) => String(s || "").replace(/^[^\p{L}\p{N}]+\s*/u, "");
  const themeShort = (k) => stripMark(themeLabel(k));
  const lcFirst = (s) => (!s || /^\S{1,3}\b/.test(s) || /^\S[A-Z]/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1));
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  // "9 a 16 de novembro de 2026" (or "28 de outubro a 3 de novembro de 2026") when the digest covers a period.
  const fmtPeriod = (d, short = false) => {
    if (!d.period) return fmtDate(d.date, short ? { day: "2-digit", month: "short", year: "numeric" } : undefined);
    const a = new Date(d.period.from + "T12:00:00"), b = new Date(d.period.to + "T12:00:00");
    const m = short ? "short" : "long";
    const left = a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
      ? a.toLocaleDateString("pt-BR", { day: "numeric" })
      : a.toLocaleDateString("pt-BR", { day: "numeric", month: m });
    return `${left} a ${b.toLocaleDateString("pt-BR", { day: "numeric", month: m, year: "numeric" })}`;
  };
  const authorsShort = (a) => (!a || !a.length ? "" : a.length > 3 ? `${a.slice(0, 3).join(", ")} et al.` : a.join(", "));
  const todayIso = () => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  };

  // First sentence of a summary ("por que importa") and the rest. Skips initials, "et al." and the like,
  // and never splits inside **bold**.
  const ABBR = new Set(["al", "fig", "vs", "ex", "sr", "sra", "dr", "dra", "p", "pp", "cf", "no", "nº", "approx", "aprox", "inc", "co"]);
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

  // ---------- icons (inline SVG, inherit currentColor) ----------
  const svg = (d, extra = "") => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"${extra}>${d}</svg>`;
  const ICON = {
    arrow: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    send: svg('<path d="M12 19V5M6 11l6-6 6 6"/>'),
    ext: svg('<path d="M14 5h5v5M19 5l-8 8M17 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h4"/>'),
    reg: svg('<path d="M12 3v18M5 7h14M7 7l-3 7a3 3 0 0 0 6 0zM17 7l-3 7a3 3 0 0 0 6 0zM8 21h8"/>'),
    people: svg('<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 5.5a3 3 0 0 1 0 5.6M17.5 14.2A5.5 5.5 0 0 1 20.5 19"/>'),
    archive: svg('<rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9M10 13h4"/>'),
    info: svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>'),
    swap: svg('<path d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/>'),
    copy: svg('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a1 1 0 0 1 1-1h10"/>'),
  };

  // ---------- storage (every access guarded: private mode, blocked storage) ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode: fine */ } },
  };

  // ---------- "desde sua última visita" ----------
  // Per topic: {prev, cur}. A new session (> 1 h since the last page view) moves cur to prev, so the badges
  // stay while the reader browses and refreshes, and reset on the next visit.
  const SESSION_GAP = 60 * 60 * 1000;
  function setupVisit() {
    const key = `paw_visit|${DATA.topic.slug}`;
    const rec = store.get(key, null);
    const snap = { ts: Date.now(), at: todayIso(), digest: (DATA.digests[0] || {}).date || "",
      evo: (DATA.evolution || {}).generated || "" };
    let prev = null;
    if (rec && rec.cur && typeof rec.cur.ts === "number") prev = Date.now() - rec.cur.ts > SESSION_GAP ? rec.cur : (rec.prev || null);
    store.set(key, { prev, cur: snap });
    VISIT = { prev };
  }
  const isNewDigest = (date) => !!(VISIT.prev && VISIT.prev.digest && date > VISIT.prev.digest);
  const isNewReg = (g) => !!(VISIT.prev && g.date && g.date.slice(0, 10) > VISIT.prev.at);
  const newEvo = () => {
    const ev = DATA.evolution;
    if (!VISIT.prev || !ev || !ev.generated || !VISIT.prev.evo || ev.generated <= VISIT.prev.evo) return 0;
    const added = ((ev.changes || {}).added || []).length;
    return added || ev.eras.reduce((s, e) => s + e.milestones.filter((m) => m.new).length, 0);
  };
  const NEW = `<span class="new-badge">novo</span>`;

  // ---------- feedback (POST /api/feedback; hidden in the offline bundle) ----------
  const fbOn = () => DATA && !DATA.offline && /^https?:$/.test(location.protocol);
  const voterId = () => {
    let v = store.get("paw_voter", "");
    if (!v) { v = Math.random().toString(36).slice(2, 12); store.set("paw_voter", v); }
    return v;
  };
  const fbKey = (kind, ref) => `${DATA.topic.slug}|${kind}|${ref}`;

  function fbForm(placeholder) {
    return `<form class="fb-form"${placeholder ? "" : " hidden"}>
      <textarea name="comment" maxlength="2000" rows="3" placeholder="${esc(placeholder || "O que achou? Está certo, faltou algo, é útil para o seu dia a dia?")}"></textarea>
      <div class="fb-row">
        <input name="name" maxlength="60" placeholder="Seu nome (opcional)" value="${esc(store.get("paw_name", ""))}">
        <button type="submit">Enviar</button>
      </div>
    </form>`;
  }

  // 👍/👎 + "comentar" under a paper or milestone
  function fbBar(kind, ref, title) {
    if (!fbOn() || !ref) return "";
    const v = store.get("paw_votes", {})[fbKey(kind, ref)];
    return `<div class="fb" data-kind="${esc(kind)}" data-ref="${esc(ref)}" data-title="${esc(title || "")}">
      <button type="button" class="fb-btn" data-fb-vote="up" aria-pressed="${v === "up"}" title="útil / bom achado" aria-label="Útil">👍</button>
      <button type="button" class="fb-btn" data-fb-vote="down" aria-pressed="${v === "down"}" title="irrelevante / fraco" aria-label="Irrelevante">👎</button>
      <button type="button" class="fb-link" data-fb-open>comentar</button>
      <span class="fb-msg" role="status"></span>
      ${fbForm()}
    </div>`;
  }

  // open comment box at the end of a page
  function fbBox(kind, ref, title, heading, placeholder) {
    if (!fbOn()) return "";
    return `<section class="fb-box fb" data-kind="${esc(kind)}" data-ref="${esc(ref)}" data-title="${esc(title || "")}">
      <h2 class="theme-h">${esc(heading)}</h2>
      ${fbForm(placeholder)}
      <span class="fb-msg" role="status"></span>
    </section>`;
  }

  async function fbSend(el, payload) {
    const msg = el.querySelector(".fb-msg");
    try {
      const r = await fetch("/api/feedback", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
        body: JSON.stringify({ topic: DATA.topic.slug, kind: el.dataset.kind, ref: el.dataset.ref,
          title: el.dataset.title, voter: voterId(), ...payload }),
      });
      const out = await r.json().catch(() => ({}));
      if (!r.ok || !out.ok) throw new Error(out.error || r.status);
      if (msg) msg.textContent = payload.comment ? "Obrigado! Comentário enviado." : "Obrigado!";
      return true;
    } catch (e) {
      if (msg) msg.textContent = `Não foi possível enviar (${e.message}).`;
      return false;
    }
  }

  function fbWire() {
    app.addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-fb-vote], [data-fb-open]");
      if (!btn) return;
      const el = btn.closest(".fb");
      if (btn.hasAttribute("data-fb-open")) {
        const f = el.querySelector(".fb-form");
        f.hidden = !f.hidden;
        if (!f.hidden) f.querySelector("textarea").focus();
        return;
      }
      const votes = store.get("paw_votes", {});
      const k = fbKey(el.dataset.kind, el.dataset.ref);
      const vote = votes[k] === btn.dataset.fbVote ? "none" : btn.dataset.fbVote; // clicking again undoes
      if (await fbSend(el, { vote, name: store.get("paw_name", "") || null })) {
        if (vote === "none") delete votes[k]; else votes[k] = vote;
        store.set("paw_votes", votes);
        el.querySelectorAll("[data-fb-vote]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.fbVote === vote));
      }
    });
    app.addEventListener("submit", async (e) => {
      const form = e.target.closest(".fb-form");
      if (!form) return;
      e.preventDefault();
      const el = form.closest(".fb");
      const comment = form.comment.value.trim();
      const name = form.name.value.trim();
      if (!comment) { form.comment.focus(); return; }
      store.set("paw_name", name);
      const btn = form.querySelector("button");
      btn.disabled = true;
      if (await fbSend(el, { comment, name: name || null })) {
        form.comment.value = "";
        if (!el.classList.contains("fb-box")) form.hidden = true;
      }
      btn.disabled = false;
    });
  }

  // ---------- collapsible text ("ler mais") ----------
  const clampBox = (html, lines = 3, cls = "") =>
    `<div class="clamp-wrap"><div class="clamp ${cls}" style="--lines:${lines}">${html}</div>` +
    `<button type="button" class="more-btn" data-clamp hidden>ler mais</button></div>`;
  function fitClamps(root) {
    root.querySelectorAll(".clamp-wrap:not(.open)").forEach((w) => {
      const c = w.querySelector(".clamp"), b = w.querySelector("[data-clamp]");
      if (c && b) b.hidden = c.scrollHeight <= c.clientHeight + 2;
    });
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-clamp]");
    if (!b) return;
    const w = b.closest(".clamp-wrap");
    const open = w.classList.toggle("open");
    b.textContent = open ? "ler menos" : "ler mais";
  });

  function paint(html) {
    app.innerHTML = html;
    fitClamps(app);
  }

  // ---------- item card v2 ----------
  // title · "por que importa" (first sentence) · badges · rest of the summary behind a tap on phones
  function card(it, { date = it._date, showTheme = true } = {}) {
    const regs = (DATA.topic && DATA.topic.regions) || {};
    const watch = it.watch_authors && it.watch_authors.length;
    const badges = [];
    if (date && isNewDigest(date)) badges.push(NEW);
    if (showTheme && it.theme) badges.push(`<span class="badge-t" title="${esc(themeLabel(it.theme))}">${esc(themeShort(it.theme))}</span>`);
    if (it.region && regs[it.region]) badges.push(`<span class="badge-t">${esc(regs[it.region])}</span>`);
    badges.push(`<span class="badge-t kind">${it.origin === "fonte" ? "notícia ou relatório" : "paper"}</span>`);
    if (watch) badges.push(...it.watch_authors.map((n) => `<span class="badge-t star">⭐ ${esc(n)}</span>`));
    if (it.watch_source) badges.push(`<span class="badge-t star">📌 ${esc(it.watch_source)}</span>`);
    const meta = [];
    if (date && it._date) meta.push(`<span class="date-tag">${esc(fmtShort(date))}</span>`);
    if (it.venue || it.origin) meta.push(esc(it.venue || it.origin));
    const au = authorsShort(it.authors);
    if (au) meta.push(esc(au));
    if (it.cited_by) meta.push(`cit: ${it.cited_by}`);
    const orig = it.original_title && it.original_title !== it.title
      ? `<div class="orig">${esc(it.original_title)}</div>` : "";
    const [why, rest] = splitFirst(it.summary);
    let body;
    if (wide()) {
      body = `<p class="summary"><span class="why-in">${md(why)}</span>${rest ? " " + md(rest) : ""}</p>${orig}`;
    } else {
      body = `<p class="why">${md(why)}</p>` + (rest || orig
        ? `<details class="more"><summary><span class="more-l">Resumo completo</span></summary>${rest ? `<p class="summary">${md(rest)}</p>` : ""}${orig}</details>`
        : "");
    }
    return `
      <article class="card item${watch ? " watch" : ""}">
        <div class="card-top">
          <h3><a href="${esc(safeUrl(it.url))}" target="_blank" rel="noopener">${esc(it.title)}</a></h3>
          <span class="score ${scoreClass(it.score)}" title="nota de relevância × qualidade">${it.score}/10</span>
        </div>
        <div class="badges">${badges.join("")}</div>
        ${body}
        <div class="meta">${meta.join(" · ")}</div>
        ${fbBar("paper", it.key || it.url, it.title)}
      </article>`;
  }

  // ---------- navigation ----------
  // Five destinations (bottom bar on phones, top nav on desktop); inner tabs for Novidades and Mapa.
  const DEST = { home: "inicio", digest: "novidades", arquivo: "novidades", tendencias: "mapa", evolucao: "mapa",
    anual: "mapa", pergunte: "pergunte", regulacao: "mais", watchlist: "mais", mais: "mais" };
  let current = "home";
  function setTab(tab) {
    current = tab;
    const dest = DEST[tab] || "inicio";
    document.querySelectorAll("[data-dest]").forEach((a) => {
      const on = a.dataset.dest === dest;
      a.classList.toggle("active", on);
      if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    document.body.dataset.view = tab;
    document.body.classList.remove("typing");
  }
  function subtabs(group, active) {
    const tabs = group === "novidades"
      ? [["digest", "#/novidades", "Digest"], ["arquivo", "#/arquivo", "Arquivo"]]
      : [["tendencias", "#/tendencias", "Tendências"], ["evolucao", "#/evolucao", "Evolução"], ["anual", "#/anual", "Anual"]];
    return `<nav class="subtabs" aria-label="${group === "novidades" ? "Novidades" : "Mapa do campo"}">${tabs.map(([k, h, l]) =>
      `<a href="${h}"${k === active ? ' class="on" aria-current="page"' : ""}>${l}</a>`).join("")}</nav>`;
  }

  // ---------- views ----------
  function allItems() {
    const out = [];
    for (const d of DATA.digests) for (const it of d.items) out.push({ ...it, _date: d.date });
    return out;
  }
  const regSorted = () => (DATA.regulation || []).slice().sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  function sinceStrip() {
    const ds = DATA.digests;
    const last = ds[0];
    if (!VISIT.prev) {
      return `<section class="since first">
        <div class="since-h">Primeira visita por aqui</div>
        <p>${last ? `O digest mais recente cobre <a href="#/novidades">${esc(fmtPeriod(last))}</a>, com ${plural(last.items.length, "item selecionado", "itens selecionados")}.` : "Ainda não há digest."}
          Na próxima visita, esta faixa mostra o que entrou desde hoje.</p>
      </section>`;
    }
    const newDs = ds.filter((d) => isNewDigest(d.date));
    const nItems = newDs.reduce((s, d) => s + d.items.length, 0);
    const nEvo = newEvo();
    const nReg = (DATA.regulation || []).filter(isNewReg).length;
    const chips = [];
    if (nItems) chips.push(`<a class="since-c" href="#/novidades"><b>${nItems}</b> ${nItems === 1 ? "item novo" : "itens novos"} em ${plural(newDs.length, "digest", "digests")}</a>`);
    else if (newDs.length) chips.push(`<a class="since-c" href="#/novidades"><b>${newDs.length}</b> ${newDs.length === 1 ? "digest novo" : "digests novos"}</a>`);
    if (nEvo) chips.push(`<a class="since-c" href="#/evolucao"><b>${nEvo}</b> ${nEvo === 1 ? "marco novo" : "marcos novos"} na Evolução</a>`);
    if (nReg) chips.push(`<a class="since-c" href="#/regulacao"><b>${nReg}</b> ${nReg === 1 ? "norma nova" : "normas novas"}</a>`);
    return `<section class="since">
      <div class="since-h">Desde sua última visita <span class="muted">· ${esc(fmtDate(VISIT.prev.at, { day: "numeric", month: "short" }))}</span></div>
      ${chips.length ? `<div class="since-row">${chips.join("")}</div>` : `<p class="muted">Nada novo desde então. O próximo digest sai amanhã cedo.</p>`}
    </section>`;
  }

  const ONBOARD_Q = "Estou chegando agora neste campo: quais conceitos, marcos e debates preciso conhecer primeiro, e por onde começo a ler?";
  function askExamples() {
    const th = Object.values(DATA.themes).map((t) => lcFirst(stripMark(t)));
    const t0 = th[0] || "este tema", t1 = th[1] || t0, t2 = th[2] || t0;
    const hasReg = (DATA.regulation || []).length > 0;
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

  function viewHome() {
    setTab("home");
    const ev = DATA.evolution;
    const years = Object.keys(DATA.annual || {}).sort().reverse();
    const an = years.length ? DATA.annual[years[0]] : null;
    let html = `
      <p class="kicker">Atualizado em ${esc(fmtDate(DATA.generated))}</p>
      <h1 class="day">O que importa agora</h1>
      ${sinceStrip()}`;

    if (ev && ev.now && ev.now.summary) {
      html += `<section class="home-sec">
        <h2 class="theme-h">Estado do campo</h2>
        <div class="state">${clampBox(md(ev.now.summary), 3)}</div>
        <a class="go" href="#/evolucao">Ver a evolução do campo ${ICON.arrow}</a>
      </section>`;
    }

    const tk = an ? (an.trends || []).filter((t) => t.title).slice(0, 5) : [];
    if (tk.length) {
      const y = years[0];
      html += `<section class="home-sec">
        <h2 class="theme-h">Conclusões de ${esc(y)}${an.partial ? ` <span class="muted">até ${esc(fmtDate(an.generated, { day: "numeric", month: "short" }))}</span>` : ""}</h2>
        <ol class="takeaways">${tk.map((t) => `<li><b>${esc(t.title)}</b>${t.text ? `<span>${md(splitFirst(t.text)[0])}</span>` : ""}</li>`).join("")}</ol>
        <a class="go" href="#/anual/${esc(y)}">Ver a retrospectiva ${esc(y)} ${ICON.arrow}</a>
      </section>`;
    }

    const recentDates = new Set(DATA.digests.slice(0, 7).map((d) => d.date));
    const seen = new Set();
    const best = allItems().filter((it) => recentDates.has(it._date))
      .sort((a, b) => b.score - a.score || b._date.localeCompare(a._date))
      .filter((it) => { const k = it.key || it.url; if (seen.has(k)) return false; seen.add(k); return true; })
      .slice(0, 3);
    if (best.length) {
      html += `<section class="home-sec">
        <h2 class="theme-h">Melhores dos últimos digests</h2>
        ${best.map((it) => card(it)).join("")}
        <a class="go" href="#/novidades">Ver o digest mais recente ${ICON.arrow}</a>
      </section>`;
    }

    const regs = regSorted().filter((g) => !g.revoked && !g.cancelled).slice(0, 3);
    if (regs.length) {
      html += `<section class="home-sec">
        <h2 class="theme-h">Regulação recente</h2>
        <ul class="reg-mini">${regs.map((g) => `<li>
          <div class="meta">${isNewReg(g) ? NEW : ""}${esc(g.regulator || "")}${g.date ? ` · ${esc(fmtShort(g.date.slice(0, 10)))}` : ""}</div>
          <a class="reg-t" href="${esc(safeUrl(g.url))}" target="_blank" rel="noopener">${esc(g.title)}</a>
          ${g.summary ? `<p>${md(splitFirst(g.summary)[0])}</p>` : ""}
        </li>`).join("")}</ul>
        <a class="go" href="#/regulacao">Ver todas as ${(DATA.regulation || []).length} normas ${ICON.arrow}</a>
      </section>`;
    }

    const ask = fbOn();
    html += `<section class="home-sec newbie">
      <h2>Novo por aqui?</h2>
      <p>Comece pela <a href="#/evolucao">Evolução</a>, que conta em poucas páginas como o campo chegou até aqui e quais são os marcos.
        ${ask ? `Depois, peça um panorama ao arquivo:` : `Depois, use a busca para achar papers, pessoas e normas.`}</p>
      <div class="newbie-row">
        <a class="btn" href="#/evolucao">Ler a Evolução</a>
        ${ask ? `<a class="btn ghost" href="#/pergunte?q=${encodeURIComponent(ONBOARD_Q)}">Pedir um panorama</a>`
          : `<button type="button" class="btn ghost" data-open-search>Buscar</button>`}
      </div>
    </section>`;

    if (ask) {
      const ex = askExamples().slice(1, 4);
      html += `<section class="home-sec">
        <h2 class="theme-h">Pergunte ao arquivo</h2>
        <form class="home-ask" id="home-ask">
          <label class="sr-only" for="home-q">Sua pergunta</label>
          <input id="home-q" name="q" type="text" enterkeyhint="send" maxlength="600" placeholder="Pergunte sobre este tema…" autocomplete="off">
          <button type="submit" aria-label="Perguntar">${ICON.send}</button>
        </form>
        <div class="ex-list">${ex.map((x) => `<button type="button" class="ex" data-home-ex="${esc(x.q)}"><span class="ex-i">${esc(x.intent)}</span>${esc(x.q)}</button>`).join("")}</div>
      </section>`;
    }
    paint(html);
    const f = document.getElementById("home-ask");
    if (f) {
      const go = (q) => { if (q.trim().length >= 5) location.hash = `#/pergunte?q=${encodeURIComponent(q.trim())}&go=1`; };
      f.addEventListener("submit", (e) => { e.preventDefault(); go(f.q.value); });
      app.querySelectorAll("[data-home-ex]").forEach((b) => b.addEventListener("click", () => {
        location.hash = `#/pergunte?q=${encodeURIComponent(b.dataset.homeEx)}`;
      }));
    }
  }

  function viewDigest(date) {
    setTab("digest");
    const ds = DATA.digests;
    if (!ds.length) { paint(subtabs("novidades", "digest") + `<div class="empty">Nenhum digest ainda.</div>`); return; }
    const idx = Math.max(0, date ? ds.findIndex((d) => d.date === date) : 0);
    const d = ds[idx];
    const newer = ds[idx - 1], older = ds[idx + 1];
    const options = ds.map((x) => `<option value="${x.date}"${x.date === d.date ? " selected" : ""}>${esc(fmtPeriod(x, true))}${isNewDigest(x.date) ? " · novo" : ""}</option>`).join("");

    let html = `${subtabs("novidades", "digest")}
      <div class="day-nav">
        <button class="nav-btn" data-go="${older ? older.date : ""}" ${older ? "" : "disabled"} aria-label="Digest anterior">‹</button>
        <select id="day-select" aria-label="Escolher digest">${options}</select>
        <button class="nav-btn" data-go="${newer ? newer.date : ""}" ${newer ? "" : "disabled"} aria-label="Próximo digest">›</button>
      </div>
      <h1 class="day">${esc(fmtPeriod(d))}${isNewDigest(d.date) ? ` ${NEW}` : ""}</h1>
      ${d.headline ? `<p class="dek">${md(d.headline.charAt(0).toUpperCase() + d.headline.slice(1))}</p>` : ""}`;
    if (d.trend) html += `<div class="trend"><span class="label">Tendência do período</span>${clampBox(md(d.trend), 3)}</div>`;
    if (!d.items.length) html += `<div class="empty">Nada acima da barra neste período.</div>`;
    const regs = (DATA.topic && DATA.topic.regions) || {};
    if (Object.keys(regs).length) {
      html += `<div class="chips region-chips">` + [["", "Todos"], ...Object.entries(regs)].map(([k, v]) =>
        `<button class="chip" data-region="${esc(k)}" aria-pressed="${state.region === k}">${esc(v)}</button>`).join("") + `</div>`;
    }
    const inRegion = (it) => !state.region || it.region === state.region;

    for (const key of Object.keys(DATA.themes)) {
      const group = d.items.filter((it) => it.theme === key && inRegion(it));
      if (!group.length) continue;
      html += `<h2 class="theme-h">${esc(themeLabel(key))}</h2>` + group.map((it) => card(it, { date: d.date, showTheme: false })).join("");
    }
    if (d.quick && d.quick.length) {
      html += `<section class="quick"><h2 class="theme-h">Menções rápidas</h2><ul>` +
        d.quick.filter(inRegion).map((q) => `<li>${q.region && regs[q.region] ? `<span class="region-tag">${esc(regs[q.region])}</span> ` : ""}<a href="${esc(safeUrl(q.url))}" target="_blank" rel="noopener">${esc(q.title)}</a>${q.note ? ` — ${md(q.note)}` : ""}</li>`).join("") +
        `</ul></section>`;
    }
    const st = d.stats || {};
    const bits = [`${st.candidates ?? "?"} candidatos`, `${st.triaged ?? "?"} avaliados`, `${d.items.length} selecionados`];
    if (d.model) bits.push(`modelo ${esc(d.model.split("/").pop())}`);
    if (st.tokens && st.tokens.cost_usd) bits.push(`US$ ${st.tokens.cost_usd.toFixed(3)}`);
    html += `<p class="digest-foot">${bits.join(" · ")} · <button type="button" class="link-btn" data-open-about>sobre</button></p>`;
    html += fbBox("digest", d.date, d.headline || d.date, "O que achou deste digest?",
      "O que foi útil, o que sobrou, o que faltou? Algum paper que você esperava ver aqui?");
    paint(html);
    app.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => {
      if (b.dataset.go) location.hash = `#/d/${b.dataset.go}`;
    }));
    document.getElementById("day-select").addEventListener("change", (e) => { location.hash = `#/d/${e.target.value}`; });
    app.querySelectorAll("[data-region]").forEach((b) => b.addEventListener("click", () => {
      state.region = b.dataset.region; viewDigest(d.date);
    }));
  }

  function viewArchive() {
    setTab("arquivo");
    const chips = Object.entries(DATA.themes).map(([k, v]) =>
      `<button class="chip" data-theme="${k}" aria-pressed="${state.themes.has(k)}">${esc(v)}</button>`).join("");
    paint(`${subtabs("novidades", "arquivo")}
      <h1 class="day">Arquivo</h1>
      <p class="dek">Todos os papers selecionados, de todos os digests.</p>
      <div class="filters">
        <input class="search" id="q" type="search" placeholder="Filtrar por título, autor, venue, resumo…" value="${esc(state.q)}">
        <div class="chips">${chips}</div>
        <div class="filter-row">
          <label>Nota mínima <input id="min" type="range" min="0" max="10" value="${state.minScore}"> <b id="minv">${state.minScore}</b></label>
          <label class="check"><input id="ow" type="checkbox" ${state.onlyWatch ? "checked" : ""}> só da watchlist ⭐📌</label>
        </div>
      </div>
      <div class="count" id="count"></div>
      <div id="results"></div>`);

    const items = allItems();
    const render = () => {
      const q = state.q.trim().toLowerCase();
      const res = items.filter((it) =>
        it.score >= state.minScore &&
        (!state.themes.size || state.themes.has(it.theme)) &&
        (!state.onlyWatch || (it.watch_authors && it.watch_authors.length) || it.watch_source) &&
        (!q || [it.title, it.original_title, it.summary, it.venue, (it.authors || []).join(" "), (it.institutions || []).join(" ")]
          .join(" ").toLowerCase().includes(q)));
      document.getElementById("count").textContent = `${res.length} de ${items.length} papers`;
      document.getElementById("results").innerHTML = res.length
        ? res.map((it) => card(it)).join("")
        : `<div class="empty">Nenhum paper com esses filtros.</div>`;
    };
    document.getElementById("q").addEventListener("input", (e) => { state.q = e.target.value; render(); });
    document.getElementById("min").addEventListener("input", (e) => {
      state.minScore = +e.target.value; document.getElementById("minv").textContent = e.target.value; render();
    });
    document.getElementById("ow").addEventListener("change", (e) => { state.onlyWatch = e.target.checked; render(); });
    app.querySelectorAll(".chip").forEach((c) => c.addEventListener("click", () => {
      const k = c.dataset.theme;
      state.themes.has(k) ? state.themes.delete(k) : state.themes.add(k);
      c.setAttribute("aria-pressed", state.themes.has(k));
      render();
    }));
    render();
  }

  function viewTrends() {
    setTab("tendencias");
    const ds = DATA.digests.filter((d) => d.trend);
    paint(`${subtabs("mapa", "tendencias")}
      <h1 class="day">Tendências</h1>
      <p class="dek">A síntese de cada digest, em ordem cronológica reversa.</p>
      ${ds.length ? `<div class="timeline">${ds.map((d) => `
        <div class="tl-item">
          <a class="d" href="#/d/${d.date}">${esc(fmtPeriod(d))}</a>${isNewDigest(d.date) ? ` ${NEW}` : ""}
          <p>${md(d.trend)}</p>
        </div>`).join("")}</div>` : `<div class="empty">Sem tendências ainda.</div>`}`);
  }

  // ---------- regulation (norms and standards linked to the topic) ----------
  function viewRegulation(filter) {
    setTab("regulacao");
    const all = DATA.regulation || [];
    const br = all.filter((g) => g.source === "bacen");
    const intl = all.filter((g) => g.source !== "bacen");
    const q = (filter || "").toLowerCase();
    const match = (g) => !q || [g.title, g.subject, g.summary, ...(g.techniques || []), ...(g.requires || [])].join(" ").toLowerCase().includes(q);
    const card = (g) => `
      <article class="card item reg">
        <div class="meta">${isNewReg(g) ? NEW : ""}<span>${esc(g.regulator || "")}</span>${g.date ? ` · <span>${esc(fmtDate(g.date.slice(0, 10)))}</span>` : ""}
          ${g.revoked ? `<span class="badge lo">revogada</span>` : ""}${g.status_note ? `<span class="badge mid">${esc(g.status_note)}</span>` : ""}
          ${g.score ? `<span class="score ${scoreClass(g.score)}">${g.score}</span>` : ""}</div>
        <h3><a href="${esc(safeUrl(g.url))}" target="_blank" rel="noopener">${esc(g.title)}</a></h3>
        ${g.subject && g.source === "bacen" ? `<p class="muted small">${esc(g.subject)}</p>` : ""}
        <p class="summary">${md(g.summary || "")}</p>
        ${(g.requires || []).length ? `<details><summary>O que exige</summary><ul>${g.requires.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>
          ${g.applies_to ? `<p class="small"><strong>A quem se aplica:</strong> ${esc(g.applies_to)}</p>` : ""}
          ${g.effective ? `<p class="small"><strong>Vigência:</strong> ${esc(g.effective)}</p>` : ""}</details>` : ""}
        ${(g.techniques || []).length ? `<p class="tags">${g.techniques.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</p>` : ""}
      </article>`;
    const section = (title, xs) => xs.length ? `<h2 class="theme-h">${title} <span class="muted small">${xs.length}</span></h2>${xs.map(card).join("")}` : "";
    paint(`
      <h1 class="day">Regulação</h1>
      <p class="dek">Normas e padrões que tocam este tema, com o que exigem e as técnicas que afetam. Brasil: ${br.length} normativos do Banco Central e do CMN
        triados e resumidos a partir do texto oficial; internacional: ${intl.length} marcos selecionados pela curadoria. Resumos feitos por IA: confira no texto oficial.</p>
      <input id="reg-q" class="reg-q" type="search" placeholder="Filtrar (ex.: autenticação, MED, nuvem)" value="${esc(filter || "")}">
      ${all.length ? section("🇧🇷 Brasil", br.filter(match)) + section("🌐 Internacional", intl.filter(match))
        : `<div class="empty">Sem normas mapeadas para este tema ainda.</div>`}`);
    const inp = document.getElementById("reg-q");
    inp.addEventListener("change", () => viewRegulation(inp.value));
    inp.addEventListener("keyup", (e) => { if (e.key === "Enter") viewRegulation(inp.value); });
  }

  function viewWatchlist() {
    setTab("watchlist");
    const wl = DATA.watchlist || {};
    const hits = {};
    for (const it of allItems()) for (const n of [...(it.watch_authors || []), ...(it.watch_source ? [it.watch_source] : [])]) hits[n] = (hits[n] || 0) + 1;
    const people = wl.researchers || [];
    const known = ["EUA", "Europa", "China/Ásia", "Brasil"];
    const regions = [...known, ...new Set(people.map((p) => p.region || "Outros").filter((r) => !known.includes(r)))];
    const L = Object.assign({ researchers: "Pesquisadores", journals: "Journals", centers: "Centros & laboratórios",
      practitioners: "Praticantes & fontes", historical: "Referências históricas" }, DATA.topic.watchlist_labels || {});
    function person(p, evoCount) {
      const links = Object.entries(p.links || {}).filter(([, u]) => u)
        .map(([k, u]) => `<a href="${esc(safeUrl(u))}" target="_blank" rel="noopener">${esc(k)}</a>`);
      if (p.openalex_id) links.push(`<a href="https://openalex.org/authors/${esc(p.openalex_id)}" target="_blank" rel="noopener">openalex</a>`);
      const status = p.status ? `<span class="status">${esc(p.status)}${p.since ? ` em ${esc(p.since)}` : ""}</span>` : "";
      return `<div class="person${p.status ? " hist" : ""}">
        <div class="n">${esc(p.name)} ${status}</div>
        <div class="i">${esc(p.institution || "")}</div>
        ${p.area ? `<div class="a">${esc(p.area)}</div>` : ""}
        ${p.why ? `<div class="w">${esc(p.why)}</div>` : ""}
        ${hits[p.name] ? `<div class="hits">⭐ ${hits[p.name]} paper(s) no arquivo</div>` : ""}
        ${evoCount ? `<div class="hits">🏛️ ${evoCount} marco(s) na Evolução</div>` : ""}
        ${links.length ? `<div class="l">${links.join("")}</div>` : ""}
      </div>`;
    }
    let html = `
      <h1 class="day">Pessoas & instituições</h1>
      <p class="dek">Referências monitoradas (a watchlist). Papers novos desses autores entram na triagem com bônus e ganham ⭐; posts, relatórios e normas das fontes ganham 📌.</p>
      <section class="wl-section"><h2>${esc(L.researchers)} <span class="muted">(${people.length})</span></h2>`;
    for (const r of regions) {
      const group = people.filter((p) => (p.region || "Outros") === r);
      if (!group.length) continue;
      html += `<h3 class="region-h">${esc(r)} · ${group.length}</h3><div class="people">` + group.map((p) => person(p)).join("") + `</div>`;
    }
    html += `</section>`;
    const hist = wl.historical || [];
    if (hist.length) {
      const evoHits = {};
      for (const e of (DATA.evolution || {}).eras || []) for (const m of e.milestones) for (const n of m.watch || []) evoHits[n] = (evoHits[n] || 0) + 1;
      html += `<section class="wl-section"><h2>${esc(L.historical)} <span class="muted">(${hist.length})</span></h2>
        <p class="muted wl-note">Não são mais monitorados no dia a dia; as obras entram na aba <a href="#/evolucao">Evolução</a>.</p>
        <div class="people">` + hist.map((p) => person(p, evoHits[p.name])).join("") + `</div></section>`;
    }
    const simple = (title, arr, nameKey, subKey) => !arr || !arr.length ? "" : `
      <section class="wl-section"><h2>${title} <span class="muted">(${arr.length})</span></h2><ul class="list-simple">` +
      arr.map((x) => {
        const name = x.url ? `<a href="${esc(safeUrl(x.url))}" target="_blank" rel="noopener"><b>${esc(x[nameKey])}</b></a>` : `<b>${esc(x[nameKey])}</b>`;
        const hit = hits[x[nameKey]] ? ` <span class="hits">📌 ${hits[x[nameKey]]} no arquivo</span>` : "";
        return `<li>${name}${subKey && x[subKey] ? ` <span class="muted">· ${esc(x[subKey])}</span>` : ""}${x.why ? ` — ${esc(x.why)}` : ""}${hit}</li>`;
      }).join("") + `</ul></section>`;
    html += simple(esc(L.journals), wl.journals, "name");
    html += simple(esc(L.centers), wl.centers, "name", "institution");
    html += simple(esc(L.practitioners), wl.practitioners, "name", "org");
    html += fbBox("watchlist", "geral", "Watchlist", "Falta alguém?",
      "Algum pesquisador, journal, centro ou fonte que deveria estar aqui (ou sair)?");
    paint(html);
  }

  // ---------- evolution ----------
  const evoState = { theme: null };

  function changesBox(ev) {
    const ch = ev.changes;
    if (!ch || !((ch.added || []).length || (ch.removed || []).length || ch.note)) return "";
    const since = !ch.since ? "" : ch.since.length > 7 ? fmtDate(ch.since)
      : new Date(ch.since + "-15T12:00:00").toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    const li = (m, sign) => `<li><span class="chg-${sign === "+" ? "add" : "del"}">${sign}</span> ${esc(m.title)} <span class="muted">(${esc(m.year ?? "")})</span></li>`;
    return `<details class="changes" open>
      <summary>O que mudou desde ${esc(since)} · <b>+${(ch.added || []).length}</b> / <b>−${(ch.removed || []).length}</b> marcos${ev.mode === "completa" ? " · revisão completa" : ""}</summary>
      ${ch.note ? `<p>${md(ch.note)}</p>` : ""}
      <ul>${(ch.added || []).map((m) => li(m, "+")).join("")}${(ch.removed || []).map((m) => li(m, "−")).join("")}</ul>
    </details>`;
  }

  function viewEvolution() {
    setTab("evolucao");
    const ev = DATA.evolution;
    if (!ev || !ev.eras || !ev.eras.length) {
      paint(`${subtabs("mapa", "evolucao")}<h1 class="day">Evolução</h1>
        <div class="empty">A linha do tempo do estado da arte ainda não foi gerada para este tema.<br>
        Ela é montada uma vez por mês a partir da rede de citações.</div>`);
      return;
    }
    const used = new Set(ev.eras.flatMap((e) => e.milestones.map((m) => m.theme)));
    const chips = [`<button class="chip" data-evo="" aria-pressed="${!evoState.theme}">Todos os temas</button>`]
      .concat(Object.entries(DATA.themes).filter(([k]) => used.has(k)).map(([k, v]) =>
        `<button class="chip" data-evo="${esc(k)}" aria-pressed="${evoState.theme === k}">${esc(v)}</button>`)).join("");
    const thread = evoState.theme && (ev.threads || []).find((t) => t.theme === evoState.theme);

    const milestone = (m) => {
      const au = authorsShort(m.authors);
      const meta = [esc(m.venue || ""), au ? esc(au) : "", m.cited_by ? `${m.cited_by.toLocaleString("pt-BR")} citações` : ""]
        .filter(Boolean).join(" · ");
      return `<li class="ms">
        <span class="ms-year">${esc(m.year ?? "")}</span>
        <div class="ms-body">
          ${m.new ? `<span class="ms-new">novo</span>` : ""}<a class="ms-title" href="${esc(safeUrl(m.url))}" target="_blank" rel="noopener">${esc(m.title)}</a>
          <div class="meta">${meta}</div>
          ${m.why ? `<p class="summary">${md(m.why)}</p>` : ""}
          <span class="ms-theme">${esc(themeLabel(m.theme))}</span>
          ${fbBar("marco", m.id || m.url, m.title)}
        </div>
      </li>`;
    };

    let html = `${subtabs("mapa", "evolucao")}
      <h1 class="day">Evolução do estado da arte</h1>
      ${ev.overview ? `<p class="dek">${md(ev.overview)}</p>` : ""}
      <div class="stats">
        <span><b>${ev.stats.milestones}</b> marcos</span>
        <span>rede de <b>${ev.stats.network.toLocaleString("pt-BR")}</b> obras</span>
        <span>gerado em ${esc(fmtDate(ev.generated))}</span>
      </div>
      ${changesBox(ev)}
      <div class="chips evo-chips">${chips}</div>
      ${thread ? `<div class="trend"><span class="label">Como este tema evoluiu</span>${md(thread.line)}</div>` : ""}
      <div class="evo">`;
    for (const e of ev.eras) {
      const ms = e.milestones.filter((m) => !evoState.theme || m.theme === evoState.theme);
      html += `<section class="era">
        <div class="era-label">${esc(e.label)}</div>
        <h2 class="era-title">${esc(e.title)}</h2>
        ${e.summary ? `<p class="era-summary">${md(e.summary)}</p>` : ""}
        ${ms.length ? `<ol class="ms-list">${ms.map(milestone).join("")}</ol>`
          : `<p class="muted era-none">Nenhum marco deste tema nesta época.</p>`}
      </section>`;
    }
    html += `</div>`;
    if (ev.now && ev.now.summary) {
      html += `<section class="now" id="agora">
        <h2 class="theme-h">Onde estamos agora</h2>
        <p>${md(ev.now.summary)}</p>
        ${ev.now.open_questions && ev.now.open_questions.length
          ? `<h3 class="now-q">Perguntas em aberto</h3><ul class="list-simple">${ev.now.open_questions.map((q) => `<li>${md(q)}</li>`).join("")}</ul>` : ""}
      </section>`;
    }
    if (ev.model) html += `<p class="digest-foot">modelo ${esc(ev.model.split("/").pop())}</p>`;
    html += fbBox("evolucao", ev.generated, "Evolução do estado da arte", "A linha do tempo faz sentido?",
      "Falta algum marco? Algum não deveria estar aí? A divisão em épocas faz sentido para você?");
    paint(html);
    app.querySelectorAll("[data-evo]").forEach((c) => c.addEventListener("click", () => {
      evoState.theme = c.dataset.evo || null;
      const y = window.scrollY;
      viewEvolution();
      window.scrollTo(0, y);
    }));
  }

  // ---------- annual review ----------
  const COUNTRY = { BR: "Brasil", US: "EUA", GB: "Reino Unido", CN: "China", DE: "Alemanha", FR: "França", IN: "Índia",
    CA: "Canadá", AU: "Austrália", NL: "Holanda", IT: "Itália", ES: "Espanha", CH: "Suíça", SG: "Singapura", HK: "Hong Kong",
    JP: "Japão", KR: "Coreia do Sul", BE: "Bélgica", SE: "Suécia", DK: "Dinamarca", IL: "Israel", TW: "Taiwan", PT: "Portugal" };
  const country = (c) => COUNTRY[c] || c || "";

  function viewAnnual(year) {
    setTab("anual");
    const all = DATA.annual || {};
    const years = Object.keys(all).sort().reverse();
    if (!years.length) {
      paint(`${subtabs("mapa", "anual")}<h1 class="day">Retrospectiva anual</h1>
        <div class="empty">A retrospectiva ainda não foi gerada para este tema.<br>Ela é atualizada todo mês, junto com a Evolução.</div>`);
      return;
    }
    const y = years.includes(year) ? year : years[0];
    const d = all[y];
    const regs = (DATA.topic && DATA.topic.regions) || {};
    const pct = (x) => `${Math.round(x * 100)}%`;
    const chg = (g) => g.change === null || g.change === undefined ? "—"
      : `<span class="${g.change >= 0 ? "up" : "down"}">${g.change >= 0 ? "▲" : "▼"} ${Math.abs(Math.round(g.change * 100))}%</span>`;
    const card = (h) => {
      const meta = [];
      if (h.region && regs[h.region]) meta.push(`<span class="region-tag">${esc(regs[h.region])}</span>`);
      if (h.watch_authors && h.watch_authors.length) meta.push(h.watch_authors.map((n) => `<span class="star">⭐ ${esc(n)}</span>`).join(""));
      meta.push(esc(h.venue || ""));
      const au = authorsShort(h.authors); if (au) meta.push(esc(au));
      meta.push(`${(h.cited_by || 0).toLocaleString("pt-BR")} citações`);
      return `<article class="card${h.watch_authors && h.watch_authors.length ? " watch" : ""}">
        <div class="card-top"><h3><a href="${esc(safeUrl(h.url))}" target="_blank" rel="noopener">${esc(h.title)}</a></h3>
        <span class="score ${scoreClass(h.score)}">${h.score}/10</span></div>
        <div class="meta">${meta.join(" · ")}</div>
        ${h.why ? `<p class="summary">${md(h.why)}</p>` : ""}
      </article>`;
    };
    let html = `${subtabs("mapa", "anual")}
      <div class="chips year-chips">${years.map((k) => `<button class="chip" data-year="${k}" aria-pressed="${k === y}">${k}${all[k].partial ? " (parcial)" : ""}</button>`).join("")}</div>
      <h1 class="day">Retrospectiva ${esc(y)}${d.partial ? ` <span class="muted">até ${esc(fmtDate(d.generated, { day: "2-digit", month: "short" }))}</span>` : ""}</h1>
      ${d.overview ? `<p class="dek">${md(d.overview)}</p>` : ""}
      <div class="stats">
        <span><b>${d.stats.works.toLocaleString("pt-BR")}</b> obras do ano</span>
        <span><b>${d.stats.triaged}</b> avaliadas</span>
        <span><b>${d.highlights.length}</b> destaques</span>
      </div>`;
    if ((d.trends || []).length) {
      html += `<h2 class="theme-h">Tendências do ano</h2><div class="trends-grid">` +
        d.trends.map((t) => `<div class="trend-card"><b>${esc(t.title || "")}</b><p>${md(t.text || "")}</p></div>`).join("") + `</div>`;
    }
    const geo = d.geography || {};
    html += `<h2 class="theme-h">Onde a inovação acontece</h2>${d.innovation ? `<p>${md(d.innovation)}</p>` : ""}
      <div class="geo">
        <div><h3 class="region-h">Quem publica</h3>${(geo.sectors || []).map((s) =>
          `<div class="bar-row"><span>${esc(s.name)}</span><span class="bar"><i style="width:${pct(s.share)}"></i></span><b>${pct(s.share)}</b></div>`).join("")}
          <p class="muted small">% das ${(geo.works || 0).toLocaleString("pt-BR")} obras com ao menos um autor do setor.</p></div>
        <div><h3 class="region-h">Instituições</h3><ol class="list-simple">${(geo.institutions || []).slice(0, 10).map((i) =>
          `<li>${esc(i.name)} <span class="muted">· ${esc(country(i.country))} · ${i.works}</span></li>`).join("")}</ol></div>
        <div><h3 class="region-h">Países</h3><ol class="list-simple">${(geo.countries || []).slice(0, 10).map((c) =>
          `<li>${esc(country(c.code))} <span class="muted">· ${c.works}</span></li>`).join("")}</ol></div>
        ${(geo.companies || []).length ? `<div><h3 class="region-h">Empresas que publicam</h3><ol class="list-simple">${geo.companies.slice(0, 10).map((c) =>
          `<li>${esc(c.name)} <span class="muted">· ${esc(country(c.country))} · ${c.works}</span></li>`).join("")}</ol></div>` : ""}
      </div>`;
    html += `<h2 class="theme-h">Destaques do ano</h2>`;
    for (const key of Object.keys(DATA.themes)) {
      const group = d.highlights.filter((h) => h.theme === key);
      if (group.length) html += `<h3 class="region-h">${esc(themeLabel(key))}</h3>` + group.map(card).join("");
    }
    if ((d.growth || []).length) {
      html += `<h2 class="theme-h">Volume de publicações por subtema</h2>
        <div class="table-scroll"><table class="growth"><thead><tr><th>Subtema</th><th>${+y - 1}</th><th>${esc(y)}${d.partial ? "*" : ""}</th><th>Variação</th></tr></thead><tbody>` +
        d.growth.map((g) => `<tr><td title="${esc(g.query)}">${esc(g.label)}</td><td>${g.prev.toLocaleString("pt-BR")}</td><td>${g.cur_full_year.toLocaleString("pt-BR")}</td><td>${chg(g)}</td></tr>`).join("") +
        `</tbody></table></div>${d.partial ? `<p class="muted small">* ano em curso, projetado para 12 meses; o OpenAlex indexa com algum atraso, então a variação recente tende a sair subestimada.</p>` : ""}`;
    }
    if (d.model) html += `<p class="digest-foot">modelo ${esc(d.model.split("/").pop())}</p>`;
    paint(html);
    app.querySelectorAll("[data-year]").forEach((b) => b.addEventListener("click", () => { location.hash = `#/anual/${b.dataset.year}`; }));
  }

  // ---------- Mais ----------
  function viewMore() {
    setTab("mais");
    const wl = DATA.watchlist || {};
    const nReg = (DATA.regulation || []).length;
    const nPeople = (wl.researchers || []).length + (wl.historical || []).length;
    const nOrg = ["journals", "centers", "practitioners"].reduce((s, k) => s + (Array.isArray(wl[k]) ? wl[k].length : 0), 0);
    const nPapers = DATA.digests.reduce((s, d) => s + d.items.length, 0);
    const row = (href, icon, title, sub, attr = "") => `<li><${href ? `a href="${href}"` : `button type="button" ${attr}`} class="more-row">
      <span class="more-ico">${icon}</span><span class="more-txt"><b>${title}</b><span>${sub}</span></span><span class="more-go">${ICON.arrow}</span>
    </${href ? "a" : "button"}></li>`;
    paint(`
      <h1 class="day">Mais</h1>
      <ul class="more-list">
        ${nReg ? row("#/regulacao", ICON.reg, "Regulação", `${nReg} normas e padrões ligados ao tema`) : ""}
        ${row("#/watchlist", ICON.people, "Pessoas & instituições", `${nPeople} pesquisadores, ${nOrg} revistas, centros e fontes`)}
        ${row("#/arquivo", ICON.archive, "Arquivo", `${nPapers} papers de ${DATA.digests.length} digests, com filtros`)}
        ${row("", ICON.info, "Sobre", "O que é o site, como citar, integrações", "data-open-about")}
        ${(DATA.topics || []).length > 1 ? row("", ICON.swap, "Trocar de tema", (DATA.topics || []).map((t) => esc(t.name)).join(" · "), "data-open-topics") : ""}
      </ul>`);
  }

  // ---------- ask the archive (POST /api/ask) ----------
  const askState = { history: [], busy: false, draft: "", pending: "" };

  function renderAnswer(h) {
    const cite = (n) => {
      const src = h.sources.find((x) => x.n === +n);
      return src && src.url
        ? `<a class="cite" href="${esc(safeUrl(src.url))}" target="_blank" rel="noopener" title="${esc(src.title)}">[${n}]</a>`
        : `<span class="cite">[${n}]</span>`;
    };
    const withCites = (s) => s.replace(/\[(\d{1,2})\]/g, (_, n) => cite(n));
    const block = (p) => {
      const lines = p.split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.length && lines.every((l) => /^[-*•] /.test(l))) return `<ul>${lines.map((l) => `<li>${withCites(l.slice(2))}</li>`).join("")}</ul>`;
      return lines.map((l) => /^#{1,4} /.test(l) || /^<strong>[^<]+<\/strong>:?$/.test(l)
        ? `<h4 class="qa-h">${withCites(l.replace(/^#{1,4} /, ""))}</h4>`
        : /^[-*•] /.test(l) ? `<p class="qa-li">• ${withCites(l.slice(2))}</p>` : `<p>${withCites(l)}</p>`).join("");
    };
    const body = md(h.a).split(/\n{2,}/).map(block).join("");
    const used = new Set([...h.a.matchAll(/\[(\d{1,2})\]/g)].map((m) => +m[1]));
    const list = h.sources.filter((x) => used.has(x.n)).sort((a, b) => a.n - b.n);
    const strip = list.length ? `<ol class="src-strip" aria-label="Fontes">${list.map((x) => `<li>${x.url
      ? `<a href="${esc(safeUrl(x.url))}" target="_blank" rel="noopener" title="${esc(x.title)}">`
      : `<span class="src-nolink" title="${esc(x.title)}">`}<span class="src-n">${x.n}</span><span class="src-t">${esc(x.title)}</span><span class="src-k">${esc(x.kind)}${x.when ? ` · ${esc(String(x.when).slice(0, 10))}` : ""}</span>${x.url ? "</a>" : "</span>"}</li>`).join("")}</ol>` : "";
    return `<article class="qa">
      <div class="q">${esc(h.q)}</div>
      ${strip}
      <div class="a">${body}</div>
      ${list.length ? `<details class="qa-srcs"><summary>Lista de fontes (${list.length})</summary><ol class="qa-src">${list.map((x) => `<li value="${x.n}">${x.url
        ? `<a href="${esc(safeUrl(x.url))}" target="_blank" rel="noopener">${esc(x.title)}</a>` : esc(x.title)}
        <span class="muted">· ${esc(x.kind)}${x.when ? `, ${esc(x.when)}` : ""}</span></li>`).join("")}</ol></details>` : ""}
      ${fbBar("resposta", h.q, h.q)}
    </article>`;
  }

  function viewAsk(params) {
    setTab("pergunte");
    const on = fbOn();
    const pre = params && params.get("q");
    const autoGo = params && params.get("go") === "1";
    if (pre) {
      askState.draft = pre;
      try { history.replaceState(null, "", "#/pergunte"); } catch { /* old browsers: the params just stay */ }
    }
    const ex = askExamples();
    const has = askState.history.length > 0;
    const exHtml = `<ul class="intents">${ex.map((x, i) => `<li><button type="button" class="ex" data-ex="${i}"${on ? "" : " disabled"}>
        <span class="ex-i">${esc(x.intent)}</span>${esc(x.q)}</button></li>`).join("")}</ul>`;
    paint(`
      <h1 class="day">Pergunte ao arquivo</h1>
      <p class="dek">A IA responde usando só o arquivo deste tema (digests, Evolução, retrospectivas, a biblioteca de papers triados, pessoas, normas e código) e cita cada fonte. Se o arquivo não cobre o assunto, ela diz.</p>
      ${on ? "" : `<div class="notice">As respostas só funcionam no site publicado. Nesta cópia, os exemplos abaixo mostram o que dá para perguntar.</div>`}
      ${has ? `<details class="ex-more"><summary>Exemplos de perguntas</summary>${exHtml}</details>` : `<h2 class="theme-h">${on ? "Comece por um exemplo" : "O que dá para perguntar"}</h2>${exHtml}`}
      <div id="qa-list">${askState.history.map(renderAnswer).join("")}${askState.pending ? `<article class="qa pending"><div class="q">${esc(askState.pending)}</div><p class="muted">Consultando o arquivo… leva uns 20 a 40 segundos.</p></article>` : ""}</div>
      <form id="ask-form" class="ask-form ask-dock"${on ? "" : " hidden"}>
        <div class="ask-meta">
          <span class="muted ask-hint" id="ask-msg" role="status">${has ? "Seguimentos usam a conversa acima." : "Leva uns 20 a 40 segundos."}</span>
          ${has ? `<button type="button" class="fb-link" id="ask-reset">nova conversa</button>` : ""}
        </div>
        <div class="ask-row">
          <label class="sr-only" for="ask-q">Sua pergunta</label>
          <textarea id="ask-q" name="q" rows="1" maxlength="600" enterkeyhint="send" placeholder="Pergunte sobre este tema…" required${on ? "" : " disabled"}></textarea>
          <button type="submit" class="ask-send" aria-label="Perguntar"${on && !askState.busy ? "" : " disabled"}>${ICON.send}</button>
        </div>
      </form>`);
    const form = document.getElementById("ask-form");
    const ta = form.q;
    const submit = () => (form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event("submit", { cancelable: true })));
    const grow = () => { ta.style.height = "auto"; ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`; };
    ta.value = askState.draft || "";
    ta.addEventListener("input", () => { askState.draft = ta.value; grow(); });
    ta.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey && wide()) { e.preventDefault(); submit(); }
    });
    ta.addEventListener("focus", () => document.body.classList.add("typing"));
    // a tap on "send" must not blur the field first: the dock would jump down to where the bottom bar was
    form.querySelector(".ask-send").addEventListener("mousedown", (e) => e.preventDefault());
    ta.addEventListener("blur", () => setTimeout(() => { if (document.activeElement !== ta) document.body.classList.remove("typing"); }, 150));
    grow();
    app.querySelectorAll("[data-ex]").forEach((b) => b.addEventListener("click", () => {
      const x = ex[+b.dataset.ex];
      ta.value = x.q; askState.draft = x.q; grow();
      ta.focus();
      if (x.select) { const i = x.q.indexOf(x.select); ta.setSelectionRange(i, i + x.select.length); }
    }));
    const reset = document.getElementById("ask-reset");
    if (reset) reset.addEventListener("click", () => { askState.history = []; askState.draft = ""; viewAsk(); });
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const q = ta.value.trim();
      if (!on || q.length < 5 || askState.busy) return;
      askState.busy = true;
      askState.pending = q;
      askState.draft = "";
      viewAsk();
      const pend = app.querySelector(".qa.pending");
      if (pend) pend.scrollIntoView({ block: "start" });
      try {
        const r = await fetch("/api/ask", {
          method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
          body: JSON.stringify({ topic: DATA.topic.slug, question: q, voter: voterId(), name: store.get("paw_name", "") || null,
            history: askState.history.slice(-2).map((h) => ({ q: h.q, a: h.a })) }),
        });
        const out = await r.json().catch(() => ({}));
        if (!r.ok || !out.ok) throw new Error(out.error || r.status);
        askState.history.push({ q, a: out.answer, sources: out.sources || [] });
        askState.busy = false; askState.pending = "";
        if (current !== "pergunte") return;
        viewAsk();
        const items = app.querySelectorAll(".qa");
        if (items.length) items[items.length - 1].scrollIntoView({ block: "start" });
      } catch (err) {
        askState.busy = false; askState.pending = ""; askState.draft = q;
        if (current !== "pergunte") return;
        viewAsk();
        const m = document.getElementById("ask-msg");
        if (m) m.textContent = `Não foi possível responder (${err.message}).`;
      }
    });
    if (autoGo && on && !askState.busy && (askState.draft || "").trim().length >= 5) submit();
    else if (pre && on) ta.focus();
  }

  // ---------- sheets (<dialog>) ----------
  function openSheet(id) {
    const dlg = document.getElementById(id);
    if (!dlg) return null;
    if (!dlg.open) { try { dlg.showModal(); } catch { dlg.setAttribute("open", ""); } }
    const h = dlg.querySelector(".sheet-head h2");
    if (h) h.focus();
    return dlg;
  }
  function wireSheet(dlg) {
    dlg.addEventListener("click", (e) => {
      if (e.target === dlg || e.target.closest("[data-close]")) dlg.close();
      else if (e.target.closest('a[href^="#"]')) dlg.close();
    });
  }

  function openTopics() {
    const dlg = document.getElementById("sheet-topics");
    const t = DATA.topic;
    dlg.querySelector(".sheet-body").innerHTML = `<ul class="topic-list">${(DATA.topics || []).map((x) =>
      `<li><a href="../${esc(x.slug)}/index.html#/"${x.slug === t.slug ? ' aria-current="true" class="on"' : ""}>${esc(x.name)}${x.slug === t.slug ? ` <span class="muted small">· você está aqui</span>` : ""}</a></li>`).join("")}</ul>`;
    openSheet("sheet-topics");
  }

  function aboutHtml() {
    const d = DATA.digests[0];
    const t = DATA.topic;
    const nPapers = DATA.digests.reduce((s, x) => s + x.items.length, 0);
    const ev = DATA.evolution;
    const web = /^https?:$/.test(location.protocol) && !DATA.offline;
    const origin = web ? location.origin : "https://<site>";
    const page = web ? `${location.origin}${location.pathname}` : `https://<site>/${t.slug}/index.html`;
    const cite = `${t.name}. Research Watch${d ? `, digest de ${fmtPeriod(d)}` : ""}. Disponível em: ${page}. Acesso em: ${fmtDate(todayIso())}.`;
    const st = d ? d.stats || {} : {};
    return `
      <p>${esc(t.description || "Digest de pesquisa state-of-the-art.")}</p>
      <p class="muted">Curadoria automática diária: papers do OpenAlex e do arXiv e fontes da watchlist (blogs, relatórios, reguladores)
        são triados e resumidos por um LLM de pesos abertos. Os resumos são feitos por IA: confira sempre no original.</p>
      <dl class="facts">
        <div><dt>Atualizado em</dt><dd>${esc(fmtDate(DATA.generated))}</dd></div>
        ${d ? `<div><dt>Último digest</dt><dd>${esc(fmtPeriod(d))}: ${st.candidates ?? "?"} candidatos, ${st.triaged ?? "?"} avaliados, ${d.items.length} selecionados</dd></div>` : ""}
        ${d && d.model ? `<div><dt>Modelo</dt><dd>${esc(d.model.split("/").pop())}</dd></div>` : ""}
        ${st.tokens && st.tokens.cost_usd ? `<div><dt>Custo do último digest</dt><dd>US$ ${st.tokens.cost_usd.toFixed(3)} (${(st.tokens.prompt_tokens + st.tokens.completion_tokens).toLocaleString("pt-BR")} tokens)</dd></div>` : ""}
        <div><dt>Cobertura</dt><dd>${DATA.digests.length} digests, ${nPapers} papers${ev ? `, ${ev.stats.milestones} marcos na Evolução` : ""}${(DATA.regulation || []).length ? `, ${DATA.regulation.length} normas` : ""}</dd></div>
      </dl>
      <h3>Como citar</h3>
      <p class="cite-box" id="cite-text">${esc(cite)}</p>
      <button type="button" class="btn ghost small-btn" data-copy-cite>${ICON.copy} Copiar citação</button>
      <h3>Use no seu agente</h3>
      <p>O mesmo arquivo está disponível para outros programas e agentes de IA, com token:</p>
      <ul class="integr">
        <li><b>MCP</b> (Claude e outros clientes): <code>${esc(origin)}/mcp</code></li>
        <li><b>A2A</b>: agent card em <code>${esc(origin)}/.well-known/agent-card.json</code></li>
        <li><b>REST</b>: <code>${esc(origin)}/api/v1/topics</code></li>
      </ul>
      <p class="muted small">Como obter o token e configurar: veja a seção “Integrações: REST v1, MCP e A2A” do
        <a href="https://github.com/lincolness92/people-analytics-watch#integra%C3%A7%C3%B5es-rest-v1-mcp-e-a2a" target="_blank" rel="noopener">README do projeto</a>.</p>`;
  }
  function openAbout() {
    const dlg = document.getElementById("sheet-about");
    dlg.querySelector(".sheet-body").innerHTML = aboutHtml();
    openSheet("sheet-about");
  }

  // ---------- global search over search.json (BM25, same tokens as src/pawatch/searchindex.py) ----------
  const STOP = new Set(("a o os as um uma uns umas de da do das dos em no na nos nas por para pra com sem sobre entre e ou que " +
    "qual quais quanto como onde quando porque se ser é são foi há ter tem mais menos muito muita isso isto esse essa este esta " +
    "eu você vocês nós ele ela eles elas me te lhe meu minha seu sua the of and or to in on for with by from at as is are was be " +
    "what which how why when does do did can could should would about into than that this these those it its an any some").split(" "));
  const fold = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const tokens = (text) => fold(text).split(/[^a-z0-9]+/).filter((t) => t.length > 2 && !STOP.has(t))
    .map((t) => (t.length > 4 && t.endsWith("s") ? t.slice(0, -1) : t));

  // Offline bundle (no search.json next to the page): the same documents, built from data.json.
  function localIndex(data) {
    const j = (...p) => p.map((x) => (x == null ? "" : String(x))).join(" ");
    const th = data.themes || {};
    const docs = [];
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
        for (const m of e.milestones || []) docs.push({ kind: "marco", title: m.title, url: m.url, when: String(m.year || ""), venue: m.venue,
          text: j(m.title, m.why, (m.authors || []).join(" "), th[m.theme]) });
      }
      if (ev.now && ev.now.summary) docs.push({ kind: "evolução", title: "Onde estamos agora", url: null, when: ev.generated,
        text: [ev.now.summary, ...(ev.now.open_questions || [])].join(" ") });
    }
    for (const [y, a] of Object.entries(data.annual || {})) {
      const label = `retrospectiva ${y}${a.partial ? " (parcial)" : ""}`;
      if (a.overview) docs.push({ kind: label, title: `Panorama de ${y}`, url: null, when: y, text: a.overview });
      for (const t of a.trends || []) docs.push({ kind: label, title: t.title, url: null, when: y, text: `${t.title}. ${t.text}` });
      for (const h of a.highlights || []) docs.push({ kind: `destaque de ${y}`, title: h.title, url: h.url, when: (h.date || y).slice(0, 10), venue: h.venue,
        text: j(h.title, h.original_title, h.why, h.venue, (h.authors || []).join(" "), th[h.theme]) });
    }
    const WK = { researchers: "pessoa de referência", historical: "pessoa de referência (histórica)", journals: "revista ou evento de referência",
      centers: "instituição de referência", practitioners: "praticante de referência" };
    for (const [k, xs] of Object.entries(data.watchlist || {})) {
      for (const w of Array.isArray(xs) ? xs : []) docs.push({ kind: WK[k] || "referência", title: w.name, url: w.url || null, when: null,
        text: j(w.name, w.institution, w.org, w.region, w.area, w.why) });
    }
    for (const g of data.regulation || []) docs.push({ kind: `norma · ${g.regulator}${g.revoked ? " (revogada)" : ""}`, title: g.title, url: g.url, when: g.date,
      text: j(g.title, g.subject, g.summary, (g.requires || []).join(" "), g.applies_to, g.effective, (g.techniques || []).join(" "), g.status_note) });
    const len = [], postings = {};
    docs.forEach((d, i) => {
      const toks = tokens(d.text);
      len.push(toks.length);
      const tf = {};
      for (const t of toks) tf[t] = (tf[t] || 0) + 1;
      for (const [t, f] of Object.entries(tf)) (postings[t] || (postings[t] = [])).push(i, f);
    });
    return { n: docs.length, avgdl: docs.length ? len.reduce((s, x) => s + x, 0) / docs.length : 1, docs, len, postings };
  }

  const SEARCH = { index: null, loading: null, keys: null, timer: 0, expanded: new Set() };
  function loadIndex() {
    if (SEARCH.index) return Promise.resolve(SEARCH.index);
    if (!SEARCH.loading) {
      SEARCH.loading = (async () => {
        if (!DATA.offline && /^https?:$/.test(location.protocol)) {
          try {
            const r = await fetch("search.json");
            if (r.ok) { const ix = await r.json(); if (ix && ix.postings && ix.docs) return ix; }
          } catch { /* fall back to the local index */ }
        }
        return localIndex(DATA);
      })().then((ix) => { SEARCH.index = ix; SEARCH.keys = Object.keys(ix.postings); return ix; });
    }
    return SEARCH.loading;
  }

  function searchIndex(ix, q) {
    const weights = new Map();
    for (const t of tokens(q)) weights.set(t, 1);
    // search as you type: the last word, still incomplete, also matches longer terms that start with it
    const lastRaw = /\s$/.test(q) ? "" : (fold(q).match(/([a-z0-9]+)$/) || ["", ""])[1];
    if (lastRaw.length >= 3) {
      let n = 0;
      for (const k of SEARCH.keys) {
        if (k !== lastRaw && k.startsWith(lastRaw) && !weights.has(k)) { weights.set(k, 0.7); if (++n >= 40) break; }
      }
    }
    const scores = new Map();
    for (const [t, w] of weights) {
      const p = ix.postings[t];
      if (!p) continue;
      const df = p.length / 2;
      const idf = Math.log(1 + (ix.n - df + 0.5) / (df + 0.5));
      for (let j = 0; j < p.length; j += 2) {
        const i = p[j], f = p[j + 1];
        scores.set(i, (scores.get(i) || 0) + w * idf * (f * 2.2) / (f + 1.2 * (0.25 + 0.75 * ix.len[i] / ix.avgdl)));
      }
    }
    return { terms: [...weights.keys()], hits: [...scores.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0]).slice(0, 80).map(([i, s]) => ({ ...ix.docs[i], score: s })) };
  }

  const GROUPS = [
    ["paper", "Papers"], ["news", "Notícias e relatórios"], ["marco", "Marcos da evolução"], ["norma", "Normas e regulação"],
    ["pessoa", "Pessoas de referência"], ["inst", "Instituições, revistas e fontes"], ["codigo", "Código"],
    ["destaque", "Destaques do ano"], ["anual", "Retrospectivas"], ["tend", "Tendências dos digests"], ["evo", "Evolução"],
  ];
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
  function docLink(doc) {
    const g = kindGroup(doc.kind);
    if (doc.url) return { href: doc.url, ext: true };
    if (g === "tend" && doc.when) return { href: `#/d/${doc.when}` };
    if (g === "anual" || g === "destaque") return { href: `#/anual/${String(doc.when || "").slice(0, 4)}` };
    if (g === "norma") return { href: "#/regulacao" };
    if (g === "pessoa" || g === "inst") return { href: "#/watchlist" };
    return { href: "#/evolucao" };
  }
  function snippet(doc, terms) {
    let text = String(doc.text || "");
    if (doc.title && text.startsWith(doc.title)) text = text.slice(doc.title.length);
    text = text.replace(/\*+/g, "").replace(/\s+/g, " ").trim();
    if (!text) return "";
    // per-UTF-16-unit fold keeps offsets aligned with the original text
    const f = text.toLowerCase().replace(/[^\u0000-\u007f]/g, (c) => c.normalize("NFD").charAt(0));
    let at = -1;
    for (const t of terms) {
      const m = new RegExp(`(^|[^a-z0-9])${t}`).exec(f);
      if (m && (at < 0 || m.index < at)) at = m.index + m[1].length;
    }
    const start = at > 70 ? text.lastIndexOf(" ", at - 50) + 1 : 0;
    const end = Math.min(text.length, start + 200);
    const win = text.slice(start, end), fw = f.slice(start, end);
    const re = new RegExp(`(^|[^a-z0-9])(${terms.map((t) => t.replace(/[^a-z0-9]/g, "")).filter(Boolean).join("|")})[a-z0-9]*`, "g");
    let out = "", last = 0, m;
    if (terms.length) {
      while ((m = re.exec(fw))) {
        const s = m.index + m[1].length, e = m.index + m[0].length;
        out += esc(win.slice(last, s)) + `<mark>${esc(win.slice(s, e))}</mark>`;
        last = e;
        if (m[0].length === 0) re.lastIndex++;
      }
    }
    out += esc(win.slice(last));
    return `${start > 0 ? "…" : ""}${out}${end < text.length ? "…" : ""}`;
  }

  function renderSearch(q) {
    const box = document.getElementById("search-results");
    const status = document.getElementById("search-status");
    if (!SEARCH.index) return;
    if (tokens(q).length === 0 && (fold(q).match(/([a-z0-9]+)$/) || ["", ""])[1].length < 3) {
      status.textContent = "";
      box.innerHTML = `<div class="search-empty">
        <p class="muted">Busque papers, marcos, normas, pessoas e código deste tema. Por exemplo:</p>
        <div class="chips">${Object.keys(DATA.themes).slice(0, 8).map((k) => `<button type="button" class="chip" data-suggest="${esc(themeShort(k))}">${esc(themeShort(k))}</button>`).join("")}</div>
      </div>`;
      return;
    }
    const { terms, hits } = searchIndex(SEARCH.index, q);
    const digestDates = new Set(DATA.digests.map((d) => d.date));
    status.textContent = hits.length ? `${hits.length >= 80 ? "80+" : hits.length} resultados` : "Nada encontrado.";
    if (!hits.length) { box.innerHTML = `<p class="muted search-none">Tente outras palavras, em português ou inglês.</p>`; return; }
    const by = new Map();
    for (const h of hits) { const g = kindGroup(h.kind); if (!by.has(g)) by.set(g, []); by.get(g).push(h); }
    const label = Object.fromEntries(GROUPS);
    box.innerHTML = [...by.entries()].map(([g, xs]) => {
      const open = SEARCH.expanded.has(g);
      const shown = open ? xs : xs.slice(0, 4);
      return `<section class="res-group">
        <h3 class="res-h">${esc(label[g] || g)} <span class="muted">${xs.length}</span></h3>
        <ul class="res-list">${shown.map((h) => {
          const L = docLink(h);
          const inDigest = (h.kind === "paper" || h.kind === "notícia ou relatório") && digestDates.has(h.when);
          const sub = [h.kind, h.when ? String(h.when).slice(0, 10) : "", h.venue || ""].filter(Boolean).map(esc).join(" · ");
          return `<li class="res">
            <a class="res-t" href="${esc(L.ext ? safeUrl(L.href) : L.href)}"${L.ext ? ' target="_blank" rel="noopener"' : ""}>${esc(h.title || "(sem título)")}${L.ext ? ` <span class="ext">${ICON.ext}</span>` : ""}</a>
            <div class="res-k">${sub}${inDigest ? ` · <a href="#/d/${esc(h.when)}">no digest</a>` : ""}</div>
            <p class="res-s">${snippet(h, terms)}</p>
          </li>`;
        }).join("")}</ul>
        ${xs.length > 4 && !open ? `<button type="button" class="link-btn res-more" data-expand="${g}">ver mais ${xs.length - 4}</button>` : ""}
      </section>`;
    }).join("");
  }

  function openSearch(q) {
    const dlg = openSheet("sheet-search");
    if (!dlg) return;
    const input = document.getElementById("search-q");
    if (typeof q === "string") input.value = q;
    const status = document.getElementById("search-status");
    if (!SEARCH.index) status.textContent = "Carregando o índice…";
    loadIndex().then(() => renderSearch(input.value))
      .catch((e) => { status.textContent = `Não foi possível carregar a busca (${e.message}).`; });
    setTimeout(() => input.focus(), 30);
  }
  function wireSearch() {
    const dlg = document.getElementById("sheet-search");
    const input = document.getElementById("search-q");
    input.addEventListener("input", () => {
      clearTimeout(SEARCH.timer);
      SEARCH.expanded.clear();
      SEARCH.timer = setTimeout(() => { if (SEARCH.index) renderSearch(input.value); }, 120);
    });
    dlg.querySelector("form").addEventListener("submit", (e) => { e.preventDefault(); input.blur(); });
    dlg.addEventListener("click", (e) => {
      const s = e.target.closest("[data-suggest]");
      if (s) { input.value = s.dataset.suggest; renderSearch(input.value); return; }
      const x = e.target.closest("[data-expand]");
      if (x) { SEARCH.expanded.add(x.dataset.expand); renderSearch(input.value); }
    });
  }

  // ---------- topic identity + header ----------
  function setupTopic(d) {
    const t = d.topic || {};
    const b = t.brand || {};
    if (t.name) document.title = t.name;
    if (b.mark) document.getElementById("brand-mark").textContent = b.mark;
    const pill = document.getElementById("topic-pill");
    const label = `${esc(b.text || t.name || "Research")} <em>${esc(b.em || "Watch")}</em>`;
    document.getElementById("brand-text").innerHTML = label;
    if (d.topics && d.topics.length > 1) {
      pill.classList.add("switch");
      pill.setAttribute("aria-haspopup", "dialog");
      pill.setAttribute("aria-label", `Tema: ${t.name}. Trocar de tema`);
      pill.addEventListener("click", openTopics);
    } else {
      pill.addEventListener("click", () => { location.hash = "#/"; });
      pill.setAttribute("aria-label", `${t.name}: início`);
    }
    if (!fbOn()) {
      document.querySelectorAll('[data-dest="pergunte"]').forEach((x) => { x.hidden = true; });
      document.body.classList.add("ask-off");
    }
  }

  // ---------- voice: a microphone on every text field (/api/stt) and "Ouvir" on answers (/api/tts) ----------
  // Recording works in any format the browser produces; it is decoded and re-encoded as WAV mono 16 kHz before
  // upload, because the transcription provider does not read the iPhone's audio/mp4. Everything stays hidden in
  // the offline bundle and when the endpoints are not configured.
  const voice = { stt: false, tts: false, rec: null, audio: null };
  const MIC_SVG = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z"/></svg>';
  const STOP_SVG = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/></svg>';
  const SPK_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M3 10v4h4l5 4V6L7 10H3zm13.5 2a4.5 4.5 0 0 0-2.5-4.03v8.06A4.5 4.5 0 0 0 16.5 12zM14 3.23v2.06a7 7 0 0 1 0 13.42v2.06a9 9 0 0 0 0-17.54z"/></svg>';

  function encodeWav(samples, rate) {
    const buf = new ArrayBuffer(44 + samples.length * 2);
    const v = new DataView(buf);
    const w = (o, str) => { for (let i = 0; i < str.length; i++) v.setUint8(o + i, str.charCodeAt(i)); };
    w(0, "RIFF"); v.setUint32(4, 36 + samples.length * 2, true); w(8, "WAVE"); w(12, "fmt ");
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, rate, true);
    v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, "data");
    v.setUint32(40, samples.length * 2, true);
    for (let i = 0; i < samples.length; i++) { const x = Math.max(-1, Math.min(1, samples[i])); v.setInt16(44 + i * 2, x < 0 ? x * 0x8000 : x * 0x7fff, true); }
    return new Blob([buf], { type: "audio/wav" });
  }

  async function toWav16k(blob) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    try {
      const decoded = await ctx.decodeAudioData(await blob.arrayBuffer());
      const off = new OfflineAudioContext(1, Math.ceil(decoded.duration * 16000), 16000);
      const src = off.createBufferSource();
      src.buffer = decoded; src.connect(off.destination); src.start();
      return encodeWav((await off.startRendering()).getChannelData(0), 16000);
    } finally { ctx.close && ctx.close(); }
  }

  async function transcribeBlob(blob) {
    let body = blob;
    try { body = await toWav16k(blob); } catch { /* webm/ogg go as recorded */ }
    const type = (body.type || "audio/webm").split(";")[0];
    const r = await fetch(`/api/stt?voter=${encodeURIComponent(voterId())}`, { method: "POST", headers: { "Content-Type": type }, body });
    const out = await r.json().catch(() => ({}));
    if (!r.ok || !out.ok) throw new Error(out.error || `HTTP ${r.status}`);
    return out.text || "";
  }

  function setMic(btn, state) {
    btn.dataset.state = state;
    btn.innerHTML = state === "rec" ? STOP_SVG : MIC_SVG;
    btn.setAttribute("aria-label", state === "rec" ? "Parar e transcrever" : state === "busy" ? "Transcrevendo…" : "Falar em vez de digitar");
    btn.disabled = state === "busy";
  }

  async function toggleMic(btn, field) {
    if (voice.rec && voice.rec.btn === btn) { voice.rec.recorder.stop(); return; }
    if (voice.rec) voice.rec.recorder.stop();
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch { btn.title = "Sem acesso ao microfone"; return; }
    const recorder = new MediaRecorder(stream);
    const chunks = [];
    recorder.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      clearTimeout(voice.rec && voice.rec.timer);
      voice.rec = null;
      setMic(btn, "busy");
      try {
        const text = await transcribeBlob(new Blob(chunks, { type: recorder.mimeType || "audio/webm" }));
        if (text) {
          field.value = (field.value && !/\s$/.test(field.value) ? field.value + " " : field.value) + text;
          field.dispatchEvent(new Event("input", { bubbles: true }));
          field.dispatchEvent(new Event("change", { bubbles: true }));
          field.focus();
        }
      } catch (e) { btn.title = `Não deu para transcrever: ${e.message}`; }
      setMic(btn, "idle");
    };
    recorder.start();
    voice.rec = { recorder, btn, timer: setTimeout(() => recorder.state === "recording" && recorder.stop(), 85000) };
    setMic(btn, "rec");
  }

  const MIC_FIELDS = 'textarea, input[type="search"], input[type="text"], input:not([type])';
  function attachMics(root) {
    if (!voice.stt) return;
    (root.querySelectorAll ? root : document).querySelectorAll(MIC_FIELDS).forEach((field) => {
      if (field.dataset.mic || field.name === "name" || field.disabled || field.closest("[data-nomic]")) return;
      field.dataset.mic = "1";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mic-btn";
      setMic(btn, "idle");
      btn.addEventListener("click", (e) => { e.preventDefault(); toggleMic(btn, field); });
      field.insertAdjacentElement("afterend", btn);
      field.parentElement && field.parentElement.classList.add("has-mic");
    });
  }

  async function speak(btn, text) {
    if (voice.audio) { voice.audio.pause(); const was = voice.audio.btn; voice.audio = null; if (was) was.classList.remove("on"); if (was === btn) return; }
    btn.classList.add("on", "busy");
    try {
      const r = await fetch("/api/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, voter: voterId() }) });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `HTTP ${r.status}`);
      const a = new Audio(URL.createObjectURL(await r.blob()));
      a.btn = btn; voice.audio = a;
      a.onended = () => { btn.classList.remove("on"); voice.audio = null; };
      btn.classList.remove("busy");
      await a.play();
    } catch (e) { btn.classList.remove("on", "busy"); btn.title = `Não deu para ler: ${e.message}`; }
  }

  function attachSpeakers(root) {
    if (!voice.tts) return;
    (root.querySelectorAll ? root : document).querySelectorAll("article.qa .a, [data-speak]").forEach((el) => {
      if (el.dataset.spk) return;
      el.dataset.spk = "1";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "speak-btn";
      btn.innerHTML = `${SPK_SVG}<span>Ouvir</span>`;
      btn.setAttribute("aria-label", "Ouvir este texto");
      btn.addEventListener("click", () => speak(btn, el.innerText));
      el.insertAdjacentElement("beforebegin", btn);
    });
  }

  function initVoice() {
    const ok = location.protocol.startsWith("http") && window.isSecureContext !== false;
    if (!ok) return;
    const probe = (path) => fetch(path, { cache: "no-store" }).then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
    Promise.all([probe("/api/stt"), probe("/api/tts")]).then(([s, t]) => {
      voice.stt = !!s.enabled && !!(navigator.mediaDevices && window.MediaRecorder);
      voice.tts = !!t.enabled;
      if (!voice.stt && !voice.tts) return;
      const scan = (n) => { attachMics(n); attachSpeakers(n); };
      scan(document);
      new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => n.nodeType === 1 && scan(n))))
        .observe(document.body, { childList: true, subtree: true });
    });
  }

  // ---------- router ----------
  function route() {
    const raw = location.hash.replace(/^#\/?/, "");
    const qi = raw.indexOf("?");
    const path = qi >= 0 ? raw.slice(0, qi) : raw;
    const params = new URLSearchParams(qi >= 0 ? raw.slice(qi + 1) : "");
    const [a, b] = path.split("/").map((x) => { try { return decodeURIComponent(x); } catch { return x; } });
    // back/forward or a link while a sheet is open: the sheet belongs to the previous screen
    document.querySelectorAll("dialog.sheet[open]").forEach((d) => d.close());
    if (a === "d" || a === "novidades") viewDigest(b);
    else if (a === "arquivo") viewArchive();
    else if (a === "tendencias" || a === "mapa") viewTrends();
    else if (a === "watchlist" || a === "pessoas") viewWatchlist();
    else if (a === "regulacao") viewRegulation();
    else if (a === "evolucao") viewEvolution();
    else if (a === "anual") viewAnnual(b);
    else if (a === "pergunte") viewAsk(params);
    else if (a === "mais") viewMore();
    else if (a === "sobre") { viewMore(); openAbout(); }
    else if (a === "busca") { viewHome(); openSearch(params.get("q") || ""); }
    else viewHome();
    window.scrollTo(0, 0);
  }

  document.addEventListener("click", (e) => {
    if (!DATA) return;
    if (e.target.closest("[data-open-search]")) { e.preventDefault(); openSearch(); }
    else if (e.target.closest("[data-open-about]")) { e.preventDefault(); openAbout(); }
    else if (e.target.closest("[data-open-topics]")) { e.preventDefault(); openTopics(); }
    else if (e.target.closest("[data-copy-cite]")) {
      const txt = (document.getElementById("cite-text") || {}).textContent || "";
      const btn = e.target.closest("[data-copy-cite]");
      const done = () => { btn.lastChild.textContent = " Copiada"; };
      try { navigator.clipboard.writeText(txt).then(done, () => {}); } catch { /* no clipboard: the text is selectable */ }
    }
  });
  document.addEventListener("keydown", (e) => {
    if (!DATA) return;
    if ((e.key === "/" && !/^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName || ""))) || ((e.metaKey || e.ctrlKey) && e.key === "k")) {
      e.preventDefault(); openSearch();
    }
  });
  window.addEventListener("resize", () => fitClamps(app));

  fetch("data.json", { cache: "no-cache" })
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then((d) => {
      DATA = d;
      setupTopic(d);
      setupVisit();
      const n = d.digests.reduce((s, x) => s + x.items.length, 0);
      document.getElementById("foot-meta").textContent = `${d.digests.length} digests · ${n} papers · atualizado em ${fmtDate(d.generated)}`;
      document.querySelectorAll("dialog.sheet").forEach(wireSheet);
      wireSearch();
      if (fbOn()) fbWire();
      window.addEventListener("hashchange", route);
      route();
      initVoice();
    })
    .catch((e) => { app.innerHTML = `<div class="empty">Não foi possível carregar os dados (${esc(e.message)}).</div>`; });
})();
