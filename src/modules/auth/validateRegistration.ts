import {
  DISPLAY_NAME_MAX_LEN,
  DISPLAY_NAME_MIN_LEN,
  EMAIL_MAX_LEN,
  LOGIN_MAX_LEN,
  LOGIN_MIN_LEN,
  PASSWORD_MAX_LEN,
  PASSWORD_MIN_LEN,
  registerUserSchema,
  registrationErrorCode,
  teacherRegisterSchema,
} from "@/validations/authValidation";
import { validateSchema } from "@/validations/parse";

export {
  DISPLAY_NAME_MAX_LEN,
  DISPLAY_NAME_MIN_LEN,
  EMAIL_MAX_LEN,
  LOGIN_MAX_LEN,
  LOGIN_MIN_LEN,
  PASSWORD_MAX_LEN,
  PASSWORD_MIN_LEN,
};

export type RegistrationFieldError =
  | "requiredFields"
  | "invalidLogin"
  | "invalidDisplayName"
  | "invalidEmail"
  | "passwordTooShort"
  | "passwordTooLong"
  | "passwordMismatch"
  | "loginTaken"
  | "emailTaken"
  | "reservedLogin";

export type RegistrationInput = {
  login: string;
  displayName: string;
  email: string;
  password: string;
  passwordConfirm: string;
};

/** Teacher paid signup — same credentials rules, email collected later / not yet. */
export type TeacherRegistrationInput = {
  login: string;
  displayName: string;
  password: string;
  passwordConfirm: string;
};

export type ValidatedRegistration = {
  login: string;
  displayName: string;
  email: string;
  password: string;
};

export type ValidatedTeacherRegistration = {
  login: string;
  displayName: string;
  password: string;
};

export function normalizeLogin(raw: string): string {
  return raw.trim().toLowerCase();
}

export function normalizeDisplayName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

export function normalizeEmail(raw: string | null | undefined): string {
  return String(raw ?? "")
    .trim()
    .toLowerCase();
}

/**
 * Validates public self-registration fields (student only).
 * Returns a field error code or normalized values.
 */
export function validateRegistrationInput(
  input: RegistrationInput,
):
  | { ok: true; value: ValidatedRegistration }
  | { ok: false; code: RegistrationFieldError } {
  const parsed = validateSchema(registerUserSchema, input);
  if (!parsed.ok) {
    return { ok: false, code: registrationErrorCode(parsed.detail) };
  }
  const { passwordConfirm: _confirm, ...value } = parsed.value;
  return { ok: true, value };
}

/** Paid teacher registration — credentials only until email lands in that flow. */
export function validateTeacherRegistrationInput(
  input: TeacherRegistrationInput,
):
  | { ok: true; value: ValidatedTeacherRegistration }
  | { ok: false; code: RegistrationFieldError } {
  const parsed = validateSchema(teacherRegisterSchema, input);
  if (!parsed.ok) {
    return { ok: false, code: registrationErrorCode(parsed.detail) };
  }
  const { passwordConfirm: _confirm, ...value } = parsed.value;
  return { ok: true, value };
}
