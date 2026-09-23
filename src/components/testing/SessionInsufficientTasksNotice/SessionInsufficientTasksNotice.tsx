"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { PageFrame, PagePanel } from "@/components/dashboard/PageFrame";
import css from "../SessionExpiredNotice/SessionExpiredNotice.module.css";

/**
 * Planned / assigned session cannot start because the quiz bank has no
 * tasks for the theme (and optional difficulty). Replaces a 500 from
 * `startPlannedSession` → `insufficient_tasks`.
 */
export function SessionInsufficientTasksNotice() {
  const t = useTranslations("SessionInsufficientTasksNotice");

  return (
    <PageFrame title={t("title")} lead={t("lead")}>
      <PagePanel>
        <p className={css.note}>{t("body")}</p>
        <Link href="/sessions" className={css.cta}>
          {t("backToSessions")}
        </Link>
      </PagePanel>
    </PageFrame>
  );
}
