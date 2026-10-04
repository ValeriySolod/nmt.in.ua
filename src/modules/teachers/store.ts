import "server-only";

import type { SqlConnection } from "@/lib/db/mysql";
import { ensureAuthSchema } from "@/modules/auth/users";
import type { UserRole } from "@/modules/auth/types";
import { ensureTeacherProfileSchema } from "./schema";
import {
  canEditTeacherProfile,
  emptyTeacherProfile,
  LESSON_CURRENCIES,
  TEACHER_LEVELS,
  TEACHING_LANGUAGES,
  type LessonCurrency,
  type PublicTeacherCard,
  type TeacherLevel,
  type TeacherModerationStatus,
  type TeacherProfile,
  type TeachingLanguage,
} from "./types";
import type { ValidatedTeacherProfile } from "./validateProfile";

type TeacherProfileRow = {
  user_id: number;
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
  lesson_duration_minutes: number | string | null;
  join_motivation: string | null;
  moderation_status: TeacherModerationStatus;
  submitted_at: Date | null;
  reviewed_at: Date | null;
  reviewed_by: number | string | null;
  rejection_reason: string | null;
  is_public: number | boolean;
};

type PublicTeacherRow = {
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
};

type SlugOwnerRow = {
  user_id: number;
};

const SQL_GET_OWN = `
  SELECT
    user_id,
    slug,
    headline,
    bio,
    experience,
    publications,
    city,
    country,
    subjects,
    teaching_levels,
    teaching_languages,
    contact_url,
    phone,
    lesson_price,
    lesson_currency,
    lesson_duration_minutes,
    join_motivation,
    moderation_status,
    submitted_at,
    reviewed_at,
    reviewed_by,
    rejection_reason,
    is_public
  FROM teacher_profiles
  WHERE user_id = ?
  LIMIT 1
`;

const SQL_GET_PUBLIC = `
  SELECT
    p.user_id,
    p.slug,
    p.headline,
    p.bio,
    p.experience,
    p.publications,
    p.city,
    p.subjects,
    p.contact_url,
    p.is_public,
    u.display_name,
    u.login,
    u.role,
    UNIX_TIMESTAMP(a.updated_at) AS avatar_rev
  FROM teacher_profiles p
  INNER JOIN app_users u ON u.id = p.user_id
  LEFT JOIN user_avatars a ON a.user_id = u.id
  WHERE p.slug = ?
    AND p.is_public = 1
    AND p.moderation_status = 'approved'
    AND u.role = 'teacher'
  LIMIT 1
`;

const SQL_SLUG_OWNER = `
  SELECT user_id
  FROM teacher_profiles
  WHERE slug = ?
  LIMIT 1
`;

const SQL_UPSERT = `
  INSERT INTO teacher_profiles (
    user_id,
    slug,
    headline,
    bio,
    experience,
    publications,
    city,
    country,
    subjects,
    teaching_levels,
    teaching_languages,
    contact_url,
    phone,
    lesson_price,
    lesson_currency,
    lesson_duration_minutes,
    join_motivation
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON DUPLICATE KEY UPDATE
    slug = VALUES(slug),
    headline = VALUES(headline),
    bio = VALUES(bio),
    experience = VALUES(experience),
    publications = VALUES(publications),
    city = VALUES(city),
    country = VALUES(country),
    subjects = VALUES(subjects),
    teaching_levels = VALUES(teaching_levels),
    teaching_languages = VALUES(teaching_languages),
    contact_url = VALUES(contact_url),
    phone = VALUES(phone),
    lesson_price = VALUES(lesson_price),
    lesson_currency = VALUES(lesson_currency),
    lesson_duration_minutes = VALUES(lesson_duration_minutes),
    join_motivation = VALUES(join_motivation)
`;

const SQL_SUBMIT_FOR_MODERATION = `
  UPDATE teacher_profiles
  SET
    moderation_status = 'pending',
    submitted_at = CURRENT_TIMESTAMP,
    reviewed_at = NULL,
    reviewed_by = NULL,
    rejection_reason = NULL,
    is_public = 0
  WHERE user_id = ?
    AND moderation_status IN ('draft', 'rejected')
`;

