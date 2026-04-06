import { NextRequest, NextResponse } from "next/server";
import { getMany } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ageGroup = searchParams.get("ageGroup");
  const locale = searchParams.get("locale") ?? "ru";

  try {
    let sql = "SELECT * FROM books WHERE is_available = true";
    const params: unknown[] = [];

    if (ageGroup) {
      sql += " AND age_category = $1";
      params.push(ageGroup);
    }

    sql += " ORDER BY RANDOM() LIMIT 8";

    const books = await getMany(sql, params);
    return NextResponse.json({ books, locale });
  } catch {
    // Return sample books when DB not available
    const sampleBooks = [
      { id: 1, title: locale === "kk" ? "Алтын сақа" : "Золотой ключик", author: locale === "kk" ? "А. Толстой" : "А. Толстой", genre: locale === "kk" ? "Ертегі" : "Сказка", age_category: "6-9" },
      { id: 2, title: locale === "kk" ? "Кішкентай ханзада" : "Маленький принц", author: locale === "kk" ? "А. де Сент-Экзюпери" : "А. де Сент-Экзюпери", genre: locale === "kk" ? "Повесть" : "Повесть", age_category: "10-13" },
      { id: 3, title: locale === "kk" ? "Гарри Поттер" : "Гарри Поттер", author: locale === "kk" ? "Дж. Роулинг" : "Дж. Роулинг", genre: locale === "kk" ? "Фантастика" : "Фэнтези", age_category: "10-13" },
      { id: 4, title: locale === "kk" ? "Абай жолы" : "Путь Абая", author: locale === "kk" ? "М. Әуезов" : "М. Ауэзов", genre: locale === "kk" ? "Роман" : "Роман", age_category: "14-17" },
    ];
    return NextResponse.json({ books: sampleBooks });
  }
}
