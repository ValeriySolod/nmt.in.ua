import type { SqlConnection } from "@/lib/db/mysql";
import { nowUnixSec } from "@/modules/testing/sessionElapsed";
import {
  runStage2Attempt,
  peekStage2Attempt,
  type Stage2AttemptResult,
} from "./stage2Attempt";
import { getStage2HintLevel, type HintLevel, type Stage2HintResult } from "./hintLadder";

export type MatchingItem = { id: number; text: string };

export type MatchingReveal = {
  /** Each left item's id maps to its own id — see migration 022's note:
   * one row IS one correct pair, so `leftId === rightId` for the correct
   * match; this reveal echoes that back explicitly for the client to render
   * without needing to know the convention. */
  correctPairs: Record<number, number>;
  explanation: string | null;
};

/** Reconstructed from the durably stored attempt row — see `orderTask.ts`. */
export type MatchingPriorResult =
  | { status: "correct" }
  | { status: "retry_available"; submittedPairs: Record<number, number> | null }
  | { status: "locked"; revealed: MatchingReveal }
  | null;

export type MatchingTaskPresentation = {
  taskId: number;
  name: string;
  taskText: string;
  /** Fixed order — the client shuffles the right column itself. */
  leftItems: MatchingItem[];
  rightItems: MatchingItem[];
  priorResult: MatchingPriorResult;
};

/** Pure checker: every left id must map to its own id (see the schema note
 * above) — a submission missing a pair, or pairing any left id to any right
 * id other than its own, is incorrect. */
export function checkMatchingAnswer(
  leftIds: readonly number[],
  submittedPairs: Readonly<Record<number, number>>,
): boolean {
  if (leftIds.length === 0) return false;
  return leftIds.every((id) => submittedPairs[id] === id);
}

const SQL_SELECT_TASK = `
  SELECT id, name, task_text, hint_direction, hint_rule, hint_example, comments
  FROM matching_tasks WHERE id = ?
`;
const SQL_SELECT_PAIRS = `
  SELECT id, left_text, right_text FROM matching_task_pairs
  WHERE matching_task_id = ? ORDER BY id ASC
`;

type TaskRow = {
  id: number;
  name: string;
  task_text: string;
  hint_direction: string | null;
  hint_rule: string | null;
  hint_example?: string | null;
  comments: string | null;
};
type PairRow = { id: number; left_text: string; right_text: string };

export class MatchingTaskError extends Error {
  constructor(
    message: string,
    public readonly code: "invalid_input" | "not_found" | "db_error",
  ) {
    super(message);
    this.name = "MatchingTaskError";
  }
}

function isPositiveInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isValidPairMap(value: unknown): value is Record<number, number> {
  if (typeof value !== "object" || value === null) return false;
  return Object.entries(value).every(
    ([k, v]) => isPositiveInt(Number(k)) && isPositiveInt(v),
  );
}

async function loadDefaultConnection(): Promise<SqlConnection> {
  const { getConnection } = await import("@/lib/db/mysql");
  return getConnection();
}

export async function getMatchingTask(
  taskId: number,
  userId: number,
  deps: { getConnection: () => Promise<SqlConnection> } = {
    getConnection: loadDefaultConnection,
  },
): Promise<MatchingTaskPresentation> {
  if (!isPositiveInt(taskId) || !isPositiveInt(userId)) {
    throw new MatchingTaskError("taskId and userId must be positive integers.", "invalid_input");
  }
  const connection = await deps.getConnection();
  try {
    const tasks = await connection.query<TaskRow>(SQL_SELECT_TASK, [taskId]);
    const task = tasks[0];
    if (!task) throw new MatchingTaskError("Task not found.", "not_found");
    const pairs = await connection.query<PairRow>(SQL_SELECT_PAIRS, [taskId]);

    const prior = await peekStage2Attempt(connection, "matching", taskId, userId);
    let priorResult: MatchingPriorResult = null;
    if (prior?.status === "correct") {
      priorResult = { status: "correct" };
    } else if (prior?.status === "retry_available") {
      priorResult = {
        status: "retry_available",
        submittedPairs: isValidPairMap(prior.submitted) ? prior.submitted : null,
      };
    } else if (prior?.status === "locked") {
      priorResult = {
        status: "locked",
        revealed: {
          correctPairs: Object.fromEntries(pairs.map((p) => [p.id, p.id])),
          explanation: task.comments?.trim() || null,
        },
      };
    }

    return {
      taskId: task.id,
      name: task.name.trim(),
      taskText: task.task_text.trim(),
      leftItems: pairs.map((p) => ({ id: p.id, text: p.left_text.trim() })),
      rightItems: pairs.map((p) => ({ id: p.id, text: p.right_text.trim() })),
      priorResult,
    };
  } finally {
    connection.release();
  }
}

