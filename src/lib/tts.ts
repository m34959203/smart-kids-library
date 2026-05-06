/**
 * TTS utilities — RU/KK с поддержкой нескольких голосов.
 * KK: Gemini gemini-3.1-flash-tts-preview (поддерживает 70+ языков, включая kk-KZ).
 * RU: Google TTS Wavenet → fallback ElevenLabs.
 * Voice mapping: ABSTRACT → конкретный voice id для конкретного провайдера.
 *
 * Кэш: L1 in-memory (Map) + L2 persistent (sql/011_tts_cache.sql).
 * Одна и та же фраза + voice + model → готовый WAV из БД, никаких
 * Gemini/ElevenLabs round-trip и квот не тратится.
 */
import { createHash } from "node:crypto";
import { query, getOne } from "./db";
import { assertQuota } from "./ai-quota";
import { logGeneration, approxTokens } from "./ai-log";

export interface TTSOptions {
  text: string;
  language: "ru" | "kk";
  voice?: string;
}

// Абстрактные роли для multi-voice сказок
export const VOICE_ROLES = ["narrator", "hero", "villain", "child", "elder", "magic"] as const;
export type VoiceRole = typeof VOICE_ROLES[number];

// Mapping: роль → Gemini prebuilt voice (Aoede=мягкий, Charon=низкий, Kore=яркий, Puck=игривый, Fenrir=хриплый)
const GEMINI_VOICE_BY_ROLE: Record<VoiceRole, string> = {
  narrator: "Aoede",
  hero: "Kore",
  villain: "Charon",
  child: "Puck",
  elder: "Fenrir",
  magic: "Aoede",
};

// Mapping: роль → ElevenLabs voice id (RU)
const ELEVEN_VOICE_BY_ROLE: Record<VoiceRole, string> = {
  narrator: process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM",
  hero: "pNInz6obpgDQGcFmaJgB",
  villain: "VR6AewLTigWG4xSOukaG",
  child: "jsCqWAovK2LkecY7zXl4",
  elder: "TxGEqnHWrfWFTfGW9XjX",
  magic: "EXAVITQu4vr4xnSDxMaL",
};

export function pickVoice(role: VoiceRole | string | undefined, provider: "gemini" | "eleven"): string {
  const r = (role as VoiceRole) || "narrator";
  if (provider === "gemini") return GEMINI_VOICE_BY_ROLE[r] ?? "Aoede";
  return ELEVEN_VOICE_BY_ROLE[r] ?? ELEVEN_VOICE_BY_ROLE.narrator;
}

const ttsCache = new Map<string, ArrayBuffer>();
const MEM_CACHE_MAX = 200;

function ttsCacheKey(provider: string, model: string, voice: string, text: string): string {
  return createHash("sha256").update(`${provider}::${model}::${voice}::${text}`).digest("hex");
}

async function lookupPersistentCache(key: string): Promise<ArrayBuffer | null> {
  try {
    const row = await getOne<{ audio_base64: string }>(
      `UPDATE tts_cache SET hits = hits + 1, last_hit_at = NOW()
       WHERE cache_key = $1
       RETURNING audio_base64`,
      [key]
    );
    if (!row?.audio_base64) return null;
    const buf = Buffer.from(row.audio_base64, "base64");
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  } catch (err) {
    console.warn("[tts] persistent cache lookup failed:", err);
    return null;
  }
}

async function storePersistentCache(
  key: string, provider: string, model: string, voice: string,
  text: string, audio: ArrayBuffer, mime: string
): Promise<void> {
  try {
    await query(
      `INSERT INTO tts_cache (cache_key, provider, model, voice, text_preview, audio_base64, mime_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (cache_key) DO NOTHING`,
      [key, provider, model, voice, text.slice(0, 160),
       Buffer.from(audio).toString("base64"), mime]
    );
  } catch (err) {
    console.warn("[tts] persistent cache insert failed:", err);
  }
}

// 16-bit PCM → WAV-обёртка (Gemini возвращает raw PCM)
function pcmToWav(pcm: Uint8Array, sampleRate = 24000, channels = 1, bitsPerSample = 16): ArrayBuffer {
  const byteRate = (sampleRate * channels * bitsPerSample) / 8;
  const blockAlign = (channels * bitsPerSample) / 8;
  const dataSize = pcm.length;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const writeStr = (off: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);
  new Uint8Array(buffer, 44).set(pcm);
  return buffer;
}

function parseSampleRate(mime: string, fallback = 24000): number {
  const m = /rate=(\d+)/i.exec(mime);
  return m ? Number(m[1]) : fallback;
}

