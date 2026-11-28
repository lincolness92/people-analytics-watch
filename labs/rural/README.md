# labs/rural: crédito rural com dado público (coletores, Análise 2 e protótipo de monitor)

Versão de **28/11/2026**. Só stdlib (Python 3.12). Sem numpy nem scikit-learn: o ridge é em Python puro.
Nada aqui usa informação interna de banco.

## O que tem aqui

| Arquivo | O que faz | Saída |
|---|---|---|
| `common.py` | Download em blocos, com retentativa, pausa de 1,5 s e `.meta.json` (URL, data, tamanho) | — |
| `collect_scr.py` | SCR.data v2 (BCB): crédito rural por UF × segmento × cliente × porte × origem × indexador, mensal, 2012-07 a 2026-09 | `data/rural/scr_rural_uf_segmento.csv`; `raw/scr_rural_detail.csv.gz` |
| `collect_sicor.py` | SICOR, microdados: saldo e situação de cada operação rural, por IF, UF, município, porte, programa, fonte e produto, 2013-01 a 2026-10 | `data/rural/sicor_saldos_inst_situacao.csv`, `sicor_atraso_uf_mensal.csv`; `raw/sicor_saldos_{uf,produto,municipio}.csv.gz` |
| `collect_ifdata_rural.py` | IF.data: carteira rural e vencido ≥15 dias por instituição (lê `data/ifs/`, só leitura) | `data/rural/ifdata_rural_inst.csv`, `ifdata_rural_entidades.csv` |
| `collect_series.py` | SGS 21148, 21146, 21147, 21136, 4189; preços DERAL/Seab-PR de soja, milho e boi (Ipeadata) | `data/rural/series_nacionais.csv` |
| `collect_clima.py` | NASA POWER mensal (chuva e Tmax), grade de 0,5°, por UF, ponderado pelo crédito rural do município | `data/rural/clima_uf_mensal.csv` |
| `nowcast.py` | Protótipo de monitor: nowcast e previsão da inadimplência rural >90 dias por UF | `resultados/nowcast_*.{csv,json}` |

A Análise 2 (BB, cooperativas, Caixa e sistema, ajustada ao mix) está em
`estrategia/bb/analises/a2_inad_rural_mix.py` e `a2.md`.

## Como rodar

```
python3 labs/rural/collect_ifdata_rural.py
python3 labs/rural/collect_scr.py                  # ~2 GB em data/rural/raw/scr/
python3 labs/rural/collect_sicor.py download       # ~13 GB em data/rural/raw/sicor/ (sequencial, ~50 min)
python3 labs/rural/collect_sicor.py process --jobs 3   # ~40 min, ~4 GB de RAM
python3 labs/rural/collect_series.py
python3 labs/rural/collect_clima.py                # depois do SICOR, para usar os pesos municipais
python3 labs/rural/nowcast.py                      # ~3 min
```

`data/rural/raw/` fica fora do git (`.gitignore`). Os coletores são incrementais pelo tamanho do arquivo remoto.

## Fontes e o que se aprendeu nelas (28/11/2026)

- **SCR.data**: `https://www.bcb.gov.br/pda/desig/scrdata_{ANO}.zip` (versão 2; a versão 1 parou em 06/2025). O
  mês T sai no último dia útil de T+2. Não separa instituições: "Banco" junta BB, Caixa e privados.
- **SICOR, API OData**: o recurso por IF e UF (`SegmentoIFRegiaoUF`) devolve 500 ou 504 com filtro de ano ou `$top`
  grande. **Os microdados funcionam**: `https://www.bcb.gov.br/htms/sicor/DadosBrutos/` (operações por ano,
  saldos por ano de contratação, complemento com município). Atualizados às quartas e domingos.
- **SICOR, complemento com município**: cobre 51% do saldo do BB em 09/2026 e 26% do saldo em atraso. Não serve para
  medir concentração municipal.
- **NASA POWER**: um parâmetro por chamada; caixa de até 10° × 10°; mensal disponível até 10/2026.
- **World Bank Pink Sheet**: o arquivo do link conhecido parou em 12/2025. Trocado pelos preços recebidos pelo
  produtor no PR (Seab-PR/DERAL, via Ipeadata), até 10/2026.
- **IPEA, IBGE, BCB**: todos responderam. Nenhum host bloqueado.

## O protótipo de monitor (`nowcast.py`)

**Alvo.** Inadimplência >90 dias do crédito rural (carteira inadimplente ÷ carteira ativa, PF + PJ, todos os
segmentos) por UF e mês, SCR.data.

**Calendário.** No dia em que sai o SCR.data do mês T (fim de T+2), já existem: SGS até T+1, preços até T+1, clima
até T+1, SICOR até T+1. Então h = 1 e 2 são nowcasts (meses fechados, sem SCR.data ainda) e h ≥ 3 são previsões. O
painel é montado por data de origem; nenhuma variável é posterior a T+1.

**Modelos.** RW (último valor), SN (sazonal ingênuo), PONTE (ŷ = y[T] × SGS21148[T+1] ÷ SGS21148[T]: a UF acompanha
o mês seguinte do país), M1 (ridge com variação própria, SGS, preços, chuva, Tmax e Selic) e M2 (M1 + atraso do
SICOR na UF). Reestimados a cada origem, de 12/2017 a 09/2026, com janela que cresce.

**Resultado (MAE em p.p., média simples das 27 UFs; entre parênteses, a razão contra o RW).**

