"use server";

import { startTopicTest, StartTopicTestError } from "./startTopicTest";

export type StartTopicTestActionState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; sessionId: number };

const GENERIC_ERROR_MESSAGE = "Не вдалося запустити тест. Спробуйте ще раз.";
const INSUFFICIENT_TASKS_MESSAGE =
  "Для цієї теми поки що немає завдань у банку питань.";
const IN_PROGRESS_MESSAGE = "Запит уже виконується — зачекайте.";
const INVALID_INPUT_MESSAGE = "Оберіть тему, щоб почати тест.";

// TODO: replace with the authenticated user's id once auth is implemented.
// The repo has no auth/user-context source yet, so this Server Action uses
// a fixed demo user (team-confirmed) instead of accepting a client-supplied
// value.
const DEMO_USER_ID = 1;

type StartTopicTestActionDeps = {
  startTopicTest: typeof startTopicTest;
};

/**
 * Server Action for "Старт" on the topic-test screen. The user id is a
 * trusted server-side constant (`DEMO_USER_ID`), never taken from the
 * client — see the TODO above. `deps` is test-only DI; production callers
 * (React) never pass it, so the default (the real business function) applies.
 */
export async function startTopicTestAction(
  _prevState: StartTopicTestActionState,
  formData: FormData,
  deps: StartTopicTestActionDeps = { startTopicTest },
): Promise<StartTopicTestActionState> {
  const themeId = Number(formData.get("themeId"));

  try {
    const result = await deps.startTopicTest({
      userId: DEMO_USER_ID,
      themeId,
    });
    return { status: "success", sessionId: result.sessionId };
  } catch (error) {
    if (error instanceof StartTopicTestError) {
      switch (error.code) {
        case "insufficient_tasks":
          return { status: "error", message: INSUFFICIENT_TASKS_MESSAGE };
        case "already_in_progress":
          return { status: "error", message: IN_PROGRESS_MESSAGE };
        case "invalid_input":
          return { status: "error", message: INVALID_INPUT_MESSAGE };
        default:
          return { status: "error", message: GENERIC_ERROR_MESSAGE };
      }
    }
    console.error("startTopicTestAction: unexpected error", error);
    return { status: "error", message: GENERIC_ERROR_MESSAGE };
  }
}
