/**
 * TTS utilities — RU/KK с поддержкой нескольких голосов.
 * KK: Gemini gemini-3.1-flash-tts-preview (поддерживает 70+ языков, включая kk-KZ).
 * RU: Google TTS Wavenet → fallback ElevenLabs.
 * Voice mapping: ABSTRACT → конкретный voice id для конкретного провайдера.
 */

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
  const cacheKey = `gemini:${voice}:${text}`;
  const cached = ttsCache.get(cacheKey);
  if (cached) return cached;

  const model = process.env.GEMINI_TTS_MODEL || "gemini-3.1-flash-tts-preview";
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
    ttsCache.set(cacheKey, wav);
    return wav;
  } catch {
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
