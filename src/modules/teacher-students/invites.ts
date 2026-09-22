import { randomBytes } from "node:crypto";
import type { SqlConnection } from "@/lib/db/mysql";
import {
  INVITE_CODE_ALPHABET,
  INVITE_CODE_LENGTH,
  INVITE_TTL_MS,
  inviteJoinPath,
  isInviteCode,
  normalizeInviteCode,
} from "./codes";

export function mintInviteCode(): string {
  const bytes = randomBytes(INVITE_CODE_LENGTH);
  let code = "";
  for (let index = 0; index < INVITE_CODE_LENGTH; index += 1) {
    code += INVITE_CODE_ALPHABET[bytes[index]! % INVITE_CODE_ALPHABET.length];
  }
  return code;
}
import {
  ensureRosterLink,
  moveToGroup,
  requireOwnedGroup,
} from "./membership";
import { mysqlErrno } from "./mysqlErrno";
import {
  ensureTeacherStudentsSchema,
  loadTeacherStudentsConnection,
} from "./schema";
import {
  TeacherStudentsError,
  isPositiveInt,
  type InviteKind,
} from "./types";

export type StudentInvite = {
  id: number;
  kind: InviteKind;
  groupId: number | null;
  groupName: string | null;
  code: string;
  expiresAt: Date;
};

export type CreateStudentInviteInput = {
  teacherUserId: number;
  kind: InviteKind;
  groupId: number | null;
};

export type RedeemInviteResult = {
  teacherUserId: number;
  teacherDisplayName: string;
  placement: InviteKind;
  groupId: number | null;
  groupName: string | null;
  linkCreated: boolean;
  membership: "kept" | "unchanged" | "placed" | "moved";
};

type InviteDeps = {
  getConnection: () => Promise<SqlConnection>;
  mintCode?: () => string;
  now?: () => Date;
};

const SQL_LIST_ACTIVE = `
  SELECT i.id, i.kind, i.group_id, i.code, i.expires_at, g.name AS group_name
  FROM student_invites i
  LEFT JOIN student_groups g ON g.id = i.group_id
  WHERE i.teacher_user_id = ?
    AND i.revoked_at IS NULL
    AND i.expires_at > CURRENT_TIMESTAMP
  ORDER BY i.kind ASC, i.id ASC
`;

const SQL_REVOKE_PERSONAL = `
  UPDATE student_invites
  SET revoked_at = CURRENT_TIMESTAMP
  WHERE teacher_user_id = ?
    AND kind = 'personal'
    AND revoked_at IS NULL
`;

const SQL_REVOKE_GROUP = `
  UPDATE student_invites
  SET revoked_at = CURRENT_TIMESTAMP
  WHERE teacher_user_id = ?
    AND kind = 'group'
    AND group_id = ?
    AND revoked_at IS NULL
`;

const SQL_INSERT_INVITE = `
  INSERT INTO student_invites
    (teacher_user_id, kind, group_id, code, expires_at)
  VALUES (?, ?, ?, ?, ?)
`;

const SQL_LOCK_INVITE = `
  SELECT
    i.id,
    i.teacher_user_id,
    i.kind,
    i.group_id,
    i.expires_at,
    i.revoked_at,
    t.display_name AS teacher_name,
    g.name AS group_name
  FROM student_invites i
  INNER JOIN app_users t ON t.id = i.teacher_user_id
  LEFT JOIN student_groups g
    ON g.id = i.group_id AND g.teacher_user_id = i.teacher_user_id
  WHERE i.code = ?
  LIMIT 1
  FOR UPDATE
`;

const SQL_LOCK_USER = `
  SELECT id, role
  FROM app_users
  WHERE id = ?
  LIMIT 1
  FOR UPDATE
`;

function asDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function mapInvite(row: {
  id: number;
  kind: string;
  group_id: number | null;
  code: string;
  expires_at: Date | string;
  group_name: string | null;
}): StudentInvite {
  const kind: InviteKind = row.kind === "group" ? "group" : "personal";
  return {
    id: row.id,
    kind,
    groupId: kind === "group" ? row.group_id : null,
    groupName: row.group_name?.trim() ? row.group_name.trim() : null,
    code: row.code,
    expiresAt: asDate(row.expires_at),
  };
}

