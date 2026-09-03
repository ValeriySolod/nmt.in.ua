import {
  NavStubPage,
  createStubPageMetadata,
} from "@/components/dashboard/StubPage";

export async function generateMetadata() {
  return createStubPageMetadata("/materials", "materials");
}

export default function MaterialsPage() {
  return <NavStubPage href="/materials" />;
}
