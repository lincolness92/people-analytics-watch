"""IF.data (BCB) pelos arquivos JSON públicos do site www3.bcb.gov.br/ifdata.

Como o site organiza os dados (verificado em 28/11/2026):
- dois índices: `rest/relatorios` (2000-03 a 2024-12, pasta `ifdata/AAAAMM/`) e `rest/relatorios2025a2030`
  (2025-03 em diante, pasta `ifdata_2025_2030/AAAAMM/`). Cada data-base lista os arquivos e os relatórios (`trel`),
  com as colunas (`c`, aninhadas em `sc`) e a data de geração (`ge`).
- `info<AAAAMM>.json`: o dicionário dos campos. A coluna do relatório aponta para `info.id` (campo `ifd`); o valor
  fica em `dados_<a>.json` sob a chave `info.lid` (campo `i`), onde `a` é o grupo do campo (1 contábil, 3 crédito,
  5 capital...).
- `cadastro<AAAAMM>_<nível>.json`: as entidades de cada nível (1004/1009 prudencial, 1005 financeiro, 1006 individual),
  com as chaves `c<lid>` (c0 código, c2 nome, c3 TCB, c6 TC, c12 segmento, c14 conglomerado financeiro,
  c15 conglomerado prudencial, ...).
- `dados<AAAAMM>_<a>.json`: `{"values": [{"e": código da entidade, "v": [{"i": lid, "v": valor}]}]}`, valores em R$.

Códigos das entidades: individual = CNPJ-base; financeiro = número do conglomerado (C0049906 → 49906) ou o CNPJ-base
da independente; prudencial = 1.000.000.000 + número (C0080329 → 1000080329) ou o CNPJ-base (cooperativas).
"""

import json
import re

from . import RAW, cached, config, db, log, now_iso

LEVEL_FILE_ORDER = (1009, 1004, 1005, 1006)


# ---------- índice ----------

def load_index(refresh=False, cfg=None):
    """Lista de datas-base: [{dt, folder, files: [nome], trels: [trel], generated}] em ordem crescente."""
    cfg = cfg or config("ifdata")
    out = {}
    for name in cfg["index_files"]:
        url = f"{cfg['base_url']}/{name}"
        # o índice antigo (até 2024-12) quase não muda: só é baixado de novo com --refresh ou se tiver mais de 30 dias
        stale = refresh or name != "relatorios"
        path = RAW / "ifdata" / f"index_{name}.json.gz"
        if not stale and path.exists():
            meta = json.loads(path.with_name(path.name + ".meta.json").read_text())
            stale = meta.get("fetched_at", "")[:10] < _days_ago(30)
        body, fetched_at, _ = cached(path, url, refresh=stale)
        for p in json.loads(body):
            out[p["dt"]] = parse_index_entry(p, url, fetched_at)
    return [out[k] for k in sorted(out)]


def _days_ago(n):
    from datetime import date, timedelta
    return (date.today() - timedelta(days=n)).isoformat()


def parse_index_entry(p, index_url="", fetched_at=""):
    files, trels, folder = [], [], None
    for f in p["files"]:
        path = f["f"].replace("//", "/")
        parts = path.split("/")
        if len(parts) == 3:
            folder = parts[0]
        files.append(parts[-1])
        if f.get("trel"):
            trels.append(f["trel"])
    gens = sorted({t.get("ge", "") for t in trels if t.get("ge")})
    return {"dt": p["dt"], "folder": folder or "ifdata", "files": files, "trels": trels,
            "generated": ",".join(gens), "index_url": index_url, "index_fetched_at": fetched_at}


def file_url(cfg, entry, name):
    return f"{cfg['base_url']}/arquivos?nomeArquivo={entry['folder']}/{entry['dt']}/{name}"


def get_file(cfg, entry, name, refresh=False, con=None):
    url = file_url(cfg, entry, name)
    body, fetched_at, from_cache = cached(RAW / "ifdata" / str(entry["dt"]) / f"{name}.gz", url, refresh=refresh)
    if body[:1] not in (b"{", b"["):
        raise RuntimeError(f"IF.data devolveu algo que não é JSON para {name}: {body[:60]!r}")
    if con is not None and not from_cache:
        con.execute("INSERT OR REPLACE INTO ifdata_files VALUES (?,?,?,?,?)",
                    (entry["dt"], name, url, fetched_at, entry["generated"]))
    return json.loads(body)


# ---------- relatórios e métricas ----------

