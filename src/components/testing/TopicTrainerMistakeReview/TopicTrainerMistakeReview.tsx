import type { SessionMistakeItem } from "@/modules/testing/getSessionMistakeReview";
import { MathText } from "@/components/ui/MathText";
import css from "./TopicTrainerMistakeReview.module.css";

type TopicTrainerMistakeReviewProps = {
  mistakes: SessionMistakeItem[];
  title: string;
};

export function TopicTrainerMistakeReview({
  mistakes,
  title
}: TopicTrainerMistakeReviewProps) {
  if (mistakes.length === 0) return null;

  return (
    <section
      className={css.topicTrainerMistakeReview}
      aria-labelledby="mistake-review-title"
    >
      <h2 id="mistake-review-title" className={css.title}>
        {title}
      </h2>
      <ul className={css.list}>
        {mistakes.map((item) => (
          <li
            key={`${item.name}-${item.taskText.slice(0, 40)}`}
            className={css.item}
          >
            <p className={css.itemName}>{item.name}</p>
            <MathText as="div" className={css.itemText} text={item.taskText} />
            {item.comment ? (
              <MathText as="div" className={css.comment} text={item.comment} />
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
