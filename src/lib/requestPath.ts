/** Paths that never render the cabinet chrome (header / sidebar / recent results). */
export const PUBLIC_CHROME_PATHS = new Set(["/login", "/register", "/welcome"]);

export function isPublicChromePath(pathname: string): boolean {
  return PUBLIC_CHROME_PATHS.has(pathname);
}

/**
 * Logged-in cabinet chrome. When the request path is unknown, default to showing
 * chrome so a missed proxy header cannot hide the dashboard.
 */
export function needsDashboardChrome(
  pathname: string | null,
  isLoggedIn: boolean,
): boolean {
  if (!isLoggedIn) return false;
  if (pathname == null || pathname === "") return true;
  return !isPublicChromePath(pathname);
}
