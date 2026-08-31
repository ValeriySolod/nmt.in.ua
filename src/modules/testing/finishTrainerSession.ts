import type { SqlConnection } from "@/lib/db/mysql";
import {
  SESSION_STATUS_COMPLETED,
  sessionPercent,
} from "@/modules/sessions/types";
import { TASK_STATUS_CORRECT, TASK_STATUS_UNANSWERED } from "./types";
import type { TrainerSessionSummary } from "./types";

const SQL_SELECT_SESSION = `
  SELECT
    ts.id,
    ts.user_id,
    ts.theme_id,
    ts.tasks_number,
    ts.right_number,
    ts.time,
    ts.session_status,
    t.name AS theme_name
  FROM task_sessions ts
  INNER JOIN themes t ON t.id = ts.theme_id
  WHERE ts.id = ? AND ts.user_id = ?
  FOR UPDATE
`;

const SQL_SELECT_STATUSES = `
  SELECT status
  FROM tasks2session
  WHERE session_id = ? AND user_id = ?
  FOR UPDATE
`;

const SQL_UPDATE_SESSION = `
  UPDATE task_sessions
  SET right_number = ?, tasks_number = ?, session_status = ?
  WHERE id = ?
`;

export type FinishTrainerSessionInput = {
  userId: number;
  sessionId: number;
};

export type FinishTrainerSessionResult = TrainerSessionSummary;

export type FinishTrainerSessionErrorCode =
  | "invalid_input"
  | "not_found"
  | "unfinished"
  | "db_error";

export class FinishTrainerSessionError extends Error {
  constructor(
    message: string,
    public readonly code: FinishTrainerSessionErrorCode,
  ) {
    super(message);
    this.name = "FinishTrainerSessionError";
  }
}

type FinishTrainerSessionDeps = {
  getConnection: () => Promise<SqlConnection>;
};

type SessionRow = {
  id: number;
  user_id: number;
  theme_id: number;
  tasks_number: number;
  right_number: number;
  time: number;
  session_status: number;
  theme_name: string;
};

type StatusRow = {
  status: number;
};

function isPositiveInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

export function validateFinishTrainerSessionInput(
  input: unknown,
): FinishTrainerSessionInput {
  if (typeof input !== "object" || input === null) {
    throw new FinishTrainerSessionError(
      "Request payload must be an object.",
      "invalid_input",
    );
  }
  const { userId, sessionId } = input as Record<string, unknown>;
  if (!isPositiveInt(userId) || !isPositiveInt(sessionId)) {
    throw new FinishTrainerSessionError(
      "userId and sessionId must be positive integers.",
      "invalid_input",
    );
  }
  return { userId, sessionId };
}

export function toTrainerSessionSummary(
  row: Pick<
    SessionRow,
    "id" | "theme_id" | "theme_name" | "tasks_number" | "right_number" | "time"
  >,
): TrainerSessionSummary {
  return {
    sessionId: row.id,
    rightNumber: row.right_number,
    tasksNumber: row.tasks_number,
    percent: sessionPercent(row.tasks_number, row.right_number) ?? 0,
    timeSec: row.time,
    themeId: row.theme_id,
    themeName: row.theme_name.trim(),
  };
}

async function loadDefaultConnection(): Promise<SqlConnection> {
  const { getConnection } = await import("@/lib/db/mysql");
  return getConnection();
}

/**
 * Aggregates `tasks2session` answers into `task_sessions` (`right_number`,
 * `tasks_number`, `session_status = 1`). Already-completed sessions return
 * the stored summary without a second write. `time` / `start_time` stay as
 * they are until the session timer lands.
 */
export async function finishTrainerSession(
  rawInput: unknown,
  deps: FinishTrainerSessionDeps = { getConnection: loadDefaultConnection },
): Promise<FinishTrainerSessionResult> {
  const input = validateFinishTrainerSessionInput(rawInput);

  try {
    const connection = await deps.getConnection();
    try {
      await connection.beginTransaction();

      const sessions = await connection.query<SessionRow>(SQL_SELECT_SESSION, [
        input.sessionId,
        input.userId,
      ]);
      const session = sessions[0];

      if (!session) {
        await connection.rollback();
        throw new FinishTrainerSessionError(
          "Session was not found for this user.",
          "not_found",
        );
      }

      if (session.session_status === SESSION_STATUS_COMPLETED) {
        await connection.commit();
        return toTrainerSessionSummary(session);
      }

      const mappings = await connection.query<StatusRow>(SQL_SELECT_STATUSES, [
        input.sessionId,
        input.userId,
      ]);

      if (mappings.length === 0) {
        await connection.rollback();
        throw new FinishTrainerSessionError(
          "Session was not found for this user.",
          "not_found",
        );
      }

      if (mappings.some((row) => row.status === TASK_STATUS_UNANSWERED)) {
        await connection.rollback();
        throw new FinishTrainerSessionError(
          "Every task must be answered before finishing.",
          "unfinished",
        );
      }

      const tasksNumber = mappings.length;
      const rightNumber = mappings.filter(
        (row) => row.status === TASK_STATUS_CORRECT,
      ).length;

      const updated = await connection.execute(SQL_UPDATE_SESSION, [
        rightNumber,
        tasksNumber,
        SESSION_STATUS_COMPLETED,
        session.id,
      ]);
      if (updated.affectedRows !== 1) {
        await connection.rollback();
        throw new FinishTrainerSessionError(
          "Failed to store the session summary.",
          "db_error",
        );
      }

      await connection.commit();
      return toTrainerSessionSummary({
        ...session,
        right_number: rightNumber,
        tasks_number: tasksNumber,
      });
    } catch (error) {
      if (!(error instanceof FinishTrainerSessionError)) {
        await connection.rollback().catch(() => undefined);
      }
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    if (error instanceof FinishTrainerSessionError) {
      throw error;
    }
    console.error("finishTrainerSession: unexpected database error", error);
    throw new FinishTrainerSessionError(
      "Database operation failed.",
      "db_error",
    );
  }
}
