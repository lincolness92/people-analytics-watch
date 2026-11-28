"""Executor do conselho de modelos (protocolo em estrategia/bb/03-conselho.md).

As cadeiras de modelos abertos rodam aqui, pelo roteador de preço de src/pawatch/llm.py, com o modelo fixado por
cadeira. As cadeiras Claude (c1, c2) rodam como sessões do Claude Code com o mesmo prompt, que este script grava em
arquivo (`prompt`), e gravam a resposta no mesmo formato. Toda chamada fica em R<n>/chamadas.jsonl (rota, tokens,
custo) e no trace do repositório (data/traces/).

Uso:
  python estrategia/bb/conselho/council.py prompt r1a            # grava R1/prompt_r1a.md
  python estrategia/bb/conselho/council.py run r1a c3 c4 c5      # roda as cadeiras abertas
  python estrategia/bb/conselho/council.py prompt r1b ; run r1b c3 c4 c5
  python estrategia/bb/conselho/council.py merge                 # junta premissas (R2/premissas.jsonl)
  python estrategia/bb/conselho/council.py prompt r2 --chair c3 ; run r2 c3 c4 c5
  python estrategia/bb/conselho/council.py run r3 c3 c4 c5       # réplica dos autores
  python estrategia/bb/conselho/council.py run r4 c3             # juiz aberto
  python estrategia/bb/conselho/council.py aggregate             # R5, por código
"""
import argparse
import json
import os
import pathlib
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[2]
sys.path.insert(0, str(ROOT / "src"))

CHAIRS = json.loads((HERE / "cadeiras.json").read_text(encoding="utf-8"))  # c1..c5 → modelo (não vai aos críticos)
FAMILY = {c: v["familia"] for c, v in CHAIRS.items()}
DOSSIE = HERE / "R0" / "dossie.json"
V0 = ROOT / "estrategia/bb/01-premissas.md"

Q0 = "Como o BB volta a gerar retorno acima do custo de capital sem perder o que só ele tem?"

REGRAS = """Regras do conselho (valem para tudo):
1. Use só o dossiê abaixo. Não use memória sobre números. Número que não está no dossiê não pode aparecer como fato;
   se for necessário, diga qual série pública o produziria.
2. Só informação pública. Nada interno do BB; se você "souber algo de dentro", não use.
3. Não dê magnitudes de cabeça (elasticidade, probabilidade de evento, participação futura): diga como medir.
4. Escreva em português do Brasil, frases curtas, sem jargão desnecessário.
5. Responda só com um objeto JSON válido, sem texto antes ou depois."""

ESQUEMA_PREMISSA = """{"id": "N01", "mercado": "agro|varejo_pf|empresas|captacao|servicos|capital|canais|regulacao|outro",
 "enunciado": "afirmação testável, uma frase", "por_que_importa": "...",
 "teste": {"fontes": ["ids ou nomes das fontes do dossiê"], "metrica": "...", "periodo": "...", "comparacao": "controle, placebo ou grupo de comparação"},
 "confirma_se": "limiar numérico fixado antes", "refuta_se": "limiar numérico fixado antes",
 "decisao": {"se_verdadeira": "decisão nomeada", "se_falsa": "decisão nomeada diferente"},
 "fatos": ["F-0xx", "..."], "valor_decisao": {"tamanho": 1, "incerteza": 1, "alavanca": 1}}"""


def dossie_text(ids=None):
    d = json.loads(DOSSIE.read_text(encoding="utf-8"))
    facts = d["fatos"] if ids is None else [f for f in d["fatos"] if f["id"] in ids]
    keep = ("id", "tema", "afirmacao", "valor", "unidade", "data", "fonte", "ressalvas", "confianca")
    slim = [{k: f.get(k) for k in keep} for f in facts]
    out = {"versao": d["versao"], "sha256": d["sha256"], "fatos": slim}
    if ids is None:
        out["fontes_disponiveis"] = [s["fonte"] for s in d["fontes_disponiveis"]]
    return json.dumps(out, ensure_ascii=False)


