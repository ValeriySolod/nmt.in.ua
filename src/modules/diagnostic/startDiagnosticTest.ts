import type { SqlConnection } from "@/lib/db/mysql";
import { nowUnixSec } from "@/modules/testing/sessionElapsed";
import { computeSessionDeadline } from "@/modules/testing/sessionExpiry";
import { DIAGNOSTIC_TOTAL_QUESTIONS } from "./diagnosticProgress";
import { ensureDiagnosticSelfScoreSchema } from "./diagnosticSelfScores";
import { isValidOwner, ownerKey, type SessionOwner } from "./sessionOwner";

/** `task_sessions.session_type` for a diagnostic attempt (1 user/2 auto/3
 * mentor/4 NMT are the pre-existing values; 5 is new). */
const SESSION_TYPE_DIAGNOSTIC = 5;
const SESSION_STATUS_CREATED = 2;
const SESSION_START_TIME = 0;
const SESSION_INITIAL_RIGHT_NUMBER = 0;
const SESSION_INITIAL_TIME = 0;

/** A diagnostic attempt covers exactly five randomly selected eligible
 * topics and asks exactly two distinct tasks in each. */
export const DIAGNOSTIC_MAX_THEMES = 5;
export const DIAGNOSTIC_TASKS_PER_THEME = 3;

/** Exported so the availability check and adaptive flow use the exact same
 * database-backed eligibility definition. The ordered full set is sampled
 * deterministically from the session id so the random five-topic plan can be
 * reconstructed without adding a new persistence table. */
export const SQL_ELIGIBLE_THEMES = `
  SELECT t.id AS theme_id
  FROM themes t
  INNER JOIN quiz_tasks q ON q.theme_id = t.id
  GROUP BY t.id, t.ord
  HAVING COUNT(q.id) >= ${DIAGNOSTIC_TASKS_PER_THEME}
  ORDER BY t.ord ASC, t.id ASC
`;

export function selectDiagnosticThemeIds(
  eligibleThemeIds: readonly number[],
  sessionId: number,
): number[] {
  const shuffled = [...eligibleThemeIds];
  if (shuffled.length <= DIAGNOSTIC_MAX_THEMES) {
    return shuffled;
  }

  let state = sessionId >>> 0;
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    const swapIndex = state % (index + 1);
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex]!,
      shuffled[index]!,
    ];
  }
  return shuffled.slice(0, DIAGNOSTIC_MAX_THEMES);
}

/** `tasks_number` starts at the planned total; `finishDiagnosticSession`
 * overwrites it with the number of tasks actually linked. */
const SQL_INSERT_SESSION = `
  INSERT INTO task_sessions
    (user_id, guest_token, session_type, theme_id, tasks_number, right_number, time, session_status, start_time, expire_time)
  VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?)
`;

export type StartDiagnosticTestInput = {
  owner: SessionOwner;
};

export type StartDiagnosticTestResult = {
  sessionId: number;
  themeIds: number[];
};

export type StartDiagnosticTestErrorCode =
  | "invalid_input"
  | "insufficient_tasks"
  | "already_in_progress"
  | "db_error";

export class StartDiagnosticTestError extends Error {
  constructor(
    message: string,
    public readonly code: StartDiagnosticTestErrorCode,
  ) {
    super(message);
    this.name = "StartDiagnosticTestError";
  }
}

type StartDiagnosticTestDeps = {
  getConnection: () => Promise<SqlConnection>;
  nowSec?: () => number;
};

export function validateStartDiagnosticTestInput(
  input: unknown,
): StartDiagnosticTestInput {
  if (typeof input !== "object" || input === null) {
    throw new StartDiagnosticTestError(
      "Request payload must be an object.",
      "invalid_input",
    );
  }
  const { owner } = input as Record<string, unknown>;
  if (!isValidOwner(owner)) {
    throw new StartDiagnosticTestError(
      "owner must be exactly one of userId or guestToken.",
      "invalid_input",
    );
  }
  return { owner: owner as SessionOwner };
}

/** Guards against duplicate concurrent diagnostic starts from the same owner. */
const pendingOwnerKeys = new Set<string>();

async function loadDefaultConnection(): Promise<SqlConnection> {
  const { getConnection } = await import("@/lib/db/mysql");
  return getConnection();
}

/**
 * Starts an adaptive diagnostic test: checks that at least five themes are
 * eligible, then creates one `task_sessions` row (session_type=5, theme_id
 * NULL — a diagnostic attempt spans many themes) with no tasks linked yet.
 * Tasks are linked one at a time as the attempt progresses — the first task
 * of each topic by `startDiagnosticTopic` (together with that topic's
 * self-score), every later one by `advanceDiagnosticSession` — so their
 * difficulty can adapt to the student's answers.
 */
export async function startDiagnosticTest(
  rawInput: unknown,
  deps: StartDiagnosticTestDeps = { getConnection: loadDefaultConnection },
): Promise<StartDiagnosticTestResult> {
  const input = validateStartDiagnosticTestInput(rawInput);
  const key = ownerKey(input.owner);
  const nowSec = deps.nowSec ?? nowUnixSec;

  if (pendingOwnerKeys.has(key)) {
    throw new StartDiagnosticTestError(
      "A diagnostic-start request is already in progress for this owner.",
      "already_in_progress",
    );
  }
  pendingOwnerKeys.add(key);

  try {
    await ensureDiagnosticSelfScoreSchema(deps.getConnection);
    const connection = await deps.getConnection();
    try {
      await connection.beginTransaction();

      const themeRows = await connection.query<{ theme_id: number }>(
        SQL_ELIGIBLE_THEMES,
      );
      const eligibleThemeIds = themeRows.map((row) => row.theme_id);

      if (eligibleThemeIds.length < DIAGNOSTIC_MAX_THEMES) {
        await connection.rollback();
        throw new StartDiagnosticTestError(
          "Fewer than five themes have enough tasks for a diagnostic test.",
          "insufficient_tasks",
        );
      }

      const session = await connection.execute(SQL_INSERT_SESSION, [
        input.owner.userId,
        input.owner.guestToken,
        SESSION_TYPE_DIAGNOSTIC,
        DIAGNOSTIC_TOTAL_QUESTIONS,
        SESSION_INITIAL_RIGHT_NUMBER,
        SESSION_INITIAL_TIME,
        SESSION_STATUS_CREATED,
        SESSION_START_TIME,
        computeSessionDeadline(nowSec()),
      ]);
      const themeIds = selectDiagnosticThemeIds(
        eligibleThemeIds,
        session.insertId,
      );

      await connection.commit();

      return {
        sessionId: session.insertId,
        themeIds,
      };
    } catch (error) {
      if (!(error instanceof StartDiagnosticTestError)) {
        await connection.rollback().catch(() => undefined);
      }
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    if (error instanceof StartDiagnosticTestError) {
      throw error;
    }
    console.error("startDiagnosticTest: unexpected database error", error);
    throw new StartDiagnosticTestError(
      "Database operation failed.",
      "db_error",
    );
  } finally {
    pendingOwnerKeys.delete(key);
  }
}
