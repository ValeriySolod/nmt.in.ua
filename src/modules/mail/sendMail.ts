import "server-only";

export type SendMailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export type SendMailResult =
  | { ok: true; mode: "resend" | "log" }
  | { ok: false; error: string };

function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  return "http://localhost:3000";
}

export function absoluteUrl(path: string): string {
  const base = siteUrl();
  if (!path.startsWith("/")) return `${base}/${path}`;
  return `${base}${path}`;
}

function mailFrom(): string {
  return (
    process.env.MAIL_FROM?.trim() ||
    "NMT.in.ua <onboarding@resend.dev>"
  );
}

/**
 * Sends transactional email via Resend when `RESEND_API_KEY` is set.
 * Without a key (local/dev), logs the message and returns ok so flows
 * can be tested without a mailbox.
 */
export async function sendMail(
  input: SendMailInput,
): Promise<SendMailResult> {
  const to = input.to.trim().toLowerCase();
  if (!to) return { ok: false, error: "missing_to" };

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
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
