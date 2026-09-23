import assert from "node:assert/strict";
import test from "node:test";
import {
  nextDiagnosticDifficulty,
  normalizeDifficulty,
  selectDiagnosticTask,
  type DifficultyCandidate,
} from "./adaptiveDifficulty";

const BANK: DifficultyCandidate[] = [
  { id: 1, themeId: 10, difficulty: 1 },
  { id: 2, themeId: 10, difficulty: 2 },
  { id: 3, themeId: 20, difficulty: 1 },
  { id: 4, themeId: 20, difficulty: 2 },
  { id: 5, themeId: 20, difficulty: 3 },
  { id: 6, themeId: 30, difficulty: 4 },
];

test("normalizeDifficulty floors at 1 and never caps upward", () => {
  assert.equal(normalizeDifficulty(0), 1);
  assert.equal(normalizeDifficulty(-3), 1);
  assert.equal(normalizeDifficulty(4.6), 5);
  assert.equal(normalizeDifficulty(99), 99);
});

test("nextDiagnosticDifficulty climbs and drops without an upper bound", () => {
  assert.equal(nextDiagnosticDifficulty(1, true), 2);
  assert.equal(nextDiagnosticDifficulty(3, true), 4);
  assert.equal(nextDiagnosticDifficulty(2, false), 1);
  assert.equal(nextDiagnosticDifficulty(1, false), 1);
});

test("selectDiagnosticTask prefers exact difficulty on another theme", () => {
  const pick = (ids: readonly number[]) => ids[0] ?? null;
  assert.equal(
    selectDiagnosticTask(
      BANK,
      [],
      { targetDifficulty: 2, excludeThemeId: 10 },
      pick,
    ),
    4,
  );
});

test("selectDiagnosticTask falls back when climbing has no higher bank level", () => {
  const pick = (ids: readonly number[]) => ids[0] ?? null;
  assert.equal(
    selectDiagnosticTask(
      BANK,
      [6],
      {
        targetDifficulty: 5,
        fallbackDifficulty: 4,
        excludeThemeId: 10,
      },
      pick,
    ),
    null,
  );
  assert.equal(
    selectDiagnosticTask(
      [{ id: 7, themeId: 30, difficulty: 4 }],
      [],
      {
        targetDifficulty: 5,
        fallbackDifficulty: 4,
        excludeThemeId: 20,
      },
      pick,
    ),
    7,
  );
});

test("selectDiagnosticTask never reuses a theme when alternatives exist", () => {
  const pick = (ids: readonly number[]) => ids[0] ?? null;
  assert.equal(
    selectDiagnosticTask(
      BANK,
      [],
      { targetDifficulty: 1, excludeThemeId: 10 },
      pick,
    ),
    3,
  );
});

test("selectDiagnosticTask returns null when only the excluded theme remains", () => {
  assert.equal(
    selectDiagnosticTask(
      [
        { id: 1, themeId: 10, difficulty: 1 },
        { id: 2, themeId: 10, difficulty: 2 },
      ],
      [],
      { targetDifficulty: 1, excludeThemeId: 10 },
    ),
    null,
  );
});
