import assert from "node:assert/strict";
import test from "node:test";

import {
  parseThemeQueryParam,
  resolveInitialThemeId,
} from "./parseThemeQueryParam";

test("parseThemeQueryParam accepts positive integers", () => {
  assert.equal(parseThemeQueryParam("5"), 5);
});

test("parseThemeQueryParam rejects invalid values", () => {
  assert.equal(parseThemeQueryParam(undefined), undefined);
  assert.equal(parseThemeQueryParam(""), undefined);
  assert.equal(parseThemeQueryParam("0"), undefined);
  assert.equal(parseThemeQueryParam("-1"), undefined);
  assert.equal(parseThemeQueryParam("abc"), undefined);
});

test("resolveInitialThemeId prefers a known theme id", () => {
  assert.equal(resolveInitialThemeId([1, 2, 3], 2), 2);
  assert.equal(resolveInitialThemeId([1, 2, 3], 99), 1);
  assert.equal(resolveInitialThemeId([], 2), undefined);
});
