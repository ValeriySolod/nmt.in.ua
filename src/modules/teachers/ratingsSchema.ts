import "server-only";
import type { SqlConnection } from "@/lib/db/mysql";

export const SQL_CREATE_TEACHER_RATINGS = `
  CREATE TABLE IF NOT EXISTS teacher_ratings (
    teacher_user_id INT NOT NULL,
    student_user_id INT NOT NULL,
    score TINYINT NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (teacher_user_id, student_user_id),
    KEY idx_teacher_ratings_teacher (teacher_user_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

async function loadDefaultConnection(): Promise<SqlConnection> {
  const { getConnection } = await import("@/lib/db/mysql");
  return getConnection();
}

let schemaReady: Promise<void> | undefined;

async function runTeacherRatingsSchemaMigration(
  getConnection: () => Promise<SqlConnection>,
): Promise<void> {
  const connection = await getConnection();
  try {
    await connection.execute(SQL_CREATE_TEACHER_RATINGS, []);
  } finally {
    connection.release();
  }
}

/** Creates `teacher_ratings` once per process if the table is missing. */
export async function ensureTeacherRatingsSchema(
  getConnection: () => Promise<SqlConnection> = loadDefaultConnection,
): Promise<void> {
  if (!schemaReady) {
    schemaReady = runTeacherRatingsSchemaMigration(getConnection).catch(
      (error) => {
        schemaReady = undefined;
        throw error;
      },
    );
  }
  await schemaReady;
}
