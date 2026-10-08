import assert from "node:assert/strict";
import test from "node:test";

import { needsEmailVerification } from "./needsEmailVerification";
import type { AuthUser } from "./types";

function user(partial: Partial<AuthUser>): AuthUser {
  return {
    id: 1,
    login: "pupil",
    displayName: "Учень",
    role: "student",
    ...partial,
  };
}

test("needsEmailVerification skips legacy accounts without email", () => {
  assert.equal(needsEmailVerification(user({})), false);
});

test("needsEmailVerification requires verified email for public signups", () => {
  assert.equal(
    needsEmailVerification(
      user({
        email: "a@example.com",
        emailVerified: false,
        emailVerifyRequired: true,
      }),
    ),
    true,
  );
  assert.equal(
    needsEmailVerification(
      user({
        email: "a@example.com",
        emailVerified: true,
        emailVerifyRequired: true,
      }),
    ),
    false,
  );
});

test("needsEmailVerification does not lock out legacy or teacher-created accounts", () => {
  assert.equal(
    needsEmailVerification(
      user({ email: "legacy@example.com", emailVerified: false }),
    ),
    false,
  );
  assert.equal(
    needsEmailVerification(
      user({
        email: "pupil@school.ua",
        emailVerified: false,
        emailVerifyRequired: false,
      }),
    ),
    false,
  );
});
