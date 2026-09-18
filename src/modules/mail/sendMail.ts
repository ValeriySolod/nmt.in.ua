import "server-only";

import { DEFAULT_SITE_URL } from "@/constants/seo";

export type SendMailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export type SendMailResult =
  | { ok: true; mode: "resend" | "log" }
  | { ok: false; error: string };

export type MailSiteEnv = {
  SITE_URL?: string;
  MAIL_SITE_URL?: string;
  NEXT_PUBLIC_SITE_URL?: string;
  NODE_ENV?: string;
  [key: string]: string | undefined;
};

const MAIL_ORIGIN_KEYS = ["SITE_URL", "MAIL_SITE_URL"] as const;

/** Dynamic key so `next build` cannot replace the value with a compile-time constant. */
function readEnv(env: MailSiteEnv, name: string): string {
  return String(env[name] ?? "").trim();
}

function stripSlash(url: string): string {
  return url.replace(/\/$/, "");
}

function isLocalOrigin(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host === "localhost" || host === "127.0.0.1";
  } catch {
    return /localhost|127\.0\.0\.1/i.test(url);
  }
}

/**
 * Public origin for verify / reset links.
 *
 * Read `SITE_URL` (or `MAIL_SITE_URL`) at runtime. Do not use
 * `NEXT_PUBLIC_SITE_URL` here: Next inlines that at `next build`, so CI/local
 * empty/localhost leaked into production emails even when `.env.production`
 * was correct. Production never returns localhost.
 */
export function resolveMailSiteUrl(env: MailSiteEnv = process.env): string {
  for (const key of MAIL_ORIGIN_KEYS) {
    const raw = readEnv(env, key);
    if (!raw) continue;
    if (readEnv(env, "NODE_ENV") === "production" && isLocalOrigin(raw)) {
      continue;
    }
    return stripSlash(raw);
  }
  if (readEnv(env, "NODE_ENV") === "production") return DEFAULT_SITE_URL;
  return "http://localhost:3000";
}

export function absoluteUrl(path: string, env: MailSiteEnv = process.env): string {
  const base = resolveMailSiteUrl(env);
  if (!path.startsWith("/")) return `${base}/${path}`;
  return `${base}${path}`;
}

function mailFrom(): string {
  return (
    process.env.MAIL_FROM?.trim() ||
    "NMT.in.ua <onboarding@resend.dev>"
  );
}

export function mailDeliveryMode(
  env: MailSiteEnv = process.env,
): "resend" | "log" | "unavailable" {
  if (env.RESEND_API_KEY?.trim()) return "resend";
  if (env.NODE_ENV === "production") return "unavailable";
  return "log";
}

/**
 * Sends transactional email via Resend when `RESEND_API_KEY` is set.
 * Without a key, local/dev logs the message and returns ok. Production
 * without a key fails closed — otherwise the UI pretends the letter left.
 */
export async function sendMail(
  input: SendMailInput,
): Promise<SendMailResult> {
  const to = input.to.trim().toLowerCase();
  if (!to) return { ok: false, error: "missing_to" };

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const mode = mailDeliveryMode();
  if (mode !== "resend" || !apiKey) {
    if (mode === "unavailable") {
      console.error("sendMail: RESEND_API_KEY is missing");
      return { ok: false, error: "missing_api_key" };
    }
    console.info(
      "[mail:log]",
      JSON.stringify({
        to,
        subject: input.subject,
        text: input.text ?? null,
        html: input.html,
      }),
    );
    return { ok: true, mode: "log" };
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: mailFrom(),
      to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    if (error) {
      console.error("sendMail: Resend error", error);
      return { ok: false, error: error.message || "resend_error" };
    }
    return { ok: true, mode: "resend" };
  } catch (error) {
    console.error("sendMail: unexpected error", error);
    return { ok: false, error: "send_failed" };
  }
}
