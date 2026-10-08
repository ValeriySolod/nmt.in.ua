"use client";

import Link from "next/link";
import clsx from "clsx";
import {
  formatPercent,
  formatSpeed,
  getScoreLevel,
  type TopicResultRow,
} from "@/modules/results/types";
import { useTranslations } from "next-intl";
import { Pagination } from "@/components/ui/Pagination";
import { paginateSlice } from "@/lib/pagination";
import { ThemeSelfScoreCell } from "./ThemeSelfScoreCell";
import { TopicResultsMobileSwiper } from "./TopicResultsMobileSwiper";
import css from "./TopicResultsTable.module.css";

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

type TopicResultsTableBodyProps = {
  rows: TopicResultRow[];
  readOnly: boolean;
  page: number;
  pathname: string;
  queryParams: Record<string, string | null | undefined>;
};

export function TopicResultsTableBody({
  rows,
  readOnly,
  page,
  pathname,
  queryParams,
}: TopicResultsTableBodyProps) {
  const t = useTranslations("TopicResultsTable");
  const paginated = paginateSlice(rows, page);

  return (
    <>
      <TopicResultsMobileSwiper rows={rows} readOnly={readOnly} />

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
            {paginated.items.map((row) => (
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

      <div className={css.desktopPager}>
        <Pagination
          pathname={pathname}
          page={paginated.page}
          totalPages={paginated.totalPages}
          total={paginated.total}
          queryParams={queryParams}
        />
      </div>
    </>
  );
}