| h | RW | SN | PONTE | M1 | M2 | PONTE − RW (IC 95%) |
|---|---|---|---|---|---|---|
| 1 | 0,275 | 1,520 (5,53) | **0,239 (0,87)** | 0,261 (0,95) | 0,272 (0,99) | −0,036 (−0,062 a −0,010) |
| 2 | 0,443 | 1,512 (3,42) | **0,387 (0,87)** | 0,429 (0,97) | 0,495 (1,12) | −0,056 (−0,090 a −0,023) |
| 3 | 0,576 | 1,504 (2,61) | **0,519 (0,90)** | 0,572 (0,99) | 0,685 (1,19) | −0,057 (−0,099 a −0,021) |
| 6 | 0,907 | 1,483 (1,64) | **0,839 (0,93)** | 0,975 (1,08) | 1,333 (1,47) | −0,068 (−0,125 a −0,018) |
| 9 | 1,253 | 1,506 (1,20) | **1,169 (0,93)** | 2,192 (1,75) | 2,206 (1,76) | −0,084 (−0,130 a −0,020) |
| 12 | 1,530 | 1,530 (1,00) | **1,457 (0,95)** | 2,718 (1,78) | 3,244 (2,12) | −0,074 (−0,107 a −0,012) |

Ponderado pela carteira de cada UF, a PONTE corta o erro do RW em 43% em h = 1 (MAE 0,101 contra 0,178). IC por
bootstrap em blocos de 12 origens. Tabela completa, com recortes 2018–2024 e 2025–2026:
`resultados/nowcast_avaliacao.csv`.

**Leitura.**

- O que funciona é simples: **a ponte nacional bate o último valor em todos os horizontes**, com intervalo que não
  cruza zero. O ganho vem do mês extra de informação do SGS.
- **O modelo com clima, preços e Selic (M1) não bate o RW no período todo.** Bate em 2025–2026 (h = 1: −0,089 p.p.,
  IC −0,130 a −0,052), quando a série sobe forte e o momento pesa. Em 2018–2024 é igual ou pior. Em h ≥ 6 piora
  muito: sobreajuste.
- **O atraso do SICOR (M2) não ajuda.** E o backtest dele pode estar otimista, porque usa a safra de hoje dos dados
  (não há safras guardadas).
- O sazonal ingênuo é ruim: a série não tem sazonalidade estável.

**Visão à frente** (origem 09/2026; `resultados/nowcast_previsao_uf.csv`). Com a PONTE, a previsão é a mesma para
todos os h: y[09/2026] × 9,59 ÷ 8,64 (SGS 21148 de out/26 sobre set/26). O que muda com h é a banda, tirada dos
erros fora da amostra desde 2021. Como esses erros vieram de um período de alta, a banda é assimétrica para cima.

| UF | 09/2026 (SCR) | Nowcast 10/2026 (p10–p90) | Previsão 12/2026 (p10–p90) | Previsão 09/2027 (p10–p90) |
|---|---|---|---|---|
| GO | 11,36% | 12,6% (12,3–12,9) | 12,6% (12,3–13,5) | 12,6% (12,1–16,0) |
| MT | 7,27% | 8,1% (7,8–8,3) | 8,1% (7,7–9,0) | 8,1% (7,5–11,5) |
| MS | 10,90% | 12,1% (11,8–12,4) | 12,1% (11,7–13,0) | 12,1% (11,6–15,5) |
| RS | 4,56% | 5,1% (4,8–5,3) | 5,1% (4,7–6,0) | 5,1% (4,5–8,5) |
| PR | 4,32% | 4,8% (4,5–5,1) | 4,8% (4,4–5,7) | 4,8% (4,3–8,2) |
| MG | 5,32% | 5,9% (5,6–6,2) | 5,9% (5,6–6,8) | 5,9% (5,4–9,3) |
| MA | 23,71% | 26,3% (26,0–26,6) | 26,3% (26,0–27,3) | 26,3% (25,8–29,7) |
| TO | 14,91% | 16,6% (16,3–16,8) | 16,6% (16,2–17,5) | 16,6% (16,0–20,0) |

A previsão de 12 meses é, na prática, "fica onde está, com risco para cima". Isso é o que o dado sustenta hoje.

## Limites

1. **Município.** O SCR.data não tem município. O SICOR tem, mas o complemento cobre mal as operações recentes e as
   em atraso. Um monitor municipal exige o dado interno (exposição e atraso por operação) ou outra fonte pública.
2. **Safras de dados.** SGS, SCR.data e SICOR são revisados. O backtest usa a versão de hoje. Para um monitor real,
   guardar o que foi coletado em cada dia, como os digests do repositório já fazem.
3. **Uma quebra no meio.** Res. CMN 4.966 (jan/2025), renegociações por MP e a alta de 2024–2026 mudam a relação
   entre as variáveis. Com 21 origens depois da quebra, o recorte 2025–2026 é curto.
4. **Clima grosso.** MERRA-2 em 0,5°, ponderado pelos municípios com município no SICOR (51% do saldo). Os z de chuva
   de 2023–2026 são negativos em quase todas as UFs (média −0,6); pode ser seca real ou deriva do produto.
5. **Preço de uma praça.** DERAL é o preço recebido no PR. Serve para o ciclo nacional, não para a base local.
6. **Bandas agrupadas.** A banda usa os mesmos quantis de erro para todas as UFs. UFs pequenas (AP, RR, AC) têm erro
   maior que a banda sugere; as grandes, menor.
