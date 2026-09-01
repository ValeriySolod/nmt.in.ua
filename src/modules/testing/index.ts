/**
 * Модуль 3 — тести та інтерактивні тренажери.
 *
 * Реалізовано:
 * - `/` → TopicTestStart (звичайний + Ultimate)
 * - `/session/[id]` → TopicTrainer
 * - `/simulator`, `/problems`, `/materials` → заглушки (скоро)
 */

export type TopicTestConfig = {
  topicId: string;
  questionCount: number;
};

export {
  startTopicTest,
  validateStartTopicTestInput,
  StartTopicTestError,
  TOPIC_TEST_TASK_COUNT,
} from "./startTopicTest";
export type {
  StartTopicTestInput,
  StartTopicTestResult,
  StartTopicTestErrorCode,
} from "./startTopicTest";
export {
  startTopicTestAction,
  checkAnswerAction,
  finishTrainerSessionAction,
  markSessionStartedAction,
  type StartTopicTestActionState,
} from "./actions";
export {
  checkAnswer,
  validateCheckAnswerInput,
  CheckAnswerError,
} from "./checkAnswer";
export type {
  CheckAnswerInput,
  CheckAnswerResult,
  CheckAnswerErrorCode,
  AnswerNumber,
} from "./checkAnswer";
export {
  markSessionStarted,
  validateMarkSessionStartedInput,
  MarkSessionStartedError,
} from "./markSessionStarted";
export type {
  MarkSessionStartedInput,
  MarkSessionStartedResult,
  MarkSessionStartedErrorCode,
} from "./markSessionStarted";
export {
  formatElapsedClock,
  resolveSessionElapsedSec,
} from "./sessionElapsed";
export {
  finishTrainerSession,
  validateFinishTrainerSessionInput,
  FinishTrainerSessionError,
  toTrainerSessionSummary,
} from "./finishTrainerSession";
export type {
  FinishTrainerSessionInput,
  FinishTrainerSessionResult,
  FinishTrainerSessionErrorCode,
} from "./finishTrainerSession";
export {
  getAvailableTopicThemes,
} from "./getAvailableTopicThemes";
export {
  getSessionTasks,
  GetSessionTasksError,
  validateSessionId,
} from "./getSessionTasks";
export type { GetSessionTasksErrorCode } from "./getSessionTasks";
export type {
  AvailableTopicTheme,
  SessionTask,
  SessionTasksResult,
  SessionTaskAnswer,
  CheckAnswerActionInput,
  CheckAnswerActionState,
  FinishTrainerSessionActionInput,
  FinishTrainerSessionActionState,
  MarkSessionStartedActionInput,
  MarkSessionStartedActionState,
  TrainerSessionSummary,
} from "./types";
export {
  TASK_STATUS_UNANSWERED,
  TASK_STATUS_CORRECT,
  TASK_STATUS_INCORRECT,
} from "./types";

export type TrainerSession = {
  id: string;
  topicId: string;
  startedAt: string;
  answers: unknown[];
};

/** Симулятор повного НМТ (окремий flow від короткого тесту). */
export async function startNmtSimulator(): Promise<TrainerSession> {
  // TODO(module-3): повний варіант 22 завдання / таймер
  throw new Error("startNmtSimulator: ще не реалізовано (модуль 3)");
}
