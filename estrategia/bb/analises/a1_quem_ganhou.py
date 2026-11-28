"""Análise 1. Quem ficou com cada ponto percentual que o BB perdeu.

(a) Variação de participação por instituição e grupo, por produto e região, em três janelas.
(b) Decomposição da variação do BB no crédito total em efeito de mix e efeito competitivo (shift-share).
(c) Teste de quebra estrutural na participação do BB no rural PF.

Fonte: data/ifs/shares/national_ifdata.csv (IF.data/BCB, trimestral, 03/2016 a 06/2026). Rodar:
    python estrategia/bb/analises/a1_quem_ganhou.py
"""

import random

import sys

sys.dont_write_bytecode = True  # não grava .pyc em src/ (a camada de dados é só leitura)
import _comum as c  # noqa: E402

PF = ["pf_consignado", "pf_nao_consignado", "pf_cartao", "pf_habitacao", "pf_veiculos", "pf_rural", "pf_outros"]
PJ = ["pj_capital_giro", "pj_investimento", "pj_cheque_especial", "pj_recebiveis", "pj_comex", "pj_infraestrutura",
      "pj_rural", "pj_habitacional", "pj_outros"]
REG = ["reg_sudeste", "reg_sul", "reg_nordeste", "reg_centro_oeste", "reg_norte"]
PRODUCTS = ["credito_pf_pj", "pf_total"] + PF + ["pj_total"] + PJ + ["pj_micro", "pj_pequena", "credito_rural"] + REG
# carteira de tomadores no exterior: entra no total por modalidade, mas não em nenhuma modalidade
EXT = [{"id": "pf_exterior", "report": "Física - modalidade", "column": "^Total Exterior Pessoa Física$"},
       {"id": "pj_exterior", "report": "Jurídica - modalidade", "column": "^Total Exterior Pessoa Jurídica$"}]
WINDOWS = [(201603, 201912), (201912, 202312), (202312, 202606), (201603, 202606)]


def window_tables(nat, names):
    rows, who = [], []
    for m in PRODUCTS:
        for a, b in WINDOWS:
            da, db_ = nat.get((a, m)), nat.get((b, m))
            if not da or not db_:
                continue
            sa, sb = c.shares(da), c.shares(db_)
            for i in sorted(set(sa) | set(sb)):
                rows.append({"metric": m, "base": a, "fim": b, "inst_id": i, "grupo": c.group_of(i),
                             "share_base_pct": c.pp(sa.get(i, 0)), "share_fim_pct": c.pp(sb.get(i, 0)),
                             "delta_pp": c.pp(sb.get(i, 0) - sa.get(i, 0))})
            ga, gb = c.group_shares(da), c.group_shares(db_)
            d_bb = sb.get("bb", 0) - sa.get("bb", 0)
            gains = sorted(((sb.get(i, 0) - sa.get(i, 0), i) for i in set(sa) | set(sb)
                            if i not in ("bb", "_demais")), reverse=True)[:3]
            r = {"metric": m, "janela": f"{c.fmt_period(a)}-{c.fmt_period(b)}",
                 "sistema_fim_bi": round(db_["total"] / 1e9, 1),
                 "crescimento_sistema_pct": round(100 * (db_["total"] / da["total"] - 1), 1),
                 "bb_base_pct": c.pp(sa.get("bb", 0)), "bb_fim_pct": c.pp(sb.get("bb", 0)), "bb_delta_pp": c.pp(d_bb),
                 "nivel": f"{da['level']}->{db_['level']}"}
            for g in c.GROUP_ORDER[1:]:
                r[f"d_{g}"] = c.pp(gb.get(g, 0) - ga.get(g, 0))
            r["top3_ganhadores"] = "; ".join(f"{names.get(i, i)} {c.pp(d):+.1f}" for d, i in gains)
            who.append(r)
    return rows, who


