# Contributing

## Окружение

```bash
npm install
cp .env.example .env             # минимум: GEMINI_API_KEY, NEXTAUTH_SECRET, GROQ_API_KEY
docker compose up db -d          # только Postgres
# Прогнать миграции 002–013 (см. docs/DEPLOYMENT.md)
npm run dev                      # http://localhost:3000
```

## Стандарты кода

- **TypeScript strict.** Интерфейсы для всех props.
- **Server Components by default.** `"use client"` только при необходимости (формы, чат, читалка, графики).
- **i18n.** Любые тексты — через `t(messages, "key")`. Добавлять в `src/messages/ru.json` **и** `src/messages/kk.json` одновременно.
- **Tailwind** + `cn()` (`src/lib/utils.ts`).
- **БД-вызовы** — только через `src/lib/db.ts` (`query` / `getOne` / `getMany`).
- **Картинки** — `next/image`, не `<img>`.
- **AI** — только через `src/lib/gemini.ts` (тонкий wrapper) или `src/lib/llm/dispatch.ts` (low-level). Прямые `gemini-direct` запрещены в endpoints.

## Новая страница

1. `src/app/[locale]/(public)/<page>/page.tsx`.
2. Тексты в `src/messages/{ru,kk}.json`.
3. Линк в `Header.tsx` / `AdminSidebar.tsx` или через CMS-меню (`menu_items`).

## Новый AI-эндпоинт

1. `src/app/api/<endpoint>/route.ts`.
2. **Защита:** `enforceRateLimit` + (если мутация) `requireStaff` / `requireAdmin` + Zod-валидатор (`src/lib/validate.ts`).
3. **AI:** через `dispatchChat/Text/JSON` (Groq → Gemini failover) или wrapper в `gemini.ts`.
4. **Catch:** в каждом catch проверка `quotaErrorResponse(err, lang)` — иначе превышение квоты приведёт к невнятной 500.
5. Документировать в [`docs/API.md`](docs/API.md).

## Новая миграция

1. `sql/0NN_<name>.sql`. Идемпотентно (`IF NOT EXISTS`, `ON CONFLICT`).
2. Описать в [`docs/DATABASE.md`](docs/DATABASE.md) → таблица миграций.
3. Прогнать локально: `docker compose exec -T db psql -U postgres -d smart_kids_library < sql/0NN_*.sql`.

## Импорт фонда (Өлкетану / Краеведение)

```bash
npm run books:import     # docs/Text/ → public/uploads/books/ + JSON
npm run books:insert     # JSON → Postgres (UPSERT по original_filename)
npm run books:enrich     # Pass 1: pdf-parse + mammoth → реальные заголовки
npm run covers:tif       # 135 TIF → /uploads/covers/*.webp
npm run covers:gen       # PDF → 1-я страница; DOCX/no-file → типографика

# Pass 2 — обогащение через Groq (free):
docker compose exec -T -e GROQ_API_KEY=... \
  app node /app/scripts/enrich-books-pass2.mjs
```

После `books:insert` для JPG-сканов:

```sql
UPDATE books SET cover_url = file_url
 WHERE file_type IN ('jpg','jpeg')
   AND file_url IS NOT NULL AND file_url <> ''
   AND (cover_url IS NULL OR cover_url = '');
```

## Conventional Commits на русском

Английский префикс + русское описание, инфинитив, ≤72 символа, без точки. Тело отделять пустой строкой, объяснять «зачем».

| Префикс | Когда |
|---|---|
| `feat:` | Новая функциональность |
| `fix:` | Исправление бага |
| `docs:` | Только документация |
| `refactor:` | Рефакторинг без изменения поведения |
| `chore:` | Зависимости, конфиги |
| `ci:` | GitHub Actions |
| `perf:` | Оптимизация |
| `test:` | Тесты |

Примеры:
- `feat(catalog): добавить раздел Краеведение`
- `fix(api): валидация bookId в /api/catalog/progress`
- `docs(database): миграция 013_audit_log`
- `chore(deps): обновить mammoth до 1.12`

Не использовать `--no-verify` без согласования.

## PR / Issues

- На русском, по шаблонам `.github/PULL_REQUEST_TEMPLATE.md` и `.github/ISSUE_TEMPLATE/{bug,feature}.md`.
- Self-review до запроса ревью.
- Чеклист в шаблоне PR обязателен.

## Безопасность

- Не коммитить `.env*` (`.env.example` — только с плейсхолдерами).
- При утечке секрета **немедленно ротировать** ключ; удаления коммита недостаточно.
- Не использовать `dangerouslySetInnerHTML` без явного allowlist.
- Не вытаскивать `req.body` без валидации.
- `git remote` без токенов в URL (push через `gh` или SSH).
- Любая admin-мутация → `recordAudit(request, actor, entry)` в `src/lib/audit.ts`.
