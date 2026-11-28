"""Testes offline da camada de instituições financeiras (src/pawatch/ifs/): sem rede, com fixtures mínimas."""

import io
import sqlite3
import sys
import unittest
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from pawatch.ifs import SCHEMA, add_months, cnpj14, fmt_cnpj  # noqa: E402
from pawatch.ifs import estban, ifdata, ipe, pillar3, shares  # noqa: E402
from pawatch.ifs.registry import PRUD_BASE, membership  # noqa: E402


def info(id_, name, lid, a=1, td=3, ty=1):
    return {"id": id_, "n": name, "lid": lid, "a": a, "td": td, "ty": ty}


def col(ifd, sc=()):
    return {"ifd": ifd, "sc": list(sc)}


# Um "Resumo" e um "Passivo" no leiaute antigo e no Cosif 2025: nomes e lids diferentes, mesma métrica.
INFO_OLD = [info(1, "Ativo Total", 78182), info(2, "Número de Agências", 16, td=1),
            info(3, "Captações", -1, td=2, ty=0), info(4, "Depósito Total", -1, td=2, ty=0),
            info(5, "Depósito Total (a)", 78287), info(6, "Depósitos à Vista (a1)", 78282),
            info(7, "Rural e Agroindustrial", -1, a=3, td=2, ty=0), info(8, "Total", 23267, a=3),
            info(9, "Rural e Agroindustrial", -1, a=3, td=2, ty=0), info(10, "Total", 23331, a=3)]
INFO_NEW = [info(1, "Ativo Total", 140220), info(2, "Número de Agências", 16, td=1),
            info(3, "Captações", -1, td=2, ty=0), info(4, "Depósitos", -1, td=2, ty=0),
            info(5, "Depósitos (a)", 140228), info(6, "Depósitos à Vista (a1)", 140222),
            info(7, "Rural e Agroindustrial", -1, a=3, td=2, ty=0), info(8, "Total", 23267, a=3),
            info(9, "Rural e Agroindustrial", -1, a=3, td=2, ty=0), info(10, "Total", 23331, a=3)]


def entry(dt, level, credit_level):
    return {"dt": dt, "folder": "x", "files": [], "generated": "01/01/2026", "trels": [
        {"id": 1, "n": "Resumo", "s": [{"id": level}], "c": [col(1), col(2)]},
        {"id": 2, "n": "Passivo", "s": [{"id": level}], "c": [col(3, [col(4, [col(6), col(5)])])]},
        {"id": 3, "n": "Carteira de crédito ativa Pessoa Física - modalidade e prazo de vencimento",
         "s": [{"id": credit_level}], "c": [col(7, [col(8)])]},
        {"id": 4, "n": "Carteira de crédito ativa Pessoa Jurídica - modalidade e prazo de vencimento",
         "s": [{"id": credit_level}], "c": [col(9, [col(10)])]},
    ]}


METRICS = [
    {"id": "ativo_total", "report": "^Resumo", "column": "^Ativo Total$", "series": "financeiro"},
    {"id": "agencias", "report": "^Resumo", "column": "^Número de Agências$", "series": "financeiro"},
    {"id": "depositos_total", "report": "^Passivo", "column": "> Depósitos?( Total)?\\s+\\(a\\)$", "series": "financeiro"},
    {"id": "depositos_vista", "report": "^Passivo", "column": "> Depósitos à Vista\\s+\\(a1\\)$", "series": "financeiro"},
    {"id": "pf_rural", "report": "Pessoa Física - modalidade", "column": "^Rural e Agroindustrial > Total$", "series": "credito"},
    {"id": "pj_rural", "report": "Pessoa Jurídica - modalidade", "column": "^Rural e Agroindustrial > Total$", "series": "credito"},
]
CFG = {"cosif_break": "2025-03", "series": {
    "financeiro": {"chain": [{"level": 1005, "from": 200001, "to": 207912}]},
    "credito": {"chain": [{"level": 1005, "from": 200001, "to": 202412}, {"level": 1009, "from": 202503, "to": 207912}]},
    "prudencial": {"chain": [{"level": 1004, "from": 200001, "to": 202306}, {"level": 1009, "from": 202309, "to": 207912}]}}}


