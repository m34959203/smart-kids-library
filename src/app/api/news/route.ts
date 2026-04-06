import { NextRequest, NextResponse } from "next/server";
import { getMany, getOne, query } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "10", 10);

  if (slug) {
    const news = await getOne("SELECT * FROM news WHERE slug = $1 AND status = 'published'", [slug]);
    if (!news) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ news });
  }

  const offset = (page - 1) * limit;
  const items = await getMany(
    "SELECT * FROM news WHERE status = 'published' ORDER BY published_at DESC LIMIT $1 OFFSET $2",
    [limit, offset]
  );

  const countResult = await getOne<{ count: string }>(
    "SELECT COUNT(*) as count FROM news WHERE status = 'published'"
  );
  const total = parseInt(countResult?.count ?? "0", 10);

  return NextResponse.json({ news: items, total, page, limit });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { slug, title_kk, title_ru, content_kk, content_ru, excerpt_kk, excerpt_ru, image_url, category, author_id, status } = body;

  const result = await query(
    `INSERT INTO news (slug, title_kk, title_ru, content_kk, content_ru, excerpt_kk, excerpt_ru, image_url, category, author_id, status, published_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()) RETURNING id`,
    [slug, title_kk, title_ru, content_kk, content_ru, excerpt_kk, excerpt_ru, image_url, category, author_id ?? 1, status ?? "draft"]
  );

  return NextResponse.json({ id: result.rows[0]?.id });
}
