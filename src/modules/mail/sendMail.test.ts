import assert from "node:assert/strict";
import test from "node:test";

import { DEFAULT_SITE_URL } from "@/constants/seo";
import {
  absoluteUrl,
  mailDeliveryMode,
  parseMailFrom,
  resolveMailSiteUrl,
  sendMail,
} from "./sendMail";

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
    mailDeliveryMode({ NODE_ENV: "production", BREVO_API_KEY: "xkeysib-test" }),
    "brevo",
  );
});

const brevoEnv = {
  NODE_ENV: "production",
  BREVO_API_KEY: "xkeysib-test",
  MAIL_FROM: "NMT.in.ua <noreply@nmt.in.ua>",
};

const letter = {
  to: "teacher@example.com",
  subject: "Підтвердіть email — nmt.in.ua",
  html: "<p>Підтвердіть</p>",
  text: "Підтвердіть",
};

test("sendMail reads the Brevo body and retries a dropped connection", async () => {
  const calls: RequestInit[] = [];
  let attempt = 0;
  const result = await sendMail(letter, {
    env: brevoEnv,
    sleep: async () => {},
    fetchImpl: async (_url, init) => {
      calls.push(init);
      attempt += 1;
      if (attempt === 1) {
        throw new TypeError("fetch failed");
      }
      return new Response(JSON.stringify({ messageId: "ok" }), { status: 201 });
    },
  });

  assert.deepEqual(result, { ok: true, mode: "brevo" });
  assert.equal(calls.length, 2);
  assert.equal(calls[0]?.cache, "no-store");
  assert.equal(calls[0]?.method, "POST");
});

test("sendMail retries a transient Brevo status and then accepts 201", async () => {
  let attempt = 0;
  const result = await sendMail(letter, {
    env: brevoEnv,
    sleep: async () => {},
    fetchImpl: async () => {
      attempt += 1;
      if (attempt === 1) {
        return new Response(JSON.stringify({ message: "slow down" }), {
          status: 503,
          statusText: "Service Unavailable",
        });
      }
      return new Response("{}", { status: 201 });
    },
  });

  assert.deepEqual(result, { ok: true, mode: "brevo" });
  assert.equal(attempt, 2);
});

test("sendMail does not retry a rejected sender", async () => {
  let attempt = 0;
  const result = await sendMail(letter, {
    env: brevoEnv,
    sleep: async () => {},
    fetchImpl: async () => {
      attempt += 1;
      return new Response(JSON.stringify({ message: "sender not valid" }), {
        status: 400,
        statusText: "Bad Request",
      });
    },
  });

  assert.deepEqual(result, { ok: false, error: "brevo_error" });
  assert.equal(attempt, 1);
});

test("sendMail posts through node:https seam and reads the Brevo body", async () => {
  let attempts = 0;
  const result = await sendMail(letter, {
    env: brevoEnv,
    sleep: async () => {},
    postImpl: async ({ body, headers }) => {
      attempts += 1;
      assert.match(body, /teacher@example.com/);
      assert.equal(headers["api-key"], "xkeysib-test");
      assert.equal(headers.accept, "application/json");
      if (attempts === 1) throw new Error("socket hang up");
      return {
        status: 201,
        statusText: "Created",
        raw: JSON.stringify({ messageId: "<abc@brevo>" }),
      };
    },
  });

  assert.deepEqual(result, { ok: true, mode: "brevo" });
  assert.equal(attempts, 2);
});

test("parseMailFrom splits a display name from the address", () => {
  assert.deepEqual(parseMailFrom("NMT.in.ua <noreply@nmt.in.ua>"), {
    name: "NMT.in.ua",
    email: "noreply@nmt.in.ua",
  });
  assert.deepEqual(parseMailFrom("noreply@nmt.in.ua"), {
    name: "noreply@nmt.in.ua",
    email: "noreply@nmt.in.ua",
  });
  assert.equal(parseMailFrom("not an email"), null);
});
