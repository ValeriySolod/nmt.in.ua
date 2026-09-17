"use client";

import Link from "next/link";
import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import {
  deleteQuizTaskAction,
  type DeleteQuizTaskActionState,
} from "@/modules/admin-content/actions";
import type {
  AdminQuizTaskListItem,
  AdminThemeOption,
} from "@/modules/admin-content/types";
import { Select } from "@/components/ui/Select";
import css from "./AdminContentEditor.module.css";

const DELETE_INITIAL: DeleteQuizTaskActionState = { status: "idle" };

function formatThemeLabel(index: number, theme: AdminThemeOption): string {
  return `${index + 1}. ${theme.name}`;
}

type AdminContentEditorProps = {
  themes: AdminThemeOption[];
  initialThemeId?: number;
  initialTasks: AdminQuizTaskListItem[];
};

export function AdminContentEditor({
  themes,
  initialThemeId,
  initialTasks,
}: AdminContentEditorProps) {
  const t = useTranslations("AdminContent");
  const router = useRouter();
  const [themeId, setThemeId] = useState<number | null>(
    initialThemeId ?? themes[0]?.id ?? null,
  );
  const [, startTransition] = useTransition();

  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteQuizTaskAction,
    DELETE_INITIAL,
  );

  useEffect(() => {
    if (deleteState.status === "success") {
      startTransition(() => {
        router.refresh();
      });
    }
  }, [deleteState, router, startTransition]);

  function onThemeChange(next: number) {
    setThemeId(next);
    startTransition(() => {
      router.push(`/?theme=${next}`);
    });
  }

  const selectedTheme = themes.find((theme) => theme.id === themeId);
  const tasks = initialTasks;

  return (
    <div className={css.layout}>
      <section className={css.panel} aria-labelledby="admin-theme-title">
        <h2 id="admin-theme-title" className={css.srOnly}>
          {t("themeTitle")}
        </h2>
        <label className={css.themeField}>
          <span className={css.themeLabel}>{t("chooseTheme")}</span>
          <Select
            value={themeId != null ? String(themeId) : ""}
            placeholder={t("noThemes")}
            disabled={themes.length === 0}
            options={themes.map((theme, index) => ({
              value: String(theme.id),
              label: formatThemeLabel(index, theme),
            }))}
            onChange={(next) => {
              const parsed = Number(next);
              if (Number.isInteger(parsed) && parsed > 0) onThemeChange(parsed);
            }}
          />
        </label>
        {selectedTheme ? (
          <p className={css.themeMeta}>
            {t("taskCount", { count: selectedTheme.taskCount })}
          </p>
        ) : null}
      </section>

      <section className={css.panel} aria-labelledby="admin-tasks-title">
        <div className={css.listHeader}>
          <div>
            <h2 id="admin-tasks-title" className={css.panelTitle}>
              {t("listTitle")}
            </h2>
            <p className={css.panelLead}>{t("listLead")}</p>
          </div>
          {themeId ? (
            <Link
              href={`/tasks/new?theme=${themeId}`}
              className={css.createBtn}
            >
              {t("create")}
            </Link>
          ) : (
            <button type="button" className={css.createBtn} disabled>
              {t("create")}
            </button>
          )}
        </div>

        {tasks.length === 0 ? (
          <p className={css.empty}>{t("empty")}</p>
        ) : (
          <div className={css.tableWrap}>
            <table className={css.table}>
              <thead>
                <tr>
                  <th scope="col">{t("colDescription")}</th>
                  <th scope="col" className={css.colDifficulty}>
                    {t("colDifficulty")}
                  </th>
                  <th scope="col" className={css.colAction}>
                    {t("colEdit")}
                  </th>
                  <th scope="col" className={css.colAction}>
                    {t("colDelete")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id}>
                    <td>
                      <span className={css.taskName}>{task.name}</span>
                    </td>
                    <td className={css.colDifficulty}>
                      <span className={css.diffBadge}>{task.difficulty}</span>
                    </td>
                    <td className={css.colAction}>
                      <Link
                        href={`/tasks/${task.id}`}
                        className={css.editBtn}
                        aria-label={t("editAria", { name: task.name })}
                      >
                        <span aria-hidden>|</span>
                      </Link>
                    </td>
                    <td className={css.colAction}>
                      <form
                        action={deleteAction}
                        onSubmit={(event) => {
                          if (
                            !window.confirm(
                              t("deleteConfirm", { name: task.name }),
                            )
                          ) {
                            event.preventDefault();
                          }
                        }}
                      >
                        <input type="hidden" name="taskId" value={task.id} />
                        <button
                          type="submit"
                          className={css.deleteBtn}
                          aria-label={t("deleteAria", { name: task.name })}
                          disabled={deletePending}
                        >
                          <span aria-hidden>×</span>
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {deleteState.status === "error" ? (
          <p className={clsx(css.alert, css.alertError)} role="alert">
            {t(`errors.${deleteState.code}`)}
          </p>
        ) : null}
        {deleteState.status === "success" ? (
          <p className={clsx(css.alert, css.alertSuccess)} role="status">
            {t("deleted")}
          </p>
        ) : null}
      </section>
    </div>
  );
}
