import assert from "node:assert/strict";
import test from "node:test";
import type { SqlConnection } from "@/lib/db/mysql";
import { DIAGNOSTIC_TOTAL_QUESTIONS } from "./diagnosticProgress";
import {
  DIAGNOSTIC_MAX_THEMES,
  DIAGNOSTIC_TASKS_PER_THEME,
  StartDiagnosticTestError,
  selectDiagnosticThemeIds,
  startDiagnosticTest,
} from "./startDiagnosticTest";

type Call = { sql: string; params: unknown[] };
const ELIGIBLE_THEME_IDS = [1, 2, 3, 4, 5, 6, 7];

/**
 * `eligibleThemeIds` stands in for the themes the `HAVING COUNT(*) >= N`
 * query would return (in stable curriculum order) — the mock does not
 * re-implement the SQL's own filtering.
 */
function makeConnection(options: { eligibleThemeIds: number[] }) {
  const calls: Call[] = [];
  let rolledBack = false;
  let committed = false;
  let released = false;
  const nextSessionId = 500;

  const connection: SqlConnection = {
    beginTransaction: async () => {},
    query: async <T,>(sql: string, params: unknown[] = []) => {
      calls.push({ sql, params });
      if (sql.includes("FROM themes")) {
        return options.eligibleThemeIds.map((id) => ({
          theme_id: id,
        })) as unknown as T[];
      }
      return [] as T[];
    },
    execute: async (sql: string, params: unknown[] = []) => {
      calls.push({ sql, params });
      if (sql.includes("INSERT INTO task_sessions")) {
        return { insertId: nextSessionId, affectedRows: 1 };
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

test("uses session_type = 5", async () => {
  const mock = makeConnection({ eligibleThemeIds: ELIGIBLE_THEME_IDS });
  await startDiagnosticTest(
    { owner: { userId: 7, guestToken: null } },
    { getConnection: async () => mock.connection },
  );

  const sessionInsert = mock.calls.find((c) =>
    c.sql.includes("INSERT INTO task_sessions"),
  );
  assert.ok(sessionInsert);
  assert.equal(sessionInsert!.params[2], 5);
});

test("sets expire_time to exactly now + 86400 from the injected clock", async () => {
  const mock = makeConnection({ eligibleThemeIds: ELIGIBLE_THEME_IDS });
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

test("plans 10 tasks across exactly five session-stable random themes and links none up front", async () => {
  const mock = makeConnection({ eligibleThemeIds: ELIGIBLE_THEME_IDS });
  const result = await startDiagnosticTest(
    { owner: { userId: 7, guestToken: null } },
    { getConnection: async () => mock.connection },
  );

  assert.equal(DIAGNOSTIC_TOTAL_QUESTIONS, 10);
  assert.equal(result.themeIds.length, DIAGNOSTIC_MAX_THEMES);
  assert.equal(new Set(result.themeIds).size, DIAGNOSTIC_MAX_THEMES);
  assert.deepEqual(
    result.themeIds,
    selectDiagnosticThemeIds(ELIGIBLE_THEME_IDS, result.sessionId),
  );
  const sessionInsert = mock.calls.find((c) =>
    c.sql.includes("INSERT INTO task_sessions"),
  );
  // columns: user_id, guest_token, session_type, tasks_number, ...
  assert.equal(sessionInsert!.params[3], DIAGNOSTIC_TOTAL_QUESTIONS);
  assert.ok(
    !mock.calls.some((c) => c.sql.includes("INSERT INTO tasks2session")),
    "tasks are linked adaptively later, never at start",
  );
});

test("no longer records an overall self-assessment", async () => {
  const mock = makeConnection({ eligibleThemeIds: ELIGIBLE_THEME_IDS });
  await startDiagnosticTest(
    { owner: { userId: 7, guestToken: null }, selfScore: 5 },
    { getConnection: async () => mock.connection },
  );
  assert.ok(
    !mock.calls.some((c) => c.sql.includes("user_self_scores")),
    "self-assessment is per topic now (startDiagnosticTopic)",
  );
});

test("loads eligible themes from MySQL and requires at least three quiz tasks per theme", async () => {
  const mock = makeConnection({ eligibleThemeIds: ELIGIBLE_THEME_IDS });
  await startDiagnosticTest(
    { owner: { userId: 7, guestToken: null } },
    { getConnection: async () => mock.connection },
  );

  const eligibleThemesQuery = mock.calls.find((c) => c.sql.includes("FROM themes"));
  assert.doesNotMatch(eligibleThemesQuery!.sql, /LIMIT\s+5\b/);
  assert.match(
    eligibleThemesQuery!.sql,
    new RegExp(`HAVING COUNT\\(q\\.id\\) >= ${DIAGNOSTIC_TASKS_PER_THEME}\\b`),
  );
  assert.ok(DIAGNOSTIC_MAX_THEMES * DIAGNOSTIC_TASKS_PER_THEME >= DIAGNOSTIC_TOTAL_QUESTIONS);
});

test("theme selection is stable for one session and varies across sessions", () => {
  const first = selectDiagnosticThemeIds(ELIGIBLE_THEME_IDS, 500);
  assert.deepEqual(first, selectDiagnosticThemeIds(ELIGIBLE_THEME_IDS, 500));
  assert.notDeepEqual(first, selectDiagnosticThemeIds(ELIGIBLE_THEME_IDS, 501));
});

test("rejects an ambiguous owner before touching the database", async () => {
  await assert.rejects(
    () =>
      startDiagnosticTest(
        { owner: { userId: 7, guestToken: "guest-a" } },
        { getConnection: async () => { throw new Error("should not be called"); } },
      ),
    (error: unknown) =>
      error instanceof StartDiagnosticTestError && error.code === "invalid_input",
  );
});

test("rolls back and reports insufficient_tasks when fewer than five themes are eligible", async () => {
  const mock = makeConnection({ eligibleThemeIds: [1, 2, 3, 4] });
  await assert.rejects(
    () =>
      startDiagnosticTest(
        { owner: { userId: 7, guestToken: null } },
        { getConnection: async () => mock.connection },
      ),
    (error: unknown) => {
      assert.ok(error instanceof StartDiagnosticTestError);
      assert.equal((error as StartDiagnosticTestError).code, "insufficient_tasks");
      return true;
    },
  );

  assert.ok(mock.isRolledBack());
  assert.ok(!mock.isCommitted());
  assert.ok(mock.isReleased());
  assert.ok(
    !mock.calls.some((c) => c.sql.includes("INSERT INTO task_sessions")),
    "no orphan session row on failure",
  );
});

test("commits and releases the connection on success", async () => {
  const mock = makeConnection({ eligibleThemeIds: ELIGIBLE_THEME_IDS });
  await startDiagnosticTest(
    { owner: { userId: 7, guestToken: null } },
    { getConnection: async () => mock.connection },
  );
  assert.ok(mock.isCommitted());
  assert.ok(!mock.isRolledBack());
  assert.ok(mock.isReleased());
});

test("writes the task_sessions row for a guest owner", async () => {
  const mock = makeConnection({ eligibleThemeIds: ELIGIBLE_THEME_IDS });
  await startDiagnosticTest(
    { owner: { userId: null, guestToken: "guest-a" } },
    { getConnection: async () => mock.connection },
  );

  const sessionInsert = mock.calls.find((c) => c.sql.includes("INSERT INTO task_sessions"));
  assert.deepEqual(sessionInsert!.params.slice(0, 2), [null, "guest-a"]);
});

test("a guest owner can start a fresh diagnostic even though their previous attempt is already past its 24h deadline", async () => {
  // startDiagnosticTest never looks up the owner's prior task_sessions rows —
  // an expired (or still-valid) previous attempt must never block a new one.
  // Two independent calls for the same guest, with the clock advanced well
  // past the first session's deadline, both have to succeed on their own.
  const firstMock = makeConnection({ eligibleThemeIds: ELIGIBLE_THEME_IDS });
  const firstNow = 1_700_000_000;
  const first = await startDiagnosticTest(
    { owner: { userId: null, guestToken: "guest-expired" } },
    { getConnection: async () => firstMock.connection, nowSec: () => firstNow },
  );
  assert.ok(first.sessionId);

  const secondMock = makeConnection({ eligibleThemeIds: ELIGIBLE_THEME_IDS });
  const secondNow = firstNow + 2 * 24 * 60 * 60; // well past the first session's 24h deadline
  const second = await startDiagnosticTest(
    { owner: { userId: null, guestToken: "guest-expired" } },
    { getConnection: async () => secondMock.connection, nowSec: () => secondNow },
  );
  assert.ok(second.sessionId);
  assert.ok(secondMock.isCommitted());
});

test("an authenticated user can start a fresh diagnostic even though their previous attempt is already past its 24h deadline", async () => {
  const firstMock = makeConnection({ eligibleThemeIds: ELIGIBLE_THEME_IDS });
  const firstNow = 1_700_000_000;
  await startDiagnosticTest(
    { owner: { userId: 7, guestToken: null } },
    { getConnection: async () => firstMock.connection, nowSec: () => firstNow },
  );

  const secondMock = makeConnection({ eligibleThemeIds: ELIGIBLE_THEME_IDS });
  const secondNow = firstNow + 2 * 24 * 60 * 60;
  const second = await startDiagnosticTest(
    { owner: { userId: 7, guestToken: null } },
    { getConnection: async () => secondMock.connection, nowSec: () => secondNow },
  );
  assert.ok(second.sessionId);
  assert.ok(secondMock.isCommitted());
});

test("guest and authenticated owners are isolated: each call only ever writes its own identifiers", async () => {
  const guestMock = makeConnection({ eligibleThemeIds: ELIGIBLE_THEME_IDS });
  await startDiagnosticTest(
    { owner: { userId: null, guestToken: "guest-isolated" } },
    { getConnection: async () => guestMock.connection },
  );
  const guestSessionInsert = guestMock.calls.find((c) =>
    c.sql.includes("INSERT INTO task_sessions"),
  );
  assert.deepEqual(guestSessionInsert!.params.slice(0, 2), [null, "guest-isolated"]);

  const userMock = makeConnection({ eligibleThemeIds: ELIGIBLE_THEME_IDS });
  await startDiagnosticTest(
    { owner: { userId: 42, guestToken: null } },
    { getConnection: async () => userMock.connection },
  );
  const userSessionInsert = userMock.calls.find((c) =>
    c.sql.includes("INSERT INTO task_sessions"),
  );
  assert.deepEqual(userSessionInsert!.params.slice(0, 2), [42, null]);

  // Neither call's params ever mention the other owner's identifier.
  assert.ok(!guestMock.calls.some((c) => c.params.includes(42)));
  assert.ok(!userMock.calls.some((c) => c.params.includes("guest-isolated")));
});

test("prevents a duplicate submission while a request is already pending for the same owner", async () => {
  const mock = makeConnection({ eligibleThemeIds: ELIGIBLE_THEME_IDS });

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
