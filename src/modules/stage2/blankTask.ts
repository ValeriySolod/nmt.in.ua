import type { SqlConnection } from "@/lib/db/mysql";
import { nowUnixSec } from "@/modules/testing/sessionElapsed";
import {
  runStage2Attempt,
  peekStage2Attempt,
  type Stage2AttemptResult,
} from "./stage2Attempt";
import { getStage2HintLevel, type HintLevel, type Stage2HintResult } from "./hintLadder";

export type BlankReveal = {
  /** Per-blank correct text, keyed by ordinal — only ever sent once the row
   * is locked. */
  correctByOrd: Record<number, string>;
  explanation: string | null;
};

/** Reconstructed from the durably stored attempt row (`submitted_json`) —
 * `perBlank` is deterministically RECOMPUTED from that stored submission
 * plus the task's current stored answer key on every read, never trusted
 * from the client and never lost across a reload/second device. See
 * `recomputePerBlank` below. */
export type BlankTaskPriorResult =
  | { status: "correct"; perBlank: Record<number, boolean> }
  | { status: "retry_available"; submitted: Record<number, string> | null; perBlank: Record<number, boolean> }
  | { status: "locked"; revealed: BlankReveal; perBlank: Record<number, boolean> }
  | null;

export type BlankTaskPresentation = {
  taskId: number;
  name: string;
  /** Contains `{{1}}`, `{{2}}`, ... placeholders — the client renders one
   * input per placeholder ordinal. */
  taskText: string;
  blankOrds: number[];
  priorResult: BlankTaskPriorResult;
};

/** Same normalization `checkAnswer.ts` already uses for NMT open-answer
 * tasks — trim/lowercase/strip spaces, comma→dot — so "0,3" and "0.3" both
 * match a `correct_text` of "0,3". */
function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "").replace(/,/g, ".");
}

function blankMatches(correctText: string, alternatives: string | null, submitted: string): boolean {
  const candidates = [correctText, ...(alternatives ? alternatives.split(",") : [])];
  const normalizedSubmitted = normalize(submitted);
  return candidates.some((c) => normalize(c) === normalizedSubmitted);
}

/** Pure checker: independent per-blank result — never all-or-nothing. A
 * blank missing from the submission is simply incorrect for that blank,
 * never thrown (an incomplete submission is a valid, gradeable one). */
export function checkBlankTaskAnswer(
  blanks: readonly { ord: number; correctText: string; alternatives: string | null }[],
  submitted: Readonly<Record<number, string>>,
): { correct: boolean; perBlank: Record<number, boolean> } {
  const perBlank: Record<number, boolean> = {};
  for (const blank of blanks) {
    const value = submitted[blank.ord];
    perBlank[blank.ord] =
      typeof value === "string" && value.trim() !== ""
        ? blankMatches(blank.correctText, blank.alternatives, value)
        : false;
  }
  const correct = Object.values(perBlank).every(Boolean);
  return { correct, perBlank };
}

