# Architecture

## Стек

- **Next.js 16.2.2** (App Router, standalone output, edge proxy)
- **React 19** + TypeScript 5
- **Tailwind 4**, Lucide icons
- **PostgreSQL 16** (миграции в `sql/`)
- **NextAuth 4** (bcrypt + JWT, роли `admin/librarian/reader`)
- **next-intl 4** (RU/KK)
- **Google Gemini** (`@google/genai`) — chat/RAG/TTS/function calling
- **ElevenLabs** — KK TTS fallback
- **pdf-parse**, **mammoth** — извлечение текста для каталога
- **sharp** + **poppler-utils** (`pdftoppm`) — генерация обложек книг

## Слои

```
Client (Browser / PWA / WebSpeech-STT)
       │
       ▼
┌─────────────────────────────────────────────┐
│  src/proxy.ts                                │
│  • locale-routing → /ru или /kk              │
│  • optimistic admin-gate (cookie check)      │
└────────────────────┬────────────────────────┘
                     ▼
┌─────────────────────────────────────────────┐
│  Next.js App Router (SSR + CSR)              │
│  • (public) — public-страницы                │
│  • (admin) — admin layout с requireStaff()   │
│  • api/ — REST                               │
└──┬──────────────────────────┬───────────────┘
   │                          │
   ▼                          ▼
PostgreSQL              Внешние сервисы
(src/lib/db.ts)         • Gemini  (src/lib/gemini.ts)
                        • ElevenLabs
                        • Telegram / Instagram
                        • TTS-кэш
```

## Структура каталогов

| Путь | Назначение |
|------|-----------|
| `src/app/[locale]/(public)/` | публичные страницы (RU/KK) |
| `src/app/[locale]/(admin)/admin/` | админ-панель + role-gate в layout |
| `src/app/api/` | REST-эндпоинты |
| `src/components/ui/` | переиспользуемые UI-компоненты |
| `src/components/layout/` | Header/Footer/AdminSidebar |
| `src/components/features/` | доменные (BookCard, ChatWidget, BookReader, …) |
| `src/lib/` | утилиты: db, auth, gemini, lang-detect, tts, gamification, validate, rate-limit, jsonld, … |
| `src/messages/{ru,kk}.json` | i18n-словари |
| `sql/` | миграции БД (см. [DATABASE.md](DATABASE.md)) |
| `scripts/` | CLI: импорт каталога, обогащение, утилиты |
| `docs/` | документация |
| `public/uploads/books/` | bind-mount том (не в git, не в Docker-image) — фонд каталога |
| `public/uploads/covers/` | bind-mount том (не в git, не в Docker-image) — сгенерированные WebP-обложки |
| `docs/Text/` | оригиналы файлов фонда (не в git, не в Docker-image) |

## Ключевые архитектурные решения

1. **Server Components by default.** `"use client"` только там, где нужна
   интерактивность (чат, читалка, формы).
2. **Двойной admin-gate.**
   - **Optimistic** в `proxy.ts`: при отсутствии session-cookie — 307 на
     `/profile?next=...`. Без обращения к БД.
   - **Strict** в `(admin)/admin/layout.tsx`: `requireStaff()` через
     `getServerSession`. Жёсткая проверка роли перед рендером.
3. **Token budget.** Все AI-вызовы через `src/lib/gemini.ts` с
   `trackTokenUsage`. При >= лимита — graceful degradation на FAQ
   (`chatbot_knowledge`). Алерты 80%/95% в админ-аналитике.
4. **i18n заголовков.** UI выбирает каскадом
   `title_${locale}` → `title_${other}` → `title`. То же для description.
5. **Фонд = не в репо.** `docs/Text/` (оригиналы, ~2 ГБ),
   `public/uploads/books/` (sanitized копии) и
   `public/uploads/covers/` (сгенерированные обложки) исключены из git и
   Docker-image. В контейнер монтируются как bind-mount (`docker-compose.yml`).
