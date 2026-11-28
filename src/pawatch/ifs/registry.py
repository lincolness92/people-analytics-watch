"""Cadastro mestre das instituições financeiras (data/ifs/registry.json).

De onde vem cada campo:
- IF.data (cadastros 1006/1009 e Resumo da data-base mais recente): nome, código do conglomerado prudencial e
  financeiro, membros autorizados (CNPJ-base), segmento S1–S5, TCB (tipo), TC (tipo de controle), ativo total;
- CVM (cadastro de companhias abertas e estrangeiras): código CVM, CNPJ completo, situação, controle acionário;
- GLEIF (API pública, filtro `entity.registeredAs` = CNPJ formatado): LEI;
- DASFN (catálogo do BCB): CNPJ que publica o Pilar 3 (KM1);
- config/ifs/registry.json: quais instituições entram, sistemas cooperativos e a curadoria manual (nome curto,
  tickers, controlador), sempre marcada como tal.

`membership(con, registry, period, level)` liga, em qualquer data-base, cada código do IF.data à instituição do
cadastro: o conglomerado é achado pelo CNPJ-base do líder (ou de outro membro, se o líder ainda não existia), e não
pelo código, que muda com o tempo.
"""

import csv
import io
import json
import re
import unicodedata

from . import IFS, RAW, cached, cnpj14, config, db, digits, fetch, fmt_cnpj, log, now_iso, write_json
from . import ifdata

PATH = IFS / "registry.json"
PRUD_BASE = 1_000_000_000

TCB = {"b1": "banco comercial, múltiplo com carteira comercial ou caixa econômica",
       "b2": "banco múltiplo sem carteira comercial, de investimento ou de câmbio",
       "b3S": "cooperativa de crédito singular", "b3C": "central ou confederação de cooperativas",
       "b4": "banco de desenvolvimento", "n1": "não bancário de crédito",
       "n2": "não bancário do mercado de capitais", "n4": "instituição de pagamento"}
TC = {"1": "público", "2": "privado nacional", "3": "privado com controle estrangeiro"}


