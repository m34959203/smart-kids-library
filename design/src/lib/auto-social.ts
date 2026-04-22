import { query } from "./db";

/**
 * Queue social posts when content is published. Pending rows are picked up by
 * the /api/social/tick worker. Both Telegram and Instagram are queued; IG rows
 * without an image will fail gracefully inside the worker.
 */
export async function queueNewsAutoPost(opts: {
  newsId: number;
  title: string;
  excerpt?: string | null;
  imageUrl?: string | null;
  appUrl?: string;
}): Promise<void> {
  const appUrl = (opts.appUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/+$/, "");
  const link = appUrl ? `${appUrl}/ru/news/${opts.newsId}` : "";
  const body = opts.excerpt?.trim() ? opts.excerpt : opts.title;

  const tgText = [
    `<b>📰 ${escapeHtml(opts.title)}</b>`,
    escapeHtml(body),
    link ? `🔗 ${link}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const igCaption = [
    `📚 ${opts.title}`,
    body,
    "",
    "#SmartKidsLibrary #Satpayev #ДетскаяБиблиотека",
  ]
    .filter(Boolean)
    .join("\n\n");

  await query(
    `INSERT INTO social_posts (content_type, content_id, platform, post_text, image_url, status, scheduled_at)
     VALUES
       ('news', $1, 'telegram', $2, $3, 'scheduled', NOW()),
       ('news', $1, 'instagram', $4, $3, 'scheduled', NOW())`,
    [opts.newsId, tgText, opts.imageUrl ?? null, igCaption]
  );
}

export async function queueEventAutoPost(opts: {
  eventId: number;
  title: string;
  description?: string | null;
  startDate: string;
  location?: string | null;
  imageUrl?: string | null;
  /**
   * Hours before the event when the post should go out.
   */
  leadHours?: number;
}): Promise<void> {
  const lead = opts.leadHours ?? 72;
  const start = new Date(opts.startDate);
  const scheduledAt = new Date(start.getTime() - lead * 60 * 60 * 1000);
  // If the scheduled time is in the past, publish immediately
  const when = scheduledAt.getTime() < Date.now() ? new Date() : scheduledAt;

  const dateStr = start.toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  const tgText = [
    `<b>📅 ${escapeHtml(opts.title)}</b>`,
    `🗓 ${escapeHtml(dateStr)}`,
    opts.location ? `📍 ${escapeHtml(opts.location)}` : "",
    opts.description ? escapeHtml(opts.description) : "",
  ]
    .filter(Boolean)
    .join("\n");

  const igCaption = [
    `📅 ${opts.title}`,
    `🗓 ${dateStr}${opts.location ? ` · 📍 ${opts.location}` : ""}`,
    opts.description ?? "",
    "",
    "#SmartKidsLibrary #Satpayev #СобытияБиблиотеки",
  ]
    .filter(Boolean)
    .join("\n\n");

  await query(
    `INSERT INTO social_posts (content_type, content_id, platform, post_text, image_url, status, scheduled_at)
     VALUES
       ('event', $1, 'telegram', $2, $3, 'scheduled', $5),
       ('event', $1, 'instagram', $4, $3, 'scheduled', $5)`,
    [opts.eventId, tgText, opts.imageUrl ?? null, igCaption, when.toISOString()]
  );
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
