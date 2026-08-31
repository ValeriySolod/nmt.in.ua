import assert from "node:assert/strict";
import test from "node:test";

import type { SqlConnection } from "@/lib/db/mysql";
import { SESSION_STATUS_COMPLETED } from "@/modules/sessions/types";

import { getStudentTopicStats } from "./getStudentTopicStats";
import { buildStudentTopicStats } from "./types";

type FakeConnection = SqlConnection & { released: boolean };

function fakeConnection(
  handleQuery: (sql: string, params?: unknown[]) => unknown[],
): FakeConnection {
  const connection: FakeConnection = {
    released: false,
    beginTransaction: async () => {},
    query: async <T,>(sql: string, params?: unknown[]) =>
      handleQuery(sql, params) as T[],
    execute: async () => ({ insertId: 0, affectedRows: 0 }),
    commit: async () => {},
    rollback: async () => {},
    release: () => {
      connection.released = true;
    },
  };
  return connection;
}

test("buildStudentTopicStats: two completed sessions -> overallPercent and lastPercent from newest session", () => {
  const themes = [{ id: 1, name: "Тема A", ord: 0 }];
  const sessions = [
    { id: 20, theme_id: 1, tasks_number: 10, right_number: 6, time: 60 },
    { id: 10, theme_id: 1, tasks_number: 10, right_number: 8, time: 50 },
  ];

  const stats = buildStudentTopicStats(themes, sessions);

  assert.equal(stats.hasCompletedSessions, true);
  assert.deepEqual(stats.topicScores, [
    { themeId: 1, themeName: "Тема A", overallPercent: 70, lastPercent: 60 },
  ]);
});

test("buildStudentTopicStats: newest session (by ordering) determines lastPercent regardless of value", () => {
  const themes = [{ id: 1, name: "Тема A", ord: 0 }];
  const sessions = [
    { id: 20, theme_id: 1, tasks_number: 10, right_number: 8, time: 60 },
    { id: 10, theme_id: 1, tasks_number: 10, right_number: 6, time: 50 },
  ];

  const stats = buildStudentTopicStats(themes, sessions);

  assert.equal(stats.topicScores[0]?.lastPercent, 80);
});

test("buildStudentTopicStats: topic with no sessions has null metrics", () => {
  const themes = [
    { id: 1, name: "Тема A", ord: 0 },
    { id: 2, name: "Тема B", ord: 1 },
  ];
  const sessions = [
    { id: 10, theme_id: 1, tasks_number: 10, right_number: 8, time: 50 },
  ];

  const stats = buildStudentTopicStats(themes, sessions);

  assert.deepEqual(stats.topicScores[1], {
    themeId: 2,
    themeName: "Тема B",
    overallPercent: null,
    lastPercent: null,
  });
});

test("buildStudentTopicStats: empty user keeps all themes with null metrics and hasCompletedSessions false", () => {
  const themes = [
    { id: 1, name: "Тема A", ord: 0 },
    { id: 2, name: "Тема B", ord: 1 },
  ];

  const stats = buildStudentTopicStats(themes, []);

  assert.equal(stats.hasCompletedSessions, false);
  assert.equal(stats.topicScores.length, 2);
  for (const score of stats.topicScores) {
    assert.equal(score.overallPercent, null);
    assert.equal(score.lastPercent, null);
  }
});

test("getStudentTopicStats: filters non-completed sessions in the JOIN condition and releases the connection", async () => {
  const themes = [
    { theme_id: 1, theme_name: "Тема A", theme_ord: 0 },
    { theme_id: 2, theme_name: "Тема B", theme_ord: 1 },
  ];

  let capturedParams: unknown[] | undefined;
  const connection = fakeConnection((sql, params) => {
    capturedParams = params;
    // Simulate the LEFT JOIN: theme A has one completed session, theme B has none
    // (its only session is non-completed and filtered out by the JOIN predicate).
    return [
      {
        theme_id: 1,
        theme_name: "Тема A",
        theme_ord: 0,
        session_id: 10,
        tasks_number: 10,
        right_number: 8,
        time: 50,
      },
      {
        theme_id: 2,
        theme_name: "Тема B",
        theme_ord: 1,
        session_id: null,
        tasks_number: null,
        right_number: null,
        time: null,
      },
    ];
  });
  void themes;

  const stats = await getStudentTopicStats(1, {
    getConnection: async () => connection,
  });

  assert.deepEqual(capturedParams, [1, SESSION_STATUS_COMPLETED]);
  assert.equal(stats.hasCompletedSessions, true);
  assert.deepEqual(stats.topicScores, [
    { themeId: 1, themeName: "Тема A", overallPercent: 80, lastPercent: 80 },
    { themeId: 2, themeName: "Тема B", overallPercent: null, lastPercent: null },
  ]);
  assert.equal(connection.released, true);
});

test("getStudentTopicStats: no themes returned still releases the connection", async () => {
  const connection = fakeConnection(() => []);

  const stats = await getStudentTopicStats(1, {
    getConnection: async () => connection,
  });

  assert.deepEqual(stats, { topicScores: [], hasCompletedSessions: false });
  assert.equal(connection.released, true);
});
