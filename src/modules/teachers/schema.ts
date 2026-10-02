import "server-only";
import type { SqlConnection } from "@/lib/db/mysql";

export const SQL_CREATE_TEACHER_PROFILES = `
  CREATE TABLE IF NOT EXISTS teacher_profiles (
    user_id INT NOT NULL,
    slug VARCHAR(48) NOT NULL,
    headline VARCHAR(160) NULL,
    bio TEXT NULL,
    experience VARCHAR(160) NULL,
    publications TEXT NULL,
    city VARCHAR(80) NULL,
    subjects VARCHAR(512) NULL,
    contact_url VARCHAR(500) NULL,
    is_public TINYINT(1) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id),
    UNIQUE KEY uq_teacher_profiles_slug (slug)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

async function loadDefaultConnection(): Promise<SqlConnection> {
  const { getConnection } = await import("@/lib/db/mysql");
  return getConnection();
}

let schemaReady: Promise<void> | undefined;

async function columnNames(connection: SqlConnection): Promise<Set<string>> {
  const rows = await connection.query<{
    COLUMN_NAME?: string;
    column_name?: string;
  }>(
    `SELECT COLUMN_NAME AS COLUMN_NAME
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'teacher_profiles'`,
    [],
  );
  return new Set(
    rows.map((row) => String(row.COLUMN_NAME ?? row.column_name ?? "")),
  );
}

/** Add experience / publications when the table was created before those columns. */
export async function migrateTeacherProfileLandingFields(
  connection: SqlConnection,
): Promise<void> {
  const columns = await columnNames(connection);
  if (columns.size === 0) return;

  if (!columns.has("experience")) {
    await connection.execute(
      `ALTER TABLE teacher_profiles
       ADD COLUMN experience VARCHAR(160) NULL AFTER bio`,
      [],
    );
  }
  if (!columns.has("publications")) {
    await connection.execute(
      `ALTER TABLE teacher_profiles
       ADD COLUMN publications TEXT NULL AFTER experience`,
      [],
    );
  }
}

async function runTeacherProfileSchemaMigration(
  getConnection: () => Promise<SqlConnection>,
): Promise<void> {
  const connection = await getConnection();
  try {
    await connection.execute(SQL_CREATE_TEACHER_PROFILES, []);
    await migrateTeacherProfileLandingFields(connection);
  } finally {
    connection.release();
  }
}

/** Creates `teacher_profiles` once per process if the table is missing. */
export async function ensureTeacherProfileSchema(
  getConnection: () => Promise<SqlConnection> = loadDefaultConnection,
): Promise<void> {
  if (!schemaReady) {
    schemaReady = runTeacherProfileSchemaMigration(getConnection).catch(
      (error) => {
        schemaReady = undefined;
        throw error;
      },
    );
  }
  await schemaReady;
}
