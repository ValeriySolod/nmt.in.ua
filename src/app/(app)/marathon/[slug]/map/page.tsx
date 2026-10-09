import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { MarathonMapView } from "@/components/marathon/MarathonMapView";
import { createPageMetadata } from "@/constants/seo";
import { requireUser } from "@/modules/auth/getCurrentUser";
import { listDayAccess } from "@/modules/marathons/daily/calendar";
import { optionalTelegramBot } from "@/modules/marathons/daily/botLink";
import {
  getDailyBySlug,
  getParticipant,
  listDays,
  listProgress,
} from "@/modules/marathons/daily/store";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string | string[] }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const t = await getTranslations("Metadata.marathonMap");
  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    path: `/marathon/${slug}/map`,
    noIndex: true,
  });
}

export default async function MarathonMapPage({ params, searchParams }: PageProps) {
  const user = await requireUser();
  const { slug } = await params;
  const query = await searchParams;
  const marathon = await getDailyBySlug(slug);
  if (!marathon || marathon.status === "draft") notFound();
  if (marathon.status !== "active" && marathon.status !== "finished") notFound();
  const [days, participant, progress, locale] = await Promise.all([
    listDays(marathon.id),
    getParticipant(marathon.id, user.id),
    listProgress(marathon.id, user.id),
    getLocale(),
  ]);
  if (marathon.status === "active" && !participant) {
    // Stay on the map: the view offers join for an existing account.
  }
  const access = listDayAccess({
    now: new Date(),
    startDate: marathon.startDate,
    unlockHour: marathon.unlockHour,
    daysCount: marathon.daysCount,
  });
  const error = Array.isArray(query.error) ? query.error[0] : query.error;
  return (
    <MarathonMapView
      marathon={marathon}
      participant={participant}
      locale={locale}
      botReady={Boolean(optionalTelegramBot())}
      error={error}
      days={access.map((item) => {
        const content = days.find((day) => day.dayNumber === item.dayNumber);
        return {
          dayNumber: item.dayNumber,
          topic: content?.topic ?? "",
          open: item.open && Boolean(content),
          unlockAt: item.unlockAt,
          progress: progress.find((row) => row.dayNumber === item.dayNumber),
        };
      })}
    />
  );
}
