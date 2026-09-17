import assert from "node:assert/strict";
import test from "node:test";
import type { SqlConnection } from "@/lib/db/mysql";
import {
  checkGraphTaskAnswer,
  getGraphTask,
  submitGraphTaskAnswer,
  GraphTaskError,
} from "./graphTask";

test("checkGraphTaskAnswer: exact set match, order-independent", () => {
  assert.equal(checkGraphTaskAnswer([1, 2, 4], [4, 1, 2]), true);
  assert.equal(checkGraphTaskAnswer([1, 2, 4], [1, 2]), false, "missing a correct point");
  assert.equal(checkGraphTaskAnswer([1, 2, 4], [1, 2, 4, 3]), false, "extra wrong point");
  assert.equal(checkGraphTaskAnswer([1, 2, 4], [1, 2, 2, 4]), true, "duplicate submission id ignored");
});

const TASK_ROW = {
  id: 1,
  name: "Точки на прямій",
  task_text: "Виберіть точки на графіку y=2x-1",
  axis_min: -5,
  axis_max: 5,
  hint_direction: "dir",
  hint_rule: "rule",
  comments: "explanation",
};
const POINT_ROWS = [
  { id: 1, label: "A", x: 0, y: -1, is_correct: 1 },
  { id: 2, label: "B", x: 1, y: 1, is_correct: 1 },
  { id: 3, label: "C", x: 2, y: 2, is_correct: 0 },
  { id: 4, label: "D", x: -1, y: -3, is_correct: 1 },
  { id: 5, label: "E", x: 3, y: 4, is_correct: 0 },
];

function makeConnection(hasTask = true) {
  let committed = false;
  const attempt = { row: null as null | Record<string, unknown> };
  const connection: SqlConnection = {
    beginTransaction: async () => {},
    query: async <T,>(sql: string) => {
      if (sql.includes("FROM graph_tasks")) return (hasTask ? [TASK_ROW] : []) as unknown as T[];
      if (sql.includes("FROM graph_task_points")) return POINT_ROWS as unknown as T[];
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
    rollback: async () => {},
    release: () => {},
  };
  return { connection, isCommitted: () => committed };
}

test("getGraphTask hides is_correct", async () => {
  const mock = makeConnection();
  const task = await getGraphTask(1, 1, { getConnection: async () => mock.connection });
  assert.equal(task.points.length, 5);
  assert.doesNotMatch(JSON.stringify(task), /is_correct/);
});

test("submitGraphTaskAnswer: correct selection", async () => {
  const mock = makeConnection();
  const result = await submitGraphTaskAnswer(
    { userId: 1, taskId: 1, submittedPointIds: [1, 2, 4] },
    { getConnection: async () => mock.connection },
  );
  assert.deepEqual(result, { correct: true, firstAttempt: true });
});

test("submitGraphTaskAnswer: incomplete selection is wrong, offers retry", async () => {
  const mock = makeConnection();
  const result = await submitGraphTaskAnswer(
    { userId: 1, taskId: 1, submittedPointIds: [1] },
    { getConnection: async () => mock.connection },
  );
  assert.deepEqual(result, { correct: false, firstAttempt: true, retryAvailable: true });
});

test("submitGraphTaskAnswer: an empty selection is a valid (if wrong) submission, not an error", async () => {
  const mock = makeConnection();
  const result = await submitGraphTaskAnswer(
    { userId: 1, taskId: 1, submittedPointIds: [] },
    { getConnection: async () => mock.connection },
  );
  assert.equal(result.correct, false);
});

test("CONCURRENCY/IDEMPOTENCY: a duplicate submit after the row is locked reproduces the identical revealed answer", async () => {
  const mock = makeConnection();
  await submitGraphTaskAnswer(
    { userId: 1, taskId: 1, submittedPointIds: [3] },
    { getConnection: async () => mock.connection },
  );
  const retry = await submitGraphTaskAnswer(
    { userId: 1, taskId: 1, submittedPointIds: [5] },
    { getConnection: async () => mock.connection },
  );
  assert.equal(retry.correct, false);
  assert.ok(retry.revealed);

  const duplicate = await submitGraphTaskAnswer(
    { userId: 1, taskId: 1, submittedPointIds: [1, 2, 4] }, // objectively correct now
    { getConnection: async () => mock.connection },
  );
  assert.equal(duplicate.correct, false);
  assert.deepEqual(duplicate.revealed, retry.revealed);
});

test("rejects malformed input (non-integer id)", async () => {
  const mock = makeConnection();
  await assert.rejects(
    () =>
      submitGraphTaskAnswer(
        { userId: 1, taskId: 1, submittedPointIds: [1.5] },
        { getConnection: async () => mock.connection },
      ),
    (e: unknown) => e instanceof GraphTaskError && e.code === "invalid_input",
  );
});
