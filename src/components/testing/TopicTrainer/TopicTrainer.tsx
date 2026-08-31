"use client";

import Link from "next/link";
import { useState } from "react";
import clsx from "clsx";
import { checkAnswerAction } from "@/modules/testing/actions";
import {
  TASK_STATUS_CORRECT,
  TASK_STATUS_INCORRECT,
  type SessionTask,
  type SessionTaskAnswer,
} from "@/modules/testing/types";
import css from "./TopicTrainer.module.css";

type TopicTrainerProps = {
  sessionId: number;
  tasks: SessionTask[];
};

type CheckResult = { correct: boolean };

function initialResults(tasks: SessionTask[]): Record<number, CheckResult> {
  const results: Record<number, CheckResult> = {};
  for (const task of tasks) {
    if (task.status === TASK_STATUS_CORRECT)
      results[task.mappingId] = { correct: true };
    if (task.status === TASK_STATUS_INCORRECT)
      results[task.mappingId] = { correct: false };
  }
  return results;
}

export function TopicTrainer({ sessionId, tasks }: TopicTrainerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedByMappingId, setSelectedByMappingId] = useState<
    Record<number, SessionTaskAnswer["number"]>
  >({});
  const [resultsByMappingId, setResultsByMappingId] = useState(() =>
    initialResults(tasks),
  );
  const [pendingMappingId, setPendingMappingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentTask = tasks[currentIndex];
  const total = tasks.length;
  const selectedAnswer = currentTask
    ? selectedByMappingId[currentTask.mappingId]
    : undefined;
  const checkResult = currentTask
    ? resultsByMappingId[currentTask.mappingId]
    : undefined;
  const isPending =
    currentTask != null && pendingMappingId === currentTask.mappingId;
  const isLast = currentIndex === total - 1;
  const allAnswered =
    tasks.length > 0 &&
    tasks.every((task) => resultsByMappingId[task.mappingId] !== undefined);

  if (!currentTask) {
    return null;
  }

  async function handleSelect(answerNumber: SessionTaskAnswer["number"]) {
    if (checkResult || isPending) return;

    setSelectedByMappingId((prev) => ({
      ...prev,
      [currentTask.mappingId]: answerNumber,
    }));
    setErrorMessage(null);
    setPendingMappingId(currentTask.mappingId);

    const result = await checkAnswerAction({
      sessionId,
      mappingId: currentTask.mappingId,
      answerNumber,
    });

    setPendingMappingId(null);

    if (result.status !== "success") {
      setErrorMessage(result.message);
      return;
    }

    setResultsByMappingId((prev) => ({
      ...prev,
      [currentTask.mappingId]: { correct: result.correct },
    }));
  }

  function handleNext() {
    if (checkResult === undefined) return;
    if (!isLast) {
      setCurrentIndex((index) => index + 1);
      setErrorMessage(null);
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
                selectedAnswer === answer.number &&
                  checkResult === undefined &&
                  css.answerSelected,
                selectedAnswer === answer.number &&
                  checkResult?.correct === true &&
                  css.answerCorrect,
                selectedAnswer === answer.number &&
                  checkResult?.correct === false &&
                  css.answerWrong,
              )}
              onClick={() => handleSelect(answer.number)}
              disabled={isPending || checkResult !== undefined}
              aria-pressed={selectedAnswer === answer.number}
            >
              {answer.number}. {answer.text}
            </button>
          ))}
        </div>
      </article>

      {isPending ? (
        <p className={css.feedback} role="status">
          Перевіряємо відповідь…
        </p>
      ) : null}

      {checkResult ? (
        <p
          className={clsx(
            css.feedback,
            checkResult.correct ? css.feedbackOk : css.feedbackBad,
          )}
          role="status"
        >
          {checkResult.correct ? "Вірно" : "Невірно"}
        </p>
      ) : null}

      {errorMessage ? (
        <p className={clsx(css.feedback, css.feedbackBad)} role="alert">
          {errorMessage}
        </p>
      ) : null}

      <div className={css.actions}>
        {!isLast ? (
          <button
            type="button"
            className={css.next}
            onClick={handleNext}
            disabled={checkResult === undefined || isPending}
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
