import {
  buildTopicResultRows,
  type SessionRow,
  type ThemeRow,
} from "@/modules/results/types";
import { sessionPercent } from "@/modules/sessions/types";

export type StudentTopicScore = {
  themeId: number;
  themeName: string;
  overallPercent: number | null;
  lastPercent: number | null;
};

export type StudentTopicStats = {
  topicScores: StudentTopicScore[];
  hasCompletedSessions: boolean;
};

/**
 * Builds per-theme recommendation stats from all themes and the user's
 * completed sessions. `sessions` must be ordered most-recent-first (id DESC)
 * so the first session seen per theme determines `lastPercent`.
 */
export function buildStudentTopicStats(
  themes: ThemeRow[],
  sessions: SessionRow[],
): StudentTopicStats {
  const resultRows = buildTopicResultRows(themes, sessions);

  const lastSessionByTheme = new Map<number, SessionRow>();
  for (const session of sessions) {
    if (!lastSessionByTheme.has(session.theme_id)) {
      lastSessionByTheme.set(session.theme_id, session);
    }
  }

  const topicScores: StudentTopicScore[] = resultRows.map((row) => {
    const lastSession = lastSessionByTheme.get(row.themeId);
    return {
      themeId: row.themeId,
      themeName: row.themeName,
      overallPercent: row.overallPercent,
      lastPercent: lastSession
        ? sessionPercent(lastSession.tasks_number, lastSession.right_number)
        : null,
    };
  });

  return {
    topicScores,
    hasCompletedSessions: sessions.length > 0,
  };
}
