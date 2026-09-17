-- Task 6.9 (Stage 1, follow-up correctness pass) — two additive pieces:
--
-- 1) `task_sessions.practice_streak` closes a client-trust gap:
--    `addSimilarPracticeTask` used to take the student's consecutive-correct
--    "streak" as a plain client-supplied number — nothing stopped a client
--    from lying about it to force harder follow-up tasks. Now the server is
--    the only writer: `checkAnswer.ts` increments it after an independent,
--    first-attempt, unaided correct answer and resets it to 0 on anything
--    else (wrong, retried, or hint-assisted) — see `nextPracticeStreak` in
--    `practiceAdaptive.ts`, now actually called from `checkAnswer.ts` instead
--    of being an unwired pure-function contract. `addSimilarPracticeTask`
--    reads it straight from `task_sessions` instead of trusting the caller.
--
-- 2) `practice_task_origin` — durable, race-safe accounting of WHERE a
--    `tasks2session` row came from, needed by the reinforcement
--    ("similar task") and spaced-repetition follow-up flows to:
--      (a) tell a genuinely new follow-up row apart from every ordinary
--          original/primary task, so `addSpacedRepetitionTask`'s history
--          scan (`practiceSpacedRepetition.ts`'s `isFollowUp`) is accurate
--          instead of approximated, and
--      (b) make double-submission / concurrent-request safe: a row already
--          recorded here for a given source mapping (reinforcement) means
--          "already added", so a duplicate request returns the existing
--          follow-up instead of inserting a second one (repetition dedupes
--          via the session-row `FOR UPDATE` lock in `addSpacedRepetitionTask`
--          instead — see the comment there).
--
--    Deliberately NOT more nullable columns bolted onto `tasks2session` — a
--    session's vast majority of rows are plain original tasks (`quiz_tasks`
--    from `startTopicTest`/`startMistakeReviewRound`), so a sparse side
--    table (one row per follow-up only) models "most rows have no origin
--    metadata at all" without a column that's NULL on nearly every row.
--    Absence of a row here means "primary/original task" — true for every
--    row written before this migration and every ordinary task written
--    after it; no existing INSERT needs to change.
--
-- Run once in phpMyAdmin or: mysql ... < scripts/sql/027_practice_task_origin.sql
-- The `ALTER TABLE` is NOT safe to re-run (fails if the column already
-- exists, same as every other ADD COLUMN migration in this repo); the
-- `CREATE TABLE IF NOT EXISTS` below it is.
--
-- NOTE: like 026, this was written and reviewed against this repo's existing
-- schema conventions (see 017_teacher_students.sql for the FK/index style
-- copied here) but NOT executed against a live/production MySQL instance in
-- this environment — no local MySQL server was reachable. Validate against a
-- staging copy before applying to production.

ALTER TABLE task_sessions
  ADD COLUMN practice_streak SMALLINT UNSIGNED NOT NULL DEFAULT 0 AFTER expire_time;

CREATE TABLE IF NOT EXISTS practice_task_origin (
  tasks2session_id INT NOT NULL,
  session_id INT NOT NULL,
  -- 'similar'    = addSimilarPracticeTask.ts reinforcement follow-up
  -- 'repetition' = addSpacedRepetitionTask.ts spaced-topic-repetition follow-up
  origin ENUM('similar', 'repetition') NOT NULL,
  -- The mapping whose second wrong attempt triggered this follow-up
  -- (reinforcement only; NULL for a repetition row, which is triggered by a
  -- theme becoming due rather than one specific mapping).
  source_mapping_id INT NULL,
  created_at INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (tasks2session_id),
  KEY idx_practice_task_origin_session (session_id),
  -- Dedupe key for reinforcement: at most one 'similar' follow-up per source
  -- mapping, enforced by the database itself (not just app-level checks) —
  -- a duplicate/concurrent addSimilarPracticeTask request for the same
  -- source mapping fails this unique constraint and the app treats that as
  -- "already added, return the existing one" rather than a second insert.
  UNIQUE KEY uq_practice_task_origin_source (origin, source_mapping_id),
  CONSTRAINT fk_practice_task_origin_mapping
    FOREIGN KEY (tasks2session_id) REFERENCES tasks2session (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
