"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { PostTestFeedbackPrompt } from "@/components/feedback/FeedbackDialog";
import { formatPercent } from "@/modules/results/types";
import { formatDurationSeconds } from "@/modules/sessions/types";
import { MathText } from "@/components/ui/MathText";
import { TaskVisualArea } from "@/components/testing/TaskVisualArea";
import { resolveTaskPresentation } from "@/modules/testing/taskPresentation";
import type { TrainerSessionSummary } from "@/modules/testing/types";
import type {
  DiagnosticThemeStat,
  DiagnosticTopicInsight,
} from "@/modules/diagnostic/diagnosticThemeBreakdown";
import { isPerfectDiagnosticResult } from "@/modules/diagnostic/diagnosticResultState";
import type { DiagnosticAnswerReviewItem } from "@/modules/diagnostic/getDiagnosticAnswerReview";
import css from "./DiagnosticResultSummary.module.css";

type DiagnosticResultSummaryProps = {
  summary: TrainerSessionSummary;
  /** `null` while the follow-up theme-breakdown call is still in flight, or
   * if it failed — never fabricated, so the priority/strong sections just
   * don't render rather than show made-up topics. */
  topicInsight: DiagnosticTopicInsight | null;
  answerReview: DiagnosticAnswerReviewItem[] | null;
  isGuest: boolean;
};

function TopicCard({ topic, tone }: { topic: DiagnosticThemeStat; tone: "priority" | "strong" }) {
  const t = useTranslations("DiagnosticResult");
  return (
    <li className={css.topicCard} data-tone={tone}>
      <p className={css.topicName}>{topic.themeName}</p>
      <p className={css.topicScore}>
        {t("topicScore", {
          correct: topic.correct,
          total: topic.total,
          percent: formatPercent(topic.percent),
        })}
      </p>
      <div className={css.topicBar} role="presentation">
        <span
          className={css.topicBarFill}
          style={{ width: `${Math.max(0, Math.min(100, topic.percent))}%` }}
        />
      </div>
    </li>
  );
}

