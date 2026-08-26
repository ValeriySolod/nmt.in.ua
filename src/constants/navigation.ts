export type NavItem = {
  href: string;
  label: string;
  description: string;
};

/** Primary dashboard navigation — order matches product wireframe. */
export const DASHBOARD_NAV: NavItem[] = [
  {
    href: "/",
    label: "Тест за обраною темою",
    description:
      "Оберіть тему, кількість завдань і пройдіть короткий тренувальний тест.",
  },
  {
    href: "/results",
    label: "Результати за темами",
    description:
      "Прогрес по темах: загальний %, останні спроби та швидкість відповідей.",
  },
  {
    href: "/sessions",
    label: "Навчальні сесії",
    description: "Історія навчальних сесій і план наступних тренувань.",
  },
  {
    href: "/simulator",
    label: "Симулятор НМТ",
    description: "Повний варіант НМТ у форматі УЦОЯО з таймером і балами.",
  },
  {
    href: "/materials",
    label: "Навчальні матеріали",
    description: "Конспекти, формули та пояснення до тем сертифікаційної роботи.",
  },
  {
    href: "/problems",
    label: "Задачник",
    description: "Банк завдань для самостійної практики поза тестом.",
  },
  {
    href: "/settings",
    label: "Налаштування",
    description: "Профіль, тема інтерфейсу та параметри тренувань.",
  },
  {
    href: "/consultations",
    label: "Консультації викладачів",
    description: "Запис на консультацію та спілкування з викладачами.",
  },
];

export const PLACEHOLDER_USER = {
  displayName: "Імʼя користувача",
  initials: "ІК",
};

export const PLACEHOLDER_RECENT_RESULTS = [
  { topic: "Тема 1", score: 45 },
  { topic: "Тема 2", score: 90 },
  { topic: "Тема 3", score: 65 },
  { topic: "Тема 4", score: 45 },
];

export function getNavItem(href: string): NavItem {
  const item = DASHBOARD_NAV.find((nav) => nav.href === href);
  if (!item) {
    throw new Error(`Navigation item not found: ${href}`);
  }
  return item;
}
