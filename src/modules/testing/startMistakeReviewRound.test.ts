import assert from "node:assert/strict";
import test from "node:test";
import type { SqlConnection } from "@/lib/db/mysql";
import { SESSION_STATUS_COMPLETED, SESSION_STATUS_CREATED } from "@/modules/sessions/types";
import {
  startMistakeReviewRound,
  StartMistakeReviewRoundError,
} from "./startMistakeReviewRound";

type OriginalSessionRow = { id: number; theme_id: number | null; session_status: number; mistake_review_session_id?: number | null };

type Options = {
  original?: OriginalSessionRow[];
  mistakeTaskIds?: number[];
  failMappingInsert?: boolean;
};

function makeConnection(options: Options = {}) {
  const {
    original = [{ id: 5, theme_id: 7, session_status: SESSION_STATUS_COMPLETED }],
    mistakeTaskIds = [102, 104],
    failMappingInsert = false,
  } = options;

  const calls: Array<{ sql: string; params?: unknown[] }> = [];
  let rolledBack = false;
  let committed = false;

  const connection: SqlConnection = {
    beginTransaction: async () => {},
    query: async <T,>(sql: string, params: unknown[] = []) => {
      calls.push({ sql, params });
      if (sql.includes("FROM task_sessions")) return original as unknown as T[];
      if (sql.includes("DISTINCT t2s.task_id")) {
        return mistakeTaskIds.map((id) => ({ task_id: id })) as unknown as T[];
      }
      return [] as T[];
    },
    execute: async (sql: string, params: unknown[] = []) => {
      calls.push({ sql, params });
      if (sql.startsWith("INSERT INTO task_sessions")) {
        return { insertId: 42, affectedRows: 1 };
      }
      if (sql.startsWith("INSERT INTO tasks2session")) {
        return { insertId: 0, affectedRows: failMappingInsert ? 0 : mistakeTaskIds.length };
      }
      return { insertId: 0, affectedRows: 0 };
    },
    commit: async () => {
      committed = true;
    },
    rollback: async () => {
      rolledBack = true;
    },
    release: () => {},
  };

  return {
    connection,
    calls,
    isCommitted: () => committed,
    isRolledBack: () => rolledBack,
  };
}

const validInput = { userId: 1, sessionId: 5 };

test("repeated start returns the durable review session without creating duplicates", async () => {
  const mock = makeConnection({ original: [{ id: 5, theme_id: 7, session_status: SESSION_STATUS_COMPLETED, mistake_review_session_id: 42 }] });
  const result = await startMistakeReviewRound(validInput, { getConnection: async () => mock.connection });
  assert.equal(result.sessionId, 42);
  assert.equal(mock.calls.filter(c => c.sql.startsWith("INSERT")).length, 0);
  assert.ok(mock.calls.some(c => c.sql.includes("FOR UPDATE") && c.sql.includes("user_id = ?")));
});

test("rejects invalid input", async () => {
  const mock = makeConnection();
  await assert.rejects(
    () =>
      startMistakeReviewRound(
        { userId: 0, sessionId: 5 },
        { getConnection: async () => mock.connection },
      ),
    (error: unknown) =>
      error instanceof StartMistakeReviewRoundError && error.code === "invalid_input",
  );
});

test("starts a new session containing exactly the wrong/skipped task ids", async () => {
  const mock = makeConnection();
  const result = await startMistakeReviewRound(validInput, {
    getConnection: async () => mock.connection,
  });

  assert.equal(result.sessionId, 42);
  assert.equal(result.themeId, 7);
  assert.deepEqual(result.taskIds, [102, 104]);

  const sessionInsert = mock.calls.find((c) =>
    c.sql.startsWith("INSERT INTO task_sessions"),
  );
  assert.ok(sessionInsert);
  // user_id, session_type, theme_id, tasks_number, right_number, time, session_status, start_time, expire_time
  assert.equal(sessionInsert!.params![0], 1);
  assert.equal(sessionInsert!.params![2], 7);
  assert.equal(sessionInsert!.params![3], 2);

  const mappingInsert = mock.calls.find((c) =>
    c.sql.startsWith("INSERT INTO tasks2session"),
  );
  assert.ok(mappingInsert);
  assert.ok(mock.isCommitted());
  assert.ok(!mock.isRolledBack());
});

