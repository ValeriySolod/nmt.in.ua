/**
 * Spaced topic repetition for Practice mode ("Повторення теми через кілька
 * завдань" — re-surface a task from a theme a few tasks after it produced a
 * mistake). Pure rules only, same style as `practiceAdaptive.ts` — the
 * DB-backed candidate pick lives in `addSpacedRepetitionTask.ts`.
 */

/** How many *other* answered tasks must pass after a mistake in a theme
 * before that theme becomes due for one repetition task. */
export const REPETITION_INTERVAL = 4;

export type AnsweredTopicTask = {
  themeId: number;
  /** The scored (first-attempt) outcome for this task — see
   * `checkAnswer.ts`'s `first_attempt_status`. Only a wrong first attempt
   * schedules a repetition; a task fixed via the in-task retry does not
   * (that's what the retry is for). */
  correct: boolean;
  /** `true` for a row appended by `addSimilarPracticeTask` or by this same
   * repetition mechanism — repeating one of those doesn't reset or satisfy
   * another theme's due repetition, and answering one *does* count as the
   * "next task" for every other theme's interval. */
  isFollowUp?: boolean;
};

/**
 * Scans the session's answered-task history (in order) and returns the
 * theme id that is due for a repetition task right now (i.e. right after
 * the task at the end of `history` was answered), or `null` if none is due
 * yet. Only ever looks at the theme of the task most recently answered
 * relative to each mistake — a theme already repeated since its last
 * mistake is not due again until it mistakes again.
 */
export function findThemeDueForRepetition(
  history: readonly AnsweredTopicTask[],
  intervalN: number = REPETITION_INTERVAL,
): number | null {
  if (history.length === 0) return null;

  /** Index of the most recent mistake for a theme that hasn't been
   * repeated since, or `undefined` if none / already repeated. */
  const pendingMistakeIndex = new Map<number, number>();

  history.forEach((task, index) => {
    if (task.isFollowUp) {
      // A repetition (or similar-task) round for this theme resolves —
      // right or wrong — as "we've now revisited it".
      pendingMistakeIndex.delete(task.themeId);
      return;
    }
    if (!task.correct) {
      pendingMistakeIndex.set(task.themeId, index);
    }
  });

  const lastIndex = history.length - 1;
  let dueThemeId: number | null = null;
  let earliestMistakeIndex = Infinity;

  for (const [themeId, mistakeIndex] of pendingMistakeIndex) {
    const tasksSince = lastIndex - mistakeIndex;
    if (tasksSince >= intervalN && mistakeIndex < earliestMistakeIndex) {
      // Prefer the theme whose mistake happened earliest — the one that's
      // been waiting longest.
      dueThemeId = themeId;
      earliestMistakeIndex = mistakeIndex;
    }
  }

  return dueThemeId;
}
