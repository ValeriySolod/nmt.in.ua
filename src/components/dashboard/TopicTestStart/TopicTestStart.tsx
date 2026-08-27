"use client";

import { useActionState } from "react";
import {
  startTopicTestAction,
  type StartTopicTestActionState,
} from "@/modules/testing/actions";
import css from "./TopicTestStart.module.css";

/** Existing theme identifiers surfaced by the UI (no separate theme model). */
const THEMES = [
  { id: 1, label: "1. Елементарна математика" },
  { id: 2, label: "2. Арифметичні дії" },
  { id: 3, label: "3. Елементарна планіметрія" },
];

const INITIAL_STATE: StartTopicTestActionState = { status: "idle" };

/** “Тест за обраною темою” — starts a topic-test session via a Server Action. */
export function TopicTestStart() {
  const [state, formAction, pending] = useActionState(
    startTopicTestAction,
    INITIAL_STATE,
  );

  return (
    <section className={css.section} aria-labelledby="topic-test-title">
      <header className={css.intro}>
        <h1 id="topic-test-title" className={css.title}>
          Тест за обраною темою
        </h1>
        <p className={css.lead}>
          Оберіть тему й кількість завдань — повна логіка тесту підключиться
          наступними ітераціями.
        </p>
      </header>

      <form className={css.controls} action={formAction}>
        <label className={css.field}>
          <span className={css.label}>Обери тему</span>
          <select
            className={css.select}
            name="themeId"
            defaultValue={THEMES[0].id}
            disabled={pending}
          >
            {THEMES.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.label}
              </option>
            ))}
          </select>
        </label>

        <label className={css.field}>
          <span className={css.label}>Пройти завдань</span>
          <input
            className={css.input}
            type="number"
            min={10}
            max={10}
            defaultValue={10}
            disabled
            aria-label="Кількість завдань"
          />
        </label>

        <button type="submit" className={css.start} disabled={pending}>
          {pending ? "Завантаження…" : "Старт"}
        </button>
      </form>

      {state.status === "error" && (
        <p className={css.error} role="alert">
          {state.message}
        </p>
      )}

      {state.status === "success" && (
        <p className={css.success} role="status">
          Сесію тесту створено (№{state.sessionId}). Проходження завдань
          підключимо наступною ітерацією.
        </p>
      )}

      <article className={css.preview} aria-label="Приклад картки завдання">
        <h2 className={css.previewTitle}>Назва завдання</h2>
        <p className={css.previewText}>
          Опис тексту завдання, у тому числі формули — тут зʼявиться контент
          банку питань.
        </p>
        <div className={css.answers}>
          <button type="button" className={css.answer} disabled>
            Відповідь №1
          </button>
          <button type="button" className={css.answer} disabled>
            Відповідь №2
          </button>
          <button type="button" className={css.answer} disabled>
            Відповідь №3
          </button>
          <button type="button" className={css.answer} disabled>
            Відповідь №4
          </button>
        </div>
      </article>

      <dl className={css.stats}>
        <div>
          <dt>Правильних відповідей</dt>
          <dd>9 з 10 · краще ніж 80%</dd>
        </div>
        <div>
          <dt>Середній час відповіді</dt>
          <dd>5,6 с · краще ніж 70%</dd>
        </div>
      </dl>
    </section>
  );
}
