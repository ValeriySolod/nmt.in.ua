import type { MetadataRoute } from "next";
import { PUBLIC_PAGE_PATHS } from "@/constants/publicRoutes";
import { absoluteUrl } from "@/constants/seo";

/** `/t` is a public prefix for `/t/{slug}` cards — there is no index page.
 *  Verify/reset links are token URLs — keep them out of the sitemap. */
const SITEMAP_EXCLUDED = new Set([
  "/t",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
]);

const SITEMAP_PUBLIC_PATHS = [
  ...PUBLIC_PAGE_PATHS.filter((path) => !SITEMAP_EXCLUDED.has(path)),
  "/register/teacher",
];

/** Public marketing/auth/diagnostic URLs only — cabinet routes 307 to /login. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return SITEMAP_PUBLIC_PATHS.map((path) => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency:
      path === "/" ? "daily" : path === "/register/teacher" ? "monthly" : "weekly",
    priority:
      path === "/"
        ? 1
        : path === "/welcome"
          ? 0.9
          : path === "/register/teacher"
            ? 0.8
            : 0.6,
  }));
}
