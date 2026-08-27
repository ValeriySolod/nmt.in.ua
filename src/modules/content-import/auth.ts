import { createHash, timingSafeEqual } from "node:crypto";

const BEARER_PREFIX = "Bearer ";

/** Hashes to a fixed-length digest so `timingSafeEqual` never throws on length mismatch and no length is leaked. */
function digest(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

/**
 * Verifies `Authorization: Bearer <CONTENT_IMPORT_API_KEY>`.
 *
 * Fails closed: if `CONTENT_IMPORT_API_KEY` is not configured, every
 * request is rejected — there is nothing safe to compare against, so an
 * absent secret must never be treated as "no auth required".
 */
export function isAuthorizedContentImportRequest(authorizationHeader: string | null): boolean {
  const expected = process.env.CONTENT_IMPORT_API_KEY;
  if (!expected) return false;
  if (!authorizationHeader || !authorizationHeader.startsWith(BEARER_PREFIX)) return false;

  const provided = authorizationHeader.slice(BEARER_PREFIX.length);
  if (provided.length === 0) return false;

  return timingSafeEqual(digest(provided), digest(expected));
}
