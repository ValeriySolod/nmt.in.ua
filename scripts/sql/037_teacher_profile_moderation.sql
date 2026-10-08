-- Teacher profile application fields and moderation workflow.
--
-- Flow:
--   draft -> pending -> approved | rejected
-- An approved teacher stays approved after later profile edits.
-- Verification document uploads are intentionally out of scope here.
--
-- Existing public profiles are treated as already approved so this migration
-- does not unexpectedly hide teacher cards that are currently public.

ALTER TABLE teacher_profiles
  ADD COLUMN phone VARCHAR(32) NULL AFTER contact_url,
  ADD COLUMN country VARCHAR(80) NULL AFTER city,
  ADD COLUMN teaching_levels VARCHAR(512) NULL AFTER subjects,
  ADD COLUMN teaching_languages VARCHAR(512) NULL AFTER teaching_levels,
  ADD COLUMN lesson_price DECIMAL(12,2) NULL AFTER teaching_languages,
  ADD COLUMN lesson_currency CHAR(3) NULL AFTER lesson_price,
  ADD COLUMN lesson_duration_minutes SMALLINT UNSIGNED NULL AFTER lesson_currency,
  ADD COLUMN join_motivation TEXT NULL AFTER lesson_duration_minutes,
  ADD COLUMN moderation_status ENUM(
    'draft',
    'pending',
    'approved',
    'rejected'
  ) NOT NULL DEFAULT 'draft' AFTER join_motivation,
  ADD COLUMN submitted_at TIMESTAMP NULL DEFAULT NULL AFTER moderation_status,
  ADD COLUMN reviewed_at TIMESTAMP NULL DEFAULT NULL AFTER submitted_at,
  ADD COLUMN reviewed_by INT NULL AFTER reviewed_at,
  ADD COLUMN rejection_reason VARCHAR(1000) NULL AFTER reviewed_by,
  ADD KEY idx_teacher_profiles_moderation_status (moderation_status);

UPDATE teacher_profiles
SET moderation_status = 'approved'
WHERE is_public = 1;