// import {
//   NavStubPage,
//   createStubPageMetadata,
// } from "@/components/dashboard/StubPage";

"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

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

  const [state, formAction, isPending] = useActionState(
    startNmtSimulatorAction,
    initialState
  );

  useEffect(() => {
    if (state.status === "success") {
      router.push(`/session/${state.sessionId}?mode=nmt`);
    }
  }, [state, router]);

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <span className={styles.eyebrow}>НМТ</span>

        <h1 className={styles.title}>Симулятор НМТ</h1>

        <p className={styles.description}>
          Спробуйте пройти тест у форматі симуляції НМТ.
        </p>

        <div className={styles.info}>
          <div>
            <strong>22</strong>
            <span>Завдання</span>
          </div>

          <div>
            <strong>⏱</strong>
            <span>Таймер</span>
          </div>

          <div>
            <strong>✓</strong>
            <span>Результат</span>
          </div>
        </div>

        {state.status === "error" && (
          <p className={styles.error}>{state.message}</p>
        )}

        <form action={formAction}>
          <button
            type="submit"
            className={styles.startButton}
            disabled={isPending}
          >
            {isPending ? "Підготовка тесту..." : "Почати тест"}
          </button>
        </form>
      </section>
    </main>
  );
}