test("rejects a session that does not belong to this user", async () => {
  const mock = makeConnection({ original: [] });
  await assert.rejects(
    () =>
      startMistakeReviewRound(validInput, { getConnection: async () => mock.connection }),
    (error: unknown) =>
      error instanceof StartMistakeReviewRoundError && error.code === "not_found",
  );
  assert.ok(mock.isRolledBack());
});

test("rejects a session that is not yet completed", async () => {
  const mock = makeConnection({
    original: [{ id: 5, theme_id: 7, session_status: SESSION_STATUS_CREATED }],
  });
  await assert.rejects(
    () =>
      startMistakeReviewRound(validInput, { getConnection: async () => mock.connection }),
    (error: unknown) =>
      error instanceof StartMistakeReviewRoundError && error.code === "not_completed",
  );
  assert.ok(mock.isRolledBack());
});

test("rejects when there are no wrong/skipped tasks to review", async () => {
  const mock = makeConnection({ mistakeTaskIds: [] });
  await assert.rejects(
    () =>
      startMistakeReviewRound(validInput, { getConnection: async () => mock.connection }),
    (error: unknown) =>
      error instanceof StartMistakeReviewRoundError && error.code === "no_mistakes",
  );
  assert.ok(mock.isRolledBack());
});

test("a task fixed via the in-task retry still counts as a mistake (judged by first_attempt_status, not the live status)", async () => {
  // Mirrors the real SQL semantics instead of stubbing the query result:
  // row 1 was wrong first, then corrected via retry (`status` now CORRECT,
  // `first_attempt_status` still INCORRECT); row 2 was a plain skip (both
  // columns INCORRECT); row 3 was answered correctly outright and must be
  // excluded.
  const mappings = [
    { task_id: 201, status: 1 /* CORRECT */, first_attempt_status: -1 /* INCORRECT */ },
    { task_id: 202, status: -1, first_attempt_status: -1 },
    { task_id: 203, status: 1, first_attempt_status: 1 },
  ];
  const calls: Array<{ sql: string; params?: unknown[] }> = [];
  const connection: SqlConnection = {
    beginTransaction: async () => {},
    query: async <T,>(sql: string, params: unknown[] = []) => {
      calls.push({ sql, params });
      if (sql.includes("FROM task_sessions")) {
        return [{ id: 5, theme_id: 7, session_status: SESSION_STATUS_COMPLETED }] as unknown as T[];
      }
      if (sql.includes("DISTINCT t2s.task_id")) {
        const wantStatus = params[2];
        return mappings
          .filter((m) => (m.first_attempt_status ?? m.status) === wantStatus)
          .map((m) => ({ task_id: m.task_id })) as unknown as T[];
      }
      return [] as T[];
    },
    execute: async (sql: string) => {
      calls.push({ sql });
      if (sql.startsWith("INSERT INTO task_sessions")) return { insertId: 42, affectedRows: 1 };
      if (sql.startsWith("INSERT INTO tasks2session")) return { insertId: 0, affectedRows: 2 };
      return { insertId: 0, affectedRows: 0 };
    },
    commit: async () => {},
    rollback: async () => {},
    release: () => {},
  };

  const result = await startMistakeReviewRound(validInput, {
    getConnection: async () => connection,
  });

  assert.deepEqual(result.taskIds.sort(), [201, 202]);
});

test("rolls back and surfaces db_error when the mapping insert fails", async () => {
  const mock = makeConnection({ failMappingInsert: true });
  await assert.rejects(
    () =>
      startMistakeReviewRound(validInput, { getConnection: async () => mock.connection }),
    (error: unknown) =>
      error instanceof StartMistakeReviewRoundError && error.code === "db_error",
  );
  assert.ok(mock.isRolledBack());
});
