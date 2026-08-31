import { NavStubPage, createStubPageMetadata } from "@/components/dashboard/StubPage";

const { metadata } = createStubPageMetadata("/settings");
export { metadata };

export default function SettingsPage() {
  return <NavStubPage href="/settings" />;
}
