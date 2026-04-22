import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-guard";
import { enforceRateLimit } from "@/lib/rate-limit";
import { readJson, v, validate } from "@/lib/validate";

const schema = v.object({
  question: v.string({ min: 2, max: 4000 }),
  contact: v.optional(v.string({ max: 255 })),
  language: v.optional(v.enum(["ru", "kk"] as const)),
  sessionId: v.optional(v.string({ max: 100 })),
});

interface EscalateBody {
  question: string;
  contact?: string;
  language?: "ru" | "kk";
  sessionId?: string;
}

function isOpenNow(now = new Date()): boolean {
  // Пн-Пт 9-18, Сб 10-16, Вс закрыто — соответствует site_settings seed.
  const day = now.getDay();
  const hour = now.getHours();
  if (day === 0) return false;
  if (day === 6) return hour >= 10 && hour < 16;
  return hour >= 9 && hour < 18;
}

export async function POST(request: NextRequest) {
  const blocked = enforceRateLimit(request, { bucket: "chat-escalate", max: 5, windowMs: 60_000 });
  if (blocked) return blocked;

  const parsed = validate<EscalateBody>(await readJson(request), schema);
  if (!parsed.ok) return NextResponse.json({ error: "Invalid body", issues: parsed.issues }, { status: 400 });
  const { question, contact, language = "ru", sessionId } = parsed.data;

  const user = await getCurrentUser();
  const userId = user?.id ? Number(user.id) : null;
  const contactFinal = contact ?? user?.email ?? null;

  await query(
    `INSERT INTO chat_escalations (session_id, user_id, language, question, contact, status)
     VALUES ($1, $2, $3, $4, $5, 'open')`,
    [sessionId ?? null, userId, language, question, contactFinal]
  );

  const open = isOpenNow();
  return NextResponse.json({
    success: true,
    openNow: open,
    message:
      open
        ? language === "kk"
          ? "Сұрақ қабылданды! Кітапханашы жақын арада жауап береді."
          : "Вопрос принят! Библиотекарь скоро ответит."
        : language === "kk"
          ? "Сұрақ сақталды. Кітапхана қазір жабық — келесі жұмыс күні байланысамыз."
          : "Вопрос сохранён. Библиотека сейчас закрыта — ответим в ближайший рабочий день.",
  });
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "librarian")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? "open";
  const items = await query(
    `SELECT * FROM chat_escalations WHERE status = $1 ORDER BY created_at DESC LIMIT 100`,
    [status]
  );
  return NextResponse.json({ items: items.rows });
}
