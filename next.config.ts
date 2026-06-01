import type { NextConfig } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";

const csp = [
  "default-src 'self'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "font-src 'self' data:",
  // Next.js injects inline runtime scripts; Gemini/TTS are fetched client-side.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  // wss: нужен для Gemini Live (BidiGenerateContent — WebSocket).
  // В dev добавлен ws:/wss: localhost для HMR через quick tunnel.
  "connect-src 'self' https://generativelanguage.googleapis.com wss://generativelanguage.googleapis.com https://api.elevenlabs.io https://api.telegram.org https://graph.facebook.com ws: wss:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), geolocation=(self), microphone=(self)" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

// Уникальная метка сборки для версии Service-Worker-кеша.
// Меняется на каждый build → activate вычищает старые кеши и вытаскивает
// пользователей, застрявших на промежуточной (рассинхронизированной) сборке.
const SW_VERSION = process.env.NEXT_PUBLIC_SW_VERSION || String(Date.now());

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_SW_VERSION: SW_VERSION,
  },
  // Cloudflare quick tunnel-домены пропускаем для HMR в dev
  allowedDevOrigins: [
    "*.trycloudflare.com",
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  async headers() {
    // CORS только для /api/*. Origin контролируется через ALLOWED_ORIGINS;
    // если переменная не задана — использовать NEXT_PUBLIC_APP_URL, иначе same-origin only.
    const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? APP_URL ?? "")
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);
    const corsOrigin = allowedOrigins.length ? allowedOrigins.join(", ") : "";

    const corsHeaders = corsOrigin
      ? [
          { key: "Access-Control-Allow-Origin", value: corsOrigin },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,DELETE,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
          { key: "Access-Control-Max-Age", value: "86400" },
          { key: "Vary", value: "Origin" },
        ]
      : [];

    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      ...(corsHeaders.length
        ? [{ source: "/api/:path*", headers: corsHeaders }]
        : []),
    ];
  },
  async rewrites() {
    return APP_URL ? [] : [];
  },
  async redirects() {
    // /ru/ai и /kk/ai вели в 404 — нет отдельной AI-страницы.
    // Текстовый помощник — это чат-FAB, голосовой — /live. Закрываем 404 на /live.
    return [
      { source: "/:locale(ru|kk)/ai", destination: "/:locale/live", permanent: false },
    ];
  },
};

export default nextConfig;
