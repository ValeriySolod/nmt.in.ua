import { getRoundContext } from "./roundContext";
import type { SqlConnection } from "@/lib/db/mysql";

/** Same `status` convention as `tasks2session.status` / `TASK_STATUS_*`. */
export const STAGE2_STATUS_UNANSWERED = 0;
export const STAGE2_STATUS_CORRECT = 1;
export const STAGE2_STATUS_INCORRECT = -1;

export type Stage2Format = "order" | "find_error" | "graph" | "matching" | "blank";

const SQL_SELECT_ATTEMPT = `
  SELECT id, status, first_attempt_status, retry_used, hint_level_unlocked, submitted_json
  FROM practice_stage2_attempts
  WHERE format = ? AND task_id = ? AND user_id = ? AND round_id = ?
  FOR UPDATE
`;

/** Read-only counterpart of `SQL_SELECT_ATTEMPT` — no `FOR UPDATE`, safe to
 * run from a plain GET/fetch path that must never block on or interfere
 * with a concurrent submit's row lock. */
const SQL_SELECT_ATTEMPT_READONLY = `
  SELECT id, status, first_attempt_status, retry_used, hint_level_unlocked, submitted_json
  FROM practice_stage2_attempts
  WHERE format = ? AND task_id = ? AND user_id = ? AND round_id = ?
`;

const SQL_INSERT_ATTEMPT =
  "INSERT INTO practice_stage2_attempts (format, task_id, user_id, status, created_at, updated_at, round_id) VALUES (?, ?, ?, ?, ?, ?, ?)";

const SQL_UPDATE_FIRST_ATTEMPT =
  "UPDATE practice_stage2_attempts SET status = ?, first_attempt_status = ?, submitted_json = ?, updated_at = ? WHERE id = ?";

const SQL_UPDATE_RETRY =
  "UPDATE practice_stage2_attempts SET status = ?, retry_used = 1, submitted_json = ?, updated_at = ? WHERE id = ?";

export type AttemptRow = {
  id: number;
  status: number;
  first_attempt_status: number | null;
  retry_used: number;
  hint_level_unlocked: number;
  submitted_json: string | null;
};

export type Stage2AttemptResult<TReveal> = {
  correct: boolean;
  firstAttempt: boolean;
  retryAvailable?: true;
  revealed?: TReveal;
};

/**
 * Shared attempt/retry/reveal state machine for every Stage 2 format —
 * exactly the same rules `checkAnswer.ts` established for Stage 1's topic
 * bank (one retry after a wrong first attempt, then lock + reveal;
 * idempotent on a duplicate/reload/second-device read of an already-locked
 * row), reused here instead of re-implemented five times. `FOR UPDATE` on
 * the attempt row is the same concurrency-safety pattern as the rest of
 * this codebase.
 *
 * `isCorrect` is the format-specific pure checker; `buildReveal` builds the
 * post-lock reveal payload (never called before the row is actually locked).
 * `submittedJson` (the raw submission, format-specific shape) is persisted
 * on every scored write so a later read (`peekStage2Attempt`) can
 * deterministically recompute any per-item breakdown (e.g. 'blank'’s
 * per-blank correctness) without trusting client-supplied data on that
 * later read — it only ever replays what the server already scored here.
 */
