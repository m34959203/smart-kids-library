# Smart Kids Library — Сатпаев

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Stack](https://img.shields.io/badge/stack-Next.js%2016%20·%20Postgres%20·%20Groq%20·%20Gemini-black)]()
[![Lang](https://img.shields.io/badge/lang-RU%20·%20KK-orange)]()
[![Status](https://img.shields.io/badge/status-production--ready-green)]()

> Цифровая экосистема Детско-юношеской библиотеки города Сәтбаев: AI-помощник, билингвальный каталог 943 материалов, голосовой диалог, генератор сказок и автопостинг в соцсети.

## Проблема

Областная детская библиотека хочет онлайн-витрину уровня современного EdTech-сервиса, а не просто страницу с режимом работы. Но команда — 2 библиотекаря, бюджета на разработку нет, нет домена, нет email-инфраструктуры. У читателей дома часто нет компьютера, заходят с телефонов родителей. Каталог — 943 краеведческих материала о Сатпаев/Улытау в виде PDF/DOCX/JPG-сканов, метаданных нет.

## Решение

Полноценный портал: каталог с поиском и обложками для всех 943 книг, **AI-консультант «Кітапхан»** (RU/KK с автодетектом) на бесплатном Groq llama-3.3-70b, читалка с прогрессом, образовательный AI на школьной программе РК (146 произведений 1–11 кл.), генератор сказок с 6-голосной озвучкой kk-TTS, викторины, раскраски (5 SVG → PDF), календарь событий с автопостингом IG/TG, регистрация читателей с восстановлением пароля, геймификация (баллы/streak/leaderboard), полный CMS-редактор для библиотекарей.

## Why этот стек

- **Next.js 16** App Router + standalone — один Docker-образ, без vendor lock-in. Bilingual через next-intl 4 (`/ru/...` / `/kk/...`).
- **Groq llama-3.3-70b** для всех текстовых AI-вызовов: free-tier, отклик ~900 ms (vs 2-5 с у Gemini), $0/сутки на проект. **Gemini только для kk-TTS** — единственная модель с нативным казахским.
- **Постоянный USD-cap** ($0.50/сутки по умолчанию) на стороне сервера: `assertQuota` блокирует AI-вызов **до** запроса. Превышение → 429 с понятным сообщением (`retryHuman`, `Retry-After`).
- **Postgres 16** + 13 идемпотентных миграций + `pg_dump` бэкапы. Никаких ORM — прямые SQL через `pg.Pool`.
- **DejaVu Serif в Docker-образе** — единственный шрифт с кириллицей+казахскими глифами в alpine, без него librsvg рисует квадраты вместо букв.

## Demo

- **Live (через Cloudflare quick tunnel):** временная ссылка вида
  `https://<random>.trycloudflare.com/ru` (меняется при перезапуске туннеля).
- Домен `*.kz` пока не зарегистрирован — демо для заказчика.
- Скриншоты интерфейса: [docs/screenshots/](docs/screenshots/).

## Архитектура

```
┌─────────────────────────────────────────────────────────────┐
│  Browser (PWA + WebSpeech)                                  │
└──────────────────┬──────────────────────────────────────────┘
                   │ HTTPS via cloudflared
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  Next.js 16 App Router (standalone)                         │
│  • src/proxy.ts — locale-routing + admin optimistic gate    │
│  • (public) — каталог / читалка / kids / events / контент   │
│  • (admin) — role-gate в layout.tsx + 8 разделов CMS        │
│  • api/ — 30+ REST-эндпоинтов                               │
└──┬─────────────────┬───────────────┬────────────────────────┘
   │                 │               │
   ▼                 ▼               ▼
Postgres 16    src/lib/llm/      Внешние сервисы
(13 миграций)  ├─ dispatch ──┐   ├─ Groq (текст: chat/json)
               ├─ groq.ts    │   ├─ Gemini (kk-TTS, fallback)
               └─ gemini-direct.ts ├─ ElevenLabs (ru-TTS)
                                  ├─ Telegram / Instagram
                                  └─ Cloudflare quick tunnel
```

Подробнее: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/DATABASE.md](docs/DATABASE.md), [docs/API.md](docs/API.md).

## Quick Start

```bash
git clone https://github.com/m34959203/smart-kids-library.git
cd smart-kids-library

# 1. Окружение
cp .env.example .env
# отредактировать минимум: GROQ_API_KEY (для текста), GEMINI_API_KEY (для kk-TTS)

# 2. Полный стек
docker compose up --build
# → http://localhost:3003 (app), localhost:5440 (postgres)

# 3. Миграции 002–013 (001 идёт автоматом)
for f in sql/00{2,3,4,5,6,7,8,9}_*.sql sql/01{0,1,2,3}_*.sql; do
  docker compose exec -T db psql -U postgres -d smart_kids_library < "$f"
done

# 4. (опционально) Импорт фонда
# Положить файлы в docs/Text/, потом:
npm run books:import && npm run books:insert && npm run books:enrich
npm run covers:tif && npm run covers:gen
```

Подробная инструкция и troubleshooting: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Стек

| Слой | Технологии |
|---|---|
| Frontend | Next.js 16.2.2 · React 19.2 · TypeScript 5 · Tailwind 4 · Lucide |
| Backend | Postgres 16 (`pg.Pool`, 13 миграций) · NextAuth 4 (SHA-256 + JWT) |
| AI текст | **Groq** (`llama-3.3-70b-versatile`, `openai/gpt-oss-120b`) — основной |
| AI голос | **Gemini** (`gemini-3.1-flash-tts-preview` — KK) · Google Cloud TTS / ElevenLabs (RU) |
| Соцсети | Telegram Bot API · Instagram Graph API |
| Хостинг | Docker Compose · Cloudflare quick tunnel · Plesk-готов |
| i18n | next-intl 4 (RU/KK) |

## Возможности

- **Каталог** — 943 материала с обложками 100% (614 нативных JPG + 135 TIF→WebP + 61 PDF→WebP + 133 типографических SVG)
- **Чат «Кітапхан»** через Groq, ~900 ms; STT/TTS, эскалация к библиотекарю, автодетект языка
- **Читалка** с прогрессом, закладками, шрифт/тема (light/sepia/dark), TTS-озвучивание
- **Образовательный AI** — `school_curriculum` 146 произведений 1–11 классов
- **Генератор сказок** 3 уровня сложности, multi-voice TTS (narrator/hero/villain/child/elder/magic)
- **Викторины, мастерская, раскраски** (PDF-экспорт через jspdf)
- **Календарь событий** с автопостингом IG/TG (очередь + cron-tick)
- **Регистрация / восстановление пароля** (`/profile/{register,recover,reset}` + 3 API)
- **Админка** — каталог, новости, события, CMS-страницы, меню, AI knowledge, аналитика, модерация, соц-посты
- **Геймификация** — баллы, достижения, streak, leaderboard
- **PWA** (offline shell, service worker) + полный SEO (sitemap/robots/JSON-LD/OpenGraph + ru/kk alternates)
- **WCAG** — skip-link, focus-visible, high-contrast, dyslexic-friendly, prefers-reduced-motion
- **AI-бюджет под контролем** — `ai_generations` журнал, USD-cap $0.50/день, per-user/anon квоты, понятные 429 для пользователя

## Скрипты NPM

```bash
npm run dev               # next dev (3000)
npm run build             # next build (standalone)
npm start                 # next start
npm run lint              # eslint

# Импорт фонда (Краеведение / Өлкетану)
npm run books:import      # docs/Text/ → public/uploads/books/ + JSON
npm run books:insert      # JSON → Postgres (UPSERT по original_filename)
npm run books:enrich      # Pass 1: pdf-parse + mammoth → реальные заголовки

# Обложки (идемпотентны, безопасно перезапускать)
npm run covers:tif        # 135 TIF → /uploads/covers/*.webp (Sharp)
npm run covers:gen        # 61 PDF → 1-я страница; 133 DOCX/no-file → типографика
```

> Покрытие `cover_url`: **943/943** (100%). Скрипты пишут только записи с пустым `cover_url`, не перезатирают существующие.

## Roadmap

- [x] **MVP (2026-04)** — каталог, чат, генераторы, события, админка, геймификация
- [x] **AI-стек на Groq + USD-cap (2026-05)** — все текстовые эндпоинты $0/сутки
- [x] **Регистрация + восстановление пароля (2026-05-06)** — без email-инфры (токен в response для dev)
- [x] **Audit log админ-действий (2026-05-06)** — модуль готов
- [ ] **OCR для 851 скана** (Vision API / Tesseract) — извлечение метаданных
- [ ] **SMTP / Telegram-бот для recover** — настоящая email-доставка
- [ ] **Интеграции с открытыми каталогами** Kazlib.kz / Elibra.kz / Nabrk.kz — нужны договорённости с правообладателями
- [ ] **Push-уведомления** о новых событиях
- [ ] **PDF-сертификат** «прочитано N книг» для геймификации

Подробно — [`NOTES.md`](NOTES.md).

## Документация

| Документ | О чём |
|---|---|
| 📘 [`docs/USER_GUIDE.md`](docs/USER_GUIDE.md) | **Руководство пользователя** (читатели/дети/родители) со скриншотами |
| 🔧 [`docs/ADMIN_GUIDE.md`](docs/ADMIN_GUIDE.md) | **Руководство администратора** (библиотекари) со скриншотами |
| [`NOTES.md`](NOTES.md) | Живой журнал решений, источник истины по статусу |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Структура проекта, слои, ключевые решения |
| [`docs/DATABASE.md`](docs/DATABASE.md) | 29 таблиц, 13 миграций, индексы |
| [`docs/API.md`](docs/API.md) | REST-эндпоинты |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Деплой, env-переменные, прод-чеклист |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Как контрибьютить, code style, conventional commits |
| [`AGENTS.md`](AGENTS.md) | Заметки для AI-помощников (gotchas Next 16) |
| [`CLAUDE.md`](CLAUDE.md) | Справка для Claude Code |

## Контакты заказчика

КГУ «Детско-юношеская библиотека города Сатпаев»
Ұлытау обл., г. Сатпаев, ул. Кусаинова, 31-1
+7 (71063) 7-49-62 · biblioteka_15.86@mail.ru

## Лицензия

[MIT](LICENSE) — код. Содержимое раздела «Краеведение» (943 материала) принадлежит соответствующим авторам/правообладателям.
