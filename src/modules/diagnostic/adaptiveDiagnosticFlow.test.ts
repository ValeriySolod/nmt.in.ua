import assert from "node:assert/strict";
import test from "node:test";
import type { SqlConnection } from "@/lib/db/mysql";
import { SESSION_STATUS_COMPLETED, SESSION_STATUS_CREATED } from "@/modules/sessions/types";
import {
  TASK_STATUS_CORRECT,
  TASK_STATUS_INCORRECT,
  TASK_STATUS_UNANSWERED,
} from "@/modules/testing/types";
import {
  advanceDiagnosticSession,
  AdvanceDiagnosticSessionError,
} from "./advanceDiagnosticSession";
import { DIAGNOSTIC_TOTAL_QUESTIONS } from "./diagnosticProgress";
import { getDiagnosticNextStep, splitThemeConcepts } from "./getDiagnosticNextStep";
import type { SessionOwner } from "./sessionOwner";
import {
  startDiagnosticTopic,
  StartDiagnosticTopicError,
} from "./startDiagnosticTopic";

const GUEST: SessionOwner = { userId: null, guestToken: "guest-a" };
const OTHER_GUEST: SessionOwner = { userId: null, guestToken: "guest-b" };
const USER: SessionOwner = { userId: 42, guestToken: null };
const SESSION_ID = 900;
const NOW = 1_700_000_000;

type Task = { id: number; themeId: number; difficulty: number };
type Mapping = { id: number; taskId: number; status: number; owner: SessionOwner };

/** Every theme gets 4 tasks per difficulty level 1-3: ids themeId*100 + n. */
function makeBank(themeIds: number[], perLevel = 4): Task[] {
  const bank: Task[] = [];
  for (const themeId of themeIds) {
    for (let difficulty = 1; difficulty <= 3; difficulty += 1) {
      for (let n = 0; n < perLevel; n += 1) {
        bank.push({ id: themeId * 100 + difficulty * 10 + n, themeId, difficulty });
      }
    }
  }
  return bank;
}

/**
 * In-memory stand-in for the tables the adaptive flow touches. Owner
 * scoping mirrors `ownerClause`: params are [userId, userId, guest, guest].
 */
function makeDb(options: {
  owner: SessionOwner;
  plannedThemeIds: number[];
  bank?: Task[];
  sessionStatus?: number;
  expireTime?: number;
}) {
  const bank = options.bank ?? makeBank(options.plannedThemeIds);
  const mappings: Mapping[] = [];
  const selfScores: unknown[][] = [];
  const sessionScores: { themeId: number; score: number; topicNumber: number }[] = [];
  let committed = 0;
  let rolledBack = 0;
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
            session_status: options.sessionStatus ?? SESSION_STATUS_CREATED,
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
      if (sql.includes("FROM diagnostic_session_self_scores")) {
        return sessionScores
          .sort((a, b) => a.topicNumber - b.topicNumber)
          .map((row) => ({ theme_id: row.themeId, score: row.score })) as unknown as T[];
      }
      if (sql.includes("FROM themes t")) {
        return options.plannedThemeIds.map((id) => ({ theme_id: id })) as unknown as T[];
      }
      if (sql.includes("FROM themes WHERE id")) {
        return [
          { id: params[0], name: ` Тема ${params[0]} `, description: "дроби, відсотки;пропорції" },
        ] as unknown as T[];
      }
      if (sql.includes("SELECT name, task_text") && sql.includes("FROM quiz_tasks")) {
        return [
          { name: ` Приклад ${params[0]} `, task_text: " Обчисліть $2 + 2$. " },
        ] as unknown as T[];
      }
      if (sql.includes("FROM quiz_tasks WHERE theme_id")) {
        return bank
          .filter((t) => t.themeId === params[0])
          .map((t) => ({ id: t.id, difficulty: t.difficulty })) as unknown as T[];
      }
      return [] as T[];
    },
    execute: async (sql: string, params: unknown[] = []) => {
      if (sql.includes("INSERT INTO user_self_scores")) {
        selfScores.push(params);
        return { insertId: selfScores.length, affectedRows: 1 };
      }
      if (sql.includes("INSERT INTO diagnostic_session_self_scores")) {
        sessionScores.push({
          themeId: params[1] as number,
          score: params[2] as number,
          topicNumber: params[3] as number,
        });
        return { insertId: 0, affectedRows: 1 };
      }
      if (sql.includes("INSERT INTO tasks2session")) {
        const [taskId, sessionId, userId, guestToken] = params;
        assert.equal(sessionId, SESSION_ID);
        const id = nextMappingId++;
        mappings.push({
          id,
          taskId: taskId as number,
          status: TASK_STATUS_UNANSWERED,
          owner: { userId, guestToken } as SessionOwner,
        });
        return { insertId: id, affectedRows: 1 };
      }
      return { insertId: 0, affectedRows: 0 };
    },
    commit: async () => {
      committed += 1;
    },
    rollback: async () => {
      rolledBack += 1;
    },
    release: () => {},
  };

  return {
    deps: { getConnection: async () => connection, nowSec: () => NOW },
    mappings,
    selfScores,
    sessionScores,
    bank,
    committed: () => committed,
    rolledBack: () => rolledBack,
    /** Simulates `checkDiagnosticAnswer` on the pending task. */
    answerPending(correct: boolean) {
      const pending = mappings.find((m) => m.status === TASK_STATUS_UNANSWERED);
      assert.ok(pending, "a task must be pending");
      pending.status = correct ? TASK_STATUS_CORRECT : TASK_STATUS_INCORRECT;
    },
    difficultyOf(taskId: number) {
      return bank.find((t) => t.id === taskId)!.difficulty;
    },
  };
}

