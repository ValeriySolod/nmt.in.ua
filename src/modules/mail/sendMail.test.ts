import assert from "node:assert/strict";
import test from "node:test";

import { DEFAULT_SITE_URL } from "@/constants/seo";
import { absoluteUrl, mailDeliveryMode, resolveMailSiteUrl } from "./sendMail";

test("resolveMailSiteUrl prefers SITE_URL and ignores NEXT_PUBLIC_SITE_URL", () => {
  assert.equal(
    resolveMailSiteUrl({
      SITE_URL: "https://nmt.in.ua/",
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      NODE_ENV: "production",
    }),
    "https://nmt.in.ua",
  );
});

test("resolveMailSiteUrl uses MAIL_SITE_URL when SITE_URL is empty", () => {
  assert.equal(
    resolveMailSiteUrl({
      SITE_URL: "  ",
      MAIL_SITE_URL: "https://nmt.in.ua",
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      NODE_ENV: "development",
    }),
    "https://nmt.in.ua",
  );
});

test("resolveMailSiteUrl ignores localhost SITE_URL in production", () => {
  assert.equal(
    resolveMailSiteUrl({
      SITE_URL: "http://localhost:3000",
      NODE_ENV: "production",
    }),
    DEFAULT_SITE_URL,
  );
  assert.equal(
    resolveMailSiteUrl({
      SITE_URL: "http://127.1.10.37:3000",
      NODE_ENV: "production",
    }),
    DEFAULT_SITE_URL,
  );
});

test("resolveMailSiteUrl falls back to nmt.in.ua in production", () => {
  assert.equal(
    resolveMailSiteUrl({ NODE_ENV: "production" }),
    DEFAULT_SITE_URL,
  );
});

test("resolveMailSiteUrl falls back to localhost outside production", () => {
  assert.equal(
    resolveMailSiteUrl({ NODE_ENV: "development" }),
    "http://localhost:3000",
  );
  assert.equal(resolveMailSiteUrl({}), "http://localhost:3000");
});

test("absoluteUrl builds verify-email links on the production origin", () => {
  assert.equal(
    absoluteUrl("/verify-email?token=abc", { NODE_ENV: "production" }),
    `${DEFAULT_SITE_URL}/verify-email?token=abc`,
  );
});

test("mailDeliveryMode logs locally and fails closed in production without a key", () => {
  assert.equal(mailDeliveryMode({ NODE_ENV: "development" }), "log");
  assert.equal(mailDeliveryMode({ NODE_ENV: "production" }), "unavailable");
  assert.equal(
    mailDeliveryMode({ NODE_ENV: "production", RESEND_API_KEY: "re_test" }),
    "resend",
  );
});
