-- ============================================================
-- Migration 009: chapter_progress
--
-- Tracks granular chapter-level completion for the new
-- Lesson → Chapter curriculum architecture.
--
-- chapter_id format: "<lessonNumber>.<chapterIndex>"
--   e.g. "1.0" = Lesson 1, Chapter 0 (Intro)
--        "1.5" = Lesson 1, Chapter 5 (Sentence Drills)
--        "1.6" = Lesson 1, Chapter 6 (Final Boss Test)
--
-- This table is append-on-complete (idempotent upsert).
-- Completion criteria are enforced by the API at write time
-- based on the difficulty modifier applied during the session.
-- ============================================================

CREATE TABLE IF NOT EXISTS chapter_progress (
  user_id           UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chapter_id        TEXT        NOT NULL,
  difficulty        TEXT        NOT NULL CHECK (difficulty IN ('easy', 'intermediate', 'professional')),
  wpm_achieved      INTEGER     NOT NULL DEFAULT 0,
  accuracy_achieved INTEGER     NOT NULL DEFAULT 0,
  completed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One row per user+chapter: re-completing a chapter upserts the row
  PRIMARY KEY (user_id, chapter_id)
);

-- Fast bulk fetch: "give me all completed chapters for this user"
CREATE INDEX IF NOT EXISTS idx_chapter_progress_user
  ON chapter_progress (user_id, completed_at DESC);