def v0_text():
    s = V0.read_text(encoding="utf-8")
    return s[s.index("## A."):]


def prompt_r1a():
    return f"""{REGRAS}

Tarefa (rodada R1, braço A, geração independente). Pergunta central (Q0): "{Q0}"

Com base só no dossiê, entregue:
1. "arvore": a sua árvore de perguntas que respondem Q0 (até 3 níveis, até 25 nós), cada nó {{"id","pergunta","filhas":[...]}}.
2. "premissas": as 15 premissas testáveis de maior valor de decisão, no esquema:
{ESQUEMA_PREMISSA}
   Use ids N01…N15. "valor_decisao": notas de 1 a 3 para tamanho (resultado ou capital em jogo), incerteza
   (evidência dividida hoje) e alavanca (verdadeiro e falso levam a decisões diferentes).
   Cubra mercados diferentes, inclusive onde o BB ganha ou tem vantagem que outros não podem copiar.
3. "lacunas": até 10 dados públicos que faltam no dossiê e mudariam a análise (com a fonte que os teria).
4. "leitura": até 120 palavras com a sua leitura do problema, separando o que é agudo do que é estrutural.

DOSSIÊ (congelado):
{dossie_text()}"""


def prompt_r1b():
    return f"""{REGRAS}

Tarefa (rodada R1, braço B, revisão). Abaixo está o registro v0 de premissas (P01…P55), escrito por outra
pessoa antes do dossiê. Para CADA premissa, devolva:
{{"premissa": "P01", "prob_verdadeira": 0.0-1.0, "alternativa": "melhor explicação alternativa para a evidência",
 "teste_decisivo": "o teste mais decisivo, com fonte", "limiar": "frouxo|justo|apertado",
 "numeros_sem_fonte": ["números do texto que não estão no dossiê ou não conferem"]}}
Formato: {{"revisoes": [ ... 55 itens, na ordem ... ]}}. Seja breve em cada campo (até 40 palavras).
Os números marcados [IFD] e [EST] no registro foram recalculados por código no dossiê: confira contra ele.

DOSSIÊ (congelado):
{dossie_text()}

REGISTRO v0:
{v0_text()}"""


def call_dir(rnd):
    d = HERE / rnd.upper()[:2]
    d.mkdir(parents=True, exist_ok=True)
    return d


def log_call(rnd, chair, task, client, t0, ok, err=None):
    rec = {"rodada": rnd, "cadeira": chair, "tarefa": task, "rota": client.used_model, "ok": ok,
           "segundos": round(time.time() - t0, 1), "erro": (str(err)[:300] if err else None), **client.usage}
    with open(call_dir(rnd) / "chamadas.jsonl", "a", encoding="utf-8") as f:
        f.write(json.dumps(rec, ensure_ascii=False) + "\n")
    return rec


def ask(rnd, chair, task, prompt, max_tokens):
    from pawatch import llm as L
    client = L.LLM(models=[CHAIRS[chair]["modelo"]])
    t0 = time.time()
    try:
        out = client.json("Você é membro de um conselho de análise estratégica baseado em evidência pública.", prompt,
                          max_tokens=max_tokens, temperature=0.4, timeout=900,
                          reasoning=CHAIRS[chair].get("reasoning", "medium"))
        log_call(rnd, chair, task, client, t0, True)
        return out
    except Exception as e:  # noqa: BLE001 — a cadeira fica registrada como ausente neste item
        log_call(rnd, chair, task, client, t0, False, e)
        return None


def run_r1(arm, chairs):
    prompt = prompt_r1a() if arm == "r1a" else prompt_r1b()
    out_dir = call_dir("r1")

    def one(c):
        out = ask("r1", c, arm, prompt, 24000)
        if out is not None:
            (out_dir / f"{c}_{arm}.json").write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
        return c, out is not None

    with ThreadPoolExecutor(len(chairs)) as ex:
        for c, ok in ex.map(one, chairs):
            print(c, "ok" if ok else "FALHOU")



