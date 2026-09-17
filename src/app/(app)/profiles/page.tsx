import { getTranslations } from "next-intl/server";
import { AdminProfilesPanel } from "@/components/admin/AdminProfilesPanel";
import { PageFrame } from "@/components/dashboard/PageFrame";
import { getNavItem } from "@/constants/navigation";
import { createPageMetadata } from "@/constants/seo";
import { requireRole } from "@/modules/auth/getCurrentUser";
import { USER_ROLES, type UserRole } from "@/modules/auth/types";
import { getAdminProfiles } from "@/modules/admin-profiles";
import { readSearchParam } from "@/lib/queryHref";

const item = getNavItem("/profiles");

export async function generateMetadata() {
  const t = await getTranslations("Metadata.profiles");

  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    path: item.href,
  });
}

type ProfilesPageProps = {
  searchParams: Promise<{ role?: string | string[] }>;
};

function parseRoleFilter(raw: string | undefined): "all" | UserRole {
  if (raw && (USER_ROLES as readonly string[]).includes(raw)) {
    return raw as UserRole;
  }
  return "all";
}

export default async function ProfilesPage({ searchParams }: ProfilesPageProps) {
  const user = await requireRole(["admin"]);
  const t = await getTranslations("AdminProfiles");
  const params = await searchParams;
  const roleFilter = parseRoleFilter(readSearchParam(params.role));

  let profiles: Awaited<ReturnType<typeof getAdminProfiles>> = [];
  try {
    profiles = await getAdminProfiles();
  } catch (error) {
    console.error("profiles: getAdminProfiles failed", error);
  }

  return (
    <PageFrame kicker={t("kicker")} title={t("title")} lead={t("lead")}>
      <AdminProfilesPanel
        profiles={profiles}
        currentUserId={user.id}
        roleFilter={roleFilter}
      />
    </PageFrame>
  );
}
