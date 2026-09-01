"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
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
  return status === "completed" ? css.statusCompleted : css.statusPlanned;
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
  const [showExtendedInfo, setShowExtendedInfo] = useState(false);

  return (
    <section
      className={css.learningSessions}
      aria-labelledby="learning-sessions-title"
    >
      <header className={css.intro}>
        <h1 id="learning-sessions-title" className={css.title}>
          Навчальні сесії
        </h1>
        <div className={css.descriptionRow}>
          <p className={css.lead}>
            Історія тестових сесій і заплановані тренування. Старт відкриває
            проходження тесту за темою.
          </p>

          {rows.length > 0 ? (
            <div className={css.tableControls}>
              <button
                type="button"
                className={css.detailsToggle}
                aria-expanded={showExtendedInfo}
                aria-controls="learning-sessions-table"
                onClick={() => setShowExtendedInfo((current) => !current)}
              >
                {showExtendedInfo
                  ? "Стисла інформація"
                  : "Розширена інформація"}
              </button>
            </div>
          ) : null}
        </div>
      </header>

      {rows.length === 0 ? (
        <p className={css.empty} role="status">
          Сесій поки немає. Запустіть тест на головній сторінці.
        </p>
      ) : (
        <div
          id="learning-sessions-table"
          className={css.tableWrap}
          tabIndex={showExtendedInfo ? 0 : undefined}
          aria-label={
            showExtendedInfo
              ? "Розширена таблиця сесій, прокручуйте горизонтально"
              : "Скорочена таблиця сесій"
          }
        >
          <table
            className={clsx(
              css.table,
              showExtendedInfo && css.tableExpanded,
            )}
          >
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Назва теми</th>
                {showExtendedInfo ? (
                  <>
                    <th scope="col">Завдань</th>
                    <th scope="col">Вірно</th>
                  </>
                ) : null}
                <th scope="col">%</th>
                {showExtendedInfo ? <th scope="col">Час, с</th> : null}
                <th scope="col">Час/тест</th>
                {showExtendedInfo ? (
                  <>
                    <th scope="col">Дата/час старту</th>
                    <th scope="col">Ким створено</th>
                  </>
                ) : null}
                <th scope="col">Статус</th>
                <th scope="col">Дії</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.rowNumber}</td>
                  <td className={css.themeCell}>{row.themeName}</td>
                  {showExtendedInfo ? (
                    <>
                      <td>{row.tasksNumber}</td>
                      <td>{row.rightNumber}</td>
                    </>
                  ) : null}
                  <td>{formatPercent(row.percent)}</td>
                  {showExtendedInfo ? (
                    <td>{formatDurationSeconds(row.timeSec)}</td>
                  ) : null}
                  <td>{formatTimePerTask(row.timePerTaskSec)}</td>
                  {showExtendedInfo ? (
                    <>
                      <td className={css.startTimeCell}>
                        {row.startTimeLabel}
                      </td>
                      <td className={css.createdByCell}>
                        {row.createdByLabel}
                      </td>
                    </>
                  ) : null}
                  <td className={css.statusCell}>
                    <span className={clsx(statusClass(row.status))}>
                      {row.statusLabel}
                    </span>
                  </td>
                  <td className={css.actionsCell}>
                    <SessionActions row={row} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className={css.hint}>
        Заплановані сесії «Авто» зʼявляються після завершення тестів зі
        слабким результатом. Натисніть «Старт», щоб розпочати.
      </p>
    </section>
  );
}
