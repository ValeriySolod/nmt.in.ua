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

const TRANSIENT_BREVO_STATUS = new Set([408, 429, 500, 502, 503, 504]);
const BREVO_ATTEMPTS = 2;

export type SendMailDeps = {
  fetchImpl?: (url: string, init: RequestInit) => Promise<Response>;
  env?: MailSiteEnv;
  sleep?: (ms: number) => Promise<void>;
};

const defaultSleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Sends transactional email via Brevo when `BREVO_API_KEY` is set.
 * Without a key, local/dev logs the message and returns ok. Production
 * without a key fails closed — otherwise the UI pretends the letter left.
 *
 * The response body is read before this returns. Registration then calls
 * `redirect()`, and a socket closed after headers-only used to drop the
 * first letter while the later resend (a fresh request) went through.
 * One retry covers a reset connection or a transient Brevo status.
 */
export async function sendMail(
  input: SendMailInput,
  deps: SendMailDeps = {},
): Promise<SendMailResult> {
  const to = input.to.trim().toLowerCase();
  if (!to) return { ok: false, error: "missing_to" };

  const env = deps.env ?? process.env;
  const apiKey = env.BREVO_API_KEY?.trim();
  const mode = mailDeliveryMode(env);
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

  const fromRaw = env.MAIL_FROM?.trim() || DEFAULT_MAIL_FROM;
  const sender = parseMailFrom(fromRaw);
  if (!sender) {
    console.error("sendMail: MAIL_FROM is not an email address");
    return { ok: false, error: "bad_from" };
  }

  const fetchImpl = deps.fetchImpl ?? fetch;
  const sleep = deps.sleep ?? defaultSleep;
  const body = JSON.stringify({
    sender,
    to: [{ email: to }],
    subject: input.subject,
    htmlContent: input.html,
    ...(input.text ? { textContent: input.text } : {}),
  });

  let lastError = "send_failed";
  for (let attempt = 1; attempt <= BREVO_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetchImpl(BREVO_SMTP_URL, {
        method: "POST",
        cache: "no-store",
        signal: AbortSignal.timeout(12_000),
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "api-key": apiKey,
        },
        body,
      });
      const raw = await response.text();
      if (!response.ok) {
        const detail = readBrevoError(raw, response.statusText);
        console.error("sendMail: Brevo error", response.status, detail);
        lastError = "brevo_error";
        if (
          !TRANSIENT_BREVO_STATUS.has(response.status) ||
          attempt === BREVO_ATTEMPTS
        ) {
          return { ok: false, error: "brevo_error" };
        }
      } else {
        return { ok: true, mode: "brevo" };
      }
    } catch (error) {
      console.error("sendMail: unexpected error", error);
      lastError = "send_failed";
      if (attempt === BREVO_ATTEMPTS) {
        return { ok: false, error: "send_failed" };
      }
    }
    await sleep(200);
  }
  return { ok: false, error: lastError };
}

function readBrevoError(raw: string, statusText: string): string {
  try {
    const body = JSON.parse(raw) as { message?: unknown };
    if (typeof body.message === "string" && body.message.trim()) {
      return body.message.trim();
    }
  } catch {
    // Brevo sometimes returns an empty or non-JSON body.
  }
  return statusText || "brevo_error";
}
