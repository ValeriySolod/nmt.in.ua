export function mysqlErrno(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null || !("errno" in error)) {
    return undefined;
  }
  return Number((error as { errno?: number }).errno);
}
