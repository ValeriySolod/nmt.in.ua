import type { SqlConnection } from "@/lib/db/mysql";
import { ensureDiagnosticSelfScoreSchema } from "./diagnosticSelfScores";
import {
  loadPlannedThemeIds,
  loadProgressMappings,
  resolveStepAgainstBank,
} from "./diagnosticFlowStore";
import { DIAGNOSTIC_TOTAL_QUESTIONS } from "./diagnosticProgress";
import { isValidOwner, type SessionOwner } from "./sessionOwner";

const SQL_SELECT_THEME = `
  SELECT id, name, description FROM themes WHERE id = ?
`;

const SQL_SELECT_EXAMPLE_TASK = `
  SELECT name, task_text
  FROM quiz_tasks
  WHERE theme_id = ?
  ORDER BY ABS(difficulty - 2) ASC, id ASC
  LIMIT 1
`;

export type DiagnosticExampleTaskView = {
  name: string;
  taskText: string;
};

export type DiagnosticTopicIntroView = {
  themeId: number;
  themeName: string;
  /** Main concepts of the topic, from `themes.description`. */
  concepts: string[];
  topicNumber: number;
  topicCount: number;
  exampleTask: DiagnosticExampleTaskView | null;
};

/**
 * What the in-progress diagnostic session page should render:
 * - `topicIntro`: the next topic's self-assessment screen;
 * - `questions`: the task list, where `afterLastTask` says what the
 *   primary action does once the latest task is answered — link another
 *   task (`continue`) or finish the attempt (`finish`).
 */
export type DiagnosticNextStepView =
  | { kind: "topicIntro"; topic: DiagnosticTopicIntroView }
  | { kind: "questions"; afterLastTask: "continue" | "finish" };

type GetDiagnosticNextStepDeps = {
  getConnection: () => Promise<SqlConnection>;
};

type ThemeRow = { id: number; name: string; description: string | null };
type ExampleTaskRow = { name: string; task_text: string };

/** `themes.description` holds a short comma-separated list of the topic's
 * concepts (e.g. "віднесення до множини, рахування"). */
export function splitThemeConcepts(description: string | null): string[] {
  if (!description) return [];
  return description
    .split(/[,;\n]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

async function loadDefaultConnection(): Promise<SqlConnection> {
  const { getConnection } = await import("@/lib/db/mysql");
  return getConnection();
}

/**
 * Read-only: never links a task or records anything. The caller must have
 * already validated ownership/expiry via `getDiagnosticSessionTasks` — the
 * progress query is still owner-scoped on its own, so a foreign session id
 * only ever yields an empty progress list.
 */
export async function getDiagnosticNextStep(
  sessionId: number,
  owner: SessionOwner,
  deps: GetDiagnosticNextStepDeps = { getConnection: loadDefaultConnection },
): Promise<DiagnosticNextStepView> {
  if (!isValidOwner(owner)) {
    throw new Error("owner must be exactly one of userId or guestToken.");
  }

  await ensureDiagnosticSelfScoreSchema(deps.getConnection);
  const connection = await deps.getConnection();
  try {
    const mappings = await loadProgressMappings(connection, sessionId, owner, {
      forUpdate: false,
    });
    const plannedThemeIds = await loadPlannedThemeIds(connection, sessionId);
    const { step } = await resolveStepAgainstBank(
      connection,
      mappings,
      plannedThemeIds,
      sessionId,
    );

    if (step.kind === "topicIntro") {
      const themes = await connection.query<ThemeRow>(SQL_SELECT_THEME, [
        step.themeId,
      ]);
      const exampleTasks = await connection.query<ExampleTaskRow>(
        SQL_SELECT_EXAMPLE_TASK,
        [step.themeId],
      );
      const theme = themes[0];
      const exampleTask = exampleTasks[0];
      return {
        kind: "topicIntro",
        topic: {
          themeId: step.themeId,
          themeName: theme?.name.trim() ?? "",
          concepts: splitThemeConcepts(theme?.description ?? null),
          topicNumber: step.topicNumber,
          topicCount: step.topicCount,
          exampleTask: exampleTask
            ? {
                name: exampleTask.name.trim(),
                taskText: exampleTask.task_text.trim(),
              }
            : null,
        },
      };
    }

    // A pending task that already fills the attempt is known to be the last
    // one; otherwise `advanceDiagnosticSession` decides after the answer.
    const isFinal =
      step.kind === "complete" ||
      (step.kind === "answer" && mappings.length >= DIAGNOSTIC_TOTAL_QUESTIONS);
    return {
      kind: "questions",
      afterLastTask: isFinal ? "finish" : "continue",
    };
  } finally {
    connection.release();
  }
}