def walk_columns(cols, info, prefix=()):
    """Achata as colunas de um relatório: [(caminho 'A > B > C', lid, grupo a, td)] só das folhas com valor.
    td = 1 marca campo de cadastro (ex.: número de agências), lido de `c<lid>` no cadastro e não dos dados."""
    for c in cols:
        inf = info.get(c["ifd"], {})
        name = re.sub(r"\s+", " ", (inf.get("n") or "").replace("\n", " ")).strip()
        name = re.sub(r" \(", "  (", name)  # o site usa dois espaços antes de "(a)"; normaliza para casar sempre igual
        path = prefix + (name,)
        if c.get("sc"):
            yield from walk_columns(c["sc"], info, path)
        elif inf.get("lid", -1) >= 0 and inf.get("ty") == 1:
            yield " > ".join(path), inf["lid"], inf.get("a"), inf.get("td")


def resolve_metrics(entry, info_list, metrics, levels):
    """Para cada nível e métrica, acha (lid, a, relatório, coluna) nesta data-base. Devolve {nível: {métrica: ...}}."""
    info = {x["id"]: x for x in info_list}
    out = {}
    for level in levels:
        trels = [t for t in entry["trels"] if level in [s["id"] for s in t.get("s", [])]]
        found = {}
        for m in metrics:
            rep, col = re.compile(m["report"]), re.compile(m["column"])
            for t in trels:
                if not rep.search(t["n"].strip()):
                    continue
                hit = next((h for h in walk_columns(t["c"], info) if col.search(h[0])), None)
                if hit:
                    found[m["id"]] = {"lid": hit[1], "a": hit[2], "td": hit[3], "report": t["n"].strip(),
                                      "report_id": t["id"], "column": hit[0]}
                    break
        out[level] = found
    return out


def to_int_code(s):
    s = str(s or "").strip().upper().lstrip("C")
    return int(s) if s.isdigit() else None


def entity_rows(level, cadastro):
    """Linhas de ifdata_entities a partir do cadastro de um nível."""
    rows = []
    for c in cadastro:
        code = to_int_code(c.get("c0")) or 0
        rows.append((level, code, (c.get("c2") or "").strip(), c.get("c3", ""), c.get("c4", ""), c.get("c6", ""),
                     c.get("c13", ""), (c.get("c12") or c.get("c32") or "").strip(), c.get("c10", ""),
                     c.get("c11", ""), to_int_code(c.get("c14")), to_int_code(c.get("c15"))))
    return rows


def _number(v):
    if isinstance(v, (int, float)):
        return float(v)
    try:
        return float(str(v).replace(",", "."))
    except (TypeError, ValueError):
        return None


def extract_values(dados_by_a, cadastros, resolved, value_levels):
    """Valores (nível, código, métrica, valor) das entidades de cada nível; zeros e não numéricos ficam fora.
    `cadastros` = {nível: [linha do cadastro]}; campos de cadastro (td = 1) saem de lá, o resto de `dados_<a>`."""
    index = {}
    for a, dados in dados_by_a.items():
        for r in dados.get("values", []):
            index[(a, r["e"])] = {x["i"]: x["v"] for x in r["v"]}
    out = []
    for level, cad in cadastros.items():
        wanted = value_levels.get(str(level))
        if not wanted:
            continue
        rows = [(to_int_code(c.get("c0")) or 0, c) for c in cad]
        for mid, spec in resolved.get(level, {}).items():
            if wanted != "all" and mid not in wanted:
                continue
            for code, c in rows:
                if spec.get("td") == 1:
                    v = _number(c.get(f"c{spec['lid']}"))
                else:
                    v = _number(index.get((spec["a"], code), {}).get(spec["lid"]))
                if v:
                    out.append((level, code, mid, v))
    return out


def add_derived(values, derived):
    """Soma as métricas derivadas (ex.: rural PF + PJ) por (nível, código)."""
    acc = {}
    for level, code, mid, v in values:
        acc.setdefault((level, code), {})[mid] = v
    out = []
    for d in derived:
        for (level, code), ms in acc.items():
            parts = [ms[x] for x in d["sum"] if x in ms]
            if parts:
                out.append((level, code, d["id"], float(sum(parts))))
    return out


def cosif_regime(period, cfg=None):
    """'cosif2025' a partir da data da quebra (03/2025), senão 'cosif_antigo'. A série não é emendada em silêncio."""
    brk = int(str((cfg or config("ifdata"))["cosif_break"]).replace("-", ""))
    return "cosif2025" if int(period) >= brk else "cosif_antigo"


