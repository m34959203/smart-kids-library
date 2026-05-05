#!/usr/bin/env node
import { Pool } from "pg";
import sharp from "sharp";
import path from "node:path";
import fs from "node:fs/promises";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const PUBLIC_DIR = path.resolve(process.cwd(), "public");
const COVERS_DIR = path.join(PUBLIC_DIR, "uploads", "covers");

async function main() {
  await fs.mkdir(COVERS_DIR, { recursive: true });

  const { rows } = await pool.query(
    `SELECT id, file_url FROM books
     WHERE file_type IN ('tif','tiff')
       AND file_url IS NOT NULL AND file_url <> ''`
  );

  let ok = 0, skipped = 0, failed = 0;
  for (const { id, file_url } of rows) {
    const srcAbs = path.join(PUBLIC_DIR, file_url.replace(/^\//, ""));
    const outRel = `/uploads/covers/book_${String(id).padStart(4, "0")}.webp`;
    const outAbs = path.join(PUBLIC_DIR, outRel.replace(/^\//, ""));
    try {
      await fs.access(srcAbs);
    } catch {
      console.warn(`[skip] no source: ${srcAbs}`);
      skipped++;
      continue;
    }
    try {
      await sharp(srcAbs, { limitInputPixels: false, failOn: "none" })
        .rotate()
        .resize({ width: 900, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(outAbs);
      await pool.query(`UPDATE books SET cover_url=$1 WHERE id=$2`, [outRel, id]);
      ok++;
      if (ok % 20 === 0) console.log(`  ${ok}/${rows.length}…`);
    } catch (e) {
      console.error(`[fail] id=${id} src=${srcAbs}: ${e.message}`);
      failed++;
    }
  }
  console.log(`\nTIF→WebP done: ok=${ok}, skipped=${skipped}, failed=${failed}, total=${rows.length}`);
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
