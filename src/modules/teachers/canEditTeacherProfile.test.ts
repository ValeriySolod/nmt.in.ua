import assert from "node:assert/strict";
import test from "node:test";

import { canEditTeacherProfile } from "./types";

test("canEditTeacherProfile is teacher-only", () => {
  assert.equal(canEditTeacherProfile("teacher"), true);
  assert.equal(canEditTeacherProfile("admin"), false);
  assert.equal(canEditTeacherProfile("student"), false);
});
