(() => {
  "use strict";

  const app = document.getElementById("app");
  let DATA = null;
  const state = { q: "", themes: new Set(), minScore: 6, onlyWatch: false, region: "" };

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

  // ---------- feedback (POST /api/feedback; hidden in the offline bundle) ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode: fine */ } },
  };
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
      <button type="button" class="fb-btn" data-fb-vote="up" aria-pressed="${v === "up"}" title="útil / bom achado">👍</button>
      <button type="button" class="fb-btn" data-fb-vote="down" aria-pressed="${v === "down"}" title="irrelevante / fraco">👎</button>
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

  function card(it, { showDate = false } = {}) {
    const meta = [];
    const regs = (DATA.topic && DATA.topic.regions) || {};
    if (it.region && regs[it.region]) meta.push(`<span class="region-tag">${esc(regs[it.region])}</span>`);
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
        ${fbBar("paper", it.key || it.url, it.title)}
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
        ${d.stats.tokens && d.stats.tokens.cost_usd ? `<span>custo: US$ ${d.stats.tokens.cost_usd.toFixed(3)}</span>` : ""}
      </div>`;
    if (d.trend) html += `<div class="trend"><span class="label">🔥 Tendência do período</span>${md(d.trend)}</div>`;
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
      html += `<h2 class="theme-h">${esc(themeLabel(key))}</h2>` + group.map((it) => card(it)).join("");
    }
    if (d.quick && d.quick.length) {
      html += `<section class="quick"><h2 class="theme-h">Menções rápidas</h2><ul>` +
        d.quick.filter(inRegion).map((q) => `<li>${q.region && regs[q.region] ? `<span class="region-tag">${esc(regs[q.region])}</span> ` : ""}<a href="${esc(safeUrl(q.url))}" target="_blank" rel="noopener">${esc(q.title)}</a>${q.note ? ` — ${md(q.note)}` : ""}</li>`).join("") +
        `</ul></section>`;
    }
    html += fbBox("digest", d.date, d.headline || d.date, "O que achou deste digest?",
      "O que foi útil, o que sobrou, o que faltou? Algum paper que você esperava ver aqui?");
    app.innerHTML = html;
    app.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => {
      if (b.dataset.go) location.hash = `#/d/${b.dataset.go}`;
    }));
    document.getElementById("day-select").addEventListener("change", (e) => { location.hash = `#/d/${e.target.value}`; });
    app.querySelectorAll("[data-region]").forEach((b) => b.addEventListener("click", () => {
      state.region = b.dataset.region; viewDigest(d.date);
    }));
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
          <label><input id="ow" type="checkbox" ${state.onlyWatch ? "checked" : ""}> só da watchlist ⭐📌</label>
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
        (!state.onlyWatch || (it.watch_authors && it.watch_authors.length) || it.watch_source) &&
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
      <h1 class="day">Watchlist</h1>
      <p class="dek">Referências monitoradas. Papers novos desses autores entram na triagem com bônus e ganham ⭐; posts, relatórios e normas das fontes ganham 📌.</p>
      <section class="wl-section"><h2>${esc(L.researchers)} <span class="muted">(${people.length})</span></h2>`;
    for (const r of regions) {
      const group = people.filter((p) => (p.region || "Outros") === r);
      if (!group.length) continue;
      html += `<h3 class="region-h">${esc(r)} · ${group.length}</h3><div class="people">` + group.map(person).join("") + `</div>`;
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
    app.innerHTML = html;
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
      app.innerHTML = `<h1 class="day">Evolução</h1>
        <div class="empty">A linha do tempo do estado da arte ainda não foi gerada para este tema.<br>
        Ela é montada uma vez por mês a partir da rede de citações.</div>`;
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

    let html = `
      <h1 class="day">Evolução do estado da arte</h1>
      ${ev.overview ? `<p class="dek">${md(ev.overview)}</p>` : ""}
      <div class="stats">
        <span><b>${ev.stats.milestones}</b> marcos</span>
        <span>rede de <b>${ev.stats.network.toLocaleString("pt-BR")}</b> obras</span>
        <span>gerado em ${esc(fmtDate(ev.generated))}</span>
        ${ev.model ? `<span>modelo: ${esc(ev.model.split("/").pop())}</span>` : ""}
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
      html += `<section class="now">
        <h2 class="theme-h">Onde estamos agora</h2>
        <p>${md(ev.now.summary)}</p>
        ${ev.now.open_questions && ev.now.open_questions.length
          ? `<h3 class="now-q">Perguntas em aberto</h3><ul class="list-simple">${ev.now.open_questions.map((q) => `<li>${md(q)}</li>`).join("")}</ul>` : ""}
      </section>`;
    }
    html += fbBox("evolucao", ev.generated, "Evolução do estado da arte", "A linha do tempo faz sentido?",
      "Falta algum marco? Algum não deveria estar aí? A divisão em épocas faz sentido para você?");
    app.innerHTML = html;
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
      app.innerHTML = `<h1 class="day">Retrospectiva anual</h1>
        <div class="empty">A retrospectiva ainda não foi gerada para este tema.<br>Ela é atualizada todo mês, junto com a Evolução.</div>`;
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
    let html = `
      <div class="chips year-chips">${years.map((k) => `<button class="chip" data-year="${k}" aria-pressed="${k === y}">${k}${all[k].partial ? " (parcial)" : ""}</button>`).join("")}</div>
      <h1 class="day">Retrospectiva ${esc(y)}${d.partial ? ` <span class="muted">até ${esc(fmtDate(d.generated, { day: "2-digit", month: "short" }))}</span>` : ""}</h1>
      ${d.overview ? `<p class="dek">${md(d.overview)}</p>` : ""}
      <div class="stats">
        <span><b>${d.stats.works.toLocaleString("pt-BR")}</b> obras do ano</span>
        <span><b>${d.stats.triaged}</b> avaliadas</span>
        <span><b>${d.highlights.length}</b> destaques</span>
        ${d.model ? `<span>modelo: ${esc(d.model.split("/").pop())}</span>` : ""}
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
        <table class="growth"><thead><tr><th>Subtema</th><th>${+y - 1}</th><th>${esc(y)}${d.partial ? "*" : ""}</th><th>Variação</th></tr></thead><tbody>` +
        d.growth.map((g) => `<tr><td title="${esc(g.query)}">${esc(g.label)}</td><td>${g.prev.toLocaleString("pt-BR")}</td><td>${g.cur_full_year.toLocaleString("pt-BR")}</td><td>${chg(g)}</td></tr>`).join("") +
        `</tbody></table>${d.partial ? `<p class="muted small">* ano em curso, projetado para 12 meses; o OpenAlex indexa com algum atraso, então a variação recente tende a sair subestimada.</p>` : ""}`;
    }
    app.innerHTML = html;
    app.querySelectorAll("[data-year]").forEach((b) => b.addEventListener("click", () => { location.hash = `#/anual/${b.dataset.year}`; }));
  }

  // ---------- ask the archive (POST /api/ask) ----------
  const askState = { history: [], busy: false };

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
    const list = h.sources.filter((x) => used.has(x.n));
    return `<article class="qa">
      <div class="q">${esc(h.q)}</div>
      <div class="a">${body}</div>
      ${list.length ? `<ol class="qa-src">${list.map((x) => `<li value="${x.n}">${x.url
        ? `<a href="${esc(safeUrl(x.url))}" target="_blank" rel="noopener">${esc(x.title)}</a>` : esc(x.title)}
        <span class="muted">· ${esc(x.kind)}${x.when ? `, ${esc(x.when)}` : ""}</span></li>`).join("")}</ol>` : ""}
      ${fbBar("resposta", h.q, h.q)}
    </article>`;
  }

  function viewAsk() {
    setTab("pergunte");
    if (!fbOn()) {
      app.innerHTML = `<h1 class="day">Pergunte</h1><div class="empty">Disponível só no site publicado.</div>`;
      return;
    }
    const themes = Object.values(DATA.themes).slice(0, 3).map((t) => t.replace(/^\S+\s/, "").toLowerCase());
    const examples = [
      `O que há de evidência recente sobre ${themes[0] || "o tema"}?`,
      `Quais foram os grandes marcos do campo e o que mudou com eles?`,
      `O que os papers dizem sobre ${themes[1] || themes[0] || "o tema"}, e quais são as limitações?`,
    ];
    app.innerHTML = `
      <h1 class="day">Pergunte ao arquivo</h1>
      <p class="dek">A IA responde usando só o arquivo deste tema (digests, Evolução, retrospectivas anuais e a biblioteca de papers triados, com os resumos originais) e cita cada fonte. Se o arquivo não cobre o assunto, ela diz.</p>
      <div class="chips ask-examples">${examples.map((x) => `<button type="button" class="chip" data-example="${esc(x)}">${esc(x)}</button>`).join("")}</div>
      <div id="qa-list">${askState.history.map(renderAnswer).join("")}</div>
      <form id="ask-form" class="ask-form">
        <textarea name="q" rows="3" maxlength="600" placeholder="Ex.: o que se sabe sobre o efeito do trabalho híbrido em promoções?" required></textarea>
        <div class="fb-row">
          <span class="muted ask-hint">${askState.history.length ? "Perguntas de seguimento usam a conversa acima." : "Leva uns 20–40 segundos."}</span>
          ${askState.history.length ? `<button type="button" class="fb-link" id="ask-reset">nova conversa</button>` : ""}
          <button type="submit">Perguntar</button>
        </div>
        <span class="fb-msg" id="ask-msg" role="status"></span>
      </form>`;
    const form = document.getElementById("ask-form");
    const msg = document.getElementById("ask-msg");
    app.querySelectorAll("[data-example]").forEach((b) => b.addEventListener("click", () => {
      form.q.value = b.dataset.example;
      form.q.focus();
    }));
    const reset = document.getElementById("ask-reset");
    if (reset) reset.addEventListener("click", () => { askState.history = []; viewAsk(); });
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const q = form.q.value.trim();
      if (q.length < 5 || askState.busy) return;
      askState.busy = true;
      const btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      msg.textContent = "Consultando o arquivo…";
      try {
        const r = await fetch("/api/ask", {
          method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
          body: JSON.stringify({ topic: DATA.topic.slug, question: q, voter: voterId(), name: store.get("paw_name", "") || null,
            history: askState.history.slice(-2).map((h) => ({ q: h.q, a: h.a })) }),
        });
        const out = await r.json().catch(() => ({}));
        if (!r.ok || !out.ok) throw new Error(out.error || r.status);
        askState.history.push({ q, a: out.answer, sources: out.sources || [] });
        askState.busy = false;
        viewAsk();
        const items = app.querySelectorAll(".qa");
        if (items.length) items[items.length - 1].scrollIntoView({ behavior: "smooth", block: "start" });
      } catch (err) {
        msg.textContent = `Não foi possível responder (${err.message}).`;
        btn.disabled = false;
        askState.busy = false;
      }
    });
  }

  // ---------- topic identity + switcher ----------
  function setupTopic(d) {
    const t = d.topic || {};
    const b = t.brand || {};
    if (t.name) document.title = t.name;
    if (b.mark) document.getElementById("brand-mark").textContent = b.mark;
    if (b.text) document.getElementById("brand-text").innerHTML = `${esc(b.text)} <em>${esc(b.em || "Watch")}</em>`;
    const sw = document.getElementById("topic-switch");
    if (sw && d.topics && d.topics.length > 1) {
      sw.innerHTML = d.topics.map((x) => `<option value="${esc(x.slug)}"${x.slug === t.slug ? " selected" : ""}>${esc(x.name)}</option>`).join("");
      sw.hidden = false;
      sw.addEventListener("change", (e) => { location.href = `../${e.target.value}/index.html`; });
    }
  }

  // ---------- router ----------
  function route() {
    const h = location.hash.replace(/^#\/?/, "");
    const [a, b] = h.split("/");
    if (a === "d") viewDigest(b);
    else if (a === "arquivo") viewArchive();
    else if (a === "tendencias") viewTrends();
    else if (a === "watchlist") viewWatchlist();
    else if (a === "evolucao") viewEvolution();
    else if (a === "anual") viewAnnual(b);
    else if (a === "pergunte") viewAsk();
    else viewDigest();
    window.scrollTo(0, 0);
  }

  fetch("data.json", { cache: "no-cache" })
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then((d) => {
      DATA = d;
      setupTopic(d);
      const n = d.digests.reduce((s, x) => s + x.items.length, 0);
      document.getElementById("foot-meta").textContent = `${d.digests.length} digests · ${n} papers · atualizado em ${fmtDate(d.generated)}`;
      if (fbOn()) fbWire();
      else { const t = document.getElementById("tab-ask"); if (t) t.hidden = true; }
      window.addEventListener("hashchange", route);
      route();
    })
    .catch((e) => { app.innerHTML = `<div class="empty">Não foi possível carregar os dados (${esc(e.message)}).</div>`; });
})();
