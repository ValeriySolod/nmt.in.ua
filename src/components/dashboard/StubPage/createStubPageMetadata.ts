import { getTranslations } from "next-intl/server";
import { getNavItem } from "@/constants/navigation";
import { createPageMetadata } from "@/constants/seo";
import type { Metadata } from "next";

export async function createStubPageMetadata(
  href: string,
  translationKey: string,
): Promise<Metadata> {
  const item = getNavItem(href);
  const t = await getTranslations(`Metadata.${translationKey}` as never);

  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    path: item.href,
  });
}
