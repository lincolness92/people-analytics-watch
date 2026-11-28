"""Pilar 3, tabela KM1 (capital e liquidez), pelo catálogo DASFN do BCB.

O catálogo (`DASFN/Recursos`) traz, por instituição e trimestre, a URL do JSON publicado pela própria instituição.
Há dois leiautes: v1 (plano, `{"km1_1": 133016594.3, ...}`) e v2 (blocos com `t`, `t_1`..`t_4`, isto é, o
trimestre de referência e os quatro anteriores). Cada emissor escolhe a unidade: o BB publica valores em R$ mil e
índices em %; o BTG, em R$ milhões e índices em fração. A normalização é por documento:

- índices: compara km1_5 (CET1/RWA publicado) com km1_1/km1_4 (calculado, sem unidade): se bate com a fração, os
  índices são multiplicados por 100; se bate com o percentual, ficam como estão;
- valores: escolhe o fator (1, mil ou milhão) que deixa a exposição para alavancagem (km1_13) mais perto do ativo
  total prudencial do IF.data no mesmo trimestre. Sem IF.data, usa a ordem de grandeza e marca como inferido.

Saída: data/ifs/pillar3/km1.csv (valores em R$ e %), uma linha por instituição × trimestre × campo, ficando o
número do documento mais recente que trouxe aquele trimestre (reapresentações valem).
"""

import csv
import json
import math
import re

from . import IFS, RAW, cached, config, db, fetch, log, now_iso, read_json, write_json
from . import ifdata

OUT = IFS / "pillar3"
SCALES = (1.0, 1e3, 1e6)


def quarter_period(q):
    """'2026-2' → 202606."""
    y, n = str(q).split("-")
    return int(y) * 100 + int(n) * 3


def last_closed_quarter(today=None):
    """AAAAMM do último trimestre encerrado (em 28/11/2026: 202609)."""
    from datetime import date
    d = today or date.today()
    q = (d.month - 1) // 3  # trimestres completos no ano
    return d.year * 100 + q * 3 if q else (d.year - 1) * 100 + 12


def argument_quarter(arg):
    """Trimestre do argumento do catálogo: '2026-2', ou um nome de arquivo com a data-base ('..._20200630_km1.json',
    como no Santander. None se não der para saber (o documento diz no próprio campo)."""
    a = str(arg or "")
    if re.fullmatch(r"\d{4}-[1-4]", a):
        return a
    m = re.search(r"(20\d{2})(0[1-9]|1[0-2])\d{2}_km1", a)
    if m:
        return f"{m.group(1)}-{(int(m.group(2)) - 1) // 3 + 1}"
    return None


def shift_quarter(q, k):
    y, n = map(int, str(q).split("-"))
    t = y * 4 + (n - 1) - k
    return f"{t // 4}-{t % 4 + 1}"


def parse_doc(doc, quarter=None):
    """Devolve (layout, trimestre de referência, {trimestre: {campo: valor bruto}})."""
    if isinstance(doc, list):  # há emissor que embrulha o documento numa lista
        doc = next((d for d in doc if isinstance(d, dict)), {})
    if not isinstance(doc, dict):
        return "?", None, {}
    ref = doc.get("km1_trimestreReferencia") or quarter
    out = {}
    if any(isinstance(v, dict) for v in doc.values()):
        layout = "v2"
        for block in doc.values():
            if not isinstance(block, dict):
                continue
            for field, vals in block.items():
                if not re.fullmatch(r"km1_\w+", field) or not isinstance(vals, dict):
                    continue
                for k, v in vals.items():
                    m = re.fullmatch(r"t(?:_(\d))?", k)
                    num = _num(v)
                    if m and num is not None:
                        out.setdefault(shift_quarter(ref, int(m.group(1) or 0)), {})[field] = num
    else:
        layout = "v1"
        for field, v in doc.items():
            num = _num(v)
            if re.fullmatch(r"km1_\w+", field) and num is not None:
                out.setdefault(ref, {})[field] = num
    return layout, ref, out


