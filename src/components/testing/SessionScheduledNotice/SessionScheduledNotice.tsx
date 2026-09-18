"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { PageFrame, PagePanel } from "@/components/dashboard/PageFrame";
import { formatSessionStartTime } from "@/modules/sessions/types";
import css from "../SessionExpiredNotice/SessionExpiredNotice.module.css";

type SessionScheduledNoticeProps = {
  availableAt: number;
};

/** Planned mentor assignment opened before available_at. */
export function SessionScheduledNotice({
  availableAt,
}: SessionScheduledNoticeProps) {
  const t = useTranslations("SessionScheduledNotice");
  const date = formatSessionStartTime(availableAt);

  return (
    <PageFrame title={t("title")} lead={t("lead", { date })}>
      <PagePanel>
        <p className={css.note}>{t("body", { date })}</p>
        <Link href="/sessions" className={css.cta}>
          {t("backToSessions")}
        </Link>
      </PagePanel>
    </PageFrame>
  );
}
