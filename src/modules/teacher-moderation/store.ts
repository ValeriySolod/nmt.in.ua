import type { SqlConnection } from "@/lib/db/mysql";

import { ensureTeacherProfileSchema } from "@/modules/teachers/schema";
import {
  LESSON_CURRENCIES,
  TEACHER_LEVELS,
  TEACHING_LANGUAGES,
  type LessonCurrency,
  type TeacherLevel,
  type TeachingLanguage,
} from "@/modules/teachers/types";

import type {
  RejectTeacherApplicationInput,
  ReviewTeacherApplicationInput,
  TeacherModerationApplication,
} from "./types";
import { TeacherModerationError } from "./types";

const SQL_LIST_PENDING_APPLICATIONS = `
  SELECT
    p.user_id,
    u.display_name,
    u.email,
    UNIX_TIMESTAMP(a.updated_at) AS avatar_rev,
    p.slug,
    p.headline,
    p.bio,
    p.experience,
    p.publications,
    p.city,
    p.country,
    p.subjects,
    p.teaching_levels,
    p.teaching_languages,
    p.contact_url,
    p.phone,
    p.lesson_price,
    p.lesson_currency,
    p.lesson_duration_minutes,
    p.join_motivation,
    p.moderation_status,
    p.submitted_at,
    p.reviewed_at,
    p.reviewed_by,
    p.rejection_reason
  FROM teacher_profiles p
  INNER JOIN app_users u ON u.id = p.user_id
  LEFT JOIN user_avatars a ON a.user_id = u.id
  WHERE
    p.moderation_status = 'pending'
    AND u.role = 'teacher'
  ORDER BY p.submitted_at ASC, p.user_id ASC
`;

const SQL_APPROVE_APPLICATION = `
  UPDATE teacher_profiles
  SET
    moderation_status = 'approved',
    is_public = 1,
    reviewed_at = CURRENT_TIMESTAMP,
    reviewed_by = ?,
    rejection_reason = NULL
  WHERE user_id = ?
    AND moderation_status = 'pending'
`;

const SQL_REJECT_APPLICATION = `
  UPDATE teacher_profiles
  SET
    moderation_status = 'rejected',
    is_public = 0,
    reviewed_at = CURRENT_TIMESTAMP,
    reviewed_by = ?,
    rejection_reason = ?
  WHERE user_id = ?
    AND moderation_status = 'pending'
`;

type TeacherModerationApplicationRow = {
  user_id: number;
  display_name: string;
  email: string | null;

  avatar_rev: number | string | null;
  slug: string;
  headline: string | null;
  bio: string | null;
  experience: string | null;
  publications: string | null;
  city: string | null;
  country: string | null;
  subjects: string | null;
  teaching_levels: string | null;
  teaching_languages: string | null;
  contact_url: string | null;
  phone: string | null;
  lesson_price: number | string | null;
  lesson_currency: string | null;
  lesson_duration_minutes: number | null;
  join_motivation: string | null;

  moderation_status: "draft" | "pending" | "approved" | "rejected";
  submitted_at: Date | string | null;
  reviewed_at: Date | string | null;
  reviewed_by: number | null;
  rejection_reason: string | null;
};

