"use client";

import { useEffect, useMemo, useState } from "react";

import {
  checkAnswerAction,
  finishTrainerSessionAction,
} from "@/modules/testing/actions";

import type {
  SessionTask,
  TrainerSessionSummary,
} from "@/modules/testing/types";

import styles from "./NmtTrainer.module.css";

const NMT_DURATION_SEC = 60 * 60;

type NmtTrainerProps = {
  sessionId: number;
  tasks: SessionTask[];
  initialSummary?: TrainerSessionSummary | null;
};

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, seconds);

  const minutes = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function NmtTrainer({
  sessionId,
  tasks,
  initialSummary,
}: NmtTrainerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const [answered, setAnswered] = useState<Record<number, number>>({});

  const [remainingSeconds, setRemainingSeconds] = useState(NMT_DURATION_SEC);

  const [isFinishing, setIsFinishing] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const currentTask = tasks[currentIndex];

  const answeredCount = Object.keys(answered).length;

  const isFinished = Boolean(initialSummary) || tasks.length === 0;

  useEffect(() => {
    if (isFinished) {
      return;
    }

    const timer = window.setInterval(() => {
      setRemainingSeconds((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          return 0;
        }

        return value - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isFinished]);

  const isTimeOver = remainingSeconds <= 0;

  useEffect(() => {
    if (isTimeOver && !isFinishing && !isFinished) {
      void finish();
    }
  }, [isTimeOver, isFinishing, isFinished]);

  async function handleAnswer(answerNumber: 1 | 2 | 3 | 4) {
    if (!currentTask || isFinishing || isTimeOver) {
      return;
    }

    if (answered[currentTask.mappingId]) {
      return;
    }

    setError(null);

    const result = await checkAnswerAction({
      sessionId,
      mappingId: currentTask.mappingId,
      answerNumber,
    });

    if (result.status === "error") {
      setError(result.code);
      return;
    }

    setAnswered((previous) => ({
      ...previous,
      [currentTask.mappingId]: answerNumber,
    }));
  }

  async function finish() {
    if (isFinishing || isFinished) {
      return;
    }

    setIsFinishing(true);
    setError(null);

    const result = await finishTrainerSessionAction({
      sessionId,
      markUnansweredAsIncorrect: true,
      capTimeSec: NMT_DURATION_SEC,
    });

    if (result.status === "error") {
      setError(result.code);
      setIsFinishing(false);
      return;
    }

    window.location.href = `/results?sessionId=${sessionId}`;
  }

  function goTo(index: number) {
    if (index < 0 || index >= tasks.length) {
      return;
    }

    setCurrentIndex(index);
  }

  if (!currentTask) {
    return null;
  }

  const selectedAnswer = answered[currentTask.mappingId];

  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>
        <div>
          <p className={styles.label}>Симулятор НМТ</p>

          <h1>
            Завдання {currentIndex + 1} з {tasks.length}
          </h1>
        </div>

        <div className={styles.timer}>{formatTime(remainingSeconds)}</div>
      </header>

      <div className={styles.progress}>
        <div
          className={styles.progressBar}
          style={{
            width: `${(answeredCount / tasks.length) * 100}%`,
          }}
        />
      </div>

      <div className={styles.content}>
        <div className={styles.task}>
          <p className={styles.taskName}>{currentTask.name}</p>

          <div className={styles.taskText}>{currentTask.taskText}</div>

          <div className={styles.answers}>
            {currentTask.answers.map((answer) => {
              const isSelected = selectedAnswer === answer.number;

              return (
                <button
                  key={answer.number}
                  type="button"
                  className={`${styles.answer} ${
                    isSelected ? styles.selected : ""
                  }`}
                  disabled={Boolean(selectedAnswer)}
                  onClick={() => handleAnswer(answer.number)}
                >
                  <span className={styles.answerNumber}>{answer.number}</span>

                  <span>{answer.text}</span>
                </button>
              );
            })}
          </div>
        </div>

        <aside className={styles.navigation}>
          <h2>Завдання</h2>

          <div className={styles.grid}>
            {tasks.map((task, index) => {
              const isAnswered = Boolean(answered[task.mappingId]);

              return (
                <button
                  key={task.mappingId}
                  type="button"
                  className={`${styles.questionButton} ${
                    index === currentIndex ? styles.current : ""
                  } ${isAnswered ? styles.answered : ""}`}
                  onClick={() => goTo(index)}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>

          <p className={styles.counter}>
            Відповіді: {answeredCount}/{tasks.length}
          </p>

          <button
            type="button"
            className={styles.finishButton}
            onClick={() => void finish()}
            disabled={isFinishing}
          >
            {isFinishing ? "Завершення..." : "Завершити тест"}
          </button>
        </aside>
      </div>

      <footer className={styles.footer}>
        <button
          type="button"
          onClick={() => goTo(currentIndex - 1)}
          disabled={currentIndex === 0}
        >
          ← Назад
        </button>

        <button
          type="button"
          onClick={() => goTo(currentIndex + 1)}
          disabled={currentIndex === tasks.length - 1}
        >
          Далі →
        </button>
      </footer>

      {error && <p className={styles.error}>{error}</p>}
    </section>
  );
}
