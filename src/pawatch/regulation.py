"""Regulation layer: norms and standards per topic, as first-class items linked to the topic's themes and techniques.

Sources (topics/<slug>/regulation.json):
- "bacen": Banco Central do Brasil normativos, through the official search API (the "Busca de normas" page) and the
  full-text API, queried with the topic's terms. Every run re-reads the result lists (a few hundred rows, cheap), so
  revocations are picked up; only norms never seen go to the LLM.
- "landmarks": curated international references (regulator, title, date, verified link, short summary).

Pipeline for Bacen: collect → collapse series ("Divulga a versão N do Manual X": only the latest version counts) →
LLM triage on the subject line (0–10 relevance to the topic, theme) → full text for score >= MIN_SCORE → LLM sheet
(what it is, what it requires, who it applies to, when, techniques it touches) → data/<slug>/regulation.json.
"""

import html as htmllib
import json
import re
import sys
import urllib.parse
from concurrent.futures import ThreadPoolExecutor
from datetime import date

from . import DATA
from .http import get_json

BCB_SEARCH = "https://www.bcb.gov.br/api/search/app/normativos/buscanormativos"
BCB_TEXT = "https://www.bcb.gov.br/api/conteudo/app/normativos/exibenormativo"
BCB_PAGE = "https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo"
UA = {"User-Agent": "Mozilla/5.0 (research-watch; +https://github.com)"}
MIN_SCORE = 6          # triage score that earns a full-text sheet and a place on the site and in the search index
TEXT_CHARS = 14000     # norm text sent to the LLM (the operative articles come first)
PAGE = 100


def _clean(s):
    s = htmllib.unescape(re.sub(r"<[^>]+>", " ", s or ""))
    return re.sub(r"\s+", " ", s).strip()


def _num(n):
    try:
        f = float(n)
        return str(int(f)) if f.is_integer() else str(f)
    except (TypeError, ValueError):
        return str(n or "")


def page_url(tipo, numero):
    return f"{BCB_PAGE}?{urllib.parse.urlencode({'tipo': tipo, 'numero': numero})}"


def parse_row(r):
    tipo = r.get("TipodoNormativoOWSCHCS") or ""
    numero = _num(r.get("NumeroOWSNMBR"))
    return {"id": f"bcb:{tipo}:{numero}", "regulator": "Banco Central do Brasil", "type": tipo, "number": numero,
            "title": r.get("title") or f"{tipo} nº {numero}", "date": (r.get("data") or "")[:10],
            "subject": _clean(r.get("AssuntoNormativoOWSMTXT") or r.get("HitHighlightedSummary")),
            "revoked": r.get("RevogadoOWSBOOL") == "1", "cancelled": r.get("CanceladoOWSBOOL") == "1",
            "url": page_url(tipo, numero), "source": "bacen"}


def bcb_search(term, since, fetch=get_json, max_rows=1500):
    """Norms matching `term` (full-text search of the API), newest first, down to `since` (YYYY-MM-DD)."""
    out, start = [], 0
    while start < max_rows:
        params = {"querytext": f"ContentType:normativo AND contentSource:normativos AND {term}", "rowlimit": PAGE,
                  "startrow": start, "sortlist": "Data1OWSDATE:descending"}
        d = fetch(BCB_SEARCH, params, headers=UA, timeout=40, retries=3)
        rows = d.get("Rows") or []
        for r in rows:
            item = parse_row(r)
            if item["date"] and item["date"] < since:
                return out
            out.append(item)
        start += PAGE
        if len(rows) < PAGE or start >= (d.get("TotalRows") or 0):
            break
    return out


SERIES = re.compile(r"divulga a vers[aã]o\s+([\d.]+)\s+d[oa]s?\s+(.+?)(?:,|\s+que\s+|\.|$)", re.I)


def series_key(item):
    """'Divulga a versão 8.5 do Manual Operacional do DICT, que compõe...' → ('manual operacional do dict', '8.5')."""
    m = SERIES.search(item.get("subject") or "")
    if not m:
        return None, None
    name = re.sub(r"\s+", " ", m.group(2).lower().strip(" “”\"'"))
    return name, m.group(1)


def collapse_series(items):
    """Keep only the newest version of each manual/document series; the others are marked superseded."""
    best = {}
    for it in items:
        key, _ = series_key(it)
        if key and (key not in best or it["date"] > best[key]["date"]):
            best[key] = it
    keep = []
    for it in items:
        key, version = series_key(it)
        if key and best[key]["id"] != it["id"]:
            continue
        if key:
            it["series"] = key
            it["version"] = version
        keep.append(it)
    return keep