async function assessAll(
  db: ReturnType<typeof makeDb>,
  themeIds: number[],
  scores: number[] = themeIds.map(() => 5),
): Promise<void> {
  for (let index = 0; index < themeIds.length; index += 1) {
    const result = await startDiagnosticTopic(
      { owner: GUEST, sessionId: SESSION_ID, themeId: themeIds[index], selfScore: scores[index] },
      db.deps,
    );
    if (index < themeIds.length - 1) {
      assert.deepEqual(result, { mappingId: null, taskId: null });
      assert.equal(db.mappings.length, 0);
      const view = await getDiagnosticNextStep(SESSION_ID, GUEST, db.deps);
      assert.equal(view.kind === "topicIntro" && view.topic.themeId, themeIds[index + 1]);
    }
  }
}

test("all self-scores are collected before the first task is linked", async () => {
  const db = makeDb({ owner: GUEST, plannedThemeIds: [11, 12] });
  await assessAll(db, [11, 12], [9, 2]);

  assert.deepEqual(db.selfScores, [
    [null, "guest-a", 11, 9, "pre_topic"],
    [null, "guest-a", 12, 2, "pre_topic"],
  ]);
  assert.deepEqual(db.sessionScores.map((row) => row.themeId), [11, 12]);
  assert.equal(db.mappings.length, 1);
  assert.equal(db.difficultyOf(db.mappings[0]!.taskId), 3, "self-score 9 starts on the hardest level");
  assert.deepEqual(db.mappings[0]!.owner, GUEST);
});

test("a low topic self-score starts on the easiest level", async () => {
  const db = makeDb({ owner: GUEST, plannedThemeIds: [11] });
  const result = await startDiagnosticTopic(
    { owner: GUEST, sessionId: SESSION_ID, themeId: 11, selfScore: 2 },
    db.deps,
  );
  assert.equal(db.difficultyOf(result.taskId!), 1);
  assert.deepEqual(db.selfScores[0], [null, "guest-a", 11, 2, "pre_topic"]);
});

test("rejects an out-of-range or non-integer topic self-score before touching the database", async () => {
  for (const selfScore of [0, 11, 5.5, "7", null]) {
    await assert.rejects(
      () =>
        startDiagnosticTopic(
          { owner: GUEST, sessionId: SESSION_ID, themeId: 11, selfScore },
          {
            getConnection: async () => {
              throw new Error("should not be called");
            },
          },
        ),
      (error: unknown) =>
        error instanceof StartDiagnosticTopicError && error.code === "invalid_input",
    );
  }
});

test("refuses to start a topic the session is not waiting for (no self-score, no task)", async () => {
  const db = makeDb({ owner: GUEST, plannedThemeIds: [11, 12] });
  await assert.rejects(
    () =>
      startDiagnosticTopic(
        { owner: GUEST, sessionId: SESSION_ID, themeId: 12, selfScore: 5 },
        db.deps,
      ),
    (error: unknown) =>
      error instanceof StartDiagnosticTopicError && error.code === "step_mismatch",
  );
  assert.equal(db.selfScores.length, 0);
  assert.equal(db.mappings.length, 0);
  assert.equal(db.rolledBack(), 1);

  // Replaying the same topic start after it succeeded is also refused.
  await startDiagnosticTopic(
    { owner: GUEST, sessionId: SESSION_ID, themeId: 11, selfScore: 5 },
    db.deps,
  );
  await assert.rejects(
    () =>
      startDiagnosticTopic(
        { owner: GUEST, sessionId: SESSION_ID, themeId: 11, selfScore: 5 },
        db.deps,
      ),
    (error: unknown) =>
      error instanceof StartDiagnosticTopicError && error.code === "step_mismatch",
  );
  assert.equal(db.selfScores.length, 1);
  assert.equal(db.mappings.length, 0);
});

