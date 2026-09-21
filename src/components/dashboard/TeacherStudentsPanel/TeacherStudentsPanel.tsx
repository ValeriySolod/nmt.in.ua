"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import { Select } from "@/components/ui/Select";
import { LOGIN_MAX_LEN } from "@/modules/auth/validateRegistration";
import {
  addTeacherStudentAction,
  unlinkTeacherStudentAction,
  type AddTeacherStudentActionState,
  type UnlinkTeacherStudentActionState,
} from "@/modules/teacher-students/actions";
import {
  assignStudentGroupAction,
  type GroupActionState,
} from "@/modules/teacher-students/manageActions";
import css from "./TeacherStudentsPanel.module.css";

const ADD_INITIAL: AddTeacherStudentActionState = { status: "idle" };
const UNLINK_INITIAL: UnlinkTeacherStudentActionState = { status: "idle" };
const ASSIGN_INITIAL: GroupActionState = { status: "idle" };

export type TeacherStudentListItem = {
  studentUserId: number;
  login: string;
  displayName: string;
  groupId: number | null;
  groupName: string | null;
};

export type TeacherStudentGroupOption = {
  id: number;
  name: string;
};

type TeacherStudentsPanelProps = {
  students: TeacherStudentListItem[];
  groups: TeacherStudentGroupOption[];
};

export function TeacherStudentsPanel({
  students,
  groups,
}: TeacherStudentsPanelProps) {
  const t = useTranslations("TeacherStudents");
  const [addState, addAction, addPending] = useActionState(
    addTeacherStudentAction,
    ADD_INITIAL,
  );
  const [unlinkState, unlinkAction, unlinkPending] = useActionState(
    unlinkTeacherStudentAction,
    UNLINK_INITIAL,
  );
  const [assignState, assignAction, assignPending] = useActionState(
    assignStudentGroupAction,
    ASSIGN_INITIAL,
  );
  const groupOptions = [
    { value: "", label: t("noGroup") },
    ...groups.map((group) => ({
      value: String(group.id),
      label: group.name,
    })),
  ];

  return (
    <div className={css.layout}>
      <section className={css.panel} aria-labelledby="teacher-students-add-title">
        <div>
          <h2 id="teacher-students-add-title" className={css.panelTitle}>
            {t("addTitle")}
          </h2>
          <p className={css.panelLead}>{t("addLead")}</p>
        </div>

        <form action={addAction} className={css.form}>
          <div className={css.formRow}>
            <label className={css.field}>
              <span className={css.label}>{t("login")}</span>
              <input
                className={css.input}
                type="text"
                name="login"
                autoComplete="off"
                spellCheck={false}
                required
                maxLength={LOGIN_MAX_LEN}
                placeholder={t("loginPlaceholder")}
                disabled={addPending}
              />
            </label>
            <button type="submit" className={css.submit} disabled={addPending}>
              {addPending ? t("adding") : t("add")}
            </button>
          </div>
          <span className={css.hint}>{t("loginHint")}</span>
        </form>

        {addState.status === "success" ? (
          <p className={clsx(css.alert, css.alertSuccess)} role="status">
            {t("added", { name: addState.displayName })}
          </p>
        ) : null}

        {addState.status === "error" ? (
          <p className={clsx(css.alert, css.alertError)} role="alert">
            {t(`errors.${addState.code}`)}
          </p>
        ) : null}
      </section>

      <section
        className={css.panel}
        aria-labelledby="teacher-students-list-title"
      >
        <div>
          <h2 id="teacher-students-list-title" className={css.panelTitle}>
            {t("listTitle")}
          </h2>
          <p className={css.panelLead}>{t("listLead")}</p>
        </div>

        {unlinkState.status === "success" ? (
          <p className={clsx(css.alert, css.alertSuccess)} role="status">
            {t("unlinked")}
          </p>
        ) : null}

        {unlinkState.status === "error" ? (
          <p className={clsx(css.alert, css.alertError)} role="alert">
            {t(`errors.${unlinkState.code}`)}
          </p>
        ) : null}

        {assignState.status === "success" ? (
          <p className={clsx(css.alert, css.alertSuccess)} role="status">
            {t("groupSaved")}
          </p>
        ) : null}

        {assignState.status === "error" ? (
          <p className={clsx(css.alert, css.alertError)} role="alert">
            {t(`errors.${assignState.code}`)}
          </p>
        ) : null}

        {students.length === 0 ? (
          <p className={css.empty}>{t("empty")}</p>
        ) : (
          <ul className={css.list}>
            {students.map((student) => (
              <li key={student.studentUserId} className={css.item}>
                <div className={css.identity}>
                  <p className={css.name}>
                    <Link
                      className={css.nameLink}
                      href={`/students/${student.studentUserId}`}
                    >
                      {student.displayName}
                    </Link>
                  </p>
                  <p className={css.login}>@{student.login}</p>
                  {student.groupName ? (
                    <p className={css.groupBadge}>{student.groupName}</p>
                  ) : null}
                </div>
                {groups.length > 0 ? (
                  <form action={assignAction} className={css.assignForm}>
                    <input
                      type="hidden"
                      name="studentUserId"
                      value={student.studentUserId}
                    />
                    <Select
                      key={`${student.studentUserId}:${student.groupId ?? "none"}`}
                      name="groupId"
                      variant="compact"
                      defaultValue={
                        student.groupId == null ? "" : String(student.groupId)
                      }
                      options={groupOptions}
                      aria-label={t("assignGroup")}
                      disabled={assignPending}
                    />
                    <button
                      type="submit"
                      className={css.unlink}
                      disabled={assignPending}
                    >
                      {assignPending ? t("savingGroup") : t("saveGroup")}
                    </button>
                  </form>
                ) : null}
                <form
                  action={unlinkAction}
                  onSubmit={(event) => {
                    if (
                      !window.confirm(
                        t("unlinkConfirm", {
                          name: student.displayName,
                          login: student.login,
                        }),
                      )
                    ) {
                      event.preventDefault();
                    }
                  }}
                >
                  <input
                    type="hidden"
                    name="studentUserId"
                    value={student.studentUserId}
                  />
                  <button
                    type="submit"
                    className={css.unlink}
                    disabled={unlinkPending}
                  >
                    {unlinkPending ? t("unlinking") : t("unlink")}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
