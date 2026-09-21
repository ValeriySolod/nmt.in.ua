import type { SqlConnection } from "@/lib/db/mysql";
import {
  ensureTeacherStudentsSchema,
  loadTeacherStudentsConnection,
} from "./schema";
import { TeacherStudentsError, isPositiveInt } from "./types";

export type RosterLinkResult = "created" | "exists";
export type GroupMoveResult = "unchanged" | "placed" | "moved";

type MembershipDeps = {
  getConnection: () => Promise<SqlConnection>;
};

const SQL_LOCK_LINK = `
  SELECT teacher_user_id
  FROM teacher_students
  WHERE teacher_user_id = ?
    AND student_user_id = ?
  LIMIT 1
  FOR UPDATE
`;

const SQL_INSERT_LINK = `
  INSERT INTO teacher_students (teacher_user_id, student_user_id)
  VALUES (?, ?)
`;

const SQL_LOCK_MEMBER = `
  SELECT group_id
  FROM student_group_members
  WHERE teacher_user_id = ?
    AND student_user_id = ?
  LIMIT 1
  FOR UPDATE
`;

const SQL_DELETE_MEMBER = `
  DELETE FROM student_group_members
  WHERE teacher_user_id = ?
    AND student_user_id = ?
`;

const SQL_INSERT_MEMBER = `
  INSERT INTO student_group_members (teacher_user_id, student_user_id, group_id)
  VALUES (?, ?, ?)
`;

const SQL_FIND_GROUP = `
  SELECT id, name
  FROM student_groups
  WHERE id = ?
    AND teacher_user_id = ?
  LIMIT 1
`;

export async function requireOwnedGroup(
  connection: SqlConnection,
  teacherUserId: number,
  groupId: number,
): Promise<{ id: number; name: string }> {
  const rows = await connection.query<{ id: number; name: string }>(
    SQL_FIND_GROUP,
    [groupId, teacherUserId],
  );
  const group = rows[0];
  if (!group) {
    throw new TeacherStudentsError(
      "Group does not belong to this teacher.",
      "group_not_found",
    );
  }
  return { id: group.id, name: group.name };
}

export async function ensureRosterLink(
  connection: SqlConnection,
  teacherUserId: number,
  studentUserId: number,
): Promise<RosterLinkResult> {
  const existing = await connection.query<{ teacher_user_id: number }>(
    SQL_LOCK_LINK,
    [teacherUserId, studentUserId],
  );
  if (existing[0]) return "exists";

  const inserted = await connection.execute(SQL_INSERT_LINK, [
    teacherUserId,
    studentUserId,
  ]);
  if (inserted.affectedRows !== 1) {
    throw new TeacherStudentsError(
      "Failed to store the teacher–student link.",
      "db_error",
    );
  }
  return "created";
}

/**
 * Replaces the student's group for this teacher. The primary key
 * (teacher, student) allows only one row — delete then insert.
 */
export async function moveToGroup(
  connection: SqlConnection,
  teacherUserId: number,
  studentUserId: number,
  groupId: number,
): Promise<GroupMoveResult> {
  const current = await connection.query<{ group_id: number }>(SQL_LOCK_MEMBER, [
    teacherUserId,
    studentUserId,
  ]);
  const previous = current[0]?.group_id ?? null;
  if (previous === groupId) return "unchanged";

  if (previous != null) {
    await connection.execute(SQL_DELETE_MEMBER, [teacherUserId, studentUserId]);
  }

  const inserted = await connection.execute(SQL_INSERT_MEMBER, [
    teacherUserId,
    studentUserId,
    groupId,
  ]);
  if (inserted.affectedRows !== 1) {
    throw new TeacherStudentsError(
      "Failed to store group membership.",
      "db_error",
    );
  }
  return previous == null ? "placed" : "moved";
}

export async function clearGroupMembership(
  connection: SqlConnection,
  teacherUserId: number,
  studentUserId: number,
): Promise<"cleared" | "none"> {
  const result = await connection.execute(SQL_DELETE_MEMBER, [
    teacherUserId,
    studentUserId,
  ]);
  return result.affectedRows > 0 ? "cleared" : "none";
}

export type PlaceStudentInGroupInput = {
  teacherUserId: number;
  studentUserId: number;
  groupId: number | null;
};

export function validatePlaceStudentInGroupInput(
  raw: unknown,
): PlaceStudentInGroupInput {
  if (typeof raw !== "object" || raw === null) {
    throw new TeacherStudentsError(
      "Request payload must be an object.",
      "invalid_input",
    );
  }
  const { teacherUserId, studentUserId, groupId } = raw as Record<
    string,
    unknown
  >;
  if (!isPositiveInt(teacherUserId) || !isPositiveInt(studentUserId)) {
    throw new TeacherStudentsError(
      "teacherUserId and studentUserId must be positive integers.",
      "invalid_input",
    );
  }
  if (teacherUserId === studentUserId) {
    throw new TeacherStudentsError(
      "teacherUserId and studentUserId must differ.",
      "invalid_input",
    );
  }
  if (groupId !== null && !isPositiveInt(groupId)) {
    throw new TeacherStudentsError(
      "groupId must be a positive integer or null.",
      "invalid_input",
    );
  }
  return { teacherUserId, studentUserId, groupId };
}

async function assertLinked(
  connection: SqlConnection,
  teacherUserId: number,
  studentUserId: number,
): Promise<void> {
  const existing = await connection.query<{ teacher_user_id: number }>(
    SQL_LOCK_LINK,
    [teacherUserId, studentUserId],
  );
  if (!existing[0]) {
    throw new TeacherStudentsError(
      "Student is not linked to this teacher.",
      "not_linked",
    );
  }
}

/**
 * Assigns or clears the one group this student has with the session teacher.
 * Does not create the teacher–student link.
 */
export async function placeStudentInGroup(
  rawInput: unknown,
  deps: MembershipDeps = { getConnection: loadTeacherStudentsConnection },
): Promise<GroupMoveResult | "cleared" | "none"> {
  const input = validatePlaceStudentInGroupInput(rawInput);
  await ensureTeacherStudentsSchema(deps.getConnection);
  const connection = await deps.getConnection();
  try {
    await connection.beginTransaction();
    try {
      await assertLinked(
        connection,
        input.teacherUserId,
        input.studentUserId,
      );
      if (input.groupId == null) {
        const cleared = await clearGroupMembership(
          connection,
          input.teacherUserId,
          input.studentUserId,
        );
        await connection.commit();
        return cleared;
      }
      await requireOwnedGroup(
        connection,
        input.teacherUserId,
        input.groupId,
      );
      const moved = await moveToGroup(
        connection,
        input.teacherUserId,
        input.studentUserId,
        input.groupId,
      );
      await connection.commit();
      return moved;
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } finally {
    connection.release();
  }
}
