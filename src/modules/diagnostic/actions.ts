"use server";

import { revalidatePath } from "next/cache";
import type {
  CheckAnswerActionInput,
  CheckAnswerActionState,
  FinishTrainerSessionActionState,
  MarkSessionStartedActionState,
} from "@/modules/testing/types";
import {
  checkDiagnosticAnswer,
  CheckDiagnosticAnswerError,
} from "./checkDiagnosticAnswer";
import {
  finishDiagnosticSession,
  FinishDiagnosticSessionError,
} from "./finishDiagnosticSession";
import {
  markDiagnosticSessionStarted,
  MarkDiagnosticSessionStartedError,
} from "./markDiagnosticSessionStarted";
import { resolveOwnerForWrite } from "./sessionOwner";
import {
  startDiagnosticTest,
  StartDiagnosticTestError,
} from "./startDiagnosticTest";
import {
  startDiagnosticTopic,
  StartDiagnosticTopicError,
} from "./startDiagnosticTopic";
import {
  advanceDiagnosticSession,
  AdvanceDiagnosticSessionError,
} from "./advanceDiagnosticSession";
import {
  getDiagnosticThemeBreakdown,
  toDiagnosticTopicInsight,
  type DiagnosticTopicInsight,
} from "./diagnosticThemeBreakdown";
import { diagnosticKnowledgeLevelToScore } from "./diagnosticKnowledgeLevel";

export type StartDiagnosticActionErrorCode =
  | "insufficientTasks"
  | "alreadyInProgress"
  | "generic";

export type StartDiagnosticActionState =
  | { status: "idle" }
  | { status: "error"; code: StartDiagnosticActionErrorCode }
  | { status: "success"; sessionId: number; isGuest: boolean };

const INITIAL_STATE: StartDiagnosticActionState = { status: "idle" };

/**
 * One round trip: resolves the caller's identity (authenticated user, or a
 * signed guest cookie minted here if absent), then creates the diagnostic
 * session. Combining these in one action avoids ever minting the guest
 * cookie mid-flow under one identity and creating the session under
 * another. There is no overall self-assessment any more — each topic asks
 * for its own before its tasks (`startDiagnosticTopicAction`).
 */
export async function startDiagnosticAction(
  _prevState: StartDiagnosticActionState = INITIAL_STATE,
  _formData?: FormData,
): Promise<StartDiagnosticActionState> {
  try {
    const owner = await resolveOwnerForWrite();
    const result = await startDiagnosticTest({ owner });
    return {
      status: "success",
      sessionId: result.sessionId,
      isGuest: owner.userId === null,
    };
  } catch (error) {
    if (error instanceof StartDiagnosticTestError) {
      switch (error.code) {
        case "insufficient_tasks":
          return { status: "error", code: "insufficientTasks" };
        case "already_in_progress":
          return { status: "error", code: "alreadyInProgress" };
        default:
          return { status: "error", code: "generic" };
      }
    }
    console.error("startDiagnosticAction: unexpected error", error);
    return { status: "error", code: "generic" };
  }
}

export type StartDiagnosticTopicActionErrorCode =
  | "invalidSelfScore"
  | "stale"
  | "sessionExpired"
  | "generic";

export type StartDiagnosticTopicActionState =
  | { status: "idle" }
  | { status: "error"; code: StartDiagnosticTopicActionErrorCode }
  | { status: "success" };

function readPositiveInt(formData: FormData, name: string): number | null {
  const value = Number(formData.get(name));
  return Number.isInteger(value) && value > 0 ? value : null;
}

/**
 * Records the student's three-level knowledge choice for the topic shown on
 * screen. The choice maps to the existing internal difficulty bands before
 * `startDiagnosticTopic`; ownership always comes from the server-resolved
 * identity, never from the form.
 */
export async function startDiagnosticTopicAction(
  _prevState: StartDiagnosticTopicActionState,
  formData: FormData,
): Promise<StartDiagnosticTopicActionState> {
  const selfScore = diagnosticKnowledgeLevelToScore(
    formData.get("knowledgeLevel"),
  );
  if (selfScore === null) {
    return { status: "error", code: "invalidSelfScore" };
  }
  const sessionId = readPositiveInt(formData, "sessionId");
  const themeId = readPositiveInt(formData, "themeId");
  if (sessionId === null || themeId === null) {
    return { status: "error", code: "generic" };
  }

  try {
    const owner = await resolveOwnerForWrite();
    await startDiagnosticTopic({ owner, sessionId, themeId, selfScore });
    return { status: "success" };
  } catch (error) {
    if (error instanceof StartDiagnosticTopicError) {
      switch (error.code) {
        case "invalid_input":
          return { status: "error", code: "invalidSelfScore" };
        case "step_mismatch":
        case "session_completed":
          return { status: "error", code: "stale" };
        case "session_expired":
          return { status: "error", code: "sessionExpired" };
        default:
          return { status: "error", code: "generic" };
      }
    }
    console.error("startDiagnosticTopicAction: unexpected error", error);
    return { status: "error", code: "generic" };
  }
}

export type AdvanceDiagnosticActionState =
  | { status: "success"; next: "task" | "topic" | "complete" }
  | { status: "error"; code: "notFound" | "sessionExpired" | "generic" };

/** Links the next adaptive task after the latest one was answered, or
 * reports that a topic screen / finishing comes next. */
