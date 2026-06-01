import type { Metadata, Viewport } from "next";
import { Geist, Fraunces } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Заменяет ведущий /ru|/kk сегмент на нужную локаль (для hreflang).
function localizedPath(path: string, target: "ru" | "kk"): string {
  const stripped = path.replace(/^\/(ru|kk)(?=\/|$)/, "");
  return `/${target}${stripped}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers();
  const locale = h.get("x-locale") === "kk" ? "kk" : "ru";
  const path = h.get("x-url-path") || `/${locale}`;
  const canonical = `${APP_URL}${path}`;

  return {
    metadataBase: new URL(APP_URL),
    title: {
      default: "Smart Kids Library · Детская библиотека Сатпаев",
      template: "%s · Smart Kids Library",
    },
    description:
      "Цифровая экосистема Детской и юношеской библиотеки города Сатпаев: онлайн-каталог, ИИ-консультант, голосовой помощник, сказки, события, геймификация.",
    keywords: [
      "библиотека",
      "Сатпаев",
      "Сәтбаев",
      "детская библиотека",
      "книги",
      "ИИ-помощник",
      "сказки",
      "онлайн-каталог",
      "Казахстан",
    ],
    manifest: "/manifest.json",
    openGraph: {
      type: "website",
      siteName: "Smart Kids Library Satpayev",
      locale: locale === "kk" ? "kk_KZ" : "ru_RU",
      alternateLocale: [locale === "kk" ? "ru_RU" : "kk_KZ"],
      url: canonical,
    },
    twitter: {
      card: "summary_large_image",
    },
    alternates: {
      canonical,
      languages: {
        ru: `${APP_URL}${localizedPath(path, "ru")}`,
        kk: `${APP_URL}${localizedPath(path, "kk")}`,
        "x-default": `${APP_URL}${localizedPath(path, "ru")}`,
      },
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#2f6353",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = (await headers()).get("x-locale") === "kk" ? "kk" : "ru";
  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${fraunces.variable} h-full antialiased bg-background`}
    >
      <body className="min-h-full flex flex-col font-sans text-foreground">
        {children}
      </body>
    </html>
  );
}
