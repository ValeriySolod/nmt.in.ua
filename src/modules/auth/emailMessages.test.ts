import assert from "node:assert/strict";
import test from "node:test";

import { sendRegistrationVerificationMail } from "./emailMessages";

const input = {
  userId: 7,
  email: "teacher@example.com",
  displayName: "Олена",
};

test("registration verification does not send a second letter after success", async () => {
  let calls = 0;
  const result = await sendRegistrationVerificationMail(input, {
    send: async () => {
      calls += 1;
      return { ok: true };
    },
  });
  assert.deepEqual(result, { ok: true });
  assert.equal(calls, 1);
});

test("registration verification retries when the first send does not leave", async () => {
  let calls = 0;
  const result = await sendRegistrationVerificationMail(input, {
    send: async () => {
      calls += 1;
      return calls === 1 ? { ok: false } : { ok: true };
    },
  });
  assert.deepEqual(result, { ok: true });
  assert.equal(calls, 2);
});

test("registration verification retries when the first send throws", async () => {
  let calls = 0;
  const result = await sendRegistrationVerificationMail(input, {
    send: async () => {
      calls += 1;
      if (calls === 1) throw new Error("user row not visible");
      return { ok: true };
    },
  });
  assert.deepEqual(result, { ok: true });
  assert.equal(calls, 2);
});
