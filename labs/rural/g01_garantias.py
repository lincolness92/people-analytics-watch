"""Atena, premissa G01: a exposição rural fora do Pronaf está em imóveis de 4 ou mais módulos fiscais?

Pré-registro leve: labs/rural/resultados/a7_preregistro.json (28/11/2026 07:20 UTC, antes de baixar o CAR).
Regra: confirma se M ≥ 0,70; refuta se M < 0,50; inconclusivo entre os dois, com
  M = valor contratado fora do Pronaf em municípios onde ≥ 70% da área do CAR (imóvel rural, ativo) é de imóveis
      com m_fiscal ≥ 4  ÷  valor contratado fora do Pronaf com município conhecido e presente no CAR.

Fontes:
- SICAR, WFS público `geoserver.car.gov.br/geoserver/sicar/wfs`, uma camada por UF (sicar_imoveis_{uf}). Campos
  usados: status_imovel, tipo_imovel, area, m_fiscal, cod_municipio_ibge. O WFS (GeoJSON, sem geometria) traz também o código do
  imóvel; o script só usa o código para checar duplicatas na paginação e não guarda nada por imóvel. Saída
  agregada por município × tipo × situação × classe de módulos fiscais.
- IBGE PAM 5457, valor da produção das lavouras por município, 2025 (só na imputação exploratória).
- SICOR, microdados já baixados (data/rural/raw/sicor/): SICOR_OPERACAO_BASICA_ESTADO_{2020..2026} (valor,
  programa, categoria, fonte, IF, UF, data de emissão) e SICOR_COMPLEMENTO_OPERACAO_BASICA (município).

Uso:
  python3 labs/rural/g01_garantias.py car [--jobs 3]   # ~75 min; agregados em data/rural/raw/car/ (~2 MB)
  python3 labs/rural/g01_garantias.py sicor            # ~3 min, ~1 GB de RAM
  python3 labs/rural/g01_garantias.py analisar
Saídas: data/rural/car_municipio_resumo.csv (versionado), data/rural/sicor_contratado_uf_programa.csv,
        data/rural/raw/car_municipio_mf.csv.gz e sicor_contratado_municipio.csv.gz (fora do git),
        labs/rural/resultados/g01_*.csv e g01_resultado.json
"""

import argparse
import csv
import gzip
import json
import sys
import time
import urllib.parse
from collections import defaultdict
from multiprocessing import Pool
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from common import DATA, PAUSE, RAW, _open, download, log, now_iso  # noqa: E402

OUT = HERE / "resultados"
CAR_RAW = RAW / "car"
CAR_FULL = RAW / "car_municipio_mf.csv.gz"
SICOR_MUN = RAW / "sicor_contratado_municipio.csv.gz"
WFS = "https://geoserver.car.gov.br/geoserver/sicar/wfs"
UFS = ["AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR",
       "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO"]
PAGE = 10000
JANELA = ("2020-07-01", "2026-06-30")  # safras 2020/21 a 2025/26
LIMIAR_AREA, CONFIRMA, REFUTA = 0.70, 0.70, 0.50


def classe_mf(mf):
    """Lei 8.629/1993, art. 4º: minifúndio < 1; pequena 1–4; média 4–15; grande > 15 módulos fiscais."""
    if mf < 1:
        return "lt1"
    if mf < 4:
        return "1a4"
    if mf <= 15:
        return "4a15"
    return "gt15"


# ---------------------------------------------------------------- CAR (WFS)

def _hits(layer):
    url = f"{WFS}?service=WFS&version=2.0.0&request=GetFeature&typeNames=sicar:{layer}&resultType=hits"
    with _open(url, timeout=180) as r:
        body = r.read().decode("utf-8", "replace")
    i = body.find('numberMatched="')
    return int(body[i + 15:body.index('"', i + 15)])


