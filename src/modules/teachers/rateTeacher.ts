import "server-only";

import type { SqlConnection } from "@/lib/db/mysql";
import { ensureAuthSchema } from "@/modules/auth/users";
import { ensureTeacherProfileSchema } from "./schema";
import { ensureTeacherRatingsSchema } from "./ratingsSchema";
import {
  RateTeacherError,
  validateRateTeacherInput,
} from "./rateTeacherValidate";

export {
  RateTeacherError,
  validateRateTeacherInput,
} from "./rateTeacherValidate";
export type { RateTeacherInput } from "./rateTeacherValidate";

export type RateTeacherResult = {
  teacherUserId: number;
  score: number;
  avgRating: number | null;
  ratingCount: number;
};

type StoreDeps = {
  getConnection: () => Promise<SqlConnection>;
};

async function loadDefaultConnection(): Promise<SqlConnection> {
  const { getConnection } = await import("@/lib/db/mysql");
  return getConnection();
}

const SQL_PUBLIC_TEACHER = `
  SELECT p.user_id
  FROM teacher_profiles p
  INNER JOIN app_users u ON u.id = p.user_id
  WHERE p.user_id = ?
    AND p.is_public = 1
    AND u.role IN ('teacher', 'admin')
  LIMIT 1
`;

const SQL_UPSERT = `
  INSERT INTO teacher_ratings (teacher_user_id, student_user_id, score)
  VALUES (?, ?, ?)
  ON DUPLICATE KEY UPDATE score = VALUES(score)
`;

const SQL_AGG = `
  SELECT AVG(score) AS avg_rating, COUNT(*) AS rating_count
  FROM teacher_ratings
  WHERE teacher_user_id = ?
`;

type AggRow = {
  avg_rating: number | string | null;
  rating_count: number | string | null;
};

function asRating(value: unknown): number | null {
  if (value == null || value === "") return null;
  const numeric = typeof value === "bigint" ? Number(value) : Number(value);
  if (!Number.isFinite(numeric)) return null;
  return Math.round(numeric * 10) / 10;
}

function asCount(value: unknown): number {
  if (value == null || value === "") return 0;
  const numeric = typeof value === "bigint" ? Number(value) : Number(value);
  if (!Number.isInteger(numeric) || numeric < 0) return 0;
  return numeric;
}

export async function rateTeacher(
  rawInput: unknown,
  deps: StoreDeps = { getConnection: loadDefaultConnection },
): Promise<RateTeacherResult> {
  const input = validateRateTeacherInput(rawInput);
  await ensureAuthSchema(deps);
  await ensureTeacherProfileSchema(deps.getConnection);
  await ensureTeacherRatingsSchema(deps.getConnection);

  const connection = await deps.getConnection();
  try {
    const found = await connection.query<{ user_id: number }>(
      SQL_PUBLIC_TEACHER,
      [input.teacherUserId],
    );
    if (!found[0]) {
      throw new RateTeacherError("Teacher not found.", "not_found");
    }

    await connection.execute(SQL_UPSERT, [
      input.teacherUserId,
      input.studentUserId,
      input.score,
    ]);

    const agg = await connection.query<AggRow>(SQL_AGG, [input.teacherUserId]);
    const row = agg[0];
    return {
      teacherUserId: input.teacherUserId,
      score: input.score,
      avgRating: asRating(row?.avg_rating),
      ratingCount: asCount(row?.rating_count),
    };
  } catch (error) {
    if (error instanceof RateTeacherError) throw error;
    console.error("rateTeacher: unexpected database error", error);
    throw new RateTeacherError("Database operation failed.", "db_error");
  } finally {
    connection.release();
  }
}
