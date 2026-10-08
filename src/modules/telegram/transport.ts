import "server-only";
import type { TelegramReply } from "./taskInteraction";

export type TelegramSendResult = { status: "sent"; messageId: number }
  | { status: "rejected" | "unknown"; context: { httpStatus?: number; errorCode?: number; errorName?: string } };

export async function sendTelegramMessage(reply: TelegramReply, botToken: string, request: typeof fetch = fetch): Promise<TelegramSendResult> {
  try {
    const response = await request(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: reply.chatId, text: reply.text, reply_markup: reply.replyMarkup }),
      cache: "no-store", signal: AbortSignal.timeout(15_000),
    });
    const body: unknown = await response.json();
    if (body && typeof body === "object") {
      const payload = body as { ok?: unknown; error_code?: unknown; result?: { message_id?: unknown } };
      if (payload.ok === false && typeof payload.error_code === "number") {
        return { status: "rejected", context: { httpStatus: response.status, errorCode: payload.error_code } };
      }
      if (response.ok && payload.ok === true && Number.isSafeInteger(payload.result?.message_id)) {
        return { status: "sent", messageId: payload.result!.message_id as number };
      }
    }
    return { status: "unknown", context: { httpStatus: response.status } };
  } catch (error) {
    return { status: "unknown", context: { errorName: error instanceof Error ? error.name : "UnknownError" } };
  }
}
