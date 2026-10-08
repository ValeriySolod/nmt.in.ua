import "server-only";
import { getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { recommendNextActionsForStats, recommendFromSessionMistakes, persistRecommendations, buildPracticeResultInsight, type RecommendationTranslator } from "@/modules/recommendations";
import { getStudentTopicStats } from "@/modules/recommendations/getStudentTopicStats";
import { getSessionMistakeReview } from "./getSessionMistakeReview";
import type { TrainerSessionSummary } from "./types";

type Deps = {
  getStudentTopicStats: typeof getStudentTopicStats;
  recommendNextActionsForStats: typeof recommendNextActionsForStats;
  recommendFromSessionMistakes: typeof recommendFromSessionMistakes;
  getSessionMistakeReview: typeof getSessionMistakeReview;
  persistRecommendations: typeof persistRecommendations;
  getRecommendationTranslator?: (locale: "uk" | "en" | "de") => Promise<RecommendationTranslator>;
};

export async function sessionCompletionFollowUp(userId: number, summary: TrainerSessionSummary, locale: "uk" | "en" | "de" = "uk", deps: Deps = {
  getStudentTopicStats, recommendNextActionsForStats, recommendFromSessionMistakes, getSessionMistakeReview, persistRecommendations,
}) {
  const translatorFactory = deps.getRecommendationTranslator ?? (async (language) => {
    const t = await getTranslations({ locale: language, namespace: "Recommendations" });
    return (key, values) => t(key as never, values as never);
  });
  const t = await translatorFactory(locale);
  const mistakes = await deps.getSessionMistakeReview(summary.sessionId, userId);
  const topicStats = await deps.getStudentTopicStats(userId);
  const fromMistakes = deps.recommendFromSessionMistakes(mistakes, t);
  const rawActions = fromMistakes.length > 0 ? fromMistakes : await deps.recommendNextActionsForStats(topicStats, t);
  const { actions: recommendations } = await deps.persistRecommendations(userId, rawActions);
  const insight = buildPracticeResultInsight({ summary, mistakes, topicStats });
  try {
    revalidatePath("/results");
    revalidatePath("/sessions");
    revalidatePath("/");
  } catch {}
  return { recommendations, insight };
}
