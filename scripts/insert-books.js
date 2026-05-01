#!/usr/bin/env node

/**
 * insert-books.js — заливает scripts/books-data.json в Postgres.
 *
 * Идемпотентен: ON CONFLICT (original_filename) DO UPDATE.
 * Перед запуском: docker exec smart-kids-library-db-1 psql -U postgres -d smart_kids_library -f /path/to/008_extend_books_for_lore.sql
 *  (либо просто `npm run db:migrate`, если есть).
 *
 * Использует DATABASE_URL из process.env (как и приложение).
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const ROOT = path.resolve(__dirname, '..');
const JSON_PATH = path.join(__dirname, 'books-data.json');

async function main() {
  if (!fs.existsSync(JSON_PATH)) {
    console.error(`✗ Not found: ${JSON_PATH}. Run import-books.js first.`);
    process.exit(1);
  }

  const books = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
  console.log(`Loaded ${books.length} books from JSON.`);

  const dbUrl =
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5440/smart_kids_library';
  console.log(`Connecting to ${dbUrl.replace(/:[^:@/]+@/, ':***@')}`);

  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  // Уникальность для апсёрта по original_filename.
  await client.query(
    `CREATE UNIQUE INDEX IF NOT EXISTS books_original_filename_uniq
     ON books(original_filename) WHERE original_filename IS NOT NULL`
  );

  let ok = 0;
  let fail = 0;
  for (const b of books) {
    const title = b.title || b.original_filename || `book_${b.id}`;
    try {
      await client.query(
        `INSERT INTO books (
            title, title_ru, title_kk, author,
            category, category_kk, language, year,
            file_url, file_type, file_size, page_count,
            content_type, original_filename, is_digital, is_available
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
         ON CONFLICT (original_filename) WHERE original_filename IS NOT NULL DO UPDATE SET
            title       = EXCLUDED.title,
            title_ru    = EXCLUDED.title_ru,
            title_kk    = EXCLUDED.title_kk,
            category    = EXCLUDED.category,
            category_kk = EXCLUDED.category_kk,
            language    = EXCLUDED.language,
            year        = EXCLUDED.year,
            file_url    = EXCLUDED.file_url,
            file_type   = EXCLUDED.file_type,
            file_size   = EXCLUDED.file_size,
            content_type = EXCLUDED.content_type,
            is_digital  = EXCLUDED.is_digital`,
        [
          title,
          b.title_ru,
          b.title_kk,
          null, // author — пока неизвестно, обогатим позже
          b.category_ru,
          b.category_kk,
          b.language,
          b.year,
          b.file_url,
          b.file_type,
          b.file_size,
          b.page_count || 0,
          b.content_type,
          b.original_filename,
          true,
          true,
        ]
      );
      ok++;
      if (ok % 100 === 0) console.log(`  inserted ${ok}/${books.length}...`);
    } catch (e) {
      fail++;
      if (fail < 10) console.error(`✗ ${b.original_filename}: ${e.message}`);
    }
  }

  await client.end();
  console.log(`\n✓ Inserted/updated: ${ok}`);
  if (fail) console.log(`✗ Failed: ${fail}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