export class TeacherProfileError extends Error {
  constructor(
    readonly code:
      | "slugTaken"
      | "forbidden"
      | "notFound"
      | "invalidModerationStatus"
      | "serverError",
  ) {
    super(code);
    this.name = "TeacherProfileError";
  }
}

async function loadDefaultConnection(): Promise<SqlConnection> {
  const { getConnection } = await import("@/lib/db/mysql");
  return getConnection();
}

type StoreDeps = {
  getConnection: () => Promise<SqlConnection>;
};

function parseStringArrayJson(raw: string | null): string[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

function parseTeacherLevels(raw: string | null): TeacherLevel[] {
  return parseStringArrayJson(raw).filter((item): item is TeacherLevel =>
    TEACHER_LEVELS.includes(item as TeacherLevel),
  );
}

function parseTeachingLanguages(raw: string | null): TeachingLanguage[] {
  return parseStringArrayJson(raw).filter((item): item is TeachingLanguage =>
    TEACHING_LANGUAGES.includes(item as TeachingLanguage),
  );
}

function parseLessonCurrency(raw: string | null): LessonCurrency | "" {
  const value = raw?.trim() ?? "";

  return LESSON_CURRENCIES.includes(value as LessonCurrency)
    ? (value as LessonCurrency)
    : "";
}

function asPositiveInt(value: unknown): number | undefined {
  if (value == null || value === "") {
    return undefined;
  }

  const numeric = Number(value);

  if (!Number.isInteger(numeric) || numeric <= 0) {
    return undefined;
  }

  return numeric;
}

function asNullableNumber(value: unknown): number | null {
  if (value == null || value === "") {
    return null;
  }

  const numeric = Number(value);

  return Number.isFinite(numeric) ? numeric : null;
}

function asNullableInt(value: unknown): number | null {
  if (value == null || value === "") {
    return null;
  }

  const numeric = Number(value);

  return Number.isInteger(numeric) ? numeric : null;
}

function mapProfile(row: TeacherProfileRow): TeacherProfile {
  return {
    userId: row.user_id,
    slug: row.slug,
    headline: row.headline?.trim() ?? "",
    bio: row.bio?.trim() ?? "",
    experience: row.experience?.trim() ?? "",
    publications: row.publications?.trim() ?? "",
    city: row.city?.trim() ?? "",
    country: row.country?.trim() ?? "",
    subjects: parseStringArrayJson(row.subjects),
    teachingLevels: parseTeacherLevels(row.teaching_levels),
    teachingLanguages: parseTeachingLanguages(row.teaching_languages),
    contactUrl: row.contact_url?.trim() ?? "",
    phone: row.phone?.trim() ?? "",
    lessonPrice: asNullableNumber(row.lesson_price),
    lessonCurrency: parseLessonCurrency(row.lesson_currency),
    lessonDurationMinutes: asNullableInt(row.lesson_duration_minutes),
    joinMotivation: row.join_motivation?.trim() ?? "",
    moderationStatus: row.moderation_status,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at,
    reviewedBy: asNullableInt(row.reviewed_by),
    rejectionReason: row.rejection_reason?.trim() ?? "",
    isPublic: Boolean(row.is_public),
  };
}

function mapPublicTeacherCard(row: PublicTeacherRow): PublicTeacherCard {
  const card: PublicTeacherCard = {
    userId: row.user_id,
    slug: row.slug,
    headline: row.headline?.trim() ?? "",
    bio: row.bio?.trim() ?? "",
    experience: row.experience?.trim() ?? "",
    publications: row.publications?.trim() ?? "",
    city: row.city?.trim() ?? "",
    subjects: parseStringArrayJson(row.subjects),
    contactUrl: row.contact_url?.trim() ?? "",
    isPublic: Boolean(row.is_public),
    displayName: row.display_name.trim(),
    login: row.login,
    role: row.role,
  };

  const avatarRev = asPositiveInt(row.avatar_rev);

  if (avatarRev) {
    card.avatarRev = avatarRev;
  }

  return card;
}

async function withSchema(deps: StoreDeps): Promise<void> {
  await ensureAuthSchema(deps);
  await ensureTeacherProfileSchema(deps.getConnection);
}

export async function getOwnTeacherProfile(
  userId: number,
  deps: StoreDeps = { getConnection: loadDefaultConnection },
): Promise<TeacherProfile> {
  await withSchema(deps);

  const connection = await deps.getConnection();

  try {
    const rows = await connection.query<TeacherProfileRow>(SQL_GET_OWN, [
      userId,
    ]);

    const row = rows[0];

    return row ? mapProfile(row) : emptyTeacherProfile(userId);
  } finally {
    connection.release();
  }
}

export async function getPublicTeacherCard(
  slug: string,
  deps: StoreDeps = { getConnection: loadDefaultConnection },
): Promise<PublicTeacherCard | null> {
  const normalized = slug.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  await withSchema(deps);

  const connection = await deps.getConnection();

  try {
    const rows = await connection.query<PublicTeacherRow>(SQL_GET_PUBLIC, [
      normalized,
    ]);

    const row = rows[0];

    if (!row) {
      return null;
    }

    return mapPublicTeacherCard(row);
  } finally {
    connection.release();
  }
}

export async function saveTeacherProfile(
  userId: number,
  role: UserRole,
  value: ValidatedTeacherProfile,
  deps: StoreDeps = { getConnection: loadDefaultConnection },
): Promise<TeacherProfile> {
  if (!canEditTeacherProfile(role)) {
    throw new TeacherProfileError("forbidden");
  }

  await withSchema(deps);

  const connection = await deps.getConnection();

  try {
    const owners = await connection.query<SlugOwnerRow>(SQL_SLUG_OWNER, [
      value.slug,
    ]);

    const ownerId = owners[0]?.user_id;

    if (ownerId && ownerId !== userId) {
      throw new TeacherProfileError("slugTaken");
    }

    try {
      await connection.execute(SQL_UPSERT, [
        userId,
        value.slug,
        value.headline || null,
        value.bio || null,
        value.experience || null,
        value.publications || null,
        value.city || null,
        value.country || null,
        value.subjects.length > 0 ? JSON.stringify(value.subjects) : null,
        value.teachingLevels.length > 0
          ? JSON.stringify(value.teachingLevels)
          : null,
        value.teachingLanguages.length > 0
          ? JSON.stringify(value.teachingLanguages)
          : null,
        value.contactUrl || null,
        value.phone || null,
        value.lessonPrice,
        value.lessonCurrency || null,
        value.lessonDurationMinutes,
        value.joinMotivation || null,
      ]);
    } catch (error) {
      const errno =
        error && typeof error === "object" && "errno" in error
          ? Number((error as { errno?: number }).errno)
          : 0;

      if (errno === 1062) {
        throw new TeacherProfileError("slugTaken");
      }

      throw error;
    }

    const rows = await connection.query<TeacherProfileRow>(SQL_GET_OWN, [
      userId,
    ]);

    const saved = rows[0];

    if (!saved) {
      throw new TeacherProfileError("serverError");
    }

    return mapProfile(saved);
  } finally {
    connection.release();
  }
}

export async function submitTeacherProfileForModeration(
  userId: number,
  role: UserRole,
  deps: StoreDeps = { getConnection: loadDefaultConnection },
): Promise<TeacherProfile> {
  if (!canEditTeacherProfile(role)) {
    throw new TeacherProfileError("forbidden");
  }

  await withSchema(deps);

  const connection = await deps.getConnection();

  try {
    const rows = await connection.query<TeacherProfileRow>(SQL_GET_OWN, [
      userId,
    ]);

    const current = rows[0];

    if (!current) {
      throw new TeacherProfileError("notFound");
    }

    if (
      current.moderation_status !== "draft" &&
      current.moderation_status !== "rejected"
    ) {
      throw new TeacherProfileError("invalidModerationStatus");
    }

    await connection.execute(SQL_SUBMIT_FOR_MODERATION, [userId]);

    const updatedRows = await connection.query<TeacherProfileRow>(SQL_GET_OWN, [
      userId,
    ]);

    const updated = updatedRows[0];

    if (!updated) {
      throw new TeacherProfileError("serverError");
    }

    return mapProfile(updated);
  } finally {
    connection.release();
  }
}
