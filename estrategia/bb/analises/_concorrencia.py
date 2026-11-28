"""Funções de concorrência para a Análise 8 (só stdlib): HHI e CR4, mínimos quadrados com erro-padrão por cluster,
função custo translog, Lerner, Boone e beta de captação, e leitura por entidade do IF.data em cache.

Nenhum pacote mantido faz Lerner, Boone ou beta de depósito (docs/sources/repos-metodos.md): o código é nosso e é
conferido contra números publicados (GFDD do Banco Mundial, REB do BCB, betas de Drechsler–Savov–Schnabl).
"""

import math
import re

import _comum as c

# ---------- concentração ----------

# BCB, Comunicado 22.322/2012 (Guia de Análise de Atos de Concentração), citado no REB 2023, apêndice do cap. 5:
# IHHn até 0,10 baixa; acima de 0,10 até 0,18 moderada; acima de 0,18 elevada. Em pontos (0–10.000): 1.000 e 1.800.
BCB_THRESH = (1000, 1800)
# CADE, Guia H (2016): 1.500 e 2.500 pontos, segundo a literatura secundária (o PDF do CADE não abriu em 28/11/2026).
CADE_THRESH = (1500, 2500)


def concentration(values):
    """values = {unidade: saldo}. Devolve HHI (0–10.000), CR4 (fração), nº de unidades, líder e sua parte,
    equivalente número (1/IHHn). Unidades com saldo ≤ 0 ficam fora."""
    v = {k: x for k, x in values.items() if x and x > 0}
    tot = sum(v.values())
    if not tot:
        return None
    sh = sorted(((x / tot, k) for k, x in v.items()), reverse=True)
    hhi = 10000 * sum(s * s for s, _ in sh)
    return {"hhi": hhi, "cr4": sum(s for s, _ in sh[:4]), "n": len(sh), "leader": sh[0][1], "leader_share": sh[0][0],
            "en": 10000 / hhi, "shares": {k: s for s, k in sh}, "total": tot}


def classify(hhi, thresh=BCB_THRESH):
    return "baixa" if hhi <= thresh[0] else "moderada" if hhi <= thresh[1] else "elevada"


def rank_of(shares, who):
    s = shares.get(who)
    return 1 + sum(1 for k, x in shares.items() if x > s) if s else None


def slope(xs, ys):
    """Inclinação de MQO simples (tendência por ano)."""
    n = len(xs)
    if n < 3:
        return None
    mx, my = sum(xs) / n, sum(ys) / n
    sxx = sum((x - mx) ** 2 for x in xs)
    return sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / sxx if sxx else None


# ---------- álgebra mínima ----------

def solve(a, b):
    """Resolve a·x = b (Gauss com pivô parcial). a: lista de listas k×k; b: lista k."""
    n = len(a)
    m = [row[:] + [b[i]] for i, row in enumerate(a)]
    for col in range(n):
        piv = max(range(col, n), key=lambda r: abs(m[r][col]))
        if abs(m[piv][col]) < 1e-12:
            raise ValueError("matriz singular")
        m[col], m[piv] = m[piv], m[col]
        for r in range(n):
            if r != col and m[r][col]:
                f = m[r][col] / m[col][col]
                for k in range(col, n + 1):
                    m[r][k] -= f * m[col][k]
    return [m[i][n] / m[i][i] for i in range(n)]


def inverse(a):
    n = len(a)
    cols = [solve(a, [1.0 if i == j else 0.0 for i in range(n)]) for j in range(n)]
    return [[cols[j][i] for j in range(n)] for i in range(n)]