def car_uf(uf):
    out = CAR_RAW / f"{uf.lower()}.csv"
    if out.exists():
        return uf, "cache", 0, 0
    layer = f"sicar_imoveis_{uf.lower()}"
    total = _hits(layer)
    time.sleep(PAUSE)
    agg = defaultdict(lambda: [0, 0.0])
    seen, dup, nrows, last, pages = set(), 0, 0, "", 0
    while True:
        # paginação por chave (cod_imovel > último visto, em ordem): startIndex fundo custa ~100 s por página
        filt = "&cql_filter=" + urllib.parse.quote(f"cod_imovel>'{last}'") if last else ""
        url = (f"{WFS}?service=WFS&version=2.0.0&request=GetFeature&typeNames=sicar:{layer}&count={PAGE}"
               f"&outputFormat=application/json&sortBy=cod_imovel{filt}"
               "&propertyName=cod_imovel,status_imovel,area,cod_municipio_ibge,m_fiscal,tipo_imovel")
        for attempt in range(1, 6):
            try:
                with _open(url, timeout=600) as r:
                    feats = json.loads(r.read())["features"]
                break
            except Exception as e:  # noqa: BLE001
                log(f"  [car] {uf} página {pages}: tentativa {attempt}: {e}")
                time.sleep(5 * attempt ** 2)
        else:
            raise RuntimeError(f"CAR {uf} página {pages} falhou")
        pages += 1
        n = 0
        for ft in feats:
            row = ft["properties"]
            n += 1
            cod = row["cod_imovel"]
            if cod in seen:
                dup += 1
                continue
            seen.add(cod)
            try:
                area, mf = float(row["area"] or 0), float(row["m_fiscal"] or 0)
            except (TypeError, ValueError):
                continue
            a = agg[(str(row["cod_municipio_ibge"] or ""), row["tipo_imovel"], row["status_imovel"], classe_mf(mf))]
            a[0] += 1
            a[1] += area
        nrows += n
        if n:
            last = feats[-1]["properties"]["cod_imovel"]
        if pages % 20 == 0:
            log(f"  [car] {uf}: {nrows}/{total}")
        if n < PAGE:
            break
        time.sleep(PAUSE)
    CAR_RAW.mkdir(parents=True, exist_ok=True)
    tmp = out.with_suffix(".part")
    with open(tmp, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["uf", "cod_ibge", "tipo", "status", "classe_mf", "n_imoveis", "area_ha"])
        for k in sorted(agg):
            w.writerow([uf, *k, agg[k][0], round(agg[k][1], 2)])
    tmp.replace(out)
    (CAR_RAW / f"{uf.lower()}.meta.json").write_text(json.dumps(
        {"layer": layer, "url": WFS, "fetched_at": now_iso(), "number_matched": total, "linhas_lidas": nrows,
         "imoveis_distintos": len(seen), "duplicatas": dup}, ensure_ascii=False))
    return uf, total, len(seen), dup


