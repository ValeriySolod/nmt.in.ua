import { TopicTrainerMistakeReview } from "@/components/testing/TopicTrainerMistakeReview";
import type { SessionMistakeItem } from "@/modules/testing/getSessionMistakeReview";
import type { TopicTestMode } from "@/modules/testing/topicTestMode";
import { RecommendedActionsPanel } from "@/components/dashboard/RecommendedActionsPanel";
import { formatPercent } from "@/modules/results/types";
import type { RecommendedAction } from "@/modules/recommendations";
import { formatDurationSeconds } from "@/modules/sessions/types";
import type { TrainerSessionSummary } from "@/modules/testing/types";
import Link from "next/link";
import css from "./TopicTrainerSummary.module.css";

type TopicTrainerSummaryProps = {
  summary: TrainerSessionSummary;
  recommendations?: RecommendedAction[];
  mode?: TopicTestMode;
  timedOut?: boolean;
  mistakes?: SessionMistakeItem[];
};

export function TopicTrainerSummary({
  summary,
  recommendations = [],
  mode = "standard",
  timedOut = false,
  mistakes = [],
}: TopicTrainerSummaryProps) {
  const isUltimate = mode === "ultimate";

  return (
    <section className={css.summary} aria-labelledby="trainer-summary-title">
      <header className={css.intro}>
        <h1 id="trainer-summary-title" className={css.title}>
          {isUltimate ? "Ultimate — підсумок" : "Підсумок тесту"}
        </h1>
        <p className={css.lead}>
          Тема «{summary.themeName}». Сесія №{summary.sessionId}.
          {isUltimate ? (
            <>
              {" "}
              {timedOut ? "Час вийшов." : "Тест завершено."} Розбір помилок — нижче.
            </>
          ) : null}
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
          <dt>Час</dt>
          <dd>{formatDurationSeconds(summary.timeSec)}</dd>
        </div>
      </dl>

      {isUltimate && mistakes.length > 0 ? (
        <TopicTrainerMistakeReview mistakes={mistakes} />
      ) : null}

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
