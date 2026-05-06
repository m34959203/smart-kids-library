# Smart Kids Library Satpayev — Developer Guide для Claude / AI-помощников

Цифровая экосистема детско-юношеской библиотеки города Сатпаев. Билингвальный (KK/RU), AI на Groq+Gemini, аудитория 6–17.

## Tech Stack

- **Next.js 16.2.2** (App Router, standalone) + React 19 + TypeScript 5
- Tailwind 4 + Lucide
- PostgreSQL 16 (миграции **001–013** в `sql/`)
- **Groq** (`groq-sdk`) — основной LLM: `llama-3.3-70b-versatile` (chat) + `openai/gpt-oss-120b` (json)
- **Gemini** (`@google/genai`) — только для kk-TTS и fallback при Groq 429
- ElevenLabs — RU TTS fallback
- pdf-parse + mammoth — извлечение текста для каталога
- sharp + poppler-utils + ttf-dejavu (alpine) — генерация обложек книг
- NextAuth 4 (SHA-256 + JWT, роли `admin/librarian/reader`)
- next-intl 4 (RU/KK)

## Ключевые конвенции

### Структура

- `src/app/[locale]/(public)/` — публичные роуты (RU/KK)
- `src/app/[locale]/(admin)/admin/` — админка с серверным role-gate в `layout.tsx` (`requireStaff`)
- `src/app/api/` — REST-эндпоинты (30+)
- `src/components/{ui,layout,features}/` — атомы / структура / домен
- Edge proxy — `src/proxy.ts` (Next 16; `middleware.ts` deprecated): locale-routing + optimistic admin-gate
- `src/lib/` — утилиты:
  - `db.ts` — pg.Pool wrapper
  - `gemini.ts` — тонкий wrapper над dispatch (для совместимости)
  - `gemini-direct.ts` — прямые Gemini-вызовы (только для fallback и TTS)
  - `llm/dispatch.ts` — `dispatchChat/Text/JSON` с Groq → Gemini failover
  - `llm/groq.ts` — Groq client + `AIRateLimitError`
  - `llm/quota-error-response.ts` — единый 429 для quota/rate-limit
  - `ai-quota.ts` — `assertQuota` (RPM/RPD/TPM × 0.85 + USD-cap + per-user/anon)
  - `ai-log.ts` — `logGeneration` в `ai_generations` с per-call cost_usd
  - `tts.ts` — KK Gemini TTS + RU Google/ElevenLabs + L1 in-memory + L2 БД-кэш
  - `audit.ts` — `recordAudit` для админ-действий

### Code style

- TypeScript strict; интерфейсы для props
- Server Components by default; `"use client"` только при необходимости
- Импорты через `@/` alias
- Tailwind через `cn()` (`src/lib/utils.ts`)
- Тексты — через `t(messages, "key")` из `src/messages/{ru,kk}.json`
- Картинки — **только** `next/image`

### i18n

- Каскад в БД: `title_${locale}` → `title_${other}` → `title`. То же для description.
- Адрес: `library_address_ru` / `library_address_kk` в `site_settings`.

### AI — критично

- **Все текстовые вызовы** через `src/lib/gemini.ts` (wrapper) или `src/lib/llm/dispatch.ts` (low-level).
- НЕ импортировать `gemini-direct.ts` напрямую в endpoints — это backend-only модуль.
- **`LLM_PROVIDER=groq`** — основной режим: чат, сказки, викторины, раскраски, поиск, education и т.д. идут через Groq ($0).
- **Gemini остаётся** только для kk-TTS (`gemini-3.1-flash-tts-preview`) и failover на 429 от Groq.
- В каждом catch блока AI-эндпоинта — `quotaErrorResponse(err, lang)`. Иначе превышение даст невнятную 500.
- USD-cap по умолчанию `$0.50/день`. При превышении — 429 с понятным сообщением (`retryHuman`).

### Database

- Миграции **001–013** идемпотентны (`IF NOT EXISTS` / `ON CONFLICT`).
- Только 001 запускается автоматически Postgres-контейнером; остальные — вручную (см. `docs/DEPLOYMENT.md`).
- Все БД-операции — через `src/lib/db.ts` (`query` / `getOne` / `getMany`).
- **При сериализации `TIMESTAMPTZ` → client-component** мапить через `toIso()`: pg возвращает Date, RSC не сериализует.

### Безопасность