function formatTimestamp(
  value: Date | string | null | undefined,
): string | null {
  if (value == null) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function parseStringArray(raw: string | null): string[] {
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

function parseTeacherLevels(raw: string | null): TeacherLevel[] {
  return parseStringArray(raw).filter((item): item is TeacherLevel =>
    TEACHER_LEVELS.includes(item as TeacherLevel),
  );
}

function parseTeachingLanguages(raw: string | null): TeachingLanguage[] {
  return parseStringArray(raw).filter((item): item is TeachingLanguage =>
    TEACHING_LANGUAGES.includes(item as TeachingLanguage),
  );
}

function parseLessonCurrency(raw: string | null): LessonCurrency | "" {
  const value = raw?.trim() ?? "";

  return LESSON_CURRENCIES.includes(value as LessonCurrency)
    ? (value as LessonCurrency)
    : "";
}

function parseAvatarRev(value: unknown): number | undefined {
  if (value == null || value === "") return undefined;

  const numeric = Number(value);

  return Number.isInteger(numeric) && numeric > 0 ? numeric : undefined;
}

function mapApplication(
  row: TeacherModerationApplicationRow,
): TeacherModerationApplication {
  return {
    userId: row.user_id,

    displayName: row.display_name.trim(),
    email: row.email?.trim() || null,

    avatarRev: parseAvatarRev(row.avatar_rev),
    slug: row.slug.trim(),
    headline: row.headline?.trim() ?? "",
    bio: row.bio?.trim() ?? "",
    experience: row.experience?.trim() ?? "",
    publications: row.publications?.trim() ?? "",
    city: row.city?.trim() ?? "",
    country: row.country?.trim() ?? "",
    subjects: parseStringArray(row.subjects),
    teachingLevels: parseTeacherLevels(row.teaching_levels),
    teachingLanguages: parseTeachingLanguages(row.teaching_languages),
    contactUrl: row.contact_url?.trim() ?? "",
    phone: row.phone?.trim() ?? "",
    lessonPrice: row.lesson_price == null ? null : Number(row.lesson_price),
    lessonCurrency: parseLessonCurrency(row.lesson_currency),
    lessonDurationMinutes: row.lesson_duration_minutes,
    joinMotivation: row.join_motivation?.trim() ?? "",

    moderationStatus: row.moderation_status,
    submittedAt: formatTimestamp(row.submitted_at),
    reviewedAt: formatTimestamp(row.reviewed_at),
    reviewedBy: row.reviewed_by,
    rejectionReason: row.rejection_reason?.trim() ?? "",
  };
}

async function loadDefaultConnection(): Promise<SqlConnection> {
  const { getConnection } = await import("@/lib/db/mysql");
  return getConnection();
}

type StoreDeps = {
  getConnection: () => Promise<SqlConnection>;
};

export async function getPendingTeacherApplications(
  deps: StoreDeps = { getConnection: loadDefaultConnection },
): Promise<TeacherModerationApplication[]> {
  await ensureTeacherProfileSchema(deps.getConnection);

  const connection = await deps.getConnection();

  try {
    const rows = await connection.query<TeacherModerationApplicationRow>(
      SQL_LIST_PENDING_APPLICATIONS,
      [],
    );

    return rows.map(mapApplication);
  } catch (error) {
    console.error(
      "getPendingTeacherApplications: unexpected database error",
      error,
    );

    throw new TeacherModerationError("Database operation failed.", "db_error");
  } finally {
    connection.release();
  }
}

function assertValidReviewIds(
  reviewerUserId: number,
  teacherUserId: number,
): void {
  if (
    !Number.isInteger(reviewerUserId) ||
    reviewerUserId <= 0 ||
    !Number.isInteger(teacherUserId) ||
    teacherUserId <= 0
  ) {
    throw new TeacherModerationError("Invalid user id.", "invalid_input");
  }
}

export async function approveTeacherApplication(
  input: ReviewTeacherApplicationInput,
  deps: StoreDeps = { getConnection: loadDefaultConnection },
): Promise<void> {
  assertValidReviewIds(input.reviewerUserId, input.teacherUserId);

  await ensureTeacherProfileSchema(deps.getConnection);

  const connection = await deps.getConnection();

  try {
    const result = await connection.execute(SQL_APPROVE_APPLICATION, [
      input.reviewerUserId,
      input.teacherUserId,
    ]);

    if (result.affectedRows !== 1) {
      throw new TeacherModerationError(
        "Teacher application was not found or is not pending.",
        "invalid_status",
      );
    }
  } catch (error) {
    if (error instanceof TeacherModerationError) {
      throw error;
    }

    console.error(
      "approveTeacherApplication: unexpected database error",
      error,
    );

    throw new TeacherModerationError("Database operation failed.", "db_error");
  } finally {
    connection.release();
  }
}

export async function rejectTeacherApplication(
  input: RejectTeacherApplicationInput,
  deps: StoreDeps = { getConnection: loadDefaultConnection },
): Promise<void> {
  assertValidReviewIds(input.reviewerUserId, input.teacherUserId);

  const rejectionReason = input.rejectionReason.trim();

  if (!rejectionReason || rejectionReason.length > 1000) {
    throw new TeacherModerationError(
      "Rejection reason must contain between 1 and 1000 characters.",
      "invalid_rejection_reason",
    );
  }

  await ensureTeacherProfileSchema(deps.getConnection);

  const connection = await deps.getConnection();

  try {
    const result = await connection.execute(SQL_REJECT_APPLICATION, [
      input.reviewerUserId,
      rejectionReason,
      input.teacherUserId,
    ]);

    if (result.affectedRows !== 1) {
      throw new TeacherModerationError(
        "Teacher application was not found or is not pending.",
        "invalid_status",
      );
    }
  } catch (error) {
    if (error instanceof TeacherModerationError) {
      throw error;
    }

    console.error("rejectTeacherApplication: unexpected database error", error);

    throw new TeacherModerationError("Database operation failed.", "db_error");
  } finally {
    connection.release();
  }
}
