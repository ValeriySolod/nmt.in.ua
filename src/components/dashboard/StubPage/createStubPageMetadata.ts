import { getNavItem } from "@/constants/navigation";
import { createPageMetadata } from "@/constants/seo";
import type { Metadata } from "next";

/** Shared metadata + nav copy for dashboard stub routes. */
export function createStubPageMetadata(href: string): {
  item: ReturnType<typeof getNavItem>;
  metadata: Metadata;
} {
  const item = getNavItem(href);
  return {
    item,
    metadata: createPageMetadata({
      title: item.label,
      description: item.description,
      path: item.href,
    }),
  };
}
