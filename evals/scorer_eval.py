"""Measure the CURRENT prefilter + triage against reference labels (evals/scorer/*-fable-labels.json).

Re-uses the candidates saved by scorer_sample.py (no new collection): runs prefilter and triage as the daily run
does, then compares, on the labelled sample, the triage score with the reference `overall` and digest decision.

    PYTHONPATH=src python evals/scorer_eval.py --labels evals/scorer/2026-11-25-fable-labels.json [--topic fraude-bancaria]

Prints, per topic and overall, old vs new: Spearman, mean absolute error, bias, digest precision/recall (score >= 7 vs
"yes"), library precision/recall (score >= 5 vs reference overall >= 5), and how many reference "yes"/"maybe" items the
prefilter now sends. Writes evals/scorer/<date>-eval.json.
"""

import argparse
import json
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from pawatch.llm import LLM  # noqa: E402
from pawatch.score import prefilter, triage  # noqa: E402
from pawatch.topic import Topic  # noqa: E402


def log(m):
    print(m, file=sys.stderr, flush=True)


def ranks(xs):
    order = sorted(range(len(xs)), key=lambda i: xs[i])
    r = [0.0] * len(xs)
    i = 0
    while i < len(order):
        j = i
        while j + 1 < len(order) and xs[order[j + 1]] == xs[order[i]]:
            j += 1
        for k in range(i, j + 1):
            r[order[k]] = (i + j) / 2 + 1
        i = j + 1
    return r


def spearman(a, b):
    if len(a) < 3:
        return None
    ra, rb = ranks(a), ranks(b)
    ma, mb = sum(ra) / len(ra), sum(rb) / len(rb)
    cov = sum((x - ma) * (y - mb) for x, y in zip(ra, rb))
    va = sum((x - ma) ** 2 for x in ra) ** 0.5
    vb = sum((y - mb) ** 2 for y in rb) ** 0.5
    return round(cov / (va * vb), 3) if va and vb else None


def metrics(pairs):
    """pairs: [(score, label)] for labelled items that got a score."""
    if not pairs:
        return {}
    s = [p[0] for p in pairs]
    o = [p[1]["overall"] for p in pairs]
    tp = sum(1 for x, l in pairs if x >= 7 and l["digest"] == "yes")
    sel = sum(1 for x, _ in pairs if x >= 7)
    yes = sum(1 for _, l in pairs if l["digest"] == "yes")
    ltp = sum(1 for x, l in pairs if x >= 5 and l["overall"] >= 5)
    lsel = sum(1 for x, _ in pairs if x >= 5)
    lpos = sum(1 for _, l in pairs if l["overall"] >= 5)
    return {"n": len(pairs), "spearman": spearman(s, o), "mae": round(sum(abs(a - b) for a, b in zip(s, o)) / len(s), 2),
            "bias": round(sum(a - b for a, b in zip(s, o)) / len(s), 2),
            "digest_precision": round(tp / sel, 2) if sel else None, "digest_recall": round(tp / yes, 2) if yes else None,
            "digest_selected": sel, "library_precision": round(ltp / lsel, 2) if lsel else None,
            "library_recall": round(ltp / lpos, 2) if lpos else None}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--labels", required=True)
    ap.add_argument("--topic")
    a = ap.parse_args()
    labels = json.loads(Path(a.labels).read_text(encoding="utf-8"))["labels"]
    report, all_old, all_new = {}, [], []
    for slug, labs in labels.items():
        if a.topic and slug != a.topic:
            continue
        sample_file = sorted((ROOT / "evals" / "scorer").glob(f"*-{slug}.json"))[-1]
        saved = json.loads(sample_file.read_text(encoding="utf-8"))
        topic = Topic(slug)
        sel = topic.queries()["selection"]
        cands = [dict(c, key=c["url"], region=c.get("region", "")) for c in saved["all"]]
        pool = prefilter(cands, sel["max_candidates_for_llm"], topic.meta["prefilter_keywords"])
        llm = LLM()
        scores = triage(llm, pool, topic, log=log)
        new_by_url = {pool[i]["url"]: (s[0], pool[i].get("triage")) for i, s in scores.items()}
        sent = {c["url"] for c in pool}
        by_url = {lab["url"]: lab for lab in labs}
        old_pairs = [(lab["triage_score"], lab) for lab in labs if lab.get("triage_score") is not None]
        new_pairs = [(new_by_url[u][0], lab) for u, lab in by_url.items() if u in new_by_url]
        wanted = [lab for lab in labs if lab["digest"] in ("yes", "maybe")]
        report[slug] = {"old": metrics(old_pairs), "new": metrics(new_pairs), "triage_usage": llm.usage,
                        "wanted_sent_old": sum(1 for lab in wanted if lab.get("prefilter") != "cortado"),
                        "wanted_sent_new": sum(1 for lab in wanted if lab["url"] in sent), "wanted": len(wanted),
                        "items": [{"title": lab["title"][:90], "ref": lab["overall"], "digest": lab["digest"], "old": lab.get("triage_score"),
                                   "new": new_by_url.get(lab["url"], (None,))[0], "new_triage": new_by_url.get(lab["url"], (None, None))[1]}
                                  for lab in labs]}
        all_old += old_pairs
        all_new += new_pairs
        r = report[slug]
        log(f"[{slug}] antigo {r['old']}\n[{slug}] novo   {r['new']}\n[{slug}] desejados enviados pelo pré-filtro: "
            f"{r['wanted_sent_old']} → {r['wanted_sent_new']} de {r['wanted']}; custo da triagem US$ {llm.usage['cost_usd']:.4f}")
    report["overall"] = {"old": metrics(all_old), "new": metrics(all_new)}
    log(f"[geral] antigo {report['overall']['old']}\n[geral] novo   {report['overall']['new']}")
    out = ROOT / "evals" / "scorer" / f"{date.today().isoformat()}-eval.json"
    out.write_text(json.dumps(report, ensure_ascii=False, indent=1), encoding="utf-8")
    log(f"→ {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