class IfDataTests(unittest.TestCase):
    def test_same_metric_found_before_and_after_cosif_2025(self):
        old = ifdata.resolve_metrics(entry(202412, 1005, 1005), INFO_OLD, METRICS, [1005])[1005]
        new = ifdata.resolve_metrics(entry(202503, 1005, 1009), INFO_NEW, METRICS, [1005, 1009])
        self.assertEqual(old["ativo_total"]["lid"], 78182)
        self.assertEqual(new[1005]["ativo_total"]["lid"], 140220)
        self.assertEqual(old["depositos_total"]["lid"], 78287)
        self.assertEqual(new[1005]["depositos_total"]["lid"], 140228)
        self.assertEqual(old["depositos_vista"]["column"], "Captações > Depósito Total > Depósitos à Vista  (a1)")
        # crédito: até 2024 no financeiro (1005), desde 2025 só no prudencial (1009)
        self.assertIn("pf_rural", old)
        self.assertNotIn("pf_rural", new[1005])
        self.assertEqual(new[1009]["pf_rural"]["lid"], 23267)
        self.assertEqual(old["agencias"]["td"], 1)

    def test_extract_values_reads_cadastro_fields_and_skips_zeros(self):
        e = entry(202606, 1009, 1009)
        res = ifdata.resolve_metrics(e, INFO_NEW, METRICS, [1009])
        cad = {1009: [{"c0": "1000080329", "c2": "BB - PRUDENCIAL", "c16": "3940"},
                      {"c0": "68987", "c2": "COOP X", "c16": "0"}]}
        dados = {1: {"values": [{"e": 1000080329, "v": [{"i": 140220, "v": 2.5e12}, {"i": 140228, "v": 1.0e12}]},
                                {"e": 68987, "v": [{"i": 140220, "v": 0}]}]},
                 3: {"values": [{"e": 1000080329, "v": [{"i": 23267, "v": 366.8e9}, {"i": 23331, "v": 11.7e9}]}]}}
        vals = ifdata.extract_values(dados, cad, res, {"1009": "all"})
        got = {(c, m): v for _, c, m, v in vals}
        self.assertEqual(got[(1000080329, "ativo_total")], 2.5e12)
        self.assertEqual(got[(1000080329, "agencias")], 3940.0)
        self.assertNotIn((68987, "ativo_total"), got)  # zero não entra
        self.assertNotIn((68987, "agencias"), got)
        der = ifdata.add_derived(vals, [{"id": "credito_rural", "sum": ["pf_rural", "pj_rural"]}])
        self.assertEqual(der, [(1009, 1000080329, "credito_rural", 366.8e9 + 11.7e9)])

    def test_index_entry_folder_and_generation(self):
        p = {"dt": 202606, "files": [{"f": "ifdata_2025_2030//202606/info202606.json"},
                                     {"f": "ifdata_2025_2030//202606/trel202606_121.json",
                                      "trel": {"id": 121, "n": "Resumo", "ge": "18/08/2026", "s": [], "c": []}}]}
        e = ifdata.parse_index_entry(p)
        self.assertEqual(e["folder"], "ifdata_2025_2030")
        self.assertEqual(e["files"], ["info202606.json", "trel202606_121.json"])
        self.assertEqual(e["generated"], "18/08/2026")
        self.assertEqual(ifdata.parse_index_entry({"dt": 201612, "files": [{"f": "201612/info201612.json"}]})["folder"],
                         "ifdata")

    def test_cosif_break_flag_and_series_level(self):
        self.assertEqual(ifdata.cosif_regime(202412, CFG), "cosif_antigo")
        self.assertEqual(ifdata.cosif_regime(202503, CFG), "cosif2025")
        self.assertEqual(ifdata.series_level(CFG, "credito", 202412), 1005)
        self.assertEqual(ifdata.series_level(CFG, "credito", 202503), 1009)
        self.assertIsNone(ifdata.series_level(CFG, "credito", 202501))
        self.assertTrue(shares.crosses(202306, 202606, 202503))
        self.assertFalse(shares.crosses(202506, 202606, 202503))


