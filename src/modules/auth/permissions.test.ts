import assert from "node:assert/strict";
import test from "node:test";
import { hasPermission, MARATHON_MANAGE } from "./permissions";

test("marathon:manage is granted only to admin", () => {
  assert.equal(hasPermission("admin", MARATHON_MANAGE), true);
  assert.equal(hasPermission("teacher", MARATHON_MANAGE), false);
  assert.equal(hasPermission("student", MARATHON_MANAGE), false);
});
