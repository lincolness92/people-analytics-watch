// Judge a run of the reference questions with a stronger model (the "teacher"), by rubric. For each answer:
// rubric items 0–2, groundedness, specificity, honesty about gaps, usefulness for the persona, whether the answer
// format fits the question, the main cause of any shortfall, and what was missing (what sources would have helped).
// That last part drives the question-first loop: a gap the sources did not cover is a source to go and get.
//
//   node evals/judge.mjs evals/runs/<run>.json [--judge deepseek:deepseek-v4-pro] [--ids a,b] [--out file]
//        [--calibrate evals/calibration/<ref>.json]   (gap against a reference grading of some cases)
//
// Writes <run>.judged.json and prints a summary table by intent and topic.

import { readFile, writeFile } from "node:fs/promises";
import { makeLLM } from "../server/llm.js";

const arg = (name, def = null) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : def; };

// v2 (25/11/2026), from the calibration against a stronger model (evals/calibration/2026-11-25-fable.md): checks
// citations one by one, grades the rubric by what the answer delivers, anchors every grade.
const SYSTEM = `Você é um avaliador cético de respostas de um assistente de pesquisa que só pode usar as fontes numeradas que recebeu.
Avalie a RESPOSTA à PERGUNTA, considerando a PERSONA, a RUBRICA e as FONTES. Parta do princípio de que a resposta tem defeitos e procure-os; uma resposta bem escrita não é, por isso, uma resposta correta.

Trabalhe nesta ordem.

PASSO 1 — Conferir citações. Escolha pelo menos 6 afirmações factuais da resposta (dê preferência a números, nomes, normas, relações de causa e frases de abertura ou de conclusão; inclua pelo menos 1 afirmação factual SEM citação, se houver). Para cada uma, releia a fonte [n] citada e classifique:
- "sim": a fonte diz isso e trata do mesmo assunto da afirmação;
- "parcial": a fonte diz algo próximo, ou o fato está na fonte mas a resposta o usa para um assunto que a fonte não trata, ou a resposta apresenta como fato o que a fonte apresenta como alegação, hipótese ou comentário da curadoria (trechos como "Lição:"), ou trata contagem de publicações como se fosse medida do fenômeno;
- "nao": a fonte não diz isso, diz o contrário, ou a afirmação não tem fonte e não é trivial.
Ligações entre fontes feitas com conhecimento de fora ("é a mesma instituição", "é o que a norma X resolve") são "nao".

PASSO 2 — Rubrica. A nota de cada item mede o que a resposta ENTREGA sobre o assunto da pergunta:
- 2 = o item está entregue, com conteúdo sobre o assunto perguntado e apoiado nas fontes;
- 1 = entregue em parte, ou só com material vizinho (ex.: a pergunta é sobre golpes no Pix e a norma citada é de Open Finance);
- 0 = não entregue. Se a resposta diz honestamente que as fontes não trazem o item, a nota do item continua 0; o mérito de avisar entra em "honestidade" e o motivo entra em "causa": "fontes".
Não dê nota "pelo que as fontes permitiam". As fontes limitadas explicam a nota, não a aumentam.

PASSO 3 — Dimensões (0, 1 ou 2):
- fundamentacao: 2 = todas as afirmações conferidas são "sim" e não há afirmação factual relevante sem citação; 1 = há "parcial", ou uma afirmação secundária "nao"; 0 = há número, nome, norma ou fato central inventado ou contrário à fonte, ou duas ou mais "nao".
- especificidade: 2 = nomes, números, datas e métodos concretos SOBRE O QUE FOI PERGUNTADO; 1 = específica só em assuntos vizinhos, ou mistura concreto e genérico; 0 = genérica.
- honestidade: 2 = diz logo no início e de forma específica o que as fontes não cobrem, e distingue norma, estudo, reportagem e inferência; 1 = avisa só no fim, de forma vaga, ou avisa uma lacuna e esconde outra; 0 = responde como se as fontes cobrissem o que não cobrem, ou afirma que cobrem. Se as fontes cobrem tudo e a resposta não exagera, 2.
- utilidade: 2 = a persona consegue agir com isto e não será induzida a erro; 1 = ajuda em parte ou exige filtrar enchimento; 0 = não ajuda ou induz a erro (ex.: dá a um gestor de compliance a impressão de cobertura regulatória que não existe).
- formato: 2 = tamanho e estrutura servem à pergunta; 1 = um destes defeitos: seção ou lista que a pergunta não pediu, lista sem prioridade (ex.: todos os coautores de cada paper), blocos longos sem estrutura numa pergunta de várias partes, mais de ~800 palavras sem necessidade; 0 = dois ou mais desses defeitos, ou a estrutura atrapalha achar a resposta.
Se todas as dimensões estão em 2, releia a resposta procurando o defeito mais provável antes de confirmar.

PASSO 4 — Causa e lacunas.
- causa: "ok" só se todos os itens da rubrica são 2 e todas as dimensões são 2. "fontes" = o que faltou não estava nas fontes recebidas. "sintese" = estava nas fontes e a resposta não usou, usou mal ou distorceu. "formato" = o formato limitou ou inchou a resposta. Havendo mais de uma, escolha a que mais tirou pontos e cite a outra no comentário.
- fontes_ignoradas: números das fontes pertinentes à pergunta que a resposta não usou.
- fontes_fora_do_assunto: números das fontes recebidas que nada têm a ver com a pergunta (sinal para a recuperação).
- fontes_necessarias: descreva o TIPO de fonte que falta (ex.: "normas do Banco Central sobre devolução no Pix, com datas"). Não cite número de norma, lei ou título de documento de memória.

Responda SÓ com um objeto JSON, sem texto fora dele e sem comentários, neste formato:
{"verificacoes": [{"n": <número da fonte ou null>, "afirmacao": "<trecho curto da resposta>", "apoio": "sim" | "parcial" | "nao", "obs": "<curta>"}],
 "rubrica": [{"item": "<item da rubrica>", "nota": 0, "obs": "<curta>"}],
 "fundamentacao": 0, "especificidade": 0, "honestidade": 0, "utilidade": 0, "formato": 0,
 "causa": "ok" | "fontes" | "sintese" | "formato",
 "faltou": ["<o que faltou, concreto>"],
 "fontes_ignoradas": [<n>], "fontes_fora_do_assunto": [<n>],
 "fontes_necessarias": ["<tipo de fonte>"],
 "comentario": "<1-2 frases; comece pelo principal defeito>"}`;

