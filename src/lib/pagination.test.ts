import assert from "node:assert/strict";
import test from "node:test";
import {
  paginateSlice,
  parseTablePage,
  TABLE_PAGE_SIZE,
} from "./pagination";

test("parseTablePage defaults invalid values to 1", () => {
  assert.equal(parseTablePage(undefined), 1);
  assert.equal(parseTablePage(""), 1);
  assert.equal(parseTablePage("0"), 1);
  assert.equal(parseTablePage("2.5"), 1);
});

test("paginateSlice returns at most pageSize items and clamps page", () => {
  const items = Array.from({ length: 23 }, (_, i) => i + 1);
  const slice = paginateSlice(items, 3, TABLE_PAGE_SIZE);
  assert.equal(slice.page, 3);
  assert.equal(slice.total, 23);
  assert.equal(slice.totalPages, 3);
  assert.deepEqual(slice.items, [21, 22, 23]);

  const clamped = paginateSlice(items, 99, TABLE_PAGE_SIZE);
  assert.equal(clamped.page, 3);
  assert.equal(clamped.items.length, 3);
});
