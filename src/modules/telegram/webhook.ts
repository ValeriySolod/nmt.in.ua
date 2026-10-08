import "server-only";

import { timingSafeEqual } from "node:crypto";
import { consumeTelegramLink } from "./link";
import { getTelegramTaskSessions, getTelegramTodayTaskSessions } from "./tasks";
import { formatTelegramTasks } from "./taskCommands";
import { completeTelegramTask } from "./completeTask";
import { createTaskReference } from "./taskReference";
import { handleTaskCallback, parseTaskCallback, type TelegramReply } from "./taskInteraction";
import { getTelegramTaskDetails } from "./taskDetails";

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
  deps: {
    consume: typeof consumeTelegramLink;
    getTasks?: typeof getTelegramTaskSessions;
    getTodayTasks?: typeof getTelegramTodayTaskSessions;
    logError?: (error: unknown) => void;
    completeTask?: typeof completeTelegramTask;
    referenceSecret?: string;
    getDetails?: typeof getTelegramTaskDetails;
    acknowledgeCallback?: (queryId: string) => Promise<void>;
    consumeMarathon?: (
      token: string,
      identity: { userId: string; chatId: string; username?: string },
    ) => Promise<boolean>;
  } = { consume: consumeTelegramLink },
): Promise<TelegramReply | null> {
  const callback = parseTaskCallback(update);
  if (callback) {
    if (deps.acknowledgeCallback) await deps.acknowledgeCallback(callback.queryId);
    try {
      return await handleTaskCallback(callback, {
        secret: deps.referenceSecret ?? process.env.TELEGRAM_WEBHOOK_SECRET ?? "",
        getDetails: deps.getDetails, completeTask: deps.completeTask,
      });
    } catch (error) {
      (deps.logError ?? ((value) => console.error("telegram callback failed", value)))(error);
      return { chatId: callback.chatId, text: "Не вдалося обробити дію. Спробуйте пізніше." };
    }
  }
  const done = parseTelegramDoneCommand(update);
  if (done) {
    if (!done.reference) return { chatId: done.chatId, text: "Використайте /done <посилання> зі списку /tasks або /today." };
    try {
      const result = await (deps.completeTask ?? completeTelegramTask)(done.userId, done.reference);
      return { chatId: done.chatId, text: result.status === "success" ? "Завдання завершено."
        : result.code === "notLinked" ? "Спочатку підключіть Telegram у своєму кабінеті на nmt.in.ua."
        : result.code === "databaseFailure" ? "Не вдалося завершити завдання. Спробуйте пізніше."
        : "Це завдання не можна завершити. Перевірте його стан і відповіді в кабінеті." };
    } catch (error) {
      (deps.logError ?? ((value) => console.error("telegram completion failed", value)))(error);
      return { chatId: done.chatId, text: "Не вдалося завершити завдання. Спробуйте пізніше." };
    }
  }
  const command = parseTelegramTaskCommand(update);
  if (command) {
    try {
      const service = command.today
        ? deps.getTodayTasks ?? getTelegramTodayTaskSessions
        : deps.getTasks ?? getTelegramTaskSessions;
      const result = await service(command.userId);
      if (result.status === "error") {
        return { chatId: command.chatId, text: result.code === "databaseFailure"
          ? "Не вдалося отримати завдання. Спробуйте пізніше."
          : "Спочатку підключіть Telegram у своєму кабінеті на nmt.in.ua." };
      }
      const secret = deps.referenceSecret ?? process.env.TELEGRAM_WEBHOOK_SECRET;
      const references = new Map<number, string>();
      const text = formatTelegramTasks(result.sessions, command.today, secret ? (id) => {
        const reference = createTaskReference(id, command.userId, secret);
        references.set(id, reference);
        return reference;
      } : undefined);
      const rows = result.sessions.filter((session) => {
        const reference = references.get(session.sessionId);
        return reference && text.includes(`/done ${reference}`);
      }).map((session, index) => [
        { text: `${index + 1}. Деталі`, callback_data: `d:${references.get(session.sessionId)}` },
        { text: "Завершити", callback_data: `a:${references.get(session.sessionId)}` },
      ]);
      return { chatId: command.chatId, text, ...(rows.length ? { replyMarkup: { inline_keyboard: rows } } : {}) };
    } catch (error) {
      if (deps.logError) deps.logError(error);
      else console.error("telegram tasks: command failed", error);
      return { chatId: command.chatId, text: "Не вдалося отримати завдання. Спробуйте пізніше." };
    }
  }
  const start = parseTelegramStart(update);
  if (!start) return null;
  if (start.payload && start.payload.startsWith("mth_") && start.payload.length !== 43) {
    try {
      const consumeMarathon = deps.consumeMarathon
        ?? (await import("@/modules/marathons/daily/botLink")).consumeMarathonStart;
      const linked = await consumeMarathon(start.payload, {
        userId: start.userId,
        chatId: start.chatId,
        username: start.username,
      });
      return {
        chatId: start.chatId,
        text: linked
          ? "Бот марафону підключено. Нагадування про дні приходитимуть сюди."
          : "Код марафону недійсний або його термін минув. Створіть новий у кабінеті марафону.",
      };
    } catch (error) {
      (deps.logError ?? ((value) => console.error("marathon telegram link failed", value)))(error);
      return { chatId: start.chatId, text: "Не вдалося підключити бота. Спробуйте пізніше." };
    }
  }
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

export function parseTelegramDoneCommand(update: unknown): { chatId: string; userId: string; reference: string | null } | null {
  if (typeof update !== "object" || update === null) return null;
  const message = (update as { message?: TelegramMessage }).message;
  if (!message?.chat || !message.from || message.chat.type !== "private" ||
      !Number.isSafeInteger(message.from.id) || Number(message.from.id) <= 0 ||
      message.chat.id !== message.from.id || typeof message.text !== "string") return null;
  if (!/^\/done(?:@\w+)?(?:\s|$)/.test(message.text)) return null;
  const match = /^\/done(?:@\w+)?\s+([A-Za-z0-9_-]{39,59})\s*$/.exec(message.text);
  return { chatId: String(message.chat.id), userId: String(message.from.id), reference: match?.[1] ?? null };
}

export function parseTelegramTaskCommand(update: unknown): {
  chatId: string; userId: string; today: boolean;
} | null {
  if (typeof update !== "object" || update === null) return null;
  const message = (update as { message?: TelegramMessage }).message;
  if (!message || !message.chat || !message.from || message.chat.type !== "private" ||
      !Number.isSafeInteger(message.chat.id) || !Number.isSafeInteger(message.from.id) ||
      Number(message.from.id) <= 0 || message.chat.id !== message.from.id || typeof message.text !== "string") return null;
  const match = /^\/(tasks|today)(?:@\w+)?\s*$/.exec(message.text);
  return match ? { chatId: String(message.chat.id), userId: String(message.from.id), today: match[1] === "today" } : null;
}
