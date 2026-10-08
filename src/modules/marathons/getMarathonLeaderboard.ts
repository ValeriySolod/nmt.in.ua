import "server-only";
import type { SqlConnection } from "@/lib/db/mysql";
import { SESSION_STATUS_COMPLETED } from "@/modules/sessions/types";
import { closeExpiredMarathons } from "./schema";
import {
  aggregateSessions,
  compareStandings,
  countsTowardMarathon,
  type SessionAggregateInput,
} from "./scoring";
import type {
  MarathonLeaderboardRow,
  MarathonLeaderboardView,
  MarathonRecord,
} from "./types";

type ParticipantRow = {
  user_id: number;
  display_name: string;
  login: string;
  joined_at: number | string;
};

type SessionRow = {
  user_id: number;
  tasks_number: number;
  right_number: number;
  time: number;
  start_time: number;
};

async function loadDefaultConnection(): Promise<SqlConnection> {
  const { getConnection } = await import("@/lib/db/mysql");
  return getConnection();
}

function mapMarathon(row: MarathonRecord): MarathonRecord {
  return row;
}

export async function getActiveMarathon(
  getConnection: () => Promise<SqlConnection> = loadDefaultConnection,
): Promise<MarathonRecord | null> {
  await closeExpiredMarathons(getConnection);
  const now = Math.floor(Date.now() / 1000);
  const connection = await getConnection();
  try {
    const rows = await connection.query<MarathonRecord>(
      `SELECT id, slug, title, description, status, starts_at, ends_at, min_tasks_per_session
       FROM marathons
       WHERE status = 'active' AND starts_at <= ? AND ends_at > ?
       ORDER BY starts_at DESC
       LIMIT 1`,
      [now, now],
    );
    const row = rows[0];
    return row ? mapMarathon(row) : null;
  } finally {
    connection.release();
  }
}

export type GetMarathonLeaderboardOptions = {
  marathonSlug?: string;
  /** When set (teacher), rows for these user ids get `isRosterStudent`. */
  rosterStudentIds?: ReadonlySet<number>;
};

export async function getMarathonLeaderboard(
  viewerUserId: number,
  options: GetMarathonLeaderboardOptions = {},
  getConnection: () => Promise<SqlConnection> = loadDefaultConnection,
): Promise<MarathonLeaderboardView | null> {
  const marathonSlug = options.marathonSlug;
  const rosterStudentIds = options.rosterStudentIds ?? new Set<number>();
  await closeExpiredMarathons(getConnection);
  const now = Math.floor(Date.now() / 1000);
  const connection = await getConnection();
  try {
    const marathonRows = await connection.query<MarathonRecord>(
      marathonSlug
        ? `SELECT id, slug, title, description, status, starts_at, ends_at, min_tasks_per_session
           FROM marathons WHERE slug = ? LIMIT 1`
        : `SELECT id, slug, title, description, status, starts_at, ends_at, min_tasks_per_session
           FROM marathons
           WHERE status = 'active' AND starts_at <= ? AND ends_at > ?
           ORDER BY starts_at DESC LIMIT 1`,
      marathonSlug ? [marathonSlug] : [now, now],
    );
    const marathon = marathonRows[0];
    if (!marathon || marathon.status === "draft") return null;

    const participants = await connection.query<ParticipantRow>(
      `SELECT mp.user_id, u.display_name, u.login,
              UNIX_TIMESTAMP(mp.joined_at) AS joined_at
       FROM marathon_participants mp
       INNER JOIN app_users u ON u.id = mp.user_id
       WHERE mp.marathon_id = ?
       ORDER BY u.display_name`,
      [marathon.id],
    );

    const participantIds = participants.map((p) => p.user_id);
    const isParticipant = participantIds.includes(viewerUserId);

    if (participantIds.length === 0) {
      return {
        marathon,
        rows: [],
        participantCount: 0,
        isParticipant,
        currentUserRank: null,
        rosterParticipantCount: 0,
        rosterSize: rosterStudentIds.size,
      };
    }

    const placeholders = participantIds.map(() => "?").join(", ");
    const sessions = await connection.query<SessionRow>(
      `SELECT user_id, tasks_number, right_number, time, start_time
       FROM task_sessions
       WHERE user_id IN (${placeholders})
         AND session_status = ?
         AND start_time >= ?
         AND start_time <= ?`,
      [
        ...participantIds,
        SESSION_STATUS_COMPLETED,
        marathon.starts_at,
        marathon.ends_at,
      ],
    );

    const joinedAtByUser = new Map(
      participants.map((participant) => [
        participant.user_id,
        Number(participant.joined_at),
      ]),
    );
    const sessionsByUser = new Map<number, SessionAggregateInput[]>();
    for (const session of sessions) {
      const joinedAtUnix = joinedAtByUser.get(session.user_id);
      if (
        joinedAtUnix == null ||
        !Number.isFinite(joinedAtUnix) ||
        !countsTowardMarathon({
          startTime: Number(session.start_time),
          marathonStartsAt: Number(marathon.starts_at),
          marathonEndsAt: Number(marathon.ends_at),
          joinedAtUnix,
        })
      ) {
        continue;
      }
      const list = sessionsByUser.get(session.user_id) ?? [];
      list.push({
        tasksNumber: session.tasks_number,
        rightNumber: session.right_number,
        timeSec: session.time,
      });
      sessionsByUser.set(session.user_id, list);
    }

    const standings = participants.map((participant) => {
      const agg = aggregateSessions(
        sessionsByUser.get(participant.user_id) ?? [],
        marathon.min_tasks_per_session,
      );
      return { participant, agg };
    });

    standings.sort((a, b) => compareStandings(a.agg, b.agg));

    let rank = 0;
    const rows: MarathonLeaderboardRow[] = standings.map((entry) => {
      rank += 1;
      return {
        rank,
        userId: entry.participant.user_id,
        displayName: entry.participant.display_name,
        login: entry.participant.login,
        sessionsCount: entry.agg.sessionsCount,
        avgPercent: entry.agg.avgPercent,
        avgSecPerTask: entry.agg.avgSecPerTask,
        isCurrentUser: entry.participant.user_id === viewerUserId,
        isRosterStudent: rosterStudentIds.has(entry.participant.user_id),
      };
    });

    const current = rows.find((row) => row.isCurrentUser);
    const rosterParticipantCount = rows.filter((row) => row.isRosterStudent)
      .length;

    return {
      marathon,
      rows,
      participantCount: participants.length,
      isParticipant,
      currentUserRank: current?.rank ?? null,
      rosterParticipantCount,
      rosterSize: rosterStudentIds.size,
    };
  } finally {
    connection.release();
  }
}
