import { getTranslations } from "next-intl/server";
import { FeedbackAdminList } from "@/components/feedback/FeedbackAdminList";
import { PageFrame } from "@/components/dashboard/PageFrame";
import { getNavItem } from "@/constants/navigation";
import { createPageMetadata } from "@/constants/seo";
import { requireRole } from "@/modules/auth/getCurrentUser";
import { getFeedbackList } from "@/modules/feedback/getFeedbackList";

const item = getNavItem("/feedback");

export async function generateMetadata() {
  const t = await getTranslations("Metadata.feedback");

  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    path: item.href,
  });
}

export default async function FeedbackPage() {
  await requireRole(["admin"]);

  const t = await getTranslations("FeedbackAdmin");
  let feedbackRows: Awaited<ReturnType<typeof getFeedbackList>> = [];
  try {
    feedbackRows = await getFeedbackList();
  } catch (error) {
    console.error("feedback: getFeedbackList failed", error);
  }

  return (
    <PageFrame kicker={t("kicker")} title={t("title")} lead={t("lead")}>
      <FeedbackAdminList rows={feedbackRows} />
    </PageFrame>
  );
}
