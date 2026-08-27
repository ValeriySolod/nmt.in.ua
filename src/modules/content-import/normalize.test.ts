import { test } from "node:test";
import assert from "node:assert/strict";
import { readInt } from "./normalize";

test("readInt accepts the signed MySQL INT upper bound (2147483647)", () => {
  assert.deepEqual(readInt("2147483647"), { value: 2147483647 });
  assert.deepEqual(readInt(2147483647), { value: 2147483647 });
});

test("readInt rejects one past the signed MySQL INT upper bound (2147483648)", () => {
  const result = readInt("2147483648");
  assert.equal(result.value, undefined);
  assert.match(result.error!, /must be between -2147483648 and 2147483647/);
});

test("readInt accepts the signed MySQL INT lower bound (-2147483648)", () => {
  assert.deepEqual(readInt("-2147483648"), { value: -2147483648 });
});

test("readInt rejects one past the signed MySQL INT lower bound (-2147483649)", () => {
  const result = readInt("-2147483649");
  assert.equal(result.value, undefined);
  assert.match(result.error!, /must be between -2147483648 and 2147483647/);
});

test("readInt('any') accepts zero", () => {
  assert.deepEqual(readInt("0"), { value: 0 });
  assert.deepEqual(readInt(0), { value: 0 });
});

test("readInt('any') accepts a negative value", () => {
  assert.deepEqual(readInt("-5"), { value: -5 });
});

test("readInt('positive') rejects zero", () => {
  const result = readInt("0", "positive");
  assert.equal(result.value, undefined);
  assert.match(result.error!, /must be a positive integer/);
});

test("readInt('positive') rejects a negative value", () => {
  const result = readInt("-1", "positive");
  assert.equal(result.value, undefined);
  assert.match(result.error!, /must be a positive integer/);
});

test("readInt('positive') accepts 1", () => {
  assert.deepEqual(readInt("1", "positive"), { value: 1 });
});

test("readInt('nonNegative') accepts zero", () => {
  assert.deepEqual(readInt("0", "nonNegative"), { value: 0 });
});

test("readInt('nonNegative') rejects a negative value", () => {
  const result = readInt("-1", "nonNegative");
  assert.equal(result.value, undefined);
  assert.match(result.error!, /must be a non-negative integer/);
});

test("readInt rejects an unsafe integer number (beyond Number.MAX_SAFE_INTEGER)", () => {
  const result = readInt(Number.MAX_SAFE_INTEGER + 10);
  assert.equal(result.value, undefined);
  assert.match(result.error!, /must be a safe integer/);
});

test("readInt rejects an unsafe integer numeric string (beyond Number.MAX_SAFE_INTEGER)", () => {
  const result = readInt(String(Number.MAX_SAFE_INTEGER) + "0");
  assert.equal(result.value, undefined);
  assert.match(result.error!, /must be a safe integer/);
});

test("readInt rejects an oversized numeric string", () => {
  const result = readInt("9".repeat(50));
  assert.equal(result.value, undefined);
  assert.match(result.error!, /must be an integer/);
});

test("readInt rejects a non-integer number (float)", () => {
  const result = readInt(1.5);
  assert.equal(result.value, undefined);
});

test("readInt rejects a non-numeric string", () => {
  const result = readInt("abc");
  assert.equal(result.value, undefined);
});
