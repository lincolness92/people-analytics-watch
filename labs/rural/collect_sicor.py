"""SICOR (BCB): microdados do crédito rural, com o saldo mensal e a situação de cada operação, por instituição.

Fonte: "Matriz de Dados do Crédito Rural", microdados em https://www.bcb.gov.br/htms/sicor/DadosBrutos/ (página
https://www.bcb.gov.br/estabilidadefinanceira/tabelas-credito-rural-proagro; dicionário em
https://www.bcb.gov.br/htms/sicor/manualDadosSicorCompleto.pdf). Arquivos usados:

- SICOR_OPERACAO_BASICA_ESTADO_{ANO}.gz: uma linha por operação (REF_BACEN + NU_ORDEM): CNPJ da IF (CNPJ_IF), UF,
  categoria do emitente (pequeno/médio/grande produtor), programa, fonte de recursos, empreendimento (finalidade,
  atividade e produto), datas e valor. O ano é o da contratação.
- SICOR_SALDOS_{ANO}.gz (2013 e 2014 em semestres): saldo do último dia de cada mês e situação da operação
  (1 curso normal, 2 em atraso, 3 prorrogada, 4–6 renegociada, 7 liquidada, 9 baixada como prejuízo, 11 dívida
  ativa, 12 inadimplente...). O arquivo de um ano traz os saldos, em todos os meses até hoje, das operações
  contratadas naquele ano.
- SICOR_COMPLEMENTO_OPERACAO_BASICA.gz: município (código IBGE) e agência de cada operação.
- tabelas de domínio (Empreendimento, Programa, FonteRecursos, CategoriaEmitente, SituacaoOperacao) e a lista de IFs.

A API OData do SICOR (olinda.../SICOR/versao/v2) tem os fluxos de contratação agregados; o recurso por IF e UF
(SegmentoIFRegiaoUF) dá 500 ou 504 com qualquer $filter além de Cnpj e $top pequeno (teste de 28/11/2026). Por isso
este coletor usa os microdados.

Uso:
  python3 labs/rural/collect_sicor.py download           # ~13 GB, sequencial, incremental pelo tamanho
  python3 labs/rural/collect_sicor.py process [--jobs 3] [--target-months 2023-12,2026-09]
Saídas: ver process() e labs/rural/README.md.
"""

import argparse
import csv
import gzip
import json
import os
import sys
from collections import defaultdict
from datetime import date
from multiprocessing import Pool
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import DATA, RAW, download, log, now_iso  # noqa: E402

BASE = "https://www.bcb.gov.br/htms/sicor"
DOMAINS = ["Empreendimento", "Programa", "FonteRecursos", "CategoriaEmitente", "SituacaoOperacao"]
SDIR = RAW / "sicor"
TMP = SDIR / "_work"


def saldo_files(last_year):
    out = [("SICOR_SALDOS_2013_01", 2013), ("SICOR_SALDOS_2013_02", 2013),
           ("SICOR_SALDOS_2014_01", 2014), ("SICOR_SALDOS_2014_02", 2014)]
    out += [(f"SICOR_SALDOS_{y}", y) for y in range(2015, last_year + 1)]
    return out


def cmd_download(a):
    last = date.today().year
    for d in DOMAINS:
        download(f"{BASE}/{d}.csv", SDIR / "dom" / f"{d}.csv")
    download(f"{BASE}/DadosBrutos/SICOR_LISTA_IFS.csv", SDIR / "dom" / "SICOR_LISTA_IFS.csv")
    names = [f"SICOR_OPERACAO_BASICA_ESTADO_{y}" for y in range(2013, last + 1)]
    names += [n for n, _ in saldo_files(last)] + ["SICOR_COMPLEMENTO_OPERACAO_BASICA"]
    for n in names:
        log(f"[sicor] {n}")
        m = download(f"{BASE}/DadosBrutos/{n}.gz", SDIR / f"{n}.gz")
        if m is None:
            log(f"[sicor] {n}: 404")


# ---------- dicionários ----------

def _read_dom(name, sep=";"):
    rows = []
    with open(SDIR / "dom" / f"{name}.csv", encoding="latin-1") as f:
        for line in f:
            if line.startswith("#"):
                head = line[1:].strip().split(sep)
                continue
            p = [x.strip().strip('"') for x in line.rstrip("\n").split(sep)]
            rows.append(dict(zip(head, p)))
    return rows


PRODUTOS = [("SOJA", "soja"), ("MILHO", "milho"), ("CAFÉ", "cafe"), ("CANA", "cana"), ("ALGOD", "algodao"),
            ("ARROZ", "arroz"), ("TRIGO", "trigo")]


