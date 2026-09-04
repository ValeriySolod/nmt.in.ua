"use server";

import { revalidatePath } from "next/cache";
import { requireRole, requireUserId } from "@/modules/auth/getCurrentUser";
import { createMentorSession } from "./createMentorSession";
import {
  cancelLearningSession,
  CancelLearningSessionError,
} from "./cancelLearningSession";

export type CancelLearningSessionErrorCode =
  | "notFound"
  | "notCancelable"
  | "invalidInput"
  | "generic";

export type AssignMentorSessionErrorCode = "generic";

export type CancelLearningSessionActionState =
  | { status: "idle" }
  | { status: "error"; code: CancelLearningSessionErrorCode }
  | { status: "success" };

export type AssignMentorSessionActionState =
  | { status: "idle" }
  | { status: "error"; code: AssignMentorSessionErrorCode }
  | { status: "success"; sessionId: number; created: boolean };

type CancelDeps = {
  cancelLearningSession: typeof cancelLearningSession;
  requireUserId: typeof requireUserId;
};

type AssignDeps = {
  createMentorSession: typeof createMentorSession;
  requireRole: typeof requireRole;
};

export async function cancelLearningSessionAction(
  _prevState: CancelLearningSessionActionState,
  formData: FormData,
  deps: CancelDeps = {
    cancelLearningSession,
    requireUserId,
  },
): Promise<CancelLearningSessionActionState> {
  const sessionId = Number(formData.get("sessionId"));

  try {
    const userId = await deps.requireUserId();
    await deps.cancelLearningSession(sessionId, userId);
    revalidatePath("/sessions");
    return { status: "success" };
  } catch (error) {
    if (error instanceof CancelLearningSessionError) {
      switch (error.code) {
        case "not_found":
          return { status: "error", code: "notFound" };

        case "not_cancelable":
          return { status: "error", code: "notCancelable" };

        case "invalid_input":
          return { status: "error", code: "invalidInput" };

        default:
          return { status: "error", code: "generic" };
      }
    }

    console.error("cancelLearningSessionAction: unexpected error", error);
    return { status: "error", code: "generic" };
  }
}

export async function assignMentorSessionAction(
  _prevState: AssignMentorSessionActionState,
  formData: FormData,
  deps: AssignDeps = { createMentorSession, requireRole },
): Promise<AssignMentorSessionActionState> {
  await deps.requireRole(["teacher", "admin"]);

  const userId = Number(formData.get("userId"));
  const themeId = Number(formData.get("themeId"));

  try {
    const result = await deps.createMentorSession({ userId, themeId });
    revalidatePath("/sessions");
    return {
      status: "success",
      sessionId: result.sessionId,
      created: result.created,
    };
  } catch (error) {
    console.error("assignMentorSessionAction: unexpected error", error);
    return {
      status: "error",
      code: "generic",
    };
  }
}
