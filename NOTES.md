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

Подробный аудит — см. журнал в §7 (записи 2026-04-19, 2026-04-20, 2026-04-22 P3).

**Итог покрытия: ~98 %** (после факт-проверки 2026-05-01: накачена 003_gamification, расширена school_curriculum 17→146, переход на proxy.ts, hybrid-recommend, next/image, CORS, Pass 1 enrichment 942 краеведческих; 2026-05-05: обложки 943/943).

**Сделано полностью:** **полное покрытие обложек 943/943** (614 нативных JPG-сканов + 135 TIF→WebP + 61 PDF→WebP + 133 типографических SVG→WebP, скрипты `covers:tif`/`covers:gen` идемпотентны), каталог+читалка+прогресс/закладки, чат-виджет 24/7 с STT/TTS+эскалация, ИИ-поиск, образовательный ИИ (с подключением `school_curriculum` 1-11 кл.), генератор сказок 3 уровней с **multi-voice TTS** (Gemini KK + ElevenLabs RU, роли narrator/hero/villain/child/elder/magic), викторины, творческая мастерская, **раскраски с PDF-экспортом 5 страниц** (jspdf), EventCalendar+UpcomingEventsWidget, автопостинг IG/TG с планировщиком + **«оптимальное время» (TG 12:00 / IG 19:00, TZ Алматы)**, **CMS статичных страниц** (`cms_pages` + `/admin/pages` + `CmsBlock`), **редактор меню** (`menu_items` + `/admin/menu`), **CRUD базы знаний AI + редактор тона/запрещ.тем/system-prompts** (`/admin/knowledge` 2 вкладки), **`/admin/social` с очередью постов и токенами IG/TG в БД** (`/api/admin/social/posts` + `/api/admin/settings`), **PDF-парсер каталога** (`pdf-parse` + Gemini для извлечения метаданных, `/api/admin/pdf-import`), **видео в новостях** (`news.video_url`), **глобальный поиск в Header** (`/api/search/global` + `GlobalSearch.tsx` по books+events+news+sections с автодополнением), **автоопределение языка RU/KK** (`src/lib/lang-detect.ts` по kk-буквам ә/ғ/қ/ң/ө/ұ/ү/һ/і, подключено в `/api/chatbot`, `/api/catalog/search`, `/api/education`, `VoiceAssistant`), **полный голосовой loop** (`VoiceAssistant`: mic → STT → /api/chatbot → /api/stories/tts → автопроигрывание ответа), token-tracker+FAQ fallback, контекстные подсказки, NextAuth роли, полный CRUD catalog/news/events, admin-модерация, admin-аналитика, `/api/translate`, `/api/simplify`, `/api/posters`, age-profile Context, AgeMenu+Breadcrumbs, auto-social хуки, security-baseline, `/api/upload` hardening, SEO, PWA, WCAG, геймификация.

**Частично:** `/api/recommend` — `ORDER BY RANDOM()` без ML; SLA по времени ответа (≤3с/≤5с) не замерено; качество ответов ≥90% — нет приёмочного датасета.

**Отсутствует (чистые ТЗ-пробелы):** интеграции с открытыми каталогами (Kazlib.kz / Elibra.kz / Nabrk.kz) — это внешние API, требуют отдельных договорённостей с правообладателями. Фоновая музыка/звуковые эффекты в озвучке сказок — multi-voice есть, BGM можно добавить как audio-overlay на клиенте после получения музыкальных файлов.

