import { readTelegramConfig } from "@/modules/telegram/config";
import { handleTelegramUpdate, verifyTelegramWebhookSecret } from "@/modules/telegram/webhook";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  let config: ReturnType<typeof readTelegramConfig>;
  try {
    config = readTelegramConfig();
  } catch {
    return new Response(null, { status: 503 });
  }
  if (!verifyTelegramWebhookSecret(
    request.headers.get("x-telegram-bot-api-secret-token"),
    config.webhookSecret,
  )) return new Response(null, { status: 401 });
  if (Number(request.headers.get("content-length") ?? 0) > 65536) {
    return new Response(null, { status: 413 });
  }
  let update: unknown;
  try {
    const body = await request.text();
    if (body.length > 65536) return new Response(null, { status: 413 });
    update = JSON.parse(body) as unknown;
  } catch {
    return new Response(null, { status: 400 });
  }
  try {
    const reply = await handleTelegramUpdate(update);
    if (reply) {
      const response = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chat_id: reply.chatId, text: reply.text }),
        cache: "no-store",
      });
      if (!response.ok) return new Response(null, { status: 502 });
    }
    return new Response(null, { status: 200 });
  } catch {
    return new Response(null, { status: 500 });
  }
}
