import assert from "node:assert/strict";
import test from "node:test";

import type { SqlConnection } from "@/lib/db/mysql";
import {
  SESSION_STATUS_PLANNED,
  SESSION_TYPE_MENTOR,
} from "@/modules/sessions/types";
import { TOPIC_TEST_TASK_COUNT } from "@/modules/testing/startTopicTest";

import {
  createMentorSession,
  CreateMentorSessionError,
  validateCreateMentorSessionInput,
} from "./createMentorSession";

function makeConnection(options: {
  themeExists?: boolean;
  existingSessionId?: number;
  insertId?: number;
} = {}) {
  const executeCalls: Array<{ sql: string; params: unknown[] }> = [];

  const connection: SqlConnection = {
    beginTransaction: async () => {},
    query: async <T,>(sql: string) => {
      if (sql.includes("FROM themes")) {
        return (options.themeExists === false ? [] : [{ id: 1 }]) as T[];
      }
      if (sql.includes("SELECT id") && sql.includes("session_type")) {
        return (options.existingSessionId
          ? [{ id: options.existingSessionId }]
          : []) as T[];
      }
      return [] as T[];
    },
    execute: async (sql, params: unknown[] = []) => {
      executeCalls.push({ sql, params });
      return { insertId: options.insertId ?? 501, affectedRows: 1 };
    },
    commit: async () => {},
    rollback: async () => {},
    release: () => {},
  };

  return { connection, executeCalls };
}

test("validateCreateMentorSessionInput rejects invalid payload", () => {
  assert.throws(
    () => validateCreateMentorSessionInput({ userId: 0, themeId: 2 }),
    (error: unknown) =>
      error instanceof CreateMentorSessionError &&
      error.code === "invalid_input",
  );
});

test("createMentorSession inserts planned mentor session", async () => {
  const { connection, executeCalls } = makeConnection({ insertId: 777 });

  const result = await createMentorSession(
    { userId: 1, themeId: 5 },
    { getConnection: async () => connection },
  );

  assert.deepEqual(result, { sessionId: 777, created: true });
  const insert = executeCalls.find((call) =>
    call.sql.includes("INSERT INTO task_sessions"),
  );
  assert.ok(insert);
  assert.deepEqual(insert?.params, [
    1,
    SESSION_TYPE_MENTOR,
    5,
    TOPIC_TEST_TASK_COUNT,
    SESSION_STATUS_PLANNED,
  ]);
});

test("createMentorSession returns existing planned mentor session without duplicate insert", async () => {
  const { connection, executeCalls } = makeConnection({ existingSessionId: 88 });

  const result = await createMentorSession(
    { userId: 1, themeId: 5 },
    { getConnection: async () => connection },
  );

  assert.deepEqual(result, { sessionId: 88, created: false });
  assert.equal(
    executeCalls.some((call) => call.sql.includes("INSERT INTO task_sessions")),
    false,
  );
});

test("createMentorSession rejects unknown theme", async () => {
  const { connection } = makeConnection({ themeExists: false });

  await assert.rejects(
    () =>
      createMentorSession(
        { userId: 1, themeId: 999 },
        { getConnection: async () => connection },
      ),
    (error: unknown) =>
      error instanceof CreateMentorSessionError &&
      error.code === "theme_not_found",
  );
});
