"""Coletor das taxas de juros por instituição e modalidade (BCB, API Olinda `taxaJuros/v2`), só stdlib.

Uma janela por mês (a primeira janela de 5 dias úteis que começa no mês), desde 01/2016. Cada janela é guardada em
raw/taxajuros/<inicio>.json.gz e não é baixada de novo. Taxas em % a.a. (média ponderada pelo volume, como o BCB
publica, por instituição individual e modalidade). Rodar sozinho atualiza o cache:
    python estrategia/bb/analises/taxajuros.py
"""

import json
import sys

sys.dont_write_bytecode = True
import _comum as c  # noqa: E402

BASE = "https://olinda.bcb.gov.br/olinda/servico/taxaJuros/versao/v2/odata"


def periods(since="2016-01"):
    body = c.fetch_cached(f"{BASE}/ConsultaDatas?$format=json&$filter=tipoModalidade%20eq%20'D'",
                          "taxajuros/datas", refresh=True)
    starts = sorted(r["inicioPeriodo"] for r in json.loads(body)["value"])
    first = {}
    for s in starts:
        if s[:7] >= since:
            first.setdefault(s[:7], s)
    return [first[m] for m in sorted(first)]


def window(start):
    url = f"{BASE}/ConsultaUnificada?$format=json&$filter=InicioPeriodo%20eq%20'{start}'"
    return json.loads(c.fetch_cached(url, f"taxajuros/{start}"))["value"]


def load(since="2016-01"):
    """[{mes: AAAAMM, inicio, cnpj8, nome, codigo, modalidade, segmento, taxa_aa, posicao}]"""
    out = []
    for s in periods(since):
        for r in window(s):
            out.append({"mes": int(s[:4]) * 100 + int(s[5:7]), "inicio": s, "cnpj8": r["cnpj8"],
                        "nome": r["InstituicaoFinanceira"], "codigo": r["codigoModalidade"],
                        "segmento": r["Segmento"], "modalidade": r["Modalidade"],
                        "taxa_aa": float(r["TaxaJurosAoAno"]), "posicao": r["Posicao"]})
    return out


if __name__ == "__main__":
    rows = load()
    print(f"{len(rows)} linhas, {len({r['mes'] for r in rows})} meses")
