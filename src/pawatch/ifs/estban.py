"""ESTBAN por município (BCB, documento 4500): saldos mensais por banco (CNPJ-base) e município, em R$.

Os arquivos saem em lotes trimestrais (Comunicado 44.132/2025), com 2 a 5 meses de defasagem. O nome do arquivo mudou
ao longo dos anos (`AAAAMM_ESTBAN.ZIP` até ~2022, `AAAAMM_ESTBAN.csv.zip` depois); o coletor tenta os padrões de
config/ifs/estban.json. A coluna de cada verbete é achada pelo código no cabeçalho (`VERBETE_160_...`); colunas
compostas (`VERBETE_401_... + VERBETE_402_...`) valem pelo primeiro código.

A base local guarda o agregado por banco × UF × mês (estban_uf). O detalhe por município fica no ZIP do cache
(data/ifs/raw/estban/), lido de novo quando a análise precisa (ex.: o mês mais recente em shares).
"""

import csv
import io
import re
import zipfile

from . import IFS, RAW, add_months, cached, config, db, log, now_iso, parse_since, read_json, write_json

OUT = IFS / "estban"


def parse(body):
    """ZIP do ESTBAN → (data de geração, códigos de verbete do leiaute, linhas)."""
    z = zipfile.ZipFile(io.BytesIO(body))
    text = z.read(z.namelist()[0]).decode("latin-1")
    lines = text.splitlines()
    hdr_i = next(i for i, l in enumerate(lines[:20]) if "CNPJ" in l and "UF" in l)
    gen = next((re.search(r"(\d{4}-\d{2}-\d{2})", l).group(1) for l in lines[:hdr_i] if re.search(r"\d{4}-\d{2}-\d{2}", l)), "")
    header = [h.strip().lstrip("#") for h in lines[hdr_i].split(";")]
    col = {h: i for i, h in enumerate(header)}
    verb = {}
    for i, h in enumerate(header):
        m = re.match(r"VERBETE_(\d{3})", h)
        if m and m.group(1) not in verb:
            verb[m.group(1)] = i
    rows = []
    for rec in csv.reader(lines[hdr_i + 1:], delimiter=";"):
        if len(rec) < len(header) - 1:
            continue
        vals = {}
        for code, i in verb.items():
            v = rec[i].strip() if i < len(rec) else ""
            if v:
                try:
                    vals[code] = float(v.replace(",", "."))
                except ValueError:
                    pass
        rows.append({"month": int(rec[col["DATA_BASE"]]), "uf": rec[col["UF"]].strip(),
                     "codmun": rec[col["CODMUN"]].strip(), "municipio": rec[col["MUNICIPIO"]].strip(),
                     "codmun_ibge": rec[col["CODMUN_IBGE"]].strip() if "CODMUN_IBGE" in col else "",
                     "cnpj8": rec[col["CNPJ"]].strip().zfill(8), "name": rec[col["NOME_INSTITUICAO"]].strip(),
                     "values": vals})
    return gen, sorted(verb), rows


def metric_values(vals, metrics):
    """Soma, por métrica, os verbetes presentes na linha (o que não existe no leiaute do mês não entra)."""
    out = {}
    for mid, m in metrics.items():
        parts = [vals[c] for c in m["verbetes"] if c in vals]
        if parts:
            out[mid] = sum(parts)
    return out


def aggregate_uf(rows, metrics):
    acc = {}
    for r in rows:
        for mid, v in metric_values(r["values"], metrics).items():
            k = (r["cnpj8"], r["uf"], mid)
            a = acc.setdefault(k, [0.0, 0])
            a[0] += v
            a[1] += 1
    return acc


def month_url(cfg, month, pattern):
    return f"{cfg['base_url']}/{pattern.format(m=month)}"


def fetch_month(cfg, month, refresh=False):
    """(bytes, url, fetched_at) do mês, tentando os padrões de nome; None se nenhum existir (ainda)."""
    path = RAW / "estban" / f"{month}.zip.gz"
    meta = path.with_name(path.name + ".meta.json")
    if path.exists() and not refresh:
        body, at, _ = cached(path, "", refresh=False)
        return body, read_json(meta, {}).get("url", ""), at
    for pat in cfg["name_patterns"]:
        url = month_url(cfg, month, pat)
        try:
            body, at, _ = cached(path, url, refresh=True, pause=1.0)
        except RuntimeError as e:
            if "HTTP 404" in str(e) or "HTTP 403" in str(e):
                continue
            raise
        if body[:2] == b"PK":
            return body, url, at
        path.unlink(missing_ok=True)
    return None