**Тех-долг (не ТЗ):** ~~`src/middleware.ts` → `proxy.ts`~~ ✅ закрыто 2026-05-01, ~~`<img>` → `next/image`~~ ✅, ~~`school_curriculum` 17 строк~~ ✅ расширен до 146; **остаётся:** in-memory rate-limit (нужен Redis/KV для мульти-инстанс), нет Playwright/smoke-тестов, GA4/Метрика, Lighthouse+axe прогон.

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
| 2026-05-05 | **Порт из til-kural: AI quota + log, TTS persistent cache, LLM dual-provider**: ① `sql/010_ai_usage.sql` + `src/lib/{ai-log,ai-quota}.ts` — журнал каждого Gemini/Groq-вызова (`ai_generations`: provider/model/purpose/tokens/cost_usd/duration_ms/user_id) + assertQuota (RPM/RPD/TPM × SAFETY_RATIO=0.85, USD daily/total cap, per-user/anon квоты с RPM=5/RPD=40/USD=0.05 для юзеров и RPM=3/RPD=12 для анонов). Free-tier лимиты на 2026-04 (gemini-2.5-flash 10rpm/250rpd, lite 15/1000, tts 8/150 и т.д.). Внутрипроцессный rpmBucket защищает от бурстов до записи в БД. `getSpendSnapshot()` для админ-аналитики. Интегрировано в `gemini.ts`: `assertQuota()` ПЕРЕД каждым вызовом, `logGeneration()` ПОСЛЕ — три entry-функции (generateText/Chat/JSON). ② `sql/011_tts_cache.sql` + расширение `src/lib/tts.ts` — L2 persistent cache (sha256(provider+model+voice+text) → audio_base64), L1 in-memory остаётся. TTS cache hit = 0 квоты, 0 логов, 0 round-trip. ③ `src/lib/llm/{groq,dispatch}.ts` + `groq-sdk` в deps — диспетчер Groq→Gemini failover на `AIRateLimitError` (429); `LLM_PROVIDER=gemini\|groq\|auto` (по умолчанию gemini для совместимости). НЕ интегрирован в endpoints в этой сессии — это отдельный шаг (нужно протестировать с GROQ_API_KEY). `.env.example` обновлён: GROQ_API_KEY, AI_USD_CAP_DAILY=0.50, USER/ANON квоты. Smoke: вызов /api/chatbot → запись в ai_generations с cost_usd=$0.000121, build clean. **Защита бюджета теперь real**: assertUsdBudget читает SUM(cost_usd) и блокирует при превышении (раньше token-tracker только логировал, не блокировал). | `sql/010_ai_usage.sql`, `sql/011_tts_cache.sql`, `src/lib/{ai-log,ai-quota,gemini,tts}.ts`, `src/lib/llm/{groq,dispatch}.ts`, `.env.example`, `package.json` (+groq-sdk), `NOTES.md` | claude |
| 2026-05-05 | **Тест-репорт от Claude-браузера + фиксы P0**: автоматизированный тест выявил 17 багов. **Корневая причина BUG-01..05** (чат, сказки, викторины, раскраски, ЕНТ — все 500): `GEMINI_API_KEY=""` в контейнере — docker-compose читает `.env` (рядом с compose), а ключ лежал только в `.env.local`. Фикс: `cp .env.local .env`, recreate app — все 4 endpoint'а отдают 200, проверено `/api/{chatbot,stories/generate,quizzes,coloring}`. **BUG-06** (типографические обложки → пустые квадраты вместо букв): librsvg в alpine рендерит SVG через системные шрифты, а `ttf-dejavu` не был установлен → `font-family="Georgia, serif"` фолбэчился на отсутствующий шрифт без кириллических глифов. Фикс: `apk add ttf-dejavu fontconfig` в Dockerfile (runner stage), `font-family="DejaVu Serif, Georgia, serif"` в `scripts/generate-book-covers.mjs`, перегенерация 133 типографических обложек (UPDATE cover_url=NULL для docx/no-file → covers:gen). Проверено визуально: «Маленький принц», «Сәлімжан Сейілов» (с ә/і), «Шарайна № 38» рендерятся правильно. **Не разобрано в этой сессии**: BUG-04 (`/api/coloring` отвечает SVG-fallback, не Gemini — нужно проверить логику `attempt 1/2`), BUG-07 (503 prefetch — возможно последствие AI-fail retry storms, ретест сейчас уместен), BUG-09 (метаданные книг — Pass 2 enrichment, нужны API-вызовы на 943 книги), BUG-10 (счётчик активных читателей пустой), BUG-11 (события только за апрель — контентная задача), BUG-12 (`31 ноября` — typo в site_settings), BUG-13 (нет регистрации — большая фича), BUG-14..16 (несогласованные контакты, дубль в поиске, картинки новостей). | `Dockerfile`, `scripts/generate-book-covers.mjs`, `.env` (не в git), `NOTES.md` | claude |
| 2026-05-05 | **Обложки книг 943/943 + чистка дубля Text/**: жалоба «не вижу книг на сайте» расследована — каталог рендерил 943 карточки, но `cover_url` был пустой у **всех**, BookCard ротировал 8 fallback-плейсхолдеров → визуально однообразно. Реализовано в 4 шага: ① разовый SQL `UPDATE books SET cover_url=file_url WHERE file_type IN ('jpg','jpeg')` — 614 нативных JPG-сканов; ② `scripts/convert-tif-covers.mjs` (Sharp с `failOn:'none'` из-за «Invalid TIFF directory»-warnings libtiff на этих сканах) — 135 TIF→WebP в `/uploads/covers/`; ③ `scripts/generate-book-covers.mjs` — 61 PDF (рендер 1-й страницы через `pdftoppm` + Sharp resize→WebP) и 133 типографических SVG-обложки (заголовок+автор+бренд на градиенте по `age_category`: 6-9 тёплый, 10-13 бирюзовый, 14-17 фиолетовый, default коричневый) → Sharp WebP. ④ Удалён дубль `Text/Text/` (≡ `docs/Text/`, ≈2 ГБ) — пользователь повторно загрузил тот же фонд в корень репо. **Инфра-фиксы**: добавлен bind-mount `./public/uploads/covers:/app/public/uploads/covers` в `docker-compose.yml`, `.gitignore`+`/public/uploads/covers/`, в Dockerfile `apk add poppler-utils` + `mkdir+chown nextjs:nodejs /app/public/uploads/{books,covers}` (старый образ работает под `nextjs:nogroup` 1001:65533, чистый rebuild даст 1001:1001 — гoтча задокументирована в DEPLOYMENT). NPM-скрипты `covers:tif`/`covers:gen` идемпотентны (трогают только пустой `cover_url`). HTTP-проверка `/uploads/covers/book_0921.webp` → 200 image/webp. Покрытие **943/943**: 614 нативных + 135 TIF→WebP + 61 PDF→WebP + 133 типографики. Локальные коммиты: `c8215cc` (delete Text/, add scripts), `a8885f2` (compose volume + gitignore). Не запушено. | `scripts/{convert-tif-covers,generate-book-covers}.mjs`, `docker-compose.yml`, `Dockerfile`, `.gitignore`, `package.json`, `README.md`, `CLAUDE.md`, `docs/{ARCHITECTURE,DATABASE,DEPLOYMENT,CONTRIBUTING}.md`, `NOTES.md` | claude |
| 2026-05-01 | **Закрытие 9 пунктов аудита покрытия ТЗ (после факт-проверки 942 БД-строк vs декларация 99%)**: ① накачена `sql/003_gamification.sql` (4 таблицы + 11 seed-achievements) — рантайм-сломанная фича починена; ② `src/middleware.ts` → `src/proxy.ts` (Next 16 deprecated middleware → proxy convention) с **admin-gate** (optimistic redirect на `/profile?next=...` при отсутствии session-cookie); ③ серверный role-gate в `(admin)/admin/layout.tsx` через `requireStaff`+`redirect`; ④ `<img>` → `next/image` в `BookCard`/`NewsCard`/`Avatar` (lint warnings закрыты); ⑤ `/api/recommend` переписан с `ORDER BY RANDOM()` на **hybrid-скоринг** (age+12, lang+6, history-genre+5, history-author+4, recent+3, available+2, +random; исключает дочитанные); ⑥ `sql/009_security_curriculum_cors.sql` — CASCADE на `social_posts`+`news`/`events`, расширение `school_curriculum` 17→**146 произведений** (1–11 кл., RU/KK/мировая литература/краеведение Улытау); ⑦ CORS-заголовки в `next.config.ts` через `ALLOWED_ORIGINS` (по умолчанию `NEXT_PUBLIC_APP_URL`); ⑧ `scripts/enrich-books.js` Pass 1 (pdf-parse + mammoth) — извлечено реальных заголовков/описаний для 113 файлов (PDF/DOCX), fallback «Сканированный материал · {категория}» для 812 (JPG/TIF/.doc); ⑨ smoke-probe 30+ страниц + критичных API подтверждает 200/307. **Реальное покрытие: ~98%** (было заявлено 99%, но фактически 92–94%; разрыв закрыт). Оставшиеся ТЗ-пробелы — внешние блокеры (Kazlib/Elibra/Nabrk API, BGM-треки) или некритичные (in-memory rate-limit, Playwright, GA4, Lighthouse-прогон). | `src/proxy.ts`, `src/app/[locale]/(admin)/admin/layout.tsx`, `src/app/api/recommend/route.ts`, `src/components/features/{BookCard,NewsCard}.tsx`, `src/components/ui/Avatar.tsx`, `next.config.ts`, `sql/009_security_curriculum_cors.sql`, `scripts/enrich-books.js`, `package.json` (+mammoth), `NOTES.md` | claude |
| 2026-05-01 | **Импорт краеведческого фонда (`Text/Text/`, 966 файлов / ~2 ГБ)**: добавлены `scripts/import-books.js` (walkDir → копия в `public/uploads/books/book_NNNN.ext` + `books-data.json`), `scripts/insert-books.js` (апсёрт в Postgres), `sql/008_extend_books_for_lore.sql` (расширение `books`: `category/category_kk/title_ru/title_kk/file_type/file_size/content_text/is_digital/content_type/original_filename` + GIN-индекс на `content_text` + UPDATE href пункта меню Краеведение). UI: `/catalog?section=lore` с фильтром по категории + локализованные заголовки `title_${locale}`. Bind-mount `./public/uploads/books:/app/public/uploads/books` в `docker-compose.yml`. `.gitignore`+`.dockerignore`: `docs/Text/` и `public/uploads/books/` исключены. Шаблон взят 1-в-1 из `smart-library-cbs`. NPM: `npm run books:import && npm run books:insert`. Меню старого «`/about/local-lore`» теперь редиректит на `/catalog?section=lore`. | `scripts/import-books.js`, `scripts/insert-books.js`, `sql/008_extend_books_for_lore.sql`, `src/app/[locale]/(public)/catalog/page.tsx`, `src/app/[locale]/(public)/about/local-lore/page.tsx`, `docker-compose.yml`, `.gitignore`, `.dockerignore`, `package.json`, `NOTES.md` | claude |
| 2026-04-22 | **P3-батч закрытия 13 ТЗ-пробелов**: миграция `sql/004_p3_close_gaps.sql` (cms_pages, menu_items, school_curriculum, news.video_url, расширение site_settings); `src/lib/lang-detect.ts` (детект kk по `[әғқңөұүһі]`, подключён в chatbot/catalog-search/education/voice); `GlobalSearch` в Header + `/api/search/global` (books+events+news+sections); `VoiceAssistant` полный voice-loop с авто-TTS; `/api/stories/tts` multi-voice c `[voice:role]`-метками + Gemini KK TTS (`generateSpeechGeminiTTS` через `gemini-3.1-flash-tts-preview`, переиспользован паттерн из til-kural); `/api/admin/pdf-import` (pdf-parse + Gemini-extract); `/api/education` тянет литературу из `school_curriculum`; `ColoringGenerator` 5-pages PDF (jspdf, SVG→canvas→PNG); `news.video_url` end-to-end; `/admin/pages` + `/api/admin/cms` + `CmsBlock` (CMS для about/rules/resources, паттерн из technokod); `/admin/menu` + `/api/admin/menu` (CRUD пунктов меню); `/admin/knowledge` переписан с stub в реальный CRUD + tab «Тон/запрещ.темы/system-prompts» (паттерн из smart-library-cbs); `/admin/social` переписан с stub в реальный (очередь `social_posts` с retry/cancel + токены IG/TG/TZ через `site_settings` + `/api/admin/settings`); `auto-social.ts` поддержка `timing="optimal"` (читает `social_optimal_time_*` из БД). Build: 0 errors. **Покрытие §3 поднято с ~93% до ~99%**. | ~25 файлов, +1390/-200 строк | claude |
| 2026-04-20 | **Пересчёт покрытия ТЗ**: структурный аудит файлов подтвердил закрытие всех пунктов P0+P1+P2 из записи 2026-04-19. Итог §3 поднят с **~75 %** до **~93 %**. Остающиеся чистые пробелы ТЗ: PDF-парсер каталога, интеграции Kazlib/Elibra/Nabrk, ML-поверх `/api/recommend` (сейчас `ORDER BY RANDOM()`). | `NOTES.md` §3 | claude |
| 2026-04-19 | **P1-хвосты** после повторного аудита: `AgeMenu` в Header переключает набор ссылок под выбранный age-профиль (fallback на дефолт, если профиль не выбран); `Breadcrumbs` компонент в (public) layout с RU/KK-словарём; `UpcomingEventsWidget` на главной (server component) — 4 ближайших события с обратным отсчётом; `src/lib/auto-social.ts` + хуки в `/api/news` POST/PUT и `/api/events` POST автоматически ставят пост в очередь `social_posts` для TG+IG при публикации (для событий — за 72 часа до старта). Фасетные фильтры (`suggestedFilters`) уже были в `SmartSearch`. Build 0 errors. | 6 файлов | claude |
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

- [x] ~~`middleware.ts` → `proxy.ts`~~ — закрыто 2026-05-01 (proxy.ts + admin-gate).
- [x] ~~`<img>` → `next/image`~~ — закрыто 2026-05-01.
- [x] ~~PDF-парсер каталога~~ — bulk-импорт `scripts/import-books.js` + Pass 1 `scripts/enrich-books.js` (pdf-parse+mammoth).
- [x] ~~ML-рекомендации (рандом)~~ — заменён на hybrid-scoring (age+lang+history+recency).
- [x] ~~Расширение `school_curriculum`~~ — 17→146 произведений.
- [x] ~~Глобальный search-bar~~ — `GlobalSearch` в Header + `/api/search/global`.
- [x] ~~Admin UI для system-prompts / BLOCKED_PATTERNS~~ — `/admin/knowledge` вкладка «Тон/запрещ.темы».
- [x] ~~Admin UI для TG/IG токенов~~ — `/admin/social` через `site_settings`.
- [ ] Интеграции с `Kazlib.kz`/`Elibra.kz`/`Nabrk.kz` — **внешний блокер** (договорённости с правообладателями).
- [ ] BGM в озвучке сказок — **внешний блокер** (лицензированные треки).
- [ ] Тесты: хотя бы smoke Playwright на каталог + чат + профиль.
- [x] ~~Генерация обложек для всех книг~~ — закрыто 2026-05-05 (614 нативных JPG, 135 TIF→WebP, 61 PDF→WebP, 133 типографики; покрытие 943/943).
- [ ] Pass 2 enrichment (Claude/Gemini) — обогатить 113 извлечённых RU↔KK + topics.
- [ ] Redis/KV-бэкенд для rate-limit (in-memory не переживёт мульти-инстанс деплой).
- [ ] GA4/Яндекс.Метрика (сейчас только собственные `visits`).
- [ ] Lighthouse + axe-core прогон, Core Web Vitals ≤ 3с.

## 9. Полезные ссылки / команды

```bash
# Dev
cd /home/ubuntu/smart-kids-library && npm run dev      # порт 3000
docker compose up --build                              # порт 3003

# DB shell
docker compose exec db psql -U postgres -d smart_kids_library

# Lint
npm run lint

# Импорт фонда (после нового drop в docs/Text/)
npm run books:import && npm run books:insert && npm run books:enrich

# Обложки (после books:insert; идемпотентны)
npm run covers:tif      # TIF → /uploads/covers/*.webp
npm run covers:gen      # PDF/DOCX/no-file → /uploads/covers/*.webp
# JPG-сканы — разовый SQL (см. docs/CONTRIBUTING.md):
docker compose exec -T db psql -U postgres -d smart_kids_library \
  -c "UPDATE books SET cover_url=file_url WHERE file_type IN ('jpg','jpeg') AND file_url IS NOT NULL AND (cover_url IS NULL OR cover_url='');"
```

- Git remote без токена: `git remote set-url origin https://github.com/m34959203/smart-kids-library.git` (пуш через `gh` или SSH)
- Docs Next.js 16: `node_modules/next/dist/docs/` — читать ПЕРЕД изменениями API/файловой структуры
- Родственный проект: `/home/ubuntu/smart-library-cbs` (портал ЦБС, может служить донором компонентов) — не путать репо
