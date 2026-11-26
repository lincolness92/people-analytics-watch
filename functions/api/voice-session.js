// /api/voice-session — voice conversation with the ElevenLabs agent (server/voice.js), when ELEVENLABS_API_KEY and
// ELEVENLABS_AGENT_ID are set. Behind the site password; the browser gets only a short-lived WebRTC token.
//   GET  → {enabled}
//   POST {voter} → {ok, token}
import { conversationToken, spendDaily } from "../../server/voice.js";

const DAILY_LIMIT = 5; // conversations per person per day
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

export const onRequestGet = ({ env }) => json({ enabled: !!(env.ELEVENLABS_API_KEY && env.ELEVENLABS_AGENT_ID) });

export async function onRequestPost({ request, env }) {
  if (!env.ELEVENLABS_API_KEY || !env.ELEVENLABS_AGENT_ID) return json({ ok: false, error: "conversa por voz não configurada" }, 503);
  let body = {};
  try { body = await request.json(); } catch { /* voter is optional */ }
  const limited = await spendDaily(env, "voz", String(body?.voter || "anon").slice(0, 40), DAILY_LIMIT);
  if (limited) return json({ ok: false, error: limited }, 429);
  try {
    return json({ ok: true, token: await conversationToken(env) });
  } catch (e) {
    return json({ ok: false, error: e.message }, e.status || 502);
  }
}
