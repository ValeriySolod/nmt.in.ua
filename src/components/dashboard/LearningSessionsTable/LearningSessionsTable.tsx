"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import {
  cancelLearningSessionAction,
  type CancelLearningSessionActionState,
} from "@/modules/sessions/actions";
import type { LearningSessionRow } from "@/modules/sessions/types";
import {
  formatDurationSeconds,
  formatTimePerTask,
} from "@/modules/sessions/types";
import { useTranslations } from "next-intl";
import { queryHref } from "@/lib/queryHref";
import css from "./LearningSessionsTable.module.css";

const CANCEL_INITIAL: CancelLearningSessionActionState = { status: "idle" };

type LearningSessionsTableProps = {
  rows: LearningSessionRow[];
  extended?: boolean;
  /** Hide start/cancel — for teacher viewing a student's sessions. */
  readOnly?: boolean;
  title?: string;
  lead?: string;
  empty?: string;
  /** Kept when toggling compact/extended (e.g. `student`). */
  queryParams?: Record<string, string | null | undefined>;
};

function formatPercent(percent: number | null): string {
  if (percent === null) return "—";
  return `${Math.round(percent)}%`;
}

function statusClass(status: LearningSessionRow["status"]): string {
  if (status === "completed") return css.statusCompleted;
  if (status === "expired") return css.statusExpired;
  return css.statusPlanned;
}

function SessionActions({ row }: { row: LearningSessionRow }) {
  const t = useTranslations("LearningSessionsTable");

  const [state, formAction, pending] = useActionState(
    cancelLearningSessionAction,
    CANCEL_INITIAL,
  );

  if (row.status === "completed") {
    return null;
  }

  const waiting = row.status === "planned" && !row.canStart;

  return (
    <div className={css.actions}>
      {row.status === "expired" ? null : waiting ? (
        <span className={css.scheduledBadge} title={row.availableAtLabel ?? undefined}>
          {t("opensAt", { date: row.availableAtLabel ?? "—" })}
        </span>
      ) : (
        <Link href={`/session/${row.id}`} className={css.startLink}>
          {t("start")}
        </Link>
      )}
      <form
        action={formAction}
        className={css.cancelForm}
        onSubmit={(event) => {
          if (!window.confirm(t("cancelConfirm", { theme: row.themeName }))) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="sessionId" value={row.id} />
        <button
          type="submit"
          className={css.cancelButton}
          disabled={pending}
          aria-label={t("cancelSession", { id: row.id })}
        >
          ×
        </button>
      </form>
      {state.status === "error" ? (
        <span className={css.error} role="alert">
          {t(`errors.${state.code}`)}
        </span>
      ) : null}
    </div>
  );
}

export function LearningSessionsTable({
  rows,
  extended = false,
  readOnly = false,
  title,
  lead,
  empty,
  queryParams,
}: LearningSessionsTableProps) {
  const t = useTranslations("LearningSessionsTable");
  const router = useRouter();
  const showExtendedInfo = extended;

  return (
    <section
      className={css.learningSessions}
      aria-labelledby="learning-sessions-title"
    >
      <header className={css.intro}>
        <h1 id="learning-sessions-title" className={css.title}>
          {title ?? t("title")}
        </h1>
        <div className={css.descriptionRow}>
          <p className={css.lead}>{lead ?? t("lead")}</p>
          {rows.length > 0 && !readOnly ? (
            <div className={css.tableControls}>
              <button
                type="button"
                className={css.detailsToggle}
                aria-expanded={showExtendedInfo}
                aria-controls="learning-sessions-table"
                onClick={() =>
                  router.replace(
                    queryHref("/sessions", {
                      ...queryParams,
                      extended: showExtendedInfo ? null : "1",
                    }),
                    { scroll: false },
                  )
                }
              >
                {showExtendedInfo ? t("compactInfo") : t("extendedInfo")}
              </button>
            </div>
          ) : null}
        </div>
      </header>

      {rows.length === 0 ? (
        <p className={css.empty} role="status">
          {empty ?? t("empty")}
        </p>
      ) : (
        <div
          id="learning-sessions-table"
          className={css.tableWrap}
          aria-label={
            showExtendedInfo ? t("tableAriaExtended") : t("tableAria")
          }
        >
          <table
            className={clsx(css.table, showExtendedInfo && css.tableExpanded)}
          >
            <thead>
              <tr>
                <th scope="col" className={css.colIndex}>
                  #
                </th>
                <th scope="col" className={css.colTheme}>
                  {t("theme")}
                </th>
                {showExtendedInfo ? (
                  <>
                    <th scope="col" className={css.colNarrow}>
                      {t("tasks")}
                    </th>
                    <th scope="col" className={css.colNarrow}>
                      {t("correct")}
                    </th>
                  </>
                ) : null}
                <th scope="col" className={css.colNarrow}>
                  %
                </th>
                {showExtendedInfo ? (
                  <th scope="col" className={css.colNarrow}>
                    {t("timeSeconds")}
                  </th>
                ) : null}
                <th scope="col" className={css.colTimePer}>
                  {t("timePerTest")}
                </th>
                {showExtendedInfo ? (
                  <>
                    <th scope="col" className={css.colDate}>
                      {t("startDate")}
                    </th>
                    <th scope="col" className={css.colCreatedBy}>
                      {t("createdBy")}
                    </th>
                  </>
                ) : null}
                <th scope="col" className={css.colStatus}>
                  {t("status")}
                </th>
                {readOnly ? null : (
                  <th scope="col" className={css.colActions}>
                    {t("actions")}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className={css.colIndex}>{row.rowNumber}</td>
                  <td className={css.colTheme}>{row.themeName}</td>
                  {showExtendedInfo ? (
                    <>
                      <td className={css.colNarrow}>{row.tasksNumber}</td>
                      <td className={css.colNarrow}>{row.rightNumber}</td>
                    </>
                  ) : null}
                  <td className={css.colNarrow}>
                    {formatPercent(row.percent)}
                  </td>
                  {showExtendedInfo ? (
                    <td className={css.colNarrow}>
                      {formatDurationSeconds(row.timeSec)}
                    </td>
                  ) : null}
                  <td className={css.colTimePer}>
                    {formatTimePerTask(row.timePerTaskSec)}
                  </td>
                  {showExtendedInfo ? (
                    <>
                      <td className={css.colDate}>{row.startTimeLabel}</td>
                      <td className={css.colCreatedBy}>
                        {t(`createdByValues.${row.createdBy}`)}
                      </td>
                    </>
                  ) : null}
                  <td className={css.colStatus}>
                    <div className={css.statusStack}>
                      <span className={clsx(statusClass(row.status))}>
                        {t(`statuses.${row.status}`)}
                      </span>
                      {row.availableAtLabel && row.status === "planned" ? (
                        <span className={css.scheduledHint}>
                          {t("opensAt", { date: row.availableAtLabel })}
                        </span>
                      ) : null}
                      {row.dueAtLabel &&
                      row.status === "planned" &&
                      row.createdBy === "mentor" ? (
                        <span className={css.scheduledHint}>
                          {t("dueAt", { date: row.dueAtLabel })}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  {readOnly ? null : (
                    <td className={css.colActions}>
                      <SessionActions row={row} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className={css.hint}>{t("hint")}</p>
    </section>
  );
}