# ---------------------------------------------------------------- junção (entrada de R2)

MERCADO_V0 = {"A": "agro", "B": "varejo_pf", "C": "captacao", "D": "setor_publico_rede", "E": "empresas", "F": "canais",
              "G": "conglomerado", "H": "eficiencia_dados", "I": "capital_regulacao"}


def parse_v0():
    """Registro v0 (markdown) → premissas no esquema da seção 5 (texto livre preservado em campos)."""
    s = V0.read_text(encoding="utf-8")
    out, sec = [], "outro"
    blocks = re.split(r"\n(?=### P\d\d |## [A-Z]\. )", s)
    for b in blocks:
        m = re.match(r"## ([A-Z])\. (.*)", b)
        if m:
            sec = MERCADO_V0.get(m.group(1), "outro") + ":" + m.group(2).strip().split("\n")[0]
            continue
        m = re.match(r"### (P\d\d)(?: \[top 10\])? (.*)", b)
        if not m:
            continue
        def field(name):
            f = re.search(r"\*\*" + name + r"\.?\*\*\.?\s*(.*?)(?=\n- \*\*|\Z)", b, flags=re.S)
            return re.sub(r"\s+", " ", f.group(1)).strip() if f else ""
        conf = re.search(r"\*\*Confirma se\*\*(.*?)\*\*Refuta se\*\*(.*?)(?=\n- \*\*|\Z)", b, flags=re.S)
        dec = field("Decisão")
        dv = re.split(r"Falsa →", dec)
        out.append({"id": m.group(1), "origem": "v0", "autor": "c2", "titulo": m.group(2).strip(),
                    "mercado": sec.split(":")[0], "enunciado": field("Enunciado"), "por_que_importa": field("Por que importa"),
                    "teste": {"descricao": field("Como testar")},
                    "confirma_se": re.sub(r"\s+", " ", conf.group(1)).strip(" .") if conf else "",
                    "refuta_se": re.sub(r"\s+", " ", conf.group(2)).strip(" .") if conf else "",
                    "decisao": {"se_verdadeira": dv[0].replace("Verdadeira →", "").strip(" ."),
                                "se_falsa": dv[1].strip(" .") if len(dv) > 1 else ""},
                    "hoje": field("Hoje"), "fatos": []})
    return out


def _tokens(t):
    return {w for w in re.findall(r"[a-zà-ú0-9]{4,}", (t or "").lower())}


def jaccard(a, b):
    a, b = _tokens(a), _tokens(b)
    return len(a & b) / max(1, len(a | b))


def merge(threshold=0.5):
    prem = parse_v0()
    r1 = HERE / "R1"
    for f in sorted(r1.glob("c*_r1a.json")):
        chair = f.name.split("_")[0]
        d = json.loads(f.read_text(encoding="utf-8"))
        for p in d.get("premissas", []):
            p = dict(p)
            p["id"] = f"{chair.upper()}-{p.get('id', 'N??')}"
            p.update(origem="R1A", autor=chair)
            prem.append(p)
    # duplicatas: mesmo enunciado em palavras (junção por código; conferência humana pendente)
    groups, rep = [], {}
    for p in prem:
        best = None
        for g in groups:
            # conservador: juntar errado é pior que deixar duplicada (a conferência humana acha as que sobrarem)
            if p.get("mercado") == g[0].get("mercado") and p["autor"] != g[0]["autor"] \
                    and jaccard(p["enunciado"], g[0]["enunciado"]) >= threshold:
                best = g
                break
        (best.append(p) if best else groups.append([p]))
    merged = []
    for g in groups:
        head = dict(g[0])
        head["duplicatas"] = [x["id"] for x in g[1:]]
        head["autores_todos"] = sorted({x["autor"] for x in g})
        merged.append(head)
    out = HERE / "R2"
    out.mkdir(exist_ok=True)
    with open(out / "premissas.jsonl", "w", encoding="utf-8") as f:
        for p in merged:
            f.write(json.dumps(p, ensure_ascii=False) + "\n")
    print(f"{len(prem)} premissas → {len(merged)} depois da junção (limiar Jaccard {threshold})")


