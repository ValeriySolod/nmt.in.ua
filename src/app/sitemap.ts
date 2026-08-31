import type { MetadataRoute } from "next";
import { DASHBOARD_NAV } from "@/constants/navigation";
import { absoluteUrl } from "@/constants/seo";

/** Public dashboard routes for search indexing (excludes /session/* and /api/*). */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return DASHBOARD_NAV.map((item) => ({
    url: absoluteUrl(item.href),
    lastModified: now,
    changeFrequency: item.href === "/" ? "daily" : "weekly",
    priority: item.href === "/" ? 1 : 0.7,
  }));
}
