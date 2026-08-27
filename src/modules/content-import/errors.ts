/** Error kinds map directly to HTTP status codes in the route handler. */
export type ContentImportErrorKind =
  | "unsupported_format"
  | "payload_too_large"
  | "validation"
  | "server";

/**
 * Thrown by every stage of the import pipeline (parsing, validation,
 * persistence). `errors` always holds at least one human-readable message;
 * the route handler decides which ones are safe to return to the client.
 */
export class ContentImportError extends Error {
  public readonly kind: ContentImportErrorKind;
  public readonly errors: string[];

  constructor(kind: ContentImportErrorKind, errors: string[]) {
    super(errors.join("; ") || kind);
    this.name = "ContentImportError";
    this.kind = kind;
    this.errors = errors;
  }
}
