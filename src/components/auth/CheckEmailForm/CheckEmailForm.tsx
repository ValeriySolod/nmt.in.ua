"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import {
  resendVerificationAction,
  type ResendVerifyActionState,
} from "@/modules/auth/actions";
import css from "../auth.module.css";

const INITIAL: ResendVerifyActionState = { status: "idle" };

type CheckEmailFormProps = {
  email: string;
};

export function CheckEmailForm({ email }: CheckEmailFormProps) {
  const t = useTranslations("CheckEmail");
  const [state, action, pending] = useActionState(
    resendVerificationAction,
    INITIAL,
  );
  const hasPrefill = Boolean(email);

  return (
    <div className={css.card}>
      <header className={css.intro}>
        <p className={css.kicker}>{t("kicker")}</p>
        <h1 className={css.title}>{t("title")}</h1>
        <p className={css.lead}>
          {hasPrefill ? t("leadWithEmail", { email }) : t("lead")}
        </p>
      </header>

      <form className={css.form} action={action}>
        {hasPrefill ? (
          <input type="hidden" name="email" value={email} />
        ) : (
          <label className={css.field}>
            <span className={css.label}>{t("email")}</span>
            <input
              className={css.input}
              type="email"
              name="email"
              autoComplete="email"
              spellCheck={false}
              required
              maxLength={255}
              disabled={pending}
            />
          </label>
        )}
        <button type="submit" className={css.submit} disabled={pending}>
          {pending ? t("resending") : t("resend")}
        </button>
      </form>

      {state.status === "ok" ? (
        <p className={clsx(css.alert, css.alertSuccess)} role="status">
          {t("resent")}
        </p>
      ) : null}
      {state.status === "error" ? (
        <p className={clsx(css.alert, css.alertError)} role="alert">
          {t(`errors.${state.code}`)}
        </p>
      ) : null}

      <p className={css.switch}>
        <Link href="/login" className={css.switchLink}>
          {t("backToLogin")}
        </Link>
      </p>
    </div>
  );
}
