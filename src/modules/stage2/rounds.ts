import type { SqlConnection } from "@/lib/db/mysql";
import type { Stage2Format } from "./stage2Attempt";

export type RoundMode = "practice" | "diagnostic";
export type RoundDeps = { getConnection: () => Promise<SqlConnection>; nowSec?: () => number };
export type RoundTask = {
  position: number;
  format: Stage2Format;
  taskId: number;
  answered: boolean;
  skipped: boolean;
  firstCorrect: boolean | null;
};
export type RoundSnapshot = {
  id: number;
  mode: RoundMode;
  completed: boolean;
  sourceRoundId: number | null;
  tasks: RoundTask[];
  firstCorrectCount: number | null;
};
export class RoundError extends Error {
  constructor(message: string, public readonly code: "invalid_input" | "not_found" | "not_eligible") {
    super(message);
    this.name = "RoundError";
  }
}

type RoundRow = { id: number; mode: RoundMode; source_round_id: number | null; completed_at: number | null };
type TaskRow = { position: number; format: Stage2Format; task_id: number; skipped: number; first_attempt_status: number | null };
const FORMATS: readonly Stage2Format[] = ["order", "find_error", "graph", "matching", "blank"];
const SQL_ROUND = "SELECT id, mode, source_round_id, completed_at FROM practice_interactive_rounds WHERE id = ? AND user_id = ?";
const SQL_TASKS = `
  SELECT rt.position, rt.format, rt.task_id, rt.skipped, a.first_attempt_status
  FROM practice_interactive_round_tasks rt
  LEFT JOIN practice_stage2_attempts a
    ON a.round_id = rt.round_id AND a.format = rt.format AND a.task_id = rt.task_id AND a.user_id = ?
  WHERE rt.round_id = ? ORDER BY rt.position
`;
const SQL_CATALOG = `
  SELECT 'order' AS format, id AS task_id FROM order_tasks WHERE id BETWEEN 1 AND 4
  UNION ALL SELECT 'find_error', id FROM find_error_tasks WHERE id BETWEEN 1 AND 4
  UNION ALL SELECT 'graph', id FROM graph_tasks WHERE id BETWEEN 1 AND 4
  UNION ALL SELECT 'matching', id FROM matching_tasks WHERE id BETWEEN 1 AND 4
  UNION ALL SELECT 'blank', id FROM blank_tasks WHERE id BETWEEN 1 AND 4
`;
async function defaultConnection(): Promise<SqlConnection> {
  const { getConnection } = await import("@/lib/db/mysql");
  return getConnection();
}
const DEFAULT_DEPS: RoundDeps = { getConnection: defaultConnection };
function positive(value: number): boolean { return Number.isSafeInteger(value) && value > 0; }
function validate(userId: number, roundId?: number): void {
  if (!positive(userId) || (roundId !== undefined && !positive(roundId))) {
    throw new RoundError("Invalid identifier.", "invalid_input");
  }
}
async function readRound(connection: SqlConnection, userId: number, roundId: number, lock = false): Promise<RoundRow> {
  const [row] = await connection.query<RoundRow>(SQL_ROUND + (lock ? " FOR UPDATE" : ""), [roundId, userId]);
  if (!row) throw new RoundError("Round not found.", "not_found");
  return row;
}
async function readTasks(connection: SqlConnection, userId: number, roundId: number): Promise<TaskRow[]> {
  return connection.query<TaskRow>(SQL_TASKS, [userId, roundId]);
}
export function toRoundSnapshot(row: RoundRow, tasks: TaskRow[]): RoundSnapshot {
  const completed = row.completed_at !== null;
  const visible = row.mode === "practice" || completed;
  return {
    id: row.id, mode: row.mode, completed, sourceRoundId: row.source_round_id,
    tasks: tasks.map((task) => ({
      position: task.position, format: task.format, taskId: task.task_id,
      answered: task.first_attempt_status !== null,
      skipped: task.skipped === 1 && task.first_attempt_status === null,
      firstCorrect: visible && task.first_attempt_status !== null ? task.first_attempt_status === 1 : null,
    })),
    firstCorrectCount: visible ? tasks.filter((task) => task.first_attempt_status === 1).length : null,
  };
}
export async function getRound(userId: number, roundId: number, deps: RoundDeps = DEFAULT_DEPS): Promise<RoundSnapshot> {
  validate(userId, roundId);
  const connection = await deps.getConnection();
  try {
    const round = await readRound(connection, userId, roundId);
    return toRoundSnapshot(round, await readTasks(connection, userId, roundId));
  } finally { connection.release(); }
}
async function mutate<T>(userId: number, deps: RoundDeps, work: (connection: SqlConnection) => Promise<T>): Promise<T> {
  const connection = await deps.getConnection();
  try {
    await connection.beginTransaction();
    const [user] = await connection.query<{ id: number }>("SELECT id FROM app_users WHERE id = ? FOR UPDATE", [userId]);
    if (!user) throw new RoundError("User not found.", "not_found");
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback().catch(() => undefined);
    throw error;
  } finally { connection.release(); }
}
async function insertRound(connection: SqlConnection, userId: number, mode: RoundMode, source: number | null, entries: { format: Stage2Format; task_id: number }[], now: number): Promise<number> {
  if (entries.length === 0) throw new RoundError("No tasks available.", "not_eligible");
  const inserted = await connection.execute("INSERT INTO practice_interactive_rounds (user_id, mode, source_round_id, created_at) VALUES (?, ?, ?, ?)", [userId, mode, source, now]);
  for (const [position, task] of entries.entries()) {
    await connection.execute("INSERT INTO practice_interactive_round_tasks (round_id, position, format, task_id) VALUES (?, ?, ?, ?)", [inserted.insertId, position + 1, task.format, task.task_id]);
  }
  return inserted.insertId;
}
export async function startRound(userId: number, mode: RoundMode, deps: RoundDeps = DEFAULT_DEPS): Promise<RoundSnapshot> {
  validate(userId);
  if (mode !== "practice" && mode !== "diagnostic") throw new RoundError("Invalid mode.", "invalid_input");
  const roundId = await mutate(userId, deps, async (connection) => {
    const [active] = await connection.query<{ id: number }>("SELECT id FROM practice_interactive_rounds WHERE user_id = ? AND mode = ? AND source_round_id IS NULL AND completed_at IS NULL ORDER BY id DESC LIMIT 1", [userId, mode]);
    if (active) return active.id;
    const entries = await connection.query<{ format: Stage2Format; task_id: number }>(SQL_CATALOG);
    entries.sort((a, b) => a.task_id - b.task_id || FORMATS.indexOf(a.format) - FORMATS.indexOf(b.format));
    return insertRound(connection, userId, mode, null, entries, (deps.nowSec ?? (() => Math.floor(Date.now() / 1000)))());
  });
  return getRound(userId, roundId, deps);
}
export async function skipRoundTask(userId: number, roundId: number, format: Stage2Format, taskId: number, deps: RoundDeps = DEFAULT_DEPS): Promise<RoundSnapshot> {
  validate(userId, roundId);
  if (!FORMATS.includes(format) || !positive(taskId)) throw new RoundError("Invalid task.", "invalid_input");
  await mutate(userId, deps, async (connection) => {
    const round = await readRound(connection, userId, roundId, true);
    if (round.completed_at !== null) throw new RoundError("Round is complete.", "not_eligible");
    const task = (await readTasks(connection, userId, roundId)).find((entry) => entry.format === format && entry.task_id === taskId);
    if (!task) throw new RoundError("Task not found.", "not_found");
    if (task.first_attempt_status === null) {
      await connection.execute("UPDATE practice_interactive_round_tasks SET skipped = 1 WHERE round_id = ? AND format = ? AND task_id = ?", [roundId, format, taskId]);
    }
  });
  return getRound(userId, roundId, deps);
}
export async function finishRound(userId: number, roundId: number, deps: RoundDeps = DEFAULT_DEPS): Promise<RoundSnapshot> {
  validate(userId, roundId);
  await mutate(userId, deps, async (connection) => {
    const round = await readRound(connection, userId, roundId, true);
    if (round.completed_at !== null) return;
    await connection.execute(`UPDATE practice_interactive_round_tasks rt
      LEFT JOIN practice_stage2_attempts a ON a.round_id = rt.round_id AND a.format = rt.format AND a.task_id = rt.task_id AND a.user_id = ?
      SET rt.skipped = 1 WHERE rt.round_id = ? AND a.first_attempt_status IS NULL`, [userId, roundId]);
    await connection.execute("UPDATE practice_interactive_rounds SET completed_at = ? WHERE id = ? AND user_id = ?", [(deps.nowSec ?? (() => Math.floor(Date.now() / 1000)))(), roundId, userId]);
  });
  return getRound(userId, roundId, deps);
}
export async function startMistakeRound(userId: number, sourceRoundId: number, deps: RoundDeps = DEFAULT_DEPS): Promise<RoundSnapshot> {
  validate(userId, sourceRoundId);
  const roundId = await mutate(userId, deps, async (connection) => {
    const source = await readRound(connection, userId, sourceRoundId, true);
    if (source.completed_at === null) throw new RoundError("Complete the source round first.", "not_eligible");
    const [active] = await connection.query<{ id: number }>("SELECT id FROM practice_interactive_rounds WHERE user_id = ? AND source_round_id = ? AND completed_at IS NULL ORDER BY id DESC LIMIT 1", [userId, sourceRoundId]);
    if (active) return active.id;
    const errors = (await readTasks(connection, userId, sourceRoundId)).filter((task) => task.first_attempt_status !== 1);
    return insertRound(connection, userId, "practice", sourceRoundId, errors, (deps.nowSec ?? (() => Math.floor(Date.now() / 1000)))());
  });
  return getRound(userId, roundId, deps);
}

export type RoundSummary = Pick<RoundSnapshot, "id" | "mode" | "completed" | "sourceRoundId">;
export async function listRounds(userId: number, deps: RoundDeps = DEFAULT_DEPS): Promise<RoundSummary[]> {
  validate(userId);
  const connection = await deps.getConnection();
  try {
    const rows = await connection.query<RoundRow>("SELECT id, mode, source_round_id, completed_at FROM practice_interactive_rounds WHERE user_id = ? ORDER BY id DESC LIMIT 20", [userId]);
    return rows.map((row) => ({ id: row.id, mode: row.mode, completed: row.completed_at !== null, sourceRoundId: row.source_round_id }));
  } finally { connection.release(); }
}
