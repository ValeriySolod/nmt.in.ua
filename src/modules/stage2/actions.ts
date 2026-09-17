"use server";

/**
 * Stage 2 Server Actions — one pair (get/submit) per format. Every action
 * resolves `userId` only via `requireSessionUserId()` (never a client-
 * supplied id), matching every other action in this codebase. Ownership is
 * enforced by `practice_stage2_attempts`'s `user_id` column (see
 * `stage2Attempt.ts`'s `FOR UPDATE` select, scoped by `user_id`).
 */

import { requireSessionUserId, type requireUserId } from "@/modules/auth/getCurrentUser";
import {
  getOrderTask,
  submitOrderTaskAnswer,
  getOrderTaskHintLevel,
  OrderTaskError,
  type OrderTaskPresentation,
  type OrderTaskReveal,
} from "./orderTask";
import {
  getFindErrorTask,
  submitFindErrorAnswer,
  getFindErrorTaskHintLevel,
  FindErrorTaskError,
  type FindErrorTaskPresentation,
  type FindErrorReveal,
} from "./findErrorTask";
import {
  getGraphTask,
  submitGraphTaskAnswer,
  getGraphTaskHintLevel,
  GraphTaskError,
  type GraphTaskPresentation,
  type GraphTaskReveal,
} from "./graphTask";
import {
  getMatchingTask,
  submitMatchingAnswer,
  getMatchingTaskHintLevel,
  MatchingTaskError,
  type MatchingTaskPresentation,
  type MatchingReveal,
} from "./matchingTask";
import {
  getBlankTask,
  submitBlankTaskAnswer,
  getBlankTaskHintLevel,
  BlankTaskError,
  type BlankTaskPresentation,
  type BlankReveal,
} from "./blankTask";
import { Stage2HintError, type HintLevel, type Stage2HintResult } from "./hintLadder";
import { withRound, getRoundContext } from "./roundContext";
import type { Stage2Format } from "./stage2Attempt";

type AuthDeps = { requireUserId: typeof requireUserId };
const defaultAuthDeps: AuthDeps = { requireUserId: requireSessionUserId };

export type Stage2ErrorCode = "invalidInput" | "notFound" | "generic";

function mapCode(code: string): Stage2ErrorCode {
  if (code === "invalid_input") return "invalidInput";
  if (code === "not_found") return "notFound";
  return "generic";
}

// ---- order ----------------------------------------------------------

export type GetOrderTaskState =
  | { status: "success"; task: OrderTaskPresentation }
  | { status: "error"; code: Stage2ErrorCode };

export async function getOrderTaskAction(
  taskId: number,
  deps: AuthDeps & { getOrderTask: typeof getOrderTask } = {
    getOrderTask,
    ...defaultAuthDeps,
  },
  roundId?: number,
): Promise<GetOrderTaskState> {
  try {
    const userId = await deps.requireUserId();
    const task = await withRound(userId, roundId, "order", taskId, () => deps.getOrderTask(taskId, userId));
    return { status: "success", task };
  } catch (error) {
    if (error instanceof OrderTaskError) return { status: "error", code: mapCode(error.code) };
    console.error("getOrderTaskAction: unexpected error", error);
    return { status: "error", code: "generic" };
  }
}

export type SubmitOrderTaskState =
  | { status: "success"; correct: boolean; firstAttempt: boolean; retryAvailable?: true; revealed?: OrderTaskReveal }
  | { status: "error"; code: Stage2ErrorCode };

export async function submitOrderTaskAction(
  input: { taskId: number; roundId?: number; expectedAttempt?: 1 | 2; submittedOrder: number[] },
  deps: AuthDeps & { submitOrderTaskAnswer: typeof submitOrderTaskAnswer } = {
    submitOrderTaskAnswer,
    ...defaultAuthDeps,
  },
): Promise<SubmitOrderTaskState> {
  try {
    const userId = await deps.requireUserId();
    const result = await withRound(userId, input.roundId, "order", input.taskId, async () => {
      const scored = await deps.submitOrderTaskAnswer({
      userId,
      taskId: input.taskId,
      expectedAttempt: input.expectedAttempt ?? 1,
      submittedOrder: input.submittedOrder,
      });
      const context = getRoundContext();
      return context?.mode === "diagnostic" && !context.completed ? { correct: false, firstAttempt: true, perBlank: {} } : scored;
    });
    return { status: "success", ...result };
  } catch (error) {
    if (error instanceof OrderTaskError) return { status: "error", code: mapCode(error.code) };
    console.error("submitOrderTaskAction: unexpected error", error);
    return { status: "error", code: "generic" };
  }
}

