FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Публичный URL запекается на build: sitemap.ts/robots.ts статически
# пререндерятся, поэтому без этого они уходят на дефолт localhost.
# Передаётся через --build-arg NEXT_PUBLIC_APP_URL=https://<домен>.
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# poppler-utils даёт pdftoppm для scripts/generate-book-covers.mjs.
# ttf-dejavu + fontconfig нужны librsvg (через sharp) для рендера кириллицы
# и казахских букв в SVG-обложках — без них librsvg рисует пустые квадраты.
RUN apk add --no-cache poppler-utils ttf-dejavu fontconfig

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# bind-mount точки для фонда и обложек должны принадлежать nextjs
RUN mkdir -p /app/public/uploads/books /app/public/uploads/covers \
    && chown -R nextjs:nodejs /app/public/uploads

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
