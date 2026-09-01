import { notFound } from "next/navigation";
import { TopicTrainer } from "@/components/testing/TopicTrainer";
import { createPageMetadata } from "@/constants/seo";
import {
  getSessionTasks,
  GetSessionTasksError,
} from "@/modules/testing/getSessionTasks";
import type { SessionTasksResult } from "@/modules/testing/types";

type SessionPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: SessionPageProps) {
  const { id } = await params;
  return createPageMetadata({
    title: "Проходження тесту",
    description: "Інтерактивний тренажер: завдання тесту за обраною темою.",
    path: `/session/${id}`,
    noIndex: true,
  });
}

async function loadSession(sessionId: number): Promise<SessionTasksResult> {
  try {
    return await getSessionTasks(sessionId);
  } catch (error) {
    if (
      error instanceof GetSessionTasksError &&
      (error.code === "session_not_found" || error.code === "invalid_input")
    ) {
      notFound();
    }
    throw error;
  }
}

export default async function SessionPage({ params }: SessionPageProps) {
  const { id } = await params;
  const sessionId = Number(id);

  if (!Number.isInteger(sessionId) || sessionId <= 0) {
    notFound();
  }

  const session = await loadSession(sessionId);

  return (
    <TopicTrainer
      sessionId={session.sessionId}
      tasks={session.tasks}
      initialSummary={session.summary}
    />
  );
}
