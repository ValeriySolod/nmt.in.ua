import type { SqlConnection } from "@/lib/db/mysql";
import { nowUnixSec } from "@/modules/testing/sessionElapsed";
import {
  runStage2Attempt,
  peekStage2Attempt,
  type Stage2AttemptResult,
} from "./stage2Attempt";
import { getStage2HintLevel, type HintLevel, type Stage2HintResult } from "./hintLadder";

export type FindErrorLine = { ord: number; text: string };
export type FindErrorOption = { number: 1 | 2 | 3 | 4; text: string };

export type FindErrorReveal = {
  errorLineOrd: number;
  rightCorrectionN: 1 | 2 | 3 | 4;
  explanation: string | null;
};

export type FindErrorSubmission = { lineOrd: number; correctionN: number };

/** Reconstructed from the durably stored attempt row — see `orderTask.ts`'s
 * `OrderTaskPriorResult` for the same pattern/rationale. */
export type FindErrorPriorResult =
  | { status: "correct" }
  | { status: "retry_available"; submitted: FindErrorSubmission | null }
  | { status: "locked"; revealed: FindErrorReveal }
  | null;

export type FindErrorTaskPresentation = {
  taskId: number;
  name: string;
  taskText: string;
  lines: FindErrorLine[];
  correctionOptions: FindErrorOption[];
  priorResult: FindErrorPriorResult;
};

/** Pure checker: both the flagged line AND the chosen correction must be
 * right — spotting the wrong line without fixing it (or vice versa) is
 * still an incorrect submission, matching the format's "identify AND
 * correct" spec. */
export function checkFindErrorAnswer(
  correctLineOrd: number,
  rightCorrectionN: 1 | 2 | 3 | 4,
  submittedLineOrd: number,
  submittedCorrectionN: number,
): boolean {
  return submittedLineOrd === correctLineOrd && submittedCorrectionN === rightCorrectionN;
}

const SQL_SELECT_TASK = `
  SELECT id, name, task_text, error_line_ord,
    correction_1, correction_2, correction_3, correction_4, right_correction_n,
    hint_direction, hint_rule, hint_example, comments
  FROM find_error_tasks WHERE id = ?
`;
const SQL_SELECT_LINES = `
  SELECT ord, line_text FROM find_error_task_lines
  WHERE find_error_task_id = ? ORDER BY ord ASC
`;

type TaskRow = {
  id: number;
  name: string;
  task_text: string;
  error_line_ord: number;
  correction_1: string;
  correction_2: string;
  correction_3: string;
  correction_4: string;
  right_correction_n: number;
  hint_direction: string | null;
  hint_rule: string | null;
  hint_example?: string | null;
  comments: string | null;
};
type LineRow = { ord: number; line_text: string };

export class FindErrorTaskError extends Error {
  constructor(
    message: string,
    public readonly code: "invalid_input" | "not_found" | "db_error",
  ) {
    super(message);
    this.name = "FindErrorTaskError";
  }
}

function isPositiveInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}
function isOptionNumber(value: unknown): value is 1 | 2 | 3 | 4 {
  return value === 1 || value === 2 || value === 3 || value === 4;
}

function isFindErrorSubmission(value: unknown): value is FindErrorSubmission {
  return (
    typeof value === "object" &&
    value !== null &&
    isPositiveInt((value as Record<string, unknown>).lineOrd) &&
    isOptionNumber((value as Record<string, unknown>).correctionN)
  );
}

async function loadDefaultConnection(): Promise<SqlConnection> {
  const { getConnection } = await import("@/lib/db/mysql");
  return getConnection();
}

