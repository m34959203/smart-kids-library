-- 008_extend_books_for_lore.sql
-- Расширяем books для массового импорта краеведческого фонда (Өлкетану)
-- из docs/Text/Text/.
--
-- Добавляет: category, file_type, file_size, content_text, is_digital,
--            content_type, original_filename, title_ru/title_kk.
-- Никакие существующие данные не трогает.

ALTER TABLE books ADD COLUMN IF NOT EXISTS category VARCHAR(200);
ALTER TABLE books ADD COLUMN IF NOT EXISTS category_kk VARCHAR(200);
ALTER TABLE books ADD COLUMN IF NOT EXISTS title_ru VARCHAR(500);
ALTER TABLE books ADD COLUMN IF NOT EXISTS title_kk VARCHAR(500);
ALTER TABLE books ADD COLUMN IF NOT EXISTS description_ru TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS description_kk TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS file_type VARCHAR(10);
ALTER TABLE books ADD COLUMN IF NOT EXISTS file_size BIGINT DEFAULT 0;
ALTER TABLE books ADD COLUMN IF NOT EXISTS content_text TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS content_type VARCHAR(40);
ALTER TABLE books ADD COLUMN IF NOT EXISTS is_digital BOOLEAN DEFAULT FALSE;
ALTER TABLE books ADD COLUMN IF NOT EXISTS original_filename TEXT;

-- author NOT NULL мешает массовому импорту (часто автор неизвестен).
-- Делаем nullable.
ALTER TABLE books ALTER COLUMN author DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);
CREATE INDEX IF NOT EXISTS idx_books_language ON books(language);
CREATE INDEX IF NOT EXISTS idx_books_file_type ON books(file_type);
CREATE INDEX IF NOT EXISTS idx_books_digital ON books(is_digital) WHERE is_digital = TRUE;
CREATE INDEX IF NOT EXISTS idx_books_content_text ON books USING gin(to_tsvector('simple', coalesce(content_text, '')));

-- Пункт меню «Краеведение / Өлкетану» теперь ведёт прямо в раздел каталога,
-- а не на отдельную /about/local-lore страницу.
UPDATE menu_items
   SET href = '/catalog?section=lore'
 WHERE label_ru = 'Краеведение' AND href = '/about/local-lore';
