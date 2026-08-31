import { TopicTestStart } from "@/components/dashboard/TopicTestStart";
import { createPageMetadata } from "@/constants/seo";
import { getAvailableTopicThemes } from "@/modules/testing/getAvailableTopicThemes";
import { TOPIC_TEST_TASK_COUNT } from "@/modules/testing/startTopicTest";

export const metadata = createPageMetadata({
  title: "Тест за обраною темою",
  description:
    "Тренувальний тест НМТ за обраною темою: оберіть тему, кількість завдань і починайте практику.",
  path: "/",
});

export default async function HomePage() {
  const themes = await getAvailableTopicThemes();

  return (
    <TopicTestStart themes={themes} maxTaskCount={TOPIC_TEST_TASK_COUNT} />
  );
}
