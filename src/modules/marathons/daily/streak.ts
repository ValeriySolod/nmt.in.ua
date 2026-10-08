import { dayUnlockAt } from "./calendar";

export type StreakDay = {
  dayNumber: number;
  passed: boolean;
  /** Unix ms. Null when the day was not submitted. */
  completedAt: number | null;
  unlockAt: number;
  /** Unlock of the next calendar day, including a virtual day after the last. */
  nextUnlockAt: number;
};

export type ProgressMark = {
  dayNumber: number;
  passed: boolean;
  completedAt: number | null;
};

/**
 * Streak is the current run of on-time passes.
 * A missed day (still empty after the next unlock) or a late completion
 * resets the run. `pass_threshold` only feeds `passed`; it never locks a day.
 * `now` is the server clock.
 */
export function computeStreak(days: StreakDay[], now: number): number {
  const ordered = [...days].sort((a, b) => a.dayNumber - b.dayNumber);
  let streak = 0;
  for (const day of ordered) {
    if (day.completedAt == null) {
      if (now >= day.nextUnlockAt) {
        streak = 0;
        continue;
      }
      break;
    }
    const late = day.completedAt >= day.nextUnlockAt;
    if (!day.passed || late) {
      streak = 0;
      continue;
    }
    streak += 1;
  }
  return streak;
}

export function buildStreakDays(input: {
  startDate: string;
  unlockHour: string;
  daysCount: number;
  progress: ProgressMark[];
}): StreakDay[] {
  const byDay = new Map(input.progress.map((row) => [row.dayNumber, row]));
  const days: StreakDay[] = [];
  for (let dayNumber = 1; dayNumber <= input.daysCount; dayNumber += 1) {
    const unlockAt = dayUnlockAt({
      startDate: input.startDate,
      unlockHour: input.unlockHour,
      dayNumber,
    }).getTime();
    const nextUnlockAt = dayUnlockAt({
      startDate: input.startDate,
      unlockHour: input.unlockHour,
      dayNumber: dayNumber + 1,
    }).getTime();
    const row = byDay.get(dayNumber);
    days.push({
      dayNumber,
      passed: row?.passed ?? false,
      completedAt: row?.completedAt ?? null,
      unlockAt,
      nextUnlockAt,
    });
  }
  return days;
}

export function streakAfterSubmission(input: {
  startDate: string;
  unlockHour: string;
  daysCount: number;
  progress: ProgressMark[];
  dayNumber: number;
  passed: boolean;
  completedAt: number;
  now: number;
}): number {
  const progress = input.progress.filter((row) => row.dayNumber !== input.dayNumber);
  progress.push({
    dayNumber: input.dayNumber,
    passed: input.passed,
    completedAt: input.completedAt,
  });
  return computeStreak(
    buildStreakDays({ ...input, progress }),
    input.now,
  );
}