/** v1: the formula of the first rounds (kept to compare with them). */
export function scoreV1(j) {
  const rub = j.rubrica?.length ? j.rubrica.reduce((s, r) => s + (r.nota || 0), 0) / (2 * j.rubrica.length) : 0;
  const parts = ["fundamentacao", "especificidade", "honestidade", "utilidade", "formato"].map((k) => (j[k] ?? 0) / 2);
  return Math.round(100 * (0.4 * rub + 0.6 * parts.reduce((a, b) => a + b, 0) / parts.length));
}

/** v2: same weights, with ceilings so a grave failure cannot hide behind good prose. */
export function score(j) {
  let s = scoreV1(j);
  if (j.fundamentacao === 0) s = Math.min(s, 50);                       // invented or contradicted facts
  if (j.honestidade === 0 && j.causa === "fontes") s = Math.min(s, 60); // pretended the sources covered it
  return s;
}

export const rubricPct = (j) => (j.rubrica?.length ? Math.round(100 * j.rubrica.reduce((s, r) => s + (r.nota || 0), 0) / (2 * j.rubrica.length)) : 0);

function parseJSON(text) {
  const t = String(text).replace(/```(?:json)?/g, "");
  return JSON.parse(t.slice(t.indexOf("{"), t.lastIndexOf("}") + 1).replace(/\/\/[^\n"]*$/gm, ""));
}

async function main() {
  const file = process.argv[2];
  const run = JSON.parse(await readFile(file, "utf8"));
  const env = { HF_TOKEN: process.env.HF_TOKEN, DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY, PAW_MODEL: arg("judge", "deepseek:deepseek-v4-pro") };
  const llm = makeLLM(env);
  let next = 0, cost = 0;
  const only = arg("ids")?.split(",");
  const items = run.results.filter((r) => r.ok && (!only || only.includes(r.id)));
  async function worker() {
    while (next < items.length) {
      const r = items[next++];
      const user = `PERSONA: ${r.persona}\nPERGUNTA: ${r.text}\nRUBRICA:\n${r.rubric.map((x) => `- ${x}`).join("\n")}\n\n` +
        `FONTES RECEBIDAS PELO ASSISTENTE:\n${(r.source_block || "").slice(0, 40000)}\n\nRESPOSTA DO ASSISTENTE:\n${r.answer}`;
      for (let tries = 0; tries < 2; tries++) {
        try {
          const out = await llm([{ role: "system", content: SYSTEM }, { role: "user", content: user }], 24000, { timeoutMs: 420000, expectOut: 4000 });
          cost += out.cost || 0;
          r.judge = parseJSON(out.text);
          r.judge.score = score(r.judge);
          r.judge.score_v1 = scoreV1(r.judge);
          r.judge.rubrica_pct = rubricPct(r.judge);
          r.judge.model = out.model;
          console.error(`${String(r.judge.score).padStart(3)} ${r.judge.causa.padEnd(8)} ${r.id}`);
          break;
        } catch (e) {
          console.error(`erro ${r.id}: ${e.message.slice(0, 120)}`);
        }
      }
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker));
  run.judge_cost = cost;
  run.judge_version = 2;
  const missing = items.filter((r) => !r.judge).map((r) => r.id);
  if (missing.length) { run.judge_missing = missing; console.error(`ATENÇÃO: ${missing.length} respostas sem julgamento: ${missing.join(", ")}`); }
  // the judged file is the record kept in git: drop the bulky source blocks (the raw run keeps them, locally)
  const kept = { ...run, results: run.results.map(({ source_block, ...r }) => ({ ...r, source_chars: (source_block || "").length })) };
  const out = arg("out") || file.replace(/\.json$/, ".judged.json");
  await writeFile(out, JSON.stringify(kept, null, 1));
  summarize(run);
  if (arg("calibrate")) await calibrate(run, arg("calibrate"));
}

/** Compare with a reference grading (e.g. evals/calibration/2026-11-25-fable.json): mean and max gap. */
async function calibrate(run, refFile) {
  const ref = JSON.parse(await readFile(refFile, "utf8"));
  const rows = [];
  for (const c of ref.cases) {
    const r = run.results.find((x) => x.id === c.id);
    if (r?.judge) rows.push([c.id, r.judge.score, c.your_judge.score]);
  }
  const gaps = rows.map(([, a, b]) => a - b);
  console.log("\ncalibração (juiz − referência):");
  for (const [id, a, b] of rows) console.log(`  ${String(a - b).padStart(4)}  ${id}: ${a} vs ${b}`);
  const mean = gaps.reduce((x, y) => x + y, 0) / (gaps.length || 1);
  console.log(`  diferença média ${mean.toFixed(1)}, maior |diferença| ${Math.max(...gaps.map(Math.abs))} (meta: média < 8 e nenhuma > 15)`);
}

export function summarize(run) {
  const judged = run.results.filter((r) => r.judge);
  const avg = (xs) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : "-");
  const group = (key) => {
    const g = {};
    for (const r of judged) (g[r[key]] ||= []).push(r.judge.score);
    return Object.entries(g).map(([k, v]) => `${k}: ${avg(v)}`).join(" | ");
  };
  const causes = {};
  for (const r of judged) causes[r.judge.causa] = (causes[r.judge.causa] || 0) + 1;
  console.log(`\nnota média ${avg(judged.map((r) => r.judge.score))}/100 em ${judged.length} respostas (custo do juiz US$ ${(run.judge_cost || 0).toFixed(3)})`);
  console.log(`por intenção: ${group("intent")}`);
  console.log(`por tema: ${group("topic")}`);
  console.log(`causa principal: ${JSON.stringify(causes)}`);
  const checks = judged.flatMap((r) => r.judge.verificacoes || []);
  if (checks.length) {
    const c = (v) => checks.filter((x) => x.apoio === v).length;
    console.log(`citações conferidas: ${checks.length} — sem apoio ${(100 * c("nao") / checks.length).toFixed(0)}%, parcial ${(100 * c("parcial") / checks.length).toFixed(0)}%`);
    console.log(`nota v1 (fórmula antiga) ${avg(judged.map((r) => r.judge.score_v1 ?? r.judge.score))}, rubrica ${avg(judged.map((r) => r.judge.rubrica_pct ?? 0))}%`);
  }
  for (const k of ["fundamentacao", "especificidade", "honestidade", "utilidade", "formato"]) {
    console.log(`${k}: ${(judged.reduce((s, r) => s + (r.judge[k] || 0), 0) / judged.length).toFixed(2)}/2`);
  }
}

if (process.argv[1]?.endsWith("judge.mjs")) main();
