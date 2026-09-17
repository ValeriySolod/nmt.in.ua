import assert from "node:assert/strict";
import test from "node:test";
import { isQueryFlagOn, queryHref, readSearchParam } from "./queryHref";

test("queryHref omits empty values", () => {
  assert.equal(queryHref("/sessions", { extended: null }), "/sessions");
  assert.equal(queryHref("/sessions", { extended: "1" }), "/sessions?extended=1");
  assert.equal(
    queryHref("/problems", { theme: "3", options: "0", key: null }),
    "/problems?theme=3&options=0",
  );
});

test("readSearchParam and flags", () => {
  assert.equal(readSearchParam(["1", "2"]), "1");
  assert.equal(isQueryFlagOn("1"), true);
  assert.equal(isQueryFlagOn("0"), false);
  assert.equal(isQueryFlagOn(undefined), false);
});
