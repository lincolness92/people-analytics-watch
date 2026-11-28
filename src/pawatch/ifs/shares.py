"""Participação de mercado das instituições do cadastro mestre contra o sistema, com proveniência.

Nacional (IF.data, trimestral): para cada métrica e data-base, total do sistema = soma de todas as entidades do nível
que a série da métrica usa naquela data (config/ifs/ifdata.json, "series"); a instituição soma os códigos que
`registry.membership` liga a ela. Participação = instituição / sistema, no mesmo nível e na mesma data.

Regional (ESTBAN, mensal; aqui nos fins de trimestre e no mês mais recente): o mesmo cálculo por UF, região e Brasil,
dentro do universo do ESTBAN (bancos com agência; sem cooperativas). O CNPJ-base de cada linha é ligado à instituição
pelo cadastro individual (1006) do IF.data da data-base mais próxima.

Variação: pontos percentuais entre o período mais recente e o mesmo mês 1, 3 e 5 anos antes. Cada linha diz se a
comparação atravessa a quebra do Cosif 2025 (03/2025) e se o nível do IF.data mudou entre as duas pontas (crédito:
financeiro até 2024-12, prudencial desde 2025-03). Nada é emendado nem ajustado: os flags vão junto do número.
"""

import csv
import re

from . import IFS, config, db, label, log, now_iso, write_json
from . import estban, ifdata
from .registry import load as load_registry, membership

OUT = IFS / "shares"
IFD = IFS / "ifdata"
OTHERS = "_demais"


# ---------- funções puras (testadas offline) ----------

def split_shares(values, member_of):
    """values {código: valor}, member_of {código: inst} → (total, {inst: valor}, valor dos demais)."""
    total = sum(values.values())
    by = {}
    for code, v in values.items():
        inst = member_of.get(code)
        if inst:
            by[inst] = by.get(inst, 0.0) + v
    return total, by, total - sum(by.values())


def ranks(by_inst, values, member_of):
    """Posição de cada instituição entre todas as unidades (instituições do cadastro + entidades soltas)."""
    units = list(by_inst.items()) + [(f"code:{c}", v) for c, v in values.items() if c not in member_of]
    order = sorted(units, key=lambda kv: -kv[1])
    return {k: i + 1 for i, (k, _) in enumerate(order) if not k.startswith("code:")}


def crosses(base, latest, break_period):
    return int(base) < int(break_period) <= int(latest)


def changes(series, levels, latest, horizons, break_period, insts, gaps=frozenset()):
    """series {(inst, período): participação}; levels {período: nível} → linhas de variação por horizonte.
    Instituição sem valor num período em que o sistema tem dado conta como participação 0 (marcada em `absent`),
    a não ser que o período esteja em `gaps` {(inst, período)}: a instituição existia, mas o IF.data não a pôs no
    nível da série naquela data (falha de cadastro do BCB). Aí a variação fica vazia e não entra no ranking."""
    out = []
    for h in horizons:
        base = latest - 100 * h
        if base not in levels:
            continue
        for inst in insts:
            s1, s0 = series.get((inst, latest)), series.get((inst, base))
            if s1 is None and s0 is None:
                continue
            gap = "gap_base" if (inst, base) in gaps else ("gap_latest" if (inst, latest) in gaps else "")
            out.append({"inst_id": inst, "horizon_years": h, "period_base": base, "period_latest": latest,
                        "share_base": s0 or 0.0, "share_latest": s1 or 0.0,
                        "delta_pp": None if gap else round(100 * ((s1 or 0.0) - (s0 or 0.0)), 4),
                        "absent": gap or ("base" if s0 is None else ("latest" if s1 is None else "")),
                        "crosses_cosif_break": crosses(base, latest, break_period),
                        "level_base": levels[base], "level_latest": levels[latest],
                        "perimeter_change": levels[base] != levels[latest]})
    return out


def movers(rows, n):
    """Maiores ganhos e perdas (pp) entre as instituições do cadastro, sem o agregado 'demais'."""
    rows = [r for r in rows if r["inst_id"] != OTHERS and r["delta_pp"] is not None]
    up = sorted((r for r in rows if r["delta_pp"] > 0), key=lambda r: -r["delta_pp"])[:n]
    down = sorted((r for r in rows if r["delta_pp"] < 0), key=lambda r: r["delta_pp"])[:n]
    pick = lambda r: {"inst_id": r["inst_id"], "delta_pp": r["delta_pp"], "share_base": round(r["share_base"], 6),
                      "share_latest": round(r["share_latest"], 6)}
    return [pick(r) for r in up], [pick(r) for r in down]


