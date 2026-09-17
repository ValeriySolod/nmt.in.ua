"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { useTranslations } from "next-intl";
import { Select } from "@/components/ui/Select";
import type { TeacherLearningSessionRow } from "@/modules/sessions/teacherLearningSessions";
import {
  formatDurationSeconds,
  formatTimePerTask,
  type SessionCreatedBy,
  type SessionDisplayStatus,
} from "@/modules/sessions/types";
import { formatPercent, getScoreLevel } from "@/modules/results/types";
import { queryHref } from "@/lib/queryHref";
import css from "./TeacherClassSessions.module.css";

type SortKey = "newest" | "worst" | "best" | "theme" | "student";
type StatusFilter = "all" | SessionDisplayStatus;
type CreatedFilter = "all" | SessionCreatedBy;

function scoreClass(percent: number | null): string {
  switch (getScoreLevel(percent)) {
    case "high":
      return css.scoreHigh;
    case "medium":
      return css.scoreMedium;
    case "low":
      return css.scoreLow;
    default:
      return css.scoreNone;
  }
}

function statusClass(status: TeacherLearningSessionRow["status"]): string {
  if (status === "completed") return css.statusCompleted;
  if (status === "expired") return css.statusExpired;
  return css.statusPlanned;
}

function comparePercent(
  a: number | null,
  b: number | null,
  direction: "asc" | "desc",
): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return direction === "asc" ? a - b : b - a;
}

type TeacherClassSessionsProps = {
  rows: TeacherLearningSessionRow[];
};