def collect(since=None, refresh=False, until=None, reparse=False, log=log):
    from datetime import date
    cfg = config("estban")
    start = parse_since(since, cfg["since"].replace("-", ""))
    today = date.today()
    end = until or add_months(today.year * 100 + today.month, -1)
    con = db()
    have = {m for (m,) in con.execute("SELECT month FROM estban_files")}
    state_path = OUT / "state.json"
    state = read_json(state_path, {"missing": {}})
    recent = add_months(end, -cfg["retry_missing_months"])
    m, n_new = start, 0
    if reparse:  # relê, em ordem, os meses do cache (a correção de cada mês depende do anterior)
        for month in sorted(have):
            if month >= start:
                body, _, _ = cached(RAW / "estban" / f"{month}.zip.gz", "", refresh=False)
                url, at = con.execute("SELECT url, fetched_at FROM estban_files WHERE month=?", (month,)).fetchone()
                load_month(con, cfg, month, body, url, at)
    while m <= end:
        if (m in have and not refresh) or (str(m) in state["missing"] and m < recent and not refresh):
            m = add_months(m, 1)
            continue
        got = fetch_month(cfg, m, refresh=refresh)
        if not got:
            state["missing"][str(m)] = now_iso()
            m = add_months(m, 1)
            continue
        body, url, at = got
        load_month(con, cfg, m, body, url, at)
        state["missing"].pop(str(m), None)
        n_new += 1
        m = add_months(m, 1)
    write_json(state_path, state)
    export(con)
    last = con.execute("SELECT MAX(month) FROM estban_files").fetchone()[0]
    con.close()
    log(f"[estban] {n_new} mês(es) novo(s); último disponível: {last}; ainda não publicados: "
        f"{sorted(k for k in state['missing'] if int(k) >= recent)}")
    return n_new


def export(con):
    """Proveniência versionada: data/ifs/estban/files.csv (URL e datas de cada mês) e fixes.csv (linhas corrigidas)."""
    OUT.mkdir(parents=True, exist_ok=True)
    for name, sql, cols in (
            ("files.csv", "SELECT month, url, fetched_at, generated, rows FROM estban_files ORDER BY month",
             ["month", "url", "fetched_at", "generated", "rows"]),
            ("fixes.csv", "SELECT month, cnpj8, uf, codmun, metric, raw, corrected, bank_total_raw, prev_bank_total "
                          "FROM estban_fixes ORDER BY month, cnpj8, metric",
             ["month", "cnpj8", "uf", "codmun", "metric", "raw", "corrected", "bank_total_raw", "prev_bank_total"])):
        with open(OUT / name, "w", newline="", encoding="utf-8") as fh:
            w = csv.writer(fh)
            w.writerow(cols)
            w.writerows(con.execute(sql))


def find_total_rows(rows, prev_uf, metrics, min_rows=2, regime_min=20):
    """Linhas que trazem, somado, o total nacional do banco (visto no ESTBAN: Itaú/DF em 2025-09 e 2026-01 a 03;
    quase todos os bancos na linha de Brasília desde 2026-04). Assinatura: numa UF, valor publicado u = real + total,
    e total = real + resto do país; logo real = (u − resto)/2. A linha é corrigida quando a UF salta mais da metade do
    total do banco no mês anterior e esse `real` fica perto do valor da UF no mês anterior. Concentração legítima na
    sede (ex.: Bradesco em Osasco) não casa, porque o `real` calculado fica longe do mês anterior.
    prev_uf = {(cnpj8, uf, métrica): valor do mês anterior (já corrigido)}. Devolve [(i_linha, métrica, bruto,
    corrigido, soma publicada, total anterior)]."""
    by_bank = {}
    for i, r in enumerate(rows):
        by_bank.setdefault(r["cnpj8"], []).append(i)
    prev_total = {}
    for (c8, uf, mid), v in prev_uf.items():
        prev_total[(c8, mid)] = prev_total.get((c8, mid), 0.0) + v
    fixes = []
    for c8, idx in by_bank.items():
        if len(idx) < min_rows:  # uma linha só: não há como separar o total do real
            continue
        for mid, m in metrics.items():
            s_prev = prev_total.get((c8, mid), 0.0)
            if s_prev <= 0:
                continue
            vals = {i: metric_values(rows[i]["values"], {mid: m}).get(mid, 0.0) for i in idx}
            s_raw = sum(vals.values())
            ufs = {}
            for i in idx:
                ufs[rows[i]["uf"]] = ufs.get(rows[i]["uf"], 0.0) + vals[i]
            for uf, u in ufs.items():
                p_uf = prev_uf.get((c8, uf, mid), 0.0)
                if u - p_uf <= 0.5 * s_prev:
                    continue
                real = (u - (s_raw - u)) / 2
                # o total publicado do banco dobra, e o resto do país tem peso (senão "metade" seria só um palpite)
                doubled = abs(s_raw - 2 * s_prev) <= 0.5 * s_prev and (s_raw - u) >= 0.25 * s_raw
                if doubled and real >= -0.01 * s_prev and abs(real - p_uf) <= 0.25 * p_uf + 0.02 * s_prev:
                    i = max((i for i in idx if rows[i]["uf"] == uf), key=lambda i: vals[i])
                    fixes.append((i, mid, vals[i], vals[i] - (u - max(real, 0.0)), s_raw, s_prev))
                    break
    # 2º passo: num mês em que muitos bancos têm o total embutido no mesmo município (Brasília em 2026), o banco cuja
    # única linha relevante é esse município (ex.: Banco Sicoob, sede em Brasília) e cujo total dobrou também é corrigido
    places = {}
    for i, *_ in fixes:
        places[rows[i]["codmun"]] = places.get(rows[i]["codmun"], 0) + 1
    hot = [c for c, n in places.items() if n >= regime_min]
    done = {(rows[i]["cnpj8"], mid) for i, mid, *_ in fixes}
    for c8, idx in by_bank.items():
        for mid, m in metrics.items():
            s_prev = prev_total.get((c8, mid), 0.0)
            if (c8, mid) in done or s_prev <= 0:
                continue
            vals = {i: metric_values(rows[i]["values"], {mid: m}).get(mid, 0.0) for i in idx}
            s_raw = sum(vals.values())
            cand = [i for i in idx if rows[i]["codmun"] in hot and vals[i] >= s_raw / 2]
            if cand and 1.8 <= s_raw / s_prev <= 2.2:
                fixes.append((cand[0], mid, vals[cand[0]], vals[cand[0]] - s_raw / 2, s_raw, s_prev))
    return fixes


