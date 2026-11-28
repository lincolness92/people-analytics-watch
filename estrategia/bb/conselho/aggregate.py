"""R5 do conselho: agregação por código, sem modelo (protocolo em ../03-conselho.md §3 R5 e §6).

Lê R2/premissas.jsonl, R1/c*_r1b.json, R2/r2_*.json, R3/r3_*.json e R4/r4_*.json e grava:
  R5/agregado.json, R5/agregado.csv, desacordos.jsonl (atravessa rodadas) e R5/relatorio.md.
"""
import csv
import json
import pathlib
import statistics

HERE = pathlib.Path(__file__).resolve().parent
TOP10_TAMANHO = {"P02": 3, "P03": 3, "P04": 3, "P01": 3, "P09": 3, "P22": 3, "P45": 3, "P15": 3, "P26": 2, "P14": 2}  # 01-premissas.md
CRIT = ("testavel", "refutavel", "decisoria", "fundamentada", "so_publico", "confundimento")


def jl(path):
    return [json.loads(l) for l in open(path, encoding="utf-8")] if path.exists() else []


def items(pattern, key):
    out = {}
    for f in sorted(HERE.glob(pattern)):
        name = f.stem
        try:
            d = json.loads(f.read_text(encoding="utf-8"))
        except ValueError:
            continue
        who = name.split("_")[1] if name.count("_") >= 1 else name
        for x in d.get(key, []):
            out.setdefault(x.get("premissa"), []).append((who, x))
    return out


def quartiles(xs):
    xs = sorted(xs)
    if len(xs) < 2:
        return (xs[0], xs[0]) if xs else (None, None)
    q = statistics.quantiles(xs, n=4, method="inclusive")
    return q[0], q[2]


def cost():
    out = {}
    for f in sorted(HERE.glob("R*/chamadas.jsonl")):
        for r in jl(f):
            out[r["rodada"]] = round(out.get(r["rodada"], 0) + (r.get("cost_usd") or 0), 4)
    return out


