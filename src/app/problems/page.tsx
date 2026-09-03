import {
  NavStubPage,
  createStubPageMetadata,
} from "@/components/dashboard/StubPage";

export async function generateMetadata() {
  return createStubPageMetadata("/problems", "problems");
}

export default function ProblemsPage() {
  return <NavStubPage href="/problems" />;
}
