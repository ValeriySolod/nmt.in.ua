/** Parse `/?theme=123` into a positive theme id, or `undefined` if invalid. */
export function parseThemeQueryParam(
  raw: string | null | undefined,
): number | undefined {
  if (raw == null || raw === "") {
    return undefined;
  }
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    return undefined;
  }
  return id;
}

/** Pick a theme id that exists in the catalog, or fall back to the first theme. */
export function resolveInitialThemeId(
  themeIds: readonly number[],
  preferredId: number | undefined,
): number | undefined {
  if (themeIds.length === 0) {
    return undefined;
  }
  if (preferredId !== undefined && themeIds.includes(preferredId)) {
    return preferredId;
  }
  return themeIds[0];
}