def load_premissas():
    return [json.loads(l) for l in open(HERE / "R2" / "premissas.jsonl", encoding="utf-8")]


def facts_for(p, k=8):
    d = json.loads(DOSSIE.read_text(encoding="utf-8"))
    ids = [x for x in p.get("fatos", []) if isinstance(x, str)]
    text = " ".join([p.get("enunciado", ""), p.get("por_que_importa", ""), json.dumps(p.get("teste", {}), ensure_ascii=False), p.get("hoje", "")])
    scored = sorted(d["fatos"], key=lambda f: -jaccard(text, f["afirmacao"]))
    for f in scored:
        if len(ids) >= k:
            break
        if f["id"] not in ids:
            ids.append(f["id"])
    return ids[:k + 4]


def anon(p):
    keep = ("id", "mercado", "enunciado", "por_que_importa", "teste", "confirma_se", "refuta_se", "decisao", "hoje")
    return {k: p[k] for k in keep if k in p and p[k]}


# ---------------------------------------------------------------- R2 crítica cega

ROTEIRO = """Roteiro obrigatório do crítico, nesta ordem, para cada premissa:
1. "contrario": o melhor argumento a favor do contrário da premissa;
2. "alternativa": a explicação alternativa mais plausível para a evidência citada;
3. "riscos_de_dado": o que pode estar errado nos dados (perímetro, quebra de série, dupla contagem, defasagem, seleção);
4. "teste_que_refuta": {"fontes": [...], "descricao": "o teste mais barato que refutaria a premissa"};
5. "limiar_manipulavel": true/false (o limiar pode ser escolhido depois de ver o dado?);
6. "decisao_muda": true/false (a decisão realmente muda entre verdadeiro e falso?);
7. "veredito": "mantem|reformula|divide|funde|descarta", e "texto_novo" (enunciado reescrito, ou null).
Cada campo com até 50 palavras."""


def assign_critics(prem, pool=("c1", "c3", "c4", "c5")):
    """2 críticos por premissa, de famílias diferentes da do autor e entre si; distribuição equilibrada."""
    load = {c: 0 for c in pool}
    plan = {}
    for p in prem:
        fams = {FAMILY[a] for a in p.get("autores_todos", [p["autor"]])}
        cands = sorted([c for c in pool if FAMILY[c] not in fams], key=lambda c: (load[c], c))
        chosen = []
        for c in cands:
            if all(FAMILY[c] != FAMILY[x] for x in chosen):
                chosen.append(c)
            if len(chosen) == 2:
                break
        for c in chosen:
            load[c] += 1
        plan[p["id"]] = chosen
    return plan, load


def chunks(xs, n):
    return [xs[i:i + n] for i in range(0, len(xs), n)]


def prompt_r2(items):
    d = json.loads(DOSSIE.read_text(encoding="utf-8"))
    ids = sorted({i for p in items for i in facts_for(p)})
    return f"""{REGRAS}

Tarefa (rodada R2, crítica cega). Você é o red team. Não sabe quem escreveu as premissas abaixo. Ataque cada uma
com rigor e honestidade: se a premissa for boa, diga, mas procure o ponto fraco.
{ROTEIRO}
Formato: {{"criticas": [{{"premissa": "<id>", "contrario": "...", "alternativa": "...", "riscos_de_dado": ["..."],
 "teste_que_refuta": {{"fontes": ["..."], "descricao": "..."}}, "limiar_manipulavel": true, "decisao_muda": true,
 "veredito": "mantem", "texto_novo": null}}, ...]}} — um item por premissa, na ordem.

FATOS DO DOSSIÊ LIGADOS A ESTAS PREMISSAS:
{dossie_text(ids)}

PREMISSAS:
{json.dumps([anon(p) for p in items], ensure_ascii=False)}"""


