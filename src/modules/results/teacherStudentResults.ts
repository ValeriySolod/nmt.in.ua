import { getTopicResults } from "./getTopicResults";
import {
  type TopicResultRow,
} from "./types";

export type TeacherRosterStudent = {
  studentUserId: number;
  login: string;
  displayName: string;
};

export type StudentTopicBundle = {
  student: TeacherRosterStudent;
  rows: TopicResultRow[];
  /** Mean of theme overall% where the student has attempts; null if none. */
  overallAverage: number | null;
};

export type ClassTopicRow = TopicResultRow & {
  studentsWithAttempts: number;
};

export type ThemeStudentAverage = {
  studentUserId: number;
  login: string;
  displayName: string;
  attemptsCount: number;
  overallPercent: number | null;
  avgSecondsPerTask: number | null;
};

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/** Lower score first; students without scores go last. */
export function compareByWorstScore(
  a: number | null,
  b: number | null,
): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return a - b;
}

export function studentOverallAverage(rows: TopicResultRow[]): number | null {
  const percents = rows
    .filter((row) => row.attemptsCount > 0 && row.overallPercent != null)
    .map((row) => row.overallPercent as number);
  return average(percents);
}

export async function loadStudentTopicBundles(
  students: TeacherRosterStudent[],
): Promise<StudentTopicBundle[]> {
  const bundles = await Promise.all(
    students.map(async (student) => {
      const rows = await getTopicResults(student.studentUserId);
      return {
        student,
        rows,
        overallAverage: studentOverallAverage(rows),
      };
    }),
  );

  return bundles.sort(
    (a, b) =>
      compareByWorstScore(a.overallAverage, b.overallAverage) ||
      a.student.displayName.localeCompare(b.student.displayName, "uk"),
  );
}

/** Class-level topic rows: averages across students who attempted the theme. */
export function buildClassTopicRows(
  bundles: StudentTopicBundle[],
): ClassTopicRow[] {
  const byTheme = new Map<
    number,
    {
      base: TopicResultRow;
      overall: number[];
      lastThree: number[];
      speed: number[];
      attempts: number;
      studentsWithAttempts: number;
    }
  >();

  for (const bundle of bundles) {
    for (const row of bundle.rows) {
      let entry = byTheme.get(row.themeId);
      if (!entry) {
        entry = {
          base: row,
          overall: [],
          lastThree: [],
          speed: [],
          attempts: 0,
          studentsWithAttempts: 0,
        };
        byTheme.set(row.themeId, entry);
      }
      entry.attempts += row.attemptsCount;
      if (row.attemptsCount > 0) {
        entry.studentsWithAttempts += 1;
        if (row.overallPercent != null) entry.overall.push(row.overallPercent);
        if (row.lastThreePercent != null) {
          entry.lastThree.push(row.lastThreePercent);
        }
        if (row.avgSecondsPerTask != null) {
          entry.speed.push(row.avgSecondsPerTask);
        }
      }
    }
  }

  return [...byTheme.values()]
    .map(({ base, overall, lastThree, speed, attempts, studentsWithAttempts }) => ({
      themeId: base.themeId,
      themeCode: base.themeCode,
      themeName: base.themeName,
      displayIndex: base.displayIndex,
      attemptsCount: attempts,
      overallPercent: average(overall),
      lastThreePercent: average(lastThree),
      avgSecondsPerTask: average(speed),
      studentsWithAttempts,
    }))
    .sort(
      (a, b) =>
        compareByWorstScore(a.overallPercent, b.overallPercent) ||
        a.displayIndex - b.displayIndex,
    );
}

export function buildThemeStudentAverages(
  bundles: StudentTopicBundle[],
  themeId: number,
): ThemeStudentAverage[] {
  const rows: ThemeStudentAverage[] = [];
  for (const bundle of bundles) {
    const theme = bundle.rows.find((row) => row.themeId === themeId);
    if (!theme || theme.attemptsCount <= 0) continue;
    rows.push({
      studentUserId: bundle.student.studentUserId,
      login: bundle.student.login,
      displayName: bundle.student.displayName,
      attemptsCount: theme.attemptsCount,
      overallPercent: theme.overallPercent,
      avgSecondsPerTask: theme.avgSecondsPerTask,
    });
  }
  return rows.sort(
    (a, b) =>
      compareByWorstScore(a.overallPercent, b.overallPercent) ||
      a.displayName.localeCompare(b.displayName, "uk"),
  );
}
