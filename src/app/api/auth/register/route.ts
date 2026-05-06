import { NextRequest, NextResponse } from "next/server";
import { query, getOne } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";
import { readJson, v, validate } from "@/lib/validate";
import crypto from "crypto";

const schema = v.object({
  email: v.string({ min: 3, max: 255 }),
  password: v.string({ min: 8, max: 200 }),
  name: v.string({ min: 1, max: 120 }),
  ageGroup: v.optional(v.enum(["6-9", "10-13", "14-17", "all"] as const)),
});

interface Body {
  email: string;
  password: string;
  name: string;
  ageGroup?: "6-9" | "10-13" | "14-17" | "all";
}

function hashPassword(p: string): string {
  return crypto.createHash("sha256").update(p).digest("hex");
}

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function POST(request: NextRequest) {
  const blocked = enforceRateLimit(request, { bucket: "auth-register", max: 5, windowMs: 60_000 });
  if (blocked) return blocked;

  const parsed = validate<Body>(await readJson(request), schema);
  if (!parsed.ok) {
    return NextResponse.json({ error: "Invalid body", issues: parsed.issues }, { status: 400 });
  }
  const { email, password, name, ageGroup } = parsed.data;

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Невалидный email" }, { status: 400 });
  }

  // Уникальность проверяет UNIQUE-индекс на users.email — это атомарно.
  const existing = await getOne<{ id: number }>(
    "SELECT id FROM users WHERE LOWER(email) = LOWER($1)",
    [email],
  );
  if (existing) {
    return NextResponse.json(
      { error: "Пользователь с таким email уже зарегистрирован" },
      { status: 409 },
    );
  }

  await query(
    `INSERT INTO users (email, password_hash, role, name, age_group)
     VALUES ($1, $2, 'reader', $3, $4)`,
    [email.toLowerCase(), hashPassword(password), name, ageGroup ?? null],
  );

  return NextResponse.json({ success: true, email: email.toLowerCase() });
}
