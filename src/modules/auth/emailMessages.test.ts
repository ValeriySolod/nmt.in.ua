import assert from "node:assert/strict";
import test from "node:test";

import type { SendMailInput, SendMailResult } from "@/modules/mail/sendMail";
import { sendRegistrationVerificationMail } from "./emailMessages";

const input = {
  userId: 7,
  email: "student@example.com",
  displayName: "Олена",
};

function recordingIssue() {
  const calls: number[] = [];
  return {
    calls,
    issue: async (userId: number) => {
      calls.push(userId);
      return { rawToken: "token-once" };
    },
  };
}

test("registration verification sends one letter and keeps that token", async () => {
  const issued = recordingIssue();
  const letters: SendMailInput[] = [];
  const result = await sendRegistrationVerificationMail(input, {
    issue: issued.issue,
    deliver: async (letter) => {
      letters.push(letter);
      return { ok: true, mode: "log" };
    },
  });
  assert.deepEqual(result, { ok: true });
  assert.deepEqual(issued.calls, [7]);
  assert.equal(letters.length, 1);
  assert.match(letters[0]?.text ?? "", /token-once/);
  assert.equal(letters[0]?.to, "student@example.com");
});

test("registration verification retries the same link when delivery drops", async () => {
  const issued = recordingIssue();
  const letters: SendMailInput[] = [];
  const result = await sendRegistrationVerificationMail(input, {
    issue: issued.issue,
    deliver: async (letter) => {
      letters.push(letter);
      if (letters.length === 1) return { ok: false, error: "send_failed" };
      return { ok: true, mode: "brevo" };
    },
  });
  assert.deepEqual(result, { ok: true });
  assert.deepEqual(issued.calls, [7]);
  assert.equal(letters.length, 2);
  assert.equal(letters[0]?.text, letters[1]?.text);
  assert.match(letters[0]?.text ?? "", /token-once/);
});

test("registration verification retries the same link when delivery throws", async () => {
  const issued = recordingIssue();
  let calls = 0;
  const result = await sendRegistrationVerificationMail(input, {
    issue: issued.issue,
    deliver: async () => {
      calls += 1;
      if (calls === 1) throw new Error("socket reset");
      return { ok: true, mode: "brevo" };
    },
  });
  assert.deepEqual(result, { ok: true });
  assert.deepEqual(issued.calls, [7]);
  assert.equal(calls, 2);
});

test("registration verification does not send again after Brevo rejects the sender", async () => {
  const issued = recordingIssue();
  let calls = 0;
  const result = await sendRegistrationVerificationMail(input, {
    issue: issued.issue,
    deliver: async (): Promise<SendMailResult> => {
      calls += 1;
      return { ok: false, error: "brevo_error" };
    },
  });
  assert.deepEqual(result, { ok: false });
  assert.deepEqual(issued.calls, [7]);
  assert.equal(calls, 1);
});

test("registration verification reports a missing token instead of throwing", async () => {
  let delivered = false;
  const result = await sendRegistrationVerificationMail(input, {
    issue: async () => {
      throw new Error("user row not visible");
    },
    deliver: async () => {
      delivered = true;
      return { ok: true, mode: "log" };
    },
  });
  assert.deepEqual(result, { ok: false });
  assert.equal(delivered, false);
});
