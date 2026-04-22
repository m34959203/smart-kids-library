-- 004_p3_close_gaps.sql — закрытие оставшихся 12 пробелов ТЗ (P3-батч)

-- 1. Видео в новостях (15.1)
ALTER TABLE news ADD COLUMN IF NOT EXISTS video_url TEXT;

-- 2. CMS статичных разделов (16.1)
CREATE TABLE IF NOT EXISTS cms_pages (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    title_ru TEXT NOT NULL,
    title_kk TEXT,
    content_ru TEXT NOT NULL,
    content_kk TEXT,
    meta_description_ru TEXT,
    meta_description_kk TEXT,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cms_pages_slug ON cms_pages(slug);

INSERT INTO cms_pages (slug, title_ru, title_kk, content_ru, content_kk) VALUES
('about',
 'О библиотеке',
 'Кітапхана туралы',
 '<h2>История</h2><p>Детская и юношеская библиотека Сатпаева — современный культурно-образовательный центр для детей 6-17 лет. Открыта при поддержке акимата г. Сатпаев.</p><h2>Отделы</h2><ul><li>Абонемент 6-9</li><li>Абонемент 10-13</li><li>Абонемент 14-17</li><li>Зал электронных ресурсов</li></ul>',
 '<h2>Тарихы</h2><p>Сәтбаев қаласының балалар мен жасөспірімдер кітапханасы — 6-17 жас аралығындағы балаларға арналған заманауи мәдени-білім беру орталығы.</p>'),
('rules',
 'Правила пользования',
 'Пайдалану ережелері',
 '<h2>Запись в библиотеку</h2><p>Записаться может любой житель города в возрасте от 6 до 17 лет. Документы: свидетельство о рождении / удостоверение, фото 3×4.</p><h2>Срок выдачи</h2><p>Книга выдаётся на 14 дней с возможностью продления.</p>',
 '<h2>Жазылу</h2><p>Кітапханаға 6-17 жас аралығындағы әрбір қала тұрғыны жазыла алады.</p>'),
('resources',
 'Электронные ресурсы',
 'Электрондық ресурстар',
 '<h2>Доступные ресурсы</h2><ul><li>Электронный каталог</li><li>Аудиокниги</li><li>Интерактивные сказки</li><li>Викторины</li></ul>',
 '<h2>Қол жетімді ресурстар</h2><ul><li>Электронды каталог</li><li>Аудиокітаптар</li></ul>')
ON CONFLICT (slug) DO NOTHING;

-- 3. Меню навигации (16.2) — JSON-конфиг в site_settings + явная таблица для дополнительных пунктов
CREATE TABLE IF NOT EXISTS menu_items (
    id SERIAL PRIMARY KEY,
    age_profile VARCHAR(10) NOT NULL CHECK (age_profile IN ('6-9', '10-13', '14-17', 'default')),
    label_ru TEXT NOT NULL,
    label_kk TEXT,
    href TEXT NOT NULL,
    icon VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    visible BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_menu_items_profile ON menu_items(age_profile, sort_order);

-- 4. Школьная программа РК 1-11 (9.4)
CREATE TABLE IF NOT EXISTS school_curriculum (
    id SERIAL PRIMARY KEY,
    grade INTEGER NOT NULL CHECK (grade BETWEEN 1 AND 11),
    subject VARCHAR(100) NOT NULL,
    kind VARCHAR(20) NOT NULL CHECK (kind IN ('required', 'additional')),
    title TEXT NOT NULL,
    author TEXT,
    description TEXT,
    language VARCHAR(10) DEFAULT 'ru',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_school_curriculum_grade ON school_curriculum(grade, subject);

-- Минимальный seed (расширяется через admin)
INSERT INTO school_curriculum (grade, subject, kind, title, author, language) VALUES
(1, 'Әдебиеттік оқу', 'required', 'Алдар көсе ертегілері', 'Халық', 'kk'),
(1, 'Литературное чтение', 'required', 'Сказки А.С. Пушкина', 'А.С. Пушкин', 'ru'),
(2, 'Литературное чтение', 'required', 'Дядя Стёпа', 'С. Михалков', 'ru'),
(3, 'Әдебиеттік оқу', 'required', 'Балапан мен мысық', 'Ы. Алтынсарин', 'kk'),
(4, 'Литературное чтение', 'required', 'Серебряное копытце', 'П. Бажов', 'ru'),
(5, 'Қазақ әдебиеті', 'required', 'Менің атым Қожа', 'Б. Соқпақбаев', 'kk'),
(5, 'Литература', 'required', 'Муму', 'И.С. Тургенев', 'ru'),
(6, 'Литература', 'required', 'Дубровский', 'А.С. Пушкин', 'ru'),
(7, 'Қазақ әдебиеті', 'required', 'Қыз Жібек', 'Халық эпосы', 'kk'),
(7, 'Литература', 'required', 'Тарас Бульба', 'Н.В. Гоголь', 'ru'),
(8, 'Литература', 'required', 'Капитанская дочка', 'А.С. Пушкин', 'ru'),
(9, 'Қазақ әдебиеті', 'required', 'Абай жолы', 'М. Әуезов', 'kk'),
(9, 'Литература', 'required', 'Мёртвые души', 'Н.В. Гоголь', 'ru'),
(10, 'Литература', 'required', 'Война и мир', 'Л.Н. Толстой', 'ru'),
(10, 'Қазақ әдебиеті', 'required', 'Қан мен тер', 'Ә. Нұрпейісов', 'kk'),
(11, 'Литература', 'required', 'Мастер и Маргарита', 'М.А. Булгаков', 'ru'),
(11, 'Қазақ әдебиеті', 'required', 'Көшпенділер', 'І. Есенберлин', 'kk')
ON CONFLICT DO NOTHING;

-- 5. Расширенные настройки ИИ в site_settings (16.6)
INSERT INTO site_settings (key, value) VALUES
    ('ai_tone', 'дружелюбный, адаптированный для подростков'),
    ('ai_max_length', '500'),
    ('ai_blocked_topics', 'политика,религия,18+,насилие,наркотики'),
    ('ai_system_prompt_general_ru', 'Ты — дружелюбный библиотекарь Smart Kids Library Сатпаев. Отвечаешь подросткам коротко и по делу, на русском языке. Тон тёплый, без снисхождения.'),
    ('ai_system_prompt_general_kk', 'Сен — Сәтбаев Smart Kids Library кітапханасының достық кеңесшісісің. Жасөспірімдерге қазақ тілінде қысқа әрі нақты жауап бересің.'),
    ('social_telegram_token', ''),
    ('social_telegram_channel', ''),
    ('social_instagram_token', ''),
    ('social_instagram_account', ''),
    ('social_optimal_time_telegram', '12:00'),
    ('social_optimal_time_instagram', '19:00'),
    ('social_timezone_offset', '+05:00')
ON CONFLICT (key) DO NOTHING;

-- 6. Глобальный поиск — индексы для производительности
CREATE INDEX IF NOT EXISTS idx_books_title_search ON books USING gin(to_tsvector('simple', title || ' ' || COALESCE(author, '')));
CREATE INDEX IF NOT EXISTS idx_news_title_search ON news USING gin(to_tsvector('simple', title_ru || ' ' || COALESCE(title_kk, '')));
CREATE INDEX IF NOT EXISTS idx_events_title_search ON events USING gin(to_tsvector('simple', title_ru || ' ' || COALESCE(title_kk, '')));
