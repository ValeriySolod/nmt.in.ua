-- Daily math marathon (card 8.4) on top of 038_marathons_leaderboard.
-- Runtime path is migrateDailyMarathon() inside ensureMarathonSchema: it adds
-- missing columns and CREATE TABLE IF NOT EXISTS. This file is the same shape
-- for a one-shot apply on a database that already has `marathons`.
-- Re-running ADD COLUMN fails with errno 1060; the lazy migrator ignores that.

ALTER TABLE marathons
  ADD COLUMN kind ENUM('leaderboard', 'daily') NOT NULL DEFAULT 'leaderboard' AFTER status,
  ADD COLUMN subject VARCHAR(64) NOT NULL DEFAULT 'math' AFTER title,
  ADD COLUMN start_date CHAR(10) NULL AFTER subject,
  ADD COLUMN unlock_hour CHAR(5) NOT NULL DEFAULT '09:00' AFTER start_date,
  ADD COLUMN days_count TINYINT UNSIGNED NOT NULL DEFAULT 5 AFTER unlock_hour,
  ADD COLUMN pass_threshold TINYINT UNSIGNED NOT NULL DEFAULT 60 AFTER days_count,
  ADD COLUMN final_cta_text VARCHAR(500) NULL AFTER pass_threshold,
  ADD COLUMN final_cta_url VARCHAR(500) NULL AFTER final_cta_text;

ALTER TABLE marathons
  MODIFY COLUMN status ENUM('draft', 'active', 'archived', 'finished')
  NOT NULL DEFAULT 'draft';

ALTER TABLE marathon_participants
  ADD COLUMN source VARCHAR(512) NULL AFTER joined_at,
  ADD COLUMN streak SMALLINT UNSIGNED NOT NULL DEFAULT 0 AFTER source,
  ADD COLUMN finished_at TIMESTAMP NULL DEFAULT NULL AFTER streak,
  ADD COLUMN converted_at TIMESTAMP NULL DEFAULT NULL AFTER finished_at,
  ADD COLUMN telegram_chat_id BIGINT NULL AFTER converted_at,
  ADD COLUMN notify_email TINYINT(1) NOT NULL DEFAULT 1 AFTER telegram_chat_id,
  ADD COLUMN notify_bot TINYINT(1) NOT NULL DEFAULT 0 AFTER notify_email;

CREATE TABLE IF NOT EXISTS marathon_riddles (
  id INT NOT NULL AUTO_INCREMENT,
  marathon_id INT NOT NULL,
  sort_order INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  answer VARCHAR(512) NOT NULL,
  hint TEXT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_marathon_riddle_order (marathon_id, sort_order),
  KEY idx_marathon_riddle (marathon_id),
  CONSTRAINT fk_marathon_riddle FOREIGN KEY (marathon_id) REFERENCES marathons (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS marathon_days (
  id INT NOT NULL AUTO_INCREMENT,
  marathon_id INT NOT NULL,
  day_number TINYINT UNSIGNED NOT NULL,
  topic VARCHAR(255) NOT NULL,
  intro_text TEXT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_marathon_day_number (marathon_id, day_number),
  CONSTRAINT fk_marathon_day FOREIGN KEY (marathon_id) REFERENCES marathons (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS marathon_day_materials (
  id INT NOT NULL AUTO_INCREMENT,
  day_id INT NOT NULL,
  sort_order INT NOT NULL,
  material_type ENUM('loom', 'youtube', 'text') NOT NULL,
  url_or_body MEDIUMTEXT NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_marathon_material_order (day_id, sort_order),
  CONSTRAINT fk_marathon_material_day FOREIGN KEY (day_id) REFERENCES marathon_days (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS marathon_day_tasks (
  id INT NOT NULL AUTO_INCREMENT,
  day_id INT NOT NULL,
  sort_order INT NOT NULL,
  question_id INT NULL,
  inline_prompt TEXT NULL,
  inline_options TEXT NULL,
  inline_correct TINYINT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_marathon_task_order (day_id, sort_order),
  KEY idx_marathon_task_question (question_id),
  CONSTRAINT fk_marathon_task_day FOREIGN KEY (day_id) REFERENCES marathon_days (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS marathon_day_progress (
  marathon_id INT NOT NULL,
  user_id INT NOT NULL,
  day_id INT NOT NULL,
  materials_viewed_at TIMESTAMP NULL DEFAULT NULL,
  score TINYINT UNSIGNED NULL,
  passed TINYINT(1) NOT NULL DEFAULT 0,
  completed_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (marathon_id, user_id, day_id),
  CONSTRAINT fk_marathon_progress_participant FOREIGN KEY (marathon_id, user_id)
    REFERENCES marathon_participants (marathon_id, user_id) ON DELETE CASCADE,
  CONSTRAINT fk_marathon_progress_day FOREIGN KEY (day_id)
    REFERENCES marathon_days (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS marathon_notifications (
  marathon_id INT NOT NULL,
  user_id INT NOT NULL,
  day_number TINYINT UNSIGNED NOT NULL,
  kind ENUM('day_open', 'reminder') NOT NULL,
  channel ENUM('email', 'telegram') NOT NULL,
  sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (marathon_id, user_id, day_number, kind, channel)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS marathon_bot_links (
  id INT NOT NULL AUTO_INCREMENT,
  marathon_id INT NOT NULL,
  user_id INT NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  consumed_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_marathon_bot_token (token_hash),
  KEY idx_marathon_bot_user (marathon_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
