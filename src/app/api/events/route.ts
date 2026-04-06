import { NextRequest, NextResponse } from "next/server";
import { getMany, getOne, query } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const upcoming = searchParams.get("upcoming");
  const type = searchParams.get("type");
  const age = searchParams.get("age");

  if (id) {
    const event = await getOne("SELECT * FROM events WHERE id = $1", [id]);
    if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ event });
  }

  let sql = "SELECT * FROM events WHERE status = 'active'";
  const params: unknown[] = [];
  let idx = 0;

  if (upcoming === "true") {
    sql += " AND start_date >= NOW()";
  }
  if (type) {
    idx++;
    sql += ` AND event_type = $${idx}`;
    params.push(type);
  }
  if (age) {
    idx++;
    sql += ` AND (age_group = $${idx} OR age_group = 'all')`;
    params.push(age);
  }

  sql += " ORDER BY start_date ASC";

  const events = await getMany(sql, params);
  return NextResponse.json({ events });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title_kk, title_ru, description_kk, description_ru, image_url, event_type, start_date, end_date, location, age_group, max_participants, status } = body;

  const result = await query(
    `INSERT INTO events (title_kk, title_ru, description_kk, description_ru, image_url, event_type, start_date, end_date, location, age_group, max_participants, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
    [title_kk, title_ru, description_kk, description_ru, image_url, event_type, start_date, end_date, location, age_group, max_participants, status ?? "active"]
  );

  return NextResponse.json({ id: result.rows[0]?.id });
}
