import { NextRequest, NextResponse } from "next/server";
import { query, getMany } from "@/lib/db";
import { sendTelegramMessage, sendTelegramPhoto } from "@/lib/telegram";
import { publishInstagramPost } from "@/lib/instagram";

interface ScheduledRow {
  id: number;
  platform: "telegram" | "instagram";
  post_text: string;
  image_url: string | null;
}

/**
 * Worker endpoint: processes due scheduled posts. Protected by CRON_SECRET.
 * Call from cron / GitHub Actions / Vercel Cron / systemd timer every few minutes.
 *   curl -H "x-cron-secret: $CRON_SECRET" https://<host>/api/social/tick
 */
async function runTick(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const provided = request.headers.get("x-cron-secret") ?? new URL(request.url).searchParams.get("secret");
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const due = await getMany<ScheduledRow>(
    `SELECT id, platform, post_text, image_url FROM social_posts
     WHERE status = 'scheduled' AND scheduled_at <= NOW()
     ORDER BY scheduled_at ASC LIMIT 20`
  );

  const results: Array<{ id: number; platform: string; ok: boolean; error?: string }> = [];

  for (const row of due) {
    try {
      let success = false;
      if (row.platform === "telegram") {
        success = row.image_url
          ? await sendTelegramPhoto(row.image_url, row.post_text)
          : await sendTelegramMessage(row.post_text);
      } else if (row.platform === "instagram") {
        if (!row.image_url) throw new Error("Instagram requires image_url");
        const r = await publishInstagramPost(row.image_url, row.post_text);
        success = r.success;
      }
      await query(
        `UPDATE social_posts
         SET status = $2, posted_at = CASE WHEN $2 = 'posted' THEN NOW() ELSE posted_at END,
             error_message = NULL
         WHERE id = $1`,
        [row.id, success ? "posted" : "failed"]
      );
      results.push({ id: row.id, platform: row.platform, ok: success });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await query(
        `UPDATE social_posts SET status = 'failed', error_message = $2 WHERE id = $1`,
        [row.id, msg]
      );
      results.push({ id: row.id, platform: row.platform, ok: false, error: msg });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}

export async function GET(request: NextRequest) {
  return runTick(request);
}
export async function POST(request: NextRequest) {
  return runTick(request);
}
