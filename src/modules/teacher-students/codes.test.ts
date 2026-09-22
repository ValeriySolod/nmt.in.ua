import assert from "node:assert/strict";
import test from "node:test";
import {
  INVITE_CODE_LENGTH,
  isInviteCode,
  normalizeInviteCode,
} from "./codes";

test("normalizeInviteCode uppercases and strips spaces and dashes", () => {
  const raw = " abcd-23wxyz ";
  const code = normalizeInviteCode(raw);
  assert.equal(code, "ABCD23WXYZ");
  assert.equal(code.length, INVITE_CODE_LENGTH);
  assert.equal(isInviteCode(code), true);
});

test("isInviteCode rejects ambiguous or short codes", () => {
  assert.equal(isInviteCode("ABCD23WXY"), false);
  assert.equal(isInviteCode("ABCD23WXY0"), false);
  assert.equal(isInviteCode("ABCD23WXYO"), false);
});
