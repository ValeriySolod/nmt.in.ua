import { getNavItem } from "@/constants/navigation";
import { StubPage } from "./StubPage";

type NavStubPageProps = {
  href: string;
};

/** Renders a nav-backed stub screen in the shared dashboard style. */
export function NavStubPage({ href }: NavStubPageProps) {
  const item = getNavItem(href);
  return <StubPage title={item.label} description={item.description} />;
}
