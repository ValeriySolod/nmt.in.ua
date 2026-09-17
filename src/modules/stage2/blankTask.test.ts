import assert from "node:assert/strict";
import test from "node:test";
import type { SqlConnection } from "@/lib/db/mysql";
import {
  checkBlankTaskAnswer,
  getBlankTask,
  submitBlankTaskAnswer,
  BlankTaskError,
} from "./blankTask";

const BLANKS = [
  { ord: 1, correctText: "6", alternatives: null },
  { ord: 2, correctText: "8", alternatives: null },
  { ord: 3, correctText: "0,3", alternatives: "0.3" },
];

test("checkBlankTaskAnswer: independent per-blank result, not all-or-nothing", () => {
  const { correct, perBlank } = checkBlankTaskAnswer(BLANKS, { 1: "6", 2: "9", 3: "0,3" });
  assert.equal(correct, false);
  assert.deepEqual(perBlank, { 1: true, 2: false, 3: true });
});

test("checkBlankTaskAnswer: accepts a listed alternative via normalization", () => {
  const { perBlank } = checkBlankTaskAnswer(BLANKS, { 1: "6", 2: "8", 3: "0.3" });
  assert.equal(perBlank[3], true);
});

test("checkBlankTaskAnswer: a missing blank in the submission is incorrect for that blank, not thrown", () => {
  const { correct, perBlank } = checkBlankTaskAnswer(BLANKS, { 1: "6", 2: "8" });
  assert.equal(correct, false);
  assert.equal(perBlank[3], false);
});

test("checkBlankTaskAnswer: all correct", () => {
  const { correct } = checkBlankTaskAnswer(BLANKS, { 1: "6", 2: "8", 3: "0,3" });
  assert.equal(correct, true);
});

const TASK_ROW = {
  id: 1,
  name: "Лінійне рівняння",
  task_text: "2x+6=14: 2x=14-{{1}}={{2}}. x={{2}}:2={{3}}.",
  hint_direction: "dir",
  hint_rule: "rule",
  comments: "explanation",
};
const BLANK_ROWS = [
  { ord: 1, correct_text: "6", accepted_alternatives: null },
  { ord: 2, correct_text: "8", accepted_alternatives: null },
  { ord: 3, correct_text: "4", accepted_alternatives: null },
];

/** Shared, stateful fake store — mirrors the real `practice_stage2_attempts`
 * row across multiple `submit`/`get` calls in one test, so multi-step
 * scenarios (first wrong → retry → reload) exercise the same persistence
 * path a real page reload / second device would. */
