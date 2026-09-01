/**
 * Модуль 4 — рекомендаційна система.
 *
 * Вхід: результати тестування учня (`StudentTopicStats`, з `getStudentTopicStats`).
 * Вихід: наступні дії (тема, тренажер, матеріали, консультація).
 *
 * Куди показувати в UI:
 * - `/results` — блок рекомендацій під таблицею прогресу
 * - `/sessions` — план наступних сесій
 * - права колонка `RecentResults` (опційно)
 * - після `finishTrainerSession` (модуль 3) → викликати `recommendNextActions`
 */

import type { StudentTopicStats } from "./types";

export type { StudentTopicScore, StudentTopicStats } from "./types";

export type RecommendedAction = {
  type: "topic-test" | "simulator" | "materials" | "problems" | "consultation";
  title: string;
  reason: string;
  href: string;
  priority: number;
  /** Present for `topic-test` actions — used when persisting planned auto sessions. */
  themeId?: number;
};

export { persistRecommendations } from "./persistRecommendations";
export type { PersistRecommendationsResult } from "./persistRecommendations";

const WEAK_THRESHOLD = 40;
const SOLID_THRESHOLD = 70;
const MAX_WEAK_ACTIONS = 2;
const MAX_UNTRIED_ACTIONS = 2;
const MAX_RECOMMENDATIONS = 3;

/** Побудувати список наступних дій для учня на основі поточної статистики по темах. */
export function recommendNextActions(
  stats: StudentTopicStats,
): RecommendedAction[] {
  if (!stats.hasCompletedSessions) {
    return [];
  }

  const attempted = stats.topicScores.filter(
    (topic) => topic.overallPercent !== null,
  );
  const untried = stats.topicScores.filter(
    (topic) => topic.overallPercent === null,
  );
  const weak = attempted
    .filter((topic) => (topic.overallPercent as number) < WEAK_THRESHOLD)
    .sort((a, b) => (a.overallPercent as number) - (b.overallPercent as number));

  const actions: RecommendedAction[] = [];
  let priority = 1;

  for (const topic of weak.slice(0, MAX_WEAK_ACTIONS)) {
    actions.push({
      type: "topic-test",
      themeId: topic.themeId,
      title: `Повторіть тему «${topic.themeName}»`,
      reason: `Останній результат: ${Math.round(topic.overallPercent as number)}%. Варто попрактикуватися ще раз.`,
      href: `/?theme=${topic.themeId}`,
      priority: priority++,
    });
  }

  for (const topic of untried.slice(0, MAX_UNTRIED_ACTIONS)) {
    actions.push({
      type: "topic-test",
      themeId: topic.themeId,
      title: `Спробуйте тему «${topic.themeName}»`,
      reason: "Ви ще не проходили цю тему — почніть з короткого тесту.",
      href: `/?theme=${topic.themeId}`,
      priority: priority++,
    });
  }

  if (weak.length >= 2) {
    actions.push({
      type: "consultation",
      title: "Запишіться на консультацію",
      reason: "Декілька тем потребують додаткової підтримки викладача.",
      href: "/consultations",
      priority: priority++,
    });
  }

  if (weak.length > 0) {
    actions.push({
      type: "materials",
      title: "Повторіть теоретичні матеріали",
      reason: "У слабких темах допоможе конспект перед повторним тестом.",
      href: "/materials",
      priority: priority++,
    });
  }

  const solidCount = attempted.filter(
    (topic) => (topic.overallPercent as number) >= SOLID_THRESHOLD,
  ).length;
  if (untried.length === 0 && weak.length === 0 && solidCount > 0) {
    actions.push({
      type: "simulator",
      title: "Спробуйте повний симулятор НМТ",
      reason:
        "Всі теми опрацьовані на хорошому рівні — час перевірити результат у форматі УЦОЯО.",
      href: "/simulator",
      priority: priority++,
    });
  }

  if (actions.length === 0) {
    actions.push({
      type: "problems",
      title: "Практикуйте додаткові задачі",
      reason: "Ваш прогрес стабільний — закріпіть його практикою в задачнику.",
      href: "/problems",
      priority: priority++,
    });
  }

  return actions
    .sort((a, b) => a.priority - b.priority)
    .slice(0, MAX_RECOMMENDATIONS);
}
