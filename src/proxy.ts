import { NextRequest, NextResponse } from "next/server";

const locales = ["ru", "kk"];
const defaultLocale = "ru";

// Имя cookie у NextAuth (next-auth.session-token; secure-prefix в проде).
const SESSION_COOKIES = [
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
];

function getLocale(request: NextRequest): string {
  const pathname = request.nextUrl.pathname;
  for (const locale of locales) {
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      return locale;
    }
  }
  const acceptLang = request.headers.get("Accept-Language") ?? "";
  if (acceptLang.includes("kk")) return "kk";
  return defaultLocale;
}

function isAdminPath(pathname: string): boolean {
  // /ru/admin, /ru/admin/..., /kk/admin, /kk/admin/...
  return /^\/(ru|kk)\/admin(\/|$)/.test(pathname);
}

function hasSessionCookie(request: NextRequest): boolean {
  return SESSION_COOKIES.some((name) => Boolean(request.cookies.get(name)?.value));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API, static files, and Next.js internals
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/uploads/") ||
    pathname.includes(".") ||
    pathname === "/manifest.json" ||
    pathname === "/favicon.ico" ||
    pathname === "/icon" ||
    pathname === "/apple-icon" ||
    pathname === "/opengraph-image" ||
    pathname === "/twitter-image" ||
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt" ||
    pathname === "/sw.js" ||
    pathname === "/offline.html"
  ) {
    return NextResponse.next();
  }

  // Check if pathname has locale
  const hasLocale = locales.some(
    (l) => pathname.startsWith(`/${l}/`) || pathname === `/${l}`
  );

  if (!hasLocale) {
    const locale = getLocale(request);
    const newUrl = new URL(`/${locale}${pathname}`, request.url);
    return NextResponse.redirect(newUrl);
  }

  // Optimistic admin gate — нет session-cookie → сразу на /profile (там login).
  // Полная проверка роли делается в (admin)/admin/layout.tsx через NextAuth.
  if (isAdminPath(pathname) && !hasSessionCookie(request)) {
    const locale = pathname.startsWith("/kk") ? "kk" : "ru";
    const url = new URL(`/${locale}/profile`, request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Прокидываем локаль и путь в server components / generateMetadata
  // через request-заголовки — корневой layout строит из них lang,
  // canonical, og:url, hreflang.
  const locale = pathname.startsWith("/kk") ? "kk" : "ru";
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-locale", locale);
  requestHeaders.set("x-url-path", pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/((?!_next|api|uploads|favicon.ico|manifest.json|icon|apple-icon|opengraph-image|twitter-image|sitemap.xml|robots.txt|sw.js|offline.html).*)",
  ],
};
