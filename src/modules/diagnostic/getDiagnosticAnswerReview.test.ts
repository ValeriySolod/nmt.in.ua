import assert from "node:assert/strict";
import test from "node:test";
import type { SqlConnection } from "@/lib/db/mysql";
import { SESSION_STATUS_COMPLETED } from "@/modules/sessions/types";
import { getDiagnosticAnswerReview } from "./getDiagnosticAnswerReview";

function makeConnection(rows: Record<string, unknown>[]) {
  const calls: Array<{ sql: string; params: unknown[] }> = [];
  let released = false;
  const connection: SqlConnection = {
    beginTransaction: async () => {},
    query: async <T,>(sql: string, params: unknown[] = []) => {
      calls.push({ sql, params });
      return rows as T[];
    },
    execute: async () => ({ insertId: 0, affectedRows: 0 }),
    commit: async () => {},
    rollback: async () => {},
    release: () => { released = true; },
  };
  return { connection, calls, wasReleased: () => released };
}

const guest = { userId: null, guestToken: "guest-a" } as const;

test("returns correct answers and outcomes in task order for a completed guest session", async () => {
  const mock = makeConnection([
    {
      mapping_id: 11, task_name: " Task one ", task_text: " 2 + 2? ",
      task_status: 1, answer_1: "3", answer_2: "4", answer_3: "5", answer_4: "6",
      right_answer_n: 2, comments: " Add two and two. ",
    },
    {
      mapping_id: 12, task_name: "Task two", task_text: "3 + 3?",
      task_status: -1, answer_1: "6", answer_2: "7", answer_3: "8", answer_4: "9",
      right_answer_n: 1, comments: null,
    },
  ]);

  const review = await getDiagnosticAnswerReview(5, guest, {
    getConnection: async () => mock.connection,
  });

  assert.deepEqual(review, [
    { mappingId: 11, name: "Task one", taskText: "2 + 2?", correct: true, correctAnswerNumber: 2, correctAnswerText: "4", explanation: "Add two and two." },
    { mappingId: 12, name: "Task two", taskText: "3 + 3?", correct: false, correctAnswerNumber: 1, correctAnswerText: "6", explanation: null },
  ]);
  assert.match(mock.calls[0]!.sql, /ts\.session_type\s*=\s*5/);
  assert.match(mock.calls[0]!.sql, /ts\.session_status\s*=\s*\?/);
  assert.match(mock.calls[0]!.sql, /ts\.guest_token\s*=\s*\?/);
  assert.match(mock.calls[0]!.sql, /ORDER BY t2s\.id ASC/);
  assert.deepEqual(mock.calls[0]!.params, [5, SESSION_STATUS_COMPLETED, null, null, "guest-a", "guest-a"]);
  assert.equal(mock.wasReleased(), true);
});

test("does not query for an invalid session or owner", async () => {
  const mock = makeConnection([]);
  const deps = { getConnection: async () => mock.connection };
  assert.deepEqual(await getDiagnosticAnswerReview(0, guest, deps), []);
  assert.deepEqual(await getDiagnosticAnswerReview(5, { userId: null, guestToken: "" }, deps), []);
  assert.equal(mock.calls.length, 0);
});

test("returns no answers when the completed owner-scoped query finds no rows", async () => {
  const mock = makeConnection([]);
  const review = await getDiagnosticAnswerReview(5, { userId: 7, guestToken: null }, {
    getConnection: async () => mock.connection,
  });
  assert.deepEqual(review, []);
  assert.deepEqual(mock.calls[0]!.params, [5, SESSION_STATUS_COMPLETED, 7, 7, null, null]);
  assert.equal(mock.wasReleased(), true);
});

test("does not invent a correct option for invalid task-bank data", async () => {
  const mock = makeConnection([{
    mapping_id: 13, task_name: "Task", task_text: "Question", task_status: -1,
    answer_1: "A", answer_2: "B", answer_3: "C", answer_4: "D",
    right_answer_n: 5, comments: "",
  }]);
  const review = await getDiagnosticAnswerReview(5, guest, {
    getConnection: async () => mock.connection,
  });
  assert.equal(review[0]?.correctAnswerNumber, null);
  assert.equal(review[0]?.correctAnswerText, null);
  assert.equal(review[0]?.explanation, null);
});

test("releases the connection when the review query fails", async () => {
  let released = false;
  const mock = makeConnection([]);
  await assert.rejects(() => getDiagnosticAnswerReview(5, guest, {
    getConnection: async () => ({
      ...mock.connection,
      query: async () => { throw new Error("database unavailable"); },
      release: () => { released = true; },
    }),
  }), /database unavailable/);
  assert.equal(released, true);
});
