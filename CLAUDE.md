# Smart Kids Library Satpayev - Developer Guide

## Project Overview
Digital ecosystem for children's and youth library in Satpayev, Kazakhstan.
Bilingual (KZ/RU), AI-powered, targeting children 6-17 years old.

## Tech Stack
- Next.js 15 (App Router), React 19, TypeScript 5, Tailwind CSS 4
- PostgreSQL 16 for data storage
- Google Gemini API (free tier) for AI features
- Web Speech API + ElevenLabs for TTS/STT

## Key Conventions

### File Structure
- Pages use `[locale]` dynamic segment for i18n (ru/kk)
- Public pages under `(public)` route group
- Admin pages under `(admin)` route group
- API routes under `src/app/api/`
- Components: `ui/` (reusable), `layout/` (structural), `features/` (domain)

### Code Style
- All components use TypeScript with proper interfaces
- Server components by default; `"use client"` only when needed
- Use `@/` import alias for all internal imports
- Use `cn()` utility for conditional class names
- Use `t()` for translations from message files

### i18n
- Two locales: `ru` (Russian, default), `kk` (Kazakh)
- Messages in `src/messages/ru.json` and `src/messages/kk.json`
- Middleware redirects bare paths to locale-prefixed paths

### AI Integration
- All AI calls go through `src/lib/gemini.ts`
- Token tracking via `src/lib/token-tracker.ts`
- Daily token limit configurable via `GEMINI_DAILY_TOKEN_LIMIT`
- Graceful degradation to FAQ when limit reached

### Database
- Schema in `sql/001_init.sql`
- Use `src/lib/db.ts` for all DB operations
- Pool-based connections with query logging in dev

### Content Safety
- All AI-generated content for children must be moderated
- Chat system prompt enforces kid-friendly responses
- Admin moderation page for reviewing AI content

## Commands
- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run lint` - ESLint
- `docker compose up` - Full stack with PostgreSQL
