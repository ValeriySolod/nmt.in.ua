import type { SqlConnection } from "@/lib/db/mysql";

const SQL_CREATE = `
  CREATE TABLE IF NOT EXISTS diagnostic_session_self_scores (
    session_id INT NOT NULL,
    theme_id INT NOT NULL,
    score TINYINT NOT NULL,
    topic_number TINYINT NOT NULL,
    PRIMARY KEY (session_id, theme_id),
    UNIQUE KEY idx_diagnostic_score_order (session_id, topic_number)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

const SQL_SELECT = `
  SELECT theme_id, score FROM diagnostic_session_self_scores
  WHERE session_id = ? ORDER BY topic_number ASC
`;

const SQL_INSERT = `
  INSERT INTO diagnostic_session_self_scores (session_id, theme_id, score, topic_number)
  VALUES (?, ?, ?, ?)
`;

export type DiagnosticSelfScore = { themeId: number; score: number };

let schemaReady: Promise<void> | undefined;

export async function ensureDiagnosticSelfScoreSchema(
  getConnection: () => Promise<SqlConnection>,
): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const connection = await getConnection();
      try {
        await connection.execute(SQL_CREATE);
      } finally {
        connection.release();
      }
    })().catch((error) => {
      schemaReady = undefined;
      throw error;
    });
  }
  await schemaReady;
}

export async function loadDiagnosticSelfScores(
  connection: SqlConnection,
  sessionId: number,
): Promise<DiagnosticSelfScore[]> {
  const rows = await connection.query<{ theme_id: number; score: number }>(
    SQL_SELECT,
    [sessionId],
  );
  return rows.map((row) => ({ themeId: row.theme_id, score: row.score }));
}

export async function insertDiagnosticSelfScore(
  connection: SqlConnection,
  sessionId: number,
  themeId: number,
  score: number,
  topicNumber: number,
): Promise<boolean> {
  const result = await connection.execute(SQL_INSERT, [
    sessionId,
    themeId,
    score,
    topicNumber,
  ]);
  return result.affectedRows === 1;
}
