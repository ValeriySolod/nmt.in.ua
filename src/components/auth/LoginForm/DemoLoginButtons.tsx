import { roleLabel } from "@/modules/auth/client";
import type { DEMO_ACCOUNTS } from "@/modules/auth/types";
import { demoLoginAction } from "@/modules/auth/actions";
import css from "./DemoLoginButtons.module.css";

type DemoLoginButtonsProps = {
  nextPath: string;
  accounts: typeof DEMO_ACCOUNTS;
};

export function DemoLoginButtons({ nextPath, accounts }: DemoLoginButtonsProps) {
  return (
    <ul className={css.list}>
      {accounts.map((account) => (
        <li key={account.login}>
          <form action={demoLoginAction.bind(null, account.login, nextPath)}>
            <button type="submit" className={css.card}>
              <span className={css.role}>{roleLabel(account.role)}</span>
              <span className={css.name}>{account.displayName}</span>
              <span className={css.meta}>
                {account.login} · {account.description}
              </span>
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}
