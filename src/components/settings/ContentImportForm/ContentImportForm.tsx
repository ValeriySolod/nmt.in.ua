"use client";

import { useActionState, useState } from "react";
import clsx from "clsx";
import { PagePanel, PageSection } from "@/components/dashboard/PageFrame";
import { ModeTabs } from "@/components/ui/ModeTabs";
import {
  contentImportAction,
  type ContentImportActionState,
} from "@/modules/content-import/actions";
import css from "./ContentImportForm.module.css";

const INITIAL_STATE: ContentImportActionState = { status: "idle" };

type ImportMode = "csv" | "json";

const IMPORT_MODE_OPTIONS = [
  { id: "csv" as const, label: "Три CSV" },
  { id: "json" as const, label: "Один JSON" },
];

type ContentImportFormProps = {
  importEnabled: boolean;
};

function formatCounts(counts: {
  themes: number;
  themeConnections: number;
  quizTasks: number;
}): string {
  return `теми ${counts.themes}, звʼязки ${counts.themeConnections}, завдання ${counts.quizTasks}`;
}

/** Browser UI for CSV/JSON content import via a Server Action. */
export function ContentImportForm({ importEnabled }: ContentImportFormProps) {
  const [mode, setMode] = useState<ImportMode>("csv");
  const [state, formAction, pending] = useActionState(contentImportAction, INITIAL_STATE);

  const disabled = !importEnabled || pending;
  const showUnauthorized =
    !importEnabled || state.status === "unauthorized";

  return (
    <PageSection
      id="content-import-title"
      title="Імпорт контенту"
      lead="Завантажте три CSV-файли або один JSON-документ з темами, звʼязками та завданнями. Ключ API залишається на сервері — браузер його не бачить."
    >
      {showUnauthorized ? (
        <p className={clsx(css.alert, css.alertError)} role="alert">
          Імпорт недоступний: на сервері не налаштовано ключ{" "}
          <code>CONTENT_IMPORT_API_KEY</code>.
        </p>
      ) : null}

      {state.status === "error" ? (
        <div className={clsx(css.alert, css.alertError)} role="alert">
          <p className={css.hint}>Помилки валідації:</p>
          <ul className={css.errorList}>
            {state.errors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {state.status === "success" ? (
        <div className={clsx(css.alert, css.alertSuccess)} role="status">
          <p>Імпорт успішний.</p>
          <dl className={css.summary}>
            <div>
              <dt>Додано</dt>
              <dd>{formatCounts(state.inserted)} (усього {state.totalInserted})</dd>
            </div>
            <div>
              <dt>Оновлено</dt>
              <dd>{formatCounts(state.updated)} (усього {state.totalUpdated})</dd>
            </div>
          </dl>
        </div>
      ) : null}

      <PagePanel>
        <ModeTabs
          value={mode}
          onChange={setMode}
          options={IMPORT_MODE_OPTIONS}
          disabled={disabled}
          ariaLabel="Формат імпорту"
        />

        {mode === "csv" ? (
          <form action={formAction} className={css.formBody}>
            <div className={css.field}>
              <label className={css.label} htmlFor="import-themes">
                themes.csv
              </label>
              <p className={css.hint}>Колонки: id, name, description, ord</p>
              <input
                id="import-themes"
                className={css.fileInput}
                type="file"
                name="themes"
                accept=".csv,text/csv"
                required
                disabled={disabled}
              />
            </div>
            <div className={css.field}>
              <label className={css.label} htmlFor="import-theme-connections">
                theme_connections.csv
              </label>
              <p className={css.hint}>Колонки: id, vertex_start, vertex_finish</p>
              <input
                id="import-theme-connections"
                className={css.fileInput}
                type="file"
                name="themeConnections"
                accept=".csv,text/csv"
                required
                disabled={disabled}
              />
            </div>
            <div className={css.field}>
              <label className={css.label} htmlFor="import-quiz-tasks">
                quiz_tasks.csv
              </label>
              <p className={css.hint}>
                Колонки: id, name, task_text, theme_id, answer_1…answer_4,
                right_answer_n, comments
              </p>
              <input
                id="import-quiz-tasks"
                className={css.fileInput}
                type="file"
                name="quizTasks"
                accept=".csv,text/csv"
                required
                disabled={disabled}
              />
            </div>
            <button type="submit" className={css.submit} disabled={disabled}>
              {pending ? "Імпорт…" : "Імпортувати CSV"}
            </button>
          </form>
        ) : (
          <form action={formAction} className={css.formBody}>
            <input type="hidden" name="format" value="json" />
            <div className={css.field}>
              <label className={css.label} htmlFor="import-json">
                import.json
              </label>
              <p className={css.hint}>
                Обʼєкт з масивами themes, themeConnections, quizTasks (див. README).
              </p>
              <input
                id="import-json"
                className={css.fileInput}
                type="file"
                name="file"
                accept=".json,application/json"
                required
                disabled={disabled}
              />
            </div>
            <button type="submit" className={css.submit} disabled={disabled}>
              {pending ? "Імпорт…" : "Імпортувати JSON"}
            </button>
          </form>
        )}
      </PagePanel>
    </PageSection>
  );
}