export async function getFindErrorTask(
  taskId: number,
  userId: number,
  deps: { getConnection: () => Promise<SqlConnection> } = {
    getConnection: loadDefaultConnection,
  },
): Promise<FindErrorTaskPresentation> {
  if (!isPositiveInt(taskId) || !isPositiveInt(userId)) {
    throw new FindErrorTaskError("taskId and userId must be positive integers.", "invalid_input");
  }
  const connection = await deps.getConnection();
  try {
    const tasks = await connection.query<TaskRow>(SQL_SELECT_TASK, [taskId]);
    const task = tasks[0];
    if (!task) throw new FindErrorTaskError("Task not found.", "not_found");
    const lines = await connection.query<LineRow>(SQL_SELECT_LINES, [taskId]);

    const prior = await peekStage2Attempt(connection, "find_error", taskId, userId);
    let priorResult: FindErrorPriorResult = null;
    if (prior?.status === "correct") {
      priorResult = { status: "correct" };
    } else if (prior?.status === "retry_available") {
      priorResult = {
        status: "retry_available",
        submitted: isFindErrorSubmission(prior.submitted) ? prior.submitted : null,
      };
    } else if (prior?.status === "locked") {
      priorResult = {
        status: "locked",
        revealed: {
          errorLineOrd: task.error_line_ord,
          rightCorrectionN: task.right_correction_n as 1 | 2 | 3 | 4,
          explanation: task.comments?.trim() || null,
        },
      };
    }

    return {
      taskId: task.id,
      name: task.name.trim(),
      taskText: task.task_text.trim(),
      lines: lines.map((l) => ({ ord: l.ord, text: l.line_text.trim() })),
      correctionOptions: [
        { number: 1, text: task.correction_1.trim() },
        { number: 2, text: task.correction_2.trim() },
        { number: 3, text: task.correction_3.trim() },
        { number: 4, text: task.correction_4.trim() },
      ],
      priorResult,
    };
  } finally {
    connection.release();
  }
}

export type SubmitFindErrorInput = {
  expectedAttempt?: 1 | 2;
  userId: number;
  taskId: number;
  submittedLineOrd: number;
  submittedCorrectionN: number;
};

type Deps = { getConnection: () => Promise<SqlConnection>; nowSec?: () => number };

export async function submitFindErrorAnswer(
  input: SubmitFindErrorInput,
  deps: Deps = { getConnection: loadDefaultConnection },
): Promise<Stage2AttemptResult<FindErrorReveal>> {
  if (
    !isPositiveInt(input.userId) ||
    !isPositiveInt(input.taskId) ||
    !isPositiveInt(input.submittedLineOrd) ||
    !isOptionNumber(input.submittedCorrectionN)
  ) {
    throw new FindErrorTaskError("Invalid submission.", "invalid_input");
  }

  const connection = await deps.getConnection();
  try {
    await connection.beginTransaction();
    const tasks = await connection.query<TaskRow>(SQL_SELECT_TASK, [input.taskId]);
    const task = tasks[0];
    if (!task) {
      await connection.rollback();
      throw new FindErrorTaskError("Task not found.", "not_found");
    }

    const result = await runStage2Attempt(
      connection,
      {
        format: "find_error",
        taskId: input.taskId,
        userId: input.userId,
        nowSec: (deps.nowSec ?? nowUnixSec)(),
        expectedAttempt: input.expectedAttempt,
      },
      () =>
        checkFindErrorAnswer(
          task.error_line_ord,
          task.right_correction_n as 1 | 2 | 3 | 4,
          input.submittedLineOrd,
          input.submittedCorrectionN,
        ),
      () => ({
        errorLineOrd: task.error_line_ord,
        rightCorrectionN: task.right_correction_n as 1 | 2 | 3 | 4,
        explanation: task.comments?.trim() || null,
      }),
      JSON.stringify({ lineOrd: input.submittedLineOrd, correctionN: input.submittedCorrectionN }),
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

export type GetFindErrorHintInput = { userId: number; taskId: number; level: HintLevel };

export async function getFindErrorTaskHintLevel(
  input: GetFindErrorHintInput,
  deps: Deps = { getConnection: loadDefaultConnection },
): Promise<Stage2HintResult> {
  if (!isPositiveInt(input.userId) || !isPositiveInt(input.taskId)) {
    throw new FindErrorTaskError("userId and taskId must be positive integers.", "invalid_input");
  }
  const connection = await deps.getConnection();
  try {
    await connection.beginTransaction();
    const tasks = await connection.query<TaskRow>(SQL_SELECT_TASK, [input.taskId]);
    const task = tasks[0];
    if (!task) {
      await connection.rollback();
      throw new FindErrorTaskError("Task not found.", "not_found");
    }
    const result = await getStage2HintLevel(
      connection,
      "find_error",
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
