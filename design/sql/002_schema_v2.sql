-- Smart Kids Library — schema v2
-- Idempotent; run after 001_init.sql. Adds chat escalation, media assets,
-- visit tracking, strengthens FKs/cascades and removes default admin seed.

-- 1. Chat escalations (when AI cannot help and user wants a librarian)
CREATE TABLE IF NOT EXISTS chat_escalations (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100),
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    language VARCHAR(10) DEFAULT 'ru',
    question TEXT NOT NULL,
    contact TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'in_progress', 'resolved', 'cancelled')),
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    resolution_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_chat_escalations_status ON chat_escalations(status);
CREATE INDEX IF NOT EXISTS idx_chat_escalations_created ON chat_escalations(created_at DESC);

-- 2. Media assets (uploads library)
CREATE TABLE IF NOT EXISTS media_assets (
    id SERIAL PRIMARY KEY,
    url TEXT NOT NULL,
    filename TEXT NOT NULL,
    mime VARCHAR(100) NOT NULL,
    size_bytes INTEGER NOT NULL,
    width INTEGER,
    height INTEGER,
    kind VARCHAR(40) NOT NULL DEFAULT 'misc'
        CHECK (kind IN ('cover', 'news', 'event', 'poster', 'avatar', 'misc')),
    uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_media_assets_kind ON media_assets(kind);
CREATE INDEX IF NOT EXISTS idx_media_assets_created ON media_assets(created_at DESC);

-- 3. Visit tracking (for real analytics)
CREATE TABLE IF NOT EXISTS visits (
    id BIGSERIAL PRIMARY KEY,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    path TEXT NOT NULL,
    locale VARCHAR(10),
    age_group VARCHAR(10),
    referrer TEXT,
    user_agent TEXT,
    session_id VARCHAR(100),
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(date);
CREATE INDEX IF NOT EXISTS idx_visits_path ON visits(path);

-- 4. Moderation queue for AI-generated items that need staff approval
CREATE TABLE IF NOT EXISTS moderation_items (
    id SERIAL PRIMARY KEY,
    kind VARCHAR(40) NOT NULL
        CHECK (kind IN ('story', 'workshop', 'poster', 'social_post', 'chat_reply')),
    ref_id INTEGER,
    payload JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    review_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_moderation_status ON moderation_items(status);
CREATE INDEX IF NOT EXISTS idx_moderation_kind ON moderation_items(kind);

-- 5. Harden social_posts cascade (content deletion cleans up queued posts)
ALTER TABLE social_posts
    ALTER COLUMN scheduled_at TYPE TIMESTAMP WITH TIME ZONE;

-- Columns that may be missing when upgrading from 001
ALTER TABLE social_posts
    ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE social_posts
    ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_social_posts_status ON social_posts(status);
CREATE INDEX IF NOT EXISTS idx_social_posts_scheduled ON social_posts(scheduled_at);

-- 6. Extend stories with choice tree and status
ALTER TABLE stories ADD COLUMN IF NOT EXISTS choices_json JSONB;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected'));

-- 6b. reading_progress bookmarked column
ALTER TABLE reading_progress ADD COLUMN IF NOT EXISTS bookmarked BOOLEAN DEFAULT false;

-- 7. Ensure reading_progress unique constraint exists (should already)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'reading_progress_user_book_unique'
    ) THEN
        BEGIN
            ALTER TABLE reading_progress
                ADD CONSTRAINT reading_progress_user_book_unique UNIQUE (user_id, book_id);
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
    END IF;
END$$;

-- 8. Site settings — add working hours flag defaults
INSERT INTO site_settings (key, value) VALUES
    ('working_hours_weekdays', '09:00-18:00'),
    ('working_hours_saturday', '10:00-16:00'),
    ('working_hours_sunday', 'closed'),
    ('maintenance_mode', 'false')
ON CONFLICT (key) DO NOTHING;
