(() => {
  "use strict";

  const app = document.getElementById("app");
  let DATA = null;
  const state = { q: "", themes: new Set(), minScore: 6, onlyWatch: false };

  // ---------- helpers ----------
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const md = (s) => esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g, "$1<em>$2</em>");
  const safeUrl = (u) => (/^https?:\/\//i.test(u || "") ? u : "#");
  const fmtDate = (iso, opts = { day: "2-digit", month: "long", year: "numeric" }) =>
    new Date(iso + "T12:00:00").toLocaleDateString("pt-BR", opts);
  const scoreClass = (s) => (s >= 8 ? "hi" : s >= 6 ? "mid" : "lo");
  const themeLabel = (k) => (DATA.themes[k] || k);
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

  function card(it, { showDate = false } = {}) {
    const meta = [];
    if (it.watch_authors && it.watch_authors.length) {
      meta.push(it.watch_authors.map((n) => `<span class="star">⭐ ${esc(n)}</span>`).join(""));
    }
    if (it.watch_source) meta.push(`<span class="star">📌 ${esc(it.watch_source)}</span>`);
    if (showDate) meta.push(`<span class="date-tag">${esc(fmtDate(it._date, { day: "2-digit", month: "short", year: "numeric" }))}</span>`);
    meta.push(esc(it.venue || it.origin));
    const au = authorsShort(it.authors);
    if (au) meta.push(esc(au));
    if (it.cited_by) meta.push(`cit: ${it.cited_by}`);
    const orig = it.original_title && it.original_title !== it.title
      ? `<div class="orig">${esc(it.original_title)}</div>` : "";
    return `
      <article class="card${it.watch_authors && it.watch_authors.length ? " watch" : ""}">
        <div class="card-top">
          <h3><a href="${esc(safeUrl(it.url))}" target="_blank" rel="noopener">${esc(it.title)}</a></h3>
          <span class="score ${scoreClass(it.score)}" title="nota de relevância × qualidade">${it.score}/10</span>
        </div>
        <div class="meta">${meta.join(" · ")}</div>
        <p class="summary">${md(it.summary)}</p>
        ${orig}
      </article>`;
  }

  function setTab(tab) {
    document.querySelectorAll(".tabs a").forEach((a) => a.classList.toggle("active", a.dataset.tab === tab));
  }

  // ---------- views ----------
  function viewDigest(date) {
    setTab("digest");
    const ds = DATA.digests;
    if (!ds.length) { app.innerHTML = `<div class="empty">Nenhum digest ainda.</div>`; return; }
    const idx = Math.max(0, date ? ds.findIndex((d) => d.date === date) : 0);
    const d = ds[idx];
    const newer = ds[idx - 1], older = ds[idx + 1];
    const options = ds.map((x) => `<option value="${x.date}"${x.date === d.date ? " selected" : ""}>${esc(fmtPeriod(x, true))}</option>`).join("");

    let html = `
      <div class="day-nav">
        <button data-go="${older ? older.date : ""}" ${older ? "" : "disabled"} aria-label="Digest anterior">← anterior</button>
        <select id="day-select" aria-label="Escolher digest">${options}</select>
        <button data-go="${newer ? newer.date : ""}" ${newer ? "" : "disabled"} aria-label="Próximo digest">próximo →</button>
      </div>
      <h1 class="day">${esc(fmtPeriod(d))}</h1>
      ${d.headline ? `<p class="dek">${md(d.headline.charAt(0).toUpperCase() + d.headline.slice(1))}</p>` : ""}
      <div class="stats">
        <span><b>${d.stats.candidates}</b> candidatos novos</span>
        <span><b>${d.stats.triaged}</b> avaliados</span>
        <span><b>${d.items.length}</b> selecionados</span>
        ${d.model ? `<span>modelo: ${esc(d.model.split("/").pop())}</span>` : ""}
      </div>`;
    if (d.trend) html += `<div class="trend"><span class="label">🔥 Tendência do período</span>${md(d.trend)}</div>`;
    if (!d.items.length) html += `<div class="empty">Nada acima da barra neste período.</div>`;

    for (const key of Object.keys(DATA.themes)) {
      const group = d.items.filter((it) => it.theme === key);
      if (!group.length) continue;
      html += `<h2 class="theme-h">${esc(themeLabel(key))}</h2>` + group.map((it) => card(it)).join("");
    }
    if (d.quick && d.quick.length) {
      html += `<section class="quick"><h2 class="theme-h">Menções rápidas</h2><ul>` +
        d.quick.map((q) => `<li><a href="${esc(safeUrl(q.url))}" target="_blank" rel="noopener">${esc(q.title)}</a>${q.note ? ` — ${md(q.note)}` : ""}</li>`).join("") +
        `</ul></section>`;
    }
    app.innerHTML = html;
    app.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => {
      if (b.dataset.go) location.hash = `#/d/${b.dataset.go}`;
    }));
    document.getElementById("day-select").addEventListener("change", (e) => { location.hash = `#/d/${e.target.value}`; });
  }

  function allItems() {
    const out = [];
    for (const d of DATA.digests) for (const it of d.items) out.push({ ...it, _date: d.date });
    return out;
  }

  function viewArchive() {
    setTab("arquivo");
    const chips = Object.entries(DATA.themes).map(([k, v]) =>
      `<button class="chip" data-theme="${k}" aria-pressed="${state.themes.has(k)}">${esc(v)}</button>`).join("");
    app.innerHTML = `
      <h1 class="day">Arquivo</h1>
      <p class="dek">Todos os papers selecionados, de todos os digests.</p>
      <div class="filters">
        <input class="search" id="q" type="search" placeholder="Buscar por título, autor, venue, resumo…" value="${esc(state.q)}">
        <div class="chips">${chips}</div>
        <div class="filter-row">
          <label>Nota mínima <input id="min" type="range" min="0" max="10" value="${state.minScore}"> <b id="minv">${state.minScore}</b></label>
          <label><input id="ow" type="checkbox" ${state.onlyWatch ? "checked" : ""}> só autores da watchlist ⭐</label>
        </div>
      </div>
      <div class="count" id="count"></div>
      <div id="results"></div>`;

    const items = allItems();
    const render = () => {
      const q = state.q.trim().toLowerCase();
      const res = items.filter((it) =>
        it.score >= state.minScore &&
        (!state.themes.size || state.themes.has(it.theme)) &&
        (!state.onlyWatch || (it.watch_authors && it.watch_authors.length)) &&
        (!q || [it.title, it.original_title, it.summary, it.venue, (it.authors || []).join(" "), (it.institutions || []).join(" ")]
          .join(" ").toLowerCase().includes(q)));
      document.getElementById("count").textContent = `${res.length} de ${items.length} papers`;
      document.getElementById("results").innerHTML = res.length
        ? res.map((it) => card(it, { showDate: true })).join("")
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
    app.innerHTML = `
      <h1 class="day">Tendências</h1>
      <p class="dek">A síntese de cada digest, em ordem cronológica reversa.</p>
      ${ds.length ? `<div class="timeline">${ds.map((d) => `
        <div class="tl-item">
          <a class="d" href="#/d/${d.date}">${esc(fmtPeriod(d))}</a>
          <p>${md(d.trend)}</p>
        </div>`).join("")}</div>` : `<div class="empty">Sem tendências ainda.</div>`}`;
  }

  function viewWatchlist() {
    setTab("watchlist");
    const wl = DATA.watchlist || {};
    const hits = {};
    for (const it of allItems()) for (const n of [...(it.watch_authors || []), ...(it.watch_source ? [it.watch_source] : [])]) hits[n] = (hits[n] || 0) + 1;
    const regions = ["EUA", "Europa", "China/Ásia", "Brasil", "Outros"];
    const people = wl.researchers || [];
    let html = `
      <h1 class="day">Watchlist</h1>
      <p class="dek">Referências de elite monitoradas. Papers novos desses autores entram na triagem com bônus e ganham ⭐; posts e relatórios dos centros e praticantes ganham 📌.</p>
      <section class="wl-section"><h2>Pesquisadores <span class="muted">(${people.length})</span></h2>`;
    for (const r of regions) {
      const group = people.filter((p) => (p.region || "Outros") === r);
      if (!group.length) continue;
      html += `<h3 class="region-h">${esc(r)} · ${group.length}</h3><div class="people">` + group.map((p) => {
        const links = Object.entries(p.links || {}).filter(([, u]) => u)
          .map(([k, u]) => `<a href="${esc(safeUrl(u))}" target="_blank" rel="noopener">${esc(k)}</a>`);
        if (p.openalex_id) links.push(`<a href="https://openalex.org/authors/${esc(p.openalex_id)}" target="_blank" rel="noopener">openalex</a>`);
        return `<div class="person">
          <div class="n">${esc(p.name)}</div>
          <div class="i">${esc(p.institution || "")}</div>
          ${p.area ? `<div class="a">${esc(p.area)}</div>` : ""}
          ${p.why ? `<div class="w">${esc(p.why)}</div>` : ""}
          ${hits[p.name] ? `<div class="hits">⭐ ${hits[p.name]} paper(s) no arquivo</div>` : ""}
          ${links.length ? `<div class="l">${links.join("")}</div>` : ""}
        </div>`;
      }).join("") + `</div>`;
    }
    html += `</section>`;
    const simple = (title, arr, nameKey, subKey) => !arr || !arr.length ? "" : `
      <section class="wl-section"><h2>${title} <span class="muted">(${arr.length})</span></h2><ul class="list-simple">` +
      arr.map((x) => {
        const name = x.url ? `<a href="${esc(safeUrl(x.url))}" target="_blank" rel="noopener"><b>${esc(x[nameKey])}</b></a>` : `<b>${esc(x[nameKey])}</b>`;
        const hit = hits[x[nameKey]] ? ` <span class="hits">📌 ${hits[x[nameKey]]} no arquivo</span>` : "";
        return `<li>${name}${subKey && x[subKey] ? ` <span class="muted">· ${esc(x[subKey])}</span>` : ""}${x.why ? ` — ${esc(x.why)}` : ""}${hit}</li>`;
      }).join("") + `</ul></section>`;
    html += simple("Journals", wl.journals, "name");
    html += simple("Centros & laboratórios", wl.centers, "name", "institution");
    html += simple("Praticantes & fontes", wl.practitioners, "name", "org");
    app.innerHTML = html;
  }

  // ---------- router ----------
  function route() {
    const h = location.hash.replace(/^#\/?/, "");
    const [a, b] = h.split("/");
    if (a === "d") viewDigest(b);
    else if (a === "arquivo") viewArchive();
    else if (a === "tendencias") viewTrends();
    else if (a === "watchlist") viewWatchlist();
    else viewDigest();
    window.scrollTo(0, 0);
  }

  fetch("data.json", { cache: "no-cache" })
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then((d) => {
      DATA = d;
      const n = d.digests.reduce((s, x) => s + x.items.length, 0);
      document.getElementById("foot-meta").textContent = `${d.digests.length} digests · ${n} papers · atualizado em ${fmtDate(d.generated)}`;
      window.addEventListener("hashchange", route);
      route();
    })
    .catch((e) => { app.innerHTML = `<div class="empty">Não foi possível carregar os dados (${esc(e.message)}).</div>`; });
})();
