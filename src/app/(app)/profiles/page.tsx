import { getTranslations } from "next-intl/server";
import { AdminProfilesPanel } from "@/components/admin/AdminProfilesPanel";
import { PageFrame } from "@/components/dashboard/PageFrame";
import { getNavItem } from "@/constants/navigation";
import { createPageMetadata } from "@/constants/seo";
import { requireRole } from "@/modules/auth/getCurrentUser";
import { getAdminProfiles } from "@/modules/admin-profiles";

const item = getNavItem("/profiles");

export async function generateMetadata() {
  const t = await getTranslations("Metadata.profiles");

  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    path: item.href,
  });
}

export default async function ProfilesPage() {
  const user = await requireRole(["admin"]);
  const t = await getTranslations("AdminProfiles");

  let profiles: Awaited<ReturnType<typeof getAdminProfiles>> = [];
  try {
    profiles = await getAdminProfiles();
  } catch (error) {
    console.error("profiles: getAdminProfiles failed", error);
  }

  return (
    <PageFrame kicker={t("kicker")} title={t("title")} lead={t("lead")}>
      <AdminProfilesPanel profiles={profiles} currentUserId={user.id} />
    </PageFrame>
  );
}
