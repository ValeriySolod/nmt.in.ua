import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const {
  DEFAULT_MAX_BODY_BYTES,
  readMaxBodyBytes,
  rejectOversizedBody,
} = require("../lib/serverBodyLimit.cjs");

test("readMaxBodyBytes defaults to 8 MiB when env is unset", () => {
  assert.equal(readMaxBodyBytes({}), DEFAULT_MAX_BODY_BYTES);
  assert.equal(DEFAULT_MAX_BODY_BYTES, 8388608);
});

test("readMaxBodyBytes reads MAX_BODY_BYTES from env", () => {
  assert.equal(readMaxBodyBytes({ MAX_BODY_BYTES: "8388608" }), 8388608);
});

test("rejectOversizedBody allows ~100 KiB when limit is 8 MiB", () => {
  const req = { headers: { "content-length": String(100 * 1024) } };
  const res = { statusCode: 0, setHeader() {}, end() {} };
  assert.equal(rejectOversizedBody(req, res, 8388608), false);
});

test("rejectOversizedBody returns 413 above limit", () => {
  const req = {
    headers: { "content-length": String(8 * 1024 * 1024 + 1) },
  };
  let statusCode = 0;
  let body = "";
  const res = {
    set statusCode(code) {
      statusCode = code;
    },
    setHeader() {},
    end(payload) {
      body = payload;
    },
  };
  assert.equal(rejectOversizedBody(req, res, 8388608), true);
  assert.equal(statusCode, 413);
  assert.match(body, /exceeds server limit/i);
});