class Km1Tests(unittest.TestCase):
    CFG = {"amount_fields": ["km1_1", "km1_4", "km1_13"], "ratio_fields": ["km1_5", "km1_14", "km1_17"]}

    def test_parse_v1_and_v2(self):
        layout, ref, by = pillar3.parse_doc({"km1_1": 133016594.3, "km1_5": 12.01, "km1_trimestreReferencia": "2023-1",
                                             "km1_comentario": " "})
        self.assertEqual((layout, ref), ("v1", "2023-1"))
        self.assertEqual(by["2023-1"], {"km1_1": 133016594.3, "km1_5": 12.01})
        layout, ref, by = pillar3.parse_doc({"km1_trimestreReferencia": "2026-2", "km1_capitalRegulamentar": {
            "km1_1": {"t": "74275.8", "t_1": "69045.7", "t_4": "59317.6"}, "informacoesComplementares": []}})
        self.assertEqual(layout, "v2")
        self.assertEqual(by["2026-2"]["km1_1"], 74275.8)
        self.assertEqual(by["2026-1"]["km1_1"], 69045.7)
        self.assertEqual(by["2025-2"]["km1_1"], 59317.6)
        self.assertEqual(pillar3.quarter_period("2026-2"), 202606)
        self.assertEqual(pillar3.shift_quarter("2026-1", 1), "2025-4")
        self.assertEqual(pillar3.argument_quarter("20-08-27_222708_20200630_km1.json"), "2020-2")
        self.assertIsNone(pillar3.argument_quarter("20-05-27_202408_km1_v2.json"))  # hora, não data-base
        from datetime import date
        self.assertEqual(pillar3.last_closed_quarter(date(2026, 11, 28)), 202609)
        self.assertEqual(pillar3.last_closed_quarter(date(2026, 2, 1)), 202512)

    def test_load_doc_tolerates_issuer_quirks(self):
        self.assertEqual(pillar3.load_doc('{"km1_1": 1, "c": "a\tb"}'.encode("latin-1"))["km1_1"], 1)
        self.assertEqual(pillar3.load_doc('{"km1_c": "çã"}'.encode("latin-1"))["km1_c"], "çã")
        doc = pillar3.load_doc(b'{"km1_trimestreReferencia":"2021-3";\r\n"km1_1":71722200,00;\r\n"km1_5":11,97}')
        self.assertEqual((doc["km1_trimestreReferencia"], doc["km1_1"], doc["km1_5"]), ("2021-3", 71722200.0, 11.97))

    def test_units_normalised_across_issuers(self):
        # mesmo banco escrito à moda do BB (R$ mil, %) e à moda do BTG (R$ milhões, fração)
        bb = {"km1_1": 154_714_920.91, "km1_4": 1_372_716_326.39, "km1_5": 11.27, "km1_13": 2_613_442_745.91,
              "km1_17": 170.75}
        btg = {"km1_1": 154_714.92091, "km1_4": 1_372_716.32639, "km1_5": 0.1127, "km1_13": 2_613_442.74591,
               "km1_17": 1.7075}
        assets = 2.58e12  # ativo total prudencial do IF.data, em R$
        n1, m1 = pillar3.normalize(bb, assets, self.CFG)
        n2, m2 = pillar3.normalize(btg, assets, self.CFG)
        self.assertEqual((m1, m2), ("ifdata", "ifdata"))
        for f in bb:
            self.assertAlmostEqual(n1[f][0], n2[f][0], delta=abs(n1[f][0]) * 1e-6, msg=f)
        self.assertAlmostEqual(n1["km1_1"][0], 154_714_920_910.0, delta=1)
        self.assertEqual(n1["km1_5"][1], "%")
        self.assertAlmostEqual(n2["km1_5"][0], 11.27)
        self.assertAlmostEqual(n2["km1_17"][0], 170.75)

    def test_unit_without_ifdata_falls_back_to_magnitude(self):
        n, method = pillar3.normalize({"km1_1": 74275.8, "km1_4": 641034.1, "km1_5": 0.1159, "km1_13": 1_100_000.0},
                                      None, self.CFG)
        self.assertEqual(method, "magnitude")
        self.assertAlmostEqual(n["km1_13"][0], 1.1e12)


