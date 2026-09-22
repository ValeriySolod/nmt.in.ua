import type { SqlConnection } from "@/lib/db/mysql";
import { ensureConsultationSchema } from "@/modules/consultations/schema";
import {
  ensureRosterLink,
  moveToGroup,
  requireOwnedGroup,
} from "./membership";
import {
  ensureTeacherStudentsSchema,
  loadTeacherStudentsConnection,
} from "./schema";
import {
  TeacherStudentsError,
  isPositiveInt,
  type InviteKind,
} from "./types";

export type AttachConsultationInput = {
  teacherUserId: number;
  requestId: number;
  placement: InviteKind;
  groupId: number | null;
};

export type AttachConsultationResult = {
  studentUserId: number;
  studentDisplayName: string;
  studentLogin: string;
  groupId: number | null;
  groupName: string | null;
  linkCreated: boolean;
  membership: "kept" | "unchanged" | "placed" | "moved";
};

type AttachDeps = {
  getConnection: () => Promise<SqlConnection>;
};

const SQL_FIND_REQUEST = `
  SELECT r.id, r.student_id, u.role, u.display_name, u.login
  FROM consultation_requests r
  INNER JOIN app_users u ON u.id = r.student_id
  WHERE r.id = ?
  LIMIT 1
`;

export function validateAttachConsultationInput(
  raw: unknown,
): AttachConsultationInput {
  if (typeof raw !== "object" || raw === null) {
    throw new TeacherStudentsError(
      "Request payload must be an object.",
      "invalid_input",
    );
  }
  const { teacherUserId, requestId, placement, groupId } = raw as Record<
    string,
    unknown
  >;
  if (!isPositiveInt(teacherUserId) || !isPositiveInt(requestId)) {
    throw new TeacherStudentsError(
      "teacherUserId and requestId must be positive integers.",
      "invalid_input",
    );
  }
  if (placement !== "personal" && placement !== "group") {
    throw new TeacherStudentsError(
      "placement must be personal or group.",
      "invalid_input",
    );
  }
  if (placement === "personal") {
    return { teacherUserId, requestId, placement, groupId: null };
  }
  if (!isPositiveInt(groupId)) {
    throw new TeacherStudentsError(
      "groupId is required when attaching into a group.",
      "invalid_input",
    );
  }
  return { teacherUserId, requestId, placement, groupId };
}

/**
 * Links the consultation's student to the session teacher.
 * Personal: roster only. Group: roster plus that group (replaces any other
 * group this teacher already had the student in).
 */
export async function attachConsultationStudent(
  rawInput: unknown,
  deps: AttachDeps = { getConnection: loadTeacherStudentsConnection },
): Promise<AttachConsultationResult> {
  const input = validateAttachConsultationInput(rawInput);
  await ensureConsultationSchema(deps.getConnection);
  await ensureTeacherStudentsSchema(deps.getConnection);

  const connection = await deps.getConnection();
  try {
    await connection.beginTransaction();
    try {
      const rows = await connection.query<{
        id: number;
        student_id: number;
        role: string;
        display_name: string;
        login: string;
      }>(SQL_FIND_REQUEST, [input.requestId]);
      const request = rows[0];
      if (!request) {
        throw new TeacherStudentsError(
          "Consultation request was not found.",
          "not_found",
        );
      }
      if (request.role !== "student") {
        throw new TeacherStudentsError(
          "Consultation author must be a student.",
          "not_a_student",
        );
      }
      if (request.student_id === input.teacherUserId) {
        throw new TeacherStudentsError(
          "A teacher cannot link their own account.",
          "not_a_student",
        );
      }

      const link = await ensureRosterLink(
        connection,
        input.teacherUserId,
        request.student_id,
      );

      let groupId: number | null = null;
      let groupName: string | null = null;
      let membership: AttachConsultationResult["membership"] = "kept";

      if (input.placement === "group" && input.groupId != null) {
        const group = await requireOwnedGroup(
          connection,
          input.teacherUserId,
          input.groupId,
        );
        const moved = await moveToGroup(
          connection,
          input.teacherUserId,
          request.student_id,
          group.id,
        );
        groupId = group.id;
        groupName = group.name;
        membership = moved;
      }

      await connection.commit();
      return {
        studentUserId: request.student_id,
        studentDisplayName: request.display_name.trim(),
        studentLogin: request.login,
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
    console.error("attachConsultationStudent: unexpected database error", error);
    throw new TeacherStudentsError("Database operation failed.", "db_error");
  } finally {
    connection.release();
  }
}
