import "server-only";

import {
  absoluteSiteUrl,
  resolveSiteUrl,
  type SiteOriginEnv,
} from "@/lib/siteOrigin";

const BREVO_SMTP_URL = "https://api.brevo.com/v3/smtp/email";
const DEFAULT_MAIL_FROM = "NMT.in.ua <noreply@nmt.in.ua>";

export type SendMailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export type SendMailResult =
  | { ok: true; mode: "brevo" | "log" }
  | { ok: false; error: string };

export type MailSiteEnv = SiteOriginEnv;

export type MailSender = {
  name: string;
  email: string;
};

export const resolveMailSiteUrl = resolveSiteUrl;
export const absoluteUrl = absoluteSiteUrl;

function mailFrom(): string {
  return process.env.MAIL_FROM?.trim() || DEFAULT_MAIL_FROM;
}

/** `Name <email@domain>` or a bare address. Brevo wants name and email apart. */
export function parseMailFrom(raw: string): MailSender | null {
  const value = raw.trim();
  const wrapped = /^(.*?)<([^<>]+)>$/.exec(value);
  const email = (wrapped ? wrapped[2] : value).trim();
  const name = (wrapped ? wrapped[1] : "").trim().replace(/^["']|["']$/g, "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return { name: name || email, email };
}

export function mailDeliveryMode(
  env: MailSiteEnv = process.env,
): "brevo" | "log" | "unavailable" {
  if (env.BREVO_API_KEY?.trim()) return "brevo";
  if (env.NODE_ENV === "production") return "unavailable";
  return "log";
}

/**
 * Sends transactional email via Brevo when `BREVO_API_KEY` is set.
 * Without a key, local/dev logs the message and returns ok. Production
 * without a key fails closed — otherwise the UI pretends the letter left.
 */
export async function sendMail(
  input: SendMailInput,
): Promise<SendMailResult> {
  const to = input.to.trim().toLowerCase();
  if (!to) return { ok: false, error: "missing_to" };

  const apiKey = process.env.BREVO_API_KEY?.trim();
  const mode = mailDeliveryMode();
  if (mode !== "brevo" || !apiKey) {
    if (mode === "unavailable") {
      console.error("sendMail: BREVO_API_KEY is missing");
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

  const sender = parseMailFrom(mailFrom());
  if (!sender) {
    console.error("sendMail: MAIL_FROM is not an email address");
    return { ok: false, error: "bad_from" };
  }

  try {
    const response = await fetch(BREVO_SMTP_URL, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        sender,
        to: [{ email: to }],
        subject: input.subject,
        htmlContent: input.html,
        ...(input.text ? { textContent: input.text } : {}),
      }),
    });
    if (!response.ok) {
      const detail = await readBrevoError(response);
      console.error("sendMail: Brevo error", response.status, detail);
      return { ok: false, error: "brevo_error" };
    }
    return { ok: true, mode: "brevo" };
  } catch (error) {
    console.error("sendMail: unexpected error", error);
    return { ok: false, error: "send_failed" };
  }
}

async function readBrevoError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: unknown };
    if (typeof body.message === "string" && body.message.trim()) {
      return body.message.trim();
    }
  } catch {
    // Brevo sometimes returns an empty or non-JSON body.
  }
  return response.statusText || "brevo_error";
}
