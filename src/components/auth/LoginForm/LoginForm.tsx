"use client";

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
  const [state, formAction, pending] = useActionState(loginAction, INITIAL);

  return (
    <div className={css.wrap}>
      <header className={css.intro}>
        <p className={css.kicker}>Вхід</p>
        <h1 className={css.title}>Навчальний кабінет NMT</h1>
        <p className={css.lead}>
          Увійдіть як учень, викладач або адмін. Для перевірки доступні демо-облікові
          записи нижче.
        </p>
      </header>

      <form className={css.form} action={formAction}>
        <input type="hidden" name="next" value={nextPath} />

        <label className={css.field}>
          <span className={css.label}>Логін</span>
          <input
            className={css.input}
            name="login"
            autoComplete="username"
            required
            disabled={pending}
          />
        </label>

        <label className={css.field}>
          <span className={css.label}>Пароль</span>
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
            {state.message}
          </p>
        ) : null}

        <button type="submit" className={css.submit} disabled={pending}>
          {pending ? "Вхід…" : "Увійти"}
        </button>
      </form>

      <section className={css.demo} aria-labelledby="demo-login-title">
        <h2 id="demo-login-title" className={css.demoTitle}>
          Демо для перевірки
        </h2>
        <p className={css.demoLead}>Пароль для всіх демо-акаунтів: <strong>demo123</strong></p>
        <DemoLoginButtons nextPath={nextPath} accounts={DEMO_ACCOUNTS} />
      </section>
    </div>
  );
}
