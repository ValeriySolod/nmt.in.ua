"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

/**
 * "Робота над помилками" entry point on the Practice summary —
 * `startMistakeReviewRoundAction` starts a brand-new session containing the
 * wrong/skipped tasks and this hook navigates to it. Kept out of
 * `TopicTrainerSummary` itself so that component stays a plain presentational
 * one, and out of `TopicTrainer.tsx` to avoid a circular import between the
 * two components.
 */
export function useMistakeReviewRound(sessionId: number) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const t = useTranslations("TopicTrainerSummary");

  async function start() {
    if (loading) return;
    setLoading(true);
    setMessage(null);
    try {
      const { startMistakeReviewRoundAction } = await import("@/modules/testing/actions");
      const result = await startMistakeReviewRoundAction({ sessionId });
      if (result.status === "success") {
        router.push(`/session/${result.sessionId}`);
        return;
      }
      setMessage(
        result.code === "noMistakes" ? t("noMistakesToReview") : t("mistakeReviewError"),
      );
    } finally {
      setLoading(false);
    }
  }

  return { start, loading, message };
}
