import { NextRequest, NextResponse } from "next/server";
import { getMany, getOne, query } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "20", 10);
  const genre = searchParams.get("genre");
  const age = searchParams.get("age");
  const lang = searchParams.get("lang");
  const available = searchParams.get("available");
  const id = searchParams.get("id");

  if (id) {
    const book = await getOne("SELECT * FROM books WHERE id = $1", [id]);
    if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 });
    return NextResponse.json({ book });
  }

  let sql = "SELECT * FROM books WHERE 1=1";
  const params: unknown[] = [];
  let paramIndex = 0;

  if (genre) {
    paramIndex++;
    sql += ` AND genre = $${paramIndex}`;
    params.push(genre);
  }
  if (age) {
    paramIndex++;
    sql += ` AND age_category = $${paramIndex}`;
    params.push(age);
  }
  if (lang) {
    paramIndex++;
    sql += ` AND language = $${paramIndex}`;
    params.push(lang);
  }
  if (available === "true") {
    sql += " AND is_available = true";
  }

  const offset = (page - 1) * limit;
  paramIndex++;
  sql += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
  params.push(limit);
  paramIndex++;
  sql += ` OFFSET $${paramIndex}`;
  params.push(offset);

  const books = await getMany(sql, params);

  const countResult = await getOne<{ count: string }>("SELECT COUNT(*) as count FROM books");
  const total = parseInt(countResult?.count ?? "0", 10);

  return NextResponse.json({ books, total, page, limit });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { bookId, currentPage, totalPages } = body;

  if (!bookId) {
    return NextResponse.json({ error: "Missing bookId" }, { status: 400 });
  }

  await query(
    `INSERT INTO reading_progress (user_id, book_id, current_page, total_pages, last_read_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (user_id, book_id) DO UPDATE SET current_page = $3, total_pages = $4, last_read_at = NOW()`,
    [1, bookId, currentPage, totalPages]
  );

  return NextResponse.json({ success: true });
}
