import assert from "node:assert/strict";
import test from "node:test";

import { needsDashboardChrome } from "./requestPath";

test("needsDashboardChrome hides cabinet chrome on public marketing/auth paths", () => {
  assert.equal(needsDashboardChrome("/welcome", true), false);
  assert.equal(needsDashboardChrome("/login", true), false);
  assert.equal(needsDashboardChrome("/register", true), false);
  assert.equal(needsDashboardChrome("/", true), true);
  assert.equal(needsDashboardChrome("/simulator", true), true);
  assert.equal(needsDashboardChrome("/", false), false);
  assert.equal(needsDashboardChrome(null, true), true);
});
