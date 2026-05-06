# Deployment Guide

## Локально через Docker Compose

```bash
# 1. ENV
cp .env.example .env
# 2. Отредактировать .env (минимум: GEMINI_API_KEY, NEXTAUTH_SECRET)
# 3. Поднять
docker compose up --build
# Приложение → http://localhost:3003
# Postgres → localhost:5440
```

При первом запуске Postgres-контейнер автоматически прогоняет
`sql/001_init.sql` через `docker-entrypoint-initdb.d`. Остальные миграции
**нужно прогнать вручную** (см. ниже).

## Прогон миграций

```bash
# 002–013 идемпотентны (CREATE … IF NOT EXISTS, ON CONFLICT)
for f in sql/00{2,3,4,5,6,7,8,9}_*.sql sql/01{0,1,2,3}_*.sql; do
  echo ">>> $f";
  docker compose exec -T db psql -U postgres -d smart_kids_library < "$f";
done
```

Новые миграции 010–013 (2026-05):
- `010_ai_usage.sql` — журнал AI-вызовов
- `011_tts_cache.sql` — L2 кэш TTS
- `012_password_resets.sql` — восстановление пароля
- `013_audit_log.sql` — журнал админ-действий

## Импорт каталога фонда (Өлкетану)

```bash
# 1. Положить оригиналы в docs/Text/  (не в git!)
#    Пример структуры: docs/Text/2022 ж оцифр/Казак оцифровка/*.docx
# 2. Импорт + апсёрт + текстовое обогащение
npm run books:import      # копия в public/uploads/books + JSON
npm run books:insert      # апсёрт в БД (DATABASE_URL)
npm run books:enrich      # Pass 1: pdf-parse + mammoth
# 3. Обложки (после books:insert; идемпотентны)
npm run covers:tif        # 135 TIF → /uploads/covers/*.webp (sharp)
npm run covers:gen        # PDF → 1-я страница; DOCX/no-file → типографика
```

В `docker-compose.yml` уже подключены bind-mount'ы
`./public/uploads/books:/app/public/uploads/books` и
`./public/uploads/covers:/app/public/uploads/covers`, поэтому файлы видны
контейнеру сразу без ребилда.

> Для JPG-сканов отдельный скрипт не нужен: `scripts/insert-books.js` уже
> кладёт `file_url=/uploads/books/...jpg`, и одноразовый SQL прописал
> `cover_url := file_url` для всех 614 JPG. При новом импорте JPG
> повторите тот же UPDATE:
>
> ```sql
> UPDATE books SET cover_url = file_url
>  WHERE file_type IN ('jpg','jpeg')
>    AND file_url IS NOT NULL AND file_url <> ''
>    AND (cover_url IS NULL OR cover_url = '');
> ```

## Manual deployment (без Docker)

```bash
# Зависимости
npm ci
# БД
psql -U postgres -d smart_kids_library -f sql/001_init.sql
for f in sql/00{2,3,4,5,6,7,8,9}_*.sql sql/01{0,1,2,3}_*.sql; do
  psql -U postgres -d smart_kids_library -f "$f";
done
# Билд
npm run build
# Запуск (standalone)
node .next/standalone/server.js
```

## Environment Variables

### Обязательные

