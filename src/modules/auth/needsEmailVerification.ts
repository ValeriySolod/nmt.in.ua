import { isDemoAccountLogin } from "./demoLogin";
import type { AuthUser } from "./types";

/**
 * Blocks login only for public self-signups that still owe a confirmation.
 * Demo accounts, rows without an email, and anyone created before the gate
 * (or by a teacher) are not locked out.
 */
export function needsEmailVerification(user: AuthUser): boolean {
  if (isDemoAccountLogin(user.login)) return false;
  if (!user.email) return false;
  if (user.emailVerified) return false;
  return user.emailVerifyRequired === true;
}
