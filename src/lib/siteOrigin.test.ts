import assert from "node:assert/strict";
import test from "node:test";

import { DEFAULT_SITE_URL } from "@/constants/seo";
import {
  absoluteSiteUrl,
  isLoopbackHost,
  resolveSiteUrl,
} from "./siteOrigin";

test("isLoopbackHost covers hosting bind address 127.1.10.37", () => {
  assert.equal(isLoopbackHost("localhost"), true);
  assert.equal(isLoopbackHost("127.0.0.1"), true);
  assert.equal(isLoopbackHost("127.1.10.37"), true);
  assert.equal(isLoopbackHost("nmt.in.ua"), false);
});

test("resolveSiteUrl ignores hosting loopback SITE_URL in production", () => {
  assert.equal(
    resolveSiteUrl({
      SITE_URL: "http://127.1.10.37:3000",
      NODE_ENV: "production",
    }),
    DEFAULT_SITE_URL,
  );
});

test("absoluteSiteUrl builds cabinet redirects on the public origin", () => {
  assert.equal(
    absoluteSiteUrl("/", { NODE_ENV: "production" }),
    `${DEFAULT_SITE_URL}/`,
  );
  assert.equal(
    absoluteSiteUrl("/login", { NODE_ENV: "production" }),
    `${DEFAULT_SITE_URL}/login`,
  );
});
