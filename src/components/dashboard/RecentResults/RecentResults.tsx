import type { RecentResultItem } from "@/modules/results/getRecentResults";
import css from "./RecentResults.module.css";

type RecentResultsProps = {
  items: RecentResultItem[];
};

export function RecentResults({ items }: RecentResultsProps) {
  return (
    <aside className={css.panel} aria-label="Останні результати">
      <h2 className={css.title}>Останні результати</h2>
      {items.length === 0 ? (
        <p className={css.hint}>Дані зʼявляться після перших тестів.</p>
      ) : (
        <ul className={css.list}>
          {items.map((item) => (
            <li key={item.sessionId} className={css.item}>
              <span>{item.topic}</span>
              <strong>{item.score}%</strong>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
