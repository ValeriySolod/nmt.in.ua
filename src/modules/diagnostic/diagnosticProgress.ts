import {
  TASK_STATUS_CORRECT,
  TASK_STATUS_UNANSWERED,
} from "@/modules/testing/types";
import {
  MIN_DIAGNOSTIC_DIFFICULTY,
  nextDiagnosticDifficulty,
  normalizeDifficulty,
} from "./adaptiveDifficulty";

/** Hard cap on how many tasks one diagnostic attempt ever links. */
export const DIAGNOSTIC_TOTAL_QUESTIONS = 10;

/** End early after this many consecutive wrong answers at difficulty 1. */
export const DIAGNOSTIC_FAIL_STREAK_AT_LEVEL_1 = 3;

/** One `tasks2session` row of a diagnostic session, in mapping order. */
export type DiagnosticProgressMapping = {
  taskId: number;
  themeId: number;
  difficulty: number;
  status: number;
};

export type DiagnosticNextStep =
  | { kind: "answer" }
  | {
      kind: "nextTask";
      targetDifficulty: number;
      /** After a successful climb, stay here if the bank has no higher task. */
      fallbackDifficulty: number | null;
      excludeThemeId: number | null;
    }
  | { kind: "complete" };

export type ResolveDiagnosticNextStepInput = {
  mappings: readonly DiagnosticProgressMapping[];
};

/** Consecutive incorrect answers whose task difficulty was 1 (trailing). */
export function consecutiveWrongAtDifficulty1(
  mappings: readonly DiagnosticProgressMapping[],
): number {
  let streak = 0;
  for (const mapping of mappings) {
    if (mapping.status === TASK_STATUS_UNANSWERED) continue;
    const level = normalizeDifficulty(mapping.difficulty);
    if (mapping.status === TASK_STATUS_CORRECT) {
      streak = 0;
      continue;
    }
    if (level === MIN_DIAGNOSTIC_DIFFICULTY) {
      streak += 1;
    } else {
      streak = 0;
    }
  }
  return streak;
}

/**
 * Pure next-step rules for the adaptive intro test:
 * - unanswered linked task → answer it;
 * - 10 answered, or 3 consecutive wrongs at difficulty 1 → complete;
 * - else next task: start at 1; correct → +1 (fallback stay); wrong → −1;
 *   always a different theme than the previous question.
 */
export function resolveDiagnosticNextStep({
  mappings,
}: ResolveDiagnosticNextStepInput): DiagnosticNextStep {
  if (mappings.some((mapping) => mapping.status === TASK_STATUS_UNANSWERED)) {
    return { kind: "answer" };
  }
  if (mappings.length >= DIAGNOSTIC_TOTAL_QUESTIONS) {
    return { kind: "complete" };
  }
  if (
    consecutiveWrongAtDifficulty1(mappings) >= DIAGNOSTIC_FAIL_STREAK_AT_LEVEL_1
  ) {
    return { kind: "complete" };
  }

  const last = mappings.at(-1);
  if (!last) {
    return {
      kind: "nextTask",
      targetDifficulty: MIN_DIAGNOSTIC_DIFFICULTY,
      fallbackDifficulty: null,
      excludeThemeId: null,
    };
  }

  const correct = last.status === TASK_STATUS_CORRECT;
  const current = normalizeDifficulty(last.difficulty);
  const target = nextDiagnosticDifficulty(current, correct);

  return {
    kind: "nextTask",
    targetDifficulty: target,
    fallbackDifficulty: correct && target > current ? current : null,
    excludeThemeId: last.themeId,
  };
}