def slug(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()
    s = re.sub(r"\b(prudencial|s\.?a\.?|bco|banco)\b", " ", s)
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-") or "if"


def prud_label(code):
    return f"C{int(code):07d}" if code else None


def load():
    if not PATH.exists():
        raise SystemExit("data/ifs/registry.json não existe: rode `python -m pawatch ifs registry`")
    return json.loads(PATH.read_text(encoding="utf-8"))


# ---------- fontes auxiliares ----------

def cvm_companies(refresh=False):
    """{CNPJ-base: [companhia]} dos cadastros de companhias abertas e estrangeiras da CVM."""
    cfg = config("registry")
    out = {}
    for kind, url in cfg["cvm_cadastros"].items():
        body, at, _ = cached(RAW / "cvm" / f"{kind}.csv.gz", url, refresh=refresh)
        for r in csv.DictReader(io.StringIO(body.decode("latin-1")), delimiter=";"):
            c14 = digits(r.get("CNPJ_CIA") or r.get("CNPJ"))
            if len(c14) != 14:
                continue
            out.setdefault(c14[:8], []).append({
                "code": (r.get("CD_CVM") or "").lstrip("0"), "name": r.get("DENOM_SOCIAL", "").strip(),
                "cnpj14": c14, "status": r.get("SIT", ""), "sector": r.get("SETOR_ATIV", ""),
                "control": r.get("CONTROLE_ACIONARIO", ""), "register": kind, "source": url, "fetched_at": at})
    return out


def cvm_by_code(companies):
    return {c["code"]: c for lst in companies.values() for c in lst}


def gleif_lookup(c14, cache):
    """LEI pela GLEIF (filtro registeredAs com o CNPJ formatado, que é como os registros brasileiros o guardam)."""
    if c14 in cache:
        return cache[c14]
    base = config("registry")["gleif_api"]
    url = f"{base}?filter[entity.registeredAs]={fmt_cnpj(c14)}&page[size]=5"
    try:
        data = json.loads(fetch(url, pause=1.0, timeout=60))
    except RuntimeError as e:
        log(f"[registry] GLEIF falhou para {c14}: {e}")
        return None
    hit = None
    for r in data.get("data", []):
        a = r["attributes"]
        hit = {"lei": r["id"], "legal_name": a["entity"]["legalName"]["name"],
               "status": a["registration"]["status"], "entity_status": a["entity"]["status"],
               "source": url.replace("[", "%5B").replace("]", "%5D"), "fetched_at": now_iso()}
        if a["registration"]["status"] == "ISSUED":
            break
    cache[c14] = hit
    return hit


def dasfn_catalog(refresh=False):
    url = config("pillar3")["catalog_url"]
    body, at, _ = cached(RAW / "pillar3" / "catalog.json.gz", url, refresh=refresh)
    return json.loads(body)["value"], url, at


# ---------- construção ----------

def _latest_period(con):
    row = con.execute("SELECT MAX(period) FROM ifdata_periods").fetchone()
    if not row or not row[0]:
        raise SystemExit("sem dados do IF.data: rode `python -m pawatch ifs collect --source ifdata` antes")
    return row[0]


def _entities(con, period, level):
    cols = "code, name, tcb, td, tc, ti, segment, uf, city, fin_congl, prud_congl"
    return {r[0]: dict(zip(cols.split(", "), r)) for r in
            con.execute(f"SELECT {cols} FROM ifdata_entities WHERE period=? AND level=?", (period, level))}


def _values(con, period, level, metric):
    return dict(con.execute("SELECT code, value FROM ifdata_values WHERE period=? AND level=? AND metric=?",
                            (period, level, metric)))


def build(refresh=False, log=log):
    cfg = config("registry")
    con = db()
    period = _latest_period(con)
    rank_level = cfg["rank"]["level"]
    top = _entities(con, period, rank_level)
    ind = _entities(con, period, 1006)
    assets_top = _values(con, period, rank_level, cfg["rank"]["metric"])
    assets_ind = _values(con, period, 1006, "ativo_total")
    seg_by_prud = {c: e["segment"] for c, e in top.items()}
    ranked = sorted(assets_top, key=lambda c: -assets_top[c])
    rank_of = {c: i + 1 for i, c in enumerate(ranked)}

    # conjunto de conglomerados/independentes no nível de ranking: top N + incluídos à mão
    chosen = ranked[:cfg["rank"]["top_n"]]
    include_leader = {}
    for inc in cfg.get("include", []):
        e = ind.get(int(inc["leader_cnpj8"]))
        if not e:
            log(f"[registry] incluído não achado no IF.data {period}: {inc}")
            continue
        code = PRUD_BASE + e["prud_congl"] if e["prud_congl"] else int(inc["leader_cnpj8"])
        include_leader[code] = inc["leader_cnpj8"]  # o líder declarado vale mais que o maior membro por ativo
        if code not in chosen:
            chosen.append(code)

    systems = cfg.get("systems", [])
    system_bank_codes = {}
    for s in systems:
        e = ind.get(int(s["bank_cnpj8"]))
        if e and e["prud_congl"]:
            system_bank_codes[PRUD_BASE + e["prud_congl"]] = s["id"]

    companies = cvm_companies(refresh=refresh)
    by_code = cvm_by_code(companies)
    catalog, catalog_url, catalog_at = dasfn_catalog(refresh=refresh)
    km1 = {}
    for r in catalog:
        if r.get("Api") == "pilar3" and r.get("Recurso", "").lower().startswith("/km1"):
            km1.setdefault(r["CnpjInstituicao"][:8], {"cnpj14": r["CnpjInstituicao"], "name": r["NomeInstituicao"],
                                                       "resources": 0})["resources"] += 1
    gcache = {}
    cur = cfg.get("curation", {})
    insts = []

    def curation_for(prud_code, member_cnpjs):
        keys = [prud_label(prud_code - PRUD_BASE) if prud_code and prud_code >= PRUD_BASE else None] + member_cnpjs
        return next((cur[k] for k in keys if k and k in cur), {})

    for code in chosen:
        if code in system_bank_codes:
            continue  # vira parte do sistema cooperativo
        ent = top.get(code, {})
        prud = code - PRUD_BASE if code >= PRUD_BASE else None
        members = [e for e in ind.values() if prud and e["prud_congl"] == prud] or \
                  [e for e in ind.values() if e["code"] == code]
        members.sort(key=lambda e: -(assets_ind.get(e["code"]) or 0))
        member_cnpjs = [str(e["code"]).zfill(8) for e in members]
        c = curation_for(code, member_cnpjs)
        leader = c.get("leader_cnpj8") or include_leader.get(code) or \
            (member_cnpjs[0] if member_cnpjs else str(code).zfill(8))
        name = c.get("name") or re.sub(r"\s*-\s*PRUDENCIAL$", "", ent.get("name", "")).strip().title()
        inst = {
            "id": c.get("id") or slug(name), "name": name, "kind": "conglomerado" if ent.get("td") == "C" else "independente",
            "ifdata_name": ent.get("name"), "type": TCB.get(ent.get("tcb"), ent.get("tcb")), "tcb": ent.get("tcb"),
            "segment": ent.get("segment") or seg_by_prud.get(code), "control_type": TC.get(ent.get("tc"), ent.get("tc")),
            "uf": ent.get("uf"), "city": ent.get("city"),
            "ifdata": {"prudential_code": prud_label(prud), "prudential_entity": code,
                       "financial_codes": sorted({f"C{e['fin_congl']:07d}" for e in members if e["fin_congl"]}),
                       "period": period},
            "leader_cnpj8": leader,
            "members": [{"cnpj8": str(e["code"]).zfill(8), "name": e["name"], "tcb": e["tcb"], "ti": e["ti"],
                         "total_assets": assets_ind.get(e["code"])} for e in members],
            "total_assets": assets_top.get(code), "rank_assets": rank_of.get(code),
            "tickers": c.get("tickers", []), "controller": c.get("controller"),
            "curated_fields": sorted(k for k in c if k not in ("id",)),
        }
        insts.append(_enrich(inst, companies, by_code, c, km1, gcache))

    for s in systems:
        bank = ind.get(int(s["bank_cnpj8"]), {})
        rx = re.compile(s["name_regex"], re.I)
        members = [e for e in ind.values() if rx.search(e["name"] or "") or
                   (bank.get("prud_congl") and e["prud_congl"] == bank["prud_congl"])]
        sys_codes = [c for c, e in top.items() if rx.search(e["name"] or "") or c in
                     [k for k, v in system_bank_codes.items() if v == s["id"]]]
        total = sum(assets_top.get(c) or 0 for c in sys_codes)
        c = cur.get(s["id"], {})
        inst = {
            "id": s["id"], "name": s["name"], "kind": "sistema cooperativo", "ifdata_name": None,
            "type": "sistema cooperativo de crédito", "tcb": "b3", "segment": bank and seg_by_prud.get(
                PRUD_BASE + bank["prud_congl"]) if bank.get("prud_congl") else None,
            "control_type": "privado nacional (cooperativas)", "uf": bank.get("uf"), "city": bank.get("city"),
            "ifdata": {"prudential_code": prud_label(bank.get("prud_congl")),
                       "prudential_entity": PRUD_BASE + bank["prud_congl"] if bank.get("prud_congl") else None,
                       "financial_codes": sorted({f"C{e['fin_congl']:07d}" for e in members if e["fin_congl"]}),
                       "name_regex": s["name_regex"], "entities_at_rank_level": len(sys_codes), "period": period},
            "leader_cnpj8": s["bank_cnpj8"],
            "members_count": len(members),
            "members": [{"cnpj8": str(e["code"]).zfill(8), "name": e["name"], "tcb": e["tcb"], "ti": e["ti"],
                         "total_assets": assets_ind.get(e["code"])} for e in
                        sorted(members, key=lambda e: -(assets_ind.get(e["code"]) or 0))[:25]],
            "total_assets": total, "total_assets_note": "soma bruta das entidades do sistema (com dupla contagem)",
            "rank_assets": None, "tickers": [], "controller": "cooperativas associadas (sistema cooperativo)",
            "note": s.get("note"), "curated_fields": ["controller"],
        }
        insts.append(_enrich(inst, companies, by_code, c, km1, gcache))

    ids = {}
    for i in insts:  # ids únicos
        if i["id"] in ids:
            i["id"] = f"{i['id']}-{i['leader_cnpj8']}"
        ids[i["id"]] = i
    out = {
        "generated_at": now_iso(), "as_of": period, "count": len(insts),
        "selection": {"rank": cfg["rank"], "include": cfg.get("include", []), "systems": [s["id"] for s in systems]},
        "sources": {
            "ifdata": ifdata.provenance(con, period) or f"IF.data {period} (cache local)",
            "cvm": list(cfg["cvm_cadastros"].values()), "gleif": cfg["gleif_api"],
            "dasfn": {"url": catalog_url, "fetched_at": catalog_at},
            "curation": cfg.get("curation_source"),
        },
        "institutions": sorted(insts, key=lambda i: (i["rank_assets"] or 999, i["id"])),
    }
    write_json(PATH, out)
    con.close()
    log(f"[registry] {len(insts)} instituições ({period}) → {PATH.relative_to(IFS.parent.parent)}")
    return out


def _enrich(inst, companies, by_code, cur, km1, gcache):
    member_cnpjs = [m["cnpj8"] for m in inst["members"]] or [inst["leader_cnpj8"]]
    cvm = []
    for c8 in member_cnpjs:
        for comp in companies.get(c8, []):
            if comp["code"] not in [x["code"] for x in cvm]:
                cvm.append(comp)
    for code in cur.get("cvm_extra", []):
        if code in by_code and code not in [x["code"] for x in cvm]:
            cvm.append(dict(by_code[code], matched="curadoria (cvm_extra)"))
    cvm.sort(key=lambda c: (c["status"] != "ATIVO", c["code"]))
    inst["cvm"] = [{k: c[k] for k in ("code", "name", "cnpj14", "status", "sector", "control", "register")} |
                   {"matched": c.get("matched", "CNPJ-base de membro")} for c in cvm]
    leader = inst["leader_cnpj8"]
    listed = next((c for c in cvm if c["cnpj14"][:8] == leader), None)
    c14 = listed["cnpj14"] if listed else cnpj14(leader)
    inst["leader_cnpj14"] = c14
    inst["leader_cnpj"] = fmt_cnpj(c14)
    inst["leader_cnpj14_source"] = "CVM" if listed else "calculado (matriz 0001 + dígitos verificadores)"
    inst["leader_name"] = next((m["name"] for m in inst["members"] if m["cnpj8"] == leader), None)
    lei = gleif_lookup(c14, gcache)
    if not lei and cvm:  # holding listada (ex.: Itaú Unibanco Holding)
        for c in cvm:
            if c["status"] == "ATIVO":
                lei = gleif_lookup(c["cnpj14"], gcache)
                if lei:
                    lei["for"] = c["name"]
                    break
    inst["lei"] = lei
    listed_active = next((c for c in cvm if c["status"] == "ATIVO" and c["cnpj14"] != c14
                          and c["sector"].startswith(("Bancos", "Emp. Adm. Part. - Bancos"))), None)
    if listed_active:  # holding ou banco listado diferente do líder (ex.: Itaú Unibanco Holding)
        inst["lei_listed"] = gleif_lookup(listed_active["cnpj14"], gcache)
        if inst["lei_listed"]:
            inst["lei_listed"]["for"] = listed_active["name"]
    p3 = km1.get(leader) or max((km1[c] for c in member_cnpjs if c in km1), key=lambda x: x["resources"], default=None)
    inst["pillar3"] = p3
    return inst


# ---------- ligação código do IF.data → instituição, em qualquer data-base ----------

def membership(con, registry, period, level):
    """{código da entidade no nível: id da instituição} na data-base `period`."""
    ind = _entities(con, period, 1006)
    lvl = _entities(con, period, level)
    out = {}
    for inst in registry["institutions"]:
        anchors = [inst["leader_cnpj8"]] + [m["cnpj8"] for m in inst.get("members", [])]
        codes = set()
        if inst["kind"] == "sistema cooperativo":
            rx = re.compile(inst["ifdata"]["name_regex"], re.I)
            codes |= {c for c, e in lvl.items() if rx.search(e["name"] or "")}
            anchors = [inst["leader_cnpj8"]]
        row = next((ind[int(a)] for a in anchors if int(a) in ind), None)
        if row:
            codes |= level_codes(row, ind, level, lvl)
        for c in codes:
            if c in out and out[c] != inst["id"]:
                continue  # o primeiro do cadastro fica com o código (ordem por ativo)
            out[c] = inst["id"]
    return out


def level_codes(row, ind, level, lvl):
    """Códigos, no nível pedido, do conglomerado da entidade individual `row`."""
    prud = row["prud_congl"]
    members = [e for e in ind.values() if prud and e["prud_congl"] == prud] or [row]
    if level in (1004, 1009):
        codes = {PRUD_BASE + prud} if prud else {row["code"]}
    elif level == 1005:
        codes = {e["fin_congl"] if e["fin_congl"] else e["code"] for e in members}
    else:
        codes = {e["code"] for e in members}
    return {c for c in codes if c in lvl}


def names_by_code(con, period, level):
    return {c: n for c, n in con.execute("SELECT code, name FROM ifdata_entities WHERE period=? AND level=?",
                                         (period, level))}
