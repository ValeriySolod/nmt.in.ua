import { isDemoAccountLogin } from "./demoLogin";
import type { AuthUser } from "./types";

/** New accounts with email must verify; demo + legacy (no email) skip. */
export function needsEmailVerification(user: AuthUser): boolean {
  if (isDemoAccountLogin(user.login)) return false;
  if (!user.email) return false;
  return !user.emailVerified;
}
