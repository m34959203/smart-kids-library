-- Smart Kids Library — real children's books seed with real covers.
-- Safe to run multiple times: uses ON CONFLICT (isbn) DO UPDATE so running
-- the script again refreshes metadata / covers without creating duplicates.
--
-- Covers are served by OpenLibrary's public Covers API:
--   https://covers.openlibrary.org/b/isbn/{ISBN}-L.jpg?default=false
-- `?default=false` makes the API return HTTP 404 (instead of a 1x1 placeholder)
-- when the book is not indexed, so the client-side fallback in BookCard can
-- swap in a locally generated cover gracefully.

-- Make ISBN uniquely identifiable for idempotent upserts.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'books_isbn_unique'
    ) THEN
        BEGIN
            ALTER TABLE books ADD CONSTRAINT books_isbn_unique UNIQUE (isbn);
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
    END IF;
END$$;

INSERT INTO books
    (title, author, genre, description, cover_url, age_category, isbn, year, language, is_available, page_count)
VALUES
-- ============ 6–9 лет (иллюстрированные сказки и повести) ============
(
    'Маленький принц',
    'Антуан де Сент-Экзюпери',
    'Сказка',
    'Философская сказка о маленьком мальчике с далёкой планеты, который путешествует по Вселенной и ищет настоящую дружбу.',
    'https://covers.openlibrary.org/b/isbn/9780156012195-L.jpg?default=false',
    '6-9', '9780156012195', 1943, 'ru', true, 96
),
(
    'Винни-Пух и все-все-все',
    'Алан Милн',
    'Сказка',
    'Истории про плюшевого медвежонка Винни-Пуха, его друга Пятачка и всех обитателей Стоакрового леса.',
    'https://covers.openlibrary.org/b/isbn/9780525444435-L.jpg?default=false',
    '6-9', '9780525444435', 1926, 'ru', true, 176
),
(
    'Пеппи Длинныйчулок',
    'Астрид Линдгрен',
    'Приключения',
    'Невероятные приключения самой сильной девочки в мире, которая живёт одна и ничего не боится.',
    'https://covers.openlibrary.org/b/isbn/9780670036776-L.jpg?default=false',
    '6-9', '9780670036776', 1945, 'ru', true, 160
),
(
    'Муми-тролль и комета',
    'Туве Янссон',
    'Сказка',
    'К Муми-долу летит комета — и Муми-тролль с друзьями отправляется в путешествие, чтобы найти ответы у звездочёта.',
    'https://covers.openlibrary.org/b/isbn/9780374453053-L.jpg?default=false',
    '6-9', '9780374453053', 1946, 'ru', true, 192
),
(
    'Карлсон, который живёт на крыше',
    'Астрид Линдгрен',
    'Сказка',
    'Малыш встречает чудака Карлсона, который живёт на крыше и обожает шалости, варенье и плюшки.',
    'https://covers.openlibrary.org/b/isbn/9780192728760-L.jpg?default=false',
    '6-9', '9780192728760', 1955, 'ru', true, 144
),

