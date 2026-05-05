-- 010: ai_generations — журнал AI-вызовов для quota guard и расчёта расхода.
-- Расширяет существующий token_usage (date/tokens_used/model/endpoint, агрегат)
-- до полноценного журнала с per-call cost_usd, duration, user_id, purpose.
-- Старая token_usage остаётся для совместимости с /api/admin/analytics.

CREATE TABLE IF NOT EXISTS ai_generations (
  id SERIAL PRIMARY KEY,
  provider VARCHAR(32) NOT NULL,                 -- 'gemini' | 'groq'
  model VARCHAR(128) NOT NULL,
  purpose VARCHAR(64) NOT NULL,                  -- 'chat' | 'story' | 'quiz' | 'coloring' | 'recommend' | 'tts' | 'translate' | 'simplify'
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd DOUBLE PRECISION NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_generations_created ON ai_generations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_generations_model_created ON ai_generations(model, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_generations_provider_created ON ai_generations(provider, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_generations_user ON ai_generations(user_id, created_at DESC);
