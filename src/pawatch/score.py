"""Two-stage LLM curation: triage (score + theme) then digest writing in PT-BR."""

import json
import re
import sys

DEFAULT_STRONG = "experimento de campo/RCT, dados administrativos grandes, causalidade crível"
ABSTRACT_CHARS = 1200   # triage sees this much of each abstract (450 hid the design and results; evals/scorer/)
EVIDENCE = {"rct", "quasi", "admin", "bench", "survey", "quali", "review", "theory", "regulator", "news", "other"}
LOW_TRUST = re.compile(r"zenodo|figshare|ebooks|research square|preprints\.org", re.I)
RSS_FOOTER = re.compile(r"\s*The post .{0,200}? appeared first on .{0,120}?\.?\s*$", re.S)


def final_score(r, q):
    """Relevance and quality graded apart; the score caps at the weaker one + 2, so an elite-venue paper off the
    topic or a weak survey on the topic cannot reach the digest."""
    return max(0, min(10, min((r + q) // 2, min(r, q) + 2)))


TRIAGE_PROMPT = "Avalie cada candidato em dois eixos SEPARADOS. Julgue só o que o texto recebido mostra: título e prestígio não contam como evidência.\n\n`r` — RELEVÂNCIA 0–10 para {rubric_focus}, para o público descrito acima:\n- 9–10: responde a uma decisão que esse público toma hoje.\n- 7–8: no tema, com lição prática ou metodológica clara.\n- 5–6: tema vizinho ou ângulo indireto.\n- 0–4: fora do tema ({off_topic}). Bater palavras-chave não basta: o objeto do estudo precisa ser do tema.\n\n`q` — QUALIDADE 0–10 da evidência mostrada:\n- 9–10: {rubric_strong}, com desenho e resultado numérico explícitos no texto.\n- 7–8: desenho crível com dados reais, ou benchmark novo e auditável, com resultado numérico.\n- 5–6: dados públicos ou simulados com avaliação honesta; revisão sistemática útil; caso real com números não verificáveis; modelo teórico em venue de elite.\n- 3–4: survey transversal de autorrelato (SEM/PLS-SEM, amostra de conveniência); estudo qualitativo pequeno; framework, arquitetura ou modelo conceitual sem validação; dataset sintético ou de brinquedo; anúncio de produto, parceria ou captação; teaser de uma ou duas frases.\n- 0–2: sem método, sem conteúdo, predatório ou gerado automaticamente.\n\n`e` — tipo de evidência, um de: rct, quasi, admin, bench, survey, quali, review, theory, regulator, news, other.\n(rct = experimento de campo ou RCT; quasi = quase-experimento ou identificação causal; admin = dados administrativos ou de produção em grande escala; bench = modelo ou benchmark em dados públicos ou sintéticos; regulator = norma ou relatório de regulador; news = notícia, post ou relatório de indústria.)\n\n`w` — razão em até 12 palavras, em português: o desenho e o que decide a nota.\n\nRegras:\n- `watch` (autor da watchlist) e `jr` (journal de elite) são critério de desempate: somam no máximo 1 ponto em `q`, e só quando o desenho aparece no texto. Não alteram `r`. Survey, ensaio ou revisão em journal de elite continua em `q` 3–6.\n- Itens com `fonte` vêm de fontes da watchlist ({source_kinds}): avalie o texto recebido, não a fonte. Norma, relatório ou caso com dados próprios, exigências novas ou arquitetura descrita pode ter `q` 7+. Teaser sem conteúdo fica em `q` ≤ 4. Divulgação de evento, vaga, nomeação, captação e marketing ficam em `r` ≤ 4 e `q` ≤ 3.\n- O abstract pode vir cortado. Se o desenho ou o resultado não aparecem, não presuma: `q` ≤ 5.\n- Use a escala inteira. Em 200 candidatos, o normal é ter no máximo uma dezena com `r` ≥ 7 e `q` ≥ 7 ao mesmo tempo.\n\nExemplos de calibração deste tópico:\n{rubric_anchors}\n\nAtribua um tema `t` entre: {themes}.{region_rule}\nResponda APENAS com JSON: {\"r\": [{\"i\": <id>, \"r\": <int>, \"q\": <int>, \"e\": \"<tipo>\", \"w\": \"<razão>\", \"t\": \"<tema>\"}, ...]} cobrindo todos os ids."


def audience(topic):
    return topic.meta["audience"]


def triage_rules(topic):
    """Two axes graded apart (r, q), evidence type and a short reason; the score is computed in code (final_score).
    Calibrated against a stronger model on 140 labelled candidates: evals/scorer/2026-11-25-fable-report.md."""
    m = topic.meta
    themes = ", ".join(f"{k} ({v.split(' ', 1)[1]})" for k, v in topic.themes.items())
    anchors = "\n".join(f"- {a}" for a in m.get("rubric_anchors") or []) or "- (sem exemplos)"
    region = _region_rule(topic)
    g = ', "g": "<região>"' if topic.meta.get("regions") else ""
    return (TRIAGE_PROMPT.replace("{rubric_focus}", m["rubric_focus"]).replace("{off_topic}", m["off_topic"])
            .replace("{rubric_strong}", m.get("rubric_strong", DEFAULT_STRONG))
            .replace("{source_kinds}", m.get("source_kinds", "centros de pesquisa e praticantes"))
            .replace("{rubric_anchors}", anchors).replace("{themes}", themes).replace("{region_rule}", region)
            .replace('"t": "<tema>"}', '"t": "<tema>"' + g + '}'))


def _old_triage_rules(topic):  # kept for reference until the new rubric has a few weeks of data
    m = topic.meta
    themes = ", ".join(f"{k} ({v.split(' ', 1)[1]})" for k, v in topic.themes.items())
    return f"""Dê uma nota 0–10 a cada paper combinando RELEVÂNCIA e QUALIDADE:
- 9–10: resultado novo e forte ({m.get("rubric_strong", DEFAULT_STRONG)}) com implicação direta para {m["rubric_focus"]}.
- 7–8: sólido e relevante, com takeaway prático ou metodológico claro.
- 5–6: relevante mas incremental, survey genérico, amostra pequena, ou venue fraca.
- 0–4: fora do tema ({m["off_topic"]}) ou baixa qualidade/predatório.
Sinais de qualidade: `watch` (autor da watchlist de elite) e `jr` (journal de elite) valem bônus, mas não salvam paper fora do tema.
Itens com `fonte` vêm de fontes da watchlist ({m.get("source_kinds", "centros de pesquisa e praticantes")}: posts, relatórios, normas, podcasts, notícias): avalie pelo mesmo critério; relatório, norma ou estudo com dados próprios pode valer 7+, mas divulgação de evento, marketing, vaga ou post genérico fica em 0–4.
Atribua um tema `t` entre: {themes}.{_region_rule(topic)}
Responda APENAS com JSON: {{"r": [{{"i": <id>, "s": <nota int>, "t": "<tema>"{', "g": "<região>"' if topic.meta.get("regions") else ""}}}, ...]}} cobrindo todos os ids."""


def _region_rule(topic):
    regions = topic.meta.get("regions")
    if not regions:
        return ""
    opts = ", ".join(f"{k} ({v})" for k, v in regions.items())
    return (f"\nAtribua também a região `g` entre: {opts} — onde o fato, a empresa ou os dados estão "
            f"(`reg` no item indica a região da fonte, quando conhecida).")


def write_rules(topic):
    m = topic.meta
    return f"""Escreva o digest do período (papers publicados nos últimos dias). Para cada paper selecionado devolva:
- "i": id
- "title": título curto e fiel (pode manter em inglês; encurte subtítulos longos)
- "summary": 2–3 frases em PT-BR, densas e concretas: o que fizeram (desenho, N, contexto), o achado principal com números quando houver, e {m["summary_lesson"]}. Tom direto, sem jargão vazio, sem "este estudo". Pode usar **negrito** em 1 termo-chave e *itálico* pontual.
- "score": nota final 0–10 (pode ajustar a da triagem)
- "theme": tema (mesmas chaves)
Para cada menção rápida devolva {{"i", "title" (curto), "note" (1 frase PT-BR, até ~25 palavras)}}.
Também devolva:
- "headline": meia frase sobre o período (ex.: "{m["headline_example"]}")
- "trend": parágrafo de 2–4 frases em PT-BR com a tendência do período, conectando os papers ({m["trend_focus"]}).{" Separe o que se vê no Brasil e no mundo (ex.: 'No Brasil, ... No mundo, ...'); se uma das regiões não tiver nada relevante, diga isso." if m.get("regions") else ""}
Responda APENAS com JSON: {{"headline": "...", "items": [...], "quick": [...], "trend": "..."}}."""


def prefilter(cands, limit, keywords):
    """Cheap ranking so the LLM only sees the most promising candidates."""
    kw = re.compile(keywords, re.I)

    def rank(c):
        # distinct topic terms, the title weighing more; elite-journal and watchlist-source bonuses only count when
        # the item is on the topic; a missing abstract is no penalty when the title matches; non-reviewed repos lose
        title_terms = {m.lower() for m in kw.findall(c["title"] or "")}
        body_terms = {m.lower() for m in kw.findall((c["abstract"] or "")[:1500])} - title_terms
        on_topic = bool(title_terms or body_terms)
        score = (3 * bool(c["watch_authors"])
                 + (2 if on_topic else 0.5) * (c["watch_journal"] + bool(c.get("watch_source")))
                 + (1 if c["abstract"] or len(title_terms) >= 2 else 0)
                 + min(len(title_terms), 3) * 0.8 + min(len(body_terms), 8) * 0.25
                 + min(c["cited_by"], 20) * 0.02
                 - 0.5 * bool(LOW_TRUST.search(c.get("venue") or "")))
        # ties: newer first, then curated origins before generic search
        return (score, c.get("date") or "", c.get("origin") in ("arxiv", "fonte", "watchlist", "journal"))

    return sorted(cands, key=rank, reverse=True)[:limit]


def _brief(i, c, abstract_chars):
    d = {"i": i, "title": c["title"], "venue": c["venue"], "date": c["date"],
         "authors": ", ".join(c["authors"][:5]) + (" et al." if len(c["authors"]) > 5 else "")}
    if c["institutions"]:
        d["inst"] = "; ".join(c["institutions"][:3])
    if c["watch_authors"]:
        d["watch"] = ", ".join(c["watch_authors"])
    if c["watch_journal"]:
        d["jr"] = True
    if c.get("watch_source"):
        d["fonte"] = c["watch_source"]
    if c.get("region"):
        d["reg"] = c["region"]
    if c["cited_by"]:
        d["cit"] = c["cited_by"]
    a = RSS_FOOTER.sub("", c["abstract"] or "") or "(sem abstract)"
    d["abstract"] = a[:abstract_chars] + ("…" if len(a) > abstract_chars else "")
    return d


def triage(llm, cands, topic, batch=35, log=lambda m: print(m, file=sys.stderr)):
    scores = {}
    for start in range(0, len(cands), batch):
        chunk = cands[start:start + batch]
        lines = "\n".join(json.dumps(_brief(start + j, c, ABSTRACT_CHARS), ensure_ascii=False)
                          for j, c in enumerate(chunk))
        try:
            out = llm.json(audience(topic) + "\n\n" + triage_rules(topic), f"Candidatos (um JSON por linha):\n{lines}",
                           max_tokens=8000)
        except RuntimeError as e:
            log(f"triagem do lote {start} falhou: {e}")
            continue
        for r in out.get("r", []):
            try:
                i = int(r["i"])
                if start <= i < start + len(chunk):
                    theme = r.get("t") if r.get("t") in topic.themes else next(iter(topic.themes))
                    regions = topic.meta.get("regions") or {}
                    region = r.get("g") if r.get("g") in regions else (chunk[i - start].get("region") or "")
                    if "r" in r and "q" in r:
                        rel, qual = max(0, min(10, int(r["r"]))), max(0, min(10, int(r["q"])))
                        s = final_score(rel, qual)
                        chunk[i - start]["triage"] = {"r": rel, "q": qual, "e": r.get("e") if r.get("e") in EVIDENCE else "other",
                                                      "w": str(r.get("w") or "")[:120]}
                    else:  # a model that answered in the old format
                        s = max(0, min(10, int(r.get("s", 0))))
                    scores[i] = (s, theme, region)
            except (KeyError, TypeError, ValueError):
                continue
        log(f"triagem: {min(start + batch, len(cands))}/{len(cands)}")
    return scores


def write_digest(llm, cands, scores, sel_cfg, topic):
    ranked = sorted(scores.items(), key=lambda kv: (-kv[1][0], kv[0]))
    picked = [i for i, (s, *_) in ranked if s >= sel_cfg["min_score"]][: sel_cfg["max_selected"]]
    quick = [i for i, (s, *_) in ranked if i not in picked and s >= sel_cfg["min_score"] - 1][
        : sel_cfg["max_quick_mentions"]]
    if not picked:
        return None

    body = {
        "selecionados": [dict(_brief(i, cands[i], 1800), s=scores[i][0], t=scores[i][1]) for i in picked],
        "mencoes_rapidas": [dict(_brief(i, cands[i], 500), s=scores[i][0]) for i in quick],
    }
    out = llm.json(audience(topic) + "\n\n" + write_rules(topic), json.dumps(body, ensure_ascii=False),
                   max_tokens=12000, temperature=0.4)

    def item(i, extra):
        c = cands[i]
        return {
            "key": c["key"], "title": extra.get("title") or c["title"], "original_title": c["title"],
            "url": c["url"], "venue": c["venue"], "date": c["date"], "authors": c["authors"][:12],
            "institutions": c["institutions"], "watch_authors": c["watch_authors"],
            "watch_journal": c["watch_journal"], "watch_source": c.get("watch_source", ""),
            "origin": c["origin"], "cited_by": c["cited_by"],
            **({"triage": c["triage"]} if c.get("triage") else {}),
        }

    written = {int(x["i"]): x for x in out.get("items", []) if str(x.get("i", "")).isdigit()}
    items = []
    for i in picked:
        w = written.get(i, {})
        theme = w.get("theme") if w.get("theme") in topic.themes else scores[i][1]
        try:
            score = max(0, min(10, int(w.get("score", scores[i][0]))))
        except (TypeError, ValueError):
            score = scores[i][0]
        items.append(dict(item(i, w), score=score, theme=theme, region=scores[i][2] if len(scores[i]) > 2 else "",
                          summary=(w.get("summary") or cands[i]["abstract"][:300]).strip()))
    items.sort(key=lambda x: (list(topic.themes).index(x["theme"]), -x["score"]))

    qw = {int(x["i"]): x for x in out.get("quick", []) if str(x.get("i", "")).isdigit()}
    quick_items = [dict(item(i, qw.get(i, {})), score=scores[i][0], theme=scores[i][1],
                        region=scores[i][2] if len(scores[i]) > 2 else "",
                        note=(qw.get(i, {}).get("note") or "").strip()) for i in quick]

    return {
        "headline": (out.get("headline") or "").strip(),
        "trend": (out.get("trend") or "").strip(),
        "items": items,
        "quick": quick_items,
    }
