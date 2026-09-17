import assert from "node:assert/strict";
import test from "node:test";
import type { SqlConnection } from "@/lib/db/mysql";
import {
  runStage2Attempt,
  peekStage2Attempt,
  STAGE2_STATUS_CORRECT,
  STAGE2_STATUS_INCORRECT,
  STAGE2_STATUS_UNANSWERED,
  type AttemptRow,
} from "./stage2Attempt";

function makeConnection(row: AttemptRow | null) {
  let current = row ? { ...row } : null;
  const nextId = 100;
  const calls: Array<{ sql: string; params?: unknown[] }> = [];

  const connection: SqlConnection = {
    beginTransaction: async () => {},
    query: async <T,>(sql: string, params: unknown[] = []) => {
      calls.push({ sql, params });
      return (current ? [current] : []) as unknown as T[];
    },
    execute: async (sql: string, params: unknown[] = []) => {
      calls.push({ sql, params });
      if (sql.startsWith("INSERT INTO practice_stage2_attempts")) {
        current = {
          id: nextId,
          status: STAGE2_STATUS_UNANSWERED,
          first_attempt_status: null,
          retry_used: 0,
          hint_level_unlocked: 0,
          submitted_json: null,
        };
        return { insertId: nextId, affectedRows: 1 };
      }
      if (sql.includes("first_attempt_status")) {
        const [status, firstAttemptStatus, submittedJson] = params as [
          number,
          number,
          string | null,
        ];
        if (current) {
          current.status = status;
          current.first_attempt_status = firstAttemptStatus;
          current.submitted_json = submittedJson;
        }
        return { insertId: 0, affectedRows: 1 };
      }
      if (sql.includes("retry_used")) {
        const [status, submittedJson] = params as [number, string | null];
        if (current) {
          current.status = status;
          current.retry_used = 1;
          current.submitted_json = submittedJson;
        }
        return { insertId: 0, affectedRows: 1 };
      }
      return { insertId: 0, affectedRows: 0 };
    },
    commit: async () => {},
    rollback: async () => {},
    release: () => {},
  };

  return { connection, calls, get row() { return current; } };
}

test("creates an attempt row on first read and scores a correct first attempt", async () => {
  const mock = makeConnection(null);
  const result = await runStage2Attempt(
    mock.connection,
    { format: "order", taskId: 1, userId: 1, nowSec: 1000 },
    () => true,
    () => ({ never: "called" }),
  );
  assert.deepEqual(result, { correct: true, firstAttempt: true });
  assert.equal(mock.row?.status, STAGE2_STATUS_CORRECT);
  assert.equal(mock.row?.first_attempt_status, STAGE2_STATUS_CORRECT);
});

test("a wrong first attempt offers a retry, no reveal", async () => {
  const mock = makeConnection(null);
  const result = await runStage2Attempt(
    mock.connection,
    { format: "order", taskId: 1, userId: 1, nowSec: 1000 },
    () => false,
    () => ({ text: "answer" }),
  );
  assert.deepEqual(result, { correct: false, firstAttempt: true, retryAvailable: true });
});

test("replayed first submission never consumes the retry or reveals the answer", async () => {
  const mock = makeConnection(null);
  const input = { format: "order" as const, taskId: 1, userId: 1, nowSec: 1000, expectedAttempt: 1 as const };
  const first = await runStage2Attempt(mock.connection, input, () => false, () => "secret", "[2,1]");
  const replay = await runStage2Attempt(mock.connection, input, () => { throw new Error("must not score again"); }, () => "secret", "[1,2]");
  assert.deepEqual(replay, first);
  assert.equal(mock.row?.retry_used, 0);
  assert.equal(mock.row?.submitted_json, "[2,1]");
  const retry = await runStage2Attempt(mock.connection, { ...input, expectedAttempt: 2 }, () => true, () => "secret", "[1,2]");
  assert.equal(retry.correct, true);
  assert.equal(mock.row?.first_attempt_status, -1);
});

test("retry cannot be submitted before a first answer", async () => {
  const mock = makeConnection(null);
  await assert.rejects(() => runStage2Attempt(mock.connection,
    { format: "order", taskId: 1, userId: 1, nowSec: 1, expectedAttempt: 2 },
    () => true, () => "secret"), /First attempt/);
});

test("second attempt correct locks as correct, first_attempt_status untouched", async () => {
  const mock = makeConnection({
    id: 5,
    status: STAGE2_STATUS_INCORRECT,
    first_attempt_status: STAGE2_STATUS_INCORRECT,
    retry_used: 0,
    hint_level_unlocked: 0,
    submitted_json: null,
  });
  const result = await runStage2Attempt(
    mock.connection,
    { format: "order", taskId: 1, userId: 1, nowSec: 1000 },
    () => true,
    () => ({ text: "answer" }),
  );
  assert.deepEqual(result, { correct: true, firstAttempt: false });
  assert.equal(mock.row?.first_attempt_status, STAGE2_STATUS_INCORRECT);
});

test("second attempt wrong locks and reveals", async () => {
  const mock = makeConnection({
    id: 5,
    status: STAGE2_STATUS_INCORRECT,
    first_attempt_status: STAGE2_STATUS_INCORRECT,
    retry_used: 0,
    hint_level_unlocked: 0,
    submitted_json: null,
  });
  const result = await runStage2Attempt(
    mock.connection,
    { format: "order", taskId: 1, userId: 1, nowSec: 1000 },
    () => false,
    () => ({ text: "answer" }),
  );
  assert.equal(result.correct, false);
  assert.deepEqual(result.revealed, { text: "answer" });
});

