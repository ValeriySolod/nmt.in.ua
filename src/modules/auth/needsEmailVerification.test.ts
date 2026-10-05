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

test("needsEmailVerification skips demo accounts", () => {
  assert.equal(
    needsEmailVerification(
      user({
        login: "demo-student",
        email: "demo@example.com",
        emailVerified: false,
      }),
    ),
    false,
  );
});

test("needsEmailVerification skips legacy accounts without email", () => {
  assert.equal(needsEmailVerification(user({})), false);
});

test("needsEmailVerification requires verified email for new accounts", () => {
  assert.equal(
    needsEmailVerification(
      user({ email: "a@example.com", emailVerified: false }),
    ),
    true,
  );
  assert.equal(
    needsEmailVerification(
      user({ email: "a@example.com", emailVerified: true }),
    ),
    false,
  );
});
