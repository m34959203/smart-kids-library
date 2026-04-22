import { NextRequest, NextResponse } from "next/server";
import { query, getMany } from "@/lib/db";
import { requireStaff } from "@/lib/auth-guard";
import { readJson, v, validate } from "@/lib/validate";

const schema = v.object({
  contentType: v.enum(["news", "event", "custom"] as const),
  contentId: v.optional(v.number({ int: true, min: 1 })),
  platform: v.enum(["telegram", "instagram"] as const),
  postText: v.string({ min: 1, max: 4000 }),
  imageUrl: v.optional(v.string({ max: 2048 })),
  scheduledAt: v.string({ min: 1, max: 50 }),
});

interface ScheduleBody {
  contentType: "news" | "event" | "custom";
  contentId?: number;
  platform: "telegram" | "instagram";
  postText: string;
  imageUrl?: string;
  scheduledAt: string;
}

export async function GET(request: NextRequest) {
  const guard = await requireStaff();
  if (guard instanceof NextResponse) return guard;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const where = status ? "WHERE status = $1" : "";
  const params = status ? [status] : [];
  const items = await getMany(
    `SELECT * FROM social_posts ${where} ORDER BY COALESCE(scheduled_at, created_at) DESC LIMIT 100`,
    params
  );
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const guard = await requireStaff();
  if (guard instanceof NextResponse) return guard;
  const parsed = validate<ScheduleBody>(await readJson(request), schema);
  if (!parsed.ok) return NextResponse.json({ error: "Invalid body", issues: parsed.issues }, { status: 400 });
  const b = parsed.data;
  const createdBy = guard.user.id ? Number(guard.user.id) : null;

  const result = await query<{ id: number }>(
    `INSERT INTO social_posts (content_type, content_id, platform, post_text, image_url, status, scheduled_at, created_by)
     VALUES ($1, $2, $3, $4, $5, 'scheduled', $6, $7)
     RETURNING id`,
    [b.contentType, b.contentId ?? null, b.platform, b.postText, b.imageUrl ?? null, b.scheduledAt, createdBy]
  );
  return NextResponse.json({ id: result.rows[0]?.id });
}

export async function DELETE(request: NextRequest) {
  const guard = await requireStaff();
  if (guard instanceof NextResponse) return guard;
  const { searchParams } = new URL(request.url);
  const id = parseInt(searchParams.get("id") ?? "0", 10);
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await query("DELETE FROM social_posts WHERE id = $1 AND status IN ('pending','scheduled')", [id]);
  return NextResponse.json({ success: true });
}
