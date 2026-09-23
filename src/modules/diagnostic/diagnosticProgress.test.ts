import assert from "node:assert/strict";
import test from "node:test";
import {
  TASK_STATUS_CORRECT,
  TASK_STATUS_INCORRECT,
  TASK_STATUS_UNANSWERED,
} from "@/modules/testing/types";
import {
  DIAGNOSTIC_TOTAL_QUESTIONS,
  resolveDiagnosticNextStep,
  topicQuestionQuota,
  type DiagnosticProgressMapping,
} from "./diagnosticProgress";

function mapping(
  taskId: number,
  themeId: number,
  difficulty: number,
  status: number,
): DiagnosticProgressMapping {
  return { taskId, themeId, difficulty, status };
}

const PLAN = [11, 12, 13, 14, 15];

test("a fresh session asks for the first planned topic", () => {
  assert.deepEqual(resolveDiagnosticNextStep({ mappings: [], plannedThemeIds: PLAN }), {
    kind: "topicIntro",
    themeId: 11,
    topicNumber: 1,
    topicCount: 5,
  });
});

test("all five self-assessments precede questions and determine each topic's initial difficulty", () => {
  const scores = PLAN.map((themeId, index) => ({ themeId, score: index === 1 ? 9 : 2 }));
  for (let count = 0; count < PLAN.length; count += 1) {
    assert.deepEqual(
      resolveDiagnosticNextStep({ mappings: [], plannedThemeIds: PLAN, selfScores: scores.slice(0, count) }),
      { kind: "topicIntro", themeId: PLAN[count], topicNumber: count + 1, topicCount: 5 },
    );
  }
  assert.deepEqual(
    resolveDiagnosticNextStep({ mappings: [], plannedThemeIds: PLAN, selfScores: scores }),
    { kind: "nextTask", themeId: 11, targetDifficulty: 1, direction: "down" },
  );
  assert.deepEqual(
    resolveDiagnosticNextStep({
      mappings: [mapping(1, 11, 1, TASK_STATUS_CORRECT), mapping(2, 11, 2, TASK_STATUS_CORRECT)],
      plannedThemeIds: PLAN,
      selfScores: scores,
    }),
    { kind: "nextTask", themeId: 12, targetDifficulty: 3, direction: "down" },
  );
});

test("nothing new is linked while a task is still unanswered", () => {
  const step = resolveDiagnosticNextStep({
    mappings: [mapping(1, 11, 2, TASK_STATUS_UNANSWERED)],
    plannedThemeIds: PLAN,
  });
  assert.deepEqual(step, { kind: "answer" });
});

test("after a correct answer the next task in the topic is one level harder", () => {
  const step = resolveDiagnosticNextStep({
    mappings: [mapping(1, 11, 2, TASK_STATUS_CORRECT)],
    plannedThemeIds: PLAN,
  });
  assert.deepEqual(step, {
    kind: "nextTask",
    themeId: 11,
    targetDifficulty: 3,
    direction: "up",
  });
});

test("after an incorrect answer the next task in the topic is one level easier", () => {
  const step = resolveDiagnosticNextStep({
    mappings: [mapping(1, 11, 2, TASK_STATUS_INCORRECT)],
    plannedThemeIds: PLAN,
  });
  assert.deepEqual(step, {
    kind: "nextTask",
    themeId: 11,
    targetDifficulty: 1,
    direction: "down",
  });
});

test("difficulty stays within bounds at the top and bottom", () => {
  const top = resolveDiagnosticNextStep({
    mappings: [mapping(1, 11, 3, TASK_STATUS_CORRECT)],
    plannedThemeIds: PLAN,
  });
  const bottom = resolveDiagnosticNextStep({
    mappings: [mapping(1, 11, 1, TASK_STATUS_INCORRECT)],
    plannedThemeIds: PLAN,
  });
  assert.equal(top.kind === "nextTask" && top.targetDifficulty, 3);
  assert.equal(bottom.kind === "nextTask" && bottom.targetDifficulty, 1);
});

test("once a topic reaches its share, the next topic's self-assessment comes next", () => {
  const step = resolveDiagnosticNextStep({
    mappings: [
      mapping(1, 11, 2, TASK_STATUS_CORRECT),
      mapping(2, 11, 3, TASK_STATUS_CORRECT),
    ],
    plannedThemeIds: PLAN,
  });
  assert.deepEqual(step, {
    kind: "topicIntro",
    themeId: 12,
    topicNumber: 2,
    topicCount: 5,
  });
});

test("an exhausted topic ends early and hands its share to later topics", () => {
  const mappings = [mapping(1, 11, 2, TASK_STATUS_CORRECT)];
  const step = resolveDiagnosticNextStep({
    mappings,
    plannedThemeIds: PLAN,
    exhaustedThemeIds: new Set([11]),
  });
  assert.equal(step.kind, "topicIntro");
  // 9 questions left over 4 topics → the next topic may ask 3.
  assert.equal(topicQuestionQuota(DIAGNOSTIC_TOTAL_QUESTIONS - 1, 4), 3);
});

test("a full 5-topic walk links exactly 10 tasks, two per theme, and then completes", () => {
  const mappings: DiagnosticProgressMapping[] = [];
  let taskId = 0;
  for (let guard = 0; guard < 50; guard += 1) {
    const step = resolveDiagnosticNextStep({ mappings, plannedThemeIds: PLAN });
    if (step.kind === "complete") break;
    assert.notEqual(step.kind, "answer");
    const themeId = step.kind === "topicIntro" ? step.themeId : step.kind === "nextTask" ? step.themeId : 0;
    taskId += 1;
    mappings.push(mapping(taskId, themeId, 2, TASK_STATUS_CORRECT));
  }
  assert.equal(mappings.length, DIAGNOSTIC_TOTAL_QUESTIONS);
  assert.deepEqual(
    PLAN.map((themeId) => mappings.filter((m) => m.themeId === themeId).length),
    [2, 2, 2, 2, 2],
  );
});

test("never goes past 10 answered tasks, even for a legacy 30-task session", () => {
  const legacy = Array.from({ length: 30 }, (_, i) =>
    mapping(i + 1, 11 + Math.floor(i / 3), 1, TASK_STATUS_CORRECT),
  );
  assert.deepEqual(
    resolveDiagnosticNextStep({ mappings: legacy, plannedThemeIds: PLAN }),
    { kind: "complete" },
  );
  const ten = Array.from({ length: 10 }, (_, i) =>
    mapping(i + 1, 11, 1, TASK_STATUS_CORRECT),
  );
  assert.deepEqual(
    resolveDiagnosticNextStep({ mappings: ten, plannedThemeIds: PLAN }),
    { kind: "complete" },
  );
});

test("completes when no planned topic is left", () => {
  assert.deepEqual(
    resolveDiagnosticNextStep({ mappings: [], plannedThemeIds: [] }),
    { kind: "complete" },
  );
});
