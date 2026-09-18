import assert from "node:assert/strict";
import test from "node:test";

import {
  RateTeacherError,
  validateRateTeacherInput,
} from "./rateTeacherValidate";

test("validateRateTeacherInput accepts score 1–5", () => {
  assert.deepEqual(
    validateRateTeacherInput({
      teacherUserId: 2,
      studentUserId: 1,
      score: 4,
    }),
    { teacherUserId: 2, studentUserId: 1, score: 4 },
  );
});

test("validateRateTeacherInput rejects self-rating", () => {
  assert.throws(
    () =>
      validateRateTeacherInput({
        teacherUserId: 1,
        studentUserId: 1,
        score: 5,
      }),
    (error: unknown) =>
      error instanceof RateTeacherError && error.code === "forbidden",
  );
});

test("validateRateTeacherInput rejects out-of-range score", () => {
  assert.throws(
    () =>
      validateRateTeacherInput({
        teacherUserId: 2,
        studentUserId: 1,
        score: 6,
      }),
    (error: unknown) =>
      error instanceof RateTeacherError && error.code === "invalid_input",
  );
});
