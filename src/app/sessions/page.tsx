import { StubPage } from "@/components/dashboard/StubPage";
import { getNavItem } from "@/constants/navigation";
import { createPageMetadata } from "@/constants/seo";

const item = getNavItem("/sessions");

export const metadata = createPageMetadata({
  title: item.label,
  description: item.description,
  path: item.href,
});

export default function SessionsPage() {
  return <StubPage title={item.label} description={item.description} />;
}
