import "server-only";

import type { SqlConnection } from "@/lib/db/mysql";
import type { AuthUser, UserRole, StudentOption } from "./types";
import { DEMO_ACCOUNTS } from "./types";
import { SQL_CREATE_USER_AVATARS } from "./avatar/schema";
import { hashPassword } from "./password";

const AUTH_USERS_TABLE = "app_users";

const SQL_CREATE_USERS = `
  CREATE TABLE IF NOT EXISTS ${AUTH_USERS_TABLE} (
    id INT NOT NULL AUTO_INCREMENT,
    login VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NULL,
    email_verified_at TIMESTAMP NULL DEFAULT NULL,
    role ENUM('student', 'teacher', 'admin') NOT NULL,
    is_banned TINYINT(1) NOT NULL DEFAULT 0,
    last_login_at TIMESTAMP NULL DEFAULT NULL,
    last_seen_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_app_users_login (login),
    UNIQUE KEY uq_app_users_email (email)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

const SQL_FIND_BY_LOGIN = `
  SELECT u.id, u.login, u.password_hash, u.display_name, u.role, u.is_banned,
         u.email, u.email_verified_at,
         UNIX_TIMESTAMP(a.updated_at) AS avatar_rev
  FROM ${AUTH_USERS_TABLE} u
  LEFT JOIN user_avatars a ON a.user_id = u.id
  WHERE u.login = ?
  LIMIT 1
`;

const SQL_FIND_BY_ID = `
  SELECT u.id, u.login, u.display_name, u.role, u.is_banned,
         u.email, u.email_verified_at,
         UNIX_TIMESTAMP(a.updated_at) AS avatar_rev
  FROM ${AUTH_USERS_TABLE} u
  LEFT JOIN user_avatars a ON a.user_id = u.id
  WHERE u.id = ?
  LIMIT 1
`;

const SQL_FIND_BY_EMAIL = `
  SELECT u.id, u.login, u.password_hash, u.display_name, u.role, u.is_banned,
         u.email, u.email_verified_at,
         UNIX_TIMESTAMP(a.updated_at) AS avatar_rev
  FROM ${AUTH_USERS_TABLE} u
  LEFT JOIN user_avatars a ON a.user_id = u.id
  WHERE u.email = ?
  LIMIT 1
`;

const SQL_COUNT_USERS = `SELECT COUNT(*) AS count FROM ${AUTH_USERS_TABLE}`;

const SQL_UPSERT_DEMO = `
  INSERT INTO ${AUTH_USERS_TABLE} (id, login, password_hash, display_name, role)
  VALUES (?, ?, ?, ?, ?)
  ON DUPLICATE KEY UPDATE
    login = VALUES(login),
    password_hash = VALUES(password_hash),
    display_name = VALUES(display_name),
    role = VALUES(role)
