"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import {
  saveQuizTaskAction,
  type SaveQuizTaskActionState,
} from "@/modules/admin-content/actions";
import type {
  AdminQuizTask,
  AdminThemeOption,
} from "@/modules/admin-content/types";
import { toAdminInput } from "@/modules/admin-content/mathField";
import { MIN_DIFFICULTY } from "@/modules/content-import/schema";
import { Select } from "@/components/ui/Select";
import css from "./AdminTaskForm.module.css";

const SAVE_INITIAL: SaveQuizTaskActionState = { status: "idle" };

type FormValues = {
  taskText: string;
  themeId: string;
  answer1: string;
  answer2: string;
  answer3: string;
  answer4: string;
  rightAnswerN: string;
  difficulty: string;
  comments: string;
};

function formatThemeLabel(index: number, theme: AdminThemeOption): string {
  return `${index + 1}. ${theme.name}`;
}

function valuesFromTask(task: AdminQuizTask): FormValues {
  return {
    taskText: toAdminInput(task.taskText),
    themeId: String(task.themeId),
    answer1: toAdminInput(task.answer1),
    answer2: toAdminInput(task.answer2),
    answer3: toAdminInput(task.answer3),
    answer4: toAdminInput(task.answer4),
    rightAnswerN: String(task.rightAnswerN),
    difficulty: String(task.difficulty),
    comments: toAdminInput(task.comments),
  };
}

function emptyValues(themeId: number): FormValues {
  return {
    taskText: "",
    themeId: String(themeId),
    answer1: "",
    answer2: "",
    answer3: "",
    answer4: "",
    rightAnswerN: "1",
    difficulty: "1",
    comments: "",
  };
}

export type AdminTaskFormProps = {
  mode: "create" | "edit";
  themes: AdminThemeOption[];
  themeId: number;
  task?: AdminQuizTask;
  nextTaskId?: number | null;
  backHref: string;
};

export function AdminTaskForm({
  mode,
  themes,
  themeId,
  task,
  nextTaskId = null,
  backHref,
}: AdminTaskFormProps) {
  const t = useTranslations("AdminContent");
  const router = useRouter();
  const [form, setForm] = useState<FormValues>(() =>
    task ? valuesFromTask(task) : emptyValues(themeId),
  );

  const [saveState, saveAction, savePending] = useActionState(
    saveQuizTaskAction,
    SAVE_INITIAL,
  );

  useEffect(() => {
    if (saveState.status !== "success") return;

    if (saveState.mode === "create") {
      router.replace(`/tasks/${saveState.task.id}`);
      return;
    }

    router.refresh();
  }, [saveState, router]);

  const listHref =
    form.themeId && Number(form.themeId) > 0
      ? `/?theme=${form.themeId}`
      : backHref;

  return (
    <div className={css.shell}>
      <div className={css.navRow}>
        <Link href={listHref} className={css.backLink}>
          ← {t("back")}
        </Link>
        {mode === "edit" && nextTaskId ? (
          <Link href={`/tasks/${nextTaskId}`} className={css.nextLink}>
            {t("nextTask")} →
          </Link>
        ) : null}
      </div>

      <section className={css.panel} aria-label={t("formAria")}>
        <form action={saveAction} className={css.form}>
          {mode === "edit" && task ? (
            <input type="hidden" name="taskId" value={task.id} />
          ) : null}

          <label className={css.field}>
            <span className={css.label}>{t("taskText")}</span>
            <textarea
              className={css.taskArea}
              name="taskText"
              value={form.taskText}
              onChange={(e) => setForm({ ...form, taskText: e.target.value })}
              required
              rows={6}
              disabled={savePending}
            />
          </label>

          <div className={css.answers}>
            {([1, 2, 3, 4] as const).map((n) => {
              const key = `answer${n}` as const;
              return (
                <label key={key} className={css.field}>
                  <span className={css.label}>{t("answer", { n })}</span>
                  <input
                    className={css.input}
                    name={key}
                    value={form[key]}
                    onChange={(e) =>
                      setForm({ ...form, [key]: e.target.value })
                    }
                    required
                    maxLength={255}
                    disabled={savePending}
                  />
                </label>
              );
            })}
          </div>

          <div className={css.meta}>
            <label className={css.field}>
              <span className={css.label}>{t("rightAnswer")}</span>
              <Select
                name="rightAnswerN"
                value={form.rightAnswerN}
                disabled={savePending}
                options={[1, 2, 3, 4].map((n) => ({
                  value: String(n),
                  label: t("answer", { n }),
                }))}
                onChange={(next) => setForm({ ...form, rightAnswerN: next })}
              />
            </label>

            <label className={css.field}>
              <span className={css.label}>{t("difficulty")}</span>
              <input
                className={clsx(css.input, css.diffInput)}
                name="difficulty"
                type="number"
                min={MIN_DIFFICULTY}
                step={1}
                value={form.difficulty}
                onChange={(e) =>
                  setForm({ ...form, difficulty: e.target.value })
                }
                required
                disabled={savePending}
              />
            </label>

            <label className={css.field}>
              <span className={css.label}>{t("theme")}</span>
              <Select
                name="themeId"
                value={form.themeId}
                required
                disabled={savePending}
                options={themes.map((theme, index) => ({
                  value: String(theme.id),
                  label: formatThemeLabel(index, theme),
                }))}
                onChange={(next) => setForm({ ...form, themeId: next })}
              />
            </label>
          </div>

          <label className={css.field}>
            <span className={css.label}>{t("comments")}</span>
            <textarea
              className={css.hintArea}
              name="comments"
              value={form.comments}
              onChange={(e) => setForm({ ...form, comments: e.target.value })}
              rows={3}
              disabled={savePending}
            />
          </label>

          <div className={css.formActions}>
            <button
              type="submit"
              className={css.saveBtn}
              disabled={savePending}
            >
              {savePending ? t("saving") : t("save")}
            </button>
            <Link href={listHref} className={css.cancelBtn}>
              {t("back")}
            </Link>
            {mode === "edit" && nextTaskId ? (
              <Link href={`/tasks/${nextTaskId}`} className={css.nextBtn}>
                {t("nextTask")}
              </Link>
            ) : null}
          </div>
        </form>

        {saveState.status === "success" ? (
          <p className={clsx(css.alert, css.alertSuccess)} role="status">
            {saveState.mode === "create" ? t("created") : t("updated")}
          </p>
        ) : null}
        {saveState.status === "error" ? (
          <p className={clsx(css.alert, css.alertError)} role="alert">
            {t(`errors.${saveState.code}`)}
          </p>
        ) : null}
      </section>
    </div>
  );
}
