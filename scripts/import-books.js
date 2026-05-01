#!/usr/bin/env node

/**
 * import-books.js — массовый импорт фонда из docs/Text/Text/
 *
 * Делает:
 *  1. Рекурсивно обходит docs/Text/Text/.
 *  2. Фильтрует мусор (~$*, Thumbs.db, *.db).
 *  3. Каждый поддерживаемый файл копирует в public/uploads/books/ под
 *     санитарным именем book_NNNN.ext.
 *  4. Извлекает метаданные из имени и пути (категория, язык, год).
 *  5. Пишет JSON-каталог в scripts/books-data.json.
 *
 * Импорт в БД делает scripts/insert-books.js (отдельный шаг — чтобы JSON
 * можно было сначала проверить и обогатить).
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_DIR = path.join(ROOT, 'docs', 'Text');
const DEST_DIR = path.join(ROOT, 'public', 'uploads', 'books');
const OUTPUT_JSON = path.join(__dirname, 'books-data.json');

const SUPPORTED_EXT = new Set(['pdf', 'jpg', 'jpeg', 'tif', 'tiff', 'docx', 'doc', 'txt', 'fb2', 'epub']);

// Маппинг верхней папки в человекочитаемую категорию (RU/KK).
const CATEGORY_MAP = {
  '2022 ж оцифр': { ru: 'Краеведение · 2022', kk: 'Өлкетану · 2022' },
  '2024 жыл': { ru: 'Краеведение · 2024', kk: 'Өлкетану · 2024' },
  '2025 жыл  Өлкетану': { ru: 'Краеведение · 2025', kk: 'Өлкетану · 2025' },
  '2026 Өлкетану': { ru: 'Краеведение · 2026', kk: 'Өлкетану · 2026' },
};

// Признаки языка по «листовому» подкаталогу.
const LANG_FROM_SUBDIR = {
  'қаз тілі': 'kk',
  'қаз. тілі': 'kk',
  'қаз.тілі': 'kk',
  '2024 қаз. тілі': 'kk',
  '2024 қаз тілі': 'kk',
  'қазақша': 'kk',
  'қазақ тілі': 'kk',
  'Казак оцифровка': 'kk',
  'русс яз': 'ru',
  'орыс тілі': 'ru',
  '2024 орыс тілі': 'ru',
  'русский': 'ru',
  'Орыс тили  оцифровка': 'ru',
  'Орыс тили оцифровка': 'ru',
};

const KZ_CHARS = /[ұқғәөүіңһҰҚҒӘӨҮІҢҺ]/;

function isJunk(name) {
  // Word lockfile, Windows thumbs, скрытые системные.
  return name.startsWith('~$') || name === 'Thumbs.db' || name.startsWith('.');
}

function walkDir(dir) {
  const out = [];
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    console.error(`Warning: cannot read ${dir}: ${err.message}`);
    return out;
  }
  for (const e of entries) {
    if (isJunk(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walkDir(full));
    else if (e.isFile()) out.push(full);
  }
  return out;
}

function resolveCategory(filePath) {
  const rel = path.relative(SOURCE_DIR, filePath);
  const parts = rel.split(path.sep);
  const top = parts[0];
  return CATEGORY_MAP[top] || { ru: 'Краеведение', kk: 'Өлкетану' };
}

function detectLanguage(filePath, filename) {
  const rel = path.relative(SOURCE_DIR, filePath);
  const parts = rel.split(path.sep);
  // Последний поддиректорий — обычно язык
  for (let i = parts.length - 2; i >= 0; i--) {
    const lang = LANG_FROM_SUBDIR[parts[i]];
    if (lang) return lang;
  }
  // Fallback: казахские буквы в имени → kk, иначе ru
  return KZ_CHARS.test(filename) ? 'kk' : 'ru';
}

function detectYear(filePath) {
  const rel = path.relative(SOURCE_DIR, filePath);
  const m = rel.match(/(20\d{2})/);
  return m ? parseInt(m[1], 10) : null;
}

function titleFromFilename(filename) {
  return path
    .basename(filename, path.extname(filename))
    .replace(/_/g, ' ')
    .replace(/\s*\(\d+\)\s*$/, '')      // убрать "(2)", "(3)" в конце
    .replace(/\s*-\s*копия\s*$/i, '')    // убрать "- копия"
    .replace(/\s+Word$/i, '')            // убрать "... Word"
    .replace(/\s+/g, ' ')
    .trim();
}

function contentTypeFor(ext) {
  if (['jpg', 'jpeg', 'tif', 'tiff'].includes(ext)) return 'photo';
  if (ext === 'pdf') return 'article';
  if (['docx', 'doc', 'txt', 'fb2', 'epub'].includes(ext)) return 'article';
  return 'document';
}

function main() {
  console.log('Smart Kids Library — bulk import');
  console.log(`Source : ${SOURCE_DIR}`);
  console.log(`Dest   : ${DEST_DIR}`);
  console.log();

  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`✗ Source dir does not exist: ${SOURCE_DIR}`);
    process.exit(1);
  }

  fs.mkdirSync(DEST_DIR, { recursive: true });

  const all = walkDir(SOURCE_DIR);
  console.log(`Found ${all.length} files (after junk filter).`);

  const files = all.filter((f) => {
    const ext = path.extname(f).slice(1).toLowerCase();
    return SUPPORTED_EXT.has(ext);
  });
  console.log(`${files.length} supported files to import.\n`);

  const books = [];
  const catCount = {};
  const extCount = {};
  let idx = 0;

  for (const filePath of files) {
    idx++;
    const ext = path.extname(filePath).slice(1).toLowerCase();
    const stat = fs.statSync(filePath);
    const filename = path.basename(filePath);
    const title = titleFromFilename(filename);
    const cat = resolveCategory(filePath);
    const lang = detectLanguage(filePath, filename);
    const year = detectYear(filePath);

    const seq = String(idx).padStart(4, '0');
    const stored = `book_${seq}.${ext}`;
    const dest = path.join(DEST_DIR, stored);

    fs.copyFileSync(filePath, dest);

    books.push({
      id: idx,
      title,
      title_ru: lang === 'ru' ? title : null,
      title_kk: lang === 'kk' ? title : null,
      category_ru: cat.ru,
      category_kk: cat.kk,
      year,
      language: lang,
      file_type: ext,
      file_size: stat.size,
      page_count: 0,
      content_type: contentTypeFor(ext),
      original_filename: filename,
      original_path: path.relative(SOURCE_DIR, filePath),
      stored_filename: stored,
      file_url: `/uploads/books/${stored}`,
    });

    const k = `${cat.ru}|${lang}`;
    catCount[k] = (catCount[k] || 0) + 1;
    extCount[ext] = (extCount[ext] || 0) + 1;

    if (idx % 100 === 0) console.log(`  processed ${idx} / ${files.length}...`);
  }

  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(books, null, 2), 'utf-8');
  console.log(`\n✓ Wrote ${books.length} records to ${OUTPUT_JSON}`);
  console.log(`✓ Files copied to ${DEST_DIR}`);

  console.log('\n=== By category|lang ===');
  for (const [k, c] of Object.entries(catCount).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k}: ${c}`);
  }
  console.log('\n=== By extension ===');
  for (const [e, c] of Object.entries(extCount).sort((a, b) => b[1] - a[1])) {
    console.log(`  .${e}: ${c}`);
  }
  console.log(`\nTotal: ${books.length}`);
}

main();
