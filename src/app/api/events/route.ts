import { NextRequest, NextResponse } from "next/server";
import { getMany, getOne, query } from "@/lib/db";
import { requireStaff } from "@/lib/auth-guard";
import { readJson, v, validate } from "@/lib/validate";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const upcoming = searchParams.get("upcoming");
  const type = searchParams.get("type");
  const age = searchParams.get("age");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (id) {
    const event = await getOne("SELECT * FROM events WHERE id = $1", [id]);
    if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ event });
  }

  const where: string[] = ["status = 'active'"];
  const params: unknown[] = [];
  let idx = 0;

  if (upcoming === "true") where.push("start_date >= NOW()");
  if (type) {
    idx++;
    where.push(`event_type = $${idx}`);
    params.push(type);
  }
  if (age && ["6-9", "10-13", "14-17", "all"].includes(age)) {
    idx++;
    where.push(`(age_group = $${idx} OR age_group = 'all')`);
    params.push(age);
  }
  if (from) {
    idx++;
    where.push(`start_date >= $${idx}`);
    params.push(from);
  }
  if (to) {
    idx++;
    where.push(`start_date <= $${idx}`);
    params.push(to);
  }

  const events = await getMany(
    `SELECT * FROM events WHERE ${where.join(" AND ")} ORDER BY start_date ASC`,
    params
  );
  return NextResponse.json({ events });
}

const schema = v.object({
  title_ru: v.string({ min: 1, max: 500 }),
  title_kk: v.optional(v.string({ max: 500 })),
  description_ru: v.optional(v.string({ max: 50_000 })),
  description_kk: v.optional(v.string({ max: 50_000 })),
  image_url: v.optional(v.string({ max: 2048 })),
  event_type: v.enum(["workshop", "author_meeting", "contest", "exhibition", "reading"] as const),
  start_date: v.string({ min: 1, max: 50 }),
  end_date: v.optional(v.string({ max: 50 })),
  location: v.optional(v.string({ max: 255 })),
  age_group: v.optional(v.enum(["6-9", "10-13", "14-17", "all"] as const)),
  max_participants: v.optional(v.number({ int: true, min: 0 })),
  status: v.optional(v.enum(["active", "cancelled", "completed"] as const)),
});

interface EventBody {
  title_ru: string;
  title_kk?: string;
  description_ru?: string;
  description_kk?: string;
  image_url?: string;
  event_type: "workshop" | "author_meeting" | "contest" | "exhibition" | "reading";
  start_date: string;
  end_date?: string;
  location?: string;
  age_group?: "6-9" | "10-13" | "14-17" | "all";
  max_participants?: number;
  status?: "active" | "cancelled" | "completed";
}

export async function POST(request: NextRequest) {
  const guard = await requireStaff();
  if (guard instanceof NextResponse) return guard;

  const parsed = validate<EventBody>(await readJson(request), schema);
  if (!parsed.ok) return NextResponse.json({ error: "Invalid body", issues: parsed.issues }, { status: 400 });
  const b = parsed.data;

  const result = await query<{ id: number }>(
    `INSERT INTO events (title_kk, title_ru, description_kk, description_ru, image_url,
                         event_type, start_date, end_date, location, age_group, max_participants, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING id`,
    [
      b.title_kk ?? null,
      b.title_ru,
      b.description_kk ?? null,
      b.description_ru ?? null,
      b.image_url ?? null,
      b.event_type,
      b.start_date,
      b.end_date ?? null,
      b.location ?? null,
      b.age_group ?? "all",
      b.max_participants ?? null,
      b.status ?? "active",
    ]
  );
  return NextResponse.json({ id: result.rows[0]?.id });
}

export async function PUT(request: NextRequest) {
  const guard = await requireStaff();
  if (guard instanceof NextResponse) return guard;

  const body = (await readJson(request)) as (EventBody & { id?: number }) | null;
  if (!body?.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const parsed = validate<EventBody>(body, schema);
  if (!parsed.ok) return NextResponse.json({ error: "Invalid body", issues: parsed.issues }, { status: 400 });
  const b = parsed.data;

  await query(
    `UPDATE events SET
       title_kk = $2, title_ru = $3, description_kk = $4, description_ru = $5,
       image_url = $6, event_type = $7, start_date = $8, end_date = $9,
       location = $10, age_group = $11, max_participants = $12, status = $13
     WHERE id = $1`,
    [
      body.id,
      b.title_kk ?? null,
      b.title_ru,
      b.description_kk ?? null,
      b.description_ru ?? null,
      b.image_url ?? null,
      b.event_type,
      b.start_date,
      b.end_date ?? null,
      b.location ?? null,
      b.age_group ?? "all",
      b.max_participants ?? null,
      b.status ?? "active",
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
  await query("DELETE FROM events WHERE id = $1", [id]);
  return NextResponse.json({ success: true });
}
