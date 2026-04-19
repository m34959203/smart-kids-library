import { NextRequest, NextResponse } from "next/server";
import { getMany, getOne, query } from "@/lib/db";
import { requireStaff, getCurrentUser } from "@/lib/auth-guard";
import { readJson, v, validate } from "@/lib/validate";
import { slugify } from "@/lib/utils";
import { queueNewsAutoPost } from "@/lib/auto-social";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const id = searchParams.get("id");
  const includeDrafts = searchParams.get("drafts") === "true";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10) || 10));

  let statusFilter = "status = 'published'";
  if (includeDrafts) {
    const user = await getCurrentUser();
    if (user?.role === "admin" || user?.role === "librarian") {
      statusFilter = "1=1";
    }
  }

  if (slug) {
    const news = await getOne(`SELECT * FROM news WHERE slug = $1 AND ${statusFilter}`, [slug]);
    if (!news) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ news });
  }
  if (id) {
    const news = await getOne(`SELECT * FROM news WHERE id = $1 AND ${statusFilter}`, [id]);
    if (!news) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ news });
  }

  const offset = (page - 1) * limit;
  const items = await getMany(
    `SELECT * FROM news WHERE ${statusFilter} ORDER BY COALESCE(published_at, created_at) DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  const countRow = await getOne<{ count: string }>(`SELECT COUNT(*)::text AS count FROM news WHERE ${statusFilter}`);
  const total = parseInt(countRow?.count ?? "0", 10);
  return NextResponse.json({ news: items, total, page, limit });
}

const upsertSchema = v.object({
  slug: v.optional(v.string({ max: 255 })),
  title_ru: v.string({ min: 1, max: 500 }),
  title_kk: v.optional(v.string({ max: 500 })),
  content_ru: v.optional(v.string({ max: 200_000 })),
  content_kk: v.optional(v.string({ max: 200_000 })),
  excerpt_ru: v.optional(v.string({ max: 1000 })),
  excerpt_kk: v.optional(v.string({ max: 1000 })),
  image_url: v.optional(v.string({ max: 2048 })),
  category: v.optional(v.string({ max: 100 })),
  status: v.optional(v.enum(["draft", "published", "archived"] as const)),
});

interface NewsBody {
  slug?: string;
  title_ru: string;
  title_kk?: string;
  content_ru?: string;
  content_kk?: string;
  excerpt_ru?: string;
  excerpt_kk?: string;
  image_url?: string;
  category?: string;
  status?: "draft" | "published" | "archived";
}

export async function POST(request: NextRequest) {
  const guard = await requireStaff();
  if (guard instanceof NextResponse) return guard;

  const parsed = validate<NewsBody>(await readJson(request), upsertSchema);
  if (!parsed.ok) {
    return NextResponse.json({ error: "Invalid body", issues: parsed.issues }, { status: 400 });
  }
  const b = parsed.data;
  const slug = b.slug ? slugify(b.slug) : slugify(`${b.title_ru}-${Date.now().toString(36)}`);
  const userId = guard.user.id ? Number(guard.user.id) : null;

  const result = await query<{ id: number }>(
    `INSERT INTO news (slug, title_kk, title_ru, content_kk, content_ru, excerpt_kk, excerpt_ru,
                       image_url, category, author_id, status, published_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CASE WHEN $11 = 'published' THEN NOW() ELSE NULL END)
     RETURNING id`,
    [
      slug,
      b.title_kk ?? null,
      b.title_ru,
      b.content_kk ?? null,
      b.content_ru ?? null,
      b.excerpt_kk ?? null,
      b.excerpt_ru ?? null,
      b.image_url ?? null,
      b.category ?? null,
      userId,
      b.status ?? "draft",
    ]
  );

  const newsId = result.rows[0]?.id;
  if (newsId && b.status === "published") {
    try {
      await queueNewsAutoPost({
        newsId,
        title: b.title_ru,
        excerpt: b.excerpt_ru ?? null,
        imageUrl: b.image_url ?? null,
      });
    } catch (e) {
      console.error("Auto-post queue failed:", e);
    }
  }

  return NextResponse.json({ id: newsId, slug });
}

export async function PUT(request: NextRequest) {
  const guard = await requireStaff();
  if (guard instanceof NextResponse) return guard;

  const body = await readJson(request) as (NewsBody & { id?: number }) | null;
  if (!body?.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const parsed = validate<NewsBody>(body, upsertSchema);
  if (!parsed.ok) return NextResponse.json({ error: "Invalid body", issues: parsed.issues }, { status: 400 });
  const b = parsed.data;
  const slug = b.slug ? slugify(b.slug) : undefined;

  // Track published transition to auto-queue SMM only once per publication
  const before = await getOne<{ status: string; published_at: string | null }>(
    "SELECT status, published_at FROM news WHERE id = $1",
    [body.id]
  );

  await query(
    `UPDATE news SET
      slug = COALESCE($2, slug),
      title_kk = $3, title_ru = $4,
      content_kk = $5, content_ru = $6,
      excerpt_kk = $7, excerpt_ru = $8,
      image_url = $9, category = $10,
      status = COALESCE($11, status),
      published_at = CASE WHEN $11 = 'published' AND published_at IS NULL THEN NOW() ELSE published_at END
     WHERE id = $1`,
    [
      body.id,
      slug ?? null,
      b.title_kk ?? null,
      b.title_ru,
      b.content_kk ?? null,
      b.content_ru ?? null,
      b.excerpt_kk ?? null,
      b.excerpt_ru ?? null,
      b.image_url ?? null,
      b.category ?? null,
      b.status ?? null,
    ]
  );

  const transitionedToPublished =
    b.status === "published" && before && before.status !== "published";
  if (transitionedToPublished) {
    try {
      await queueNewsAutoPost({
        newsId: body.id,
        title: b.title_ru,
        excerpt: b.excerpt_ru ?? null,
        imageUrl: b.image_url ?? null,
      });
    } catch (e) {
      console.error("Auto-post queue failed:", e);
    }
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const guard = await requireStaff();
  if (guard instanceof NextResponse) return guard;
  const { searchParams } = new URL(request.url);
  const id = parseInt(searchParams.get("id") ?? "0", 10);
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await query("DELETE FROM news WHERE id = $1", [id]);
  return NextResponse.json({ success: true });
}
