import "server-only";

export function readTelegramConfig() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const botUsername = process.env.TELEGRAM_BOT_USERNAME?.replace(/^@/, "");
  if (!botToken || !webhookSecret || !botUsername || !/^[A-Za-z0-9_]{5,32}$/.test(botUsername)) {
    throw new Error("Telegram integration is not configured.");
  }
  return { botToken, webhookSecret, botUsername };
}
