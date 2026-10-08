import "server-only";
import type { SqlConnection } from "@/lib/db/mysql";
import { loadTelegramConnection } from "./schema";
import { resolveTaskReference } from "./taskReference";
import { nowUnixSec } from "@/modules/testing/sessionElapsed";

export type TaskDetailState = "available" | "completed" | "expired" | "cancelled" | "waiting" | "unavailable";
export type TaskDetailsResult = { status: "success"; task: { title: string; state: TaskDetailState; expiresAt: number | null } }
  | { status: "error"; code: "notLinked" | "invalidReference" | "databaseFailure" };

export async function getTelegramTaskDetails(identity: unknown, reference: unknown, deps: {
  getConnection: () => Promise<SqlConnection>; secret?: string; nowSec?: () => number; logError?: (error: unknown) => void;
} = { getConnection: loadTelegramConnection }): Promise<TaskDetailsResult> {
  if ((typeof identity !== "string" && typeof identity !== "number") || !/^[1-9][0-9]{0,15}$/.test(String(identity)) || !Number.isSafeInteger(Number(identity))) return { status: "error", code: "notLinked" };
  const id = resolveTaskReference(reference, String(identity), deps.secret ?? process.env.TELEGRAM_WEBHOOK_SECRET ?? "");
  if (!id) return { status: "error", code: "invalidReference" };
  try {
    const connection = await deps.getConnection();
    try {
      const now = (deps.nowSec ?? nowUnixSec)();
      const rows = await connection.query<{
        id: number | null; title: string | null; session_status: number; expire_time: number | null;
        tasks_number: number; right_number: number; time: number; cancelled: number; waiting: number; overdue: number;
      }>(`
        SELECT ts.id, t.name AS title, ts.session_status, ts.expire_time, ts.tasks_number, ts.right_number, ts.time,
          EXISTS (SELECT 1 FROM mentor_assignment_members m INNER JOIN mentor_assignments a ON a.id = m.assignment_id
            WHERE m.session_id = ts.id AND m.student_user_id = uta.user_id AND a.status = 'cancelled') AS cancelled,
          EXISTS (SELECT 1 FROM mentor_assignment_members m INNER JOIN mentor_assignments a ON a.id = m.assignment_id
            WHERE m.session_id = ts.id AND m.student_user_id = uta.user_id AND a.available_at > ?) AS waiting,
          EXISTS (SELECT 1 FROM mentor_assignment_members m INNER JOIN mentor_assignments a ON a.id = m.assignment_id
            WHERE m.session_id = ts.id AND m.student_user_id = uta.user_id AND a.due_at <= ?) AS overdue
        FROM user_telegram_accounts uta INNER JOIN app_users u ON u.id = uta.user_id AND u.is_banned = 0
        LEFT JOIN task_sessions ts ON ts.id = ? AND ts.user_id = uta.user_id
        LEFT JOIN themes t ON t.id = ts.theme_id WHERE uta.telegram_user_id = ? LIMIT 1
      `, [now, now, id, String(identity)]);
      if (!rows[0]) return { status: "error", code: "notLinked" };
      const row = rows[0];
      if (row.id === null) return { status: "error", code: "invalidReference" };
      const state: TaskDetailState = row.session_status === 1 || (row.tasks_number > 0 && row.right_number >= row.tasks_number && row.time > 0)
        ? "completed" : row.cancelled ? "cancelled" : !row.expire_time || row.expire_time <= now || row.overdue
          ? "expired" : row.waiting ? "waiting" : [2, 3].includes(row.session_status) ? "available" : "unavailable";
      return { status: "success", task: { title: Array.from((row.title || "Навчальна сесія").replace(/\s+/g, " ")).slice(0, 120).join(""), state, expiresAt: row.expire_time } };
    } finally { connection.release(); }
  } catch (error) {
    (deps.logError ?? ((value) => console.error("telegram details failed", value)))(error);
    return { status: "error", code: "databaseFailure" };
  }
}
