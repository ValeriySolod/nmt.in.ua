import { LearningSessionsTable } from "@/components/dashboard/LearningSessionsTable";
import { getNavItem } from "@/constants/navigation";
import { createPageMetadata } from "@/constants/seo";
import { requireUser } from "@/modules/auth/getCurrentUser";
import { getLearningSessions } from "@/modules/sessions/getLearningSessions";
import { isQueryFlagOn, readSearchParam } from "@/lib/queryHref";

const item = getNavItem("/sessions");

export const metadata = createPageMetadata({
  title: item.label,
  description: item.description,
  path: item.href,
});

type SessionsPageProps = {
  searchParams: Promise<{ extended?: string | string[] }>;
};

export default async function SessionsPage({ searchParams }: SessionsPageProps) {
  const user = await requireUser();
  const params = await searchParams;
  const extended = isQueryFlagOn(readSearchParam(params.extended));
  const rows = await getLearningSessions(user.id);

  return <LearningSessionsTable rows={rows} extended={extended} />;
}
