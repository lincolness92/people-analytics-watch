// Voice for every text field of the site: speech to text through Hugging Face Inference Providers (Whisper) and,
// when an ElevenLabs key is configured, text to speech. Provider-specific code lives here; functions/api/stt.js and
// functions/api/tts.js only do HTTP.
//
// STT: the browser records (any format), decodes and sends WAV mono 16 kHz (the hf-inference provider does not
// read the iPhone's audio/mp4); webm/ogg/flac also work. Models in STT_MODEL (comma-separated), default
// whisper-large-v3-turbo (fast, multilingual) then whisper-large-v3.
// TTS: ELEVENLABS_API_KEY (secret); optional ELEVENLABS_VOICE_ID and ELEVENLABS_MODEL (default eleven_multilingual_v2,
// the most natural for cloned voices; eleven_v3 is more expressive, eleven_flash_v2_5 cheaper but flat). Voice settings
// are not sent, so the voice's own saved settings apply, as on elevenlabs.io.

export const STT_MODELS = ["openai/whisper-large-v3-turbo", "openai/whisper-large-v3"];
const HF_ASR = (model) => `https://router.huggingface.co/hf-inference/models/${model}`;
export const AUDIO_TYPES = /^audio\/(wav|x-wav|wave|webm|ogg|flac)$/;
export const MAX_AUDIO_BYTES = 3_000_000; // ~90 s of 16 kHz mono WAV

export const sttModels = (env) => (env.STT_MODEL || "").split(",").map((m) => m.trim()).filter(Boolean).concat(STT_MODELS)
  .filter((m, i, a) => a.indexOf(m) === i);

/** Transcribe audio bytes; tries each model in turn. Returns {text, model, attempts}; throws when all fail. */
export async function transcribe(env, bytes, contentType, fetchImpl = fetch) {
  const type = String(contentType || "audio/wav").split(";")[0].trim().toLowerCase();
  if (!AUDIO_TYPES.test(type)) throw Object.assign(new Error(`formato de áudio não suportado: ${type}`), { status: 415 });
  const attempts = [];
  for (const model of sttModels(env)) {
    const t0 = Date.now();
    try {
      const r = await fetchImpl(HF_ASR(model), { method: "POST", body: bytes, signal: AbortSignal.timeout(60000),
        headers: { Authorization: `Bearer ${env.HF_TOKEN}`, "Content-Type": type } });
      const out = await r.json().catch(() => ({}));
      if (r.ok && typeof out.text === "string") {
        attempts.push({ model, ok: true, ms: Date.now() - t0 });
        return { text: out.text.trim(), model, attempts };
      }
      attempts.push({ model, ok: false, ms: Date.now() - t0, error: String(out.error || `HTTP ${r.status}`).slice(0, 160) });
    } catch (e) {
      attempts.push({ model, ok: false, ms: Date.now() - t0, error: String(e.message).slice(0, 160) });
    }
  }
  throw Object.assign(new Error(`transcrição indisponível (${attempts.at(-1)?.error || "sem modelo"})`), { status: 502, attempts });
}

export const TTS_DEFAULT_VOICE = "JBFqnCBsd6RMkjVDRZzb"; // a premade ElevenLabs voice; multilingual models speak PT with it
export const TTS_MAX_CHARS = 3000;

/** Text as it should be read aloud: no citation marks, markdown or URLs, and every line ends as a sentence
 *  (headings and list items carry no final punctuation, and without it the voice runs them together flatly). */
export function speakable(text) {
  return String(text || "")
    .replace(/\s?\[\d{1,2}\]/g, "")
    .replace(/\*\*|__|`|^#{1,4}\s*/gm, "")
    .replace(/^\s*[-*•]\s+/gm, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[ \t]+/g, " ")
    .split("\n").map((l) => l.trim()).filter(Boolean)
    .map((l) => (/[.!?…:;]$/.test(l) ? l : `${l}.`).replace(/:$/, "."))
    .join("\n").slice(0, TTS_MAX_CHARS);
}

export const TTS_DEFAULT_MODEL = "eleven_multilingual_v2";

/** Request body: the model, and the language for the models that take one (multilingual_v2 detects it). */
export function ttsBody(env, text) {
  const model = env.ELEVENLABS_MODEL || TTS_DEFAULT_MODEL;
  return { text, model_id: model, apply_text_normalization: "auto", ...(/v2_5|v3/.test(model) ? { language_code: "pt" } : {}) };
}

/** Text to speech with ElevenLabs. Returns a Response with audio/mpeg (or throws). */
export async function synthesize(env, text, fetchImpl = fetch) {
  const voice = env.ELEVENLABS_VOICE_ID || TTS_DEFAULT_VOICE;
  const r = await fetchImpl(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}?output_format=mp3_44100_128`, {
    method: "POST", signal: AbortSignal.timeout(60000),
    headers: { "xi-api-key": env.ELEVENLABS_API_KEY, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify(ttsBody(env, text)),
  });
  if (!r.ok) {
    const detail = await r.text().catch(() => "");
    throw Object.assign(new Error(`voz indisponível (HTTP ${r.status}: ${detail.slice(0, 120)})`), { status: 502 });
  }
  return r;
}

/** Daily per-person limit in KV (same scheme as the questions). Returns null when allowed, or an error string. */
export async function spendDaily(env, bucket, voter, limit) {
  if (!env.FEEDBACK) return null;
  const key = `rl-${bucket}:${new Date().toISOString().slice(0, 10)}:${voter || "anon"}`;
  const used = parseInt((await env.FEEDBACK.get(key)) || "0", 10);
  if (used >= limit) return `limite diário de ${limit} atingido`;
  await env.FEEDBACK.put(key, String(used + 1), { expirationTtl: 60 * 60 * 36 });
  return null;
}
