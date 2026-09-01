import { afterEach, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";

import { POST } from "./route";

const API_KEY = "admin-test-key";

let originalApiKey: string | undefined;

beforeEach(() => {
  originalApiKey = process.env.ADMIN_API_KEY;
  process.env.ADMIN_API_KEY = API_KEY;
});

afterEach(() => {
  if (originalApiKey === undefined) delete process.env.ADMIN_API_KEY;
  else process.env.ADMIN_API_KEY = originalApiKey;
});

function jsonRequest(
  body: unknown,
  headers: Record<string, string> = { authorization: `Bearer ${API_KEY}` },
): NextRequest {
  return new NextRequest("http://localhost/api/admin/sessions", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

test("POST /api/admin/sessions returns 401 without Authorization header", async () => {
  const response = await POST(
    jsonRequest({ userId: 1, themeId: 2 }, {}),
    undefined,
    {
      createMentorSession: async () => ({ sessionId: 1, created: true }),
    },
  );

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), {
    ok: false,
    errors: ["Unauthorized."],
  });
});

test("POST /api/admin/sessions returns 401 when ADMIN_API_KEY is unset", async () => {
  delete process.env.ADMIN_API_KEY;

  const response = await POST(jsonRequest({ userId: 1, themeId: 2 }), undefined, {
    createMentorSession: async () => ({ sessionId: 1, created: true }),
  });

  assert.equal(response.status, 401);
});

test("POST /api/admin/sessions returns 400 for invalid body", async () => {
  const response = await POST(jsonRequest({ userId: 0, themeId: 2 }), undefined, {
    createMentorSession: async () => ({ sessionId: 1, created: true }),
  });

  assert.equal(response.status, 400);
});

test("POST /api/admin/sessions creates mentor session when authorized", async () => {
  let captured: unknown;
  const response = await POST(
    jsonRequest({ userId: 1, themeId: 5 }),
    undefined,
    {
      createMentorSession: async (input) => {
        captured = input;
        return { sessionId: 42, created: true };
      },
    },
  );

  assert.equal(response.status, 201);
  assert.deepEqual(captured, { userId: 1, themeId: 5 });
  assert.deepEqual(await response.json(), {
    ok: true,
    sessionId: 42,
    created: true,
  });
});

test("POST /api/admin/sessions returns 200 when planned mentor session already exists", async () => {
  const response = await POST(
    jsonRequest({ userId: 1, themeId: 5 }),
    undefined,
    {
      createMentorSession: async () => ({ sessionId: 42, created: false }),
    },
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    ok: true,
    sessionId: 42,
    created: false,
  });
});
