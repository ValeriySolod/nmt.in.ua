import { RecommendedActionsPanel } from "@/components/dashboard/RecommendedActionsPanel";
import { TopicResultsTable } from "@/components/dashboard/TopicResultsTable";
import { getNavItem } from "@/constants/navigation";
import { createPageMetadata } from "@/constants/seo";
import { requireUserId } from "@/modules/auth";
import { getStudentTopicStats } from "@/modules/recommendations/getStudentTopicStats";
import { recommendNextActionsForStats } from "@/modules/recommendations";
import { getTopicResults } from "@/modules/results/getTopicResults";
import { getTranslations } from "next-intl/server";
const item = getNavItem("/results");

export const metadata = createPageMetadata({
  title: item.label,
  description: item.description,
  path: item.href,
});

export default async function ResultsPage() {
  const userId = await requireUserId();
  const t = await getTranslations("Recommendations");

  const [rows, topicStats] = await Promise.all([
    getTopicResults(userId),
    getStudentTopicStats(userId),
  ]);

  const actions = await recommendNextActionsForStats(topicStats, t);

  return (
    <>
      <TopicResultsTable rows={rows} />
      <RecommendedActionsPanel actions={actions} />
    </>
  );
}
