import { NextRequest, NextResponse } from "next/server";
import { getMany, getOne, query } from "@/lib/db";
import { requireStaff } from "@/lib/auth-guard";
import { readJson, v, validate } from "@/lib/validate";

const schema = v.object({
  slug: v.string({ min: 1, max: 100 }),
  title_ru: v.string({ min: 1, max: 500 }),
  title_kk: v.optional(v.string({ max: 500 })),
  content_ru: v.string({ min: 1, max: 200_000 }),
  content_kk: v.optional(v.string({ max: 200_000 })),
  meta_description_ru: v.optional(v.string({ max: 500 })),
  meta_description_kk: v.optional(v.string({ max: 500 })),
});

interface Body {
  slug: string;
  title_ru: string;
  title_kk?: string;
  content_ru: string;
  content_kk?: string;
  meta_description_ru?: string;
  meta_description_kk?: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  if (slug) {
    const page = await getOne("SELECT * FROM cms_pages WHERE slug = $1", [slug]);
    if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ page });
  }
  const pages = await getMany("SELECT id, slug, title_ru, title_kk, updated_at FROM cms_pages ORDER BY slug");
  return NextResponse.json({ pages });
}

export async function POST(request: NextRequest) {
  const guard = await requireStaff();
  if (guard instanceof NextResponse) return guard;

  const parsed = validate<Body>(await readJson(request), schema);
  if (!parsed.ok) return NextResponse.json({ error: "Invalid body", issues: parsed.issues }, { status: 400 });
  const b = parsed.data;
  const userId = guard.user.id ? Number(guard.user.id) : null;

  const result = await query<{ id: number }>(
    `INSERT INTO cms_pages (slug, title_ru, title_kk, content_ru, content_kk, meta_description_ru, meta_description_kk, updated_by, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
     RETURNING id`,
    [b.slug, b.title_ru, b.title_kk ?? null, b.content_ru, b.content_kk ?? null, b.meta_description_ru ?? null, b.meta_description_kk ?? null, userId]
  );
  return NextResponse.json({ id: result.rows[0]?.id, slug: b.slug });
}

export async function PUT(request: NextRequest) {
  const guard = await requireStaff();
  if (guard instanceof NextResponse) return guard;

  const body = await readJson(request) as (Body & { id?: number }) | null;
  if (!body?.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const parsed = validate<Body>(body, schema);
  if (!parsed.ok) return NextResponse.json({ error: "Invalid body", issues: parsed.issues }, { status: 400 });
  const b = parsed.data;
  const userId = guard.user.id ? Number(guard.user.id) : null;

  await query(
    `UPDATE cms_pages SET slug=$2, title_ru=$3, title_kk=$4, content_ru=$5, content_kk=$6,
       meta_description_ru=$7, meta_description_kk=$8, updated_by=$9, updated_at=NOW()
     WHERE id=$1`,
    [body.id, b.slug, b.title_ru, b.title_kk ?? null, b.content_ru, b.content_kk ?? null, b.meta_description_ru ?? null, b.meta_description_kk ?? null, userId]
  );
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const guard = await requireStaff();
  if (guard instanceof NextResponse) return guard;
  const { searchParams } = new URL(request.url);
  const id = parseInt(searchParams.get("id") ?? "0", 10);
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await query("DELETE FROM cms_pages WHERE id = $1", [id]);
  return NextResponse.json({ success: true });
}
