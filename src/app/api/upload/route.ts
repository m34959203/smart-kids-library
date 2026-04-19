import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { v4 as uuid } from "uuid";
import { requireStaff } from "@/lib/auth-guard";
import { enforceRateLimit } from "@/lib/rate-limit";
import { query } from "@/lib/db";

const MAX_SIZE = 8 * 1024 * 1024; // 8 MB

const ALLOWED: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/svg+xml": ".svg",
  "image/gif": ".gif",
};

const ALLOWED_KINDS = new Set(["cover", "news", "event", "poster", "avatar", "misc"]);

export async function POST(request: NextRequest) {
  const authGuard = await requireStaff();
  if (authGuard instanceof NextResponse) return authGuard;

  const blocked = enforceRateLimit(request, { bucket: "upload", max: 30, windowMs: 60_000 });
  if (blocked) return blocked;

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const kindRaw = String(formData.get("kind") ?? "misc");
    const kind = ALLOWED_KINDS.has(kindRaw) ? kindRaw : "misc";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: `Max file size is ${MAX_SIZE / 1024 / 1024} MB` }, { status: 413 });
    }
    const ext = ALLOWED[file.type];
    if (!ext) {
      return NextResponse.json({ error: `Unsupported type: ${file.type}` }, { status: 415 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Reject SVG with scripts
    if (file.type === "image/svg+xml") {
      const txt = buffer.toString("utf8").toLowerCase();
      if (txt.includes("<script") || txt.includes("onload=") || txt.includes("onerror=")) {
        return NextResponse.json({ error: "SVG contains scripts" }, { status: 415 });
      }
    }

    const hash = crypto.createHash("sha1").update(buffer).digest("hex").slice(0, 10);
    const filename = `${uuid()}-${hash}${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", kind);
    await mkdir(uploadDir, { recursive: true });
    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);

    const url = `/uploads/${kind}/${filename}`;

    const userId = (authGuard.user.id && Number(authGuard.user.id)) || null;
    try {
      await query(
        `INSERT INTO media_assets (url, filename, mime, size_bytes, kind, uploaded_by)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [url, file.name, file.type, buffer.length, kind, userId]
      );
    } catch {
      // table may not exist yet before 002 migration; file is still saved
    }

    return NextResponse.json({ url, filename, kind, mime: file.type, size: buffer.length });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
