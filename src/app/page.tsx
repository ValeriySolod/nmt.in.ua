import { TopicTestStart } from "@/components/dashboard/TopicTestStart";
import { createPageMetadata } from "@/constants/seo";

export const metadata = createPageMetadata({
  title: "Тест за обраною темою",
  description:
    "Тренувальний тест НМТ за обраною темою: оберіть тему, кількість завдань і починайте практику.",
  path: "/",
});

export default function HomePage() {
  return <TopicTestStart />;
}
