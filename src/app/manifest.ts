import type { MetadataRoute } from "next";
import {
  BACKGROUND_COLOR,
  ICON_PATHS,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_SHORT_NAME,
  THEME_COLOR,
  absoluteUrl,
} from "@/constants/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_SHORT_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: BACKGROUND_COLOR,
    theme_color: THEME_COLOR,
    lang: "uk",
    orientation: "portrait-primary",
    icons: [
      {
        src: ICON_PATHS.favicon,
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: ICON_PATHS.appleTouch,
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
      {
        src: ICON_PATHS.appleTouch,
        sizes: "180x180",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