def load_doc(body):
    """JSON do emissor: há quem publique em latin-1 e quem ponha caractere de controle nos comentários."""
    try:
        text = body.decode("utf-8")
    except UnicodeDecodeError:
        text = body.decode("latin-1")
    text = text.lstrip("\ufeff")
    try:
        return json.loads(text, strict=False)
    except ValueError:
        # quase-JSON (visto no Santander em 2021: ';' no lugar de ',' e vírgula decimal): lê os pares campo: valor
        pairs = re.findall(r'"(km1_\w+)"\s*:\s*"?(\d{4}-[1-4]|-?[\d.]+(?:,\d+)?)"?', text)
        if not pairs:
            raise
        doc = {}
        for k, v in pairs:
            if k == "km1_trimestreReferencia":
                doc[k] = v
            else:
                doc[k] = float(v.replace(".", "").replace(",", ".")) if "," in v else float(v)
        doc["_lenient"] = True
        return doc


def _num(v):
    if isinstance(v, (int, float)):
        return float(v)
    try:
        return float(str(v).replace(",", "."))
    except (TypeError, ValueError):
        return None


def ratio_factor(fields):
    """100 se os índices vêm em fração, 1 se em percentual; None se não dá para saber."""
    cet1, rwa, r5 = fields.get("km1_1"), fields.get("km1_4"), fields.get("km1_5")
    if cet1 and rwa and r5:
        q = cet1 / rwa
        return 100.0 if abs(r5 - q) < abs(r5 - 100 * q) else 1.0
    if r5:
        return 100.0 if abs(r5) <= 1.5 else 1.0
    return None


def amount_scale(fields, assets_brl):
    """Fator para levar os valores a R$ e o método usado ('ifdata' ou 'magnitude')."""
    expo = fields.get("km1_13") or fields.get("km1_4")
    if not expo or expo <= 0:
        return None, None
    if assets_brl and assets_brl > 0:
        best = min(SCALES, key=lambda s: abs(math.log10(expo * s / assets_brl)))
        return best, "ifdata"
    # sem IF.data (não deve acontecer para o cadastro): fator que põe a exposição mais perto de R$ 100 bi, a ordem de
    # grandeza de um banco que publica Pilar 3. É só um palpite e sai marcado como 'magnitude'.
    return min(SCALES, key=lambda s: abs(math.log10(expo * s) - 11)), "magnitude"


def normalize(fields, assets_brl, cfg):
    rf = ratio_factor(fields)
    sc, method = amount_scale(fields, assets_brl)
    out = {}
    for f, v in fields.items():
        if f in cfg["ratio_fields"]:
            out[f] = (v * rf if rf else None, "%", rf)
        elif f in cfg["amount_fields"]:
            out[f] = (v * sc if sc else None, "BRL", sc)
        else:
            out[f] = (v, "", None)
    return out, method