# ---------- coleta ----------

def collect(since=None, refresh=False, only=None, reparse=False, log=log):
    """Baixa e extrai as datas-base novas ou regeradas. refresh: baixa de novo; reparse: reextrai do cache local."""
    cfg = config("ifdata")
    from . import parse_since
    start = parse_since(since, cfg["since"].replace("-", ""))
    index = load_index(refresh=refresh, cfg=cfg)
    con = db()
    done = {p: g for p, g in con.execute("SELECT period, generated FROM ifdata_periods")}
    metrics = cfg["metrics"]
    todo = [e for e in index if e["dt"] >= start and (only is None or e["dt"] in only)]
    log(f"[ifdata] {len(todo)} datas-base desde {start} (índice vai até {index[-1]['dt']})")
    n_new = 0
    for entry in todo:
        regen = done.get(entry["dt"]) not in (None, entry["generated"])
        if entry["dt"] in done and not regen and not refresh and not reparse:
            continue
        if regen:
            log(f"[ifdata] {entry['dt']}: o BCB regerou os relatórios ({done[entry['dt']]} → {entry['generated']}); baixando de novo")
        extract_period(cfg, entry, metrics, con, refresh=refresh or regen, log=log)
        n_new += 1
    con.close()
    log(f"[ifdata] {n_new} data(s)-base nova(s) ou regerada(s)")
    return n_new


def extract_period(cfg, entry, metrics, con, refresh=False, log=log):
    dt = entry["dt"]
    levels = [lv for lv in LEVEL_FILE_ORDER if f"cadastro{dt}_{lv}.json" in entry["files"]]
    info = get_file(cfg, entry, f"info{dt}.json", refresh, con)
    resolved = resolve_metrics(entry, info, metrics, levels)
    cadastros = {lv: get_file(cfg, entry, f"cadastro{dt}_{lv}.json", refresh, con) for lv in levels}
    groups = sorted({spec["a"] for lv in resolved.values() for spec in lv.values() if spec.get("td") != 1})
    dados = {}
    for a in groups:
        name = f"dados{dt}_{a}.json"
        if name in entry["files"]:
            dados[a] = get_file(cfg, entry, name, refresh, con)
    values = extract_values(dados, cadastros, resolved, cfg["value_levels"])
    values += add_derived(values, cfg.get("derived", []))
    con.execute("DELETE FROM ifdata_values WHERE period=?", (dt,))
    con.execute("DELETE FROM ifdata_entities WHERE period=?", (dt,))
    con.executemany("INSERT OR REPLACE INTO ifdata_entities VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
                    [(dt,) + r for lv, cad in cadastros.items() for r in entity_rows(lv, cad)])
    con.executemany("INSERT OR REPLACE INTO ifdata_values VALUES (?,?,?,?,?)", [(dt,) + v for v in values])
    found = {str(lv): {m: {"report": s["report"], "column": s["column"], "lid": s["lid"]} for m, s in r.items()}
             for lv, r in resolved.items()}
    con.execute("INSERT OR REPLACE INTO ifdata_periods VALUES (?,?,?,?)",
                (dt, entry["generated"], now_iso(), json.dumps(found, ensure_ascii=False)))
    con.commit()
    missing = {lv: [m["id"] for m in metrics if m["id"] not in r and _expected(m, lv, dt, cfg)]
               for lv, r in resolved.items()}
    missing = {k: v for k, v in missing.items() if v}
    log(f"[ifdata] {dt}: {len(values)} valores, níveis {levels}" + (f"; sem: {missing}" if missing else ""))


def _expected(metric, level, period, cfg):
    """Uma métrica só é 'faltante' se a série dela lê este nível nesta data-base."""
    return series_level(cfg, metric["series"], period) == level


def series_level(cfg, series, period):
    """Nível do IF.data que a série usa nesta data-base (ou None)."""
    for c in cfg["series"][series]["chain"]:
        if c["from"] <= int(period) <= c["to"]:
            return c["level"]
    return None


def periods(con):
    return [p for (p,) in con.execute("SELECT period FROM ifdata_periods ORDER BY period")]


def provenance(con, period):
    rows = con.execute("SELECT file, url, fetched_at, generated FROM ifdata_files WHERE period=? ORDER BY file",
                       (period,)).fetchall()
    return [{"file": f, "url": u, "fetched_at": a, "generated": g} for f, u, a, g in rows]
