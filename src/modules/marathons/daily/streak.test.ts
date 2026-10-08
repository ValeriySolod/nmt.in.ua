import assert from "node:assert/strict";
import test from "node:test";
import { buildStreakDays, computeStreak, streakAfterSubmission } from "./streak";

const base = {
  startDate: "2026-01-10",
  unlockHour: "09:00",
  daysCount: 5,
};

function atDay(dayNumber: number, hoursAfterUnlock = 1): number {
  const unlock = Date.parse("2026-01-10T07:00:00.000Z") + (dayNumber - 1) * 86_400_000;
  return unlock + hoursAfterUnlock * 3_600_000;
}

test("on-time passes extend the streak; a fail resets it", () => {
  const now = atDay(3, 2);
  const days = buildStreakDays({
    ...base,
    progress: [
      { dayNumber: 1, passed: true, completedAt: atDay(1, 2) },
      { dayNumber: 2, passed: false, completedAt: atDay(2, 2) },
    ],
  });
  assert.equal(computeStreak(days, now), 0);
  assert.equal(
    streakAfterSubmission({
      ...base,
      progress: [
        { dayNumber: 1, passed: true, completedAt: atDay(1, 2) },
        { dayNumber: 2, passed: false, completedAt: atDay(2, 2) },
      ],
      dayNumber: 3,
      passed: true,
      completedAt: atDay(3, 2),
      now,
    }),
    1,
  );
});

test("a missed day completed after the next unlock resets the streak", () => {
  const late = atDay(2, 2);
  const now = late;
  assert.equal(
    streakAfterSubmission({
      ...base,
      progress: [{ dayNumber: 1, passed: true, completedAt: atDay(1, 2) }],
      dayNumber: 1,
      passed: true,
      completedAt: late,
      now,
    }),
    0,
  );
});

test("an on-time pass after a late catch-up starts a new streak of 1", () => {
  const now = atDay(3, 2);
  assert.equal(
    streakAfterSubmission({
      ...base,
      progress: [
        { dayNumber: 1, passed: true, completedAt: atDay(1, 2) },
        { dayNumber: 2, passed: true, completedAt: atDay(3, 1) },
      ],
      dayNumber: 3,
      passed: true,
      completedAt: atDay(3, 2),
      now,
    }),
    1,
  );
});

test("two on-time passes in a row make a streak of 2", () => {
  const now = atDay(2, 3);
  assert.equal(
    streakAfterSubmission({
      ...base,
      progress: [{ dayNumber: 1, passed: true, completedAt: atDay(1, 1) }],
      dayNumber: 2,
      passed: true,
      completedAt: atDay(2, 1),
      now,
    }),
    2,
  );
});

test("the current open day does not reset the streak before its window ends", () => {
  const now = atDay(2, 2);
  const days = buildStreakDays({
    ...base,
    progress: [{ dayNumber: 1, passed: true, completedAt: atDay(1, 1) }],
  });
  assert.equal(computeStreak(days, now), 1);
});
