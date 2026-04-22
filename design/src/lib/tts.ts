export interface TTSOptions {
  text: string;
  language: "ru" | "kk";
  voice?: string;
}

export async function generateSpeechGemini(text: string): Promise<ArrayBuffer | null> {
  // Use Gemini's TTS capabilities for Russian
  // Falls back to null if unavailable; client uses Web Speech API
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
    if (data.audioContent) {
      const binary = atob(data.audioContent);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes.buffer;
    }
    return null;
  } catch {
    return null;
  }
}

export async function generateSpeechElevenLabs(
  text: string,
  voiceId?: string
): Promise<ArrayBuffer | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voice = voiceId ?? process.env.ELEVENLABS_VOICE_ID ?? "21m00Tcm4TlvDq8ikWAM";

  if (!apiKey) return null;

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );
    if (!response.ok) return null;
    return await response.arrayBuffer();
  } catch {
    return null;
  }
}

export async function generateSpeech(options: TTSOptions): Promise<ArrayBuffer | null> {
  if (options.language === "kk") {
    // Kazakh: prefer ElevenLabs
    return await generateSpeechElevenLabs(options.text, options.voice);
  }
  // Russian: try Gemini/Google TTS first, fallback to ElevenLabs
  const result = await generateSpeechGemini(options.text);
  if (result) return result;
  return await generateSpeechElevenLabs(options.text, options.voice);
}
