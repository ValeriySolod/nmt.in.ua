import assert from "node:assert/strict";
import test from "node:test";

import { validateRegistrationInput } from "./validateRegistration";

test("validateRegistrationInput accepts a valid student payload", () => {
  const result = validateRegistrationInput({
    login: "Student_01",
    displayName: "  Марія   Іваненко ",
    password: "securepass",
    passwordConfirm: "securepass",
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.deepEqual(result.value, {
      login: "student_01",
      displayName: "Марія Іваненко",
      password: "securepass",
    });
  }
});

test("validateRegistrationInput rejects empty fields", () => {
  const result = validateRegistrationInput({
    login: "",
    displayName: "A",
    password: "12345678",
    passwordConfirm: "12345678",
  });
  assert.deepEqual(result, { ok: false, code: "requiredFields" });
});

test("validateRegistrationInput rejects reserved demo login", () => {
  const result = validateRegistrationInput({
    login: "demo-student",
    displayName: "Test User",
    password: "12345678",
    passwordConfirm: "12345678",
  });
  assert.deepEqual(result, { ok: false, code: "reservedLogin" });
});

test("validateRegistrationInput rejects oversized passwords", () => {
  const long = "a".repeat(129);
  const result = validateRegistrationInput({
    login: "newuser",
    displayName: "Test User",
    password: long,
    passwordConfirm: long,
  });
  assert.deepEqual(result, { ok: false, code: "passwordTooLong" });
});

test("validateRegistrationInput rejects short password and mismatch", () => {
  assert.deepEqual(
    validateRegistrationInput({
      login: "newuser",
      displayName: "Test User",
      password: "short",
      passwordConfirm: "short",
    }),
    { ok: false, code: "passwordTooShort" },
  );

  assert.deepEqual(
    validateRegistrationInput({
      login: "newuser",
      displayName: "Test User",
      password: "12345678",
      passwordConfirm: "87654321",
    }),
    { ok: false, code: "passwordMismatch" },
  );
});

test("validateRegistrationInput rejects invalid login charset", () => {
  const result = validateRegistrationInput({
    login: "юзер",
    displayName: "Test User",
    password: "12345678",
    passwordConfirm: "12345678",
  });
  assert.deepEqual(result, { ok: false, code: "invalidLogin" });
});
