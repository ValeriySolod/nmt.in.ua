import "server-only";

import { absoluteUrl, sendMail } from "@/modules/mail/sendMail";
import { issueAuthToken } from "./authTokens";

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
  const link = absoluteUrl(`/verify-email?token=${encodeURIComponent(rawToken)}`);
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

  const result = await sendMail({
    to: input.email,
    subject,
    text,
    html,
  });
  return { ok: result.ok };
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
