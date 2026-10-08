import "server-only";
import type { SqlConnection } from "@/lib/db/mysql";
import { finishTrainerSession, FinishTrainerSessionError } from "@/modules/testing/finishTrainerSession";
import { finishDiagnosticSession, FinishDiagnosticSessionError } from "@/modules/diagnostic/finishDiagnosticSession";
import { nowUnixSec } from "@/modules/testing/sessionElapsed";
import { loadTelegramConnection } from "./schema";
import { resolveTaskReference } from "./taskReference";
import { sessionCompletionFollowUp } from "@/modules/testing/sessionCompletionFollowUp";

type Result = { status: "success" } | { status: "error"; code: "notLinked" | "cannotComplete" | "databaseFailure" };
type Deps = { getConnection: () => Promise<SqlConnection>; nowSec?: () => number; secret?: string; logError?: (error: unknown) => void; followUp?: typeof sessionCompletionFollowUp };

export async function completeTelegramTask(identity: unknown, reference: unknown, deps: Deps = { getConnection: loadTelegramConnection }): Promise<Result> {
  if ((typeof identity !== "string" && typeof identity !== "number") || !/^[1-9][0-9]{0,15}$/.test(String(identity)) || !Number.isSafeInteger(Number(identity))) {
    return { status: "error", code: "notLinked" };
  }
  const id = resolveTaskReference(reference, String(identity), deps.secret ?? process.env.TELEGRAM_WEBHOOK_SECRET ?? "");
  if (!id) return { status: "error", code: "cannotComplete" };
  try {
    const connection = await deps.getConnection();
    let completed: { userId: number; diagnostic: boolean; summary: Awaited<ReturnType<typeof finishTrainerSession>> };
    try {
      await connection.beginTransaction();
      const users = await connection.query<{ user_id: number }>(`
        SELECT uta.user_id FROM user_telegram_accounts uta
        INNER JOIN app_users u ON u.id = uta.user_id AND u.is_banned = 0
        WHERE uta.telegram_user_id = ? FOR UPDATE`, [String(identity)]);
      if (!users[0]) {
        await connection.rollback();
        return { status: "error", code: "notLinked" };
      }
      const userId = users[0].user_id;
      const sessions = await connection.query<{ session_type: number }>(`
        SELECT ts.session_type FROM task_sessions ts
        WHERE ts.id = ? AND ts.user_id = ? AND ts.session_status IN (2, 3)
          AND ts.expire_time > ?
          AND NOT (ts.tasks_number > 0 AND ts.right_number >= ts.tasks_number AND ts.time > 0)
        FOR UPDATE`, [id, userId, (deps.nowSec ?? nowUnixSec)()]);
      const assignments = await connection.query<{ status: string; available_at: number | null; due_at: number | null }>(`
        SELECT ma.status, ma.available_at, ma.due_at FROM mentor_assignment_members mam
        INNER JOIN mentor_assignments ma ON ma.id = mam.assignment_id
        WHERE mam.session_id = ? AND mam.student_user_id = ? FOR UPDATE`, [id, userId]);
      const now = (deps.nowSec ?? nowUnixSec)();
      if (!sessions[0] || assignments.some((a) => a.status === "cancelled" || (a.available_at !== null && a.available_at > now) || (a.due_at !== null && a.due_at <= now))) {
        await connection.rollback();
        return { status: "error", code: "cannotComplete" };
      }
      const transaction: SqlConnection = {
        query: connection.query.bind(connection), execute: connection.execute.bind(connection),
        beginTransaction: async () => {}, commit: async () => {}, rollback: async () => {}, release: () => {},
      };
      const finishDeps = { getConnection: async () => transaction, nowSec: deps.nowSec };
      const diagnostic = sessions[0].session_type === 5;
      const summary = diagnostic
        ? await finishDiagnosticSession({ owner: { userId, guestToken: null }, sessionId: id }, finishDeps)
        : await finishTrainerSession({ userId, sessionId: id }, finishDeps);
      await connection.commit();
      completed = { userId, diagnostic, summary };
    } catch (error) {
      await connection.rollback().catch(() => undefined);
      throw error;
    } finally {
      connection.release();
    }
    if (!completed.diagnostic) {
      try {
        await (deps.followUp ?? sessionCompletionFollowUp)(completed.userId, completed.summary);
      } catch (error) {
        (deps.logError ?? ((value) => console.error("telegram completion follow-up failed", value)))(error);
      }
    }
    return { status: "success" };
  } catch (error) {
    if ((error instanceof FinishTrainerSessionError || error instanceof FinishDiagnosticSessionError) && error.code !== "db_error") {
      return { status: "error", code: "cannotComplete" };
    }
    (deps.logError ?? ((value) => console.error("telegram completion failed", value)))(error);
    return { status: "error", code: "databaseFailure" };
  }
}
