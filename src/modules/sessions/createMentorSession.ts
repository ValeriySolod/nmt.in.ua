import type { SqlConnection } from "@/lib/db/mysql";
import { createMentorSessionSchema } from "@/validations/mentorSessionValidation";
import { validateSchema } from "@/validations/parse";
import {
  SESSION_STATUS_PLANNED,
  SESSION_TYPE_MENTOR,
} from "@/modules/sessions/types";
import { nowUnixSec } from "@/modules/testing/sessionElapsed";
import { computeSessionDeadline, isSessionExpired } from "@/modules/testing/sessionExpiry";
import { TOPIC_TEST_TASK_COUNT } from "@/modules/testing/startTopicTest";

const SQL_THEME_EXISTS = `SELECT id FROM themes WHERE id = ? LIMIT 1`;

const SQL_FIND_PLANNED_MENTOR = `
  SELECT id, expire_time
  FROM task_sessions
  WHERE user_id = ?
    AND theme_id = ?
    AND session_type = ?
    AND session_status = ?
  LIMIT 1
`;

const SQL_INSERT_MENTOR_SESSION = `
  INSERT INTO task_sessions (
    user_id, session_type, theme_id, tasks_number,
    right_number, time, session_status, start_time, expire_time
  ) VALUES (?, ?, ?, ?, 0, 0, ?, 0, ?)
`;

export type CreateMentorSessionInput = {
  userId: number;
  themeId: number;
};

export type CreateMentorSessionResult = {
  sessionId: number;
  created: boolean;
};

export type CreateMentorSessionErrorCode =
  | "invalid_input"
  | "theme_not_found"
  | "db_error";

export class CreateMentorSessionError extends Error {
  constructor(
    message: string,
    public readonly code: CreateMentorSessionErrorCode,
  ) {
    super(message);
    this.name = "CreateMentorSessionError";
  }
}

type CreateMentorSessionDeps = {
  getConnection: () => Promise<SqlConnection>;
  nowSec?: () => number;
};

export function validateCreateMentorSessionInput(
  input: unknown,
): CreateMentorSessionInput {
  const parsed = validateSchema(createMentorSessionSchema, input, {
    abortEarly: true,
    allowUnknown: false,
    stripUnknown: false,
    convert: false,
  });
  if (!parsed.ok) {
    const message =
      parsed.detail.type === "object.base"
        ? "Request body must be a JSON object."
        : "userId and themeId must be positive integers.";
    throw new CreateMentorSessionError(message, "invalid_input");
  }
  return parsed.value;
}

async function loadDefaultConnection(): Promise<SqlConnection> {
  const { getConnection } = await import("@/lib/db/mysql");
  return getConnection();
}

/**
 * Creates a planned mentor session (`session_type = 3`) or returns an
 * existing planned mentor row for the same user and theme.
 */
export async function createMentorSession(
  input: CreateMentorSessionInput,
  deps: CreateMentorSessionDeps = { getConnection: loadDefaultConnection },
): Promise<CreateMentorSessionResult> {
  const connection = await deps.getConnection();
  try {
    const themes = await connection.query<{ id: number }>(SQL_THEME_EXISTS, [
      input.themeId,
    ]);
    if (themes.length === 0) {
      throw new CreateMentorSessionError(
        "Theme not found.",
        "theme_not_found",
      );
    }

    const nowSec = deps.nowSec ?? nowUnixSec;
    const existing = await connection.query<{ id: number; expire_time: number }>(
      SQL_FIND_PLANNED_MENTOR,
      [
        input.userId,
        input.themeId,
        SESSION_TYPE_MENTOR,
        SESSION_STATUS_PLANNED,
      ],
    );
    // An expired planned row is never reused/renewed — fall through and
    // create a fresh one with its own fresh deadline (the stale row just
    // sits there, permanently expired and excluded from reuse/aggregation).
    if (existing[0] && !isSessionExpired(existing[0].expire_time, nowSec())) {
      return { sessionId: existing[0].id, created: false };
    }

    const inserted = await connection.execute(SQL_INSERT_MENTOR_SESSION, [
      input.userId,
      SESSION_TYPE_MENTOR,
      input.themeId,
      TOPIC_TEST_TASK_COUNT,
      SESSION_STATUS_PLANNED,
      computeSessionDeadline(nowSec()),
    ]);

    if (inserted.insertId <= 0) {
      throw new CreateMentorSessionError(
        "Failed to create mentor session.",
        "db_error",
      );
    }

    return { sessionId: inserted.insertId, created: true };
  } catch (error) {
    if (error instanceof CreateMentorSessionError) {
      throw error;
    }
    console.error("createMentorSession: unexpected database error", error);
    throw new CreateMentorSessionError("Database operation failed.", "db_error");
  } finally {
    connection.release();
  }
}
