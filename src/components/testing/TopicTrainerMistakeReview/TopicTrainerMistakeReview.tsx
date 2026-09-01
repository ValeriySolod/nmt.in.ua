import type { SessionMistakeItem } from "@/modules/testing/getSessionMistakeReview";
import css from "./TopicTrainerMistakeReview.module.css";

type TopicTrainerMistakeReviewProps = {
  mistakes: SessionMistakeItem[];
};

export function TopicTrainerMistakeReview({
  mistakes,
}: TopicTrainerMistakeReviewProps) {
  if (mistakes.length === 0) return null;

  return (
    <section className={css.topicTrainerMistakeReview} aria-labelledby="mistake-review-title">
      <h2 id="mistake-review-title" className={css.title}>
        Розбір помилок ({mistakes.length})
      </h2>
      <ul className={css.list}>
        {mistakes.map((item) => (
          <li key={`${item.name}-${item.taskText.slice(0, 40)}`} className={css.item}>
            <p className={css.itemName}>{item.name}</p>
            <p className={css.itemText}>{item.taskText}</p>
            {item.comment ? (
              <p className={css.comment}>{item.comment}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
