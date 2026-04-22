import type { Metadata, Viewport } from "next";
import { Geist, Fraunces } from "next/font/google";
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

export const metadata: Metadata = {
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
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/icon-192x192.png",
  },
  openGraph: {
    type: "website",
    siteName: "Smart Kids Library Satpayev",
    locale: "ru_RU",
    alternateLocale: ["kk_KZ"],
    url: APP_URL,
  },
  twitter: {
    card: "summary_large_image",
  },
  alternates: {
    languages: {
      ru: `${APP_URL}/ru`,
      kk: `${APP_URL}/kk`,
    },
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#2f6353",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${fraunces.variable} h-full antialiased bg-background`}
    >
      <body className="min-h-full flex flex-col font-sans text-foreground">
        {children}
      </body>
    </html>
  );
}
