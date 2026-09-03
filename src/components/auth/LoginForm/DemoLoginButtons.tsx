"use client";

import { useTranslations } from "next-intl";
import type { DEMO_ACCOUNTS } from "@/modules/auth/types";
import { demoLoginAction } from "@/modules/auth/actions";
import css from "./DemoLoginButtons.module.css";

type DemoLoginButtonsProps = {
  nextPath: string;
  accounts: typeof DEMO_ACCOUNTS;
};

export function DemoLoginButtons({
  nextPath,
  accounts,
}: DemoLoginButtonsProps) {
  const t = useTranslations("LoginForm");

  return (
    <ul className={css.list}>
      {accounts.map((account) => (
        <li key={account.login}>
          <form action={demoLoginAction.bind(null, account.login, nextPath)}>
            <button type="submit" className={css.card}>
              <span className={css.role}>{t(`roles.${account.role}`)}</span>

              <span className={css.name}>{account.displayName}</span>

              <span className={css.meta}>
                {account.login} · {t(`demoAccounts.${account.role}`)}
              </span>
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}
