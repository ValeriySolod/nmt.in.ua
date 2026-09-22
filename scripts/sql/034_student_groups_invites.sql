-- Student groups and reusable invite codes. Safe to re-run.
-- Requires app_users (001) and teacher_students (017).
-- mysql ... < scripts/sql/034_student_groups_invites.sql
--
-- Lazy create: src/modules/teacher-students/schema.ts::ensureTeacherStudentsSchema
-- (same statements, after teacher_students).
--
-- Rules:
-- * Personal invite (kind = personal, group_id NULL): redeem links the student
--   to that teacher only. Existing group membership is left as-is.
-- * Group invite (kind = group, group_id set): redeem links the student to the
--   teacher and places them in that group.
-- * At most one group per teacher: PRIMARY KEY (teacher_user_id, student_user_id)
--   on student_group_members. Moving groups deletes the old row and inserts
--   the new one in one transaction.
-- * Codes are reusable until expires_at (14 days from creation) or until the
--   teacher generates a replacement (previous row gets revoked_at).
-- * Deleting a group removes memberships and that group's invites. The
--   teacher_students link stays.

CREATE TABLE IF NOT EXISTS student_groups (
  id INT NOT NULL AUTO_INCREMENT,
  teacher_user_id INT NOT NULL,
  name VARCHAR(80) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_student_groups_teacher_name (teacher_user_id, name),
  UNIQUE KEY uq_student_groups_id_teacher (id, teacher_user_id),
  CONSTRAINT fk_student_groups_teacher
    FOREIGN KEY (teacher_user_id) REFERENCES app_users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS student_group_members (
  teacher_user_id INT NOT NULL,
  student_user_id INT NOT NULL,
  group_id INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (teacher_user_id, student_user_id),
  KEY idx_student_group_members_group (group_id),
  CONSTRAINT fk_student_group_members_roster
    FOREIGN KEY (teacher_user_id, student_user_id)
    REFERENCES teacher_students (teacher_user_id, student_user_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_student_group_members_group
    FOREIGN KEY (group_id, teacher_user_id)
    REFERENCES student_groups (id, teacher_user_id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS student_invites (
  id INT NOT NULL AUTO_INCREMENT,
  teacher_user_id INT NOT NULL,
  kind ENUM('personal', 'group') NOT NULL,
  group_id INT NULL,
  code VARCHAR(16) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_student_invites_code (code),
  KEY idx_student_invites_teacher (teacher_user_id, kind, revoked_at),
  KEY idx_student_invites_group (group_id),
  CONSTRAINT fk_student_invites_teacher
    FOREIGN KEY (teacher_user_id) REFERENCES app_users (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_student_invites_group
    FOREIGN KEY (group_id) REFERENCES student_groups (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
