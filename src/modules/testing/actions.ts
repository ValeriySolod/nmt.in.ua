"use server";

import {
  recommendNextActions,
  persistRecommendations,
} from "@/modules/recommendations";
import { getStudentTopicStats } from "@/modules/recommendations/getStudentTopicStats";
import { revalidatePath } from "next/cache";
import {
  checkAnswer,
  CheckAnswerError,
  type CheckAnswerResult,
} from "./checkAnswer";
import {
  finishTrainerSession,
  FinishTrainerSessionError,
} from "./finishTrainerSession";
import {
  markSessionStarted,
  MarkSessionStartedError,
} from "./markSessionStarted";
import { startTopicTest, StartTopicTestError } from "./startTopicTest";
import type {
  CheckAnswerActionInput,
  CheckAnswerActionState,
  FinishTrainerSessionActionInput,
  FinishTrainerSessionActionState,
  MarkSessionStartedActionInput,
  MarkSessionStartedActionState,
} from "./types";

export type StartTopicTestActionState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; sessionId: number };

const GENERIC_ERROR_MESSAGE = "Не вдалося запустити тест. Спробуйте ще раз.";
const INSUFFICIENT_TASKS_MESSAGE =
  "Для цієї теми поки що немає завдань у банку питань.";
const IN_PROGRESS_MESSAGE = "Запит уже виконується — зачекайте.";
const INVALID_INPUT_MESSAGE = "Оберіть тему, щоб почати тест.";
const CHECK_GENERIC_ERROR_MESSAGE =
  "Не вдалося перевірити відповідь. Спробуйте ще раз.";
const CHECK_INVALID_INPUT_MESSAGE = "Оберіть один із варіантів відповіді.";
const CHECK_NOT_FOUND_MESSAGE = "Завдання не знайдено в цій сесії.";
const CHECK_COMPLETED_MESSAGE = "Цей тест уже завершено.";
const FINISH_GENERIC_ERROR_MESSAGE =
  "Не вдалося завершити тест. Спробуйте ще раз.";
const FINISH_INVALID_INPUT_MESSAGE = "Сесію не знайдено.";
const FINISH_NOT_FOUND_MESSAGE = "Сесію не знайдено.";
const FINISH_UNFINISHED_MESSAGE =
  "Спочатку дайте відповідь на всі завдання.";
const MARK_STARTED_GENERIC_ERROR_MESSAGE =
  "Не вдалося зафіксувати час старту.";
const MARK_STARTED_INVALID_INPUT_MESSAGE = "Сесію не знайдено.";
const MARK_STARTED_NOT_FOUND_MESSAGE = "Сесію не знайдено.";

// TODO: replace with the authenticated user's id once auth is implemented.
// The repo has no auth/user-context source yet, so this Server Action uses
// a fixed demo user (team-confirmed) instead of accepting a client-supplied
// value.
const DEMO_USER_ID = 1;

type StartTopicTestActionDeps = {
  startTopicTest: typeof startTopicTest;
};

/**
 * Server Action for "Старт" on the topic-test screen. The user id is a
 * trusted server-side constant (`DEMO_USER_ID`), never taken from the
 * client — see the TODO above. `deps` is test-only DI; production callers
 * (React) never pass it, so the default (the real business function) applies.
 */
export async function startTopicTestAction(
  _prevState: StartTopicTestActionState,
  formData: FormData,
  deps: StartTopicTestActionDeps = { startTopicTest },
): Promise<StartTopicTestActionState> {
  const themeId = Number(formData.get("themeId"));

  try {
    const result = await deps.startTopicTest({
      userId: DEMO_USER_ID,
      themeId,
    });
    return { status: "success", sessionId: result.sessionId };
  } catch (error) {
    if (error instanceof StartTopicTestError) {
      switch (error.code) {
        case "insufficient_tasks":
          return { status: "error", message: INSUFFICIENT_TASKS_MESSAGE };
        case "already_in_progress":
          return { status: "error", message: IN_PROGRESS_MESSAGE };
        case "invalid_input":
          return { status: "error", message: INVALID_INPUT_MESSAGE };
        default:
          return { status: "error", message: GENERIC_ERROR_MESSAGE };
      }
    }
    console.error("startTopicTestAction: unexpected error", error);
    return { status: "error", message: GENERIC_ERROR_MESSAGE };
  }
}

export type { CheckAnswerActionInput, CheckAnswerActionState };
export type {
  FinishTrainerSessionActionInput,
  FinishTrainerSessionActionState,
  MarkSessionStartedActionInput,
  MarkSessionStartedActionState,
};

type CheckAnswerActionDeps = {
  checkAnswer: typeof checkAnswer;
};

