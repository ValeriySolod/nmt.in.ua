import assert from "node:assert/strict";
import test from "node:test";
import { buildPaginationItems } from "./paginationPages";

function pages(items: ReturnType<typeof buildPaginationItems>): number[] {
  return items
    .filter((item) => item.type === "page")
    .map((item) => item.page);
}

test("buildPaginationItems on page 1 shows 1–5 and last", () => {
  const items = buildPaginationItems(1, 12);
  assert.deepEqual(pages(items), [1, 2, 3, 4, 5, 12]);
  assert.ok(items.some((item) => item.type === "gap"));
});

test("buildPaginationItems shows all pages when total is small", () => {
  const items = buildPaginationItems(2, 5);
  assert.deepEqual(pages(items), [1, 2, 3, 4, 5]);
  assert.equal(items.some((item) => item.type === "gap"), false);
});