def collect(registry, refresh=False, log=log):
    cfg = config("pillar3")
    from .registry import dasfn_catalog
    catalog, catalog_url, catalog_at = dasfn_catalog(refresh=True)
    state_path = OUT / "state.json"
    state = read_json(state_path, {})
    con = db()
    rows = {}
    n_new = 0
    for inst in registry["institutions"]:
        p3 = inst.get("pillar3")
        if not p3:
            continue
        res = [r for r in catalog if r.get("Api") == "pilar3" and r["CnpjInstituicao"] == p3["cnpj14"]
               and r.get("Recurso", "").lower().startswith(f"/{cfg['table']}")
               and quarter_period(argument_quarter(r.get("Argumento")) or "2999-4") >= quarter_period(cfg["since_quarter"])]
        for r in sorted(res, key=lambda r: (argument_quarter(r.get("Argumento")) or "", r["Recurso"], r["URLDados"])):
            url = r["URLDados"]
            path = RAW / "pillar3" / p3["cnpj14"] / (re.sub(r"[^\w.-]+", "_", url.split("//", 1)[-1]) + ".gz")
            st = state.get(url, {})
            if not path.exists() and st.get("status") not in (None, 200) and not refresh:
                continue  # erro HTTP já registrado (404, 422...): só tenta de novo com --refresh
            try:
                # servidores de cada banco: prazo curto, para um servidor lento não travar a coleta inteira
                body, at, from_cache = cached(path, url, refresh=refresh and st.get("status") != 200, pause=1.0,
                                              timeout=40, retries=2)
                doc = load_doc(body)
                if not from_cache:
                    n_new += 1
                state[url] = {"status": 200, "fetched_at": at}
            except (RuntimeError, ValueError) as e:
                code = re.search(r"HTTP (\d+)", str(e))
                state[url] = {"status": int(code.group(1)) if code else -1, "error": str(e)[:200], "tried_at": now_iso()}
                log(f"[km1] {inst['id']} {r.get('Argumento')}: {str(e)[:120]}")
                continue
            if isinstance(doc, dict) and "errors" in doc:
                state[url] = {"status": 404, "error": json.dumps(doc["errors"])[:200], "tried_at": now_iso()}
                continue
            try:
                layout, ref, by_q = parse_doc(doc, argument_quarter(r.get("Argumento")))
            except (AttributeError, TypeError, ValueError) as e:  # leiaute inesperado: registra e segue
                log(f"[km1] {inst['id']} {r.get('Argumento')}: leiaute não reconhecido ({e})")
                continue
            if not ref:
                continue
            if quarter_period(ref) > last_closed_quarter():
                # ex.: Safra publicou em "2026-4" (antes de o trimestre acabar) os números de 2025-4
                log(f"[km1] {inst['id']}: documento diz trimestre {ref}, que ainda não terminou; ignorado ({url})")
                continue
            for q, fields in by_q.items():
                assets = _ifdata_assets(con, inst, quarter_period(q))
                norm, method = normalize(fields, assets, cfg)
                for f, (v, unit, factor) in norm.items():
                    key = (inst["id"], q, f)
                    prev = rows.get(key)
                    if prev and quarter_period(prev["reported_in"]) > quarter_period(ref):
                        continue
                    rows[key] = {"inst_id": inst["id"], "cnpj14": p3["cnpj14"], "quarter": q,
                                 "period": quarter_period(q), "field": f, "label": cfg["labels"].get(f, ""),
                                 "value": "" if v is None else round(v, 6), "unit": unit, "raw_value": fields[f],
                                 "factor": factor or "", "scale_method": method or "", "layout": layout,
                                 "reported_in": ref, "source_url": url, "fetched_at": state[url]["fetched_at"]}
    con.close()
    write_json(state_path, state)
    out = sorted(rows.values(), key=lambda r: (r["inst_id"], r["period"], r["field"]))
    OUT.mkdir(parents=True, exist_ok=True)
    with open(OUT / "km1.csv", "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=list(out[0].keys()) if out else ["inst_id"])
        w.writeheader()
        w.writerows(out)
    write_json(OUT / "catalog_provenance.json", {"url": catalog_url, "fetched_at": catalog_at})
    log(f"[km1] {n_new} documento(s) novo(s); {len(out)} linhas em data/ifs/pillar3/km1.csv")
    return n_new


def _ifdata_assets(con, inst, period):
    """Ativo total prudencial do IF.data (R$) da instituição na data-base, para checar a unidade do KM1."""
    code = inst["ifdata"].get("prudential_entity")
    cfg = config("ifdata")
    level = ifdata.series_level(cfg, "prudencial", period)
    if not code or not level:
        return None
    row = con.execute("SELECT value FROM ifdata_values WHERE period=? AND level=? AND code=? AND metric='ativo_total'",
                      (period, level, code)).fetchone()
    if row:
        return row[0]
    # data-base sem IF.data ainda: usa a mais recente disponível (a ordem de grandeza basta para a unidade)
    row = con.execute("SELECT value FROM ifdata_values WHERE level IN (1004,1009) AND code=? AND metric='ativo_total' "
                      "ORDER BY period DESC LIMIT 1", (code,)).fetchone()
    return row[0] if row else None