def load_domains():
    emp = {}
    for r in _read_dom("Empreendimento"):
        prod = (r.get("PRODUTO") or "").upper()
        ativ = (r.get("ATIVIDADE") or "")
        g = next((v for k, v in PRODUTOS if prod.startswith(k)), None)
        if g is None:
            g = "bovinos" if "BOVINO" in prod else ("outros_pecuaria" if ativ.startswith("Pecu") else "outros_agricola")
        emp[r["CODIGO"]] = ((r.get("FINALIDADE") or "?")[:14], "pecuaria" if ativ.startswith("Pecu") else "agricola", g)
    fonte = {}
    for r in _read_dom("FonteRecursos"):
        d = (r.get("DESCRICAO") or "").upper()
        fonte[r["CODIGO"]] = "nao_controlada" if "NÃO CONTROLADA" in d or "NAO CONTROLADA" in d else "controlada"
    return emp, fonte


def coop_systems():
    """CNPJ-base de cooperativa → sistema (sicredi, sicoob, cresol, outra) pelo nome no cadastro individual do IF.data
    (data/ifs/ifs.sqlite, só leitura) e pela lista de IFs do SICOR."""
    import re
    import sqlite3
    names = {}
    db = DATA.parent / "ifs" / "ifs.sqlite"
    if db.exists():
        con = sqlite3.connect(f"file:{db}?mode=ro", uri=True)
        for code, name in con.execute("SELECT code, name FROM ifdata_entities WHERE level=1006 ORDER BY period"):
            names[str(code).zfill(8)] = name or ""
        con.close()
    seg = {}
    for r in _read_dom("SICOR_LISTA_IFS"):
        c = r.get("CNPJ_IF", "").zfill(8)
        seg[c] = r.get("SEGMENTO_IF", "")
        names.setdefault(c, r.get("NOME_IF", ""))
    out = {}
    for c, n in names.items():
        if re.search(r"SICREDI", n, re.I):
            out[c] = "sicredi"
        elif re.search(r"SICOOB|BANCOOB", n, re.I):
            out[c] = "sicoob"
        elif re.search(r"CRESOL", n, re.I):
            out[c] = "cresol"
    return out, seg


BANKS = {"00000000": "bb", "00360305": "caixa", "07237373": "bnb", "04902979": "basa", "60746948": "bradesco",
         "90400888": "santander", "60701190": "itau", "17298092": "itau", "01023570": "rabobank",
         "92702067": "banrisul", "33657248": "bndes"}
CADASTRANTE_SYS = {"01181521": "sicredi", "02038232": "sicoob"}


def inst_group(cnpj, cadastrante, systems, seg):
    if cnpj in BANKS:
        return BANKS[cnpj]
    if cnpj in ("01181521",):
        return "sicredi"
    if cnpj in ("02038232",):
        return "sicoob"
    s = seg.get(cnpj, "")
    if "COOPERATIVA" in s or cnpj in systems:
        return "coop_" + (systems.get(cnpj) or CADASTRANTE_SYS.get(cadastrante) or "outras")
    if "DESENVOLVIMENTO" in s:
        return "desenvolvimento"
    if "PRIVADO" in s or "SOCIEDADE" in s:
        return "outros_privados"
    if "PÚBLICO" in s:
        return "outros_publicos"
    return "outros"


CATEG = {"2222": "pequeno", "3333": "medio", "4444": "grande", "7777": "repasse_coop", "8888": "repasse_coop"}
STATUS = {"1": "normal", "2": "atraso", "3": "prorrogada", "4": "renegociada", "5": "renegociada", "6": "renegociada",
          "7": "liquidada", "8": "desclassificada", "9": "prejuizo", "10": "excluida", "11": "divida_ativa",
          "12": "inadimplente", "13": "desclassificada"}


def prog_group(c):
    return {"0001": "pronaf", "0050": "pronamp", "0999": "sem_programa"}.get(c, "outros_programas")


# ---------- processamento por safra de contratação ----------

def _ops(year, emp, fonte, systems, seg):
    ops = {}
    path = SDIR / f"SICOR_OPERACAO_BASICA_ESTADO_{year}.gz"
    with gzip.open(path, "rt", encoding="latin-1") as f:
        h = f.readline().lstrip("#").rstrip("\n").split(";")
        ix = {k: h.index(k) for k in ("REF_BACEN", "NU_ORDEM", "CNPJ_IF", "CD_ESTADO", "CD_CATEG_EMITENTE",
                                      "CD_FONTE_RECURSO", "CD_PROGRAMA", "CD_EMPREENDIMENTO", "CD_CNPJ_CADASTRANTE")}
        for line in f:
            p = line.rstrip("\n").split(";")
            e = emp.get(p[ix["CD_EMPREENDIMENTO"]], ("?", "?", "?"))
            ops[(p[ix["REF_BACEN"]], p[ix["NU_ORDEM"]])] = (
                inst_group(p[ix["CNPJ_IF"]].zfill(8), p[ix["CD_CNPJ_CADASTRANTE"]].zfill(8), systems, seg),
                p[ix["CD_ESTADO"]], CATEG.get(p[ix["CD_CATEG_EMITENTE"]], "outra"),
                prog_group(p[ix["CD_PROGRAMA"]]), fonte.get(p[ix["CD_FONTE_RECURSO"]], "?"), e[0], e[1], e[2])
    return ops


