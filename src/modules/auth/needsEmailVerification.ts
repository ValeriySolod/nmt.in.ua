/**
 * Blocks login only for public self-signups that still owe a confirmation.
 * Rows without an email and anyone created before the gate (or by a teacher)
 * are not locked out.
 */
export function needsEmailVerification(user: AuthUser): boolean {
  if (!user.email) return false;
  if (user.emailVerified) return false;
  return user.emailVerifyRequired === true;
}
