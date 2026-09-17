import assert from "node:assert/strict";
import test from "node:test";
import type { SqlConnection } from "@/lib/db/mysql";
import {
  checkMatchingAnswer,
  getMatchingTask,
  submitMatchingAnswer,
  MatchingTaskError,
} from "./matchingTask";

test("checkMatchingAnswer: every left id must map to itself", () => {
  assert.equal(checkMatchingAnswer([1, 2, 3], { 1: 1, 2: 2, 3: 3 }), true);
  assert.equal(checkMatchingAnswer([1, 2, 3], { 1: 1, 2: 3, 3: 2 }), false);
  assert.equal(checkMatchingAnswer([1, 2, 3], { 1: 1, 2: 2 }), false, "missing pair 3");
  assert.equal(checkMatchingAnswer([], {}), false);
});

const TASK_ROW = {
  id: 1,
  name: "Розкладання",
  task_text: "Установіть відповідність",
  hint_direction: "dir",
  hint_rule: "rule",
  comments: "explanation",
};
const PAIR_ROWS = [
  { id: 1, left_text: "x^2-9", right_text: "(x-3)(x+3)" },
  { id: 2, left_text: "x^2+6x+9", right_text: "(x+3)^2" },
  { id: 3, left_text: "x^2-4x+4", right_text: "(x-2)^2" },
];

function makeConnection(hasTask = true) {
  const attempt = { row: null as null | Record<string, unknown> };
  const connection: SqlConnection = {
    beginTransaction: async () => {},
    query: async <T,>(sql: string) => {
      if (sql.includes("FROM matching_tasks")) return (hasTask ? [TASK_ROW] : []) as unknown as T[];
      if (sql.includes("FROM matching_task_pairs")) return PAIR_ROWS as unknown as T[];
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
    commit: async () => {},
    rollback: async () => {},
    release: () => {},
  };
  return { connection };
}

test("getMatchingTask returns left/right items, both keyed by the same pair id", async () => {
  const mock = makeConnection();
  const task = await getMatchingTask(1, 1, { getConnection: async () => mock.connection });
  assert.equal(task.leftItems.length, 3);
  assert.equal(task.rightItems.length, 3);
  assert.deepEqual(task.leftItems.map((i) => i.id), task.rightItems.map((i) => i.id));
});

test("submitMatchingAnswer: correct pairing", async () => {
  const mock = makeConnection();
  const result = await submitMatchingAnswer(
    { userId: 1, taskId: 1, submittedPairs: { 1: 1, 2: 2, 3: 3 } },
    { getConnection: async () => mock.connection },
  );
  assert.deepEqual(result, { correct: true, firstAttempt: true });
});

test("submitMatchingAnswer: an incomplete pairing (missing a left id) is wrong, not thrown", async () => {
  const mock = makeConnection();
  const result = await submitMatchingAnswer(
    { userId: 1, taskId: 1, submittedPairs: { 1: 1, 2: 2 } },
    { getConnection: async () => mock.connection },
  );
  assert.deepEqual(result, { correct: false, firstAttempt: true, retryAvailable: true });
});

test("CONCURRENCY/IDEMPOTENCY: a duplicate submit after the row is locked reproduces the identical revealed answer", async () => {
  const mock = makeConnection();
  await submitMatchingAnswer(
    { userId: 1, taskId: 1, submittedPairs: { 1: 2, 2: 1, 3: 3 } },
    { getConnection: async () => mock.connection },
  );
  const retry = await submitMatchingAnswer(
    { userId: 1, taskId: 1, submittedPairs: { 1: 3, 2: 1, 3: 2 } },
    { getConnection: async () => mock.connection },
  );
  assert.equal(retry.correct, false);
  assert.ok(retry.revealed);

  const duplicate = await submitMatchingAnswer(
    { userId: 1, taskId: 1, submittedPairs: { 1: 1, 2: 2, 3: 3 } }, // objectively correct now
    { getConnection: async () => mock.connection },
  );
  assert.equal(duplicate.correct, false);
  assert.deepEqual(duplicate.revealed, retry.revealed);
});

test("rejects malformed submission (non-numeric value)", async () => {
  const mock = makeConnection();
  await assert.rejects(
    () =>
      submitMatchingAnswer(
        { userId: 1, taskId: 1, submittedPairs: { 1: Number.NaN } as unknown as Record<number, number> },
        { getConnection: async () => mock.connection },
      ),
    (e: unknown) => e instanceof MatchingTaskError && e.code === "invalid_input",
  );
});
