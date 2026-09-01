import type { SqlConnection } from "@/lib/db/mysql";
import { SESSION_STATUS_COMPLETED } from "@/modules/sessions/types";
import { TASK_STATUS_INCORRECT } from "./types";

const SQL_MISTAKES = `
  SELECT
    qt.name,
    qt.task_text,
    qt.comments
  FROM tasks2session t2s
  INNER JOIN task_sessions ts ON ts.id = t2s.session_id
  INNER JOIN quiz_tasks qt ON qt.id = t2s.task_id
  WHERE t2s.session_id = ?
    AND ts.user_id = ?
    AND ts.session_status = ?
    AND t2s.status = ?
  ORDER BY t2s.id ASC
`;

export type SessionMistakeItem = {
  name: string;
  taskText: string;
  comment: string;
};

type MistakeRow = {
  name: string;
  task_text: string;
  comments: string | null;
};

type GetSessionMistakeReviewDeps = {
  getConnection: () => Promise<SqlConnection>;
};

function isPositiveInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

async function loadDefaultConnection(): Promise<SqlConnection> {
  const { getConnection } = await import("@/lib/db/mysql");
  return getConnection();
}

/** Wrong/skipped tasks with comments — only for completed sessions. */
export async function getSessionMistakeReview(
  sessionId: number,
  userId: number,
  deps: GetSessionMistakeReviewDeps = { getConnection: loadDefaultConnection },
): Promise<SessionMistakeItem[]> {
  if (!isPositiveInt(sessionId) || !isPositiveInt(userId)) {
    return [];
  }

  const connection = await deps.getConnection();
  try {
    const rows = await connection.query<MistakeRow>(SQL_MISTAKES, [
      sessionId,
      userId,
      SESSION_STATUS_COMPLETED,
      TASK_STATUS_INCORRECT,
    ]);

    return rows.map((row) => ({
      name: row.name.trim(),
      taskText: row.task_text.trim(),
      comment: (row.comments ?? "").trim(),
    }));
  } finally {
    connection.release();
  }
}
