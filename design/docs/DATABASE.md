# Database Schema

## PostgreSQL 16

Schema file: `sql/001_init.sql`

## Tables

| Table | Description |
|-------|-------------|
| users | User accounts with roles and age groups |
| books | Book catalog (~15,000 entries) |
| reading_progress | Per-user reading progress tracking |
| favorites | User's favorite books |
| news | Bilingual news articles |
| events | Library events with types and age groups |
| stories | AI-generated stories |
| quiz_results | Quiz score history |
| chatbot_knowledge | FAQ knowledge base for AI fallback |
| chatbot_logs | Chat conversation logs |
| token_usage | Daily AI token tracking |
| social_posts | Social media post history |
| site_settings | Key-value configuration |

## Key Relationships

- `reading_progress` -> `users`, `books`
- `favorites` -> `users`, `books`
- `news` -> `users` (author)
- `stories` -> `users`
- `quiz_results` -> `users`, `books`

## Indexes

Full-text search index on `books.title` for fast catalog search.
Date indexes on events and token_usage for time-based queries.
