import assert from "node:assert/strict";
import test from "node:test";

import { AdminContentError } from "./types";
import {
  deriveTaskName,
  parseAdminQuizTaskInput,
  parseTaskId,
  parseThemeId,
} from "./validate";

test("parseAdminQuizTaskInput derives name from task text when omitted", () => {
  const input = parseAdminQuizTaskInput({
    taskText: "10+10=",
    themeId: "2",
    answer1: "10",
    answer2: "20",
    answer3: "30",
    answer4: "0",
    rightAnswerN: "2",
    difficulty: "3",
    comments: " hint ",
  } as Record<string, unknown>);

  assert.deepEqual(input, {
    name: "10+10=",
    taskText: "$10+10=$",
    themeId: 2,
    answer1: "$10$",
    answer2: "$20$",
    answer3: "$30$",
    answer4: "$0$",
    rightAnswerN: 2,
    comments: "hint",
    difficulty: 3,
  });
});

test("parseAdminQuizTaskInput keeps an explicit name from imports", () => {
  const input = parseAdminQuizTaskInput({
    name: " Додавання ",
    taskText: "10+10=",
    themeId: "2",
    answer1: "10",
    answer2: "20",
    answer3: "30",
    answer4: "0",
    rightAnswerN: "2",
    difficulty: "3",
  } as Record<string, unknown>);

  assert.equal(input.name, "Додавання");
});

test("parseAdminQuizTaskInput accepts difficulty above 3", () => {
  const input = parseAdminQuizTaskInput({
    taskText: "B",
    themeId: 1,
    answer1: "1",
    answer2: "2",
    answer3: "3",
    answer4: "4",
    rightAnswerN: 1,
    difficulty: 10,
  });

  assert.equal(input.difficulty, 10);
  assert.equal(input.name, "B");
});

test("deriveTaskName strips math dollars and truncates", () => {
  assert.equal(deriveTaskName("$a+b$ = ?"), "a+b = ?");
  assert.equal(deriveTaskName("x".repeat(120)).length, 100);
});

test("parseThemeId and parseTaskId require positive ints", () => {
  assert.equal(parseThemeId("7"), 7);
  assert.equal(parseTaskId(12), 12);
  assert.throws(() => parseTaskId("0"), AdminContentError);
  assert.throws(() => parseThemeId("-1"), AdminContentError);
});
