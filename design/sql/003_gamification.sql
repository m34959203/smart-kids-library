-- Smart Kids Library — gamification schema (v3)
-- Points events log, achievements catalogue, user achievement unlocks, daily streaks.

CREATE TABLE IF NOT EXISTS points_events (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind VARCHAR(40) NOT NULL
        CHECK (kind IN (
            'checkin',      -- daily visit
            'book_finished',
            'book_progress',
            'quiz_passed',
            'story_created',
            'review_written',
            'event_attended',
            'request_made', -- chat / librarian query
            'workshop_submitted',
            'admin_award'
        )),
    ref_id INTEGER,
    points INTEGER NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_points_events_user_created ON points_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_points_events_kind ON points_events(kind);

CREATE TABLE IF NOT EXISTS achievements (
    code VARCHAR(60) PRIMARY KEY,
    title_ru TEXT NOT NULL,
    title_kk TEXT NOT NULL,
    description_ru TEXT,
    description_kk TEXT,
    icon VARCHAR(40) DEFAULT 'star',
    tier VARCHAR(20) DEFAULT 'bronze' CHECK (tier IN ('bronze','silver','gold','platinum')),
    points INTEGER NOT NULL DEFAULT 10
);

CREATE TABLE IF NOT EXISTS user_achievements (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_code VARCHAR(60) NOT NULL REFERENCES achievements(code) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, achievement_code)
);

CREATE TABLE IF NOT EXISTS user_streaks (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_checkin DATE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed achievements catalogue
INSERT INTO achievements (code, title_ru, title_kk, description_ru, description_kk, icon, tier, points) VALUES
('first_checkin',       'Первый визит',        'Алғашқы келу',      'Первый раз зашёл на портал',         'Порталға алғаш кірдің',              'door',   'bronze',   10),
('week_streak',         'Неделя подряд',       'Қатарынан апта',    '7 дней подряд заходил',              '7 күн қатарынан кірдің',             'flame',  'silver',   50),
('month_streak',        'Месяц огня',          'От айы',            '30 дней подряд',                      '30 күн қатарынан',                   'flame',  'gold',    200),
('first_book',          'Первая книга',        'Алғашқы кітап',     'Завершил первую книгу',              'Алғашқы кітапты аяқтадың',           'book',   'bronze',   30),
('bookworm_10',         'Книжный червь',       'Кітапқұрт',         'Прочитал 10 книг',                    '10 кітап оқыдың',                    'book',   'silver',  150),
('library_legend',      'Легенда библиотеки',  'Кітапхана аңызы',   '50 прочитанных книг',                '50 кітап оқыдың',                    'crown',  'gold',    500),
('first_quiz',          'Первая викторина',    'Алғашқы викторина', 'Прошёл первую викторину',            'Алғашқы викторинаны өттің',          'brain',  'bronze',   20),
('quiz_master',         'Мастер викторин',     'Викторина шебері',  'Выиграл 10 викторин',                 '10 викторинаны жеңдің',              'brain',  'silver',  120),
('storyteller',         'Сказочник',           'Ертегіші',          'Создал 5 сказок',                     '5 ертегі жасадың',                   'magic',  'silver',  100),
('event_goer',          'Участник событий',    'Оқиға қатысушысы',  'Побывал на 3 мероприятиях',          '3 іс-шараға қатыстың',               'calendar','bronze',  40),
('curious',             'Любознательный',      'Білуге құмар',      'Задал 10 вопросов помощнику',        'Көмекшіге 10 сұрақ қойдың',          'spark',  'bronze',   30)
ON CONFLICT (code) DO NOTHING;
