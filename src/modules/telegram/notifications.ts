import "server-only";
import type { SqlConnection } from "@/lib/db/mysql";
import { readTelegramConfig } from "./config";
import { loadTelegramConnection } from "./schema";
import { getTelegramAvailableTaskSessions } from "./tasks";
import { createTaskReference } from "./taskReference";
import { claimNotification, recordNotificationResult, type NotificationKey } from "./notificationDelivery";
import { sendTelegramMessage } from "./transport";

type Account = { id: number; user_id: number; telegram_user_id: string; telegram_chat_id: string };
type Deps = {
  getConnection: () => Promise<SqlConnection>;
  readConfig?: typeof readTelegramConfig;
  send?: typeof sendTelegramMessage;
  nowSec?: () => number;
  logError?: (context: unknown) => void;
};

export async function processTelegramTaskNotifications(deps: Deps = { getConnection: loadTelegramConnection }) {
  const counts = { sent: 0, rejected: 0, uncertain: 0, skipped: 0, failed: 0 };
  const log = deps.logError ?? ((context: unknown) => console.error("telegram notifications failed", context));
  const config = (deps.readConfig ?? readTelegramConfig)();
  const connection = await deps.getConnection();
  try {
    const accounts = await connection.query<Account>(`SELECT uta.id, uta.user_id, uta.telegram_user_id, uta.telegram_chat_id
      FROM user_telegram_accounts uta INNER JOIN app_users u ON u.id = uta.user_id AND u.is_banned = 0
      WHERE uta.telegram_chat_id = uta.telegram_user_id ORDER BY uta.id`);
    const borrowed = { ...connection, release: () => {} };
    const taskDeps = { getConnection: async () => borrowed, nowSec: deps.nowSec, logError: log };
    for (const account of accounts) {
      const identity = String(account.telegram_user_id);
      const tasks = await getTelegramAvailableTaskSessions(identity, taskDeps);
      if (tasks.status === "error") { counts.failed++; continue; }
      for (const task of tasks.sessions) {
        const key: NotificationKey = { accountId: account.id, sessionId: task.sessionId };
        try {
          const reference = createTaskReference(task.sessionId, identity, config.webhookSecret);
          if (!await claimNotification(connection, key)) { counts.skipped++; continue; }
          await connection.beginTransaction();
          const linked = await connection.query<Account>(`SELECT uta.id, uta.user_id, uta.telegram_user_id, uta.telegram_chat_id
            FROM user_telegram_accounts uta INNER JOIN app_users u ON u.id = uta.user_id AND u.is_banned = 0
            WHERE uta.id = ? AND uta.telegram_user_id = ? AND uta.telegram_chat_id = uta.telegram_user_id FOR UPDATE`, [account.id, identity]);
          if (linked[0]) {
            await connection.query(`SELECT id FROM task_sessions WHERE id = ? AND user_id = ? FOR UPDATE`, [task.sessionId, linked[0].user_id]);
            await connection.query(`SELECT ma.id FROM mentor_assignment_members mam
              INNER JOIN mentor_assignments ma ON ma.id = mam.assignment_id
              WHERE mam.session_id = ? AND mam.student_user_id = ? FOR UPDATE`, [task.sessionId, linked[0].user_id]);
          }
          const current = linked[0] ? await getTelegramAvailableTaskSessions(identity, taskDeps, task.sessionId) : null;
          if (current?.status === "error" && current.code === "databaseFailure") throw new Error("Notification eligibility read failed.");
          if (current?.status !== "success" || !current.sessions.length) {
            await recordNotificationResult(connection, key);
            await connection.commit();
            counts.skipped++;
            continue;
          }
          const result = await (deps.send ?? sendTelegramMessage)({
            chatId: String(linked[0].telegram_chat_id), text: "У вас доступне нове завдання.",
            replyMarkup: { inline_keyboard: [[{ text: "Деталі", callback_data: `d:${reference}` }]] },
          }, config.botToken);
          if (result.status === "unknown") {
            await connection.rollback();
            counts.uncertain++;
            log({ ...key, stage: "transport", ...result.context });
            continue;
          }
          await recordNotificationResult(connection, key, result.status === "sent" ? result.messageId : undefined);
          await connection.commit();
          if (result.status === "sent") counts.sent++;
          else { counts.rejected++; log({ ...key, stage: "transport", ...result.context }); }
        } catch (error) {
          await connection.rollback().catch(() => undefined);
          counts.failed++;
          log({ ...key, stage: "processing", error });
        }
      }
    }
    return counts;
  } catch (error) {
    log({ stage: "selection", error });
    throw error;
  } finally { connection.release(); }
}
