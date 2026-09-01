"use client";

import { useActionState } from "react";
import clsx from "clsx";
import type { StudentOption } from "@/modules/auth/types";
import {
  assignMentorSessionAction,
  type AssignMentorSessionActionState,
} from "@/modules/sessions/actions";
import type { AvailableTopicTheme } from "@/modules/testing/types";
import css from "./MentorAssignPanel.module.css";

const INITIAL: AssignMentorSessionActionState = { status: "idle" };

type MentorAssignPanelProps = {
  themes: AvailableTopicTheme[];
  students: StudentOption[];
  defaultUserId: number;
};

export function MentorAssignPanel({
  themes,
  students,
  defaultUserId,
}: MentorAssignPanelProps) {
  const [state, formAction, pending] = useActionState(
    assignMentorSessionAction,
    INITIAL,
  );

  if (themes.length === 0 || students.length === 0) {
    return null;
  }

  return (
    <section className={css.panel} aria-labelledby="mentor-assign-title">
      <h2 id="mentor-assign-title" className={css.title}>
        Призначити mentor-сесію
      </h2>
      <p className={css.lead}>
        Викладач або адмін може запланувати тренування для учня. Сесія зʼявиться
        у списку учня зі статусом «заплановано».
      </p>

      <form action={formAction} className={css.form}>
        <div className={css.row}>
          <label className={css.field}>
            <span className={css.label}>Учень</span>
            <select
              name="userId"
              className={css.select}
              defaultValue={String(defaultUserId)}
              disabled={pending}
              required
            >
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.displayName}
                </option>
              ))}
            </select>
          </label>

          <label className={css.field}>
            <span className={css.label}>Тема</span>
            <select
              name="themeId"
              className={css.select}
              defaultValue={String(themes[0]!.id)}
              disabled={pending}
              required
            >
              {themes.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.name}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" className={css.submit} disabled={pending}>
            {pending ? "Зберігаємо…" : "Призначити"}
          </button>
        </div>
      </form>

      {state.status === "success" ? (
        <p className={clsx(css.alert, css.success)} role="status">
          {state.created
            ? `Mentor-сесію #${state.sessionId} створено.`
            : `Mentor-сесія #${state.sessionId} уже була запланована.`}
        </p>
      ) : null}

      {state.status === "error" ? (
        <p className={clsx(css.alert, css.error)} role="alert">
          {state.message}
        </p>
      ) : null}
    </section>
  );
}
