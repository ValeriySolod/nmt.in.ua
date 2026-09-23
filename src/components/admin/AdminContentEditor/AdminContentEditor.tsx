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
  AdminQuizTaskListPage,
  AdminThemeOption,
} from "@/modules/admin-content/types";
import { queryHref } from "@/lib/queryHref";
import { Select } from "@/components/ui/Select";
import { MathText } from "@/components/ui/MathText";
import css from "./AdminContentEditor.module.css";

const DELETE_INITIAL: DeleteQuizTaskActionState = { status: "idle" };

function formatThemeLabel(index: number, theme: AdminThemeOption): string {
  return `${index + 1}. ${theme.name}`;
}

function listHref(themeId: number | null, page: number): string {
  return queryHref("/", {
    theme: themeId != null ? String(themeId) : null,
    page: page > 1 ? String(page) : null,
  });
}

type AdminContentEditorProps = {
  themes: AdminThemeOption[];
  initialThemeId?: number;
  taskPage: AdminQuizTaskListPage;
};

export function AdminContentEditor({
  themes,
  initialThemeId,
  taskPage,
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
      router.push(listHref(next, 1));
    });
  }

  const selectedTheme = themes.find((theme) => theme.id === themeId);
  const tasks = taskPage.items;
  const { page, totalPages, total } = taskPage;
  const showPager = totalPages > 1;

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
          <>
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
                        <span className={css.taskPreview}>
                          <MathText text={task.taskText} />
                        </span>
                      </td>
                      <td className={css.colDifficulty}>
                        <span className={css.diffBadge}>{task.difficulty}</span>
                      </td>
                      <td className={css.colAction}>
                        <Link
                          href={`/tasks/${task.id}`}
                          className={css.editBtn}
                          aria-label={t("editAria", { name: task.label })}
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
                                t("deleteConfirm", { name: task.label }),
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
                            aria-label={t("deleteAria", { name: task.label })}
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

            {showPager ? (
              <nav className={css.pager} aria-label={t("pagerAria")}>
                {page > 1 ? (
                  <Link
                    href={listHref(themeId, page - 1)}
                    className={css.pagerBtn}
                  >
                    ← {t("prevPage")}
                  </Link>
                ) : (
                  <span className={clsx(css.pagerBtn, css.pagerBtnDisabled)}>
                    ← {t("prevPage")}
                  </span>
                )}
                <p className={css.pagerStatus}>
                  {t("pageStatus", { page, totalPages, total })}
                </p>
                {page < totalPages ? (
                  <Link
                    href={listHref(themeId, page + 1)}
                    className={css.pagerBtn}
                  >
                    {t("nextPage")} →
                  </Link>
                ) : (
                  <span className={clsx(css.pagerBtn, css.pagerBtnDisabled)}>
                    {t("nextPage")} →
                  </span>
                )}
              </nav>
            ) : null}
          </>
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
