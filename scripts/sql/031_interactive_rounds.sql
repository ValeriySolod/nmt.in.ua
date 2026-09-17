CREATE TABLE IF NOT EXISTS practice_interactive_rounds (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  mode ENUM('practice', 'diagnostic') NOT NULL,
  source_round_id INT NULL,
  created_at INT UNSIGNED NOT NULL,
  completed_at INT UNSIGNED NULL,
  PRIMARY KEY (id),
  KEY idx_interactive_round_owner (user_id, completed_at),
  CONSTRAINT fk_interactive_round_source FOREIGN KEY (source_round_id)
    REFERENCES practice_interactive_rounds (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS practice_interactive_round_tasks (
  round_id INT NOT NULL,
  position SMALLINT NOT NULL,
  format ENUM('order', 'find_error', 'graph', 'matching', 'blank') NOT NULL,
  task_id INT NOT NULL,
  skipped TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (round_id, position),
  UNIQUE KEY uq_interactive_round_task (round_id, format, task_id),
  CONSTRAINT fk_interactive_round_task FOREIGN KEY (round_id)
    REFERENCES practice_interactive_rounds (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE practice_stage2_attempts
  ADD COLUMN round_id INT NOT NULL DEFAULT 0 AFTER user_id,
  DROP INDEX uq_stage2_attempt,
  ADD UNIQUE KEY uq_stage2_attempt (format, task_id, user_id, round_id);
