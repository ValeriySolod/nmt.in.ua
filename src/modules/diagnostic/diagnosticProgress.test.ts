import assert from "node:assert/strict";
import test from "node:test";
import {
  TASK_STATUS_CORRECT,
  TASK_STATUS_INCORRECT,
  TASK_STATUS_UNANSWERED,
} from "@/modules/testing/types";
import {
  consecutiveWrongAtDifficulty1,
  DIAGNOSTIC_FAIL_STREAK_AT_LEVEL_1,
  DIAGNOSTIC_TOTAL_QUESTIONS,
  resolveDiagnosticNextStep,
  type DiagnosticProgressMapping,
} from "./diagnosticProgress";

function mapping(
  partial: Partial<DiagnosticProgressMapping> &
    Pick<DiagnosticProgressMapping, "taskId" | "themeId" | "difficulty" | "status">,
): DiagnosticProgressMapping {
  return partial;
}

test("empty session asks for the first difficulty-1 task", () => {
  assert.deepEqual(resolveDiagnosticNextStep({ mappings: [] }), {
    kind: "nextTask",
    targetDifficulty: 1,
    fallbackDifficulty: null,
    excludeThemeId: null,
  });
});

test("pending unanswered task blocks linking another", () => {
  assert.deepEqual(
    resolveDiagnosticNextStep({
      mappings: [
        mapping({
          taskId: 1,
          themeId: 10,
          difficulty: 1,
          status: TASK_STATUS_UNANSWERED,
        }),
      ],
    }),
    { kind: "answer" },
  );
});

test("correct answer climbs difficulty and excludes previous theme", () => {
  assert.deepEqual(
    resolveDiagnosticNextStep({
      mappings: [
        mapping({
          taskId: 1,
          themeId: 10,
          difficulty: 1,
          status: TASK_STATUS_CORRECT,
        }),
      ],
    }),
    {
      kind: "nextTask",
      targetDifficulty: 2,
      fallbackDifficulty: 1,
      excludeThemeId: 10,
    },
  );
});

test("incorrect answer drops difficulty and excludes previous theme", () => {
  assert.deepEqual(
    resolveDiagnosticNextStep({
      mappings: [
        mapping({
          taskId: 1,
          themeId: 10,
          difficulty: 3,
          status: TASK_STATUS_INCORRECT,
        }),
      ],
    }),
    {
      kind: "nextTask",
      targetDifficulty: 2,
      fallbackDifficulty: null,
      excludeThemeId: 10,
    },
  );
});

test("three consecutive wrongs at difficulty 1 complete the attempt", () => {
  const mappings = [1, 2, 3].map((taskId) =>
    mapping({
      taskId,
      themeId: taskId * 10,
      difficulty: 1,
      status: TASK_STATUS_INCORRECT,
    }),
  );
  assert.equal(
    consecutiveWrongAtDifficulty1(mappings),
    DIAGNOSTIC_FAIL_STREAK_AT_LEVEL_1,
  );
  assert.deepEqual(resolveDiagnosticNextStep({ mappings }), {
    kind: "complete",
  });
});

test("a correct answer resets the level-1 fail streak", () => {
  const mappings = [
    mapping({
      taskId: 1,
      themeId: 10,
      difficulty: 1,
      status: TASK_STATUS_INCORRECT,
    }),
    mapping({
      taskId: 2,
      themeId: 20,
      difficulty: 1,
      status: TASK_STATUS_INCORRECT,
    }),
    mapping({
      taskId: 3,
      themeId: 30,
      difficulty: 1,
      status: TASK_STATUS_CORRECT,
    }),
    mapping({
      taskId: 4,
      themeId: 40,
      difficulty: 1,
      status: TASK_STATUS_INCORRECT,
    }),
  ];
  assert.equal(consecutiveWrongAtDifficulty1(mappings), 1);
  assert.equal(resolveDiagnosticNextStep({ mappings }).kind, "nextTask");
});

test("wrong at higher difficulty does not count toward level-1 streak", () => {
  const mappings = [
    mapping({
      taskId: 1,
      themeId: 10,
      difficulty: 2,
      status: TASK_STATUS_INCORRECT,
    }),
    mapping({
      taskId: 2,
      themeId: 20,
      difficulty: 1,
      status: TASK_STATUS_INCORRECT,
    }),
  ];
  assert.equal(consecutiveWrongAtDifficulty1(mappings), 1);
});

test("reaching the question cap completes the attempt", () => {
  const mappings = Array.from({ length: DIAGNOSTIC_TOTAL_QUESTIONS }, (_, i) =>
    mapping({
      taskId: i + 1,
      themeId: (i % 5) + 1,
      difficulty: 1,
      status: TASK_STATUS_CORRECT,
    }),
  );
  assert.deepEqual(resolveDiagnosticNextStep({ mappings }), {
    kind: "complete",
  });
});
