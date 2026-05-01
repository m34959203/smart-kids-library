#!/usr/bin/env node

/**
 * enrich-books.js — Pass 1 (offline) обогащение метаданных.
 *
 * Читает scripts/books-data.json (или berut'sya из БД), извлекает текст из
 * каждой книги (PDF через pdf-parse, DOCX через mammoth, .txt напрямую) и
 * подставляет реальный заголовок (первые валидные 10–200 символов) и
 * краткое описание (первый абзац после заголовка) в title_ru / title_kk.
 *
 * JPG / TIF / DOC / EPUB — fallback «Сканированный материал · {категория}».
 *
 * Затем апсёртит в БД через UPDATE (по original_filename).
 *
 * Resume-friendly: сохраняет промежуточный JSON books-data.enriched.json
 * с флагом `enriched_at`. При повторном запуске уже обработанные пропускает,
 * если не передан `--force`.
 *
 * Use:
 *   DATABASE_URL=... node scripts/enrich-books.js [--force] [--limit=N]
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const mammoth = require('mammoth');

const ROOT = path.resolve(__dirname, '..');
const BOOKS_DIR = path.join(ROOT, 'public', 'uploads', 'books');
const SOURCE_JSON = path.join(__dirname, 'books-data.json');
const OUT_JSON = path.join(__dirname, 'books-data.enriched.json');

const argv = process.argv.slice(2);
const FORCE = argv.includes('--force');
const LIMIT = parseInt((argv.find((a) => a.startsWith('--limit=')) || '=0').split('=')[1], 10);

const KZ_CHARS = /[ұқғәөүіңһҰҚҒӘӨҮІҢҺ]/;

async function loadPdfParse() {
  const mod = await import('pdf-parse');
  return mod.default || mod.PDFParse || mod;
}

function detectLang(text) {
  const sample = text.slice(0, 2000);
  if (KZ_CHARS.test(sample)) return 'kk';
  if (/[а-яё]/i.test(sample)) return 'ru';
  return 'ru';
}

function isJunkLine(line) {
  const s = line.trim();
  if (!s) return true;
  if (s.length < 4) return true;
  if (/^\d+$/.test(s)) return true;
  if (/^\d{4}$/.test(s)) return true;
  if (/^https?:\/\//i.test(s)) return true;
  if (!/\p{L}/u.test(s)) return true;
  if (/^(стр|page|бет)\.?\s*\d+/i.test(s)) return true;
  return false;
}

function cleanText(text) {
  return text
    .replace(/\r/g, '')
    .replace(/­/g, '')
    .replace(/\f/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractTitle(text, fallback) {
  const cleaned = cleanText(text);
  const lines = cleaned.split('\n').map((l) => l.trim()).filter((l) => !isJunkLine(l));
  for (const line of lines.slice(0, 12)) {
    if (line.length >= 10 && line.length <= 200) {
      return line.replace(/[«»"]+$/g, '').replace(/\s+/g, ' ').trim();
    }
  }
  const firstSentence = cleaned.split(/[.!?]\s/)[0];
  if (firstSentence && firstSentence.length >= 10 && firstSentence.length <= 200) {
    return firstSentence.trim();
  }
  return fallback;
}

function extractDescription(text, title) {
  const cleaned = cleanText(text);
  const lines = cleaned.split('\n').filter((l) => !isJunkLine(l));
  const body = lines.filter((l) => l.trim() !== title).join(' ').replace(/\s+/g, ' ').trim();
  if (body.length < 40) return null;
  // первые 3-4 предложения, до 400 символов
  const sentences = body.split(/(?<=[.!?])\s+/).slice(0, 5);
  let desc = '';
  for (const s of sentences) {
    if ((desc + ' ' + s).length > 400) break;
    desc += (desc ? ' ' : '') + s;
  }
  return desc || body.slice(0, 400);
}

async function extractText(filePath, fileType) {
  try {
    if (fileType === 'pdf') {
      const buf = fs.readFileSync(filePath);
      const pdfParse = await loadPdfParse();
      // pdf-parse v2 экспортирует функцию: const data = await pdfParse(buf)
      const result = typeof pdfParse === 'function' ? await pdfParse(buf) : null;
      return result?.text ?? '';
    }
    if (fileType === 'docx') {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value || '';
    }
    if (fileType === 'txt') {
      return fs.readFileSync(filePath, 'utf-8');
    }
  } catch (e) {
    return '';
  }
  return '';
}

async function main() {
  if (!fs.existsSync(SOURCE_JSON)) {
    console.error(`✗ Not found: ${SOURCE_JSON}. Run import-books.js first.`);
    process.exit(1);
  }
  let books = JSON.parse(fs.readFileSync(SOURCE_JSON, 'utf-8'));

  let enriched = {};
  if (!FORCE && fs.existsSync(OUT_JSON)) {
    try {
      const prev = JSON.parse(fs.readFileSync(OUT_JSON, 'utf-8'));
      for (const b of prev) enriched[b.original_filename] = b;
    } catch {}
  }

  if (LIMIT > 0) books = books.slice(0, LIMIT);

  console.log(`Enriching ${books.length} books${FORCE ? ' (force)' : ''}...`);

  let processed = 0;
  let extracted = 0;
  let fallback = 0;
  for (const b of books) {
    if (!FORCE && enriched[b.original_filename]?.enriched_at) {
      processed++;
      continue;
    }
    const filePath = path.join(BOOKS_DIR, b.stored_filename);
    if (!fs.existsSync(filePath)) {
      processed++;
      continue;
    }

    const text = await extractText(filePath, b.file_type);
    let title = b.title;
    let descriptionRu = null;
    let descriptionKk = null;
    let lang = b.language;

    if (text && text.trim().length > 100) {
      lang = detectLang(text) || lang;
      const t = extractTitle(text, b.title);
      const d = extractDescription(text, t);
      title = t;
      if (lang === 'kk') descriptionKk = d;
      else descriptionRu = d;
      extracted++;
    } else {
      // JPG/TIF/DOC/EPUB — fallback
      const cat = lang === 'kk' ? b.category_kk : b.category_ru;
      if (lang === 'kk') {
        descriptionKk = `Сканерленген материал · ${cat}`;
      } else {
        descriptionRu = `Сканированный материал · ${cat}`;
      }
      fallback++;
    }

    enriched[b.original_filename] = {
      ...b,
      title,
      title_ru: lang === 'ru' ? title : (b.title_ru ?? null),
      title_kk: lang === 'kk' ? title : (b.title_kk ?? null),
      description_ru: descriptionRu,
      description_kk: descriptionKk,
      language: lang,
      enriched_at: new Date().toISOString(),
    };

    processed++;
    if (processed % 50 === 0) {
      console.log(`  ${processed}/${books.length}  (extracted=${extracted}, fallback=${fallback})`);
      // checkpoint
      fs.writeFileSync(OUT_JSON, JSON.stringify(Object.values(enriched), null, 2), 'utf-8');
    }
  }

  fs.writeFileSync(OUT_JSON, JSON.stringify(Object.values(enriched), null, 2), 'utf-8');
  console.log(`\n✓ Wrote ${Object.keys(enriched).length} enriched records`);
  console.log(`  extracted: ${extracted},  fallback: ${fallback}`);

  // Push в БД
  const dbUrl =
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5440/smart_kids_library';
  console.log(`\nPushing to ${dbUrl.replace(/:[^:@/]+@/, ':***@')}`);

  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  let upd = 0;
  for (const b of Object.values(enriched)) {
    if (!b.original_filename) continue;
    try {
      await client.query(
        `UPDATE books SET
            title = COALESCE($1, title),
            title_ru = COALESCE($2, title_ru),
            title_kk = COALESCE($3, title_kk),
            description_ru = COALESCE($4, description_ru),
            description_kk = COALESCE($5, description_kk),
            language = COALESCE($6, language),
            content_text = COALESCE($7, content_text)
          WHERE original_filename = $8`,
        [
          b.title,
          b.title_ru,
          b.title_kk,
          b.description_ru,
          b.description_kk,
          b.language,
          (b.description_ru || b.description_kk) ?? null,
          b.original_filename,
        ]
      );
      upd++;
    } catch {}
  }
  await client.end();
  console.log(`✓ Updated ${upd} rows in books`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
