import assert from "node:assert/strict";
import test from "node:test";

import { GET } from "./route";

function requestFor(token?: string): Request {
  const url = new URL("http://127.0.0.1:3000/api/auth/verify-email");
  if (token !== undefined) url.searchParams.set("token", token);
  return new Request(url);
}

function locationOf(response: Response): string {
  return response.headers.get("location") ?? "";
}

test("GET /api/auth/verify-email redirects success to the confirm screen", async () => {
  const response = await GET(requestFor("fresh-token"), {}, {
    verifyEmail: async (token) => {
      assert.equal(token, "fresh-token");
      return { status: "ok" };
    },
  });

  assert.equal(response.status, 303);
  const location = new URL(locationOf(response));
  assert.equal(location.pathname, "/verify-email");
  assert.equal(location.searchParams.get("status"), "success");
  assert.equal(location.searchParams.get("token"), null);
});

test("GET /api/auth/verify-email redirects expired, used, and invalid tokens", async () => {
  for (const code of ["expired", "used", "invalid"] as const) {
    const response = await GET(requestFor("some-token"), {}, {
      verifyEmail: async () => ({ status: "error", code }),
    });
    assert.equal(response.status, 303);
    const location = new URL(locationOf(response));
    assert.equal(location.pathname, "/verify-email");
    assert.equal(location.searchParams.get("error"), code);
    assert.equal(location.searchParams.get("status"), null);
  }
});

test("GET /api/auth/verify-email treats a missing token as invalid", async () => {
  let called = false;
  const response = await GET(requestFor(), {}, {
    verifyEmail: async () => {
      called = true;
      return { status: "ok" };
    },
  });

  assert.equal(called, false);
  assert.equal(response.status, 303);
  const location = new URL(locationOf(response));
  assert.equal(location.searchParams.get("error"), "invalid");
});
