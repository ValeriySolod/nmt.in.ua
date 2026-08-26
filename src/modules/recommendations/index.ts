/**
 * Модуль 4 — рекомендаційна система.
 *
 * Вхід: результати тестування учня.
 * Вихід: наступні дії (тема, тренажер, матеріали, консультація).
 *
 * Куди показувати в UI:
 * - `/results` — блок рекомендацій під таблицею прогресу
 * - `/sessions` — план наступних сесій
 * - права колонка `RecentResults` (опційно)
 * - після `finishTrainerSession` (модуль 3) → викликати `recommendNextActions`
 */

export type StudentResultSnapshot = {
  userId: string;
  topicScores: Array<{ topicId: string; percent: number; avgTimeSec: number }>;
  lastSessionId?: string;
};

export type RecommendedAction = {
  type: "topic-test" | "simulator" | "materials" | "problems" | "consultation";
  title: string;
  reason: string;
  href: string;
  priority: number;
};

/** Побудувати список наступних дій для учня. */
export function recommendNextActions(
  snapshot: StudentResultSnapshot,
): RecommendedAction[] {
  void snapshot;
  // TODO(module-4): правила / ML / евристики по слабких темах
  throw new Error("recommendNextActions: ще не реалізовано (модуль 4)");
}

/** Зберегти / закешувати рекомендації (сервер). */
export async function persistRecommendations(
  userId: string,
  actions: RecommendedAction[],
): Promise<void> {
  void userId;
  void actions;
  // TODO(module-4): запис у БД
  throw new Error("persistRecommendations: ще не реалізовано (модуль 4)");
}
