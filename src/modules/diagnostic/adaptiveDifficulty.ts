import { pickRandomId } from "@/lib/sampleRandomIds";

/**
 * Adaptive difficulty for the introductory diagnostic. Difficulty has no
 * upper ceiling in product rules — the bank decides what levels exist.
 * Pure helpers only; DB selection lives in `diagnosticFlowStore.ts`.
 */

export const MIN_DIAGNOSTIC_DIFFICULTY = 1;

export type DifficultyCandidate = {
  id: number;
  themeId: number;
  difficulty: number;
};

/** Treat missing / non-positive difficulty as level 1. Never invents an upper bound. */
export function normalizeDifficulty(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return MIN_DIAGNOSTIC_DIFFICULTY;
  }
  return Math.max(MIN_DIAGNOSTIC_DIFFICULTY, Math.round(value));
}

/** Correct → +1 level; incorrect → −1, never below 1. */
export function nextDiagnosticDifficulty(
  currentDifficulty: number,
  correct: boolean,
): number {
  const current = normalizeDifficulty(currentDifficulty);
  return correct ? current + 1 : Math.max(MIN_DIAGNOSTIC_DIFFICULTY, current - 1);
}

export type SelectDiagnosticTaskOptions = {
  targetDifficulty: number;
  /** After a climb, if the bank has no task at the higher level, retry here. */
  fallbackDifficulty?: number | null;
  excludeThemeId: number | null;
};

/**
 * Random unused task at `targetDifficulty` with theme ≠ `excludeThemeId`.
 * If none, tries `fallbackDifficulty` (stay after a successful climb).
 * If still none, nearest available level among other themes. Returns null
 * when no unused task with a different theme exists.
 */
export function selectDiagnosticTask(
  candidates: readonly DifficultyCandidate[],
  usedTaskIds: Iterable<number>,
  options: SelectDiagnosticTaskOptions,
  pick: (ids: readonly number[]) => number | null = pickRandomId,
): number | null {
  const used = new Set(usedTaskIds);
  const available = candidates.filter((candidate) => !used.has(candidate.id));
  if (available.length === 0) return null;

  const themed =
    options.excludeThemeId == null
      ? available
      : available.filter((candidate) => candidate.themeId !== options.excludeThemeId);
  if (themed.length === 0) return null;

  const atLevel = (level: number) =>
    themed.filter(
      (candidate) => normalizeDifficulty(candidate.difficulty) === level,
    );

  const target = normalizeDifficulty(options.targetDifficulty);
  let pool = atLevel(target);

  if (pool.length === 0 && options.fallbackDifficulty != null) {
    pool = atLevel(normalizeDifficulty(options.fallbackDifficulty));
    // Climb with nowhere to stay: do not invent a lower “nearest” level.
    if (pool.length === 0) return null;
  }

  if (pool.length === 0) {
    let bestDistance = Infinity;
    let bestLevel = target;
    for (const candidate of themed) {
      const level = normalizeDifficulty(candidate.difficulty);
      const distance = Math.abs(level - target);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestLevel = level;
      }
    }
    pool = atLevel(bestLevel);
  }

  return pick(pool.map((candidate) => candidate.id));
}

/** @deprecated Prefer `selectDiagnosticTask` — kept for a soft transition. */
export function selectAdaptiveTask(
  candidates: readonly DifficultyCandidate[],
  usedTaskIds: Iterable<number>,
  targetDifficulty: number,
  _direction: "up" | "down" = "down",
  pick: (ids: readonly number[]) => number | null = pickRandomId,
): number | null {
  return selectDiagnosticTask(
    candidates,
    usedTaskIds,
    { targetDifficulty, excludeThemeId: null },
    pick,
  );
}

/** @deprecated Diagnostic no longer clamps to 1–3; alias of normalizeDifficulty. */
export function clampDifficulty(value: unknown): number {
  return normalizeDifficulty(value);
}
