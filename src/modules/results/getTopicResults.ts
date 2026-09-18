import type { SqlConnection } from "@/lib/db/mysql";
import { SESSION_STATUS_COMPLETED } from "@/modules/sessions/types";
import { getLatestSelfScoresForResults } from "@/modules/self-score/getLatestSelfScoresForResults";
import { resolveDisplaySelfScore, type LatestSelfScores } from "@/modules/self-score/types";
import { nowUnixSec } from "@/modules/testing/sessionElapsed";
import { buildTopicResultRows, type TopicResultRow } from "./types";

/** Newest N attempts per theme — enough for overall / last-three without full history. */
export const TOPIC_RESULTS_SESSIONS_PER_THEME = 12;

const SQL_THEMES = `
  SELECT id, code, name, ord
  FROM themes
  ORDER BY ord ASC, id ASC
`;

/**
 * An expired, unfinished attempt is excluded before ranking so it never
 * occupies one of the 12 window slots — completed history stays readable
 * (and counted) regardless of its own expire_time.
 */
const SQL_USER_SESSIONS = `
  SELECT id, theme_id, tasks_number, right_number, time
  FROM (
    SELECT
      id,
      theme_id,
      tasks_number,
      right_number,
      time,
      ROW_NUMBER() OVER (
        PARTITION BY theme_id
        ORDER BY id DESC
      ) AS rn
    FROM task_sessions
    WHERE user_id = ?
      AND (session_status = ${SESSION_STATUS_COMPLETED} OR expire_time > ?)
  ) ranked
  WHERE rn <= ${TOPIC_RESULTS_SESSIONS_PER_THEME}
  ORDER BY id DESC
`;

const SQL_ATTEMPT_COUNTS = `
  SELECT theme_id, COUNT(*) AS attempts
  FROM task_sessions
  WHERE user_id = ?
    AND session_status = ${SESSION_STATUS_COMPLETED}
    AND theme_id IS NOT NULL
  GROUP BY theme_id
`;

type GetTopicResultsDeps = {
  getConnection: () => Promise<SqlConnection>;
  nowSec?: () => number;
};

async function loadDefaultConnection(): Promise<SqlConnection> {
  const { getConnection } = await import("@/lib/db/mysql");
  return getConnection();
}

/** Attaches the self-score fallback (latest pre_topic, else latest
 * diagnostic_overall) to each row — a pure post-process step so
 * `buildTopicResultRows` itself (and its existing tests) stay untouched. */
export function attachSelfScores(
  rows: TopicResultRow[],
  latest: LatestSelfScores,
): TopicResultRow[] {
  return rows.map((row) => ({
    ...row,
    selfScore: resolveDisplaySelfScore(row.themeId, latest),
  }));
}

export function attachAttemptCounts(
  rows: TopicResultRow[],
  counts: Map<number, number>,
): TopicResultRow[] {
  return rows.map((row) => ({
    ...row,
    attemptsCount: counts.get(row.themeId) ?? row.attemptsCount,
  }));
}

/** Aggregated progress by theme for a student, including the self-score
 * column ("Самооцінка" on /results). */
export async function getTopicResults(
  userId: number,
  deps: GetTopicResultsDeps = { getConnection: loadDefaultConnection },
): Promise<TopicResultRow[]> {
  const connection = await deps.getConnection();
  let themes: { id: number; code: string; name: string; ord: number }[];
  let sessions: {
    id: number;
    theme_id: number;
    tasks_number: number;
    right_number: number;
    time: number;
  }[];
  let attemptRows: { theme_id: number; attempts: number }[];
  try {
    themes = await connection.query(SQL_THEMES);
    const nowSec = deps.nowSec ?? nowUnixSec;
    sessions = await connection.query(SQL_USER_SESSIONS, [userId, nowSec()]);
    attemptRows = await connection.query(SQL_ATTEMPT_COUNTS, [userId]);
  } finally {
    connection.release();
  }

  const counts = new Map<number, number>();
  for (const row of attemptRows) {
    counts.set(row.theme_id, Number(row.attempts) || 0);
  }

  const rows = attachAttemptCounts(
    buildTopicResultRows(themes, sessions),
    counts,
  );
  const latestSelfScores = await getLatestSelfScoresForResults(userId, {
    getConnection: deps.getConnection,
  });
  return attachSelfScores(rows, latestSelfScores);
}

export {
  buildTopicResultRows,
  formatPercent,
  formatSpeed,
  getScoreLevel,
} from "./types";

export type { ScoreLevel, TopicResultRow } from "./types";
