import assert from "node:assert/strict";
import test from "node:test";

import { safeInternalPath } from "./safeInternalPath";

test("safeInternalPath keeps in-app paths and query strings", () => {
  assert.equal(safeInternalPath("/"), "/");
  assert.equal(safeInternalPath("/simulator"), "/simulator");
  assert.equal(safeInternalPath("/session/12?mode=nmt"), "/session/12?mode=nmt");
});

test("safeInternalPath rejects open redirects", () => {
  assert.equal(safeInternalPath("//evil.com"), "/");
  assert.equal(safeInternalPath("/\\evil.com"), "/");
  assert.equal(safeInternalPath("https://evil.com"), "/");
  assert.equal(safeInternalPath("/\\\\evil.com"), "/");
  assert.equal(safeInternalPath("https://nmt.in.ua/login"), "/");
  assert.equal(safeInternalPath(""), "/");
  assert.equal(safeInternalPath("../login"), "/");
});
