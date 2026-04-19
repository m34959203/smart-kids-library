import type { ReactElement } from "react";
import { createElement } from "react";

interface JsonLdProps {
  data: unknown;
}

export function JsonLd({ data }: JsonLdProps): ReactElement {
  return createElement("script", {
    type: "application/ld+json",
    dangerouslySetInnerHTML: { __html: JSON.stringify(data) },
  });
}

export function organizationSchema() {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  return {
    "@context": "https://schema.org",
    "@type": "Library",
    name: "Детская и юношеская библиотека г. Сатпаев",
    alternateName: "Сатпаев балалар және жасөспірімдер кітапханасы",
    url: base,
    logo: `${base}/icon-512.png`,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Сатпаев",
      streetAddress: "ул. Абая, 1",
      addressCountry: "KZ",
    },
    telephone: "+7-710-63-1-23-45",
    openingHours: ["Mo-Fr 09:00-18:00", "Sa 10:00-16:00"],
  };
}

export function bookSchema(book: {
  id: number;
  title: string;
  author: string;
  description?: string;
  cover_url?: string;
  isbn?: string;
  year?: number;
  language?: string;
}) {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  return {
    "@context": "https://schema.org",
    "@type": "Book",
    "@id": `${base}/ru/catalog/${book.id}`,
    name: book.title,
    author: { "@type": "Person", name: book.author },
    description: book.description,
    image: book.cover_url,
    isbn: book.isbn,
    inLanguage: book.language ?? "ru",
    datePublished: book.year ? String(book.year) : undefined,
  };
}

export function eventSchema(event: {
  id: number;
  title_ru: string;
  description_ru?: string;
  start_date: string;
  end_date?: string | null;
  location?: string | null;
  image_url?: string | null;
}) {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    "@id": `${base}/ru/events/${event.id}`,
    name: event.title_ru,
    description: event.description_ru,
    startDate: event.start_date,
    endDate: event.end_date ?? undefined,
    image: event.image_url ?? undefined,
    location: event.location
      ? {
          "@type": "Place",
          name: event.location,
          address: "г. Сатпаев, ул. Абая, 1",
        }
      : undefined,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
  };
}