export function validateCreateInviteInput(raw: unknown): CreateStudentInviteInput {
  if (typeof raw !== "object" || raw === null) {
    throw new TeacherStudentsError(
      "Request payload must be an object.",
      "invalid_input",
    );
  }
  const { teacherUserId, kind, groupId } = raw as Record<string, unknown>;
  if (!isPositiveInt(teacherUserId)) {
    throw new TeacherStudentsError(
      "teacherUserId must be a positive integer.",
      "invalid_input",
    );
  }
  if (kind !== "personal" && kind !== "group") {
    throw new TeacherStudentsError(
      "kind must be personal or group.",
      "invalid_input",
    );
  }
  if (kind === "personal") {
    return { teacherUserId, kind, groupId: null };
  }
  if (!isPositiveInt(groupId)) {
    throw new TeacherStudentsError(
      "groupId is required for a group invite.",
      "invalid_input",
    );
  }
  return { teacherUserId, kind, groupId };
}

export async function getActiveStudentInvites(
  teacherUserId: number,
  deps: InviteDeps = { getConnection: loadTeacherStudentsConnection },
): Promise<StudentInvite[]> {
  if (!isPositiveInt(teacherUserId)) {
    throw new TeacherStudentsError(
      "teacherUserId must be a positive integer.",
      "invalid_input",
    );
  }
  await ensureTeacherStudentsSchema(deps.getConnection);
  const connection = await deps.getConnection();
  try {
    const rows = await connection.query<{
      id: number;
      kind: string;
      group_id: number | null;
      code: string;
      expires_at: Date | string;
      group_name: string | null;
    }>(SQL_LIST_ACTIVE, [teacherUserId]);
    return rows.map(mapInvite);
  } finally {
    connection.release();
  }
}

export async function createStudentInvite(
  rawInput: unknown,
  deps: InviteDeps = { getConnection: loadTeacherStudentsConnection },
): Promise<StudentInvite> {
  const input = validateCreateInviteInput(rawInput);
  const mint = deps.mintCode ?? mintInviteCode;
  const now = deps.now ?? (() => new Date());
  await ensureTeacherStudentsSchema(deps.getConnection);

  let lastError: unknown;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = mint();
    if (!isInviteCode(code)) {
      throw new TeacherStudentsError("Invite code is invalid.", "db_error");
    }
    const expiresAt = new Date(now().getTime() + INVITE_TTL_MS);
    const connection = await deps.getConnection();
    try {
      await connection.beginTransaction();
      try {
        let groupName: string | null = null;
        if (input.kind === "group" && input.groupId != null) {
          const group = await requireOwnedGroup(
            connection,
            input.teacherUserId,
            input.groupId,
          );
          groupName = group.name;
          await connection.execute(SQL_REVOKE_GROUP, [
            input.teacherUserId,
            input.groupId,
          ]);
        } else {
          await connection.execute(SQL_REVOKE_PERSONAL, [input.teacherUserId]);
        }

        const inserted = await connection.execute(SQL_INSERT_INVITE, [
          input.teacherUserId,
          input.kind,
          input.groupId,
          code,
          expiresAt,
        ]);
        if (!inserted.insertId) {
          throw new TeacherStudentsError("Failed to store the invite.", "db_error");
        }
        await connection.commit();
        return {
          id: inserted.insertId,
          kind: input.kind,
          groupId: input.groupId,
          groupName,
          code,
          expiresAt,
        };
      } catch (error) {
        await connection.rollback();
        if (mysqlErrno(error) === 1062 && attempt < 4) {
          lastError = error;
          continue;
        }
        throw error;
      }
    } finally {
      connection.release();
    }
  }

  console.error("createStudentInvite: code collision", lastError);
  throw new TeacherStudentsError("Database operation failed.", "db_error");
}