def bcb_text(tipo, numero, fetch=get_json):
    """Full text and links of one norm: {text, linked, references, dou}."""
    d = fetch(BCB_TEXT, {"p1": tipo, "p2": numero}, headers=UA, timeout=60, retries=3)
    c = (d.get("conteudo") or [{}])[0]
    linked = []
    for part in (c.get("NormasVinculadas") or "").split(";#"):
        bits = [b.strip("@ ") for b in part.split(";")]
        if len(bits) >= 2 and bits[0]:
            linked.append(f"{bits[0].title()} nº {bits[1]}" + (f"/{bits[2]}" if len(bits) > 2 and bits[2] else ""))
    refs = [r.strip() for r in (c.get("Referencias") or "").split(";#") if r.strip() and r.strip() != "None"]
    return {"text": _clean(c.get("Texto")), "linked": linked[:30], "references": refs[:20],
            "dou": c.get("DOU") if c.get("DOU") not in (None, "None") else None}


def triage_rules(topic, focus):
    themes = ", ".join(f"{k} ({v.split(' ', 1)[-1]})" for k, v in topic.themes.items())
    return f"""Você faz a triagem de normas do Banco Central do Brasil (e do CMN) para o tema "{topic.name}".
O que importa: {focus}.
Dê a cada norma uma nota 0–10 de RELEVÂNCIA para quem trabalha nesse tema num grande banco:
- 9–10: cria ou muda obrigações centrais do tema (ex.: regras de devolução, autenticação, compartilhamento de dados de fraude, segurança cibernética, gestão de riscos).
- 7–8: altera de forma relevante uma norma central, ou manual operacional importante do tema.
- 5–6: tangencial; menciona o tema mas o foco é outro.
- 0–4: fora do tema, ou administrativa (leilões, taxas, nomes de dirigentes, servidores e edifícios do BC, autorizações de instituições específicas).
Atribua um tema `t` entre: {themes}.
Responda APENAS com JSON: {{"r": [{{"i": <id>, "s": <nota int>, "t": "<tema>"}}, ...]}} cobrindo todos os ids."""


def triage(llm, items, topic, focus, log, batch=60):
    scores = {}
    for start in range(0, len(items), batch):
        chunk = items[start:start + batch]
        lines = "\n".join(json.dumps({"i": start + j, "tipo": it["type"], "titulo": it["title"], "data": it["date"],
                                      "assunto": it["subject"][:400]}, ensure_ascii=False) for j, it in enumerate(chunk))
        try:
            out = llm.json(triage_rules(topic, focus), f"Normas (um JSON por linha):\n{lines}", max_tokens=8000)
        except RuntimeError as e:
            log(f"regulação: triagem do lote {start} falhou: {e}")
            continue
        for r in out.get("r", []):
            try:
                i = int(r["i"])
                if start <= i < start + len(chunk):
                    t = r.get("t") if r.get("t") in topic.themes else None
                    scores[chunk[i - start]["id"]] = (max(0, min(10, int(r.get("s", 0)))), t)
            except (KeyError, TypeError, ValueError):
                continue
        log(f"regulação: triagem {min(start + batch, len(items))}/{len(items)}")
    return scores


def sheet_rules(topic, focus):
    themes = ", ".join(topic.themes)
    return f"""Você resume uma norma regulatória para profissionais do tema "{topic.name}" num grande banco ({focus}).
Use SOMENTE o texto da norma fornecido. PT-BR, direto, sem juridiquês desnecessário. Não invente prazos, valores ou artigos.
Responda APENAS com JSON:
{{"resumo": "<2-3 frases: o que a norma é e o que muda>",
  "exige": ["<obrigação concreta, com artigo quando houver>", ...],
  "aplica_se": "<a quem se aplica>",
  "vigencia": "<quando entra em vigor / prazos, se o texto disser; senão vazio>",
  "tecnicas": ["<técnica, processo ou capacidade que a norma afeta (ex.: autenticação, monitoramento de transações, compartilhamento de dados, modelos de risco)>", ...],
  "temas": ["<chaves entre: {themes}>"],
  "impacto": <0-10: quanto muda o dia a dia de quem trabalha no tema>}}"""


def make_sheet(llm, item, full, topic, focus):
    text = full["text"][:TEXT_CHARS]
    user = (f"{item['title']} ({item['date']})\nAssunto: {item['subject']}\n"
            + (f"Normas vinculadas: {', '.join(full['linked'][:12])}\n" if full["linked"] else "")
            + f"\nTexto:\n{text}")
    out = llm.json(sheet_rules(topic, focus), user, max_tokens=4000)
    return {"summary": str(out.get("resumo") or "").strip(), "requires": [str(x) for x in out.get("exige") or []][:8],
            "applies_to": str(out.get("aplica_se") or "").strip(), "effective": str(out.get("vigencia") or "").strip(),
            "techniques": [str(x) for x in out.get("tecnicas") or []][:8],
            "themes": [t for t in out.get("temas") or [] if t in topic.themes],
            "impact": max(0, min(10, int(out.get("impacto") or 0))) if str(out.get("impacto") or "0").isdigit() else 0}


