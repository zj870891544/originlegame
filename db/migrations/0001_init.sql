-- OriginleGame.app schema.
-- One row per daily Originle puzzle, copied from the data the official game publishes
-- for that day (originle.io/<guest>/day.js). Timestamps are ISO-8601 UTC strings;
-- `game_date` is a YYYY-MM-DD calendar date in America/New_York.

CREATE TABLE puzzles (
  number               INTEGER PRIMARY KEY CHECK (number > 0),
  game_date            TEXT NOT NULL UNIQUE CHECK (game_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  -- The guest's id in the official schedule, e.g. "aya".
  slug                 TEXT NOT NULL UNIQUE,
  guest_name           TEXT NOT NULL,
  -- ISO 3166-1 alpha-2 code of the country the guest represents.
  country_code         TEXT NOT NULL CHECK (length(country_code) = 2),
  -- The country exactly as the game wrote it.
  country_label        TEXT NOT NULL,
  -- JSON [{id, title, teaser}] in the order the game reveals them.
  clues_json           TEXT NOT NULL,
  outline_clue         TEXT,
  -- JSON {code: km}, border-to-border distance from the answer to every country.
  distances_json       TEXT NOT NULL,
  -- JSON [code], guesses the game refuses for this guest (e.g. their passport country).
  disabled_guesses_json TEXT NOT NULL DEFAULT '[]',
  guess_note           TEXT,
  -- Hand-written hints [hint1, hint2, hint3]; when NULL the site writes them from the data.
  hints_json           TEXT,
  editor_note          TEXT,
  source_url           TEXT NOT NULL,
  -- sha-256 of the stored fields, so an unchanged re-sync is recognisable.
  content_hash         TEXT NOT NULL,
  first_seen_at        TEXT NOT NULL,
  updated_at           TEXT NOT NULL,
  checked_at           TEXT NOT NULL
);

CREATE TABLE sync_runs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at  TEXT NOT NULL,
  finished_at TEXT NOT NULL,
  status      TEXT NOT NULL CHECK (status IN ('succeeded', 'failed')),
  game_date   TEXT,
  summary     TEXT,
  error       TEXT
);
CREATE INDEX idx_sync_runs_started ON sync_runs (started_at);
