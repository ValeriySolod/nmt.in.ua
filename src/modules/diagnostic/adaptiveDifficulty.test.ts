import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_TASK_DIFFICULTY,
  MIN_TASK_DIFFICULTY,
} from "@/modules/testing/practiceAdaptive";
import {
  clampDifficulty,
  initialDifficultyForSelfScore,
  nextDiagnosticDifficulty,
  selectAdaptiveTask,
} from "./adaptiveDifficulty";

const first = (ids: readonly number[]) => ids[0] ?? null;

test("reuses the existing 1-3 difficulty bounds", () => {
  assert.equal(MIN_TASK_DIFFICULTY, 1);
  assert.equal(MAX_TASK_DIFFICULTY, 3);
});

test("a correct answer moves difficulty one level up", () => {
  assert.equal(nextDiagnosticDifficulty(1, true), 2);
  assert.equal(nextDiagnosticDifficulty(2, true), 3);
});

test("an incorrect answer moves difficulty one level down", () => {
  assert.equal(nextDiagnosticDifficulty(3, false), 2);
  assert.equal(nextDiagnosticDifficulty(2, false), 1);
});

test("difficulty never leaves the existing bounds", () => {
  assert.equal(nextDiagnosticDifficulty(MAX_TASK_DIFFICULTY, true), MAX_TASK_DIFFICULTY);
  assert.equal(nextDiagnosticDifficulty(MIN_TASK_DIFFICULTY, false), MIN_TASK_DIFFICULTY);
  assert.equal(nextDiagnosticDifficulty(99, true), MAX_TASK_DIFFICULTY);
  assert.equal(nextDiagnosticDifficulty(-5, false), MIN_TASK_DIFFICULTY);
  assert.equal(clampDifficulty(null), MIN_TASK_DIFFICULTY);
  assert.equal(clampDifficulty(Number.NaN), MIN_TASK_DIFFICULTY);
});

test("the topic self-score picks the starting level (1-4 easy, 5-7 medium, 8-10 hard)", () => {
  const levels = Array.from({ length: 10 }, (_, i) =>
    initialDifficultyForSelfScore(i + 1),
  );
  assert.deepEqual(levels, [1, 1, 1, 1, 2, 2, 2, 3, 3, 3]);
  for (const level of levels) {
    assert.ok(level >= MIN_TASK_DIFFICULTY && level <= MAX_TASK_DIFFICULTY);
  }
});

test("selectAdaptiveTask prefers an exact difficulty match", () => {
  const candidates = [
    { id: 1, difficulty: 1 },
    { id: 2, difficulty: 2 },
    { id: 3, difficulty: 3 },
  ];
  assert.equal(selectAdaptiveTask(candidates, [], 3, "up", first), 3);
  assert.equal(selectAdaptiveTask(candidates, [], 1, "down", first), 1);
});

test("selectAdaptiveTask never returns an already-used task", () => {
  const candidates = [
    { id: 1, difficulty: 2 },
    { id: 2, difficulty: 2 },
  ];
  for (let i = 0; i < 20; i += 1) {
    assert.equal(selectAdaptiveTask(candidates, [1], 2), 2);
  }
  assert.equal(selectAdaptiveTask(candidates, [1, 2], 2), null);
});

test("selectAdaptiveTask falls back to the nearest level, breaking ties in the answer's direction", () => {
  const onlyEasyAndHard = [
    { id: 10, difficulty: 1 },
    { id: 30, difficulty: 3 },
  ];
  assert.equal(selectAdaptiveTask(onlyEasyAndHard, [], 2, "up", first), 30);
  assert.equal(selectAdaptiveTask(onlyEasyAndHard, [], 2, "down", first), 10);

  const noHardLeft = [
    { id: 10, difficulty: 1 },
    { id: 20, difficulty: 2 },
  ];
  assert.equal(selectAdaptiveTask(noHardLeft, [], 3, "up", first), 20);
});
