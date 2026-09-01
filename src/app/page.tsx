import { Suspense } from "react";
import { TopicTestStart } from "@/components/dashboard/TopicTestStart";
import { createPageMetadata } from "@/constants/seo";
import { getAvailableTopicThemes } from "@/modules/testing/getAvailableTopicThemes";
import { parseThemeQueryParam } from "@/modules/testing/parseThemeQueryParam";

export const metadata = createPageMetadata({
  title: "Тест за обраною темою",
  description:
    "Тренувальний тест НМТ за обраною темою: оберіть тему, кількість завдань і починайте практику.",
  path: "/",
});

type HomePageProps = {
  searchParams: Promise<{ theme?: string | string[] }>;
};

function readThemeParam(raw: string | string[] | undefined): string | undefined {
  if (Array.isArray(raw)) {
    return raw[0];
  }
  return raw;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const themes = await getAvailableTopicThemes();
  const initialThemeId = parseThemeQueryParam(readThemeParam(params.theme));

  return (
    <Suspense fallback={null}>
      <TopicTestStart
        themes={themes}
        initialThemeId={initialThemeId}
      />
    </Suspense>
  );
}
