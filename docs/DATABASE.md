# Database Schema

PostgreSQL 16. Схема разворачивается через идемпотентные миграции в порядке
имён файлов в `sql/`. В Docker автоматически прогоняется только `001_init.sql`
(через `docker-entrypoint-initdb.d`); остальные миграции прогоняются вручную
на старте или через `psql`-loop (см. [`DEPLOYMENT.md`](DEPLOYMENT.md)).

## Миграции

| Файл | Содержимое |
|------|------------|
| `001_init.sql` | базовый скелет: users, books, reading_progress, favorites, news, events, stories, quiz_results, chatbot_*, token_usage, social_posts, site_settings (+ индексы и сиды) |
| `002_schema_v2.sql` | chat_escalations, media_assets, visits, moderation_items, choices_json/status в stories, bookmarked в reading_progress |
| `003_gamification.sql` | points_events, achievements (+ 11 сид-достижений), user_achievements, user_streaks |
| `004_seed_books.sql` | сид справочной литературы (1–11 кл., RU/KK) |
| `005_p3_close_gaps.sql` | cms_pages, menu_items, school_curriculum, news.video_url, расширение site_settings |
| `006_nullify_openlibrary_covers.sql` | очистка битых cover_url |
| `007_import_dubsatpaev.sql` | импорт со старого сайта dubsatpaev.kz: реквизиты, новости, события, FAQ, меню |
| `008_extend_books_for_lore.sql` | расширение books для краеведческого фонда: category, category_kk, title_ru/kk, description_ru/kk, file_type, file_size, content_text, content_type, is_digital, original_filename + GIN-индекс |
| `009_security_curriculum_cors.sql` | CASCADE на social_posts→news/events; расширение school_curriculum 17→146 произведений |

## Таблицы (25)

### Учётные

| Table | Назначение |
|-------|-----------|
| `users` | аккаунты (роли `reader`/`librarian`/`admin`, age_group) |
| `reading_progress` | прогресс чтения (current_page, total_pages, bookmarked) |
| `favorites` | избранные книги пользователя |
| `user_streaks` | дневные стрики чтения |
| `user_achievements` | разблокированные достижения |
| `points_events` | журнал начисления баллов (kind ∈ checkin/book_finished/.../admin_award) |
| `achievements` | каталог достижений (code, title_ru/kk, points, tier) |

### Контент

| Table | Назначение |
|-------|-----------|
| `books` | каталог (~1 000 записей; см. ниже расширенную схему) |
| `school_curriculum` | школьная программа РК 1–11 кл. (146 произведений RU+KK) |
| `news` | двуязычные новости (slug, title_ru/kk, excerpt_ru/kk, content_ru/kk, video_url, status) |
| `events` | мероприятия (title_ru/kk, event_type, start_date, age_group, status) |
| `stories` | сгенерированные сказки (story_text, choices_json, status moderation) |
| `quiz_results` | история викторин |
| `cms_pages` | CMS-страницы /about, /rules, /resources… (slug, title_ru/kk, content_ru/kk) |
| `menu_items` | редактируемое меню (age_profile, label_ru/kk, href, sort_order, visible) |

### AI / коммуникации

| Table | Назначение |
|-------|-----------|
| `chatbot_knowledge` | FAQ для AI-фоллбэка (category, question, answer, language) |
| `chatbot_logs` | логи диалогов |
| `chat_escalations` | эскалации к библиотекарю |
| `token_usage` | дневной учёт Gemini токенов |
| `moderation_items` | очередь модерации AI-контента |

### Инфраструктура

| Table | Назначение |
|-------|-----------|
| `media_assets` | медиа-библиотека (cover/news/event/poster/avatar) |
| `social_posts` | очередь автопостов IG/TG (status, retry, scheduled_at) |
| `visits` | трекинг просмотров (date, path, locale, age_group) |
| `site_settings` | key-value настройки (реквизиты, тон AI, токены IG/TG, оптимальное время постинга) |

## Расширенная схема `books`

```text
id, title, author, genre, description, cover_url, age_category, isbn, year,
language, is_available, file_url, page_count, created_at,
+ category, category_kk, title_ru, title_kk, description_ru, description_kk,
+ file_type, file_size, content_text, content_type, is_digital, original_filename
```

`title` остаётся для совместимости со старым кодом; UI выбирает локализованный
заголовок каскадом `title_${locale}` → `title_${other}` → `title`.

## Ключевые индексы

- `books`: GIN на `to_tsvector('simple', content_text)` для full-text;
  btree на `genre`, `age_category`, `is_available`, `category`, `language`,
  `file_type`, partial `is_digital`.
- `reading_progress`: уникальный `(user_id, book_id)`.
- `news`: `idx_news_published_at`, `idx_news_status`.
- `events`: `idx_events_start_date`.
- `points_events`: `(user_id, created_at DESC)`, `kind`.
- `visits`: `date`, `path`.

## Связи

- `reading_progress`, `favorites`, `quiz_results` → `users`, `books` (CASCADE)
- `social_posts.news_id` / `event_id` → `news` / `events` (CASCADE с миграции 009)
- `stories.user_id` → `users` (SET NULL)
- `chat_escalations.user_id`/`assigned_to` → `users` (SET NULL)
- `media_assets.uploaded_by` → `users` (SET NULL)
- `points_events.user_id`, `user_achievements.user_id`, `user_streaks.user_id` → `users` (CASCADE)
- `user_achievements.achievement_code` → `achievements.code` (CASCADE)
