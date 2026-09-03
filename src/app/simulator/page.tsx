import {
  NavStubPage,
  createStubPageMetadata,
} from "@/components/dashboard/StubPage";

export async function generateMetadata() {
  return createStubPageMetadata("/simulator", "simulator");
}

export default function SimulatorPage() {
  return <NavStubPage href="/simulator" />;
}
