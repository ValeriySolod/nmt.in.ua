import { PLACEHOLDER_RECENT_RESULTS } from "@/constants/navigation";
import css from "./RecentResults.module.css";

export function RecentResults() {
  return (
    <aside className={css.panel} aria-label="Останні результати">
      <h2 className={css.title}>Останні результати</h2>
      <ul className={css.list}>
        {PLACEHOLDER_RECENT_RESULTS.map((item) => (
          <li key={item.topic} className={css.item}>
            <span>{item.topic}</span>
            <strong>{item.score}%</strong>
          </li>
        ))}
      </ul>
      <p className={css.hint}>Дані зʼявляться після перших тестів.</p>
    </aside>
  );
}
