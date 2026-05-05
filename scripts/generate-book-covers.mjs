#!/usr/bin/env node
/**
 * Generates cover_url for books that don't have one:
 *  - PDF: render first page via pdftoppm → WebP
 *  - DOCX/DOC/no-file: typographic SVG cover (title+author on gradient)
 * Idempotent: skips books already having cover_url.
 */
import { Pool } from "pg";
import sharp from "sharp";
import path from "node:path";
import fs from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import os from "node:os";

const exec = promisify(execFile);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const PUBLIC_DIR = path.resolve(process.cwd(), "public");
const COVERS_DIR = path.join(PUBLIC_DIR, "uploads", "covers");

// Palette per age category (warm, child-friendly)
const PALETTES = {
  "6-9":   { from: "#FFB347", to: "#FF6B6B", text: "#1a1712" },
  "10-13": { from: "#4ECDC4", to: "#556270", text: "#FFFFFF" },
  "14-17": { from: "#667EEA", to: "#764BA2", text: "#FFFFFF" },
  default: { from: "#A0826D", to: "#5C4033", text: "#FFF8E7" },
};

function escapeXml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function wrap(text, perLine, maxLines) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length <= perLine) cur = (cur + " " + w).trim();
    else { if (cur) lines.push(cur); cur = w; }
    if (lines.length >= maxLines) break;
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  if (lines.length === maxLines && words.length > lines.join(" ").split(/\s+/).length) {
    lines[maxLines - 1] = lines[maxLines - 1].replace(/.{0,3}$/, "…");
  }
  return lines;
}

function buildSvgCover({ title, author, ageCategory }) {
  const W = 600, H = 800;
  const pal = PALETTES[ageCategory] || PALETTES.default;
  const titleLines = wrap(title, 18, 5);
  const titleStartY = H / 2 - (titleLines.length - 1) * 26;
  const authorLine = author ? escapeXml(author) : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${pal.from}"/>
      <stop offset="100%" stop-color="${pal.to}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <rect x="24" y="24" width="${W - 48}" height="${H - 48}" fill="none" stroke="${pal.text}" stroke-opacity="0.35" stroke-width="2"/>
  <text x="${W/2}" y="80" text-anchor="middle" font-family="Georgia, serif" font-size="14" letter-spacing="6" fill="${pal.text}" fill-opacity="0.7">SMART KIDS LIBRARY</text>
  ${titleLines.map((line, i) => `<text x="${W/2}" y="${titleStartY + i * 52}" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="44" fill="${pal.text}">${escapeXml(line)}</text>`).join("\n  ")}
  ${authorLine ? `<text x="${W/2}" y="${H - 90}" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="22" fill="${pal.text}" fill-opacity="0.85">${authorLine}</text>` : ""}
  <text x="${W/2}" y="${H - 50}" text-anchor="middle" font-family="Georgia, serif" font-size="13" letter-spacing="3" fill="${pal.text}" fill-opacity="0.6">КРАЕВЕДЕНИЕ • САТПАЕВ</text>
</svg>`;
}

async function renderPdfFirstPage(srcAbs, outAbs) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "pdfcov-"));
  try {
    const prefix = path.join(tmpDir, "p");
    await exec("pdftoppm", ["-f", "1", "-l", "1", "-r", "110", "-jpeg", srcAbs, prefix]);
    const files = await fs.readdir(tmpDir);
    const page = files.find(f => f.startsWith("p")); // p-1.jpg or p-01.jpg
    if (!page) throw new Error("pdftoppm produced no output");
    await sharp(path.join(tmpDir, page))
      .resize({ width: 900, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(outAbs);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}

async function renderTypographic(book, outAbs) {
  const svg = buildSvgCover({
    title: book.title || "Без названия",
    author: book.author,
    ageCategory: book.age_category,
  });
  await sharp(Buffer.from(svg))
    .webp({ quality: 88 })
    .toFile(outAbs);
}

async function main() {
  await fs.mkdir(COVERS_DIR, { recursive: true });

  const { rows } = await pool.query(`
    SELECT id, title, author, age_category, file_type, file_url
    FROM books
    WHERE cover_url IS NULL OR cover_url = ''
  `);
  console.log(`Need covers for ${rows.length} books.`);

  let pdfOk = 0, typoOk = 0, failed = 0;
  for (const b of rows) {
    const outRel = `/uploads/covers/book_${String(b.id).padStart(4, "0")}.webp`;
    const outAbs = path.join(PUBLIC_DIR, outRel.replace(/^\//, ""));
    try {
      if (b.file_type === "pdf" && b.file_url) {
        const srcAbs = path.join(PUBLIC_DIR, b.file_url.replace(/^\//, ""));
        try { await fs.access(srcAbs); }
        catch { await renderTypographic(b, outAbs); typoOk++; await pool.query(`UPDATE books SET cover_url=$1 WHERE id=$2`, [outRel, b.id]); continue; }
        await renderPdfFirstPage(srcAbs, outAbs);
        pdfOk++;
      } else {
        await renderTypographic(b, outAbs);
        typoOk++;
      }
      await pool.query(`UPDATE books SET cover_url=$1 WHERE id=$2`, [outRel, b.id]);
      if ((pdfOk + typoOk) % 25 === 0) console.log(`  ${pdfOk + typoOk}/${rows.length}…`);
    } catch (e) {
      console.error(`[fail] id=${b.id} (${b.file_type}): ${e.message}`);
      // last-resort typographic
      try {
        await renderTypographic(b, outAbs);
        await pool.query(`UPDATE books SET cover_url=$1 WHERE id=$2`, [outRel, b.id]);
        typoOk++;
      } catch (ee) {
        failed++;
        console.error(`  fallback failed: ${ee.message}`);
      }
    }
  }
  console.log(`\nDone: pdf=${pdfOk}, typographic=${typoOk}, failed=${failed}, total=${rows.length}`);
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
