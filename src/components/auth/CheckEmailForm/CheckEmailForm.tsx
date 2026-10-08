"use client";

import Link from "next/link";
import { useActionState, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import {
  resendVerificationAction,
  type ResendVerifyActionState,
} from "@/modules/auth/actions";
import { isValidEmailAddress } from "@/modules/auth/validateRegistration";
import css from "../auth.module.css";

const INITIAL: ResendVerifyActionState = { status: "idle" };

type CheckEmailFormProps = {
  email: string;
  mailFailed?: boolean;
};

export function CheckEmailForm({
  email,
  mailFailed = false,
}: CheckEmailFormProps) {
  const t = useTranslations("CheckEmail");
  const [state, action, pending] = useActionState(
    resendVerificationAction,
    INITIAL,
  );
  const [clientInvalid, setClientInvalid] = useState(false);
  const hasPrefill = Boolean(email);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    const value = String(new FormData(event.currentTarget).get("email") ?? "");
    if (!isValidEmailAddress(value)) {
      event.preventDefault();
      setClientInvalid(true);
      return;
    }
    setClientInvalid(false);
  }

  function onInvalid(event: FormEvent<HTMLInputElement>) {
    if (event.currentTarget.validity.valueMissing) return;
    event.preventDefault();
    setClientInvalid(true);
  }

  return (
    <div className={css.card}>
      <header className={css.intro}>
        <p className={css.kicker}>{t("kicker")}</p>
        <h1 className={css.title}>{t("title")}</h1>
        <p className={css.lead}>
          {mailFailed && state.status === "idle"
            ? hasPrefill
              ? t("leadFailedWithEmail", { email })
              : t("leadFailed")
            : hasPrefill
              ? t("leadWithEmail", { email })
              : t("lead")}
        </p>
      </header>

      <form className={css.form} action={action} onSubmit={onSubmit}>
        {hasPrefill ? (
          <input type="hidden" name="email" value={email} />
        ) : (
          <label className={css.field}>
            <span className={css.label}>{t("email")}</span>
            <input
              className={css.input}
              type="text"
              inputMode="email"
              name="email"
              autoComplete="email"
              spellCheck={false}
              required
              maxLength={255}
              disabled={pending}
              onInvalid={onInvalid}
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
      {clientInvalid || state.status === "error" || (mailFailed && state.status === "idle") ? (
        <p className={clsx(css.alert, css.alertError)} role="alert">
          {clientInvalid
            ? t("errors.invalid_email")
            : t(`errors.${state.status === "error" ? state.code : "generic"}`)}
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
