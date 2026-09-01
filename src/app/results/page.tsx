import { RecommendedActionsPanel } from "@/components/dashboard/RecommendedActionsPanel";
import { TopicResultsTable } from "@/components/dashboard/TopicResultsTable";
import { getNavItem } from "@/constants/navigation";
import { createPageMetadata } from "@/constants/seo";
import { getStudentTopicStats } from "@/modules/recommendations/getStudentTopicStats";
import { recommendNextActions } from "@/modules/recommendations";
import { getTopicResults } from "@/modules/results/getTopicResults";

const item = getNavItem("/results");

export const metadata = createPageMetadata({
  title: item.label,
  description: item.description,
  path: item.href,
});

export default async function ResultsPage() {
  const [rows, topicStats] = await Promise.all([
    getTopicResults(),
    getStudentTopicStats(),
  ]);
  const actions = recommendNextActions(topicStats);

  return (
    <>
      <TopicResultsTable rows={rows} />
      <RecommendedActionsPanel actions={actions} />
    </>
  );
}
