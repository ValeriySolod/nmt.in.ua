import assert from "node:assert/strict";
import { test } from "node:test";
import { handleNotificationTrigger } from "./notificationTrigger";
import { POST, runtime } from "../../app/api/telegram/notifications/process/route";

test("trigger fails closed, delegates once, preserves counts and hides failures", async () => {
  const previous = process.env.TELEGRAM_NOTIFICATIONS_TRIGGER_SECRET;
  const counts = { sent: 1, skipped: 2, failed: 0, rejected: 0, uncertain: 0 };
  let calls = 0;
  const processor = async () => { calls++; return counts; };
  const request = (header?: string) => new Request("https://example.test/api/telegram/notifications/process", {
    method: "POST", headers: header ? { authorization: header } : {},
  });
  try {
    assert.equal(runtime, "nodejs");
    for (const secret of [undefined, "", "   "]) {
      if (secret === undefined) delete process.env.TELEGRAM_NOTIFICATIONS_TRIGGER_SECRET;
      else process.env.TELEGRAM_NOTIFICATIONS_TRIGGER_SECRET = secret;
      assert.equal((await handleNotificationTrigger(request("Bearer test-secret"), processor)).status, 401);
    }
    process.env.TELEGRAM_NOTIFICATIONS_TRIGGER_SECRET = "test-secret";
    for (const header of [undefined, "Bearer ", "Basic test-secret", "Bearer wrong", "Bearer test-secret-extra"]) {
      assert.equal((await handleNotificationTrigger(request(header), processor)).status, 401);
    }
    assert.equal(calls, 0);
    assert.equal((await POST(request())).status, 401);
    const response = await handleNotificationTrigger(request("Bearer test-secret"), processor);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual(await response.json(), counts);
    assert.equal(calls, 1);
    const repeated = await handleNotificationTrigger(request("Bearer test-secret"), async () => {
      calls++;
      return { ...counts, sent: 0, skipped: 3 };
    });
    assert.equal((await repeated.json()).skipped, 3);
    assert.equal(calls, 2);
    const partial = await handleNotificationTrigger(request("Bearer test-secret"), async () => ({
      sent: 0, skipped: 0, failed: 1, rejected: 2, uncertain: 3,
    }));
    assert.deepEqual(await partial.json(), { sent: 0, skipped: 0, failed: 1, rejected: 2, uncertain: 3 });
    const failure = await handleNotificationTrigger(request("Bearer test-secret"), async () => {
      throw new Error("private database secret");
    });
    assert.equal(failure.status, 500);
    assert.equal(await failure.text(), "");
  } finally {
    if (previous === undefined) delete process.env.TELEGRAM_NOTIFICATIONS_TRIGGER_SECRET;
    else process.env.TELEGRAM_NOTIFICATIONS_TRIGGER_SECRET = previous;
  }
});
