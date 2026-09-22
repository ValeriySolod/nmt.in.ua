export type TeacherStudentLink = {
  studentUserId: number;
  login: string;
  displayName: string;
  createdAt: Date;
  groupId: number | null;
  groupName: string | null;
};

export type InviteKind = "personal" | "group";

export type TeacherStudentsErrorCode =
  | "invalid_input"
  | "not_found"
  | "not_a_student"
  | "already_linked"
  | "not_linked"
  | "forbidden"
  | "name_taken"
  | "group_not_found"
  | "invite_invalid"
  | "invite_expired"
  | "invite_revoked"
  | "required_fields"
  | "invalid_login"
  | "invalid_display_name"
  | "invalid_email"
  | "password_too_short"
  | "password_too_long"
  | "password_mismatch"
  | "login_taken"
  | "email_taken"
  | "reserved_login"
  | "db_error";

export class TeacherStudentsError extends Error {
  constructor(
    message: string,
    public readonly code: TeacherStudentsErrorCode,
  ) {
    super(message);
    this.name = "TeacherStudentsError";
  }
}

export function isPositiveInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}
