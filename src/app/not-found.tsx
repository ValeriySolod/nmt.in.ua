import { getLocale } from "next-intl/server";
import { StatusScene } from "@/components/status/StatusScene";
import { createPageMetadata } from "@/constants/seo";
import { statusCopy } from "@/i18n/statusPages";

export const metadata = createPageMetadata({
  title: "Сторінку не знайдено",
  description:
    "Цієї сторінки немає. Повернись на головну nmt.in.ua і продовж підготовку до НМТ з математики.",
  path: "/",
  noIndex: true,
});

export default async function NotFoundPage() {
  const locale = await getLocale();
  return <StatusScene variant="notFound" copy={statusCopy(locale)} />;
}