export async function runStage2Attempt<TReveal>(
  connection: SqlConnection,
  input: { format: Stage2Format; taskId: number; userId: number; nowSec: number; expectedAttempt?: 1 | 2 },
  isCorrect: () => boolean,
  buildReveal: () => TReveal,
  submittedJson?: string,
): Promise<Stage2AttemptResult<TReveal>> {
  if (input.expectedAttempt !== undefined && input.expectedAttempt !== 1 && input.expectedAttempt !== 2) {
    throw new Error("Invalid attempt ordinal.");
  }
  await connection.query("SELECT id FROM app_users WHERE id = ? FOR UPDATE", [input.userId]);
  const context = getRoundContext();
  if (context) {
    const [round] = await connection.query<{ completed_at: number | null; skipped: number }>(
      `SELECT r.completed_at, t.skipped FROM practice_interactive_rounds r
       INNER JOIN practice_interactive_round_tasks t ON t.round_id = r.id
       WHERE r.id = ? AND r.user_id = ? AND t.format = ? AND t.task_id = ? FOR UPDATE`,
      [context.roundId, input.userId, input.format, input.taskId],
    );
    if (!round || round.skipped) throw new Error("Task is not eligible for an answer.");
    context.completed = round.completed_at != null;
    if (context.completed) throw new Error("Round is completed. Start a mistake round to practise again.");
  }
  const rows = await connection.query<AttemptRow>(SQL_SELECT_ATTEMPT, [
    input.format,
    input.taskId,
    input.userId,
    context?.roundId ?? 0,
  ]);
  let row = rows[0];

  if (context?.mode === "diagnostic" && row && row.status !== 0) {
    return { correct: row.status === 1, firstAttempt: false };
  }

  if (!row) {
    const inserted = await connection.execute(SQL_INSERT_ATTEMPT, [
      input.format,
      input.taskId,
      input.userId,
      STAGE2_STATUS_UNANSWERED,
      input.nowSec,
      input.nowSec,
      context?.roundId ?? 0,
    ]);
    row = {
      id: inserted.insertId,
      status: STAGE2_STATUS_UNANSWERED,
      first_attempt_status: null,
      retry_used: 0,
      hint_level_unlocked: 0,
      submitted_json: null,
    };
  }

  // Locked wrong after a consumed retry: idempotent re-read, same reveal
  // every time.
  if (row.status === STAGE2_STATUS_INCORRECT && row.retry_used === 1) {
    return { correct: false, firstAttempt: false, revealed: buildReveal() };
  }

  // Second attempt.
  if (row.status === STAGE2_STATUS_INCORRECT && row.retry_used === 0) {
    if (input.expectedAttempt === 1) {
      return { correct: false, firstAttempt: true, retryAvailable: true };
    }
    const correct = isCorrect();
    const status = correct ? STAGE2_STATUS_CORRECT : STAGE2_STATUS_INCORRECT;
    await connection.execute(SQL_UPDATE_RETRY, [
      status,
      submittedJson ?? null,
      input.nowSec,
      row.id,
    ]);
    if (correct) return { correct: true, firstAttempt: false };
    return { correct: false, firstAttempt: false, revealed: buildReveal() };
  }

  // Already resolved correctly, or some other terminal state — idempotent read.
  if (row.status !== STAGE2_STATUS_UNANSWERED) {
    return { correct: row.status === STAGE2_STATUS_CORRECT, firstAttempt: false };
  }

  // First attempt.
  if (input.expectedAttempt === 2) {
    throw new Error("First attempt is required.");
  }
  const correct = isCorrect();
  const status = correct ? STAGE2_STATUS_CORRECT : STAGE2_STATUS_INCORRECT;
  await connection.execute(SQL_UPDATE_FIRST_ATTEMPT, [
    status,
    status,
    submittedJson ?? null,
    input.nowSec,
    row.id,
  ]);
  if (correct) return { correct: true, firstAttempt: true };
  if (context?.mode === "diagnostic") return { correct: false, firstAttempt: true };
  return { correct: false, firstAttempt: true, retryAvailable: true };
}

export type Stage2PriorState = {
  /** `null` — no attempt has ever been recorded for this task/user (a fresh,
   * never-touched task). */
  status: "unanswered" | "correct" | "retry_available" | "locked";
  /** The raw submission stored on the last scored write (`submitted_json`),
   * parsed — `null` if there's nothing to replay yet. Callers use this to
   * deterministically recompute a per-item breakdown (e.g. blanks) instead
   * of trusting anything from the request. */
  submitted: unknown;
} | null;

/**
 * Read-only counterpart of `runStage2Attempt`, for a plain "load this task"
 * GET path — never creates a row, never writes, never takes `FOR UPDATE`
 * (so it can't block or be blocked by a concurrent submit). Lets `getXTask`
 * reconstruct the exact same result state a client would have seen from
 * its last `submitXAnswer` call, on reload or from a second device/session.
 */
export async function peekStage2Attempt(
  connection: SqlConnection,
  format: Stage2Format,
  taskId: number,
  userId: number,
): Promise<Stage2PriorState> {
  const context = getRoundContext();
  if (context?.mode === "diagnostic" && !context.completed) return null;
  const rows = await connection.query<AttemptRow>(SQL_SELECT_ATTEMPT_READONLY, [
    format,
    taskId,
    userId,
    context?.roundId ?? 0,
  ]);
  const row = rows[0];
  if (!row) return context?.completed ? { status: "locked", submitted: null } : null;

  let submitted: unknown = null;
  if (row.submitted_json) {
    try {
      submitted = JSON.parse(row.submitted_json);
    } catch {
      submitted = null;
    }
  }

  if (row.status === STAGE2_STATUS_CORRECT) {
    return { status: "correct", submitted };
  }
  if (row.status === STAGE2_STATUS_INCORRECT) {
    return {
      status: row.retry_used === 1 || context?.completed ? "locked" : "retry_available",
      submitted,
    };
  }
  return { status: "unanswered", submitted };
}
