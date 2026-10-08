import "server-only";
import type { SqlConnection } from "@/lib/db/mysql";

const SQL_CREATE_MARATHONS = `
  CREATE TABLE IF NOT EXISTS marathons (
    id INT NOT NULL AUTO_INCREMENT,
    slug VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    status ENUM('draft', 'active', 'archived') NOT NULL DEFAULT 'draft',
    starts_at INT UNSIGNED NOT NULL,
    ends_at INT UNSIGNED NOT NULL,
    min_tasks_per_session INT UNSIGNED NOT NULL DEFAULT 5,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_marathons_slug (slug),
    KEY idx_marathons_status (status, starts_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

const SQL_CREATE_PARTICIPANTS = `
  CREATE TABLE IF NOT EXISTS marathon_participants (
    marathon_id INT NOT NULL,
    user_id INT NOT NULL,
    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (marathon_id, user_id),
    KEY idx_marathon_participants_user (user_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

async function loadDefaultConnection(): Promise<SqlConnection> {
  const { getConnection } = await import("@/lib/db/mysql");
  return getConnection();
}

let schemaReady: Promise<void> | undefined;

async function seedPilotMarathon(connection: SqlConnection): Promise<void> {
  const rows = await connection.query<{ count: number }>(
    `SELECT COUNT(*) AS count FROM marathons`,
    [],
  );
  if ((rows[0]?.count ?? 0) > 0) return;

  const now = Math.floor(Date.now() / 1000);
  const startsAt = now - 30 * 24 * 60 * 60;
  const endsAt = now + 60 * 24 * 60 * 60;

  await connection.execute(
    `INSERT INTO marathons (
      slug, title, description, status, starts_at, ends_at, min_tasks_per_session
    ) VALUES (?, ?, ?, 'active', ?, ?, 5)`,
    [
      "pilot",
      "Пілотний марафон",
      "Тимчасовий марафон для лідерборду. Правила денних порцій додамо після узгодження з PM.",
      startsAt,
      endsAt,
    ],
  );
}

async function runMarathonSchemaMigration(
  getConnection: () => Promise<SqlConnection>,
): Promise<void> {
  const connection = await getConnection();
  try {
    await connection.execute(SQL_CREATE_MARATHONS, []);
    await connection.execute(SQL_CREATE_PARTICIPANTS, []);
    await seedPilotMarathon(connection);
  } finally {
    connection.release();
  }
}

export async function ensureMarathonSchema(
  getConnection: () => Promise<SqlConnection> = loadDefaultConnection,
): Promise<void> {
  if (!schemaReady) {
    schemaReady = runMarathonSchemaMigration(getConnection).catch((error) => {
      schemaReady = undefined;
      throw error;
    });
  }
  await schemaReady;
}
