# Smart Kids Library — Сатпаев

Цифровая экосистема для детско-юношеской библиотеки города Сатпаев (Казахстан).
Билингвальный (KK/RU) сайт с AI-помощником, каталогом, генератором сказок,
голосовым взаимодействием, автопостингом в соцсети и админ-панелью CMS.

> **Заказчик:** КГУ «Детско-юношеская библиотека города Сатпаев» (Сәтбаев қ.,
> Қусайынов к-сі, 31-1).
> **Аудитория:** дети и подростки 6–17 лет.
> **Статус:** покрытие ТЗ ~98 % (см. [`NOTES.md §3`](NOTES.md)).

## Быстрый старт

```bash
# Зависимости
npm install

# Локальная разработка (порт 3000)
npm run dev

# Полный стек через Docker (app:3003, postgres:5440)
docker compose up --build
```

Откройте [http://localhost:3003](http://localhost:3003) (Docker) или
[http://localhost:3000](http://localhost:3000) (npm dev).

Без API-ключей приложение работает в demo-режиме (FAQ-fallback вместо AI).
Минимальный обязательный ключ — `GEMINI_API_KEY`. Остальные опциональны
(см. [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)).

## Технологии

- **Next.js 16.2.2** (App Router, standalone output) + **React 19** + TypeScript 5
- **Tailwind 4**, Lucide-иконки
- **PostgreSQL 16** (миграции 001–009)
- **Google Gemini** (`@google/genai` 1.50) — chat, RAG, TTS, function-calling
- **ElevenLabs** — KK TTS fallback
- **NextAuth 4** (bcrypt + JWT, роли admin/librarian/reader)
- **next-intl 4** (RU/KK)

## Возможности

- 🔍 **Электронный каталог** на ~1 000 материалов с двухуровневой
  локализацией (`title_ru` / `title_kk`), фильтрами по возрасту и **разделом
  «Краеведение / Өлкетану»** (942 оцифрованных материалов о Сатпаев/Улытау).
- 🤖 **Чат-помощник** (Gemini) c RAG из каталога/событий/новостей, KK/RU
  автодетектом, эскалацией к библиотекарю, голосовым вводом (Web Speech API).
- 📚 **Читалка** с прогрессом, закладками, изменением шрифта/темы.
- 🎓 **Образовательный помощник** на базе школьной программы РК (146 произведений 1–11 кл.).
- ✨ **Генератор сказок** RU/KK с multi-voice TTS (роли narrator/hero/villain/...).
- 🧩 **Викторины, мастерская, раскраски** (PDF-экспорт через jspdf).
- 📅 **Календарь событий** с автопостингом IG/TG (очередь + cron-tick).
- 🛠 **Админка**: каталог, новости, события, CMS-страницы, меню,
  база знаний AI, аналитика (`token_usage` + `chatbot_logs` + `visits`),
  модерация AI-контента, социальные посты.
- 🏆 **Геймификация**: баллы, достижения, streak, leaderboard.
- ♿ **WCAG**: skip-link, focus-visible, high-contrast, dyslexic-friendly,
  prefers-reduced-motion.
- 🌐 **PWA** (offline shell, sw.js) + полный SEO (sitemap, robots, JSON-LD,
  OpenGraph, alternates).

## Документация

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — структура проекта, слои, ключевые решения.
- [`docs/DATABASE.md`](docs/DATABASE.md) — схема (25 таблиц), миграции, индексы.
- [`docs/API.md`](docs/API.md) — REST-эндпоинты.
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — деплой, env-переменные, прод-чеклист.
- [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) — как контрибьютить.
- [`NOTES.md`](NOTES.md) — живой журнал решений (источник истины по
  статусу/договорённостям/рискам).
- [`AGENTS.md`](AGENTS.md) — заметки для AI-помощников (gotchas Next 16).
- [`CLAUDE.md`](CLAUDE.md) — справка для Claude Code.

## Скрипты NPM

```bash
npm run dev               # next dev (3000)
npm run build             # next build (standalone)
npm start                 # next start
npm run lint              # eslint

# Импорт фонда из docs/Text/ (см. NOTES.md)
npm run books:import      # копирует в public/uploads/books/, пишет books-data.json
npm run books:insert      # апсёртит в Postgres
npm run books:enrich      # Pass 1: pdf-parse + mammoth → реальные заголовки
```

## Лицензия и принадлежность

Код — собственность КГУ «Детско-юношеская библиотека города Сатпаев».
Содержание раздела «Краеведение» — оцифрованные материалы библиотеки,
авторские права принадлежат соответствующим авторам/правообладателям.
