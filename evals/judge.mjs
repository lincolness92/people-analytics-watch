// Judge a run of the reference questions with a stronger model (the "teacher"), by rubric. For each answer:
// rubric items 0–2, groundedness, specificity, honesty about gaps, usefulness for the persona, whether the answer
// format fits the question, the main cause of any shortfall, and what was missing (what sources would have helped).
// That last part drives the question-first loop: a gap the sources did not cover is a source to go and get.
//
//   node evals/judge.mjs evals/runs/<run>.json [--judge deepseek:deepseek-v4-pro]
//
// Writes <run>.judged.json and prints a summary table by intent and topic.

import { readFile, writeFile } from "node:fs/promises";
import { makeLLM } from "../server/llm.js";

const arg = (name, def = null) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : def; };

const SYSTEM = `Você é um avaliador rigoroso de respostas de um assistente de pesquisa que só pode usar as fontes numeradas que recebeu.
Avalie a RESPOSTA à PERGUNTA, considerando a PERSONA de quem pergunta, a RUBRICA (o que uma boa resposta precisa cobrir) e as FONTES que o assistente recebeu.
Responda SÓ com um objeto JSON, sem texto fora dele, neste formato:
{"rubrica": [{"item": "<item da rubrica>", "nota": 0|1|2, "obs": "<curta>"}],
 "fundamentacao": 0|1|2,   // afirmações citam fontes [n] e batem com o que as fontes dizem; 0 se há invenção
 "especificidade": 0|1|2,  // nomes, números, datas, métodos concretos em vez de generalidades
 "honestidade": 0|1|2,     // diz claramente o que as fontes não cobrem, sem enrolar
 "utilidade": 0|1|2,       // ajuda de verdade essa persona a agir
 "formato": 0|1|2,         // tamanho e estrutura servem à pergunta (ex.: um plano de 3 meses pede etapas; um panorama pede seções)
 "causa": "ok" | "fontes" | "sintese" | "formato",  // principal motivo do que faltou: fontes = as fontes recebidas não tinham o necessário; sintese = as fontes tinham, a resposta não usou bem; formato = o formato limitou a resposta
 "faltou": ["<o que faltou na resposta, concreto>"],
 "fontes_necessarias": ["<tipo de fonte que teria permitido responder: ex. normas do Bacen sobre MED, relatórios de bancos, perfis de pesquisadores, repositórios>"],
 "comentario": "<1-2 frases>"}
Nota 2 = plenamente atendido; 1 = parcialmente; 0 = ausente ou errado. Seja exigente: uma resposta genérica sem números nem nomes não merece 2 em especificidade.`;

export function score(j) {
  const rub = j.rubrica?.length ? j.rubrica.reduce((s, r) => s + (r.nota || 0), 0) / (2 * j.rubrica.length) : 0;
  const parts = ["fundamentacao", "especificidade", "honestidade", "utilidade", "formato"].map((k) => (j[k] ?? 0) / 2);
  return Math.round(100 * (0.4 * rub + 0.6 * parts.reduce((a, b) => a + b, 0) / parts.length));
}

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
  const items = run.results.filter((r) => r.ok);
  async function worker() {
    while (next < items.length) {
      const r = items[next++];
      const user = `PERSONA: ${r.persona}\nPERGUNTA: ${r.text}\nRUBRICA:\n${r.rubric.map((x) => `- ${x}`).join("\n")}\n\n` +
        `FONTES RECEBIDAS PELO ASSISTENTE:\n${(r.source_block || "").slice(0, 40000)}\n\nRESPOSTA DO ASSISTENTE:\n${r.answer}`;
      for (let tries = 0; tries < 2; tries++) {
        try {
          const out = await llm([{ role: "system", content: SYSTEM }, { role: "user", content: user }], 6000, { timeoutMs: 240000, expectOut: 1500 });
          cost += out.cost || 0;
          r.judge = parseJSON(out.text);
          r.judge.score = score(r.judge);
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
  // the judged file is the record kept in git: drop the bulky source blocks (the raw run keeps them, locally)
  const kept = { ...run, results: run.results.map(({ source_block, ...r }) => ({ ...r, source_chars: (source_block || "").length })) };
  await writeFile(file.replace(/\.json$/, ".judged.json"), JSON.stringify(kept, null, 1));
  summarize(run);
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
  for (const k of ["fundamentacao", "especificidade", "honestidade", "utilidade", "formato"]) {
    console.log(`${k}: ${(judged.reduce((s, r) => s + (r.judge[k] || 0), 0) / judged.length).toFixed(2)}/2`);
  }
}

if (process.argv[1]?.endsWith("judge.mjs")) main();
