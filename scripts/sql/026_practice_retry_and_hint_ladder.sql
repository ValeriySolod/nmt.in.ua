-- Task 6.9 (Stage 1) — second attempt after a wrong answer + 3-rung hint
-- ladder for Practice-mode topic tests.
--
-- Purely additive: new nullable/defaulted columns only, no existing column
-- changes, no data touched beyond the DEFAULT applied to pre-existing rows.
-- Safe to run any time before or after the app code deploys — old app code
-- that doesn't know these columns exist keeps working unmodified (it never
-- selects them, and every INSERT it issues already lists explicit columns).
--
-- What this adds:
--   tasks2session.first_attempt_status  SMALLINT NULL DEFAULT NULL
--     Set exactly once, on the very first check of a row (mirrors the value
--     `status` gets at that moment), and never touched again afterwards —
--     the permanent record of the *first* attempt's correctness, so a later
--     retry/reinforcement/repetition can never overwrite the primary score.
--     `finishTrainerSession` and any reporting that needs the "real" first
--     answer must read `COALESCE(first_attempt_status, status)` so legacy
--     rows (NULL here) fall back to `status` exactly as before this
--     migration — no existing session's stored score changes.
--   tasks2session.retry_used  TINYINT(1) NOT NULL DEFAULT 0
--     Flips to 1 once the one allowed Practice-mode retry has been consumed
--     (whether the retry itself was right or wrong) — never touched outside
--     that single retry check.
--   tasks2session.hint_level_unlocked  SMALLINT NOT NULL DEFAULT 0
--     How many rungs of the 3-level hint ladder (direction / rule / worked
--     example) this task has revealed so far. Enforced server-side so a
--     client can never request rung 3 before rung 1/2 — see
--     src/modules/testing/getTaskHintLevel.ts.
--   quiz_tasks.hint_direction  TEXT NULL
--   quiz_tasks.hint_rule       TEXT NULL
--     The first two rungs of the ladder. `quiz_tasks.comments` (existing
--     column) keeps being rung 3 / the post-answer explanation exactly as
--     today. A task imported before this migration has both new columns
--     NULL — getTaskHintLevel degrades that task straight to the existing
--     `comments` explanation instead of fabricating placeholder rungs.
--
-- Run once in phpMyAdmin or: mysql ... < scripts/sql/026_practice_retry_and_hint_ladder.sql
-- NOT idempotent as a whole (ADD COLUMN fails if re-run against a database
-- that already has these columns).
--
-- NOTE: written and reviewed against the column shapes verified in
-- 004/005/016, but NOT executed against a live/production MySQL instance in
-- this change — no local MySQL server was available in this environment.
-- Validate with `SHOW CREATE TABLE tasks2session;` / `quiz_tasks;` and a
-- dry run on a staging copy before applying to production.

ALTER TABLE tasks2session
  ADD COLUMN first_attempt_status SMALLINT NULL DEFAULT NULL AFTER status,
  ADD COLUMN retry_used TINYINT(1) NOT NULL DEFAULT 0 AFTER first_attempt_status,
  ADD COLUMN hint_level_unlocked SMALLINT NOT NULL DEFAULT 0 AFTER retry_used;

ALTER TABLE quiz_tasks
  ADD COLUMN hint_direction TEXT NULL AFTER comments,
  ADD COLUMN hint_rule TEXT NULL AFTER hint_direction;
