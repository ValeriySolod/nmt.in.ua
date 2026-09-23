import assert from "node:assert/strict";
import test from "node:test";
import type { SqlConnection } from "@/lib/db/mysql";
import {
  getDiagnosticThemeBreakdown,
  selectPriorityTopics,
  selectStrongTopics,
  toDiagnosticTopicInsight,
  type DiagnosticThemeStat,
} from "./diagnosticThemeBreakdown";

function stat(
  themeId: number,
  correct: number,
  total: number,
  ord = themeId,
): DiagnosticThemeStat {
  return {
    themeId,
    themeCode: `T-${themeId}`,
    themeName: `Theme ${themeId}`,
    ord,
    correct,
    total,
    percent: (correct / total) * 100,
  };
}

test("selectPriorityTopics returns only themes below the strong threshold", () => {
  const stats = [stat(1, 3, 3), stat(2, 0, 3), stat(3, 1, 3), stat(4, 2, 3)];
  const priority = selectPriorityTopics(stats);
  assert.deepEqual(
    priority.map((s) => s.themeId),
    [2, 3, 4],
  );
});

test("selectStrongTopics includes only themes with at least 75% correct", () => {
  const stats = [stat(1, 3, 3), stat(2, 0, 3), stat(3, 1, 3), stat(4, 2, 3)];
  const strong = selectStrongTopics(stats);
  assert.deepEqual(
    strong.map((s) => s.themeId),
    [1],
  );
});

test("screenshot case: zero scores never appear as strong or in both groups", () => {
  const stats = [stat(1, 0, 2), stat(2, 0, 2), stat(3, 0, 2), stat(4, 1, 2), stat(5, 0, 2)];
  const insight = toDiagnosticTopicInsight(stats);
  assert.deepEqual(insight.priority.map((topic) => topic.themeId), [1, 2, 3]);
  assert.deepEqual(insight.strongest, []);
});

test("strong and priority groups do not overlap", () => {
  const insight = toDiagnosticTopicInsight([
    stat(1, 0, 2), stat(2, 1, 2), stat(3, 3, 4), stat(4, 2, 2),
  ]);
  assert.deepEqual(insight.priority.map((topic) => topic.themeId), [1, 2]);
  assert.deepEqual(insight.strongest.map((topic) => topic.themeId), [4, 3]);
});

test("all correct answers produce strong themes without growth priorities", () => {
  const insight = toDiagnosticTopicInsight(
    Array.from({ length: 5 }, (_, index) => stat(index + 1, 2, 2)),
  );
  assert.deepEqual(insight.priority, []);
  assert.deepEqual(insight.strongest.map((topic) => topic.themeId), [1, 2, 3]);
});

test("ties break by curriculum order (ord), then theme id", () => {
  const stats = [stat(5, 1, 2, 10), stat(2, 1, 2, 3), stat(9, 1, 2, 3)];
  const priority = selectPriorityTopics(stats);
  assert.deepEqual(
    priority.map((s) => s.themeId),
    [2, 9, 5],
  );
});

test("returns fewer than the limit when fewer themes exist", () => {
  const stats = [stat(1, 1, 3), stat(2, 3, 3)];
  assert.equal(selectPriorityTopics(stats).length, 1);
  assert.equal(selectStrongTopics(stats).length, 1);
});

test("an empty breakdown yields empty insight, never invented data", () => {
  const insight = toDiagnosticTopicInsight([]);
  assert.deepEqual(insight, { strongest: [], priority: [] });
});

test("does not mutate the input array", () => {
  const stats = [stat(1, 3, 3), stat(2, 0, 3)];
  const copy = [...stats];
  selectPriorityTopics(stats);
  selectStrongTopics(stats);
  assert.deepEqual(stats, copy);
});

function makeConnection(rows: Record<string, unknown>[]) {
  const calls: Array<{ sql: string; params?: unknown[] }> = [];
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

const owner = { userId: null, guestToken: "guest-a" };

test("getDiagnosticThemeBreakdown maps DB rows into stats with a computed percent", async () => {
  const mock = makeConnection([
    { theme_id: 1, theme_code: "T-1", theme_name: "Тема 1", theme_ord: 1, correct: 2, total: 3 },
    { theme_id: 2, theme_code: "T-2", theme_name: "Тема 2", theme_ord: 2, correct: 0, total: 3 },
  ]);

  const stats = await getDiagnosticThemeBreakdown(5, owner, {
    getConnection: async () => mock.connection,
  });

  assert.equal(stats.length, 2);
  assert.equal(stats[0]!.percent, (2 / 3) * 100);
  assert.equal(stats[1]!.percent, 0);
  assert.equal(mock.calls[0]!.params?.[0], 5);
});

test("getDiagnosticThemeBreakdown returns [] for an invalid sessionId instead of querying", async () => {
  const mock = makeConnection([]);
  const stats = await getDiagnosticThemeBreakdown(-1, owner, {
    getConnection: async () => mock.connection,
  });
  assert.deepEqual(stats, []);
  assert.equal(mock.calls.length, 0);
});

test("getDiagnosticThemeBreakdown returns [] for an invalid owner instead of querying", async () => {
  const mock = makeConnection([]);
  const stats = await getDiagnosticThemeBreakdown(
    5,
    { userId: null, guestToken: "" } as unknown as typeof owner,
    { getConnection: async () => mock.connection },
  );
  assert.deepEqual(stats, []);
  assert.equal(mock.calls.length, 0);
});
