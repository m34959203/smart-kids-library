import { NextRequest, NextResponse } from "next/server";
import { getMany, getOne, query } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/auth-guard";
import { readJson, v, validate } from "@/lib/validate";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || 20));
  const genre = searchParams.get("genre");
  const age = searchParams.get("age");
  const lang = searchParams.get("lang");
  const available = searchParams.get("available");
  const id = searchParams.get("id");
  const q = searchParams.get("q");

  if (id) {
    const book = await getOne("SELECT * FROM books WHERE id = $1", [id]);
    if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 });
    return NextResponse.json({ book });
  }

  const where: string[] = ["1=1"];
  const params: unknown[] = [];
  let i = 0;

  if (genre) {
    i++;
    where.push(`genre = $${i}`);
    params.push(genre);
  }
  if (age && ["6-9", "10-13", "14-17"].includes(age)) {
    i++;
    where.push(`age_category = $${i}`);
    params.push(age);
  }
  if (lang && ["ru", "kk"].includes(lang)) {
    i++;
    where.push(`language = $${i}`);
    params.push(lang);
  }
  if (available === "true") where.push("is_available = true");
  if (q) {
    i++;
    where.push(`(title ILIKE $${i} OR author ILIKE $${i} OR description ILIKE $${i})`);
    params.push(`%${q}%`);
  }

  const whereSql = where.join(" AND ");
  const offset = (page - 1) * limit;

  i++;
  const limitIdx = i;
  params.push(limit);
  i++;
  const offsetIdx = i;
  params.push(offset);

  const books = await getMany(
    `SELECT * FROM books WHERE ${whereSql}
     ORDER BY created_at DESC LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    params
  );

  // Count uses the same filters (without limit/offset)
  const countResult = await getOne<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM books WHERE ${whereSql}`,
    params.slice(0, i - 2)
  );
  const total = parseInt(countResult?.count ?? "0", 10);

  return NextResponse.json({
    books,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
}

const progressSchema = v.object({
  bookId: v.number({ int: true, min: 1 }),
  currentPage: v.number({ int: true, min: 0 }),
  totalPages: v.number({ int: true, min: 0 }),
  bookmarked: v.optional(v.boolean()),
});

export async function PUT(request: NextRequest) {
  const blocked = enforceRateLimit(request, { bucket: "catalog-progress", max: 120, windowMs: 60_000 });
  if (blocked) return blocked;

  const user = await getCurrentUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Sign in to save progress" }, { status: 401 });
  }

  const body = await readJson(request);
  const result = validate<{ bookId: number; currentPage: number; totalPages: number; bookmarked?: boolean }>(
    body,
    progressSchema
  );
  if (!result.ok) {
    return NextResponse.json({ error: "Invalid body", issues: result.issues }, { status: 400 });
  }
  const { bookId, currentPage, totalPages, bookmarked } = result.data;

  await query(
    `INSERT INTO reading_progress (user_id, book_id, current_page, total_pages, bookmarked, last_read_at)
     VALUES ($1, $2, $3, $4, COALESCE($5, false), NOW())
     ON CONFLICT (user_id, book_id)
     DO UPDATE SET current_page = EXCLUDED.current_page,
                   total_pages = EXCLUDED.total_pages,
                   bookmarked = COALESCE($5, reading_progress.bookmarked),
                   last_read_at = NOW()`,
    [Number(user.id), bookId, currentPage, totalPages, bookmarked ?? null]
  );

  return NextResponse.json({ success: true });
}
