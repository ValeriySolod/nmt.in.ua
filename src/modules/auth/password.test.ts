import assert from "node:assert/strict";
import test from "node:test";

import { hashPassword, verifyPassword } from "./password";

test("hashPassword and verifyPassword round-trip", () => {
  const stored = hashPassword("demo123");
  assert.match(stored, /^scrypt:/);
  assert.equal(verifyPassword("demo123", stored), true);
  assert.equal(verifyPassword("wrong", stored), false);
});

test("verifyPassword rejects malformed stored values", () => {
  assert.equal(verifyPassword("demo123", "plain-text"), false);
  assert.equal(verifyPassword("demo123", "scrypt:bad:bad"), false);
});
