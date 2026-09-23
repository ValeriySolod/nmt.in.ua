import assert from "node:assert/strict";
import test from "node:test";
import type { SqlConnection } from "@/lib/db/mysql";
import {
  averageCompletedPercent,
  getTeacherLearningSessions,
  type TeacherLearningSessionRow,
} from "./teacherLearningSessions";
import { SESSION_STATUS_COMPLETED } from "./types";

type SqlRow = {
  id: number;
  user_id: number;
  login: string;
  display_name: string;
  theme_id: number;
  theme_name: string;
  tasks_number: number;
  right_number: number;
  time: number;
  session_status: number;
  session_type: number;
  start_time: number;
  expire_time: number;
  available_at: number | null;
  due_at: number | null;
};

function makeConnection(rows: SqlRow[]) {
  const calls: { sql: string; params: unknown[] }[] = [];
  const connection: SqlConnection = {
    beginTransaction: async () => {},
    query: async <T,>(sql: string, params: unknown[] = []) => {
      calls.push({ sql, params });
      return rows as unknown as T[];
    },
    execute: async () => ({ insertId: 0, affectedRows: 0 }),
    commit: async () => {},
    rollback: async () => {},
    release: () => {},
  };
  return { connection, calls };
}

const roster = [
  { studentUserId: 10, login: "ann", displayName: "Ann" },
  { studentUserId: 11, login: "bob", displayName: "Bob" },
];

test("getTeacherLearningSessions returns empty for an empty roster", async () => {
  const { connection, calls } = makeConnection([]);
  const rows = await getTeacherLearningSessions([], {}, {
    getConnection: async () => connection,
    ensureSchema: async () => {},
  });
  assert.deepEqual(rows, []);
  assert.equal(calls.length, 0);
});

test("getTeacherLearningSessions queries IN roster ids and attaches student fields", async () => {
  const { connection, calls } = makeConnection([
    {
      id: 5,
      user_id: 10,
      login: "ann",
      display_name: "Ann",
      theme_id: 1,
      theme_name: "Дроби",
      tasks_number: 10,
      right_number: 4,
      time: 100,
      session_status: SESSION_STATUS_COMPLETED,
      session_type: 1,
      start_time: 1_700_000_000,
      expire_time: 1,
      available_at: null,
      due_at: null,
    },
  ]);

  const rows = await getTeacherLearningSessions(roster, {}, {
    getConnection: async () => connection,
    ensureSchema: async () => {},
    nowSec: () => 1_700_000_100,
  });

  assert.equal(calls.length, 1);
  assert.match(calls[0]!.sql, /WHERE ts\.user_id IN \(\?, \?\)/);
  assert.deepEqual(calls[0]!.params, [10, 11]);
  assert.equal(rows[0]?.studentDisplayName, "Ann");
  assert.equal(rows[0]?.studentLogin, "ann");
  assert.equal(rows[0]?.percent, 40);
});

test("getTeacherLearningSessions can scope to one student", async () => {
  const { connection, calls } = makeConnection([]);
  await getTeacherLearningSessions(roster, { studentUserId: 11 }, {
    getConnection: async () => connection,
    ensureSchema: async () => {},
  });
  assert.deepEqual(calls[0]!.params, [11]);
});

test("averageCompletedPercent ignores planned rows", () => {
  const rows = [
    {
      studentUserId: 1,
      status: "completed",
      percent: 40,
    },
    {
      studentUserId: 1,
      status: "completed",
      percent: 60,
    },
    {
      studentUserId: 1,
      status: "planned",
      percent: null,
    },
    {
      studentUserId: 2,
      status: "expired",
      percent: null,
    },
  ] as TeacherLearningSessionRow[];

  const map = averageCompletedPercent(rows);
  assert.equal(map.get(1), 50);
  assert.equal(map.has(2), false);
});