// ---- find_error -------------------------------------------------------

export type GetFindErrorTaskState =
  | { status: "success"; task: FindErrorTaskPresentation }
  | { status: "error"; code: Stage2ErrorCode };

export async function getFindErrorTaskAction(
  taskId: number,
  deps: AuthDeps & { getFindErrorTask: typeof getFindErrorTask } = {
    getFindErrorTask,
    ...defaultAuthDeps,
  },
  roundId?: number,
): Promise<GetFindErrorTaskState> {
  try {
    const userId = await deps.requireUserId();
    const task = await withRound(userId, roundId, "find_error", taskId, () => deps.getFindErrorTask(taskId, userId));
    return { status: "success", task };
  } catch (error) {
    if (error instanceof FindErrorTaskError) return { status: "error", code: mapCode(error.code) };
    console.error("getFindErrorTaskAction: unexpected error", error);
    return { status: "error", code: "generic" };
  }
}

export type SubmitFindErrorState =
  | { status: "success"; correct: boolean; firstAttempt: boolean; retryAvailable?: true; revealed?: FindErrorReveal }
  | { status: "error"; code: Stage2ErrorCode };

export async function submitFindErrorTaskAction(
  input: { taskId: number; roundId?: number; expectedAttempt?: 1 | 2; submittedLineOrd: number; submittedCorrectionN: number },
  deps: AuthDeps & { submitFindErrorAnswer: typeof submitFindErrorAnswer } = {
    submitFindErrorAnswer,
    ...defaultAuthDeps,
  },
): Promise<SubmitFindErrorState> {
  try {
    const userId = await deps.requireUserId();
    const result = await withRound(userId, input.roundId, "find_error", input.taskId, async () => {
      const scored = await deps.submitFindErrorAnswer({
      userId,
      taskId: input.taskId,
      expectedAttempt: input.expectedAttempt ?? 1,
      submittedLineOrd: input.submittedLineOrd,
      submittedCorrectionN: input.submittedCorrectionN,
      });
      const context = getRoundContext();
      return context?.mode === "diagnostic" && !context.completed ? { correct: false, firstAttempt: true, perBlank: {} } : scored;
    });
    return { status: "success", ...result };
  } catch (error) {
    if (error instanceof FindErrorTaskError) return { status: "error", code: mapCode(error.code) };
    console.error("submitFindErrorTaskAction: unexpected error", error);
    return { status: "error", code: "generic" };
  }
}

// ---- graph --------------------------------------------------------------

export type GetGraphTaskState =
  | { status: "success"; task: GraphTaskPresentation }
  | { status: "error"; code: Stage2ErrorCode };

export async function getGraphTaskAction(
  taskId: number,
  deps: AuthDeps & { getGraphTask: typeof getGraphTask } = {
    getGraphTask,
    ...defaultAuthDeps,
  },
  roundId?: number,
): Promise<GetGraphTaskState> {
  try {
    const userId = await deps.requireUserId();
    const task = await withRound(userId, roundId, "graph", taskId, () => deps.getGraphTask(taskId, userId));
    return { status: "success", task };
  } catch (error) {
    if (error instanceof GraphTaskError) return { status: "error", code: mapCode(error.code) };
    console.error("getGraphTaskAction: unexpected error", error);
    return { status: "error", code: "generic" };
  }
}

export type SubmitGraphTaskState =
  | { status: "success"; correct: boolean; firstAttempt: boolean; retryAvailable?: true; revealed?: GraphTaskReveal }
  | { status: "error"; code: Stage2ErrorCode };

