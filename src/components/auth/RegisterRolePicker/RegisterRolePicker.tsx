"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import css from "../auth.module.css";

export type RegisterRole = "student" | "teacher";

type RegisterRolePickerProps = {
  role: RegisterRole;
  studentHref: string;
  teacherHref: string;
  /** `aside` — under marketing copy (1240+). `card` — mobile form. */
  placement: "aside" | "card";
};

export function RegisterRolePicker({
  role,
  studentHref,
  teacherHref,
  placement,
}: RegisterRolePickerProps) {
  const t = useTranslations("RegisterForm");

  return (
    <div
      className={clsx(
        css.rolePicker,
        placement === "aside" ? css.rolePickerAside : css.rolePickerCard,
      )}
      role="group"
      aria-label={t("roleLabel")}
    >
      <p className={css.rolePickerLabel}>{t("roleLabel")}</p>
      <div className={css.rolePickerTabs}>
        <Link
          href={studentHref}
          className={clsx(
            css.roleTab,
            role === "student" && css.roleTabActive,
          )}
          aria-current={role === "student" ? "page" : undefined}
        >
          {t("roleStudent")}
        </Link>
        <Link
          href={teacherHref}
          className={clsx(
            css.roleTab,
            role === "teacher" && css.roleTabActive,
          )}
          aria-current={role === "teacher" ? "page" : undefined}
        >
          {t("roleTeacher")}
        </Link>
      </div>
    </div>
  );
}
