import assert from "node:assert/strict";
import test from "node:test";
import type { SqlConnection } from "@/lib/db/mysql";
import { SESSION_STATUS_COMPLETED, SESSION_STATUS_CREATED } from "@/modules/sessions/types";
import {
  addSimilarPracticeTask,
  AddSimilarPracticeTaskError,
} from "./addSimilarPracticeTask";
import { TASK_STATUS_CORRECT, TASK_STATUS_INCORRECT, TASK_STATUS_UNANSWERED } from "./types";

type SourceRow = {
  task_id: number;
  status: number;
  retry_used: number;
  task_type: number;
  session_type: number;
  session_status: number;
  expire_time: number;
  practice_streak: number;
  theme_id: number | null;
  difficulty: number;
};

/** `retry_used: 1` by default — reinforcement is only offered once the
 * Practice-mode retry has been consumed (the SECOND wrong attempt), see
 * `checkAnswer.ts`. `practice_streak: 0` — the server-tracked streak is
 * always reset by the wrong first attempt that led here (see
 * `checkAnswer.ts`), matching the real column's guaranteed value at this
 * point in the flow. */
function makeSourceRow(overrides: Partial<SourceRow> = {}): SourceRow {
  return {
    task_id: 100,
    status: TASK_STATUS_INCORRECT,
    retry_used: 1,
    task_type: 1,
    session_type: 1,
    session_status: SESSION_STATUS_CREATED,
    expire_time: 9_999_999_999,
    practice_streak: 0,
    theme_id: 7,
    difficulty: 1,
    ...overrides,
  };
}

type Options = {
  source?: SourceRow[];
  usedTaskIds?: number[];
  candidates?: { id: number; difficulty: number }[];
  newTaskFound?: boolean;
  failInsert?: boolean;
};

function makeConnection(options: Options = {}) {
  const {
    source = [makeSourceRow()],
    usedTaskIds = [100],
    candidates = [
      { id: 100, difficulty: 1 },
      { id: 101, difficulty: 1 },
    ],
    newTaskFound = true,
    failInsert = false,
  } = options;

  const calls: Array<{ sql: string; params?: unknown[] }> = [];
  let rolledBack = false;
  let committed = false;
  let released = false;

  const connection: SqlConnection = {
    beginTransaction: async () => {},
    query: async <T,>(sql: string, params: unknown[] = []) => {
      calls.push({ sql, params });
      if (sql.includes("FOR UPDATE")) return source as unknown as T[];
      if (sql.includes("task_id FROM tasks2session")) {
        return usedTaskIds.map((id) => ({ task_id: id })) as unknown as T[];
      }
      if (sql.includes("SELECT id, difficulty FROM quiz_tasks")) {
        return candidates as unknown as T[];
      }
      if (sql.includes("FROM quiz_tasks WHERE id = ?")) {
        return (newTaskFound
          ? [
              {
                id: params[0],
                name: "Similar task",
                task_text: "2x = 4",
                answer_1: "1",
                answer_2: "2",
                answer_3: "3",
                answer_4: "4",
              },
            ]
          : []) as unknown as T[];
      }
      return [] as T[];
    },
    execute: async (sql: string, params: unknown[] = []) => {
      calls.push({ sql, params });
      if (sql.startsWith("INSERT INTO tasks2session")) {
        return { insertId: 999, affectedRows: failInsert ? 0 : 1 };
      }
      if (sql.startsWith("INSERT INTO practice_task_origin")) {
        return { insertId: 0, affectedRows: 1 };
      }
      return { insertId: 0, affectedRows: 0 };
    },
    commit: async () => {
      committed = true;
    },
    rollback: async () => {
      rolledBack = true;
    },
    release: () => {
      released = true;
    },
  };

  return {
    connection,
    calls,
    isCommitted: () => committed,
    isRolledBack: () => rolledBack,
    isReleased: () => released,
  };
}

const validInput = { userId: 1, sessionId: 5, mappingId: 10 };

test("rejects invalid input", async () => {
  const mock = makeConnection();
  await assert.rejects(
    () =>
      addSimilarPracticeTask(
        { ...validInput, mappingId: 0 },
        { getConnection: async () => mock.connection },
      ),
    (error: unknown) =>
      error instanceof AddSimilarPracticeTaskError && error.code === "invalid_input",
  );
});

test("adds a same-theme task, excluding tasks already used in the session", async () => {
  const mock = makeConnection();

  const result = await addSimilarPracticeTask(validInput, {
    getConnection: async () => mock.connection,
  });

  assert.equal(result.mappingId, 999);
  assert.equal(result.task.taskId, 101);
  assert.equal(result.task.status, TASK_STATUS_UNANSWERED);
  assert.deepEqual(
    result.task.answers.map((a) => a.number),
    [1, 2, 3, 4],
  );

  const insert = mock.calls.find((c) => c.sql?.startsWith("INSERT INTO tasks2session"));
  assert.ok(insert);
  assert.deepEqual(insert!.params, [1, 101, 5, 1, TASK_STATUS_UNANSWERED]);
  assert.ok(mock.isCommitted());
  assert.ok(!mock.isRolledBack());
  assert.ok(mock.isReleased());
});

test("rejects when the source task was not answered incorrectly", async () => {
  const mock = makeConnection({
    source: [makeSourceRow({ status: TASK_STATUS_CORRECT })],
  });
  await assert.rejects(
    () =>
      addSimilarPracticeTask(validInput, { getConnection: async () => mock.connection }),
    (error: unknown) =>
      error instanceof AddSimilarPracticeTaskError && error.code === "not_incorrect",
  );
  assert.ok(mock.isRolledBack());
  assert.ok(!mock.isCommitted());
});

