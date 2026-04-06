# Deployment Guide

## Docker Compose (Recommended)

```bash
# Clone and configure
cp .env.example .env
# Edit .env with your API keys

# Start
docker compose up -d

# Initialize database (automatic on first run)
# Schema is applied from sql/001_init.sql
```

## Manual Deployment

### Prerequisites
- Node.js 20+
- PostgreSQL 16+

### Steps

```bash
# Install dependencies
npm install

# Build
npm run build

# Initialize database
psql -U postgres -d smart_kids_library -f sql/001_init.sql

# Start
npm start
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| DATABASE_URL | Yes | PostgreSQL connection string |
| NEXTAUTH_SECRET | Yes | NextAuth secret key |
| GEMINI_API_KEY | Yes | Google Gemini API key |
| ELEVENLABS_API_KEY | No | ElevenLabs TTS API key |
| TELEGRAM_BOT_TOKEN | No | Telegram bot token |
| TELEGRAM_CHANNEL_ID | No | Telegram channel for auto-posting |
| INSTAGRAM_ACCESS_TOKEN | No | Instagram Graph API token |
| GEMINI_DAILY_TOKEN_LIMIT | No | Daily token limit (default: 1,500,000) |

## Production Considerations

- Set `NEXTAUTH_SECRET` to a strong random value
- Configure proper PostgreSQL credentials
- Use HTTPS in production
- Set `NEXT_PUBLIC_APP_URL` to your domain
