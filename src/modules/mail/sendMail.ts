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
  NEXT_PUBLIC_SITE_URL?: string;
  NODE_ENV?: string;
  [key: string]: string | undefined;
};

/**
 * Public origin for verify / reset links.
 *
 * Do not read `process.env.NEXT_PUBLIC_SITE_URL` as a static member: Next
 * inlines that at `next build`. CI has no public URL, so the compiled
 * server used localhost even when the host `.env.production` was correct.
 * Bracket access keeps a runtime lookup; production still falls back to
 * nmt.in.ua if both env vars are empty.
 */
export function resolveMailSiteUrl(env: MailSiteEnv = process.env): string {
  const raw =
    env["SITE_URL"]?.trim() || env["NEXT_PUBLIC_SITE_URL"]?.trim() || "";
  if (raw) return raw.replace(/\/$/, "");
  if (env.NODE_ENV === "production") return DEFAULT_SITE_URL;
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
