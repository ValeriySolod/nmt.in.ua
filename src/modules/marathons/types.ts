export type MarathonStatus = "draft" | "active" | "archived";

export type MarathonRecord = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  status: MarathonStatus;
  starts_at: number;
  ends_at: number;
  min_tasks_per_session: number;
};

export type MarathonLeaderboardRow = {
  rank: number;
  userId: number;
  displayName: string;
  login: string;
  sessionsCount: number;
  avgPercent: number | null;
  avgSecPerTask: number | null;
  isCurrentUser: boolean;
  /** Viewer is a teacher and this row is one of their linked students. */
  isRosterStudent: boolean;
};

export type MarathonLeaderboardView = {
  marathon: MarathonRecord;
  rows: MarathonLeaderboardRow[];
  participantCount: number;
  isParticipant: boolean;
  currentUserRank: number | null;
  rosterParticipantCount: number;
  rosterSize: number;
};
