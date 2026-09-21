import Link from "next/link";
import clsx from "clsx";
import {
  formatPercent,
  formatSpeed,
  getScoreLevel,
  type TopicResultRow,
} from "@/modules/results/types";
import { getTranslations } from "next-intl/server";
import { ThemeSelfScoreCell } from "./ThemeSelfScoreCell";
import css from "./TopicResultsTable.module.css";

type TopicResultsTableProps = {
  rows: TopicResultRow[];
  /** When viewing another student's results (teacher), hide editable self-score. */
  readOnly?: boolean;
  title?: string;
  lead?: string;
  /** Only themes that already have attempts (teacher overview). */
  hideEmptyThemes?: boolean;
  /** Nested under another page heading. */
  headingLevel?: "h1" | "h2";
};

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

export async function TopicResultsTable({
  rows,
  readOnly = false,
  title,
  lead,
  hideEmptyThemes = false,
  headingLevel = "h1",
}: TopicResultsTableProps) {
  const t = await getTranslations("TopicResultsTable");
  const visible = hideEmptyThemes
    ? rows.filter((row) => row.attemptsCount > 0)
    : rows;
  const TitleTag = headingLevel === "h2" ? "h2" : "h1";

  return (
    <section className={css.topicResults} aria-labelledby="topic-results-title">
      <header className={css.intro}>
        <TitleTag id="topic-results-title" className={css.title}>
          {title ?? t("title")}
        </TitleTag>

        <p className={css.lead}>{lead ?? t("lead")}</p>
      </header>

      {visible.length === 0 ? (
        <p className={css.hint} role="status">
          {t("emptyAttempts")}
        </p>
      ) : (
        <div className={css.tableWrap}>
          <table className={css.table}>
            <thead>
              <tr>
                <th scope="col">{t("topic")}</th>
                <th scope="col">{t("attempts")}</th>
                <th scope="col">{t("overall")}</th>
                <th scope="col">{t("lastThree")}</th>
                <th scope="col">{t("speed")}</th>
                {readOnly ? null : <th scope="col">{t("selfScore")}</th>}
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={row.themeId}>
                  <td className={css.themeCell}>
                    <Link
                      href={`/materials/textbook?topic=${encodeURIComponent(row.themeCode)}`}
                      className={css.themeLink}
                    >
                      {row.displayIndex}. {row.themeName}
                    </Link>
                  </td>
                  <td className={clsx(css.metric, css.metricNone)}>
                    {row.attemptsCount > 0 ? row.attemptsCount : "—"}
                  </td>
                  <td
                    className={clsx(css.metric, metricClass(row.overallPercent))}
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
                  {readOnly ? null : (
                    <td className={css.selfScoreTd}>
                      <ThemeSelfScoreCell
                        themeId={row.themeId}
                        value={row.selfScore ?? null}
                        labels={{
                          aria: t("selfScoreAria", { theme: row.themeName }),
                          errorGeneric: t("selfScoreError"),
                        }}
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className={css.hint}>{readOnly ? t("hintTeacher") : t("hint")}</p>
    </section>
  );
}
