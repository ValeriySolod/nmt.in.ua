import type { SqlConnection } from "@/lib/db/mysql";
import {
  DEMO_USER_ID,
  SESSION_STATUS_COMPLETED,
  sessionPercent,
} from "@/modules/sessions/types";

export type RecentResultItem = {
  sessionId: number;
  topic: string;
  score: number;
};

const SQL_RECENT_RESULTS = `
  SELECT
    ts.id,
    t.name AS theme_name,
    ts.tasks_number,
    ts.right_number
  FROM task_sessions ts
  INNER JOIN themes t ON t.id = ts.theme_id
  WHERE ts.user_id = ?
    AND ts.session_status = ?
  ORDER BY ts.id DESC
  LIMIT ?
`;

type RecentResultRow = {
  id: number;
  theme_name: string;
  tasks_number: number;
  right_number: number;
};

type GetRecentResultsDeps = {
  getConnection: () => Promise<SqlConnection>;
};

async function loadDefaultConnection(): Promise<SqlConnection> {
  const { getConnection } = await import("@/lib/db/mysql");
  return getConnection();
}

/** Last N completed sessions for the sidebar «Останні результати». */
export async function getRecentResults(
  userId: number = DEMO_USER_ID,
  limit: number = 4,
  deps: GetRecentResultsDeps = { getConnection: loadDefaultConnection },
): Promise<RecentResultItem[]> {
  const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 4;

  const connection = await deps.getConnection();
  try {
    const rows = await connection.query<RecentResultRow>(SQL_RECENT_RESULTS, [
      userId,
      SESSION_STATUS_COMPLETED,
      safeLimit,
    ]);

    return rows.map((row) => ({
      sessionId: row.id,
      topic: row.theme_name.trim(),
      score: Math.round(
        sessionPercent(row.tasks_number, row.right_number) ?? 0,
      ),
    }));
  } finally {
    connection.release();
  }
}
