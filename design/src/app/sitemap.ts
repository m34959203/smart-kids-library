import type { MetadataRoute } from "next";
import { getMany } from "@/lib/db";

const STATIC_ROUTES = [
  "",
  "/catalog",
  "/kids",
  "/kids/stories",
  "/kids/quizzes",
  "/kids/workshop",
  "/kids/coloring",
  "/events",
  "/news",
  "/about",
  "/services",
  "/resources",
  "/rules",
  "/contacts",
  "/profile",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  const locales = ["ru", "kk"] as const;
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const route of STATIC_ROUTES) {
      entries.push({
        url: `${base}/${locale}${route}`,
        lastModified: now,
        changeFrequency: route === "" ? "daily" : "weekly",
        priority: route === "" ? 1 : 0.7,
      });
    }
  }

  try {
    const books = await getMany<{ id: number; created_at: Date }>(
      "SELECT id, created_at FROM books ORDER BY created_at DESC LIMIT 1000"
    );
    for (const b of books) {
      for (const locale of locales) {
        entries.push({
          url: `${base}/${locale}/catalog/${b.id}`,
          lastModified: b.created_at,
          changeFrequency: "monthly",
          priority: 0.6,
        });
      }
    }
  } catch {
    // DB may be offline during build
  }

  try {
    const news = await getMany<{ slug: string; created_at: Date }>(
      "SELECT slug, created_at FROM news WHERE status='published' ORDER BY created_at DESC LIMIT 500"
    );
    for (const n of news) {
      for (const locale of locales) {
        entries.push({
          url: `${base}/${locale}/news/${n.slug}`,
          lastModified: n.created_at,
          changeFrequency: "weekly",
          priority: 0.6,
        });
      }
    }
  } catch {
    // ignore
  }

  try {
    const events = await getMany<{ id: number; created_at: Date }>(
      "SELECT id, created_at FROM events WHERE status='active' ORDER BY start_date DESC LIMIT 500"
    );
    for (const e of events) {
      for (const locale of locales) {
        entries.push({
          url: `${base}/${locale}/events/${e.id}`,
          lastModified: e.created_at,
          changeFrequency: "weekly",
          priority: 0.6,
        });
      }
    }
  } catch {
    // ignore
  }

  return entries;
}
