import {
  TASK_STATUS_CORRECT,
  TASK_STATUS_UNANSWERED,
} from "@/modules/testing/types";
import { initialDifficultyForSelfScore, nextDiagnosticDifficulty } from "./adaptiveDifficulty";
import type { DiagnosticSelfScore } from "./diagnosticSelfScores";

/** Hard cap on how many tasks one diagnostic attempt ever links (and so how
 * many the student ever answers). */
export const DIAGNOSTIC_TOTAL_QUESTIONS = 10;

/** One `tasks2session` row of a diagnostic session, in mapping (insertion)
 * order, joined to the theme/difficulty of its `quiz_tasks` row. */
export type DiagnosticProgressMapping = {
  taskId: number;
  themeId: number;
  difficulty: number;
  status: number;
};

export type DiagnosticNextStep =
  /** A linked task is still unanswered — nothing new may be added. */
  | { kind: "answer" }
  /** Link one more task from the current topic at this difficulty. */
  | {
      kind: "nextTask";
      themeId: number;
      targetDifficulty: number;
      direction: "up" | "down";
    }
  /** The current topic is done; ask for the next topic's self-score. */
  | { kind: "topicIntro"; themeId: number; topicNumber: number; topicCount: number }
  /** Nothing more to ask — the attempt can be finished. */
  | { kind: "complete" };

export type ResolveDiagnosticNextStepInput = {
  mappings: readonly DiagnosticProgressMapping[];
  /** The five eligible themes selected for this session. */
  plannedThemeIds: readonly number[];
  selfScores?: readonly DiagnosticSelfScore[];
  /** Themes whose task bank ran out of unused tasks mid-topic. */
  exhaustedThemeIds?: ReadonlySet<number>;
};

/** Distinct theme ids in the order the session first used them. */
export function usedThemeIdsInOrder(
  mappings: readonly DiagnosticProgressMapping[],
): number[] {
  const seen: number[] = [];
  for (const mapping of mappings) {
    if (!seen.includes(mapping.themeId)) seen.push(mapping.themeId);
  }
  return seen;
}

/** Questions reserved for a topic: the questions still available, spread as
 * evenly as possible over the topics still to go (earlier topics take the
 * remainder). Recomputed per topic, so a topic that ends early because its
 * bank ran out hands its unused share to the topics after it. */
export function topicQuestionQuota(
  remainingQuestions: number,
  remainingTopics: number,
): number {
  if (remainingQuestions <= 0) return 0;
  return Math.ceil(remainingQuestions / Math.max(1, remainingTopics));
}

/**
 * Decides what the diagnostic attempt needs next, purely from the tasks it
 * has already linked. Nothing about the plan is stored separately: topics
 * are always the planned themes in order, the current topic is the theme of
 * the last linked task, and the next difficulty is derived from that task's
 * own difficulty and whether it was answered correctly.
 */
export function resolveDiagnosticNextStep({
  mappings,
  plannedThemeIds,
  selfScores = [],
  exhaustedThemeIds = new Set<number>(),
}: ResolveDiagnosticNextStepInput): DiagnosticNextStep {
  if (mappings.length === 0 && selfScores.length < plannedThemeIds.length) {
    const nextThemeId = plannedThemeIds[selfScores.length];
    if (nextThemeId !== undefined) {
      return {
        kind: "topicIntro",
        themeId: nextThemeId,
        topicNumber: selfScores.length + 1,
        topicCount: plannedThemeIds.length,
      };
    }
  }
  if (mappings.some((mapping) => mapping.status === TASK_STATUS_UNANSWERED)) {
    return { kind: "answer" };
  }
  if (mappings.length >= DIAGNOSTIC_TOTAL_QUESTIONS) {
    return { kind: "complete" };
  }

  const usedThemes = usedThemeIdsInOrder(mappings);
  const topicCount = Math.max(usedThemes.length, plannedThemeIds.length);
  const last = mappings.at(-1);

  if (last) {
    const topicIndex = usedThemes.indexOf(last.themeId);
    const askedBefore = mappings.filter(
      (mapping) => usedThemes.indexOf(mapping.themeId) < topicIndex,
    ).length;
    const askedInTopic = mappings.filter(
      (mapping) => mapping.themeId === last.themeId,
    ).length;
    const quota = topicQuestionQuota(
      DIAGNOSTIC_TOTAL_QUESTIONS - askedBefore,
      topicCount - topicIndex,
    );

    if (askedInTopic < quota && !exhaustedThemeIds.has(last.themeId)) {
      const correct = last.status === TASK_STATUS_CORRECT;
      return {
        kind: "nextTask",
        themeId: last.themeId,
        targetDifficulty: nextDiagnosticDifficulty(last.difficulty, correct),
        direction: correct ? "up" : "down",
      };
    }
  }

  if (usedThemes.length < topicCount) {
    const nextThemeId = plannedThemeIds.find(
      (themeId) =>
        !usedThemes.includes(themeId) && !exhaustedThemeIds.has(themeId),
    );
    if (nextThemeId !== undefined) {
      const selfScore = selfScores.find((item) => item.themeId === nextThemeId);
      if (selfScore !== undefined && selfScores.length === plannedThemeIds.length) {
        return {
          kind: "nextTask",
          themeId: nextThemeId,
          targetDifficulty: initialDifficultyForSelfScore(selfScore.score),
          direction: "down",
        };
      }
      return {
        kind: "topicIntro",
        themeId: nextThemeId,
        topicNumber: usedThemes.length + 1,
        topicCount,
      };
    }
  }

  return { kind: "complete" };
}
