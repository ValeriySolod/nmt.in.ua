import { getTranslations } from "next-intl/server";
import { StubPage } from "./StubPage";

const NAV_KEYS = {
  "/materials": "materials",
  "/problems": "problems",
  "/consultations": "consultations",
} as const;

type NavStubPageProps = {
  href: keyof typeof NAV_KEYS;
};

export async function NavStubPage({ href }: NavStubPageProps) {
  const t = await getTranslations("Navigation");
  const key = NAV_KEYS[href];

  return (
    <StubPage title={t(`${key}.title`)} description={t(`${key}.description`)} />
  );
}
