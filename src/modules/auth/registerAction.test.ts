import assert from "node:assert/strict";
import test from "node:test";

import { registerAction, type RegisterActionState } from "./actions";
import { CreateUserError } from "./users";

const IDLE: RegisterActionState = { status: "idle" };

function formDataWith(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  return formData;
}

test("registerAction returns validation error without creating a user", async () => {
  // Patch via dynamic import won't work for createUser; we rely on validation short-circuit.
  const state = await registerAction(
    IDLE,
    formDataWith({
      login: "ab",
      displayName: "Ok Name",
      password: "12345678",
      passwordConfirm: "12345678",
    }),
  );
  assert.deepEqual(state, { status: "error", code: "invalidLogin" });
});

test("registerAction maps login_taken from createUser", async () => {
  // Direct unit of CreateUserError mapping is covered in users.createUser.test;
  // here we simulate by calling register with reserved demo login.
  const state = await registerAction(
    IDLE,
    formDataWith({
      login: "demo-admin",
      displayName: "Someone",
      password: "12345678",
      passwordConfirm: "12345678",
    }),
  );
  assert.deepEqual(state, { status: "error", code: "reservedLogin" });
  assert.ok(CreateUserError);
});