class SharesTests(unittest.TestCase):
    def test_split_and_rank(self):
        values = {1: 50.0, 2: 30.0, 3: 15.0, 4: 5.0}
        member_of = {1: "a", 3: "b", 4: "b"}
        total, by, others = shares.split_shares(values, member_of)
        self.assertEqual((total, by, others), (100.0, {"a": 50.0, "b": 20.0}, 30.0))
        self.assertEqual(shares.ranks(by, values, member_of), {"a": 1, "b": 3})  # a entidade solta 2 fica em 2º

    def test_changes_flags_and_movers(self):
        levels = {202106: 1005, 202306: 1005, 202506: 1009, 202606: 1009}
        series = {("a", 202606): 0.20, ("a", 202506): 0.21, ("a", 202306): 0.25, ("a", 202106): 0.30,
                  ("b", 202606): 0.10, ("b", 202506): 0.08, ("b", 202306): 0.05,
                  ("c", 202106): 0.02}
        rows = shares.changes(series, levels, 202606, [1, 3, 5], 202503, ["a", "b", "c", shares.OTHERS])
        by = {(r["inst_id"], r["horizon_years"]): r for r in rows}
        self.assertAlmostEqual(by[("a", 1)]["delta_pp"], -1.0)
        self.assertFalse(by[("a", 1)]["crosses_cosif_break"])
        self.assertFalse(by[("a", 1)]["perimeter_change"])
        self.assertTrue(by[("a", 3)]["crosses_cosif_break"])
        self.assertTrue(by[("a", 5)]["perimeter_change"])
        self.assertEqual(by[("b", 5)]["absent"], "base")   # b não existia há 5 anos: base = 0
        self.assertAlmostEqual(by[("b", 5)]["delta_pp"], 10.0)
        self.assertEqual(by[("c", 5)]["absent"], "latest")
        up, down = shares.movers([r for r in rows if r["horizon_years"] == 5], 2)
        self.assertEqual([x["inst_id"] for x in up], ["b"])
        self.assertEqual([x["inst_id"] for x in down], ["a", "c"])
        self.assertNotIn((shares.OTHERS, 1), by)
        # lacuna de cadastro: a instituição existia, mas não estava no nível da série → sem variação e fora do ranking
        rows = shares.changes(series, levels, 202606, [1], 202503, ["a", "b"], gaps={("b", 202506)})
        gap = next(r for r in rows if r["inst_id"] == "b")
        self.assertIsNone(gap["delta_pp"])
        self.assertEqual(gap["absent"], "gap_base")
        self.assertEqual([x["inst_id"] for x in shares.movers(rows, 3)[1]], ["a"])


def _zip(name, text):
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as z:
        z.writestr(name, text.encode("latin-1"))
    return buf.getvalue()


