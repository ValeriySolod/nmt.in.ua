-- Marathon-only cabinet and post-submit task review.
-- Runtime path is ensureAuthSchema (cabinet_scope) and migrateDailyMarathon
-- (task explanation, stored answers, backfill). Re-running ADD COLUMN fails
-- with errno 1060; the lazy migrator ignores that.

ALTER TABLE app_users
  ADD COLUMN cabinet_scope ENUM('full', 'marathon') NOT NULL DEFAULT 'full' AFTER role;

ALTER TABLE marathon_day_tasks
  ADD COLUMN inline_explanation TEXT NULL AFTER inline_correct;

ALTER TABLE marathon_day_progress
  ADD COLUMN answers_json TEXT NULL AFTER completed_at;

-- Students who only joined a daily marathon, never converted, and have no
-- topic-test sessions. A platform student with sessions stays `full`.
UPDATE app_users u
SET u.cabinet_scope = 'marathon'
WHERE u.role = 'student'
  AND u.cabinet_scope = 'full'
  AND EXISTS (
    SELECT 1 FROM marathon_participants p
    INNER JOIN marathons m ON m.id = p.marathon_id
    WHERE p.user_id = u.id AND m.kind = 'daily'
  )
  AND NOT EXISTS (
    SELECT 1 FROM marathon_participants p
    WHERE p.user_id = u.id AND p.converted_at IS NOT NULL
  )
  AND NOT EXISTS (
    SELECT 1 FROM task_sessions s WHERE s.user_id = u.id
  );
