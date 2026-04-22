import { query, getOne } from "./db";

/**
 * Возвращает дату ближайшего «оптимального» окна постинга для платформы.
 * Окна берём из site_settings: social_optimal_time_telegram (HH:MM, по умолчанию 12:00),
 * social_optimal_time_instagram (HH:MM, по умолчанию 19:00),
 * social_timezone_offset (например +05:00 — для Алматы).
 */
async function getOptimalSlot(platform: "telegram" | "instagram", from: Date = new Date()): Promise<Date> {
  const key = platform === "telegram" ? "social_optimal_time_telegram" : "social_optimal_time_instagram";
  const def = platform === "telegram" ? "12:00" : "19:00";
  const row = await getOne<{ value: string }>("SELECT value FROM site_settings WHERE key = $1", [key]).catch(() => null);
  const tzRow = await getOne<{ value: string }>("SELECT value FROM site_settings WHERE key = 'social_timezone_offset'").catch(() => null);
  const time = (row?.value || def).trim();
  const tz = (tzRow?.value || "+05:00").trim();
  const [hh, mm] = time.split(":").map((s) => parseInt(s, 10));
  if (Number.isNaN(hh) || Number.isNaN(mm)) return from;

  // Строим дату в указанной TZ → в локали сервера через ISO с offset
  const yyyy = from.getUTCFullYear();
  const mo = String(from.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(from.getUTCDate()).padStart(2, "0");
  let target = new Date(`${yyyy}-${mo}-${dd}T${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00${tz}`);
  // Если окно сегодня уже прошло — берём завтра
  if (target.getTime() <= from.getTime()) target = new Date(target.getTime() + 24 * 60 * 60 * 1000);
  return target;
}

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
  /** "now" (по умолчанию) | "optimal" — оптимальное окно охвата */
  timing?: "now" | "optimal";
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

  const tgWhen = opts.timing === "optimal" ? (await getOptimalSlot("telegram")).toISOString() : new Date().toISOString();
  const igWhen = opts.timing === "optimal" ? (await getOptimalSlot("instagram")).toISOString() : new Date().toISOString();

  await query(
    `INSERT INTO social_posts (content_type, content_id, platform, post_text, image_url, status, scheduled_at)
     VALUES
       ('news', $1, 'telegram', $2, $3, 'scheduled', $5),
       ('news', $1, 'instagram', $4, $3, 'scheduled', $6)`,
    [opts.newsId, tgText, opts.imageUrl ?? null, igCaption, tgWhen, igWhen]
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
