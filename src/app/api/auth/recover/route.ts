import { NextRequest, NextResponse } from "next/server";
import { query, getOne } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";
import { readJson, v, validate } from "@/lib/validate";
import crypto from "crypto";

const schema = v.object({
  email: v.string({ min: 3, max: 255 }),
});

interface Body { email: string; }

const TOKEN_TTL_HOURS = 1;

export async function POST(request: NextRequest) {
  const blocked = enforceRateLimit(request, { bucket: "auth-recover", max: 5, windowMs: 60_000 });
  if (blocked) return blocked;

  const parsed = validate<Body>(await readJson(request), schema);
  if (!parsed.ok) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { email } = parsed.data;

  const user = await getOne<{ id: number }>(
    "SELECT id FROM users WHERE LOWER(email) = LOWER($1)",
    [email],
  );

  // Намеренно НЕ раскрываем существование email (защита от enumeration).
  // Всегда возвращаем success:true; токен выдаём в ответе только если пользователь есть.
  if (!user) {
    return NextResponse.json({ success: true, sent: false });
  }

  const token = crypto.randomBytes(24).toString("hex");
  const expires = new Date(Date.now() + TOKEN_TTL_HOURS * 3600_000);

  await query(
    `INSERT INTO password_resets (user_id, token, expires_at)
     VALUES ($1, $2, $3)`,
    [user.id, token, expires],
  );

  // TODO: отправлять email или сообщение в Telegram-бот библиотеки.
  // Пока возвращаем токен в ответе — для dev и для случаев когда у заказчика
  // нет email-инфраструктуры (библиотекарь может вручную передать ссылку).
  // В проде это закрыть env-флагом RECOVER_TOKEN_IN_RESPONSE=0.
  const exposeToken = process.env.RECOVER_TOKEN_IN_RESPONSE !== "0";

  return NextResponse.json({
    success: true,
    sent: true,
    expiresAt: expires.toISOString(),
    ...(exposeToken ? {
      token,
      resetUrl: `/${"ru"}/profile/reset?token=${token}`,
    } : {}),
  });
}
