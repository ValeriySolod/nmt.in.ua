export type { AuthUser, SessionPayload, UserRole, StudentOption } from "./types";
export {
  DEMO_ACCOUNTS,
  canAssignMentorSessions,
  canImportContent,
  roleLabel,
  userInitials,
} from "./types";
export {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SEC,
  createSessionToken,
  verifySessionToken,
} from "./sessionToken";
export {
  getCurrentUser,
  getCurrentUserId,
  getSessionPayload,
  requireRole,
  requireUser,
  requireUserId,
} from "./getCurrentUser";
export type { LoginActionState, RegisterActionState } from "./actions";
export {
  loginAction,
  registerAction,
  logoutAction,
  demoLoginAction,
} from "./actions";
export {
  ensureAuthSchema,
  findUserById,
  findUserByLogin,
  listStudents,
  createUser,
  CreateUserError,
} from "./users";
export type { CreateUserInput } from "./users";
export {
  validateRegistrationInput,
  PASSWORD_MIN_LEN,
  PASSWORD_MAX_LEN,
} from "./validateRegistration";
export type {
  RegistrationFieldError,
  RegistrationInput,
} from "./validateRegistration";
