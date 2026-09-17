import assert from "node:assert/strict";
import test from "node:test";
import {
  buildClassTopicRows,
  buildThemeStudentAverages,
  compareByWorstScore,
  studentOverallAverage,
  type StudentTopicBundle,
} from "./teacherStudentResults";
import type { TopicResultRow } from "./types";

function row(
  partial: Partial<TopicResultRow> & Pick<TopicResultRow, "themeId" | "themeName">,
): TopicResultRow {
  return {
    themeCode: `T-${partial.themeId}`,
    displayIndex: partial.themeId,
    attemptsCount: 0,
    overallPercent: null,
    lastThreePercent: null,
    avgSecondsPerTask: null,
    ...partial,
  };
}

test("compareByWorstScore puts lower scores first and nulls last", () => {
  assert.ok(compareByWorstScore(10, 50) < 0);
  assert.ok(compareByWorstScore(null, 50) > 0);
  assert.equal(compareByWorstScore(null, null), 0);
});

test("buildClassTopicRows averages only students who attempted the theme", () => {
  const bundles: StudentTopicBundle[] = [
    {
      student: { studentUserId: 1, login: "a", displayName: "Ann" },
      overallAverage: 40,
      rows: [
        row({
          themeId: 1,
          themeName: "Дроби",
          attemptsCount: 2,
          overallPercent: 40,
          lastThreePercent: 40,
          avgSecondsPerTask: 5,
        }),
      ],
    },
    {
      student: { studentUserId: 2, login: "b", displayName: "Bob" },
      overallAverage: 80,
      rows: [
        row({
          themeId: 1,
          themeName: "Дроби",
          attemptsCount: 1,
          overallPercent: 80,
          lastThreePercent: 80,
          avgSecondsPerTask: 3,
        }),
      ],
    },
    {
      student: { studentUserId: 3, login: "c", displayName: "Cat" },
      overallAverage: null,
      rows: [row({ themeId: 1, themeName: "Дроби", attemptsCount: 0 })],
    },
  ];

  const classRows = buildClassTopicRows(bundles);
  assert.equal(classRows.length, 1);
  assert.equal(classRows[0]?.attemptsCount, 3);
  assert.equal(classRows[0]?.studentsWithAttempts, 2);
  assert.equal(classRows[0]?.overallPercent, 60);
});

test("buildThemeStudentAverages sorts worst first", () => {
  const bundles: StudentTopicBundle[] = [
    {
      student: { studentUserId: 2, login: "b", displayName: "Bob" },
      overallAverage: 80,
      rows: [
        row({
          themeId: 1,
          themeName: "Дроби",
          attemptsCount: 1,
          overallPercent: 80,
        }),
      ],
    },
    {
      student: { studentUserId: 1, login: "a", displayName: "Ann" },
      overallAverage: 40,
      rows: [
        row({
          themeId: 1,
          themeName: "Дроби",
          attemptsCount: 2,
          overallPercent: 40,
        }),
      ],
    },
  ];

  const list = buildThemeStudentAverages(bundles, 1);
  assert.deepEqual(
    list.map((item) => item.studentUserId),
    [1, 2],
  );
});

test("studentOverallAverage ignores themes without attempts", () => {
  assert.equal(
    studentOverallAverage([
      row({ themeId: 1, themeName: "A", attemptsCount: 0, overallPercent: null }),
      row({ themeId: 2, themeName: "B", attemptsCount: 2, overallPercent: 50 }),
      row({ themeId: 3, themeName: "C", attemptsCount: 1, overallPercent: 70 }),
    ]),
    60,
  );
});
