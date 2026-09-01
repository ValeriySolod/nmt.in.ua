"use client";

import Link from "next/link";
import { RecommendedActionsPanel } from "@/components/dashboard/RecommendedActionsPanel";
import { formatPercent } from "@/modules/results/types";
import type { RecommendedAction } from "@/modules/recommendations";
import { formatDurationSeconds } from "@/modules/sessions/types";
import type { TrainerSessionSummary } from "@/modules/testing/types";
import css from "./TopicTrainerSummary.module.css";

type TopicTrainerSummaryProps = {
  summary: TrainerSessionSummary;
  recommendations?: RecommendedAction[];
};

export function TopicTrainerSummary({
  summary,
  recommendations = [],
}: TopicTrainerSummaryProps) {
  return (
    <section className={css.summary} aria-labelledby="trainer-summary-title">
      <header className={css.intro}>
        <h1 id="trainer-summary-title" className={css.title}>
          Підсумок тесту
        </h1>
        <p className={css.lead}>
          Тема «{summary.themeName}». Сесія №{summary.sessionId}.
        </p>
      </header>

      <dl className={css.stats}>
        <div className={css.stat}>
          <dt>Вірно</dt>
          <dd>
            {summary.rightNumber} / {summary.tasksNumber}
          </dd>
        </div>
        <div className={css.stat}>
          <dt>Результат</dt>
          <dd>{formatPercent(summary.percent)}</dd>
        </div>
        <div className={css.stat}>
          <dt>Час, с</dt>
          <dd>{formatDurationSeconds(summary.timeSec)}</dd>
        </div>
      </dl>

      <RecommendedActionsPanel
        actions={recommendations}
        title="Рекомендуємо далі"
        lead="Наступні кроки на основі вашого результату."
        className={css.recommendations}
      />

      <nav className={css.links} aria-label="Що далі">
        <Link href="/results" className={css.primary}>
          Результати за темами
        </Link>
        <Link href="/sessions" className={css.secondary}>
          Мої сесії
        </Link>
        <Link href="/" className={css.secondary}>
          Новий тест
        </Link>
      </nav>
    </section>
  );
}
