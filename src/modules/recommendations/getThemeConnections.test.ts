import assert from "node:assert/strict";
import test from "node:test";

import type { SqlConnection } from "@/lib/db/mysql";

import { getThemeConnectionsForThemes } from "./getThemeConnections";

test("getThemeConnectionsForThemes returns empty list for empty input", async () => {
  const result = await getThemeConnectionsForThemes([], {
    getConnection: async () => {
      throw new Error("should not connect");
    },
  });
  assert.deepEqual(result, []);
});

test("getThemeConnectionsForThemes maps rows to graph edges", async () => {
  const connection: SqlConnection = {
    beginTransaction: async () => {},
    query: async (sql, params) => {
      assert.match(sql, /theme_connections/);
      assert.deepEqual(params, [1, 3]);
      return [
        { vertex_start: 1, vertex_finish: 2 },
        { vertex_start: 3, vertex_finish: 4 },
      ] as never[];
    },
    execute: async () => ({ insertId: 0, affectedRows: 0 }),
    commit: async () => {},
    rollback: async () => {},
    release: () => {},
  };

  const result = await getThemeConnectionsForThemes([1, 3], {
    getConnection: async () => connection,
  });

  assert.deepEqual(result, [
    { fromThemeId: 1, toThemeId: 2 },
    { fromThemeId: 3, toThemeId: 4 },
  ]);
});
