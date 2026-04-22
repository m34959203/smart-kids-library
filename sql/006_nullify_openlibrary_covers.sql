-- 006_nullify_openlibrary_covers.sql
-- В seed 004_seed_books.sql cover_url ссылается на OpenLibrary covers API,
-- который у части ISBN отдаёт 302 → archive.org (медленный, частые тайм-ауты)
-- или прямо 404. Это ломает каталог: половина обложек не загружается, а
-- BookCard onError fallback не успевает сработать (ждём ответа сети).
--
-- Решение: nullify cover_url для всех записей с OpenLibrary URL — тогда
-- BookCard сразу детерминированно подставит локальную /covers/cover-XX.jpg
-- (8 вариантов, hash от id+title).
--
-- Идемпотентно: повторный запуск ничего не сломает.

UPDATE books
SET cover_url = NULL
WHERE cover_url LIKE '%covers.openlibrary.org%';
