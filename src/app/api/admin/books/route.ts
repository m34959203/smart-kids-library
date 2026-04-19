import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireStaff } from "@/lib/auth-guard";
import { readJson, v, validate } from "@/lib/validate";

const schema = v.object({
  title: v.string({ min: 1, max: 500 }),
  author: v.string({ min: 1, max: 500 }),
  genre: v.optional(v.string({ max: 100 })),
  description: v.optional(v.string({ max: 10_000 })),
  cover_url: v.optional(v.string({ max: 2048 })),
  age_category: v.optional(v.enum(["6-9", "10-13", "14-17"] as const)),
  isbn: v.optional(v.string({ max: 20 })),
  year: v.optional(v.number({ int: true, min: 1500, max: 2100 })),
  language: v.optional(v.enum(["ru", "kk"] as const)),
  is_available: v.optional(v.boolean()),
  file_url: v.optional(v.string({ max: 2048 })),
  page_count: v.optional(v.number({ int: true, min: 0 })),
});

interface BookBody {
  title: string;
  author: string;
  genre?: string;
  description?: string;
  cover_url?: string;
  age_category?: "6-9" | "10-13" | "14-17";
  isbn?: string;
  year?: number;
  language?: "ru" | "kk";
  is_available?: boolean;
  file_url?: string;
  page_count?: number;
}

export async function POST(request: NextRequest) {
  const guard = await requireStaff();
  if (guard instanceof NextResponse) return guard;
  const parsed = validate<BookBody>(await readJson(request), schema);
  if (!parsed.ok) return NextResponse.json({ error: "Invalid body", issues: parsed.issues }, { status: 400 });
  const b = parsed.data;
  const r = await query<{ id: number }>(
    `INSERT INTO books (title, author, genre, description, cover_url, age_category, isbn,
                        year, language, is_available, file_url, page_count)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
    [
      b.title, b.author, b.genre ?? null, b.description ?? null, b.cover_url ?? null,
      b.age_category ?? null, b.isbn ?? null, b.year ?? null, b.language ?? "ru",
      b.is_available ?? true, b.file_url ?? null, b.page_count ?? 0,
    ]
  );
  return NextResponse.json({ id: r.rows[0]?.id });
}

export async function PUT(request: NextRequest) {
  const guard = await requireStaff();
  if (guard instanceof NextResponse) return guard;
  const body = (await readJson(request)) as (BookBody & { id?: number }) | null;
  if (!body?.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const parsed = validate<BookBody>(body, schema);
  if (!parsed.ok) return NextResponse.json({ error: "Invalid body", issues: parsed.issues }, { status: 400 });
  const b = parsed.data;
  await query(
    `UPDATE books SET title=$2, author=$3, genre=$4, description=$5, cover_url=$6, age_category=$7,
                      isbn=$8, year=$9, language=$10, is_available=$11, file_url=$12, page_count=$13
     WHERE id=$1`,
    [
      body.id, b.title, b.author, b.genre ?? null, b.description ?? null, b.cover_url ?? null,
      b.age_category ?? null, b.isbn ?? null, b.year ?? null, b.language ?? "ru",
      b.is_available ?? true, b.file_url ?? null, b.page_count ?? 0,
    ]
  );
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const guard = await requireStaff();
  if (guard instanceof NextResponse) return guard;
  const { searchParams } = new URL(request.url);
  const id = parseInt(searchParams.get("id") ?? "0", 10);
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await query("DELETE FROM books WHERE id = $1", [id]);
  return NextResponse.json({ success: true });
}
