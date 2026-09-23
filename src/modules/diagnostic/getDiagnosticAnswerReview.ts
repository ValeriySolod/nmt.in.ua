import type { SqlConnection } from "@/lib/db/mysql";
import { SESSION_STATUS_COMPLETED } from "@/modules/sessions/types";
import { TASK_STATUS_CORRECT } from "@/modules/testing/types";
import { isValidOwner, ownerClause, ownerParams, type SessionOwner } from "./sessionOwner";

const SESSION_TYPE_DIAGNOSTIC = 5;

const SQL_ANSWER_REVIEW = `
  SELECT
    t2s.id AS mapping_id,
    t2s.status AS task_status,
    qt.name AS task_name,
    qt.task_text,
    qt.answer_1,
    qt.answer_2,
    qt.answer_3,
    qt.answer_4,
    qt.right_answer_n,
    qt.comments
  FROM tasks2session t2s
  INNER JOIN task_sessions ts ON ts.id = t2s.session_id
  INNER JOIN quiz_tasks qt ON qt.id = t2s.task_id
  WHERE t2s.session_id = ?
    AND ts.session_type = ${SESSION_TYPE_DIAGNOSTIC}
    AND ts.session_status = ?
    AND ${ownerClause("ts")}
  ORDER BY t2s.id ASC
`;

export type DiagnosticAnswerReviewItem = {
  mappingId: number;
  name: string;
  taskText: string;
  correct: boolean;
  correctAnswerNumber: number | null;
  correctAnswerText: string | null;
  explanation: string | null;
};

type AnswerReviewRow = {
  mapping_id: number;
  task_status: number;
  task_name: string;
  task_text: string;
  answer_1: string;
  answer_2: string;
  answer_3: string;
  answer_4: string;
  right_answer_n: number;
  comments: string | null;
};

type GetDiagnosticAnswerReviewDeps = {
  getConnection: () => Promise<SqlConnection>;
};

function mapRow(row: AnswerReviewRow): DiagnosticAnswerReviewItem {
  const answers = [row.answer_1, row.answer_2, row.answer_3, row.answer_4];
  const validAnswerNumber = Number.isInteger(row.right_answer_n) &&
    row.right_answer_n >= 1 && row.right_answer_n <= 4;

  return {
    mappingId: row.mapping_id,
    name: row.task_name.trim(),
    taskText: row.task_text.trim(),
    correct: row.task_status === TASK_STATUS_CORRECT,
    correctAnswerNumber: validAnswerNumber ? row.right_answer_n : null,
    correctAnswerText: validAnswerNumber
      ? answers[row.right_answer_n - 1]!.trim()
      : null,
    explanation: row.comments?.trim() || null,
  };
}

async function loadDefaultConnection(): Promise<SqlConnection> {
  const { getConnection } = await import("@/lib/db/mysql");
  return getConnection();
}

export async function getDiagnosticAnswerReview(
  sessionId: unknown,
  owner: SessionOwner,
  deps: GetDiagnosticAnswerReviewDeps = { getConnection: loadDefaultConnection },
): Promise<DiagnosticAnswerReviewItem[]> {
  if (
    typeof sessionId !== "number" ||
    !Number.isInteger(sessionId) ||
    sessionId <= 0 ||
    !isValidOwner(owner)
  ) {
    return [];
  }

  const connection = await deps.getConnection();
  try {
    const rows = await connection.query<AnswerReviewRow>(SQL_ANSWER_REVIEW, [
      sessionId,
      SESSION_STATUS_COMPLETED,
      ...ownerParams(owner),
    ]);
    return rows.map(mapRow);
  } finally {
    connection.release();
  }
}
