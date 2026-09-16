import { DEMO_ACCOUNTS } from "./types";

export const LOGIN_MIN_LEN = 3;
export const LOGIN_MAX_LEN = 50;
export const DISPLAY_NAME_MIN_LEN = 2;
export const DISPLAY_NAME_MAX_LEN = 100;
export const PASSWORD_MIN_LEN = 8;
export const PASSWORD_MAX_LEN = 128;
export const EMAIL_MAX_LEN = 255;

/** login: latin letters, digits, underscore, hyphen, dot */
const LOGIN_PATTERN = /^[a-z0-9][a-z0-9._-]{1,48}[a-z0-9]$|^[a-z0-9]{3,50}$/i;

/** Practical email check — full RFC is overkill for registration. */
const EMAIL_PATTERN =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

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

const RESERVED_LOGINS = new Set(
  DEMO_ACCOUNTS.map((account) => account.login.toLowerCase()),
);

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

function validateCredentialFields(input: {
  login: string;
  displayName: string;
  password: string;
  passwordConfirm: string;
}):
  | {
      ok: true;
      value: { login: string; displayName: string; password: string };
    }
  | { ok: false; code: RegistrationFieldError } {
  const login = normalizeLogin(input.login);
  const displayName = normalizeDisplayName(input.displayName);
  const password = input.password;
  const passwordConfirm = input.passwordConfirm;

  if (!login || !displayName || !password || !passwordConfirm) {
    return { ok: false, code: "requiredFields" };
  }

  if (
    login.length < LOGIN_MIN_LEN ||
    login.length > LOGIN_MAX_LEN ||
    !LOGIN_PATTERN.test(login)
  ) {
    return { ok: false, code: "invalidLogin" };
  }

  if (RESERVED_LOGINS.has(login) || login.startsWith("demo-")) {
    return { ok: false, code: "reservedLogin" };
  }

  if (
    displayName.length < DISPLAY_NAME_MIN_LEN ||
    displayName.length > DISPLAY_NAME_MAX_LEN
  ) {
    return { ok: false, code: "invalidDisplayName" };
  }

  if (password.length < PASSWORD_MIN_LEN) {
    return { ok: false, code: "passwordTooShort" };
  }

  if (password.length > PASSWORD_MAX_LEN) {
    return { ok: false, code: "passwordTooLong" };
  }

  if (password !== passwordConfirm) {
    return { ok: false, code: "passwordMismatch" };
  }

  return { ok: true, value: { login, displayName, password } };
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
  const email = normalizeEmail(input.email);
  if (!email) {
    return { ok: false, code: "requiredFields" };
  }

  const credentials = validateCredentialFields(input);
  if (!credentials.ok) return credentials;

  if (email.length > EMAIL_MAX_LEN || !EMAIL_PATTERN.test(email)) {
    return { ok: false, code: "invalidEmail" };
  }

  return {
    ok: true,
    value: { ...credentials.value, email },
  };
}

/** Paid teacher registration — credentials only until email lands in that flow. */
export function validateTeacherRegistrationInput(
  input: TeacherRegistrationInput,
):
  | { ok: true; value: ValidatedTeacherRegistration }
  | { ok: false; code: RegistrationFieldError } {
  return validateCredentialFields(input);
}
