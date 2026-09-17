import type { SqlConnection } from "@/lib/db/mysql";
import { nowUnixSec } from "@/modules/testing/sessionElapsed";
import {
  runStage2Attempt,
  peekStage2Attempt,
  type Stage2AttemptResult,
} from "./stage2Attempt";
import { getStage2HintLevel, type HintLevel, type Stage2HintResult } from "./hintLadder";

export type OrderStep = { id: number; text: string };

export type OrderTaskReveal = {
  correctOrder: number[];
  explanation: string | null;
};

/** Reconstructed from the durably stored attempt row — lets the client show
 * exactly the same state after a reload or from a second device/session as
 * it would have seen right after submitting, without trusting anything
 * client-supplied. `null` — never attempted. */
export type OrderTaskPriorResult =
  | { status: "correct" }
  | { status: "retry_available"; submittedOrder: number[] | null }
  | { status: "locked"; revealed: OrderTaskReveal }
  | null;

export type OrderTaskPresentation = {
  taskId: number;
  name: string;
  taskText: string;
  /** Steps in a stable id order — the CLIENT is responsible for shuffling
   * the display order; never sent pre-shuffled by the server so a reload
   * doesn't reset the student's in-progress arrangement to a new shuffle. */
  steps: OrderStep[];
  priorResult: OrderTaskPriorResult;
};

/** Pure checker: exact sequence match, no partial credit (matches the
 * reference behavior — a step out of place is simply wrong). Malformed
 * submissions (wrong length, duplicate/unknown ids) are always incorrect,
 * never thrown — the caller already validated shape before this point. */
export function checkOrderTaskAnswer(
  correctOrder: readonly number[],
  submittedOrder: readonly number[],
): boolean {
  if (submittedOrder.length !== correctOrder.length) return false;
  const seen = new Set<number>();
  for (const id of submittedOrder) {
    if (seen.has(id)) return false;
    seen.add(id);
  }
  return correctOrder.every((id, index) => submittedOrder[index] === id);
}

