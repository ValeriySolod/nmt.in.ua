import type { SqlConnection } from "@/lib/db/mysql";
import { SESSION_STATUS_COMPLETED } from "@/modules/sessions/types";
import { nowUnixSec } from "./sessionElapsed";
import { computeSessionDeadline } from "./sessionExpiry";
import { TASK_STATUS_INCORRECT, TASK_STATUS_UNANSWERED } from "./types";

/** Verified `tasks2session.task_type` for the topic-test bank (`quiz_tasks`).
 * A "work on mistakes" round only ever draws from a completed *topic-test*
 * session — the simulator/diagnostic banks have their own separate review
 * flows (`getSessionMistakeReview.ts` already covers reading, not replaying,
 * both banks). */
const TASK_TYPE_TOPIC = 1;
/** `task_sessions.session_type` for a plain user-started topic test — the
 * new round is deliberately an ordinary Practice session of this same type,
 * so every existing mechanism (retry, hint ladder, reinforcement, adaptive
 * difficulty, `finishTrainerSession`'s live-row scoring) applies to it with
 * zero additional wiring. */
const SESSION_TYPE_TOPIC = 1;
const SESSION_STATUS_CREATED = 2;

const SQL_SELECT_ORIGINAL_SESSION = `
  SELECT id, theme_id, session_status, mistake_review_session_id
  FROM task_sessions
  WHERE id = ? AND user_id = ?
  FOR UPDATE
`;

/** Wrong + skipped tasks from the original session, judged by the PERMANENT
 * first-attempt outcome (`COALESCE(first_attempt_status, status)`), never
 * the live `status` column. This matters: a task that was wrong on its
 * first attempt and then fixed via the in-task Practice retry still has
 * `status = CORRECT` afterwards (see `checkAnswer.ts`) — it must still show
 * up here, because the primary/first-attempt result is what "this was a
 * mistake" means everywhere else in this feature (scoring, recommendations).
 * `skipTaskAnswer` stores a skip as `TASK_STATUS_INCORRECT` on both columns
 * (see `skipTaskAnswer.ts`), so the same filter covers skips too. Distinct
 * task ids only — a follow-up task appended mid-session by
 * `addSimilarPracticeTask`/spaced repetition could otherwise duplicate the
 * same underlying task if it happened to also end up wrong. */
const SQL_SELECT_MISTAKE_TASK_IDS = `
  SELECT DISTINCT t2s.task_id
  FROM tasks2session t2s
  WHERE t2s.session_id = ?
    AND t2s.user_id = ?
    AND t2s.task_type = ${TASK_TYPE_TOPIC}
    AND COALESCE(t2s.first_attempt_status, t2s.status) = ?
`;

const SQL_INSERT_SESSION =
  "INSERT INTO task_sessions (user_id, session_type, theme_id, tasks_number, right_number, time, session_status, start_time, expire_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
const SQL_INSERT_MAPPING_PREFIX =
  "INSERT INTO tasks2session (task_type, task_id, session_id, user_id, status) VALUES ";

export type StartMistakeReviewRoundInput = {
  userId: number;
  sessionId: number;
};

export type StartMistakeReviewRoundResult = {
  sessionId: number;
  themeId: number;
  taskIds: number[];
};

export type StartMistakeReviewRoundErrorCode =
  | "invalid_input"
  | "not_found"
  | "not_completed"
  | "no_mistakes"
  | "db_error";

export class StartMistakeReviewRoundError extends Error {
  constructor(
    message: string,
    public readonly code: StartMistakeReviewRoundErrorCode,
  ) {
    super(message);
    this.name = "StartMistakeReviewRoundError";
  }
}

type OriginalSessionRow = {
  id: number;
  theme_id: number | null;
  session_status: number;
  mistake_review_session_id?: number | null;
};

type TaskIdRow = { task_id: number };

type StartMistakeReviewRoundDeps = {
  getConnection: () => Promise<SqlConnection>;
  nowSec?: () => number;
};

function isPositiveInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

async function loadDefaultConnection(): Promise<SqlConnection> {
  const { getConnection } = await import("@/lib/db/mysql");
  return getConnection();
}

