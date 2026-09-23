import assert from "node:assert/strict";
import test from "node:test";
import type { SqlConnection } from "@/lib/db/mysql";
import { DIAGNOSTIC_TOTAL_QUESTIONS } from "./diagnosticProgress";
import {
  StartDiagnosticTestError,
  startDiagnosticTest,
} from "./startDiagnosticTest";

type Call = { sql: string; params: unknown[] };

function makeConnection(options: {
  taskCount: number;
  themeCount: number;
  bank?: Array<{ id: number; themeId: number; difficulty: number }>;
}) {
  const calls: Call[] = [];
  let rolledBack = false;
  let committed = false;
  let released = false;
  const nextSessionId = 500;
  const bank =
    options.bank ??
    Array.from({ length: Math.max(options.taskCount, 12) }, (_, i) => ({
      id: i + 1,
      themeId: (i % Math.max(options.themeCount, 2)) + 1,
      difficulty: (i % 3) + 1,
    }));

  const connection: SqlConnection = {
    beginTransaction: async () => {},
    query: async <T,>(sql: string, params: unknown[] = []) => {
      calls.push({ sql, params });
      if (sql.includes("COUNT(*) AS task_count")) {
        return [
          {
            task_count: options.taskCount,
            theme_count: options.themeCount,
          },
        ] as unknown as T[];
      }
      if (sql.includes("FROM quiz_tasks") && sql.includes("theme_id AS themeId")) {
        return bank.map((task) => ({
          id: task.id,
          themeId: task.themeId,
          difficulty: task.difficulty,
        })) as unknown as T[];
      }
      return [] as T[];
    },
    execute: async (sql: string, params: unknown[] = []) => {
      calls.push({ sql, params });
      if (sql.includes("INSERT INTO task_sessions")) {
        return { insertId: nextSessionId, affectedRows: 1 };
      }
      if (sql.includes("INSERT INTO tasks2session")) {
        return { insertId: 1, affectedRows: 1 };
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

test("uses session_type = 5 and links the first task immediately", async () => {
  const mock = makeConnection({ taskCount: 20, themeCount: 4 });
  const result = await startDiagnosticTest(
    { owner: { userId: 7, guestToken: null } },
    { getConnection: async () => mock.connection },
  );

  assert.equal(result.sessionId, 500);
  const sessionInsert = mock.calls.find((c) =>
    c.sql.includes("INSERT INTO task_sessions"),
  );
  assert.equal(sessionInsert!.params[2], 5);
  assert.equal(sessionInsert!.params[3], DIAGNOSTIC_TOTAL_QUESTIONS);
  assert.ok(
    mock.calls.some((c) => c.sql.includes("INSERT INTO tasks2session")),
    "first task must be linked at start",
  );
});

test("sets expire_time to exactly now + 86400 from the injected clock", async () => {
  const mock = makeConnection({ taskCount: 20, themeCount: 4 });
  const now = 1_700_000_000;

  await startDiagnosticTest(
    { owner: { userId: 7, guestToken: null } },
    { getConnection: async () => mock.connection, nowSec: () => now },
  );

  const sessionInsert = mock.calls.find((c) =>
    c.sql.includes("INSERT INTO task_sessions"),
  );
  assert.equal(sessionInsert!.params.at(-1), now + 86400);
});

test("never writes self-assessment rows", async () => {
  const mock = makeConnection({ taskCount: 20, themeCount: 4 });
  await startDiagnosticTest(
    { owner: { userId: 7, guestToken: null } },
    { getConnection: async () => mock.connection },
  );
  assert.ok(!mock.calls.some((c) => c.sql.includes("user_self_scores")));
  assert.ok(
    !mock.calls.some((c) => c.sql.includes("diagnostic_session_self_scores")),
  );
});

test("rejects an ambiguous owner before touching the database", async () => {
  await assert.rejects(
    () =>
      startDiagnosticTest(
        { owner: { userId: 7, guestToken: "guest-a" } },
        {
          getConnection: async () => {
            throw new Error("should not be called");
          },
        },
      ),
    (error: unknown) =>
      error instanceof StartDiagnosticTestError && error.code === "invalid_input",
  );
});

test("rolls back when the bank is too small", async () => {
  const mock = makeConnection({ taskCount: 5, themeCount: 4 });
  await assert.rejects(
    () =>
      startDiagnosticTest(
        { owner: { userId: 7, guestToken: null } },
        { getConnection: async () => mock.connection },
      ),
    (error: unknown) =>
      error instanceof StartDiagnosticTestError &&
      error.code === "insufficient_tasks",
  );
  assert.ok(mock.isRolledBack());
  assert.ok(!mock.isCommitted());
  assert.ok(mock.isReleased());
});

test("commits and releases the connection on success", async () => {
  const mock = makeConnection({ taskCount: 20, themeCount: 4 });
  await startDiagnosticTest(
    { owner: { userId: 7, guestToken: null } },
    { getConnection: async () => mock.connection },
  );
  assert.ok(mock.isCommitted());
  assert.ok(!mock.isRolledBack());
  assert.ok(mock.isReleased());
});

test("writes the task_sessions row for a guest owner", async () => {
  const mock = makeConnection({ taskCount: 20, themeCount: 4 });
  await startDiagnosticTest(
    { owner: { userId: null, guestToken: "guest-a" } },
    { getConnection: async () => mock.connection },
  );

  const sessionInsert = mock.calls.find((c) =>
    c.sql.includes("INSERT INTO task_sessions"),
  );
  assert.deepEqual(sessionInsert!.params.slice(0, 2), [null, "guest-a"]);
});

test("prevents a duplicate submission while a request is already pending", async () => {
  const mock = makeConnection({ taskCount: 20, themeCount: 4 });

  let releaseFirst: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    releaseFirst = resolve;
  });
  const slowConnection: SqlConnection = {
    ...mock.connection,
    beginTransaction: async () => {
      await gate;
    },
  };

  const first = startDiagnosticTest(
    { owner: { userId: 42, guestToken: null } },
    { getConnection: async () => slowConnection },
  );

  await assert.rejects(
    () =>
      startDiagnosticTest(
        { owner: { userId: 42, guestToken: null } },
        { getConnection: async () => mock.connection },
      ),
    (error: unknown) =>
      error instanceof StartDiagnosticTestError &&
      error.code === "already_in_progress",
  );

  releaseFirst();
  await first;
});
