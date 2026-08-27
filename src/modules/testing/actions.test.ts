import { test } from "node:test";
import assert from "node:assert/strict";
import type { SqlConnection } from "@/lib/db/mysql";
import { startTopicTest, TOPIC_TEST_TASK_COUNT } from "./startTopicTest";
import { startTopicTestAction, type StartTopicTestActionState } from "./actions";

const IDLE_STATE: StartTopicTestActionState = { status: "idle" };

function formDataWith(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  return formData;
}

test("ignores any client-supplied userId and always uses the trusted demo user id", async () => {
  let capturedInput: unknown;
  const spy = (async (input: { userId: number; themeId: number }) => {
    capturedInput = input;
    return { sessionId: 555, themeId: input.themeId, taskIds: [] };
  }) as typeof startTopicTest;

  const formData = formDataWith({ themeId: "2", userId: "999" });

  await startTopicTestAction(IDLE_STATE, formData, { startTopicTest: spy });

  assert.deepEqual(capturedInput, { userId: 1, themeId: 2 });
});

test("the created session receives user_id = 1", async () => {
  const tasks = Array.from({ length: TOPIC_TEST_TASK_COUNT }, (_, i) => ({
    id: i + 1,
  }));

  const insertCalls: { sql: string; params: unknown[] }[] = [];
  const connection: SqlConnection = {
    beginTransaction: async () => {},
    query: async <T,>(sql: string) => {
      if (sql.startsWith("SELECT")) return tasks as unknown as T[];
      return [] as T[];
    },
    execute: async (sql: string, params: unknown[] = []) => {
      insertCalls.push({ sql, params });
      if (sql.startsWith("INSERT INTO task_sessions")) {
        return { insertId: 777, affectedRows: 1 };
      }
      if (sql.startsWith("INSERT INTO tasks2session")) {
        return { insertId: 0, affectedRows: params.length / 5 };
      }
      return { insertId: 0, affectedRows: 0 };
    },
    commit: async () => {},
    rollback: async () => {},
    release: () => {},
  };

  const formData = formDataWith({ themeId: "3" });

  const state = await startTopicTestAction(IDLE_STATE, formData, {
    startTopicTest: (input) => startTopicTest(input, { getConnection: async () => connection }),
  });

  assert.deepEqual(state, { status: "success", sessionId: 777 });

  const sessionInsert = insertCalls.find((c) =>
    c.sql.startsWith("INSERT INTO task_sessions"),
  );
  assert.ok(sessionInsert);
  assert.deepEqual(sessionInsert!.params, [
    1, // user_id = 1 (demo user)
    1, // session_type = 1
    3, // theme_id
    TOPIC_TEST_TASK_COUNT,
    0, // right_number
    0, // time
    2, // session_status = 2
    0, // start_time = 0
  ]);

  const mappingInsert = insertCalls.find((c) =>
    c.sql.startsWith("INSERT INTO tasks2session"),
  );
  assert.ok(mappingInsert);
  for (let i = 0; i < mappingInsert!.params.length; i += 5) {
    const [taskType, , , userId, status] = mappingInsert!.params.slice(
      i,
      i + 5,
    );
    assert.equal(taskType, 1);
    assert.equal(userId, 1);
    assert.equal(status, 0);
  }
});

test("a second submission while one is pending is rejected, not creating a duplicate session", async () => {
  const tasks = Array.from({ length: TOPIC_TEST_TASK_COUNT }, (_, i) => ({
    id: i + 1,
  }));

  let releaseFirst: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    releaseFirst = resolve;
  });

  let sessionInsertCount = 0;
  const connection: SqlConnection = {
    beginTransaction: async () => {
      await gate;
    },
    query: async <T,>(sql: string) => {
      if (sql.startsWith("SELECT")) return tasks as unknown as T[];
      return [] as T[];
    },
    execute: async (sql: string, params: unknown[] = []) => {
      if (sql.startsWith("INSERT INTO task_sessions")) {
        sessionInsertCount += 1;
        return { insertId: 900 + sessionInsertCount, affectedRows: 1 };
      }
      if (sql.startsWith("INSERT INTO tasks2session")) {
        return { insertId: 0, affectedRows: params.length / 5 };
      }
      return { insertId: 0, affectedRows: 0 };
    },
    commit: async () => {},
    rollback: async () => {},
    release: () => {},
  };

  const runAction = (themeId: string) =>
    startTopicTestAction(IDLE_STATE, formDataWith({ themeId }), {
      startTopicTest: (input) => startTopicTest(input, { getConnection: async () => connection }),
    });

  const first = runAction("1");
  const second = await runAction("1");

  assert.equal(second.status, "error");
  assert.equal(
    second.status === "error" ? second.message : undefined,
    "Запит уже виконується — зачекайте.",
  );

  releaseFirst();
  const firstResult = await first;
  assert.equal(firstResult.status, "success");
  assert.equal(sessionInsertCount, 1);
});
