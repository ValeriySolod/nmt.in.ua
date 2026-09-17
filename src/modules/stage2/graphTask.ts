import type { SqlConnection } from "@/lib/db/mysql";
import { nowUnixSec } from "@/modules/testing/sessionElapsed";
import {
  runStage2Attempt,
  peekStage2Attempt,
  type Stage2AttemptResult,
} from "./stage2Attempt";
import { getStage2HintLevel, type HintLevel, type Stage2HintResult } from "./hintLadder";

export type GraphPoint = { id: number; label: string; x: number; y: number };

export type GraphTaskReveal = {
  correctPointIds: number[];
  explanation: string | null;
};

/** Reconstructed from the durably stored attempt row — see `orderTask.ts`. */
export type GraphTaskPriorResult =
  | { status: "correct" }
  | { status: "retry_available"; submittedPointIds: number[] | null }
  | { status: "locked"; revealed: GraphTaskReveal }
  | null;

export type GraphTaskPresentation = {
  taskId: number;
  name: string;
  taskText: string;
  axisMin: number;
  axisMax: number;
  points: GraphPoint[];
  priorResult: GraphTaskPriorResult;
};

/** Pure checker: the submitted set of point ids must exactly equal the
 * correct set — order-independent, duplicates ignored (a duplicate id in
 * the submission doesn't inflate or deflate the match). */
export function checkGraphTaskAnswer(
  correctPointIds: readonly number[],
  submittedPointIds: readonly number[],
): boolean {
  const correct = new Set(correctPointIds);
  const submitted = new Set(submittedPointIds);
  if (correct.size !== submitted.size) return false;
  for (const id of correct) {
    if (!submitted.has(id)) return false;
  }
  return true;
}

const SQL_SELECT_TASK = `
  SELECT id, name, task_text, axis_min, axis_max, hint_direction, hint_rule, hint_example, comments
  FROM graph_tasks WHERE id = ?
`;
const SQL_SELECT_POINTS = `
  SELECT id, label, x, y, is_correct FROM graph_task_points
  WHERE graph_task_id = ? ORDER BY id ASC
`;

type TaskRow = {
  id: number;
  name: string;
  task_text: string;
  axis_min: number;
  axis_max: number;
  hint_direction: string | null;
  hint_rule: string | null;
  hint_example?: string | null;
  comments: string | null;
};
type PointRow = { id: number; label: string; x: number; y: number; is_correct: number };

export class GraphTaskError extends Error {
  constructor(
    message: string,
    public readonly code: "invalid_input" | "not_found" | "db_error",
  ) {
    super(message);
    this.name = "GraphTaskError";
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

export async function getGraphTask(
  taskId: number,
  userId: number,
  deps: { getConnection: () => Promise<SqlConnection> } = {
    getConnection: loadDefaultConnection,
  },
): Promise<GraphTaskPresentation> {
  if (!isPositiveInt(taskId) || !isPositiveInt(userId)) {
    throw new GraphTaskError("taskId and userId must be positive integers.", "invalid_input");
  }
  const connection = await deps.getConnection();
  try {
    const tasks = await connection.query<TaskRow>(SQL_SELECT_TASK, [taskId]);
    const task = tasks[0];
    if (!task) throw new GraphTaskError("Task not found.", "not_found");
    const points = await connection.query<PointRow>(SQL_SELECT_POINTS, [taskId]);

    const prior = await peekStage2Attempt(connection, "graph", taskId, userId);
    let priorResult: GraphTaskPriorResult = null;
    if (prior?.status === "correct") {
      priorResult = { status: "correct" };
    } else if (prior?.status === "retry_available") {
      priorResult = {
        status: "retry_available",
        submittedPointIds: isNumberArray(prior.submitted) ? prior.submitted : null,
      };
    } else if (prior?.status === "locked") {
      priorResult = {
        status: "locked",
        revealed: {
          correctPointIds: points.filter((p) => p.is_correct === 1).map((p) => p.id),
          explanation: task.comments?.trim() || null,
        },
      };
    }

    return {
      taskId: task.id,
      name: task.name.trim(),
      taskText: task.task_text.trim(),
      axisMin: Number(task.axis_min),
      axisMax: Number(task.axis_max),
      points: points.map((p) => ({
        id: p.id,
        label: p.label.trim(),
        x: Number(p.x),
        y: Number(p.y),
      })),
      priorResult,
    };
  } finally {
    connection.release();
  }
}

export type SubmitGraphTaskInput = {
  expectedAttempt?: 1 | 2;
  userId: number;
  taskId: number;
  submittedPointIds: number[];
};

type Deps = { getConnection: () => Promise<SqlConnection>; nowSec?: () => number };

export async function submitGraphTaskAnswer(
  input: SubmitGraphTaskInput,
  deps: Deps = { getConnection: loadDefaultConnection },
): Promise<Stage2AttemptResult<GraphTaskReveal>> {
  if (
    !isPositiveInt(input.userId) ||
    !isPositiveInt(input.taskId) ||
    !Array.isArray(input.submittedPointIds) ||
    !input.submittedPointIds.every((id) => isPositiveInt(id))
  ) {
    throw new GraphTaskError("Invalid submission.", "invalid_input");
  }

  const connection = await deps.getConnection();
  try {
    await connection.beginTransaction();
    const tasks = await connection.query<TaskRow>(SQL_SELECT_TASK, [input.taskId]);
    const task = tasks[0];
    if (!task) {
      await connection.rollback();
      throw new GraphTaskError("Task not found.", "not_found");
    }
    const points = await connection.query<PointRow>(SQL_SELECT_POINTS, [input.taskId]);
    if (points.length === 0) {
      await connection.rollback();
      throw new GraphTaskError("Task not found.", "not_found");
    }
    const correctPointIds = points.filter((p) => p.is_correct === 1).map((p) => p.id);

    const result = await runStage2Attempt(
      connection,
      {
        format: "graph",
        taskId: input.taskId,
        userId: input.userId,
        nowSec: (deps.nowSec ?? nowUnixSec)(),
        expectedAttempt: input.expectedAttempt,
      },
      () => checkGraphTaskAnswer(correctPointIds, input.submittedPointIds),
      () => ({
        correctPointIds,
        explanation: task.comments?.trim() || null,
      }),
      JSON.stringify(input.submittedPointIds),
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

export type GetGraphTaskHintInput = { userId: number; taskId: number; level: HintLevel };

export async function getGraphTaskHintLevel(
  input: GetGraphTaskHintInput,
  deps: Deps = { getConnection: loadDefaultConnection },
): Promise<Stage2HintResult> {
  if (!isPositiveInt(input.userId) || !isPositiveInt(input.taskId)) {
    throw new GraphTaskError("userId and taskId must be positive integers.", "invalid_input");
  }
  const connection = await deps.getConnection();
  try {
    await connection.beginTransaction();
    const tasks = await connection.query<TaskRow>(SQL_SELECT_TASK, [input.taskId]);
    const task = tasks[0];
    if (!task) {
      await connection.rollback();
      throw new GraphTaskError("Task not found.", "not_found");
    }
    const result = await getStage2HintLevel(
      connection,
      "graph",
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