export async function submitGraphTaskAction(
  input: { taskId: number; roundId?: number; expectedAttempt?: 1 | 2; submittedPointIds: number[] },
  deps: AuthDeps & { submitGraphTaskAnswer: typeof submitGraphTaskAnswer } = {
    submitGraphTaskAnswer,
    ...defaultAuthDeps,
  },
): Promise<SubmitGraphTaskState> {
  try {
    const userId = await deps.requireUserId();
    const result = await withRound(userId, input.roundId, "graph", input.taskId, async () => {
      const scored = await deps.submitGraphTaskAnswer({
      userId,
      taskId: input.taskId,
      expectedAttempt: input.expectedAttempt ?? 1,
      submittedPointIds: input.submittedPointIds,
      });
      const context = getRoundContext();
      return context?.mode === "diagnostic" && !context.completed ? { correct: false, firstAttempt: true, perBlank: {} } : scored;
    });
    return { status: "success", ...result };
  } catch (error) {
    if (error instanceof GraphTaskError) return { status: "error", code: mapCode(error.code) };
    console.error("submitGraphTaskAction: unexpected error", error);
    return { status: "error", code: "generic" };
  }
}

// ---- matching -----------------------------------------------------------

export type GetMatchingTaskState =
  | { status: "success"; task: MatchingTaskPresentation }
  | { status: "error"; code: Stage2ErrorCode };

export async function getMatchingTaskAction(
  taskId: number,
  deps: AuthDeps & { getMatchingTask: typeof getMatchingTask } = {
    getMatchingTask,
    ...defaultAuthDeps,
  },
  roundId?: number,
): Promise<GetMatchingTaskState> {
  try {
    const userId = await deps.requireUserId();
    const task = await withRound(userId, roundId, "matching", taskId, () => deps.getMatchingTask(taskId, userId));
    return { status: "success", task };
  } catch (error) {
    if (error instanceof MatchingTaskError) return { status: "error", code: mapCode(error.code) };
    console.error("getMatchingTaskAction: unexpected error", error);
    return { status: "error", code: "generic" };
  }
}

export type SubmitMatchingTaskState =
  | { status: "success"; correct: boolean; firstAttempt: boolean; retryAvailable?: true; revealed?: MatchingReveal }
  | { status: "error"; code: Stage2ErrorCode };

export async function submitMatchingTaskAction(
  input: { taskId: number; roundId?: number; expectedAttempt?: 1 | 2; submittedPairs: Record<number, number> },
  deps: AuthDeps & { submitMatchingAnswer: typeof submitMatchingAnswer } = {
    submitMatchingAnswer,
    ...defaultAuthDeps,
  },
): Promise<SubmitMatchingTaskState> {
  try {
    const userId = await deps.requireUserId();
    const result = await withRound(userId, input.roundId, "matching", input.taskId, async () => {
      const scored = await deps.submitMatchingAnswer({
      userId,
      taskId: input.taskId,
      expectedAttempt: input.expectedAttempt ?? 1,
      submittedPairs: input.submittedPairs,
      });
      const context = getRoundContext();
      return context?.mode === "diagnostic" && !context.completed ? { correct: false, firstAttempt: true, perBlank: {} } : scored;
    });
    return { status: "success", ...result };
  } catch (error) {
    if (error instanceof MatchingTaskError) return { status: "error", code: mapCode(error.code) };
    console.error("submitMatchingTaskAction: unexpected error", error);
    return { status: "error", code: "generic" };
  }
}

// ---- blank ----------------------------------------------------------------

export type GetBlankTaskState =
  | { status: "success"; task: BlankTaskPresentation }
  | { status: "error"; code: Stage2ErrorCode };

export async function getBlankTaskAction(
  taskId: number,
  deps: AuthDeps & { getBlankTask: typeof getBlankTask } = {
    getBlankTask,
    ...defaultAuthDeps,
  },
  roundId?: number,
): Promise<GetBlankTaskState> {
  try {
    const userId = await deps.requireUserId();
    const task = await withRound(userId, roundId, "blank", taskId, () => deps.getBlankTask(taskId, userId));
    return { status: "success", task };
  } catch (error) {
    if (error instanceof BlankTaskError) return { status: "error", code: mapCode(error.code) };
    console.error("getBlankTaskAction: unexpected error", error);
    return { status: "error", code: "generic" };
  }
}

export type SubmitBlankTaskState =
  | {
      status: "success";
      correct: boolean;
      firstAttempt: boolean;
      retryAvailable?: true;
      revealed?: BlankReveal;
      perBlank: Record<number, boolean>;
    }
  | { status: "error"; code: Stage2ErrorCode };

