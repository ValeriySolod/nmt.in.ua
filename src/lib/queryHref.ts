/** Build `pathname?a=1` and skip null/empty values so defaults stay out of the URL. */
export function queryHref(
  pathname: string,
  params: Record<string, string | null | undefined>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === "") continue;
    search.set(key, value);
  }
  const query = search.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function readSearchParam(
  raw: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(raw)) return raw[0];
  return raw;
}

export function isQueryFlagOn(raw: string | undefined): boolean {
  return raw === "1" || raw === "true";
}