const SQL_SELECT_TASK = `
  SELECT id, name, task_text, hint_direction, hint_rule, hint_example, comments
  FROM order_tasks WHERE id = ?
`;
const SQL_SELECT_STEPS = `
  SELECT id, correct_ord, step_text FROM order_task_steps
  WHERE order_task_id = ? ORDER BY id ASC
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
type StepRow = { id: number; correct_ord: number; step_text: string };

export class OrderTaskError extends Error {
  constructor(
    message: string,
    public readonly code: "invalid_input" | "not_found" | "db_error",
  ) {
    super(message);
    this.name = "OrderTaskError";
  }
}

function isPositiveInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((v) => typeof v === "number");
}

async function loadDefaultConnection(): Promise<SqlConnection> {
  const { getConnection } = await import("@/lib/db/mysql");
  return getConnection();
}

/** Client-safe fetch — never includes `correct_ord`, only the step text and
 * a stable id the client uses to build its submitted order. Also
 * reconstructs `priorResult` from the durable attempt row (read-only, no
 * `FOR UPDATE`) so a reload / second device sees the exact same result a
 * fresh submit would have produced — never recomputed from anything
 * client-supplied. */
export async function getOrderTask(
  taskId: number,
  userId: number,
  deps: { getConnection: () => Promise<SqlConnection> } = {
    getConnection: loadDefaultConnection,
  },
): Promise<OrderTaskPresentation> {
  if (!isPositiveInt(taskId) || !isPositiveInt(userId)) {
    throw new OrderTaskError("taskId and userId must be positive integers.", "invalid_input");
  }
  const connection = await deps.getConnection();
  try {
    const tasks = await connection.query<TaskRow>(SQL_SELECT_TASK, [taskId]);
    const task = tasks[0];
    if (!task) throw new OrderTaskError("Task not found.", "not_found");
    const steps = await connection.query<StepRow>(SQL_SELECT_STEPS, [taskId]);
    const correctOrder = [...steps]
      .sort((a, b) => a.correct_ord - b.correct_ord)
      .map((s) => s.id);

    const prior = await peekStage2Attempt(connection, "order", taskId, userId);
    let priorResult: OrderTaskPriorResult = null;
    if (prior?.status === "correct") {
      priorResult = { status: "correct" };
    } else if (prior?.status === "retry_available") {
      priorResult = {
        status: "retry_available",
        submittedOrder: isNumberArray(prior.submitted) ? prior.submitted : null,
      };
    } else if (prior?.status === "locked") {
      priorResult = {
        status: "locked",
        revealed: { correctOrder, explanation: task.comments?.trim() || null },
      };
    }

    return {
      taskId: task.id,
      name: task.name.trim(),
      taskText: task.task_text.trim(),
      steps: steps.map((s) => ({ id: s.id, text: s.step_text.trim() })),
      priorResult,
    };
  } finally {
    connection.release();
  }
}

export type CheckOrderTaskInput = {
  expectedAttempt?: 1 | 2;
  userId: number;
  taskId: number;
  submittedOrder: number[];
};

type Deps = { getConnection: () => Promise<SqlConnection>; nowSec?: () => number };

/**
 * Checks a submitted step order against the shared Stage 2 attempt state
 * machine (`runStage2Attempt`) — same one retry, then lock+reveal, rules as
 * Stage 1.
 */
export async function submitOrderTaskAnswer(
  input: CheckOrderTaskInput,
  deps: Deps = { getConnection: loadDefaultConnection },
): Promise<Stage2AttemptResult<OrderTaskReveal>> {
  if (
    !isPositiveInt(input.userId) ||
    !isPositiveInt(input.taskId) ||
    !Array.isArray(input.submittedOrder) ||
    input.submittedOrder.length === 0 ||
    !input.submittedOrder.every((id) => isPositiveInt(id))
  ) {
    throw new OrderTaskError("Invalid submission.", "invalid_input");
  }

  const connection = await deps.getConnection();
  try {
    await connection.beginTransaction();
    const tasks = await connection.query<TaskRow>(SQL_SELECT_TASK, [input.taskId]);
    const task = tasks[0];
    if (!task) {
      await connection.rollback();
      throw new OrderTaskError("Task not found.", "not_found");
    }
    const steps = await connection.query<StepRow>(SQL_SELECT_STEPS, [input.taskId]);
    if (steps.length === 0) {
      await connection.rollback();
      throw new OrderTaskError("Task not found.", "not_found");
    }
    const correctOrder = [...steps]
      .sort((a, b) => a.correct_ord - b.correct_ord)
      .map((s) => s.id);

    const result = await runStage2Attempt(
      connection,
      {
        format: "order",
        taskId: input.taskId,
        userId: input.userId,
        nowSec: (deps.nowSec ?? nowUnixSec)(),
        expectedAttempt: input.expectedAttempt,
      },
      () => checkOrderTaskAnswer(correctOrder, input.submittedOrder),
      () => ({
        correctOrder,
        explanation: task.comments?.trim() || null,
      }),
      JSON.stringify(input.submittedOrder),
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

export type GetOrderTaskHintInput = {
  userId: number;
  taskId: number;
  level: HintLevel;
};

/** Same 3-rung ladder + answer-leakage gate as Stage 1 (`hintLadder.ts`) —
 * only reachable once the task has a wrong attempt recorded, and rung 3
 * withheld until the retry is consumed. */
export async function getOrderTaskHintLevel(
  input: GetOrderTaskHintInput,
  deps: Deps = { getConnection: loadDefaultConnection },
): Promise<Stage2HintResult> {
  if (!isPositiveInt(input.userId) || !isPositiveInt(input.taskId)) {
    throw new OrderTaskError("userId and taskId must be positive integers.", "invalid_input");
  }
  const connection = await deps.getConnection();
  try {
    await connection.beginTransaction();
    const tasks = await connection.query<TaskRow>(SQL_SELECT_TASK, [input.taskId]);
    const task = tasks[0];
    if (!task) {
      await connection.rollback();
      throw new OrderTaskError("Task not found.", "not_found");
    }
    const result = await getStage2HintLevel(connection, "order", input.taskId, input.userId, input.level, {
      direction: task.hint_direction,
      rule: task.hint_rule,
      example: task.hint_example,
      explanation: task.comments,
    });
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback().catch(() => undefined);
    throw error;
  } finally {
    connection.release();
  }
}
