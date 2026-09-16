-- Ban flag for admin account management.
-- Lazy-applied by ensureAuthSchema(); safe to run manually once.

ALTER TABLE app_users
  ADD COLUMN is_banned TINYINT(1) NOT NULL DEFAULT 0 AFTER role;
