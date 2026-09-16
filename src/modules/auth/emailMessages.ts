import "server-only";

import { absoluteUrl, sendMail } from "@/modules/mail/sendMail";
import { issueAuthToken } from "./authTokens";

export async function sendEmailVerificationMail(input: {
  userId: number;
  email: string;
  displayName: string;
  locale?: string;
}): Promise<{ ok: boolean }> {
  const { rawToken } = await issueAuthToken(input.userId, "email_verify");
  const link = absoluteUrl(`/verify-email?token=${encodeURIComponent(rawToken)}`);
  const name = input.displayName.trim() || input.email;

  const subject = "Підтвердіть email — nmt.in.ua";
  const text = [
    `Вітаємо, ${name}!`,
    "",
    "Щоб увійти в кабінет, підтвердіть email за посиланням:",
    link,
    "",
    "Посилання дійсне 48 годин.",
    "Якщо ви не реєструвались на nmt.in.ua — проігноруйте цей лист.",
  ].join("\n");

  const html = `
    <p>Вітаємо, <strong>${escapeHtml(name)}</strong>!</p>
    <p>Щоб увійти в кабінет, підтвердіть email:</p>
    <p><a href="${escapeAttr(link)}">${escapeHtml(link)}</a></p>
    <p>Посилання дійсне 48 годин.</p>
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
