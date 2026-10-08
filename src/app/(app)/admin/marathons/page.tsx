import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { MarathonAdminList } from "@/components/marathon/MarathonAdmin";
import { createPageMetadata } from "@/constants/seo";
import { requireUser } from "@/modules/auth/getCurrentUser";
import { hasPermission } from "@/modules/auth/permissions";
import { listDailyMarathons } from "@/modules/marathons/daily/store";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("Metadata.marathonAdmin");
  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    path: "/admin/marathons",
    noIndex: true,
  });
}

export default async function AdminMarathonsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const user = await requireUser();
  if (!hasPermission(user.role, "marathon:manage")) redirect("/");
  const query = await searchParams;
  const marathons = await listDailyMarathons();
  return (
    <MarathonAdminList
      marathons={marathons}
      error={Array.isArray(query.error) ? query.error[0] : query.error}
    />
  );
}
