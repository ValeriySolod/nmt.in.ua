import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import { absoluteUrl, sendMail } from "@/modules/mail/sendMail";
import { sendTelegramMessage } from "@/modules/telegram/transport";
import { optionalTelegramBot } from "./botLink";
import { marathonBotText, marathonDayUrl, marathonMail } from "./mailCopy";
import {
  deliverNotifications,
  planNotifications,
  unsubscribeToken,
  type NotifyIntent,
} from "./notifications";
import {
  claimNotification,
  loadNotifyAudience,
  releaseNotification,
  type NotifyAudienceMarathon,
} from "./store";

export function unsubscribeSecret(): string | null {
  return (
    process.env.MARATHON_UNSUBSCRIBE_SECRET?.trim() ||
    process.env.SESSION_SECRET?.trim() ||
    process.env.MARATHON_CRON_SECRET?.trim() ||
    null
  );
}

export function isMarathonCronAuthorized(header: string | null): boolean {
  const secret = process.env.MARATHON_CRON_SECRET?.trim();
  if (!secret || !header?.startsWith("Bearer ")) return false;
  const provided = header.slice("Bearer ".length);
  if (!provided) return false;
  const digest = (value: string) => createHash("sha256").update(value, "utf8").digest();
  return timingSafeEqual(digest(provided), digest(secret));
}

type Delivery = {
  intent: NotifyIntent;
  email: string | null;
  chatId: string | null;
  subject: string;
  text: string;
  html: string;
};

function buildDeliveries(
  audience: NotifyAudienceMarathon[],
  now: Date,
  secret: string | null,
): Delivery[] {
  const deliveries: Delivery[] = [];
  for (const marathon of audience) {
    const intents = planNotifications({
      now,
      marathonId: marathon.marathonId,
      startDate: marathon.startDate,
      unlockHour: marathon.unlockHour,
      daysCount: marathon.daysCount,
      people: marathon.people,
    });
    for (const intent of intents) {
      const person = marathon.people.find((item) => item.userId === intent.userId);
      if (!person) continue;
      const topic = marathon.topics[intent.dayNumber] ?? `День ${intent.dayNumber}`;
      const dayUrl = marathonDayUrl(marathon.slug, intent.dayNumber);
      const unsub = secret
        ? absoluteUrl(
            `/api/marathon/unsubscribe?m=${marathon.marathonId}&u=${person.userId}&t=${unsubscribeToken(marathon.marathonId, person.userId, secret)}`,
          )
        : null;
      const mail = marathonMail({
        kind: intent.kind,
        title: marathon.title,
        dayNumber: intent.dayNumber,
        topic,
        dayUrl,
        unsubscribeUrl: unsub,
      });
      deliveries.push({
        intent,
        email: person.email,
        chatId: person.telegramChatId,
        subject: mail.subject,
        text: intent.channel === "telegram"
          ? marathonBotText({ kind: intent.kind, dayNumber: intent.dayNumber, topic, dayUrl })
          : mail.text,
        html: mail.html,
      });
    }
  }
  return deliveries;
}

export async function runMarathonNotifications(deps: {
  now?: () => Date;
  load?: () => Promise<NotifyAudienceMarathon[]>;
  claim?: typeof claimNotification;
  release?: typeof releaseNotification;
  sendEmail?: (input: { to: string; subject: string; html: string; text: string }) => Promise<boolean>;
  sendTelegram?: (chatId: string, text: string) => Promise<boolean>;
  telegramEnabled?: boolean;
  secret?: string | null;
} = {}): Promise<{ sent: number; skipped: number; failed: number }> {
  const now = deps.now?.() ?? new Date();
  const audience = await (deps.load ?? loadNotifyAudience)();
  const secret = deps.secret === undefined ? unsubscribeSecret() : deps.secret;
  const telegramEnabled = deps.telegramEnabled ?? Boolean(optionalTelegramBot());
  const deliveries = buildDeliveries(audience, now, secret).filter(
    (item) => item.intent.channel === "email" || telegramEnabled,
  );
  const byKey = new Map(deliveries.map((item) => [intentKey(item.intent), item]));
  const sendEmail = deps.sendEmail ?? (async (input) => {
    const result = await sendMail(input);
    return result.ok;
  });
  const sendTelegram = deps.sendTelegram ?? (async (chatId, text) => {
    const bot = optionalTelegramBot();
    if (!bot) return false;
    const result = await sendTelegramMessage({ chatId, text }, bot.token);
    return result.status === "sent";
  });
  return deliverNotifications(
    deliveries.map((item) => item.intent),
    {
      claim: deps.claim ?? claimNotification,
      release: deps.release ?? releaseNotification,
      send: async (intent) => {
        const item = byKey.get(intentKey(intent));
        if (!item) return false;
        if (intent.channel === "email") {
          if (!item.email) return false;
          return sendEmail({
            to: item.email,
            subject: item.subject,
            html: item.html,
            text: item.text,
          });
        }
        if (!item.chatId) return false;
        return sendTelegram(item.chatId, item.text);
      },
    },
  );
}

function intentKey(intent: NotifyIntent): string {
  return `${intent.marathonId}:${intent.userId}:${intent.dayNumber}:${intent.kind}:${intent.channel}`;
}
