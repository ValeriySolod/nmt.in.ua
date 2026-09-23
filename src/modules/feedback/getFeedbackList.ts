import type { SqlConnection } from "@/lib/db/mysql";
import { ensureFeedbackSchema, loadFeedbackConnection } from "./schema";
import {
  FEEDBACK_PAGE_SIZE,
  isFeedbackScore,
  isFeedbackSource,
  type SiteFeedback,
  type SiteFeedbackPage,
} from "./types";

type GetFeedbackListDeps = {
  getConnection: () => Promise<SqlConnection>;
};

type FeedbackRow = {
  id: number;
  user_id: number | null;
  session_id: number | null;
  score: number;
  message: string | null;
  email: string | null;
  source: string;
  created_at: Date | string;
  display_name: string | null;
  login: string | null;
};

type TotalRow = { total: number | string };

const SQL_LIST = `
  SELECT
    f.id,
    f.user_id,
    f.session_id,
    f.score,
    f.message,
    f.email,
    f.source,
    f.created_at,
    u.display_name,
    u.login
  FROM site_feedback f
  LEFT JOIN app_users u ON u.id = f.user_id
  WHERE f.score BETWEEN 1 AND 10
    AND f.source IN ('footer', 'post_test')
  ORDER BY f.id DESC
`;

const SQL_COUNT = `
  SELECT COUNT(*) AS total
  FROM site_feedback
  WHERE score BETWEEN 1 AND 10
    AND source IN ('footer', 'post_test')
`;

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function mapRow(row: FeedbackRow): SiteFeedback | null {
  if (!isFeedbackScore(row.score) || !isFeedbackSource(row.source)) {
    return null;
  }
  return {
    id: row.id,
    userId: row.user_id,
    sessionId: row.session_id,
    score: row.score,
    message: row.message?.trim() || null,
    email: row.email?.trim() || null,
    source: row.source,
    createdAt: toDate(row.created_at),
    userDisplayName: row.display_name?.trim() || null,
    userLogin: row.login?.trim() || null,
  };
}

export type GetFeedbackListOptions = {
  page?: number;
  pageSize?: number;
};

/** Newest site feedback for the admin `/feedback` page. Not for students. */
export async function getFeedbackList(
  options: GetFeedbackListOptions = {},
  deps: GetFeedbackListDeps = { getConnection: loadFeedbackConnection },
): Promise<SiteFeedbackPage> {
  const pageSize = Math.max(
    1,
    Math.floor(options.pageSize ?? FEEDBACK_PAGE_SIZE),
  );
  const requestedPage = Math.max(1, Math.floor(options.page ?? 1));

  await ensureFeedbackSchema(deps.getConnection);
  const connection = await deps.getConnection();
  try {
    const countRows = await connection.query<TotalRow>(SQL_COUNT);
    const total = Number(countRows[0]?.total ?? 0);
    const totalPages = total === 0 ? 1 : Math.ceil(total / pageSize);
    const page = Math.min(requestedPage, totalPages);
    const offset = (page - 1) * pageSize;

    const rows =
      total === 0
        ? []
        : await connection.query<FeedbackRow>(
            // MySQL prepared statements reject `LIMIT ?` — inline validated ints.
            `${SQL_LIST} LIMIT ${pageSize} OFFSET ${offset}`,
          );

    return {
      items: rows
        .map(mapRow)
        .filter((row): row is SiteFeedback => row !== null),
      total,
      page,
      pageSize,
      totalPages,
    };
  } finally {
    connection.release();
  }
}