export function TeacherClassSessions({ rows }: TeacherClassSessionsProps) {
  const t = useTranslations("TeacherStudentSessions");
  const [sortBy, setSortBy] = useState<SortKey>("newest");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [themeFilter, setThemeFilter] = useState("all");
  const [createdFilter, setCreatedFilter] = useState<CreatedFilter>("all");

  const themeOptions = useMemo(() => {
    const map = new Map<number, string>();
    for (const row of rows) {
      if (!map.has(row.themeId)) map.set(row.themeId, row.themeName);
    }
    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "uk"));
  }, [rows]);

  const visible = useMemo(() => {
    let list = rows.slice();
    if (statusFilter !== "all") {
      list = list.filter((row) => row.status === statusFilter);
    }
    if (themeFilter !== "all") {
      const themeId = Number(themeFilter);
      list = list.filter((row) => row.themeId === themeId);
    }
    if (createdFilter !== "all") {
      list = list.filter((row) => row.createdBy === createdFilter);
    }

    list.sort((a, b) => {
      switch (sortBy) {
        case "worst":
          return (
            comparePercent(a.percent, b.percent, "asc") || b.id - a.id
          );
        case "best":
          return (
            comparePercent(a.percent, b.percent, "desc") || b.id - a.id
          );
        case "theme":
          return (
            a.themeName.localeCompare(b.themeName, "uk") || b.id - a.id
          );
        case "student":
          return (
            a.studentDisplayName.localeCompare(b.studentDisplayName, "uk") ||
            b.id - a.id
          );
        case "newest":
        default:
          return b.id - a.id;
      }
    });

    return list;
  }, [rows, sortBy, statusFilter, themeFilter, createdFilter]);

  return (
    <section className={css.root} aria-labelledby="class-sessions-title">
      <header className={css.intro}>
        <h1 id="class-sessions-title" className={css.title}>
          {t("allTitle")}
        </h1>
        <p className={css.lead}>{t("allLead")}</p>
      </header>

      {rows.length === 0 ? (
        <p className={css.empty} role="status">
          {t("emptyClass")}
        </p>
      ) : (
        <>
          <div className={css.toolbar}>
            <label className={css.field}>
              <span className={css.label}>{t("sortBy")}</span>
              <Select
                value={sortBy}
                onChange={(value) => setSortBy(value as SortKey)}
                options={[
                  { value: "newest", label: t("sortNewest") },
                  { value: "worst", label: t("sortWorst") },
                  { value: "best", label: t("sortBest") },
                  { value: "theme", label: t("sortTheme") },
                  { value: "student", label: t("sortStudent") },
                ]}
              />
            </label>
            <label className={css.field}>
              <span className={css.label}>{t("filterStatus")}</span>
              <Select
                value={statusFilter}
                onChange={(value) => setStatusFilter(value as StatusFilter)}
                options={[
                  { value: "all", label: t("filterAll") },
                  { value: "completed", label: t("statuses.completed") },
                  { value: "planned", label: t("statuses.planned") },
                  { value: "expired", label: t("statuses.expired") },
                ]}
              />
            </label>
            <label className={css.field}>
              <span className={css.label}>{t("filterTheme")}</span>
              <Select
                value={themeFilter}
                onChange={setThemeFilter}
                options={[
                  { value: "all", label: t("filterAll") },
                  ...themeOptions.map((theme) => ({
                    value: String(theme.id),
                    label: theme.name,
                  })),
                ]}
              />
            </label>
            <label className={css.field}>
              <span className={css.label}>{t("filterCreatedBy")}</span>
              <Select
                value={createdFilter}
                onChange={(value) => setCreatedFilter(value as CreatedFilter)}
                options={[
                  { value: "all", label: t("filterAll") },
                  { value: "user", label: t("createdByValues.user") },
                  { value: "mentor", label: t("createdByValues.mentor") },
                  { value: "auto", label: t("createdByValues.auto") },
                ]}
              />
            </label>
          </div>

          <p className={css.count} aria-live="polite">
            {t("showing", { shown: visible.length, total: rows.length })}
          </p>

          {visible.length === 0 ? (
            <p className={css.empty} role="status">
              {t("filterEmpty")}
            </p>
          ) : (
            <>
              <ul className={css.cardList}>
                {visible.map((row) => (
                  <li key={row.id} className={css.card}>
                    <div className={css.cardTop}>
                      <Link
                        href={queryHref("/sessions", {
                          student: String(row.studentUserId),
                        })}
                        className={css.studentLink}
                      >
                        <span className={css.studentName}>
                          {row.studentDisplayName}
                        </span>
                        <span className={css.login}>@{row.studentLogin}</span>
                      </Link>
                      <span
                        className={clsx(css.score, scoreClass(row.percent))}
                      >
                        {formatPercent(row.percent)}
                      </span>
                    </div>
                    <p className={css.theme}>{row.themeName}</p>
                    <dl className={css.meta}>
                      <div>
                        <dt>{t("scoreDetail")}</dt>
                        <dd>
                          {row.rightNumber}/{row.tasksNumber}
                        </dd>
                      </div>
                      <div>
                        <dt>{t("time")}</dt>
                        <dd>{formatDurationSeconds(row.timeSec)}</dd>
                      </div>
                      <div>
                        <dt>{t("speed")}</dt>
                        <dd>{formatTimePerTask(row.timePerTaskSec)}</dd>
                      </div>
                      <div>
                        <dt>{t("when")}</dt>
                        <dd>{row.startTimeLabel}</dd>
                      </div>
                    </dl>
                    <div className={css.cardFoot}>
                      <span
                        className={clsx(css.status, statusClass(row.status))}
                      >
                        {t(`statuses.${row.status}`)}
                      </span>
                      <span className={css.createdBy}>
                        {t(`createdByValues.${row.createdBy}`)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>

              <div className={css.tableWrap}>
                <table className={css.table}>
                  <thead>
                    <tr>
                      <th scope="col" className={css.colStudent}>
                        {t("student")}
                      </th>
                      <th scope="col" className={css.colTheme}>
                        {t("theme")}
                      </th>
                      <th scope="col" className={css.colNarrow}>
                        {t("scoreDetail")}
                      </th>
                      <th scope="col" className={css.colNarrow}>
                        %
                      </th>
                      <th scope="col" className={css.colNarrow}>
                        {t("time")}
                      </th>
                      <th scope="col" className={css.colNarrow}>
                        {t("speed")}
                      </th>
                      <th scope="col" className={css.colDate}>
                        {t("when")}
                      </th>
                      <th scope="col" className={css.colCreated}>
                        {t("createdBy")}
                      </th>
                      <th scope="col" className={css.colStatus}>
                        {t("status")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((row) => (
                      <tr key={row.id}>
                        <td className={css.colStudent}>
                          <Link
                            href={queryHref("/sessions", {
                              student: String(row.studentUserId),
                            })}
                            className={css.studentLink}
                          >
                            <span className={css.studentName}>
                              {row.studentDisplayName}
                            </span>
                            <span className={css.login}>
                              @{row.studentLogin}
                            </span>
                          </Link>
                        </td>
                        <td className={css.colTheme}>{row.themeName}</td>
                        <td className={css.colNarrow}>
                          {row.rightNumber}/{row.tasksNumber}
                        </td>
                        <td className={css.colNarrow}>
                          <span
                            className={clsx(css.score, scoreClass(row.percent))}
                          >
                            {formatPercent(row.percent)}
                          </span>
                        </td>
                        <td className={css.colNarrow}>
                          {formatDurationSeconds(row.timeSec)}
                        </td>
                        <td className={css.colNarrow}>
                          {formatTimePerTask(row.timePerTaskSec)}
                        </td>
                        <td className={css.colDate}>{row.startTimeLabel}</td>
                        <td className={css.colCreated}>
                          {t(`createdByValues.${row.createdBy}`)}
                        </td>
                        <td className={css.colStatus}>
                          <span
                            className={clsx(
                              css.status,
                              statusClass(row.status),
                            )}
                          >
                            {t(`statuses.${row.status}`)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      <p className={css.hint}>{t("hint")}</p>
    </section>
  );
}