test("a duplicate/concurrent request for the same source mapping returns the existing follow-up, not a second one", async () => {
  const mock = makeConnection();
  // Simulate a follow-up already recorded for mappingId 10 by a prior
  // (or concurrent, now-committed) call.
  const originalQuery = mock.connection.query;
  mock.connection.query = (async <T,>(sql: string, params: unknown[] = []) => {
    if (sql.includes("practice_task_origin") && sql.includes("SELECT")) {
      return [{ tasks2session_id: 777 }] as unknown as T[];
    }
    if (sql.includes("mapping_id") && sql.includes("quiz_tasks")) {
      return [
        {
          mapping_id: 777,
          id: 105,
          name: "Existing follow-up",
          task_text: "already added",
          answer_1: "1",
          answer_2: "2",
          answer_3: "3",
          answer_4: "4",
        },
      ] as unknown as T[];
    }
    return originalQuery<T>(sql, params);
  }) as typeof mock.connection.query;

  const result = await addSimilarPracticeTask(validInput, {
    getConnection: async () => mock.connection,
  });

  assert.equal(result.mappingId, 777);
  assert.equal(result.task.taskId, 105);
  // No new tasks2session row was inserted for this duplicate request.
  assert.equal(
    mock.calls.filter((c) => c.sql?.startsWith("INSERT INTO tasks2session")).length,
    0,
  );
  assert.ok(mock.isCommitted());
});

test("rejects a similar task before the retry has been consumed", async () => {
  const mock = makeConnection({
    source: [makeSourceRow({ retry_used: 0 })],
  });
  await assert.rejects(
    () =>
      addSimilarPracticeTask(validInput, { getConnection: async () => mock.connection }),
    (error: unknown) =>
      error instanceof AddSimilarPracticeTaskError && error.code === "retry_pending",
  );
  assert.ok(mock.isRolledBack());
  assert.ok(!mock.isCommitted());
});

test("rejects diagnostic (5) and NMT (4) sessions", async () => {
  for (const sessionType of [4, 5]) {
    const mock = makeConnection({
      source: [makeSourceRow({ session_type: sessionType })],
    });
    await assert.rejects(
      () =>
        addSimilarPracticeTask(validInput, { getConnection: async () => mock.connection }),
      (error: unknown) =>
        error instanceof AddSimilarPracticeTaskError && error.code === "not_eligible",
    );
    assert.ok(mock.isRolledBack());
  }
});

test("rejects similar-task writes to a completed session", async () => {
  const mock = makeConnection({
    source: [makeSourceRow({ session_status: SESSION_STATUS_COMPLETED })],
  });
  await assert.rejects(
    () =>
      addSimilarPracticeTask(validInput, { getConnection: async () => mock.connection }),
    (error: unknown) =>
      error instanceof AddSimilarPracticeTaskError && error.code === "not_eligible",
  );
  assert.ok(mock.isRolledBack());
});

test("rejects once the active session's 24h deadline has passed", async () => {
  const now = 1_700_000_000;
  const mock = makeConnection({
    source: [makeSourceRow({ expire_time: now - 1 })],
  });

  await assert.rejects(
    () =>
      addSimilarPracticeTask(validInput, {
        getConnection: async () => mock.connection,
        nowSec: () => now,
      }),
    (error: unknown) =>
      error instanceof AddSimilarPracticeTaskError &&
      error.code === "session_expired",
  );
  assert.ok(mock.isRolledBack());
});

test("rejects a mapping that does not belong to this session or user", async () => {
  const mock = makeConnection({ source: [] });
  await assert.rejects(
    () =>
      addSimilarPracticeTask(validInput, { getConnection: async () => mock.connection }),
    (error: unknown) =>
      error instanceof AddSimilarPracticeTaskError && error.code === "not_found",
  );
});

test("reports no_similar_task when the theme bank is exhausted", async () => {
  const mock = makeConnection({
    usedTaskIds: [100, 101],
    candidates: [{ id: 100, difficulty: 1 }, { id: 101, difficulty: 1 }],
  });
  await assert.rejects(
    () =>
      addSimilarPracticeTask(validInput, { getConnection: async () => mock.connection }),
    (error: unknown) =>
      error instanceof AddSimilarPracticeTaskError && error.code === "no_similar_task",
  );
  assert.ok(mock.isRolledBack());
});

test("streak is read from the session row, not the client — no streak field accepted as input", async () => {
  // The server-tracked practice_streak is always 0 by the time reinforcement
  // is eligible (see the doc comment in addSimilarPracticeTask.ts), so this
  // never prefers a harder candidate — it just proves a (nonexistent, since
  // TS no longer accepts it) client-supplied streak can't influence the pick,
  // and that the call still succeeds normally.
  const mock = makeConnection({
    source: [makeSourceRow({ practice_streak: 5 })], // even if somehow nonzero
    candidates: [
      { id: 100, difficulty: 1 },
      { id: 101, difficulty: 1 },
      { id: 102, difficulty: 2 },
    ],
  });

  const result = await addSimilarPracticeTask(validInput, {
    getConnection: async () => mock.connection,
  });

  // A streak of 5 (>= ADAPTIVE_STREAK_THRESHOLD) DOES still prefer the
  // harder candidate when the column happens to carry a nonzero value —
  // proving the value legitimately comes from the DB row, not a hardcoded 0.
  assert.equal(result.task.taskId, 102);
});

test("rolls back and surfaces db_error when the insert fails", async () => {
  const mock = makeConnection({ failInsert: true });
  await assert.rejects(
    () =>
      addSimilarPracticeTask(validInput, { getConnection: async () => mock.connection }),
    (error: unknown) =>
      error instanceof AddSimilarPracticeTaskError && error.code === "db_error",
  );
  assert.ok(mock.isRolledBack());
});