def ols(y, x, clusters=None):
    """MQO. y: lista; x: lista de linhas (com a constante, se quiser). Erro-padrão robusto por cluster (CR1) se
    `clusters` for dado; senão, HC1. Devolve {"b", "se", "r2", "n", "resid"}."""
    n, k = len(y), len(x[0])
    xtx = [[0.0] * k for _ in range(k)]
    xty = [0.0] * k
    for row, yi in zip(x, y):
        for i in range(k):
            ri = row[i]
            if ri == 0:
                continue
            xty[i] += ri * yi
            for j in range(i, k):
                xtx[i][j] += ri * row[j]
    for i in range(k):
        for j in range(i):
            xtx[i][j] = xtx[j][i]
    b = solve(xtx, xty)
    res = [yi - sum(bi * xi for bi, xi in zip(b, row)) for row, yi in zip(x, y)]
    my = sum(y) / n
    sst = sum((yi - my) ** 2 for yi in y)
    r2 = 1 - sum(e * e for e in res) / sst if sst else None
    inv = inverse(xtx)
    groups = {}
    for idx, row in enumerate(x):
        g = clusters[idx] if clusters else idx
        acc = groups.setdefault(g, [0.0] * k)
        for i in range(k):
            acc[i] += row[i] * res[idx]
    meat = [[0.0] * k for _ in range(k)]
    for s in groups.values():
        for i in range(k):
            for j in range(k):
                meat[i][j] += s[i] * s[j]
    g = len(groups)
    adj = (g / (g - 1)) * ((n - 1) / (n - k)) if clusters else n / (n - k)
    v = [[adj * sum(inv[i][p] * sum(meat[p][q] * inv[q][j] for q in range(k)) for p in range(k)) for j in range(k)]
         for i in range(k)]
    return {"b": b, "se": [math.sqrt(max(v[i][i], 0)) for i in range(k)], "v": v, "r2": r2, "n": n, "resid": res,
            "clusters": g if clusters else None}


def quantile(xs, q):
    xs = sorted(xs)
    if not xs:
        return None
    pos = q * (len(xs) - 1)
    lo = int(pos)
    return xs[lo] + (xs[min(lo + 1, len(xs) - 1)] - xs[lo]) * (pos - lo)


# ---------- IF.data por entidade (cache bruto da camada) ----------

def extract_entities(specs, periods, level):
    """{(period, código no nível): {métrica: valor}} para todas as entidades do nível, lendo o JSON do IF.data em cache
    com as funções da camada. specs = [{"id", "report", "column"}] (regex; a primeira coluna que casa vale)."""
    idx, out = c.ifdata_index(), {}
    for p in periods:
        e = idx.get(p)
        base = c.IFS / "raw" / "ifdata" / str(p)
        if not e or not (base / f"cadastro{p}_{level}.json.gz").exists():
            continue
        info = c._gz_json(base / f"info{p}.json.gz")
        res = c._ifd.resolve_metrics(e, info, specs, [level])
        groups = sorted({s["a"] for s in res.get(level, {}).values()})
        dados = {a: c._gz_json(base / f"dados{p}_{a}.json.gz") for a in groups
                 if (base / f"dados{p}_{a}.json.gz").exists()}
        cad = {level: c._gz_json(base / f"cadastro{p}_{level}.json.gz")}
        for _, code, mid, v in c._ifd.extract_values(dados, cad, res, {str(level): "all"}):
            out.setdefault((p, code), {})[mid] = v
    return out


def entity_types(con, level):
    """{(period, código): (tcb, nome)} do cadastro do nível."""
    return {(p, cd): (t, n) for p, cd, t, n in con.execute(
        "SELECT period, code, tcb, name FROM ifdata_entities WHERE level=?", (level,))}


def quarter_flow(get, p):
    """Fluxo do trimestre terminado em p a partir do acumulado no semestre do IF.data
    (mar = jan–mar, jun = jan–jun, set = jul–set, dez = jul–dez). get(período) → valor ou None."""
    m = p % 100
    if m in (3, 9):
        return get(p)
    a, b = get(p), get(p - 3)
    return None if a is None or b is None else a - b