/**
 * Server Action for a chosen option in TopicTrainer. User id is the trusted
 * server-side `DEMO_USER_ID`. The payload never includes `right_answer_n`.
 */
export async function checkAnswerAction(
  input: CheckAnswerActionInput,
  deps: CheckAnswerActionDeps = { checkAnswer },
): Promise<CheckAnswerActionState> {
  try {
    const result: CheckAnswerResult = await deps.checkAnswer({
      userId: DEMO_USER_ID,
      sessionId: input.sessionId,
      mappingId: input.mappingId,
      answerNumber: input.answerNumber,
    });
    return { status: "success", correct: result.correct };
  } catch (error) {
    if (error instanceof CheckAnswerError) {
      switch (error.code) {
        case "invalid_input":
          return { status: "error", message: CHECK_INVALID_INPUT_MESSAGE };
        case "not_found":
          return { status: "error", message: CHECK_NOT_FOUND_MESSAGE };
        case "session_completed":
          return { status: "error", message: CHECK_COMPLETED_MESSAGE };
        default:
          return { status: "error", message: CHECK_GENERIC_ERROR_MESSAGE };
      }
    }
    console.error("checkAnswerAction: unexpected error", error);
    return { status: "error", message: CHECK_GENERIC_ERROR_MESSAGE };
  }
}

type FinishTrainerSessionActionDeps = {
  finishTrainerSession: typeof finishTrainerSession;
  getStudentTopicStats: typeof getStudentTopicStats;
  persistRecommendations: typeof persistRecommendations;
};

const defaultFinishDeps: FinishTrainerSessionActionDeps = {
  finishTrainerSession,
  getStudentTopicStats,
  persistRecommendations,
};

/**
 * Server Action for "Завершити тест". User id is the trusted
 * `DEMO_USER_ID`. Re-finishing a completed session returns the same summary.
 */
export async function finishTrainerSessionAction(
  input: FinishTrainerSessionActionInput,
  deps: FinishTrainerSessionActionDeps = defaultFinishDeps,
): Promise<FinishTrainerSessionActionState> {
  try {
    const summary = await deps.finishTrainerSession({
      userId: DEMO_USER_ID,
      sessionId: input.sessionId,
    });

    const stats = await deps.getStudentTopicStats(DEMO_USER_ID);
    const rawActions = recommendNextActions(stats);
    const { actions: recommendations } = await deps.persistRecommendations(
      DEMO_USER_ID,
      rawActions,
    );

    try {
      revalidatePath("/results");
      revalidatePath("/sessions");
      revalidatePath("/");
    } catch {
      // No-op outside a Next.js request context (unit tests).
    }

    return { status: "success", summary, recommendations };
  } catch (error) {
    if (error instanceof FinishTrainerSessionError) {
      switch (error.code) {
        case "invalid_input":
          return { status: "error", message: FINISH_INVALID_INPUT_MESSAGE };
        case "not_found":
          return { status: "error", message: FINISH_NOT_FOUND_MESSAGE };
        case "unfinished":
          return { status: "error", message: FINISH_UNFINISHED_MESSAGE };
        default:
          return { status: "error", message: FINISH_GENERIC_ERROR_MESSAGE };
      }
    }
    console.error("finishTrainerSessionAction: unexpected error", error);
    return { status: "error", message: FINISH_GENERIC_ERROR_MESSAGE };
  }
}

type MarkSessionStartedActionDeps = {
  markSessionStarted: typeof markSessionStarted;
};

/**
 * Server Action fired on first trainer mount. User id is the trusted
 * `DEMO_USER_ID`. Re-entry returns the existing `start_time`.
 */
export async function markSessionStartedAction(
  input: MarkSessionStartedActionInput,
  deps: MarkSessionStartedActionDeps = { markSessionStarted },
): Promise<MarkSessionStartedActionState> {
  try {
    const result = await deps.markSessionStarted({
      userId: DEMO_USER_ID,
      sessionId: input.sessionId,
    });
    return { status: "success", startTime: result.startTime };
  } catch (error) {
    if (error instanceof MarkSessionStartedError) {
      switch (error.code) {
        case "invalid_input":
          return { status: "error", message: MARK_STARTED_INVALID_INPUT_MESSAGE };
        case "not_found":
          return { status: "error", message: MARK_STARTED_NOT_FOUND_MESSAGE };
        default:
          return { status: "error", message: MARK_STARTED_GENERIC_ERROR_MESSAGE };
      }
    }
    console.error("markSessionStartedAction: unexpected error", error);
    return { status: "error", message: MARK_STARTED_GENERIC_ERROR_MESSAGE };
  }
}
