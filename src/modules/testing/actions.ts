"use server";

import {
  recommendNextActionsForStats,
  persistRecommendations,
  type RecommendationTranslator,
} from "@/modules/recommendations";
import { getStudentTopicStats } from "@/modules/recommendations/getStudentTopicStats";
import { requireUserId } from "@/modules/auth";
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
import { parseTopicTestMode, type TopicTestMode } from "./topicTestMode";
import { skipTaskAnswer, SkipTaskAnswerError } from "./skipTaskAnswer";
import {
  getSessionMistakeReview,
  type SessionMistakeItem,
} from "./getSessionMistakeReview";
import type {
  CheckAnswerActionInput,
  CheckAnswerActionState,
  FinishTrainerSessionActionInput,
  FinishTrainerSessionActionState,
  MarkSessionStartedActionInput,
  MarkSessionStartedActionState,
  SkipTaskAnswerActionInput,
  SkipTaskAnswerActionState,
} from "./types";
import { getTranslations } from "next-intl/server";

export type StartTopicTestActionState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; sessionId: number; mode: TopicTestMode };

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
const FINISH_UNFINISHED_MESSAGE = "Спочатку дайте відповідь на всі завдання.";
const SKIP_GENERIC_ERROR_MESSAGE = "Не вдалося пропустити завдання.";
const SKIP_NOT_FOUND_MESSAGE = "Завдання не знайдено в цій сесії.";
const SKIP_COMPLETED_MESSAGE = "Цей тест уже завершено.";
const MARK_STARTED_GENERIC_ERROR_MESSAGE = "Не вдалося зафіксувати час старту.";
const MARK_STARTED_INVALID_INPUT_MESSAGE = "Сесію не знайдено.";
const MARK_STARTED_NOT_FOUND_MESSAGE = "Сесію не знайдено.";

type AuthDeps = {
  requireUserId: typeof requireUserId;
};

const defaultAuthDeps: AuthDeps = { requireUserId };

async function getRecommendationTranslator(
  locale: "uk" | "en" | "de",
): Promise<RecommendationTranslator> {
  const t = await getTranslations({
    locale,
    namespace: "Recommendations",
  });

  return (key, values) => t(key as never, values as never);
}

type StartTopicTestActionDeps = AuthDeps & {
  startTopicTest: typeof startTopicTest;
};

/**
 * Server Action for "Старт" on the topic-test screen. User id comes from the
 * authenticated session — never from client input.
 */
