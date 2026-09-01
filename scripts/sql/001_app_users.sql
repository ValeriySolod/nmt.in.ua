-- Auth accounts for nmt.in.ua (student / teacher / admin).
-- Uses app_users to avoid colliding with a legacy `users` table on shared hosting.
-- Run once in phpMyAdmin or: mysql ... < scripts/sql/001_app_users.sql

CREATE TABLE IF NOT EXISTS app_users (
  id INT NOT NULL AUTO_INCREMENT,
  login VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  role ENUM('student', 'teacher', 'admin') NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_app_users_login (login)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Demo accounts (password for all: demo123) are seeded by ensureAuthSchema() in the app.
-- IDs 1–3 align with task_sessions.user_id used in existing data.