def r2_jobs(size=8):
    prem = load_premissas()
    plan, load = assign_critics(prem)
    by_critic = {}
    for p in prem:
        for c in plan[p["id"]]:
            by_critic.setdefault(c, []).append(p)
    jobs = []
    for c, items in by_critic.items():
        for i, ch in enumerate(chunks(items, size)):
            jobs.append((c, f"r2_{c}_{i:02d}", ch))
    (HERE / "R2" / "plano_criticos.json").write_text(json.dumps({"plano": plan, "carga": load}, ensure_ascii=False, indent=1), encoding="utf-8")
    return jobs


# ---------------------------------------------------------------- R3 réplica

def prompt_r3(items, crits):
    return f"""{REGRAS}

Tarefa (rodada R3, réplica). Você escreveu as premissas abaixo. Cada uma recebeu duas críticas anônimas. Para cada
premissa, responda uma única vez: "aceita" (e reformula), "aceita_em_parte" (e reformula) ou "contesta" (com argumento).
Formato: {{"replicas": [{{"premissa": "<id>", "resposta": "aceita|aceita_em_parte|contesta", "argumento": "até 60 palavras",
 "enunciado_novo": "texto ou null", "confirma_se_novo": "texto ou null", "refuta_se_novo": "texto ou null"}}, ...]}}

PREMISSAS E CRÍTICAS:
{json.dumps([{"premissa": anon(p), "criticas": crits.get(p["id"], [])} for p in items], ensure_ascii=False)}"""


def load_criticas():
    out = {}
    for f in sorted((HERE / "R2").glob("r2_*.json")):
        d = json.loads(f.read_text(encoding="utf-8"))
        for c in d.get("criticas", []):
            c2 = {k: v for k, v in c.items() if k != "critico"}
            out.setdefault(c.get("premissa"), []).append(c2)
    return out


def r3_jobs(size=10):
    prem = load_premissas()
    by_author = {}
    for p in prem:
        by_author.setdefault(p["autor"], []).append(p)
    return [(a, f"r3_{a}_{i:02d}", ch) for a, items in by_author.items() for i, ch in enumerate(chunks(items, size))]


# ---------------------------------------------------------------- R4 juízes

RUBRICA = """Rubrica, nota de 0 a 3 em cada critério:
- testavel: 0 = não há fonte pública que meça; 3 = fonte, série, métrica, período e comparação nomeados e existentes no dossiê.
- refutavel: 0 = qualquer resultado confirma; 3 = limiar numérico de confirmação e de refutação, fixado antes.
- decisoria: 0 = verdadeira ou falsa, nada muda; 3 = cada resultado leva a uma decisão diferente e nomeada.
- fundamentada: 0 = fato sem fonte ou número inventado; 3 = todo fato citado está no dossiê e confere.
- so_publico: 0 = depende de dado interno do banco; 3 = depende só de fonte pública.
- confundimento: 0 = ignora a explicação alternativa óbvia; 3 = o teste separa a premissa da alternativa (controle, placebo, comparação).
Confira pelo menos 3 números de cada premissa contra os fatos do dossiê. Se achar número sem apoio, liste em
"sem_apoio" e aplique teto: "fundamentada" no máximo 1 e soma no máximo 12 ("teto_aplicado": true).
Não dê nota alta a texto bem escrito e mal fundamentado."""


def prompt_r4(items):
    ids = sorted({i for p in items for i in facts_for(p)})
    return f"""{REGRAS}

Tarefa (rodada R4, julgamento). Você é juiz. Não sabe quem escreveu as premissas nem quem as criticou. A versão
abaixo já incorpora a réplica do autor, quando houve.
{RUBRICA}
Formato: {{"julgamentos": [{{"premissa": "<id>", "notas": {{"testavel": 0, "refutavel": 0, "decisoria": 0,
 "fundamentada": 0, "so_publico": 0, "confundimento": 0}}, "citacoes_conferidas": ["F-0xx"], "sem_apoio": ["..."],
 "teto_aplicado": false, "comentario": "até 40 palavras"}}, ...]}}

FATOS DO DOSSIÊ LIGADOS A ESTAS PREMISSAS:
{dossie_text(ids)}

PREMISSAS:
{json.dumps([anon(p) for p in items], ensure_ascii=False)}"""


