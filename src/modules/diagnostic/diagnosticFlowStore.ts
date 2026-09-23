import type { SqlConnection } from "@/lib/db/mysql";
import { SESSION_STATUS_COMPLETED } from "@/modules/sessions/types";
import { isSessionExpired } from "@/modules/testing/sessionExpiry";
import { TASK_STATUS_UNANSWERED } from "@/modules/testing/types";
import { selectAdaptiveTask, type DifficultyCandidate } from "./adaptiveDifficulty";
import { loadDiagnosticSelfScores } from "./diagnosticSelfScores";
import {
  resolveDiagnosticNextStep,
  type DiagnosticNextStep,
  type DiagnosticProgressMapping,
} from "./diagnosticProgress";
import { ownerClause, ownerParams, type SessionOwner } from "./sessionOwner";
import {
  SQL_ELIGIBLE_THEMES,
  selectDiagnosticThemeIds,
} from "./startDiagnosticTest";

/**
 * SQL shared by the adaptive diagnostic flow (`startDiagnosticTopic`,
 * `advanceDiagnosticSession`, `getDiagnosticNextStep`). Every statement is
 * owner-scoped exactly like the rest of `src/modules/diagnostic/*`.
 */

const SESSION_TYPE_DIAGNOSTIC = 5;
const TASK_TYPE_TOPIC = 1;

const SQL_LOCK_SESSION = `
  SELECT id, session_status, expire_time
  FROM task_sessions
  WHERE id = ? AND session_type = ${SESSION_TYPE_DIAGNOSTIC}
    AND ${ownerClause("task_sessions")}
  FOR UPDATE
`;

const SQL_PROGRESS_MAPPINGS = `
  SELECT t2s.task_id, qt.theme_id, qt.difficulty, t2s.status
  FROM tasks2session t2s
  INNER JOIN quiz_tasks qt ON qt.id = t2s.task_id
  WHERE t2s.session_id = ? AND ${ownerClause("t2s")}
  ORDER BY t2s.id ASC
`;

const SQL_THEME_CANDIDATES = `
  SELECT id, difficulty FROM quiz_tasks WHERE theme_id = ?
`;

const SQL_INSERT_MAPPING = `
  INSERT INTO tasks2session (task_type, task_id, session_id, user_id, guest_token, status)
  VALUES (${TASK_TYPE_TOPIC}, ?, ?, ?, ?, ${TASK_STATUS_UNANSWERED})
`;

type LockedSessionRow = {
  id: number;
  session_status: number;
  expire_time: number;
};

type ProgressMappingRow = {
  task_id: number;
  theme_id: number;
  difficulty: number;
  status: number;
};

export type LockedSessionState = "active" | "completed" | "expired";

/** Row-locks the owner's diagnostic session for the rest of the
 * transaction, serializing concurrent topic starts / advances on it.
 * `null` when it does not exist for this owner. */
export async function lockDiagnosticSession(
  connection: SqlConnection,
  sessionId: number,
  owner: SessionOwner,
  nowSec: number,
): Promise<LockedSessionState | null> {
  const rows = await connection.query<LockedSessionRow>(SQL_LOCK_SESSION, [
    sessionId,
    ...ownerParams(owner),
  ]);
  const row = rows[0];
  if (!row) return null;
  if (row.session_status === SESSION_STATUS_COMPLETED) return "completed";
  if (isSessionExpired(row.expire_time, nowSec)) return "expired";
  return "active";
}

export async function loadProgressMappings(
  connection: SqlConnection,
  sessionId: number,
  owner: SessionOwner,
  options: { forUpdate: boolean },
): Promise<DiagnosticProgressMapping[]> {
  const rows = await connection.query<ProgressMappingRow>(
    options.forUpdate ? `${SQL_PROGRESS_MAPPINGS} FOR UPDATE` : SQL_PROGRESS_MAPPINGS,
    [sessionId, ...ownerParams(owner)],
  );
  return rows.map((row) => ({
    taskId: row.task_id,
    themeId: row.theme_id,
    difficulty: row.difficulty,
    status: row.status,
  }));
}

export async function loadPlannedThemeIds(
  connection: SqlConnection,
  sessionId: number,
): Promise<number[]> {
  const rows = await connection.query<{ theme_id: number }>(SQL_ELIGIBLE_THEMES);
  return selectDiagnosticThemeIds(
    rows.map((row) => row.theme_id),
    sessionId,
  );
}

export async function loadThemeCandidates(
  connection: SqlConnection,
  themeId: number,
): Promise<DifficultyCandidate[]> {
  return connection.query<DifficultyCandidate>(SQL_THEME_CANDIDATES, [themeId]);
}

export type ResolvedDiagnosticStep = {
  step: DiagnosticNextStep;
  /** The adaptively picked task for a `nextTask` step, else `null`. */
  nextTaskId: number | null;
};

/**
 * `resolveDiagnosticNextStep` checked against the real task bank: when the
 * current topic has no unused task left at any difficulty, that topic is
 * treated as finished early and the step is resolved again. Every caller
 * (page read, topic start, advance) goes through this, so they all agree on
 * what the session is waiting for.
 */
export async function resolveStepAgainstBank(
  connection: SqlConnection,
  mappings: readonly DiagnosticProgressMapping[],
  plannedThemeIds: readonly number[],
  sessionId: number,
): Promise<ResolvedDiagnosticStep> {
  const usedTaskIds = mappings.map((mapping) => mapping.taskId);
  const exhaustedThemeIds = new Set<number>();
  const selfScores = await loadDiagnosticSelfScores(connection, sessionId);

  // Bounded: each pass either returns or marks one more theme exhausted.
  for (;;) {
    const step = resolveDiagnosticNextStep({
      mappings,
      plannedThemeIds,
      selfScores,
      exhaustedThemeIds,
    });
    if (step.kind !== "nextTask") {
      return { step, nextTaskId: null };
    }
    const candidates = await loadThemeCandidates(connection, step.themeId);
    const taskId = selectAdaptiveTask(
      candidates,
      usedTaskIds,
      step.targetDifficulty,
      step.direction,
    );
    if (taskId !== null) {
      return { step, nextTaskId: taskId };
    }
    exhaustedThemeIds.add(step.themeId);
  }
}

/** Links one task to the session as unanswered; returns the new mapping id. */
export async function insertDiagnosticMapping(
  connection: SqlConnection,
  sessionId: number,
  owner: SessionOwner,
  taskId: number,
): Promise<number | null> {
  const result = await connection.execute(SQL_INSERT_MAPPING, [
    taskId,
    sessionId,
    owner.userId,
    owner.guestToken,
  ]);
  return result.affectedRows === 1 ? result.insertId : null;
}
