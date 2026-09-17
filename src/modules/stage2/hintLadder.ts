import type { SqlConnection } from "@/lib/db/mysql";
import { getRoundContext } from "./roundContext";
import type { Stage2Format } from "./stage2Attempt";

export type HintLevel = 1 | 2 | 3;

export type HintLadderContent = {
  direction: string | null;
  rule: string | null;
  example?: string | null;
  explanation: string | null;
};

export type ResolvedRung = { text: string | null; isFinal: boolean };

/** Authored analogous examples never reveal the current answer; legacy explanation fallback requires a consumed retry. */
export function resolveStage2Rung(
  content: HintLadderContent,
  level: HintLevel,
  retryConsumed: boolean,
): ResolvedRung {
  const direction = content.direction?.trim() || null;
  const rule = content.rule?.trim() || null;
  const example = content.example?.trim() || null;
  const explanation = content.explanation?.trim() || null;
  const explanationGate = (): ResolvedRung =>
    retryConsumed ? { text: explanation, isFinal: true } : { text: null, isFinal: false };

  if (direction == null) return explanationGate();
  if (level === 1) return { text: direction, isFinal: false };
  if (level === 2) return rule != null ? { text: rule, isFinal: false } : explanationGate();
  return example != null ? { text: example, isFinal: true } : explanationGate();
}

export type Stage2HintResult = {
  available: boolean;
  level: HintLevel | null;
  text: string | null;
  isFinal: boolean;
};

const SQL_SELECT_ATTEMPT_FOR_HINT = `
  SELECT id, status, retry_used, hint_level_unlocked
  FROM practice_stage2_attempts
  WHERE format = ? AND task_id = ? AND user_id = ? AND round_id = ?
  FOR UPDATE
`;
const SQL_UPDATE_HINT_LEVEL =
  "UPDATE practice_stage2_attempts SET hint_level_unlocked = ? WHERE id = ?";

type AttemptForHintRow = {
  id: number;
  status: number;
  retry_used: number;
  hint_level_unlocked: number;
};

export class Stage2HintError extends Error {
  constructor(
    message: string,
    public readonly code: "invalid_input" | "not_eligible",
  ) {
    super(message);
    this.name = "Stage2HintError";
  }
}

function isHintLevel(value: unknown): value is HintLevel {
  return value === 1 || value === 2 || value === 3;
}

/**
 * Shared DB-backed hint-ladder step for every Stage 2 format: takes the
 * task's own ladder content (already fetched by the caller from its own
 * table) plus the shared `practice_stage2_attempts` row, applies the same
 * sequential ratchet (`hint_level_unlocked`) and answer-leakage gate as
 * Stage 1. Only eligible once the row is wrong (status === -1) — no
 * attempt yet, or already correct, never gets a hint.
 */
export async function getStage2HintLevel(
  connection: SqlConnection,
  format: Stage2Format,
  taskId: number,
  userId: number,
  level: HintLevel,
  content: HintLadderContent,
): Promise<Stage2HintResult> {
  if (!isHintLevel(level)) {
    throw new Stage2HintError("level must be 1, 2 or 3.", "invalid_input");
  }
  const context = getRoundContext();
  if (context?.mode === "diagnostic" && !context.completed) {
    return { available: false, level: null, text: null, isFinal: false };
  }
  const rows = await connection.query<AttemptForHintRow>(SQL_SELECT_ATTEMPT_FOR_HINT, [
    format,
    taskId,
    userId,
    context?.roundId ?? 0,
  ]);
  const row = rows[0];
  const STATUS_INCORRECT = -1;
  if (!row || row.status !== STATUS_INCORRECT) {
    return { available: false, level: null, text: null, isFinal: false };
  }
  if (level > row.hint_level_unlocked + 1) {
    throw new Stage2HintError("Hint rungs must be requested in order.", "not_eligible");
  }

  const { text, isFinal } = resolveStage2Rung(content, level, row.retry_used === 1);
  if (text == null) {
    return { available: false, level: null, text: null, isFinal: false };
  }

  const nextUnlocked = Math.max(row.hint_level_unlocked, level);
  if (nextUnlocked !== row.hint_level_unlocked) {
    await connection.execute(SQL_UPDATE_HINT_LEVEL, [nextUnlocked, row.id]);
  }
  return { available: true, level, text, isFinal };
}
