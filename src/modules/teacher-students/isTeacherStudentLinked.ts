import type { SqlConnection } from "@/lib/db/mysql";
import {
  ensureTeacherStudentsSchema,
  loadTeacherStudentsConnection,
} from "./schema";
import { isPositiveInt } from "./types";

type Deps = {
  getConnection: () => Promise<SqlConnection>;
};

/**
 * True when `studentUserId` is on this teacher's roster.
 */
export async function isTeacherStudentLinked(
  teacherUserId: number,
  studentUserId: number,
  deps: Deps = { getConnection: loadTeacherStudentsConnection },
): Promise<boolean> {
  if (!isPositiveInt(teacherUserId) || !isPositiveInt(studentUserId)) {
    return false;
  }

  await ensureTeacherStudentsSchema(deps.getConnection);
  const connection = await deps.getConnection();
  try {
    const rows = await connection.query<{ ok: number }>(
      `SELECT 1 AS ok
       FROM teacher_students
       WHERE teacher_user_id = ? AND student_user_id = ?
       LIMIT 1`,
      [teacherUserId, studentUserId],
    );
    return rows.length > 0;
  } finally {
    connection.release();
  }
}
