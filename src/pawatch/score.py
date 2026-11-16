"""Two-stage LLM curation: triage (score + theme) then digest writing in PT-BR."""

import json
import re
import sys

from . import THEMES

AUDIENCE = (
    "Você é o curador do PEOPLE-ANALYTICS-WATCH, um digest diário em PT-BR para um líder de "
    "people analytics de uma grande empresa brasileira. Ele quer só o que é state-of-the-art "
    "e acionável em: people analytics, gestão de pessoas/RH, talento, recrutamento, IA no "
    "trabalho e futuro do trabalho, engajamento/retenção, liderança e cultura, remuneração e "
    "equidade, skills e aprendizagem, governança e ética de dados de pessoas."
)

TRIAGE_RULES = """Dê uma nota 0–10 a cada paper combinando RELEVÂNCIA e QUALIDADE:
- 9–10: resultado novo e forte (experimento de campo/RCT, dados administrativos grandes, causalidade crível, venue de elite ou autor de referência) com implicação direta para RH/people analytics.
- 7–8: sólido e relevante, com takeaway prático ou metodológico claro.
- 5–6: relevante mas incremental, survey genérico, amostra pequena, ou venue fraca.
- 0–4: fora do tema (clínico, educação escolar, esportes, marketing, engenharia sem pessoas/trabalho) ou baixa qualidade/predatório.
Sinais de qualidade: `watch` (autor da watchlist de elite) e `jr` (journal de elite) valem bônus, mas não salvam paper fora do tema.
Itens com `fonte` vêm de centros de pesquisa e praticantes da watchlist (posts, relatórios, podcasts, notícias): avalie pelo mesmo critério; relatório ou estudo com dados próprios pode valer 7+, mas divulgação de evento, marketing, vaga ou post genérico fica em 0–4.
Atribua um tema `t` entre: """ + ", ".join(f"{k} ({v.split(' ', 1)[1]})" for k, v in THEMES.items()) + """.
Responda APENAS com JSON: {"r": [{"i": <id>, "s": <nota int>, "t": "<tema>"}, ...]} cobrindo todos os ids."""

WRITE_RULES = """Escreva o digest do período (papers publicados nos últimos dias). Para cada paper selecionado devolva:
- "i": id
- "title": título curto e fiel (pode manter em inglês; encurte subtítulos longos)
- "summary": 2–3 frases em PT-BR, densas e concretas: o que fizeram (desenho, N, contexto), o achado principal com números quando houver, e a lição prática para quem faz people analytics/RH. Tom direto, sem jargão vazio, sem "este estudo". Pode usar **negrito** em 1 termo-chave e *itálico* pontual.
- "score": nota final 0–10 (pode ajustar a da triagem)
- "theme": tema (mesmas chaves)
Para cada menção rápida devolva {"i", "title" (curto), "note" (1 frase PT-BR, até ~25 palavras)}.
Também devolva:
- "headline": meia frase sobre o período (ex.: "semana forte em IA no recrutamento")
- "trend": parágrafo de 2–4 frases em PT-BR com a tendência do período, conectando os papers (o que está mudando na prática de gestão de pessoas).
Responda APENAS com JSON: {"headline": "...", "items": [...], "quick": [...], "trend": "..."}."""


def prefilter(cands, limit):
    """Cheap ranking so the LLM only sees the most promising candidates."""
    kw = re.compile(
        r"people analytics|hr analytics|workforce|employee|worker|hiring|recruit|talent|"
        r"human resource|labor|labour|turnover|retention|engagement|remote work|hybrid|"
        r"leadership|manager|compensation|pay |skills|productivity|workplace|job ", re.I)

    def rank(c):
        text = f"{c['title']} {c['abstract'][:800]}"
        return (
            3 * bool(c["watch_authors"]) + 2 * c["watch_journal"] + 2 * bool(c.get("watch_source"))
            + bool(c["abstract"])
            + min(len(kw.findall(text)), 5) * 0.4 + min(c["cited_by"], 20) * 0.02
        )

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
    if c["cited_by"]:
        d["cit"] = c["cited_by"]
    d["abstract"] = (c["abstract"] or "(sem abstract)")[:abstract_chars]
    return d


