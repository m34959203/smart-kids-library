# Contributing

## Окружение

```bash
npm install
cp .env.example .env             # минимум: GEMINI_API_KEY, NEXTAUTH_SECRET
docker compose up db -d          # только Postgres
# Прогнать миграции 002–009 (см. DEPLOYMENT.md)
npm run dev                      # http://localhost:3000
```

## Стандарты кода

- **TypeScript strict.** Интерфейсы для всех props.
- **Server Components by default.** `"use client"` только при
  необходимости (формы, чат, читалка, графики).
- **i18n.** Любые тексты — через `t(messages, "key")`. Добавлять в
  `src/messages/ru.json` **и** `src/messages/kk.json` одновременно.
- **Tailwind** + `cn()` (`src/lib/utils.ts`).
- **БД-вызовы** — только через `src/lib/db.ts` (`query` / `getOne` / `getMany`).
- **Картинки** — `next/image`, не `<img>`.

## Новая страница

1. `src/app/[locale]/(public)/<page>/page.tsx`.
2. Тексты в `src/messages/{ru,kk}.json`.
3. Линк в `Header.tsx` (если публичный) или `AdminSidebar.tsx`.

## Новый API-роут

1. `src/app/api/<endpoint>/route.ts`.
2. **Защита:** `enforceRateLimit` + (если мутация) `requireStaff` /
   `requireAdmin` + Zod-валидатор (`src/lib/validate.ts`).
3. Документировать в [`docs/API.md`](API.md).

## Новая миграция

1. `sql/0NN_<name>.sql`. Идемпотентно (`IF NOT EXISTS`, `ON CONFLICT`).
2. Описать в [`docs/DATABASE.md`](DATABASE.md) → таблица миграций.
3. Прогнать локально: `docker compose exec -T db psql -U postgres -d smart_kids_library < sql/0NN_*.sql`.

## AI-фичи

- Все вызовы — через `src/lib/gemini.ts` с `trackTokenUsage`.
- Перед AI-вызовом проверить `isWithinTokenLimit()`; при `false` — fallback.
- Любой генерируемый детский контент пропускать через `moderation_items`.

## Импорт фонда (Өлкетану / Краеведение)

Происходит CLI-скриптами:

```bash
npm run books:import     # docs/Text/ → public/uploads/books/ + JSON
npm run books:insert     # JSON → Postgres (UPSERT по original_filename)
npm run books:enrich     # Pass 1: pdf-parse + mammoth → реальные заголовки
npm run covers:tif       # 135 TIF → /uploads/covers/*.webp (sharp)
npm run covers:gen       # PDF → 1-я страница; DOCX/no-file → типографика
```

После `books:insert` обязательно дополнить SQL для JPG-сканов
(скрипта-обёртки нет — это разовая операция):

```sql
UPDATE books SET cover_url = file_url
 WHERE file_type IN ('jpg','jpeg')
   AND file_url IS NOT NULL AND file_url <> ''
   AND (cover_url IS NULL OR cover_url = '');
```

Pass 2 (Claude/Gemini для RU↔KK перевода и topics) — ещё не реализован.

## Conventional Commits на русском

Принят формат `тип(скоуп): описание`, например:

- `feat(catalog): добавить раздел Краеведение`
- `fix(api): валидация bookId в /api/catalog/progress`
- `docs(database): миграция 008`
- `chore(deps): обновить mammoth до 1.12`
- `refactor(proxy): admin-gate cookie-check`

Не использовать `--no-verify` без согласования.

## Безопасность

- Не коммитить `.env*`.
- Не использовать `<img>`, `dangerouslySetInnerHTML` без необходимости.
- Не вытаскивать `req.body` без валидации.
- `git remote` — без токенов в URL (push через `gh` или SSH).