export type SubmitMatchingInput = {
  expectedAttempt?: 1 | 2;
  userId: number;
  taskId: number;
  submittedPairs: Record<number, number>;
};

type Deps = { getConnection: () => Promise<SqlConnection>; nowSec?: () => number };

export async function submitMatchingAnswer(
  input: SubmitMatchingInput,
  deps: Deps = { getConnection: loadDefaultConnection },
): Promise<Stage2AttemptResult<MatchingReveal>> {
  if (
    !isPositiveInt(input.userId) ||
    !isPositiveInt(input.taskId) ||
    !isValidPairMap(input.submittedPairs)
  ) {
    throw new MatchingTaskError("Invalid submission.", "invalid_input");
  }

  const connection = await deps.getConnection();
  try {
    await connection.beginTransaction();
    const tasks = await connection.query<TaskRow>(SQL_SELECT_TASK, [input.taskId]);
    const task = tasks[0];
    if (!task) {
      await connection.rollback();
      throw new MatchingTaskError("Task not found.", "not_found");
    }
    const pairs = await connection.query<PairRow>(SQL_SELECT_PAIRS, [input.taskId]);
    if (pairs.length === 0) {
      await connection.rollback();
      throw new MatchingTaskError("Task not found.", "not_found");
    }
    const leftIds = pairs.map((p) => p.id);
    const normalizedSubmission = Object.fromEntries(
      Object.entries(input.submittedPairs).map(([k, v]) => [Number(k), v]),
    );

    const result = await runStage2Attempt(
      connection,
      {
        format: "matching",
        taskId: input.taskId,
        userId: input.userId,
        nowSec: (deps.nowSec ?? nowUnixSec)(),
        expectedAttempt: input.expectedAttempt,
      },
      () => checkMatchingAnswer(leftIds, normalizedSubmission),
      () => ({
        correctPairs: Object.fromEntries(leftIds.map((id) => [id, id])),
        explanation: task.comments?.trim() || null,
      }),
      JSON.stringify(normalizedSubmission),
    );
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback().catch(() => undefined);
    throw error;
  } finally {
    connection.release();
  }
}

export type GetMatchingTaskHintInput = { userId: number; taskId: number; level: HintLevel };

export async function getMatchingTaskHintLevel(
  input: GetMatchingTaskHintInput,
  deps: Deps = { getConnection: loadDefaultConnection },
): Promise<Stage2HintResult> {
  if (!isPositiveInt(input.userId) || !isPositiveInt(input.taskId)) {
    throw new MatchingTaskError("userId and taskId must be positive integers.", "invalid_input");
  }
  const connection = await deps.getConnection();
  try {
    await connection.beginTransaction();
    const tasks = await connection.query<TaskRow>(SQL_SELECT_TASK, [input.taskId]);
    const task = tasks[0];
    if (!task) {
      await connection.rollback();
      throw new MatchingTaskError("Task not found.", "not_found");
    }
    const result = await getStage2HintLevel(
      connection,
      "matching",
      input.taskId,
      input.userId,
      input.level,
      { direction: task.hint_direction, rule: task.hint_rule,
      example: task.hint_example, explanation: task.comments },
    );
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback().catch(() => undefined);
    throw error;
  } finally {
    connection.release();
  }
}
