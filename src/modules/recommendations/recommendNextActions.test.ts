import assert from "node:assert/strict";
import test from "node:test";

import { recommendNextActions } from "./index";
import type { StudentTopicStats } from "./types";

function stats(
  topicScores: StudentTopicStats["topicScores"],
  hasCompletedSessions = true,
): StudentTopicStats {
  return { topicScores, hasCompletedSessions };
}

test("recommendNextActions: no completed sessions -> empty recommendations (no-attempt empty state)", () => {
  const result = recommendNextActions(
    stats(
      [{ themeId: 1, themeName: "Тема A", overallPercent: null, lastPercent: null }],
      false,
    ),
  );

  assert.deepEqual(result, []);
});

test("recommendNextActions: weak topic -> topic-test recommendation sorted by lowest score first", () => {
  const result = recommendNextActions(
    stats([
      { themeId: 1, themeName: "Тема A", overallPercent: 30, lastPercent: 30 },
      { themeId: 2, themeName: "Тема B", overallPercent: 10, lastPercent: 10 },
    ]),
  );

  const topicTestActions = result.filter((a) => a.type === "topic-test");
  assert.equal(topicTestActions[0]?.title, "Повторіть тему «Тема B»");
  assert.equal(topicTestActions[1]?.title, "Повторіть тему «Тема A»");
});

test("recommendNextActions: untried topic -> topic-test recommendation to try it", () => {
  const result = recommendNextActions(
    stats([
      { themeId: 1, themeName: "Тема A", overallPercent: 80, lastPercent: 80 },
      { themeId: 2, themeName: "Тема B", overallPercent: null, lastPercent: null },
    ]),
  );

  const untriedAction = result.find(
    (a) => a.title === "Спробуйте тему «Тема B»",
  );
  assert.ok(untriedAction);
  assert.equal(untriedAction?.href, "/");
});

test("recommendNextActions: all topics solid and attempted -> recommends simulator", () => {
  const result = recommendNextActions(
    stats([
      { themeId: 1, themeName: "Тема A", overallPercent: 90, lastPercent: 90 },
      { themeId: 2, themeName: "Тема B", overallPercent: 75, lastPercent: 75 },
    ]),
  );

  assert.ok(result.some((a) => a.type === "simulator"));
});

test("recommendNextActions: two or more weak topics -> recommends consultation", () => {
  const result = recommendNextActions(
    stats([
      { themeId: 1, themeName: "Тема A", overallPercent: 20, lastPercent: 20 },
      { themeId: 2, themeName: "Тема B", overallPercent: 25, lastPercent: 25 },
    ]),
  );

  assert.ok(result.some((a) => a.type === "consultation"));
});

test("recommendNextActions: actions are always sorted by priority ascending", () => {
  const result = recommendNextActions(
    stats([
      { themeId: 1, themeName: "Тема A", overallPercent: 20, lastPercent: 20 },
      { themeId: 2, themeName: "Тема B", overallPercent: null, lastPercent: null },
    ]),
  );

  const priorities = result.map((a) => a.priority);
  const sorted = [...priorities].sort((a, b) => a - b);
  assert.deepEqual(priorities, sorted);
});

test("recommendNextActions: mid-range scores with no weak/untried topics still returns a fallback recommendation", () => {
  const result = recommendNextActions(
    stats([
      { themeId: 1, themeName: "Тема A", overallPercent: 55, lastPercent: 55 },
    ]),
  );

  assert.equal(result.length, 1);
  assert.equal(result[0]?.type, "problems");
});
