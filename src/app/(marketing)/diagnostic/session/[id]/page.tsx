import { notFound } from "next/navigation";
import { TopicTrainer } from "@/components/testing/TopicTrainer";
import { SessionExpiredNotice } from "@/components/testing/SessionExpiredNotice";
import { DiagnosticShell } from "@/components/diagnostic/DiagnosticShell";
import { DiagnosticSessionRunner } from "@/components/diagnostic/DiagnosticSessionRunner";
import { DiagnosticTopicIntro } from "@/components/diagnostic/DiagnosticTopicIntro";
import { createPageMetadata } from "@/constants/seo";
import {
  checkDiagnosticAnswerAction,
  finishDiagnosticSessionAction,
  getDiagnosticThemeBreakdownAction,
  markDiagnosticSessionStartedAction,
} from "@/modules/diagnostic/actions";
import {
  getDiagnosticSessionTasks,
  GetDiagnosticSessionTasksError,
} from "@/modules/diagnostic/getDiagnosticSessionTasks";
import { getDiagnosticNextStep } from "@/modules/diagnostic/getDiagnosticNextStep";
import { DIAGNOSTIC_TOTAL_QUESTIONS } from "@/modules/diagnostic/diagnosticProgress";
import { TASK_STATUS_UNANSWERED } from "@/modules/testing/types";
import {
  resolveOwnerForRead,
  type SessionOwner,
} from "@/modules/diagnostic/sessionOwner";
import { getTranslations } from "next-intl/server";

type DiagnosticSessionPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: DiagnosticSessionPageProps) {
  const { id } = await params;
  const t = await getTranslations("Metadata.diagnosticSession");

  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    path: `/diagnostic/session/${id}`,
    noIndex: true,
  });
}

export default async function DiagnosticSessionPage({
  params,
}: DiagnosticSessionPageProps) {
  const { id } = await params;
  const sessionId = Number(id);

  if (!Number.isInteger(sessionId) || sessionId <= 0) {
    notFound();
  }

  // Read-only: an authenticated student resolves to their own identity; a
  // guest resolves to their existing signed nmt_guest cookie, if any. Never
  // mints a new one here — a guest with no valid cookie has nothing to see.
  const owner = await resolveOwnerForRead();
  if (!owner) {
    notFound();
  }

  let session;
  try {
    session = await getDiagnosticSessionTasks(sessionId, owner);
  } catch (error) {
    if (error instanceof GetDiagnosticSessionTasksError) {
      if (error.code === "session_not_found" || error.code === "invalid_input") {
        notFound();
      }
      if (error.code === "session_expired") {
        return <SessionExpiredNotice />;
      }
    }
    throw error;
  }

  if (!session.summary) {
    return renderInProgress(sessionId, owner, session);
  }

  // Completed attempt: the result screen is rendered exactly as before.
  return (
    <DiagnosticShell mathDecor="geometry">
      <TopicTrainer
        sessionId={sessionId}
        themeCode={session.themeCode}
        themeName={session.themeName}
        tasks={session.tasks}
        initialSummary={session.summary}
        initialRecommendations={[]}
        mode="diagnostic"
        isGuest={owner.userId === null}
        actions={{
          checkAnswer: checkDiagnosticAnswerAction,
          finishTrainerSession: finishDiagnosticSessionAction,
          markSessionStarted: markDiagnosticSessionStartedAction,
        }}
        diagnosticThemeBreakdownAction={getDiagnosticThemeBreakdownAction}
      />
    </DiagnosticShell>
  );
}

/**
 * Adaptive attempt still in progress: either the next topic's
 * self-assessment, or the tasks linked so far opened on the pending one.
 */
async function renderInProgress(
  sessionId: number,
  owner: SessionOwner,
  session: Awaited<ReturnType<typeof getDiagnosticSessionTasks>>,
) {
  const step = await getDiagnosticNextStep(sessionId, owner);

  if (step.kind === "topicIntro") {
    return (
      <DiagnosticShell mathDecor="geometry">
        <DiagnosticTopicIntro key={step.topic.themeId} sessionId={sessionId} topic={step.topic} />
      </DiagnosticShell>
    );
  }

  if (session.tasks.length === 0) {
    notFound();
  }

  const pendingIndex = session.tasks.findIndex(
    (task) => task.status === TASK_STATUS_UNANSWERED,
  );

  return (
    <DiagnosticShell mathDecor="geometry">
      <DiagnosticSessionRunner
        sessionId={sessionId}
        themeCode={session.themeCode}
        themeName={session.themeName}
        tasks={session.tasks}
        isGuest={owner.userId === null}
        initialIndex={
          pendingIndex === -1 ? session.tasks.length - 1 : pendingIndex
        }
        progressTotal={Math.max(DIAGNOSTIC_TOTAL_QUESTIONS, session.tasks.length)}
        continueAfterLast={step.afterLastTask === "continue"}
      />
    </DiagnosticShell>
  );
}
