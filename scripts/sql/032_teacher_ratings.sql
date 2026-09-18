-- Student ratings for public teacher profiles (1–5). Safe to re-run.
-- mysql ... < scripts/sql/032_teacher_ratings.sql
-- Also created lazily by src/modules/teachers/ratingsSchema.ts

CREATE TABLE IF NOT EXISTS teacher_ratings (
  teacher_user_id INT NOT NULL,
  student_user_id INT NOT NULL,
  score TINYINT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (teacher_user_id, student_user_id),
  KEY idx_teacher_ratings_teacher (teacher_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