function makeConnection(hasTask = true) {
  const attempt = { row: null as null | Record<string, unknown> };
  const connection: SqlConnection = {
    beginTransaction: async () => {},
    query: async <T,>(sql: string) => {
      if (sql.includes("FROM blank_tasks")) return (hasTask ? [TASK_ROW] : []) as unknown as T[];
      if (sql.includes("FROM blank_task_blanks")) return BLANK_ROWS as unknown as T[];
      if (sql.includes("practice_stage2_attempts")) return (attempt.row ? [attempt.row] : []) as unknown as T[];
      return [] as T[];
    },
    execute: async (sql: string, params: unknown[] = []) => {
      if (sql.startsWith("INSERT INTO practice_stage2_attempts")) {
        attempt.row = {
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
        attempt.row = {
          ...(attempt.row as object),
          status,
          first_attempt_status: firstAttemptStatus,
          submitted_json: submittedJson,
        };
        return { insertId: 0, affectedRows: 1 };
      }
      if (sql.includes("retry_used")) {
        const [status, submittedJson] = params as [number, string | null];
        attempt.row = {
          ...(attempt.row as object),
          status,
          retry_used: 1,
          submitted_json: submittedJson,
        };
        return { insertId: 0, affectedRows: 1 };
      }
      return { insertId: 0, affectedRows: 1 };
    },
    commit: async () => {},
    rollback: async () => {},
    release: () => {},
  };
  return { connection, attempt };
}

test("getBlankTask returns placeholders text and ordinals, never the answers", async () => {
  const mock = makeConnection();
  const task = await getBlankTask(1, 1, { getConnection: async () => mock.connection });
  assert.deepEqual(task.blankOrds, [1, 2, 3]);
  assert.equal(task.priorResult, null);
  assert.doesNotMatch(JSON.stringify(task), /correct_text/);
});

test("submitBlankTaskAnswer: all correct", async () => {
  const mock = makeConnection();
  const result = await submitBlankTaskAnswer(
    { userId: 1, taskId: 1, submitted: { 1: "6", 2: "8", 3: "4" } },
    { getConnection: async () => mock.connection },
  );
  assert.equal(result.correct, true);
  assert.deepEqual(result.perBlank, { 1: true, 2: true, 3: true });
});

test("submitBlankTaskAnswer: partially correct still reports per-blank detail, offers retry", async () => {
  const mock = makeConnection();
  const result = await submitBlankTaskAnswer(
    { userId: 1, taskId: 1, submitted: { 1: "6", 2: "9", 3: "4" } },
    { getConnection: async () => mock.connection },
  );
  assert.equal(result.correct, false);
  assert.equal(result.retryAvailable, true);
  assert.deepEqual(result.perBlank, { 1: true, 2: false, 3: true });
});

test("rejects malformed submission (non-string value)", async () => {
  const mock = makeConnection();
  await assert.rejects(
    () =>
      submitBlankTaskAnswer(
        { userId: 1, taskId: 1, submitted: { 1: 6 } as unknown as Record<number, string> },
        { getConnection: async () => mock.connection },
      ),
    (e: unknown) => e instanceof BlankTaskError && e.code === "invalid_input",
  );
});

test("rejects a missing task", async () => {
  const mock = makeConnection(false);
  await assert.rejects(
    () => getBlankTask(1, 1, { getConnection: async () => mock.connection }),
    (e: unknown) => e instanceof BlankTaskError && e.code === "not_found",
  );
});

test("DETERMINISTIC RECOVERY: after the retry is consumed (locked), a duplicate/reload submit reproduces the exact same per-blank breakdown from the STORED submission, not the new request's input", async () => {
  const mock = makeConnection();

  // First attempt: wrong on blank 2.
  const first = await submitBlankTaskAnswer(
    { userId: 1, taskId: 1, submitted: { 1: "6", 2: "9", 3: "4" } },
    { getConnection: async () => mock.connection },
  );
  assert.equal(first.retryAvailable, true);

  // Retry: also wrong (different mistake this time) — locks the row.
  const retry = await submitBlankTaskAnswer(
    { userId: 1, taskId: 1, submitted: { 1: "5", 2: "8", 3: "4" } },
    { getConnection: async () => mock.connection },
  );
  assert.equal(retry.correct, false);
  assert.ok(retry.revealed);
  assert.deepEqual(retry.perBlank, { 1: false, 2: true, 3: true });

  // A later duplicate/reload submit with YET ANOTHER (even all-correct)
  // payload must NOT be trusted — the row is already locked, so the
  // reproduced breakdown must match what was actually scored on the retry
  // above, not this new (ignored) input.
  const duplicate = await submitBlankTaskAnswer(
    { userId: 1, taskId: 1, submitted: { 1: "6", 2: "8", 3: "4" } },
    { getConnection: async () => mock.connection },
  );
  assert.equal(duplicate.correct, false);
  assert.deepEqual(duplicate.perBlank, { 1: false, 2: true, 3: true });
});

test("DETERMINISTIC RECOVERY: getBlankTask reconstructs the same locked breakdown after reload, from stored data only", async () => {
  const mock = makeConnection();
  await submitBlankTaskAnswer(
    { userId: 1, taskId: 1, submitted: { 1: "6", 2: "9", 3: "4" } },
    { getConnection: async () => mock.connection },
  );
  await submitBlankTaskAnswer(
    { userId: 1, taskId: 1, submitted: { 1: "5", 2: "8", 3: "4" } },
    { getConnection: async () => mock.connection },
  );

  // Simulate a page reload: a fresh `getBlankTask` call, no submission.
  const task = await getBlankTask(1, 1, { getConnection: async () => mock.connection });
  assert.equal(task.priorResult?.status, "locked");
  assert.deepEqual(task.priorResult?.perBlank, { 1: false, 2: true, 3: true });
});

test("DETERMINISTIC RECOVERY: getBlankTask reflects a retry-available state and the previously submitted values, before the retry is used", async () => {
  const mock = makeConnection();
  await submitBlankTaskAnswer(
    { userId: 1, taskId: 1, submitted: { 1: "6", 2: "9", 3: "4" } },
    { getConnection: async () => mock.connection },
  );

  const task = await getBlankTask(1, 1, { getConnection: async () => mock.connection });
  assert.equal(task.priorResult?.status, "retry_available");
  if (task.priorResult?.status === "retry_available") {
    assert.deepEqual(task.priorResult.submitted, { 1: "6", 2: "9", 3: "4" });
    assert.deepEqual(task.priorResult.perBlank, { 1: true, 2: false, 3: true });
  }
});

test("CONCURRENCY: a duplicate/parallel submit for an already-correct row is idempotent and never re-scores", async () => {
  const mock = makeConnection();
  const first = await submitBlankTaskAnswer(
    { userId: 1, taskId: 1, submitted: { 1: "6", 2: "8", 3: "4" } },
    { getConnection: async () => mock.connection },
  );
  assert.equal(first.correct, true);

  // A second, concurrent-looking call against the same (already-correct)
  // row must reproduce the identical result, not throw or re-score.
  const second = await submitBlankTaskAnswer(
    { userId: 1, taskId: 1, submitted: { 1: "0", 2: "0", 3: "0" } },
    { getConnection: async () => mock.connection },
  );
  assert.equal(second.correct, true);
  assert.equal(second.firstAttempt, false);
});
