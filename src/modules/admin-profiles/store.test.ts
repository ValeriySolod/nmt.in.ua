import assert from "node:assert/strict";
import test from "node:test";

import type { SqlConnection } from "@/lib/db/mysql";
import { AdminProfilesError } from "./types";
import { deleteProfile, setProfileBanned } from "./store";

function mockConnection(handlers: {
  query?: (sql: string, params?: unknown[]) => Promise<unknown[]>;
  execute?: (
    sql: string,
    params?: unknown[],
  ) => Promise<{ insertId: number; affectedRows: number }>;
}): SqlConnection {
  return {
    beginTransaction: async () => undefined,
    commit: async () => undefined,
    rollback: async () => undefined,
    release: () => undefined,
    query: async <T = unknown>(sql: string, params?: unknown[]) =>
      (handlers.query
        ? ((await handlers.query(sql, params)) as T[])
        : []) as T[],
    execute: async (sql, params) =>
      handlers.execute
        ? handlers.execute(sql, params)
        : { insertId: 0, affectedRows: 1 },
  };
}

const studentRow = {
  id: 10,
  login: "pupil1",
  display_name: "Учень",
  email: "pupil1@example.com",
  email_verified_at: "2026-01-01T00:00:00.000Z",
  role: "student" as const,
  is_banned: 0,
  last_login_at: "2026-01-01T00:00:00.000Z",
  last_seen_at: "2026-01-01T00:00:00.000Z",
  created_at: "2026-01-01T00:00:00.000Z",
};

test("setProfileBanned blocks self-action", async () => {
  await assert.rejects(
    () =>
      setProfileBanned(
        { actorUserId: 10, targetUserId: 10, banned: true },
        {
          getConnection: async () =>
            mockConnection({
              query: async () => [studentRow],
            }),
        },
      ),
    (error: unknown) =>
      error instanceof AdminProfilesError && error.code === "self_action",
  );
});

test("setProfileBanned blocks demo accounts", async () => {
  await assert.rejects(
    () =>
      setProfileBanned(
        { actorUserId: 3, targetUserId: 1, banned: true },
        {
          getConnection: async () =>
            mockConnection({
              query: async () => [
                {
                  id: 1,
                  login: "demo-student",
                  display_name: "Олена",
                  role: "student",
                  is_banned: 0,
                  last_login_at: null,
                  last_seen_at: null,
                  created_at: "2026-01-01T00:00:00.000Z",
                },
              ],
            }),
        },
      ),
    (error: unknown) =>
      error instanceof AdminProfilesError &&
      error.code === "protected_account",
  );
});

test("setProfileBanned bans a regular student", async () => {
  const profile = await setProfileBanned(
    { actorUserId: 3, targetUserId: 10, banned: true },
    {
      getConnection: async () =>
        mockConnection({
          query: async () => [studentRow],
        }),
    },
  );
  assert.equal(profile.isBanned, true);
  assert.equal(profile.login, "pupil1");
});

test("deleteProfile blocks the last active admin", async () => {
  await assert.rejects(
    () =>
      deleteProfile(
        { actorUserId: 99, targetUserId: 3 },
        {
          getConnection: async () =>
            mockConnection({
              query: async (sql) => {
                if (sql.includes("COUNT")) return [{ count: 1 }];
                return [
                  {
                    id: 3,
                    login: "other-admin",
                    display_name: "Адмін 2",
                    role: "admin",
                    is_banned: 0,
                    last_login_at: null,
                    last_seen_at: null,
                    created_at: "2026-01-01T00:00:00.000Z",
                  },
                ];
              },
            }),
        },
      ),
    (error: unknown) =>
      error instanceof AdminProfilesError && error.code === "last_admin",
  );
});