def triage(llm, cands, batch=35, log=lambda m: print(m, file=sys.stderr)):
    scores = {}
    for start in range(0, len(cands), batch):
        chunk = cands[start:start + batch]
        lines = "\n".join(json.dumps(_brief(start + j, c, 450), ensure_ascii=False)
                          for j, c in enumerate(chunk))
        try:
            out = llm.json(AUDIENCE + "\n\n" + TRIAGE_RULES, f"Candidatos (um JSON por linha):\n{lines}",
                           max_tokens=8000)
        except RuntimeError as e:
            log(f"triagem do lote {start} falhou: {e}")
            continue
        for r in out.get("r", []):
            try:
                i = int(r["i"])
                if start <= i < start + len(chunk):
                    theme = r.get("t") if r.get("t") in THEMES else "analytics"
                    scores[i] = (max(0, min(10, int(r.get("s", 0)))), theme)
            except (KeyError, TypeError, ValueError):
                continue
        log(f"triagem: {min(start + batch, len(cands))}/{len(cands)}")
    return scores


def write_digest(llm, cands, scores, sel_cfg):
    ranked = sorted(scores.items(), key=lambda kv: (-kv[1][0], kv[0]))
    picked = [i for i, (s, _) in ranked if s >= sel_cfg["min_score"]][: sel_cfg["max_selected"]]
    quick = [i for i, (s, _) in ranked if i not in picked and s >= sel_cfg["min_score"] - 1][
        : sel_cfg["max_quick_mentions"]]
    if not picked:
        return None

    body = {
        "selecionados": [dict(_brief(i, cands[i], 1800), s=scores[i][0], t=scores[i][1]) for i in picked],
        "mencoes_rapidas": [dict(_brief(i, cands[i], 500), s=scores[i][0]) for i in quick],
    }
    out = llm.json(AUDIENCE + "\n\n" + WRITE_RULES, json.dumps(body, ensure_ascii=False),
                   max_tokens=12000, temperature=0.4)

    def item(i, extra):
        c = cands[i]
        return {
            "key": c["key"], "title": extra.get("title") or c["title"], "original_title": c["title"],
            "url": c["url"], "venue": c["venue"], "date": c["date"], "authors": c["authors"][:12],
            "institutions": c["institutions"], "watch_authors": c["watch_authors"],
            "watch_journal": c["watch_journal"], "watch_source": c.get("watch_source", ""),
            "origin": c["origin"], "cited_by": c["cited_by"],
        }

    written = {int(x["i"]): x for x in out.get("items", []) if str(x.get("i", "")).isdigit()}
    items = []
    for i in picked:
        w = written.get(i, {})
        theme = w.get("theme") if w.get("theme") in THEMES else scores[i][1]
        try:
            score = max(0, min(10, int(w.get("score", scores[i][0]))))
        except (TypeError, ValueError):
            score = scores[i][0]
        items.append(dict(item(i, w), score=score, theme=theme,
                          summary=(w.get("summary") or cands[i]["abstract"][:300]).strip()))
    items.sort(key=lambda x: (list(THEMES).index(x["theme"]), -x["score"]))

    qw = {int(x["i"]): x for x in out.get("quick", []) if str(x.get("i", "")).isdigit()}
    quick_items = [dict(item(i, qw.get(i, {})), score=scores[i][0], theme=scores[i][1],
                        note=(qw.get(i, {}).get("note") or "").strip()) for i in quick]

    return {
        "headline": (out.get("headline") or "").strip(),
        "trend": (out.get("trend") or "").strip(),
        "items": items,
        "quick": quick_items,
    }
