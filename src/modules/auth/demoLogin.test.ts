import assert from "node:assert/strict";
import test from "node:test";

import {
  isDemoAccountLogin,
  isDemoLoginEnabled,
  publicDemoAccounts,
} from "./demoLogin";

test("isDemoAccountLogin allows only seeded demo logins", () => {
  assert.equal(isDemoAccountLogin("demo-admin"), true);
  assert.equal(isDemoAccountLogin("DEMO-student"), true);
  assert.equal(isDemoAccountLogin("tony_kobs"), false);
});

test("publicDemoAccounts does not expose passwords", () => {
  for (const account of publicDemoAccounts()) {
    assert.equal("password" in account, false);
    assert.equal(typeof account.login, "string");
  }
});

test("isDemoLoginEnabled is off in production unless ALLOW_DEMO_LOGIN=1", () => {
  assert.equal(isDemoLoginEnabled({ NODE_ENV: "production" }), false);
  assert.equal(
    isDemoLoginEnabled({ NODE_ENV: "production", ALLOW_DEMO_LOGIN: "1" }),
    true,
  );
  assert.equal(isDemoLoginEnabled({ NODE_ENV: "development" }), true);
});
