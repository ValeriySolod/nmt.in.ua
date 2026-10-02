import "server-only";

import { timingSafeEqual } from "node:crypto";
import { consumeTelegramLink } from "./link";

type TelegramMessage = {
  chat?: { id?: number; type?: string };
  from?: { id?: number; username?: string };
  text?: string;
};

export function verifyTelegramWebhookSecret(received: string | null, expected: string): boolean {
  if (!received || !expected) return false;
  const left = Buffer.from(received);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function parseTelegramStart(update: unknown): {
  chatId: string;
  userId: string;
  username?: string;
  payload: string | null;
} | null {
  if (typeof update !== "object" || update === null) return null;
  const message = (update as { message?: TelegramMessage }).message;
  if (!message || !message.chat || !message.from || message.chat.type !== "private" ||
      !Number.isSafeInteger(message.chat.id) || !Number.isSafeInteger(message.from.id) ||
      message.chat.id !== message.from.id || typeof message.text !== "string") return null;
  const match = /^\/start(?:@\w+)?(?:\s+([^\s]+))?\s*$/.exec(message.text);
  if (!match) return null;
  return {
    chatId: String(message.chat.id),
    userId: String(message.from.id),
    username: message.from.username,
    payload: match[1] ?? null,
  };
}

export async function handleTelegramUpdate(
  update: unknown,
  deps: { consume: typeof consumeTelegramLink } = { consume: consumeTelegramLink },
): Promise<{ chatId: string; text: string } | null> {
  const start = parseTelegramStart(update);
  if (!start) return null;
  if (!start.payload) {
    return { chatId: start.chatId, text: "Щоб підключити Telegram, почніть у своєму кабінеті на nmt.in.ua." };
  }
  const linked = await deps.consume(start.payload, {
    userId: start.userId,
    chatId: start.chatId,
    username: start.username,
  });
  return {
    chatId: start.chatId,
    text: linked
      ? "Telegram успішно підключено до вашого облікового запису."
      : "Посилання недійсне або термін його дії минув. Створіть нове у своєму кабінеті.",
  };
}
