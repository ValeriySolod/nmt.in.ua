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
import { ThemeSelfScoreCell } from "./ThemeSelfScoreCell";
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

type TopicResultCardProps = {
  row: TopicResultRow;
  readOnly: boolean;
  slideIndex: number;
};

export function TopicResultCard({
  row,
  readOnly,
  slideIndex,
}: TopicResultCardProps) {
  const t = useTranslations("TopicResultsTable");

  return (
    <article className={css.card}>
      <div className={css.cardTop}>
        <div className={css.cardTitleBlock}>
          <span className={css.cardIndex}>#{slideIndex + 1}</span>
          <Link
            href={`/materials/textbook?topic=${encodeURIComponent(row.themeCode)}`}
            className={css.cardThemeLink}
          >
            {row.displayIndex}. {row.themeName}
          </Link>
        </div>
        <span
          className={clsx(css.score, metricClass(row.overallPercent))}
        >
          {formatPercent(row.overallPercent)}
        </span>
      </div>

      <dl className={css.meta}>
        <div>
          <dt>{t("attempts")}</dt>
          <dd>{row.attemptsCount > 0 ? row.attemptsCount : "—"}</dd>
        </div>
        <div>
          <dt>{t("lastThree")}</dt>
          <dd className={metricClass(row.lastThreePercent)}>
            {formatPercent(row.lastThreePercent)}
          </dd>
        </div>
        <div className={css.metaWide}>
          <dt>{t("speed")}</dt>
          <dd>{formatSpeed(row.avgSecondsPerTask)}</dd>
        </div>
      </dl>

      {readOnly ? null : (
        <div className={css.cardFoot}>
          <span className={css.cardFootLabel}>{t("selfScore")}</span>
          <ThemeSelfScoreCell
            themeId={row.themeId}
            value={row.selfScore ?? null}
            labels={{
              aria: t("selfScoreAria", { theme: row.themeName }),
              errorGeneric: t("selfScoreError"),
            }}
          />
        </div>
      )}
    </article>
  );
}
