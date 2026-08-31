"use client";

import Link from "next/link";
import { useState } from "react";
import clsx from "clsx";
import type { SessionTask, SessionTaskAnswer } from "@/modules/testing/types";
import css from "./TopicTrainer.module.css";

type TopicTrainerProps = {
  sessionId: number;
  tasks: SessionTask[];
};

/** Mock answer handler until checkAnswer (task 3.3) is wired up. */
function mockSubmitAnswer(taskId: number, answerNumber: SessionTaskAnswer["number"]) {
  void taskId;
  void answerNumber;
}

export function TopicTrainer({ sessionId, tasks }: TopicTrainerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedByTaskId, setSelectedByTaskId] = useState<
    Record<number, SessionTaskAnswer["number"]>
  >({});

  const currentTask = tasks[currentIndex];
  const total = tasks.length;
  const selectedAnswer = currentTask
    ? selectedByTaskId[currentTask.taskId]
    : undefined;
  const isLast = currentIndex === total - 1;
  const allAnswered =
    tasks.length > 0 &&
    tasks.every((task) => selectedByTaskId[task.taskId] !== undefined);

  if (!currentTask) {
    return null;
  }

  function handleSelect(answerNumber: SessionTaskAnswer["number"]) {
    setSelectedByTaskId((prev) => ({
      ...prev,
      [currentTask.taskId]: answerNumber,
    }));
    mockSubmitAnswer(currentTask.taskId, answerNumber);
  }

  function handleNext() {
    if (selectedAnswer === undefined) return;
    if (!isLast) {
      setCurrentIndex((index) => index + 1);
    }
  }

  return (
    <section className={css.topicTrainer} aria-labelledby="topic-trainer-title">
      <header className={css.header}>
        <div>
          <h1 id="topic-trainer-title" className={css.title}>
            Тест за темою
          </h1>
          <p className={css.meta}>Сесія №{sessionId}</p>
        </div>
        <p className={css.progress} aria-live="polite">
          Завдання {currentIndex + 1} / {total}
        </p>
      </header>

      <article className={css.card} aria-label={`Завдання ${currentIndex + 1}`}>
        <h2 className={css.taskName}>{currentTask.name}</h2>
        <p className={css.taskText}>{currentTask.taskText}</p>

        <div className={css.answers} role="group" aria-label="Варіанти відповіді">
          {currentTask.answers.map((answer) => (
            <button
              key={answer.number}
              type="button"
              className={clsx(
                css.answer,
                selectedAnswer === answer.number && css.answerSelected,
              )}
              onClick={() => handleSelect(answer.number)}
              aria-pressed={selectedAnswer === answer.number}
            >
              {answer.number}. {answer.text}
            </button>
          ))}
        </div>
      </article>

      {selectedAnswer !== undefined ? (
        <p className={css.feedback} role="status">
          Відповідь обрано. Перевірка результатів підключиться на наступній ітерації.
        </p>
      ) : null}

      <div className={css.actions}>
        {!isLast ? (
          <button
            type="button"
            className={css.next}
            onClick={handleNext}
            disabled={selectedAnswer === undefined}
          >
            Наступне завдання
          </button>
        ) : null}

        <Link href="/" className={css.backLink}>
          ← До вибору теми
        </Link>
      </div>

      {isLast && allAnswered ? (
        <p className={css.finish} role="status">
          Усі завдання пройдено. Підсумок і збереження результатів — у наступній
          ітерації (finishTrainerSession).
        </p>
      ) : null}
    </section>
  );
}
