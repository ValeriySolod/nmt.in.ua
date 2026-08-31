import type { Metadata } from "next";
import {
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_TAGLINE,
  absoluteUrl,
  createPageMetadata,
} from "@/constants/seo";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import "./globals.css";

/** MySQL env is for runtime on the host; skip static prerender that hits the DB at build. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  ...createPageMetadata({
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    path: "/",
  }),
  metadataBase: new URL(absoluteUrl("/")),
  applicationName: SITE_NAME,
  keywords: SITE_KEYWORDS,
  authors: [{ name: SITE_NAME }],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="uk">
      <body>
        <DashboardShell>{children}</DashboardShell>
      </body>
    </html>
  );
}
