import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DiagnosticShell } from "@/components/diagnostic/DiagnosticShell";
import { MarathonJoin } from "@/components/marathon/MarathonJoin";
import { createPageMetadata } from "@/constants/seo";
import { getCurrentUser } from "@/modules/auth/getCurrentUser";
import { getDailyBySlug } from "@/modules/marathons/daily/store";
import { readUtm } from "@/modules/marathons/daily/utm";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const t = await getTranslations("Metadata.marathonJoin");
  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    path: `/marathon/${slug}/join`,
    noIndex: true,
  });
}

export default async function MarathonJoinPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const marathon = await getDailyBySlug(slug);
  if (!marathon || marathon.status !== "active") notFound();
  const user = await getCurrentUser();
  if (user) redirect(`/marathon/${slug}/map`);
  return (
    <DiagnosticShell>
      <MarathonJoin
        slug={slug}
        title={marathon.title}
        error={one(query.error)}
        utm={readUtm({
          utm_source: one(query.utm_source),
          utm_medium: one(query.utm_medium),
          utm_campaign: one(query.utm_campaign),
          utm_content: one(query.utm_content),
          utm_term: one(query.utm_term),
        })}
      />
    </DiagnosticShell>
  );
}