class EstbanTests(unittest.TestCase):
    OLD = ("ESTBAN (Documento 4500) por municipio \nData de geracao dos dados: 2019-07-30\n"
           "#DATA_BASE;UF;CODMUN;MUNICIPIO;CNPJ;NOME_INSTITUICAO;AGEN_ESPERADAS;AGEN_PROCESSADAS;VERBETE_160_OPERACOES_DE_CREDITO;"
           "VERBETE_163_FIN_RURAIS_AGRICUL_CUST/INVEST;VERBETE_164_FIN_RURAIS_PECUAR_CUST/INVEST;"
           "VERBETE_167_FINANCIAMENTOS_AGROINDUSTRIAIS+VERBETE_168_RENDAS;VERBETE_401_SERVICOS_PUBLICOS + VERBETE_402_X;"
           "VERBETE_420_DEPOSITOS_DE_POUPANCA;VERBETE_432_DEPOSITOS_A_PRAZO;CODMUN_IBGE\n"
           "201603;AC;1030;MANCIO LIMA;00000000;BCO DO BRASIL S.A.;1;1;1000;300;200;;50;60;70;1200302\n"
           "201603;AC;1030;MANCIO LIMA;00360305;CAIXA;1;1;500;0;0;0;10;20;30;1200302\n")
    NEW = ("ESTBAN (Documento 4500) por municipio \nData de geracao dos dados: 2026-09-01\n"
           "#DATA_BASE;UF;CODMUN;MUNICIPIO;CNPJ;NOME_INSTITUICAO;AGEN_ESPERADAS;AGEN_PROCESSADAS;VERBETE_160_OPERACOES_DE_CREDITO;"
           "VERBETE_163_FIN_RURAIS_AGRICUL_CUST/INVEST;VERBETE_167_FINANCIAMENTOS_AGROINDUSTRIAIS;"
           "VERBETE_401_SERVICOS_PUBLICOS + VERBETE_402_X;VERBETE_420_DEPOSITOS_DE_POUPANCA;VERBETE_432_DEPOSITOS_A_PRAZO;CODMUN_IBGE\n"
           "202606;AC;1030;MANCIO LIMA;0;BCO DO BRASIL S.A.;1;1;1000;450;0;50;60;70;1200302\n")
    METRICS = {"credito_rural": {"verbetes": ["163", "164", "165", "166", "167"]},
               "depositos_total": {"verbetes": ["401", "420", "432"]}}

    def test_parse_both_layouts(self):
        gen, layout, rows = estban.parse(_zip("201603_ESTBAN.CSV", self.OLD))
        self.assertEqual(gen, "2019-07-30")
        self.assertIn("164", layout)
        self.assertEqual(rows[0]["cnpj8"], "00000000")
        self.assertEqual(rows[0]["codmun_ibge"], "1200302")
        self.assertEqual(estban.metric_values(rows[0]["values"], self.METRICS),
                         {"credito_rural": 500.0, "depositos_total": 180.0})
        gen, layout, rows = estban.parse(_zip("202606_ESTBAN.CSV", self.NEW))
        self.assertNotIn("164", layout)
        self.assertEqual(rows[0]["cnpj8"], "00000000")  # CNPJ "0" vira 00000000
        self.assertEqual(estban.metric_values(rows[0]["values"], self.METRICS)["credito_rural"], 450.0)

    def test_aggregate_by_uf(self):
        _, _, rows = estban.parse(_zip("x.csv", self.OLD))
        acc = estban.aggregate_uf(rows, self.METRICS)
        self.assertEqual(acc[("00000000", "AC", "credito_rural")], [500.0, 1])
        self.assertEqual(acc[("00360305", "AC", "depositos_total")], [60.0, 1])


    def test_total_row_contamination_is_detected_and_corrected(self):
        # banco com 12 municípios; no mês novo a linha de Brasília traz, somado, o total nacional do banco
        def row(uf, mun, v):
            return {"cnpj8": "00000000", "uf": uf, "codmun": mun, "values": {"160": v}}
        base = [row("DF", "BSB", 200.0)] + [row("SP", f"m{i}", 100.0) for i in range(11)]
        prev_uf = {("00000000", "DF", "credito_total"): 200.0, ("00000000", "SP", "credito_total"): 1100.0}
        metrics = {"credito_total": {"verbetes": ["160"]}}
        dirty = [row("DF", "BSB", 205.0 + 1310.0)] + [row("SP", f"m{i}", 100.5) for i in range(11)]
        fixes = estban.find_total_rows(dirty, prev_uf, metrics)
        self.assertEqual(len(fixes), 1)
        i, mid, raw, corrected, s_raw, s_prev = fixes[0]
        self.assertEqual((i, mid, s_prev), (0, "credito_total", 1300.0))
        self.assertAlmostEqual(corrected, 205.0, delta=1.0)  # total verdadeiro = metade da soma publicada
        self.assertEqual(estban.find_total_rows(base, prev_uf, metrics), [])  # mês normal: nada
        # banco de uma linha só que dobra: não dá para separar, fica como está
        # banco concentrado numa UF que dobra de verdade (sem resto do país relevante): não mexe
        conc = [row("SP", "SP", 2600.0), row("RJ", "RJ", 10.0)]
        self.assertEqual(estban.find_total_rows(conc, {("00000000", "SP", "credito_total"): 1290.0,
                                                       ("00000000", "RJ", "credito_total"): 10.0}, metrics), [])
        small = [row("DF", "BSB", 400.0)]
        self.assertEqual(estban.find_total_rows(small, {("00000000", "DF", "credito_total"): 200.0}, metrics), [])


    def test_missing_bank_months_are_replaced(self):
        con = sqlite3.connect(":memory:")
        con.executescript(SCHEMA)
        data = {202304: {"a": 100, "b": 50}, 202305: {"a": 102, "b": 51}, 202306: {"a": 104},
                202307: {"a": 105, "b": 52}}
        for m, d in data.items():
            for c8, v in d.items():
                con.execute("INSERT INTO estban_uf VALUES (?,?,?,?,?,?)", (m, c8, "SP", "credito_total", v, 1))
        months = sorted(data)
        gaps = shares.estban_gaps(con, months)
        self.assertEqual(gaps, {202306: ["b"]})
        self.assertEqual(shares.complete_month(202306, months, gaps), 202305)
        self.assertEqual(shares.complete_month(202307, months, gaps), 202307)


