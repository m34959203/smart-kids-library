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
# 002–009 идемпотентны (CREATE … IF NOT EXISTS, ON CONFLICT)
for f in sql/00{2,3,4,5,6,7,8,9}_*.sql; do
  echo ">>> $f";
  docker compose exec -T db psql -U postgres -d smart_kids_library < "$f";
done
```

## Импорт каталога фонда (Өлкетану)

```bash
# 1. Положить оригиналы в docs/Text/  (не в git!)
#    Пример структуры: docs/Text/2022 ж оцифр/Казак оцифровка/*.docx
# 2. Импорт + апсёрт
npm run books:import      # копия в public/uploads/books + JSON
npm run books:insert      # апсёрт в БД (DATABASE_URL)
npm run books:enrich      # Pass 1: pdf-parse + mammoth
```

В `docker-compose.yml` уже подключён bind-mount
`./public/uploads/books:/app/public/uploads/books`, поэтому файлы видны
контейнеру сразу без ребилда.

## Manual deployment (без Docker)

```bash
# Зависимости
npm ci
# БД
psql -U postgres -d smart_kids_library -f sql/001_init.sql
for f in sql/00{2,3,4,5,6,7,8,9}_*.sql; do
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
| `GEMINI_API_KEY` | ключ Google Gemini (минимально для AI-фич) |
| `NEXT_PUBLIC_APP_URL` | публичный URL для метаданных и CORS |

### Опциональные

| Variable | Описание |
|----------|---------|
| `GEMINI_DAILY_TOKEN_LIMIT` | дневной лимит Gemini (по умолч. 1 500 000) |
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
10. ✅ Bind-mount `public/uploads/books/` подключён, права на запись.
11. ✅ В nginx/traefik отдаётся `/uploads/books/*` напрямую (мимо Node)
    для производительности.
12. ⚠ Прогон Lighthouse + axe-core, фикс CWV ≤ 3 с (TBD).

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
