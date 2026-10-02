import "server-only";

import type { SqlConnection } from "@/lib/db/mysql";
import { ensureAuthSchema } from "@/modules/auth/users";
import type { UserRole } from "@/modules/auth/types";
import { ensureTeacherStudentsSchema } from "@/modules/teacher-students/schema";
import { ensureTeacherProfileSchema } from "./schema";
import type { TeacherLandingCard } from "./types";

export type { TeacherLandingCard };

type ListRow = {
  user_id: number;
  slug: string;
  headline: string | null;
  bio: string | null;
  experience: string | null;
  publications: string | null;
  city: string | null;
  subjects: string | null;
  contact_url: string | null;
  is_public: number | boolean;
  display_name: string;
  login: string;
  role: UserRole;
  avatar_rev?: number | string | null;
  student_count?: number | string | null;
};

const SQL_LIST_LANDING = `
  SELECT p.user_id, p.slug, p.headline, p.bio, p.experience, p.publications,
         p.city, p.subjects, p.contact_url, p.is_public,
         u.display_name, u.login, u.role,
         UNIX_TIMESTAMP(a.updated_at) AS avatar_rev,
         COALESCE(sc.student_count, 0) AS student_count
  FROM teacher_profiles p
  INNER JOIN app_users u ON u.id = p.user_id
  LEFT JOIN user_avatars a ON a.user_id = u.id
  LEFT JOIN (
    SELECT teacher_user_id, COUNT(*) AS student_count
    FROM teacher_students
    GROUP BY teacher_user_id
  ) sc ON sc.teacher_user_id = p.user_id
  WHERE p.is_public = 1
    AND u.role IN ('teacher', 'admin')
  ORDER BY u.display_name ASC
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

function asCount(value: unknown): number {
  if (value == null || value === "") return 0;
  const numeric = typeof value === "bigint" ? Number(value) : Number(value);
  if (!Number.isInteger(numeric) || numeric < 0) return 0;
  return numeric;
}

function mapRow(row: ListRow): TeacherLandingCard {
  const card: TeacherLandingCard = {
    userId: row.user_id,
    slug: row.slug,
    headline: row.headline?.trim() ?? "",
    bio: row.bio?.trim() ?? "",
    experience: row.experience?.trim() ?? "",
    publications: row.publications?.trim() ?? "",
    city: row.city?.trim() ?? "",
    subjects: parseSubjectsJson(row.subjects),
    contactUrl: row.contact_url?.trim() ?? "",
    isPublic: Boolean(row.is_public),
    displayName: row.display_name.trim(),
    login: row.login,
    role: row.role,
    studentCount: asCount(row.student_count),
  };
  const avatarRev = asPositiveInt(row.avatar_rev);
  if (avatarRev) card.avatarRev = avatarRev;
  return card;
}

/**
 * Public teacher cards for the welcome landing swiper, with linked student counts.
 */
export async function listPublicTeachersForLanding(
  deps: StoreDeps = { getConnection: loadDefaultConnection },
): Promise<TeacherLandingCard[]> {
  await ensureAuthSchema(deps);
  await ensureTeacherProfileSchema(deps.getConnection);
  await ensureTeacherStudentsSchema(deps.getConnection);

  const connection = await deps.getConnection();
  try {
    const rows = await connection.query<ListRow>(SQL_LIST_LANDING, []);
    return rows.map(mapRow);
  } finally {
    connection.release();
  }
}
