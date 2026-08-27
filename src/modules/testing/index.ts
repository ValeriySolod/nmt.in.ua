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
  type StartTopicTestActionState,
} from "./actions";

export type TrainerSession = {
  id: string;
  topicId: string;
  startedAt: string;
  answers: unknown[];
};

/** Перевірити відповідь учня на одне завдання. */
export function checkAnswer(
  questionId: string,
  userAnswer: unknown,
): { correct: boolean; score: number } {
  void questionId;
  void userAnswer;
  // TODO(module-3): типи питань (одна відповідь / відповідність / коротка)
  throw new Error("checkAnswer: ще не реалізовано (модуль 3)");
}

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
