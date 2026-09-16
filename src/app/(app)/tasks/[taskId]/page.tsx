import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AdminTaskForm } from "@/components/admin/AdminTaskForm";
import { PageFrame } from "@/components/dashboard/PageFrame";
import { createPageMetadata } from "@/constants/seo";
import {
  getAdminThemes,
  getNeighborTaskIds,
  getQuizTaskById,
} from "@/modules/admin-content";
import { requireRole } from "@/modules/auth/getCurrentUser";

type EditTaskPageProps = {
  params: Promise<{ taskId: string }>;
};

export async function generateMetadata({ params }: EditTaskPageProps) {
  const t = await getTranslations("AdminContent");
  const { taskId: raw } = await params;
  const taskId = Number(raw);
  const task =
    Number.isInteger(taskId) && taskId > 0
      ? await getQuizTaskById(taskId)
      : null;

  return createPageMetadata({
    title: task ? t("editTitleNamed", { name: task.name }) : t("editTitle"),
    description: t("editLead"),
    path: `/tasks/${raw}`,
  });
}

export default async function EditAdminTaskPage({ params }: EditTaskPageProps) {
  await requireRole(["admin"]);
  const t = await getTranslations("AdminContent");
  const { taskId: raw } = await params;
  const taskId = Number(raw);
  if (!Number.isInteger(taskId) || taskId <= 0) {
    notFound();
  }

  const task = await getQuizTaskById(taskId);
  if (!task) {
    notFound();
  }

  const [themes, neighbors] = await Promise.all([
    getAdminThemes(),
    getNeighborTaskIds(task.themeId, task.id),
  ]);

  return (
    <PageFrame
      kicker={t("kicker")}
      title={t("editTitle")}
      lead={t("editLead")}
    >
      <AdminTaskForm
        mode="edit"
        themes={themes}
        themeId={task.themeId}
        task={task}
        nextTaskId={neighbors.nextId}
        backHref={`/?theme=${task.themeId}`}
      />
    </PageFrame>
  );
}
