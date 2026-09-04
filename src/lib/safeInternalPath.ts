/**
 * Accepts only same-origin relative paths for post-login redirects.
 * Rejects protocol-relative (`//evil.com`) and other open-redirect tricks.
 */
export function safeInternalPath(raw: unknown, fallback = "/"): string {
  if (typeof raw !== "string") return fallback;
  const value = raw.trim();
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (value.includes("\\") || value.includes("://")) return fallback;
  if (/[\0\r\n\t]/.test(value)) return fallback;

  try {
    const url = new URL(value, "https://nmt.in.ua");
    if (url.origin !== "https://nmt.in.ua") return fallback;
    if (url.username || url.password) return fallback;
    const path = `${url.pathname}${url.search}${url.hash}`;
    if (!path.startsWith("/") || path.startsWith("//")) return fallback;
    return path;
  } catch {
    return fallback;
  }
}
