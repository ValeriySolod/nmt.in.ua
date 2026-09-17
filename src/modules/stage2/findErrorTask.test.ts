import assert from "node:assert/strict";
import test from "node:test";
import type { SqlConnection } from "@/lib/db/mysql";
import {
  checkFindErrorAnswer,
  getFindErrorTask,
  submitFindErrorAnswer,
  FindErrorTaskError,
} from "./findErrorTask";

test("checkFindErrorAnswer requires both the right line AND the right correction", () => {
  assert.equal(checkFindErrorAnswer(2, 2, 2, 2), true);
  assert.equal(checkFindErrorAnswer(2, 2, 2, 1), false, "right line, wrong correction");
  assert.equal(checkFindErrorAnswer(2, 2, 3, 2), false, "wrong line, right correction number");
});

const TASK_ROW = {
  id: 1,
  name: "Знак при перенесенні",
  task_text: "Знайдіть помилку",
  error_line_ord: 2,
  correction_1: "5x - 2x = 9 - 3",
  correction_2: "5x - 2x = 9 + 3",
  correction_3: "5x + 2x = 9 + 3",
  correction_4: "5x - 2x = -9 + 3",
  right_correction_n: 2,
  hint_direction: "dir",
  hint_rule: "rule",
  comments: "explanation",
};
const LINE_ROWS = [
  { ord: 1, line_text: "5x - 3 = 2x + 9" },
  { ord: 2, line_text: "5x - 2x = 9 - 3" },
  { ord: 3, line_text: "3x = 6" },
];

function makeConnection(hasTask = true) {
  let committed = false;
  let rolledBack = false;
  const attempt = { row: null as null | Record<string, unknown> };
  const connection: SqlConnection = {
    beginTransaction: async () => {},
    query: async <T,>(sql: string) => {
      if (sql.includes("FROM find_error_tasks")) return (hasTask ? [TASK_ROW] : []) as unknown as T[];
      if (sql.includes("FROM find_error_task_lines")) return LINE_ROWS as unknown as T[];
      if (sql.includes("practice_stage2_attempts")) return (attempt.row ? [attempt.row] : []) as unknown as T[];
      return [] as T[];
    },
    execute: async (sql: string, params: unknown[] = []) => {
      if (sql.startsWith("INSERT INTO practice_stage2_attempts")) {
        attempt.row = { id: 1, status: 0, first_attempt_status: null, retry_used: 0, hint_level_unlocked: 0 };
        return { insertId: 1, affectedRows: 1 };
      }
      if (sql.includes("first_attempt_status")) {
        const [status, firstAttemptStatus] = params as number[];
        attempt.row = { ...(attempt.row as object), status, first_attempt_status: firstAttemptStatus };
        return { insertId: 0, affectedRows: 1 };
      }
      if (sql.includes("retry_used")) {
        const [status] = params as number[];
        attempt.row = { ...(attempt.row as object), status, retry_used: 1 };
        return { insertId: 0, affectedRows: 1 };
      }
      return { insertId: 0, affectedRows: 1 };
    },
    commit: async () => { committed = true; },
    rollback: async () => { rolledBack = true; },
    release: () => {},
  };
  return { connection, isCommitted: () => committed, isRolledBack: () => rolledBack };
}

test("getFindErrorTask returns lines + correction options, no right_correction_n", async () => {
  const mock = makeConnection();
  const task = await getFindErrorTask(1, 1, { getConnection: async () => mock.connection });
  assert.equal(task.lines.length, 3);
  assert.equal(task.correctionOptions.length, 4);
  assert.doesNotMatch(JSON.stringify(task), /right_correction_n|error_line_ord/);
});

test("submitFindErrorAnswer: correct first attempt", async () => {
  const mock = makeConnection();
  const result = await submitFindErrorAnswer(
    { userId: 1, taskId: 1, submittedLineOrd: 2, submittedCorrectionN: 2 },
    { getConnection: async () => mock.connection },
  );
  assert.deepEqual(result, { correct: true, firstAttempt: true });
});

test("submitFindErrorAnswer: wrong first attempt, no reveal", async () => {
  const mock = makeConnection();
  const result = await submitFindErrorAnswer(
    { userId: 1, taskId: 1, submittedLineOrd: 1, submittedCorrectionN: 1 },
    { getConnection: async () => mock.connection },
  );
  assert.deepEqual(result, { correct: false, firstAttempt: true, retryAvailable: true });
});

test("rejects invalid submission (correction number out of range)", async () => {
  const mock = makeConnection();
  await assert.rejects(
    () =>
      submitFindErrorAnswer(
        { userId: 1, taskId: 1, submittedLineOrd: 2, submittedCorrectionN: 5 },
        { getConnection: async () => mock.connection },
      ),
    (e: unknown) => e instanceof FindErrorTaskError && e.code === "invalid_input",
  );
});

test("CONCURRENCY/IDEMPOTENCY: a duplicate submit after the row is locked reproduces the identical revealed answer", async () => {
  const mock = makeConnection();
  await submitFindErrorAnswer(
    { userId: 1, taskId: 1, submittedLineOrd: 1, submittedCorrectionN: 1 },
    { getConnection: async () => mock.connection },
  );
  const retry = await submitFindErrorAnswer(
    { userId: 1, taskId: 1, submittedLineOrd: 3, submittedCorrectionN: 3 },
    { getConnection: async () => mock.connection },
  );
  assert.equal(retry.correct, false);
  assert.ok(retry.revealed);

  const duplicate = await submitFindErrorAnswer(
    { userId: 1, taskId: 1, submittedLineOrd: 2, submittedCorrectionN: 2 }, // objectively correct now
    { getConnection: async () => mock.connection },
  );
  assert.equal(duplicate.correct, false);
  assert.deepEqual(duplicate.revealed, retry.revealed);
});

test("rejects a missing task", async () => {
  const mock = makeConnection(false);
  await assert.rejects(
    () => getFindErrorTask(1, 1, { getConnection: async () => mock.connection }),
    (e: unknown) => e instanceof FindErrorTaskError && e.code === "not_found",
  );
});
