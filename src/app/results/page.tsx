import { TopicResultsTable } from "@/components/dashboard/TopicResultsTable";
import { getNavItem } from "@/constants/navigation";
import { createPageMetadata } from "@/constants/seo";
import { getTopicResults } from "@/modules/results/getTopicResults";

const item = getNavItem("/results");

export const metadata = createPageMetadata({
  title: item.label,
  description: item.description,
  path: item.href,
});

export default async function ResultsPage() {
  const rows = await getTopicResults();

  return <TopicResultsTable rows={rows} />;
}
