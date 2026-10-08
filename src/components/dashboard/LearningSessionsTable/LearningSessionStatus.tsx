"use client";

import clsx from "clsx";
import { useTranslations } from "next-intl";
import type { LearningSessionRow } from "@/modules/sessions/types";
import css from "./LearningSessionsTable.module.css";

function statusClass(status: LearningSessionRow["status"]): string {
  if (status === "completed") return css.statusCompleted;
  if (status === "expired") return css.statusExpired;
  return css.statusPlanned;
}

export function SessionStatusBlock({ row }: { row: LearningSessionRow }) {
  const t = useTranslations("LearningSessionsTable");

  return (
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
  );
}
