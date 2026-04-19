import { NextResponse } from "next/server";
import { getMany } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-guard";

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ rows: [] });

  const rows = await getMany<{ id: number; title: string; current_page: number; total_pages: number; last_read_at: Date }>(
    `SELECT b.id, b.title, rp.current_page, rp.total_pages, rp.last_read_at
     FROM reading_progress rp
     JOIN books b ON b.id = rp.book_id
     WHERE rp.user_id = $1
     ORDER BY rp.last_read_at DESC
     LIMIT 50`,
    [Number(user.id)]
  );
  return NextResponse.json({ rows });
}
