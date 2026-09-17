import assert from "node:assert/strict";
import test from "node:test";
import {
  findThemeDueForRepetition,
  REPETITION_INTERVAL,
  type AnsweredTopicTask,
} from "./practiceSpacedRepetition";

function task(themeId: number, correct: boolean, isFollowUp = false): AnsweredTopicTask {
  return { themeId, correct, isFollowUp };
}

test("returns null with no history", () => {
  assert.equal(findThemeDueForRepetition([]), null);
});

test("returns null before the interval has elapsed", () => {
  const history = [
    task(1, false), // mistake in theme 1
    task(2, true),
    task(3, true),
  ];
  assert.equal(findThemeDueForRepetition(history, 4), null);
});

test("becomes due exactly once N other tasks have passed", () => {
  const history = [
    task(1, false), // mistake, index 0
    task(2, true),
    task(3, true),
    task(4, true),
    task(5, true), // index 4 — 4 tasks have passed since index 0
  ];
  assert.equal(findThemeDueForRepetition(history, 4), 1);
});

test("a correct first attempt never schedules a repetition", () => {
  const history = [task(1, true), task(2, true), task(3, true), task(4, true), task(5, true)];
  assert.equal(findThemeDueForRepetition(history, 4), null);
});

test("prefers the theme whose mistake happened earliest", () => {
  const history = [
    task(1, false), // index 0
    task(2, false), // index 1
    task(3, true),
    task(4, true),
    task(5, true),
  ];
  assert.equal(findThemeDueForRepetition(history, 4), 1);
});

test("a theme already repeated since its mistake is not due again", () => {
  const history = [
    task(1, false), // mistake, index 0
    task(2, true),
    task(1, true, true), // repetition round-trip resolves the pending mistake
    task(3, true),
    task(4, true),
    task(5, true),
  ];
  assert.equal(findThemeDueForRepetition(history, 4), null);
});

test("a fresh mistake after a repetition schedules another one later", () => {
  const history = [
    task(1, false), // index 0, mistake
    task(1, true, true), // index 1, repeated already
    task(2, true),
    task(1, false), // index 3, mistakes again
    task(3, true),
    task(4, true),
    task(5, true),
    task(6, true), // index 7 — 4 tasks since index 3
  ];
  assert.equal(findThemeDueForRepetition(history, 4), 1);
});

test("default interval matches REPETITION_INTERVAL", () => {
  const history = Array.from({ length: REPETITION_INTERVAL + 1 }, (_, i) =>
    i === 0 ? task(1, false) : task(9, true),
  );
  assert.equal(findThemeDueForRepetition(history), 1);
});
