import { NextRequest, NextResponse } from "next/server";
import { getMany, query } from "@/lib/db";
import { requireStaff } from "@/lib/auth-guard";

export async function GET(request: NextRequest) {
  const guard = await requireStaff();
  if (guard instanceof NextResponse) return guard;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const where: string[] = [];
  const params: unknown[] = [];
  if (status) {
    params.push(status);
    where.push(`status = $${params.length}`);
  }
  const sql = `SELECT id, content_type, content_id, platform, post_text, image_url, status, scheduled_at, posted_at, error_message, created_at
               FROM social_posts ${where.length ? "WHERE " + where.join(" AND ") : ""}
               ORDER BY COALESCE(scheduled_at, created_at) DESC LIMIT 100`;
  const posts = await getMany(sql, params);
  return NextResponse.json({ posts });
}

export async function POST(request: NextRequest) {
  // Action: retry / cancel
  const guard = await requireStaff();
  if (guard instanceof NextResponse) return guard;
  const body = await request.json().catch(() => null) as { id?: number; action?: "retry" | "cancel" } | null;
  if (!body?.id || !body.action) return NextResponse.json({ error: "id and action required" }, { status: 400 });
  if (body.action === "retry") {
    await query("UPDATE social_posts SET status='scheduled', scheduled_at=NOW(), error_message=NULL WHERE id=$1", [body.id]);
  } else {
    await query("UPDATE social_posts SET status='failed', error_message='cancelled by admin' WHERE id=$1 AND status IN ('pending', 'scheduled')", [body.id]);
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const guard = await requireStaff();
  if (guard instanceof NextResponse) return guard;
  const { searchParams } = new URL(request.url);
  const id = parseInt(searchParams.get("id") ?? "0", 10);
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await query("DELETE FROM social_posts WHERE id = $1", [id]);
  return NextResponse.json({ success: true });
}
