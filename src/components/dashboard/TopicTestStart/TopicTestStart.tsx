"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  startTopicTestAction,
  type StartTopicTestActionState,
} from "@/modules/testing/actions";
import type { AvailableTopicTheme } from "@/modules/testing/types";
import css from "./TopicTestStart.module.css";

const INITIAL_STATE: StartTopicTestActionState = { status: "idle" };

function formatThemeLabel(index: number, theme: AvailableTopicTheme): string {
  return `${index + 1}. ${theme.name}`;
}

type TopicTestStartProps = {
  themes: AvailableTopicTheme[];
  maxTaskCount: number;
};

/** “Тест за обраною темою” — starts a topic-test session via a Server Action. */
export function TopicTestStart({ themes, maxTaskCount }: TopicTestStartProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    startTopicTestAction,
    INITIAL_STATE,
  );

  useEffect(() => {
    if (state.status === "success") {
      router.replace(`/session/${state.sessionId}`);
    }
  }, [state, router]);

  const isRedirecting = state.status === "success";

  const hasThemes = themes.length > 0;
  const [selectedThemeId, setSelectedThemeId] = useState(themes[0]?.id ?? 0);
  const selectedTheme =
    themes.find((theme) => theme.id === selectedThemeId) ?? themes[0];
  const taskCount = selectedTheme?.taskCount ?? 0;

  return (
    <section className={css.section} aria-labelledby="topic-test-title">
      <header className={css.intro}>
        <h1 id="topic-test-title" className={css.title}>
          Тест за обраною темою
        </h1>
        <p className={css.lead}>
          Оберіть тему з банку питань. Тест містить усі доступні завдання по
          темі (до {maxTaskCount}).
        </p>
      </header>

      {!hasThemes ? (
        <p className={css.error} role="status">
          Зараз немає тем із завданнями в базі. Додайте завдання через імпорт
          або phpMyAdmin.
        </p>
      ) : (
        <form className={css.controls} action={formAction}>
          <label className={css.field}>
            <span className={css.label}>Обери тему</span>
            <select
              className={css.select}
              name="themeId"
              value={selectedThemeId}
              onChange={(event) =>
                setSelectedThemeId(Number(event.currentTarget.value))
              }
              disabled={pending || isRedirecting}
            >
              {themes.map((theme, index) => (
                <option key={theme.id} value={theme.id}>
                  {formatThemeLabel(index, theme)}
                </option>
              ))}
            </select>
          </label>

          <label className={css.field}>
            <span className={css.label}>Пройти завдань</span>
            <input
              className={css.input}
              type="number"
              min={taskCount}
              max={taskCount}
              value={taskCount}
              readOnly
              aria-label="Кількість завдань"
            />
          </label>

          <button type="submit" className={css.start} disabled={pending || isRedirecting}>
            {isRedirecting
              ? "Переходимо до тесту…"
              : pending
                ? "Завантаження…"
                : "Старт"}
          </button>
        </form>
      )}

      {state.status === "error" && (
        <p className={css.error} role="alert">
          {state.message}
        </p>
      )}
    </section>
  );
}
