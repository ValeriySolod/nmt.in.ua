"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/modules/auth/getCurrentUser";
import {
  cancelLearningSession,
  CancelLearningSessionError,
} from "./cancelLearningSession";

export type CancelLearningSessionErrorCode =
  | "notFound"
  | "notCancelable"
  | "invalidInput"
  | "generic";

export type CancelLearningSessionActionState =
  | { status: "idle" }
  | { status: "error"; code: CancelLearningSessionErrorCode }
  | { status: "success" };

type CancelDeps = {
  cancelLearningSession: typeof cancelLearningSession;
  requireUserId: typeof requireUserId;
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