- `/api/upload` — whitelist MIME (jpg/png/webp/svg/gif), ≤ 8 МБ, требует staff
- CSP/HSTS/X-Frame-Options в `next.config.ts`
- CORS через `ALLOWED_ORIGINS` ENV
- Rate-limit per-IP in-memory (`src/lib/rate-limit.ts`)
- Дефолтный admin **не сидится** в SQL; создаётся через `SEED_ADMIN_*`
- Любая admin-мутация → `recordAudit(request, actor, entry)`
- Любой AI-вызов записывается в `ai_generations` (provider/model/cost_usd/duration_ms)

### Контент-модерация

- Весь AI-генерируемый контент для детей проходит через `moderation_items`
- Системный промпт чата запрещает темы (см. `/admin/knowledge` вкладка «Тон / запрещ. темы»)

## Commands

```bash
npm run dev         # next dev (3000)
npm run build       # standalone build
npm start
npm run lint
docker compose up   # full stack: app:3003, postgres:5440

# Импорт фонда (Краеведение / Өлкетану)
npm run books:import
npm run books:insert
npm run books:enrich      # Pass 1: pdf-parse + mammoth → реальные заголовки

# Pass 2 (обогащение через Groq, $0):
docker compose exec -T -e GROQ_API_KEY=... \
  app node /app/scripts/enrich-books-pass2.mjs

# Обложки (после books:insert; идемпотентны)
npm run covers:tif      # 135 TIF-сканов → /uploads/covers/*.webp
npm run covers:gen      # PDF → 1-я страница, DOCX/no-file → типографика

# JPG-сканы (разовый SQL):
docker compose exec -T db psql -U postgres -d smart_kids_library \
  -c "UPDATE books SET cover_url=file_url WHERE file_type IN ('jpg','jpeg') AND file_url IS NOT NULL AND (cover_url IS NULL OR cover_url='');"
```

### Обложки книг — pipeline

| Источник | Сколько | Способ |
|---|---|---|
| Нативный JPG-скан | 614 | `cover_url := file_url` (SQL) |
| TIF | 135 | Sharp с `failOn:'none'` → WebP в `/uploads/covers/` |
| PDF (1-я страница) | 61 | `pdftoppm -f 1 -l 1 -r 110 -jpeg` → Sharp → WebP |
| Типографический SVG | 133 | DejaVu Serif + градиент по `age_category` → Sharp WebP |

`public/uploads/covers/` — bind-mount в docker-compose, не в git и не в Docker-image. Скрипты идемпотентны (трогают только пустой `cover_url`).

### Регистрация / восстановление пароля

- `/api/auth/register` — POST `{email, password (≥8), name, ageGroup?}` → SHA-256 хеш + insert в users
- `/api/auth/recover` — POST `{email}` → токен (24 байта hex) в `password_resets`, TTL 1 ч. В dev возвращает `resetUrl` в response (для случаев без email-инфры). Закрывается `RECOVER_TOKEN_IN_RESPONSE=0`
- `/api/auth/reset` — POST `{token, password}` → проверяет (есть/не использован/не истёк) → обновляет `password_hash`, помечает `used_at`
- Страницы: `/profile/{register,recover,reset?token=}`

## Готовые подсистемы (покрытие ТЗ ~99%)

Каталог + читалка + прогресс / закладки, чат-виджет с STT/TTS + эскалация (через **Groq**), AI-поиск, образовательный AI (146 произведений в `school_curriculum`), генератор сказок 3 уровня с multi-voice TTS, викторины, мастерская, раскраски с PDF-экспортом, EventCalendar (читает БД), автопостинг IG/TG с очередью и «оптимальным временем», CMS статичных страниц, редактор меню, CRUD AI knowledge, SMM-консоль, PDF-парсер каталога, видео в новостях, глобальный поиск с автодополнением, автоопределение языка RU/KK, голосовой loop, геймификация (баллы, достижения, streak, leaderboard), admin-модерация, hybrid-recommend, age-profile, breadcrumbs, auto-social, security-baseline, SEO, PWA, WCAG, **обложки 943/943**, **регистрация+восстановление пароля**, **AI quota guard + USD-cap + 429-UX**, **TTS persistent cache**, **audit log админ-действий**.

## Чего НЕТ (внешние блокеры или отложено)

- Интеграции с Kazlib.kz / Elibra.kz / Nabrk.kz — нужны договорённости с правообладателями
- BGM в озвучке сказок — нужны лицензированные треки
- OCR для 851 скана (метаданные) — Vision API / Tesseract, отдельная задача
- SMTP / Telegram-бот для recover в проде — пока токен в response
- Push-уведомления, PDF-сертификат «прочитано N книг» — отложены
- `recordAudit` ещё не подключён в /api/admin/* (модуль готов)
