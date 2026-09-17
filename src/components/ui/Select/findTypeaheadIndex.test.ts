import assert from "node:assert/strict";
import test from "node:test";
import { findTypeaheadIndex, isTypeaheadChar } from "./findTypeaheadIndex";

const THEMES = [
  "Алгебраїчні вирази",
  "Геометрія і вектори",
  "Рівняння і нерівності",
  "Функції",
  "Числа і вирази",
];

test("findTypeaheadIndex matches Ukrainian prefix from start", () => {
  assert.equal(findTypeaheadIndex(THEMES, "рів"), 2);
  assert.equal(findTypeaheadIndex(THEMES, "Ч"), 4);
});

test("findTypeaheadIndex walks forward for repeated letter", () => {
  const labels = ["Альфа", "Бета", "Арка"];
  assert.equal(findTypeaheadIndex(labels, "а", 0), 0);
  assert.equal(findTypeaheadIndex(labels, "а", 1), 2);
});

test("isTypeaheadChar ignores control keys", () => {
  assert.equal(isTypeaheadChar("р"), true);
  assert.equal(isTypeaheadChar("Enter"), false);
  assert.equal(isTypeaheadChar(" "), false);
});