export function validateRedeemCode(raw: unknown): string {
  if (typeof raw !== "string") {
    throw new TeacherStudentsError("Invite code is required.", "invite_invalid");
  }
  const code = normalizeInviteCode(raw);
  if (!isInviteCode(code)) {
    throw new TeacherStudentsError("Invite code is invalid.", "invite_invalid");
  }
  return code;
}

type InviteRow = {
  id: number;
  teacher_user_id: number;
  kind: string;
  group_id: number | null;
  expires_at: Date | string;
  revoked_at: Date | string | null;
  teacher_name: string;
  group_name: string | null;
};

/**
 * Student redeems a personal or group invite. Student id comes from the session.
 * Personal: teacher_students link only. Group: link plus that one group
 * (any previous group for this teacher is replaced).
 */
export async function redeemStudentInvite(
  rawInput: unknown,
  deps: InviteDeps = { getConnection: loadTeacherStudentsConnection },
): Promise<RedeemInviteResult> {
  if (typeof rawInput !== "object" || rawInput === null) {
    throw new TeacherStudentsError(
      "Request payload must be an object.",
      "invalid_input",
    );
  }
  const { studentUserId, code: rawCode } = rawInput as Record<string, unknown>;
  if (!isPositiveInt(studentUserId)) {
    throw new TeacherStudentsError(
      "studentUserId must be a positive integer.",
      "invalid_input",
    );
  }
  const code = validateRedeemCode(rawCode);
  const now = (deps.now ?? (() => new Date()))();
  await ensureTeacherStudentsSchema(deps.getConnection);

  const connection = await deps.getConnection();
  try {
    await connection.beginTransaction();
    try {
      const invites = await connection.query<InviteRow>(SQL_LOCK_INVITE, [code]);
      const invite = invites[0];
      if (!invite) {
        throw new TeacherStudentsError("Invite was not found.", "invite_invalid");
      }
      if (invite.revoked_at) {
        throw new TeacherStudentsError("Invite was revoked.", "invite_revoked");
      }
      if (asDate(invite.expires_at).getTime() <= now.getTime()) {
        throw new TeacherStudentsError("Invite has expired.", "invite_expired");
      }

      const users = await connection.query<{ id: number; role: string }>(
        SQL_LOCK_USER,
        [studentUserId],
      );
      const student = users[0];
      if (!student || student.role !== "student") {
        throw new TeacherStudentsError(
          "Only a student can redeem an invite.",
          "forbidden",
        );
      }
      if (student.id === invite.teacher_user_id) {
        throw new TeacherStudentsError(
          "A teacher cannot join their own roster.",
          "not_a_student",
        );
      }

      const kind: InviteKind = invite.kind === "group" ? "group" : "personal";
      const link = await ensureRosterLink(
        connection,
        invite.teacher_user_id,
        studentUserId,
      );

      let groupId: number | null = null;
      let groupName: string | null = null;
      let membership: RedeemInviteResult["membership"] = "kept";

      if (kind === "group") {
        if (!isPositiveInt(invite.group_id)) {
          throw new TeacherStudentsError(
            "Group invite has no group.",
            "invite_invalid",
          );
        }
        const group = await requireOwnedGroup(
          connection,
          invite.teacher_user_id,
          invite.group_id,
        );
        const moved = await moveToGroup(
          connection,
          invite.teacher_user_id,
          studentUserId,
          group.id,
        );
        groupId = group.id;
        groupName = group.name;
        membership = moved;
      }

      await connection.commit();
      return {
        teacherUserId: invite.teacher_user_id,
        teacherDisplayName: invite.teacher_name.trim(),
        placement: kind,
        groupId,
        groupName,
        linkCreated: link === "created",
        membership,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    if (error instanceof TeacherStudentsError) throw error;
    console.error("redeemStudentInvite: unexpected database error", error);
    throw new TeacherStudentsError("Database operation failed.", "db_error");
  } finally {
    connection.release();
  }
}

export function invitePathFor(invite: Pick<StudentInvite, "code">): string {
  return inviteJoinPath(invite.code);
}
