import { LearningSessionsTable } from "@/components/dashboard/LearningSessionsTable";
import { getNavItem } from "@/constants/navigation";
import { createPageMetadata } from "@/constants/seo";
import { getLearningSessions } from "@/modules/sessions/getLearningSessions";

const item = getNavItem("/sessions");

export const metadata = createPageMetadata({
  title: item.label,
  description: item.description,
  path: item.href,
});

export default async function SessionsPage() {
  const rows = await getLearningSessions();

  return <LearningSessionsTable rows={rows} />;
}
