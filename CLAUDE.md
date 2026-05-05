# Smart Kids Library Satpayev — Developer Guide

Цифровая экосистема для детско-юношеской библиотеки города Сатпаев (Казахстан).
Билингвальный (KK/RU), AI, аудитория 6–17.

## Tech Stack

- **Next.js 16.2.2** (App Router, standalone) + React 19 + TypeScript 5
- Tailwind 4, Lucide icons
- PostgreSQL 16 (миграции 001–009 в `sql/`)
- Google Gemini (`@google/genai` 1.50) — chat / RAG / TTS / function calling
- ElevenLabs — KK TTS fallback
- pdf-parse + mammoth — извлечение текста для каталога
- sharp + poppler-utils (`pdftoppm`) — генерация обложек книг
- NextAuth 4 (bcrypt + JWT, роли `admin/librarian/reader`)
- next-intl 4 (RU/KK)

## Ключевые конвенции

### Структура

- Страницы под `src/app/[locale]/` (locale ∈ `ru` / `kk`).
- `(public)` — публичные роуты. `(admin)/admin/` — админка с
  серверным role-gate'ом в `layout.tsx` (`requireStaff`).
- API под `src/app/api/`.
- Компоненты: `ui/` (атомы), `layout/` (структура), `features/` (домен).
- Edge proxy — `src/proxy.ts` (Next 16; `middleware.ts` deprecated).
  Делает только locale-routing + optimistic admin-gate (cookie-check).
  Полную авторизацию делает layout, не proxy.

### Code style

- TypeScript строго, интерфейсы для props.
- Server Components by default; `"use client"` только при необходимости.
- Импорты через `@/` alias.
- Tailwind через `cn()` (`src/lib/utils.ts`).
- Тексты — через `t(messages, "key")` из `src/messages/{ru,kk}.json`.
- Картинки — **только** `next/image` (`<img>` запрещены lint-warnings уже
  закрыты).

### i18n

- Каскад заголовков в БД: `title_${locale}` → `title_${other}` → `title`.
- Хелперы в `src/lib/book-i18n.ts` (если появится) или inline в страницах.

### AI

- Все вызовы через `src/lib/gemini.ts` с `trackTokenUsage`.
- KK TTS = `gemini-3.1-flash-tts-preview` (Gemini); KK Live = `gemini-2.5-flash-native-audio-preview-12-2025`.
- При исчерпании дневного лимита — graceful fallback на `chatbot_knowledge`.

### Database

- Миграции 001–009 идемпотентны (`IF NOT EXISTS` / `ON CONFLICT`).
- Только 001 запускается автоматически Postgres-контейнером.
  Остальные — вручную (см. `docs/DEPLOYMENT.md`).
- Все БД-операции — через `src/lib/db.ts` (pool, query-logging в dev).

### Безопасность

- `/api/upload` — whitelist MIME (jpg/png/webp/svg/gif), ≤ 8 МБ, требует staff.
- CSP/HSTS/X-Frame-Options в `next.config.ts`.
- CORS через `ALLOWED_ORIGINS` ENV.
- Rate-limit per-IP in-memory (`src/lib/rate-limit.ts`).
- Дефолтный admin **не сидится** в SQL; создаётся через `SEED_ADMIN_*`.

### Контент-модерация

- Весь AI-генерируемый контент для детей проходит через `moderation_items`.
- Системный промпт чата запрещает темы (см. `/admin/knowledge` вкладка
  «Тон / запрещ. темы»).

## Commands

```bash
npm run dev         # next dev (3000)
npm run build       # standalone build
npm start
npm run lint
docker compose up   # full stack: app:3003, postgres:5440

# Импорт фонда из docs/Text/
npm run books:import
npm run books:insert
npm run books:enrich

# Обложки (запускать после books:insert; идемпотентны)
npm run covers:tif      # 135 TIF-сканов → /uploads/covers/*.webp
npm run covers:gen      # PDF → 1-я страница, DOCX/no-file → типографика
```

### Обложки книг

- Источники `cover_url`:
  1. JPG-сканы — путь `file_url` ставится напрямую как `cover_url`
     (612 шт., делается одноразовым SQL после `books:insert`).
  2. TIF-сканы — Sharp конвертирует в WebP в `/uploads/covers/`
     (`scripts/convert-tif-covers.mjs`).
  3. PDF — `pdftoppm` рендерит 1-ю страницу → Sharp ужимает до WebP
     (`scripts/generate-book-covers.mjs`).
  4. DOCX/`no-file` — типографический SVG (заголовок + автор на градиенте
     по `age_category`) → Sharp WebP.
- Целевая папка `public/uploads/covers/` — bind-mount в docker-compose,
  не в git и не в Docker-image (как и `books/`).
- Скрипты безопасны при повторном запуске: трогают только записи
  с пустым `cover_url`.

## Готовые подсистемы (см. NOTES.md §3 — покрытие ТЗ ~98%)

Каталог + читалка + прогресс / закладки, чат-виджет с STT/TTS + эскалация,
AI-поиск, образовательный AI (146 произведений в `school_curriculum`),
генератор сказок 3 уровня с multi-voice TTS, викторины, мастерская,
раскраски с PDF-экспортом, EventCalendar, автопостинг IG/TG с очередью и
"оптимальным временем", CMS статичных страниц, редактор меню, CRUD AI
knowledge, SMM-консоль, PDF-парсер каталога, видео в новостях, глобальный
поиск с автодополнением, автоопределение языка RU/KK, голосовой loop,
геймификация (баллы, достижения, streak, leaderboard), CMS, аналитика,
admin-модерация, hybrid-recommend, age-profile, breadcrumbs, auto-social,
security-baseline, SEO, PWA, WCAG, **полное покрытие обложек 943/943**
(JPG-сканы / TIF→WebP / PDF-первая-страница / типографика).

## Чего НЕТ (внешние блокеры)

- Интеграции с Kazlib.kz / Elibra.kz / Nabrk.kz (нужны договорённости с
  правообладателями).
- BGM в озвучке сказок (нужны лицензированные треки).
