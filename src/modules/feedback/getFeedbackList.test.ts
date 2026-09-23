import assert from "node:assert/strict";
import test from "node:test";
import type { SqlConnection } from "@/lib/db/mysql";
import { getFeedbackList } from "./getFeedbackList";

test("getFeedbackList maps newest rows and skips invalid scores", async () => {
  const connection: SqlConnection = {
    beginTransaction: async () => {},
    query: async (sql: string) => {
      if (sql.includes("COUNT(*)")) {
        // COUNT already filters invalid score/source — only valid rows.
        return [{ total: 1 }] as never;
      }
      return [
        {
          id: 2,
          user_id: 1,
          session_id: 38,
          score: 5,
          message: " Зручно ",
          email: null,
          source: "post_test",
          created_at: new Date("2026-09-05T10:00:00Z"),
          display_name: " Олена ",
          login: "demo-student",
        },
      ] as never;
    },
    execute: async (sql) => {
      if (sql.includes("CREATE TABLE")) {
        return { insertId: 0, affectedRows: 0 };
      }
      return { insertId: 0, affectedRows: 0 };
    },
    commit: async () => {},
    rollback: async () => {},
    release: () => {},
  };

  const page = await getFeedbackList(
    {},
    { getConnection: async () => connection },
  );

  assert.equal(page.total, 1);
  assert.equal(page.items.length, 1);
  assert.equal(page.items[0]?.score, 5);
  assert.equal(page.items[0]?.userDisplayName, "Олена");
  assert.equal(page.items[0]?.source, "post_test");
  assert.equal(page.items[0]?.message, "Зручно");
});