# ---------- nacional (IF.data) ----------

def _write_csv(path, rows, fields):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=fields, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)


def national(con, reg, log=log):
    cif, csh = config("ifdata"), config("shares")
    metrics = cif["metrics"] + cif.get("derived", [])
    by_id = {m["id"]: m for m in metrics}
    brk = int(cif["cosif_break"].replace("-", ""))
    inst_ids = [i["id"] for i in reg["institutions"]]
    periods = ifdata.periods(con)
    mcache, exists, gaps = {}, {}, set()

    def existing(p):  # instituições cujo líder (ou outro membro) existe no cadastro individual da data
        if p not in exists:
            exists[p] = set(membership(con, reg, p, 1006).values())
        return exists[p]

    def mm(p, lv):
        if (p, lv) not in mcache:
            mcache[(p, lv)] = membership(con, reg, p, lv)
        return mcache[(p, lv)]

    share_rows, value_rows, total_rows = [], [], []
    series_idx, levels_idx, sys_idx = {}, {}, {}
    jobs = [(m, m["series"]) for m in metrics] + [(by_id[x], "prudencial") for x in csh["also_prudential"]
                                                  if by_id[x]["series"] != "prudencial"]
    for p in periods:
        loaded = {}
        for m, series in jobs:
            lv = ifdata.series_level(cif, series, p)
            if lv is None:
                continue
            if lv not in loaded:
                loaded[lv] = {}
                for code, metric, v in con.execute("SELECT code, metric, value FROM ifdata_values WHERE period=? AND level=?",
                                                   (p, lv)):
                    loaded[lv].setdefault(metric, {})[code] = v
            vals = loaded[lv].get(m["id"])
            if not vals:
                continue
            member_of = mm(p, lv)
            total, by, others = split_shares(vals, member_of)
            regime = ifdata.cosif_regime(p, cif)
            for inst, v in by.items():
                value_rows.append({"period": p, "inst_id": inst, "metric": m["id"], "series": series, "level": lv,
                                   "value": round(v, 2 if m["unit"] == "BRL" else 6), "unit": m["unit"],
                                   "cosif": regime})
            if series != m["series"] or not m.get("share"):
                continue
            for inst in existing(p) - set(member_of.values()):
                gaps.add((m["id"], inst, p))
            rk = ranks(by, vals, member_of)
            total_rows.append({"period": p, "metric": m["id"], "series": series, "level": lv, "total": round(total, 2),
                               "entities": len(vals), "registry_value": round(total - others, 2),
                               "others_value": round(others, 2), "unit": m["unit"], "cosif": regime})
            levels_idx.setdefault(m["id"], {})[p] = lv
            sys_idx[(m["id"], p)] = total
            for inst, v in list(by.items()) + [(OTHERS, others)]:
                share = v / total if total else None
                if share is None:
                    continue
                series_idx[(m["id"], inst, p)] = share
                share_rows.append({"period": p, "inst_id": inst, "metric": m["id"], "level": lv,
                                   "value": round(v, 2), "system_total": round(total, 2), "share": round(share, 8),
                                   "rank": rk.get(inst, ""), "cosif": regime})
    _write_csv(IFD / "values.csv", value_rows, ["period", "inst_id", "metric", "series", "level", "value", "unit", "cosif"])
    _write_csv(IFD / "system_totals.csv", total_rows,
               ["period", "metric", "series", "level", "total", "entities", "registry_value", "others_value", "unit", "cosif"])
    _write_csv(OUT / "national_ifdata.csv", share_rows,
               ["period", "inst_id", "metric", "level", "value", "system_total", "share", "rank", "cosif"])

    change_rows, summary = [], {}
    for m in metrics:
        if not m.get("share") or m["id"] not in levels_idx:
            continue
        lv = levels_idx[m["id"]]
        latest = max(lv)
        ser = {(inst, p): s for (mid, inst, p), s in series_idx.items() if mid == m["id"]}
        g = {(inst, p) for (mid, inst, p) in gaps if mid == m["id"]}
        rows = changes(ser, lv, latest, csh["horizons_years"], brk, inst_ids + [OTHERS], gaps=g)
        for r in rows:
            r["metric"] = m["id"]
            r["system_growth"] = round(sys_idx[(m["id"], latest)] / sys_idx[(m["id"], r["period_base"])] - 1, 6) \
                if sys_idx.get((m["id"], r["period_base"])) else ""
        change_rows += rows
        top = sorted(((inst, s) for (inst, p), s in ser.items() if p == latest and inst != OTHERS), key=lambda x: -x[1])
        hz = {}
        for h in csh["horizons_years"]:
            rh = [r for r in rows if r["horizon_years"] == h]
            if not rh:
                continue
            up, down = movers(rh, csh["top_movers"])
            oth = next((r for r in rh if r["inst_id"] == OTHERS), None)
            hz[str(h)] = {"period_base": rh[0]["period_base"], "crosses_cosif_break": rh[0]["crosses_cosif_break"],
                          "perimeter_change": rh[0]["perimeter_change"], "gainers": up, "losers": down,
                          "others_delta_pp": oth["delta_pp"] if oth else None}
        summary[m["id"]] = {"label": m["label"], "unit": m["unit"], "group": m["group"], "series": m["series"],
                            "latest_period": latest, "level_latest": lv[latest],
                            "system_total": round(sys_idx[(m["id"], latest)], 2),
                            "top": [{"inst_id": i, "share": round(s, 6)} for i, s in top[:csh["top_share"]]],
                            "others_share": round(ser.get((OTHERS, latest), 0.0), 6), "horizons": hz}
    _write_csv(OUT / "changes_ifdata.csv", change_rows,
               ["metric", "inst_id", "horizon_years", "period_base", "period_latest", "share_base", "share_latest",
                "delta_pp", "absent", "system_growth", "crosses_cosif_break", "perimeter_change", "level_base",
                "level_latest"])
    prov = {}
    for p, gen, at, found in con.execute("SELECT period, generated, extracted_at, metrics FROM ifdata_periods ORDER BY period"):
        prov[str(p)] = {"generated": gen, "extracted_at": at, "files": ifdata.provenance(con, p),
                        "columns": __import__("json").loads(found)}
    write_json(IFD / "provenance.json", prov)
    log(f"[shares] IF.data: {len(share_rows)} linhas de participação, {len(change_rows)} de variação")
    return summary, change_rows


