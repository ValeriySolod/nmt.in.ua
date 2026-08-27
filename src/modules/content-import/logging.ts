import { ContentImportError } from "./errors";

/**
 * Whitelists driver error codes (e.g. mysql2's `ER_DUP_ENTRY`,
 * `ECONNREFUSED`) as safe to log: short, fixed, enum-like identifiers that
 * never carry query text, hostnames, or credentials.
 */
function sanitizeErrorCode(code: unknown): string | null {
  return typeof code === "string" && /^[A-Z][A-Z0-9_]{1,40}$/.test(code) ? code : null;
}

/**
 * Reduces any thrown value to a short, fixed-vocabulary category — never
 * the original error's message or stack, which may embed SQL text, host,
 * credentials, or other request data.
 */
export function categorizeError(error: unknown): string {
  if (error instanceof ContentImportError) return `content_import:${error.kind}`;
  if (error && typeof error === "object") {
    const code = sanitizeErrorCode((error as { code?: unknown }).code);
    if (code) return `db:${code}`;
  }
  if (error instanceof Error) return `error:${error.constructor.name}`;
  return "unknown";
}

/**
 * Logs a fixed operation identifier plus a sanitized error category only.
 * Never pass the original Error object (or its `.message`/stack) here.
 */
export function logSanitizedError(operation: string, error: unknown): void {
  console.error(operation, categorizeError(error));
}
