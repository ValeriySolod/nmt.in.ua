import type { SqlConnection } from "@/lib/db/mysql";
import { GROUP_NAME_MAX, normalizeGroupName } from "./codes";
import { mysqlErrno } from "./mysqlErrno";
import {
  ensureTeacherStudentsSchema,
  loadTeacherStudentsConnection,
} from "./schema";
import { TeacherStudentsError, isPositiveInt } from "./types";

export type StudentGroup = {
  id: number;
  name: string;
  memberCount: number;
  createdAt: Date;
};

type GroupDeps = {
  getConnection: () => Promise<SqlConnection>;
};

const SQL_LIST_GROUPS = `
  SELECT g.id, g.name, g.created_at,
         (SELECT COUNT(*) FROM student_group_members m WHERE m.group_id = g.id) AS member_count
  FROM student_groups g
  WHERE g.teacher_user_id = ?
  ORDER BY g.name ASC, g.id ASC
`;

const SQL_INSERT_GROUP = `
  INSERT INTO student_groups (teacher_user_id, name)
  VALUES (?, ?)
`;

const SQL_FIND_GROUP = `
  SELECT id, name, created_at
  FROM student_groups
  WHERE id = ?
    AND teacher_user_id = ?
  LIMIT 1
`;

const SQL_RENAME_GROUP = `
  UPDATE student_groups
  SET name = ?
  WHERE id = ?
    AND teacher_user_id = ?
`;

const SQL_DELETE_GROUP = `
  DELETE FROM student_groups
  WHERE id = ?
    AND teacher_user_id = ?
`;

function mapCreatedAt(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

export function validateGroupName(raw: unknown): string {
  if (typeof raw !== "string") {
    throw new TeacherStudentsError("Group name is required.", "invalid_input");
  }
  const name = normalizeGroupName(raw);
  if (!name || name.length > GROUP_NAME_MAX) {
    throw new TeacherStudentsError("Group name is invalid.", "invalid_input");
  }
  return name;
}

export async function getStudentGroups(
  teacherUserId: number,
  deps: GroupDeps = { getConnection: loadTeacherStudentsConnection },
): Promise<StudentGroup[]> {
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
      name: string;
      created_at: Date | string;
      member_count: number;
    }>(SQL_LIST_GROUPS, [teacherUserId]);
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      memberCount: Number(row.member_count) || 0,
      createdAt: mapCreatedAt(row.created_at),
    }));
  } finally {
    connection.release();
  }
}

export async function createStudentGroup(
  rawInput: unknown,
  deps: GroupDeps = { getConnection: loadTeacherStudentsConnection },
): Promise<StudentGroup> {
  if (typeof rawInput !== "object" || rawInput === null) {
    throw new TeacherStudentsError(
      "Request payload must be an object.",
      "invalid_input",
    );
  }
  const { teacherUserId, name: rawName } = rawInput as Record<string, unknown>;
  if (!isPositiveInt(teacherUserId)) {
    throw new TeacherStudentsError(
      "teacherUserId must be a positive integer.",
      "invalid_input",
    );
  }
  const name = validateGroupName(rawName);
  await ensureTeacherStudentsSchema(deps.getConnection);

  try {
    const connection = await deps.getConnection();
    try {
      const inserted = await connection.execute(SQL_INSERT_GROUP, [
        teacherUserId,
        name,
      ]);
      if (!inserted.insertId) {
        throw new TeacherStudentsError("Failed to store the group.", "db_error");
      }
      const rows = await connection.query<{
        id: number;
        name: string;
        created_at: Date | string;
      }>(SQL_FIND_GROUP, [inserted.insertId, teacherUserId]);
      const row = rows[0];
      return {
        id: row?.id ?? inserted.insertId,
        name: row?.name ?? name,
        memberCount: 0,
        createdAt: row ? mapCreatedAt(row.created_at) : new Date(),
      };
    } finally {
      connection.release();
    }
  } catch (error) {
    if (error instanceof TeacherStudentsError) throw error;
    if (mysqlErrno(error) === 1062) {
      throw new TeacherStudentsError(
        "A group with this name already exists.",
        "name_taken",
      );
    }
    console.error("createStudentGroup: unexpected database error", error);
    throw new TeacherStudentsError("Database operation failed.", "db_error");
  }
}

export async function renameStudentGroup(
  rawInput: unknown,
  deps: GroupDeps = { getConnection: loadTeacherStudentsConnection },
): Promise<StudentGroup> {
  if (typeof rawInput !== "object" || rawInput === null) {
    throw new TeacherStudentsError(
      "Request payload must be an object.",
      "invalid_input",
    );
  }
  const { teacherUserId, groupId, name: rawName } = rawInput as Record<
    string,
    unknown
  >;
  if (!isPositiveInt(teacherUserId) || !isPositiveInt(groupId)) {
    throw new TeacherStudentsError(
      "teacherUserId and groupId must be positive integers.",
      "invalid_input",
    );
  }
  const name = validateGroupName(rawName);
  await ensureTeacherStudentsSchema(deps.getConnection);

  try {
    const connection = await deps.getConnection();
    try {
      const existing = await connection.query<{
        id: number;
        name: string;
        created_at: Date | string;
      }>(SQL_FIND_GROUP, [groupId, teacherUserId]);
      const current = existing[0];
      if (!current) {
        throw new TeacherStudentsError("Group not found.", "group_not_found");
      }
      if (current.name !== name) {
        await connection.execute(SQL_RENAME_GROUP, [name, groupId, teacherUserId]);
      }
      return {
        id: current.id,
        name,
        memberCount: 0,
        createdAt: mapCreatedAt(current.created_at),
      };
    } finally {
      connection.release();
    }
  } catch (error) {
    if (error instanceof TeacherStudentsError) throw error;
    if (mysqlErrno(error) === 1062) {
      throw new TeacherStudentsError(
        "A group with this name already exists.",
        "name_taken",
      );
    }
    console.error("renameStudentGroup: unexpected database error", error);
    throw new TeacherStudentsError("Database operation failed.", "db_error");
  }
}

export async function deleteStudentGroup(
  rawInput: unknown,
  deps: GroupDeps = { getConnection: loadTeacherStudentsConnection },
): Promise<void> {
  if (typeof rawInput !== "object" || rawInput === null) {
    throw new TeacherStudentsError(
      "Request payload must be an object.",
      "invalid_input",
    );
  }
  const { teacherUserId, groupId } = rawInput as Record<string, unknown>;
  if (!isPositiveInt(teacherUserId) || !isPositiveInt(groupId)) {
    throw new TeacherStudentsError(
      "teacherUserId and groupId must be positive integers.",
      "invalid_input",
    );
  }
  await ensureTeacherStudentsSchema(deps.getConnection);
  const connection = await deps.getConnection();
  try {
    const result = await connection.execute(SQL_DELETE_GROUP, [
      groupId,
      teacherUserId,
    ]);
    if (result.affectedRows !== 1) {
      throw new TeacherStudentsError("Group not found.", "group_not_found");
    }
  } finally {
    connection.release();
  }
}