def shift_share(nat, a, b, cells, total_metric):
    """ΔS_BB = Σ Δw·s̄ (mix) + Σ w̄·Δs (competitivo), pesos w = participação da célula no total do sistema.
    O total usado é a soma das células (o resíduo para o total oficial é informado à parte)."""
    def state(p):
        tot = sum(nat[(p, m)]["total"] for m in cells)
        return {m: (nat[(p, m)]["total"] / tot, nat[(p, m)]["v"].get("bb", 0) / nat[(p, m)]["total"]) for m in cells}, tot
    sa, ta = state(a)
    sb, tb = state(b)
    mix = sum((sb[m][0] - sa[m][0]) * (sa[m][1] + sb[m][1]) / 2 for m in cells)
    comp = sum((sa[m][0] + sb[m][0]) / 2 * (sb[m][1] - sa[m][1]) for m in cells)
    s_a = sum(w * s for w, s in sa.values())
    s_b = sum(w * s for w, s in sb.values())
    per = [{"celula": m, "peso_base_pct": c.pp(sa[m][0]), "peso_fim_pct": c.pp(sb[m][0]),
            "bb_base_pct": c.pp(sa[m][1]), "bb_fim_pct": c.pp(sb[m][1]),
            "mix_pp": c.pp((sb[m][0] - sa[m][0]) * (sa[m][1] + sb[m][1]) / 2),
            "competitivo_pp": c.pp((sa[m][0] + sb[m][0]) / 2 * (sb[m][1] - sa[m][1]))} for m in cells]
    off = {p: nat[(p, total_metric)]["total"] for p in (a, b)} if total_metric else {}
    return {"delta_pp": c.pp(s_b - s_a), "mix_pp": c.pp(mix), "competitivo_pp": c.pp(comp),
            "competitivo_frac_da_variacao": round(comp / (s_b - s_a), 3) if s_b != s_a else None,
            "residuo_celulas_vs_total_oficial_pct": {str(p): round(100 * (t / off[p] - 1), 2)
                                                     for p, t in ((a, ta), (b, tb))} if off else None}, per


# ---------- regressão (stdlib) ----------

def solve(A, y):
    n = len(A)
    M = [row[:] + [y[i]] for i, row in enumerate(A)]
    for i in range(n):
        p = max(range(i, n), key=lambda r: abs(M[r][i]))
        M[i], M[p] = M[p], M[i]
        for r in range(n):
            if r != i:
                f = M[r][i] / M[i][i]
                M[r] = [x - f * z for x, z in zip(M[r], M[i])]
    return [M[i][n] / M[i][i] for i in range(n)]


def inv(A):
    n = len(A)
    return [list(col) for col in zip(*[solve(A, [1.0 if r == j else 0.0 for r in range(n)]) for j in range(n)])]


def ols(X, y):
    k = len(X[0])
    XtX = [[sum(x[i] * x[j] for x in X) for j in range(k)] for i in range(k)]
    Xty = [sum(x[i] * yy for x, yy in zip(X, y)) for i in range(k)]
    b = solve(XtX, Xty)
    e = [yy - sum(bi * xi for bi, xi in zip(b, x)) for x, yy in zip(X, y)]
    return b, e, inv(XtX)


def newey_west_se(X, e, XtXi, lags=4):
    k, n = len(X[0]), len(X)
    S = [[sum(e[t] ** 2 * X[t][i] * X[t][j] for t in range(n)) for j in range(k)] for i in range(k)]
    for L in range(1, lags + 1):
        w = 1 - L / (lags + 1)
        for i in range(k):
            for j in range(k):
                S[i][j] += w * sum(e[t] * e[t - L] * (X[t][i] * X[t - L][j] + X[t - L][i] * X[t][j])
                                   for t in range(L, n))
    V = [[sum(XtXi[i][a] * S[a][b] * XtXi[b][j] for a in range(k) for b in range(k)) for j in range(k)]
         for i in range(k)]
    return [V[i][i] ** 0.5 for i in range(k)]


def design(periods, tau=None):
    X = []
    for t, p in enumerate(periods):
        q = (p % 100) // 3
        row = [1.0, t, float(q == 2), float(q == 3), float(q == 4)]
        if tau is not None:
            row += [float(t >= tau), float(max(0, t - tau))]
        X.append(row)
    return X


def ssr(X, y):
    return sum(v * v for v in ols(X, y)[1])


def sup_f(periods, y, trim=0.15):
    n = len(y)
    s0 = ssr(design(periods), y)
    best = (0.0, None)
    k1 = len(design(periods, 1)[0])
    for tau in range(int(trim * n), int((1 - trim) * n)):
        s1 = ssr(design(periods, tau), y)
        F = ((s0 - s1) / 2) / (s1 / (n - k1))
        best = max(best, (F, tau))
    return best