test("another guest cannot start a topic or advance someone else's session", async () => {
  const db = makeDb({ owner: GUEST, plannedThemeIds: [11] });
  await assert.rejects(
    () =>
      startDiagnosticTopic(
        { owner: OTHER_GUEST, sessionId: SESSION_ID, themeId: 11, selfScore: 5 },
        db.deps,
      ),
    (error: unknown) =>
      error instanceof StartDiagnosticTopicError && error.code === "not_found",
  );
  await assert.rejects(
    () => advanceDiagnosticSession({ owner: OTHER_GUEST, sessionId: SESSION_ID }, db.deps),
    (error: unknown) =>
      error instanceof AdvanceDiagnosticSessionError && error.code === "not_found",
  );
  await assert.rejects(
    () => advanceDiagnosticSession({ owner: USER, sessionId: SESSION_ID }, db.deps),
    (error: unknown) =>
      error instanceof AdvanceDiagnosticSessionError && error.code === "not_found",
  );
  assert.equal(db.mappings.length, 0);
  assert.equal(db.selfScores.length, 0);
});

test("expired and completed sessions accept no new topic or task", async () => {
  const expired = makeDb({ owner: GUEST, plannedThemeIds: [11], expireTime: NOW - 1 });
  await assert.rejects(
    () =>
      startDiagnosticTopic(
        { owner: GUEST, sessionId: SESSION_ID, themeId: 11, selfScore: 5 },
        expired.deps,
      ),
    (error: unknown) =>
      error instanceof StartDiagnosticTopicError && error.code === "session_expired",
  );
  await assert.rejects(
    () => advanceDiagnosticSession({ owner: GUEST, sessionId: SESSION_ID }, expired.deps),
    (error: unknown) =>
      error instanceof AdvanceDiagnosticSessionError && error.code === "session_expired",
  );

  const completed = makeDb({
    owner: GUEST,
    plannedThemeIds: [11],
    sessionStatus: SESSION_STATUS_COMPLETED,
  });
  await assert.rejects(
    () =>
      startDiagnosticTopic(
        { owner: GUEST, sessionId: SESSION_ID, themeId: 11, selfScore: 5 },
        completed.deps,
      ),
    (error: unknown) =>
      error instanceof StartDiagnosticTopicError && error.code === "session_completed",
  );
  assert.deepEqual(
    await advanceDiagnosticSession({ owner: GUEST, sessionId: SESSION_ID }, completed.deps),
    { next: "complete" },
  );
  assert.equal(completed.mappings.length, 0);
});

test("advance links a harder task after a correct answer and an easier one after a mistake", async () => {
  const db = makeDb({ owner: GUEST, plannedThemeIds: [11, 12] });
  await assessAll(db, [11, 12]);
  assert.equal(db.difficultyOf(db.mappings[0]!.taskId), 2);

  db.answerPending(true);
  assert.deepEqual(
    await advanceDiagnosticSession({ owner: GUEST, sessionId: SESSION_ID }, db.deps),
    { next: "task" },
  );
  assert.equal(db.difficultyOf(db.mappings[1]!.taskId), 3);

  const easier = makeDb({ owner: GUEST, plannedThemeIds: [11, 12] });
  await assessAll(easier, [11, 12]);
  easier.answerPending(false);
  await advanceDiagnosticSession({ owner: GUEST, sessionId: SESSION_ID }, easier.deps);
  assert.equal(easier.difficultyOf(easier.mappings[1]!.taskId), 1);
});

test("advance is idempotent while a task is pending", async () => {
  const db = makeDb({ owner: GUEST, plannedThemeIds: [11] });
  await assessAll(db, [11]);
  for (let i = 0; i < 3; i += 1) {
    assert.deepEqual(
      await advanceDiagnosticSession({ owner: GUEST, sessionId: SESSION_ID }, db.deps),
      { next: "task" },
    );
  }
  assert.equal(db.mappings.length, 1);
});

