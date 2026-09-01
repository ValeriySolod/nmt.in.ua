import { createHash, timingSafeEqual } from "node:crypto";

const BEARER_PREFIX = "Bearer ";

function digest(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

/** True when admin API auth is configured (fail-closed when false). */
export function isAdminApiConfigured(): boolean {
  const expected = process.env.ADMIN_API_KEY;
  return typeof expected === "string" && expected.length > 0;
}

/**
 * Verifies `Authorization: Bearer <ADMIN_API_KEY>`.
 * Fails closed when `ADMIN_API_KEY` is unset.
 */
export function isAuthorizedAdminRequest(
  authorizationHeader: string | null,
): boolean {
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) return false;
  if (!authorizationHeader || !authorizationHeader.startsWith(BEARER_PREFIX)) {
    return false;
  }

  const provided = authorizationHeader.slice(BEARER_PREFIX.length);
  if (provided.length === 0) return false;

  return timingSafeEqual(digest(provided), digest(expected));
}