`;

type UserRow = {
  id: number;
  login: string;
  password_hash?: string;
  display_name: string;
  role: UserRole;
  is_banned?: number | boolean | null;
  email?: string | null;
  email_verified_at?: Date | string | null;
  avatar_rev?: number | string | null;
};

type CountRow = { count: number };

function mapAvatarRev(value: unknown): number | undefined {
  if (value == null || value === "") return undefined;
  const numeric = typeof value === "bigint" ? Number(value) : Number(value);
  if (!Number.isInteger(numeric) || numeric <= 0) return undefined;
  return numeric;
}

function isTruthyFlag(value: unknown): boolean {
  return value === true || value === 1 || value === "1";
}

function mapUser(row: UserRow): AuthUser {
  const user: AuthUser = {
    id: row.id,
    login: row.login,
    displayName: row.display_name.trim(),
    role: row.role,
  };
  if (isTruthyFlag(row.is_banned)) {
    user.isBanned = true;
  }
  if (typeof row.email === "string" && row.email.trim()) {
    user.email = row.email.trim().toLowerCase();
  }
  if (row.email_verified_at) {
    const verified =
      row.email_verified_at instanceof Date
        ? row.email_verified_at
        : new Date(row.email_verified_at);
    if (!Number.isNaN(verified.getTime())) {
      user.emailVerified = true;
    }
  }
  const avatarRev = mapAvatarRev(row.avatar_rev);
  if (avatarRev) {
    user.avatarRev = avatarRev;
  }
  return user;
}

async function loadDefaultConnection(): Promise<SqlConnection> {
  const { getConnection } = await import("@/lib/db/mysql");
  return getConnection();
}

let schemaReady: Promise<void> | undefined;

async function ensureUserColumn(
  connection: SqlConnection,
  columnName: string,
  addColumnSql: string,
): Promise<void> {
  const rows = await connection.query<{
    COLUMN_NAME?: string;
    column_name?: string;
  }>(
    `SELECT COLUMN_NAME AS COLUMN_NAME
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?`,
    [AUTH_USERS_TABLE, columnName],
  );
  if (rows.length > 0) return;
  await connection.execute(
    `ALTER TABLE ${AUTH_USERS_TABLE} ADD COLUMN ${addColumnSql}`,
    [],
  );
}

async function ensureEmailUniqueIndex(connection: SqlConnection): Promise<void> {
  const rows = await connection.query<{
    INDEX_NAME?: string;
    index_name?: string;
  }>(
    `SELECT INDEX_NAME AS INDEX_NAME
     FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND INDEX_NAME = 'uq_app_users_email'
     LIMIT 1`,
    [AUTH_USERS_TABLE],
  );
  if (rows.length > 0) return;
  await connection.execute(
    `ALTER TABLE ${AUTH_USERS_TABLE}
     ADD UNIQUE KEY uq_app_users_email (email)`,
    [],
  );
}

async function runAuthSchemaMigration(
  deps: { getConnection: () => Promise<SqlConnection> },
): Promise<void> {
  const connection = await deps.getConnection();
  try {
    await connection.execute(SQL_CREATE_USERS, []);
    await ensureUserColumn(
      connection,
      "is_banned",
      "is_banned TINYINT(1) NOT NULL DEFAULT 0 AFTER role",
    );
    await ensureUserColumn(
      connection,
      "last_login_at",
      "last_login_at TIMESTAMP NULL DEFAULT NULL AFTER is_banned",
    );
    await ensureUserColumn(
      connection,
      "last_seen_at",
      "last_seen_at TIMESTAMP NULL DEFAULT NULL AFTER last_login_at",
    );
    await ensureUserColumn(
      connection,
      "email",
      "email VARCHAR(255) NULL DEFAULT NULL AFTER display_name",
    );
    await ensureUserColumn(
      connection,
      "email_verified_at",
      "email_verified_at TIMESTAMP NULL DEFAULT NULL AFTER email",
    );
    await ensureEmailUniqueIndex(connection);
    await connection.execute(SQL_CREATE_USER_AVATARS, []);
    await seedDemoUsers(connection);
  } finally {
    connection.release();
  }
}

export async function ensureAuthSchema(
  deps: { getConnection: () => Promise<SqlConnection> } = {
    getConnection: loadDefaultConnection,
  },
): Promise<void> {
  if (!schemaReady) {
    schemaReady = runAuthSchemaMigration(deps).catch((error) => {
      schemaReady = undefined;
      throw error;
    });
  }
  await schemaReady;
}

async function seedDemoUsers(connection: SqlConnection): Promise<void> {
  const rows = await connection.query<CountRow>(SQL_COUNT_USERS, []);
  const count = rows[0]?.count ?? 0;
  if (count > 0) {
    return;
  }

  for (const account of DEMO_ACCOUNTS) {
    await connection.execute(SQL_UPSERT_DEMO, [
      account.id,
      account.login,
      hashPassword(account.password),
      account.displayName,
      account.role,
    ]);
  }
}

const SQL_LIST_STUDENTS = `
  SELECT id, display_name
  FROM ${AUTH_USERS_TABLE}
  WHERE role = 'student'
  ORDER BY display_name ASC, id ASC
`;

export type { StudentOption } from "./types";

export async function listStudents(
  deps: { getConnection: () => Promise<SqlConnection> } = {
    getConnection: loadDefaultConnection,
  },
): Promise<StudentOption[]> {
  await ensureAuthSchema(deps);
  const connection = await deps.getConnection();
  try {
    const rows = await connection.query<{ id: number; display_name: string }>(
      SQL_LIST_STUDENTS,
      [],
    );
    return rows.map((row) => ({
      id: row.id,
      displayName: row.display_name.trim(),
    }));
  } finally {
    connection.release();
  }
}

export async function findUserByLogin(
  login: string,
  deps: { getConnection: () => Promise<SqlConnection> } = {
    getConnection: loadDefaultConnection,
  },
): Promise<(AuthUser & { passwordHash: string }) | null> {
  await ensureAuthSchema(deps);
  const connection = await deps.getConnection();
  try {
    const rows = await connection.query<UserRow>(SQL_FIND_BY_LOGIN, [login.trim()]);
    const row = rows[0];
    if (!row?.password_hash) return null;
    return { ...mapUser(row), passwordHash: row.password_hash };
  } finally {
    connection.release();
  }
}

export async function findUserById(
  userId: number,
  deps: { getConnection: () => Promise<SqlConnection> } = {
    getConnection: loadDefaultConnection,
  },
): Promise<AuthUser | null> {
  await ensureAuthSchema(deps);
  const connection = await deps.getConnection();
  try {
    const rows = await connection.query<UserRow>(SQL_FIND_BY_ID, [userId]);
    const row = rows[0];
    if (!row) return null;
    return mapUser(row);
  } finally {
    connection.release();
  }
}

export async function findUserByEmail(
  email: string,
  deps: { getConnection: () => Promise<SqlConnection> } = {
    getConnection: loadDefaultConnection,
  },
): Promise<(AuthUser & { passwordHash: string }) | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  await ensureAuthSchema(deps);
  const connection = await deps.getConnection();
  try {
    const rows = await connection.query<UserRow>(SQL_FIND_BY_EMAIL, [
      normalized,
    ]);
    const row = rows[0];
    if (!row?.password_hash) return null;
    return { ...mapUser(row), passwordHash: row.password_hash };
  } finally {
    connection.release();
  }
}

export async function markEmailVerified(
  userId: number,
  deps: { getConnection: () => Promise<SqlConnection> } = {
    getConnection: loadDefaultConnection,
  },
): Promise<void> {
  await ensureAuthSchema(deps);
  const connection = await deps.getConnection();
  try {
    await connection.execute(
      `UPDATE ${AUTH_USERS_TABLE}
       SET email_verified_at = COALESCE(email_verified_at, CURRENT_TIMESTAMP)
       WHERE id = ?`,
      [userId],
    );
  } finally {
    connection.release();
  }
}

const SQL_INSERT_USER = `
  INSERT INTO ${AUTH_USERS_TABLE}
    (login, password_hash, display_name, role, email, email_verified_at)
  VALUES (?, ?, ?, ?, ?, NULL)