function AnswerReview({ items }: { items: DiagnosticAnswerReviewItem[] }) {
  const t = useTranslations("DiagnosticResult");

  return (
    <ol className={css.answerReviewList}>
      {items.map((item, index) => {
        const presentation = resolveTaskPresentation(item);
        return (
          <li key={item.mappingId} className={css.answerReviewCard}>
            <div className={css.answerReviewMeta}>
              <span>{t("reviewTaskNumber", { number: index + 1 })}</span>
              <span className={css.answerReviewOutcome} data-correct={item.correct}>
                {t(item.correct ? "reviewCorrect" : "reviewIncorrect")}
              </span>
            </div>
            {item.name ? <p className={css.answerReviewName}>{item.name}</p> : null}
            <TaskVisualArea visual={presentation.visual} />
            <MathText as="div" text={presentation.displayText} />
            <div className={css.answerReviewAnswer}>
              <strong>{t("reviewCorrectAnswer")}</strong>
              {item.correctAnswerText ? (
                <span>
                  {item.correctAnswerNumber}. <MathText text={item.correctAnswerText} />
                </span>
              ) : (
                <span>{t("reviewAnswerUnavailable")}</span>
              )}
            </div>
            {item.explanation ? (
              <div className={css.answerReviewExplanation}>
                <strong>{t("reviewExplanation")}</strong>
                <MathText as="div" text={item.explanation} />
              </div>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

export function DiagnosticResultSummary({
  summary,
  topicInsight,
  answerReview,
  isGuest,
}: DiagnosticResultSummaryProps) {
  const t = useTranslations("DiagnosticResult");
  const priority = topicInsight?.priority ?? [];
  const strongest = topicInsight?.strongest ?? [];
  const isPerfect = isPerfectDiagnosticResult(summary.rightNumber, summary.tasksNumber);

  return (
    <section className={css.summary} aria-labelledby="diagnostic-result-title">
      <header className={css.intro}>
        <p className={css.kicker}>{t("kicker")}</p>
        <h1 id="diagnostic-result-title" className={css.title}>
          {t(isPerfect ? "perfectTitle" : "title")}
        </h1>
        <p className={css.lead}>{t(isPerfect ? "perfectLead" : "lead")}</p>
        <p className={css.sessionLabel}>{t("sessionLabel", { sessionId: summary.sessionId })}</p>
      </header>

      <dl className={css.stats}>
        <div className={css.stat}>
          <dt>{t("statCorrect")}</dt>
          <dd>
            {summary.rightNumber} / {summary.tasksNumber}
          </dd>
        </div>
        <div className={css.stat}>
          <dt>{t("statResult")}</dt>
          <dd>{formatPercent(summary.percent)}</dd>
        </div>
        <div className={css.stat}>
          <dt>{t("statTime")}</dt>
          <dd>{formatDurationSeconds(summary.timeSec)}</dd>
        </div>
      </dl>

      {topicInsight === null ? (
        <p className={css.analyzing} role="status">
          {t("analyzing")}
        </p>
      ) : priority.length > 0 ? (
        <section className={css.priority} aria-labelledby="diagnostic-priority-title">
          <h2 id="diagnostic-priority-title" className={css.sectionTitle}>
            {t("priorityTitle")}
          </h2>
          <ul className={css.topicList}>
            {priority.map((topic) => (
              <TopicCard key={topic.themeId} topic={topic} tone="priority" />
            ))}
          </ul>
        </section>
      ) : strongest.length === 0 && !isPerfect ? (
        <p className={css.analyzing} role="status">
          {t("noBreakdown")}
        </p>
      ) : null}

      {strongest.length > 0 ? (
        <section className={css.strong} aria-labelledby="diagnostic-strong-title">
          <h2 id="diagnostic-strong-title" className={css.sectionTitle}>
            {t("strongTitle")}
          </h2>
          <ul className={css.topicList}>
            {strongest.map((topic) => (
              <TopicCard key={topic.themeId} topic={topic} tone="strong" />
            ))}
          </ul>
        </section>
      ) : null}

      <section className={css.answerReview} aria-labelledby="diagnostic-answer-review-title">
        <h2 id="diagnostic-answer-review-title" className={css.sectionTitle}>
          {t("reviewTitle")}
        </h2>
        {answerReview === null ? (
          <p className={css.analyzing} role="status">{t("reviewLoading")}</p>
        ) : answerReview.length > 0 ? (
          <AnswerReview items={answerReview} />
        ) : (
          <p className={css.analyzing} role="status">{t("reviewUnavailable")}</p>
        )}
      </section>

      {isGuest ? null : (
        <nav className={css.links} aria-label={t("resultsCta")}>
          <Link href="/results" className={css.primary}>
            {t("resultsCta")}
          </Link>
          <Link href="/sessions" className={css.secondary}>
            {t("sessionsCta")}
          </Link>
        </nav>
      )}

      <nav className={css.links} aria-label={t("newTest")}>
        <Link href="/" className={css.secondary}>
          {t("newTest")}
        </Link>
      </nav>

      {isGuest ? (
        <section className={css.registerPanel} aria-labelledby="diagnostic-register-title">
          {isPerfect ? null : (
            <>
              <p className={css.lead}>{t("explanationIntro")}</p>
              <p className={css.lead}>{t("explanationDetail")}</p>
            </>
          )}
          <p className={css.registerKicker}>{t("registerKicker")}</p>
          <h2 id="diagnostic-register-title" className={css.registerTitle}>
            {t(isPerfect ? "perfectRegisterTitle" : "registerTitle")}
          </h2>
          <p className={css.sectionLead}>
            {t(isPerfect ? "perfectRegisterLead" : "registerLead")}
          </p>
          {isPerfect ? null : (
            <>
              <ul className={css.benefits}>
                <li>
                  <p className={css.benefitTitle}>{t("registerBenefit1Title")}</p>
                  <p className={css.benefitText}>{t("registerBenefit1Text")}</p>
                </li>
                <li>
                  <p className={css.benefitTitle}>{t("registerBenefit2Title")}</p>
                  <p className={css.benefitText}>{t("registerBenefit2Text")}</p>
                </li>
                <li>
                  <p className={css.benefitTitle}>{t("registerBenefit3Title")}</p>
                  <p className={css.benefitText}>{t("registerBenefit3Text")}</p>
                </li>
                <li>
                  <p className={css.benefitTitle}>{t("registerBenefit4Title")}</p>
                  <p className={css.benefitText}>{t("registerBenefit4Text")}</p>
                </li>
                <li>
                  <p className={css.benefitTitle}>{t("registerBenefit5Title")}</p>
                  <p className={css.benefitText}>{t("registerBenefit5Text")}</p>
                </li>
                <li>
                  <p className={css.benefitTitle}>{t("registerBenefit6Title")}</p>
                  <p className={css.benefitText}>{t("registerBenefit6Text")}</p>
                </li>
              </ul>
              <p className={css.registerClosing}>{t("registerClosing")}</p>
            </>
          )}
          <Link href="/register?from=diagnostic" className={css.registerCta}>
            {t(isPerfect ? "perfectRegisterCta" : "registerCta")}
          </Link>
          <p className={css.loginPrompt}>
            {t("loginPrompt")}{" "}
            <Link href="/login" className={css.loginLink}>
              {t("loginCta")}
            </Link>
          </p>
        </section>
      ) : null}

      <PostTestFeedbackPrompt sessionId={summary.sessionId} isGuest={isGuest} />
    </section>
  );
}
