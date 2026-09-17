import assert from "node:assert/strict";
import test from "node:test";
import type { SqlConnection } from "@/lib/db/mysql";
import { SESSION_STATUS_COMPLETED, SESSION_STATUS_CREATED } from "@/modules/sessions/types";
import {
  addSpacedRepetitionTask,
  AddSpacedRepetitionTaskError,
} from "./addSpacedRepetitionTask";
import { TASK_STATUS_CORRECT, TASK_STATUS_INCORRECT } from "./types";

type SessionRow = { session_type: number; session_status: number; expire_time: number };
type HistoryRow = { theme_id: number | null; status: number };

type Options = {
  session?: SessionRow[];
  history?: HistoryRow[];
  usedTaskIds?: number[];
  candidates?: { id: number; difficulty: number }[];
  failInsert?: boolean;
};

function makeConnection(options: Options = {}) {
  const {
    session = [
      { session_type: 1, session_status: SESSION_STATUS_CREATED, expire_time: 9_999_999_999 },
    ],
    history = [
      { theme_id: 7, status: TASK_STATUS_INCORRECT },
      { theme_id: 8, status: TASK_STATUS_CORRECT },
      { theme_id: 9, status: TASK_STATUS_CORRECT },
      { theme_id: 10, status: TASK_STATUS_CORRECT },
      { theme_id: 11, status: TASK_STATUS_CORRECT },
    ],
    usedTaskIds = [201],
    candidates = [
      { id: 201, difficulty: 1 },
      { id: 202, difficulty: 1 },
    ],
    failInsert = false,
  } = options;

  const calls: Array<{ sql: string; params?: unknown[] }> = [];
  let rolledBack = false;
  let committed = false;

  const connection: SqlConnection = {
    beginTransaction: async () => {},
    query: async <T,>(sql: string, params: unknown[] = []) => {
      calls.push({ sql, params });
      if (sql.includes("FROM task_sessions")) return session as unknown as T[];
      if (sql.includes("COALESCE(t2s.first_attempt_status")) {
        return history as unknown as T[];
      }
      if (sql.includes("task_id FROM tasks2session")) {
        return usedTaskIds.map((id) => ({ task_id: id })) as unknown as T[];
      }
      if (sql.includes("SELECT id, difficulty FROM quiz_tasks")) {
        return candidates as unknown as T[];
      }
      if (sql.includes("FROM quiz_tasks WHERE id = ?")) {
        return [
          {
            id: params[0],
            name: "Repeat task",
            task_text: "5 = ?",
            answer_1: "1",
            answer_2: "2",
            answer_3: "3",
            answer_4: "4",
          },
        ] as unknown as T[];
      }
      return [] as T[];
    },
    execute: async (sql: string, params: unknown[] = []) => {
      calls.push({ sql, params });
      if (sql.startsWith("INSERT INTO tasks2session")) {
        return { insertId: 555, affectedRows: failInsert ? 0 : 1 };
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

test("rejects invalid input", async () => {
  const mock = makeConnection();
  await assert.rejects(
    () =>
      addSpacedRepetitionTask(
        { userId: 0, sessionId: 5 },
        { getConnection: async () => mock.connection },
      ),
    (error: unknown) =>
      error instanceof AddSpacedRepetitionTaskError && error.code === "invalid_input",
  );
});

test("adds a repetition task once a theme's mistake has waited the full interval", async () => {
  const mock = makeConnection();
  const result = await addSpacedRepetitionTask(validInput, {
    getConnection: async () => mock.connection,
  });
  assert.deepEqual(result, {
    added: true,
    mappingId: 555,
    task: {
      mappingId: 555,
      taskId: 202,
      name: "Repeat task",
      taskText: "5 = ?",
      answers: [
        { number: 1, text: "1" },
        { number: 2, text: "2" },
        { number: 3, text: "3" },
        { number: 4, text: "4" },
      ],
      status: 0,
    },
  });
  assert.ok(mock.isCommitted());
});

test("returns added:false (not an error) when nothing is due yet", async () => {
  const mock = makeConnection({
    history: [{ theme_id: 7, status: TASK_STATUS_INCORRECT }],
  });
  const result = await addSpacedRepetitionTask(validInput, {
    getConnection: async () => mock.connection,
  });
  assert.deepEqual(result, { added: false });
  assert.ok(mock.isCommitted());
});

test("returns added:false when the theme bank has no other candidate", async () => {
  const mock = makeConnection({ usedTaskIds: [201, 202], candidates: [{ id: 201, difficulty: 1 }, { id: 202, difficulty: 1 }] });
  const result = await addSpacedRepetitionTask(validInput, {
    getConnection: async () => mock.connection,
  });
  assert.deepEqual(result, { added: false });
});

test("rejects diagnostic (5) and NMT (4) sessions", async () => {
  for (const sessionType of [4, 5]) {
    const mock = makeConnection({
      session: [{ session_type: sessionType, session_status: SESSION_STATUS_CREATED, expire_time: 9_999_999_999 }],
    });
    await assert.rejects(
      () => addSpacedRepetitionTask(validInput, { getConnection: async () => mock.connection }),
      (error: unknown) =>
        error instanceof AddSpacedRepetitionTaskError && error.code === "not_eligible",
    );
  }
});

test("rejects a completed session", async () => {
  const mock = makeConnection({
    session: [{ session_type: 1, session_status: SESSION_STATUS_COMPLETED, expire_time: 9_999_999_999 }],
  });
  await assert.rejects(
    () => addSpacedRepetitionTask(validInput, { getConnection: async () => mock.connection }),
    (error: unknown) =>
      error instanceof AddSpacedRepetitionTaskError && error.code === "not_eligible",
  );
});

test("rejects a session that does not belong to this user", async () => {
  const mock = makeConnection({ session: [] });
  await assert.rejects(
    () => addSpacedRepetitionTask(validInput, { getConnection: async () => mock.connection }),
    (error: unknown) =>
      error instanceof AddSpacedRepetitionTaskError && error.code === "not_found",
  );
});

test("rejects once the session's 24h deadline has passed", async () => {
  const now = 1_700_000_000;
  const mock = makeConnection({
    session: [{ session_type: 1, session_status: SESSION_STATUS_CREATED, expire_time: now - 1 }],
  });
  await assert.rejects(
    () =>
      addSpacedRepetitionTask(validInput, {
        getConnection: async () => mock.connection,
        nowSec: () => now,
      }),
    (error: unknown) =>
      error instanceof AddSpacedRepetitionTaskError && error.code === "session_expired",
  );
});

test("a second call after the first commits does not insert a duplicate repetition task for the same theme", async () => {
  // A minimal shared-store fake: the second call re-reads history fresh
  // (as it would after the first call's transaction commits and releases
  // the SELECT ... FOR UPDATE lock on the session row), sees the first
  // call's own repetition row (tagged 'repetition' in practice_task_origin)
  // and correctly treats that theme as no longer due.
  const usedTaskIds = [201];
  const mappings: Array<{ id: number; task_id: number }> = [];
  const origins: Array<{ tasks2session_id: number; origin: string }> = [];
  let nextId = 1000;
  const baseHistory = [
    { theme_id: 7, status: TASK_STATUS_INCORRECT },
    { theme_id: 8, status: TASK_STATUS_CORRECT },
    { theme_id: 9, status: TASK_STATUS_CORRECT },
    { theme_id: 10, status: TASK_STATUS_CORRECT },
    { theme_id: 11, status: TASK_STATUS_CORRECT },
  ];

  function makeSharedConnection(): SqlConnection {
    return {
      beginTransaction: async () => {},
      query: async <T,>(sql: string) => {
        if (sql.includes("FROM task_sessions")) {
          return [
            { session_type: 1, session_status: SESSION_STATUS_CREATED, expire_time: 9_999_999_999 },
          ] as unknown as T[];
        }
        if (sql.includes("COALESCE(t2s.first_attempt_status")) {
          const followUps = mappings.map((m) => ({
            theme_id: 7,
            status: TASK_STATUS_CORRECT,
            origin: origins.find((o) => o.tasks2session_id === m.id)?.origin ?? null,
          }));
          return [...baseHistory.map((h) => ({ ...h, origin: null })), ...followUps] as unknown as T[];
        }
        if (sql.includes("task_id FROM tasks2session")) {
          return usedTaskIds.map((id) => ({ task_id: id })) as unknown as T[];
        }
        if (sql.includes("SELECT id, difficulty FROM quiz_tasks")) {
          return [
            { id: 201, difficulty: 1 },
            { id: 202, difficulty: 1 },
          ] as unknown as T[];
        }
        if (sql.includes("FROM quiz_tasks WHERE id = ?")) {
          return [
            { id: 202, name: "Repeat", task_text: "?", answer_1: "1", answer_2: "2", answer_3: "3", answer_4: "4" },
          ] as unknown as T[];
        }
        return [] as T[];
      },
      execute: async (sql: string, params: unknown[] = []) => {
        if (sql.startsWith("INSERT INTO tasks2session")) {
          const id = nextId++;
          mappings.push({ id, task_id: 202 });
          return { insertId: id, affectedRows: 1 };
        }
        if (sql.startsWith("INSERT INTO practice_task_origin")) {
          const [tasks2sessionId] = params as number[];
          origins.push({ tasks2session_id: tasks2sessionId, origin: "repetition" });
          return { insertId: 0, affectedRows: 1 };
        }
        return { insertId: 0, affectedRows: 0 };
      },
      commit: async () => {},
      rollback: async () => {},
      release: () => {},
    };
  }

  const first = await addSpacedRepetitionTask(validInput, {
    getConnection: async () => makeSharedConnection(),
  });
  assert.equal(first.added, true);

  const second = await addSpacedRepetitionTask(validInput, {
    getConnection: async () => makeSharedConnection(),
  });
  assert.deepEqual(second, { added: false });
  assert.equal(mappings.length, 1, "only one repetition row was ever inserted for the theme");
});

test("rolls back and surfaces db_error when the insert fails", async () => {
  const mock = makeConnection({ failInsert: true });
  await assert.rejects(
    () => addSpacedRepetitionTask(validInput, { getConnection: async () => mock.connection }),
    (error: unknown) =>
      error instanceof AddSpacedRepetitionTaskError && error.code === "db_error",
  );
  assert.ok(mock.isRolledBack());
});
