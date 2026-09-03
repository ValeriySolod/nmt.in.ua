import assert from "node:assert/strict";
import test from "node:test";

import { recommendNextActions } from "./index";
import type { StudentTopicStats } from "./types";

function stats(
  topicScores: StudentTopicStats["topicScores"],
  hasCompletedSessions = true,
): StudentTopicStats {
  return { topicScores, hasCompletedSessions };
}

const translations: Record<string, string> = {
  goToTopic: "Перейдіть до теми «{theme}»",
  graphReason: "Тема «{theme}» освоєна — наступний крок за навчальним планом.",
  graphReasonFallback: "Наступний крок за навчальним планом.",
  repeatTopic: "Повторіть тему «{theme}»",
  weakTopicReason:
    "Останній результат: {percent}%. Варто попрактикуватися ще раз.",
  tryTopic: "Спробуйте тему «{theme}»",
  untriedReason: "Ви ще не проходили цю тему — почніть з короткого тесту.",
  consultationTitle: "Запишіться на консультацію",
  consultationReason: "Декілька тем потребують додаткової підтримки викладача.",
  materialsTitle: "Повторіть теоретичні матеріали",
  materialsReason: "У слабких темах допоможе конспект перед повторним тестом.",
  simulatorTitle: "Спробуйте повний симулятор НМТ",
  simulatorReason:
    "Всі теми опрацьовані на хорошому рівні — час перевірити результат у форматі УЦОЯО.",
  problemsTitle: "Практикуйте додаткові задачі",
  problemsReason:
    "Ваш прогрес стабільний — закріпіть його практикою в задачнику.",
};

function t(key: string, values?: Record<string, string | number>): string {
  let result = translations[key] ?? key;

  for (const [name, value] of Object.entries(values ?? {})) {
    result = result.replace(`{${name}}`, String(value));
  }

  return result;
}

test("recommendNextActions: no completed sessions -> empty recommendations (no-attempt empty state)", () => {
  const result = recommendNextActions(
    stats(
      [
        {
          themeId: 1,
          themeName: "Тема A",
          overallPercent: null,
          lastPercent: null,
        },
      ],
      false,
    ),
    [],
    t,
  );

  assert.deepEqual(result, []);
});

test("recommendNextActions: weak topic -> topic-test recommendation sorted by lowest score first", () => {
  const result = recommendNextActions(
    stats([
      { themeId: 1, themeName: "Тема A", overallPercent: 30, lastPercent: 30 },
      { themeId: 2, themeName: "Тема B", overallPercent: 10, lastPercent: 10 },
    ]),
    [],
    t,
  );

  const topicTestActions = result.filter((a) => a.type === "topic-test");
  assert.equal(topicTestActions[0]?.title, "Повторіть тему «Тема B»");
  assert.equal(topicTestActions[1]?.title, "Повторіть тему «Тема A»");
});

test("recommendNextActions: untried topic -> topic-test recommendation to try it", () => {
  const result = recommendNextActions(
    stats([
      { themeId: 1, themeName: "Тема A", overallPercent: 80, lastPercent: 80 },
      {
        themeId: 2,
        themeName: "Тема B",
        overallPercent: null,
        lastPercent: null,
      },
    ]),
    [],
    t,
  );

  const untriedAction = result.find(
    (a) => a.title === "Спробуйте тему «Тема B»",
  );
  assert.ok(untriedAction);
  assert.equal(untriedAction?.href, "/?theme=2");
  assert.equal(untriedAction?.themeId, 2);
});

test("recommendNextActions: all topics solid and attempted -> recommends simulator", () => {
  const result = recommendNextActions(
    stats([
      { themeId: 1, themeName: "Тема A", overallPercent: 90, lastPercent: 90 },
      { themeId: 2, themeName: "Тема B", overallPercent: 75, lastPercent: 75 },
    ]),
    [],
    t,
  );

  assert.ok(result.some((a) => a.type === "simulator"));
});

test("recommendNextActions: two or more weak topics -> recommends consultation", () => {
  const result = recommendNextActions(
    stats([
      { themeId: 1, themeName: "Тема A", overallPercent: 20, lastPercent: 20 },
      { themeId: 2, themeName: "Тема B", overallPercent: 25, lastPercent: 25 },
    ]),
    [],
    t,
  );

  assert.ok(result.some((a) => a.type === "consultation"));
});

test("recommendNextActions: actions are limited to top 3 by priority", () => {
  const result = recommendNextActions(
    stats([
      { themeId: 1, themeName: "A", overallPercent: 10, lastPercent: 10 },
      { themeId: 2, themeName: "B", overallPercent: 15, lastPercent: 15 },
      { themeId: 3, themeName: "C", overallPercent: 20, lastPercent: 20 },
      { themeId: 4, themeName: "D", overallPercent: null, lastPercent: null },
      { themeId: 5, themeName: "E", overallPercent: null, lastPercent: null },
    ]),
    [],
    t,
  );

  assert.equal(result.length, 3);
});

test("recommendNextActions: actions are always sorted by priority ascending", () => {
  const result = recommendNextActions(
    stats([
      { themeId: 1, themeName: "Тема A", overallPercent: 20, lastPercent: 20 },
      {
        themeId: 2,
        themeName: "Тема B",
        overallPercent: null,
        lastPercent: null,
      },
    ]),
    [],
    t,
  );

  const priorities = result.map((a) => a.priority);
  const sorted = [...priorities].sort((a, b) => a - b);
  assert.deepEqual(priorities, sorted);
});

test("recommendNextActions: mid-range scores with no weak/untried topics still returns a fallback recommendation", () => {
  const result = recommendNextActions(
    stats([
      { themeId: 1, themeName: "Тема A", overallPercent: 55, lastPercent: 55 },
    ]),
    [],
    t,
  );

  assert.equal(result.length, 1);
  assert.equal(result[0]?.type, "problems");
});

test("recommendNextActions: solid topic A in graph recommends weak/untryed topic B", () => {
  const result = recommendNextActions(
    stats([
      { themeId: 1, themeName: "Тема A", overallPercent: 85, lastPercent: 85 },
      {
        themeId: 2,
        themeName: "Тема B",
        overallPercent: null,
        lastPercent: null,
      },
    ]),
    [{ fromThemeId: 1, toThemeId: 2 }],
    t,
  );

  const graphAction = result.find(
    (action) => action.title === "Перейдіть до теми «Тема B»",
  );
  assert.ok(graphAction);
  assert.equal(graphAction?.themeId, 2);
  assert.match(graphAction?.reason ?? "", /Тема A/);
});

test("recommendNextActions: graph skips target theme that is already solid", () => {
  const result = recommendNextActions(
    stats([
      { themeId: 1, themeName: "Тема A", overallPercent: 90, lastPercent: 90 },
      { themeId: 2, themeName: "Тема B", overallPercent: 80, lastPercent: 80 },
    ]),
    [{ fromThemeId: 1, toThemeId: 2 }],
    t,
  );

  assert.equal(
    result.some((action) => action.title === "Перейдіть до теми «Тема B»"),
    false,
  );
});