| Variable | Описание |
|----------|---------|
| `DATABASE_URL` | строка подключения PostgreSQL |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32`; должен быть ≥ 32 байт |
| `NEXTAUTH_URL` | внешний URL сайта |
| `GROQ_API_KEY` | основной LLM (chatbot/stories/quizzes/etc — $0 free-tier) |
| `GEMINI_API_KEY` | для kk-TTS и failover при Groq 429 |
| `LLM_PROVIDER` | `groq` (рекомендуется) / `gemini` / `auto` |
| `NEXT_PUBLIC_APP_URL` | публичный URL для метаданных и CORS |

### Опциональные

| Variable | Описание |
|----------|---------|
| `AI_USD_CAP_DAILY` | дневной USD-cap (по умолч. `0.50`) — блокирует AI при 90% от cap |
| `AI_USD_CAP_TOTAL` | период USD-cap (по умолч. `4.50`) |
| `AI_USD_CAP_PERIOD_START` | дата начала периода (`YYYY-MM-DD`) |
| `AI_USER_RPD` / `AI_USER_RPM` / `AI_USER_USD_DAILY` | per-user квоты (40 / 5 / 0.05) |
| `AI_ANON_RPD` / `AI_ANON_RPM` | per-IP квоты для анонов (12 / 3) |
| `RECOVER_TOKEN_IN_RESPONSE` | в проде ставить `0` — иначе `/api/auth/recover` возвращает токен в response (dev-режим) |
| `GEMINI_DAILY_TOKEN_LIMIT` | старый лимит, оставлен для совместимости (по умолч. 1 500 000) |
| `ELEVENLABS_API_KEY` + `ELEVENLABS_VOICE_ID` | KK TTS fallback |
| `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHANNEL_ID` | автопостинг TG |
| `INSTAGRAM_ACCESS_TOKEN` + `INSTAGRAM_ACCOUNT_ID` | автопостинг IG |
| `SEED_ADMIN_EMAIL` + `SEED_ADMIN_PASSWORD` | первичный сид админа при старте |
| `CRON_SECRET` | защита `/api/social/tick` |
| `ALLOWED_ORIGINS` | CSV доменов для CORS-заголовков на `/api/*` |

## Production-чеклист

1. ✅ `NEXTAUTH_SECRET` сгенерирован безопасно.
2. ✅ Дефолтный admin **не сидится** в SQL — создаётся через
   `SEED_ADMIN_*` при первом запуске; пароль сменён.
3. ✅ `.env` вне репо, секреты через Docker-secrets / chmod 600.
4. ✅ `output: "standalone"` (`next.config.ts`); Dockerfile multi-stage.
5. ✅ Postgres backup: `pg_dump` в cron, persistent volume.
6. ✅ HTTPS через reverse-proxy (Traefik / Nginx); SSL.
7. ✅ Все `NEXT_PUBLIC_APP_URL` и `NEXTAUTH_URL` — на боевой домен.
8. ✅ Rate-limit включён, CSP заголовки заданы (см. `next.config.ts`).
9. ✅ Прогнаны все миграции `sql/00*.sql`.
10. ✅ Bind-mount `public/uploads/books/` и `public/uploads/covers/`
    подключены, права на запись (uid app-юзера, **не root**; см. gotcha ниже).
11. ✅ В nginx/traefik отдаётся `/uploads/books/*` и `/uploads/covers/*`
    напрямую (мимо Node) для производительности.
12. ✅ В контейнере установлен `poppler-utils` (для `pdftoppm`); Dockerfile
    добавляет `apk add --no-cache poppler-utils` в alpine-образ.
13. ⚠ Прогон Lighthouse + axe-core, фикс CWV ≤ 3 с (TBD).

## Где может стрельнуть

- **`next dev` через cloudflared.** Без `allowedDevOrigins: ["*.trycloudflare.com"]`
  в `next.config.ts` клиент не гидрируется и каталоги пустые.
- **Bind-mount без перезапуска.** Новые файлы в `public/uploads/books/`
  видны контейнеру сразу, но если контейнер запущен **без** volume
  (старый compose) — нужен `docker compose up -d` с пересозданием.
- **Миграция 003 (геймификация).** При прогоне после 002 ошибок не будет
  (использует `IF NOT EXISTS`); если пропустить — `/api/gamification`
  вернёт 401 на auth-pass, но упадёт `relation "achievements" does not exist`
  при первом запросе.
- **Cloudflare и не-encoded UTF-8 в URL.** При тестах `curl` важно
  URL-кодировать кириллицу: `?q=%D0%A3%D0%BB%D1%8B%D1%82%D0%B0%D1%83`,
  иначе CF возвращает 400.
- **Pass 1 enrichment.** Запускать **после** `books:insert`. Перед запуском
  убедиться, что `DATABASE_URL` указывает туда же, куда писал
  `insert-books.js`.
- **`covers:tif` падает с EACCES.** Свежесмонтированный bind-mount
  `/app/public/uploads/covers` принадлежит host-юзеру, а app-контейнер
  работает под `nextjs:nogroup` (uid 1001). Разово исправить:
  `docker compose exec --user root app sh -c "chown -R 1001:65533 /app/public/uploads/covers && chmod 775 /app/public/uploads/covers"`.
  В долгосрочной перспективе — добавить инициализацию в Dockerfile/entrypoint.
- **`covers:tif` падает с "Invalid TIFF directory".** Sharp по умолчанию
  трактует libtiff-warnings как ошибки. В скрипте уже выставлен
  `failOn: "none"`, не убирать.
- **`covers:gen` падает на PDF без `pdftoppm`.** Установить poppler-utils:
  `apk add --no-cache poppler-utils` (alpine) / `apt-get install -y poppler-utils` (debian).
- **Регенерация обложек.** Скрипты не перезатирают непустой `cover_url`.
  Чтобы пересоздать всё, сначала очистить:
  `UPDATE books SET cover_url = NULL` (опасно для прод, делать в окне
  обслуживания) или таргетировать конкретные ID.
