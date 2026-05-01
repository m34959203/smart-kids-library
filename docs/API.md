# API Reference

REST-эндпоинты под `/api/*`. Все ручки возвращают JSON. Все мутации требуют
NextAuth-сессию (cookie); админские — роль `admin` или `librarian`.
Глобальный rate-limit: in-memory per-IP (см. `src/lib/rate-limit.ts`).

## Auth

| Метод | Путь | Назначение |
|-------|------|-----------|
| `*` | `/api/auth/[...nextauth]` | NextAuth (login/logout/session/csrf) |

## Каталог

### `GET /api/catalog`

Список книг с пагинацией.

Query: `page`, `limit`, `genre`, `age` (`6-9`/`10-13`/`14-17`),
`lang` (`ru`/`kk`), `available` (`true`), `id`, `q`,
**`section=lore`** (фильтр по краеведческому фонду).

Ответ: `{ books, total, page, limit, totalPages }`. При `id` — `{ book }`.

### `PUT /api/catalog`

Сохранить прогресс чтения. Требует auth.

Body: `{ bookId, currentPage, totalPages, bookmarked? }`

### `GET /api/catalog/progress`, `GET /api/catalog/progress/list`

Прогресс текущего пользователя.

### `POST /api/catalog/search`

AI-поиск (Gemini). Body: `{ query, language }` →
`{ books, suggestedFilters }`.

### `GET /api/recommend`

Hybrid-рекомендации (без ML). Скоринг по age (+12), language (+6),
history-genre (+5), history-author (+4), recent (+3), available (+2),
+ `RANDOM()`. Исключает дочитанные.

Query: `ageGroup`, `locale`, `limit` (по умолчанию 8).

Ответ: `{ books, locale, personalized: boolean }`.

## Глобальный поиск

### `GET /api/search/global`

Поиск по books + events + news + sections. Query: `q` (≥ 2 симв.), `locale`.
Ответ: `{ books[5], events[5], news[5], sections[5] }`.

## Чат / AI

### `POST /api/chatbot`

RAG-помощник. Body: `{ message, mode, language?, history }`.
Авто-детект KK/RU через `[әғқңөұүһі]` (см. `src/lib/lang-detect.ts`).
Ответ: `{ response, tokensUsed, source }`.

### `POST /api/chat/escalate`

Передать вопрос библиотекарю. Body: `{ question, contact, language }`.

### `POST /api/translate`

RU↔KK. Body: `{ text, target }`.

### `POST /api/simplify`

Адаптация текста под возраст. Body: `{ text, age }` (`6-9`/`10-13`/`14-17`).

## Контент

### Сказки

- `POST /api/stories/generate` — Body: `{ childName, theme, character, ageLevel, language, continuation?, previousStory? }`.
- `POST /api/stories/tts` — Body: `{ text, language, voices? }` → `audio/mpeg`.

### Викторины / творчество

- `POST /api/quizzes` — `{ difficulty, language, count }`.
- `POST /api/coloring` — `{ theme, language }` → SVG для раскраски.
- `POST /api/posters` — Gemini SVG-афиша 1080×1350. Body: `{ event }`.

### Образование

- `POST /api/education` — `{ type, mode, action, text?, topic?, grade?, language? }`.
  Тянет литературу из `school_curriculum`.

## Контент-менеджмент

| Метод | Путь | Назначение |
|-------|------|-----------|
| `GET/POST/PUT/DELETE` | `/api/news` | новости |
| `GET/POST/PUT/DELETE` | `/api/events` | события |
| `POST` | `/api/upload` | загрузка медиа (whitelist MIME, ≤ 8 МБ, требует staff) |

## Геймификация

### `GET /api/gamification?view=me`

Сводка по текущему пользователю: баллы, streak, достижения. Требует auth.

### `GET /api/gamification?view=leaderboard&limit=20`

Топ. Без auth, но rate-limited.

### `POST /api/gamification`

Начислить баллы. Body: `{ kind, refId?, points?, note?, userId? }`.
`admin_award` и кастомные `points` — только staff.

## Соц-сети

- `POST /api/social/post` — `{ contentType, contentId, platform, title, description, imageUrl }`.
- `POST /api/social/schedule` — поставить в очередь.
- `POST /api/social/tick` — worker (требует `CRON_SECRET`).

## Аналитика

- `POST /api/visits` — daily-checkin (бьёт также гейминг `checkin`).
- `GET /api/admin/analytics` — данные для админ-дашборда (`token_usage`, `chatbot_logs`, `visits`, `moderation_items`). Требует staff.

## Админ

| Метод | Путь | Назначение |
|-------|------|-----------|
| `GET/POST/PUT/DELETE` | `/api/admin/books` | CRUD каталога |
| `GET/POST` | `/api/admin/cms` | CRUD CMS-страниц |
| `GET/POST/PUT/DELETE` | `/api/admin/menu` | редактор меню |
| `GET/POST/PUT/DELETE` | `/api/admin/knowledge` | база знаний AI + системные промпты |
| `GET/POST/PUT/DELETE` | `/api/admin/social/posts` | очередь автопостинга |
| `GET/POST` | `/api/admin/settings` | site_settings (key-value) |
| `GET/POST` | `/api/admin/moderation` | модерация AI-контента |
| `POST` | `/api/admin/pdf-import` | парсинг PDF (pdf-parse + Gemini extract) — для одиночного импорта через UI |

> **Bulk-импорт фонда** (Pass 1) делается CLI-скриптами:
> `npm run books:import && npm run books:insert && npm run books:enrich`.
> Подробнее — `scripts/` и `NOTES.md` § запись 2026-05-01.

## SEO / PWA

- `GET /sitemap.xml` — статические + `books`/`news`/`events`.
- `GET /robots.txt`
- `GET /manifest.webmanifest`
- `GET /sw.js` — service worker (network-first для navigation, SWR для статики).
- `GET /opengraph-image` — Edge runtime.
