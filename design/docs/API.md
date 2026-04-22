# API Reference

## Authentication

### POST /api/auth/[...nextauth]
NextAuth.js authentication endpoints.

## Catalog

### GET /api/catalog
Get books list with pagination and filters.

Query params: `page`, `limit`, `genre`, `age`, `lang`, `available`, `id`

### PUT /api/catalog
Save reading progress.

Body: `{ bookId, currentPage, totalPages }`

### POST /api/catalog/search
AI-powered book search.

Body: `{ query, language }`

Response: `{ books: [], suggestedFilters: [] }`

## AI Features

### POST /api/chatbot
Chat with AI librarian.

Body: `{ message, mode, language, history }`

Response: `{ response, tokensUsed, source }`

### POST /api/stories/generate
Generate interactive story.

Body: `{ childName, theme, character, ageLevel, language, continuation, previousStory }`

### POST /api/stories/tts
Text-to-speech for stories.

Body: `{ text, language }`

Response: Audio buffer (audio/mpeg)

### POST /api/quizzes
Generate literary quiz.

Body: `{ difficulty, language, count }`

### POST /api/coloring
Generate SVG coloring page.

Body: `{ theme, language }`

### POST /api/education
Educational helper.

Body: `{ type, mode, action, text, topic, grade, language }`

### GET /api/recommend
Book recommendations.

Query params: `ageGroup`, `locale`

## Content Management

### GET/POST /api/news
News CRUD.

### GET/POST /api/events
Events CRUD.

### POST /api/upload
File upload.

### POST /api/social/post
Auto-post to social media.

Body: `{ contentType, contentId, platform, title, description, imageUrl }`
