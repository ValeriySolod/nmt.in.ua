import { pickRandomId } from "@/lib/sampleRandomIds";
import {
  MAX_TASK_DIFFICULTY,
  MIN_TASK_DIFFICULTY,
} from "@/modules/testing/practiceAdaptive";
import { SELF_SCORE_MAX, SELF_SCORE_MIN } from "@/modules/self-score/types";

/**
 * Adaptive difficulty for the diagnostic test. Pure rules only — the
 * DB-backed selection lives in `advanceDiagnosticSession.ts` and
 * `startDiagnosticTopic.ts`. Reuses the verified `quiz_tasks.difficulty`
 * bounds (1-3) from `practiceAdaptive.ts` instead of inventing new levels.
 */

export type DifficultyCandidate = { id: number; difficulty: number };

/** Clamps any value into the verified difficulty range. A legacy row with a
 * missing/out-of-range difficulty is treated as the nearest valid level
 * rather than being excluded, so it never shrinks the candidate pool. */
export function clampDifficulty(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return MIN_TASK_DIFFICULTY;
  }
  return Math.min(
    MAX_TASK_DIFFICULTY,
    Math.max(MIN_TASK_DIFFICULTY, Math.round(value)),
  );
}

/**
 * Starting difficulty for a topic from the student's 1-10 self-score for it:
 * the self-score scale is split into equal bands, one per difficulty level
 * (with levels 1-3: 1-4 → 1, 5-7 → 2, 8-10 → 3).
 */
export function initialDifficultyForSelfScore(selfScore: number): number {
  const levels = MAX_TASK_DIFFICULTY - MIN_TASK_DIFFICULTY + 1;
  const span = SELF_SCORE_MAX - SELF_SCORE_MIN + 1;
  const clampedScore = Math.min(
    SELF_SCORE_MAX,
    Math.max(SELF_SCORE_MIN, Math.round(selfScore)),
  );
  const band = Math.floor(((clampedScore - SELF_SCORE_MIN) * levels) / span);
  return clampDifficulty(MIN_TASK_DIFFICULTY + band);
}

/** One level harder after a correct answer, one level easier after an
 * incorrect one — never outside the verified bounds. */
export function nextDiagnosticDifficulty(
  currentDifficulty: number,
  correct: boolean,
): number {
  return clampDifficulty(clampDifficulty(currentDifficulty) + (correct ? 1 : -1));
}

/**
 * Picks an unused task as close as possible to `targetDifficulty`. Exact
 * matches win; otherwise the nearest available level is used, and a tie
 * (e.g. target 2 with only 1 and 3 left) is broken toward `direction` — up
 * after a correct answer, down after an incorrect one or on a topic's first
 * pick. Never returns a task id from `usedTaskIds`; returns `null` only when
 * every candidate is already used.
 */
export function selectAdaptiveTask(
  candidates: readonly DifficultyCandidate[],
  usedTaskIds: Iterable<number>,
  targetDifficulty: number,
  direction: "up" | "down" = "down",
  pick: (ids: readonly number[]) => number | null = pickRandomId,
): number | null {
  const used = new Set(usedTaskIds);
  const pool = candidates.filter((candidate) => !used.has(candidate.id));
  if (pool.length === 0) return null;

  const target = clampDifficulty(targetDifficulty);
  let bestDistance = Infinity;
  let bestLevel = target;
  for (const candidate of pool) {
    const level = clampDifficulty(candidate.difficulty);
    const distance = Math.abs(level - target);
    const breaksTie =
      distance === bestDistance &&
      (direction === "up" ? level > bestLevel : level < bestLevel);
    if (distance < bestDistance || breaksTie) {
      bestDistance = distance;
      bestLevel = level;
    }
  }

  return pick(
    pool
      .filter((candidate) => clampDifficulty(candidate.difficulty) === bestLevel)
      .map((candidate) => candidate.id),
  );
}