test("a locked row is idempotent — same reveal, no further writes", async () => {
  const mock = makeConnection({
    id: 5,
    status: STAGE2_STATUS_INCORRECT,
    first_attempt_status: STAGE2_STATUS_INCORRECT,
    retry_used: 1,
    hint_level_unlocked: 0,
    submitted_json: null,
  });
  const result = await runStage2Attempt(
    mock.connection,
    { format: "order", taskId: 1, userId: 1, nowSec: 1000 },
    () => {
      throw new Error("isCorrect must not be called on an already-locked row");
    },
    () => ({ text: "answer" }),
  );
  assert.equal(result.correct, false);
  assert.deepEqual(result.revealed, { text: "answer" });
  assert.equal(mock.calls.filter((c) => c.sql.startsWith("UPDATE")).length, 0);
});

test("an already-correct row is read-only idempotent", async () => {
  const mock = makeConnection({
    id: 5,
    status: STAGE2_STATUS_CORRECT,
    first_attempt_status: STAGE2_STATUS_CORRECT,
    retry_used: 0,
    hint_level_unlocked: 0,
    submitted_json: null,
  });
  const result = await runStage2Attempt(
    mock.connection,
    { format: "order", taskId: 1, userId: 1, nowSec: 1000 },
    () => {
      throw new Error("must not be called");
    },
    () => ({ text: "x" }),
  );
  assert.deepEqual(result, { correct: true, firstAttempt: false });
});

test("persists the raw submission on a first-attempt write, replayable later", async () => {
  const mock = makeConnection(null);
  await runStage2Attempt(
    mock.connection,
    { format: "blank", taskId: 1, userId: 1, nowSec: 1000 },
    () => false,
    () => ({ text: "x" }),
    JSON.stringify({ 1: "6", 2: "9" }),
  );
  assert.equal(mock.row?.submitted_json, JSON.stringify({ 1: "6", 2: "9" }));
});

test("persists the raw submission on a retry write too", async () => {
  const mock = makeConnection({
    id: 5,
    status: STAGE2_STATUS_INCORRECT,
    first_attempt_status: STAGE2_STATUS_INCORRECT,
    retry_used: 0,
    hint_level_unlocked: 0,
    submitted_json: JSON.stringify({ 1: "6", 2: "9" }),
  });
  await runStage2Attempt(
    mock.connection,
    { format: "blank", taskId: 1, userId: 1, nowSec: 1000 },
    () => false,
    () => ({ text: "x" }),
    JSON.stringify({ 1: "6", 2: "8" }),
  );
  assert.equal(mock.row?.submitted_json, JSON.stringify({ 1: "6", 2: "8" }));
});

test("peekStage2Attempt: no row yet returns null, never creates one", async () => {
  const mock = makeConnection(null);
  const state = await peekStage2Attempt(mock.connection, "order", 1, 1);
  assert.equal(state, null);
  assert.equal(mock.calls.filter((c) => c.sql.startsWith("INSERT")).length, 0);
});

test("peekStage2Attempt: reconstructs retry_available / locked / correct states and parses the stored submission", async () => {
  const retryPending = makeConnection({
    id: 1,
    status: STAGE2_STATUS_INCORRECT,
    first_attempt_status: STAGE2_STATUS_INCORRECT,
    retry_used: 0,
    hint_level_unlocked: 0,
    submitted_json: JSON.stringify([2, 1, 3]),
  });
  assert.deepEqual(await peekStage2Attempt(retryPending.connection, "order", 1, 1), {
    status: "retry_available",
    submitted: [2, 1, 3],
  });

  const locked = makeConnection({
    id: 1,
    status: STAGE2_STATUS_INCORRECT,
    first_attempt_status: STAGE2_STATUS_INCORRECT,
    retry_used: 1,
    hint_level_unlocked: 0,
    submitted_json: null,
  });
  assert.deepEqual(await peekStage2Attempt(locked.connection, "order", 1, 1), {
    status: "locked",
    submitted: null,
  });

  const correct = makeConnection({
    id: 1,
    status: STAGE2_STATUS_CORRECT,
    first_attempt_status: STAGE2_STATUS_CORRECT,
    retry_used: 0,
    hint_level_unlocked: 0,
    submitted_json: JSON.stringify([1, 2, 3]),
  });
  assert.deepEqual(await peekStage2Attempt(correct.connection, "order", 1, 1), {
    status: "correct",
    submitted: [1, 2, 3],
  });
});

test("peekStage2Attempt never takes FOR UPDATE (must not block a concurrent submit)", async () => {
  const mock = makeConnection({
    id: 1,
    status: STAGE2_STATUS_CORRECT,
    first_attempt_status: STAGE2_STATUS_CORRECT,
    retry_used: 0,
    hint_level_unlocked: 0,
    submitted_json: null,
  });
  await peekStage2Attempt(mock.connection, "order", 1, 1);
  const select = mock.calls.find((c) => c.sql.includes("SELECT"));
  assert.ok(select);
  assert.doesNotMatch(select!.sql, /FOR UPDATE/);
});