export async function advanceDiagnosticAction(input: {
  sessionId: number;
}): Promise<AdvanceDiagnosticActionState> {
  try {
    const owner = await resolveOwnerForWrite();
    const result = await advanceDiagnosticSession({
      owner,
      sessionId: input.sessionId,
    });
    return { status: "success", next: result.next };
  } catch (error) {
    if (error instanceof AdvanceDiagnosticSessionError) {
      switch (error.code) {
        case "invalid_input":
        case "not_found":
          return { status: "error", code: "notFound" };
        case "session_expired":
          return { status: "error", code: "sessionExpired" };
        default:
          return { status: "error", code: "generic" };
      }
    }
    console.error("advanceDiagnosticAction: unexpected error", error);
    return { status: "error", code: "generic" };
  }
}

export type CheckDiagnosticAnswerActionInput = CheckAnswerActionInput;

export async function checkDiagnosticAnswerAction(
  input: CheckDiagnosticAnswerActionInput,
): Promise<CheckAnswerActionState> {
  try {
    if (input.answerNumber == null) {
      return { status: "error", code: "invalidInput" };
    }
    const owner = await resolveOwnerForWrite();
    const result = await checkDiagnosticAnswer({
      owner,
      sessionId: input.sessionId,
      mappingId: input.mappingId,
      answerNumber: input.answerNumber,
    });
    // Diagnostic is always single-attempt (no retry ladder — see AGENTS.md),
    // so every check is trivially the row's first (and only) attempt.
    return { status: "success", correct: result.correct, firstAttempt: true };
  } catch (error) {
    if (error instanceof CheckDiagnosticAnswerError) {
      switch (error.code) {
        case "invalid_input":
          return { status: "error", code: "invalidInput" };
        case "not_found":
          return { status: "error", code: "notFound" };
        case "session_completed":
          return { status: "error", code: "sessionCompleted" };
        case "session_expired":
          return { status: "error", code: "sessionExpired" };
        default:
          return { status: "error", code: "generic" };
      }
    }
    console.error("checkDiagnosticAnswerAction: unexpected error", error);
    return { status: "error", code: "generic" };
  }
}

export type FinishDiagnosticSessionActionInput = { sessionId: number };

export async function finishDiagnosticSessionAction(
  input: FinishDiagnosticSessionActionInput,
): Promise<FinishTrainerSessionActionState> {
  try {
    const owner = await resolveOwnerForWrite();
    const summary = await finishDiagnosticSession({
      owner,
      sessionId: input.sessionId,
    });

    try {
      revalidatePath("/results");
    } catch {
      // No-op outside a Next.js request context (unit tests).
    }

    // `insight` (went-well/needs-attention) is a Practice-only summary
    // feature — `DiagnosticResultSummary` never reads it. Filled with a
    // neutral, data-only shape purely to satisfy the shared
    // `FinishTrainerSessionActionState` type; diagnostic keeps its own
    // dedicated summary/breakdown (`toDiagnosticTopicInsight`) unchanged.
    return {
      status: "success",
      summary,
      recommendations: [],
      insight: {
        correctCount: summary.rightNumber,
        totalCount: summary.tasksNumber,
        percent: summary.percent,
        strongThemes: [],
        weakThemes: [],
        hasRepeatedMistakes: false,
      },
    };
  } catch (error) {
    if (error instanceof FinishDiagnosticSessionError) {
      switch (error.code) {
        case "invalid_input":
          return { status: "error", code: "invalidInput" };
        case "not_found":
          return { status: "error", code: "notFound" };
        case "unfinished":
          return { status: "error", code: "unfinished" };
        case "session_expired":
          return { status: "error", code: "sessionExpired" };
        default:
          return { status: "error", code: "generic" };
      }
    }
    console.error("finishDiagnosticSessionAction: unexpected error", error);
    return { status: "error", code: "generic" };
  }
}

/**
 * Fetched as a follow-up call after a successful finish — same shape as how
 * `getSessionMistakeReviewAction` enriches the Ultimate summary — rather than
 * folded into `FinishTrainerSessionActionState`, so the shared testing/type
 * surface used by standard and Ultimate sessions stays untouched.
 */
export async function getDiagnosticThemeBreakdownAction(
  sessionId: number,
): Promise<DiagnosticTopicInsight> {
  try {
    const owner = await resolveOwnerForWrite();
    const stats = await getDiagnosticThemeBreakdown(sessionId, owner);
    return toDiagnosticTopicInsight(stats);
  } catch (error) {
    console.error("getDiagnosticThemeBreakdownAction: unexpected error", error);
    return { strongest: [], priority: [] };
  }
}

export type MarkDiagnosticSessionStartedActionInput = { sessionId: number };

export async function markDiagnosticSessionStartedAction(
  input: MarkDiagnosticSessionStartedActionInput,
): Promise<MarkSessionStartedActionState> {
  try {
    const owner = await resolveOwnerForWrite();
    const result = await markDiagnosticSessionStarted({
      owner,
      sessionId: input.sessionId,
    });
    return { status: "success", startTime: result.startTime };
  } catch (error) {
    if (error instanceof MarkDiagnosticSessionStartedError) {
      switch (error.code) {
        case "invalid_input":
          return { status: "error", code: "invalidInput" };
        case "not_found":
          return { status: "error", code: "notFound" };
        case "session_expired":
          return { status: "error", code: "sessionExpired" };
        default:
          return { status: "error", code: "generic" };
      }
    }
    console.error(
      "markDiagnosticSessionStartedAction: unexpected error",
      error,
    );
    return { status: "error", code: "generic" };
  }
}
