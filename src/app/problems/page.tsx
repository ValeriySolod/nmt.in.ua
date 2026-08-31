import { NavStubPage, createStubPageMetadata } from "@/components/dashboard/StubPage";

const { metadata } = createStubPageMetadata("/problems");
export { metadata };

export default function ProblemsPage() {
  return <NavStubPage href="/problems" />;
}