def load_month(con, cfg, month, body, url, at):
    gen, layout, rows = parse(body)
    prev = con.execute("SELECT MAX(month) FROM estban_uf WHERE month < ?", (month,)).fetchone()[0]
    prev_uf = {(c8, uf, mid): v for c8, uf, mid, v in
               con.execute("SELECT cnpj8, uf, metric, value FROM estban_uf WHERE month=?", (prev,))} if prev else {}
    fixes = find_total_rows(rows, prev_uf, cfg["metrics"])
    acc = aggregate_uf(rows, cfg["metrics"])
    con.execute("DELETE FROM estban_fixes WHERE month=?", (month,))
    for i, mid, raw, corrected, s_raw, s_prev in fixes:
        r = rows[i]
        acc[(r["cnpj8"], r["uf"], mid)][0] += corrected - raw
        con.execute("INSERT OR REPLACE INTO estban_fixes VALUES (?,?,?,?,?,?,?,?,?)",
                    (month, r["cnpj8"], r["uf"], r["codmun"], mid, raw, corrected, s_raw, s_prev))
    if fixes:
        log(f"[estban] {month}: {len(fixes)} linha(s) com o total do banco embutido, corrigidas "
            f"({sorted({rows[i]['cnpj8'] for i, *_ in fixes})[:8]}...)")
    con.execute("DELETE FROM estban_uf WHERE month=?", (month,))
    con.executemany("INSERT INTO estban_uf VALUES (?,?,?,?,?,?)",
                    [(month, c8, uf, mid, v, n) for (c8, uf, mid), (v, n) in acc.items()])
    names = {r["cnpj8"]: r["name"] for r in rows}
    con.executemany("INSERT INTO estban_names VALUES (?,?,?) ON CONFLICT(cnpj8) DO UPDATE SET "
                    "name=excluded.name, last_month=excluded.last_month WHERE excluded.last_month >= estban_names.last_month",
                    [(c8, n, month) for c8, n in names.items()])
    con.execute("INSERT OR REPLACE INTO estban_files VALUES (?,?,?,?,?,?)",
                (month, url, at, gen, ",".join(layout), len(rows)))
    con.commit()
    log(f"[estban] {month}: {len(rows)} linhas banco × município, {len(names)} bancos (gerado em {gen})")


def municipal_rows(month, con=None):
    """Linhas por município de um mês já baixado (relê o ZIP do cache). Com `con`, aplica as correções de
    estban_fixes: a métrica corrigida vai em r['fixed'][métrica]."""
    path = RAW / "estban" / f"{month}.zip.gz"
    if not path.exists():
        return []
    body, _, _ = cached(path, "", refresh=False)
    rows = parse(body)[2]
    if con is not None:
        fx = {(c8, cm, mid): v for c8, cm, mid, v in
              con.execute("SELECT cnpj8, codmun, metric, corrected FROM estban_fixes WHERE month=?", (month,))}
        for r in rows:
            r["fixed"] = {mid: v for (c8, cm, mid), v in fx.items() if c8 == r["cnpj8"] and cm == r["codmun"]}
    return rows
