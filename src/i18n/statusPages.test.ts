import assert from "node:assert/strict";
import test from "node:test";
import { readStatusLocaleFromCookie, statusCopy } from "./statusPages";

test("statusCopy falls back to uk", () => {
  assert.equal(statusCopy("uk").notFound.code, "404");
  assert.equal(statusCopy("nope").error.code, "500");
  assert.match(statusCopy("en").loading.label, /Load/i);
});

test("readStatusLocaleFromCookie", () => {
  assert.equal(readStatusLocaleFromCookie("NEXT_LOCALE=de"), "de");
  assert.equal(readStatusLocaleFromCookie("foo=1; NEXT_LOCALE=en"), "en");
  assert.equal(readStatusLocaleFromCookie(""), "uk");
});
