import assert from "node:assert/strict";
import test from "node:test";

import { loginUserSchema } from "./authValidation";
import { validateSchema } from "./parse";

test("login folds mixed-case login to the stored lowercase form", () => {
  const parsed = validateSchema(loginUserSchema, {
    login: " Demo-Student ",
    password: "demo123",
  });

  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.value.login, "demo-student");
  }
});
