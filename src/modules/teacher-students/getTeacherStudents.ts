import type { SqlConnection } from "@/lib/db/mysql";
import {
  ensureTeacherStudentsSchema,
  loadTeacherStudentsConnection,
} from "./schema";
import { TeacherStudentsError, isPositiveInt, type TeacherStudentLink } from "./types";

type GetTeacherStudentsDeps = {
  getConnection: () => Promise<SqlConnection>;
};

type LinkedStudentRow = {
  id: number;
  login: string;
  display_name: string;
  created_at: Date | string;
  group_id?: number | null;
  group_name?: string | null;
};

const SQL_LIST_LINKED_STUDENTS = `
  SELECT u.id, u.login, u.display_name, ts.created_at,
         m.group_id, g.name AS group_name
  FROM teacher_students ts
  INNER JOIN app_users u ON u.id = ts.student_user_id
  LEFT JOIN student_group_members m
    ON m.teacher_user_id = ts.teacher_user_id
   AND m.student_user_id = ts.student_user_id
  LEFT JOIN student_groups g ON g.id = m.group_id
  WHERE ts.teacher_user_id = ?
    AND u.role = 'student'
  ORDER BY u.display_name ASC, u.id ASC
`;

function mapRow(row: LinkedStudentRow): TeacherStudentLink {
  const groupId =
    row.group_id == null || !Number.isInteger(Number(row.group_id))
      ? null
      : Number(row.group_id);
  const groupName =
    typeof row.group_name === "string" && row.group_name.trim()
      ? row.group_name.trim()
      : null;
  return {
    studentUserId: row.id,
    login: row.login,
    displayName: row.display_name.trim(),
    createdAt:
      row.created_at instanceof Date ? row.created_at : new Date(row.created_at),
    groupId: groupName ? groupId : null,
    groupName,
  };
}

/**
 * Students linked to this teacher. `teacherUserId` must come from the session.
 */
export async function getTeacherStudents(
  teacherUserId: number,
  deps: GetTeacherStudentsDeps = {
    getConnection: loadTeacherStudentsConnection,
  },
): Promise<TeacherStudentLink[]> {
  if (!isPositiveInt(teacherUserId)) {
    throw new TeacherStudentsError(
      "teacherUserId must be a positive integer.",
      "invalid_input",
    );
  }

  await ensureTeacherStudentsSchema(deps.getConnection);
  const connection = await deps.getConnection();
  try {
    const rows = await connection.query<LinkedStudentRow>(
      SQL_LIST_LINKED_STUDENTS,
      [teacherUserId],
    );
    return rows.map(mapRow);
  } finally {
    connection.release();
  }
}
