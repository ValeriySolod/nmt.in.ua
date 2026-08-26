import { StubPage } from "@/components/dashboard/StubPage";
import { getNavItem } from "@/constants/navigation";
import { createPageMetadata } from "@/constants/seo";

const item = getNavItem("/simulator");

export const metadata = createPageMetadata({
  title: item.label,
  description: item.description,
  path: item.href,
});

export default function SimulatorPage() {
  return <StubPage title={item.label} description={item.description} />;
}