`;

export type CreateUserInput = {
  login: string;
  displayName: string;
  password: string;
  role?: UserRole;
  /** Required for public student registration; optional for teacher activation. */
  email?: string | null;
};

export type CreateUserRecordInput = {
  login: string;
  displayName: string;
  passwordHash: string;
  role: UserRole;
  email?: string | null;
};

export class CreateUserError extends Error {
  constructor(
    message: string,
    public readonly code: "login_taken" | "email_taken" | "db_error",
  ) {
    super(message);
    this.name = "CreateUserError";
  }
}

function mapDupOrThrow(error: unknown): never {
  const errno =
    typeof error === "object" && error !== null && "errno" in error
      ? Number((error as { errno?: number }).errno)
      : undefined;
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" &&
          error !== null &&
          "message" in error &&
          typeof (error as { message?: unknown }).message === "string"
        ? (error as { message: string }).message
        : String(error);
  // MySQL ER_DUP_ENTRY
  if (errno === 1062) {
    if (/email/i.test(message) || /uq_app_users_email/i.test(message)) {
      throw new CreateUserError("Email already taken.", "email_taken");
    }
    throw new CreateUserError("Login already taken.", "login_taken");
  }
  console.error("createUserRecord: unexpected database error", error);
  throw new CreateUserError("Database operation failed.", "db_error");
}

/** Inserts on an already-open connection (caller owns the transaction / release). */
export async function insertUserOnConnection(
  connection: SqlConnection,
  input: CreateUserRecordInput,
): Promise<AuthUser> {
  try {
    const email =
      typeof input.email === "string" && input.email.trim()
        ? input.email.trim().toLowerCase()
        : null;
    const result = await connection.execute(SQL_INSERT_USER, [
      input.login,
      input.passwordHash,
      input.displayName,
      input.role,
      email,
    ]);
    return {
      id: result.insertId,
      login: input.login,
      displayName: input.displayName,
      role: input.role,
    };
  } catch (error) {
    mapDupOrThrow(error);
  }
}

/**
 * Inserts a user with an already-hashed password (e.g. paid teacher activation).
 * Public student registration should call `createUser` instead.
 */
export async function createUserRecord(
  input: CreateUserRecordInput,
  deps: { getConnection: () => Promise<SqlConnection> } = {
    getConnection: loadDefaultConnection,
  },
): Promise<AuthUser> {
  await ensureAuthSchema(deps);
  const connection = await deps.getConnection();
  try {
    return await insertUserOnConnection(connection, input);
  } finally {
    connection.release();
  }
}

/**
 * Creates a new auth user. Public registration always uses role=student.
 * Demo accounts keep fixed ids 1–3 via seed upsert.
 */
export async function createUser(
  input: CreateUserInput,
  deps: { getConnection: () => Promise<SqlConnection> } = {
    getConnection: loadDefaultConnection,
  },
): Promise<AuthUser> {
  const role: UserRole = input.role ?? "student";
  return createUserRecord(
    {
      login: input.login,
      displayName: input.displayName,
      passwordHash: hashPassword(input.password),
      role,
      email: input.email ?? null,
    },
    deps,
  );
}

const SQL_UPDATE_PASSWORD = `
  UPDATE ${AUTH_USERS_TABLE}
  SET password_hash = ?
  WHERE id = ?
`;

export class UpdatePasswordError extends Error {
  constructor(
    message: string,
    public readonly code: "db_error",
  ) {
    super(message);
    this.name = "UpdatePasswordError";
  }
}

export async function updateUserPassword(
  userId: number,
  password: string,
  deps: { getConnection: () => Promise<SqlConnection> } = {
    getConnection: loadDefaultConnection,
  },
): Promise<void> {
  await ensureAuthSchema(deps);
  const connection = await deps.getConnection();
  try {
    await connection.execute(SQL_UPDATE_PASSWORD, [
      hashPassword(password),
      userId,
    ]);
  } catch (error) {
    console.error("updateUserPassword: unexpected database error", error);
    throw new UpdatePasswordError("Database operation failed.", "db_error");
  } finally {
    connection.release();
  }
}
