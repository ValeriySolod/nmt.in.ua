import assert from "node:assert/strict";
import test from "node:test";
import {
  MATH_MARATHON_SEED,
  spellUkrainianIndexes,
  UKRAINIAN_ALPHABET,
} from "./seedData";

test("the cipher riddle spells ЧИСЛО from the 33-letter alphabet", () => {
  assert.equal(UKRAINIAN_ALPHABET.length, 33);
  const indexes = [4 * 7, Math.sqrt(121), 2 ** 4 + 6, 2 ** 4, 5 ** 2 - 6];
  assert.deepEqual(indexes, [28, 11, 22, 16, 19]);
  assert.equal(spellUkrainianIndexes(indexes), "ЧИСЛО");
  assert.match(MATH_MARATHON_SEED.riddles[2]!.answer, /ЧИСЛО/);
});

test("the example marathon has three riddles and five day topics", () => {
  assert.equal(MATH_MARATHON_SEED.riddles.length, 3);
  assert.deepEqual(
    MATH_MARATHON_SEED.days.map((day) => day.topic),
    [
      "Відсотки й степені",
      "Рівняння",
      "Функції та графіки",
      "Прогресії",
      "Геометрія та площі",
    ],
  );
  assert.ok(MATH_MARATHON_SEED.days.every((day) => day.tasks.length >= 1));
});
