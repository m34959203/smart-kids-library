import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-guard";
import { awardPoints } from "@/lib/gamification";
import { readJson, v, validate } from "@/lib/validate";

const schema = v.object({
  path: v.string({ min: 1, max: 2000 }),
  locale: v.optional(v.string({ max: 10 })),
  ageGroup: v.optional(v.enum(["6-9", "10-13", "14-17"] as const)),
  referrer: v.optional(v.string({ max: 2000 })),
  sessionId: v.optional(v.string({ max: 100 })),
});

interface VisitBody {
  path: string;
  locale?: string;
  ageGroup?: "6-9" | "10-13" | "14-17";
  referrer?: string;
  sessionId?: string;
}

export async function POST(request: NextRequest) {
  const parsed = validate<VisitBody>(await readJson(request), schema);
  if (!parsed.ok) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const b = parsed.data;

  const user = await getCurrentUser();
  const userId = user?.id ? Number(user.id) : null;

  try {
    await query(
      `INSERT INTO visits (path, locale, age_group, referrer, user_agent, session_id, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        b.path.slice(0, 500),
        b.locale ?? null,
        b.ageGroup ?? null,
        b.referrer ?? null,
        request.headers.get("user-agent")?.slice(0, 500) ?? null,
        b.sessionId ?? null,
        userId,
      ]
    );
  } catch {
    // visits table may not exist pre-migration; non-fatal
  }

  // Daily check-in gamification for signed-in users
  if (userId) {
    try {
      const r = await awardPoints({ userId, kind: "checkin" });
      return NextResponse.json({ ok: true, award: r });
    } catch {
      return NextResponse.json({ ok: true });
    }
  }

  return NextResponse.json({ ok: true });
}