export async function submitBlankTaskAction(
  input: { taskId: number; roundId?: number; expectedAttempt?: 1 | 2; submitted: Record<number, string> },
  deps: AuthDeps & { submitBlankTaskAnswer: typeof submitBlankTaskAnswer } = {
    submitBlankTaskAnswer,
    ...defaultAuthDeps,
  },
): Promise<SubmitBlankTaskState> {
  try {
    const userId = await deps.requireUserId();
    const result = await withRound(userId, input.roundId, "blank", input.taskId, async () => {
      const scored = await deps.submitBlankTaskAnswer({
      userId,
      taskId: input.taskId,
      expectedAttempt: input.expectedAttempt ?? 1,
      submitted: input.submitted,
      });
      const context = getRoundContext();
      return context?.mode === "diagnostic" && !context.completed ? { correct: false, firstAttempt: true, perBlank: {} } : scored;
    });
    return { status: "success", ...result };
  } catch (error) {
    if (error instanceof BlankTaskError) return { status: "error", code: mapCode(error.code) };
    console.error("submitBlankTaskAction: unexpected error", error);
    return { status: "error", code: "generic" };
  }
}

// ---- shared hint ladder (all 5 formats) -----------------------------------

export type Stage2HintErrorCode = "invalidInput" | "notEligible" | "generic";

export type GetStage2HintLevelState =
  | { status: "success"; available: boolean; level: HintLevel | null; text: string | null; isFinal: boolean }
  | { status: "error"; code: Stage2HintErrorCode };

type HintDeps = AuthDeps & {
  getOrderTaskHintLevel: typeof getOrderTaskHintLevel;
  getFindErrorTaskHintLevel: typeof getFindErrorTaskHintLevel;
  getGraphTaskHintLevel: typeof getGraphTaskHintLevel;
  getMatchingTaskHintLevel: typeof getMatchingTaskHintLevel;
  getBlankTaskHintLevel: typeof getBlankTaskHintLevel;
};

const defaultHintDeps: HintDeps = {
  getOrderTaskHintLevel,
  getFindErrorTaskHintLevel,
  getGraphTaskHintLevel,
  getMatchingTaskHintLevel,
  getBlankTaskHintLevel,
  ...defaultAuthDeps,
};

/**
 * Single Server Action for the hint ladder across all 5 Stage 2 formats —
 * dispatches to the format-specific domain function (each of which loads
 * its own task's `hint_direction`/`hint_rule`/`comments` and applies the
 * shared `getStage2HintLevel` rung-resolution + answer-leakage gate). Same
 * auth/ownership pattern as every other action here.
 */
export async function getStage2HintLevelAction(
  input: { format: Stage2Format; taskId: number; level: HintLevel; roundId?: number },
  deps: HintDeps = defaultHintDeps,
): Promise<GetStage2HintLevelState> {
  try {
    const userId = await deps.requireUserId();
    let result: Stage2HintResult;
    switch (input.format) {
      case "order":
        result = await withRound(userId, input.roundId, "order", input.taskId, () => deps.getOrderTaskHintLevel({ userId, taskId: input.taskId, level: input.level }));
        break;
      case "find_error":
        result = await withRound(userId, input.roundId, "find_error", input.taskId, () => deps.getFindErrorTaskHintLevel({ userId, taskId: input.taskId, level: input.level }));
        break;
      case "graph":
        result = await withRound(userId, input.roundId, "graph", input.taskId, () => deps.getGraphTaskHintLevel({ userId, taskId: input.taskId, level: input.level }));
        break;
      case "matching":
        result = await withRound(userId, input.roundId, "matching", input.taskId, () => deps.getMatchingTaskHintLevel({ userId, taskId: input.taskId, level: input.level }));
        break;
      case "blank":
        result = await withRound(userId, input.roundId, "blank", input.taskId, () => deps.getBlankTaskHintLevel({ userId, taskId: input.taskId, level: input.level }));
        break;
    }
    return { status: "success", ...result };
  } catch (error) {
    if (error instanceof Stage2HintError) {
      return { status: "error", code: error.code === "invalid_input" ? "invalidInput" : "notEligible" };
    }
    if (
      error instanceof OrderTaskError ||
      error instanceof FindErrorTaskError ||
      error instanceof GraphTaskError ||
      error instanceof MatchingTaskError ||
      error instanceof BlankTaskError
    ) {
      return { status: "error", code: error.code === "invalid_input" ? "invalidInput" : "generic" };
    }
    console.error("getStage2HintLevelAction: unexpected error", error);
    return { status: "error", code: "generic" };
  }
}
