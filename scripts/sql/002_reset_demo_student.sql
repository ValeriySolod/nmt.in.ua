-- Скинути сесії та результати демо-учня (app_users.id = 1, login demo-student).
-- Усі старі тести до auth писалися з user_id = 1, тому вони «прилипли» до цього акаунта.
-- Запуск: phpMyAdmin → SQL, або mysql ... < scripts/sql/002_reset_demo_student.sql

SET @demo_user_id = 1;

START TRANSACTION;

DELETE FROM tasks2session WHERE user_id = @demo_user_id;
DELETE FROM task_sessions WHERE user_id = @demo_user_id;

COMMIT;

-- Перевірка (має бути 0):
-- SELECT COUNT(*) FROM task_sessions WHERE user_id = 1;
-- SELECT COUNT(*) FROM tasks2session WHERE user_id = 1;
