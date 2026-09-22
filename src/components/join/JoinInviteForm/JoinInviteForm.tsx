"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import { INVITE_CODE_LENGTH } from "@/modules/teacher-students/codes";
import {
  redeemStudentInviteAction,
  type RedeemInviteActionState,
} from "@/modules/teacher-students/manageActions";
import css from "./JoinInviteForm.module.css";

const INITIAL: RedeemInviteActionState = { status: "idle" };

export function JoinInviteForm({ initialCode = "" }: { initialCode?: string }) {
  const t = useTranslations("JoinInvite");
  const [state, action, pending] = useActionState(
    redeemStudentInviteAction,
    INITIAL,
  );

  return (
    <form action={action} className={css.form}>
      <label className={css.field}>
        <span className={css.label}>{t("code")}</span>
        <input
          className={css.input}
          name="code"
          required
          autoComplete="off"
          spellCheck={false}
          maxLength={INVITE_CODE_LENGTH + 4}
          defaultValue={initialCode}
          placeholder={t("placeholder")}
          disabled={pending}
        />
      </label>
      <p className={css.hint}>{t("hint")}</p>
      <button type="submit" className={css.submit} disabled={pending}>
        {pending ? t("submitting") : t("submit")}
      </button>
      {state.status === "success" ? (
        <p className={clsx(css.alert, css.alertSuccess)} role="status">
          {state.already
            ? state.groupName
              ? t("alreadyGroup", {
                  teacher: state.teacherName,
                  group: state.groupName,
                })
              : t("alreadyPersonal", { teacher: state.teacherName })
            : state.groupName
              ? t("successGroup", {
                  teacher: state.teacherName,
                  group: state.groupName,
                })
              : t("successPersonal", { teacher: state.teacherName })}
        </p>
      ) : null}
      {state.status === "error" ? (
        <p className={clsx(css.alert, css.alertError)} role="alert">
          {t(`errors.${state.code}`)}
        </p>
      ) : null}
    </form>
  );
}
