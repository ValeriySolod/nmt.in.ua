import type { SqlConnection } from "@/lib/db/mysql";
import { isDemoAccountLogin } from "@/modules/auth/demoLogin";
import { isUserOnline } from "@/modules/auth/presence";
import type { UserRole } from "@/modules/auth/types";
import { ensureAuthSchema } from "@/modules/auth/users";
import { AdminProfilesError, type AdminProfile } from "./types";

const SQL_LIST_PROFILES = `
  SELECT id, login, display_name, email, email_verified_at, role, is_banned,
         last_login_at, last_seen_at, created_at
  FROM app_users
  ORDER BY role ASC, display_name ASC, id ASC
`;

const SQL_FIND_TARGET = `
  SELECT id, login, display_name, email, email_verified_at, role, is_banned,
         last_login_at, last_seen_at, created_at
  FROM app_users
  WHERE id = ?
  LIMIT 1
`;

const SQL_SET_BANNED = `
  UPDATE app_users SET is_banned = ? WHERE id = ?
`;

const SQL_COUNT_ACTIVE_ADMINS = `
  SELECT COUNT(*) AS count
  FROM app_users
  WHERE role = 'admin' AND is_banned = 0
`;

type ProfileRow = {
  id: number;
  login: string;
  display_name: string;
  email: string | null;
  email_verified_at: Date | string | null;
  role: UserRole;
  is_banned: number | boolean | null;
  last_login_at: Date | string | null;
  last_seen_at: Date | string | null;
  created_at: Date | string;
};

type CountRow = { count: number };

async function loadDefaultConnection(): Promise<SqlConnection> {
  const { getConnection } = await import("@/lib/db/mysql");
  return getConnection();
}

