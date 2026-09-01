"use server";

import { revalidatePath } from "next/cache";
import { requireRole, requireUserId } from "@/modules/auth";
import { createMentorSession } from "./createMentorSession";
import {
  cancelLearningSession,
  CancelLearningSessionError,
} from "./cancelLearningSession";

export type CancelLearningSessionActionState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success" };

export type AssignMentorSessionActionState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; sessionId: number; created: boolean };

const GENERIC_ERROR = "Не вдалося скасувати сесію. Спробуйте ще раз.";

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
          return { status: "error", message: "Сесію не знайдено." };
        case "not_cancelable":
          return {
            status: "error",
            message: "Виконану сесію не можна скасувати.",
          };
        case "invalid_input":
          return { status: "error", message: "Невірний ідентифікатор сесії." };
        default:
          return { status: "error", message: GENERIC_ERROR };
      }
    }
    console.error("cancelLearningSessionAction: unexpected error", error);
    return { status: "error", message: GENERIC_ERROR };
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
      message: "Не вдалося призначити mentor-сесію. Перевірте тему та учня.",
    };
  }
}
