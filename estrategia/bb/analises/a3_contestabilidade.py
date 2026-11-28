"""Análise 3. Mapa municipal de contestabilidade (ESTBAN).

Classifica cada município, em cada mês escolhido, pela presença de agências: só o BB; BB e só outros bancos
públicos; BB e algum banco privado; sem BB. Mede a participação do BB no crédito e nos depósitos por classe, a
entrada e a saída de concorrentes entre a primeira e a última data, e o que aconteceu com os depósitos do BB onde um
banco privado saiu. ESTBAN não tem cooperativas nem bancos digitais sem agência.

Fonte: ESTBAN por município (BCB, documento 4500), ZIPs em data/ifs/raw/estban/, com as correções de linhas que
trazem o total nacional do banco (tabela estban_fixes da base local). Rodar:
    python estrategia/bb/analises/a3_contestabilidade.py
"""

import csv
import gzip
import io
import zipfile

import sys

sys.dont_write_bytecode = True  # não grava .pyc em src/ (a camada de dados é só leitura)
import _comum as c  # noqa: E402
from pawatch.ifs import config, estban  # noqa: E402
from pawatch.ifs.shares import estban_membership  # noqa: E402

BB = "00000000"
MONTHS = [201601, 201912, 202212, 202608]  # primeira, pré-pandemia, meio, última disponível
# Sedes onde os bancos contabilizam saldos que não são do município (o BB passou ~R$ 95 bi de crédito para
# Brasília no 1º semestre de 2025; Itaú e Santander em São Paulo; Bradesco em Osasco). Ficam fora dos agregados.
HQ_IBGE = {"5300108": "Brasília", "3550308": "São Paulo", "3534401": "Osasco"}
# Kirton Bank é o antigo HSBC Brasil, incorporado pelo Bradesco (2016): a "saída" dele é fusão, não saída
ALIAS = {"01701201": "bradesco (Kirton, ex-HSBC)"}
METRICS = ["credito_total", "credito_rural", "depositos_total", "depositos_vista", "depositos_poupanca"]


def agencies(month):
    """{(cnpj8, codmun): nº de agências esperadas} do ZIP do mês (coluna AGEN_ESPERADAS)."""
    body = gzip.decompress((c.IFS / "raw" / "estban" / f"{month}.zip.gz").read_bytes())
    z = zipfile.ZipFile(io.BytesIO(body))
    lines = z.read(z.namelist()[0]).decode("latin-1").splitlines()
    h = next(i for i, l in enumerate(lines[:20]) if "CNPJ" in l and "UF" in l)
    hdr = [x.strip().lstrip("#") for x in lines[h].split(";")]
    ix = {k: hdr.index(k) for k in ("CNPJ", "CODMUN", "AGEN_ESPERADAS") if k in hdr}
    out = {}
    for rec in csv.reader(lines[h + 1:], delimiter=";"):
        if len(rec) < len(hdr) - 1:
            continue
        try:
            out[(rec[ix["CNPJ"]].strip().zfill(8), rec[ix["CODMUN"]].strip())] = int(rec[ix["AGEN_ESPERADAS"]] or 0)
        except (KeyError, ValueError):
            pass
    return out


