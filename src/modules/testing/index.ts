/**
 * Модуль 3 — тести та інтерактивні тренажери.
 *
 * UI вже є як оболонка:
 * - `/` → `TopicTestStart` (тест за темою)
 * - `/simulator` → StubPage (симулятор НМТ)
 * - `/problems` → StubPage (задачник)
 *
 * Підключайте логіку сюди + у відповідні компоненти/hooks.
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

/** Завершити сесію й порахувати підсумок. */
export async function finishTrainerSession(
  sessionId: string,
): Promise<{ correct: number; total: number; avgTimeSec: number }> {
  void sessionId;
  // TODO(module-3): зберегти результат, оновити статистику тем
  throw new Error("finishTrainerSession: ще не реалізовано (модуль 3)");
}

/** Симулятор повного НМТ (окремий flow від короткого тесту). */
export async function startNmtSimulator(): Promise<TrainerSession> {
  // TODO(module-3): повний варіант 22 завдання / таймер
  throw new Error("startNmtSimulator: ще не реалізовано (модуль 3)");
}
