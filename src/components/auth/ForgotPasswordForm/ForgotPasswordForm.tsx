"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import {
  forgotPasswordAction,
  type ForgotPasswordActionState,
} from "@/modules/auth/actions";
import css from "../auth.module.css";

const INITIAL: ForgotPasswordActionState = { status: "idle" };

export function ForgotPasswordForm() {
  const t = useTranslations("ForgotPassword");
  const [state, action, pending] = useActionState(forgotPasswordAction, INITIAL);

  return (
    <div className={css.card}>
      <header className={css.intro}>
        <p className={css.kicker}>{t("kicker")}</p>
        <h1 className={css.title}>{t("title")}</h1>
        <p className={css.lead}>{t("lead")}</p>
      </header>

      <form className={css.form} action={action}>
        <label className={css.field}>
          <span className={css.label}>{t("email")}</span>
          <input
            className={css.input}
            type="email"
            name="email"
            autoComplete="email"
            required
            maxLength={255}
            disabled={pending}
          />
        </label>

        {state.status === "ok" ? (
          <p className={clsx(css.alert, css.alertSuccess)} role="status">
            {t("sent")}
          </p>
        ) : null}
        {state.status === "error" ? (
          <p className={clsx(css.alert, css.alertError)} role="alert">
            {t(`errors.${state.code}`)}
          </p>
        ) : null}

        <button type="submit" className={css.submit} disabled={pending}>
          {pending ? t("submitting") : t("submit")}
        </button>
      </form>

      <p className={css.switch}>
        <Link href="/login" className={css.switchLink}>
          {t("backToLogin")}
        </Link>
      </p>
    </div>
  );
}