function formatTimestamp(value: Date | string | null | undefined): string | null {
  if (value == null) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function isTruthyFlag(value: unknown): boolean {
  return value === true || value === 1 || value === "1";
}

function mapProfile(row: ProfileRow, nowMs = Date.now()): AdminProfile {
  const lastSeenAt = formatTimestamp(row.last_seen_at);
  const lastLoginAt = formatTimestamp(row.last_login_at);
  const email = row.email?.trim() || null;
  return {
    id: row.id,
    login: row.login.trim(),
    displayName: row.display_name.trim(),
    email,
    emailVerified: Boolean(formatTimestamp(row.email_verified_at)),
    role: row.role,
    isBanned: isTruthyFlag(row.is_banned),
    isOnline: isUserOnline(lastSeenAt, nowMs),
    lastLoginAt,
    lastSeenAt,
    createdAt: formatTimestamp(row.created_at) ?? String(row.created_at),
  };
}

export async function getAdminProfiles(
  deps: { getConnection: () => Promise<SqlConnection> } = {
    getConnection: loadDefaultConnection,
  },
): Promise<AdminProfile[]> {
  await ensureAuthSchema(deps);
  const connection = await deps.getConnection();
  try {
    const rows = await connection.query<ProfileRow>(SQL_LIST_PROFILES, []);
    return rows.map(mapProfile);
  } finally {
    connection.release();
  }
}

function assertValidIds(actorUserId: number, targetUserId: number): void {
  if (
    !Number.isInteger(targetUserId) ||
    targetUserId <= 0 ||
    !Number.isInteger(actorUserId) ||
    actorUserId <= 0
  ) {
    throw new AdminProfilesError("Invalid user id.", "invalid_input");
  }
}

async function loadTarget(
  connection: SqlConnection,
  targetUserId: number,
): Promise<AdminProfile> {
  const rows = await connection.query<ProfileRow>(SQL_FIND_TARGET, [
    targetUserId,
  ]);
  const row = rows[0];
  if (!row) {
    throw new AdminProfilesError("User not found.", "not_found");
  }
  return mapProfile(row);
}

function assertMutableTarget(
  actorUserId: number,
  target: AdminProfile,
): void {
  if (actorUserId === target.id) {
    throw new AdminProfilesError(
      "Cannot ban or delete your own account.",
      "self_action",
    );
  }
  if (isDemoAccountLogin(target.login)) {
    throw new AdminProfilesError(
      "Demo accounts are protected.",
      "protected_account",
    );
  }
}

async function assertNotLastActiveAdmin(
  connection: SqlConnection,
  target: AdminProfile,
): Promise<void> {
  if (target.role !== "admin" || target.isBanned) return;
  const rows = await connection.query<CountRow>(SQL_COUNT_ACTIVE_ADMINS, []);
  const count = rows[0]?.count ?? 0;
  if (count <= 1) {
    throw new AdminProfilesError(
      "Cannot ban or delete the last active admin.",
      "last_admin",
    );
  }
}

export type SetProfileBannedInput = {
  actorUserId: number;
  targetUserId: number;
  banned: boolean;
};

export async function setProfileBanned(
  input: SetProfileBannedInput,
  deps: { getConnection: () => Promise<SqlConnection> } = {
    getConnection: loadDefaultConnection,
  },
): Promise<AdminProfile> {
  assertValidIds(input.actorUserId, input.targetUserId);

  await ensureAuthSchema(deps);
  const connection = await deps.getConnection();
  try {
    const target = await loadTarget(connection, input.targetUserId);
    assertMutableTarget(input.actorUserId, target);

    if (input.banned && !target.isBanned) {
      await assertNotLastActiveAdmin(connection, target);
    }

    if (target.isBanned === input.banned) {
      return target;
    }

    await connection.execute(SQL_SET_BANNED, [
      input.banned ? 1 : 0,
      input.targetUserId,
    ]);

    return {
      ...target,
      isBanned: input.banned,
    };
  } catch (error) {
    if (error instanceof AdminProfilesError) throw error;
    console.error("setProfileBanned: unexpected database error", error);
    throw new AdminProfilesError("Database operation failed.", "db_error");
  } finally {
    connection.release();
  }
}

export type DeleteProfileInput = {
  actorUserId: number;
  targetUserId: number;
};

/** Removes related rows then deletes the user account. */
export async function deleteProfile(
  input: DeleteProfileInput,
  deps: { getConnection: () => Promise<SqlConnection> } = {
    getConnection: loadDefaultConnection,
  },
): Promise<AdminProfile> {
  assertValidIds(input.actorUserId, input.targetUserId);

  await ensureAuthSchema(deps);
  const connection = await deps.getConnection();
  try {
    const target = await loadTarget(connection, input.targetUserId);
    assertMutableTarget(input.actorUserId, target);
    await assertNotLastActiveAdmin(connection, target);

    await connection.beginTransaction();
    try {
      const optionalDeletes = [
        `DELETE FROM teacher_students
         WHERE teacher_user_id = ? OR student_user_id = ?`,
        `DELETE FROM teacher_profiles WHERE user_id = ?`,
        `DELETE FROM user_avatars WHERE user_id = ?`,
        `UPDATE site_feedback SET user_id = NULL WHERE user_id = ?`,
        `UPDATE teacher_payments SET user_id = NULL WHERE user_id = ?`,
      ] as const;

      for (const sql of optionalDeletes) {
        try {
          const params = sql.includes("teacher_user_id")
            ? [input.targetUserId, input.targetUserId]
            : [input.targetUserId];
          await connection.execute(sql, params);
        } catch (error) {
          const errno =
            typeof error === "object" && error !== null && "errno" in error
              ? Number((error as { errno?: number }).errno)
              : undefined;
          // ER_NO_SUCH_TABLE — related feature not migrated yet.
          if (errno === 1146) continue;
          throw error;
        }
      }

      await connection.execute(`DELETE FROM app_users WHERE id = ?`, [
        input.targetUserId,
      ]);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    }

    return target;
  } catch (error) {
    if (error instanceof AdminProfilesError) throw error;
    console.error("deleteProfile: unexpected database error", error);
    throw new AdminProfilesError("Database operation failed.", "db_error");
  } finally {
    connection.release();
  }
}