# ---------- regional (ESTBAN) ----------

def estban_membership(con, reg, month, names):
    """{CNPJ-base do ESTBAN: inst} usando o cadastro 1006 do IF.data mais próximo do mês."""
    periods = ifdata.periods(con)
    if not periods:
        return {}
    prior = [p for p in periods if p <= month]
    p = prior[-1] if prior else periods[0]
    out = {str(c).zfill(8): i for c, i in membership(con, reg, p, 1006).items()}
    for inst in reg["institutions"]:
        if inst["kind"] == "sistema cooperativo":
            rx = re.compile(inst["ifdata"]["name_regex"], re.I)
            for c8, n in names.items():
                if rx.search(n or "") and c8 not in out:
                    out[c8] = inst["id"]
    return out


def estban_gaps(con, months, min_weight=0.005):
    """Meses em que um banco relevante (≥ 0,5% do crédito) some do ESTBAN e volta no mês seguinte (ex.: Itaú em
    2023-06, Santander em 2025-03). {mês: [CNPJ-base que faltou]}."""
    tot = {}
    for m, c8, v in con.execute("SELECT month, cnpj8, SUM(value) FROM estban_uf WHERE metric='credito_total' "
                                "GROUP BY 1, 2"):
        tot.setdefault(m, {})[c8] = v
    out = {}
    for k in range(1, len(months)):
        a, m, ahead = months[k - 1], months[k], months[k + 1:k + 4]
        sys_m = sum(tot.get(a, {}).values()) or 1
        miss = [c8 for c8, v in tot.get(a, {}).items() if v >= min_weight * sys_m
                and any(c8 in tot.get(b, {}) for b in ahead) and tot.get(m, {}).get(c8, 0) <= 0.1 * v]
        if miss:
            out[m] = sorted(miss)
    return out


def complete_month(m, months, gaps, back=3):
    """O mês pedido, ou o anterior mais próximo (até `back` meses) sem banco relevante faltando."""
    i = months.index(m) if m in months else None
    if i is None:
        return None
    for j in range(i, max(i - back - 1, -1), -1):
        if months[j] not in gaps:
            return months[j]
    return None


