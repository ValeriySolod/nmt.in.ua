"use client";

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

type ResendVerificationFormProps = {
  email?: string;
  /** Hide the address field when the page already knows where the letter went. */
  hideEmailField?: boolean;
};

export function ResendVerificationForm({
  email = "",
  hideEmailField = false,
}: ResendVerificationFormProps) {
  const t = useTranslations("CheckEmail");
  const [state, action, pending] = useActionState(
    resendVerificationAction,
    INITIAL,
  );
  const [clientInvalid, setClientInvalid] = useState(false);
  const prefill = email.trim().toLowerCase();
  const lockedEmail = hideEmailField && Boolean(prefill);

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
    event.preventDefault();
    setClientInvalid(true);
  }

  const errorCode =
    clientInvalid && state.status !== "error"
      ? "invalid_email"
      : state.status === "error"
        ? state.code
        : null;

  return (
    <form className={css.form} action={action} onSubmit={onSubmit}>
      {lockedEmail ? (
        <input type="hidden" name="email" value={prefill} />
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
            defaultValue={prefill}
            disabled={pending}
            onInvalid={onInvalid}
          />
        </label>
      )}
      <button type="submit" className={css.submit} disabled={pending}>
        {pending ? t("resending") : t("resend")}
      </button>
      {state.status === "ok" ? (
        <p className={clsx(css.alert, css.alertSuccess)} role="status">
          {t("resent")}
        </p>
      ) : null}
      {errorCode ? (
        <p className={clsx(css.alert, css.alertError)} role="alert">
          {t(`errors.${errorCode}`)}
        </p>
      ) : null}
    </form>
  );
}
