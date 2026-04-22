import { NextRequest, NextResponse } from "next/server";
import { getMany, getOne } from "@/lib/db";
import { requireStaff } from "@/lib/auth-guard";

interface CountRow {
  count: string;
}

export async function GET(request: NextRequest) {
  const guard = await requireStaff();
  if (guard instanceof NextResponse) return guard;

  const { searchParams } = new URL(request.url);
  const days = Math.min(180, Math.max(1, parseInt(searchParams.get("days") ?? "30", 10) || 30));

  const tokenLimit = parseInt(process.env.GEMINI_DAILY_TOKEN_LIMIT ?? "1500000", 10);

  // Daily tokens (last N days)
  const tokensByDay = await getMany<{ date: string; total: string; requests: string }>(
    `SELECT to_char(date, 'YYYY-MM-DD') AS date,
            SUM(tokens_used)::text AS total,
            COUNT(*)::text AS requests
     FROM token_usage
     WHERE date >= CURRENT_DATE - $1::integer
     GROUP BY date ORDER BY date`,
    [days]
  );

  // Today's usage
  const todayRow = await getOne<{ total: string; requests: string }>(
    `SELECT COALESCE(SUM(tokens_used),0)::text AS total, COUNT(*)::text AS requests
     FROM token_usage WHERE date = CURRENT_DATE`
  );
  const tokensToday = parseInt(todayRow?.total ?? "0", 10);

  // By endpoint (last 7 days)
  const tokensByEndpoint = await getMany<{ endpoint: string; total: string; requests: string }>(
    `SELECT endpoint,
            SUM(tokens_used)::text AS total,
            COUNT(*)::text AS requests
     FROM token_usage
     WHERE date >= CURRENT_DATE - 7
     GROUP BY endpoint ORDER BY SUM(tokens_used) DESC`
  );

  // Chatbot analytics
  const chatTotalRow = await getOne<CountRow>(
    `SELECT COUNT(*)::text AS count FROM chatbot_logs WHERE created_at >= NOW() - INTERVAL '${days} days'`
  );
  const chatByLang = await getMany<{ language: string; count: string }>(
    `SELECT language, COUNT(*)::text AS count FROM chatbot_logs
     WHERE created_at >= NOW() - INTERVAL '${days} days'
     GROUP BY language`
  );
  const chatEmpty = await getOne<CountRow>(
    `SELECT COUNT(*)::text AS count FROM chatbot_logs
     WHERE created_at >= NOW() - INTERVAL '${days} days' AND (bot_response IS NULL OR LENGTH(bot_response) < 3)`
  );

  // Visits
  const visitsTotal = await getOne<CountRow>(
    `SELECT COUNT(*)::text AS count FROM visits WHERE date >= CURRENT_DATE - ${days}`
  ).catch(() => null);
  const topPaths = await getMany<{ path: string; count: string }>(
    `SELECT path, COUNT(*)::text AS count FROM visits
     WHERE date >= CURRENT_DATE - ${days}
     GROUP BY path ORDER BY COUNT(*) DESC LIMIT 10`
  ).catch(() => []);

  // Catalog / stories / events overview
  const books = await getOne<CountRow>("SELECT COUNT(*)::text AS count FROM books");
  const stories = await getOne<CountRow>("SELECT COUNT(*)::text AS count FROM stories");
  const events = await getOne<CountRow>("SELECT COUNT(*)::text AS count FROM events WHERE start_date >= NOW()");

  // Moderation queue depth
  const modPending = await getOne<CountRow>(
    "SELECT COUNT(*)::text AS count FROM moderation_items WHERE status = 'pending'"
  ).catch(() => null);

  // Token forecast: 7-day rolling average → days-until-exhaustion at current rate
  const avgRow = await getOne<{ avg: string }>(
    `SELECT COALESCE(AVG(total),0)::text AS avg FROM (
       SELECT SUM(tokens_used) AS total FROM token_usage
       WHERE date >= CURRENT_DATE - 7 GROUP BY date
     ) t`
  );
  const avgDaily = parseFloat(avgRow?.avg ?? "0");

  const usage = {
    limitDaily: tokenLimit,
    usedToday: tokensToday,
    remainingToday: Math.max(0, tokenLimit - tokensToday),
    percentToday: tokenLimit > 0 ? Math.round((tokensToday / tokenLimit) * 1000) / 10 : 0,
    avgDaily7d: Math.round(avgDaily),
    alert: tokensToday >= tokenLimit * 0.95
      ? "critical"
      : tokensToday >= tokenLimit * 0.8
      ? "warning"
      : "ok",
  };

  return NextResponse.json({
    usage,
    series: {
      tokensByDay: tokensByDay.map((r) => ({
        date: r.date,
        tokens: parseInt(r.total, 10),
        requests: parseInt(r.requests, 10),
      })),
      tokensByEndpoint: tokensByEndpoint.map((r) => ({
        endpoint: r.endpoint,
        tokens: parseInt(r.total, 10),
        requests: parseInt(r.requests, 10),
      })),
    },
    chat: {
      total: parseInt(chatTotalRow?.count ?? "0", 10),
      byLanguage: chatByLang.map((r) => ({ language: r.language, count: parseInt(r.count, 10) })),
      empty: parseInt(chatEmpty?.count ?? "0", 10),
    },
    visits: {
      total: visitsTotal ? parseInt(visitsTotal.count, 10) : 0,
      topPaths: topPaths.map((r) => ({ path: r.path, count: parseInt(r.count, 10) })),
    },
    overview: {
      books: parseInt(books?.count ?? "0", 10),
      stories: parseInt(stories?.count ?? "0", 10),
      upcomingEvents: parseInt(events?.count ?? "0", 10),
      moderationPending: modPending ? parseInt(modPending.count, 10) : 0,
    },
  });
}
