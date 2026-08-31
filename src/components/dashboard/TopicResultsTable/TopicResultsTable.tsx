import clsx from "clsx";
import {
  formatPercent,
  formatSpeed,
  getScoreLevel,
  type TopicResultRow,
} from "@/modules/results/types";
import css from "./TopicResultsTable.module.css";

type TopicResultsTableProps = {
  rows: TopicResultRow[];
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

export function TopicResultsTable({ rows }: TopicResultsTableProps) {
  return (
    <section className={css.topicResults} aria-labelledby="topic-results-title">
      <header className={css.intro}>
        <h1 id="topic-results-title" className={css.title}>
          Результати за темами
        </h1>
        <p className={css.lead}>
          Прогрес по темах: загальний відсоток, останні спроби та середня
          швидкість відповідей.
        </p>
      </header>

      <div className={css.tableWrap}>
        <table className={css.table}>
          <thead>
            <tr>
              <th scope="col">Тема</th>
              <th scope="col">Всього</th>
              <th scope="col">Останні 3 тести</th>
              <th scope="col">Швидкість, с/завдання</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.themeId}>
                <td className={css.themeCell}>
                  {row.displayIndex}. {row.themeName}
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className={css.hint}>
        Порожні комірки — теми без завершених спроб. Кольори: зелений ≥70%,
        жовтий 40–69%, червоний &lt;40%.
      </p>
    </section>
  );
}
