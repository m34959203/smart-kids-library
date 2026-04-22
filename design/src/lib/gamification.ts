import { getMany, getOne, query } from "./db";

export type PointsKind =
  | "checkin"
  | "book_finished"
  | "book_progress"
  | "quiz_passed"
  | "story_created"
  | "review_written"
  | "event_attended"
  | "request_made"
  | "workshop_submitted"
  | "admin_award";

export const DEFAULT_POINTS: Record<PointsKind, number> = {
  checkin: 5,
  book_finished: 30,
  book_progress: 2,
  quiz_passed: 15,
  story_created: 12,
  review_written: 8,
  event_attended: 20,
  request_made: 3,
  workshop_submitted: 10,
  admin_award: 0,
};

export interface AwardOptions {
  userId: number;
  kind: PointsKind;
  refId?: number | null;
  points?: number;
  note?: string;
}

export interface AwardResult {
  awarded: number;
  total: number;
  newAchievements: string[];
  streak: { current: number; longest: number };
}

/** Records a points event (idempotent for daily kinds like checkin). */
export async function awardPoints(opts: AwardOptions): Promise<AwardResult> {
  const points = opts.points ?? DEFAULT_POINTS[opts.kind];
  let actuallyAwarded = points;

  // Daily-unique kinds: ignore if already recorded today.
  const dailyUnique: PointsKind[] = ["checkin"];
  if (dailyUnique.includes(opts.kind)) {
    const existing = await getOne<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM points_events
       WHERE user_id = $1 AND kind = $2 AND created_at::date = CURRENT_DATE`,
      [opts.userId, opts.kind]
    );
    if (existing && parseInt(existing.count, 10) > 0) {
      actuallyAwarded = 0;
    }
  }

  if (actuallyAwarded > 0) {
    await query(
      `INSERT INTO points_events (user_id, kind, ref_id, points, note)
       VALUES ($1, $2, $3, $4, $5)`,
      [opts.userId, opts.kind, opts.refId ?? null, actuallyAwarded, opts.note ?? null]
    );
  }

  let streak = { current: 0, longest: 0 };
  if (opts.kind === "checkin") {
    streak = await bumpStreak(opts.userId);
  }

  const newAchievements = await evaluateAchievements(opts.userId);
  const totalRow = await getOne<{ total: string }>(
    "SELECT COALESCE(SUM(points),0)::text AS total FROM points_events WHERE user_id = $1",
    [opts.userId]
  );

  return {
    awarded: actuallyAwarded,
    total: parseInt(totalRow?.total ?? "0", 10),
    newAchievements,
    streak,
  };
}

async function bumpStreak(userId: number): Promise<{ current: number; longest: number }> {
  const row = await getOne<{ current_streak: number; longest_streak: number; last_checkin: string | null }>(
    "SELECT current_streak, longest_streak, to_char(last_checkin, 'YYYY-MM-DD') AS last_checkin FROM user_streaks WHERE user_id = $1",
    [userId]
  );
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

  if (!row) {
    await query(
      `INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_checkin, updated_at)
       VALUES ($1, 1, 1, CURRENT_DATE, NOW())`,
      [userId]
    );
    return { current: 1, longest: 1 };
  }

  if (row.last_checkin === today) return { current: row.current_streak, longest: row.longest_streak };

  const current = row.last_checkin === yesterday ? row.current_streak + 1 : 1;
  const longest = Math.max(row.longest_streak, current);
  await query(
    `UPDATE user_streaks SET current_streak=$2, longest_streak=$3, last_checkin=CURRENT_DATE, updated_at=NOW()
     WHERE user_id=$1`,
    [userId, current, longest]
  );
  return { current, longest };
}

interface AchievementRow {
  code: string;
}

async function evaluateAchievements(userId: number): Promise<string[]> {
  const already = await getMany<AchievementRow>(
    "SELECT achievement_code AS code FROM user_achievements WHERE user_id = $1",
    [userId]
  );
  const has = new Set(already.map((r) => r.code));
  const newlyUnlocked: string[] = [];

  const counts = await getOne<{
    checkins: string;
    finished: string;
    quizzes: string;
    stories: string;
    events: string;
    requests: string;
  }>(
    `SELECT
        COUNT(*) FILTER (WHERE kind = 'checkin')::text AS checkins,
        COUNT(*) FILTER (WHERE kind = 'book_finished')::text AS finished,
        COUNT(*) FILTER (WHERE kind = 'quiz_passed')::text AS quizzes,
        COUNT(*) FILTER (WHERE kind = 'story_created')::text AS stories,
        COUNT(*) FILTER (WHERE kind = 'event_attended')::text AS events,
        COUNT(*) FILTER (WHERE kind = 'request_made')::text AS requests
     FROM points_events WHERE user_id = $1`,
    [userId]
  );

  const streak = await getOne<{ current_streak: number }>(
    "SELECT current_streak FROM user_streaks WHERE user_id = $1",
    [userId]
  );

  const c = counts ?? { checkins: "0", finished: "0", quizzes: "0", stories: "0", events: "0", requests: "0" };
  const rules: Array<[string, boolean]> = [
    ["first_checkin", parseInt(c.checkins, 10) >= 1],
    ["week_streak", (streak?.current_streak ?? 0) >= 7],
    ["month_streak", (streak?.current_streak ?? 0) >= 30],
    ["first_book", parseInt(c.finished, 10) >= 1],
    ["bookworm_10", parseInt(c.finished, 10) >= 10],
    ["library_legend", parseInt(c.finished, 10) >= 50],
    ["first_quiz", parseInt(c.quizzes, 10) >= 1],
    ["quiz_master", parseInt(c.quizzes, 10) >= 10],
    ["storyteller", parseInt(c.stories, 10) >= 5],
    ["event_goer", parseInt(c.events, 10) >= 3],
    ["curious", parseInt(c.requests, 10) >= 10],
  ];
  for (const [code, unlocked] of rules) {
    if (unlocked && !has.has(code)) {
      await query(
        `INSERT INTO user_achievements (user_id, achievement_code) VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [userId, code]
      );
      newlyUnlocked.push(code);
    }
  }
  return newlyUnlocked;
}

