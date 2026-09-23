"use client";

import { useState, useTransition } from "react";
import { Select } from "@/components/ui/Select";
import { saveThemeSelfScoreAction } from "@/modules/self-score/actions";
import css from "./TopicResultsTable.module.css";

const SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export type ThemeSelfScoreCellLabels = {
  aria: string;
  errorGeneric: string;
};

type ThemeSelfScoreCellProps = {
  themeId: number;
  value: number | null;
  labels: ThemeSelfScoreCellLabels;
};

function toSelectableScore(value: number | null): number | null {
  if (value == null) return null;
  if (value >= 1 && value <= 10) return value;
  return null;
}

export function ThemeSelfScoreCell({
  themeId,
  value,
  labels,
}: ThemeSelfScoreCellProps) {
  const [score, setScore] = useState<number | null>(() =>
    toSelectableScore(value),
  );
  const [prevValue, setPrevValue] = useState(value);
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();

  if (value !== prevValue) {
    setPrevValue(value);
    setScore(toSelectableScore(value));
  }

  function onChange(nextRaw: string) {
    const next = Number(nextRaw);
    if (!Number.isInteger(next) || next < 1 || next > 10) return;
    if (next === score) return;

    const previous = score;
    setScore(next);
    setError(false);

    startTransition(async () => {
      const result = await saveThemeSelfScoreAction({
        themeId,
        score: next,
      });
      if (result.status === "success") {
        setScore(result.score);
        return;
      }
      setScore(previous);
      setError(true);
    });
  }

  return (
    <div className={css.selfScoreCell}>
      <label className={css.visuallyHidden} htmlFor={`self-score-${themeId}`}>
        {labels.aria}
      </label>
      <Select
        id={`self-score-${themeId}`}
        variant="compact"
        value={score == null ? "" : String(score)}
        placeholder="—"
        disabled={pending}
        aria-label={labels.aria}
        aria-busy={pending}
        aria-invalid={error}
        title={error ? labels.errorGeneric : undefined}
        options={SCORES.map((n) => ({
          value: String(n),
          label: String(n),
        }))}
        onChange={onChange}
      />
    </div>
  );
}
