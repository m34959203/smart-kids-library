-- 013: audit_log — журнал критических админ-действий.
-- Пишется из /api/admin/* при PATCH/PUT/POST/DELETE и из /api/admin/settings.
-- Используется для расследования инцидентов и compliance (требование ТЗ).

CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  actor_id INTEGER,                       -- кто сделал (FK не ставим — пользователь может быть удалён)
  actor_email VARCHAR(255),
  actor_role VARCHAR(50),
  action VARCHAR(64) NOT NULL,            -- 'book.create', 'news.update', 'event.delete', 'settings.update', 'user.reset_password'
  target_type VARCHAR(64),                -- 'book', 'news', 'event', 'settings', 'user'
  target_id VARCHAR(255),
  ip_address VARCHAR(64),
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_target ON audit_log(target_type, target_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_recent ON audit_log(created_at DESC);
