# Architecture

## Overview

Smart Kids Library uses a monolithic Next.js 15 architecture with the App Router pattern.

## Layers

```
Client (Browser/PWA)
  |
  v
Next.js App Router (SSR + CSR)
  |
  +--> API Routes (REST)
  |      |
  |      +--> PostgreSQL 16
  |      +--> Google Gemini API
  |      +--> ElevenLabs API
  |      +--> Telegram Bot API
  |      +--> Instagram Graph API
  |
  +--> Server Components (SSR)
  +--> Client Components (CSR)
```

## Directory Structure

- `src/app/[locale]/(public)/` - Public-facing pages
- `src/app/[locale]/(admin)/` - Admin panel
- `src/app/api/` - REST API endpoints
- `src/components/ui/` - Reusable UI components
- `src/components/layout/` - Layout components (Header, Footer, etc.)
- `src/components/features/` - Domain-specific components
- `src/lib/` - Utilities, API clients, database
- `src/messages/` - i18n translation files

## Key Design Decisions

1. **Server Components by default** - Only use "use client" when interactivity is needed
2. **Token budget management** - AI features gracefully degrade when daily limit reached
3. **Fallback to FAQ** - When AI is unavailable, chatbot uses knowledge base
4. **Hybrid TTS** - Gemini for Russian, ElevenLabs for Kazakh, Web Speech API as fallback
5. **Age-adaptive UI** - Content and navigation change based on selected age group
