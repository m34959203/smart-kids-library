# Smart Kids Library Satpayev — живой документ

> Журнал и навигатор по проекту. Обновлять после каждой существенной работы (статус, решения, договорённости, инциденты). Новые строки в таблицах — сверху.

## 1. Быстрый старт

| | |
|---|---|
| Origin | [m34959203/smart-kids-library](https://github.com/m34959203/smart-kids-library) (**PUBLIC** c 2026-04-19) |
| Локаль-путь | `/home/ubuntu/smart-kids-library` |
| Бранч | `master` |
| Стек | Next.js 16.2.2 / React 19.2.4 / TS 5 / Tailwind 4 / Postgres 16 / NextAuth 4 / next-intl 4 / `@google/generative-ai` 0.24 |
| Dev-порт | `3003` (контейнер) / `3000` (локально `next dev`) |
| DB-порт | `5440` → внутри контейнера `5432` |
| Docker | `docker compose up --build` из корня |
| Референс заказчика | https://shahtinsklib.kz/ru |
| Заказчик | Детская и юношеская библиотека г. Сатпаев (Казахстан) |

### ENV, критично
`.env` должен содержать: `DATABASE_URL`, `NEXTAUTH_SECRET` (≥ 32 байт), `NEXTAUTH_URL`, `GEMINI_API_KEY`, `GEMINI_DAILY_TOKEN_LIMIT` (по умолчанию 1 500 000), `ELEVENLABS_API_KEY`+`ELEVENLABS_VOICE_ID`, `TELEGRAM_BOT_TOKEN`+`TELEGRAM_CHANNEL_ID`, `INSTAGRAM_ACCESS_TOKEN`+`INSTAGRAM_ACCOUNT_ID`, `NEXT_PUBLIC_APP_URL`, `SEED_ADMIN_EMAIL`+`SEED_ADMIN_PASSWORD` (для первичного сида админа).

## 2. Архитектура (факт)

### Роутинг (`src/app/[locale]/...`)
- **Public** (`(public)` группа): `/`, `/catalog`, `/catalog/[id]`, `/catalog/read/[id]`, `/news`, `/news/[slug]`, `/events`, `/events/[id]`, `/about`, `/services`, `/resources`, `/rules`, `/contacts`, `/profile`, `/kids`, `/kids/stories`, `/kids/quizzes`, `/kids/workshop`, `/kids/coloring`
- **Admin** (`(admin)` группа): `/admin`, `/admin/catalog`, `/admin/news`, `/admin/events`, `/admin/social`, `/admin/moderation`, `/admin/knowledge`, `/admin/analytics`

### API (`src/app/api/...`)
`/auth/[...nextauth]`, `/catalog`, `/catalog/search`, `/news`, `/events`, `/recommend`, `/upload`, `/chatbot`, `/education`, `/stories/generate`, `/stories/tts`, `/coloring`, `/quizzes`, `/social/post`

### Библиотеки (`src/lib/`)
`db.ts` (pg Pool), `gemini.ts` (generateText/Chat/JSON + tracking), `token-tracker.ts` (SUM per day), `tts.ts` (каскад Gemini→ElevenLabs→WebSpeech), `stt.ts` (WebSpeech обёртка), `telegram.ts`, `instagram.ts`, `auth.ts` (CredentialsProvider, SHA-256), `i18n.ts`, `utils.ts` (cn).

### БД (`sql/001_init.sql`)
13 таблиц: `users`, `books`, `reading_progress`, `favorites`, `news`, `events`, `stories`, `quiz_results`, `chatbot_knowledge`, `chatbot_logs`, `token_usage`, `social_posts`, `site_settings`. Индексы есть на `books(genre/age/title)`, `news(status/slug)`, `events(start_date/type/status)`, `chatbot_logs(session_id)`, `token_usage(date)`, `reading_progress(user_id)`, `favorites(user_id)`.

## 3. Статус реализации vs ТЗ

Подробный аудит — см. журнал в §7 (запись 2026-04-19).

**Итог покрытия: ~75 %** (по аудиту 2026-04-19).

**Сделано полностью:** каталог+читалка, чат-виджет 24/7 с STT/TTS, ИИ-поиск, образовательный ИИ, генератор сказок 3 уровней+озвучка, викторины, творческая мастерская, раскраски, EventCalendar, автопостинг IG/TG, token-tracker+FAQ fallback, контекстные подсказки, NextAuth роли.

**Частично:** age-switcher (только `?age=`, не persistent), admin moderation (UI без backend), admin analytics (hardcoded), BookReader (сохраняет, не подтягивает прогресс), recommend (random), IG/TG без scheduling, admin CRUD каркасы.

**Отсутствует:** автоперевод, упрощение текста, генератор афиш, эскалация чата, sitemap/robots/JSON-LD, PWA SW, WCAG-пас, rate-limit, Zod, security headers, CSP.

## 4. Деплой (план)

Целевой хост — TBD (ожидается от заказчика; вероятно Hoster.kz или собственный VPS). До прод-заливки обязательный чек-лист:
1. `NEXTAUTH_SECRET` сгенерирован `openssl rand -base64 32`
2. Дефолтный admin **НЕ сидится** из SQL-init; создаётся через `SEED_ADMIN_*` при первом запуске, пароль сменён
3. `.env` вне репо, секреты в Docker-secret / env-файле с `chmod 600`
4. `output: "standalone"` в next.config + `next build` в Dockerfile
5. Postgres backup: `pg_dump` в cron, volume persisted
6. HTTPS через reverse-proxy (Traefik/Nginx), SSL сертификат
7. Все `NEXT_PUBLIC_APP_URL` и `NEXTAUTH_URL` указывают на боевой домен
8. Rate-limit middleware включён, CSP заголовки заданы
9. Prod-миграции прогнаны (`sql/00X_*.sql` идемпотентны)

## 5. Договорённости / правила

| Правило | Почему |
|---|---|
| Контент на двух языках одновременно: `*_ru` и `*_kk` | ТЗ требует билингвальности; колонки уже заложены в БД |
| AI-ответы детям — через модерацию | Безопасность контента для аудитории 6-17 |
| Любой новый AI-эндпоинт — через `src/lib/gemini.ts` с `trackTokenUsage` | Единая точка учёта токенов и лимита |
| В админ-роутах проверка сессии с `role IN ('admin','librarian')` | Изолировать CMS от читателей |
| Секреты и API-ключи НЕ коммитим | `.env` в `.gitignore`, примеры в `.env.example` только с плейсхолдерами |
| Git remote — без токенов в URL | Пуш через `gh` или SSH |
| Перед изменениями Next-API читаем `node_modules/next/dist/docs/` | v16 — много breaking changes относительно обучения модели (см. AGENTS.md) |
| Живой документ = NOTES.md, обновлять после каждой существенной работы | Преемственность между сессиями |

## 6. Известные риски / долги

- **Security**: `admin123` сидится хэшем в SQL — снести до прод-деплоя (решается в задаче #1).
- **Rate-limit**: любой может спалить лимит Gemini — нужен per-IP throttle.
- **Uploads**: `/api/upload` без whitelist MIME, лимита размера и auth — открытый загрузчик.
- **CORS**: не настроен, при подключении отдельного фронтенда откроется дыра.
- **`ON DELETE` на `social_posts`**: не CASCADE — удаление новости оставит orphan-пост.
- **Прогресс читалки**: GET при mount не вызывается — тех-долг в `BookReader.tsx`.
- **Analytics**: цифры в `admin/analytics` захардкожены — заказчик увидит фейк.
- **PDF-парсер каталога**: ТЗ прямо упоминает парсинг PDF метаданных — не реализован.
- **Docker-compose `NEXTAUTH_URL=http://100.118.110.5:3003`**: зафиксирован IP dev-тачки, при деплое — заменить.

## 7. Журнал решений (новые сверху)

| Дата | Решение / событие | Файлы / PR | Кто |
|------|-------------------|-----------|-----|
| 2026-04-19 | **Батч P0+P1+P2** закрыт: security-baseline (rate-limit, Zod-валидатор, CSP-заголовки, убран admin-сид), /api/upload hardening, age-profile Context, BookReader прогресс-sync, полный CRUD catalog/news/events + админ-модерация с backend, реальная analytics из `token_usage`/`chatbot_logs`/`visits`, chat escalation UI+API, `/api/translate` + `/api/simplify`, `AccessibilityToolbar` с high-contrast/dyslexic/TTS, `/api/posters` (SVG-афиша), `/api/social/schedule`+`/api/social/tick` worker с CRON_SECRET, `sitemap.ts`+`robots.ts`+`opengraph-image.tsx`+JSON-LD, service worker `sw.js`+`offline.html`, WCAG focus-visible/skip-link/prefers-reduced-motion. **Геймификация**: `points_events`+`achievements`+`user_streaks`, `/api/gamification` (me/leaderboard/award), `GamificationPanel` на `/profile`, daily-checkin через `/api/visits`. **Build: 0 ошибок**, lint: 0 ошибок (7 предупреждений `<img>`/`_locale`). | ~40 файлов создано/изменено | claude |
| 2026-04-19 | Создан NOTES.md как живой документ проекта | `NOTES.md` | claude + m34959203 |
| 2026-04-19 | Репозиторий переведён в **PUBLIC** | GH settings | m34959203 |
| 2026-04-19 | Полный аудит vs ТЗ: покрытие ~75 %, составлен план закрытия пробелов в 11 задачах (P0-P2) | TaskList в сессии | claude |
| 2026-04-07 | Перевод docker-compose на порт 3003 (app) и 5440 (db), `output: "standalone"` в next.config | `docker-compose.yml`, `next.config.ts` | m34959203 |
| 2026-04-06 | Initial commit: весь скелет Next.js 16 + БД + AI-интеграции (Gemini, ElevenLabs, STT/TTS, Telegram, Instagram) + 19 публичных страниц + 8 админ-страниц + 14 API-роутов | `5acc97e` | m34959203 |

## 8. План работ

### Сделано (2026-04-19)

**P0:**
- [x] Security baseline: in-memory rate-limit (`src/lib/rate-limit.ts`), собственный Zod-лайтовый валидатор (`src/lib/validate.ts`), `auth-guard` (`requireStaff`/`requireAdmin`), CSP/HSTS/X-Frame-Options в `next.config.ts`, удалён admin-сид из SQL, добавлен env-сид `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`.
- [x] `/api/upload` укреплён: whitelist MIME (jpg/png/webp/svg/gif), 8 MB лимит, проверка SVG на скрипты, обязательная `requireStaff`, таблица `media_assets` для медиа-библиотеки.
- [x] Реальная админ-аналитика: `/api/admin/analytics` + фронт-страница `admin/analytics/page.tsx` берёт данные из `token_usage` / `chatbot_logs` / `visits` / `moderation_items`; графики, прогноз, алерты 80%/95%.
- [x] Age-profile Context (`src/lib/age-profile.tsx`), sessionStorage + cookie; `AgeProfileSwitcher` подключён к Context; `AGE_MENU` описан.
- [x] Админ-модерация backend: таблица `moderation_items`, `/api/admin/moderation` GET/POST, страница `admin/moderation/page.tsx` с рабочими approve/reject.
- [x] Полный CRUD: `/api/admin/books` POST/PUT/DELETE, `/api/news` GET/POST/PUT/DELETE, `/api/events` GET/POST/PUT/DELETE — с `requireStaff` + валидацией; форм-страницы `admin/{catalog,news,events}/page.tsx` с модалками, загрузкой обложек через `/api/upload`, авто-переводом RU→KK через `/api/translate`, генерацией афиш из модалки события.
- [x] `BookReader`: GET `/api/catalog/progress` на mount, сохранение `bookmarked`, persist font/theme в localStorage.
- [x] `/api/catalog`: пагинация, `total`/`totalPages`, count с тем же WHERE; добавлена колонка `bookmarked` в `reading_progress`.

**P1:**
- [x] Chat escalation: таблица `chat_escalations`, `/api/chat/escalate` (POST + GET для staff), UI-форма в `ChatWidget` с определением рабочих часов.
- [x] `/api/translate` (RU↔KK) + `/api/simplify` (адаптация под возраст 6-9/10-13/14-17).
- [x] `AccessibilityToolbar`: 3 размера текста, high-contrast, dyslexic-friendly, «озвучить страницу» через Web Speech.
- [x] `/api/posters`: Gemini генерирует SVG-афишу 1080×1350, fallback вшит; редактор в `admin/events`.
- [x] Scheduled autopost: `/api/social/schedule` (очередь постов с `scheduled_at`), worker `/api/social/tick` под `CRON_SECRET`, выполняет due-задания пакетами по 20.
- [x] SEO: `src/app/sitemap.ts` (статические + books + news + events), `robots.ts`, `opengraph-image.tsx` (edge), `src/lib/jsonld.ts` (Library / Book / Event), метаданные корня с alternates ru/kk + OG.
- [x] PWA: `public/sw.js` (app-shell cache, navigation network-first, static SWR), `public/offline.html`, `ServiceWorkerRegister` подключён в layout.
- [x] Геймификация: `points_events`, `achievements`, `user_achievements`, `user_streaks`; `src/lib/gamification.ts` с `awardPoints`, bumpStreak, evaluateAchievements; `/api/gamification` (me/leaderboard/POST award), `/api/visits` бьёт daily-checkin автоматически; `GamificationPanel` на `/profile` с баллами, streak, списком достижений и leaderboard; точки награждения: chat `request_made`, admin может выдавать `admin_award`.

**P2:**
- [x] WCAG: `SkipLink`, глобальный `:focus-visible` ring, `sr-only`, high-contrast/dyslexic CSS, `prefers-reduced-motion`, `aria-label`/`aria-expanded` в ChatWidget/AccessibilityToolbar.

### Открытые хвосты / возможные улучшения

- [ ] Добавить `middleware.ts` → `proxy.ts` (Next 16 deprecated middleware).
- [ ] Заменить `<img>` на `next/image` в карточках (lint warnings).
- [ ] PDF-парсер каталога (ТЗ прямо упоминает) — `pdf-parse` + bulk-импорт в `admin/catalog`.
- [ ] Интеграции с `Kazlib.kz`/`Elibra.kz`/`Nabrk.kz` (открытые API/каталоги) для импорта метаданных книг.
- [ ] Тесты: хотя бы smoke Playwright на каталог + чат + профиль.

## 9. Полезные ссылки / команды

```bash
# Dev
cd /home/ubuntu/smart-kids-library && npm run dev      # порт 3000
docker compose up --build                              # порт 3003

# DB shell
docker compose exec db psql -U postgres -d smart_kids_library

# Lint
npm run lint
```

- Git remote без токена: `git remote set-url origin https://github.com/m34959203/smart-kids-library.git` (пуш через `gh` или SSH)
- Docs Next.js 16: `node_modules/next/dist/docs/` — читать ПЕРЕД изменениями API/файловой структуры
- Родственный проект: `/home/ubuntu/smart-library-cbs` (портал ЦБС, может служить донором компонентов) — не путать репо