def regional(con, reg, log=log):
    ces, csh = config("estban"), config("shares")
    metrics = csh["estban_metrics"]
    uf_region = {uf: r for r, ufs in ces["regions"].items() for uf in ufs}
    months = [m for (m,) in con.execute("SELECT month FROM estban_files ORDER BY month")]
    if not months:
        return {}, []
    latest = months[-1]
    gaps = estban_gaps(con, months)
    requested = sorted({m for m in months if m % 100 in ces["share_months"]} |
                       {latest} | {latest - 100 * h for h in csh["horizons_years"] if latest - 100 * h in months})
    use = {m: complete_month(m, months, gaps) for m in requested}  # mês pedido → mês usado (completo)
    names = dict(con.execute("SELECT cnpj8, name FROM estban_names"))
    wide, idx = [], {}
    for req in requested:
        month = use[req]
        if month is None:
            continue
        mof = estban_membership(con, reg, month, names)
        agg = {}  # (geo_type, geo, inst, metric) → valor
        for c8, uf, metric, v in con.execute("SELECT cnpj8, uf, metric, value FROM estban_uf WHERE month=?", (month,)):
            if metric not in metrics:
                continue
            inst = mof.get(c8, OTHERS)
            for gt, g in (("uf", uf), ("regiao", uf_region.get(uf, "?")), ("brasil", "BR")):
                for who in (inst, "_sistema"):
                    agg[(gt, g, who, metric)] = agg.get((gt, g, who, metric), 0.0) + v
        geos = sorted({(gt, g) for gt, g, _, _ in agg})
        for gt, g in geos:
            for who in sorted({w for (a, b, w, _) in agg if (a, b) == (gt, g)}):
                row = {"month": req, "month_used": month, "geo_type": gt, "geo": g, "inst_id": who}
                for metric in metrics:
                    v = agg.get((gt, g, who, metric))
                    tot = agg.get((gt, g, "_sistema", metric))
                    if v is None:
                        continue
                    row[metric] = round(v, 2)
                    if who != "_sistema" and tot:
                        row[f"{metric}_share"] = round(v / tot, 8)
                        idx[(gt, g, metric, who, req)] = v / tot
                wide.append(row)
    fields = ["month", "month_used", "geo_type", "geo", "inst_id"] + [x for m in metrics for x in (m, f"{m}_share")]
    _write_csv(OUT / "regional_estban.csv", wide, fields)

    inst_ids = [i["id"] for i in reg["institutions"]] + [OTHERS]
    change_rows, summary = [], {}
    levels = {m: 0 for m in requested if use[m]}
    geos = sorted({(gt, g) for gt, g, *_ in idx})
    for metric in metrics:
        for gt, g in geos:
            ser = {(inst, mo): s for (a, b, mm, inst, mo), s in idx.items() if (a, b, mm) == (gt, g, metric)}
            rows = changes(ser, levels, latest, csh["horizons_years"], 999999, inst_ids)
            for r in rows:
                r.update({"metric": metric, "geo_type": gt, "geo": g})
                for k in ("crosses_cosif_break", "level_base", "level_latest", "perimeter_change"):
                    r.pop(k, None)
            change_rows += rows
            if gt == "uf":
                continue
            top = sorted(((i, s) for (i, mo), s in ser.items() if mo == latest and i != OTHERS), key=lambda x: -x[1])
            hz = {}
            for h in csh["horizons_years"]:
                rh = [r for r in rows if r["horizon_years"] == h]
                if rh:
                    up, down = movers(rh, csh["top_movers"])
                    hz[str(h)] = {"period_base": rh[0]["period_base"], "gainers": up, "losers": down}
            summary.setdefault(metric, {})[g] = {"top": [{"inst_id": i, "share": round(s, 6)} for i, s in top[:csh["top_share"]]],
                                                 "horizons": hz}
    _write_csv(OUT / "changes_estban.csv", change_rows,
               ["metric", "geo_type", "geo", "inst_id", "horizon_years", "period_base", "period_latest",
                "share_base", "share_latest", "delta_pp", "absent"])
    municipal(con, reg, latest, names, csh["estban_municipal_metrics"], ces)
    log(f"[shares] ESTBAN: {len(wide)} linhas regionais ({len(requested)} meses), {len(change_rows)} de variação")
    return {"latest_month": latest, "months": [m for m in requested if use[m]],
            "months_replaced": {str(m): use[m] for m in requested if use[m] != m},
            "incomplete_months": {str(m): v for m, v in gaps.items()}, "metrics": summary}, change_rows


