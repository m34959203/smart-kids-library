import { NextRequest, NextResponse } from "next/server";
import { getMany, query } from "@/lib/db";
import { requireStaff } from "@/lib/auth-guard";
import { readJson, v, validate } from "@/lib/validate";

const schema = v.object({
  category: v.string({ min: 1, max: 100 }),
  question: v.string({ min: 1, max: 500 }),
  answer: v.string({ min: 1, max: 4000 }),
  language: v.optional(v.enum(["ru", "kk"] as const)),
});

interface Body { category: string; question: string; answer: string; language?: "ru" | "kk" }

export async function GET(request: NextRequest) {
  const guard = await requireStaff();
  if (guard instanceof NextResponse) return guard;
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("language");
  const where: string[] = [];
  const params: unknown[] = [];
  if (lang === "ru" || lang === "kk") {
    params.push(lang);
    where.push(`language = $${params.length}`);
  }
  const sql = `SELECT * FROM chatbot_knowledge ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY category, id DESC`;
  const entries = await getMany(sql, params);
  return NextResponse.json({ entries });
}

export async function POST(request: NextRequest) {
  const guard = await requireStaff();
  if (guard instanceof NextResponse) return guard;
  const parsed = validate<Body>(await readJson(request), schema);
  if (!parsed.ok) return NextResponse.json({ error: "Invalid body", issues: parsed.issues }, { status: 400 });
  const b = parsed.data;
  const result = await query<{ id: number }>(
    `INSERT INTO chatbot_knowledge (category, question, answer, language)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [b.category, b.question, b.answer, b.language ?? "ru"]
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
    `UPDATE chatbot_knowledge SET category=$2, question=$3, answer=$4, language=$5 WHERE id=$1`,
    [body.id, b.category, b.question, b.answer, b.language ?? "ru"]
  );
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const guard = await requireStaff();
  if (guard instanceof NextResponse) return guard;
  const { searchParams } = new URL(request.url);
  const id = parseInt(searchParams.get("id") ?? "0", 10);
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await query("DELETE FROM chatbot_knowledge WHERE id = $1", [id]);
  return NextResponse.json({ success: true });
}
