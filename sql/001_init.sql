-- Smart Kids Library Satpayev - Database Schema
-- PostgreSQL 16

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'reader' CHECK (role IN ('reader', 'librarian', 'admin')),
    name VARCHAR(255) NOT NULL,
    age_group VARCHAR(10) CHECK (age_group IN ('6-9', '10-13', '14-17')),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Books catalog
CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    author VARCHAR(500) NOT NULL,
    genre VARCHAR(100),
    description TEXT,
    cover_url TEXT,
    age_category VARCHAR(10) CHECK (age_category IN ('6-9', '10-13', '14-17')),
    isbn VARCHAR(20),
    year INTEGER,
    language VARCHAR(10) DEFAULT 'ru',
    is_available BOOLEAN DEFAULT true,
    file_url TEXT,
    page_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reading progress
CREATE TABLE reading_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    current_page INTEGER DEFAULT 1,
    total_pages INTEGER DEFAULT 0,
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, book_id)
);

-- Favorites
CREATE TABLE favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, book_id)
);

-- News
CREATE TABLE news (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(255) UNIQUE NOT NULL,
    title_kk TEXT,
    title_ru TEXT NOT NULL,
    content_kk TEXT,
    content_ru TEXT,
    excerpt_kk TEXT,
    excerpt_ru TEXT,
    image_url TEXT,
    category VARCHAR(100),
    author_id INTEGER REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title_kk TEXT,
    title_ru TEXT NOT NULL,
    description_kk TEXT,
    description_ru TEXT,
    image_url TEXT,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('workshop', 'author_meeting', 'contest', 'exhibition', 'reading')),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    location VARCHAR(255),
    age_group VARCHAR(10) DEFAULT 'all',
    max_participants INTEGER,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI-generated stories
CREATE TABLE stories (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    child_name VARCHAR(255),
    theme VARCHAR(255),
    character VARCHAR(255),
    language VARCHAR(10) DEFAULT 'ru',
    content TEXT NOT NULL,
    audio_url TEXT,
    age_level VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quiz results
CREATE TABLE quiz_results (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    quiz_type VARCHAR(50),
    book_id INTEGER REFERENCES books(id) ON DELETE SET NULL,
    score INTEGER NOT NULL DEFAULT 0,
    total INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chatbot knowledge base
CREATE TABLE chatbot_knowledge (
    id SERIAL PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    language VARCHAR(10) DEFAULT 'ru',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chatbot conversation logs
CREATE TABLE chatbot_logs (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100),
    user_message TEXT NOT NULL,
    bot_response TEXT,
    language VARCHAR(10) DEFAULT 'ru',
    tokens_used INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Token usage tracking
CREATE TABLE token_usage (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    tokens_used INTEGER NOT NULL DEFAULT 0,
    model VARCHAR(100) DEFAULT 'gemini-2.0-flash',
    endpoint VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Social media posts
CREATE TABLE social_posts (
    id SERIAL PRIMARY KEY,
    content_type VARCHAR(50),
    content_id INTEGER,
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('telegram', 'instagram')),
    post_text TEXT,
    image_url TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'posted', 'failed')),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    posted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Site settings (key-value store)
CREATE TABLE site_settings (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT
);

-- Indexes
CREATE INDEX idx_books_genre ON books(genre);
CREATE INDEX idx_books_age ON books(age_category);
CREATE INDEX idx_books_available ON books(is_available);
CREATE INDEX idx_books_title ON books USING gin(to_tsvector('simple', title));
CREATE INDEX idx_news_status ON news(status);
CREATE INDEX idx_news_slug ON news(slug);
CREATE INDEX idx_events_date ON events(start_date);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_chatbot_logs_session ON chatbot_logs(session_id);
CREATE INDEX idx_token_usage_date ON token_usage(date);
CREATE INDEX idx_reading_progress_user ON reading_progress(user_id);
CREATE INDEX idx_favorites_user ON favorites(user_id);

-- Bootstrap admin: NOT seeded via SQL anymore.
-- First-run provisioning uses SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD env vars
-- (see src/lib/seed.ts, called by server entrypoints).
-- Do NOT hard-code credentials in version control.

-- Insert sample chatbot knowledge
INSERT INTO chatbot_knowledge (category, question, answer, language) VALUES
('general', 'Как записаться в библиотеку?', 'Для записи нужен паспорт или свидетельство о рождении. Приходите к нам: г. Сатпаев, ул. Абая, 1. Запись бесплатная!', 'ru'),
('general', 'Кітапханаға қалай жазылуға болады?', 'Жазылу үшін паспорт немесе туу туралы куәлік керек. Бізге келіңіз: Сатпаев қ., Абай к-сі, 1. Жазылу тегін!', 'kk'),
('services', 'Как продлить книгу?', 'Вы можете продлить книгу онлайн в личном кабинете или позвонив по телефону +7 (710) 63-1-23-45.', 'ru'),
('services', 'Кітапты қалай ұзартуға болады?', 'Кітапты жеке кабинетте немесе +7 (710) 63-1-23-45 телефон арқылы ұзартуға болады.', 'kk'),
('hours', 'Часы работы библиотеки?', 'Мы работаем: Пн-Пт 9:00-18:00, Сб 10:00-16:00, Вс — выходной.', 'ru'),
('hours', 'Кітапхананың жұмыс уақыты?', 'Жұмыс уақыты: Дс-Жм 9:00-18:00, Сб 10:00-16:00, Жс — демалыс.', 'kk');

-- Insert sample settings
INSERT INTO site_settings (key, value) VALUES
('library_name', 'Smart Kids Library Satpayev'),
('library_phone', '+7 (710) 63-1-23-45'),
('library_email', 'library@satpaev.kz'),
('library_address_ru', 'г. Сатпаев, ул. Абая, 1'),
('library_address_kk', 'Сатпаев қ., Абай к-сі, 1');
