import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { MarathonFinalView } from "@/components/marathon/MarathonFinalView";
import { createPageMetadata } from "@/constants/seo";
import { requireUser } from "@/modules/auth/getCurrentUser";
import {
  getDailyBySlug,
  getParticipant,
  listDays,
  listProgress,
} from "@/modules/marathons/daily/store";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const t = await getTranslations("Metadata.marathonFinal");
  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    path: `/marathon/${slug}/final`,
    noIndex: true,
  });
}

export default async function MarathonFinalPage({ params }: PageProps) {
  const user = await requireUser();
  const { slug } = await params;
  const marathon = await getDailyBySlug(slug);
  if (!marathon || marathon.status === "draft") notFound();
  const participant = await getParticipant(marathon.id, user.id);
  if (!participant) notFound();
  const [days, progress] = await Promise.all([
    listDays(marathon.id),
    listProgress(marathon.id, user.id),
  ]);
  return (
    <MarathonFinalView
      marathon={marathon}
      days={days}
      progress={progress}
      participant={participant}
    />
  );
}
