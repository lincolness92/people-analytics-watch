// /api/tts — read text aloud with ElevenLabs (server/voice.js), when ELEVENLABS_API_KEY is set. Behind the site password.
//   GET  → {enabled}
//   POST {text, voter} → audio/mpeg
import { speakable, spendDaily, synthesize } from "../../server/voice.js";

const DAILY_LIMIT = 10;
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

export const onRequestGet = ({ env }) => json({ enabled: !!env.ELEVENLABS_API_KEY });

export async function onRequestPost({ request, env }) {
  if (!env.ELEVENLABS_API_KEY) return json({ ok: false, error: "voz não configurada (ELEVENLABS_API_KEY)" }, 503);
  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: "JSON inválido" }, 400); }
  const text = speakable(body?.text);
  if (text.length < 2) return json({ ok: false, error: "texto vazio" }, 400);
  const limited = await spendDaily(env, "tts", String(body?.voter || "anon").slice(0, 40), DAILY_LIMIT);
  if (limited) return json({ ok: false, error: limited }, 429);
  try {
    const r = await synthesize(env, text);
    return new Response(r.body, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" } });
  } catch (e) {
    return json({ ok: false, error: e.message }, e.status || 502);
  }
}
