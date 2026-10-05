import "server-only";
import type { SqlConnection } from "@/lib/db/mysql";
import { hashPassword as hashPasswordDefault } from "@/modules/auth/password";
import {
  validateRegistrationInput,
  type RegistrationFieldError,
} from "@/modules/auth/validateRegistration";
import { ensureAuthSchema } from "@/modules/auth/users";
import { ensureRosterLink, moveToGroup, requireOwnedGroup } from "./membership";
import { mysqlErrno } from "./mysqlErrno";
import {
  ensureTeacherStudentsSchema,
  loadTeacherStudentsConnection,
} from "./schema";
import {
  TeacherStudentsError,
  isPositiveInt,
  type TeacherStudentsErrorCode,
} from "./types";

/**
 * Role is a SQL literal, not a bound parameter, so the client cannot choose it.
 * email_verified_at is set here so the student can sign in with the password
 * the teacher sees once. Public registration still leaves it NULL.
 */
const SQL_INSERT_STUDENT = `
  INSERT INTO app_users
    (login, password_hash, display_name, role, email, email_verified_at)
  VALUES (?, ?, ?, 'student', ?, CURRENT_TIMESTAMP)
`;

const FIELD_ERROR: Record<RegistrationFieldError, TeacherStudentsErrorCode> = {
  requiredFields: "required_fields",
  invalidLogin: "invalid_login",
  invalidDisplayName: "invalid_display_name",
  invalidEmail: "invalid_email",
  passwordTooShort: "password_too_short",
  passwordTooLong: "password_too_long",
  passwordMismatch: "password_mismatch",
  loginTaken: "login_taken",
  emailTaken: "email_taken",
  reservedLogin: "reserved_login",
};

export type CreateStudentForTeacherInput = {
  teacherUserId: number;
  login: string;
  email: string;
  password: string;
  passwordConfirm: string;
  groupId: number | null;
};

export type CreatedStudentAccount = {
  studentUserId: number;
  login: string;
  displayName: string;
  email: string;
  groupId: number | null;
  groupName: string | null;
};

type CreateStudentDeps = {
  getConnection: () => Promise<SqlConnection>;
  hashPassword?: (password: string) => string;
};

export function parseOptionalGroupId(raw: unknown): number | null {
  if (raw == null) return null;
  const value = String(raw).trim();
  if (value === "") return null;
  if (!/^[1-9]\d*$/.test(value)) {
    throw new TeacherStudentsError(
      "groupId must be a positive integer.",
      "invalid_input",
    );
  }
  const groupId = Number(value);
  if (!isPositiveInt(groupId)) {
    throw new TeacherStudentsError(
      "groupId must be a positive integer.",
      "invalid_input",
    );
  }
  return groupId;
}

function rejectField(code: RegistrationFieldError): never {
  throw new TeacherStudentsError(
    "Student account details are invalid.",
    FIELD_ERROR[code],
  );
}

function mapDuplicate(error: unknown): never {
  const message = error instanceof Error ? error.message : "";
  if (mysqlErrno(error) === 1062) {
    if (/email/i.test(message) || /uq_app_users_email/i.test(message)) {
      throw new TeacherStudentsError("Email already taken.", "email_taken");
    }
    throw new TeacherStudentsError("Login already taken.", "login_taken");
  }
  throw error;
}

/**
 * Creates a student account and links it to the session teacher.
 * The password is hashed and is not part of the return value.
 */
export async function createStudentForTeacher(
  raw: CreateStudentForTeacherInput,
  deps: CreateStudentDeps = { getConnection: loadTeacherStudentsConnection },
): Promise<CreatedStudentAccount> {
  if (!isPositiveInt(raw.teacherUserId)) {
    throw new TeacherStudentsError(
      "teacherUserId must be a positive integer.",
      "invalid_input",
    );
  }

  const nick = String(raw.login ?? "");
  const validated = validateRegistrationInput({
    login: nick,
    displayName: nick,
    email: String(raw.email ?? ""),
    password: String(raw.password ?? ""),
    passwordConfirm: String(raw.passwordConfirm ?? ""),
  });
  if (!validated.ok) rejectField(validated.code);

  const groupId = raw.groupId;
  if (groupId !== null && !isPositiveInt(groupId)) {
    throw new TeacherStudentsError(
      "groupId must be a positive integer or null.",
      "invalid_input",
    );
  }

  await ensureAuthSchema({ getConnection: deps.getConnection });
  await ensureTeacherStudentsSchema(deps.getConnection);

  const hashPassword = deps.hashPassword ?? hashPasswordDefault;
  const passwordHash = hashPassword(validated.value.password);
  const connection = await deps.getConnection();
  try {
    await connection.beginTransaction();
    try {
      let groupName: string | null = null;
      if (groupId != null) {
        const group = await requireOwnedGroup(
          connection,
          raw.teacherUserId,
          groupId,
        );
        groupName = group.name;
      }

      let studentUserId = 0;
      try {
        const inserted = await connection.execute(SQL_INSERT_STUDENT, [
          validated.value.login,
          passwordHash,
          validated.value.displayName,
          validated.value.email,
        ]);
        studentUserId = inserted.insertId;
        if (inserted.affectedRows !== 1 || !isPositiveInt(studentUserId)) {
          throw new TeacherStudentsError(
            "Failed to create the student account.",
            "db_error",
          );
        }
      } catch (error) {
        if (error instanceof TeacherStudentsError) throw error;
        mapDuplicate(error);
      }

      await ensureRosterLink(connection, raw.teacherUserId, studentUserId);
      if (groupId != null) {
        await moveToGroup(
          connection,
          raw.teacherUserId,
          studentUserId,
          groupId,
        );
      }

      await connection.commit();
      return {
        studentUserId,
        login: validated.value.login,
        displayName: validated.value.displayName,
        email: validated.value.email,
        groupId,
        groupName,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } finally {
    connection.release();
  }
}
