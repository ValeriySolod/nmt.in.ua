-- Auth accounts for nmt.in.ua (student / teacher / admin).
-- Uses app_users to avoid colliding with a legacy `users` table on shared hosting.
-- Run once in phpMyAdmin or: mysql ... < scripts/sql/001_app_users.sql

CREATE TABLE IF NOT EXISTS app_users (
  id INT NOT NULL AUTO_INCREMENT,
  login VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NULL,
  email_verified_at TIMESTAMP NULL DEFAULT NULL,
  role ENUM('student', 'teacher', 'admin') NOT NULL,
  is_banned TINYINT(1) NOT NULL DEFAULT 0,
  last_login_at TIMESTAMP NULL DEFAULT NULL,
  last_seen_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_app_users_login (login),
  UNIQUE KEY uq_app_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Public registration inserts new rows with role='student'.
-- Promote an admin manually: node scripts/promote-admin.mjs <login>
