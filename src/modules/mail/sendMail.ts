import "server-only";

import {
  absoluteSiteUrl,
  resolveSiteUrl,
  type SiteOriginEnv,
} from "@/lib/siteOrigin";

export type SendMailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export type SendMailResult =
  | { ok: true; mode: "resend" | "log" }
  | { ok: false; error: string };

export type MailSiteEnv = SiteOriginEnv;

export const resolveMailSiteUrl = resolveSiteUrl;
export const absoluteUrl = absoluteSiteUrl;

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