export async function getUserSummary(userId: number) {
  const totalRow = await getOne<{ total: string }>(
    "SELECT COALESCE(SUM(points),0)::text AS total FROM points_events WHERE user_id = $1",
    [userId]
  );
  const streak = await getOne<{ current_streak: number; longest_streak: number }>(
    "SELECT current_streak, longest_streak FROM user_streaks WHERE user_id = $1",
    [userId]
  );
  const recent = await getMany<{ kind: string; points: number; created_at: Date; note: string | null }>(
    "SELECT kind, points, created_at, note FROM points_events WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20",
    [userId]
  );
  const unlocked = await getMany<{
    code: string;
    title_ru: string;
    title_kk: string;
    icon: string;
    tier: string;
    unlocked_at: Date;
  }>(
    `SELECT a.code, a.title_ru, a.title_kk, a.icon, a.tier, ua.unlocked_at
     FROM user_achievements ua
     JOIN achievements a ON a.code = ua.achievement_code
     WHERE ua.user_id = $1
     ORDER BY ua.unlocked_at DESC`,
    [userId]
  );
  return {
    total: parseInt(totalRow?.total ?? "0", 10),
    streak: {
      current: streak?.current_streak ?? 0,
      longest: streak?.longest_streak ?? 0,
    },
    recent,
    unlocked,
  };
}

export async function getLeaderboard(limit = 20) {
  return getMany<{ user_id: number; name: string; age_group: string | null; total: string }>(
    `SELECT pe.user_id, u.name, u.age_group,
            COALESCE(SUM(pe.points), 0)::text AS total
     FROM points_events pe
     JOIN users u ON u.id = pe.user_id
     GROUP BY pe.user_id, u.name, u.age_group
     ORDER BY COALESCE(SUM(pe.points),0) DESC
     LIMIT $1`,
    [limit]
  );
}
