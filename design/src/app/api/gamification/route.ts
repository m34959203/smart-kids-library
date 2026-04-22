import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, requireStaff } from "@/lib/auth-guard";
import { awardPoints, getLeaderboard, getUserSummary, type PointsKind } from "@/lib/gamification";
import { enforceRateLimit } from "@/lib/rate-limit";
import { readJson, v, validate } from "@/lib/validate";

const AWARD_KINDS: PointsKind[] = [
  "checkin",
  "book_finished",
  "book_progress",
  "quiz_passed",
  "story_created",
  "review_written",
  "event_attended",
  "request_made",
  "workshop_submitted",
  "admin_award",
];

const awardSchema = v.object({
  kind: v.enum(AWARD_KINDS as readonly PointsKind[]),
  refId: v.optional(v.number({ int: true, min: 1 })),
  points: v.optional(v.number({ int: true, min: 0, max: 1000 })),
  note: v.optional(v.string({ max: 500 })),
  userId: v.optional(v.number({ int: true, min: 1 })),
});

interface AwardBody {
  kind: PointsKind;
  refId?: number;
  points?: number;
  note?: string;
  userId?: number;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const view = url.searchParams.get("view") ?? "me";

  if (view === "leaderboard") {
    const limit = Math.min(50, parseInt(url.searchParams.get("limit") ?? "20", 10) || 20);
    const rows = await getLeaderboard(limit);
    return NextResponse.json({
      leaderboard: rows.map((r, i) => ({
        rank: i + 1,
        userId: r.user_id,
        name: r.name,
        ageGroup: r.age_group,
        points: parseInt(r.total, 10),
      })),
    });
  }

  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const summary = await getUserSummary(Number(user.id));
  return NextResponse.json(summary);
}

export async function POST(request: NextRequest) {
  const blocked = enforceRateLimit(request, { bucket: "gamification", max: 60, windowMs: 60_000 });
  if (blocked) return blocked;

  const parsed = validate<AwardBody>(await readJson(request), awardSchema);
  if (!parsed.ok) return NextResponse.json({ error: "Invalid body", issues: parsed.issues }, { status: 400 });
  const { kind, refId, points, note, userId: targetUserId } = parsed.data;

  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  let awardToUserId = Number(user.id);

  // Only staff may award to another user or use admin_award
  if (targetUserId && targetUserId !== awardToUserId) {
    const guard = await requireStaff();
    if (guard instanceof NextResponse) return guard;
    awardToUserId = targetUserId;
  }
  if (kind === "admin_award" || (points !== undefined && !["book_progress", "review_written"].includes(kind))) {
    const guard = await requireStaff();
    if (guard instanceof NextResponse) return guard;
  }

  const result = await awardPoints({ userId: awardToUserId, kind, refId: refId ?? null, points, note });
  return NextResponse.json(result);
}
