import Link from "next/link";
import clsx from "clsx";
import {
  formatPercent,
  formatSpeed,
  getScoreLevel,
} from "@/modules/results/types";
import type {
  ClassTopicRow,
  ThemeStudentAverage,
} from "@/modules/results/teacherStudentResults";
import { getTranslations } from "next-intl/server";
import { queryHref } from "@/lib/queryHref";
import css from "../TopicResultsTable/TopicResultsTable.module.css";
import local from "./TeacherClassResults.module.css";

function metricClass(percent: number | null): string {
  switch (getScoreLevel(percent)) {
    case "high":
      return css.metricHigh;
    case "medium":
      return css.metricMedium;
    case "low":
      return css.metricLow;
    default:
      return css.metricNone;
  }
}

type TeacherClassTopicTableProps = {
  rows: ClassTopicRow[];
  selectedThemeId: number | null;
};

export async function TeacherClassTopicTable({
  rows,
  selectedThemeId,
}: TeacherClassTopicTableProps) {
  const t = await getTranslations("TeacherStudentResults");
  const visible = rows.filter((row) => row.attemptsCount > 0);

  return (
    <section className={css.topicResults} aria-labelledby="class-topics-title">
      <header className={css.intro}>
        <h1 id="class-topics-title" className={css.title}>
          {t("allTitle")}
        </h1>
        <p className={css.lead}>{t("allLead")}</p>
      </header>

      {visible.length === 0 ? (
        <p className={css.hint} role="status">
          {t("emptyClass")}
        </p>
      ) : (
        <div className={css.tableWrap}>
          <table className={css.table}>
            <thead>
              <tr>
                <th scope="col">{t("topic")}</th>
                <th scope="col">{t("studentsCol")}</th>
                <th scope="col">{t("attempts")}</th>
                <th scope="col">{t("overall")}</th>
                <th scope="col">{t("lastThree")}</th>
                <th scope="col">{t("speed")}</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => {
                const active = row.themeId === selectedThemeId;
                return (
                  <tr
                    key={row.themeId}
                    className={active ? local.rowActive : undefined}
                  >
                    <td className={css.themeCell}>
                      <Link
                        href={queryHref("/results", {
                          theme: String(row.themeId),
                        })}
                        className={css.themeLink}
                        aria-current={active ? "true" : undefined}
                      >
                        {row.displayIndex}. {row.themeName}
                      </Link>
                    </td>
                    <td className={clsx(css.metric, css.metricNone)}>
                      {row.studentsWithAttempts}
                    </td>
                    <td className={clsx(css.metric, css.metricNone)}>
                      {row.attemptsCount}
                    </td>
                    <td
                      className={clsx(
                        css.metric,
                        metricClass(row.overallPercent),
                      )}
                    >
                      {formatPercent(row.overallPercent)}
                    </td>
                    <td
                      className={clsx(
                        css.metric,
                        metricClass(row.lastThreePercent),
                      )}
                    >
                      {formatPercent(row.lastThreePercent)}
                    </td>
                    <td className={clsx(css.metric, css.metricNone)}>
                      {formatSpeed(row.avgSecondsPerTask)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className={css.hint}>{t("allHint")}</p>
    </section>
  );
}

type TeacherThemeStudentsPanelProps = {
  themeName: string;
  students: ThemeStudentAverage[];
};

export async function TeacherThemeStudentsPanel({
  themeName,
  students,
}: TeacherThemeStudentsPanelProps) {
  const t = await getTranslations("TeacherStudentResults");

  return (
    <section
      className={local.themePanel}
      aria-labelledby="theme-students-title"
    >
      <h2 id="theme-students-title" className={local.themeTitle}>
        {t("themeStudentsTitle", { theme: themeName })}
      </h2>
      <p className={local.themeLead}>{t("themeStudentsLead")}</p>

      {students.length === 0 ? (
        <p className={css.hint}>{t("themeStudentsEmpty")}</p>
      ) : (
        <ul className={local.studentList}>
          {students.map((student) => (
            <li key={student.studentUserId} className={local.studentItem}>
              <Link
                href={queryHref("/results", {
                  student: String(student.studentUserId),
                })}
                className={local.studentName}
              >
                {student.displayName}{" "}
                <span className={local.login}>@{student.login}</span>
              </Link>
              <span className={local.studentMeta}>
                {t("themeStudentMeta", {
                  attempts: student.attemptsCount,
                  percent: formatPercent(student.overallPercent),
                  speed: formatSpeed(student.avgSecondsPerTask),
                })}
              </span>
              <span
                className={clsx(
                  local.studentScore,
                  metricClass(student.overallPercent),
                )}
              >
                {formatPercent(student.overallPercent)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
