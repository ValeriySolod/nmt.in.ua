/** Standard topic test — up to 10 random tasks with instant feedback. */
export const TOPIC_TEST_TASK_COUNT = 10;

/** Ultimate mode — up to 20 random tasks, countdown, review at the end. */
export const ULTIMATE_TASK_LIMIT = 20;
export const ULTIMATE_DURATION_SEC = 20 * 60;
export const ULTIMATE_TIMER_WARNING_SEC = 5 * 60;

export type TopicTestMode = "standard" | "ultimate";

export function parseTopicTestMode(value: unknown): TopicTestMode {
  return value === "ultimate" ? "ultimate" : "standard";
}

export function taskLimitForMode(mode: TopicTestMode): number {
  return mode === "ultimate" ? ULTIMATE_TASK_LIMIT : TOPIC_TEST_TASK_COUNT;
}

export function previewTaskCount(mode: TopicTestMode, bankSize: number): number {
  if (bankSize <= 0) return 0;
  return Math.min(taskLimitForMode(mode), bankSize);
}
