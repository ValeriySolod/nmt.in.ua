import "server-only";

import type { SqlConnection } from "@/lib/db/mysql";
import { ensureAuthSchema } from "@/modules/auth/users";
import type { UserRole } from "@/modules/auth/types";
import { ensureTeacherProfileSchema } from "./schema";
import { ensureTeacherRatingsSchema } from "./ratingsSchema";
import type { TeacherCarouselItem } from "./types";

export type { TeacherCarouselItem };

type ListRow = {
  user_id: number;
  slug: string;
  headline: string | null;
  bio: string | null;
  city: string | null;
  subjects: string | null;
  contact_url: string | null;
  is_public: number | boolean;
  display_name: string;
  login: string;
  role: UserRole;
  avatar_rev?: number | string | null;
  avg_rating?: number | string | null;
  rating_count?: number | string | null;
  my_rating?: number | string | null;
};

const SQL_LIST_PUBLIC = `
  SELECT p.user_id, p.slug, p.headline, p.bio, p.city, p.subjects, p.contact_url, p.is_public,
         u.display_name, u.login, u.role,
         UNIX_TIMESTAMP(a.updated_at) AS avatar_rev,
         stats.avg_rating,
         stats.rating_count,
         mine.score AS my_rating
  FROM teacher_profiles p
  INNER JOIN app_users u ON u.id = p.user_id
  LEFT JOIN user_avatars a ON a.user_id = u.id
  LEFT JOIN (
    SELECT teacher_user_id,
           AVG(score) AS avg_rating,
           COUNT(*) AS rating_count
    FROM teacher_ratings
    GROUP BY teacher_user_id
  ) stats ON stats.teacher_user_id = p.user_id
  LEFT JOIN teacher_ratings mine
    ON mine.teacher_user_id = p.user_id AND mine.student_user_id = ?
  WHERE p.is_public = 1
    AND u.role IN ('teacher', 'admin')
  ORDER BY stats.avg_rating IS NULL ASC, stats.avg_rating DESC, u.display_name ASC
`;

type StoreDeps = {
  getConnection: () => Promise<SqlConnection>;
};

async function loadDefaultConnection(): Promise<SqlConnection> {
  const { getConnection } = await import("@/lib/db/mysql");
  return getConnection();
}

function parseSubjectsJson(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

function asPositiveInt(value: unknown): number | undefined {
  if (value == null || value === "") return undefined;
  const numeric = typeof value === "bigint" ? Number(value) : Number(value);
  if (!Number.isInteger(numeric) || numeric <= 0) return undefined;
  return numeric;
}

function asRating(value: unknown): number | null {
  if (value == null || value === "") return null;
  const numeric = typeof value === "bigint" ? Number(value) : Number(value);
  if (!Number.isFinite(numeric)) return null;
  const rounded = Math.round(numeric * 10) / 10;
  if (rounded < 1 || rounded > 5) return null;
  return rounded;
}

function asCount(value: unknown): number {
  if (value == null || value === "") return 0;
  const numeric = typeof value === "bigint" ? Number(value) : Number(value);
  if (!Number.isInteger(numeric) || numeric < 0) return 0;
  return numeric;
}

function mapRow(row: ListRow): TeacherCarouselItem {
  const card: TeacherCarouselItem = {
    userId: row.user_id,
    slug: row.slug,
    headline: row.headline?.trim() ?? "",
    bio: row.bio?.trim() ?? "",
    city: row.city?.trim() ?? "",
    subjects: parseSubjectsJson(row.subjects),
    contactUrl: row.contact_url?.trim() ?? "",
    isPublic: Boolean(row.is_public),
    displayName: row.display_name.trim(),
    login: row.login,
    role: row.role,
    avgRating: asRating(row.avg_rating),
    ratingCount: asCount(row.rating_count),
    myRating: asRating(row.my_rating),
  };
  const avatarRev = asPositiveInt(row.avatar_rev);
  if (avatarRev) card.avatarRev = avatarRev;
  return card;
}

/**
 * Public teacher cards for the consultations carousel, with aggregate and
 * optional per-student ratings.
 */
export async function listPublicTeachersForCarousel(
  viewerUserId: number | null,
  deps: StoreDeps = { getConnection: loadDefaultConnection },
): Promise<TeacherCarouselItem[]> {
  await ensureAuthSchema(deps);
  await ensureTeacherProfileSchema(deps.getConnection);
  await ensureTeacherRatingsSchema(deps.getConnection);

  const connection = await deps.getConnection();
  try {
    const viewerId = viewerUserId && viewerUserId > 0 ? viewerUserId : 0;
    const rows = await connection.query<ListRow>(SQL_LIST_PUBLIC, [viewerId]);
    return rows.map(mapRow);
  } finally {
    connection.release();
  }
}