def process_cohort(args):
    fname, year, target_months, ctx = args
    emp, fonte, systems, seg = ctx
    ops = _ops(year, emp, fonte, systems, seg)
    agg_uf = defaultdict(lambda: [0.0, 0])     # mês, inst, uf, categ, prog, fonte, status
    agg_prod = defaultdict(lambda: [0.0, 0])   # mês (trimestral), inst, finalidade, atividade, produto, categ, fonte, status
    unmatched = defaultdict(lambda: [0.0, 0])
    TMP.mkdir(parents=True, exist_ok=True)
    tgt = open(TMP / f"target_{fname}.csv", "w", encoding="utf-8")
    n = 0
    with gzip.open(SDIR / f"{fname}.gz", "rt", encoding="latin-1") as f:
        f.readline()
        for line in f:
            p = line.rstrip("\n").split(";")
            if len(p) < 9:
                continue
            n += 1
            st = STATUS.get(p[7], "outra")
            if st in ("liquidada", "excluida"):
                continue
            try:
                bal = float(p[5] or 0)
            except ValueError:
                continue
            month = f"{p[2]}-{p[3].zfill(2)}"
            o = ops.get((p[0], p[1]))
            if o is None:
                u = unmatched[(month, st)]
                u[0] += bal
                u[1] += 1
                continue
            inst, uf, categ, prog, fon, fin, ativ, prod = o
            r = p[8] if len(p) > 8 else ""
            a = agg_uf[(month, inst, uf, categ, prog, fon, st, r)]
            a[0] += bal
            a[1] += 1
            if p[3] in ("3", "6", "9", "12", "03", "06", "09"):
                b = agg_prod[(month, inst, fin, ativ, prod, categ, fon, st)]
                b[0] += bal
                b[1] += 1
            if month in target_months and bal:
                tgt.write(f"{p[0]};{p[1]};{month};{inst};{uf};{categ};{fon};{prod};{st};{bal:.2f}\n")
    tgt.close()
    for nm, agg in (("uf", agg_uf), ("prod", agg_prod), ("unmatched", unmatched)):
        with gzip.open(TMP / f"agg_{nm}_{fname}.csv.gz", "wt", encoding="utf-8") as f:
            for k, v in agg.items():
                f.write(";".join(k) + f";{v[0]:.2f};{v[1]}\n")
    return fname, n, len(ops), len(agg_uf)


def merge(prefix, ncols):
    acc = defaultdict(lambda: [0.0, 0])
    for p in sorted(TMP.glob(f"agg_{prefix}_*.csv.gz")):
        with gzip.open(p, "rt", encoding="utf-8") as f:
            for line in f:
                x = line.rstrip("\n").split(";")
                a = acc[tuple(x[:ncols])]
                a[0] += float(x[ncols])
                a[1] += int(x[ncols + 1])
    return acc


def municipal(target_months):
    """Junta as operações vivas nos meses-alvo ao município (complemento) e soma por mês × inst × município × situação."""
    want = {}
    for p in TMP.glob("target_*.csv"):
        with open(p, encoding="utf-8") as f:
            for line in f:
                x = line.rstrip("\n").split(";")
                want.setdefault((x[0], x[1]), []).append(x[2:])
    log(f"[sicor] {len(want)} operações nos meses-alvo; lendo o complemento (município)")
    acc = defaultdict(lambda: [0.0, 0])
    found = 0
    with gzip.open(SDIR / "SICOR_COMPLEMENTO_OPERACAO_BASICA.gz", "rt", encoding="latin-1") as f:
        h = f.readline().lstrip("#").rstrip("\n").split(";")
        ir, io_, im = h.index("REF_BACEN"), h.index("NU_ORDEM"), h.index("CD_IBGE_MUNICIPIO")
        for line in f:
            p = line.rstrip("\n").split(";")
            rows = want.pop((p[ir], p[io_]), None)
            if not rows:
                continue
            found += 1
            for month, inst, uf, categ, fon, prod, st, bal in rows:
                a = acc[(month, inst, uf, p[im], categ, fon, prod, st)]
                a[0] += float(bal)
                a[1] += 1
    for rows in want.values():  # sem município no complemento
        for month, inst, uf, categ, fon, prod, st, bal in rows:
            a = acc[(month, inst, uf, "", categ, fon, prod, st)]
            a[0] += float(bal)
            a[1] += 1
    log(f"[sicor] município achado para {found} operações; {len(want)} sem complemento")
    return acc


