import "server-only";
import type { SqlConnection } from "@/lib/db/mysql";

export const TELEGRAM_NEW_TASK_NOTIFICATION = "new_task";
export type NotificationKey = { accountId: number; sessionId: number };

export async function claimNotification(connection: SqlConnection, key: NotificationKey): Promise<boolean> {
  try {
    await connection.beginTransaction();
    await connection.execute(`INSERT INTO telegram_task_notifications (account_id, session_id, notification_type)
      VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE account_id = account_id`, [key.accountId, key.sessionId, TELEGRAM_NEW_TASK_NOTIFICATION]);
    const rows = await connection.query<{ delivery_state: string }>(`SELECT delivery_state FROM telegram_task_notifications
      WHERE account_id = ? AND session_id = ? AND notification_type = ? FOR UPDATE`, [key.accountId, key.sessionId, TELEGRAM_NEW_TASK_NOTIFICATION]);
    if (rows[0]?.delivery_state !== "ready") {
      await connection.rollback();
      return false;
    }
    await connection.execute(`UPDATE telegram_task_notifications SET delivery_state = 'sending', attempted_at = CURRENT_TIMESTAMP
      WHERE account_id = ? AND session_id = ? AND notification_type = ?`, [key.accountId, key.sessionId, TELEGRAM_NEW_TASK_NOTIFICATION]);
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback().catch(() => undefined);
    throw error;
  }
}

export async function recordNotificationResult(connection: SqlConnection, key: NotificationKey, messageId?: number): Promise<void> {
  const result = await connection.execute(`UPDATE telegram_task_notifications
    SET delivery_state = ?, delivered_at = ${messageId === undefined ? "NULL" : "CURRENT_TIMESTAMP"}, telegram_message_id = ?
    WHERE account_id = ? AND session_id = ? AND notification_type = ? AND delivery_state = 'sending'`,
  [messageId === undefined ? "ready" : "delivered", messageId ?? null, key.accountId, key.sessionId, TELEGRAM_NEW_TASK_NOTIFICATION]);
  if (result.affectedRows !== 1) throw new Error("Telegram notification delivery state was not saved.");
}
