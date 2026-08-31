import { NavStubPage, createStubPageMetadata } from "@/components/dashboard/StubPage";

const { metadata } = createStubPageMetadata("/consultations");
export { metadata };

export default function ConsultationsPage() {
  return <NavStubPage href="/consultations" />;
}
