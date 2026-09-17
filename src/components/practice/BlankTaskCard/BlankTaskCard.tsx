"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { useTranslations } from "next-intl";
import { MathText } from "@/components/ui/MathText";
import { getBlankTaskAction, submitBlankTaskAction } from "@/modules/stage2/actions";
import type { BlankReveal, BlankTaskPresentation } from "@/modules/stage2/blankTask";
import { Stage2Hints } from "../Stage2Hints";
import css from "./BlankTaskCard.module.css";

/**
 * Simplification (documented, not silently assumed): the task text's
 * `{{N}}` placeholders are shown as literal text via `MathText` — inline
 * math (KaTeX) rendering does not support embedding a live `<input>` inside
 * a formula, so each blank instead gets its own clearly-labeled input below
 * the full problem text ("Пропуск 1", "Пропуск 2", ...) rather than being
 * spliced into the exact glyph position. Every blank still checks
 * independently.
 */
export function BlankTaskCard({ taskId, roundId, diagnostic = false, onAnswered }: { taskId: number; roundId?: number; diagnostic?: boolean; onAnswered?: () => void }) {
  const t = useTranslations("Stage2");
  const [task, setTask] = useState<BlankTaskPresentation | null>(null);
  const [values, setValues] = useState<Record<number, string>>({});
  const [result, setResult] = useState<
    | { correct: boolean; retryAvailable?: true; revealed?: BlankReveal; perBlank: Record<number, boolean> }
    | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getBlankTaskAction(taskId, undefined, roundId).then((state) => {
      if (cancelled) return;
      if (state.status === "success") {
        setTask(state.task);
        const prior = state.task.priorResult;
        if (prior?.status === "correct") {
          setResult({ correct: true, perBlank: prior.perBlank });
        } else if (prior?.status === "locked") {
          setResult({ correct: false, revealed: prior.revealed, perBlank: prior.perBlank });
        } else if (prior?.status === "retry_available") {
          setResult({ correct: false, retryAvailable: true, perBlank: prior.perBlank });
          if (prior.submitted) setValues(prior.submitted);
        }
      } else {
        setError(t("loadError"));
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [taskId, roundId, t]);

  if (loading) return <p role="status">{t("loading")}</p>;
  if (!task) return <p role="alert">{error ?? t("loadError")}</p>;

  const isLocked = result !== null && !result.retryAvailable;
  const ready = task.blankOrds.every((ord) => (values[ord] ?? "").trim() !== "");

  async function handleCheck() {
    if (checking || isLocked || !ready) return;
    setChecking(true);
    setError(null);
    try {
      const state = await submitBlankTaskAction({ taskId, roundId, expectedAttempt: result?.retryAvailable ? 2 : 1, submitted: values });
      if (state.status === "success") { setResult(state); onAnswered?.(); }
      else setError(t("checkError"));
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className={css.wrap}>
      <h3>{task.name}</h3>
      <MathText text={task.taskText} />

      <form
        className={css.form}
        onSubmit={(event) => {
          event.preventDefault();
          void handleCheck();
        }}
      >
        <div className={css.blanksRow}>
          {task.blankOrds.map((ord) => {
            const isOk = result?.perBlank[ord] === true;
            const isBad = result != null && result.perBlank[ord] === false;
            return (
              <label key={ord} className={css.field}>
                <span className={css.label}>{t("blankLabel", { ord })}</span>
                <input
                  className={clsx(css.input, isOk && css.inputOk, isBad && css.inputBad)}
                  value={values[ord] ?? ""}
                  disabled={isLocked}
                  onChange={(event) =>
                    setValues((prev) => ({ ...prev, [ord]: event.target.value }))
                  }
                  autoComplete="off"
                  inputMode="text"
                  aria-label={t("blankLabel", { ord })}
                />
                {result ? (
                  <span className={css.blankStatus}>
                    {isOk ? t("correct") : t("incorrect")}
                    {result.revealed ? ` — ${result.revealed.correctByOrd[ord]}` : ""}
                  </span>
                ) : null}
              </label>
            );
          })}
        </div>

        {result ? (
          <p role="status">
            {diagnostic ? t("answerSaved") : result.correct
              ? t("correct")
              : result.retryAvailable
                ? t("retryPrompt")
                : t("incorrectLocked")}
          </p>
        ) : null}
        {result?.revealed?.explanation ? <MathText text={result.revealed.explanation} /> : null}
        {result?.retryAvailable && !diagnostic ? <Stage2Hints format="blank" taskId={taskId} roundId={roundId} /> : null}
      {error ? <p role="alert">{error}</p> : null}

        {!isLocked ? (
          <button type="submit" className={css.checkButton} disabled={checking || !ready}>
            {checking ? t("checking") : t("check")}
          </button>
        ) : null}
      </form>
    </div>
  );
}