def current_version(prem):
    """Premissas com a réplica aplicada (enunciado e limiares novos, quando o autor reformulou)."""
    reps = {}
    for f in sorted((HERE / "R3").glob("r3_*.json")):
        for r in json.loads(f.read_text(encoding="utf-8")).get("replicas", []):
            reps[r.get("premissa")] = r
    out = []
    for p in prem:
        q = dict(p)
        r = reps.get(p["id"])
        if r and r.get("resposta") in ("aceita", "aceita_em_parte"):
            for k_new, k in (("enunciado_novo", "enunciado"), ("confirma_se_novo", "confirma_se"), ("refuta_se_novo", "refuta_se")):
                if r.get(k_new):
                    q[k] = r[k_new]
        q["replica"] = r
        out.append(q)
    return out


def r4_jobs(judges, size=10):
    prem = current_version(load_premissas())
    return [(j, f"r4_{j}_{i:02d}", ch) for j in judges for i, ch in enumerate(chunks(prem, size))]


def write_prompt_files(rnd, jobs, builder):
    d = call_dir(rnd)
    for chair, name, items in jobs:
        (d / f"prompt_{name}.md").write_text(builder(items), encoding="utf-8")
    return d


def run_jobs(rnd, jobs, builder, chairs, max_tokens=None, workers=6):
    max_tokens = max_tokens or int(os.environ.get("PAW_COUNCIL_MAX_TOKENS", "16000"))
    d = call_dir(rnd)
    todo = [(c, n, it) for c, n, it in jobs if c in chairs and not (d / f"{n}.json").exists()]

    def one(job):
        c, n, items = job
        out = ask(rnd, c, n, builder(items), max_tokens)
        if out is not None:
            (d / f"{n}.json").write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
        return n, out is not None

    with ThreadPoolExecutor(workers) as ex:
        for n, ok in ex.map(one, todo):
            print(n, "ok" if ok else "FALHOU", flush=True)


def stage(rnd, chairs):
    if rnd == "r2":
        return r2_jobs(), prompt_r2
    if rnd == "r3":
        crits = load_criticas()
        return r3_jobs(), lambda items: prompt_r3(items, crits)
    if rnd == "r4":
        return r4_jobs(chairs or ["c1", "c3"]), prompt_r4
    raise SystemExit(f"rodada desconhecida: {rnd}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd")
    ap.add_argument("arg", nargs="?")
    ap.add_argument("chairs", nargs="*")
    a = ap.parse_args()
    from pawatch import trace
    if a.cmd == "prompt":
        if a.arg in ("r1a", "r1b"):
            text = {"r1a": prompt_r1a, "r1b": prompt_r1b}[a.arg]()
            p = call_dir(a.arg) / f"prompt_{a.arg}.md"
            p.write_text(text, encoding="utf-8")
            print(p, len(text) // 3, "tokens aprox")
        else:
            jobs, builder = stage(a.arg, a.chairs)
            mine = [j for j in jobs if not a.chairs or j[0] in a.chairs]
            d = write_prompt_files(a.arg, mine, builder)
            print(d, [j[1] for j in mine])
    elif a.cmd == "merge":
        merge()
    elif a.cmd == "aggregate":
        import aggregate
        aggregate.main()
    elif a.cmd == "run":
        trace.start_run(f"conselho.{a.arg}")
        try:
            if a.arg in ("r1a", "r1b"):
                run_r1(a.arg, a.chairs)
            else:
                jobs, builder = stage(a.arg, a.chairs)
                run_jobs(a.arg, jobs, builder, a.chairs)
        finally:
            trace.end_run()


if __name__ == "__main__":
    main()
