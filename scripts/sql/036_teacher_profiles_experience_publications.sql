-- Optional experience + publications on public teacher cards (landing / візитка).
-- Also applied lazily by src/modules/teachers/schema.ts.
-- Run once in phpMyAdmin or: mysql ... < scripts/sql/036_teacher_profiles_experience_publications.sql

ALTER TABLE teacher_profiles
  ADD COLUMN experience VARCHAR(160) NULL AFTER bio,
  ADD COLUMN publications TEXT NULL AFTER experience;
