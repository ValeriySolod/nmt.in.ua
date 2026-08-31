"use client";

import Link from "next/link";
import { useActionState } from "react";
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
import css from "./LearningSessionsTable.module.css";

const CANCEL_INITIAL: CancelLearningSessionActionState = { status: "idle" };

type LearningSessionsTableProps = {
  rows: LearningSessionRow[];
};

function formatPercent(percent: number | null): string {
  if (percent === null) return "—";
  return `${Math.round(percent)}%`;
}

function statusClass(status: LearningSessionRow["status"]): string {
  switch (status) {
    case "completed":
      return css.statusCompleted;
    case "planned":
      return css.statusPlanned;
    default:
      return css.statusInProgress;
  }
}

function SessionActions({ row }: { row: LearningSessionRow }) {
  const [state, formAction, pending] = useActionState(
    cancelLearningSessionAction,
    CANCEL_INITIAL,
  );

  if (row.status === "completed") {
    return null;
  }

  return (
    <div className={css.actions}>
      <Link href={`/session/${row.id}`} className={css.startLink}>
        Старт
      </Link>
      <form action={formAction}>
        <input type="hidden" name="sessionId" value={row.id} />
        <button
          type="submit"
          className={css.cancelButton}
          disabled={pending}
          aria-label={`Скасувати сесію ${row.id}`}
        >
          ×
        </button>
      </form>
      {state.status === "error" ? (
        <span className={css.error} role="alert">
          {state.message}
        </span>
      ) : null}
    </div>
  );
}

export function LearningSessionsTable({ rows }: LearningSessionsTableProps) {
  return (
    <section
      className={css.learningSessions}
      aria-labelledby="learning-sessions-title"
    >
      <header className={css.intro}>
        <h1 id="learning-sessions-title" className={css.title}>
          Навчальні сесії
        </h1>
        <p className={css.lead}>
          Історія тестових сесій і заплановані тренування. Старт відкриває
          проходження тесту за темою.
        </p>
      </header>

      {rows.length === 0 ? (
        <p className={css.empty} role="status">
          Сесій поки немає. Запустіть тест на головній сторінці.
        </p>
      ) : (
        <div className={css.tableWrap}>
          <table className={css.table}>
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Назва теми</th>
                <th scope="col">Завдань</th>
                <th scope="col">Вірно</th>
                <th scope="col">%</th>
                <th scope="col">Час, с</th>
                <th scope="col">Час/тест</th>
                <th scope="col">Дата/час старту</th>
                <th scope="col">Ким створено</th>
                <th scope="col">Статус</th>
                <th scope="col">Дії</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.rowNumber}</td>
                  <td className={css.themeCell}>{row.themeName}</td>
                  <td>{row.tasksNumber}</td>
                  <td>{row.rightNumber}</td>
                  <td>{formatPercent(row.percent)}</td>
                  <td>{formatDurationSeconds(row.timeSec)}</td>
                  <td>{formatTimePerTask(row.timePerTaskSec)}</td>
                  <td>{row.startTimeLabel}</td>
                  <td>{row.createdByLabel}</td>
                  <td>
                    <span className={clsx(statusClass(row.status))}>
                      {row.statusLabel}
                    </span>
                  </td>
                  <td>
                    <SessionActions row={row} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className={css.hint}>
        Заплановані сесії «Авто» / «Ментор» зʼявляться після модуля
        рекомендацій.
      </p>
    </section>
  );
}