def main():
    dossie = json.loads((HERE / "R0" / "dossie.json").read_text(encoding="utf-8"))
    prem = jl(HERE / "R2" / "premissas.jsonl")
    revs = {}
    for f in sorted((HERE / "R1").glob("c*_r1b.json")):
        chair = f.name.split("_")[0]
        for r in json.loads(f.read_text(encoding="utf-8")).get("revisoes", []):
            revs.setdefault(r.get("premissa"), []).append((chair, r))
    crits = items("R2/r2_*.json", "criticas")
    reps = {k: v[0][1] for k, v in items("R3/r3_*.json", "replicas").items()}
    juds = items("R4/r4_*.json", "julgamentos")

    rows, desac = [], []
    n_d = 0
    for p in prem:
        pid = p["id"]
        # probabilidades do braço B (sem a cadeira B nas premissas v0)
        probs = [float(r["prob_verdadeira"]) for c, r in revs.get(pid, [])
                 if isinstance(r.get("prob_verdadeira"), (int, float)) and not (p["origem"] == "v0" and c == "c2")]
        q1, q3 = quartiles(probs)
        pmed = statistics.median(probs) if probs else None
        iqr = round(q3 - q1, 3) if probs else None
        limiares = [r.get("limiar") for _, r in revs.get(pid, [])]
        # juízes
        sums = {}
        for j, x in juds.get(pid, []):
            n = x.get("notas", {})
            sums[j] = sum(int(n.get(k, 0) or 0) for k in CRIT)
        nota = round(statistics.mean(sums.values()), 1) if sums else None
        dif = (max(sums.values()) - min(sums.values())) if len(sums) >= 2 else None
        testavel = statistics.mean(int(x.get("notas", {}).get("testavel", 0) or 0) for _, x in juds.get(pid, [])) if pid in juds else None
        tetos = sum(1 for _, x in juds.get(pid, []) if x.get("teto_aplicado"))
        vereditos = [x.get("veredito") for _, x in crits.get(pid, [])]
        rep = reps.get(pid, {})
        # classe
        if not vereditos:
            classe = "orfa"
        elif (iqr is not None and iqr > 0.2) or (dif is not None and dif > 3) or rep.get("resposta") == "contesta" \
                or ("descarta" in vereditos and "mantem" in vereditos):
            classe = "disputa"
        else:
            classe = "consenso"
        # prioridade = valor × incerteza × testabilidade, com a mesma régua para todas as origens:
        # alavanca = nota "decisoria" dos juízes (não a autoavaliação); tamanho = do autor (v0: tabela do top 10), 1–3;
        # incerteza = 1 − 2|p − 0,5| com as probabilidades do braço B, ou 2/3 quando não há probabilidade.
        vd = p.get("valor_decisao") or {}
        tam = TOP10_TAMANHO.get(pid) or vd.get("tamanho") or 2
        tam = min(max(int(tam), 1), 3)
        jd = [int(x.get("notas", {}).get("decisoria", 0) or 0) for _, x in juds.get(pid, [])]
        alav = statistics.mean(jd) if jd else 1.5
        incert = (1 - 2 * abs(pmed - 0.5)) if pmed is not None else 2 / 3
        prioridade = round((tam / 3) * (alav / 3) * max(incert, 0.05) * ((testavel or 0) / 3), 3) if testavel is not None else None
        # desacordos
        def open_d(tipo, posicoes, resolveria):
            nonlocal n_d
            n_d += 1
            desac.append({"id": f"D-{n_d:03d}", "premissa": pid, "aberto_em": "R2" if tipo != "metodo" else "R4", "tipo": tipo,
                          "posicoes": posicoes, "o_que_resolveria": resolveria, "estado": "aberto", "resolucao": None, "fechado_em": None})
        refuta = next((x.get("teste_que_refuta", {}).get("descricao") for _, x in crits.get(pid, []) if x.get("teste_que_refuta")), None)
        if iqr is not None and iqr > 0.2:
            open_d("interpretacao", [{"cadeira": c, "posicao": f"p={r.get('prob_verdadeira')}: {r.get('alternativa', '')[:160]}"} for c, r in revs.get(pid, [])],
                   refuta or "teste com dado público, limiar pré-registrado")
        if "descarta" in vereditos and any(v in ("mantem", "reformula") for v in vereditos):
            open_d("valor_decisao", [{"cadeira": c, "posicao": f"{x.get('veredito')}: {x.get('contrario', '')[:160]}"} for c, x in crits.get(pid, [])],
                   refuta or "decisão humana em H2")
        if dif is not None and dif > 3:
            open_d("metodo", [{"cadeira": j, "posicao": f"nota {s}: {next((x.get('comentario') for jj, x in juds[pid] if jj == j), '')[:160]}"} for j, s in sums.items()],
                   "calibração dos juízes contra a nota humana (H2)")
        rows.append({"id": pid, "origem": p["origem"], "mercado": p.get("mercado"), "enunciado": p.get("enunciado"),
                     "nota_media": nota, "dif_juizes": dif, "notas_por_juiz": sums, "tetos": tetos,
                     "prob_mediana": pmed, "iqr": iqr, "n_prob": len(probs), "limiares": limiares,
                     "vereditos": vereditos, "replica": rep.get("resposta"), "classe": classe,
                     "prioridade_teste": prioridade, "duplicatas": p.get("duplicatas", []),
                     "desacordos": [d["id"] for d in desac if d["premissa"] == pid]})
    rows.sort(key=lambda r: -(r["prioridade_teste"] or 0))
    out = HERE / "R5"
    out.mkdir(exist_ok=True)
    agg = {"rodada": 1, "dossie": {"versao": dossie["versao"], "sha256": dossie["sha256"], "aprovado_h1": dossie.get("aprovado_h1")},
           "premissas": rows, "custo_usd": cost(),
           "avisos": ["juízes sem calibração humana (R4 pede 10 premissas avaliadas por uma pessoa)",
                      "junção de duplicadas feita por código, sem conferência humana",
                      "dossiê sem aprovação H1"]}
    (out / "agregado.json").write_text(json.dumps(agg, ensure_ascii=False, indent=1), encoding="utf-8")
    with open(out / "agregado.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["id", "origem", "mercado", "classe", "prioridade_teste", "nota_media", "dif_juizes", "prob_mediana", "iqr", "vereditos", "replica", "enunciado"])
        for r in rows:
            w.writerow([r["id"], r["origem"], r["mercado"], r["classe"], r["prioridade_teste"], r["nota_media"], r["dif_juizes"],
                        r["prob_mediana"], r["iqr"], "|".join(v or "" for v in r["vereditos"]), r["replica"], r["enunciado"]])
    with open(HERE / "desacordos.jsonl", "w", encoding="utf-8") as f:
        for d in desac:
            f.write(json.dumps(d, ensure_ascii=False) + "\n")
    # relatório: desacordos antes dos consensos (§6)
    L = [f"# Conselho, rodada 1: agregação (R5)", "",
         f"Dossiê {dossie['versao']} (sha256 {dossie['sha256'][:12]}). Gerado por código (`aggregate.py`), sem modelo.", "",
         "Avisos: " + "; ".join(agg["avisos"]) + ".", "",
         f"Custo medido nas cadeiras abertas (US$): {json.dumps(agg['custo_usd'])}. As cadeiras Claude rodaram como sessões do Claude Code, sem custo de API medido.", "",
         f"## Desacordos abertos ({len(desac)})", "", "| id | premissa | tipo | o que resolveria |", "|---|---|---|---|"]
    for d in desac:
        L.append(f"| {d['id']} | {d['premissa']} | {d['tipo']} | {(d['o_que_resolveria'] or '')[:140]} |")
    for classe in ("disputa", "consenso", "orfa"):
        sel = [r for r in rows if r["classe"] == classe]
        L += ["", f"## {classe.capitalize()} ({len(sel)})", "", "| id | prioridade | nota (0–18) | dif. juízes | p mediana | IQR | vereditos | réplica | enunciado |", "|---|---|---|---|---|---|---|---|---|"]
        for r in sel:
            L.append(f"| {r['id']} | {r['prioridade_teste']} | {r['nota_media']} | {r['dif_juizes']} | {r['prob_mediana']} | {r['iqr']} | "
                     f"{', '.join(v or '' for v in r['vereditos'])} | {r['replica'] or ''} | {(r['enunciado'] or '')[:150]} |")
    (out / "relatorio.md").write_text("\n".join(L) + "\n", encoding="utf-8")
    print(f"{len(rows)} premissas; {len(desac)} desacordos; custo {agg['custo_usd']}")


if __name__ == "__main__":
    main()