class IpeTests(unittest.TestCase):
    def test_select_filters_and_keeps_latest_version(self):
        base = {"CNPJ_Companhia": "00.000.000/0001-91", "Nome_Companhia": "BANCO DO BRASIL S.A.", "Codigo_CVM": "1023",
                "Data_Referencia": "2026-05-01", "Data_Entrega": "2026-05-02", "Categoria": "Fato Relevante",
                "Tipo": "", "Especie": "", "Assunto": "Aquisição", "Protocolo_Entrega": "P1", "Versao": "1",
                "Link_Download": "https://rad/x"}
        rows = [base, dict(base, Versao="2", Assunto="Aquisição (retificado)"),
                dict(base, Protocolo_Entrega="P2", Categoria="Assembleia"),
                dict(base, Protocolo_Entrega="P3", Codigo_CVM="999")]
        got = ipe.select(rows, {"1023": "bb"}, {"Fato Relevante", "Comunicado ao Mercado"})
        self.assertEqual(list(got), ["P1"])
        self.assertEqual(got["P1"]["versao"], 2)
        self.assertEqual(got["P1"]["inst_id"], "bb")


class RegistryTests(unittest.TestCase):
    def setUp(self):
        self.con = sqlite3.connect(":memory:")
        self.con.executescript(SCHEMA)
        ent = [  # (period, level, code, name, ..., fin_congl, prud_congl)
            (202606, 1006, 0, "BANCO DO BRASIL S.A.", 49906, 80329),
            (202606, 1006, 31546476, "BB LEASING", 49906, 80329),
            (202606, 1006, 18236120, "NU PAGAMENTOS IP", None, 84693),
            (202606, 1006, 30680829, "NU FINANCEIRA", 52058, 84693),
            (202606, 1006, 1181521, "BANCO COOPERATIVO SICREDI S.A.", None, 80745),
            (202606, 1009, PRUD_BASE + 80329, "BB - PRUDENCIAL", 49906, 80329),
            (202606, 1009, PRUD_BASE + 84693, "NU PAGAMENTOS - PRUDENCIAL", 52058, 84693),
            (202606, 1009, PRUD_BASE + 80745, "BCO COOPERATIVO SICREDI - PRUDENCIAL", None, 80745),
            (202606, 1009, 90497256, "COOPERATIVA ... - SICREDI INTERESTADOS", None, None),
            (202606, 1009, 12345678, "OUTRA COOPERATIVA", None, None),
            (202606, 1005, 49906, "BB", 49906, 80329),
            (202606, 1005, 52058, "NU", 52058, 84693),
            (202606, 1005, 18236120, "NU PAGAMENTOS IP", None, 84693),
        ]
        self.con.executemany("INSERT INTO ifdata_entities VALUES (?,?,?,?,'','','','','','','',?,?)", ent)
        self.reg = {"institutions": [
            {"id": "bb", "kind": "conglomerado", "leader_cnpj8": "00000000", "members": []},
            {"id": "nubank", "kind": "conglomerado", "leader_cnpj8": "18236120", "members": []},
            {"id": "sicredi", "kind": "sistema cooperativo", "leader_cnpj8": "01181521",
             "ifdata": {"name_regex": "SICREDI"}, "members": []}]}

    def test_membership_by_level(self):
        prud = membership(self.con, self.reg, 202606, 1009)
        self.assertEqual(prud, {PRUD_BASE + 80329: "bb", PRUD_BASE + 84693: "nubank",
                                PRUD_BASE + 80745: "sicredi", 90497256: "sicredi"})
        fin = membership(self.con, self.reg, 202606, 1005)
        self.assertEqual(fin, {49906: "bb", 52058: "nubank", 18236120: "nubank"})  # IP fica como independente
        ind = membership(self.con, self.reg, 202606, 1006)
        self.assertEqual(ind[31546476], "bb")
        self.assertEqual(ind[1181521], "sicredi")

    def test_cnpj(self):
        self.assertEqual(cnpj14("00000000"), "00000000000191")
        self.assertEqual(cnpj14("60872504"), "60872504000123")
        self.assertEqual(fmt_cnpj(cnpj14("60746948")), "60.746.948/0001-12")
        self.assertEqual(add_months(202512, 1), 202601)
        self.assertEqual(add_months(202603, -15), 202412)


if __name__ == "__main__":
    unittest.main()
