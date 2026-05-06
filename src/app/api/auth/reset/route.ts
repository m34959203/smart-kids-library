import { NextRequest, NextResponse } from "next/server";
import { query, getOne } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";
import { readJson, v, validate } from "@/lib/validate";
import crypto from "crypto";

const schema = v.object({
  token: v.string({ min: 32, max: 96 }),
  password: v.string({ min: 8, max: 200 }),
});

interface Body { token: string; password: string; }

function hashPassword(p: string): string {
  return crypto.createHash("sha256").update(p).digest("hex");
}

export async function POST(request: NextRequest) {
  const blocked = enforceRateLimit(request, { bucket: "auth-reset", max: 10, windowMs: 60_000 });
  if (blocked) return blocked;

  const parsed = validate<Body>(await readJson(request), schema);
  if (!parsed.ok) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { token, password } = parsed.data;

  const reset = await getOne<{ id: number; user_id: number; expires_at: Date; used_at: Date | null }>(
    `SELECT id, user_id, expires_at, used_at
       FROM password_resets WHERE token = $1`,
    [token],
  );
  if (!reset) {
    return NextResponse.json({ error: "Невалидный или истёкший токен" }, { status: 400 });
  }
  if (reset.used_at) {
    return NextResponse.json({ error: "Токен уже использован" }, { status: 400 });
  }
  if (new Date(reset.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "Токен истёк, запросите новый" }, { status: 400 });
  }

  await query("UPDATE users SET password_hash = $1 WHERE id = $2", [
    hashPassword(password),
    reset.user_id,
  ]);
  await query("UPDATE password_resets SET used_at = NOW() WHERE id = $1", [reset.id]);

  return NextResponse.json({ success: true });
}
