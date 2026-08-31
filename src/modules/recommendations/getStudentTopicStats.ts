import type { SqlConnection } from "@/lib/db/mysql";
import type { SessionRow, ThemeRow } from "@/modules/results/types";
import { DEMO_USER_ID, SESSION_STATUS_COMPLETED } from "@/modules/sessions/types";

import { buildStudentTopicStats, type StudentTopicStats } from "./types";

const SQL_THEMES_WITH_COMPLETED_SESSIONS = `
  SELECT
    t.id AS theme_id,
    t.name AS theme_name,
    t.ord AS theme_ord,
    s.id AS session_id,
    s.tasks_number AS tasks_number,
    s.right_number AS right_number,
    s.time AS time
  FROM themes t
  LEFT JOIN task_sessions s
    ON s.theme_id = t.id
   AND s.user_id = ?
   AND s.session_status = ?
  ORDER BY t.ord ASC, t.id ASC, s.id DESC
`;

type ThemeSessionJoinRow = {
  theme_id: number;
  theme_name: string;
  theme_ord: number;
  session_id: number | null;
  tasks_number: number | null;
  right_number: number | null;
  time: number | null;
};

type GetStudentTopicStatsDeps = {
  getConnection: () => Promise<SqlConnection>;
};

async function loadDefaultConnection(): Promise<SqlConnection> {
  const { getConnection } = await import("@/lib/db/mysql");
  return getConnection();
}

/** Per-theme recommendation stats for a student, including themes with no completed sessions. */
export async function getStudentTopicStats(
  userId: number = DEMO_USER_ID,
  deps: GetStudentTopicStatsDeps = { getConnection: loadDefaultConnection },
): Promise<StudentTopicStats> {
  const connection = await deps.getConnection();
  try {
    const rows = await connection.query<ThemeSessionJoinRow>(
      SQL_THEMES_WITH_COMPLETED_SESSIONS,
      [userId, SESSION_STATUS_COMPLETED],
    );

    const themesById = new Map<number, ThemeRow>();
    const sessions: SessionRow[] = [];
    for (const row of rows) {
      if (!themesById.has(row.theme_id)) {
        themesById.set(row.theme_id, {
          id: row.theme_id,
          name: row.theme_name,
          ord: row.theme_ord,
        });
      }
      if (row.session_id !== null) {
        sessions.push({
          id: row.session_id,
          theme_id: row.theme_id,
          tasks_number: row.tasks_number ?? 0,
          right_number: row.right_number ?? 0,
          time: row.time ?? 0,
        });
      }
    }

    return buildStudentTopicStats(Array.from(themesById.values()), sessions);
  } finally {
    connection.release();
  }
}
