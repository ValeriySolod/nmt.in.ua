"use client";
import Link from "next/link";
import clsx from "clsx";
import type { RecommendedAction } from "@/modules/recommendations";
import { useTranslations } from "next-intl";
import css from "./RecommendedActionsPanel.module.css";

const ACTION_ICONS: Record<RecommendedAction["type"], string> = {
  "topic-test": "∑",
  simulator: "◎",
  materials: "▣",
  problems: "ƒ",
  consultation: "✉",
};

type RecommendedActionsPanelProps = {
  actions: RecommendedAction[];
  title?: string;
  lead?: string;
  className?: string;
};

export function RecommendedActionsPanel({
  actions,
  title,
  lead,
  className,
}: RecommendedActionsPanelProps) {
  const t = useTranslations("RecommendedActions");

  const resolvedTitle = title ?? t("title");

  const resolvedLead = lead ?? t("lead");
  return (
    <section
      className={clsx(css.recommendedActions, className)}
      aria-labelledby="recommended-actions-title"
    >
      <header className={css.intro}>
        <h2 id="recommended-actions-title" className={css.title}>
          {resolvedTitle}
        </h2>
        <p className={css.lead}>{resolvedLead}</p>
      </header>

      {actions.length === 0 ? (
        <p className={css.empty} role="status">
          {t("empty")}
          <Link href="/" className={css.emptyLink}>
            {t("goToTest")}
          </Link>
        </p>
      ) : (
        <ul className={css.list}>
          {actions.map((action, index) => (
            <li
              key={`${action.type}-${action.themeId ?? index}`}
              className={css.card}
            >
              <span className={css.icon} aria-hidden>
                {ACTION_ICONS[action.type]}
              </span>
              <div className={css.body}>
                <h3 className={css.cardTitle}>{action.title}</h3>
                <p className={css.reason}>{action.reason}</p>
              </div>
              <Link href={action.href} className={css.action}>
                {t("go")}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
