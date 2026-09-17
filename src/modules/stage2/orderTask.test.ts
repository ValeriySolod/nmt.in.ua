import assert from "node:assert/strict";
import test from "node:test";
import type { SqlConnection } from "@/lib/db/mysql";
import {
  checkOrderTaskAnswer,
  getOrderTask,
  submitOrderTaskAnswer,
  OrderTaskError,
} from "./orderTask";

test("checkOrderTaskAnswer: exact sequence match only", () => {
  assert.equal(checkOrderTaskAnswer([1, 2, 3], [1, 2, 3]), true);
  assert.equal(checkOrderTaskAnswer([1, 2, 3], [1, 3, 2]), false);
});

test("checkOrderTaskAnswer: malformed submissions (wrong length, duplicates) are incorrect, not thrown", () => {
  assert.equal(checkOrderTaskAnswer([1, 2, 3], [1, 2]), false);
  assert.equal(checkOrderTaskAnswer([1, 2, 3], [1, 1, 2]), false);
  assert.equal(checkOrderTaskAnswer([1, 2, 3], []), false);
});

const TASK_ROW = {
  id: 1,
  name: "Лінійне рівняння",
  task_text: "Розташуйте кроки",
  hint_direction: "dir",
  hint_rule: "rule",
  comments: "explanation",
};
const STEP_ROWS = [
  { id: 10, correct_ord: 1, step_text: "3x+5=20" },
  { id: 11, correct_ord: 2, step_text: "3x=15" },
  { id: 12, correct_ord: 3, step_text: "x=5" },
];

