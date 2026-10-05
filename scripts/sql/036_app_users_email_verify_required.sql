-- Public self-signup sets email_verify_required = 1 and cannot sign in
-- until email_verified_at is set. Existing rows and teacher-created students
-- stay at 0: they can sign in, and an unverified email only shows a banner.
-- Lazy twin: ensureAuthSchema() in src/modules/auth/users.ts.

ALTER TABLE app_users
  ADD COLUMN email_verify_required TINYINT(1) NOT NULL DEFAULT 0
  AFTER email_verified_at;
