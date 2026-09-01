import type { Metadata, Viewport } from "next";
import {
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_SHORT_NAME,
  SITE_TAGLINE,
  THEME_COLOR,
  absoluteUrl,
  buildOrganizationJsonLd,
  buildWebApplicationJsonLd,
  buildWebsiteJsonLd,
  createPageMetadata,
  siteIcons,
} from "@/constants/seo";
import { JsonLd } from "@/components/seo";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getCurrentUser } from "@/modules/auth";
import { getRecentResults } from "@/modules/results/getRecentResults";
import "./globals.css";

/** MySQL env is for runtime on the host; skip static prerender that hits the DB at build. */
export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: THEME_COLOR },
    { media: "(prefers-color-scheme: dark)", color: THEME_COLOR },
  ],
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  ...createPageMetadata({
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    path: "/",
  }),
  metadataBase: new URL(absoluteUrl("/")),
  applicationName: SITE_NAME,
  keywords: SITE_KEYWORDS,
  authors: [{ name: SITE_NAME, url: absoluteUrl("/") }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: siteIcons(),
  appleWebApp: {
    capable: true,
    title: SITE_SHORT_NAME,
    statusBarStyle: "default",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

const structuredData = [
  buildWebsiteJsonLd(),
  buildOrganizationJsonLd(),
  buildWebApplicationJsonLd(),
];

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  let recentResults: Awaited<ReturnType<typeof getRecentResults>> = [];
  if (user) {
    try {
      recentResults = await getRecentResults(user.id);
    } catch (error) {
      console.error("layout: getRecentResults failed", error);
    }
  }

  return (
    <html lang="uk">
      <body>
        <JsonLd data={structuredData} />
        <DashboardShell recentResults={recentResults} user={user}>
          {children}
        </DashboardShell>
      </body>
    </html>
  );
}
