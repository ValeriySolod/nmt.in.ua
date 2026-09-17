"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { useTranslations } from "next-intl";
import { MathText } from "@/components/ui/MathText";
import { getGraphTaskAction, submitGraphTaskAction } from "@/modules/stage2/actions";
import type { GraphTaskPresentation, GraphTaskReveal } from "@/modules/stage2/graphTask";
import { Stage2Hints } from "../Stage2Hints";
import css from "./GraphTaskCard.module.css";

const SIZE = 220;

function toSvg(value: number, min: number, max: number): number {
  return ((value - min) / (max - min)) * SIZE;
}

/**
 * The SVG plot is decorative context only — every point is ALSO a real
 * `<button>` below it, so selection never depends on clicking inside the
 * (small, imprecise) SVG hit area and always works with keyboard/screen
 * readers. Never color-only: each button's own visible text ("Обрано" /
 * "Правильно" / "Неправильно" via `aria-pressed` + a text badge) carries the
 * state, color is a reinforcing cue only.
 */
export function GraphTaskCard({ taskId, roundId, diagnostic = false, onAnswered }: { taskId: number; roundId?: number; diagnostic?: boolean; onAnswered?: () => void }) {
  const t = useTranslations("Stage2");
  const [task, setTask] = useState<GraphTaskPresentation | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [result, setResult] = useState<
    { correct: boolean; retryAvailable?: true; revealed?: GraphTaskReveal } | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getGraphTaskAction(taskId, undefined, roundId).then((state) => {
      if (cancelled) return;
      if (state.status === "success") {
        setTask(state.task);
        const prior = state.task.priorResult;
        if (prior?.status === "correct") {
          setResult({ correct: true });
        } else if (prior?.status === "locked") {
          setResult({ correct: false, revealed: prior.revealed });
        } else if (prior?.status === "retry_available") {
          setResult({ correct: false, retryAvailable: true });
          if (prior.submittedPointIds) setSelected(new Set(prior.submittedPointIds));
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

  const revealed = result?.revealed ?? null;
  const isLocked = result !== null && !result.retryAvailable;
  const correctSet = new Set(revealed?.correctPointIds ?? []);

  function toggle(id: number) {
    if (isLocked || checking) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleCheck() {
    if (checking || isLocked) return;
    setChecking(true);
    setError(null);
    try {
      const state = await submitGraphTaskAction({
        taskId,
        roundId,
        expectedAttempt: result?.retryAvailable ? 2 : 1,
        submittedPointIds: [...selected],
      });
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

      <div className={css.svgWrap} aria-hidden="true">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className={css.svg}>
          <line x1={0} y1={SIZE / 2} x2={SIZE} y2={SIZE / 2} className={css.axis} />
          <line x1={SIZE / 2} y1={0} x2={SIZE / 2} y2={SIZE} className={css.axis} />
          {task.points.map((p) => {
            const cx = toSvg(p.x, task.axisMin, task.axisMax);
            const cy = SIZE - toSvg(p.y, task.axisMin, task.axisMax);
            const isSelected = selected.has(p.id);
            const isCorrect = revealed && correctSet.has(p.id);
            const isWrong = revealed && isSelected && !correctSet.has(p.id);
            return (
              <g key={p.id}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={7}
                  className={clsx(
                    css.dot,
                    isSelected && css.dotSelected,
                    isCorrect && css.dotCorrect,
                    isWrong && css.dotWrong,
                  )}
                />
                <text x={cx + 9} y={cy - 6} className={css.pointLabel}>
                  {p.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className={css.points} role="group" aria-label={t("graphPointsLabel")}>
        {task.points.map((p) => {
          const isSelected = selected.has(p.id);
          const isCorrect = revealed && correctSet.has(p.id);
          const isWrong = revealed && isSelected && !correctSet.has(p.id);
          return (
            <button
              key={p.id}
              type="button"
              disabled={isLocked || checking}
              className={clsx(
                css.point,
                isSelected && css.pointSelected,
                isCorrect && css.pointCorrect,
                isWrong && css.pointWrong,
              )}
              onClick={() => toggle(p.id)}
              aria-pressed={isSelected}
            >
              {p.label} ({p.x}; {p.y}){isSelected ? ` — ${t("selectedBadge")}` : ""}
            </button>
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
      {revealed?.explanation ? <MathText text={revealed.explanation} /> : null}
      {result?.retryAvailable && !diagnostic ? <Stage2Hints format="graph" taskId={taskId} roundId={roundId} /> : null}
      {error ? <p role="alert">{error}</p> : null}

      {!isLocked ? (
        <button type="button" className={css.checkButton} onClick={handleCheck} disabled={checking}>
          {checking ? t("checking") : t("check")}
        </button>
      ) : null}
    </div>
  );
}