def municipal(con, reg, month, names, metrics, ces):
    rows = estban.municipal_rows(month, con)
    mof = estban_membership(con, reg, month, names)
    tot, by = {}, {}
    for r in rows:
        mv = estban.metric_values(r["values"], {k: ces["metrics"][k] for k in metrics})
        mv.update({k: v for k, v in r.get("fixed", {}).items() if k in mv})
        key = (r["uf"], r["codmun_ibge"] or r["codmun"], r["municipio"])
        inst = mof.get(r["cnpj8"])
        for k, v in mv.items():
            tot[(key, k)] = tot.get((key, k), 0.0) + v
            if inst:
                by[(key, inst, k)] = by.get((key, inst, k), 0.0) + v
    out = []
    for (key, inst, k), v in sorted(by.items()):
        t = tot.get((key, k))
        out.append({"month": month, "uf": key[0], "codmun_ibge": key[1], "municipio": key[2], "inst_id": inst,
                    "metric": k, "value": round(v, 2), "municipal_total": round(t or 0, 2),
                    "share": round(v / t, 6) if t else ""})
    _write_csv(OUT / "municipios_estban_latest.csv", out,
               ["month", "uf", "codmun_ibge", "municipio", "inst_id", "metric", "value", "municipal_total", "share"])


# ---------- resumo ----------

def run(log=log):
    reg = load_registry()
    con = db()
    nat, nat_changes = national(con, reg, log=log)
    regi, reg_changes = regional(con, reg, log=log)
    cif = config("ifdata")
    est_files = [{"month": m, "url": u, "fetched_at": a, "generated": g, "layout": l} for m, u, a, g, l in
                 con.execute("SELECT month, url, fetched_at, generated, layout FROM estban_files ORDER BY month")]
    con.close()
    names = {i["id"]: i["name"] for i in reg["institutions"]}
    names[OTHERS] = "demais instituições (fora do cadastro)"
    per_inst = {}
    for r in nat_changes:
        d = per_inst.setdefault(r["inst_id"], {}).setdefault(r["metric"], {"share_latest": round(r["share_latest"], 6),
                                                                            "period_latest": r["period_latest"]})
        d[f"delta_pp_{r['horizon_years']}y"] = r["delta_pp"]
    summary = {
        "generated_at": now_iso(),
        "registry_as_of": reg["as_of"],
        "definitions": {
            "share": "valor da instituição / soma de todas as entidades do mesmo nível do IF.data (ou do universo ESTBAN) na mesma data",
            "delta_pp": "participação no período mais recente menos a do mesmo mês h anos antes, em pontos percentuais",
            "gainers_losers": "entre as instituições do cadastro mestre; o resto do sistema é '_demais'",
            "units": "valores em R$ (unidades); contagens em unidades; ver docs/ifs-dados.md",
        },
        "flags": {
            "cosif_break": cif["cosif_break"],
            "cosif_note": "Desde 03/2025 os relatórios contábeis do IF.data seguem o Cosif 2025 (Res. CMN 4.966, IN BCB 426–433): ativo, passivo e resultado mudaram de definição. Comparações que atravessam a data trazem crosses_cosif_break = true; a série não é emendada.",
            "credit_perimeter": cif["series"]["credito"]["label"],
            "estban_universe": "ESTBAN cobre bancos com agência; não tem cooperativas nem bancos digitais sem agência. Participação regional é dentro desse universo.",
            "estban_total_rows": "Desde 2025 (e em massa desde 2026-04) o ESTBAN traz, em uma linha por banco (quase sempre Brasília), o total nacional do banco somado ao valor do município. Essas linhas são detectadas e corrigidas (data/ifs/estban/fixes.csv tem o bruto e o corrigido); sem a correção, o crédito do sistema dobraria em 2026-04.",
            "estban_missing_banks": "Meses em que um banco relevante some do arquivo (ex.: Itaú em 2023-06, Santander em 2025-03) não são usados: a comparação usa o mês completo anterior (estban.months_replaced).",
            "cooperative_systems": "Sicredi e Sicoob são somas brutas das entidades do sistema (dupla contagem em ativo, captações e PL).",
        },
        "names": names,
        "ifdata": {"metrics": nat},
        "estban": regi,
        "institutions": per_inst,
        "sources": {
            "ifdata": "data/ifs/ifdata/provenance.json (arquivo, URL, data de coleta e geração de cada data-base)",
            "estban": est_files[-6:], "estban_all": "tabela estban_files da base local; URL por mês",
            "registry": "data/ifs/registry.json",
        },
    }
    write_json(OUT / "summary.json", summary)
    log(f"[shares] resumo em data/ifs/shares/summary.json")
    return summary
