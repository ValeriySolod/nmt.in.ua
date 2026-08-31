import { NavStubPage, createStubPageMetadata } from "@/components/dashboard/StubPage";

const { metadata } = createStubPageMetadata("/materials");
export { metadata };

export default function MaterialsPage() {
  return <NavStubPage href="/materials" />;
}
