"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import clsx from "clsx";
import { DEMO_ACCOUNTS } from "@/modules/auth/client";
import { loginAction, type LoginActionState } from "@/modules/auth/actions";
import { DemoLoginButtons } from "./DemoLoginButtons";
import css from "./LoginForm.module.css";

const INITIAL: LoginActionState = { status: "idle" };

type LoginFormProps = {
  nextPath: string;
};

export function LoginForm({ nextPath }: LoginFormProps) {
  const t = useTranslations("LoginForm");
  const [state, formAction, pending] = useActionState(loginAction, INITIAL);

  return (
    <div className={css.wrap}>
      <header className={css.intro}>
        <p className={css.kicker}>{t("kicker")}</p>
        <h1 className={css.title}>{t("title")}</h1>
        <p className={css.lead}>{t("lead")}</p>
      </header>

      <form className={css.form} action={formAction}>
        <input type="hidden" name="next" value={nextPath} />

        <label className={css.field}>
          <span className={css.label}>{t("login")}</span>
          <input
            className={css.input}
            name="login"
            autoComplete="username"
            required
            disabled={pending}
          />
        </label>

        <label className={css.field}>
          <span className={css.label}>{t("password")}</span>
          <input
            className={css.input}
            type="password"
            name="password"
            autoComplete="current-password"
            required
            disabled={pending}
          />
        </label>

        {state.status === "error" ? (
          <p className={clsx(css.alert, css.alertError)} role="alert">
            {t(`errors.${state.code}`)}
          </p>
        ) : null}

        <button type="submit" className={css.submit} disabled={pending}>
          {pending ? t("signingIn") : t("signIn")}
        </button>
      </form>

      <section className={css.demo} aria-labelledby="demo-login-title">
        <h2 id="demo-login-title" className={css.demoTitle}>
          {t("demoTitle")}
        </h2>

        <p className={css.demoLead}>
          {t("demoPassword")} <strong>demo123</strong>
        </p>

        <DemoLoginButtons nextPath={nextPath} accounts={DEMO_ACCOUNTS} />
      </section>
    </div>
  );
}
