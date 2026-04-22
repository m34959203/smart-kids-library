import { NextRequest, NextResponse } from "next/server";
import { getOne } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-guard";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bookId = parseInt(searchParams.get("bookId") ?? "0", 10);
  if (!bookId) {
    return NextResponse.json({ error: "bookId required" }, { status: 400 });
  }
  const user = await getCurrentUser();
  if (!user?.id) {
    return NextResponse.json({ currentPage: 0, totalPages: 0, bookmarked: false }, { status: 200 });
  }
  const row = await getOne<{ current_page: number; total_pages: number; bookmarked: boolean | null }>(
    `SELECT current_page, total_pages,
            COALESCE(bookmarked, false) AS bookmarked
     FROM reading_progress
     WHERE user_id = $1 AND book_id = $2`,
    [Number(user.id), bookId]
  );
  if (!row) {
    return NextResponse.json({ currentPage: 0, totalPages: 0, bookmarked: false });
  }
  return NextResponse.json({
    currentPage: row.current_page,
    totalPages: row.total_pages,
    bookmarked: Boolean(row.bookmarked),
  });
}
