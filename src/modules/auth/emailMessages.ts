import "server-only";

import {
  absoluteUrl,
  sendMail,
  type SendMailInput,
  type SendMailResult,
} from "@/modules/mail/sendMail";
import { issueAuthToken } from "./authTokens";

const PERMANENT_MAIL_ERRORS = new Set([
  "brevo_error",
  "missing_api_key",
  "bad_from",
  "missing_to",
]);

export async function sendEmailVerificationMail(input: {
  userId: number;
  email: string;
  displayName: string;
  locale?: string;
  /**
   * Teacher-created students can already sign in with the password the
   * teacher hands over. The letter still confirms the address.
   */
  loginAlreadyAllowed?: boolean;
}): Promise<{ ok: boolean }> {
  const { rawToken } = await issueAuthToken(input.userId, "email_verify");
  const letter = buildVerificationLetter({ ...input, rawToken });
  const result = await sendMail(letter);
  if (!result.ok) {
    console.error("verify-mail: letter was not accepted", {
      userId: input.userId,
      email: input.email,
      error: result.error,
    });
  }
  return { ok: result.ok };
}

function buildVerificationLetter(input: {
  email: string;
  displayName: string;
  rawToken: string;
  loginAlreadyAllowed?: boolean;
}): SendMailInput {
  const link = absoluteUrl(
    `/verify-email?token=${encodeURIComponent(input.rawToken)}`,
  );
  const name = input.displayName.trim() || input.email;
  const open = input.loginAlreadyAllowed === true;

  const subject = "Підтвердіть email — nmt.in.ua";
  const text = open
    ? [
        `Вітаємо, ${name}!`,
        "",
        "Викладач створив вам обліковий запис на nmt.in.ua.",
        "Увійти можна вже зараз — пароль передасть викладач.",
        "",
        "Щоб адреса вважалась підтвердженою, перейдіть за посиланням:",
        link,
        "",
        "Посилання дійсне 24 години і спрацює один раз.",
        "Якщо ви не очікували цього листа — проігноруйте його.",
      ].join("\n")
    : [
        `Вітаємо, ${name}!`,
        "",
        "Щоб увійти в кабінет, підтвердіть email за посиланням:",
        link,
        "",
        "Посилання дійсне 24 години і спрацює один раз.",
        "Якщо ви не реєструвались на nmt.in.ua — проігноруйте цей лист.",
      ].join("\n");

  const html = open
    ? `
    <p>Вітаємо, <strong>${escapeHtml(name)}</strong>!</p>
    <p>Викладач створив вам обліковий запис на nmt.in.ua. Увійти можна вже зараз — пароль передасть викладач.</p>
    <p>Щоб адреса вважалась підтвердженою, перейдіть за посиланням:</p>
    <p><a href="${escapeAttr(link)}">${escapeHtml(link)}</a></p>
    <p>Посилання дійсне 24 години і спрацює один раз.</p>
    <p style="color:#666">Якщо ви не очікували цього листа — проігноруйте його.</p>
  `
    : `
    <p>Вітаємо, <strong>${escapeHtml(name)}</strong>!</p>
    <p>Щоб увійти в кабінет, підтвердіть email:</p>
    <p><a href="${escapeAttr(link)}">${escapeHtml(link)}</a></p>
    <p>Посилання дійсне 24 години і спрацює один раз.</p>
    <p style="color:#666">Якщо ви не реєструвались на nmt.in.ua — проігноруйте цей лист.</p>
  `;

  return {
    to: input.email,
    subject,
    text,
    html,
  };
}

type RegistrationMailInput = {
  userId: number;
  email: string;
  displayName: string;
  locale?: string;
  loginAlreadyAllowed?: boolean;
};

/**
 * First letter for every signup path: public `/register` (student and
 * teacher), a teacher-created student, and marathon `/join`.
 *
 * One token for the whole call. A transport retry sends that same link
 * again. Issuing a second token here used to mark the first link used
 * while Brevo was still delivering it, so the inbox stayed empty until
 * the person pressed «Надіслати лист ще раз» (that button is a new request
 * and does not call `redirect()`).
 */
export async function sendRegistrationVerificationMail(
  input: RegistrationMailInput,
  deps: {
    issue?: (userId: number) => Promise<{ rawToken: string }>;
    deliver?: (letter: SendMailInput) => Promise<SendMailResult>;
  } = {},
): Promise<{ ok: boolean }> {
  const issue =
    deps.issue ??
    ((userId: number) => issueAuthToken(userId, "email_verify"));
  const deliver = deps.deliver ?? sendMail;

  let rawToken: string;
  try {
    const issued = await issue(input.userId);
    rawToken = issued.rawToken;
  } catch (error) {
    console.error("verify-mail: could not issue a confirmation token", {
      userId: input.userId,
      email: input.email,
      error,
    });
    return { ok: false };
  }

  const letter = buildVerificationLetter({ ...input, rawToken });
  try {
    const first = await deliver(letter);
    if (first.ok) return { ok: true };
    console.error("verify-mail: first delivery was not accepted", {
      userId: input.userId,
      email: input.email,
      error: first.error,
    });
    if (PERMANENT_MAIL_ERRORS.has(first.error)) return { ok: false };
  } catch (error) {
    console.error("verify-mail: first delivery threw", {
      userId: input.userId,
      email: input.email,
      error,
    });
  }

  try {
    const second = await deliver(letter);
    if (!second.ok) {
      console.error("verify-mail: retry was not accepted", {
        userId: input.userId,
        email: input.email,
        error: second.error,
      });
    }
    return { ok: second.ok };
  } catch (error) {
    console.error("verify-mail: retry threw", {
      userId: input.userId,
      email: input.email,
      error,
    });
    return { ok: false };
  }
}

export async function sendPasswordResetMail(input: {
  userId: number;
  email: string;
  displayName: string;
}): Promise<{ ok: boolean }> {
  const { rawToken } = await issueAuthToken(input.userId, "password_reset");
  const link = absoluteUrl(
    `/reset-password?token=${encodeURIComponent(rawToken)}`,
  );
  const name = input.displayName.trim() || input.email;

  const subject = "Скидання пароля — nmt.in.ua";
  const text = [
    `Вітаємо, ${name}!`,
    "",
    "Щоб встановити новий пароль, перейдіть за посиланням:",
    link,
    "",
    "Посилання дійсне 1 годину.",
    "Якщо ви не просили скидання — проігноруйте цей лист.",
  ].join("\n");

  const html = `
    <p>Вітаємо, <strong>${escapeHtml(name)}</strong>!</p>
    <p>Щоб встановити новий пароль:</p>
    <p><a href="${escapeAttr(link)}">${escapeHtml(link)}</a></p>
    <p>Посилання дійсне 1 годину.</p>
    <p style="color:#666">Якщо ви не просили скидання — проігноруйте цей лист.</p>
  `;

  const result = await sendMail({
    to: input.email,
    subject,
    text,
    html,
  });
  return { ok: result.ok };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replaceAll("'", "&#39;");
}