const SQL_SELECT_TASK = `
  SELECT id, name, task_text, hint_direction, hint_rule, hint_example, comments
  FROM blank_tasks WHERE id = ?
`;
const SQL_SELECT_BLANKS = `
  SELECT ord, correct_text, accepted_alternatives FROM blank_task_blanks
  WHERE blank_task_id = ? ORDER BY ord ASC
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
type BlankRow = { ord: number; correct_text: string; accepted_alternatives: string | null };
type BlankSpec = { ord: number; correctText: string; alternatives: string | null };

export class BlankTaskError extends Error {
  constructor(
    message: string,
    public readonly code: "invalid_input" | "not_found" | "db_error",
  ) {
    super(message);
    this.name = "BlankTaskError";
  }
}

function isPositiveInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isValidSubmission(value: unknown): value is Record<number, string> {
  if (typeof value !== "object" || value === null) return false;
  return Object.entries(value).every(
    ([k, v]) => isPositiveInt(Number(k)) && typeof v === "string",
  );
}

function normalizeSubmissionKeys(value: Record<number, string>): Record<number, string> {
  return Object.fromEntries(Object.entries(value).map(([k, v]) => [Number(k), v]));
}

async function loadDefaultConnection(): Promise<SqlConnection> {
  const { getConnection } = await import("@/lib/db/mysql");
  return getConnection();
}

export async function getBlankTask(
  taskId: number,
  userId: number,
  deps: { getConnection: () => Promise<SqlConnection> } = {
    getConnection: loadDefaultConnection,
  },
): Promise<BlankTaskPresentation> {
  if (!isPositiveInt(taskId) || !isPositiveInt(userId)) {
    throw new BlankTaskError("taskId and userId must be positive integers.", "invalid_input");
  }
  const connection = await deps.getConnection();
  try {
    const tasks = await connection.query<TaskRow>(SQL_SELECT_TASK, [taskId]);
    const task = tasks[0];
    if (!task) throw new BlankTaskError("Task not found.", "not_found");
    const blankRows = await connection.query<BlankRow>(SQL_SELECT_BLANKS, [taskId]);
    const blanks: BlankSpec[] = blankRows.map((b) => ({
      ord: b.ord,
      correctText: b.correct_text,
      alternatives: b.accepted_alternatives,
    }));

    const prior = await peekStage2Attempt(connection, "blank", taskId, userId);
    let priorResult: BlankTaskPriorResult = null;
    if (prior) {
      const submitted = isValidSubmission(prior.submitted)
        ? normalizeSubmissionKeys(prior.submitted)
        : null;
      const perBlank = submitted ? checkBlankTaskAnswer(blanks, submitted).perBlank : {};
      if (prior.status === "correct") {
        priorResult = { status: "correct", perBlank };
      } else if (prior.status === "retry_available") {
        priorResult = { status: "retry_available", submitted, perBlank };
      } else if (prior.status === "locked") {
        priorResult = {
          status: "locked",
          revealed: {
            correctByOrd: Object.fromEntries(blanks.map((b) => [b.ord, b.correctText])),
            explanation: task.comments?.trim() || null,
          },
          perBlank,
        };
      }
    }

    return {
      taskId: task.id,
      name: task.name.trim(),
      taskText: task.task_text.trim(),
      blankOrds: blankRows.map((b) => b.ord),
      priorResult,
    };
  } finally {
    connection.release();
  }
}

export type SubmitBlankTaskInput = {
  expectedAttempt?: 1 | 2;
  userId: number;
  taskId: number;
  submitted: Record<number, string>;
};

type Deps = { getConnection: () => Promise<SqlConnection>; nowSec?: () => number };

/** Result shape differs slightly from the other four formats: `perBlank`
 * is always present (independent per-blank feedback is the whole point of
 * this format) alongside the shared retry/reveal envelope. `perBlank` is
 * ALWAYS deterministically computed from a stored submission (the current
 * one, or — on an idempotent re-read where no new submission was scored —
 * the previously stored `submitted_json`) plus the task's current stored
 * answer key. Never left empty on a re-read. */
export type BlankAttemptResult = Stage2AttemptResult<BlankReveal> & {
  perBlank: Record<number, boolean>;
};

export async function submitBlankTaskAnswer(
  input: SubmitBlankTaskInput,
  deps: Deps = { getConnection: loadDefaultConnection },
): Promise<BlankAttemptResult> {
  if (
    !isPositiveInt(input.userId) ||
    !isPositiveInt(input.taskId) ||
    !isValidSubmission(input.submitted)
  ) {
    throw new BlankTaskError("Invalid submission.", "invalid_input");
  }

  const connection = await deps.getConnection();
  try {
    await connection.beginTransaction();
    const tasks = await connection.query<TaskRow>(SQL_SELECT_TASK, [input.taskId]);
    const task = tasks[0];
    if (!task) {
      await connection.rollback();
      throw new BlankTaskError("Task not found.", "not_found");
    }
    const blankRows = await connection.query<BlankRow>(SQL_SELECT_BLANKS, [input.taskId]);
    if (blankRows.length === 0) {
      await connection.rollback();
      throw new BlankTaskError("Task not found.", "not_found");
    }
    const blanks: BlankSpec[] = blankRows.map((b) => ({
      ord: b.ord,
      correctText: b.correct_text,
      alternatives: b.accepted_alternatives,
    }));
    const normalizedSubmission = normalizeSubmissionKeys(input.submitted);

    let lastPerBlank: Record<number, boolean> = {};
    const result = await runStage2Attempt(
      connection,
      {
        format: "blank",
        taskId: input.taskId,
        userId: input.userId,
        nowSec: (deps.nowSec ?? nowUnixSec)(),
        expectedAttempt: input.expectedAttempt,
      },
      () => {
        const { correct, perBlank } = checkBlankTaskAnswer(blanks, normalizedSubmission);
        lastPerBlank = perBlank;
        return correct;
      },
      () => ({
        correctByOrd: Object.fromEntries(blanks.map((b) => [b.ord, b.correctText])),
        explanation: task.comments?.trim() || null,
      }),
      JSON.stringify(normalizedSubmission),
    );

    // The idempotent branches of `runStage2Attempt` (already-locked,
    // already-correct) never call the `isCorrect` closure above, so
    // `lastPerBlank` would otherwise stay empty on a duplicate/reload
    // request even though the row already has a real, stored answer.
    // Recompute it from the STORED submission (`submitted_json`, written by
    // whichever call actually scored this row), never from THIS call's
    // input — a locked row must reproduce its original scored breakdown
    // regardless of what a later (ignored) resubmission contains, or
    // `perBlank` could disagree with the already-fixed `result.correct`.
    if (Object.keys(lastPerBlank).length === 0) {
      const stored = await peekStage2Attempt(connection, "blank", input.taskId, input.userId);
      const storedSubmission = isValidSubmission(stored?.submitted)
        ? normalizeSubmissionKeys(stored.submitted)
        : normalizedSubmission; // fallback: no stored submission somehow — best effort from this input
      lastPerBlank = checkBlankTaskAnswer(blanks, storedSubmission).perBlank;
    }

    await connection.commit();
    return { ...result, perBlank: lastPerBlank };
  } catch (error) {
    await connection.rollback().catch(() => undefined);
    throw error;
  } finally {
    connection.release();
  }
}

export type GetBlankTaskHintInput = { userId: number; taskId: number; level: HintLevel };

export async function getBlankTaskHintLevel(
  input: GetBlankTaskHintInput,
  deps: Deps = { getConnection: loadDefaultConnection },
): Promise<Stage2HintResult> {
  if (!isPositiveInt(input.userId) || !isPositiveInt(input.taskId)) {
    throw new BlankTaskError("userId and taskId must be positive integers.", "invalid_input");
  }
  const connection = await deps.getConnection();
  try {
    await connection.beginTransaction();
    const tasks = await connection.query<TaskRow>(SQL_SELECT_TASK, [input.taskId]);
    const task = tasks[0];
    if (!task) {
      await connection.rollback();
      throw new BlankTaskError("Task not found.", "not_found");
    }
    const result = await getStage2HintLevel(
      connection,
      "blank",
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
