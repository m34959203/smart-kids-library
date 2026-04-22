import { NextRequest, NextResponse } from "next/server";
import { getMany, query } from "@/lib/db";
import { requireStaff } from "@/lib/auth-guard";
import { readJson } from "@/lib/validate";

// Whitelist: только эти ключи можно править через UI
const ALLOWED_KEYS = new Set([
  "ai_tone",
  "ai_max_length",
  "ai_blocked_topics",
  "ai_system_prompt_general_ru",
  "ai_system_prompt_general_kk",
  "social_telegram_token",
  "social_telegram_channel",
  "social_instagram_token",
  "social_instagram_account",
  "social_optimal_time_telegram",
  "social_optimal_time_instagram",
  "social_timezone_offset",
  "library_name",
  "library_phone",
  "library_email",
  "library_address_ru",
  "library_address_kk",
  "working_hours_weekdays",
  "working_hours_saturday",
  "working_hours_sunday",
]);

const SECRET_KEYS = new Set(["social_telegram_token", "social_instagram_token"]);

export async function GET(request: NextRequest) {
  const guard = await requireStaff();
  if (guard instanceof NextResponse) return guard;
  const { searchParams } = new URL(request.url);
  const group = searchParams.get("group"); // ai | social | library | hours
  const rows = await getMany<{ key: string; value: string }>(`SELECT key, value FROM site_settings`);
  const out: Record<string, string> = {};
  for (const r of rows) {
    if (!ALLOWED_KEYS.has(r.key)) continue;
    if (group === "ai" && !r.key.startsWith("ai_")) continue;
    if (group === "social" && !r.key.startsWith("social_")) continue;
    if (group === "library" && !r.key.startsWith("library_")) continue;
    if (group === "hours" && !r.key.startsWith("working_hours_")) continue;
    out[r.key] = SECRET_KEYS.has(r.key) ? (r.value ? "•••" : "") : r.value;
  }
  return NextResponse.json({ settings: out });
}

export async function PUT(request: NextRequest) {
  const guard = await requireStaff();
  if (guard instanceof NextResponse) return guard;
  const body = await readJson(request) as Record<string, string> | null;
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const updates: Array<{ key: string; value: string }> = [];
  for (const [key, value] of Object.entries(body)) {
    if (!ALLOWED_KEYS.has(key)) continue;
    if (typeof value !== "string") continue;
    // Не перетираем секрет, если прислали маску "•••"
    if (SECRET_KEYS.has(key) && value === "•••") continue;
    if (value.length > 5000) continue;
    updates.push({ key, value });
  }
  for (const u of updates) {
    await query(
      `INSERT INTO site_settings (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [u.key, u.value]
    );
  }
  return NextResponse.json({ updated: updates.length });
}
