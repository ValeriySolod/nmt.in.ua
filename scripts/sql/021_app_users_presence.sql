-- Presence timestamps for online/offline + last login (admin).
-- Lazy-applied by ensureAuthSchema(); safe to run manually once.

ALTER TABLE app_users
  ADD COLUMN last_login_at TIMESTAMP NULL DEFAULT NULL AFTER is_banned,
  ADD COLUMN last_seen_at TIMESTAMP NULL DEFAULT NULL AFTER last_login_at;
