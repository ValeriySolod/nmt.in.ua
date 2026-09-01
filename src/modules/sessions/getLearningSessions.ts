import type { SqlConnection } from "@/lib/db/mysql";
import {
  buildLearningSessionRows,
  type LearningSessionRow,
} from "./types";

const SQL_LEARNING_SESSIONS = `
  SELECT
    ts.id,
    ts.theme_id,
    t.name AS theme_name,
    ts.tasks_number,
    ts.right_number,
    ts.time,
    ts.session_status,
    ts.session_type,
    ts.start_time
  FROM task_sessions ts
  INNER JOIN themes t ON t.id = ts.theme_id
  WHERE ts.user_id = ?
  ORDER BY ts.id DESC
`;

type GetLearningSessionsDeps = {
  getConnection: () => Promise<SqlConnection>;
};

async function loadDefaultConnection(): Promise<SqlConnection> {
  const { getConnection } = await import("@/lib/db/mysql");
  return getConnection();
}

export async function getLearningSessions(
  userId: number,
  deps: GetLearningSessionsDeps = { getConnection: loadDefaultConnection },
): Promise<LearningSessionRow[]> {
  const connection = await deps.getConnection();
  try {
    const rows = await connection.query<{
      id: number;
      theme_id: number;
      theme_name: string;
      tasks_number: number;
      right_number: number;
      time: number;
      session_status: number;
      session_type: number;
      start_time: number;
    }>(SQL_LEARNING_SESSIONS, [userId]);

    return buildLearningSessionRows(rows);
  } finally {
    connection.release();
  }
}

export type { LearningSessionRow } from "./types";
