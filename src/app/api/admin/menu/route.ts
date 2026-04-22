import { NextRequest, NextResponse } from "next/server";
import { getMany, query } from "@/lib/db";
import { requireStaff } from "@/lib/auth-guard";
import { readJson, v, validate } from "@/lib/validate";

const PROFILES = ["6-9", "10-13", "14-17", "default"] as const;

const schema = v.object({
  age_profile: v.enum(PROFILES),
  label_ru: v.string({ min: 1, max: 200 }),
  label_kk: v.optional(v.string({ max: 200 })),
  href: v.string({ min: 1, max: 500 }),
  icon: v.optional(v.string({ max: 50 })),
  sort_order: v.optional(v.number({ int: true, min: 0, max: 10000 })),
  visible: v.optional(v.boolean()),
});

interface Body {
  age_profile: typeof PROFILES[number];
  label_ru: string;
  label_kk?: string;
  href: string;
  icon?: string;
  sort_order?: number;
  visible?: boolean;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const profile = searchParams.get("profile");
  const where = profile && (PROFILES as readonly string[]).includes(profile) ? "WHERE age_profile = $1" : "";
  const params = where ? [profile] : [];
  const items = await getMany(`SELECT * FROM menu_items ${where} ORDER BY age_profile, sort_order, id`, params);
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const guard = await requireStaff();
  if (guard instanceof NextResponse) return guard;
  const parsed = validate<Body>(await readJson(request), schema);
  if (!parsed.ok) return NextResponse.json({ error: "Invalid body", issues: parsed.issues }, { status: 400 });
  const b = parsed.data;
  const result = await query<{ id: number }>(
    `INSERT INTO menu_items (age_profile, label_ru, label_kk, href, icon, sort_order, visible)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [b.age_profile, b.label_ru, b.label_kk ?? null, b.href, b.icon ?? null, b.sort_order ?? 0, b.visible ?? true]
  );
  return NextResponse.json({ id: result.rows[0]?.id });
}

export async function PUT(request: NextRequest) {
  const guard = await requireStaff();
  if (guard instanceof NextResponse) return guard;
  const body = await readJson(request) as (Body & { id?: number }) | null;
  if (!body?.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const parsed = validate<Body>(body, schema);
  if (!parsed.ok) return NextResponse.json({ error: "Invalid body", issues: parsed.issues }, { status: 400 });
  const b = parsed.data;
  await query(
    `UPDATE menu_items SET age_profile=$2, label_ru=$3, label_kk=$4, href=$5, icon=$6, sort_order=$7, visible=$8 WHERE id=$1`,
    [body.id, b.age_profile, b.label_ru, b.label_kk ?? null, b.href, b.icon ?? null, b.sort_order ?? 0, b.visible ?? true]
  );
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const guard = await requireStaff();
  if (guard instanceof NextResponse) return guard;
  const { searchParams } = new URL(request.url);
  const id = parseInt(searchParams.get("id") ?? "0", 10);
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await query("DELETE FROM menu_items WHERE id = $1", [id]);
  return NextResponse.json({ success: true });
}
