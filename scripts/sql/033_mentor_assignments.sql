-- Teacher topic-test assignments (multi-student + due_at). Safe to re-run.
-- Requires app_users, themes, task_sessions.
-- mysql ... < scripts/sql/033_mentor_assignments.sql
--
-- Lazy create: src/modules/mentor-assignments/schema.ts::ensureMentorAssignmentsSchema

CREATE TABLE IF NOT EXISTS mentor_assignments (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  teacher_user_id INT NOT NULL,
  theme_id INT NOT NULL,
  tasks_number INT UNSIGNED NOT NULL DEFAULT 10,
  available_at INT UNSIGNED NOT NULL,
  due_at INT UNSIGNED NOT NULL,
  schedule_mode ENUM('now', 'datetime') NOT NULL DEFAULT 'now',
  status ENUM('active', 'cancelled') NOT NULL DEFAULT 'active',
  created_at INT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  KEY idx_mentor_assignments_teacher_status (teacher_user_id, status),
  KEY idx_mentor_assignments_theme (theme_id),
  CONSTRAINT fk_mentor_assignments_teacher
    FOREIGN KEY (teacher_user_id) REFERENCES app_users (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_mentor_assignments_theme
    FOREIGN KEY (theme_id) REFERENCES themes (id)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mentor_assignment_members (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  assignment_id INT UNSIGNED NOT NULL,
  student_user_id INT NOT NULL,
  session_id INT UNSIGNED NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_mentor_assignment_member (assignment_id, student_user_id),
  KEY idx_mentor_assignment_members_student (student_user_id),
  KEY idx_mentor_assignment_members_session (session_id),
  CONSTRAINT fk_mentor_assignment_members_assignment
    FOREIGN KEY (assignment_id) REFERENCES mentor_assignments (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_mentor_assignment_members_student
    FOREIGN KEY (student_user_id) REFERENCES app_users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
