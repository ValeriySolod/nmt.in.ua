import assert from "node:assert/strict";
import test from "node:test";
import type { SqlConnection } from "@/lib/db/mysql";
import { hasEligibleDiagnosticContent } from "./hasEligibleDiagnosticContent";

function makeConnection(taskCount: number, themeCount: number) {
  let released = false;
  const connection: SqlConnection = {
    beginTransaction: async () => {},
    query: async <T,>() =>
      [{ task_count: taskCount, theme_count: themeCount }] as unknown as T[],
    execute: async () => ({ insertId: 0, affectedRows: 0 }),
    commit: async () => {},
    rollback: async () => {},
    release: () => {
      released = true;
    },
  };
  return { connection, isReleased: () => released };
}

test("returns true when the bank has ≥10 tasks across ≥2 themes", async () => {
  const mock = makeConnection(12, 3);
  const result = await hasEligibleDiagnosticContent({
    getConnection: async () => mock.connection,
  });
  assert.equal(result, true);
  assert.ok(mock.isReleased());
});

test("returns false when there are fewer than 10 tasks", async () => {
  const mock = makeConnection(9, 4);
  const result = await hasEligibleDiagnosticContent({
    getConnection: async () => mock.connection,
  });
  assert.equal(result, false);
  assert.ok(mock.isReleased());
});

test("returns false when there is only one theme", async () => {
  const mock = makeConnection(20, 1);
  const result = await hasEligibleDiagnosticContent({
    getConnection: async () => mock.connection,
  });
  assert.equal(result, false);
});

test("releases the connection and propagates the error on a DB failure", async () => {
  let released = false;
  const connection: SqlConnection = {
    beginTransaction: async () => {},
    query: async () => {
      throw new Error("connection lost");
    },
    execute: async () => ({ insertId: 0, affectedRows: 0 }),
    commit: async () => {},
    rollback: async () => {},
    release: () => {
      released = true;
    },
  };

  await assert.rejects(
    () => hasEligibleDiagnosticContent({ getConnection: async () => connection }),
    /connection lost/,
  );
  assert.ok(released);
});