test("a whole attempt answers exactly 10 tasks, two per topic, never repeats one and stays within difficulty bounds", async () => {
  for (const pattern of [
    () => true,
    () => false,
    (i: number) => i % 2 === 0,
    () => Math.random() < 0.5,
  ]) {
    const db = makeDb({ owner: GUEST, plannedThemeIds: [11, 12, 13, 14, 15] });
    await assessAll(db, [11, 12, 13, 14, 15]);
    let answered = 0;
    for (let guard = 0; guard < 100; guard += 1) {
      const view = await getDiagnosticNextStep(SESSION_ID, GUEST, db.deps);
      assert.equal(view.kind, "questions");
      db.answerPending(pattern(answered));
      answered += 1;
      const { next } = await advanceDiagnosticSession(
        { owner: GUEST, sessionId: SESSION_ID },
        db.deps,
      );
      if (next === "complete") break;
    }

    assert.equal(answered, DIAGNOSTIC_TOTAL_QUESTIONS);
    assert.equal(db.mappings.length, DIAGNOSTIC_TOTAL_QUESTIONS);
    const taskIds = db.mappings.map((m) => m.taskId);
    assert.equal(new Set(taskIds).size, taskIds.length, "no task is repeated");
    assert.equal(db.selfScores.length, 5, "one self-score per topic");
    const countsByTheme = new Map<number, number>();
    for (const mapping of db.mappings) {
      const themeId = db.bank.find((task) => task.id === mapping.taskId)!.themeId;
      countsByTheme.set(themeId, (countsByTheme.get(themeId) ?? 0) + 1);
    }
    assert.deepEqual(
      [11, 12, 13, 14, 15].map((themeId) => countsByTheme.get(themeId)),
      [2, 2, 2, 2, 2],
    );
    for (const taskId of taskIds) {
      const level = db.difficultyOf(taskId);
      assert.ok(level >= 1 && level <= 3);
    }
    // Extra advances after completion never link an 11th task.
    await advanceDiagnosticSession({ owner: GUEST, sessionId: SESSION_ID }, db.deps);
    assert.equal(db.mappings.length, DIAGNOSTIC_TOTAL_QUESTIONS);
  }
});

test("a topic whose bank runs out ends early and later topics absorb its share", async () => {
  // Theme 11 has a single task; theme 12 has plenty.
  const bank = [
    { id: 1101, themeId: 11, difficulty: 2 },
    ...makeBank([12]),
  ];
  const db = makeDb({ owner: GUEST, plannedThemeIds: [11, 12], bank });
  await assessAll(db, [11, 12]);
  db.answerPending(true);
  assert.deepEqual(
    await advanceDiagnosticSession({ owner: GUEST, sessionId: SESSION_ID }, db.deps),
    { next: "task" },
  );
  const view = await getDiagnosticNextStep(SESSION_ID, GUEST, db.deps);
  assert.equal(view.kind, "questions");
  assert.equal(db.mappings.length, 2);
});

test("getDiagnosticNextStep describes the topic screen and never writes", async () => {
  const db = makeDb({ owner: GUEST, plannedThemeIds: [11, 12] });
  const view = await getDiagnosticNextStep(SESSION_ID, GUEST, db.deps);
  assert.deepEqual(view, {
    kind: "topicIntro",
    topic: {
      themeId: 11,
      themeName: "Тема 11",
      concepts: ["дроби", "відсотки", "пропорції"],
      topicNumber: 1,
      topicCount: 2,
      exampleTask: {
        name: "Приклад 11",
        taskText: "Обчисліть $2 + 2$.",
      },
    },
  });
  assert.equal(db.mappings.length, 0);
  assert.equal(db.selfScores.length, 0);
});

test("getDiagnosticNextStep marks the 10th pending task as final", async () => {
  const db = makeDb({
    owner: GUEST,
    plannedThemeIds: [11, 12, 13, 14, 15],
  });
  await assessAll(db, [11, 12, 13, 14, 15]);
  assert.deepEqual(await getDiagnosticNextStep(SESSION_ID, GUEST, db.deps), {
    kind: "questions",
    afterLastTask: "continue",
  });
  while (db.mappings.length < DIAGNOSTIC_TOTAL_QUESTIONS) {
    db.answerPending(true);
    const advanced = await advanceDiagnosticSession(
      { owner: GUEST, sessionId: SESSION_ID },
      db.deps,
    );
    assert.equal(advanced.next, "task");
  }
  assert.equal(db.mappings.length, DIAGNOSTIC_TOTAL_QUESTIONS);
  assert.deepEqual(await getDiagnosticNextStep(SESSION_ID, GUEST, db.deps), {
    kind: "questions",
    afterLastTask: "finish",
  });
});

test("splitThemeConcepts turns a theme description into a concept list", () => {
  assert.deepEqual(splitThemeConcepts("віднесення до множини, рахування"), [
    "віднесення до множини",
    "рахування",
  ]);
  assert.deepEqual(splitThemeConcepts(" a ;\nb,, "), ["a", "b"]);
  assert.deepEqual(splitThemeConcepts(null), []);
  assert.deepEqual(splitThemeConcepts(""), []);
});