function makeConnection(options: { hasTask?: boolean; hasSteps?: boolean } = {}) {
  const { hasTask = true, hasSteps = true } = options;
  let committed = false;
  let rolledBack = false;
  const attempts: Record<string, unknown> = {};
  const connection: SqlConnection = {
    beginTransaction: async () => {},
    query: async <T,>(sql: string) => {
      if (sql.includes("FROM order_tasks")) return (hasTask ? [TASK_ROW] : []) as unknown as T[];
      if (sql.includes("FROM order_task_steps")) return (hasSteps ? STEP_ROWS : []) as unknown as T[];
      if (sql.includes("practice_stage2_attempts")) {
        return (attempts.row ? [attempts.row] : []) as unknown as T[];
      }
      return [] as T[];
    },
    execute: async (sql: string, params: unknown[] = []) => {
      if (sql.startsWith("INSERT INTO practice_stage2_attempts")) {
        attempts.row = {
          id: 1,
          status: 0,
          first_attempt_status: null,
          retry_used: 0,
          hint_level_unlocked: 0,
          submitted_json: null,
        };
        return { insertId: 1, affectedRows: 1 };
      }
      if (sql.includes("first_attempt_status")) {
        const [status, firstAttemptStatus, submittedJson] = params as [
          number,
          number,
          string | null,
        ];
        attempts.row = {
          ...(attempts.row as object),
          status,
          first_attempt_status: firstAttemptStatus,
          submitted_json: submittedJson,
        };
        return { insertId: 0, affectedRows: 1 };
      }
      if (sql.includes("retry_used")) {
        const [status, submittedJson] = params as [number, string | null];
        attempts.row = {
          ...(attempts.row as object),
          status,
          retry_used: 1,
          submitted_json: submittedJson,
        };
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

test("getOrderTask returns client-safe steps, no correct_ord, no prior attempt", async () => {
  const mock = makeConnection();
  const task = await getOrderTask(1, 1, { getConnection: async () => mock.connection });
  assert.equal(task.taskId, 1);
  assert.deepEqual(
    task.steps.map((s) => s.id),
    [10, 11, 12],
  );
  assert.equal(task.priorResult, null);
  assert.doesNotMatch(JSON.stringify(task), /correct_ord/);
});

test("getOrderTask rejects a missing task", async () => {
  const mock = makeConnection({ hasTask: false });
  await assert.rejects(
    () => getOrderTask(1, 1, { getConnection: async () => mock.connection }),
    (e: unknown) => e instanceof OrderTaskError && e.code === "not_found",
  );
});

test("getOrderTask reconstructs a locked/revealed prior result after reload — deterministic from stored data, not the submission", async () => {
  const mock = makeConnection();
  // Simulate an already-locked attempt row for this user/task.
  const lockedConnection: SqlConnection = {
    ...mock.connection,
    query: async <T,>(sql: string) => {
      if (sql.includes("FROM order_tasks")) return [TASK_ROW] as unknown as T[];
      if (sql.includes("FROM order_task_steps")) return STEP_ROWS as unknown as T[];
      if (sql.includes("practice_stage2_attempts")) {
        return [
          { id: 1, status: -1, first_attempt_status: -1, retry_used: 1, hint_level_unlocked: 0, submitted_json: null },
        ] as unknown as T[];
      }
      return [] as T[];
    },
  };
  const task = await getOrderTask(1, 1, { getConnection: async () => lockedConnection });
  assert.deepEqual(task.priorResult, {
    status: "locked",
    revealed: { correctOrder: [10, 11, 12], explanation: "explanation" },
  });
});

test("getOrderTask reconstructs a retry-available prior result, including the previously submitted order", async () => {
  const mock = makeConnection();
  const retryConnection: SqlConnection = {
    ...mock.connection,
    query: async <T,>(sql: string) => {
      if (sql.includes("FROM order_tasks")) return [TASK_ROW] as unknown as T[];
      if (sql.includes("FROM order_task_steps")) return STEP_ROWS as unknown as T[];
      if (sql.includes("practice_stage2_attempts")) {
        return [
          {
            id: 1,
            status: -1,
            first_attempt_status: -1,
            retry_used: 0,
            hint_level_unlocked: 0,
            submitted_json: JSON.stringify([11, 10, 12]),
          },
        ] as unknown as T[];
      }
      return [] as T[];
    },
  };
  const task = await getOrderTask(1, 1, { getConnection: async () => retryConnection });
  assert.deepEqual(task.priorResult, {
    status: "retry_available",
    submittedOrder: [11, 10, 12],
  });
});

test("submitOrderTaskAnswer: correct first attempt", async () => {
  const mock = makeConnection();
  const result = await submitOrderTaskAnswer(
    { userId: 1, taskId: 1, submittedOrder: [10, 11, 12] },
    { getConnection: async () => mock.connection },
  );
  assert.deepEqual(result, { correct: true, firstAttempt: true });
  assert.ok(mock.isCommitted());
});

test("submitOrderTaskAnswer: wrong first attempt offers retry, no reveal", async () => {
  const mock = makeConnection();
  const result = await submitOrderTaskAnswer(
    { userId: 1, taskId: 1, submittedOrder: [11, 10, 12] },
    { getConnection: async () => mock.connection },
  );
  assert.deepEqual(result, { correct: false, firstAttempt: true, retryAvailable: true });
});

test("submitOrderTaskAnswer: rejects invalid input", async () => {
  const mock = makeConnection();
  await assert.rejects(
    () =>
      submitOrderTaskAnswer(
        { userId: 1, taskId: 1, submittedOrder: [] },
        { getConnection: async () => mock.connection },
      ),
    (e: unknown) => e instanceof OrderTaskError && e.code === "invalid_input",
  );
  assert.ok(mock.isRolledBack() === false); // never opened a transaction to roll back
});

test("CONCURRENCY/IDEMPOTENCY: a duplicate submit after the row is locked reproduces the identical revealed answer, never re-scores from the new (ignored) input", async () => {
  const mock = makeConnection();
  const first = await submitOrderTaskAnswer(
    { userId: 1, taskId: 1, submittedOrder: [11, 10, 12] },
    { getConnection: async () => mock.connection },
  );
  assert.equal(first.retryAvailable, true);

  const retry = await submitOrderTaskAnswer(
    { userId: 1, taskId: 1, submittedOrder: [12, 11, 10] },
    { getConnection: async () => mock.connection },
  );
  assert.equal(retry.correct, false);
  assert.ok(retry.revealed);

  // Duplicate/late request, even with the objectively correct order this
  // time — the row is already locked, so it must reproduce the SAME
  // (wrong) result, not silently accept this submission as correct.
  const duplicate = await submitOrderTaskAnswer(
    { userId: 1, taskId: 1, submittedOrder: [10, 11, 12] },
    { getConnection: async () => mock.connection },
  );
  assert.equal(duplicate.correct, false);
  assert.deepEqual(duplicate.revealed, retry.revealed);
});

test("submitOrderTaskAnswer: rejects a missing task", async () => {
  const mock = makeConnection({ hasTask: false });
  await assert.rejects(
    () =>
      submitOrderTaskAnswer(
        { userId: 1, taskId: 1, submittedOrder: [10, 11, 12] },
        { getConnection: async () => mock.connection },
      ),
    (e: unknown) => e instanceof OrderTaskError && e.code === "not_found",
  );
});
