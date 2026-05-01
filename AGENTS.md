<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

Версия — **Next.js 16.2.2**. Breaking changes относительно тренировочных
данных большинства моделей. Перед изменением API-роутов, файлов конвенций
или структуры — читай `node_modules/next/dist/docs/`.

## Gotchas Next 16, специфичные для этого проекта

- **`middleware.ts` → `proxy.ts`.** В Next 16 middleware deprecated,
  переименован в proxy. См. `src/proxy.ts`. Экспорт — функция `proxy`
  (или `default`). Один файл на проект, в `src/` рядом с `app/`.
- **Edge proxy не для тяжёлой логики.** Authz — в layout.tsx (см.
  `(admin)/admin/layout.tsx` с `requireStaff` + `redirect`).
- **`next/image` обязателен.** `<img>` нигде не используется. Для всех
  картинок — `Image`, с `fill` или `width/height`. `remotePatterns` уже
  открыт `https://**` в `next.config.ts`.
- **`allowedDevOrigins: ["*.trycloudflare.com"]`** — обязательно для
  HMR через Cloudflare quick tunnel в dev-режиме (иначе клиент не
  гидрируется и каталоги пустые).
- **`output: "standalone"`** в `next.config.ts` (используется в
  Dockerfile). Любые runtime-файлы (например, `scripts/books-data.json`)
  должны быть либо bind-mount'нуты, либо в `public/`.
- **`searchParams` и `params` — Promises** (Next 15+). Везде
  `const sp = await searchParams`.
- **`request.cookies.get(name)?.value`** возвращает `string | undefined`,
  а не объект.

## Конвенции проекта

- Все БД-вызовы — через `src/lib/db.ts` (pool).
- Все AI-вызовы — через `src/lib/gemini.ts` (с token-tracker).
- Все мутации в API — `requireStaff()`/`requireAdmin()` + Zod-валидатор
  (`src/lib/validate.ts`) + rate-limit (`src/lib/rate-limit.ts`).
- Тексты в UI — `t(messages, "key")`, не хардкод.
- Локализация заголовков из БД — каскад `title_${locale}` → `title_${other}` → `title`.

## Долги и рамки

- Не трогать `proxy.ts` для тяжёлой проверки сессии — только optimistic
  cookie-check; full session — в layout.
- Не добавлять зависимости без согласования (бюджет Gemini ограничен,
  стек должен оставаться $0 при отсутствии ключей).
- Live KK / Native Audio (если потребуется) — `gemini-2.5-flash-native-audio-preview-12-2025`,
  ephemeral tokens только.
- Browser TTS (`speechSynthesis`) **запрещён**. Только серверные провайдеры.
<!-- END:nextjs-agent-rules -->
