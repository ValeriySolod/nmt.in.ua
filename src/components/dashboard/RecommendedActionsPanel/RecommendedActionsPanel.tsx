import Link from "next/link";
import type { RecommendedAction } from "@/modules/recommendations";
import css from "./RecommendedActionsPanel.module.css";

const ACTION_ICONS: Record<RecommendedAction["type"], string> = {
  "topic-test": "∑",
  simulator: "◎",
  materials: "▣",
  problems: "ƒ",
  consultation: "✉",
};

type RecommendedActionsPanelProps = {
  actions: RecommendedAction[];
};

export function RecommendedActionsPanel({
  actions,
}: RecommendedActionsPanelProps) {
  return (
    <section
      className={css.recommendedActions}
      aria-labelledby="recommended-actions-title"
    >
      <header className={css.intro}>
        <h2 id="recommended-actions-title" className={css.title}>
          Рекомендовані дії
        </h2>
        <p className={css.lead}>
          Наступні кроки, підібрані на основі ваших поточних результатів.
        </p>
      </header>

      {actions.length === 0 ? (
        <p className={css.empty} role="status">
          Пройдіть перший тест, щоб отримати рекомендації.{" "}
          <Link href="/" className={css.emptyLink}>
            Перейти до тесту
          </Link>
        </p>
      ) : (
        <ul className={css.list}>
          {actions.map((action, index) => (
            <li key={`${action.type}-${index}`} className={css.card}>
              <span className={css.icon} aria-hidden>
                {ACTION_ICONS[action.type]}
              </span>
              <div className={css.body}>
                <h3 className={css.cardTitle}>{action.title}</h3>
                <p className={css.reason}>{action.reason}</p>
              </div>
              <Link href={action.href} className={css.action}>
                Перейти
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
