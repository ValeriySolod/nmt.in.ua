"use client";

import { useTranslations } from "next-intl";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageFrame, PagePanel } from "@/components/dashboard/PageFrame";
import { DiagnosticInfoPanel } from "@/components/diagnostic/DiagnosticInfoPanel";
import {
  startDiagnosticAction,
  type StartDiagnosticActionState,
} from "@/modules/diagnostic/actions";
import css from "./DiagnosticIntro.module.css";

const INITIAL_STATE: StartDiagnosticActionState = { status: "idle" };

type DiagnosticIntroProps = {
  /** From a server-side read of theme/task availability (see
   * `src/app/diagnostic/page.tsx`). False disables the submit —
   * starting an attempt with no eligible content would otherwise only fail
   * after a round trip, via the `insufficientTasks` error below. */
  contentAvailable: boolean;
};

/** Step 1 of the public diagnostic flow: start the adaptive intro test. */
export function DiagnosticIntro({ contentAvailable }: DiagnosticIntroProps) {
  const t = useTranslations("Diagnostic");
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    startDiagnosticAction,
    INITIAL_STATE,
  );

  useEffect(() => {
    if (state.status === "success") {
      router.replace(`/diagnostic/session/${state.sessionId}`);
    }
  }, [state, router]);

  const isRedirecting = state.status === "success";
  const controlsDisabled = !contentAvailable || pending || isRedirecting;

  return (
    <PageFrame kicker={t("kicker")} title={t("title")} lead={t("lead")}>
      <PagePanel>
        <form className={css.form} action={formAction}>
          <button
            type="submit"
            className={css.start}
            disabled={controlsDisabled}
          >
            {isRedirecting
              ? t("redirecting")
              : pending
                ? t("loading")
                : t("start")}
          </button>
        </form>

        {!contentAvailable ? (
          <p className={css.error} role="status">
            {t("unavailable")}
          </p>
        ) : state.status === "error" ? (
          <p className={css.error} role="alert">
            {t(`errors.${state.code}`)}
          </p>
        ) : null}
      </PagePanel>

      <DiagnosticInfoPanel />
    </PageFrame>
  );
}