def cmd_car(a):
    ufs = a.ufs.split(",") if a.ufs else UFS
    with Pool(a.jobs) as pool:
        for uf, total, distinct, dup in pool.imap_unordered(car_uf, ufs):
            log(f"[car] {uf}: {total} no WFS, {distinct} distintos, {dup} duplicatas")
    rows, metas = [], {}
    for uf in UFS:
        p = CAR_RAW / f"{uf.lower()}.csv"
        if not p.exists():
            log(f"[car] faltando {uf}")
            continue
        with open(p, encoding="utf-8") as f:
            rows.extend(csv.DictReader(f))
        metas[uf] = json.loads((CAR_RAW / f"{uf.lower()}.meta.json").read_text())
    with gzip.open(CAR_FULL, "wt", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["uf", "cod_ibge", "tipo", "status", "classe_mf", "n_imoveis", "area_ha"])
        w.writeheader()
        w.writerows(rows)
    resumo = defaultdict(lambda: [0, 0.0, 0, 0.0])
    for r in rows:
        if r["tipo"] == "IRU" and r["status"] == "AT":
            x = resumo[(r["uf"], r["cod_ibge"])]
            ge4 = r["classe_mf"] in ("4a15", "gt15")
            x[0] += int(r["n_imoveis"])
            x[1] += float(r["area_ha"])
            x[2] += int(r["n_imoveis"]) if ge4 else 0
            x[3] += float(r["area_ha"]) if ge4 else 0.0
    with open(DATA / "car_municipio_resumo.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["uf", "cod_ibge", "imoveis_iru_ativos", "area_ha", "imoveis_ge4mf", "area_ge4mf_ha", "parcela_area_ge4mf"])
        for k in sorted(resumo):
            x = resumo[k]
            w.writerow([*k, x[0], round(x[1], 1), x[2], round(x[3], 1), round(x[3] / x[1], 4) if x[1] else ""])
    (DATA / "car_provenance.json").write_text(json.dumps(
        {"source": "SICAR (Serviço Florestal Brasileiro), WFS público", "url": WFS, "built_at": now_iso(),
         "nota": "só agregados por município; nenhum dado por imóvel guardado", "ufs": metas},
        ensure_ascii=False, indent=1))


# ---------------------------------------------------------------- SICOR: valor contratado por município

def cmd_sicor(a):
    from collect_sicor import CATEG, SDIR, coop_systems, inst_group, load_domains, prog_group
    emp, fonte = load_domains()
    systems, seg = coop_systems()
    combos, cidx = [], {}
    ops = {}  # chave int(ref)*1000+ordem → (combo, valor), só fora do Pronaf
    pronaf = defaultdict(float)  # (inst, uf) → valor (sem município)
    tot = defaultdict(float)
    lo, hi = JANELA
    for year in range(int(lo[:4]), int(hi[:4]) + 1):
        path = SDIR / f"SICOR_OPERACAO_BASICA_ESTADO_{year}.gz"
        with gzip.open(path, "rt", encoding="latin-1") as f:
            h = f.readline().lstrip("#").rstrip("\n").split(";")
            ix = {k: h.index(k) for k in ("REF_BACEN", "NU_ORDEM", "CNPJ_IF", "DT_EMISSAO", "CD_ESTADO",
                                          "CD_CATEG_EMITENTE", "CD_FONTE_RECURSO", "CD_PROGRAMA",
                                          "VL_PARC_CREDITO", "CD_CNPJ_CADASTRANTE")}
            for line in f:
                p = line.rstrip("\n").split(";")
                d = p[ix["DT_EMISSAO"]]
                iso = f"{d[6:10]}-{d[3:5]}-{d[0:2]}"
                if not (lo <= iso <= hi):
                    continue
                try:
                    val = float(p[ix["VL_PARC_CREDITO"]] or 0)
                except ValueError:
                    continue
                inst = inst_group(p[ix["CNPJ_IF"]].zfill(8), p[ix["CD_CNPJ_CADASTRANTE"]].zfill(8), systems, seg)
                inst = "bb" if inst == "bb" else "outras"
                uf = p[ix["CD_ESTADO"]]
                prog = prog_group(p[ix["CD_PROGRAMA"]])
                safra = int(iso[:4]) if iso[5:7] >= "07" else int(iso[:4]) - 1
                tot[(inst, uf, prog)] += val
                if prog == "pronaf":
                    pronaf[(inst, uf)] += val
                    continue
                c = (inst, uf, prog, CATEG.get(p[ix["CD_CATEG_EMITENTE"]], "outra"),
                     fonte.get(p[ix["CD_FONTE_RECURSO"]], "?"), str(safra))
                if c not in cidx:
                    cidx[c] = len(combos)
                    combos.append(c)
                try:
                    k = int(p[ix["REF_BACEN"]]) * 1000 + int(p[ix["NU_ORDEM"]])
                except ValueError:
                    continue
                ops[k] = (cidx[c], val)
        log(f"[sicor] {year}: {len(ops)} operações fora do Pronaf na janela até aqui")
    acc = defaultdict(float)
    found = 0
    with gzip.open(SDIR / "SICOR_COMPLEMENTO_OPERACAO_BASICA.gz", "rt", encoding="latin-1") as f:
        h = f.readline().lstrip("#").rstrip("\n").split(";")
        ir, io_, im = h.index("REF_BACEN"), h.index("NU_ORDEM"), h.index("CD_IBGE_MUNICIPIO")
        for line in f:
            p = line.rstrip("\n").split(";")
            try:
                k = int(p[ir]) * 1000 + int(p[io_])
            except ValueError:
                continue
            o = ops.pop(k, None)
            if o is None:
                continue
            found += 1
            acc[(o[0], p[im].strip())] += o[1]
    for ci, val in ops.values():
        acc[(ci, "")] += val
    log(f"[sicor] município achado para {found} operações; {len(ops)} sem município")
    with gzip.open(SICOR_MUN, "wt", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["inst", "uf", "programa", "categoria", "fonte", "safra", "cod_ibge", "valor_rs"])
        for (ci, mun), v in sorted(acc.items(), key=lambda t: (combos[t[0][0]], t[0][1])):
            w.writerow([*combos[ci], mun, round(v, 2)])
    with open(DATA / "sicor_contratado_uf_programa.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["inst", "uf", "programa", "valor_rs"])
        for k in sorted(tot):
            w.writerow([*k, round(tot[k], 2)])


# ---------------------------------------------------------------- análise

def load_car(status_ok=("AT",), tipos=("IRU",)):
    """Por município: área total e área com m_fiscal ≥ 4, imóvel rural com situação em status_ok."""
    area = defaultdict(lambda: [0.0, 0.0, 0, 0])
    with gzip.open(CAR_FULL, "rt", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            if r["status"] not in status_ok or r["tipo"] not in tipos:
                continue
            a = area[r["cod_ibge"]]
            a[0] += float(r["area_ha"])
            a[2] += int(r["n_imoveis"])
            if r["classe_mf"] in ("4a15", "gt15"):
                a[1] += float(r["area_ha"])
                a[3] += int(r["n_imoveis"])
    return {m: {"area": v[0], "area_ge4": v[1], "n": v[2], "n_ge4": v[3], "share": v[1] / v[0] if v[0] else 0.0}
            for m, v in area.items()}


def load_contratos():
    rows = []
    with gzip.open(SICOR_MUN, "rt", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            r["valor_rs"] = float(r["valor_rs"])
            rows.append(r)
    return rows


def medir(rows, car, sel):
    """Devolve M e os componentes de cobertura para as linhas que passam em sel."""
    v_pass = v_fail = v_sem_mun = v_sem_car = 0.0
    wshare = 0.0
    for r in rows:
        if not sel(r):
            continue
        v = r["valor_rs"]
        m = r["cod_ibge"]
        if not m:
            v_sem_mun += v
            continue
        c = car.get(m)
        if c is None or c["area"] <= 0:
            v_sem_car += v
            continue
        wshare += v * c["share"]
        if c["share"] >= LIMIAR_AREA:
            v_pass += v
        else:
            v_fail += v
    base = v_pass + v_fail
    tot = base + v_sem_mun + v_sem_car
    if tot <= 0 or base <= 0:
        return None
    return {"M": v_pass / base, "valor_base_rs_bi": base / 1e9, "valor_total_rs_bi": tot / 1e9,
            "cobertura_municipio": (base + v_sem_car) / tot, "sem_municipio_rs_bi": v_sem_mun / 1e9,
            "sem_car_rs_bi": v_sem_car / 1e9, "parcela_media_ponderada": wshare / base,
            "M_pior_caso": v_pass / tot, "M_melhor_caso": (v_pass + v_sem_mun + v_sem_car) / tot}


PAM_URL = "https://apisidra.ibge.gov.br/values/t/5457/n6/all/v/215/p/2025/c782/0"
PAM_RAW = RAW / "pam" / "pam_5457_mun_valor_2025.json"


def load_pam():
    if not PAM_RAW.exists():
        download(PAM_URL, PAM_RAW, use_head=False)
    out = {}
    for r in json.loads(PAM_RAW.read_text())[1:]:
        try:
            out[r["D1C"]] = float(r["V"])
        except ValueError:
            pass
    return out


def imputar(rows, car, pam, sel, uf_of):
    """EXPLORATÓRIO, fora do pré-registro. Distribui o valor sem município de cada célula UF × categoria × fonte
    (1) como o valor com município da mesma célula (se houver; senão da UF; senão PAM) e
    (2) pelo valor da produção das lavouras da PAM 2025 nos municípios da UF.
    Devolve (M_imputado_sicor, M_imputado_pam)."""
    cell_pass, cell_base, cell_unk = defaultdict(float), defaultdict(float), defaultdict(float)
    for r in rows:
        if not sel(r):
            continue
        k = (r["uf"], r["categoria"], r["fonte"])
        m = r["cod_ibge"]
        if not m or m not in car or car[m]["area"] <= 0:
            cell_unk[k] += r["valor_rs"]
            continue
        cell_base[k] += r["valor_rs"]
        if car[m]["share"] >= LIMIAR_AREA:
            cell_pass[k] += r["valor_rs"]
    uf_pass, uf_base = defaultdict(float), defaultdict(float)
    for k, v in cell_base.items():
        uf_base[k[0]] += v
        uf_pass[k[0]] += cell_pass[k]
    pam_pass, pam_tot = defaultdict(float), defaultdict(float)
    for m, v in pam.items():
        if m in car and car[m]["area"] > 0:
            u = uf_of.get(m)
            pam_tot[u] += v
            if car[m]["share"] >= LIMIAR_AREA:
                pam_pass[u] += v

    def frac_pam(u):
        return pam_pass[u] / pam_tot[u] if pam_tot[u] else 0.0
    p1 = p2 = tot = 0.0
    for k in set(cell_base) | set(cell_unk):
        b, u = cell_base[k], cell_unk[k]
        if b:
            f1 = cell_pass[k] / b
        elif uf_base[k[0]]:
            f1 = uf_pass[k[0]] / uf_base[k[0]]
        else:
            f1 = frac_pam(k[0])
        p1 += cell_pass[k] + u * f1
        p2 += cell_pass[k] + u * frac_pam(k[0])
        tot += b + u
    return (p1 / tot, p2 / tot) if tot else (None, None)


def leitura(M):
    return "confirma" if M >= CONFIRMA else ("refuta" if M < REFUTA else "inconclusivo")


def cmd_analisar(a):
    OUT.mkdir(exist_ok=True)
    car = load_car()
    car_ape = load_car(status_ok=("AT", "PE"))
    rows = load_contratos()
    res = {"built_at": now_iso(), "preregistro": "labs/rural/resultados/a7_preregistro.json",
           "janela_sicor": JANELA, "limiar_area": LIMIAR_AREA, "confirma": CONFIRMA, "refuta": REFUTA,
           "municipios_car": len(car), "recortes": {}}
    recortes = {
        "sistema": lambda r: True,
        "bb": lambda r: r["inst"] == "bb",
        "outras_ifs": lambda r: r["inst"] != "bb",
        "sistema_nao_controlada": lambda r: r["fonte"] == "nao_controlada",
        "bb_nao_controlada": lambda r: r["inst"] == "bb" and r["fonte"] == "nao_controlada",
        "sistema_pronamp": lambda r: r["programa"] == "pronamp",
        "sistema_sem_programa": lambda r: r["programa"] == "sem_programa",
        "sistema_grande": lambda r: r["categoria"] == "grande",
        "sistema_medio": lambda r: r["categoria"] == "medio",
        "sistema_pequeno_fora_pronaf": lambda r: r["categoria"] == "pequeno",
        "sistema_safra_2025": lambda r: r["safra"] == "2025",
        "bb_safra_2025": lambda r: r["inst"] == "bb" and r["safra"] == "2025",
    }
    for name, sel in recortes.items():
        m = medir(rows, car, sel)
        if m:
            m["leitura"] = leitura(m["M"])
            res["recortes"][name] = m
    pam = load_pam()
    uf_of = {}
    with gzip.open(CAR_FULL, "rt", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            uf_of[r["cod_ibge"]] = r["uf"]
    for name in ("sistema", "bb", "sistema_nao_controlada", "sistema_grande", "sistema_medio"):
        i1, i2 = imputar(rows, car, pam, recortes[name], uf_of)
        res["recortes"][name]["exploratorio_M_imputado_sicor_celula"] = i1
        res["recortes"][name]["exploratorio_M_imputado_pam"] = i2
    for name in ("sistema", "bb"):
        m = medir(rows, car_ape, recortes[name])
        m["leitura"] = leitura(m["M"])
        res["recortes"][name + "_car_ativo_e_pendente"] = m
    # sensibilidade ao limiar de área (descritiva; o pré-registro fixa 0,70)
    sens = []
    for lim in (0.5, 0.6, 0.7, 0.8, 0.9):
        for name in ("sistema", "bb"):
            vp = vb = 0.0
            for r in rows:
                if not recortes[name](r) or not r["cod_ibge"] or r["cod_ibge"] not in car:
                    continue
                vb += r["valor_rs"]
                if car[r["cod_ibge"]]["share"] >= lim:
                    vp += r["valor_rs"]
            sens.append([name, lim, round(vp / vb, 4)])
    with open(OUT / "g01_sensibilidade_limiar.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["recorte", "limiar_area_ge4", "M"])
        w.writerows(sens)
    # por UF, sistema e BB
    por_uf = []
    for uf in UFS:
        for name in ("sistema", "bb"):
            m = medir(rows, car, lambda r, u=uf, n=name: r["uf"] == u and recortes[n](r))
            if m:
                por_uf.append([uf, name, round(m["valor_total_rs_bi"], 3), round(m["cobertura_municipio"], 3),
                               round(m["M"], 3), round(m["parcela_media_ponderada"], 3), leitura(m["M"])])
    with open(OUT / "g01_por_uf.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["uf", "recorte", "valor_fora_pronaf_rs_bi", "cobertura_municipio", "M", "parcela_media_ponderada",
                    "leitura"])
        w.writerows(por_uf)
    # parcela de área ≥ 4 MF por UF no CAR (descritiva)
    car_uf = defaultdict(lambda: [0.0, 0.0, 0, 0])
    with gzip.open(CAR_FULL, "rt", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            if r["status"] != "AT" or r["tipo"] != "IRU":
                continue
            c = car_uf[r["uf"]]
            c[0] += float(r["area_ha"])
            c[2] += int(r["n_imoveis"])
            if r["classe_mf"] in ("4a15", "gt15"):
                c[1] += float(r["area_ha"])
                c[3] += int(r["n_imoveis"])
    with open(OUT / "g01_car_uf.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["uf", "imoveis_ativos_iru", "area_mha", "parcela_imoveis_ge4", "parcela_area_ge4"])
        for uf in UFS:
            c = car_uf.get(uf)
            if c and c[0]:
                w.writerow([uf, c[2], round(c[0] / 1e6, 2), round(c[3] / c[2], 3), round(c[1] / c[0], 3)])
    # composição do valor fora do Pronaf por categoria do emitente (porte pela receita, não pela área), cobertura total
    cat = defaultdict(float)
    for r in rows:
        cat[(r["inst"], r["categoria"])] += r["valor_rs"]
    with open(OUT / "g01_categoria.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["inst", "categoria", "valor_fora_pronaf_rs_bi", "parcela"])
        for inst in ("bb", "outras"):
            t = sum(v for k, v in cat.items() if k[0] == inst)
            for k in sorted(k for k in cat if k[0] == inst):
                w.writerow([inst, k[1], round(cat[k] / 1e9, 2), round(cat[k] / t, 4)])
    # peso do Pronaf no valor contratado (contexto)
    tot = defaultdict(float)
    with open(DATA / "sicor_contratado_uf_programa.csv", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            tot[(r["inst"], r["programa"] == "pronaf")] += float(r["valor_rs"])
    for inst in ("bb", "outras"):
        t = tot[(inst, True)] + tot[(inst, False)]
        res[f"parcela_pronaf_{inst}"] = tot[(inst, True)] / t if t else None
    tt = sum(tot.values())
    res["parcela_pronaf_sistema"] = (tot[("bb", True)] + tot[("outras", True)]) / tt
    res["valor_contratado_total_rs_bi"] = tt / 1e9
    res["leitura_decisiva"] = res["recortes"]["sistema"]["leitura"]
    (OUT / "g01_resultado.json").write_text(json.dumps(res, ensure_ascii=False, indent=1))
    s = res["recortes"]["sistema"]
    b = res["recortes"]["bb"]
    log(f"[g01] sistema M={s['M']:.3f} ({s['leitura']}), cobertura {s['cobertura_municipio']:.2f}, "
        f"limites {s['M_pior_caso']:.3f}–{s['M_melhor_caso']:.3f}; BB M={b['M']:.3f}, cobertura {b['cobertura_municipio']:.2f}")


def main():
    ap = argparse.ArgumentParser()
    sp = ap.add_subparsers(dest="cmd", required=True)
    p = sp.add_parser("car")
    p.add_argument("--jobs", type=int, default=2)
    p.add_argument("--ufs", default="")
    sp.add_parser("sicor")
    sp.add_parser("analisar")
    a = ap.parse_args()
    {"car": cmd_car, "sicor": cmd_sicor, "analisar": cmd_analisar}[a.cmd](a)


if __name__ == "__main__":
    main()