def load_month(con, month, metrics_cfg, public):
    """{codmun: {"uf", "nome", "ibge", "banks": {cnpj8: {métrica: R$}}, "ag": {cnpj8: nº}}}"""
    ag = agencies(month)
    mun = {}
    for r in estban.municipal_rows(month, con):
        mv = estban.metric_values(r["values"], {k: metrics_cfg[k] for k in METRICS})
        mv.update({k: v for k, v in r.get("fixed", {}).items() if k in mv})
        mv["depositos_varejo"] = mv.get("depositos_vista", 0) + mv.get("depositos_poupanca", 0)
        m = mun.setdefault(r["codmun"], {"uf": r["uf"], "nome": r["municipio"], "ibge": r["codmun_ibge"],
                                          "banks": {}, "ag": {}})
        m["banks"][r["cnpj8"]] = mv
        m["ag"][r["cnpj8"]] = ag.get((r["cnpj8"], r["codmun"]), 0)
    for m in mun.values():
        m["sede"] = m["ibge"] in HQ_IBGE
        others = [b for b in m["banks"] if b != BB]
        has_bb = BB in m["banks"]
        priv = [b for b in others if b not in public]
        m["n_outros"] = len(others)
        m["n_privados"] = len(priv)
        m["classe"] = ("sem BB" if not has_bb else "só BB" if not others else
                       "BB e só outros públicos" if not priv else "BB e algum privado")
        for k in ("credito_total", "depositos_total", "credito_rural", "depositos_varejo"):
            tot = sum(b.get(k, 0) for b in m["banks"].values())
            m[f"bb_{k}"] = m["banks"].get(BB, {}).get(k, 0)
            m[f"tot_{k}"] = tot
        # dominância medida nos depósitos de varejo (à vista + poupança), que não migram para a sede
        m["bb_dominante"] = bool(has_bb and m["tot_depositos_varejo"] > 0 and
                                 m["bb_depositos_varejo"] / m["tot_depositos_varejo"] >= 0.5)
    return mun


def class_table(month, mun):
    """Agregados por classe, sem os municípios-sede (ver HQ_IBGE)."""
    rows = []
    mun = {k: m for k, m in mun.items() if not m["sede"]}
    classes = ["só BB", "BB e só outros públicos", "BB e algum privado", "sem BB"]
    for cl in classes + ["BB dominante (≥50% dos depósitos à vista + poupança)", "todos com BB"]:
        if cl.startswith("BB dominante"):
            sel = [m for m in mun.values() if m["bb_dominante"]]
        elif cl == "todos com BB":
            sel = [m for m in mun.values() if m["classe"] != "sem BB"]
        else:
            sel = [m for m in mun.values() if m["classe"] == cl]
        r = {"mes": month, "classe": cl, "municipios": len(sel),
             "agencias_bb": sum(m["ag"].get(BB, 0) for m in sel)}
        for k in ("credito_total", "depositos_total", "depositos_varejo", "credito_rural"):
            bb, tot = sum(m[f"bb_{k}"] for m in sel), sum(m[f"tot_{k}"] for m in sel)
            r[f"bb_{k}_bi"] = round(bb / 1e9, 2)
            r[f"bb_share_{k}_pct"] = round(100 * bb / tot, 1) if tot else ""
        bb_all = sum(m["bb_depositos_total"] for m in mun.values())
        r["fatia_dos_depositos_do_bb_pct"] = round(100 * sum(m["bb_depositos_total"] for m in sel) / bb_all, 1)
        dep = sum(m["bb_depositos_total"] for m in sel)
        r["bb_credito_sobre_depositos"] = round(sum(m["bb_credito_total"] for m in sel) / dep, 2) if dep else ""
        rows.append(r)
    return rows


