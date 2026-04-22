import { NextRequest, NextResponse } from "next/server";
import { sendTelegramMessage, sendTelegramPhoto, formatNewsForTelegram, formatEventForTelegram } from "@/lib/telegram";
import { publishInstagramPost, formatCaptionForInstagram } from "@/lib/instagram";
import { generateText } from "@/lib/gemini";
import { query } from "@/lib/db";
import { requireStaff } from "@/lib/auth-guard";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const guard = await requireStaff();
  if (guard instanceof NextResponse) return guard;

  const blocked = enforceRateLimit(request, { bucket: "social-post", max: 20, windowMs: 60_000 });
  if (blocked) return blocked;

  const body = await request.json();
  const { contentType, contentId, platform, title, description, imageUrl, date, location } = body;

  const results: Record<string, { success: boolean; error?: string }> = {};

  // Generate platform-optimized text
  let telegramText = "";
  let instagramCaption = "";

  if (contentType === "news") {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    telegramText = formatNewsForTelegram(title, description, `${appUrl}/ru/news/${contentId}`);
    instagramCaption = formatCaptionForInstagram(title, description);
  } else if (contentType === "event") {
    telegramText = formatEventForTelegram(title, date ?? "", location ?? "", description);
    instagramCaption = formatCaptionForInstagram(title, description, ["Событие", "Сатпаев"]);
  } else {
    // Use AI to generate post text
    try {
      const tgResult = await generateText(
        `Создай пост для Telegram канала детской библиотеки: ${title}. ${description}. Используй HTML форматирование, эмодзи. Кратко и привлекательно.`,
        { endpoint: "social", maxTokens: 300 }
      );
      telegramText = tgResult.text;

      const igResult = await generateText(
        `Создай пост для Instagram детской библиотеки: ${title}. ${description}. Добавь хештеги. Без HTML.`,
        { endpoint: "social", maxTokens: 300 }
      );
      instagramCaption = igResult.text;
    } catch {
      telegramText = `<b>${title}</b>\n\n${description}`;
      instagramCaption = `${title}\n\n${description}\n\n#SmartKidsLibrary #Satpayev`;
    }
  }

  // Post to selected platforms
  const platforms = Array.isArray(platform) ? platform : [platform];

  for (const p of platforms) {
    if (p === "telegram") {
      try {
        const success = imageUrl
          ? await sendTelegramPhoto(imageUrl, telegramText)
          : await sendTelegramMessage(telegramText);
        results.telegram = { success };
      } catch (error) {
        results.telegram = { success: false, error: String(error) };
      }
    }

    if (p === "instagram" && imageUrl) {
      try {
        const result = await publishInstagramPost(imageUrl, instagramCaption);
        results.instagram = result;
      } catch (error) {
        results.instagram = { success: false, error: String(error) };
      }
    }
  }

  // Log to social_posts
  try {
    for (const [p, r] of Object.entries(results)) {
      await query(
        `INSERT INTO social_posts (content_type, content_id, platform, post_text, image_url, status, posted_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [contentType, contentId, p, p === "telegram" ? telegramText : instagramCaption, imageUrl, r.success ? "posted" : "failed"]
      );
    }
  } catch {
    // Silent fail
  }

  return NextResponse.json({ results });
}