def break_tests(nat):
    periods = sorted(p for (p, m) in nat if m == "pf_rural")
    y = [100 * nat[(p, "pf_rural")]["v"]["bb"] / nat[(p, "pf_rural")]["total"] for p in periods]
    out = {"serie": [{"period": p, "bb_pf_rural_pct": round(v, 2)} for p, v in zip(periods, y)]}
    # 1) regra de leitura: a queda é significativa antes de 12/2023? (tendência linear + sazonalidade trimestral,
    #    erro-padrão de Newey-West com 4 defasagens)
    for label, lo, hi in (("03_2016_a_12_2019", 0, 201912), ("12_2019_a_09_2023", 201912, 202309),
                          ("antes_12_2023", 0, 202309), ("ate_12_2024_perimetro_antigo", 0, 202412),
                          ("12_2023_em_diante", 202312, 999999), ("serie_toda", 0, 999999)):
        ps = [p for p in periods if lo <= p <= hi]
        yy = [v for p, v in zip(periods, y) if lo <= p <= hi]
        X = design(ps)
        b, e, XtXi = ols(X, yy)
        se = newey_west_se(X, e, XtXi)
        out[f"tendencia_{label}"] = {"de": ps[0], "ate": ps[-1], "n": len(ps),
                                     "pp_por_ano": round(4 * b[1], 3), "ep_nw_pp_por_ano": round(4 * se[1], 3),
                                     "t": round(b[1] / se[1], 2)}
    # 2) quebra de data desconhecida (sup-F, nível e inclinação), p-valor por bootstrap AR(1) sob H0
    F, tau = sup_f(periods, y)
    X0 = design(periods)
    b0, e0, _ = ols(X0, y)
    rho = sum(e0[t] * e0[t - 1] for t in range(1, len(e0))) / sum(v * v for v in e0[:-1])
    u = [e0[t] - rho * e0[t - 1] for t in range(1, len(e0))]
    rng, hits, reps = random.Random(20261128), 0, 999
    fit0 = [sum(bi * xi for bi, xi in zip(b0, x)) for x in X0]
    for _ in range(reps):
        sim, prev = [], rng.choice(e0)
        for t in range(len(y)):
            prev = rho * prev + rng.choice(u)
            sim.append(fit0[t] + prev)
        if sup_f(periods, sim)[0] >= F:
            hits += 1
    out["sup_f"] = {"F": round(F, 2), "quebra_estimada_em": periods[tau], "rho_ar1_residuos": round(rho, 3),
                    "p_bootstrap": round((hits + 1) / (reps + 1), 3), "reps": reps, "aparo": 0.15,
                    "modelo": "BB_share = a + b·t + sazonais(T2,T3,T4) [+ c·1(t≥τ) + d·(t−τ)·1(t≥τ)]"}
    # 3) Chow em datas fixas (nível e inclinação), com o mesmo bootstrap de p-valor seria caro; F e p aproximado
    for label, pbreak in (("chow_12_2019", 201912), ("chow_12_2023", 202312), ("chow_03_2025_perimetro", 202503)):
        tau = periods.index(pbreak)
        n, k1 = len(y), len(design(periods, tau)[0])
        s0, s1 = ssr(X0, y), ssr(design(periods, tau), y)
        out[label] = {"F": round(((s0 - s1) / 2) / (s1 / (n - k1)), 2), "gl": [2, n - k1],
                      "nota": "F clássico supõe erros independentes; com ρ alto ele exagera a significância"}
    return out


def main():
    names = c.names()
    nat = c.split_other_coops(c.load_national(set(PRODUCTS)))
    rows, who = window_tables(nat, names)
    c.write_csv("a1_variacao_por_instituicao.csv", rows)
    c.write_csv("a1_quem_ganhou.csv", who)
    ext = c.extract_extra(EXT, sorted({p for w in WINDOWS for p in w}), c.credit_level)
    nat.update(ext)
    ss_rows, ss_cells = [], []
    for a, b in WINDOWS:
        for label, cells, tot in (("produto (PF 7 + PJ 9 modalidades + exterior PF e PJ)", PF + PJ + [e["id"] for e in EXT],
                                   "credito_pf_pj"),
                                  ("regiao (5 regioes)", REG, "reg_total")):
            if tot == "reg_total" and (a, "reg_total") not in nat:
                tot = None
            res, per = shift_share(nat, a, b, cells, tot)
            ss_rows.append({"janela": f"{c.fmt_period(a)}-{c.fmt_period(b)}", "celulas": label, **res})
            ss_cells += [{"janela": f"{c.fmt_period(a)}-{c.fmt_period(b)}", "celulas": label, **r} for r in per]
    c.write_csv("a1_shift_share.csv", ss_rows)
    c.write_csv("a1_shift_share_celulas.csv", ss_cells)
    bridge = []
    for m in PRODUCTS:
        for a, b in ((202409, 202412), (202412, 202503), (202409, 202503)):
            if (a, m) in nat and (b, m) in nat:
                sa, sb = c.shares(nat[(a, m)]), c.shares(nat[(b, m)])
                bridge.append({"metric": m, "de": a, "para": b,
                               "salto_total_sistema_pct": round(100 * (nat[(b, m)]["total"] / nat[(a, m)]["total"] - 1), 1),
                               "bb_delta_pp": c.pp(sb.get("bb", 0) - sa.get("bb", 0)),
                               "itau_delta_pp": c.pp(sb.get("itau", 0) - sa.get("itau", 0))})
    c.write_csv("a1_ponte_2024_2025.csv", bridge)
    c.write_json("a1_quebra_rural_pf.json", break_tests(nat))


if __name__ == "__main__":
    main()
