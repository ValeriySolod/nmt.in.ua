"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  startNmtSimulatorAction,
  type StartNmtSimulatorActionState,
} from "@/modules/testing/actions";

import styles from "./page.module.css";

const initialState: StartNmtSimulatorActionState = {
  status: "idle",
};

export default function SimulatorPage() {
  const router = useRouter();
  const t = useTranslations("simulator");

  const [state, formAction, isPending] = useActionState(
    startNmtSimulatorAction,
    initialState,
  );

  useEffect(() => {
    if (state.status === "success") {
      router.push(`/session/${state.sessionId}?mode=nmt`);
    }
  }, [state, router]);

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <span className={styles.eyebrow}>{t("eyebrow")}</span>

        <h1 className={styles.title}>{t("title")}</h1>

        <p className={styles.description}>{t("description")}</p>

        <div className={styles.info}>
          <div>
            <strong>22</strong>
            <span>{t("tasks")}</span>
          </div>

          <div>
            <strong>⏱</strong>
            <span>{t("timer")}</span>
          </div>

          <div>
            <strong>✓</strong>
            <span>{t("result")}</span>
          </div>
        </div>

        {state.status === "error" && (
          <p className={styles.error}>{t(`errors.${state.code}`)}</p>
        )}

        <form action={formAction}>
          <button
            type="submit"
            className={styles.startButton}
            disabled={isPending}
          >
            {isPending ? t("preparing") : t("start")}
          </button>
        </form>
      </section>
    </main>
  );
}
