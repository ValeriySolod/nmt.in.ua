import assert from "node:assert/strict";
import test from "node:test";
import type { SqlConnection } from "@/lib/db/mysql";
import { SESSION_STATUS_COMPLETED, SESSION_STATUS_CREATED } from "@/modules/sessions/types";
import { TASK_STATUS_CORRECT, TASK_STATUS_INCORRECT, TASK_STATUS_UNANSWERED } from "@/modules/testing/types";
import {
  DIAGNOSTIC_SUMMARY_THEME_ID,
  DIAGNOSTIC_SUMMARY_THEME_NAME,
  FinishDiagnosticSessionError,
  finishDiagnosticSession,
} from "./finishDiagnosticSession";
import { DIAGNOSTIC_TOTAL_QUESTIONS } from "./diagnosticProgress";

type SessionRow = {
  id: number;
  tasks_number: number;
  right_number: number;
  time: number;
  start_time: number;
  session_status: number;
  expire_time: number;
};

function makeConnection(options: {
  session: SessionRow | null;
  statuses: number[];
  nowSec?: number;
}) {
  const calls: Array<{ sql: string; params?: unknown[] }> = [];
  let rolledBack = false;
  let committed = false;

  const connection: SqlConnection = {
    beginTransaction: async () => {},
    query: async <T,>(sql: string, params: unknown[] = []) => {
      calls.push({ sql, params });
      if (sql.includes("FROM task_sessions")) {
        return (options.session ? [options.session] : []) as unknown as T[];
      }
      if (sql.includes("FROM tasks2session")) {
        return options.statuses.map((status) => ({ status })) as unknown as T[];
      }
      return [] as T[];
    },
    execute: async (sql: string, params: unknown[] = []) => {
      calls.push({ sql, params });
      if (sql.includes("UPDATE task_sessions")) {
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
    release: () => {},
  };

  return {
    connection,
    calls,
    isCommitted: () => committed,
    isRolledBack: () => rolledBack,
  };
}

const owner = { userId: null, guestToken: "guest-a" };

test("aggregates answers into a diagnostic summary with the sentinel theme fields", async () => {
  const mock = makeConnection({
    session: { id: 5, tasks_number: 6, right_number: 0, time: 0, start_time: 100, session_status: SESSION_STATUS_CREATED, expire_time: 9_999_999_999 },
    statuses: [TASK_STATUS_CORRECT, TASK_STATUS_CORRECT, TASK_STATUS_INCORRECT, TASK_STATUS_CORRECT, TASK_STATUS_INCORRECT, TASK_STATUS_CORRECT],
  });

  const summary = await finishDiagnosticSession(
    { owner, sessionId: 5 },
    { getConnection: async () => mock.connection, nowSec: () => 160 },
  );

  assert.equal(summary.themeId, DIAGNOSTIC_SUMMARY_THEME_ID);
  assert.equal(summary.themeName, DIAGNOSTIC_SUMMARY_THEME_NAME);
  assert.equal(summary.rightNumber, 4);
  assert.equal(summary.tasksNumber, 6);
  assert.ok(mock.isCommitted());
});

test("rejects when any mapping is still unanswered", async () => {
  const mock = makeConnection({
    session: { id: 5, tasks_number: 3, right_number: 0, time: 0, start_time: 100, session_status: SESSION_STATUS_CREATED, expire_time: 9_999_999_999 },
    statuses: [TASK_STATUS_CORRECT, TASK_STATUS_UNANSWERED, TASK_STATUS_INCORRECT],
  });

  await assert.rejects(
    () => finishDiagnosticSession({ owner, sessionId: 5 }, { getConnection: async () => mock.connection }),
    (error: unknown) =>
      error instanceof FinishDiagnosticSessionError && error.code === "unfinished",
  );
  assert.ok(mock.isRolledBack());
});

test("rejects finishing an active diagnostic session past its 24h deadline", async () => {
  const now = 1_700_000_000;
  const mock = makeConnection({
    session: { id: 5, tasks_number: 3, right_number: 0, time: 0, start_time: 100, session_status: SESSION_STATUS_CREATED, expire_time: now - 1 },
    statuses: [TASK_STATUS_CORRECT, TASK_STATUS_CORRECT, TASK_STATUS_INCORRECT],
  });

  await assert.rejects(
    () =>
      finishDiagnosticSession(
        { owner, sessionId: 5 },
        { getConnection: async () => mock.connection, nowSec: () => now },
      ),
    (error: unknown) =>
      error instanceof FinishDiagnosticSessionError &&
      error.code === "session_expired",
  );
  assert.ok(mock.isRolledBack());
});

test("guest A cannot finish guest B's session (owner mismatch -> not_found)", async () => {
  const mock = makeConnection({ session: null, statuses: [] });
  await assert.rejects(
    () => finishDiagnosticSession({ owner, sessionId: 5 }, { getConnection: async () => mock.connection }),
    (error: unknown) =>
      error instanceof FinishDiagnosticSessionError && error.code === "not_found",
  );
  assert.ok(mock.isRolledBack());
});

test("returns the stored summary without UPDATE when already completed", async () => {
  const mock = makeConnection({
    session: { id: 5, tasks_number: 6, right_number: 4, time: 42, start_time: 100, session_status: SESSION_STATUS_COMPLETED, expire_time: 1 },
    statuses: [],
  });

  const summary = await finishDiagnosticSession(
    { owner, sessionId: 5 },
    { getConnection: async () => mock.connection },
  );
  assert.equal(summary.rightNumber, 4);
  assert.equal(mock.calls.filter((c) => c.sql.trim().startsWith("UPDATE")).length, 0);
});

// --- Adaptive attempts: the finish endpoint enforces the 10-task target ---

type AdaptiveTask = { id: number; themeId: number; difficulty: number };
type AdaptiveLink = {
  task_id: number;
  theme_id: number;
  difficulty: number;
  status: number;
};

/** Session row as `startDiagnosticTest` creates it for an adaptive attempt. */
function adaptiveSession(overrides: Partial<SessionRow> = {}): SessionRow {
  return {
    id: 5,
    tasks_number: DIAGNOSTIC_TOTAL_QUESTIONS,
    right_number: 0,
    time: 0,
    start_time: 100,
    session_status: SESSION_STATUS_CREATED,
    expire_time: 9_999_999_999,
    ...overrides,
  };
}

/** Linked tasks, all answered, drawn in order from `themeIds` (2 per theme). */
function answeredLinks(count: number, themeIds: number[]): AdaptiveLink[] {
  return Array.from({ length: count }, (_, i) => ({
    task_id: 1000 + i,
    theme_id: themeIds[Math.floor(i / 2)] ?? themeIds.at(-1)!,
    difficulty: 2,
    status: i % 3 === 0 ? TASK_STATUS_INCORRECT : TASK_STATUS_CORRECT,
  }));
}

function makeAdaptiveConnection(options: {
  session: SessionRow;
  sessionOwner: { userId: number | null; guestToken: string | null };
  links: AdaptiveLink[];
  plannedThemeIds: number[];
  bank: AdaptiveTask[];
}) {
  const calls: Array<{ sql: string; params?: unknown[] }> = [];
  let rolledBack = false;
  let committed = false;

  // Mirrors `ownerClause`: params are [userId, userId, guestToken, guestToken].
  const matchesOwner = (params: unknown[]) => {
    const [userId, , guestToken] = params;
    return userId !== null && userId !== undefined
      ? userId === options.sessionOwner.userId
      : guestToken === options.sessionOwner.guestToken &&
          options.sessionOwner.userId === null;
  };

  const connection: SqlConnection = {
    beginTransaction: async () => {},
    query: async <T,>(sql: string, params: unknown[] = []) => {
      calls.push({ sql, params });
      if (sql.includes("FROM task_sessions")) {
        return (matchesOwner(params.slice(1)) ? [options.session] : []) as unknown as T[];
      }
      if (sql.includes("FROM tasks2session t2s")) {
        return (matchesOwner(params.slice(1)) ? options.links : []) as unknown as T[];
      }
      if (sql.includes("FROM tasks2session")) {
        return (matchesOwner(params.slice(1)) ? options.links : []).map((link) => ({
          status: link.status,
        })) as unknown as T[];
      }
      if (sql.includes("FROM themes t")) {
        return options.plannedThemeIds.map((id) => ({ theme_id: id })) as unknown as T[];
      }
      if (sql.includes("FROM quiz_tasks WHERE theme_id")) {
        return options.bank
          .filter((task) => task.themeId === params[0])
          .map((task) => ({ id: task.id, difficulty: task.difficulty })) as unknown as T[];
      }
      return [] as T[];
    },
    execute: async (sql: string, params: unknown[] = []) => {
      calls.push({ sql, params });
      if (sql.includes("UPDATE task_sessions")) {
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
    release: () => {},
  };

  return {
    connection,
    calls,
    isCommitted: () => committed,
    isRolledBack: () => rolledBack,
    updates: () => calls.filter((c) => c.sql.includes("UPDATE task_sessions")),
  };
}

/** 12 tasks per theme across difficulty levels 1-3 — plenty left to supply. */
function fullBank(themeIds: number[]): AdaptiveTask[] {
  return themeIds.flatMap((themeId) =>
    Array.from({ length: 12 }, (_, i) => ({
      id: themeId * 100 + i,
      themeId,
      difficulty: 1 + (i % 3),
    })),
  );
}

const PLAN = [11, 12, 13, 14, 15];

test("adaptive: cannot finish with fewer than 10 answered tasks while more can still be supplied", async () => {
  for (const linked of [1, 2, 5, 9]) {
    const mock = makeAdaptiveConnection({
      session: adaptiveSession(),
      sessionOwner: owner,
      links: answeredLinks(linked, PLAN),
      plannedThemeIds: PLAN,
      bank: fullBank(PLAN),
    });
    await assert.rejects(
      () =>
        finishDiagnosticSession(
          { owner, sessionId: 5 },
          { getConnection: async () => mock.connection },
        ),
      (error: unknown) =>
        error instanceof FinishDiagnosticSessionError && error.code === "unfinished",
      `linked=${linked}`,
    );
    assert.equal(mock.updates().length, 0, `linked=${linked}: nothing stored`);
    assert.ok(mock.isRolledBack());
    assert.ok(!mock.isCommitted());
  }
});

test("adaptive: finishes once all 10 tasks are answered", async () => {
  const mock = makeAdaptiveConnection({
    session: adaptiveSession(),
    sessionOwner: owner,
    links: answeredLinks(DIAGNOSTIC_TOTAL_QUESTIONS, PLAN),
    plannedThemeIds: PLAN,
    bank: fullBank(PLAN),
  });
  const summary = await finishDiagnosticSession(
    { owner, sessionId: 5 },
    { getConnection: async () => mock.connection, nowSec: () => 160 },
  );
  assert.equal(summary.tasksNumber, DIAGNOSTIC_TOTAL_QUESTIONS);
  assert.equal(mock.updates().length, 1);
  assert.ok(mock.isCommitted());
});

test("adaptive: another guest or a user cannot finish a short attempt they do not own", async () => {
  for (const intruder of [
    { userId: null, guestToken: "guest-b" },
    { userId: 7, guestToken: null },
  ]) {
    const mock = makeAdaptiveConnection({
      session: adaptiveSession(),
      sessionOwner: owner,
      links: answeredLinks(2, PLAN),
      plannedThemeIds: PLAN,
      bank: fullBank(PLAN),
    });
    await assert.rejects(
      () =>
        finishDiagnosticSession(
          { owner: intruder, sessionId: 5 },
          { getConnection: async () => mock.connection },
        ),
      (error: unknown) =>
        error instanceof FinishDiagnosticSessionError && error.code === "not_found",
    );
    assert.equal(mock.updates().length, 0);
  }
});

test("adaptive: an expired attempt is still rejected as expired", async () => {
  const now = 1_700_000_000;
  const mock = makeAdaptiveConnection({
    session: adaptiveSession({ expire_time: now - 1 }),
    sessionOwner: owner,
    links: answeredLinks(DIAGNOSTIC_TOTAL_QUESTIONS, PLAN),
    plannedThemeIds: PLAN,
    bank: fullBank(PLAN),
  });
  await assert.rejects(
    () =>
      finishDiagnosticSession(
        { owner, sessionId: 5 },
        { getConnection: async () => mock.connection, nowSec: () => now },
      ),
    (error: unknown) =>
      error instanceof FinishDiagnosticSessionError && error.code === "session_expired",
  );
  assert.equal(mock.updates().length, 0);
});

test("legacy fixed-set sessions (tasks_number == linked count) finish exactly as before", async () => {
  // The legacy start linked its whole task set and stored that count, so the
    // finish rule never consults the adaptive plan for it — even below the
    // current target.
  for (const count of [6, 30]) {
    const mock = makeAdaptiveConnection({
      session: adaptiveSession({ tasks_number: count }),
      sessionOwner: owner,
      links: answeredLinks(count, PLAN),
      plannedThemeIds: PLAN,
      bank: fullBank(PLAN),
    });
    const summary = await finishDiagnosticSession(
      { owner, sessionId: 5 },
      { getConnection: async () => mock.connection, nowSec: () => 160 },
    );
    assert.equal(summary.tasksNumber, count);
    assert.ok(
      !mock.calls.some((c) => c.sql.includes("FROM themes t")),
      "no adaptive-plan lookup for a legacy session",
    );
  }
});

test("adaptive: finishes short when no eligible unused task is left anywhere", async () => {
  // One eligible theme whose whole bank (3 tasks) is already used: the flow
  // cannot supply a 4th task, so the attempt is not blocked forever.
  const bank = [
    { id: 1101, themeId: 11, difficulty: 1 },
    { id: 1102, themeId: 11, difficulty: 2 },
    { id: 1103, themeId: 11, difficulty: 3 },
  ];
  const mock = makeAdaptiveConnection({
    session: adaptiveSession(),
    sessionOwner: owner,
    links: bank.map((task) => ({
      task_id: task.id,
      theme_id: 11,
      difficulty: task.difficulty,
      status: TASK_STATUS_CORRECT,
    })),
    plannedThemeIds: [11],
    bank,
  });
  const summary = await finishDiagnosticSession(
    { owner, sessionId: 5 },
    { getConnection: async () => mock.connection, nowSec: () => 160 },
  );
  assert.equal(summary.tasksNumber, 3);
  assert.equal(summary.rightNumber, 3);
  assert.ok(mock.isCommitted());
});

test("adaptive: stays unfinished while another eligible topic can still be supplied", async () => {
  // Theme 11 is exhausted, but theme 12 is still eligible and unused.
  const mock = makeAdaptiveConnection({
    session: adaptiveSession(),
    sessionOwner: owner,
    links: [{ task_id: 1101, theme_id: 11, difficulty: 2, status: TASK_STATUS_CORRECT }],
    plannedThemeIds: [11, 12],
    bank: [{ id: 1101, themeId: 11, difficulty: 2 }, ...fullBank([12])],
  });
  await assert.rejects(
    () =>
      finishDiagnosticSession(
        { owner, sessionId: 5 },
        { getConnection: async () => mock.connection },
      ),
    (error: unknown) =>
      error instanceof FinishDiagnosticSessionError && error.code === "unfinished",
  );
  assert.equal(mock.updates().length, 0);
});