def config(topic):
    p = topic.dir / "regulation.json"
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else None


def store_path(topic):
    return DATA / topic.slug / "regulation.json"


def load(topic):
    p = store_path(topic)
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else {"updated": None, "items": {}, "seen": {}}


def published(topic):
    """What the site and the search index show: landmarks + Bacen norms that passed triage, newest first."""
    cfg = config(topic) or {}
    out = []
    for lm in cfg.get("landmarks") or []:
        out.append({"id": f"marco:{lm['url']}", "source": "curadoria", **lm})
    store = load(topic)
    for it in store["items"].values():
        if it.get("score", 0) >= MIN_SCORE and it.get("summary"):
            out.append(it)
    return sorted(out, key=lambda x: x.get("date") or "", reverse=True)


def save(topic, store):
    p = store_path(topic)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(store, ensure_ascii=False, indent=1), encoding="utf-8")


def run(topic, llm, log=lambda m: print(m, file=sys.stderr), max_sheets=150, fetch=get_json):
    """Update data/<slug>/regulation.json. Returns {"new": n, "sheets": n, "revoked": n}."""
    cfg = config(topic)
    if not cfg or not cfg.get("bacen"):
        return {"new": 0, "sheets": 0, "revoked": 0}
    b = cfg["bacen"]
    focus = cfg.get("focus") or topic.meta.get("rubric_focus", "")
    store = load(topic)
    found = {}
    for term in b["terms"]:
        try:
            rows = bcb_search(term, b.get("since", "2020-01-01"), fetch=fetch)
        except RuntimeError as e:
            log(f"regulação [{topic.slug}]: busca '{term}' falhou: {e}")
            continue
        for it in rows:
            if it["type"] in b.get("types", [it["type"]]):
                found.setdefault(it["id"], it)
        log(f"regulação [{topic.slug}]: '{term}' → {len(rows)} normas")
    items = collapse_series(sorted(found.values(), key=lambda x: x["date"], reverse=True))
    revoked = 0
    for it in items:  # status changes of norms we already have
        old = store["items"].get(it["id"])
        if old and (old.get("revoked") != it["revoked"] or old.get("cancelled") != it["cancelled"]):
            old.update(revoked=it["revoked"], cancelled=it["cancelled"])
            revoked += 1
    # superseded series versions leave the store
    live_series = {it.get("series"): it["id"] for it in items if it.get("series")}
    for k, old in list(store["items"].items()):
        if old.get("series") and live_series.get(old["series"]) not in (None, k):
            del store["items"][k]
    new = [it for it in items if it["id"] not in store["seen"]]
    log(f"regulação [{topic.slug}]: {len(items)} normas (séries colapsadas), {len(new)} novas para triagem")
    scores = triage(llm, new, topic, focus, log) if new else {}
    for it in new:
        s, t = scores.get(it["id"], (None, None))
        if s is None:
            continue  # triage failed for its batch: try again next run
        store["seen"][it["id"]] = s
        if s >= MIN_SCORE:
            store["items"][it["id"]] = dict(it, score=s, theme=t)
    save(topic, store)  # triage is the slow, costly part: keep it even if the sheets are interrupted
    todo = sorted((x for x in store["items"].values() if not x.get("summary") and x.get("source") == "bacen"),
                  key=lambda x: (-x.get("score", 0), x["date"]), reverse=False)[:max_sheets]
    done = 0

    def one(it):
        try:
            full = bcb_text(it["type"], it["number"], fetch=fetch)
            if not full["text"]:
                return False
            it.update(make_sheet(llm, it, full, topic, focus), linked=full["linked"], references=full["references"],
                      dou=full["dou"], text_chars=len(full["text"]))
            return True
        except (RuntimeError, ValueError, KeyError) as e:
            log(f"regulação [{topic.slug}]: ficha de {it['title']} falhou: {str(e)[:160]}")
            return False

    with ThreadPoolExecutor(max_workers=4) as pool:
        for ok in pool.map(one, todo):
            done += bool(ok)
            if ok and done % 10 == 0:
                log(f"regulação [{topic.slug}]: {done}/{len(todo)} fichas")
                save(topic, store)
    store["updated"] = date.today().isoformat()
    save(topic, store)
    log(f"regulação [{topic.slug}]: +{sum(1 for it in new if store['seen'].get(it['id'], 0) >= MIN_SCORE)} relevantes, "
        f"{done} fichas, {revoked} mudanças de status")
    return {"new": len(new), "sheets": done, "revoked": revoked}
