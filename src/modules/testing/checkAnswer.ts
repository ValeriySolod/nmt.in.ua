import type { SqlConnection } from "@/lib/db/mysql";
import { SESSION_STATUS_COMPLETED } from "@/modules/sessions/types";
import {
  TASK_STATUS_CORRECT,
  TASK_STATUS_INCORRECT,
  TASK_STATUS_UNANSWERED,
} from "./types";

export {
  TASK_STATUS_CORRECT,
  TASK_STATUS_INCORRECT,
  TASK_STATUS_UNANSWERED,
} from "./types";

const SQL_SELECT_MAPPING = `
  SELECT
    t2s.id,
    t2s.session_id,
    t2s.status,
    t2s.user_id,
    qt.right_answer_n,
    ts.session_status
  FROM tasks2session t2s
  INNER JOIN quiz_tasks qt ON qt.id = t2s.task_id
  INNER JOIN task_sessions ts ON ts.id = t2s.session_id
  WHERE t2s.id = ? AND t2s.session_id = ? AND t2s.user_id = ?
  FOR UPDATE
`;

const SQL_UPDATE_STATUS = "UPDATE tasks2session SET status = ? WHERE id = ?";

export type AnswerNumber = 1 | 2 | 3 | 4;

export type CheckAnswerInput = {
  userId: number;
  sessionId: number;
  mappingId: number;
  answerNumber: AnswerNumber;
};

export type CheckAnswerResult = {
  correct: boolean;
};

export type CheckAnswerErrorCode =
  | "invalid_input"
  | "not_found"
  | "session_completed"
  | "db_error";

export class CheckAnswerError extends Error {
  constructor(
    message: string,
    public readonly code: CheckAnswerErrorCode,
  ) {
    super(message);
    this.name = "CheckAnswerError";
  }
}

type CheckAnswerDeps = {
  getConnection: () => Promise<SqlConnection>;
};

type MappingRow = {
  id: number;
  session_id: number;
  status: number;
  user_id: number;
  right_answer_n: number;
  session_status: number;
};

function isPositiveInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isAnswerNumber(value: unknown): value is AnswerNumber {
  return value === 1 || value === 2 || value === 3 || value === 4;
}

export function validateCheckAnswerInput(input: unknown): CheckAnswerInput {
  if (typeof input !== "object" || input === null) {
    throw new CheckAnswerError(
      "Request payload must be an object.",
      "invalid_input",
    );
  }
  const { userId, sessionId, mappingId, answerNumber } = input as Record<
    string,
    unknown
  >;
  if (
    !isPositiveInt(userId) ||
    !isPositiveInt(sessionId) ||
    !isPositiveInt(mappingId) ||
    !isAnswerNumber(answerNumber)
  ) {
    throw new CheckAnswerError(
      "sessionId, mappingId must be positive integers and answerNumber must be 1–4.",
      "invalid_input",
    );
  }
  return { userId, sessionId, mappingId, answerNumber };
}

function resultFromStatus(status: number): CheckAnswerResult {
  return { correct: status === TASK_STATUS_CORRECT };
}

async function loadDefaultConnection(): Promise<SqlConnection> {
  const { getConnection } = await import("@/lib/db/mysql");
  return getConnection();
}

/**
 * Compares the chosen option with `quiz_tasks.right_answer_n` and writes
 * `tasks2session.status` (`1` correct / `-1` incorrect). Already-answered
 * rows are returned as-is (no second UPDATE). The result never includes
 * `right_answer_n`.
 */
export async function checkAnswer(
  rawInput: unknown,
  deps: CheckAnswerDeps = { getConnection: loadDefaultConnection },
): Promise<CheckAnswerResult> {
  const input = validateCheckAnswerInput(rawInput);

  try {
    const connection = await deps.getConnection();
    try {
      await connection.beginTransaction();

      const rows = await connection.query<MappingRow>(SQL_SELECT_MAPPING, [
        input.mappingId,
        input.sessionId,
        input.userId,
      ]);
      const row = rows[0];

      if (!row) {
        await connection.rollback();
        throw new CheckAnswerError(
          "Task mapping was not found in this session.",
          "not_found",
        );
      }

      if (row.status !== TASK_STATUS_UNANSWERED) {
        await connection.commit();
        return resultFromStatus(row.status);
      }

      if (row.session_status === SESSION_STATUS_COMPLETED) {
        await connection.rollback();
        throw new CheckAnswerError(
          "This session is already completed.",
          "session_completed",
        );
      }

      const status =
        input.answerNumber === row.right_answer_n
          ? TASK_STATUS_CORRECT
          : TASK_STATUS_INCORRECT;

      const updated = await connection.execute(SQL_UPDATE_STATUS, [
        status,
        row.id,
      ]);
      if (updated.affectedRows !== 1) {
        await connection.rollback();
        throw new CheckAnswerError(
          "Failed to store the answer status.",
          "db_error",
        );
      }

      await connection.commit();
      return resultFromStatus(status);
    } catch (error) {
      if (!(error instanceof CheckAnswerError)) {
        await connection.rollback().catch(() => undefined);
      }
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    if (error instanceof CheckAnswerError) {
      throw error;
    }
    console.error("checkAnswer: unexpected database error", error);
    throw new CheckAnswerError("Database operation failed.", "db_error");
  }
}
