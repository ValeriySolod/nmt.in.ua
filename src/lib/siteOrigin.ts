import { DEFAULT_SITE_URL } from "@/constants/seo";

export type SiteOriginEnv = {
  SITE_URL?: string;
  MAIL_SITE_URL?: string;
  NEXT_PUBLIC_SITE_URL?: string;
  NODE_ENV?: string;
  [key: string]: string | undefined;
};

const ORIGIN_KEYS = ["SITE_URL", "MAIL_SITE_URL"] as const;

/** Dynamic key so `next build` cannot replace the value with a compile-time constant. */
function readEnv(env: SiteOriginEnv, name: string): string {
  return String(env[name] ?? "").trim();
}

function stripSlash(url: string): string {
  return url.replace(/\/$/, "");
}

export function isLoopbackHost(host: string): boolean {
  const value = host.trim().toLowerCase();
  if (!value) return false;
  if (value === "localhost" || value.endsWith(".localhost") || value === "::1") {
    return true;
  }
  // 127.0.0.0/8 — hosting Node listens on 127.1.10.37, not only 127.0.0.1.
  return /^127(?:\.\d{1,3}){3}$/.test(value);
}

export function isLoopbackOrigin(url: string): boolean {
  try {
    return isLoopbackHost(new URL(url).hostname);
  } catch {
    return /localhost|127\.\d/i.test(url);
  }
}

/**
 * Public origin for emails and 303 redirects.
 *
 * Do not use `request.url` / `nextUrl.origin` behind the hosting proxy:
 * Node listens on 127.1.10.37, so those become localhost and the browser
 * leaves nmt.in.ua after a successful verify. Do not use NEXT_PUBLIC_*:
 * Next inlines that at build.
 */
export function resolveSiteUrl(env: SiteOriginEnv = process.env): string {
  const production = readEnv(env, "NODE_ENV") === "production";
  for (const key of ORIGIN_KEYS) {
    const raw = readEnv(env, key);
    if (!raw) continue;
    if (production && isLoopbackOrigin(raw)) continue;
    return stripSlash(raw);
  }
  if (production) return DEFAULT_SITE_URL;
  return "http://localhost:3000";
}

export function absoluteSiteUrl(
  path: string,
  env: SiteOriginEnv = process.env,
): string {
  const base = resolveSiteUrl(env);
  if (!path.startsWith("/")) return `${base}/${path}`;
  return `${base}${path}`;
}
