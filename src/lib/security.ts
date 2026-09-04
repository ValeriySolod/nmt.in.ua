/** Shared path / probe detection for the request proxy and docs. */

const BLOCKED_PATH =
  /(?:^|\/)(?:\.env(?:\..*)?|\.git(?:\/|$)|\.svn|\.hg|wp-admin|wp-login\.php|xmlrpc\.php|phpmyadmin|adminer|cgi-bin|vendor\/phpunit|actuator|debug\/default|server-status)(?:\/|$)/i;

const BLOCKED_EXT =
  /\.(?:php|phtml|asp|aspx|jsp|cgi|exe|bat|cmd|sh|bash|py|pl|rb)(?:\/|$|\?)/i;

const BLOCKED_NAME =
  /(?:^|\/)(?:\.htaccess|\.htpasswd|web\.config|composer\.(?:json|lock)|id_rsa|id_dsa|\.DS_Store)(?:\/|$)/i;

export function isBlockedPath(pathname: string): boolean {
  const path = pathname.split("?")[0] || "/";
  return (
    BLOCKED_PATH.test(path) ||
    BLOCKED_EXT.test(path) ||
    BLOCKED_NAME.test(path) ||
    path.includes("..")
  );
}

export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return (
    headers.get("x-real-ip")?.trim() ||
    headers.get("cf-connecting-ip")?.trim() ||
    "unknown"
  );
}
