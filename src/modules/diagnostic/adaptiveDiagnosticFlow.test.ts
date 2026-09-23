import assert from "node:assert/strict";
import test from "node:test";
import type { SqlConnection } from "@/lib/db/mysql";
import { SESSION_STATUS_CREATED } from "@/modules/sessions/types";
import {
  TASK_STATUS_CORRECT,
  TASK_STATUS_INCORRECT,
  TASK_STATUS_UNANSWERED,
} from "@/modules/testing/types";
import {
  advanceDiagnosticSession,
  AdvanceDiagnosticSessionError,
} from "./advanceDiagnosticSession";
import { getDiagnosticNextStep } from "./getDiagnosticNextStep";
import type { SessionOwner } from "./sessionOwner";

const GUEST: SessionOwner = { userId: null, guestToken: "guest-a" };
const OTHER_GUEST: SessionOwner = { userId: null, guestToken: "guest-b" };
const SESSION_ID = 900;
const NOW = 1_700_000_000;

type Task = { id: number; themeId: number; difficulty: number };
type Mapping = { id: number; taskId: number; status: number; owner: SessionOwner };

function makeBank(): Task[] {
  const bank: Task[] = [];
  for (const themeId of [10, 20, 30, 40]) {
    for (let difficulty = 1; difficulty <= 4; difficulty += 1) {
      for (let n = 0; n < 3; n += 1) {
        bank.push({
          id: themeId * 100 + difficulty * 10 + n,
          themeId,
          difficulty,
        });
      }
    }
  }
  return bank;
}

function makeDb(options: {
  owner: SessionOwner;
  bank?: Task[];
  expireTime?: number;
}) {
  const bank = options.bank ?? makeBank();
  const mappings: Mapping[] = [];
  let nextMappingId = 1;

  function ownerMatches(params: unknown[], row: SessionOwner): boolean {
    const [userId, , guestToken] = params;
    if (userId !== null && userId !== undefined) return userId === row.userId;
    return (
      guestToken !== null &&
      guestToken === row.guestToken &&
      row.userId === null
    );
  }

  const connection: SqlConnection = {
    beginTransaction: async () => {},
    query: async <T,>(sql: string, params: unknown[] = []) => {
      if (sql.includes("FROM task_sessions")) {
        if (params[0] !== SESSION_ID || !ownerMatches(params.slice(1), options.owner)) {
          return [] as T[];
        }
        return [
          {
            id: SESSION_ID,
            session_status: SESSION_STATUS_CREATED,
            expire_time: options.expireTime ?? NOW + 86_400,
          },
        ] as unknown as T[];
      }
      if (sql.includes("FROM tasks2session t2s")) {
        if (params[0] !== SESSION_ID) return [] as T[];
        return mappings
          .filter((m) => ownerMatches(params.slice(1), m.owner))
          .map((m) => {
            const task = bank.find((t) => t.id === m.taskId)!;
            return {
              task_id: m.taskId,
              theme_id: task.themeId,
              difficulty: task.difficulty,
              status: m.status,
            };
          }) as unknown as T[];
      }
      if (sql.includes("FROM quiz_tasks") && sql.includes("themeId")) {
        return bank.map((task) => ({
          id: task.id,
          themeId: task.themeId,
          difficulty: task.difficulty,
        })) as unknown as T[];
      }
      return [] as T[];
    },
    execute: async (sql: string, params: unknown[] = []) => {
      if (sql.includes("INSERT INTO tasks2session")) {
        const taskId = Number(params[0]);
        mappings.push({
          id: nextMappingId++,
          taskId,
          status: TASK_STATUS_UNANSWERED,
          owner: options.owner,
        });
        return { insertId: nextMappingId - 1, affectedRows: 1 };
      }
      return { insertId: 0, affectedRows: 0 };
    },
    commit: async () => {},
    rollback: async () => {},
    release: () => {},
  };

  return {
    connection,
    mappings,
    deps: { getConnection: async () => connection, nowSec: () => NOW },
    answerLast(status: number) {
      const last = mappings.at(-1);
      assert.ok(last);
      last.status = status;
    },
  };
}

test("advance links a harder task on another theme after a correct answer", async () => {
  const db = makeDb({ owner: GUEST });
  db.mappings.push({
    id: 1,
    taskId: 1010,
    status: TASK_STATUS_CORRECT,
    owner: GUEST,
  });

  const result = await advanceDiagnosticSession(
    { owner: GUEST, sessionId: SESSION_ID },
    db.deps,
  );
  assert.equal(result.next, "task");
  assert.equal(db.mappings.length, 2);
  const linked = makeBank().find((t) => t.id === db.mappings[1]!.taskId)!;
  assert.notEqual(linked.themeId, 10);
  assert.ok(linked.difficulty >= 2);
});

test("three wrongs at difficulty 1 complete the attempt", async () => {
  const db = makeDb({ owner: GUEST });
  for (const taskId of [1010, 2010, 3010]) {
    db.mappings.push({
      id: db.mappings.length + 1,
      taskId,
      status: TASK_STATUS_INCORRECT,
      owner: GUEST,
    });
  }

  const result = await advanceDiagnosticSession(
    { owner: GUEST, sessionId: SESSION_ID },
    db.deps,
  );
  assert.equal(result.next, "complete");
  assert.equal(db.mappings.length, 3);
});

test("foreign owner cannot advance another guest's session", async () => {
  const db = makeDb({ owner: GUEST });
  db.mappings.push({
    id: 1,
    taskId: 1010,
    status: TASK_STATUS_CORRECT,
    owner: GUEST,
  });

  await assert.rejects(
    () =>
      advanceDiagnosticSession(
        { owner: OTHER_GUEST, sessionId: SESSION_ID },
        db.deps,
      ),
    (error: unknown) =>
      error instanceof AdvanceDiagnosticSessionError &&
      error.code === "not_found",
  );
});

test("getDiagnosticNextStep marks continue until the attempt is final", async () => {
  const db = makeDb({ owner: GUEST });
  db.mappings.push({
    id: 1,
    taskId: 1010,
    status: TASK_STATUS_UNANSWERED,
    owner: GUEST,
  });
  assert.deepEqual(await getDiagnosticNextStep(SESSION_ID, GUEST, db.deps), {
    kind: "questions",
    afterLastTask: "continue",
  });
});
