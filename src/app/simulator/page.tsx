import { NavStubPage, createStubPageMetadata } from "@/components/dashboard/StubPage";

const { metadata } = createStubPageMetadata("/simulator");
export { metadata };

export default function SimulatorPage() {
  return <NavStubPage href="/simulator" />;
}
