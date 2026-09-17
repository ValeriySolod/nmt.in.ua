"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { useTranslations } from "next-intl";
import { MathText } from "@/components/ui/MathText";
import { getMatchingTaskAction, submitMatchingTaskAction } from "@/modules/stage2/actions";
import type { MatchingReveal, MatchingTaskPresentation } from "@/modules/stage2/matchingTask";
import { Stage2Hints } from "../Stage2Hints";
import css from "./MatchingTaskCard.module.css";

function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function MatchingTaskCard({ taskId, roundId, diagnostic = false, onAnswered }: { taskId: number; roundId?: number; diagnostic?: boolean; onAnswered?: () => void }) {
  const t = useTranslations("Stage2");
  const [task, setTask] = useState<MatchingTaskPresentation | null>(null);
  const [rightOrder, setRightOrder] = useState<{ id: number; text: string }[]>([]);
  const [pairs, setPairs] = useState<Record<number, number>>({});
  const [activeLeft, setActiveLeft] = useState<number | null>(null);
  const [result, setResult] = useState<
    { correct: boolean; retryAvailable?: true; revealed?: MatchingReveal } | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMatchingTaskAction(taskId, undefined, roundId).then((state) => {
      if (cancelled) return;
      if (state.status === "success") {
        setTask(state.task);
        setRightOrder(shuffle(state.task.rightItems));
        const prior = state.task.priorResult;
        if (prior?.status === "correct") {
          setResult({ correct: true });
        } else if (prior?.status === "locked") {
          setResult({ correct: false, revealed: prior.revealed });
        } else if (prior?.status === "retry_available") {
          setResult({ correct: false, retryAvailable: true });
          if (prior.submittedPairs) setPairs(prior.submittedPairs);
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

  const takenRightIds = useMemo(() => new Set(Object.values(pairs)), [pairs]);

  if (loading) return <p role="status">{t("loading")}</p>;
  if (!task) return <p role="alert">{error ?? t("loadError")}</p>;

  const revealed = result?.revealed ?? null;
  const isLocked = result !== null && !result.retryAvailable;
  const complete = task.leftItems.every((item) => pairs[item.id] !== undefined);

  function pickLeft(id: number) {
    if (isLocked) return;
    setActiveLeft(id);
  }

  function pickRight(id: number) {
    if (isLocked || activeLeft == null) return;
    setPairs((prev) => ({ ...prev, [activeLeft]: id }));
    setActiveLeft(null);
  }

  async function handleCheck() {
    if (checking || isLocked || !complete) return;
    setChecking(true);
    setError(null);
    try {
      const state = await submitMatchingTaskAction({ taskId, roundId, expectedAttempt: result?.retryAvailable ? 2 : 1, submittedPairs: pairs });
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

      <div className={css.columns}>
        <div className={css.col} role="listbox" aria-label={t("matchingLeftLabel")}>
          {task.leftItems.map((item) => {
            const chosenId = pairs[item.id];
            const chosen = rightOrder.find((r) => r.id === chosenId);
            const ok = revealed && chosenId === revealed.correctPairs[item.id];
            const bad = revealed && chosenId != null && chosenId !== revealed.correctPairs[item.id];
            return (
              <button
                key={item.id}
                type="button"
                role="option"
                aria-selected={activeLeft === item.id}
                disabled={isLocked}
                className={clsx(css.row, activeLeft === item.id && css.active, ok && css.matched, bad && css.wrongMatch)}
                onClick={() => pickLeft(item.id)}
              >
                <MathText text={item.text} />
                <span className={css.chip}>{chosen ? chosen.text : t("matchingUnpaired")}</span>
              </button>
            );
          })}
        </div>
        <div className={css.col} role="listbox" aria-label={t("matchingRightLabel")}>
          {rightOrder.map((item) => {
            const taken = takenRightIds.has(item.id);
            return (
              <button
                key={item.id}
                type="button"
                role="option"
                aria-selected={false}
                disabled={isLocked || activeLeft == null}
                className={clsx(css.row, taken && css.taken)}
                onClick={() => pickRight(item.id)}
              >
                <MathText text={item.text} />
              </button>
            );
          })}
        </div>
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
      {revealed?.explanation ? <MathText text={revealed.explanation} /> : null}
      {result?.retryAvailable && !diagnostic ? <Stage2Hints format="matching" taskId={taskId} roundId={roundId} /> : null}
      {error ? <p role="alert">{error}</p> : null}

      {!isLocked ? (
        <button type="button" className={css.checkButton} onClick={handleCheck} disabled={checking || !complete}>
          {checking ? t("checking") : t("check")}
        </button>
      ) : null}
    </div>
  );
}
