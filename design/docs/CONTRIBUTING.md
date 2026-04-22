# Contributing

## Development Setup

```bash
npm install
cp .env.example .env
docker compose up db -d  # Start PostgreSQL only
npm run dev
```

## Code Standards

- TypeScript strict mode
- Components: Server by default, `"use client"` only when needed
- Translations: Add to both `src/messages/ru.json` and `src/messages/kk.json`
- Styling: Tailwind CSS utility classes, use `cn()` for conditionals
- Database: Use `src/lib/db.ts` helpers (query, getOne, getMany)

## Adding a New Page

1. Create page file in `src/app/[locale]/(public)/your-page/page.tsx`
2. Add translations to both message files
3. Add navigation link to Header.tsx if needed

## Adding a New API Route

1. Create `route.ts` in `src/app/api/your-endpoint/`
2. Use standard Next.js Request/Response
3. Add documentation to `docs/API.md`

## AI Features

- All AI calls go through `src/lib/gemini.ts`
- Always check `isWithinTokenLimit()` before AI calls
- Provide fallback behavior when AI is unavailable