export async function startTopicTestAction(
  _prevState: StartTopicTestActionState,
  formData: FormData,
  deps: StartTopicTestActionDeps = { startTopicTest, ...defaultAuthDeps },
): Promise<StartTopicTestActionState> {
  const themeId = Number(formData.get("themeId"));
  const mode = parseTopicTestMode(formData.get("mode"));

  try {
    const userId = await deps.requireUserId();
    const result = await deps.startTopicTest({
      userId,
      themeId,
      mode,
    });
    return {
      status: "success",
      sessionId: result.sessionId,
      mode: result.mode,
    };
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

export type {
  CheckAnswerActionInput,
  CheckAnswerActionState,
  FinishTrainerSessionActionInput,
  FinishTrainerSessionActionState,
  MarkSessionStartedActionInput,
  MarkSessionStartedActionState,
  SkipTaskAnswerActionInput,
  SkipTaskAnswerActionState,
};

type CheckAnswerActionDeps = AuthDeps & {
  checkAnswer: typeof checkAnswer;
};

/**
 * Server Action for a chosen option in TopicTrainer. User id is trusted
 * server-side. The payload never includes `right_answer_n`.
 */
export async function checkAnswerAction(
  input: CheckAnswerActionInput,
  deps: CheckAnswerActionDeps = { checkAnswer, ...defaultAuthDeps },
): Promise<CheckAnswerActionState> {
  try {
    const userId = await deps.requireUserId();
    const result: CheckAnswerResult = await deps.checkAnswer({
      userId,
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

type FinishTrainerSessionActionDeps = AuthDeps & {
  finishTrainerSession: typeof finishTrainerSession;
  getStudentTopicStats: typeof getStudentTopicStats;
  recommendNextActionsForStats: typeof recommendNextActionsForStats;
  persistRecommendations: typeof persistRecommendations;
  getRecommendationTranslator?: (
    locale: "uk" | "en" | "de",
  ) => Promise<RecommendationTranslator>;
};

const defaultFinishDeps: FinishTrainerSessionActionDeps = {
  finishTrainerSession,
  getStudentTopicStats,
  recommendNextActionsForStats,
  persistRecommendations,
  getRecommendationTranslator,
  ...defaultAuthDeps,
};

/**
 * Server Action for "Завершити тест". Re-finishing a completed session returns
 * the same summary.
 */
export async function finishTrainerSessionAction(
  input: FinishTrainerSessionActionInput,
  deps: FinishTrainerSessionActionDeps = defaultFinishDeps,
): Promise<FinishTrainerSessionActionState> {
  try {
    const userId = await deps.requireUserId();
    const summary = await deps.finishTrainerSession({
      userId,
      sessionId: input.sessionId,
      markUnansweredAsIncorrect: input.markUnansweredAsIncorrect,
      capTimeSec: input.capTimeSec,
    });

    const stats = await deps.getStudentTopicStats(userId);

    const locale =
      input.locale === "en" || input.locale === "de" || input.locale === "uk"
        ? input.locale
        : "uk";

    const translatorFactory =
      deps.getRecommendationTranslator ?? getRecommendationTranslator;

    const t = await translatorFactory(locale);

    const rawActions = await deps.recommendNextActionsForStats(stats, t);
    const { actions: recommendations } = await deps.persistRecommendations(
      userId,
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

type MarkSessionStartedActionDeps = AuthDeps & {
  markSessionStarted: typeof markSessionStarted;
};

export async function markSessionStartedAction(
  input: MarkSessionStartedActionInput,
  deps: MarkSessionStartedActionDeps = {
    markSessionStarted,
    ...defaultAuthDeps,
  },
): Promise<MarkSessionStartedActionState> {
  try {
    const userId = await deps.requireUserId();
    const result = await deps.markSessionStarted({
      userId,
      sessionId: input.sessionId,
    });
    return { status: "success", startTime: result.startTime };
  } catch (error) {
    if (error instanceof MarkSessionStartedError) {
      switch (error.code) {
        case "invalid_input":
          return {
            status: "error",
            message: MARK_STARTED_INVALID_INPUT_MESSAGE,
          };
        case "not_found":
          return { status: "error", message: MARK_STARTED_NOT_FOUND_MESSAGE };
        default:
          return {
            status: "error",
            message: MARK_STARTED_GENERIC_ERROR_MESSAGE,
          };
      }
    }
    console.error("markSessionStartedAction: unexpected error", error);
    return { status: "error", message: MARK_STARTED_GENERIC_ERROR_MESSAGE };
  }
}

type SkipTaskAnswerActionDeps = AuthDeps & {
  skipTaskAnswer: typeof skipTaskAnswer;
};

export async function skipTaskAnswerAction(
  input: SkipTaskAnswerActionInput,
  deps: SkipTaskAnswerActionDeps = { skipTaskAnswer, ...defaultAuthDeps },
): Promise<SkipTaskAnswerActionState> {
  try {
    const userId = await deps.requireUserId();
    await deps.skipTaskAnswer({
      userId,
      sessionId: input.sessionId,
      mappingId: input.mappingId,
    });
    return { status: "success", correct: false };
  } catch (error) {
    if (error instanceof SkipTaskAnswerError) {
      switch (error.code) {
        case "not_found":
          return { status: "error", message: SKIP_NOT_FOUND_MESSAGE };
        case "session_completed":
          return { status: "error", message: SKIP_COMPLETED_MESSAGE };
        default:
          return { status: "error", message: SKIP_GENERIC_ERROR_MESSAGE };
      }
    }
    console.error("skipTaskAnswerAction: unexpected error", error);
    return { status: "error", message: SKIP_GENERIC_ERROR_MESSAGE };
  }
}

export async function getSessionMistakeReviewAction(
  sessionId: number,
): Promise<SessionMistakeItem[]> {
  const userId = await requireUserId();
  return getSessionMistakeReview(sessionId, userId);
}
