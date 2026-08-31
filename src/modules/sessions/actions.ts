"use server";

import { revalidatePath } from "next/cache";
import {
  cancelLearningSession,
  CancelLearningSessionError,
} from "./cancelLearningSession";

export type CancelLearningSessionActionState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success" };

const GENERIC_ERROR = "Не вдалося скасувати сесію. Спробуйте ще раз.";

export async function cancelLearningSessionAction(
  _prevState: CancelLearningSessionActionState,
  formData: FormData,
): Promise<CancelLearningSessionActionState> {
  const sessionId = Number(formData.get("sessionId"));

  try {
    await cancelLearningSession(sessionId);
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
