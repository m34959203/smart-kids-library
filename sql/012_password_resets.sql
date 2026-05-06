-- 012: password_resets — токены восстановления пароля.
-- Токен живёт 1 час, после использования удаляется. Создаётся через
-- /api/auth/recover, проверяется и исполняется через /api/auth/reset.

CREATE TABLE IF NOT EXISTS password_resets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token) WHERE used_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_password_resets_expires ON password_resets(expires_at);
