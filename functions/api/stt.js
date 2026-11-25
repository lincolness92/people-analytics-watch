// /api/stt — speech to text for every text field of the site (server/voice.js). Behind the site password.
//   GET  → {enabled, models}
//   POST ?voter=<id>  body: audio (audio/wav preferred; webm/ogg/flac work) → {ok, text, model}
import { MAX_AUDIO_BYTES, spendDaily, sttModels, transcribe } from "../../server/voice.js";

const DAILY_LIMIT = 120;
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

export const onRequestGet = ({ env }) => json({ enabled: !!env.HF_TOKEN, models: env.HF_TOKEN ? sttModels(env) : [] });

export async function onRequestPost({ request, env }) {
  if (!env.HF_TOKEN) return json({ ok: false, error: "transcrição não configurada (HF_TOKEN)" }, 503);
  const bytes = await request.arrayBuffer();
  if (bytes.byteLength < 800) return json({ ok: false, error: "áudio vazio" }, 400);
  if (bytes.byteLength > MAX_AUDIO_BYTES) return json({ ok: false, error: "áudio longo demais (máx. ~90 s)" }, 413);
  const voter = (new URL(request.url).searchParams.get("voter") || "anon").slice(0, 40);
  const limited = await spendDaily(env, "stt", voter, DAILY_LIMIT);
  if (limited) return json({ ok: false, error: limited }, 429);
  try {
    const r = await transcribe(env, bytes, request.headers.get("Content-Type"));
    return json({ ok: true, text: r.text, model: r.model });
  } catch (e) {
    return json({ ok: false, error: e.message }, e.status || 502);
  }
}