def transitions(a, b, ma, mb, mof_a, mof_b, names):
    """Mudança de classe e de concorrentes entre dois meses, e depósitos do BB por tipo de evento."""
    trans, events, exits = {}, {}, {}
    for cm, x in ma.items():
        y = mb.get(cm)
        if x["sede"]:
            continue
        key = (x["classe"], y["classe"] if y else "município sem banco no fim")
        trans[key] = trans.get(key, 0) + 1
        if not y or BB not in x["banks"] or BB not in y["banks"]:
            continue
        gone = {b_ for b_ in x["banks"] if b_ != BB and b_ not in y["banks"]}
        new = {b_ for b_ in y["banks"] if b_ != BB and b_ not in x["banks"]}
        for g in gone:
            inst = ALIAS.get(g) or mof_a.get(g, names.get(g, g))
            exits[inst] = exits.get(inst, 0) + 1
        n_priv_a = x["n_privados"] - sum(1 for b_ in x["banks"] if b_ in ALIAS and "60746948" in x["banks"])
        if n_priv_a > y["n_privados"]:
            ev = "saiu banco privado (líquido)"
        elif n_priv_a < y["n_privados"]:
            ev = "entrou banco privado (líquido)"
        elif gone or new:
            ev = "troca sem mudança líquida de privados"
        else:
            ev = "sem mudança"
        if x["classe"] == "só BB":
            ev = "era só BB: " + ("continua só BB" if y["classe"] == "só BB" else "ganhou concorrente")
        k = "depositos_varejo"
        e = events.setdefault(ev, {"municipios": 0, "bb_dep_a": 0.0, "bb_dep_b": 0.0, "tot_dep_a": 0.0,
                                   "tot_dep_b": 0.0, "bb_cred_a": 0.0, "bb_cred_b": 0.0, "growth": []})
        e["municipios"] += 1
        e["bb_dep_a"] += x[f"bb_{k}"]
        e["bb_dep_b"] += y[f"bb_{k}"]
        e["tot_dep_a"] += x[f"tot_{k}"]
        e["tot_dep_b"] += y[f"tot_{k}"]
        e["bb_cred_a"] += x["bb_credito_total"]
        e["bb_cred_b"] += y["bb_credito_total"]
        if x[f"bb_{k}"] > 0:
            e["growth"].append(y[f"bb_{k}"] / x[f"bb_{k}"] - 1)
    ev_rows = []
    for ev, e in sorted(events.items()):
        g = sorted(e["growth"])
        ev_rows.append({"de": a, "para": b, "evento": ev, "municipios": e["municipios"],
                        "bb_dep_varejo_cresc_agregado_pct": round(100 * (e["bb_dep_b"] / e["bb_dep_a"] - 1), 1),
                        "bb_dep_varejo_cresc_mediana_pct": round(100 * g[len(g) // 2], 1) if g else "",
                        "bb_credito_cresc_agregado_pct": round(100 * (e["bb_cred_b"] / e["bb_cred_a"] - 1), 1)
                        if e["bb_cred_a"] else "",
                        "bb_share_dep_varejo_ini_pct": round(100 * e["bb_dep_a"] / e["tot_dep_a"], 1),
                        "bb_share_dep_varejo_fim_pct": round(100 * e["bb_dep_b"] / e["tot_dep_b"], 1)})
    tr_rows = [{"de": a, "para": b, "classe_ini": k[0], "classe_fim": k[1], "municipios": n}
               for k, n in sorted(trans.items(), key=lambda kv: -kv[1])]
    ex_rows = [{"de": a, "para": b, "banco_que_saiu": k, "municipios_com_bb_onde_saiu": n}
               for k, n in sorted(exits.items(), key=lambda kv: -kv[1])[:15]]
    return tr_rows, ev_rows, ex_rows


def presence(mun_by_month, mof_by_month, names):
    """Nº de municípios com agência, por banco (top 12 no primeiro mês) em cada mês."""
    out = {}
    for mo, mun in mun_by_month.items():
        for m in mun.values():
            for b_ in m["banks"]:
                inst = mof_by_month[mo].get(b_, names.get(b_, b_))
                out.setdefault(inst, {})[mo] = out.get(inst, {}).get(mo, 0) + 1
    first = MONTHS[0]
    top = sorted(out, key=lambda i: -out[i].get(first, 0))[:12]
    return [{"banco": i, **{str(mo): out[i].get(mo, 0) for mo in MONTHS}} for i in top]


def check_vs_ifdata(con):
    """Teste de aceite 3: depósitos do BB no ESTBAN (soma dos municípios, corrigida) ÷ IF.data (a1+a2+a4)."""
    nat = c.load_national({"depositos_vista", "depositos_poupanca", "depositos_prazo"})
    rows = []
    for p in sorted({p for p, _ in nat}):
        est = con.execute("SELECT SUM(value) FROM estban_uf WHERE month=? AND cnpj8=? AND metric='depositos_total'",
                          (p, BB)).fetchone()[0]
        ifd = sum(nat[(p, m)]["v"].get("bb", 0) for m in ("depositos_vista", "depositos_poupanca", "depositos_prazo")
                  if (p, m) in nat)
        if est and ifd:
            rows.append({"period": p, "bb_estban_depositos_bi": round(est / 1e9, 1),
                         "bb_ifdata_depositos_bi": round(ifd / 1e9, 1), "razao": round(est / ifd, 3)})
    return rows


def main():
    con, reg = c.db(), c.registry()
    cfg = config("estban")["metrics"]
    names = dict(con.execute("SELECT cnpj8, name FROM estban_names"))
    public = {str(code).zfill(8) for (code,) in con.execute(
        "SELECT code FROM ifdata_entities WHERE period=(SELECT MAX(period) FROM ifdata_entities) AND level=1006 "
        "AND tc='1'")}
    mun_by_month, mof_by_month = {}, {}
    for mo in MONTHS:
        mun_by_month[mo] = load_month(con, mo, cfg, public)
        mof_by_month[mo] = estban_membership(con, reg, mo, names)
    rows = [r for mo in MONTHS for r in class_table(mo, mun_by_month[mo])]
    c.write_csv("a3_classes.csv", rows)
    tr, ev, ex = [], [], []
    for a, b in ((MONTHS[0], MONTHS[-1]), (MONTHS[2], MONTHS[-1])):
        t, e, x = transitions(a, b, mun_by_month[a], mun_by_month[b], mof_by_month[a], mof_by_month[b], names)
        tr, ev, ex = tr + t, ev + e, ex + x
    c.write_csv("a3_transicoes.csv", tr)
    c.write_csv("a3_eventos_depositos_bb.csv", ev)
    c.write_csv("a3_saidas_por_banco.csv", ex)
    c.write_csv("a3_presenca_por_banco.csv", presence(mun_by_month, mof_by_month, names))
    last = mun_by_month[MONTHS[-1]]
    mrows = [{"mes": MONTHS[-1], "uf": m["uf"], "codmun_bcb": cm, "codmun_ibge": m["ibge"], "municipio": m["nome"],
              "classe": m["classe"], "sede_excluida_dos_agregados": m["sede"], "bb_dominante_depositos": m["bb_dominante"], "n_outros_bancos": m["n_outros"],
              "n_privados": m["n_privados"], "agencias_bb": m["ag"].get(BB, 0),
              "bb_share_credito_pct": round(100 * m["bb_credito_total"] / m["tot_credito_total"], 1)
              if m["tot_credito_total"] else "",
              "bb_share_depositos_pct": round(100 * m["bb_depositos_total"] / m["tot_depositos_total"], 1)
              if m["tot_depositos_total"] else "",
              "bb_share_dep_varejo_pct": round(100 * m["bb_depositos_varejo"] / m["tot_depositos_varejo"], 1)
              if m["tot_depositos_varejo"] else "",
              "classe_em_" + str(MONTHS[0]): mun_by_month[MONTHS[0]].get(cm, {}).get("classe", "sem agência")}
             for cm, m in sorted(last.items(), key=lambda kv: (kv[1]["uf"], kv[1]["nome"]))]
    c.write_csv("a3_municipios_ultimo_mes.csv", mrows)
    uf = {}
    for m in last.values():
        u = uf.setdefault(m["uf"], {"uf": m["uf"], "municipios_com_banco": 0, "so_bb": 0, "bb_dominante": 0})
        u["municipios_com_banco"] += 1
        u["so_bb"] += m["classe"] == "só BB"
        u["bb_dominante"] += m["bb_dominante"]
    c.write_csv("a3_por_uf.csv", sorted(uf.values(), key=lambda r: -r["so_bb"]))
    c.write_csv("a3_checagem_estban_vs_ifdata.csv", check_vs_ifdata(con))


if __name__ == "__main__":
    main()
