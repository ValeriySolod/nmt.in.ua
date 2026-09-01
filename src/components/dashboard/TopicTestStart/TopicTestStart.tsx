"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { PageFrame, PagePanel } from "@/components/dashboard/PageFrame";
import { ModeTabs } from "@/components/ui/ModeTabs";
import {
  startTopicTestAction,
  type StartTopicTestActionState,
} from "@/modules/testing/actions";
import {
  parseThemeQueryParam,
  resolveInitialThemeId,
} from "@/modules/testing/parseThemeQueryParam";
import {
  previewTaskCount,
  TOPIC_TEST_TASK_COUNT,
  ULTIMATE_TASK_LIMIT,
  type TopicTestMode,
} from "@/modules/testing/topicTestMode";
import type { AvailableTopicTheme } from "@/modules/testing/types";
import css from "./TopicTestStart.module.css";

const INITIAL_STATE: StartTopicTestActionState = { status: "idle" };

const MODE_OPTIONS = [
  { id: "standard" as const, label: "Звичайний" },
  { id: "ultimate" as const, label: "Ultimate", tone: "ultimate" as const },
];

function formatThemeLabel(index: number, theme: AvailableTopicTheme): string {
  return `${index + 1}. ${theme.name}`;
}

type TopicTestStartProps = {
  themes: AvailableTopicTheme[];
  initialThemeId?: number;
};

/** “Тест за обраною темою” — standard or Ultimate mode. */
export function TopicTestStart({ themes, initialThemeId }: TopicTestStartProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, formAction, pending] = useActionState(
    startTopicTestAction,
    INITIAL_STATE,
  );
  const [mode, setMode] = useState<TopicTestMode>("standard");

  useEffect(() => {
    if (state.status === "success") {
      const query = state.mode === "ultimate" ? "?mode=ultimate" : "";
      router.replace(`/session/${state.sessionId}${query}`);
    }
  }, [state, router]);

  const isRedirecting = state.status === "success";
  const hasThemes = themes.length > 0;
  const themeIds = themes.map((theme) => theme.id);
  const urlThemeId = parseThemeQueryParam(searchParams.get("theme"));
  const derivedThemeId = resolveInitialThemeId(
    themeIds,
    urlThemeId ?? initialThemeId,
  );
  const [overrideThemeId, setOverrideThemeId] = useState<number | null>(null);
  const selectedThemeId =
    overrideThemeId ?? derivedThemeId ?? themeIds[0] ?? 0;

  const selectedTheme =
    themes.find((theme) => theme.id === selectedThemeId) ?? themes[0];
  const bankSize = selectedTheme?.taskCount ?? 0;
  const tasksToRun = previewTaskCount(mode, bankSize);
  const controlsDisabled = pending || isRedirecting;

  return (
    <PageFrame
      title="Тест за обраною темою"
      lead={
        <>
          <strong>Звичайний</strong> — до {TOPIC_TEST_TASK_COUNT} випадкових
          завдань з миттєвим розбором. <strong>Ultimate</strong> — до{" "}
          {ULTIMATE_TASK_LIMIT} завдань, 20 хвилин, без підказок до кінця тесту.
        </>
      }
    >
      {!hasThemes ? (
        <p className={css.error} role="status">
          Зараз немає тем із завданнями в базі. Додайте завдання через імпорт на
          сторінці налаштувань.
        </p>
      ) : (
        <PagePanel className={css.panel}>
          <form className={css.controls} action={formAction}>
            <div className={css.fields}>
              <label className={css.field}>
                <span className={css.label}>Обери тему</span>
                <select
                  className={css.select}
                  name="themeId"
                  value={selectedThemeId}
                  onChange={(event) =>
                    setOverrideThemeId(Number(event.currentTarget.value))
                  }
                  disabled={controlsDisabled}
                >
                  {themes.map((theme, index) => (
                    <option key={theme.id} value={theme.id}>
                      {formatThemeLabel(index, theme)}
                    </option>
                  ))}
                </select>
              </label>

              <div className={css.optionsRow}>
                <div className={clsx(css.field, css.fieldMode)}>
                  <span className={css.label}>Режим</span>
                  <ModeTabs
                    value={mode}
                    onChange={setMode}
                    options={MODE_OPTIONS}
                    disabled={controlsDisabled}
                    ariaLabel="Режим тесту"
                    stretch
                    className={css.modeTabs}
                  />
                  <input type="hidden" name="mode" value={mode} />
                </div>

                <div className={clsx(css.field, css.fieldCount)}>
                  <span className={css.label}>Завдань</span>
                  <div
                    className={css.countBadge}
                    aria-label={`Пройти завдань: ${tasksToRun} з ${bankSize}`}
                  >
                    <span className={css.countFraction}>
                      <span className={css.countNum}>{tasksToRun}</span>
                      <span className={css.countSlash} aria-hidden>
                        /
                      </span>
                      <span className={css.countTotal}>{bankSize}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className={clsx(css.start, mode === "ultimate" && css.startUltimate)}
              disabled={controlsDisabled || tasksToRun === 0}
            >
              {isRedirecting
                ? "Переходимо до тесту…"
                : pending
                  ? "Завантаження…"
                  : mode === "ultimate"
                    ? "Старт Ultimate"
                    : "Старт"}
            </button>
          </form>
        </PagePanel>
      )}

      {state.status === "error" ? (
        <p className={css.error} role="alert">
          {state.message}
        </p>
      ) : null}
    </PageFrame>
  );
}