-- ============ 10–13 лет (повести, фэнтези, приключения) ============
(
    'Гарри Поттер и философский камень',
    'Джоан Роулинг',
    'Фэнтези',
    'Мальчик-сирота узнаёт, что он — волшебник, и попадает в школу чародейства и волшебства Хогвартс.',
    'https://covers.openlibrary.org/b/isbn/9780747532699-L.jpg?default=false',
    '10-13', '9780747532699', 1997, 'ru', true, 336
),
(
    'Хоббит, или Туда и обратно',
    'Джон Р.Р. Толкин',
    'Фэнтези',
    'Бильбо Бэггинс отправляется в опасное путешествие вместе с гномами и волшебником Гэндальфом.',
    'https://covers.openlibrary.org/b/isbn/9780547928227-L.jpg?default=false',
    '10-13', '9780547928227', 1937, 'ru', true, 320
),
(
    'Чарли и шоколадная фабрика',
    'Роальд Даль',
    'Сказка',
    'Пятеро счастливчиков выигрывают билет на экскурсию по самой волшебной шоколадной фабрике мира.',
    'https://covers.openlibrary.org/b/isbn/9780142410318-L.jpg?default=false',
    '10-13', '9780142410318', 1964, 'ru', true, 176
),
(
    'Матильда',
    'Роальд Даль',
    'Повесть',
    'История гениальной девочки, которая обожает книги и обладает необычными способностями.',
    'https://covers.openlibrary.org/b/isbn/9780142410370-L.jpg?default=false',
    '10-13', '9780142410370', 1988, 'ru', true, 240
),
(
    'Алиса в Стране чудес',
    'Льюис Кэрролл',
    'Сказка',
    'Любопытная девочка Алиса проваливается в кроличью нору и попадает в удивительный мир.',
    'https://covers.openlibrary.org/b/isbn/9780141321073-L.jpg?default=false',
    '10-13', '9780141321073', 1865, 'ru', true, 208
),
(
    'Лев, колдунья и платяной шкаф',
    'Клайв Стейплз Льюис',
    'Фэнтези',
    'Четверо детей находят волшебный мир Нарнию, где правит Белая Колдунья, и встречают мудрого льва Аслана.',
    'https://covers.openlibrary.org/b/isbn/9780064471046-L.jpg?default=false',
    '10-13', '9780064471046', 1950, 'ru', true, 208
),
(
    'Энн из Зелёных Крыш',
    'Люси Мод Монтгомери',
    'Повесть',
    'Рыжая сирота-мечтательница Энн приезжает на ферму «Зелёные Крыши» и меняет жизнь всех вокруг.',
    'https://covers.openlibrary.org/b/isbn/9780553213133-L.jpg?default=false',
    '10-13', '9780553213133', 1908, 'ru', true, 320
),
(
    'Остров сокровищ',
    'Роберт Льюис Стивенсон',
    'Приключения',
    'Юный Джим Хокинс находит карту сокровищ и отправляется в плавание, полное пиратов и опасностей.',
    'https://covers.openlibrary.org/b/isbn/9780141321004-L.jpg?default=false',
    '10-13', '9780141321004', 1883, 'ru', true, 272
),
(
    'Таинственный сад',
    'Фрэнсис Ходжсон Бёрнетт',
    'Повесть',
    'Одинокая девочка Мэри находит заброшенный сад и возвращает его к жизни вместе с новыми друзьями.',
    'https://covers.openlibrary.org/b/isbn/9780142437056-L.jpg?default=false',
    '10-13', '9780142437056', 1911, 'ru', true, 240
),

-- ============ 14–17 лет (повести и подростковые классики) ============
(
    'Маленькие женщины',
    'Луиза Мэй Олкотт',
    'Повесть',
    'Взросление четырёх сестёр Марч: их мечты, дружба, первая любовь и трудности военного времени.',
    'https://covers.openlibrary.org/b/isbn/9780147514011-L.jpg?default=false',
    '14-17', '9780147514011', 1868, 'ru', true, 528
),
(
    'Убить пересмешника',
    'Харпер Ли',
    'Роман',
    'История о справедливости, смелости и взрослении глазами девочки Скаут в южном американском городке.',
    'https://covers.openlibrary.org/b/isbn/9780446310789-L.jpg?default=false',
    '14-17', '9780446310789', 1960, 'ru', true, 336
),
(
    'Дневник Анны Франк',
    'Анна Франк',
    'Биография',
    'Настоящий дневник еврейской девочки, которая прятала свою семью от нацистов во время Второй мировой войны.',
    'https://covers.openlibrary.org/b/isbn/9780553296983-L.jpg?default=false',
    '14-17', '9780553296983', 1947, 'ru', true, 304
),
(
    'Голодные игры',
    'Сьюзен Коллинз',
    'Фантастика',
    'В мире после катастрофы 16-летняя Китнисс становится участницей смертельных телевизионных игр.',
    'https://covers.openlibrary.org/b/isbn/9780439023528-L.jpg?default=false',
    '14-17', '9780439023528', 2008, 'ru', true, 384
)
ON CONFLICT (isbn) DO UPDATE SET
    title        = EXCLUDED.title,
    author       = EXCLUDED.author,
    genre        = EXCLUDED.genre,
    description  = EXCLUDED.description,
    cover_url    = EXCLUDED.cover_url,
    age_category = EXCLUDED.age_category,
    year         = EXCLUDED.year,
    language     = EXCLUDED.language,
    is_available = EXCLUDED.is_available,
    page_count   = EXCLUDED.page_count;