export async function generateSpeechGeminiTTS(text: string, voice = "Aoede"): Promise<ArrayBuffer | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !text?.trim()) return null;
  const model = process.env.GEMINI_TTS_MODEL || "gemini-3.1-flash-tts-preview";
  const memKey = `gemini:${voice}:${text}`;
  const cached = ttsCache.get(memKey);
  if (cached) return cached;
  const persistKey = ttsCacheKey("gemini", model, voice, text);
  const persisted = await lookupPersistentCache(persistKey);
  if (persisted) {
    if (ttsCache.size >= MEM_CACHE_MAX) ttsCache.clear();
    ttsCache.set(memKey, persisted);
    return persisted;
  }
  // Cache miss → реальный сетевой вызов: проверяем квоту (USD-cap, RPM, RPD).
  // Бросает QuotaExceededError, ловится в /api/stories/tts/route.ts через
  // quotaErrorResponse() → 429 с понятным телом.
  await assertQuota(model);
  const startedAt = Date.now();
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
          },
        }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const part = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (!part?.data) return null;
    const mime = part.mimeType || "audio/L16;rate=24000";
    const pcm = Uint8Array.from(atob(part.data), (c) => c.charCodeAt(0));
    const wav = pcmToWav(pcm, parseSampleRate(mime));
    if (ttsCache.size >= MEM_CACHE_MAX) ttsCache.clear();
    ttsCache.set(memKey, wav);
    await storePersistentCache(persistKey, "gemini", model, voice, text, wav, "audio/wav");
    // TTS-billing: input = chars, output = PCM samples → используем approxTokens
    // для prompt и длину PCM как proxy completion (24kHz×16-bit ≈ 12k токенов/сек).
    await logGeneration({
      provider: "gemini",
      model,
      purpose: "tts",
      promptTokens: approxTokens(text),
      completionTokens: Math.ceil(pcm.length / 4),
      durationMs: Date.now() - startedAt,
    });
    return wav;
  } catch (err) {
    // QuotaExceededError должна пробрасываться вверх, чтобы /api/stories/tts
    // мог отдать клиенту 429 с понятным телом через quotaErrorResponse.
    if (err && typeof err === "object" && (err as { name?: string }).name === "QuotaExceededError") {
      throw err;
    }
    return null;
  }
}

export async function generateSpeechGoogleRu(text: string): Promise<ArrayBuffer | null> {
  try {
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { text },
          voice: { languageCode: "ru-RU", name: "ru-RU-Wavenet-A" },
          audioConfig: { audioEncoding: "MP3" },
        }),
      }
    );
    if (!response.ok) return null;
    const data = await response.json();
    if (!data.audioContent) return null;
    const binary = atob(data.audioContent);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
  } catch {
    return null;
  }
}

export async function generateSpeechElevenLabs(text: string, voiceId?: string): Promise<ArrayBuffer | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voice = voiceId ?? process.env.ELEVENLABS_VOICE_ID ?? "21m00Tcm4TlvDq8ikWAM";
  if (!apiKey) return null;

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "xi-api-key": apiKey },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    });
    if (!response.ok) return null;
    return await response.arrayBuffer();
  } catch {
    return null;
  }
}

export async function generateSpeech(options: TTSOptions): Promise<ArrayBuffer | null> {
  if (options.language === "kk") {
    // KK: Gemini TTS — единственный вариант с поддержкой kk-KZ
    return await generateSpeechGeminiTTS(options.text, options.voice || "Aoede");
  }
  // RU: Google TTS → ElevenLabs → Gemini TTS
  const google = await generateSpeechGoogleRu(options.text);
  if (google) return google;
  const eleven = await generateSpeechElevenLabs(options.text, options.voice);
  if (eleven) return eleven;
  return await generateSpeechGeminiTTS(options.text, options.voice || "Aoede");
}

/**
 * Парсит сказку с метками [voice:role] и возвращает массив сегментов.
 * Пример: "[voice:narrator] Жил-был кот. [voice:hero] Я найду звезду! [voice:narrator] И он отправился."
 * Если меток нет — один сегмент с ролью "narrator".
 */
export interface VoiceSegment { role: VoiceRole; text: string }

export function parseStoryVoices(text: string): VoiceSegment[] {
  const re = /\[voice:([a-z]+)\]/gi;
  const segments: VoiceSegment[] = [];
  let lastEnd = 0;
  let currentRole: VoiceRole = "narrator";
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const chunk = text.slice(lastEnd, m.index).trim();
    if (chunk) segments.push({ role: currentRole, text: chunk });
    const role = m[1].toLowerCase();
    currentRole = (VOICE_ROLES as readonly string[]).includes(role) ? (role as VoiceRole) : "narrator";
    lastEnd = m.index + m[0].length;
  }
  const tail = text.slice(lastEnd).trim();
  if (tail) segments.push({ role: currentRole, text: tail });
  return segments.length ? segments : [{ role: "narrator", text }];
}
