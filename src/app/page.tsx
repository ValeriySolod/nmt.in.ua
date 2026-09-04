import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { TopicTestStart } from "@/components/dashboard/TopicTestStart";
import { WelcomeLanding } from "@/components/welcome/WelcomeLanding";
import { createPageMetadata } from "@/constants/seo";
import { getCurrentUser } from "@/modules/auth/getCurrentUser";
import { getAvailableTopicThemes } from "@/modules/testing/getAvailableTopicThemes";
import { parseThemeQueryParam } from "@/modules/testing/parseThemeQueryParam";

export async function generateMetadata() {
  const user = await getCurrentUser();

  if (!user) {
    const t = await getTranslations("Metadata.welcome");
    return createPageMetadata({
      title: t("title"),
      description: t("description"),
      path: "/",
    });
  }

  const t = await getTranslations("Metadata.home");
  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    path: "/",
  });
}

type HomePageProps = {
  searchParams: Promise<{ theme?: string | string[] }>;
};

function readThemeParam(
  raw: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(raw)) {
    return raw[0];
  }
  return raw;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const user = await getCurrentUser();

  if (!user) {
    return <WelcomeLanding />;
  }

  const params = await searchParams;
  const themes = await getAvailableTopicThemes();
  const initialThemeId = parseThemeQueryParam(readThemeParam(params.theme));

  return (
    <Suspense fallback={null}>
      <TopicTestStart
        themes={themes}
        initialThemeId={initialThemeId}
        displayName={user.displayName}
      />
    </Suspense>
  );
}
