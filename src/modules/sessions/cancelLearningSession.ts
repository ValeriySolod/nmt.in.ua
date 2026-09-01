import type { SqlConnection } from "@/lib/db/mysql";
import { SESSION_STATUS_COMPLETED } from "./types";

export type CancelLearningSessionErrorCode =
  | "invalid_input"
  | "not_found"
  | "not_cancelable"
  | "db_error";

export class CancelLearningSessionError extends Error {
  constructor(
    message: string,
    public readonly code: CancelLearningSessionErrorCode,
  ) {
    super(message);
    this.name = "CancelLearningSessionError";
  }
}

type SessionLookupRow = {
  id: number;
  session_status: number;
  right_number: number;
  tasks_number: number;
  time: number;
};

type CancelLearningSessionDeps = {
  getConnection: () => Promise<SqlConnection>;
};

function isPositiveInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

async function loadDefaultConnection(): Promise<SqlConnection> {
  const { getConnection } = await import("@/lib/db/mysql");
  return getConnection();
}

/** Removes a non-completed session and its task mappings for the user. */
export async function cancelLearningSession(
  sessionId: unknown,
  userId: number,
  deps: CancelLearningSessionDeps = { getConnection: loadDefaultConnection },
): Promise<void> {
  if (!isPositiveInt(sessionId)) {
    throw new CancelLearningSessionError(
      "sessionId must be a positive integer.",
      "invalid_input",
    );
  }

  try {
    const connection = await deps.getConnection();
    try {
      await connection.beginTransaction();

      const rows = await connection.query<SessionLookupRow>(
        "SELECT id, session_status, right_number, tasks_number, time FROM task_sessions WHERE id = ? AND user_id = ?",
        [sessionId, userId],
      );
      const session = rows[0];
      if (!session) {
        await connection.rollback();
        throw new CancelLearningSessionError(
          "Session not found.",
          "not_found",
        );
      }

      const completed =
        session.session_status === SESSION_STATUS_COMPLETED ||
        (session.tasks_number > 0 &&
          session.right_number >= session.tasks_number &&
          session.time > 0);

      if (completed) {
        await connection.rollback();
        throw new CancelLearningSessionError(
          "Completed sessions cannot be cancelled.",
          "not_cancelable",
        );
      }

      await connection.execute(
        "DELETE FROM tasks2session WHERE session_id = ?",
        [sessionId],
      );
      const removed = await connection.execute(
        "DELETE FROM task_sessions WHERE id = ? AND user_id = ?",
        [sessionId, userId],
      );

      if (removed.affectedRows !== 1) {
        await connection.rollback();
        throw new CancelLearningSessionError(
          "Failed to remove the session.",
          "db_error",
        );
      }

      await connection.commit();
    } catch (error) {
      if (!(error instanceof CancelLearningSessionError)) {
        await connection.rollback().catch(() => undefined);
      }
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    if (error instanceof CancelLearningSessionError) {
      throw error;
    }
    console.error("cancelLearningSession: unexpected database error", error);
    throw new CancelLearningSessionError("Database operation failed.", "db_error");
  }
}