def cmd_process(a):
    target = set(a.target_months.split(","))
    emp, fonte = load_domains()
    systems, seg = coop_systems()
    ctx = (emp, fonte, systems, seg)
    files = [(n, y) for n, y in saldo_files(date.today().year) if (SDIR / f"{n}.gz").exists()]
    if not a.merge_only:
        if not a.resume:
            for p in TMP.glob("*"):
                p.unlink()

        def done(n):
            out = TMP / f"agg_uf_{n}.csv.gz"
            return a.resume and out.exists() and out.stat().st_mtime > (SDIR / f"{n}.gz").stat().st_mtime
        jobs = [(n, y, target, ctx) for n, y in sorted(files, key=lambda t: -os.path.getsize(SDIR / f"{t[0]}.gz"))
                if not done(n)]
        with Pool(a.jobs) as pool:
            for fname, n, nops, nk in pool.imap_unordered(process_cohort, jobs):
                log(f"[sicor] {fname}: {n} saldos, {nops} operações no cadastro do ano, {nk} células")
    if a.only_cohorts:
        return

    out_uf = RAW / "sicor_saldos_uf.csv.gz"
    acc = merge("uf", 8)
    with gzip.open(out_uf, "wt", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["mes", "inst", "uf", "categoria", "programa", "fonte", "situacao", "renegociada", "saldo", "n_ops"])
        for k in sorted(acc):
            w.writerow(list(k) + [round(acc[k][0], 2), acc[k][1]])
    log(f"[sicor] {len(acc)} células → {out_uf}")

    # tabela pequena, versionada: mês × inst × situação (R$ milhões)
    small = defaultdict(float)
    for k, v in acc.items():
        small[(k[0], k[1], k[6])] += v[0]
    with open(DATA / "sicor_saldos_inst_situacao.csv", "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["mes", "inst", "situacao", "saldo_rs_mi"])
        for k in sorted(small):
            w.writerow(list(k) + [round(small[k] / 1e6, 3)])

    acc = merge("prod", 8)
    with gzip.open(RAW / "sicor_saldos_produto.csv.gz", "wt", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["mes", "inst", "finalidade", "atividade", "produto", "categoria", "fonte", "situacao", "saldo", "n_ops"])
        for k in sorted(acc):
            w.writerow(list(k) + [round(acc[k][0], 2), acc[k][1]])
    acc = merge("unmatched", 2)
    with open(DATA / "sicor_saldos_sem_cadastro.csv", "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["mes", "situacao", "saldo_rs_mi", "n_ops"])
        for k in sorted(acc):
            w.writerow(list(k) + [round(acc[k][0] / 1e6, 3), acc[k][1]])

    if (SDIR / "SICOR_COMPLEMENTO_OPERACAO_BASICA.gz").exists():
        acc = municipal(target)
        with gzip.open(RAW / "sicor_saldos_municipio.csv.gz", "wt", encoding="utf-8", newline="") as f:
            w = csv.writer(f)
            w.writerow(["mes", "inst", "uf", "cod_ibge", "categoria", "fonte", "produto", "situacao", "saldo", "n_ops"])
            for k in sorted(acc):
                w.writerow(list(k) + [round(acc[k][0], 2), acc[k][1]])
    prov = {"source": "BCB SICOR, microdados (Matriz de Dados do Crédito Rural)", "base_url": f"{BASE}/DadosBrutos/",
            "dictionary": f"{BASE}/manualDadosSicorCompleto.pdf", "built_at": now_iso(),
            "files": [json.loads(m.read_text()) for m in sorted(SDIR.glob("*.meta.json"))],
            "target_months": sorted(target)}
    (DATA / "sicor_provenance.json").write_text(json.dumps(prov, ensure_ascii=False, indent=1))


def main():
    ap = argparse.ArgumentParser()
    sp = ap.add_subparsers(dest="cmd", required=True)
    sp.add_parser("download")
    p = sp.add_parser("process")
    p.add_argument("--jobs", type=int, default=3)
    p.add_argument("--target-months", default="2023-12,2026-09")
    p.add_argument("--merge-only", action="store_true")
    p.add_argument("--resume", action="store_true", help="não apaga _work/ e pula safras já processadas")
    p.add_argument("--only-cohorts", action="store_true", help="só processa as safras (sem juntar)")
    a = ap.parse_args()
    {"download": cmd_download, "process": cmd_process}[a.cmd](a)


if __name__ == "__main__":
    main()