6. **Hybrid-рекомендации без ML.** SQL-скоринг в `/api/recommend`
   (age + language + reading_progress.history + recency + random).
7. **PWA + SEO с первого дня.** `sitemap.ts`/`robots.ts`/`opengraph-image.tsx`
   на app-router; `sw.js` (network-first для navigation, SWR для статики).
8. **WCAG-compliant:** `:focus-visible`, skip-link, high-contrast,
   dyslexic-friendly, `prefers-reduced-motion`, ARIA-роли.
9. **Безопасность.** CSP/HSTS/X-Frame-Options в `next.config.ts`;
   `/api/upload` — whitelist MIME (jpg/png/webp/svg/gif), ≤ 8 МБ,
   требует staff; SVG-сканер на скрипты; in-memory rate-limit per-IP.
10. **CORS** через ENV `ALLOWED_ORIGINS` (по умолчанию `NEXT_PUBLIC_APP_URL`).

## Поток импорта фонда (Өлкетану / Краеведение)

```
docs/Text/{2022 ж оцифр, 2024 жыл, 2025/2026 Өлкетану}/...
              │
              ▼  (CLI: scripts/import-books.js)
public/uploads/books/book_NNNN.{pdf,docx,jpg,tif,...}
+
scripts/books-data.json          ← метаданные (категория, язык, год, тип)
              │
              ▼  (CLI: scripts/insert-books.js)
Postgres.books (UPSERT по original_filename)
              │
              ▼  (CLI: scripts/enrich-books.js — Pass 1)
title_ru/title_kk + description_ru/description_kk
(pdf-parse для PDF, mammoth для DOCX, fallback для JPG/TIF)
              │
              ▼
UI: /catalog?section=lore (фильтр по category ILIKE 'Краеведение%')
```

## Поток обложек (cover_url)

После импорта BookCard ожидает `cover_url`. Без него рендерится один из 8
fallback-плейсхолдеров (`public/covers/cover-0N.jpg`) с накладным заголовком —
визуально однообразно. Поэтому генерация обложек идёт после импорта:

```
books (cover_url IS NULL)
        │
        ├── file_type IN ('jpg','jpeg')
        │     → SQL UPDATE: cover_url := file_url     (614 шт., разовый)
        │
        ├── file_type = 'tif'
        │     → scripts/convert-tif-covers.mjs:
        │       Sharp({failOn:'none'}) → WebP в /uploads/covers/  (135 шт.)
        │
        ├── file_type = 'pdf'
        │     → scripts/generate-book-covers.mjs:
        │       pdftoppm -f 1 -l 1 -r 110 → JPG → Sharp → WebP    (61 шт.)
        │
        └── file_type IN ('docx','doc') ИЛИ NULL
              → scripts/generate-book-covers.mjs:
                буфер SVG (заголовок+автор на градиенте по age_category)
                → Sharp WebP                                        (133 шт.)
```

Скрипты идемпотентны: трогают только записи с пустым `cover_url`. Палитра
SVG — три профиля: 6–9 (тёплый), 10–13 (бирюзовый), 14–17 (фиолетовый),
fallback (коричневый).

## Изменения, важные для разработчика Next 16

- **`middleware.ts` → `proxy.ts`.** Имя функции — `proxy` (или
  `default`). Контракт совпадает с `middleware`. Один файл на проект.
- **Edge proxy не для тяжёлой логики.** Полная авторизация — в layout.tsx.
- **Server actions** доступны, но в проекте используются
  только REST-роуты (предсказуемость + rate-limit).
- **`next/image` обязателен** для всех картинок (в проекте `<img>` нигде
  не используется; `remotePatterns: [{protocol:'https',hostname:'**'}]`).
- **`allowedDevOrigins: ["*.trycloudflare.com"]`** — обязательно для
  HMR через Cloudflare quick tunnel в dev (иначе клиент не гидрируется).
