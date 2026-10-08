import "server-only";
import type { SqlConnection } from "@/lib/db/mysql";
import { migrateDailyMarathon } from "./dailySchema";

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
    KEY idx_marathon_participants_user (user_id),
    CONSTRAINT fk_marathon_participants_marathon
      FOREIGN KEY (marathon_id) REFERENCES marathons (id) ON DELETE CASCADE,
    CONSTRAINT fk_marathon_participants_user
      FOREIGN KEY (user_id) REFERENCES app_users (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

async function loadDefaultConnection(): Promise<SqlConnection> {
  const { getConnection } = await import("@/lib/db/mysql");
  return getConnection();
}

let schemaReady: Promise<void> | undefined;

async function participantForeignKeys(
  connection: SqlConnection,
): Promise<Set<string>> {
  const rows = await connection.query<{
    name?: string;
    NAME?: string;
  }>(
    `SELECT CONSTRAINT_NAME AS name
     FROM information_schema.TABLE_CONSTRAINTS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'marathon_participants'
       AND CONSTRAINT_TYPE = 'FOREIGN KEY'`,
    [],
  );
  return new Set(
    rows.map((row) => String(row.name ?? row.NAME ?? "")),
  );
}

/** Tables created before the SQL file's constraints existed stay without FKs. */
async function ensureParticipantForeignKeys(
  connection: SqlConnection,
): Promise<void> {
  const names = await participantForeignKeys(connection);
  if (!names.has("fk_marathon_participants_marathon")) {
    await addParticipantForeignKey(
      connection,
      `ALTER TABLE marathon_participants
       ADD CONSTRAINT fk_marathon_participants_marathon
       FOREIGN KEY (marathon_id) REFERENCES marathons (id) ON DELETE CASCADE`,
    );
  }
  if (!names.has("fk_marathon_participants_user")) {
    await addParticipantForeignKey(
      connection,
      `ALTER TABLE marathon_participants
       ADD CONSTRAINT fk_marathon_participants_user
       FOREIGN KEY (user_id) REFERENCES app_users (id) ON DELETE CASCADE`,
    );
  }
}

function isDuplicateConstraint(error: unknown): boolean {
  const errno = (error as { errno?: number }).errno;
  return errno === 1061 || errno === 1022 || errno === 1826;
}

/** Orphan rows or a column mismatch must not take the leaderboard down. */
function isForeignKeyDataError(error: unknown): boolean {
  const errno = (error as { errno?: number }).errno;
  return errno === 1215 || errno === 1452 || errno === 1822 || errno === 3780;
}

async function addParticipantForeignKey(
  connection: SqlConnection,
  sql: string,
): Promise<void> {
  try {
    await connection.execute(sql, []);
  } catch (error) {
    if (isDuplicateConstraint(error)) return;
    if (isForeignKeyDataError(error)) {
      console.error("marathon participant foreign key was not added", error);
      return;
    }
    throw error;
  }
}

async function runMarathonSchemaMigration(
  getConnection: () => Promise<SqlConnection>,
): Promise<void> {
  const connection = await getConnection();
  try {
    await connection.execute(SQL_CREATE_MARATHONS, []);
    await connection.execute(SQL_CREATE_PARTICIPANTS, []);
    await ensureParticipantForeignKeys(connection);
    await migrateDailyMarathon(connection);
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

/** Active rows past ends_at stop accepting joins and disappear from the board. */
export async function closeExpiredMarathons(
  getConnection: () => Promise<SqlConnection> = loadDefaultConnection,
): Promise<void> {
  await ensureMarathonSchema(getConnection);
  const connection = await getConnection();
  try {
    const now = Math.floor(Date.now() / 1000);
    await connection.execute(
      `UPDATE marathons SET status = 'archived'
       WHERE status = 'active' AND ends_at <= ? AND kind = 'leaderboard'`,
      [now],
    );
  } finally {
    connection.release();
  }
}
