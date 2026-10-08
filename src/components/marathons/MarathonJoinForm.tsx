"use client";

import { useActionState } from "react";
import {
  joinMarathonAction,
  type JoinMarathonActionState,
} from "@/modules/marathons/actions";
import { useTranslations } from "next-intl";
import css from "./MarathonLeaderboard.module.css";

const INITIAL: JoinMarathonActionState = { status: "idle" };

export function MarathonJoinForm() {
  const t = useTranslations("MarathonLeaderboard");
  const [state, formAction, pending] = useActionState(
    joinMarathonAction,
    INITIAL,
  );

  return (
    <form action={formAction} className={css.joinForm}>
      <p className={css.joinLead}>{t("joinLead")}</p>
      <button type="submit" className={css.joinBtn} disabled={pending}>
        {pending ? t("joinPending") : t("joinCta")}
      </button>
      {state.status === "error" ? (
        <p className={css.joinError} role="alert">
          {t(`errors.${state.code}`)}
        </p>
      ) : null}
    </form>
  );
}