/**
 * "Work on mistakes": starts a brand-new, ordinary topic-test session
 * containing exactly the wrong/skipped tasks from an already-completed
 * session — reusing the same append-a-row pattern `addSimilarPracticeTask`
 * already established, taken one step further (a whole new session instead
 * of one appended row) so the original session's stored score/summary is
 * never touched. The new session goes through every existing mechanism
 * (`getSessionTasks`, `checkAnswer` with its retry/reveal flow,
 * `getTaskHintLevel`, `finishTrainerSession`) completely unmodified.
 */
export async function startMistakeReviewRound(
  rawInput: StartMistakeReviewRoundInput,
  deps: StartMistakeReviewRoundDeps = { getConnection: loadDefaultConnection },
): Promise<StartMistakeReviewRoundResult> {
  const { userId, sessionId } = rawInput;
  if (!isPositiveInt(userId) || !isPositiveInt(sessionId)) {
    throw new StartMistakeReviewRoundError(
      "userId and sessionId must be positive integers.",
      "invalid_input",
    );
  }

  try {
    const connection = await deps.getConnection();
    try {
      await connection.beginTransaction();

      const originals = await connection.query<OriginalSessionRow>(
        SQL_SELECT_ORIGINAL_SESSION,
        [sessionId, userId],
      );
      const original = originals[0];
      if (!original) {
        await connection.rollback();
        throw new StartMistakeReviewRoundError(
          "Session was not found for this user.",
          "not_found",
        );
      }
      if (original.session_status !== SESSION_STATUS_COMPLETED) {
        await connection.rollback();
        throw new StartMistakeReviewRoundError(
          "A mistake-review round is only offered for a completed session.",
          "not_completed",
        );
      }
      if (original.theme_id == null) {
        await connection.rollback();
        throw new StartMistakeReviewRoundError(
          "Session was not found for this user.",
          "not_found",
        );
      }

      const mistakeRows = await connection.query<TaskIdRow>(
        SQL_SELECT_MISTAKE_TASK_IDS,
        [sessionId, userId, TASK_STATUS_INCORRECT],
      );
      const taskIds = mistakeRows.map((row) => row.task_id);
      if (taskIds.length === 0) {
        await connection.rollback();
        throw new StartMistakeReviewRoundError(
          "No wrong or skipped tasks to review in this session.",
          "no_mistakes",
        );
      }

      if (original.mistake_review_session_id != null) {
        await connection.commit();
        return { sessionId: original.mistake_review_session_id, themeId: original.theme_id, taskIds };
      }

      const nowSec = deps.nowSec ?? nowUnixSec;
      const session = await connection.execute(SQL_INSERT_SESSION, [
        userId,
        SESSION_TYPE_TOPIC,
        original.theme_id,
        taskIds.length,
        0,
        0,
        SESSION_STATUS_CREATED,
        0,
        computeSessionDeadline(nowSec()),
      ]);

      const placeholders = taskIds.map(() => "(?, ?, ?, ?, ?)").join(", ");
      const mappingParams = taskIds.flatMap((taskId) => [
        TASK_TYPE_TOPIC,
        taskId,
        session.insertId,
        userId,
        TASK_STATUS_UNANSWERED,
      ]);
      const mapping = await connection.execute(
        SQL_INSERT_MAPPING_PREFIX + placeholders,
        mappingParams,
      );
      if (mapping.affectedRows !== taskIds.length) {
        await connection.rollback();
        throw new StartMistakeReviewRoundError(
          "Failed to link mistake tasks to the new round.",
          "db_error",
        );
      }

      await connection.execute(
        "UPDATE task_sessions SET mistake_review_session_id = ? WHERE id = ? AND user_id = ?",
        [session.insertId, sessionId, userId],
      );
      await connection.commit();
      return {
        sessionId: session.insertId,
        themeId: original.theme_id,
        taskIds,
      };
    } catch (error) {
      if (!(error instanceof StartMistakeReviewRoundError)) {
        await connection.rollback().catch(() => undefined);
      }
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    if (error instanceof StartMistakeReviewRoundError) throw error;
    console.error(
      "startMistakeReviewRound: unexpected database error",
      error,
    );
    throw new StartMistakeReviewRoundError(
      "Database operation failed.",
      "db_error",
    );
  }
}
