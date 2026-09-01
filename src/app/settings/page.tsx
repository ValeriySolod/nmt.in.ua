import { PageFrame } from "@/components/dashboard/PageFrame";
import { ContentImportForm } from "@/components/settings/ContentImportForm";
import { getNavItem } from "@/constants/navigation";
import { createPageMetadata } from "@/constants/seo";
import { isContentImportConfigured } from "@/modules/content-import/auth";
import { requireRole } from "@/modules/auth";
const item = getNavItem("/settings");

export const metadata = createPageMetadata({
  title: item.label,
  description: item.description,
  path: item.href,
});

export default async function SettingsPage() {
  await requireRole(["admin"]);
  const importEnabled = isContentImportConfigured();
  return (
    <PageFrame title={item.label} lead={item.description}>
      <ContentImportForm importEnabled={importEnabled} />
    </PageFrame>
  );
}
