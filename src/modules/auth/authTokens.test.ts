import assert from "node:assert/strict";
import test from "node:test";

import type { SqlConnection } from "@/lib/db/mysql";
import {
  AUTH_TOKEN_TTL_MS,
  consumeAuthToken,
  hashAuthToken,
  issueAuthToken,
} from "./authTokens";

type TokenRow = {
  id: number;
  user_id: number;
  purpose: string;
  token_hash: string;
  expires_at: Date;
  used_at: Date | null;
  created_at: Date;
};

function memoryTokens() {
  const tokens: TokenRow[] = [];
  let nextId = 1;

  const connection: SqlConnection = {
    beginTransaction: async () => {},
    commit: async () => {},
    rollback: async () => {},
    release: () => {},
    query: async <T,>(sql: string, params: unknown[] = []) => {
      if (sql.includes("FROM auth_tokens") && sql.includes("token_hash")) {
        const [hash, purpose] = params;
        const row = tokens.find(
          (token) => token.token_hash === hash && token.purpose === purpose,
        );
        return (row ? [row] : []) as T[];
      }
      if (sql.includes("COUNT(*)") && sql.includes("FROM auth_tokens")) {
        return [{ count: tokens.length }] as T[];
      }
      if (sql.includes("COUNT(*)")) return [{ count: 1 }] as T[];
      if (sql.includes("information_schema")) {
        return [{ COLUMN_NAME: "email", INDEX_NAME: "uq_app_users_email" }] as T[];
      }
      return [] as T[];
    },
    execute: async (sql: string, params: unknown[] = []) => {
      if (
        sql.includes("UPDATE auth_tokens") &&
        sql.includes("user_id = ?") &&
        sql.includes("used_at IS NULL")
      ) {
        const [userId, purpose] = params;
        for (const row of tokens) {
          if (
            row.user_id === Number(userId) &&
            row.purpose === purpose &&
            row.used_at == null
          ) {
            row.used_at = new Date();
          }
        }
        return { insertId: 0, affectedRows: 1 };
      }
      if (sql.includes("INSERT INTO auth_tokens")) {
        const [userId, purpose, tokenHash, expiresAt] = params;
        const id = nextId;
        nextId += 1;
        tokens.push({
          id,
          user_id: Number(userId),
          purpose: String(purpose),
          token_hash: String(tokenHash),
          expires_at:
            expiresAt instanceof Date ? expiresAt : new Date(String(expiresAt)),
          used_at: null,
          created_at: new Date(),
        });
        return { insertId: id, affectedRows: 1 };
      }
      if (sql.includes("UPDATE auth_tokens SET used_at")) {
        const [id] = params;
        const row = tokens.find((token) => token.id === Number(id));
        if (row) row.used_at = new Date();
        return { insertId: 0, affectedRows: row ? 1 : 0 };
      }
      return { insertId: 0, affectedRows: 0 };
    },
  };

  return {
    tokens,
    deps: { getConnection: async () => connection },
  };
}

test("consumeAuthToken rejects an empty token", async () => {
  const result = await consumeAuthToken("  ", "email_verify");
  assert.deepEqual(result, { ok: false, code: "invalid" });
});

test("issueAuthToken stores only a hash and expires in 24 hours", async () => {
  const db = memoryTokens();
  const before = Date.now();
  const issued = await issueAuthToken(7, "email_verify", db.deps);
  const after = Date.now();

  assert.equal(issued.rawToken.length > 20, true);
  assert.equal(db.tokens.length, 1);
  assert.equal(db.tokens[0]?.token_hash, hashAuthToken(issued.rawToken));
  assert.notEqual(db.tokens[0]?.token_hash, issued.rawToken);

  const ttl = AUTH_TOKEN_TTL_MS.email_verify;
  assert.equal(ttl, 24 * 60 * 60 * 1000);
  assert.ok(issued.expiresAt.getTime() >= before + ttl);
  assert.ok(issued.expiresAt.getTime() <= after + ttl);
});

test("consumeAuthToken accepts a fresh token once", async () => {
  const db = memoryTokens();
  const issued = await issueAuthToken(7, "email_verify", db.deps);

  const first = await consumeAuthToken(issued.rawToken, "email_verify", db.deps);
  assert.deepEqual(first, { ok: true, userId: 7 });

  const second = await consumeAuthToken(issued.rawToken, "email_verify", db.deps);
  assert.deepEqual(second, { ok: false, code: "used", userId: 7 });
});

test("consumeAuthToken reports an expired token", async () => {
  const db = memoryTokens();
  const issued = await issueAuthToken(7, "email_verify", db.deps);
  const row = db.tokens[0];
  assert.ok(row);
  row.expires_at = new Date(Date.now() - 1_000);

  const result = await consumeAuthToken(issued.rawToken, "email_verify", db.deps);
  assert.deepEqual(result, { ok: false, code: "expired", userId: 7 });
  assert.equal(row.used_at, null);
});

test("consumeAuthToken rejects an unknown token", async () => {
  const db = memoryTokens();
  const result = await consumeAuthToken("not-a-real-token", "email_verify", db.deps);
  assert.deepEqual(result, { ok: false, code: "invalid" });
});

test("issueAuthToken retries once when the new user is not visible yet", async () => {
  const db = memoryTokens();
  let inserts = 0;
  const connection: SqlConnection = {
    beginTransaction: async () => {},
    commit: async () => {},
    rollback: async () => {},
    release: () => {},
    query: async <T,>(sql: string, params: unknown[] = []) => {
      return db.deps.getConnection().then((current) => current.query<T>(sql, params));
    },
    execute: async (sql: string, params: unknown[] = []) => {
      if (sql.includes("INSERT INTO auth_tokens")) {
        inserts += 1;
        if (inserts === 1) {
          throw Object.assign(new Error("Cannot add or update a child row"), {
            errno: 1452,
            code: "ER_NO_REFERENCED_ROW_2",
          });
        }
      }
      const current = await db.deps.getConnection();
      return current.execute(sql, params);
    },
  };

  const issued = await issueAuthToken(7, "email_verify", {
    getConnection: async () => connection,
  });

  assert.equal(inserts, 2);
  assert.equal(db.tokens.length, 1);
  assert.equal(db.tokens[0]?.token_hash, hashAuthToken(issued.rawToken));
});

test("issueAuthToken invalidates the previous unused link", async () => {
  const db = memoryTokens();
  const first = await issueAuthToken(7, "email_verify", db.deps);
  const second = await issueAuthToken(7, "email_verify", db.deps);

  const old = await consumeAuthToken(first.rawToken, "email_verify", db.deps);
  assert.equal(old.ok, false);
  if (!old.ok) assert.equal(old.code, "used");

  const fresh = await consumeAuthToken(second.rawToken, "email_verify", db.deps);
  assert.deepEqual(fresh, { ok: true, userId: 7 });
});