def next_q(p):
    return p + 3 if p % 100 < 12 else (p // 100 + 1) * 100 + 3


def prev_q(p):
    return p - 3 if p % 100 > 3 else (p // 100 - 1) * 100 + 12


def cdi_quarter_aa(cdi, p):
    """CDI do trimestre terminado em p, anualizado de forma simples (×4), em fração."""
    first = p - 2
    k = c.cdi_compound(cdi, first, p)
    return None if k is None else 4 * k


# ---------- translog e Lerner ----------

TRANSLOG_TERMS = ["lnq", "lnq2", "lnw1", "lnw2", "lnw1_2", "lnw2_2", "lnw1w2", "lnq_lnw1", "lnq_lnw2"]


def translog_row(q, w1, w2, w3):
    """Termos da translog com homogeneidade de grau 1 nos preços imposta (preços divididos por w3)."""
    lq, l1, l2 = math.log(q), math.log(w1 / w3), math.log(w2 / w3)
    return [lq, 0.5 * lq * lq, l1, l2, 0.5 * l1 * l1, 0.5 * l2 * l2, l1 * l2, lq * l1, lq * l2]


def cost_elasticity(b, q, w1, w2, w3):
    """∂ln(TC)/∂ln(Q) com os coeficientes [lnq, lnq2, ..., lnq_lnw1, lnq_lnw2] (sem constante nem efeitos de ano)."""
    lq, l1, l2 = math.log(q), math.log(w1 / w3), math.log(w2 / w3)
    return b[0] + b[1] * lq + b[7] * l1 + b[8] * l2


def fit_translog(obs, year_fe=True, cluster_key="code"):
    """obs = [{"q", "tc", "w1", "w2", "w3", "ano", ...}]. ln(TC/w3) = translog + efeitos de ano.
    Devolve o ajuste e, em cada observação, `elast` (elasticidade do custo ao produto) e `mc` (custo marginal)."""
    years = sorted({o["ano"] for o in obs})
    x, y, cl = [], [], []
    for o in obs:
        row = [1.0] + translog_row(o["q"], o["w1"], o["w2"], o["w3"])
        if year_fe:
            row += [1.0 if o["ano"] == yy else 0.0 for yy in years[1:]]
        x.append(row)
        y.append(math.log(o["tc"] / o["w3"]))
        cl.append(o[cluster_key])
    fit = ols(y, x, cl)
    b = fit["b"][1:1 + len(TRANSLOG_TERMS)]
    for o in obs:
        o["elast"] = cost_elasticity(b, o["q"], o["w1"], o["w2"], o["w3"])
        o["mc"] = o["elast"] * o["tc"] / o["q"]
        o["price"] = o["tr"] / o["q"]
        o["lerner"] = (o["price"] - o["mc"]) / o["price"]
    fit["names"] = ["const"] + TRANSLOG_TERMS + [f"ano_{yy}" for yy in years[1:]] if year_fe else []
    return fit


def weighted_mean(pairs):
    w = sum(p[1] for p in pairs)
    return sum(p[0] * p[1] for p in pairs) / w if w else None


def boone(obs, ykey, positive_only=True):
    """Boone por ano: inclinação de ln(y) contra ln(custo marginal), MQO com constante, ano a ano.
    ykey = "roa" (definição do GFDD: elasticidade do lucro ao custo marginal) ou "share" (participação no ativo)."""
    out = {}
    for yy in sorted({o["ano"] for o in obs}):
        pts = [(math.log(o["mc"]), math.log(o[ykey])) for o in obs
               if o["ano"] == yy and o["mc"] > 0 and (o.get(ykey) or 0) > 0]
        if len(pts) < 15:
            continue
        fit = ols([p[1] for p in pts], [[1.0, p[0]] for p in pts])
        out[yy] = {"beta": fit["b"][1], "se": fit["se"][1], "n": fit["n"]}
    return out


def norm(s):
    return re.sub(r"\s+", " ", s or "").strip()
