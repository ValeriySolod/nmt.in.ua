"use client";

import { useTranslations } from "next-intl";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MathText } from "@/components/ui/MathText";
import { TaskVisualArea } from "@/components/testing/TaskVisualArea";
import {
  startDiagnosticTopicAction,
  type StartDiagnosticTopicActionState,
} from "@/modules/diagnostic/actions";
import { DIAGNOSTIC_KNOWLEDGE_LEVELS } from "@/modules/diagnostic/diagnosticKnowledgeLevel";
import type { DiagnosticTopicIntroView } from "@/modules/diagnostic/getDiagnosticNextStep";
import { resolveTaskPresentation } from "@/modules/testing/taskPresentation";
import css from "./DiagnosticTopicIntro.module.css";

const INITIAL_STATE: StartDiagnosticTopicActionState = { status: "idle" };

type DiagnosticTopicIntroProps = {
  sessionId: number;
  topic: DiagnosticTopicIntroView;
};

const HOW_ITEMS = ["adaptive", "accuracy", "difficulty", "next"] as const;

type HowItem = (typeof HOW_ITEMS)[number];

function HowIcon({ item }: { item: HowItem }) {
  if (item === "adaptive") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m3 10 9-4 9 4-9 4-9-4Z" />
        <path d="M7 12.2v4.2c2.8 2.1 7.2 2.1 10 0v-4.2M4.5 11.2v5" />
      </svg>
    );
  }

  if (item === "accuracy") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="7" />
        <circle cx="12" cy="12" r="3" />
        <path d="m14 10 6-6M16 4h4v4" />
      </svg>
    );
  }

  if (item === "difficulty") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8.3 15.5A7 7 0 1 1 15.7 15.5c-1 .7-1.7 1.6-1.7 2.5h-4c0-.9-.7-1.8-1.7-2.5Z" />
        <path d="M10 21h4M9.5 18h5" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14M14 7l5 5-5 5" />
      <path d="M5 6v12" />
    </svg>
  );
}

/**
 * Shown before each topic of the adaptive diagnostic: the topic, its main
 * concepts, one real example task and three knowledge choices. Submitting a
 * choice records the internal difficulty band, then the page re-reads the
 * session and shows the next topic or starts the test.
 */
export function DiagnosticTopicIntro({ sessionId, topic }: DiagnosticTopicIntroProps) {
  const t = useTranslations("Diagnostic.topic");
  const diagnosticT = useTranslations("Diagnostic");
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    startDiagnosticTopicAction,
    INITIAL_STATE,
  );

  // `stale`: this screen no longer matches the session (another tab moved
  // on, or a double submit) — re-read the server state instead of erroring.
  const shouldRefresh =
    state.status === "success" ||
    (state.status === "error" && state.code === "stale");

  useEffect(() => {
    if (shouldRefresh) router.refresh();
  }, [shouldRefresh, router]);

  const controlsDisabled = pending || shouldRefresh;
  const description = topic.concepts.join(", ");
  const punctuatedDescription = /[.!?]$/.test(description)
    ? description
    : `${description}.`;
  const examplePresentation = topic.exampleTask
    ? resolveTaskPresentation(topic.exampleTask)
    : null;

  return (
    <div className={css.page}>
      <p className={css.kicker}>{diagnosticT("kicker")}</p>

      <section className={css.topicCard} aria-labelledby="diagnostic-topic-title">
        <div className={css.topicHeader}>
          <p className={css.progress}>
            {t("progress", {
              current: topic.topicNumber,
              total: topic.topicCount,
            })}
          </p>
          <h1 id="diagnostic-topic-title" className={css.title}>
            {topic.themeName}
          </h1>
          {description ? (
            <p className={css.description}>{punctuatedDescription}</p>
          ) : null}
        </div>

        <div className={css.divider} />

        <form className={css.form} action={formAction}>
          <div className={css.assessmentHeading}>
            <h2 className={css.question}>{t("question")}</h2>
            <p className={css.questionHint}>{t("questionHint")}</p>
          </div>

          {topic.exampleTask && examplePresentation ? (
            <article className={css.exampleCard} aria-labelledby="diagnostic-example-title">
              <p className={css.exampleLabel}>{t("exampleLabel")}</p>
              <h3 id="diagnostic-example-title" className={css.exampleTitle}>
                {topic.exampleTask.name}
              </h3>
              <TaskVisualArea visual={examplePresentation.visual} />
              <MathText
                as="div"
                className={css.exampleText}
                text={examplePresentation.displayText}
              />
            </article>
          ) : null}

          <input type="hidden" name="sessionId" value={sessionId} />
          <input type="hidden" name="themeId" value={topic.themeId} />

          <div
            className={css.choices}
            role="group"
            aria-label={t("knowledgeChoicesAria", { theme: topic.themeName })}
          >
            {DIAGNOSTIC_KNOWLEDGE_LEVELS.map((level) => (
              <button
                key={level}
                type="submit"
                name="knowledgeLevel"
                value={level}
                className={css.choiceButton}
                disabled={controlsDisabled}
              >
                {t(`choices.${level}`)}
              </button>
            ))}
          </div>
          {controlsDisabled ? (
            <p className={css.loading} role="status">{t("loading")}</p>
          ) : null}
        </form>

        {state.status === "error" && state.code !== "stale" ? (
          <p className={css.error} role="alert">
            {t(`errors.${state.code}`)}
          </p>
        ) : null}
      </section>

      <section className={css.howCard} aria-labelledby="diagnostic-how-title">
        <h2 id="diagnostic-how-title" className={css.howTitle}>
          {t("howItWorks.title")}
        </h2>
        <div className={css.howGrid}>
          {HOW_ITEMS.map((item) => (
            <article key={item} className={css.howItem}>
              <span className={css.howIcon}>
                <HowIcon item={item} />
              </span>
              <div>
                <h3 className={css.howItemTitle}>
                  {t(`howItWorks.items.${item}.title`)}
                </h3>
                <p className={css.howItemText}>
                  {t(`howItWorks.items.${item}.text`)}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
