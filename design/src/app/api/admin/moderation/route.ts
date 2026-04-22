import { NextRequest, NextResponse } from "next/server";
import { getMany, query } from "@/lib/db";
import { requireStaff } from "@/lib/auth-guard";
import { readJson, v, validate } from "@/lib/validate";

export async function GET(request: NextRequest) {
  const guard = await requireStaff();
  if (guard instanceof NextResponse) return guard;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? "pending";
  const kind = searchParams.get("kind");
  const where: string[] = [];
  const params: unknown[] = [];
  if (status && ["pending", "approved", "rejected"].includes(status)) {
    params.push(status);
    where.push(`status = $${params.length}`);
  }
  if (kind) {
    params.push(kind);
    where.push(`kind = $${params.length}`);
  }
  const sql = `SELECT * FROM moderation_items ${where.length ? "WHERE " + where.join(" AND ") : ""}
               ORDER BY created_at DESC LIMIT 100`;
  const items = await getMany(sql, params);
  return NextResponse.json({ items });
}

const actionSchema = v.object({
  id: v.number({ int: true, min: 1 }),
  action: v.enum(["approve", "reject"] as const),
  note: v.optional(v.string({ max: 2000 })),
});

interface ActionBody {
  id: number;
  action: "approve" | "reject";
  note?: string;
}

export async function POST(request: NextRequest) {
  const guard = await requireStaff();
  if (guard instanceof NextResponse) return guard;

  const parsed = validate<ActionBody>(await readJson(request), actionSchema);
  if (!parsed.ok) return NextResponse.json({ error: "Invalid body", issues: parsed.issues }, { status: 400 });
  const { id, action, note } = parsed.data;

  const newStatus = action === "approve" ? "approved" : "rejected";
  const reviewerId = guard.user.id ? Number(guard.user.id) : null;

  await query(
    `UPDATE moderation_items SET status = $2, review_note = $3, reviewed_by = $4, reviewed_at = NOW()
     WHERE id = $1`,
    [id, newStatus, note ?? null, reviewerId]
  );

  // Propagate to the referenced entity when applicable
  const row = (await getMany<{ kind: string; ref_id: number | null }>(
    "SELECT kind, ref_id FROM moderation_items WHERE id = $1",
    [id]
  ))[0];

  if (row && row.ref_id) {
    if (row.kind === "story") {
      await query("UPDATE stories SET status = $2 WHERE id = $1", [row.ref_id, newStatus]);
    }
    // Extend for other kinds as they acquire a mirrored status column
  }

  return NextResponse.json({ success: true, status: newStatus });
}
