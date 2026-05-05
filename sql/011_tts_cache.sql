-- 011: tts_cache — персистентный кеш TTS-ответов.
-- Гасит большинство повторных вызовов: одна и та же фраза + voice + model
-- → готовый WAV из БД, без сетевого вызова Gemini/ElevenLabs.
-- in-memory cache в src/lib/tts.ts остаётся как L1, БД — L2.

CREATE TABLE IF NOT EXISTS tts_cache (
  id SERIAL PRIMARY KEY,
  cache_key VARCHAR(96) NOT NULL UNIQUE,    -- sha256(provider + model + voice + text)
  provider VARCHAR(32) NOT NULL,             -- 'gemini' | 'google-ru' | 'eleven'
  model VARCHAR(128) NOT NULL,
  voice VARCHAR(64) NOT NULL,
  text_preview VARCHAR(160) NOT NULL,
  audio_base64 TEXT NOT NULL,
  mime_type VARCHAR(64) NOT NULL DEFAULT 'audio/wav',
  hits INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_hit_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tts_cache_created ON tts_cache(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tts_cache_last_hit ON tts_cache(last_hit_at DESC);
