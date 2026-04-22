# Smart Kids Library Satpayev

Digital ecosystem for children's and youth library in Satpayev, Kazakhstan.

## Features

- **Bilingual**: Full Kazakh (KZ) and Russian (RU) support
- **AI Consultant**: 24/7 digital librarian powered by Google Gemini
- **Book Catalog**: ~15,000 books with online reading and AI-powered search
- **Story Generator**: Interactive AI story creation with branching narratives and TTS
- **Literary Quizzes**: AI-generated quizzes with 3 difficulty levels
- **Creative Workshop**: AI-assisted creative writing for children
- **Coloring Pages**: AI-generated SVG coloring pages
- **Event Calendar**: Color-coded calendar with filtering
- **Age Navigation**: 3 profiles (6-9, 10-13, 14-17)
- **Auto-posting**: Telegram and Instagram integration
- **PWA Support**: Installable as mobile app

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start with Docker (includes PostgreSQL)
docker compose up

# Or run locally (requires PostgreSQL)
npm run dev
```

## Environment Variables

See `.env.example` for all required variables.

## Documentation

- [Architecture](./ARCHITECTURE.md)
- [API Reference](./API.md)
- [Database Schema](./DATABASE.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Contributing](./CONTRIBUTING.md)
