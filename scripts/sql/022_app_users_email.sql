-- Email for registration + future verify/reset.
-- Lazy-applied by ensureAuthSchema(); safe to run manually once.
-- Multiple NULLs allowed (demo / legacy accounts).

ALTER TABLE app_users
  ADD COLUMN email VARCHAR(255) NULL DEFAULT NULL AFTER display_name,
  ADD COLUMN email_verified_at TIMESTAMP NULL DEFAULT NULL AFTER email,
  ADD UNIQUE KEY uq_app_users_email (email);
